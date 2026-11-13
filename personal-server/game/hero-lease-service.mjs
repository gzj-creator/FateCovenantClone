import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { readHeroLeaseTables } from '../config/hero-lease-tables.mjs';

// HeroLeaseCmd 87201-87205. HeroLeaseMgr stores one pb_role_lease_hero per
// HeroLease row in login module 143. The shipped configuration has seven rows;
// func_tid 1 is the active GuildEmployMgr feature and occupies slot zero.
const MODULE_ID = 143;
const GUILD_MODULE_ID = 24;
const ACTIVE_FUNC_TID = 1;
const MAX_UINT32 = 0xffffffff;
const SUPPORTED = Object.freeze([87201, 87202, 87203, 87204, 87205]);
const REQUEST_SCHEMAS = Object.freeze({
  87201: 'pb_lease_hero_place_req',
  87202: 'pb_lease_hero_lease_req',
  87203: 'pb_lease_hero_give_back_req',
  87204: 'pb_lease_hero_take_back_req',
  87205: 'pb_lease_hero_list_req'
});

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_LIMIT = 305;

const fail = (code, message) => { throw new GameError(code, message); };

function uint32(value, label, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > MAX_UINT32 || (!allowZero && number === 0)) {
    fail(CODE_INVALID, `Invalid ${label}`);
  }
  return number;
}

function roleIdNumber(value, label) {
  const text = typeof value === 'bigint' ? value.toString() : String(value ?? '');
  if (!/^[0-9]+$/.test(text)) fail(CODE_INVALID, `Invalid ${label}`);
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function normalizedState(value, funcTid) {
  return {
    func_tid: funcTid,
    lease_heroes: Array.isArray(value?.lease_heroes) ? value.lease_heroes : [],
    place_heroes: Array.isArray(value?.place_heroes) ? value.place_heroes : [],
    stamp: Number(value?.stamp ?? 0),
    total_lease_times: Number(value?.total_lease_times ?? 0),
    lease_award_times: Number(value?.lease_award_times ?? 0),
    last_lease_uid: Number(value?.last_lease_uid ?? 0)
  };
}

function emptyState(funcTid) {
  return normalizedState(null, funcTid);
}

function moduleOf(model) {
  const module = new Map(model.state.modules.value).get(MODULE_ID);
  if (!module || !Array.isArray(module.value)) fail(CODE_STATE, 'Hero lease login module is missing');
  return module;
}

function readGuildScope(model, codec) {
  const module = new Map(model.state.modules.value).get(GUILD_MODULE_ID);
  if (!module) fail(CODE_STATE, 'Guild login data is missing');
  let login;
  try { login = codec.unpack('pb_res_guild_login', rawBinary(module)); }
  catch { fail(CODE_STATE, 'Guild login data is invalid'); }
  const guildId = String(login?.guildId ?? '0');
  if (!/^[0-9]+$/.test(guildId) || guildId === '0' || !login?.guild) fail(CODE_STATE, 'Current role is not in a guild');
  const roleId = String(model.state.roleId);
  const member = (login.guild.member_list ?? []).find(entry => String(entry.role_id) === roleId);
  if (!member) fail(CODE_STATE, 'Current role is not a guild member');
  return { guildId, guild: login.guild, login, member };
}

function activeHero(model, heroTid) {
  const hero = (model.heroInfo.hero_list ?? []).find(entry => Number(entry.tid) === Number(heroTid));
  if (!hero) fail(CODE_STATE, 'Hero does not exist');
  return hero;
}

function optionalUint32(value) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number > 0 && number <= MAX_UINT32 ? number : 0;
}

function heroSnapshot(ownerId, hero) {
  const heroTid = uint32(hero.tid, 'hero tid');
  return {
    lease_tid: ACTIVE_FUNC_TID,
    owner_id: ownerId,
    hero_tid: heroTid,
    star: optionalUint32(hero.star),
    quality: optionalUint32(hero.quality),
    skin_tid: optionalUint32(hero.skin_tid),
    // Hero uid is int64 while pb_lease_hero.uid is uint32. This realm uses one
    // instance per hero tid, so the configured hero tid is the stable snapshot id.
    uid: heroTid,
    level: optionalUint32(hero.level),
    mutant: optionalUint32(hero.mutant),
    mastery_level: optionalUint32(hero.mastery_level),
    mastery_break: optionalUint32(hero.mastery_break),
    sp_relic: optionalUint32(hero.sp_relic_level),
    diff: String(hero.diff ?? 0),
    rare: Boolean(hero.rare),
    breakthrough_level: optionalUint32(hero.breakthrough_level),
    attr: [],
    fetter_star: optionalUint32(hero.fetter_star),
    ...(hero.reforge ? { reforge: structuredClone(hero.reforge) } : {}),
    source_point_list: (hero.source_point_list ?? []).map(value => String(value))
  };
}

function placeSnapshot(ownerId, hero, index, nowSeconds) {
  return {
    hero: heroSnapshot(ownerId, hero),
    lease_times: 0,
    place_stamp: nowSeconds,
    hero_tid: uint32(hero.tid, 'hero tid'),
    index: uint32(index, 'placement index')
  };
}

function leaseInfo(placement, nowSeconds) {
  return {
    hero: structuredClone(placement.hero),
    lease_stamp: nowSeconds,
    hero_tid: uint32(placement.hero_tid ?? placement.hero?.hero_tid, 'leased hero tid'),
    use_info: []
  };
}

function validUnionUint32(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= MAX_UINT32;
}

export function createHeroLeaseService({
  store, codec, heroTables, leaseTables = readHeroLeaseTables(),
  now = () => Date.now(), logger = () => {}
}) {
  void heroTables;
  const log = event => { try { logger(event); } catch {} };
  const config = leaseTables?.active;
  if (!config || config.tid !== ACTIVE_FUNC_TID) throw new Error('Hero lease configuration is missing func_tid 1');
  const slot = leaseTables.slotForFunc(ACTIVE_FUNC_TID);
  if (slot === null) throw new Error('Hero lease login slot is missing');
  const placementIndexes = leaseTables.placementIndexes;
  if (!(placementIndexes instanceof Set) || placementIndexes.size !== config.max_place_num) {
    throw new Error('Hero lease placement hooks do not match the configured limit');
  }
  if (leaseTables.unitByPb?.get('pb_lease_hero')?.tid !== 1) throw new Error('Hero lease unit configuration is missing');

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(CODE_STATE, 'Hero lease clock is invalid');
    return Math.max(1, Math.min(MAX_UINT32, value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value)));
  }

  function assertConfig(leaseTid) {
    const tid = uint32(leaseTid, 'lease tid');
    if (tid !== config.tid) fail(CODE_STATE, 'Hero lease function is not configured');
    return config;
  }

  function readState(model) {
    const module = moduleOf(model);
    while (module.value.length <= slot) module.value.push(serializedBinary(Buffer.alloc(0)));
    const bytes = rawBinary(module.value[slot]);
    if (!bytes.length) return emptyState(ACTIVE_FUNC_TID);
    let value;
    try { value = codec.unpack('pb_role_lease_hero', bytes); }
    catch { fail(CODE_STATE, 'Hero lease login data is invalid'); }
    if (Number(value.func_tid ?? 0) !== ACTIVE_FUNC_TID) fail(CODE_STATE, 'Hero lease login slot has the wrong function id');
    return normalizedState(value, ACTIVE_FUNC_TID);
  }

  function writeState(model, value) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(CODE_STATE, 'Hero lease login module is missing');
    while (module.value.length <= slot) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[slot] = serializedBinary(codec.pack('pb_role_lease_hero', normalizedState(value, ACTIVE_FUNC_TID)));
    model.state.modules.value = [...modules];
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const module = moduleOf(model);
      while (module.value.length <= slot) module.value.push(serializedBinary(Buffer.alloc(0)));
      const bytes = rawBinary(module.value[slot]);
      if (!bytes.length) writeState(model, emptyState(ACTIVE_FUNC_TID));
      else readState(model);
      const state = readState(model);
      return { funcTid: ACTIVE_FUNC_TID, placeCount: state.place_heroes.length, leaseCount: state.lease_heroes.length };
    });
  }

  function requestHeroNets(input, label) {
    if (!Array.isArray(input?.hero_list) || input.hero_list.length === 0) fail(CODE_INVALID, `Missing ${label} heroes`);
    const seen = new Set();
    return input.hero_list.map(entry => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(CODE_INVALID, `Invalid ${label} hero`);
      const ownerId = roleIdNumber(entry.role_id ?? entry.owner_id, `${label} owner id`);
      const heroTid = uint32(entry.hero_tid, `${label} hero tid`);
      const key = ownerId + ':' + heroTid;
      if (seen.has(key)) fail(CODE_INVALID, `Duplicate ${label} hero`);
      seen.add(key);
      return { ownerId, heroTid };
    });
  }

  function requestHeroTids(input, label) {
    if (!Array.isArray(input?.hero_list) || input.hero_list.length === 0) fail(CODE_INVALID, `Missing ${label} heroes`);
    const seen = new Set();
    return input.hero_list.map(value => {
      const heroTid = uint32(value, `${label} hero tid`);
      if (seen.has(heroTid)) fail(CODE_INVALID, `Duplicate ${label} hero`);
      seen.add(heroTid);
      return heroTid;
    });
  }

  function place(input) {
    assertConfig(input?.lease_tid);
    if (!Array.isArray(input?.hero_list) || input.hero_list.length === 0) fail(CODE_INVALID, 'Missing placement heroes');
    if (input.hero_list.length > config.max_place_num) fail(CODE_LIMIT, 'Hero lease placement limit reached');
    const requested = input.hero_list.map(entry => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(CODE_INVALID, 'Invalid placement hero');
      return {
        heroTid: uint32(entry.hero_tid, 'placement hero tid'),
        index: uint32(entry.index, 'placement index')
      };
    });
    if (new Set(requested.map(entry => entry.heroTid)).size !== requested.length) fail(CODE_INVALID, 'Duplicate placement hero');
    if (new Set(requested.map(entry => entry.index)).size !== requested.length) fail(CODE_INVALID, 'Duplicate placement index');
    if (requested.some(entry => !placementIndexes.has(entry.index))) fail(CODE_INVALID, 'Invalid hero lease placement index');

    return store.transaction(model => {
      readGuildScope(model, codec);
      const at = currentSeconds();
      const ownerId = Number(model.state.roleId);
      const state = readState(model);
      const places = state.place_heroes.map(entry => structuredClone(entry));
      for (const request of requested) {
        const hero = activeHero(model, request.heroTid);
        for (let index = places.length - 1; index >= 0; index--) {
          if (Number(places[index].index) === request.index || Number(places[index].hero_tid ?? places[index].hero?.hero_tid) === request.heroTid) {
            places.splice(index, 1);
          }
        }
        places.push(placeSnapshot(ownerId, hero, request.index, at));
      }
      if (places.length > config.max_place_num) fail(CODE_LIMIT, 'Hero lease placement limit reached');
      places.sort((left, right) => Number(left.index) - Number(right.index));
      state.place_heroes = places;
      state.stamp = at;
      writeState(model, state);
      const data = codec.pack('pb_role_lease_hero', state);
      log({ event: 'hero_lease_placed', ownerId, heroes: requested.map(entry => entry.heroTid), indexes: requested.map(entry => entry.index) });
      return { schema: 'pb_role_lease_hero', value: state, data, valueForLog: { placed: places.length } };
    });
  }

  function lease(input) {
    assertConfig(input?.lease_tid);
    const requests = requestHeroNets(input, 'lease');
    return store.transaction((model, db) => {
      const actorId = Number(model.state.roleId);
      const actorGuild = readGuildScope(model, codec);
      const at = currentSeconds();
      const state = readState(model);
      if (state.lease_heroes.length + requests.length > config.max_lease_num) fail(CODE_LIMIT, 'Hero lease limit reached');
      const existing = new Set(state.lease_heroes.map(info =>
        roleIdNumber(info.hero?.owner_id, 'leased owner id') + ':' + uint32(info.hero_tid ?? info.hero?.hero_tid, 'leased hero tid')));
      if (requests.some(request => existing.has(request.ownerId + ':' + request.heroTid))) fail(CODE_STATE, 'Hero is already leased');

      const ownerCache = new Map();
      function ownerFor(ownerId) {
        if (ownerId === actorId) fail(CODE_STATE, 'Cannot lease a hero from the current role');
        if (ownerCache.has(ownerId)) return ownerCache.get(ownerId);
        let owner;
        try { owner = store.read(ownerId); }
        catch { fail(CODE_STATE, 'Hero lease owner does not exist'); }
        const guild = readGuildScope(owner, codec);
        if (guild.guildId !== actorGuild.guildId) fail(CODE_STATE, 'Hero lease owner is not in the same guild');
        const result = { model: owner, state: readState(owner), increments: new Map() };
        ownerCache.set(ownerId, result);
        return result;
      }

      const additions = [];
      for (const request of requests) {
        const owner = ownerFor(request.ownerId);
        const placement = owner.state.place_heroes.find(entry =>
          Number(entry.hero_tid ?? entry.hero?.hero_tid) === request.heroTid);
        if (!placement || Number(placement.hero?.lease_tid ?? 0) !== ACTIVE_FUNC_TID
            || Number(placement.hero?.hero_tid ?? placement.hero_tid) !== request.heroTid) {
          fail(CODE_STATE, 'Hero is not placed for lease');
        }
        if (!placementIndexes.has(Number(placement.index))) fail(CODE_STATE, 'Hero lease placement is invalid');
        if (roleIdNumber(placement.hero?.owner_id, 'placed owner id') !== request.ownerId) fail(CODE_STATE, 'Hero lease owner mismatch');
        owner.increments.set(request.heroTid, (owner.increments.get(request.heroTid) ?? 0) + 1);
        additions.push(leaseInfo(placement, at));
      }

      for (const [ownerId, owner] of ownerCache) {
        const next = structuredClone(owner.state);
        let total = 0;
        for (const placement of next.place_heroes) {
          const increment = owner.increments.get(Number(placement.hero_tid ?? placement.hero?.hero_tid)) ?? 0;
          if (increment) placement.lease_times = Math.min(MAX_UINT32, Number(placement.lease_times ?? 0) + increment);
          total += increment;
        }
        next.total_lease_times = Math.min(MAX_UINT32, Number(next.total_lease_times ?? 0) + total);
        next.stamp = at;
        writeState(owner.model, next);
        const persisted = db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=?')
          .run(JSON.stringify(new Map(owner.model.state.modules.value).get(MODULE_ID)), ownerId, MODULE_ID);
        if (persisted.changes !== 1) fail(CODE_STATE, 'Unable to persist hero lease owner state');
        owner.state = next;
      }

      state.lease_heroes.push(...additions);
      state.stamp = at;
      writeState(model, state);
      const pushes = [...ownerCache].map(([ownerId, owner]) => ({
        type: 6601,
        data: codec.pack('pb_lease_hero_change_notify', { lease: [owner.state], lineup: [] }),
        target: { kind: 'role', roleId: ownerId }
      }));
      const data = codec.pack('pb_role_lease_hero', state);
      log({ event: 'hero_lease_leased', roleId: actorId, owners: requests.map(entry => entry.ownerId), heroes: requests.map(entry => entry.heroTid) });
      return { schema: 'pb_role_lease_hero', value: state, data, pushes, valueForLog: { leased: additions.length } };
    });
  }

  function removeLeaseFighters(team, requested) {
    const source = Array.isArray(team?.lease_fighter_list) ? team.lease_fighter_list : [];
    const filtered = source.filter(entry => !requested.some(request =>
      Number(entry?.hero?.owner_id) === request.ownerId && Number(entry?.hero?.hero_tid) === request.heroTid));
    if (filtered.length === source.length) return false;
    team.lease_fighter_list = filtered;
    return true;
  }

  function cleanLeaseFighters(model, requested) {
    let changed = false;
    for (const lineup of model.playLineups) {
      for (const team of lineup.team_list ?? []) changed = removeLeaseFighters(team, requested) || changed;
    }
    for (const key of ['pre_lineups', 'pre_lineups_standby']) {
      for (const preset of model.lineups[key] ?? []) {
        for (const team of preset?.lineup?.team_list ?? []) changed = removeLeaseFighters(team, requested) || changed;
      }
    }
    return changed;
  }

  function giveBack(input) {
    assertConfig(input?.lease_tid);
    const requested = requestHeroNets(input, 'give-back');
    return store.transaction(model => {
      const at = currentSeconds();
      const state = readState(model);
      const requestedKeys = new Set(requested.map(entry => entry.ownerId + ':' + entry.heroTid));
      const missing = requested.some(entry => !state.lease_heroes.some(info =>
        Number(info.hero?.owner_id) === entry.ownerId && Number(info.hero_tid ?? info.hero?.hero_tid) === entry.heroTid));
      if (missing) fail(CODE_STATE, 'Hero is not leased');
      state.lease_heroes = state.lease_heroes.filter(info =>
        !requestedKeys.has(Number(info.hero?.owner_id) + ':' + Number(info.hero_tid ?? info.hero?.hero_tid)));
      state.stamp = at;
      cleanLeaseFighters(model, requested);
      writeState(model, state);
      const pushes = [{
        type: 6601,
        data: codec.pack('pb_lease_hero_change_notify', { lease: [state], lineup: model.playLineups })
      }];
      for (const ownerId of new Set(requested.map(entry => entry.ownerId))) {
        try {
          const owner = store.read(ownerId);
          pushes.push({
            type: 6601,
            data: codec.pack('pb_lease_hero_change_notify', { lease: [readState(owner)], lineup: [] }),
            target: { kind: 'role', roleId: ownerId }
          });
        } catch { /* The borrower can still return a hero after its owner disappears. */ }
      }
      const data = codec.pack('pb_role_lease_hero', state);
      log({ event: 'hero_lease_given_back', roleId: Number(model.state.roleId), heroes: requested.map(entry => entry.heroTid) });
      return { schema: 'pb_role_lease_hero', value: state, data, pushes, valueForLog: { returned: requested.length } };
    });
  }

  function takeBack(input) {
    assertConfig(input?.lease_tid);
    const heroTids = requestHeroTids(input, 'take-back');
    return store.transaction(model => {
      const at = currentSeconds();
      const state = readState(model);
      const present = new Set(state.place_heroes.map(entry => Number(entry.hero_tid ?? entry.hero?.hero_tid)));
      if (heroTids.some(tid => !present.has(tid))) fail(CODE_STATE, 'Hero is not placed for lease');
      const wanted = new Set(heroTids);
      state.place_heroes = state.place_heroes.filter(entry => !wanted.has(Number(entry.hero_tid ?? entry.hero?.hero_tid)));
      state.stamp = at;
      writeState(model, state);
      const data = codec.pack('pb_role_lease_hero', state);
      log({ event: 'hero_lease_taken_back', roleId: Number(model.state.roleId), heroes: heroTids });
      return { schema: 'pb_role_lease_hero', value: state, data, valueForLog: { retired: heroTids.length } };
    });
  }

  function list(input) {
    assertConfig(input?.lease_tid);
    if (!Array.isArray(input.role_id_list)) fail(CODE_INVALID, 'Invalid lease owner list');
    const actor = store.read();
    const actorGuild = readGuildScope(actor, codec);
    const ids = [];
    for (const value of input.role_id_list) {
      let id;
      try { id = roleIdNumber(value, 'lease owner id'); }
      catch { continue; }
      if (!ids.includes(id)) ids.push(id);
    }
    const allPlaceHeroes = [];
    for (const roleId of ids) {
      let target;
      try { target = store.read(roleId); }
      catch { continue; }
      let guild;
      try { guild = readGuildScope(target, codec); }
      catch { continue; }
      if (guild.guildId !== actorGuild.guildId) continue;
      const state = readState(target);
      const places = state.place_heroes
        .filter(entry => Number(entry.hero?.lease_tid) === ACTIVE_FUNC_TID
          && validUnionUint32(entry.hero_tid ?? entry.hero?.hero_tid)
          && placementIndexes.has(Number(entry.index)))
        .sort((left, right) => Number(left.index) - Number(right.index));
      if (places.length) allPlaceHeroes.push({ role_id: roleId, place_heroes: places });
    }
    const value = { all_place_heroes: allPlaceHeroes };
    const data = codec.pack('pb_lease_hero_list_rsp', value);
    return { schema: 'pb_lease_hero_list_rsp', value, data, valueForLog: { requested: ids.length, listed: allPlaceHeroes.length } };
  }

  function decode(type, data, { unpack } = {}) {
    if (!SUPPORTED.includes(type)) fail(CODE_INVALID, 'Unsupported hero lease command');
    if (typeof unpack !== 'function') fail(CODE_STATE, 'Hero lease protobuf decoder is unavailable');
    return unpack(REQUEST_SCHEMAS[type], data ?? Buffer.alloc(0));
  }

  function execute(type, input) {
    if (!SUPPORTED.includes(type)) fail(CODE_INVALID, 'Unsupported hero lease command');
    switch (type) {
      case 87201: return place(input);
      case 87202: return lease(input);
      case 87203: return giveBack(input);
      case 87204: return takeBack(input);
      case 87205: return list(input);
      default: fail(CODE_INVALID, 'Unsupported hero lease command');
    }
  }

  return {
    supports: type => SUPPORTED.includes(type),
    requestSchema: type => REQUEST_SCHEMAS[type] ?? null,
    ensureLoginState,
    decode,
    execute
  };
}

export const HERO_LEASE_COMMANDS = SUPPORTED;

