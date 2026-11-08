import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  readSlotGameActTables,
  slotGameAwardLibRows,
  slotGameAwardMapForVersion,
  slotGameMultiplierDrawRows,
  slotGameMultiplierStages
} from '../config/slot-game-act-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

// SlotGameActCmd (110801/110802). Recovered from the client bundle:
//   SlotGameActCmd.lua    encodes pb_slot_game_act_go_req / pb_slot_game_act_draw_req
//   SlotGameActData.lua   parses pb_slot_game_act_role_data from module 92
//   SlotGameActMgr.lua    ReqSlotGo assigns award_lib_tid, ReqSlotGet draws
//   SlotGameActUtil.lua   reads Version/AwardMapLib/MultiplierLib/MultiplierLibDraw
// ActFrameTable.ActType 1095 (main) and 1306 (war-zone 2) point at
// lua_module=SlotGameActMgr + lua_entity=SlotGameActData.
const ACTIVITY_LOGIN_MODULE = 92;
const RUNNING_STATE_ID = 50;
const GO_TYPE = 110801;
const DRAW_TYPE = 110802;
const SLOT_GAME_ACT_TYPES = new Set([1095, 1306]);
const SOURCE_PREFIX = 'slot_game_act:';
const PERCENT_BASE = 100;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

// Module 92 keeps module_login_data as an ETF binary (0x83 0x6d + length), the
// same envelope the dragon land and diamond bank activities use.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Slot game activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function awardEntries(list) {
  if (!Array.isArray(list) || !list.length) throw new GameError(5, 'Slot game award library is empty');
  return list.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Slot game award library is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, 'Slot game award library is invalid');
    }
    return [tid, count];
  });
}

export function createSlotGameActService({
  store,
  codec,
  tables,
  slotGameTables = readSlotGameActTables(),
  calendar,
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Slot game store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const iso = at => new Date(at * 1000).toISOString();

  store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS slot_game_act_role_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      draw_num INTEGER NOT NULL DEFAULT 0,
      award_lib_tid INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id)
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS slot_game_act_draws (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      draw_index INTEGER NOT NULL,
      stage_tid INTEGER NOT NULL,
      draw_lib INTEGER NOT NULL,
      multiplier_tid INTEGER NOT NULL,
      multiplier INTEGER NOT NULL,
      award_lib_tid INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id, draw_index)
    )`);
  });

  function configFor(actId) {
    const id = Number(actId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, 'Invalid slot game activity id');
    const act = tables?.ActFrameAct?.get(id);
    if (!act || !SLOT_GAME_ACT_TYPES.has(Number(act.type))) throw new GameError(1, 'Unknown slot game activity');
    const version = slotGameTables.versions.get(Number(act.version));
    if (!version) throw new GameError(5, 'Slot game activity version is not configured');
    return { actId: id, act, version };
  }

  function assertRunning(actId, at = currentSeconds()) {
    if (!calendar?.isActivityRunning) throw new GameError(5, 'Slot game activity calendar is unavailable');
    if (!calendar.isActivityRunning(Number(actId), null, null, at)) {
      throw new GameError(309, 'Slot game activity is not running');
    }
  }

  function entryItems(version) {
    const rows = slotGameAwardMapForVersion(slotGameTables, version);
    const items = [];
    for (const row of rows) {
      const item = Number(row.item);
      if (Number.isSafeInteger(item) && item > 0 && !items.some(entry => entry.item === item)) {
        items.push({ item, awardLib: Number(row.award_lib) });
      }
    }
    if (!items.length) throw new GameError(5, 'Slot game entry item is not configured');
    return items;
  }

  // AwardLib rows are selected by weight from the lib named by AwardMapLib.
  // Zero-weight rows stay unselectable; an all-zero group is configuration
  // damage and must not silently fall back to some other library.
  function pickWeighted(rows, label) {
    const candidates = rows
      .map(row => ({ row, weight: Number(row.weight) }))
      .filter(entry => Number.isSafeInteger(entry.weight) && entry.weight > 0);
    const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    if (!(total > 0)) throw new GameError(5, `Slot game ${label} has no weighted rows`);
    const sample = Number(random());
    const clamped = Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 1 - Number.EPSILON) : 0;
    let roll = clamped * total;
    for (const entry of candidates) {
      roll -= entry.weight;
      if (roll < 0) return entry.row;
    }
    return candidates[candidates.length - 1].row;
  }

  function roleState(db, roleId, actId, at) {
    const row = db.prepare('SELECT * FROM slot_game_act_role_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (row) return { ...row };
    const stamp = iso(at);
    return {
      role_id: Number(roleId), act_id: Number(actId),
      draw_num: 0, award_lib_tid: 0,
      created_at: stamp, updated_at: stamp
    };
  }

  function saveRoleState(db, state, at) {
    state.updated_at = iso(at);
    db.prepare(`INSERT INTO slot_game_act_role_state
      (role_id, act_id, draw_num, award_lib_tid, created_at, updated_at)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(role_id,act_id) DO UPDATE SET
        draw_num=excluded.draw_num,
        award_lib_tid=excluded.award_lib_tid,
        updated_at=excluded.updated_at`).run(
      Number(state.role_id), Number(state.act_id), Number(state.draw_num) || 0,
      Number(state.award_lib_tid) || 0, state.created_at, state.updated_at
    );
  }

  function roleData(state) {
    return {
      act_id: String(state.act_id),
      draw_num: String(Number(state.draw_num) || 0),
      award_lib_tid: String(Number(state.award_lib_tid) || 0)
    };
  }

  function applyLoginEntry(activity, actId, payload, at) {
    activity.act_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === Number(actId));
    if (!entry) {
      entry = { state_data: { act_id: Number(actId) }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = Number(actId);
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (running) running.enter_time = String(at);
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: String(at) });
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_slot_game_act_role_data', payload)).toString('base64');
    return entry;
  }

  function runningActIds(activity, at) {
    const result = [];
    for (const [actId, act] of tables?.ActFrameAct ?? []) {
      if (!SLOT_GAME_ACT_TYPES.has(Number(act.type))) continue;
      if (!slotGameTables.versions.has(Number(act.version))) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, activity, at)) continue;
      result.push(Number(actId));
    }
    return result.sort((left, right) => left - right);
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    activity.act_list ??= [];
    const roleId = store.state().roleId;
    const synced = [];
    for (const actId of runningActIds(activity, at)) {
      const state = store.transaction((model, db) => {
        const row = roleState(db, roleId, actId, at);
        saveRoleState(db, row, at);
        return row;
      });
      applyLoginEntry(activity, actId, roleData(state), at);
      synced.push(actId);
    }
    if (synced.length) log({ event: 'slot_game_login_synchronized', actIds: synced });
    return synced;
  }

  function refreshStoredLogin(model, db, actId, state, at) {
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(ACTIVITY_LOGIN_MODULE);
    if (!stored) return;
    const bytes = rawBinary(stored);
    if (!bytes.length) return;
    try {
      const activity = codec.unpack('pb_act_login', bytes);
      applyLoginEntry(activity, actId, roleData(state), at);
      modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      model.state.modules.value = [...modules];
    } catch (error) {
      log({ event: 'slot_game_login_refresh_skipped', actId, error: error?.message ?? String(error) });
    }
  }

  function decode(type, bytes) {
    const schema = ({ [GO_TYPE]: 'pb_slot_game_act_go_req', [DRAW_TYPE]: 'pb_slot_game_act_draw_req' })[Number(type)];
    if (!schema) throw new GameError(1, 'Unknown slot game command');
    try {
      return codec.unpack(schema, bytes ?? Buffer.alloc(0));
    } catch {
      throw new GameError(1, 'Invalid slot game request');
    }
  }

  function goCommand(request) {
    const actId = Number(request?.act_tid);
    const itemTid = Number(request?.item_tid);
    if (!Number.isSafeInteger(itemTid) || itemTid <= 0) throw new GameError(1, 'Invalid slot game item id');
    const at = currentSeconds();
    const { version } = configFor(actId);
    assertRunning(actId, at);
    const entry = entryItems(version).find(candidate => candidate.item === itemTid);
    if (!entry) throw new GameError(5, 'Slot game item is not configured for this activity');
    const awardRows = slotGameAwardLibRows(slotGameTables, entry.awardLib);
    if (!awardRows.length) throw new GameError(5, 'Slot game award library is not configured');
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, actId, at);
      if (Number(state.award_lib_tid) !== 0) {
        // The client only calls go when award_lib_tid is 0, so a repeated
        // request is an acknowledgement and must not charge a second ticket.
        log({ event: 'slot_game_go_duplicate_acknowledged', actId, awardLibTid: Number(state.award_lib_tid) });
        const value = roleData(state);
        return { value, data: codec.pack('pb_slot_game_act_role_data', value), awardLibTid: Number(state.award_lib_tid), spent: 0 };
      }
      const spent = consumeResources(model, [[itemTid, 1]], 301, { codec, now: () => at });
      const picked = pickWeighted(awardRows, 'award library');
      state.award_lib_tid = Number(picked.tid);
      saveRoleState(db, state, at);
      refreshStoredLogin(model, db, actId, state, at);
      const value = roleData(state);
      return { value, data: codec.pack('pb_slot_game_act_role_data', value), awardLibTid: Number(state.award_lib_tid), spent: spent.changes.length };
    });
    log({ event: 'slot_game_go_committed', actId, itemTid, awardLibTid: result.awardLibTid, chargeChanges: result.spent });
    return { value: result.value, data: result.data, actId, awardLibTid: result.awardLibTid };
  }

  // MultiplierLib.num is the draw-count threshold of a multiplier stage; the
  // role uses the last stage whose threshold draw_num has reached (the shipped
  // version 1 stages are 0/1/30 draws -> draw libs 1/2/3).
  function multiplierStageFor(version, drawNum) {
    const stages = slotGameMultiplierStages(slotGameTables, version);
    if (!stages.length) throw new GameError(5, 'Slot game multiplier lib is not configured');
    let selected = stages[0];
    for (const stage of stages) {
      if (Number(stage.num) <= drawNum) selected = stage;
      else break;
    }
    return selected;
  }

  function drawCommand(request) {
    const actId = Number(request?.act_tid);
    if (request?.challenge_multiplier) {
      // No recovered rule links challenge_multiplier to a cost or payout rule.
      throw new GameError(5, 'Slot game challenge multiplier is not recovered');
    }
    const at = currentSeconds();
    const { version } = configFor(actId);
    assertRunning(actId, at);
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, actId, at);
      const awardLibTid = Number(state.award_lib_tid);
      if (awardLibTid <= 0) throw new GameError(311, 'Slot game draw requires an assigned award library');
      const awardRow = slotGameTables.awardLib.get(awardLibTid);
      if (!awardRow) throw new GameError(5, 'Slot game award library is not configured');
      const configuredLibs = new Set(entryItems(version).map(item => item.awardLib));
      if (!configuredLibs.has(Number(awardRow.lib))) throw new GameError(5, 'Slot game award library does not belong to this version');
      const drawNum = Number(state.draw_num) || 0;
      const stage = multiplierStageFor(version, drawNum);
      const drawRows = slotGameMultiplierDrawRows(slotGameTables, stage.draw_lib);
      if (!drawRows.length) throw new GameError(5, 'Slot game multiplier draw lib is not configured');
      const picked = pickWeighted(drawRows, 'multiplier lib');
      const multiplier = Number(picked.multiplier);
      if (!Number.isSafeInteger(multiplier) || multiplier <= 0) throw new GameError(5, 'Slot game multiplier is invalid');
      const awards = awardEntries(awardRow.award).map(([tid, count]) => {
        const amount = Math.floor(count * multiplier / PERCENT_BASE);
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new GameError(5, 'Slot game award amount is invalid');
        return [tid, amount];
      });
      const granted = grantResources(model, awards, tables, { codec, now: () => at });
      const drawIndex = drawNum + 1;
      db.prepare(`INSERT INTO slot_game_act_draws
        (role_id, act_id, draw_index, stage_tid, draw_lib, multiplier_tid, multiplier, award_lib_tid, created_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
        roleId, actId, drawIndex, Number(stage.tid), Number(stage.draw_lib),
        Number(picked.tid), multiplier, awardLibTid, iso(at)
      );
      state.draw_num = drawIndex;
      state.award_lib_tid = 0;
      saveRoleState(db, state, at);
      refreshStoredLogin(model, db, actId, state, at);
      const value = {
        act_data: roleData(state),
        res: { changes: granted.changes, is_overflow: false },
        multiplier: String(multiplier)
      };
      return {
        value, data: codec.pack('pb_slot_game_act_draw_rsp', value),
        drawIndex, multiplier, multiplierTid: Number(picked.tid), stageTid: Number(stage.tid), awards
      };
    });
    log({
      event: 'slot_game_draw_committed', actId, drawIndex: result.drawIndex,
      multiplier: result.multiplier, multiplierTid: result.multiplierTid,
      stageTid: result.stageTid, awards: result.awards
    });
    return { value: result.value, data: result.data, actId, drawIndex: result.drawIndex, multiplier: result.multiplier };
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    commands: { go: GO_TYPE, draw: DRAW_TYPE },
    supports: type => [GO_TYPE, DRAW_TYPE].includes(Number(type)),
    decode,
    execute(type, request) {
      switch (Number(type)) {
        case GO_TYPE: return goCommand(request);
        case DRAW_TYPE: return drawCommand(request);
        default: throw new GameError(1, 'Unknown slot game command');
      }
    },
    synchronizeLogin,
    currentActivity(at = currentSeconds()) {
      const running = runningActIds(null, at);
      const actId = running.at(-1) ?? null;
      if (!actId) return null;
      const { version } = configFor(actId);
      return { actId, version: Number(version.tid) };
    },
    runningActIds
  };
}
