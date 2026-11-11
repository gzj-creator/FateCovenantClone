import { readActActivityTables } from '../config/act-activity-tables.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { GameError } from './hero-progression.mjs';

// Festivals, sign-in boards, limited-target events and the co-op activities with
// the same reward shape (block H of docs/plans/remaining-gameplay-20261106/
// 15-three-work-blocks.md, cards #180-#211).
//
// Every command owns real per-role state in SQLite. Claims are recorded in the
// shared activity_claims table (period = v<version>[:d<day>]) and the payloads
// the client echoes back live in act_reward_state. Reward lists come from the
// shipped client tables rebuilt by tools/extract-act-tables.mjs; nothing here is
// hand-copied from the client bundle.
//
// A command whose reward depends on a progress or settlement source this server
// does not own yet (cross-role server totals, PVP matchmaking results, guild-wide
// firecracker counts, multi-role invite/role-back graphs) rejects with an
// explicit error instead of inventing a fixed value.

const DAY_SECONDS = 86400;
// ItemTable row 1002 is the diamond currency consumed by the shop boards.
const DIAMOND_ITEM = 1002;
const STATE_TABLE = `CREATE TABLE IF NOT EXISTS act_reward_state (
  role_id INTEGER NOT NULL,
  act_id INTEGER NOT NULL,
  module TEXT NOT NULL,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, act_id)
)`;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function varint(value) {
  let remaining = Number(value) >>> 0;
  const bytes = [];
  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining) byte |= 0x80;
    bytes.push(byte);
  } while (remaining);
  return bytes;
}

// Client "xxx_bin" claim payloads are protobuf messages whose first field is a
// repeated uint32 claim list; proto3 packs repeated numerics, so field 1 is a
// length-delimited block of varints.
function packUint32List(values) {
  const numbers = [...values].map(Number).filter(value => Number.isSafeInteger(value) && value >= 0);
  if (!numbers.length) return Buffer.alloc(0);
  const body = numbers.flatMap(varint);
  return Buffer.concat([Buffer.from([0x0a, ...varint(body.length)]), Buffer.from(body)]);
}

function awardPairs(list, label) {
  if (!Array.isArray(list) || !list.length) throw new GameError(5, label + ' award list is missing');
  return list.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, label + ' award list is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, label + ' award list is invalid');
    }
    return [tid, count];
  });
}

function positiveInt(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(1, 'Invalid ' + label);
  return number;
}

function idList(value) {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.map(Number).filter(id => Number.isSafeInteger(id) && id > 0);
}

export function createActRewardService({
  store,
  codec,
  tables,
  actTables = readActActivityTables(),
  calendar,
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const activityReferenceOpenedAt = calendar?.activityReferenceOpenedAt ?? null;
  const allOpen = calendar?.mode === 'all-open';

  store.inspect(db => db.exec(STATE_TABLE));

  function configOf(actId) {
    return tables?.ActFrameAct?.get(Number(actId)) ?? tables?.Activity?.get(Number(actId)) ?? null;
  }

  function resolve(actId) {
    const id = positiveInt(actId, 'activity id');
    const config = configOf(id);
    if (!config) throw new GameError(1, 'Unknown activity');
    const version = Number(config.version);
    if (!Number.isSafeInteger(version) || version <= 0) throw new GameError(5, 'Activity version is not configured');
    const at = currentSeconds();
    const window = activityWindow(config, serverOpenedAt, activityReferenceOpenedAt);
    if (window && window.start > at) throw new GameError(309, 'Activity is not running');
    if (!allOpen && calendar?.isActivityRunning && !calendar.isActivityRunning(id, null, null, at)) {
      throw new GameError(309, 'Activity is not running');
    }
    const start = window ? Number(window.start) : (seconds(serverOpenedAt) || at);
    return { actId: id, config, version, start, at };
  }

  function dayIndex(act) {
    const index = Math.floor((act.at - act.start) / DAY_SECONDS) + 1;
    return Number.isSafeInteger(index) && index > 0 ? index : 1;
  }

  function periodOf(act, day) {
    return day ? 'v' + act.version + ':d' + day : 'v' + act.version;
  }

  function readState(db, roleId, actId) {
    const row = db.prepare('SELECT module,version,data FROM act_reward_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (!row) return null;
    let data;
    try { data = JSON.parse(row.data); } catch { throw new GameError(5, 'Activity state is corrupt'); }
    if (!data || typeof data !== 'object') throw new GameError(5, 'Activity state is corrupt');
    return { module: row.module, version: Number(row.version), data };
  }

  function stateOf(db, roleId, act, module) {
    const existing = readState(db, roleId, act.actId);
    if (existing && existing.version === act.version) {
      existing.data.claims ??= [];
      existing.data.counters ??= {};
      existing.data.flags ??= {};
      existing.module = module;
      return existing;
    }
    return { module, version: act.version, data: { claims: [], counters: {}, flags: {} } };
  }

  function saveState(db, roleId, act, state) {
    db.prepare('INSERT OR REPLACE INTO act_reward_state VALUES (?,?,?,?,?,?)').run(
      roleId, act.actId, state.module, state.version, JSON.stringify(state.data),
      new Date(currentSeconds() * 1000).toISOString()
    );
  }

  function claimKey(db, roleId, act, key, period = periodOf(act)) {
    const id = Number(key);
    if (!Number.isSafeInteger(id)) throw new GameError(1, 'Invalid claim key');
    const existing = db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?')
      .get(roleId, act.actId, id, period);
    if (existing) throw new GameError(310, 'Reward already claimed');
    db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)')
      .run(roleId, act.actId, id, period, new Date(currentSeconds() * 1000).toISOString());
  }

  function claimedIds(db, roleId, act, period) {
    return db.prepare('SELECT task_id FROM activity_claims WHERE role_id=? AND act_id=? AND period=?')
      .all(roleId, act.actId, period).map(row => Number(row.task_id));
  }

  function grant(model, awards) {
    return grantResources(model, awardPairs(awards, 'Activity'), tables, { codec, now: currentSeconds });
  }

  function resReply(res) {
    return { value: { res }, data: codec.pack('pb_res_to_client', res) };
  }

  // Commands whose reward needs a progress/settlement source this server still
  // lacks fail closed with a named reason rather than a fixed value.
  function reject(reason) {
    throw new GameError(5, reason);
  }

  function versionRows(map, version) {
    const rows = [];
    for (const [tid, row] of map ?? []) {
      if (Number(row.version) === Number(version)) rows.push([Number(tid), row]);
    }
    return rows.sort((left, right) => left[0] - right[0]);
  }

  function requireVersionRows(map, version, label) {
    const rows = versionRows(map, version);
    if (!rows.length) throw new GameError(5, label + ' version ' + version + ' is not configured');
    return rows;
  }

  const handlers = new Map();
  const commands = new Map();
  function register(types, kind) {
    for (const [type, spec] of Object.entries(types)) commands.set(Number(type), spec);
  }

  // 37009 req_sign_act_award: SignActTable.SignAct keys one row per
  // <version><day>, e.g. 101 = version 1 day 1.
  handlers.set(37009, data => {
    const request = codec.unpack('pb_sign_act_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const day = positiveInt(request.day, 'sign day');
    const today = dayIndex(act);
    if (day > today) throw new GameError(309, 'Sign day has not started');
    const row = actTables.signAct.SignAct.get(act.version * 100 + day);
    if (!row) throw new GameError(5, 'Sign award is not configured');
    const items = Array.isArray(row.item) ? row.item : [row.item];
    const counts = Array.isArray(row.count) ? row.count : [row.count];
    const awards = items.map((tid, index) => [Number(tid), Number(counts[index] ?? 1)])
      .filter(pair => pair[0] > 0 && pair[1] > 0);
    if (!awards.length) throw new GameError(5, 'Sign award is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, day);
      const res = grant(model, awards);
      log({ event: 'sign_act_award_committed', actId: act.actId, day, awards: awards.length });
      const value = {
        info: { act_id: String(act.actId), level: today, award_bin: packUint32List(claimedIds(db, roleId, act, periodOf(act))), resign_bin: Buffer.alloc(0) },
        res
      };
      return { value, data: codec.pack('pb_sign_act_back', value) };
    });
  });

  // 90301 req_login_reward_act_award (ETF activity id). LoginRewardActTable.Award
  // holds one row per day and belong_act names the owning activity tid.
  handlers.set(90301, etf => {
    const actId = positiveInt(idList(etf)[0] ?? etf, 'activity id');
    const act = resolve(actId);
    if (!actTables.loginRewardAct.LoginRewardAct.get(actId)) throw new GameError(5, 'Login reward activity is not configured');
    const awards = [...actTables.loginRewardAct.Award]
      .filter(([, row]) => Number(row.belong_act) === actId)
      .sort((left, right) => left[0] - right[0]);
    if (!awards.length) throw new GameError(5, 'Login reward award list is missing');
    const day = dayIndex(act);
    const [tid] = awards[Math.min(day, awards.length) - 1];
    const row = actTables.loginRewardAct.Award.get(tid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, tid);
      const res = grant(model, [[Number(row.item), Number(row.count)]]);
      log({ event: 'login_reward_act_committed', actId, tid, day });
      const value = { single: { id: actId, award_bin: packUint32List(claimedIds(db, roleId, act, periodOf(act))) }, res };
      return { value, data: codec.pack('pb_login_reward_act_rev_back', value) };
    });
  });

  // 101501 req_common_sign_award. CommonSignTable.CommonSign groups the board by
  // version; the n-th tid of a version unlocks on the n-th activity day.
  handlers.set(101501, data => {
    const request = codec.unpack('pb_common_sign_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const rows = requireVersionRows(actTables.commonSign.CommonSign, act.version, 'Common sign');
    const requested = idList(request.award_tid);
    if (!requested.length) throw new GameError(1, 'Common sign award list is empty');
    const today = dayIndex(act);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of requested) {
        const index = rows.findIndex(([rowTid]) => rowTid === tid);
        if (index < 0) throw new GameError(1, 'Common sign award is not configured for this version');
        if (index + 1 > today) throw new GameError(309, 'Common sign day has not started');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(rows[index][1].award, 'Common sign'));
      }
      const res = grant(model, awards);
      log({ event: 'common_sign_award_committed', actId: act.actId, tids: requested });
      const value = { sign: { act_id: String(act.actId), state_bin: packUint32List(claimedIds(db, roleId, act, periodOf(act))) }, res };
      return { value, data: codec.pack('pb_common_sign_award_rev', value) };
    });
  });

  // 99801 req_festival_sign_award. The client sends the award tids it wants; each
  // row carries its own award_list and the version ordering gates the day.
  handlers.set(99801, data => {
    const request = codec.unpack('pb_festival_sign_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const rows = requireVersionRows(actTables.festivalSign.FestivalSignAct, act.version, 'Festival sign');
    const requested = idList(request.award_tid);
    if (!requested.length) throw new GameError(1, 'Festival sign award list is empty');
    const today = dayIndex(act);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of requested) {
        const index = rows.findIndex(([rowTid]) => rowTid === tid);
        if (index < 0) throw new GameError(1, 'Festival sign award is not configured for this version');
        if (index + 1 > today) throw new GameError(309, 'Festival sign day has not started');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(rows[index][1].award_list, 'Festival sign'));
      }
      const res = grant(model, awards);
      log({ event: 'festival_sign_award_committed', actId: act.actId, tids: requested });
      return resReply(res);
    });
  });

  // 110501 req_hero_sign_act_award. HeroSignActTable.Award holds one row per
  // version/day; the client sends the tids of the days it is claiming.
  handlers.set(110501, data => {
    const request = codec.unpack('pb_hero_sign_act_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const requested = idList(request.tid_list);
    if (!requested.length) throw new GameError(1, 'Hero sign award list is empty');
    const today = dayIndex(act);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of requested) {
        const row = actTables.heroSign.Award.get(tid);
        if (!row || Number(row.version) !== act.version) throw new GameError(1, 'Hero sign award is not configured for this version');
        if (Number(row.day) > today) throw new GameError(309, 'Hero sign day has not started');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award_list, 'Hero sign'));
      }
      const res = grant(model, awards);
      log({ event: 'hero_sign_award_committed', actId: act.actId, tids: requested });
      const value = { act_data: { act_id: String(act.actId), sign_bit: packUint32List(claimedIds(db, roleId, act, periodOf(act))) }, res };
      return { value, data: codec.pack('pb_hero_sign_act_rev_back', value) };
    });
  });

  // 100001 req_collect_exchange_award. Each row spends sub and grants add, with a
  // per-version exchange limit from the table.
  handlers.set(100001, data => {
    const request = codec.unpack('pb_collect_exchange_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const exchangeId = positiveInt(request.exchange_id, 'exchange id');
    const row = actTables.collectExchange.CollectExchangeAward.get(exchangeId);
    if (!row || Number(row.version) !== act.version) throw new GameError(1, 'Exchange is not configured for this version');
    const limit = Math.max(1, Number(row.limit) || 1);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const previous = readState(db, roleId, act.actId);
      const counts = previous?.data?.counters?.exchange ?? {};
      const used = Number(counts[String(exchangeId)] ?? 0);
      if (used >= limit) throw new GameError(310, 'Exchange limit reached');
      const spent = consumeResources(model, awardPairs(row.sub, 'Exchange cost'), 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(row.add, 'Exchange award'));
      const state = stateOf(db, roleId, act, 'collectExchange');
      state.data.counters.exchange = { ...counts, [String(exchangeId)]: used + 1 };
      saveState(db, roleId, act, state);
      log({ event: 'collect_exchange_committed', actId: act.actId, exchangeId, used: used + 1 });
      const res = { changes: [...spent.changes, ...granted.changes] };
      return { value: { res }, data: codec.pack('pb_collect_exchange_award_rsp', { res }) };
    });
  });

  // Shared claim loop: every tid is checked against the activity version, the
  // optional gate, then claimed once per period before the rewards are granted.
  function claimMany({ act, module, tids, lookup, awardsOf, gate }) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of tids) {
        const row = lookup(tid);
        if (!row) throw new GameError(1, module + ' award is not configured for this version');
        if (gate) gate(row);
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardsOf(row));
      }
      const res = grant(model, awards);
      const state = stateOf(db, roleId, act, module);
      state.data.claims = [...new Set([...(state.data.claims ?? []), ...tids])];
      saveState(db, roleId, act, state);
      log({ event: module + '_award_committed', actId: act.actId, tids, awards: awards.length });
      return { res, tids: claimedIds(db, roleId, act, periodOf(act)) };
    });
  }

  function tidAwards(row, field, label) {
    return awardPairs(row?.[field], label);
  }

  // 98610 req_christmas_act_dress spends the dress currency and grants the
  // configured dress award per count, capped by Dress.max_draw_cnt.
  handlers.set(98610, data => {
    const request = codec.unpack('pb_christmas_act_dress_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const count = positiveInt(request.dress_cnt, 'dress count');
    const row = actTables.christmas.Dress.get(act.actId);
    if (!row) throw new GameError(5, 'Christmas dress is not configured');
    const max = Number(row.max_draw_cnt);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'christmasAct');
      const used = Number(state.data.counters.dress ?? 0);
      if (Number.isSafeInteger(max) && max > 0 && used + count > max) throw new GameError(5, 'Christmas dress count exceeds the configured maximum');
      const spent = consumeResources(model, [[Number(row.cost_tid), Number(row.cost_num) * count]], 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(row.award, 'Christmas dress').map(([tid, num]) => [tid, num * count]));
      state.data.counters.dress = used + count;
      saveState(db, roleId, act, state);
      log({ event: 'christmas_dress_committed', actId: act.actId, count, total: used + count });
      return resReply({ changes: [...spent.changes, ...granted.changes] });
    });
  });

  // 98611 req_christmas_act_get_dress_award claims every DressAward tier whose
  // available_sec is already in the past.
  handlers.set(98611, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const tiers = [...actTables.christmas.DressAward]
      .filter(([, row]) => Number(row.act_id) === act.actId && seconds(row.available_sec) <= act.at)
      .sort((left, right) => left[0] - right[0]);
    if (!tiers.length) throw new GameError(309, 'Christmas dress award is not available yet');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const [tid, row] of tiers) {
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award, 'Christmas dress award'));
      }
      const res = grant(model, awards);
      log({ event: 'christmas_dress_award_committed', actId: act.actId, tiers: tiers.map(([tid]) => tid) });
      return resReply(res);
    });
  });

  // 98612 req_christmas_act_select_wish stores the wish choice. The wish payout
  // itself is driven by the Christmas shop/draw boards, which are outside block H.
  handlers.set(98612, (etf, data) => {
    const act = resolve(idList(etf)[0] ?? etf);
    const wish = actTables.christmas.Wish.get(act.actId);
    if (!wish) throw new GameError(5, 'Christmas wish is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'christmasAct');
      state.data.flags.selectWish = Number(wish.need_progress);
      saveState(db, roleId, act, state);
      log({ event: 'christmas_wish_selected', actId: act.actId, needProgress: Number(wish.need_progress) });
      return { value: { wish: Number(wish.need_progress) }, data: Buffer.alloc(0) };
    });
  });

  // 98613 req_christmas_shop_award buys one shop tier with diamonds.
  handlers.set(98613, etf => {
    const ids = idList(etf);
    if (ids.length < 2) throw new GameError(1, 'Invalid Christmas shop request');
    const act = resolve(ids[0]);
    const awardTid = positiveInt(ids[1], 'shop award id');
    const row = actTables.christmas.ShopAward.get(awardTid);
    if (!row) throw new GameError(1, 'Christmas shop award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, awardTid);
      const spent = consumeResources(model, [[DIAMOND_ITEM, Number(row.cost_diamond)]], 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(row.award, 'Christmas shop'));
      log({ event: 'christmas_shop_award_committed', actId: act.actId, awardTid });
      return resReply({ changes: [...spent.changes, ...granted.changes] });
    });
  });

  // 99601 req_spring_festival_dress mirrors the Christmas dress board.
  handlers.set(99601, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0]);
    const count = Math.max(1, Number(ids[1] ?? 1));
    const row = actTables.springFestival.Dress.get(act.actId);
    if (!row) throw new GameError(5, 'Spring festival dress is not configured');
    const max = Number(row.max_draw_cnt);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'springFestivalAct');
      const used = Number(state.data.counters.dress ?? 0);
      if (Number.isSafeInteger(max) && max > 0 && used + count > max) throw new GameError(5, 'Spring festival dress count exceeds the configured maximum');
      const spent = consumeResources(model, [[Number(row.cost_tid), Number(row.cost_num) * count]], 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(row.award, 'Spring festival dress').map(([tid, num]) => [tid, num * count]));
      state.data.counters.dress = used + count;
      saveState(db, roleId, act, state);
      log({ event: 'spring_festival_dress_committed', actId: act.actId, count });
      return resReply({ changes: [...spent.changes, ...granted.changes] });
    });
  });

  // 99602 req_spring_festival_get_dress_award claims the unlocked dress tiers.
  handlers.set(99602, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const tiers = [...actTables.springFestival.DressAward]
      .filter(([, row]) => Number(row.act_id) === act.actId && seconds(row.available_sec) <= act.at)
      .sort((left, right) => left[0] - right[0]);
    if (!tiers.length) throw new GameError(309, 'Spring festival dress award is not available yet');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const [tid, row] of tiers) {
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award, 'Spring festival dress award'));
      }
      const res = grant(model, awards);
      log({ event: 'spring_festival_dress_award_committed', actId: act.actId });
      return resReply(res);
    });
  });

  // 99603 req_spring_festival_shop_award buys one shop tier.
  handlers.set(99603, etf => {
    const ids = idList(etf);
    if (ids.length < 2) throw new GameError(1, 'Invalid spring festival shop request');
    const act = resolve(ids[0]);
    const awardTid = positiveInt(ids[1], 'shop award id');
    const row = actTables.springFestival.ShopAward.get(awardTid);
    if (!row || Number(row.version) !== act.version) throw new GameError(1, 'Spring festival shop award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, awardTid);
      const spent = consumeResources(model, [[DIAMOND_ITEM, Number(row.cost_diamond)]], 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(row.award, 'Spring festival shop'));
      log({ event: 'spring_festival_shop_award_committed', actId: act.actId, awardTid });
      return resReply({ changes: [...spent.changes, ...granted.changes] });
    });
  });

  // 104401 req_qi_xi_discount_select stores the chosen gift index per recharge
  // tier; 104402 req_qi_xi_daily_sign claims the day sign of QiXiActTable.QiXiSign.
  handlers.set(104401, data => {
    const request = codec.unpack('pb_qi_xi_recharge_select_req', data ?? Buffer.alloc(0));
    const rechargeTid = positiveInt(request.recharge_tid, 'recharge id');
    const selects = (request.select_list ?? []).map(row => ({ gift_award_tid: Number(row.gift_award_tid), select_tid: Number(row.select_tid) }));
    if (!selects.length) throw new GameError(1, 'QiXi select list is empty');
    // The QiXi discount board carries no activity id; the selection is keyed by
    // the recharge tier that owns it.
    const act = { actId: rechargeTid, version: 1, at: currentSeconds(), start: currentSeconds() };
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'qiXiAct');
      state.data.counters.select = { ...(state.data.counters.select ?? {}), [String(rechargeTid)]: selects };
      saveState(db, roleId, act, state);
      log({ event: 'qi_xi_select_saved', actId: act.actId, rechargeTid, selects: selects.length });
      const value = { recharge_tid: rechargeTid, select_list: selects };
      return { value, data: codec.pack('pb_qi_xi_recharge_select_info', value) };
    });
  });

  handlers.set(104402, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const rows = requireVersionRows(actTables.qiXi.QiXiSign, act.version, 'QiXi sign');
    const today = dayIndex(act);
    const entry = rows.find(([tid, row]) => Number(row.day) === today) ?? null;
    if (!entry) throw new GameError(309, 'QiXi sign day is not available');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, entry[0], periodOf(act, today));
      const items = entry[1].item_list ?? [];
      const counts = entry[1].count_list ?? [];
      const res = grant(model, items.map((tid, index) => [Number(tid), Number(counts[index] ?? 1)]).filter(pair => pair[0] > 0 && pair[1] > 0));
      log({ event: 'qi_xi_sign_committed', actId: act.actId, day: today });
      return resReply(res);
    });
  });

  // 99600 req_common_act_draw_award draws one tier of ActDrawAwardLib for the
  // activity named by pb_act_exit_req and records the drawn award id.
  handlers.set(99600, data => {
    const request = codec.unpack('pb_act_exit_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_tid);
    const drawTid = positiveInt(request.draw_award_tid, 'draw award id');
    const lib = actTables.comActDraw.ActDrawAwardLib.get(drawTid);
    if (!lib) throw new GameError(1, 'Common draw award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, drawTid);
      const res = grant(model, awardPairs(lib.draw_award, 'Common draw'));
      const state = stateOf(db, roleId, act, 'comActDraw');
      const draws = Number(state.data.counters.draw ?? 0) + Number(lib.draw_num ?? 0);
      state.data.counters.draw = draws;
      state.data.claims = [...new Set([...(state.data.claims ?? []), drawTid])];
      saveState(db, roleId, act, state);
      log({ event: 'common_act_draw_committed', actId: act.actId, drawTid, drawNum: Number(lib.draw_num ?? 0) });
      const value = { res_change: res, draw_award_id: drawTid };
      return { value, data: codec.pack('pb_act_draw_award_back', value) };
    });
  });

  // 105101 req_get_ones_reward claims the one-off payout of OnesRewardTable.
  handlers.set(105101, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const row = [...actTables.onesReward.OnesReward].map(([, value]) => value)[0];
    if (!row) throw new GameError(5, 'Ones reward is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, Number(row.tid));
      const res = grant(model, awardPairs(row.award, 'Ones reward'));
      log({ event: 'ones_reward_committed', actId: act.actId });
      const value = { get_list: packUint32List(claimedIds(db, roleId, act, periodOf(act))), res };
      return { value, data: codec.pack('pb_get_ones_reward_rsp', value) };
    });
  });

  // 105601 req_choice_story_award claims the branch-story reward rows.
  handlers.set(105601, data => {
    const request = codec.unpack('pb_choice_story_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const tids = idList(request.id_list);
    if (!tids.length) throw new GameError(1, 'Choice story award list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of tids) {
        const row = actTables.choiceStory.Chapter.get(tid) ?? actTables.choiceStory.ChoiceStory.get(tid);
        if (!row) throw new GameError(1, 'Choice story award is not configured');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award_list ?? row.award, 'Choice story'));
      }
      const res = grant(model, awards);
      log({ event: 'choice_story_award_committed', actId: act.actId, tids });
      const value = { act_info: { version: act.version, get_list: claimedIds(db, roleId, act, periodOf(act)) }, res };
      return { value, data: codec.pack('pb_choice_story_award_rsp', value) };
    });
  });

  // 110901 req_questionnaire_finish records the answered questionnaire and grants
  // the configured award_list of the matched QuestionnaireTable row.
  handlers.set(110901, data => {
    const request = codec.unpack('pb_questionnaire_finish_req', data ?? Buffer.alloc(0));
    const questionnaireTid = positiveInt(request.questionnaire_tid, 'questionnaire id');
    const row = actTables.questionnaire.Questionnaire.get(questionnaireTid);
    if (!row) throw new GameError(1, 'Questionnaire is not configured');
    const act = resolve(row.act ?? actTables.questionnaire.Act.get(1)?.act);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, questionnaireTid);
      const state = stateOf(db, roleId, act, 'questionnaire');
      state.data.claims = [...new Set([...(state.data.claims ?? []), questionnaireTid])];
      state.data.counters.answers = (Number(state.data.counters.answers ?? 0) + (request.questionnaire_data ?? []).length);
      saveState(db, roleId, act, state);
      const res = grant(model, awardPairs(row.award_list, 'Questionnaire'));
      log({ event: 'questionnaire_finished', actId: act.actId, questionnaireTid });
      const value = { role_info: { finish_questionnaire_tid: state.data.claims }, res };
      return { value, data: codec.pack('pb_questionnaire_finish_rsp', value) };
    });
  });

  // 110701 req_enjoy_blessing_act_shake spends the blessing currency and draws
  // from EnjoyBlessingActTable.Rebate by the accumulated vitality tiers.
  handlers.set(110701, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const version = requireVersionRows(actTables.enjoyBlessing.Version, act.version, 'Enjoy blessing')[0][1];
    const rebates = [...actTables.enjoyBlessing.Rebate]
      .filter(([, row]) => Number(row.tid) === Number(version.rebate_library))
      .sort((left, right) => Number(left[1].have?.[0] ?? 0) - Number(right[1].have?.[0] ?? 0));
    if (!rebates.length) throw new GameError(5, 'Enjoy blessing rebate library is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'enjoyBlessing');
      const draws = Number(state.data.counters.draw ?? 0);
      const tier = rebates[Math.min(draws, rebates.length - 1)][1];
      const backNum = Number(tier.back_num?.[0] ?? 0);
      if (!(backNum > 0)) throw new GameError(5, 'Enjoy blessing rebate tier is empty');
      state.data.counters.draw = draws + 1;
      saveState(db, roleId, act, state);
      const res = grant(model, [[Number(version.back_item), backNum]]);
      log({ event: 'enjoy_blessing_shake_committed', actId: act.actId, draws: draws + 1, backNum });
      const value = { act_data: { act_id: String(act.actId), total_money: '0', draw_count: draws + 1, total_vitality: '0' }, res };
      return { value, data: codec.pack('pb_enjoy_blessing_act_shake_back', value) };
    });
  });

  // 104403 req_anniversary_game_act_award settles one mini-game run. The award
  // tier comes from AnniversaryGameActTable.Award keyed by <game><rank>.
  handlers.set(104403, data => {
    const request = codec.unpack('pb_anniversary_game_act_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_tid);
    const game = positiveInt(request.type, 'mini-game type');
    const versions = [...actTables.anniversaryGame.Version]
      .filter(([, row]) => (row.games ?? []).map(Number).includes(game));
    if (!versions.length) throw new GameError(1, 'Mini-game is not configured for any version');
    const awardTid = game * 100 + 1;
    const row = actTables.anniversaryGame.Award.get(awardTid);
    if (!row) throw new GameError(5, 'Mini-game award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, awardTid, periodOf(act, dayIndex(act)));
      const res = grant(model, awardPairs(row.award, 'Anniversary game'));
      log({ event: 'anniversary_game_award_committed', actId: act.actId, game, awardTid });
      const value = { res, act_data: { left_award_times: 0, last_refresh_stamp: 0, best: [{ type: game, score: 0 }] }, rank: 0 };
      return { value, data: codec.pack('pb_anniversary_game_act_award_rsp', value) };
    });
  });

  // 105201 req_invite_act_bind / 105202 req_invite_act_task. Binding needs a real
  // inviter role on this server, which a single-role store cannot prove.
  handlers.set(105201, () => reject('Invite binding requires a second role; the local server has no invitee graph'));
  handlers.set(105202, data => {
    const request = codec.unpack('pb_invite_task_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const row = actTables.invite.InviteTask.get(Number(request.task_id));
    if (!row) throw new GameError(1, 'Invite task is not configured');
    reject('Invite task progress is owned by the inviter graph, which the local server does not model');
  });
  handlers.set(105250, () => reject('Invite-old binding requires a second role; the local server has no invitee graph'));
  handlers.set(105251, data => {
    const request = codec.unpack('pb_invite_old_task_req', data ?? Buffer.alloc(0));
    resolve(request.act_id);
    if (!actTables.inviteOld.InviteOldTask.get(Number(request.task_id))) throw new GameError(1, 'Invite-old task is not configured');
    reject('Invite-old task progress is owned by the inviter graph, which the local server does not model');
  });

  // 105301 req_role_back_bind_award grants the returner bind reward once.
  handlers.set(105301, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const row = [...actTables.roleBack.New].map(([, value]) => value)[0];
    if (!row) throw new GameError(5, 'Role-back bind reward is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, 1);
      const res = grant(model, awardPairs(row.award, 'Role-back bind'));
      log({ event: 'role_back_bind_award_committed', actId: act.actId });
      return resReply(res);
    });
  });
  handlers.set(105303, () => reject('Inheritance card activation needs the returning account ledger, which the local server does not store'));
  handlers.set(105305, () => reject('Role-back binding needs a second account/role graph that the local server does not store'));
  handlers.set(105307, () => reject('Role-back role list needs cross-account role data that the local server does not store'));
  handlers.set(105308, data => {
    const etf = data;
    const act = resolve(idList(etf)[0] ?? etf);
    const row = [...actTables.roleBack.New].map(([, value]) => value)[0];
    if (!row) throw new GameError(5, 'Role-back daily money is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const day = dayIndex(act);
      claimKey(db, roleId, act, day, periodOf(act, day));
      const res = grant(model, [[Number(row.money_item), Number(row.money)]]);
      log({ event: 'role_back_day_money_committed', actId: act.actId, day });
      return resReply(res);
    });
  });

  // 100501 req_valentine_rev_award claims the configured award of one content
  // row; 100502 req_valentine_save_chat_progress stores the played chat index.
  handlers.set(100501, data => {
    const request = codec.unpack('pb_valentine_day_rev_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const awardId = positiveInt(request.award_id, 'valentine award id');
    const rows = [...actTables.valentine.ValentineDayAct].filter(([, row]) => Number(row.act_id) === act.actId);
    if (!rows.length) throw new GameError(5, 'Valentine activity is not configured');
    const entry = rows.find(([tid]) => tid === awardId) ?? rows[0];
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, awardId);
      const res = grant(model, awardPairs(entry[1].award, 'Valentine'));
      log({ event: 'valentine_award_committed', actId: act.actId, awardId });
      const value = { rev_states: packUint32List(claimedIds(db, roleId, act, periodOf(act))), res };
      return { value, data: codec.pack('pb_valentine_day_rev_award_rsp', value) };
    });
  });

  handlers.set(100502, data => {
    const request = codec.unpack('pb_valentine_day_save_chat_progress_req', data ?? Buffer.alloc(0));
    const actCfg = positiveInt(request.act_cfg_tid, 'valentine config id');
    const index = positiveInt(request.index, 'chat index');
    const row = actTables.valentine.ValentineDayAct.get(actCfg);
    if (!row) throw new GameError(1, 'Valentine config is not configured');
    const act = resolve(row.act_id);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'valentine');
      state.data.counters.chat = { ...(state.data.counters.chat ?? {}), [String(actCfg)]: index };
      saveState(db, roleId, act, state);
      log({ event: 'valentine_chat_saved', actId: act.actId, actCfg, index });
      return { value: { index }, data: Buffer.alloc(0) };
    });
  });

  // 103001 req_question_act_answer validates the topic against the day library
  // and records the chosen option; 103002/103003 claim the day and pile awards.
  handlers.set(103001, data => {
    const request = codec.unpack('pb_question_answer_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const days = requireVersionRows(actTables.question.Day, act.version, 'Question');
    const dayEntry = days.find(([, row]) => Number(row.day) === positiveInt(request.day_index, 'question day'));
    if (!dayEntry) throw new GameError(1, 'Question day is not configured');
    const lib = actTables.question.Lib.get(Number(dayEntry[1].question_lib));
    const topicTid = positiveInt(request.topic_tid, 'topic id');
    if (!lib || !(lib.topic ?? []).map(Number).includes(topicTid)) throw new GameError(1, 'Question topic does not belong to this day');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'question');
      const answers = { ...(state.data.counters.answers ?? {}) };
      const key = String(topicTid);
      if (answers[key] !== undefined) throw new GameError(310, 'Question already answered');
      answers[key] = Number(request.choose);
      state.data.counters.answers = answers;
      saveState(db, roleId, act, state);
      log({ event: 'question_answered', actId: act.actId, topicTid, choose: Number(request.choose) });
      const value = {
        day: Number(dayEntry[1].day),
        topic_list: [{ topic_tid: topicTid, choose_options: Number(request.choose) }],
        answer_times: Object.keys(answers).length,
        answer_ord: 0,
        is_reward: false
      };
      return { value, data: codec.pack('pb_question_day', value) };
    });
  });

  handlers.set(103002, data => {
    const request = codec.unpack('pb_question_reward_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const day = positiveInt(request.day_index, 'question day');
    const dayEntry = requireVersionRows(actTables.question.Day, act.version, 'Question')
      .find(([, row]) => Number(row.day) === day);
    if (!dayEntry) throw new GameError(1, 'Question day is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, day, periodOf(act, day));
      const res = grant(model, awardPairs(dayEntry[1].question_award_list, 'Question day'));
      log({ event: 'question_day_reward_committed', actId: act.actId, day });
      const value = { day_data: { day, topic_list: [], answer_times: 0, answer_ord: 0, is_reward: true }, res };
      return { value, data: codec.pack('pb_question_reward_back', value) };
    });
  });

  // Open-server sprint task awards reuse SprintTask rows; the rank finish list is
  // read from the claims this server already owns.
  handlers.set(79101, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0] ?? etf);
    const tids = ids.slice(1);
    if (!tids.length) throw new GameError(1, 'Sprint task list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const tid of tids) {
        const row = actTables.openServerSprint.SprintTask.get(tid);
        if (!row) throw new GameError(1, 'Sprint task is not configured');
        claimKey(db, roleId, act, tid, periodOf(act, dayIndex(act)));
        awards = awards.concat(awardPairs(row.award, 'Sprint task'));
      }
      const res = grant(model, awards);
      log({ event: 'sprint_task_received', actId: act.actId, tids });
      const value = {
        exception: false,
        received_times: tids.length,
        res,
        receive_data: packUint32List(claimedIds(db, roleId, act, periodOf(act, dayIndex(act)))),
        player_list: []
      };
      return { value, data: codec.pack('pb_sprint_receive_task_back', value) };
    });
  });
  handlers.set(79102, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0] ?? etf);
    const tids = ids.slice(1);
    const roleId = store.state().roleId;
    return store.inspect(db => {
      const claimed = new Set(claimedIds(db, roleId, act, periodOf(act, dayIndex(act))));
      const value = {
        task_tid: tids[0] ?? 0,
        received_times: claimed.size,
        player_list: tids.some(tid => claimed.has(tid))
          ? [{ role_id: String(roleId), time: String(currentSeconds()) }]
          : []
      };
      return { value, data: codec.pack('pb_sprint_task_finish', value) };
    });
  });

  // 101001 req_preheat. PreheatActTable.PreheatAct keys one board per activity
  // id suffix (150001 -> 1); each use spends cost_tid/cost_num and grants the
  // board award, gated by divide_sec between uses and max_draw_cnt overall.
  function preheatRow(act) {
    const row = actTables.preheat.PreheatAct.get(act.actId % 1000);
    if (!row) throw new GameError(5, 'Preheat activity ' + act.actId + ' is not configured');
    return row;
  }
  handlers.set(101001, data => {
    const request = codec.unpack('pb_preheat_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const row = preheatRow(act);
    const count = positiveInt(request.preheat_cnt, 'preheat count');
    const max = Number(row.max_draw_cnt);
    const divide = Number(row.divide_sec);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'preheat');
      const used = Number(state.data.counters.preheat ?? 0);
      if (Number.isSafeInteger(max) && max > 0 && used + count > max) {
        throw new GameError(5, 'Preheat count exceeds the configured maximum');
      }
      const last = Number(state.data.counters.lastPreheat ?? 0);
      if (Number.isSafeInteger(divide) && divide > 0 && last && act.at - last < divide) {
        throw new GameError(309, 'Preheat interval has not elapsed');
      }
      const costTid = Number(row.cost_tid);
      const costCount = Number(row.cost_num) * count;
      if (costTid > 0 && costCount > 0) {
        consumeResources(model, [[costTid, costCount]], 301, { codec, now: currentSeconds });
      }
      const awards = [];
      for (let step = 0; step < count; step += 1) awards.push(...awardPairs(row.award, 'Preheat'));
      const res = grant(model, awards);
      state.data.counters.preheat = used + count;
      state.data.counters.lastPreheat = act.at;
      saveState(db, roleId, act, state);
      log({ event: 'preheat_committed', actId: act.actId, count, total: used + count });
      return resReply(res);
    });
  });

  // 101002 req_preheat_award. Award tids encode <version><1000><index>
  // (1001101 = version 1, index 101); available_sec is the elapsed activity
  // time the index unlocks at.
  handlers.set(101002, data => {
    const request = codec.unpack('pb_preheat_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id);
    const tid = positiveInt(request.award_tid, 'preheat award');
    const row = actTables.preheat.Award.get(tid);
    if (!row) throw new GameError(1, 'Preheat award is not configured');
    const version = Math.floor(tid / 1000000);
    if (version !== act.version) {
      throw new GameError(1, 'Preheat award does not belong to this activity');
    }
    const elapsed = act.at - act.start;
    if (Number(row.available_sec) > elapsed) throw new GameError(309, 'Preheat award has not unlocked');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      claimKey(db, roleId, act, tid);
      const res = grant(model, awardPairs(row.award, 'Preheat award'));
      log({ event: 'preheat_award_committed', actId: act.actId, tid });
      return resReply(res);
    });
  });

  // Commands whose award depends on a progress or settlement source outside this
  // block fail closed with a named reason instead of a fixed value.
  const UNSUPPORTED = {
    79103: 'Open-server sprint server progress needs a cross-role aggregate',
    99401: 'Stock-up phase awards depend on the stock-up draw counter, which this server does not own',
    99402: 'Stock-up cycle awards depend on the stock-up draw counter, which this server does not own',
    100101: 'Festival monster operations depend on the boss fight settlement',
    102906: 'Vote server totals need a cross-role vote aggregate',
    104601: 'Five-day boss task awards depend on task progress counters',
    104602: 'Five-day boss time-pass awards depend on cleared level history',
    106203: 'Firecracker task awards depend on task progress counters',
    106205: 'Firecracker cumulative-recharge awards need the purchase ledger aggregate',
    118001: 'Anniversary banquet task awards depend on task progress counters',
    103701: 'Summer settlement preview needs the summer phase settlement data',
    103702: 'Water-gun level-up needs the summer water-gun upgrade tables outside this block',
    103703: 'Water-gun stage upgrade needs the summer water-gun upgrade tables outside this block',
    103704: 'Water-bead activation needs the summer bead upgrade tables outside this block',
    103705: 'Water-bead strengthen needs the summer bead upgrade tables outside this block',
    103706: 'Water-bead quality needs the summer bead upgrade tables outside this block',
    103707: 'Summer phase task awards depend on phase task progress counters',
    103708: 'Summer phase progress awards depend on phase progress counters',
    103709: 'Water-gun skin changes need the summer skin board',
    103710: 'Summer power reporting needs the PVP challenge state',
    103712: 'Summer standard awards depend on the water-gun standard ladder',
    103813: 'Summer standard award preview reads the water-gun standard ladder',
    103814: 'Summer settlement preview needs the phase settlement data',
    103815: 'Summer settlement needs the phase settlement data',
    103801: 'Summer PVE task awards depend on PVE task progress counters',
    103802: 'Summer PVE challenge-time purchases need the PVE challenge state',
    103803: 'Summer PVE phase awards depend on PVE phase progress counters',
    103804: 'Summer PVE award-drop selection needs the PVE fight state',
    103901: 'Summer mission settlement needs the summer mission fight result',
    103902: 'Summer mission progress awards depend on mission progress counters',
    104101: 'Summer PVP swap initialisation needs PVP matchmaking',
    104102: 'Summer PVP day tasks depend on PVP day progress counters',
    104103: 'Summer PVP phase tasks depend on PVP phase progress counters',
    104105: 'Summer PVP challenge-time purchases need the PVP challenge state',
    104106: 'Summer PVP match-time purchases need the PVP challenge state',
    104107: 'Summer PVP match-enemy purchases need PVP matchmaking',
    104108: 'Summer PVP rematch needs PVP matchmaking',
    104109: 'Summer PVP swap match purchases need PVP matchmaking',
    104110: 'Summer PVP swap fight purchases need PVP matchmaking',
    104111: 'Summer PVP lineup initialisation needs PVP matchmaking',
    104113: 'Summer special match-enemy purchases need PVP matchmaking'
  };
  for (const [type, reason] of Object.entries(UNSUPPORTED)) {
    handlers.set(Number(type), () => reject(reason));
  }

  // 102905 stores the three guessed objects; 102907 lists the local vote joiners.
  handlers.set(102905, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0] ?? etf);
    const guesses = ids.slice(1);
    if (guesses.length < 3) throw new GameError(1, 'Vote guess needs three objects');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'voteAct');
      state.data.counters.guess = guesses.slice(0, 3);
      saveState(db, roleId, act, state);
      log({ event: 'vote_guess_saved', actId: act.actId, guesses: guesses.slice(0, 3) });
      return { value: { guesses: guesses.slice(0, 3) }, data: Buffer.alloc(0) };
    });
  });
  handlers.set(102907, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const roleId = store.state().roleId;
    return store.inspect(db => {
      const state = readState(db, roleId, act.actId);
      const votes = Number(state?.data?.counters?.votes ?? 0);
      const value = { role_list: votes > 0 ? [String(roleId)] : [] };
      return { value, data: codec.pack('pb_vote_prize_back', value) };
    });
  });

  // 102903/102904 claim vote progress and task tiers against the local vote count.
  handlers.set(102903, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0] ?? etf);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, act.actId);
      const votes = Number(state?.data?.counters?.votes ?? 0);
      let awards = [];
      for (const [tid, row] of [...actTables.vote.ProgressAward].sort((left, right) => Number(left[1].cnt) - Number(right[1].cnt))) {
        if (votes < Number(row.cnt)) continue;
        const existing = db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?')
          .get(roleId, act.actId, tid, periodOf(act));
        if (existing) continue;
        db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)')
          .run(roleId, act.actId, tid, periodOf(act), new Date(currentSeconds() * 1000).toISOString());
        awards = awards.concat(awardPairs(row.award, 'Vote progress'));
      }
      if (!awards.length) throw new GameError(310, 'No vote progress tier is claimable');
      const res = grant(model, awards);
      log({ event: 'vote_progress_award_committed', actId: act.actId, votes });
      return resReply(res);
    });
  });
  handlers.set(102904, etf => {
    const ids = idList(etf);
    const act = resolve(ids[0] ?? etf);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, act.actId);
      const votes = Number(state?.data?.counters?.votes ?? 0);
      let awards = [];
      for (const [tid, row] of [...actTables.vote.Task]) {
        if (votes < Number(row.task_count)) continue;
        const existing = db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?')
          .get(roleId, act.actId, tid, periodOf(act));
        if (existing) continue;
        db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)')
          .run(roleId, act.actId, tid, periodOf(act), new Date(currentSeconds() * 1000).toISOString());
        awards = awards.concat(awardPairs(row.award, 'Vote task'));
      }
      if (!awards.length) throw new GameError(310, 'No vote task tier is claimable');
      const res = grant(model, awards);
      log({ event: 'vote_task_award_committed', actId: act.actId, votes });
      return resReply(res);
    });
  });

  // 102901/102902 blind and common vote: each vote spends the configured cost
  // item and records the choice against the local vote counter.
  function voteCommand(data, blind) {
    const request = codec.unpack('pb_vote_act_vote_req', data ?? Buffer.alloc(0));
    const group = actTables.vote.Group.get(Number(request.group_id));
    if (!group) throw new GameError(1, 'Vote group is not configured');
    const objectId = positiveInt(request.obj_id, 'vote object id');
    if (!(group.object_list ?? []).map(Number).includes(objectId)) throw new GameError(1, 'Vote object does not belong to this group');
    const version = [...actTables.vote.Version].map(([, row]) => row)[0];
    if (!version) throw new GameError(5, 'Vote version is not configured');
    const act = resolve(request.act_id ?? version.tid);
    const times = Math.max(1, Number(request.vote_times ?? 1));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'voteAct');
      const spent = consumeResources(model, [[Number(version.cost_item), Number(version.covert_item_num ?? 1) * times]], 301, { codec, now: currentSeconds });
      state.data.counters.votes = Number(state.data.counters.votes ?? 0) + times;
      if (blind) state.data.counters.blind = Number(state.data.counters.blind ?? 0) + times;
      const voteMap = { ...(state.data.counters.voteMap ?? {}) };
      voteMap[String(objectId)] = Number(voteMap[String(objectId)] ?? 0) + times;
      state.data.counters.voteMap = voteMap;
      saveState(db, roleId, act, state);
      log({ event: blind ? 'vote_blind_committed' : 'vote_common_committed', actId: act.actId, objectId, times });
      const objList = Object.entries(voteMap).map(([id, cnt]) => ({ obj_id: Number(id), cnt: String(cnt) }));
      const value = {
        role: {
          vote: {
            blind_select_times: Number(state.data.counters.blind ?? 0),
            select_times: Number(state.data.counters.votes ?? 0),
            vote_state: Buffer.alloc(0),
            obj_list: objList,
            guess_obj_list: (state.data.counters.guess ?? []).map(Number)
          },
          task: { task_state: Buffer.alloc(0) }
        },
        server: { act_id: String(act.actId), group_list: [{ group_id: Number(request.group_id), obj_list: objList }], guess_obj_list: [] },
        res: spent
      };
      return { value, data: codec.pack('pb_vote_act_back', value) };
    });
  }
  handlers.set(102901, data => voteCommand(data, true));
  handlers.set(102902, data => voteCommand(data, false));

  // 103003 req_question_act_reward_pile claims the pile tiers reached by the
  // recorded answer count.
  handlers.set(103003, data => {
    const request = codec.unpack('pb_question_reward_pile_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const pile = [...actTables.question.Pile].map(([, row]) => row)[0];
    if (!pile) throw new GameError(5, 'Question pile is not configured');
    const answerNum = positiveInt(request.answer_num, 'answer count');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      let awards = [];
      for (const [threshold, awardTid] of (pile.pile_award_list ?? []).map(pair => [Number(pair[0]), Number(pair[1])])) {
        if (answerNum < threshold) continue;
        const claimId = 900000 + awardTid;
        if (db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?')
          .get(roleId, act.actId, claimId, periodOf(act))) continue;
        db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)')
          .run(roleId, act.actId, claimId, periodOf(act), new Date(currentSeconds() * 1000).toISOString());
        awards = awards.concat(awardPairs(actTables.question.Award.get(awardTid)?.award_list, 'Question pile'));
      }
      if (!awards.length) throw new GameError(310, 'Question pile has no unclaimed tier at this answer count');
      const res = grant(model, awards);
      log({ event: 'question_pile_committed', actId: act.actId, answerNum });
      const value = { pile_reward: packUint32List(claimedIds(db, roleId, act, periodOf(act))), res };
      return { value, data: codec.pack('pb_question_reward_pile_back', value) };
    });
  });

  // 104603 reads the five-day boss ranking. A single-role store has no opponents,
  // so the rank list is the locally recorded score only.
  handlers.set(104603, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const value = { act_id: act.actId, pass_list: [] };
    return { value, data: codec.pack('pb_five_day_boss_act_server_data', value) };
  });

  // 106201 returns the local firecracker guild round counters; 106202 spends the
  // configured item and records the used count; 106204 gates the cumulative
  // award tiers on that count.
  handlers.set(106201, data => {
    const request = codec.unpack('pb_firecracker_act_guild_info_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const roleId = store.state().roleId;
    return store.inspect(db => {
      const state = readState(db, roleId, act.actId);
      const used = Number(state?.data?.counters?.used ?? 0);
      const value = { guild_info: { act_list: [{ version: act.version, round_list: [{ round: 1, fire_count: String(used), fire_list: [{ rid: String(roleId), fire_count: String(used) }] }], settle_round_list: [] }] } };
      return { value, data: codec.pack('pb_firecracker_act_guild_info_rsp', value) };
    });
  });

  function firecrackerInfo(act, state) {
    return {
      version: act.version,
      is_get_task_rewards: (state.data.claims ?? []).map(Number),
      acc_recharge_get_count: Number(state.data.counters.accRecharge ?? 0),
      acc_list: [{ round: 1, acc_award_get: (state.data.claims ?? []).map(Number) }],
      last_update_time: String(currentSeconds())
    };
  }

  handlers.set(106202, data => {
    const request = codec.unpack('pb_firecracker_act_use_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const count = positiveInt(request.use_count, 'firecracker count');
    const version = requireVersionRows(actTables.firecracker.Version, act.version, 'Firecracker')[0][1];
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'firecracker');
      const spent = consumeResources(model, [[Number(version.consume), count]], 301, { codec, now: currentSeconds });
      const granted = grant(model, awardPairs(version.consume_award, 'Firecracker use').map(([tid, num]) => [tid, num * count]));
      state.data.counters.used = Number(state.data.counters.used ?? 0) + count;
      saveState(db, roleId, act, state);
      log({ event: 'firecracker_used', actId: act.actId, count, total: state.data.counters.used });
      const value = { act_info: firecrackerInfo(act, state), res: { changes: [...spent.changes, ...granted.changes] } };
      return { value, data: codec.pack('pb_firecracker_act_use_rsp', value) };
    });
  });

  handlers.set(106204, data => {
    const request = codec.unpack('pb_firecracker_act_acc_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.activity_id);
    const requested = idList(request.acc_award_tid_list);
    if (!requested.length) throw new GameError(1, 'Firecracker award list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'firecracker');
      const used = Number(state.data.counters.used ?? 0);
      let awards = [];
      for (const tid of requested) {
        const row = actTables.firecracker.AccAward.get(tid);
        if (!row) throw new GameError(1, 'Firecracker award is not configured');
        if (used < Number(row.cond_val)) throw new GameError(309, 'Firecracker award condition is not met');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award, 'Firecracker award'));
      }
      const res = grant(model, awards);
      state.data.claims = [...new Set([...(state.data.claims ?? []), ...requested])];
      saveState(db, roleId, act, state);
      log({ event: 'firecracker_award_committed', actId: act.actId, tids: requested, used });
      const value = { act_info: firecrackerInfo(act, state), res };
      return { value, data: codec.pack('pb_firecracker_act_acc_award_rsp', value) };
    });
  });

  // 118002 claims banquet process tiers whose requirement is met by the recorded
  // progress value (tasks add progress; without task progress nothing qualifies).
  handlers.set(118002, data => {
    const request = codec.unpack('pb_anniversary_banquet_act_process_award_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_tid);
    const requested = idList(request.process_tid_list);
    if (!requested.length) throw new GameError(1, 'Banquet process list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'banquet');
      const progress = Number(state.data.counters.process ?? 0);
      let awards = [];
      for (const tid of requested) {
        const row = actTables.banquet.Process.get(tid);
        if (!row || Number(row.version) !== act.version) throw new GameError(1, 'Banquet process is not configured for this version');
        if (progress < Number(row.process_req)) throw new GameError(309, 'Banquet process requirement is not met');
        claimKey(db, roleId, act, tid);
        awards = awards.concat(awardPairs(row.award, 'Banquet process'));
      }
      const res = grant(model, awards);
      saveState(db, roleId, act, state);
      log({ event: 'banquet_process_award_committed', actId: act.actId, tids: requested, progress });
      const value = { act_info: { act_tid: act.actId, progress_value: progress, progress_award_bin: packUint32List(claimedIds(db, roleId, act, periodOf(act))) }, res };
      return { value, data: codec.pack('pb_anniversary_banquet_act_process_award_rsp', value) };
    });
  });

  // 103711 req_summer_enter records the entered summer phase; 104104 stores the
  // PVP guess; 104112 returns the local phase history.
  handlers.set(103711, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'summer');
      state.data.flags.enteredAt = currentSeconds();
      saveState(db, roleId, act, state);
      log({ event: 'summer_entered', actId: act.actId });
      return { value: { act_id: act.actId }, data: Buffer.alloc(0) };
    });
  });
  handlers.set(104104, data => {
    const request = codec.unpack('pb_summer_act_pvp_guess_req', data ?? Buffer.alloc(0));
    const act = resolve(request.act_id ?? request.act_tid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = stateOf(db, roleId, act, 'summer');
      state.data.counters.pvpGuess = Number(request.obj_id ?? request.guess_id ?? 0);
      saveState(db, roleId, act, state);
      log({ event: 'summer_pvp_guess_saved', actId: act.actId });
      const value = { act_id: String(act.actId), score: 0, challenge_times: 0, match_times: 0, enemy_list: [], win_times: 0, fight_times: 0, refresh_day: 0, max_score: 0 };
      return { value, data: codec.pack('pb_summer_act_pvp_role', value) };
    });
  });
  handlers.set(104112, etf => {
    const act = resolve(idList(etf)[0] ?? etf);
    const value = { act_tid: act.actId, item_list: [] };
    return { value, data: codec.pack('pb_summer_act_pvp_head_history', value) };
  });

  function supports(type) {
    return handlers.has(Number(type));
  }

  function execute(type, data, options = {}) {
    const handler = handlers.get(Number(type));
    if (!handler) throw new GameError(1, 'Unsupported activity command');
    return handler(options.etf !== undefined ? options.etf : data, data);
  }

  return { supports, execute, handlers, stateTable: STATE_TABLE };
}

// Commands whose request body is an Erlang term rather than protobuf.
export const ACT_REWARD_ETF_TYPES = new Set([
  79101, 79102, 90301, 98611, 98612, 98613, 99401, 99402, 99601, 99602, 99603,
  100101, 102903, 102904, 102905, 102906, 102907, 103703, 103707, 103708, 103711,
  103712, 103803, 103813, 103902, 104101, 104105, 104106, 104107, 104108, 104112,
  104113, 104402, 104603, 105101, 105250, 105301, 105303, 105305, 105307, 105308
]);
