import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readTaskActivityTables } from '../config/item-task-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { statisticTaskProgress } from './task-statistics.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';
import {
  SERVER_VITALITY_PROGRESS_FUN,
  activityVitalityStatistic,
  readServerVitality
} from './activity-vitality.mjs';

// ActFrameTable ActType 1003 is the generic task activity
// (TaskActivityActMgr, module 92114 活动_通用任务活动). Its tasks live in
// TaskActivityTable.Lib keyed by version, and the ActFrame row of the same
// version owns the running window.
export const TASK_ACTIVITY_FRAME_TYPE = 1003;
export const TASK_ACTIVITY_COMMANDS = Object.freeze({ finish: 105701, data: 105702 });

const RUNNING_STATE_ID = 50;
const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_NOT_RUNNING = 309;
const CODE_ALREADY_FINISHED = 310;

function fail(code, message) {
  throw new GameError(code, message);
}

function milliseconds(value) {
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_UNAVAILABLE, 'Task activity clock is invalid');
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

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_activity_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL CHECK(act_id>0),
      act_version INTEGER NOT NULL CHECK(act_version>0),
      finished_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,act_id)
    );
  `);
}

function finishedList(text) {
  try {
    const parsed = JSON.parse(text || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter(value => Number.isSafeInteger(value) && value > 0);
  } catch {
    return [];
  }
}

export function createTaskActivityService({
  store,
  codec,
  tables = readTaskActivityTables(),
  gameTables = readGameTables(),
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Task activity store is unavailable');
  // activityWindow() normalises the opening time itself, but only when it is
  // already an epoch value; the local calendar hands out seconds while the
  // tests and CLI pass an ISO string.
  const openedAt = openedSeconds(serverOpenedAt ?? store.serverOpenedAt);
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));
  // 14301 personal rows and 100701 server rows share one vitality dimension,
  // derived from the shipped tables instead of a hard-coded slot.
  const vitalityStatistic = activityVitalityStatistic({ tables, gameTables });

  function configured() {
    return [...(gameTables.ActFrameAct?.values() ?? [])]
      .filter(row => Number(row.type) === TASK_ACTIVITY_FRAME_TYPE)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function windowOf(act) {
    const window = activityWindow(act, openedAt, activityReferenceOpenedAt);
    if (!window) fail(CODE_UNAVAILABLE, `Task activity ${act.tid} window is not configured`);
    return window;
  }

  function runningActivities(at) {
    return configured()
      .map(act => ({ act, window: activityWindow(act, openedAt, activityReferenceOpenedAt) }))
      .filter(entry => entry.window && at >= entry.window.start && at < entry.window.end)
      .map(entry => entry.act);
  }

  function runningActivity(actId, at) {
    const act = configured().find(row => Number(row.tid) === actId);
    if (!act) fail(CODE_INVALID, `Unknown task activity ${actId}`);
    const window = windowOf(act);
    if (at < window.start || at >= window.end) fail(CODE_NOT_RUNNING, `Task activity ${actId} is not running`);
    return act;
  }

  function tasksOf(act) {
    const version = Number(act.version);
    const rows = tables.versions.get(version);
    if (!rows || !rows.size) fail(CODE_UNAVAILABLE, `Task activity version ${version} has no configured tasks`);
    return { version, rows };
  }

  function stateOf(db, roleId, actId, version, at) {
    const row = db.prepare('SELECT act_version,finished_json FROM task_activity_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (!row) return { version, finished: [] };
    if (Number(row.act_version) !== version) fail(CODE_UNAVAILABLE, 'Task activity state version mismatches the configuration');
    return { version, finished: finishedList(row.finished_json) };
  }

  function saveState(db, roleId, actId, state, at) {
    db.prepare(`INSERT INTO task_activity_state (role_id,act_id,act_version,finished_json,updated_at)
      VALUES (?,?,?,?,?)
      ON CONFLICT(role_id,act_id) DO UPDATE SET
        act_version=excluded.act_version,
        finished_json=excluded.finished_json,
        updated_at=excluded.updated_at`)
      .run(roleId, actId, state.version, JSON.stringify(state.finished), new Date(at).toISOString());
  }

  function taskProgress(model, task, vitality) {
    const typeConfig = gameTables.TaskType?.get(Number(task.type));
    if (!typeConfig) fail(CODE_UNAVAILABLE, `Task activity task type ${task.type} is not configured`);
    // TaskTable.Type 100701 progress_fun 460 is TaskActivityActMgr's server
    // active value: the same vitality dimension summed over every role.
    if (Number(typeConfig.progress_type) === 1 && Number(typeConfig.progress_fun) === SERVER_VITALITY_PROGRESS_FUN) {
      return vitality();
    }
    if (Number(typeConfig.progress_type) !== 2) {
      fail(CODE_UNAVAILABLE, `Task activity task type ${task.type} progress_fun ${typeConfig.progress_fun ?? 0} is unavailable`);
    }
    return statisticTaskProgress({ model, typeConfig, codec, gameTables, label: 'Task activity statistics' });
  }

  function serverVitality() {
    return readServerVitality({ store, codec, gameTables, statistic: vitalityStatistic }).total;
  }

  // TaskActivityCmd 105701 req_task_activity_finish. The request lists the task
  // tids the player submitted; every entry is re-checked against the module 21
  // statistics (or, for the 100701 server rows, the realm aggregate) before any
  // reward is granted.
  function finish(raw) {
    let request;
    try {
      request = codec.unpack('pb_task_activity_finish_req', raw);
    } catch {
      fail(CODE_INVALID, 'Task activity request is invalid');
    }
    const actId = Number(request.activity_id);
    if (!Number.isSafeInteger(actId) || actId <= 0) fail(CODE_INVALID, 'Invalid task activity id');
    const tids = (request.task_id_list ?? []).map(Number);
    if (!tids.length) fail(CODE_INVALID, 'Task activity finish expects at least one task');
    if (new Set(tids).size !== tids.length) fail(CODE_INVALID, 'Task activity finish repeats a task');
    for (const tid of tids) if (!Number.isSafeInteger(tid) || tid <= 0) fail(CODE_INVALID, 'Invalid task activity task id');
    const at = milliseconds(now());
    const result = store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const act = runningActivity(actId, Math.floor(at / 1000));
      const { version, rows } = tasksOf(act);
      const state = stateOf(db, roleId, actId, version, at);
      const done = new Set(state.finished);
      const awards = [];
      let vitality = null;
      for (const tid of tids) {
        const task = rows.get(tid);
        if (!task) fail(CODE_INVALID, `Unknown task activity task ${tid}`);
        if (done.has(tid)) fail(CODE_ALREADY_FINISHED, `Task activity task ${tid} was already finished`);
        const progress = taskProgress(model, task, () => (vitality ??= serverVitality()));
        if (progress < task.targetCount) {
          fail(CODE_UNAVAILABLE, `Task activity task ${tid} needs ${task.targetCount} (${progress})`);
        }
        awards.push(...task.award);
        done.add(tid);
      }
      state.finished = [...done].sort((left, right) => left - right);
      saveState(db, roleId, actId, state, at);
      const reward = awards.length ? grantResources(model, awards, gameTables, { codec }) : { changes: [] };
      const value = {
        act_info: { version, finish_task_list: state.finished },
        res: reward
      };
      const data = codec.pack('pb_task_activity_finish_rsp', value);
      log({ event: 'task_activity_finish_committed', roleId, actId, version, tids, changes: reward.changes.length });
      return { data, value: { actId, version, tids, changes: reward.changes.length } };
    });
    return result;
  }

  // ActivityMgr decodes module_login_data with the activity's Lua entity, so the
  // role payload is ETF-wrapped the same way the group-buy activity stores it.
  function applyLoginEntry(activity, act, info) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    activity.act_list = activity.act_list.filter(entry => Number(entry?.state_data?.act_id) !== Number(act.tid));
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === Number(act.tid));
    if (!entry) {
      entry = { state_data: { act_id: Number(act.tid) }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = Number(act.tid);
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const window = activityWindow(act, openedAt, activityReferenceOpenedAt);
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (running) running.enter_time = window?.start ?? 0;
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: window?.start ?? 0 });
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_task_activity_role_info', {
      act_list: [{ version: info.version, finish_task_list: info.finished }]
    })).toString('base64');
    return entry;
  }

  function synchronizeLogin(activity, at = Math.floor(milliseconds(now()) / 1000)) {
    if (!activity || typeof activity !== 'object') fail(CODE_UNAVAILABLE, 'Activity login data is invalid');
    const applied = [];
    for (const act of runningActivities(at)) {
      const version = Number(act.version);
      if (!tables.versions.has(version)) continue;
      const roleId = store.state().roleId;
      const info = store.inspect(db => {
        ensureTables(db);
        return stateOf(db, roleId, Number(act.tid), version, at * 1000);
      });
      applyLoginEntry(activity, act, info);
      applied.push(Number(act.tid));
    }
    if (applied.length) log({ event: 'task_activity_login_synchronized', actIds: applied });
    return applied;
  }

  return {
    supports: type => Number(type) === TASK_ACTIVITY_COMMANDS.finish || Number(type) === TASK_ACTIVITY_COMMANDS.data,
    // The 105702 request carries no fields and TaskActivityActMgr polls it for
    // the realm-wide active value; every running version reads the same
    // statistics dimension, so the aggregate is not activity- or role-scoped.
    execute(type, raw) {
      if (Number(type) === TASK_ACTIVITY_COMMANDS.finish) return finish(raw);
      if (Number(type) === TASK_ACTIVITY_COMMANDS.data) {
        const vitality = readServerVitality({ store, codec, gameTables, statistic: vitalityStatistic });
        return {
          data: codec.pack('pb_task_activity_data_rsp', { server_vitality: String(vitality.total) }),
          value: { serverVitality: vitality.total, roles: vitality.roles, contributors: vitality.contributors }
        };
      }
      return fail(CODE_INVALID, 'Unknown task activity command');
    },
    isProtobufRequest: type => Number(type) === TASK_ACTIVITY_COMMANDS.finish,
    synchronizeLogin,
    runningActivityIds: at => runningActivities(at).map(act => Number(act.tid))
  };
}
