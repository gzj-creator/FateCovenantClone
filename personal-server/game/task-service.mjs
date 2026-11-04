import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const TASK_MODULE = 90;
const MISSION_MODULE = 8;
const STATISTICS_MODULE = 21;
const DESTINY_MODULE = 107;
const ROLE_STATISTICS_TYPE = 0;
const MAIN_LINEAR_TASK_PROGRESS = 1201;
const DESTINY_REAL_STAGE_PROGRESS = 155;

function taskGroupIndex(config) {
  const groupType = Number(config.type);
  if (!Number.isSafeInteger(groupType) || groupType <= 0) throw new GameError(5, 'Linear task group is not configured');
  return groupType - 1;
}

function totalStatisticProgress(model, config, codec, tables) {
  const typeConfig = tables.TaskType.get(Number(config.task_type));
  if (!typeConfig || !Array.isArray(typeConfig.stat_expand)) throw new GameError(5, 'Linear task statistics are not configured');

  const statisticsType = Number(typeConfig.data);
  const roleStatistics = [...tables.CountStatistics.values()]
    .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
  const statisticsIndex = roleStatistics.findIndex(row => Number(row.tid) === statisticsType);
  if (statisticsIndex < 0) throw new GameError(5, 'Linear task statistics are not configured');

  const module = new Map(model.state.modules.value).get(STATISTICS_MODULE);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Statistics login module is missing');
  const payload = module.value[statisticsIndex + 1];
  if (payload == null) return 0;

  let data;
  try {
    data = codec.unpack('pb_count_statics_data', rawBinary(payload));
  } catch {
    throw new GameError(5, 'Linear task statistics are invalid');
  }
  const ids = new Set(typeConfig.stat_expand.map(String));
  let total = 0n;
  for (const row of data.list ?? []) {
    if (!ids.has(String(row.id))) continue;
    const value = BigInt(row.total ?? 0);
    if (value < 0n) throw new GameError(5, 'Linear task statistics are invalid');
    total += value;
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(5, 'Linear task statistics are invalid');
  return Number(total);
}

function destinyStageProgress(model, codec) {
  const module = new Map(model.state.modules.value).get(DESTINY_MODULE);
  if (!module) throw new GameError(5, 'Destiny login module is missing');

  let bytes;
  try {
    bytes = rawBinary(module);
  } catch {
    throw new GameError(5, 'Destiny login module is invalid');
  }
  if (!bytes.length) throw new GameError(5, 'Destiny login module is missing');

  let data;
  try {
    data = codec.unpack('pb_destiny_data', bytes);
  } catch {
    throw new GameError(5, 'Destiny login module is invalid');
  }
  // DestinyMgr.RealStage returns the raw saved current stage. The client's
  // visible "stage 0" label is a separate display normalization.
  const stage = Number(data.cur_stage ?? 0);
  if (!Number.isSafeInteger(stage) || stage < 1) throw new GameError(5, 'Destiny login module is invalid');
  return stage;
}

function currentProgress(model, config, codec, tables) {
  const taskType = Number(config.task_type);
  if (taskType === MAIN_LINEAR_TASK_PROGRESS) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    return Number(mission.mission_id ?? 0);
  }
  const typeConfig = tables.TaskType.get(taskType);
  if (typeConfig?.progress_type === 2) return totalStatisticProgress(model, config, codec, tables);
  if (typeConfig?.progress_type === 1 && Number(typeConfig.progress_fun) === DESTINY_REAL_STAGE_PROGRESS) {
    return destinyStageProgress(model, codec);
  }
  throw new GameError(5, 'Linear task progress is not implemented');
}

function configuredAwards(config) {
  const awards = Array.isArray(config.award) ? config.award : [];
  return awards.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, 'Linear task reward configuration is invalid');
    return [Number(pair[0]), Number(pair[1])];
  });
}

export function createTaskService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function claimLinearTask(taskId) {
    const id = Number(taskId), config = tables.LinearTask.get(id);
    if (!Number.isSafeInteger(id) || !config) throw new GameError(1, 'Invalid linear task id');
    // MainLinearTaskMgr stores task rows by LinearTask.type. All current
    // linear tasks use type 1, whose one-based group maps to module slot 0.
    const moduleIndex = taskGroupIndex(config);
    const awards = configuredAwards(config);
    if (awards.some(([tid, count]) => !Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0)) throw new GameError(5, 'Linear task reward configuration is invalid');

    return store.transaction((model, db) => {
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'linear_task', String(id))) throw new GameError(310, 'Linear task reward already claimed');
      const progress = currentProgress(model, config, codec, tables);
      if (progress < Number(config.target_count)) throw new GameError(5, 'Linear task is not complete');

      const module = new Map(model.state.modules.value).get(TASK_MODULE);
      if (!module || !Array.isArray(module.value) || !module.value[moduleIndex]) throw new GameError(5, 'Linear task login data is missing');
      const taskData = codec.unpack('pb_linear_task_data', rawBinary(module.value[moduleIndex]));
      taskData.task_list ??= [];
      // snapshot_val belongs to the task that is currently active and needs
      // activation. A claimed task must not leave its progress as a baseline:
      // LinearTask groups share one taskMap entry, so a mission-id baseline
      // would otherwise be subtracted from unrelated statistic counters (for
      // example stamina consumption) and produce negative UI progress.
      const task = { type: Number(config.type), receive_tid: id, snapshot_val: 0 };
      const existing = taskData.task_list.find(row => Number(row.type) === Number(config.type));
      const requestedOrder = Number(config.sortOrder);
      if (!Number.isSafeInteger(requestedOrder)) throw new GameError(5, 'Linear task order is invalid');
      if (existing) {
        const claimedId = Number(existing.receive_tid);
        const claimedConfig = tables.LinearTask.get(claimedId);
        const claimedOrder = Number(claimedConfig?.sortOrder);
        if (!Number.isSafeInteger(claimedOrder)) throw new GameError(5, 'Linear task login order is invalid');
        if (requestedOrder <= claimedOrder) throw new GameError(310, 'Linear task reward already claimed');
      }
      if (existing) Object.assign(existing, task); else taskData.task_list.push(task);

      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'linear_task', String(id), new Date(now()).toISOString());
      const reward = grantResources(model, awards, tables);
      const res = { changes: reward.changes, is_overflow: false };
      const modules = new Map(model.state.modules.value);
      module.value[moduleIndex] = serializedBinary(codec.pack('pb_linear_task_data', taskData));
      modules.set(TASK_MODULE, module);
      model.state.modules.value = [...modules];
      const value = { task, res_change: res };
      return { value, data: codec.pack('pb_linear_task_receive_back', value) };
    });
  }

  return {
    supports: type => type === 9010,
    execute(type, taskId) {
      if (type !== 9010) throw new GameError(5, 'Task command is not implemented');
      const result = claimLinearTask(taskId);
      log({ event: 'linear_task_claimed', taskId: Number(taskId), changes: result.value.res_change.changes.length });
      return result;
    }
  };
}
