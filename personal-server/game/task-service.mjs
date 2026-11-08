import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readCommonTaskTables } from '../config/common-task-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const TASK_MODULE = 90;
const MISSION_MODULE = 8;
const STATISTICS_MODULE = 21;
const DESTINY_MODULE = 107;
const ELITE_MISSION_MODULE = 140;
const ROLE_STATISTICS_TYPE = 0;
const MAIN_LINEAR_TASK_PROGRESS = 1201;
const DESTINY_REAL_STAGE_PROGRESS = 155;
const HERO_MAX_STAR_PROGRESS = 66;
const HERO_MAX_MASTERY_BREAK_PROGRESS = 81;
const PASSED_SECTION_PROGRESS = 2;
const PASSED_CHAPTER_PROGRESS = 10;
const ELITE_CHAPTER_PROGRESS = 247;
const COMMON_TASK_BASE_NUMBER = 10000;

function taskGroupIndex(config, offset = 0) {
  const groupType = Number(config.type);
  if (!Number.isSafeInteger(groupType) || groupType <= 0) throw new GameError(5, 'Linear task group is not configured');
  return offset + groupType - 1;
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

function heroMaxProgress(model, config, field) {
  const heroTid = String(config.task_param ?? '');
  const heroes = (model.heroInfo?.hero_list ?? []).filter(hero => String(hero.tid) === heroTid);
  if (!heroes.length) return 0;
  return Math.max(0, ...heroes.map(hero => Number(hero[field] ?? 0)));
}

export function currentTaskProgress(model, config, codec, tables) {
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
  if (typeConfig?.progress_type === 1 && Number(typeConfig.progress_fun) === HERO_MAX_STAR_PROGRESS) {
    return heroMaxProgress(model, config, 'star');
  }
  if (typeConfig?.progress_type === 1 && Number(typeConfig.progress_fun) === HERO_MAX_MASTERY_BREAK_PROGRESS) {
    return heroMaxProgress(model, config, 'mastery_break');
  }
  throw new GameError(5, 'Linear task progress is not implemented');
}

// MissionMgr numbers journey nodes as chapter*100 + index; the common-task group 1201
// targets use the same numbering (for example 106 is "chapter 1, section 6"), so the
// current mission cursor converts to a comparable key.
function journeyKey(row) {
  const chapter = Number(row?.belong_chapter);
  const index = Number(row?.index);
  if (!Number.isSafeInteger(chapter) || !Number.isSafeInteger(index)) return null;
  return chapter * 100 + index;
}

function missionCursorRow(model, codec) {
  const module = new Map(model.state.modules.value).get(MISSION_MODULE);
  if (!module || !Array.isArray(module.value) || !module.value[0]) throw new GameError(5, 'Mission login module is missing');
  let mission;
  try {
    mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
  } catch {
    throw new GameError(5, 'Mission login module is invalid');
  }
  const missionId = Number(mission.mission_id ?? 0);
  if (!Number.isSafeInteger(missionId) || missionId < 0) throw new GameError(5, 'Mission login module is invalid');
  if (missionId === 0) return null;
  const row = readMissionTables().sections.get(missionId);
  if (!row) throw new GameError(5, 'Mission login module is invalid');
  return row;
}

function eliteMissionCursorRow(model, codec, tables) {
  const module = new Map(model.state.modules.value).get(ELITE_MISSION_MODULE);
  if (!module) throw new GameError(5, 'Elite mission login module is missing');
  const bytes = rawBinary(module.value?.[0] ?? module);
  if (!bytes.length) return null;
  let info;
  try {
    info = codec.unpack('pb_elite_mission', bytes);
  } catch {
    throw new GameError(5, 'Elite mission login module is invalid');
  }
  const missionId = Number(info.mission_id ?? 0);
  if (!Number.isSafeInteger(missionId) || missionId < 0) throw new GameError(5, 'Elite mission login module is invalid');
  if (missionId === 0) return null;
  const row = tables.EliteMission?.get(missionId);
  if (!row) throw new GameError(5, 'Elite mission login module is invalid');
  return row;
}

// A chapter counts as passed once every node in it sits behind the cursor.
function passedChapterCount(rows, cursorKey) {
  const maxByChapter = new Map();
  for (const row of rows) {
    const key = journeyKey(row);
    if (key == null) continue;
    const chapter = Number(row.belong_chapter);
    const current = maxByChapter.get(chapter);
    if (current === undefined || key > current) maxByChapter.set(chapter, key);
  }
  let passed = 0;
  for (const max of maxByChapter.values()) if (max < cursorKey) passed += 1;
  return passed;
}

function commonTaskProgress(model, config, codec, tables) {
  const typeConfig = tables.TaskType.get(Number(config.type));
  if (!typeConfig) throw new GameError(5, 'Common task progress is not configured');
  if (Number(typeConfig.progress_type) !== 1) throw new GameError(5, 'Common task progress is not implemented');
  const progressFun = Number(typeConfig.progress_fun);
  if (progressFun === PASSED_SECTION_PROGRESS) {
    const row = missionCursorRow(model, codec);
    const key = journeyKey(row);
    // The cursor sits on the next node to play, so the last passed node is the one before it.
    return key == null ? 0 : Math.max(0, key - 1);
  }
  if (progressFun === PASSED_CHAPTER_PROGRESS) {
    const key = journeyKey(missionCursorRow(model, codec));
    if (key == null) return 0;
    return passedChapterCount(readMissionTables().sections.values(), key);
  }
  if (progressFun === ELITE_CHAPTER_PROGRESS) {
    if (!(tables.EliteMission instanceof Map)) throw new GameError(5, 'Elite mission configuration is unavailable');
    const key = journeyKey(eliteMissionCursorRow(model, codec, tables));
    if (key == null) return 0;
    return passedChapterCount(tables.EliteMission.values(), key);
  }
  throw new GameError(5, 'Common task progress is not implemented');
}

// Common-task rows recovered from TaskTable.CommonTask.<type> carry no award columns:
// every row of the four shipped groups has award/award_n = nil. Keep the same
// tid+count shape used by linear tasks so a group that later gains reward data
// grants it, and let the claim itself stay authoritative through receive_list.
function commonTaskAwards(row) {
  const awards = Array.isArray(row.award) ? row.award : [];
  const counts = Array.isArray(row.award_n) ? row.award_n : [];
  const pairs = awards.map((entry, index) => {
    if (Array.isArray(entry)) {
      if (entry.length !== 2) throw new GameError(5, 'Common task reward configuration is invalid');
      return [Number(entry[0]), Number(entry[1])];
    }
    return [Number(entry), Number(counts[index] ?? 1)];
  });
  for (const [tid, count] of pairs) {
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, 'Common task reward configuration is invalid');
    }
  }
  return pairs;
}

// The codec decodes protobuf bytes fields as base64 strings, while module payloads hold
// serialized ETF binaries. Accept both so a slot written by login and a slot rewritten by
// this service stay byte-identical.
function binaryField(value) {
  if (value == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (value?.value?.data) return Buffer.from(value.value.data);
  throw new GameError(5, 'Common task login data is invalid');
}

function configuredAwards(config) {
  const awards = Array.isArray(config.award) ? config.award : [];
  return awards.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, 'Linear task reward configuration is invalid');
    return [Number(pair[0]), Number(pair[1])];
  });
}

export function createTaskService({ store, codec, tables, commonTasks = readCommonTaskTables(), now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function commonTaskEntry(taskId) {
    for (const [type, rows] of commonTasks.groups) {
      const row = rows.get(taskId);
      if (row) return { type, row };
    }
    return null;
  }

  function readCommonTaskSlot(model, slot) {
    const module = new Map(model.state.modules.value).get(TASK_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Common task login data is missing');
    const payload = module.value[slot];
    if (payload == null) return { receive_list: Buffer.alloc(0) };
    try {
      return codec.unpack('pb_common_task', rawBinary(payload));
    } catch {
      throw new GameError(5, 'Common task login data is invalid');
    }
  }

  function claimCommonTask(input) {
    const requested = Array.isArray(input) ? input : [input];
    if (!requested.length) throw new GameError(1, 'Invalid common task id');
    const ids = requested.map(Number);
    for (const id of ids) if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, 'Invalid common task id');

    const entries = ids.map(id => {
      const entry = commonTaskEntry(id);
      if (!entry) throw new GameError(1, 'Invalid common task id');
      return entry;
    });
    const type = entries[0].type;
    if (entries.some(entry => entry.type !== type)) throw new GameError(1, 'Common task ids must belong to one group');
    const slot = commonTasks.slots.get(type);
    if (!Number.isSafeInteger(slot) || slot < 0) throw new GameError(5, 'Common task group slot is not configured');

    return store.transaction((model, db) => {
      const taskData = readCommonTaskSlot(model, slot);
      let receiveList = binaryField(taskData.receive_list);
      const changes = [];
      for (const { row } of entries) {
        const tid = row.tid;
        const bit = tid % COMMON_TASK_BASE_NUMBER;
        if (hasBit(receiveList, bit)) throw new GameError(310, 'Common task reward already claimed');
        if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'common_task', String(tid))) {
          throw new GameError(310, 'Common task reward already claimed');
        }
        const progress = commonTaskProgress(model, row, codec, tables);
        if (progress < row.target_count) throw new GameError(5, 'Common task is not complete');
        receiveList = setBit(receiveList, bit);
        db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'common_task', String(tid), new Date(now()).toISOString());
        const awards = commonTaskAwards(row);
        if (awards.length) changes.push(...grantResources(model, awards, tables).changes);
      }

      const modules = new Map(model.state.modules.value);
      const module = modules.get(TASK_MODULE);
      const values = Array.isArray(module.value) ? [...module.value] : [];
      while (values.length <= slot) values.push(serializedBinary(codec.pack('pb_common_task', { receive_list: Buffer.alloc(0) })));
      const encodedList = receiveList.toString('base64');
      values[slot] = serializedBinary(codec.pack('pb_common_task', { receive_list: encodedList }));
      module.value = values;
      modules.set(TASK_MODULE, module);
      model.state.modules.value = [...modules];

      const value = { common_task: { receive_list: encodedList }, res_change: { changes, is_overflow: false } };
      return { value, data: codec.pack('common_receive_back', { common_task: value.common_task, res: value.res_change }) };
    });
  }

  function claimLinearTask(taskId) {
    const id = Number(taskId), config = tables.LinearTask.get(id);
    if (!Number.isSafeInteger(id) || !config) throw new GameError(1, 'Invalid linear task id');
    // MainLinearTaskMgr stores task rows by LinearTask.type and parses them after the
    // common-task groups consume their own module 90 slots (four groups today, matching
    // the five empty slots in the captured login payload). All current linear tasks use
    // type 1, which therefore maps to the slot right behind the common groups.
    const moduleIndex = taskGroupIndex(config, commonTasks.groups.size);
    const awards = configuredAwards(config);
    if (awards.some(([tid, count]) => !Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0)) throw new GameError(5, 'Linear task reward configuration is invalid');

    return store.transaction((model, db) => {
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'linear_task', String(id))) throw new GameError(310, 'Linear task reward already claimed');
      const progress = currentTaskProgress(model, config, codec, tables);
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
    supports: type => type === 9010 || type === 9005,
    execute(type, input) {
      if (type === 9010) {
        const result = claimLinearTask(input);
        log({ event: 'linear_task_claimed', taskId: Number(input), changes: result.value.res_change.changes.length });
        return result;
      }
      if (type === 9005) {
        const result = claimCommonTask(input);
        const ids = Array.isArray(input) ? input.map(Number) : [Number(input)];
        log({ event: 'common_task_claimed', types: ids, changes: result.value.res_change.changes.length });
        return result;
      }
      throw new GameError(5, 'Task command is not implemented');
    }
  };
}
