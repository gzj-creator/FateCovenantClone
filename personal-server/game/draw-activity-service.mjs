import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readActivityTables, activityRows } from '../config/draw-activities-tables.mjs';
import { createDrawFamilies } from './draw-activity-families.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { encodeModuleLoginBlock } from './relic-divine-login.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';

// F block draw/lottery activities. Each family owns command decoding and table
// rules; this module provides one transaction, persistent state and resource
// boundary. Commands absent from `families.handlers` retain the gateway's
// explicit LOCAL_NOT_IMPLEMENTED response instead of returning an empty success.
export const DRAW_ACTIVITY_COMMANDS = Object.freeze({
  magicChooseHero: 60002, magicAchieveAward: 60003, magicHeroStarAward: 60004,
  pinBallAward: 88921, fantasyEquipReset: 88925, fantasyEquipPlay: 88926,
  pyramidDraw: 88941, pyramidTask: 88942,
  admonitionDraw: 88961, admonitionBoxAward: 88962,
  admonitionAddDrawCount: 88965, admonitionEnter: 88966,
  hundredBonusRandom: 89401, hundredBonusAward: 89402, hundredBonusLog: 89403,
  chessDraw: 91901, chessTask: 91902, chessChooseAward: 91903,
  chessNewTurn: 91904, chessExchange: 91905, chessTurnAward: 91906,
  raffleAchievement: 92101, heroBlazonDraw: 92201,
  lotteryActDraw: 92301, lotteryActLog: 92302,
  mysteryWishExchange: 93001, lotteryUse: 93101, lotteryExpire: 93102,
  flipCardTurn: 97201, flipCardDraw: 97301,
  ticketDrawAward: 97501, ticketDrawHistory: 97502,
  fruitDrawBig: 97901, fruitDraw: 97902, chooseWish: 98101,
  elvesMain: 100901, elvesFruitAct: 100902, elvesDrawAward: 100903,
  capsuleToyDraw: 102301, capsuleToyExchange: 102302,
  capsuleToyCollect: 102303, capsuleToyProgress: 102304,
  chessRevertTurnAward: 102401, chessRevertSelectGift: 102402, chessRevertNextTurn: 102403,
  puzzleDraw: 103301, puzzleAward: 103302, puzzleChangeTurn: 103303,
  puzzleTaskAward: 103304, puzzleSelectAward: 103305,
  hoardSetPool: 103501, hoardTask: 103502, hoardPile: 103503,
  thousandDraw: 104501, thousandAward: 104502,
  praySelect: 104901, prayDraw: 104902,
  cashbackDraw: 105501, cashbackGetTimes: 105502,
  cashbackServerAward: 105503, cashbackServerProgress: 105504,
  turntableGo: 107901,
  flopDraw: 109101, flopClaim: 109102, flopTotalClaim: 109103
});

// Commands whose request is a bare ETF value. Every other registered command
// carries a protobuf message in request.data and must not pass through the ETF
// decoder in the gateway.
export const DRAW_ACTIVITY_ETF_COMMANDS = new Set([
  60002, 60003, 60004, 88921, 88925, 88941, 88942,
  88961, 88962, 88965, 88966, 89401, 89402, 89403,
  91902, 91903, 92101, 92301, 92302, 93001, 93102,
  97501, 97502, 97901, 97902, 100901, 100902,
  102301, 102303, 102304, 103302, 103303, 103305, 107901
]);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS draw_activity_state (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  module TEXT NOT NULL,
  version INTEGER NOT NULL,
  counters_json TEXT NOT NULL DEFAULT '{}',
  claims_json TEXT NOT NULL DEFAULT '{}',
  selections_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, module, version)
);
CREATE TABLE IF NOT EXISTS draw_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  module TEXT NOT NULL,
  version INTEGER NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS draw_activity_logs_module_idx
  ON draw_activity_logs(role_id, module, version, id);
`;

export function jsonObject(text) {
  try {
    const parsed = JSON.parse(text || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : {};
  } catch { return {}; }
}

export function pairList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(entry => Array.isArray(entry) && entry.length >= 2)
    .map(entry => [Number(entry[0]), Number(entry[1])])
    .filter(([item, count]) => Number.isSafeInteger(item) && item > 0 && Number(count) > 0);
}

export function firstRow(table) {
  if (table instanceof Map) return [...table.values()][0] ?? null;
  return Array.isArray(table) ? table[0] ?? null : null;
}

export function rowsOf(table) {
  if (table instanceof Map) return [...table.values()];
  return Array.isArray(table) ? [...table] : [];
}

export function createDrawActivityService({
  store, codec, tables, activityTables = name => readActivityTables(name),
  now = Date.now, random = Math.random, logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Draw activity store is unavailable');
  if (!codec?.pack || !codec?.unpack) throw new Error('Draw activity codec is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));
  const fail = (code, message) => { throw new GameError(code, message); };
  const intOf = (value, label, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, 'Invalid ' + label);
    return number;
  };
  const seconds = () => {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(5, 'Draw activity clock is invalid');
    return Math.floor(value / 1000);
  };
  const iso = at => new Date(at * 1000).toISOString();

  function stateFromRow(row, at) {
    return row ? {
      counters: jsonObject(row.counters_json), claims: jsonObject(row.claims_json),
      selections: jsonObject(row.selections_json), created_at: row.created_at
    } : { counters: {}, claims: {}, selections: {}, created_at: iso(at) };
  }

  function stateOf(db, roleId, module, version, at) {
    const row = db.prepare('SELECT * FROM draw_activity_state WHERE role_id=? AND module=? AND version=?').get(roleId, module, version);
    return stateFromRow(row, at);
  }

  function saveState(db, roleId, module, version, state, at) {
    db.prepare(`INSERT INTO draw_activity_state
      (role_id,module,version,counters_json,claims_json,selections_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(role_id,module,version) DO UPDATE SET
      counters_json=excluded.counters_json, claims_json=excluded.claims_json,
      selections_json=excluded.selections_json, updated_at=excluded.updated_at`).run(
      Number(roleId), String(module), Number(version), JSON.stringify(state.counters),
      JSON.stringify(state.claims), JSON.stringify(state.selections), state.created_at, iso(at));
  }

  function recordLog(db, roleId, module, version, kind, payload, at) {
    db.prepare('INSERT INTO draw_activity_logs (role_id,module,version,kind,payload_json,created_at) VALUES (?,?,?,?,?,?)')
      .run(Number(roleId), String(module), Number(version), String(kind), JSON.stringify(payload), iso(at));
  }

  const counter = (state, key) => Number(state.counters[key] ?? 0) || 0;
  const bump = (state, key, delta = 1) => {
    state.counters[key] = counter(state, key) + delta;
    return state.counters[key];
  };
  const claimed = (state, key, id) => Array.isArray(state.claims[key]) && state.claims[key].map(Number).includes(Number(id));
  const markClaimed = (state, key, id) => {
    if (claimed(state, key, id)) fail(310, 'Draw activity reward is already claimed');
    state.claims[key] = [...(Array.isArray(state.claims[key]) ? state.claims[key] : []), Number(id)];
  };

  function weightedPick(rows, weightOf) {
    const entries = rows.map(row => ({ row, weight: Number(weightOf(row)) || 0 })).filter(entry => entry.weight > 0);
    if (!entries.length) fail(5, 'Draw activity pool has no weighted awards');
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0)) * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return entry.row;
    }
    return entries.at(-1).row;
  }

  function drawFromLib(libId, times = 1) {
    const drawTables = activityTables('DrawTable');
    const lib = activityRows(drawTables, 'LibWeight').get(Number(libId));
    if (!lib) fail(5, `DrawTable lib ${libId} is missing`);
    const groupTable = activityRows(drawTables, 'Group');
    const itemTable = activityRows(drawTables, 'Item');
    const groups = (Array.isArray(lib.weight_group) ? lib.weight_group : [])
      .filter(entry => Array.isArray(entry) && entry.length >= 2 && Number(entry[0]) > 0);
    if (!groups.length) fail(5, `DrawTable lib ${libId} has no weighted groups`);
    const awards = [], groupIds = [];
    for (let index = 0; index < times; index++) {
      const picked = weightedPick(groups, entry => entry[0]);
      const groupId = Number(picked[1]);
      const rawRanges = groupTable.get(groupId)?.lib_range;
      const ranges = (Array.isArray(rawRanges) ? rawRanges : [])
        .filter(entry => Array.isArray(entry) && entry.length >= 3 && Number(entry[0]) > 0);
      if (!ranges.length) fail(5, `DrawTable group ${groupId} has no awards`);
      const range = weightedPick(ranges, entry => entry[0]);
      let itemTid = Number(range[1]), num = Number(range[2]);
      const item = itemTable.get(itemTid);
      if (item) { itemTid = Number(item.res); num *= Math.max(1, Number(item.num) || 1); }
      if (!Number.isSafeInteger(itemTid) || itemTid <= 0 || !Number.isSafeInteger(num) || num <= 0) {
        fail(5, `DrawTable group ${groupId} has an invalid award`);
      }
      awards.push([itemTid, num]); groupIds.push(groupId);
    }
    return { awards, groupIds, libTid: Number(libId) };
  }

  function tx(module, version, callback) {
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateOf(db, roleId, module, version, at);
      const value = callback({ model, db, roleId, state, at, module, version });
      saveState(db, roleId, module, version, state, at);
      return value;
    });
    if (result?.value) result.valueForLog ??= { module, version };
    return result;
  }

  const rewardValue = changes => ({ changes, is_overflow: false });
  const decode = (schema, bytes) => {
    try { return codec.unpack(schema, bytes ?? Buffer.alloc(0)); }
    catch { fail(1, 'Invalid draw activity request'); }
  };
  function etfNumber(request, fallback) {
    let value = request?.etf;
    if (value && typeof value === 'object') value = value.value ?? value;
    if (Array.isArray(value)) value = value.length === 1 ? value[0] : value;
    if (value === undefined || value === null || value === '') return fallback;
    return Number(value);
  }
  function etfArray(request) {
    let value = request?.etf;
    if (value && typeof value === 'object') value = value.value ?? value;
    return Array.isArray(value) ? value.map(Number) : [];
  }

  const engine = {
    store, codec, tables, fail, intOf, seconds, stateOf, recordLog, counter, bump,
    claimed, markClaimed, weightedPick, drawFromLib, tx, rewardValue, decode,
    etfNumber, etfArray, random, log, activityTables
  };
  const families = createDrawFamilies(engine);
  function execute(type, request = {}) {
    const handler = families.handlers.get(Number(type));
    if (!handler) return fail(5, 'Draw activity family is not implemented');
    const result = handler(request);
    result.valueForLog ??= { module: families.modules.get(Number(type)), type: Number(type) };
    return result;
  }

  // Pray login data is carried by ActFrame module 183 rather than by the
  // activity row embedded in module 92. Rebuild the client's pb_pray_act block
  // from the authoritative draw_activity_state rows, but only for activities
  // that are already present in the login container. This restores selection,
  // draw count, progress and award history after relogin while leaving inactive
  // or unconfigured activities untouched.
  function synchronizeLogin(activity, module183Entry = null, at = seconds()) {
    const roleId = store.state().roleId;
    const stateRows = store.inspect(db => db.prepare(`
      SELECT * FROM draw_activity_state
      WHERE role_id=? AND module='pray_act' ORDER BY version
    `).all(roleId)).map(row => ({
      ...stateFromRow(row, at), version: Number(row.version)
    }));
    if (!stateRows.length) return { activityIds: [], loginActivities: [] };

    const stateByVersion = new Map(stateRows.map(row => [row.version, row]));
    const candidates = new Map();
    const addCandidate = (actIdValue, startValue, endValue, module92Row = null) => {
      const actId = Number(actIdValue);
      if (!Number.isSafeInteger(actId) || actId < 1) fail(5, 'Invalid pray login activity id');
      const frame = tables.ActFrameAct?.get(actId);
      if (!frame || Number(frame.type) !== 183) return;
      const version = Number(frame.version);
      const state = stateByVersion.get(version);
      if (!state) return;
      let candidate = candidates.get(actId);
      if (!candidate) {
        candidate = { actId, frame, version, state, start: null, end: null, module92Rows: [] };
        candidates.set(actId, candidate);
      }
      const start = Number(startValue), end = Number(endValue);
      if (candidate.start === null && Number.isSafeInteger(start) && start >= 0) candidate.start = start;
      if (candidate.end === null && Number.isSafeInteger(end) && end > 0) candidate.end = end;
      if (module92Row && !candidate.module92Rows.includes(module92Row)) {
        candidate.module92Rows.push(module92Row);
      }
    };

    if (module183Entry != null) {
      if (!Array.isArray(module183Entry.value)) fail(5, 'Pray module-183 login entry is invalid');
      let values;
      try { values = module183Entry.value.map(rawBinary); }
      catch { fail(5, 'Pray module-183 login entry is invalid'); }
      if (values[0]?.length) {
        let player;
        try { player = codec.unpack('pb_act_role_login', values[0]); }
        catch { fail(5, 'Pray module-183 player payload is invalid'); }
        for (const row of player.data_list ?? []) {
          addCandidate(
            row?.act_stage?.act_id,
            row?.act_stage?.start_time,
            row?.act_stage?.end_time
          );
        }
      }
    }

    if (activity && typeof activity === 'object') {
      for (const row of activity.act_list ?? []) {
        addCandidate(row?.state_data?.act_id, null, null, row);
      }
      for (const group of activity.act_parallel_list ?? []) {
        for (const row of group?.states_data ?? []) addCandidate(row?.act_id, null, null, row);
      }
    }

    const loginActivities = [];
    const synced = [];
    for (const candidate of [...candidates.values()].sort((left, right) => left.actId - right.actId)) {
      const payload = families.prayLoginPayload(candidate.actId, candidate.state);
      const wrapped = encodeModuleLoginBlock(payload).toString('base64');
      for (const row of candidate.module92Rows) row.module_login_data = wrapped;

      const window = activityWindow(candidate.frame, Number(store.serverOpenedAt));
      let start = candidate.start;
      let end = candidate.end;
      if (start === null) start = Number(window?.start);
      if (!Number.isSafeInteger(start) || start < 0) start = Math.max(0, Number(at));
      if (end === null) end = Number(window?.end);
      if (!Number.isSafeInteger(end) || end <= start) end = start + 86400;
      loginActivities.push({ actTid: candidate.actId, startTime: start, endTime: end, blocks: [payload] });
      synced.push({ actId: candidate.actId, version: candidate.version });
    }
    if (synced.length) {
      log({ event: 'draw_activity_pray_login_synchronized', activities: synced });
    }
    return { activityIds: synced.map(row => row.actId), loginActivities };
  }
  return {
    supports: type => families.handlers.has(Number(type)), execute,
    commands: DRAW_ACTIVITY_COMMANDS, families: families.modules,
    stateOf: (roleId, module, version) => store.inspect(db => stateOf(db, roleId, module, version, seconds())),
    synchronizeLogin
  };
}
