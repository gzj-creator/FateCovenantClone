import { readJsonAsset, tableAsset } from '../assets.mjs';

// TaskAwardTable.data.lua is shipped by client 1.55.090365. The source dump
// is retained together with its LuaJIT SHA256 so this family cannot silently
// inherit GrowthRoad or another activity's versions and rewards.
const defaultPath = tableAsset('TaskAwardTable.data.rows.json');
let defaultCache;

export const TASK_AWARD_TABLE_SOURCE_SHA256 = 'fb8e1788151b97eae71afda545ec266009f1c95795a6c6f0f64b7ea64896a21f';
export const TASK_AWARD_TABLE_COUNTS = Object.freeze({
  ActiveTaskAwardVersion: 1,
  ActiveTaskAwardTask: 263,
  ActiveTaskAwardProgress: 6,
  ActiveTaskAwardTag: 4
});

function rowsOf(dump, name) {
  const family = dump?.families?.[name];
  if (!family || !Array.isArray(family.rows) || family.count !== TASK_AWARD_TABLE_COUNTS[name] || family.rows.length !== family.count) {
    throw new Error(`Task award table ${name} has an unexpected row count`);
  }
  return family.rows;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid task award ${label}`);
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid task award ${label}`);
  return number;
}

function byTid(rows, label) {
  const result = new Map();
  for (const row of rows) {
    const tid = positiveInteger(row.tid, label);
    if (result.has(tid)) throw new Error(`Duplicate task award ${label}: ${tid}`);
    result.set(tid, { ...row, tid });
  }
  return result;
}

function awardList(value, label) {
  if (!Array.isArray(value)) throw new Error(`Invalid task award ${label}`);
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid task award ${label}`);
    return [positiveInteger(pair[0], label), positiveInteger(pair[1], label)];
  });
}

export function readTaskAwardTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  if (dump?.sha256 !== TASK_AWARD_TABLE_SOURCE_SHA256) {
    throw new Error('Task award table source SHA256 does not match the recovered client table');
  }

  const tags = byTid(rowsOf(dump, 'ActiveTaskAwardTag'), 'tag id');
  const versions = byTid(rowsOf(dump, 'ActiveTaskAwardVersion'), 'version id');
  const tasks = byTid(rowsOf(dump, 'ActiveTaskAwardTask'), 'task id');
  const progress = byTid(rowsOf(dump, 'ActiveTaskAwardProgress'), 'progress id');

  for (const [tid, row] of tasks) {
    const tag = positiveInteger(row.tag, `task ${tid} tag`);
    if (!tags.has(tag)) throw new Error(`Task award task ${tid} references unknown tag ${tag}`);
    positiveInteger(row.type, `task ${tid} type`);
    positiveInteger(row.target_count, `task ${tid} target`);
    nonNegativeInteger(row.growth_value, `task ${tid} growth value`);
    awardList(row.award_list, `task ${tid} reward`);
    if (tid % 1000 === 0) throw new Error(`Task award task ${tid} cannot be addressed by the client bitmap`);
  }

  const taskBits = new Map();
  for (const tid of tasks.keys()) {
    const bit = tid % 1000;
    if (taskBits.has(bit)) throw new Error(`Task award tasks ${taskBits.get(bit)} and ${tid} share bitmap index ${bit}`);
    taskBits.set(bit, tid);
  }

  for (const [tid, row] of progress) {
    positiveInteger(row.stage, `progress ${tid} stage`);
    positiveInteger(row.need_count, `progress ${tid} threshold`);
    for (const key of ['award', 'award_n', 'overdue_award', 'overdue_award_n']) {
      nonNegativeInteger(row[key], `progress ${tid} ${key}`);
    }
    if (tid % 1000 === 0) throw new Error(`Task award progress ${tid} cannot be addressed by the client bitmap`);
  }

  const progressBits = new Map();
  for (const tid of progress.keys()) {
    const bit = tid % 1000;
    if (progressBits.has(bit)) {
      throw new Error(`Task award progress ${progressBits.get(bit)} and ${tid} share bitmap index ${bit}`);
    }
    progressBits.set(bit, tid);
  }

  if (versions.size !== 1) throw new Error('Task award must expose exactly one version row');
  const versionRow = [...versions.values()][0];
  const version = positiveInteger(versionRow.tid, 'version id');
  if (version !== 1 || nonNegativeInteger(versionRow.skin_limit_day, 'skin limit day') !== 9998) {
    throw new Error('Task award version does not match the shipped activity configuration');
  }

  const progressList = [...progress.values()]
    .sort((left, right) => Number(left.need_count) - Number(right.need_count) || left.tid - right.tid);
  const table = Object.freeze({
    source: dump.source,
    sourceSha256: dump.sha256,
    version,
    versionRow: Object.freeze(versionRow),
    tags,
    tasks,
    progress,
    progressList: Object.freeze(progressList)
  });
  if (file === defaultPath) defaultCache = table;
  return table;
}
