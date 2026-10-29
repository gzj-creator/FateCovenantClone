import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const TASK_MODULE = 90;
const MISSION_MODULE = 8;
const MAIN_LINEAR_TASK_PROGRESS = 1201;

function taskGroupIndex(tables, taskType) {
  const rows = [...tables.CommonTaskGlobal.entries()].sort(([left], [right]) => left - right);
  const index = rows.findIndex(([, row]) => Number(row.type) === Number(taskType));
  if (index < 0) throw new GameError(5, 'Linear task group is not configured');
  return index;
}

function currentProgress(model, config, codec) {
  if (Number(config.task_type) !== MAIN_LINEAR_TASK_PROGRESS) throw new GameError(5, 'Linear task progress is not implemented');
  const module = new Map(model.state.modules.value).get(MISSION_MODULE);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
  const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
  return Number(mission.mission_id ?? 0);
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
    const moduleIndex = taskGroupIndex(tables, config.task_type);
    const awards = configuredAwards(config);
    if (awards.some(([tid, count]) => !Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0)) throw new GameError(5, 'Linear task reward configuration is invalid');

    return store.transaction((model, db) => {
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'linear_task', String(id))) throw new GameError(310, 'Linear task reward already claimed');
      const progress = currentProgress(model, config, codec);
      if (progress < Number(config.target_count)) throw new GameError(5, 'Linear task is not complete');

      const module = new Map(model.state.modules.value).get(TASK_MODULE);
      if (!module || !Array.isArray(module.value) || !module.value[moduleIndex]) throw new GameError(5, 'Linear task login data is missing');
      const taskData = codec.unpack('pb_linear_task_data', rawBinary(module.value[moduleIndex]));
      taskData.task_list ??= [];
      const task = { type: Number(config.type), receive_tid: id, snapshot_val: progress };
      const existing = taskData.task_list.find(row => Number(row.type) === Number(config.type));
      if (Number(existing?.receive_tid) === id) throw new GameError(310, 'Linear task reward already claimed');
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
