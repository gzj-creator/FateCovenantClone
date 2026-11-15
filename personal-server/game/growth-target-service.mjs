import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { activityWindow, serverDayNumber } from './activity-calendar.mjs';
import { statisticTaskProgress } from './task-statistics.mjs';
import { currentTaskProgress } from './task-service.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';
import { readGrowthTargetTables } from '../config/growth-target-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';

// GrowthTargetCmd.lua registers req_growth_target_phase_award (69006) and
// req_growth_target_task_award (69007) through Codec.EncodeErl + Codec.EncodePB,
// so the request is an ETF envelope carrying the request name and the protobuf
// bytes. Both replies are pb_growth_target_*_award_rsp{act_data, res}.
export const GROWTH_TARGET_COMMANDS = Object.freeze({ phaseAward: 69006, taskAward: 69007 });
export const GROWTH_TARGET_DECISION_ID = 'R1-ITEM-GROWTHTARGET';

// ActivityTable.TID_GROWTH_TARGET_FUNC = 18 (ActivityTable.lua prototype, pc 89-91).
export const GROWTH_TARGET_ACTIVITY_FUNC = 18;
// Activity login entries use state 50 while the activity window is running.
const RUNNING_STATE_ID = 50;
const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_NOT_RUNNING = 309;
const CODE_ALREADY_CLAIMED = 310;

// TaskTable.Type.progress_fun=2 is the passed-section cursor. growth_road, first-week
// goal and common tasks all read module 8 through this same function.
const PASSED_SECTION_PROGRESS_FUN = 2;
const STATISTICS_PROGRESS_TYPE = 2;

const SCHEMAS = Object.freeze({
  [GROWTH_TARGET_COMMANDS.phaseAward]: 'pb_growth_target_phase_award_req',
  [GROWTH_TARGET_COMMANDS.taskAward]: 'pb_growth_target_task_award_req'
});
const REQUEST_NAMES = Object.freeze({
  [GROWTH_TARGET_COMMANDS.phaseAward]: 'req_growth_target_phase_award',
  [GROWTH_TARGET_COMMANDS.taskAward]: 'req_growth_target_task_award'
});
const RESPONSE_SCHEMAS = Object.freeze({
  [GROWTH_TARGET_COMMANDS.phaseAward]: 'pb_growth_target_phase_award_rsp',
  [GROWTH_TARGET_COMMANDS.taskAward]: 'pb_growth_target_task_award_rsp'
});

function fail(code, message) {
  throw new GameError(code, `${message} decisionId=${GROWTH_TARGET_DECISION_ID}`);
}

function milliseconds(value) {
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_UNAVAILABLE, 'Growth target clock is invalid');
  return Math.floor(number > 100_000_000_000 ? number : number * 1000);
}

function openedSeconds(value) {
  if (value == null) return 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.floor(number > 100_000_000_000 ? number / 1000 : number);
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS growth_target_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL CHECK(act_id>0),
      act_version INTEGER NOT NULL CHECK(act_version>0),
      data_version INTEGER NOT NULL DEFAULT 0,
      phase_award_json TEXT NOT NULL DEFAULT '[]',
      task_award_json TEXT NOT NULL DEFAULT '[]',
      finish_task_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,act_id)
    );
  `);
}

function idList(text) {
  let parsed;
  try {
    parsed = JSON.parse(text || '[]');
  } catch {
    fail(CODE_UNAVAILABLE, 'Growth target state is corrupt');
  }
  if (!Array.isArray(parsed)) fail(CODE_UNAVAILABLE, 'Growth target state is corrupt');
  if (parsed.some(value => !Number.isSafeInteger(value) || value <= 0)) {
    fail(CODE_UNAVAILABLE, 'Growth target state is corrupt');
  }
  return parsed;
}

function sortedIds(set) {
  return [...set].sort((left, right) => left - right);
}

// eetf hands an ETF atom back as an object carrying `.value`, while a plain
// string can arrive from a JSON fixture. Both spellings name the request.
function atomName(value) {
  if (typeof value === 'string') return value;
  if (typeof value?.value === 'string') return value.value;
  return '';
}

export function createGrowthTargetService({
  store,
  codec,
  tables = readGrowthTargetTables(),
  gameTables = readGameTables(),
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  now = Date.now,
  progressForTask,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Growth target store is unavailable');
  const openedAt = openedSeconds(serverOpenedAt ?? store.serverOpenedAt);
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  // ActivityTable rows with func 18 are the three growth-target periods; the
  // ActivityTable.version field selects the GrowthTargetTable version whose
  // phases and tasks may be claimed.
  function configured() {
    return [...(gameTables.Activity?.values() ?? [])]
      .filter(row => Number(row.func) === GROWTH_TARGET_ACTIVITY_FUNC)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function windowOf(row) {
    const window = activityWindow(row, openedAt, activityReferenceOpenedAt);
    if (!window) fail(CODE_UNAVAILABLE, `Growth target activity ${row.tid} window is not configured`);
    return window;
  }

  function openAt(row, atSeconds) {
    if (Number(row.server_day) > 0) {
      const day = serverDayNumber(openedAt, atSeconds);
      if (day < Number(row.server_day)) return false;
    }
    const minimum = Number(row.server_mini_open_limited) || 0;
    const maximum = Number(row.server_max_open_limited) || 0;
    if (minimum > 0 && openedAt < minimum) return false;
    if (maximum > 0 && openedAt > maximum) return false;
    const window = activityWindow(row, openedAt, activityReferenceOpenedAt);
    if (!window) return false;
    return atSeconds >= window.start && atSeconds < window.end;
  }

  function runningActivities(atSeconds) {
    return configured()
      .filter(row => tables.versions.has(Number(row.version)))
      .filter(row => openAt(row, atSeconds));
  }

  function runningActivity(actTid, atSeconds) {
    const row = configured().find(candidate => Number(candidate.tid) === actTid);
    if (!row) fail(CODE_INVALID, `Unknown growth target activity ${actTid}`);
    if (!tables.versions.has(Number(row.version))) {
      fail(CODE_UNAVAILABLE, `Growth target activity ${actTid} version ${row.version} has no configured phases`);
    }
    if (!openAt(row, atSeconds)) fail(CODE_NOT_RUNNING, `Growth target activity ${actTid} is not running`);
    const window = windowOf(row);
    return { row, actId: Number(row.tid), version: Number(row.version), window };
  }

  function emptyState(version, actId) {
    return { actId, version, dataVersion: 0, phases: new Set(), tasks: new Set(), finished: new Set() };
  }

  function stateRow(db, roleId, actId, version) {
    const row = db.prepare(`SELECT act_version,data_version,phase_award_json,task_award_json,finish_task_json
      FROM growth_target_state WHERE role_id=? AND act_id=?`).get(roleId, actId);
    if (!row) return emptyState(version, actId);
    if (Number(row.act_version) !== version) {
      fail(CODE_UNAVAILABLE, `Growth target state for activity ${actId} belongs to version ${row.act_version}, not ${version}`);
    }
    return {
      actId,
      version,
      dataVersion: Number(row.data_version ?? 0),
      phases: new Set(idList(row.phase_award_json)),
      tasks: new Set(idList(row.task_award_json)),
      finished: new Set(idList(row.finish_task_json))
    };
  }

  function writeState(db, roleId, actId, state, at) {
    db.prepare(`INSERT INTO growth_target_state
        (role_id,act_id,act_version,data_version,phase_award_json,task_award_json,finish_task_json,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id,act_id) DO UPDATE SET
        act_version=excluded.act_version,
        data_version=excluded.data_version,
        phase_award_json=excluded.phase_award_json,
        task_award_json=excluded.task_award_json,
        finish_task_json=excluded.finish_task_json,
        updated_at=excluded.updated_at`)
      .run(
        roleId,
        actId,
        state.version,
        state.dataVersion,
        JSON.stringify(sortedIds(state.phases)),
        JSON.stringify(sortedIds(state.tasks)),
        JSON.stringify(sortedIds(state.finished)),
        new Date(at).toISOString()
      );
  }

  function actData(actId, state) {
    // pb_growth_target_act keeps the three lists independent, exactly as the
    // shipped protobuf comment describes them.
    return {
      act_tid: actId,
      phase_award_list: sortedIds(state.phases),
      task_award_list: sortedIds(state.tasks),
      finish_task_list: sortedIds(state.finished)
    };
  }

  function progressOf(model, task) {
    let value;
    try {
      if (progressForTask) {
        value = progressForTask({ model, task, codec, gameTables });
      } else {
        const typeConfig = gameTables.TaskType?.get(Number(task.type));
        if (!typeConfig) fail(CODE_UNAVAILABLE, `Growth target task ${task.tid} type ${task.type} is not configured`);
        if (Number(task.period) === 1) {
          fail(CODE_UNAVAILABLE, `Growth target daily task ${task.tid} has no recovered day-scoped producer`);
        }
        if (Number(typeConfig.progress_type) === STATISTICS_PROGRESS_TYPE) {
          value = statisticTaskProgress({ model, typeConfig, codec, gameTables, label: `Growth target task ${task.tid}` });
        } else if (Number(typeConfig.progress_type) === 1 && Number(typeConfig.progress_fun) === PASSED_SECTION_PROGRESS_FUN) {
          value = currentTaskProgress(model, { task_type: Number(task.type) }, codec, gameTables);
        } else {
          fail(
            CODE_UNAVAILABLE,
            `Growth target task ${task.tid} type ${task.type} progress_type ${Number(typeConfig.progress_type ?? 0)} progress_fun ${Number(typeConfig.progress_fun ?? 0)} is unavailable`
          );
        }
      }
    } catch (error) {
      if (error instanceof GameError) {
        const message = String(error.message).includes('decisionId=')
          ? error.message
          : `${error.message} decisionId=${GROWTH_TARGET_DECISION_ID}`;
        throw new GameError(error.code, message);
      }
      fail(CODE_UNAVAILABLE, `Growth target task ${task.tid} progress is unavailable: ${error.message}`);
    }
    const progress = Number(value);
    if (!Number.isSafeInteger(progress) || progress < 0) fail(CODE_UNAVAILABLE, `Growth target task ${task.tid} progress is invalid`);
    return progress;
  }

  function claimPhase(input) {
    const actTid = positiveInteger(input?.act_tid, 'growth target activity id');
    const phaseTid = positiveInteger(input?.phase_tid, 'growth target phase id');
    const at = milliseconds(now());
    const active = runningActivity(actTid, Math.floor(at / 1000));
    const phase = tables.phases.get(phaseTid);
    if (!phase || phase.version !== active.version) {
      fail(CODE_INVALID, `Growth target phase ${phaseTid} does not belong to activity ${actTid} version ${active.version}`);
    }
    const phaseTasks = tables.tasksByPhase.get(phaseTid) ?? [];
    if (!phaseTasks.length) fail(CODE_UNAVAILABLE, `Growth target phase ${phaseTid} has no tasks`);

    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, actTid, active.version);
      if (state.phases.has(phaseTid)) fail(CODE_ALREADY_CLAIMED, `Growth target phase ${phaseTid} was already claimed`);
      // GrowthTargetMgr.IsFinishStage tests finish_task_list, not task_award_list.
      // Recompute unfinished rows from their producer; a persisted historical
      // finish stays valid even if that producer is no longer available.
      for (const task of phaseTasks) {
        if (state.finished.has(task.tid)) continue;
        const progress = progressOf(model, task);
        if (progress < task.target_count) {
          fail(CODE_UNAVAILABLE, `Growth target phase ${phaseTid} requires task ${task.tid} to be finished`);
        }
        state.finished.add(task.tid);
      }
      state.phases.add(phaseTid);
      writeState(db, roleId, actTid, state, at);
      const rewards = phase.award_list.map(([tid, count]) => [tid, count]);
      const reward = grantResources(model, rewards, gameTables, { codec });
      const value = {
        act_data: actData(actTid, state),
        res: { changes: reward.changes ?? [], is_overflow: false }
      };
      const data = codec.pack(RESPONSE_SCHEMAS[GROWTH_TARGET_COMMANDS.phaseAward], value);
      log({
        event: 'growth_target_phase_award_committed',
        roleId, actId: actTid, version: active.version, phaseTid, changes: value.res.changes.length
      });
      return {
        data,
        value: {
          actId: actTid,
          version: active.version,
          phaseTid,
          changes: value.res.changes.length,
          phaseAwards: sortedIds(state.phases)
        }
      };
    });
  }

  function claimTasks(input) {
    const actTid = positiveInteger(input?.act_tid, 'growth target activity id');
    const raw = Array.isArray(input?.task_tid_list) ? input.task_tid_list : [];
    const tids = raw.map(value => positiveInteger(value, 'growth target task id'));
    if (!tids.length) fail(CODE_INVALID, 'Growth target task award expects at least one task');
    if (new Set(tids).size !== tids.length) fail(CODE_INVALID, 'Growth target task award repeats a task');
    const at = milliseconds(now());
    const active = runningActivity(actTid, Math.floor(at / 1000));
    const versionTasks = tables.tasksByVersion.get(active.version);
    if (!versionTasks) fail(CODE_UNAVAILABLE, `Growth target version ${active.version} has no tasks`);
    const tasks = tids.map(tid => {
      const task = versionTasks.get(tid);
      if (!task) fail(CODE_INVALID, `Growth target task ${tid} does not belong to activity ${actTid}`);
      return task;
    });

    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, actTid, active.version);
      for (const task of tasks) {
        if (state.tasks.has(task.tid)) fail(CODE_ALREADY_CLAIMED, `Growth target task ${task.tid} was already claimed`);
        const progress = progressOf(model, task);
        if (progress < task.target_count) {
          fail(CODE_UNAVAILABLE, `Growth target task ${task.tid} is not complete (${progress}/${task.target_count})`);
        }
      }
      const rewards = [];
      for (const task of tasks) {
        state.tasks.add(task.tid);
        state.finished.add(task.tid);
        for (const [tid, count] of task.award_list) rewards.push([tid, count]);
      }
      writeState(db, roleId, actTid, state, at);
      const reward = grantResources(model, rewards.length ? rewards : [], gameTables, { codec });
      const value = {
        act_data: actData(actTid, state),
        res: { changes: reward.changes ?? [], is_overflow: false }
      };
      const data = codec.pack(RESPONSE_SCHEMAS[GROWTH_TARGET_COMMANDS.taskAward], value);
      log({
        event: 'growth_target_task_award_committed',
        roleId, actId: actTid, version: active.version, tids, changes: value.res.changes.length
      });
      return {
        data,
        value: {
          actId: actTid,
          version: active.version,
          tids,
          changes: value.res.changes.length,
          taskAwards: sortedIds(state.tasks)
        }
      };
    });
  }

  function execute(type, input) {
    const commandType = Number(type);
    if (commandType === GROWTH_TARGET_COMMANDS.phaseAward) return claimPhase(input);
    if (commandType === GROWTH_TARGET_COMMANDS.taskAward) return claimTasks(input);
    fail(CODE_INVALID, 'Unknown growth target command');
  }

  function bytesOfBody(body) {
    if (Buffer.isBuffer(body)) return Buffer.from(body);
    if (body instanceof Uint8Array) return Buffer.from(body);
    if (Buffer.isBuffer(body?.value)) return Buffer.from(body.value);
    if (body?.value instanceof Uint8Array) return Buffer.from(body.value);
    if (body?.value?.data) return Buffer.from(body.value.data);
    if (body?.data) return Buffer.from(body.data);
    return null;
  }

  async function decode(type, data, { unpack, etf } = {}) {
    const commandType = Number(type);
    const schema = SCHEMAS[commandType];
    if (!schema) fail(CODE_INVALID, 'Unsupported growth target command');
    if (typeof unpack !== 'function') fail(CODE_UNAVAILABLE, 'Growth target protobuf decoder is unavailable');
    const bytes = Buffer.from(data ?? Buffer.alloc(0));
    if (!bytes.length) fail(CODE_INVALID, 'Growth target request is empty');
    let payload = bytes;
    let envelope;
    if (typeof etf === 'function') {
      try {
        envelope = await etf(bytes);
      } catch {
        envelope = undefined;
      }
    }
    if (Array.isArray(envelope) && envelope.length === 2) {
      const [name, body] = envelope;
      const requestName = atomName(name);
      if (requestName !== REQUEST_NAMES[commandType]) {
        fail(CODE_INVALID, `Growth target request ${requestName || 'unknown'} does not match command ${commandType}`);
      }
      const inner = bytesOfBody(body);
      if (!inner) fail(CODE_INVALID, 'Growth target request payload is not a binary');
      payload = inner;
    }
    try {
      return unpack(schema, payload);
    } catch {
      fail(CODE_INVALID, 'Growth target request is invalid');
    }
  }

  // ActivityMgr decodes module_login_data with the activity's Lua entity, so the
  // role payload is ETF-wrapped exactly like the task-activity login block.
  function applyLoginEntry(activity, active, state) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === active.actId);
    if (!entry) {
      entry = { state_data: { act_id: active.actId }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = active.actId;
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    const start = Number(active.window?.start ?? 0);
    if (!running) entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: start });
    entry.module_login_data = wrapEtfBinary(
      codec.pack('pb_growth_target_role', rolePayload(active.actId, state))
    ).toString('base64');
    return entry;
  }

  function rolePayload(actId, state) {
    return {
      data_version: state.dataVersion,
      act_data_list: [actData(actId, state)]
    };
  }

  function synchronizeLogin(activity, at = Math.floor(milliseconds(now()) / 1000)) {
    if (!activity || typeof activity !== 'object') fail(CODE_UNAVAILABLE, 'Growth target activity login data is invalid');
    const applied = [];
    for (const row of runningActivities(Math.floor(milliseconds(at) / 1000))) {
      const actId = Number(row.tid);
      const version = Number(row.version);
      const roleId = store.state().roleId;
      const state = store.transaction((model, db) => {
        ensureTables(db);
        const next = stateRow(db, roleId, actId, version);
        let changed = false;
        for (const task of tables.tasksByVersion.get(version)?.values() ?? []) {
          if (next.finished.has(task.tid)) continue;
          try {
            if (progressOf(model, task) >= task.target_count) {
              next.finished.add(task.tid);
              changed = true;
            }
          } catch (error) {
            // Unavailable producers cannot prove completion; keep that task
            // pending while still projecting every other legal login value.
            if (!(error instanceof GameError) || error.code !== CODE_UNAVAILABLE) throw error;
          }
        }
        if (changed) writeState(db, roleId, actId, next, milliseconds(at));
        return next;
      });
      applyLoginEntry(activity, { actId, window: windowOf(row) }, state);
      applied.push(actId);
    }
    if (applied.length) log({ event: 'growth_target_login_synchronized', actIds: applied });
    return applied;
  }

  function ensureLoginState(at = now()) {
    let running;
    try {
      running = runningActivities(Math.floor(milliseconds(at) / 1000));
    } catch {
      return { open: false, versions: [] };
    }
    if (!running.length) return { open: false, versions: [] };
    const roleId = store.state().roleId;
    store.inspect(db => {
      ensureTables(db);
      for (const row of running) {
        db.prepare('INSERT OR IGNORE INTO growth_target_state (role_id,act_id,act_version,updated_at) VALUES (?,?,?,?)')
          .run(roleId, Number(row.tid), Number(row.version), new Date(milliseconds(at)).toISOString());
      }
    });
    return { open: true, versions: running.map(row => Number(row.version)) };
  }

  return {
    supports: type => Object.values(GROWTH_TARGET_COMMANDS).includes(Number(type)),
    requestSchema: type => SCHEMAS[Number(type)] ?? null,
    decode,
    execute,
    ensureLoginState,
    synchronizeLogin
  };
}
