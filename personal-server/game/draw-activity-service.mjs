import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readActivityTables, activityRows } from '../config/draw-activities-tables.mjs';

// F block (draw / lottery activities). This service owns the activity families
// whose table evidence and response schema are already recovered: the turntable
// spin, the capsule-toy draw series and the three-admonition draw counter.
// Table dumps come from tools/extract-draw-activity-tables.mjs; see
// agent/workflow/gameplay-completion/BLOCK-F/implementation.md for the remaining
// families and the evidence that still blocks them.
export const DRAW_ACTIVITY_COMMANDS = Object.freeze({
  turntableGo: 107901,
  capsuleToyDraw: 102301,
  capsuleToyExchange: 102302,
  capsuleToyCollect: 102303,
  capsuleToyProgress: 102304,
  admonitionAddDrawCount: 88965
});

// Only the families with a recovered price, pool and response payload are
// dispatched. The other F-block commands keep the gateway's
// LOCAL_NOT_IMPLEMENTED answer until their evidence lands; see the delivery
// record for the per-family reasons.
const IMPLEMENTED = Object.freeze([
  DRAW_ACTIVITY_COMMANDS.turntableGo,
  DRAW_ACTIVITY_COMMANDS.capsuleToyDraw,
  DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount
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

function fail(code, message) {
  throw new GameError(code, message);
}

function intOf(value, label, { min = 1 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) fail(1, 'Invalid ' + label);
  return number;
}

function jsonObject(text) {
  try {
    const parsed = JSON.parse(text || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : {};
  } catch {
    return {};
  }
}

function pairList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(entry => Array.isArray(entry) && entry.length >= 2)
    .map(entry => [Number(entry[0]), Number(entry[1])])
    .filter(([item, count]) => Number.isSafeInteger(item) && item > 0 && Number(count) > 0);
}

function firstRow(table) {
  if (table instanceof Map) {
    const rows = [...table.values()];
    return rows[0] ?? null;
  }
  return Array.isArray(table) ? table[0] ?? null : null;
}

export function createDrawActivityService({
  store,
  codec,
  tables,
  activityTables = name => readActivityTables(name),
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Draw activity store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function seconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(5, 'Draw activity clock is invalid');
    return Math.floor(value / 1000);
  }

  function iso(at) {
    return new Date(at * 1000).toISOString();
  }

  function stateOf(db, roleId, module, version, at) {
    const row = db.prepare('SELECT * FROM draw_activity_state WHERE role_id=? AND module=? AND version=?')
      .get(roleId, module, version);
    if (row) {
      return {
        counters: jsonObject(row.counters_json),
        claims: jsonObject(row.claims_json),
        selections: jsonObject(row.selections_json),
        created_at: row.created_at
      };
    }
    return { counters: {}, claims: {}, selections: {}, created_at: iso(at) };
  }

  function saveState(db, roleId, module, version, state, at) {
    db.prepare(`INSERT INTO draw_activity_state
      (role_id,module,version,counters_json,claims_json,selections_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id,module,version) DO UPDATE SET
        counters_json=excluded.counters_json,
        claims_json=excluded.claims_json,
        selections_json=excluded.selections_json,
        updated_at=excluded.updated_at`).run(
      Number(roleId), module, Number(version),
      JSON.stringify(state.counters), JSON.stringify(state.claims), JSON.stringify(state.selections),
      state.created_at, iso(at)
    );
  }

  function recordLog(db, roleId, module, version, kind, payload, at) {
    db.prepare('INSERT INTO draw_activity_logs (role_id,module,version,kind,payload_json,created_at) VALUES (?,?,?,?,?,?)')
      .run(Number(roleId), module, Number(version), kind, JSON.stringify(payload), iso(at));
  }

  function counter(state, key) {
    return Number(state.counters[key] ?? 0) || 0;
  }

  function bump(state, key, delta) {
    state.counters[key] = counter(state, key) + delta;
    return state.counters[key];
  }

  function weightedPick(rows, weightOf) {
    const entries = rows.map(row => ({ row, weight: Number(weightOf(row)) || 0 })).filter(entry => entry.weight > 0);
    if (!entries.length) fail(5, 'Draw activity pool has no weighted awards');
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0)) * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return entry.row;
    }
    return entries[entries.length - 1].row;
  }

  // TurntableActCmd 107901. Ver.use_item is the spin price, Award rows carry the
  // weight and the prize, and min_num marks the accumulated spins that unlock
  // the "big" slot.
  function turntableGo() {
    const activity = activityTables('TurntableActTable');
    const version = firstRow(activityRows(activity, 'Ver'));
    if (!version) fail(5, 'Turntable activity version is not configured');
    const cost = pairList(version.use_item);
    if (!cost.length) fail(5, 'Turntable activity price is not configured');
    const awards = [...activityRows(activity, 'Award').values()]
      .filter(row => Number(row.version) === Number(version.tid))
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!awards.length) fail(5, 'Turntable activity awards are not configured');
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateOf(db, roleId, 'turntable', version.tid, at);
      const spent = consumeResources(model, cost, 301);
      const spins = bump(state, 'spins', 1);
      const pool = awards.filter(row => Number(row.min_num) <= spins);
      const row = weightedPick(pool.length ? pool : awards, entry => entry.weight);
      const granted = grantResources(model, pairList(row.award), tables);
      const changes = [...spent.changes, ...granted.changes];
      saveState(db, roleId, 'turntable', version.tid, state, at);
      recordLog(db, roleId, 'turntable', version.tid, 'go', { draw_tid: Number(row.tid), spin: spins }, at);
      const value = {
        res: { changes, is_overflow: false },
        draw_tid: String(row.tid),
        act_data: { spins: String(spins), draw_tid: String(row.tid) }
      };
      return { value, data: codec.pack('pb_turntable_act_go_back', value), drawTid: Number(row.tid) };
    });
    result.valueForLog = { module: 'turntable', drawTid: result.drawTid };
    return result;
  }

  // CapsuleToyCmd 102301. Const.draw_cost_item/draw_cost_num price one draw and
  // PoolOutput rows map a pool to the toy it hands out, weighted by row num.
  function capsuleDraw() {
    const activity = activityTables('CapsuleToyTable');
    const config = firstRow(activityRows(activity, 'Const'));
    const version = firstRow(activityRows(activity, 'Version'));
    if (!config || !version) fail(5, 'Capsule toy configuration is missing');
    const costItem = intOf(config.draw_cost_item, 'capsule toy draw item');
    const costNum = intOf(config.draw_cost_num, 'capsule toy draw cost');
    const pools = Array.isArray(version.pool) ? version.pool.map(Number) : [];
    const outputs = [...activityRows(activity, 'PoolOutput').values()]
      .filter(row => pools.includes(Number(row.pool)))
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!outputs.length) fail(5, 'Capsule toy pool outputs are not configured');
    const limit = Number(config.draw_limit_num) || 0;
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateOf(db, roleId, 'capsule_toy', version.tid, at);
      const drawn = counter(state, 'draw_count');
      if (limit > 0 && drawn >= limit) fail(311, 'Capsule toy draw limit is reached');
      const spent = consumeResources(model, [[costItem, costNum]], 301);
      const row = weightedPick(outputs, entry => entry.num);
      const toy = intOf(row.toy, 'capsule toy reward');
      const count = Math.max(1, Number(row.num) || 1);
      const granted = grantResources(model, [[toy, count]], tables);
      const total = bump(state, 'draw_count', 1);
      const changes = [...spent.changes, ...granted.changes];
      saveState(db, roleId, 'capsule_toy', version.tid, state, at);
      recordLog(db, roleId, 'capsule_toy', version.tid, 'draw', { toy, count, total }, at);
      const value = {
        res: { changes, is_overflow: false },
        draw_count: String(total),
        day_hit_count: String(counter(state, 'day_hit_count')),
        draw_list: [{ toy: String(toy), num: String(count) }]
      };
      return { value, data: codec.pack('pb_capsule_toy_draw_back', value), toy, total };
    });
    result.valueForLog = { module: 'capsule_toy', toy: result.toy, total: result.total };
    return result;
  }

  // ThreeAdmonitionCmd 88965: paying the activity's extra-draw item adds draw
  // attempts. Const.cost_item/cost_item_num own the price per attempt.
  function admonitionAddDrawCount(request) {
    const activity = activityTables('ThreeAdmonitionTable');
    const config = firstRow(activityRows(activity, 'Const'));
    if (!config) fail(5, 'Three admonition configuration is missing');
    const times = intOf(request?.times ?? 1, 'three admonition draw count');
    const costItem = intOf(config.cost_item, 'three admonition cost item');
    const costNum = intOf(config.cost_item_num, 'three admonition cost');
    const max = Number(config.max_draw_count) || 0;
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateOf(db, roleId, 'three_admonition', 1, at);
      const current = counter(state, 'draw_count');
      if (max > 0 && current + times > max) fail(311, 'Three admonition draw count limit is reached');
      const spent = consumeResources(model, [[costItem, costNum * times]], 301);
      const total = bump(state, 'draw_count', times);
      saveState(db, roleId, 'three_admonition', 1, state, at);
      recordLog(db, roleId, 'three_admonition', 1, 'add_draw_count', { times, total }, at);
      const value = { changes: spent.changes, is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value), total };
    });
    result.valueForLog = { module: 'three_admonition', total: result.total };
    return result;
  }

  function execute(type, request) {
    switch (Number(type)) {
      case DRAW_ACTIVITY_COMMANDS.turntableGo: return turntableGo(request);
      case DRAW_ACTIVITY_COMMANDS.capsuleToyDraw: return capsuleDraw(request);
      case DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount: return admonitionAddDrawCount(request);
      default: return fail(1, 'Unknown draw activity command ' + type);
    }
  }

  return {
    supports: type => IMPLEMENTED.includes(Number(type)),
    execute,
    commands: DRAW_ACTIVITY_COMMANDS,
    stateOf: (roleId, module, version) => store.inspect(db => stateOf(db, roleId, module, version, seconds()))
  };
}

