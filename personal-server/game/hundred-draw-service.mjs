import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readHundredDrawTables, readHundredRoleTables } from '../config/hundred-draw-tables.mjs';

// HundredDrawActCmd (117001-117005). The table dump was recovered from
// HundredDrawActTable.data.lua (LuaJIT bytecode) and keeps the client's
// straight-line constructor shape. See agent/workflow/gameplay-completion/
// DRAW-HUNDREDDRAWACT/implementation.md for the source hashes and evidence.
export const HUNDRED_DRAW_COMMANDS = Object.freeze({
  draw: 117001,
  processAward: 117002,
  selectAward: 117003,
  starAward: 117004,
  marquee: 117005
});

const ACT_TYPE = 1102;
const RUNNING_STATE_ID = 50;
const AWARD_COMMON_ITEM = 101;
const AWARD_ONTOLOGY = 102;
const AWARD_ONTOLOGY_CHIP = 103;
const AWARD_ONTOLOGY_SKILL = 104;
const AWARD_ONTOLOGY_HEAD = 105;
const AWARD_ONTOLOGY_SKIN = 106;
const POOL_TYPE_DEVOLVE = 102;
const MAX_DRAW_TIMES = 100;
const MAX_MARQUEE_RANGE = 200;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS hundred_draw_act_state (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  act_id INTEGER NOT NULL,
  cumulative_draw_times TEXT NOT NULL DEFAULT '0',
  guarantee_times TEXT NOT NULL DEFAULT '0',
  select_target_tid INTEGER NOT NULL DEFAULT 0,
  received_process_tid_list_json TEXT NOT NULL DEFAULT '[]',
  received_star_tid_list_json TEXT NOT NULL DEFAULT '[]',
  draw_target_time INTEGER NOT NULL DEFAULT 0,
  ten_target_times INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, act_id)
);
CREATE TABLE IF NOT EXISTS hundred_draw_marquees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  act_id INTEGER NOT NULL,
  type INTEGER NOT NULL,
  num INTEGER NOT NULL,
  target_tid INTEGER NOT NULL,
  trigger_time INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hundred_draw_marquees_act_idx
  ON hundred_draw_marquees(act_id, id);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function intOf(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(1, 'Invalid ' + label);
  return number;
}

function listOf(value) {
  if (!Array.isArray(value)) fail(1, 'Invalid hundred-draw tid list');
  const ids = [...new Set(value.map(Number))];
  if (!ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    fail(1, 'Invalid hundred-draw tid list');
  }
  return ids;
}

function jsonList(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isSafeInteger) : [];
  } catch {
    return [];
  }
}

function clampSample(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(0.999999999, number));
}

export function createHundredDrawService({
  store,
  codec,
  tables,
  roleTables = readHundredRoleTables(),
  hundredTables = readHundredDrawTables(),
  calendar = null,
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Hundred draw store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function seconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(5, 'Hundred draw clock is invalid');
    return Math.floor(value / 1000);
  }

  function iso(at) {
    return new Date(at * 1000).toISOString();
  }

  function configuration(actId) {
    const id = intOf(actId, 'hundred-draw activity id');
    const act = tables?.ActFrameAct?.get(id);
    if (!act || Number(act.type) !== ACT_TYPE) fail(1, 'Unknown hundred-draw activity');
    const version = hundredTables.Version?.get(Number(act.version));
    if (!version) fail(5, 'Hundred-draw activity version is not configured');
    const pool = hundredTables.Pool?.get(Number(version.pool));
    if (!pool) fail(5, 'Hundred-draw pool is not configured');
    return { act, version, pool };
  }

  function assertRunning(actId) {
    if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, null, seconds())) {
      fail(5, 'Hundred-draw activity is not running');
    }
  }

  function stateRow(db, roleId, actId, at) {
    const row = db.prepare('SELECT * FROM hundred_draw_act_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (row) return { ...row };
    const stamp = iso(at);
    return {
      role_id: Number(roleId), act_id: Number(actId), cumulative_draw_times: '0',
      guarantee_times: '0', select_target_tid: 0, received_process_tid_list_json: '[]',
      received_star_tid_list_json: '[]', draw_target_time: 0, ten_target_times: 0,
      created_at: stamp, updated_at: stamp
    };
  }

  function saveState(db, state, at) {
    db.prepare(`INSERT INTO hundred_draw_act_state (
      role_id,act_id,cumulative_draw_times,guarantee_times,select_target_tid,
      received_process_tid_list_json,received_star_tid_list_json,draw_target_time,
      ten_target_times,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      cumulative_draw_times=excluded.cumulative_draw_times,
      guarantee_times=excluded.guarantee_times,
      select_target_tid=excluded.select_target_tid,
      received_process_tid_list_json=excluded.received_process_tid_list_json,
      received_star_tid_list_json=excluded.received_star_tid_list_json,
      draw_target_time=excluded.draw_target_time,
      ten_target_times=excluded.ten_target_times,
      updated_at=excluded.updated_at`).run(
      Number(state.role_id), Number(state.act_id), String(state.cumulative_draw_times),
      String(state.guarantee_times), Number(state.select_target_tid),
      state.received_process_tid_list_json, state.received_star_tid_list_json,
      Number(state.draw_target_time), Number(state.ten_target_times), state.created_at, iso(at)
    );
  }

  function targetTid(version, state) {
    const targets = Array.isArray(version.target) ? version.target.map(Number) : [];
    const selected = Number(state?.select_target_tid ?? 0);
    if (selected > 0 && targets.includes(selected)) return selected;
    return targets[0] ?? 0;
  }

  function actData(state) {
    return {
      act_id: String(state.act_id),
      received_process_tid_list: jsonList(state.received_process_tid_list_json).map(String),
      cumulative_draw_times: String(state.cumulative_draw_times),
      select_target_tid: String(state.select_target_tid ?? 0),
      guarantee_times: String(state.guarantee_times ?? 0),
      received_star_tid_list: jsonList(state.received_star_tid_list_json).map(String),
      draw_target_time: String(state.draw_target_time ?? 0),
      ten_target_times: String(state.ten_target_times ?? 0)
    };
  }

  function targetRow(config, target) {
    if (!target) return null;
    const theme = Number(config.pool.theme_type);
    if (theme === 101) return tables.Hero?.get(target) ?? null;
    if (theme === 102) return tables.Pet?.get(target) ?? null;
    if (theme === 103) return tables.FantasyEquip?.get(target) ?? null;
    return null;
  }

  function chipFor(config, target) {
    const theme = Number(config.pool.theme_type);
    if (theme === 101) {
      const chip = Number(targetRow(config, target)?.chip ?? 0);
      if (chip > 0) return chip;
    }
    // FantasyChipByTid keys are the equipment tids in the shipped table, but no
    // recovered mapping links a fantasy target to its chip. Do not invent one.
    fail(5, 'Hundred-draw target chip mapping is not recovered for theme ' + theme);
  }

  function headFor(config, target) {
    const theme = Number(config.pool.theme_type);
    if (theme !== 101) fail(5, 'Hundred-draw target head mapping is not recovered for theme ' + theme);
    const style = Number(targetRow(config, target)?.style ?? 0);
    if (!style) fail(5, 'Hundred-draw target style is missing');
    const rows = [...(roleTables.FigureHead?.values() ?? [])]
      .filter(row => Number(row.style) === style)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!rows.length) fail(5, 'Hundred-draw target head is not configured');
    return Number(rows[0].tid);
  }

  function skinFor(config, target) {
    const row = hundredTables.TargetShow?.get(target);
    const skin = Number(row?.target_skin ?? 0);
    if (!skin) fail(5, 'Hundred-draw target skin is not configured');
    return skin;
  }

  function resolveAward(part, config, target) {
    const type = Number(part.type);
    const amount = Number(part.num ?? 0);
    if (type === AWARD_COMMON_ITEM) {
      const item = Number(part.item ?? 0);
      if (item <= 0 || amount <= 0) fail(5, 'Hundred-draw common award is invalid');
      return [[item, amount]];
    }
    if (type === AWARD_ONTOLOGY) {
      if (!target) fail(5, 'Hundred-draw ontology target is missing');
      return [[target, amount > 0 ? amount : 1]];
    }
    if (type === AWARD_ONTOLOGY_CHIP) return [[chipFor(config, target), amount > 0 ? amount : 1]];
    if (type === AWARD_ONTOLOGY_SKILL) {
      const item = Number(part.item ?? 0);
      if (item > 0 && amount > 0) return [[item, amount]];
      // RelicTable.SpHero is the remaining source named by HundredDrawActUtil;
      // that table is not part of the shipped server asset set yet.
      fail(5, 'Hundred-draw ontology skill reward mapping is not recovered');
    }
    if (type === AWARD_ONTOLOGY_HEAD) return [[headFor(config, target), amount > 0 ? amount : 1]];
    if (type === AWARD_ONTOLOGY_SKIN) return [[skinFor(config, target), amount > 0 ? amount : 1]];
    fail(5, 'Unknown hundred-draw award type ' + type);
  }

  function awardParts(row) {
    const result = [];
    if (row.award_type != null) result.push({ type: row.award_type, item: row.award_item, num: row.award_num });
    if (row.award_type1 != null && Number(row.award_type1) > 0) {
      result.push({ type: row.award_type1, item: row.award1, num: row.num1 });
    }
    if (row.award_type2 != null && Number(row.award_type2) > 0) {
      result.push({ type: row.award_type2, item: row.award2, num: row.num2 });
    }
    if (row.award_type3 != null && Number(row.award_type3) > 0) {
      result.push({ type: row.award_type3, item: row.award3, num: row.num3 });
    }
    return result;
  }

  function awardsForParts(parts, config, target) {
    const awards = [];
    for (const part of parts) awards.push(...resolveAward(part, config, target));
    return awards;
  }

  function poolAwardRows(pool) {
    return [...(hundredTables.PoolAward?.values() ?? [])]
      .filter(row => Number(row.belong_version) === Number(pool.pool_award_lib))
      .filter(row => Number(row.probability_num) > 0 || Number(row.weight) > 0)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function pickWeighted(rows) {
    const weights = rows.map(row => ({ row, weight: Number(row.probability_num) > 0 ? Number(row.probability_num) : Number(row.weight) }));
    const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
    if (!(total > 0)) fail(5, 'Hundred-draw pool has no awards');
    let roll = clampSample(random()) * total;
    for (const entry of weights) {
      roll -= entry.weight;
      if (roll < 0) return entry.row;
    }
    return weights[weights.length - 1].row;
  }

  function recordMarquee(db, roleId, actId, type, num, target, at) {
    db.prepare(`INSERT INTO hundred_draw_marquees
      (role_id,act_id,type,num,target_tid,trigger_time,created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(roleId, actId, type, num, target, at, iso(at));
  }

  function drawCommand(request) {
    const actId = intOf(request.act_id, 'hundred-draw activity id');
    const times = Number(request.times);
    if (!Number.isSafeInteger(times) || times < 1 || times > MAX_DRAW_TIMES) fail(1, 'Invalid hundred-draw times');
    const config = configuration(actId);
    assertRunning(actId);
    const drawItem = Number(config.pool.draw_item);
    if (!Number.isSafeInteger(drawItem) || drawItem <= 0) fail(5, 'Hundred-draw item is not configured');
    const rows = poolAwardRows(config.pool);
    if (!rows.length) fail(5, 'Hundred-draw pool has no award rows');
    const ontology = rows.filter(row => Number(row.award_type) === AWARD_ONTOLOGY);
    const guaranteeTotal = Number(config.pool.guarantee_total_draw_times) || 0;
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, actId, at);
      const target = targetTid(config.version, state);
      const spent = consumeResources(model, [[drawItem, times]], 301);
      const awards = [];
      let drawn = 0;
      for (let index = 0; index < times; index++) {
        const currentGuarantee = Number(state.guarantee_times) || 0;
        const mustGuarantee = guaranteeTotal > 0 && currentGuarantee + 1 >= guaranteeTotal && ontology.length > 0;
        const row = mustGuarantee ? ontology[0] : pickWeighted(rows);
        awards.push(...awardsForParts(awardParts(row), config, target));
        const ontologyHit = Number(row.award_type) === AWARD_ONTOLOGY;
        state.cumulative_draw_times = String(Number(state.cumulative_draw_times) + 1);
        state.guarantee_times = ontologyHit ? '0' : String(currentGuarantee + 1);
        if (ontologyHit) {
          state.draw_target_time = at;
          recordMarquee(db, roleId, actId, 101, Number(row.award_num) || 1, target, at);
        }
        drawn += 1;
      }
      const granted = grantResources(model, awards, tables);
      saveState(db, state, at);
      const changes = [...spent.changes, ...granted.changes];
      const value = { act_data: actData(state), res: { changes, is_overflow: false } };
      return { value, data: codec.pack('pb_hundred_act_draw_rsp', value), drawn, changes: changes.length };
    });
    result.valueForLog = { actId, times, drawn: result.drawn, changes: result.changes };
    return result;
  }

  function processAwardCommand(request) {
    const actId = intOf(request.act_id, 'hundred-draw activity id');
    const tids = listOf(request.tid_list);
    const config = configuration(actId);
    assertRunning(actId);
    const processRows = [...(hundredTables.ProcessAward?.values() ?? [])]
      .filter(row => Number(row.belong_version) === Number(config.pool.process_award_lib));
    const configured = new Map(processRows.map(row => [Number(row.tid), row]));
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, actId, at);
      const target = targetTid(config.version, state);
      const claimed = new Set(jsonList(state.received_process_tid_list_json));
      const awards = [];
      for (const tid of tids) {
        const row = configured.get(tid);
        if (!row) fail(5, 'Hundred-draw process award is not configured');
        if (claimed.has(tid)) fail(310, 'Hundred-draw process award is already claimed');
        if (Number(state.cumulative_draw_times) < Number(row.draw_times)) {
          fail(311, 'Hundred-draw process award requirement is not reached');
        }
        awards.push(...awardsForParts(awardParts(row), config, target));
        claimed.add(tid);
        if (Number(row.is_big_node) === 1) recordMarquee(db, roleId, actId, 102, 1, target, at);
      }
      const granted = grantResources(model, awards, tables);
      state.received_process_tid_list_json = JSON.stringify([...claimed].sort((left, right) => left - right));
      saveState(db, state, at);
      const value = { act_data: actData(state), res: { changes: granted.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_hundred_act_receive_process_award_rsp', value), tids, changes: granted.changes.length };
    });
    result.valueForLog = { actId, tids: result.tids, changes: result.changes };
    return result;
  }

  function selectAwardCommand(request) {
    const actId = intOf(request.act_id, 'hundred-draw activity id');
    const target = intOf(request.target_tid, 'hundred-draw target');
    const config = configuration(actId);
    assertRunning(actId);
    if (Number(config.pool.pool_type) !== POOL_TYPE_DEVOLVE) fail(5, 'Hundred-draw activity does not support target selection');
    const targets = Array.isArray(config.version.target) ? config.version.target.map(Number) : [];
    if (!targets.includes(target)) fail(1, 'Hundred-draw target is not configured');
    const at = seconds();
    const result = store.transaction((model, db) => {
      const state = stateRow(db, model.state.roleId, actId, at);
      state.select_target_tid = target;
      saveState(db, state, at);
      const value = { act_data: actData(state) };
      return { value, data: codec.pack('pb_hundred_draw_act_select_award_rsp', value), target };
    });
    result.valueForLog = { actId, target: result.target };
    return result;
  }

  function starAwardCommand(request) {
    const actId = intOf(request.act_id, 'hundred-draw activity id');
    const tids = listOf(request.tid_list);
    const config = configuration(actId);
    assertRunning(actId);
    const starRows = [...(hundredTables.StarTask?.values() ?? [])]
      .filter(row => Number(row.belong_version) === Number(config.pool.star_task_lib));
    const configured = new Map(starRows.map(row => [Number(row.tid), row]));
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, actId, at);
      const target = targetTid(config.version, state);
      const hero = model.heroInfo?.hero_list?.find(entry => Number(entry.tid) === Number(target)) ?? null;
      const claimed = new Set(jsonList(state.received_star_tid_list_json));
      const awards = [];
      for (const tid of tids) {
        const row = configured.get(tid);
        if (!row) fail(5, 'Hundred-draw star award is not configured');
        if (claimed.has(tid)) fail(310, 'Hundred-draw star award is already claimed');
        if (Number(config.pool.theme_type) !== 101 || !hero) {
          fail(5, 'Hundred-draw star task requires a local hero target');
        }
        if (Number(hero.star ?? 0) < Number(row.target)) fail(311, 'Hundred-draw star requirement is not reached');
        awards.push(...awardsForParts(awardParts(row), config, target));
        claimed.add(tid);
      }
      const granted = grantResources(model, awards, tables);
      state.received_star_tid_list_json = JSON.stringify([...claimed].sort((left, right) => left - right));
      saveState(db, state, at);
      const value = { act_data: actData(state), res: { changes: granted.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_hundred_draw_act_rec_star_award_rsp', value), tids, changes: granted.changes.length };
    });
    result.valueForLog = { actId, tids: result.tids, changes: result.changes };
    return result;
  }

  function marqueeCommand(request) {
    const actId = intOf(request.act_id, 'hundred-draw activity id');
    const start = Number(request.start_range);
    const end = Number(request.end_range);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end - start + 1 > MAX_MARQUEE_RANGE) {
      fail(1, 'Invalid hundred-draw marquee range');
    }
    configuration(actId);
    const limit = end - start + 1;
    const offset = start - 1;
    const rows = store.inspect(db => db.prepare(`SELECT role_id,type,num,target_tid,trigger_time
      FROM hundred_draw_marquees WHERE act_id=? ORDER BY id DESC LIMIT ? OFFSET ?`).all(actId, limit, offset));
    const data = rows.map(row => ({
      role_id: String(row.role_id), type: String(row.type), num: String(row.num),
      trigger_time: String(row.trigger_time), target_tid: String(row.target_tid)
    }));
    const value = { data: { data } };
    return { value, data: codec.pack('pb_hundred_draw_act_marquee_rsp', value), rows: data.length };
  }

  function loginPayload(actId, at = seconds()) {
    const state = store.transaction((model, db) => {
      const row = stateRow(db, model.state.roleId, actId, at);
      saveState(db, row, at);
      return row;
    });
    return codec.pack('pb_hundred_draw_act_data', actData(state));
  }

  function runningActIds(activity, at) {
    const result = [];
    for (const [actId, act] of tables?.ActFrameAct ?? []) {
      if (Number(act.type) !== ACT_TYPE) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, activity, at)) continue;
      if (!hundredTables.Version?.get(Number(act.version))) continue;
      result.push(Number(actId));
    }
    return result.sort((left, right) => left - right);
  }

  function synchronizeLogin(activity, at = seconds()) {
    if (!activity || typeof activity !== 'object') fail(5, 'Hundred-draw activity login data is invalid');
    activity.act_list ??= [];
    const synced = [];
    for (const actId of runningActIds(activity, at)) {
      let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === actId);
      if (!entry) {
        entry = { state_data: { act_id: actId }, module_login_data: Buffer.alloc(0) };
        activity.act_list.push(entry);
      }
      entry.state_data ??= {};
      entry.state_data.act_id = actId;
      entry.state_data.cur_state_id = RUNNING_STATE_ID;
      entry.state_data.history_time ??= [];
      if (!Array.isArray(entry.state_data.history_time)) entry.state_data.history_time = [];
      if (!entry.state_data.history_time.some(item => Number(item?.state_id) === RUNNING_STATE_ID)) {
        entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: String(at) });
      }
      entry.module_login_data = loginPayload(actId, at);
      synced.push(actId);
    }
    return synced;
  }

  function decode(type, bytes) {
    const schema = ({ 117001: 'pb_hundred_act_draw_req', 117002: 'pb_hundred_act_receive_process_award_req',
      117003: 'pb_hundred_draw_act_select_award_req', 117004: 'pb_hundred_draw_act_rec_star_award_req',
      117005: 'pb_hundred_draw_act_marquee_req' })[Number(type)];
    if (!schema) fail(1, 'Unknown hundred-draw command');
    try { return codec.unpack(schema, bytes ?? Buffer.alloc(0)); }
    catch { fail(1, 'Invalid hundred-draw request'); }
  }

  return {
    supports: type => Object.values(HUNDRED_DRAW_COMMANDS).includes(Number(type)),
    decode,
    execute(type, request) {
      switch (Number(type)) {
        case HUNDRED_DRAW_COMMANDS.draw: return drawCommand(request);
        case HUNDRED_DRAW_COMMANDS.processAward: return processAwardCommand(request);
        case HUNDRED_DRAW_COMMANDS.selectAward: return selectAwardCommand(request);
        case HUNDRED_DRAW_COMMANDS.starAward: return starAwardCommand(request);
        case HUNDRED_DRAW_COMMANDS.marquee: return marqueeCommand(request);
        default: return fail(1, 'Unknown hundred-draw command');
      }
    },
    loginPayload,
    synchronizeLogin,
    commands: HUNDRED_DRAW_COMMANDS
  };
}
