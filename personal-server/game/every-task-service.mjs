import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { currentTaskProgress } from './task-service.mjs';

export const EVERY_TASK_MODULE = 91;

const DAY_SECONDS = 86400;
const MARKET_RESET_OFFSET_SECONDS = 3 * 3600;
const SLOTS = Object.freeze({ daily: 0, main: 1, weekly: 2 });
const SCOPES = new Set(['daily', 'main', 'weekly', 'daily_active']);
const SINGLE_TYPES = new Map([
  [9000, 'daily'],
  [9002, 'main'],
  [9008, 'weekly']
]);
const ALL_TYPES = new Map([
  [9006, 'daily'],
  [9007, 'main'],
  [9009, 'weekly']
]);

function gameDayStart(seconds) {
  return Math.floor((seconds + MARKET_RESET_OFFSET_SECONDS) / DAY_SECONDS) * DAY_SECONDS - MARKET_RESET_OFFSET_SECONDS;
}

function periodFor(scope, milliseconds) {
  const seconds = Math.floor(Number(milliseconds) / 1000);
  if (!Number.isSafeInteger(seconds) || seconds < 0) throw new GameError(5, 'Task clock is invalid');
  if (scope === 'main') return { key: 'main', start: 0, end: 0 };
  const dailyStart = gameDayStart(seconds);
  if (scope === 'daily' || scope === 'daily_active') {
    return { key: String(dailyStart), start: dailyStart, end: dailyStart + DAY_SECONDS };
  }
  if (scope !== 'weekly') throw new GameError(5, 'Task scope is invalid');
  const localDate = new Date((dailyStart + 8 * 3600) * 1000);
  const mondayOffset = (localDate.getUTCDay() + 6) % 7;
  const start = dailyStart - mondayOffset * DAY_SECONDS;
  return { key: String(start), start, end: start + 7 * DAY_SECONDS };
}

function visibleDay(createdAt, milliseconds) {
  const created = Number(createdAt);
  const seconds = Math.floor(Number(milliseconds) / 1000);
  if (!Number.isSafeInteger(created) || created <= 0 || !Number.isSafeInteger(seconds)) {
    throw new GameError(5, 'Role creation time is invalid');
  }
  return Math.floor((gameDayStart(seconds) - gameDayStart(created)) / DAY_SECONDS) + 1;
}

function configuredAwards(config, label = 'Task') {
  const awards = Array.isArray(config?.award) ? config.award : [];
  return awards.map(pair => {
    const tid = Number(pair?.[0]), count = Number(pair?.[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, `${label} reward configuration is invalid`);
    }
    return [tid, count];
  });
}

function rewardObjects(awards) {
  const totals = new Map();
  for (const [tid, count] of awards) totals.set(String(tid), (totals.get(String(tid)) ?? 0n) + BigInt(count));
  return [...totals].map(([tid, count]) => ({ tid, num: count.toString() }));
}

function emptyList(value) {
  return value && typeof value === 'object' && Array.isArray(value.value) ? value : { value: [], improper: false };
}

function unpackSlot(codec, module, index, schema) {
  emptyList(module);
  while (module.value.length <= index) module.value.push(serializedBinary(Buffer.alloc(0)));
  const bytes = rawBinary(module.value[index]);
  return bytes.length ? codec.unpack(schema, bytes) : {};
}

function taskMap(tables, scope) {
  if (scope === 'daily') return tables.DailyTask;
  if (scope === 'weekly') return tables.WeeklyTask;
  if (scope === 'main') return tables.MainTask;
  throw new GameError(5, 'Task scope is invalid');
}

function taskOrder(scope, task) {
  const sortOrder = Number(task?.sortOrder);
  if (scope !== 'main' && Number.isSafeInteger(sortOrder)) return sortOrder;
  return Number(task?.tid) || Number.MAX_SAFE_INTEGER;
}

export function createEveryTaskService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(`
    CREATE TABLE IF NOT EXISTS every_task_claims (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      scope TEXT NOT NULL CHECK(scope IN ('daily','main','weekly','daily_active')),
      period_key TEXT NOT NULL,
      task_id INTEGER NOT NULL CHECK(task_id>0),
      claimed_at TEXT NOT NULL,
      PRIMARY KEY(role_id,scope,period_key,task_id)
    );
    CREATE INDEX IF NOT EXISTS every_task_claims_period_idx
      ON every_task_claims(role_id,scope,period_key);
  `));

  function claimedIds(db, roleId, scope, periodKey) {
    if (!SCOPES.has(scope)) throw new GameError(5, 'Task scope is invalid');
    return new Set(db.prepare(
      'SELECT task_id FROM every_task_claims WHERE role_id=? AND scope=? AND period_key=? ORDER BY task_id'
    ).all(roleId, scope, periodKey).map(row => Number(row.task_id)));
  }

  function activeDailyTasks(model, milliseconds) {
    const day = visibleDay(model.state.createdAt, milliseconds);
    const offsets = tables.DailyTaskOffsetGroup ?? new Map();
    return [...(tables.DailyTask?.values() ?? [])]
      .filter(task => {
        const range = Array.isArray(task.day_range) ? task.day_range.map(Number) : [];
        if (range.length !== 2 || day < range[0] || day > range[1]) return false;
        const offset = offsets.get(Number(task.compensate_group_id));
        return !offset || Number(offset.open_day ?? 1) <= day;
      })
      .sort((left, right) => taskOrder('daily', left) - taskOrder('daily', right) || Number(left.tid) - Number(right.tid));
  }

  function activeTasks(scope, model, milliseconds) {
    if (scope === 'daily') return activeDailyTasks(model, milliseconds);
    return [...(taskMap(tables, scope)?.values() ?? [])]
      .sort((left, right) => taskOrder(scope, left) - taskOrder(scope, right) || Number(left.tid) - Number(right.tid));
  }

  function taskById(scope, taskId) {
    return taskMap(tables, scope)?.get(Number(taskId)) ?? null;
  }

  function progressOf(model, task) {
    return currentTaskProgress(model, {
      ...task,
      task_type: task.task_type ?? task.type
    }, codec, tables);
  }

  function dailyVitalityConfig(model, milliseconds) {
    const day = visibleDay(model.state.createdAt, milliseconds);
    return [...(tables.DailyTaskVitality?.values() ?? [])]
      .filter(row => Number(row.open_day ?? 1) <= day)
      .sort((left, right) => Number(left.open_day ?? 1) - Number(right.open_day ?? 1) || Number(left.tid) - Number(right.tid))
      .at(-1) ?? null;
  }

  function activeStageConfig(model, stage, milliseconds) {
    const config = dailyVitalityConfig(model, milliseconds);
    if (!config) throw new GameError(5, 'Daily activity reward is not configured');
    const values = Array.isArray(config.value) ? config.value.map(Number).filter(Number.isSafeInteger) : [];
    if (!values.length) throw new GameError(5, 'Daily activity thresholds are not configured');
    const stages = [1, 2, 3, 4].filter(index => (
      (Array.isArray(config[`award_${index}`]) && config[`award_${index}`].length > 0) ||
      (Array.isArray(config[`award_${index}_n`]) && config[`award_${index}_n`].length > 0)
    ));
    if (!Number.isSafeInteger(stage) || !stages.includes(stage)) throw new GameError(1, 'Invalid daily activity reward stage');
    // Generated rows currently carry one base threshold. Missing later entries
    // are represented as equally spaced stages in the client's 4-stage bitmap.
    const threshold = Number.isSafeInteger(values[stage - 1])
      ? values[stage - 1]
      : values.at(-1) * (stage - values.length + 1);
    const ids = Array.isArray(config[`award_${stage}`]) ? config[`award_${stage}`] : [];
    const counts = Array.isArray(config[`award_${stage}_n`]) ? config[`award_${stage}_n`] : [];
    if (ids.length !== counts.length) throw new GameError(5, 'Daily activity reward configuration is invalid');
    const awards = ids.map((tid, index) => {
      const id = Number(tid), count = Number(counts[index]);
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(count) || count <= 0) {
        throw new GameError(5, 'Daily activity reward configuration is invalid');
      }
      return [id, count];
    });
    return { stage, threshold, awards };
  }

  function currentVitality(model, milliseconds, db, roleId) {
    const period = periodFor('daily', milliseconds);
    const claimed = claimedIds(db, roleId, 'daily', period.key);
    return activeDailyTasks(model, milliseconds)
      .filter(task => claimed.has(Number(task.tid)))
      .reduce((sum, task) => sum + Math.max(0, Number(task.vitality) || 0), 0);
  }

  function bitsFromIds(ids) {
    let bits = Buffer.alloc(0);
    for (const id of ids) {
      const index = Number(id);
      if (Number.isSafeInteger(index) && index > 0) bits = setBit(bits, index);
    }
    return bits;
  }

  function rebuildLoginState(model, db, milliseconds) {
    const roleId = model.state.roleId;
    const modules = new Map(model.state.modules.value);
    const module = emptyList(modules.get(EVERY_TASK_MODULE));
    const daily = unpackSlot(codec, module, SLOTS.daily, 'pb_daily_task');
    const main = unpackSlot(codec, module, SLOTS.main, 'pb_main_task');
    const weekly = unpackSlot(codec, module, SLOTS.weekly, 'pb_weekly_task');
    const dailyPeriod = periodFor('daily', milliseconds);
    const weeklyPeriod = periodFor('weekly', milliseconds);
    const dailyClaims = claimedIds(db, roleId, 'daily', dailyPeriod.key);
    const activeClaims = claimedIds(db, roleId, 'daily_active', dailyPeriod.key);
    const weeklyClaims = claimedIds(db, roleId, 'weekly', weeklyPeriod.key);
    const mainClaims = claimedIds(db, roleId, 'main', 'main');

    daily.finish_tid_list = bitsFromIds([...dailyClaims].sort((left, right) => left - right)).toString('base64');
    daily.vitality = activeDailyTasks(model, milliseconds)
      .filter(task => dailyClaims.has(Number(task.tid)))
      .reduce((sum, task) => sum + Math.max(0, Number(task.vitality) || 0), 0);
    daily.vitality_stage = bitsFromIds([...activeClaims].sort((left, right) => left - right)).toString('base64');
    daily.refresh_time = String(dailyPeriod.end);
    weekly.finish_tid_list = bitsFromIds([...weeklyClaims].sort((left, right) => left - right)).toString('base64');
    weekly.refresh_time = String(weeklyPeriod.end);
    main.task_list = [...mainClaims].sort((left, right) => left - right).flatMap(tid => {
      const task = tables.MainTask?.get(tid);
      return task ? [{ task_type: Number(task.type), tid }] : [];
    });

    module.value[SLOTS.daily] = serializedBinary(codec.pack('pb_daily_task', daily));
    module.value[SLOTS.main] = serializedBinary(codec.pack('pb_main_task', main));
    module.value[SLOTS.weekly] = serializedBinary(codec.pack('pb_weekly_task', weekly));
    modules.set(EVERY_TASK_MODULE, module);
    model.state.modules.value = [...modules];
    return { daily, main, weekly };
  }

  function ensureLoginState() {
    const milliseconds = Number(now());
    return store.transaction((model, db) => rebuildLoginState(model, db, milliseconds));
  }

  function claimTasks(scope, requestedId) {
    const all = requestedId == null;
    if (!all && (!Number.isSafeInteger(Number(requestedId)) || Number(requestedId) <= 0)) {
      throw new GameError(1, `Invalid ${scope} task id`);
    }
    const milliseconds = Number(now());
    const period = periodFor(scope, milliseconds);
    return store.transaction((model, db) => {
      const tasks = all ? activeTasks(scope, model, milliseconds) : [taskById(scope, requestedId)];
      if (tasks.some(task => !task)) throw new GameError(1, `Invalid ${scope} task id`);
      if (!all && scope === 'daily' && !activeDailyTasks(model, milliseconds).some(task => Number(task.tid) === Number(requestedId))) {
        throw new GameError(1, 'Invalid daily task id');
      }
      const already = claimedIds(db, model.state.roleId, scope, period.key);
      if (!all && already.has(Number(requestedId))) throw new GameError(310, 'Every-task reward already claimed');

      const claimed = [], skipped = [];
      const awards = [];
      for (const task of tasks) {
        const taskId = Number(task.tid);
        if (already.has(taskId)) { skipped.push({ taskId, reason: 'claimed' }); continue; }
        let progress;
        try { progress = progressOf(model, task); }
        catch (error) {
          if (!all) throw error;
          skipped.push({ taskId, reason: error instanceof GameError ? error.message : 'progress unavailable' });
          continue;
        }
        if (progress < Number(task.target_count)) {
          if (!all) throw new GameError(5, `${scope} task is not complete`);
          skipped.push({ taskId, reason: 'incomplete', progress });
          continue;
        }
        db.prepare('INSERT INTO every_task_claims VALUES (?,?,?,?,?)').run(
          model.state.roleId, scope, period.key, taskId, new Date(milliseconds).toISOString()
        );
        claimed.push({ taskId, progress, type: Number(task.type) });
        awards.push(...configuredAwards(task, `${scope} task`));
      }

      const reward = grantResources(model, awards, tables, { codec });
      const state = rebuildLoginState(model, db, milliseconds);
      let data;
      if (scope === 'daily') {
        data = codec.pack('daily_receive_back', {
          daily_task: state.daily,
          res: { changes: reward.changes, is_overflow: false },
          normal_res_list: rewardObjects(awards),
          weekend_res_list: [],
          weekend_acc_res_list: state.daily.weekend_acc_res_list ?? []
        });
      } else if (scope === 'weekly') {
        data = codec.pack('weekly_receive_back', {
          weekly_task: state.weekly,
          res: { changes: reward.changes, is_overflow: false }
        });
      } else {
        data = codec.pack('main_receive_back', {
          main_task: state.main,
          res: { changes: reward.changes, is_overflow: false }
        });
      }
      return { data, value: { scope, periodKey: period.key, claimed, skipped, changes: reward.changes.length } };
    });
  }

  function claimDailyActive(stageValue) {
    const stage = Number(stageValue);
    if (!Number.isSafeInteger(stage) || stage <= 0) throw new GameError(1, 'Invalid daily activity reward stage');
    const milliseconds = Number(now());
    const period = periodFor('daily', milliseconds);
    return store.transaction((model, db) => {
      const config = activeStageConfig(model, stage, milliseconds);
      const already = claimedIds(db, model.state.roleId, 'daily_active', period.key);
      if (already.has(stage)) throw new GameError(310, 'Daily activity reward already claimed');
      const vitality = currentVitality(model, milliseconds, db, model.state.roleId);
      if (vitality < config.threshold) throw new GameError(5, 'Daily activity reward is not available');

      db.prepare('INSERT INTO every_task_claims VALUES (?,?,?,?,?)').run(
        model.state.roleId, 'daily_active', period.key, stage, new Date(milliseconds).toISOString()
      );
      const reward = grantResources(model, config.awards, tables, { codec });
      const state = rebuildLoginState(model, db, milliseconds);
      const data = codec.pack('daily_receive_back', {
        daily_task: state.daily,
        res: { changes: reward.changes, is_overflow: false },
        normal_res_list: rewardObjects(config.awards),
        weekend_res_list: [],
        weekend_acc_res_list: state.daily.weekend_acc_res_list ?? []
      });
      return { data, value: { scope: 'daily_active', periodKey: period.key, stage, vitality, changes: reward.changes.length } };
    });
  }

  return {
    supports: type => type === 9003 || SINGLE_TYPES.has(type) || ALL_TYPES.has(type),
    ensureLoginState,
    execute(type, input) {
      if (SINGLE_TYPES.has(type)) return claimTasks(SINGLE_TYPES.get(type), input);
      if (ALL_TYPES.has(type)) {
        if (input != null && !(Array.isArray(input) && input.length === 0)) throw new GameError(1, 'One-key task claim takes no parameters');
        return claimTasks(ALL_TYPES.get(type), null);
      }
      if (type === 9003) return claimDailyActive(input);
      throw new GameError(5, 'Every-task command is not implemented');
    },
    logClaim(result) { log({ event: 'every_task_committed', ...result.value }); }
  };
}
