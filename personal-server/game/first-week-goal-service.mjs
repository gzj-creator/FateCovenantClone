import { activityWindow, serverDayNumber } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { setBit } from './bit-block.mjs';
import { currentTaskProgress } from './task-service.mjs';
import { readFirstWeekGoalTables } from '../config/first-week-goal-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';

export const FIRST_WEEK_GOAL_MODULE_ID = 59015;
export const FIRST_WEEK_GOAL_COMMANDS = Object.freeze({ progress: 67004, task: 67005 });

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_ALREADY_CLAIMED = 310;

function fail(code, message) {
  throw new GameError(code, message);
}

function milliseconds(value) {
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_UNAVAILABLE, 'First-week goal clock is invalid');
  return Math.floor(number > 100_000_000_000 ? number : number * 1000);
}

function periodActivity({ gameTables, firstWeekTables, serverOpenedAt, activityReferenceOpenedAt, at }) {
  const openedAt = milliseconds(serverOpenedAt);
  const nowSeconds = Math.floor(milliseconds(at) / 1000);
  const openedSeconds = Math.floor(openedAt / 1000);
  const day = serverDayNumber(openedAt, nowSeconds);
  const candidates = [];
  for (const row of gameTables.Activity?.values() ?? []) {
    if (Number(row.func) !== 46) continue;
    const version = Number(row.version);
    if (!firstWeekTables.goalsByVersion.has(version)) continue;
    if (Number(row.server_day) > 0 && day < Number(row.server_day)) continue;
    const minimum = Number(row.server_mini_open_limited) || 0;
    const maximum = Number(row.server_max_open_limited) || 0;
    if (minimum > 0 && openedSeconds < minimum) continue;
    if (maximum > 0 && openedSeconds > maximum) continue;
    const window = activityWindow(row, openedAt, activityReferenceOpenedAt);
    if (!window || nowSeconds < window.start || nowSeconds >= window.end) continue;
    candidates.push({ activityId: Number(row.tid), version, window, row });
  }
  candidates.sort((left, right) => right.version - left.version || right.activityId - left.activityId);
  const active = candidates[0];
  if (!active) fail(CODE_UNAVAILABLE, 'First-week goal activity is not open');
  return { ...active, periodKey: `${active.activityId}:${active.window.start}:${active.window.end}` };
}

function requestedIds(input, label) {
  let raw = input;
  if (raw && !Array.isArray(raw) && Array.isArray(raw.value)) raw = raw.value;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    raw = raw.tid_list ?? raw.tids ?? raw.tid ?? raw.id ?? raw.value;
  }
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) return { all: true, ids: [] };
  const source = Array.isArray(raw) ? raw : [raw];
  const ids = source.map(value => {
    const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : Number(value);
    if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label} id`);
    return number;
  });
  if (new Set(ids).size !== ids.length) fail(CODE_INVALID, `Duplicate ${label} id`);
  return { all: false, ids };
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS first_week_goal_claims (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      period_key TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('progress','task')),
      item_id INTEGER NOT NULL CHECK(item_id>0),
      claimed_at TEXT NOT NULL,
      PRIMARY KEY(role_id,period_key,kind,item_id)
    );
    CREATE INDEX IF NOT EXISTS first_week_goal_claims_period_idx
      ON first_week_goal_claims(role_id,period_key,kind);
  `);
}

function claimedIds(db, roleId, periodKey, kind) {
  return new Set(db.prepare(
    'SELECT item_id FROM first_week_goal_claims WHERE role_id=? AND period_key=? AND kind=? ORDER BY item_id'
  ).all(roleId, periodKey, kind).map(row => Number(row.item_id)));
}

function trimBits(bits) {
  let length = bits.length;
  while (length > 0 && bits[length - 1] === 0) length -= 1;
  return bits.subarray(0, length);
}

function bitsFor(ids) {
  let bits = Buffer.alloc(0);
  for (const id of [...ids].sort((left, right) => left - right)) bits = setBit(bits, id);
  return trimBits(bits);
}

function roleScore(tasks, claimed, scoreTid) {
  let score = 0;
  for (const taskId of claimed) {
    const task = tasks.get(taskId);
    if (!task) continue;
    for (const [tid, count] of task.award_list) if (tid === scoreTid) score += count;
  }
  return score;
}

function infoState(db, roleId, active, firstWeekTables) {
  const progress = claimedIds(db, roleId, active.periodKey, 'progress');
  const tasks = claimedIds(db, roleId, active.periodKey, 'task');
  return {
    progress_award: bitsFor(progress),
    task_award: bitsFor(tasks),
    challenge_day: 0,
    settle_list: [],
    settle_day_number: 0
  };
}

function emptyInfo() {
  return { progress_award: Buffer.alloc(0), task_award: Buffer.alloc(0), challenge_day: 0, settle_list: [], settle_day_number: 0 };
}

export function createFirstWeekGoalService({
  store,
  codec,
  tables = readFirstWeekGoalTables(),
  gameTables = readGameTables(),
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  now = Date.now,
  progressForTask,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('First-week goal store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  function activeAt(at) {
    return periodActivity({
      gameTables,
      firstWeekTables: tables,
      serverOpenedAt: openedAt,
      activityReferenceOpenedAt,
      at
    });
  }

  function progressOf(model, task) {
    try {
      const value = progressForTask
        ? progressForTask({ model, task, codec, gameTables })
        : currentTaskProgress(model, { ...task, task_type: task.type }, codec, gameTables);
      const progress = Number(value);
      if (!Number.isSafeInteger(progress) || progress < 0) fail(CODE_UNAVAILABLE, 'First-week goal task progress is invalid');
      return progress;
    } catch (error) {
      fail(CODE_UNAVAILABLE, `First-week goal task progress is unavailable: ${error.message}`);
    }
  }

  function execute(type, input) {
    if (type !== FIRST_WEEK_GOAL_COMMANDS.progress && type !== FIRST_WEEK_GOAL_COMMANDS.task) {
      fail(CODE_INVALID, 'Unknown first-week goal command');
    }
    const at = milliseconds(now());
    const active = activeAt(at);
    const goals = tables.goalsByVersion.get(active.version) ?? [];
    const versionTasks = tables.tasksByVersion.get(active.version) ?? new Map();
    const kind = type === FIRST_WEEK_GOAL_COMMANDS.progress ? 'progress' : 'task';
    const requested = requestedIds(input, kind === 'progress' ? 'first-week progress' : 'first-week task');
    const allowed = new Set(kind === 'progress' ? goals.map(goal => goal.tid) : versionTasks.keys());
    if (!requested.all) {
      for (const id of requested.ids) if (!allowed.has(id)) fail(CODE_INVALID, `Unknown ${kind} id ${id}`);
    }

    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const already = claimedIds(db, roleId, active.periodKey, kind);
      const taskClaims = claimedIds(db, roleId, active.periodKey, 'task');
      let ids = requested.ids;
      const skipped = [];
      if (requested.all) {
        ids = [...allowed].filter(id => !already.has(id)).filter(id => {
          if (kind === 'progress') {
            const goal = tables.goals.get(id);
            const score = roleScore(versionTasks, taskClaims, goal.score_tid);
            if (score < goal.need_score) { skipped.push({ id, reason: 'score', progress: score }); return false; }
            return true;
          }
          const task = versionTasks.get(id);
          try {
            const progress = progressOf(model, task);
            if (progress < task.target_count) { skipped.push({ id, reason: 'progress', progress }); return false; }
            return true;
          } catch (error) {
            skipped.push({ id, reason: error instanceof GameError ? error.message : 'progress unavailable' });
            return false;
          }
        });
        if (ids.length === 0) fail(CODE_UNAVAILABLE, `No first-week ${kind} reward is available`);
      }

      if (kind === 'progress') {
        for (const id of ids) {
          if (already.has(id)) fail(CODE_ALREADY_CLAIMED, `First-week progress ${id} was already claimed`);
          const goal = tables.goals.get(id);
          if (goal.select_count > 0 || goal.selectable_rewards.length > 0) {
            fail(CODE_UNAVAILABLE, `First-week progress ${id} requires a selectable award protocol not recovered`);
          }
          const score = roleScore(versionTasks, taskClaims, goal.score_tid);
          if (score < goal.need_score) fail(CODE_UNAVAILABLE, `First-week progress ${id} score is not reached`);
        }
      } else {
        for (const id of ids) {
          if (already.has(id)) fail(CODE_ALREADY_CLAIMED, `First-week task ${id} was already claimed`);
          const task = versionTasks.get(id);
          if (!task) fail(CODE_INVALID, `Unknown first-week task id ${id}`);
          const progress = progressOf(model, task);
          if (progress < task.target_count) fail(CODE_UNAVAILABLE, `First-week task ${id} is not complete`);
        }
      }

      const awards = [];
      for (const id of ids) {
        db.prepare('INSERT INTO first_week_goal_claims VALUES (?,?,?,?,?)')
          .run(roleId, active.periodKey, kind, id, new Date(at).toISOString());
        if (kind === 'progress') awards.push(...tables.goals.get(id).rewards);
        else awards.push(...versionTasks.get(id).award_list);
      }
      const reward = awards.length ? grantResources(model, awards, gameTables, { codec }) : { changes: [] };
      const info = infoState(db, roleId, active, tables);
      const data = codec.pack('pb_first_week_goal_back', { info, res: reward });
      const score = roleScore(
        versionTasks,
        claimedIds(db, roleId, active.periodKey, 'task'),
        Number(tables.constants.get(active.version).score)
      );
      log({ event: 'first_week_goal_claimed', roleId, activityId: active.activityId, kind, ids, changes: reward.changes.length });
      return {
        data,
        value: { activityId: active.activityId, version: active.version, periodKey: active.periodKey, kind, ids, skipped, score, changes: reward.changes.length }
      };
    });
  }

  return {
    supports: type => type === FIRST_WEEK_GOAL_COMMANDS.progress || type === FIRST_WEEK_GOAL_COMMANDS.task,
    execute,
    loginPayload(at = now()) {
      let active;
      try { active = activeAt(at); } catch { return codec.pack('pb_first_week_goal', emptyInfo()); }
      const model = store.read();
      const info = store.inspect(db => infoState(db, model.state.roleId, active, tables));
      return codec.pack('pb_first_week_goal', info);
    },
    moduleId: FIRST_WEEK_GOAL_MODULE_ID
  };
}
