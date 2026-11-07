import { GameError } from './hero-progression.mjs';
import { assembleHeroAttributes } from './attribute-service.mjs';
import { readHeroRentTables } from '../config/hero-rent-tables.mjs';

// HERO-HERO rent/share cluster: 627 req_rent_out_hero, 628 req_rent_out_off_hero,
// 629 req_rent_in_hero, 630 req_query_rent_out_info, 631 req_rent_flush and
// 634 req_query_share_data.
//
// Every branch below reads the authoritative state of the current role from the
// archive. The rent search/compare systems of the shipped client ask the server
// for OTHER roles' rent-out and share data; a single-role deployment has no such
// source, so those branches answer with an explicit business code and the gap is
// recorded in agent/workflow/gameplay-completion/HERO-HERO-B/rent-share.md
// instead of inventing players or whole-server numbers.
const COMMAND_RENT_OUT = 627;
const COMMAND_RENT_OUT_OFF = 628;
const COMMAND_RENT_IN = 629;
const COMMAND_QUERY_RENT_OUT = 630;
const COMMAND_RENT_FLUSH = 631;
const COMMAND_QUERY_SHARE = 634;
const SUPPORTED = [COMMAND_RENT_OUT, COMMAND_RENT_OUT_OFF, COMMAND_RENT_IN, COMMAND_QUERY_RENT_OUT, COMMAND_RENT_FLUSH, COMMAND_QUERY_SHARE];

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_LOCKED = 305;
const CODE_CONTENT = 3001;
const OUT_TABLE = 'hero_rent_out_state';
const SHARE_TABLE = 'hero_share_cache';
const MAX_UINT32 = 0xffffffff;
// FlushTime day boundary is 05:00 Asia/Shanghai on the local server.
const RESET_OFFSET_SECONDS = 10800;
const DAY_SECONDS = 86400;

const fail = (code, message) => { throw new GameError(code, message); };

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS ' + OUT_TABLE + ' ('
    + 'role_id TEXT NOT NULL,'
    + 'rent_tid INTEGER NOT NULL,'
    + 'payload TEXT NOT NULL,'
    + 'valid_time INTEGER NOT NULL,'
    + 'updated_at TEXT NOT NULL,'
    + 'PRIMARY KEY(role_id, rent_tid))');
  db.exec('CREATE TABLE IF NOT EXISTS ' + SHARE_TABLE + ' ('
    + 'role_id TEXT NOT NULL,'
    + 'hero_uid TEXT NOT NULL,'
    + 'share_tid INTEGER NOT NULL,'
    + 'payload TEXT NOT NULL,'
    + 'updated_at TEXT NOT NULL,'
    + 'PRIMARY KEY(role_id, hero_uid, share_tid))');
}

function positiveInt(value, field, max = MAX_UINT32) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > max) fail(CODE_INVALID, 'Invalid hero ' + field);
  return number;
}

function uidString(value, field) {
  const text = value === undefined || value === null ? '' : String(value);
  if (!/^[0-9]{1,20}$/.test(text)) fail(CODE_INVALID, 'Invalid hero ' + field);
  return text;
}

function dayIndex(seconds) {
  return Math.floor((seconds + RESET_OFFSET_SECONDS) / DAY_SECONDS);
}

export function createHeroRentService({ store, codec, tables, heroTables, now = () => Date.now(), logger = () => {} }) {
  void tables;
  const log = event => { try { logger(event); } catch {} };
  const rentTables = readHeroRentTables();
  if (!rentTables.Rent?.size) throw new Error('Hero rent configuration is missing');
  store.inspect(db => ensureTables(db));

  const cellLimit = Math.max(1, Number(rentTables.Cell?.size ?? 0) || 6);
  const rentTids = [...rentTables.Rent.keys()].map(Number);

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(CODE_STATE, 'Hero rent clock is invalid');
    return value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  function rentConfig(rentTid) {
    const config = rentTables.Rent.get(Number(rentTid));
    if (!config) fail(CODE_CONTENT, 'Hero rent activity does not exist');
    return config;
  }

  function ownedHero(model, uid) {
    const hero = (model.heroInfo.hero_list ?? []).find(row => String(row.uid) === uid);
    if (!hero) fail(CODE_CONTENT, 'Hero does not exist');
    return hero;
  }

  function roleKey(model) {
    return String(model.state.roleId);
  }

  function readOutState(model, db, rentTid) {
    const row = db.prepare('SELECT payload,valid_time FROM ' + OUT_TABLE + ' WHERE role_id=? AND rent_tid=?').get(roleKey(model), Number(rentTid));
    if (!row) return { rent_tid: Number(rentTid), rent_out_hero_list: [], valid_time: 0, take_off_list: [] };
    const parsed = JSON.parse(row.payload);
    return {
      rent_tid: Number(parsed.rent_tid ?? rentTid),
      rent_out_hero_list: Array.isArray(parsed.rent_out_hero_list) ? parsed.rent_out_hero_list : [],
      valid_time: Number(row.valid_time ?? 0),
      take_off_list: Array.isArray(parsed.take_off_list) ? parsed.take_off_list : []
    };
  }

  function writeOutState(model, db, state) {
    db.prepare('INSERT INTO ' + OUT_TABLE + '(role_id,rent_tid,payload,valid_time,updated_at) VALUES(?,?,?,?,?) '
      + 'ON CONFLICT(role_id,rent_tid) DO UPDATE SET payload=excluded.payload,valid_time=excluded.valid_time,updated_at=excluded.updated_at')
      .run(roleKey(model), Number(state.rent_tid), JSON.stringify({
        rent_tid: Number(state.rent_tid),
        rent_out_hero_list: state.rent_out_hero_list,
        take_off_list: state.take_off_list
      }), Number(state.valid_time ?? 0), new Date(currentSeconds() * 1000).toISOString());
  }

  function heroSnapshot(hero) {
    let power = 0;
    try {
      power = Number(assembleHeroAttributes({ hero, heroTables }).power ?? 0);
    } catch (error) {
      // The compatibility power rule is a local convenience number; a hero whose
      // attribute configuration is incomplete still lists with power 0.
      log({ event: 'hero_rent_power_unavailable', heroUid: String(hero.uid), message: error?.message });
    }
    return {
      tid: String(hero.tid),
      uid: String(hero.uid),
      count: Number(hero.count ?? 1),
      level: Number(hero.level ?? 1),
      star: Number(hero.star ?? 1),
      source: Number(hero.source ?? 0),
      breakthrough_level: Number(hero.breakthrough_level ?? 0),
      quality: Number(hero.quality ?? 0),
      star_progress: Number(hero.star_progress ?? 0),
      relic: (hero.relic ?? []).map(Number),
      pendant_select_list: (hero.pendant_select_list ?? []).map(entry => ({ index: Number(entry.index ?? 0), pendant_tid: String(entry.pendant_tid ?? 0) })),
      ...(hero.reforge ? { reforge: { attr_list: hero.reforge.attr_list ?? [], random_attr_list: hero.reforge.random_attr_list ?? [] } } : {}),
      power
    };
  }

  function rentOut(input) {
    const rentTid = positiveInt(input?.rent_tid, 'rent tid');
    const uids = Array.isArray(input?.hero_uid_list) ? input.hero_uid_list.map(value => uidString(value, 'uid')) : [];
    const indexes = Array.isArray(input?.hero_index_list) ? input.hero_index_list.map(value => Number(value)) : [];
    if (!uids.length) fail(CODE_INVALID, 'At least one hero is required');
    if (uids.length !== indexes.length) fail(CODE_INVALID, 'Hero and index lists must match');
    if (new Set(uids).size !== uids.length) fail(CODE_INVALID, 'Duplicate hero in rent request');
    for (const index of indexes) {
      if (!Number.isSafeInteger(index) || index < 1 || index > cellLimit) fail(CODE_INVALID, 'Invalid hero rent index');
    }
    return store.transaction((model, db) => {
      const config = rentConfig(rentTid);
      const at = currentSeconds();
      const state = readOutState(model, db, rentTid);
      // An expired listing is not rentable state any more; drop it before the
      // duplicate/limit checks so the operator sees the same view as the client.
      if (state.valid_time && dayIndex(state.valid_time) < dayIndex(at)) state.rent_out_hero_list = [];
      const taken = new Set(state.rent_out_hero_list.map(entry => String(entry.hero_uid)));
      const minStar = Number(config.min_star ?? 0), minLevel = Number(config.min_lv ?? 0);
      const maxOut = Math.max(0, Number(config.max_rent_out_num ?? 0));
      if (maxOut > 0 && state.rent_out_hero_list.length + uids.length > maxOut) fail(CODE_LOCKED, 'Hero rent-out limit reached');
      const added = [];
      for (let offset = 0; offset < uids.length; offset++) {
        const uid = uids[offset], hero = ownedHero(model, uid);
        if (taken.has(uid)) fail(CODE_STATE, 'Hero is already offered for rent');
        if (Number(hero.star ?? 1) < minStar) fail(CODE_LOCKED, 'Hero star is too low to rent out');
        if (Number(hero.level ?? 1) < minLevel) fail(CODE_LOCKED, 'Hero level is too low to rent out');
        const snapshot = heroSnapshot(hero);
        added.push({
          hero_uid: Number(uid),
          hero: snapshot,
          power: snapshot.power,
          rent_list: [],
          submit_time: at,
          index: indexes[offset],
          owner_id: Number(roleKey(model))
        });
        taken.add(uid);
      }
      // Rent.cache_flush_time is the only shipped duration for a listing; the
      // listing window is inferred from it and recorded as an inference.
      const window = Math.max(0, Number(config.cache_flush_time ?? 0)) * 60;
      state.rent_out_hero_list = [...state.rent_out_hero_list, ...added];
      state.valid_time = window > 0 ? at + window : 0;
      state.take_off_list = [];
      writeOutState(model, db, state);
      const value = {
        rent_out_one: { rent_tid: rentTid, rent_out_hero_list: state.rent_out_hero_list, valid_time: state.valid_time, take_off_list: [] },
        res: { changes: [], is_overflow: false },
        to_client: Buffer.alloc(0)
      };
      const data = codec.pack('pb_req_rent_out_back', value);
      log({ event: 'hero_rent_out_committed', rentTid, heroes: added.map(entry => String(entry.hero_uid)), listed: state.rent_out_hero_list.length });
      return { schema: 'pb_req_rent_out_back', value, data, valueForLog: { rentTid, listed: state.rent_out_hero_list.length } };
    });
  }

  function rentOutOff(input) {
    const requested = input?.rent_tid === undefined || input?.rent_tid === null ? null : Number(input.rent_tid);
    return store.transaction((model, db) => {
      const targets = requested ? [rentConfig(requested).tid] : rentTids;
      const removed = [];
      let lastTid = requested ?? targets[0] ?? 0;
      for (const rentTid of targets) {
        const state = readOutState(model, db, rentTid);
        if (!state.rent_out_hero_list.length) continue;
        for (const entry of state.rent_out_hero_list) removed.push({ uid: Number(entry.hero_uid), rent_list: (entry.rent_list ?? []).map(Number) });
        state.rent_out_hero_list = [];
        state.valid_time = 0;
        state.take_off_list = removed;
        writeOutState(model, db, state);
        lastTid = rentTid;
      }
      if (!removed.length) fail(CODE_STATE, 'No hero is offered for rent');
      const value = {
        rent_out_one: { rent_tid: lastTid, rent_out_hero_list: [], valid_time: 0, take_off_list: removed },
        res: { changes: [], is_overflow: false },
        to_client: Buffer.alloc(0)
      };
      const data = codec.pack('pb_req_rent_out_back', value);
      log({ event: 'hero_rent_out_off_committed', rentTid: lastTid, heroes: removed.map(entry => String(entry.uid)) });
      return { schema: 'pb_req_rent_out_back', value, data, valueForLog: { rentTid: lastTid, removed: removed.length } };
    });
  }

  function rentIn(input) {
    const rentTid = positiveInt(input?.rent_tid, 'rent tid');
    const requests = Array.isArray(input?.rent_req_list) ? input.rent_req_list : [];
    const clearCurrent = Boolean(input?.is_clear_cur);
    return store.transaction(model => {
      rentConfig(rentTid);
      const ownRole = roleKey(model);
      const foreign = requests.some(entry => String(entry?.dest_role_id ?? '') !== ownRole);
      if (foreign) {
        // Renting in needs another role's published rent-out list. The local
        // server has a single archive, so the requested player/hero does not
        // exist here; answer with the content code instead of a fabricated list.
        fail(CODE_CONTENT, 'Rent-in source player is unavailable on this single-role server');
      }
      if (requests.length) fail(CODE_CONTENT, 'Hero is not offered for rent by this role');
      if (!clearCurrent) fail(CODE_STATE, 'Rent-in request is empty');
      const value = {
        rent_data: { rent_tid: rentTid, rent_hero_list: [], valid_time: 0 },
        res: { changes: [], is_overflow: false },
        to_client: Buffer.alloc(0)
      };
      const data = codec.pack('pb_req_rent_back', value);
      log({ event: 'hero_rent_in_cleared', rentTid });
      return { schema: 'pb_req_rent_back', value, data, valueForLog: { rentTid, cleared: true } };
    });
  }

  function requestedRoleIds(input) {
    const raw = input?.value ?? input;
    const values = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
    return values.map(value => String(value)).filter(text => /^[0-9]{1,20}$/.test(text));
  }

  function rentOutPayload(state) {
    return { rent_tid: state.rent_tid, rent_out_hero_list: state.rent_out_hero_list, valid_time: state.valid_time, take_off_list: state.take_off_list ?? [] };
  }

  function queryRentOut(input) {
    const wanted = requestedRoleIds(input);
    return store.transaction((model, db) => {
      const ownRole = roleKey(model);
      const targets = wanted.length ? wanted.filter(id => id === ownRole) : [ownRole];
      if (!targets.length) fail(CODE_CONTENT, 'Rent-out information of another player is unavailable on this single-role server');
      const list = [];
      for (const rentTid of rentTids) {
        const state = readOutState(model, db, rentTid);
        if (!state.rent_out_hero_list.length) continue;
        list.push({ role_id: Number(ownRole), rent_out: rentOutPayload(state) });
      }
      if (!list.length) fail(CODE_STATE, 'This role has no hero offered for rent');
      const value = { role_rent_out_list: list };
      const data = codec.pack('pb_req_query_rent_hero_ret', value);
      log({ event: 'hero_rent_query_committed', roles: list.length });
      return { schema: 'pb_req_query_rent_hero_ret', value, data, valueForLog: { roles: list.length } };
    });
  }

  function flushRent() {
    return store.transaction((model, db) => {
      const rentTid = rentTids[0] ?? 0;
      rentConfig(rentTid);
      const at = currentSeconds();
      const state = readOutState(model, db, rentTid);
      const rentOutOne = rentOutPayload(state);
      // The rent-in side is empty until a second role exists on this server;
      // the refresh only re-reads the authoritative local listing.
      const value = { rent_in_one: { rent_tid: rentTid, rent_hero_list: [], valid_time: 0 }, rent_out_one: rentOutOne };
      const data = codec.pack('pb_rent_flush_ret', value);
      log({ event: 'hero_rent_flush_committed', rentTid, listed: rentOutOne.rent_out_hero_list.length, at });
      return { schema: 'pb_rent_flush_ret', value, data, valueForLog: { rentTid, listed: rentOutOne.rent_out_hero_list.length } };
    });
  }

  function queryShare(input) {
    const requests = Array.isArray(input?.req_list) ? input.req_list : [];
    if (!requests.length) fail(CODE_INVALID, 'Hero share request is empty');
    return store.transaction((model, db) => {
      const ownRole = roleKey(model);
      const backList = [];
      let unavailable = 0;
      for (const request of requests) {
        const roleId = String(request?.role_id ?? '');
        const shareTid = Number(request?.share_tid ?? 0);
        const uids = (Array.isArray(request?.uid_list) ? request.uid_list : []).map(value => String(value));
        if (roleId !== ownRole) { unavailable += 1; continue; }
        const rows = db.prepare('SELECT hero_uid,payload FROM ' + SHARE_TABLE + ' WHERE role_id=? AND share_tid=?').all(ownRole, shareTid);
        const wanted = new Set(uids);
        const heroShareList = [];
        for (const row of rows) {
          if (wanted.size && !wanted.has(String(row.hero_uid))) continue;
          try {
            heroShareList.push(codec.unpack('pb_hero_share_info', Buffer.from(row.payload, 'base64')));
          } catch (error) {
            log({ event: 'hero_share_cache_unreadable', heroUid: String(row.hero_uid), message: error?.message });
          }
        }
        backList.push({ role_id: Number(roleId), hero_share_list: heroShareList });
      }
      if (!backList.length) fail(CODE_CONTENT, 'Hero share data of another player is unavailable on this single-role server');
      const value = { req_back_list: backList };
      const data = codec.pack('pb_hero_share_req_back', value);
      log({ event: 'hero_share_query_committed', entries: backList.length, unavailable });
      return { schema: 'pb_hero_share_req_back', value, data, valueForLog: { entries: backList.length, unavailable } };
    });
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    async decode(type, raw, helpers) {
      const command = Number(type);
      if (command === COMMAND_RENT_OUT) return helpers.unpack('pb_req_rent_out', raw);
      if (command === COMMAND_RENT_IN) return helpers.unpack('pb_req_rent', raw);
      if (command === COMMAND_QUERY_SHARE) return helpers.unpack('pb_hero_share_req', raw);
      if (command === COMMAND_RENT_OUT_OFF) return raw?.length ? { value: await helpers.etf(raw) } : {};
      if (command === COMMAND_QUERY_RENT_OUT || command === COMMAND_RENT_FLUSH) {
        return { value: raw?.length ? await helpers.etf(raw) : undefined };
      }
      return fail(CODE_INVALID, 'Invalid hero rent command');
    },
    execute(type, input) {
      switch (Number(type)) {
        case COMMAND_RENT_OUT: return rentOut(input);
        case COMMAND_RENT_OUT_OFF: return rentOutOff(input);
        case COMMAND_RENT_IN: return rentIn(input);
        case COMMAND_QUERY_RENT_OUT: return queryRentOut(input);
        case COMMAND_RENT_FLUSH: return flushRent();
        case COMMAND_QUERY_SHARE: return queryShare(input);
        default: return fail(CODE_INVALID, 'Invalid hero rent command');
      }
    }
  };
}

