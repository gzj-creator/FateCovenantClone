import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('FirstWeekGoalTable.data.lua.json.gz');
let defaultCache;

const EXPECTED_COUNTS = Object.freeze({ Task: 326, Const: 5, FirstWeekGoal: 35 });

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows) || table.rows.length !== EXPECTED_COUNTS[name]) {
    throw new Error(`First-week goal table ${name} has an unexpected row count`);
  }
  return table.rows;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid first-week goal ${label}`);
  return number;
}

function ids(value, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value)) throw new Error(`Invalid first-week goal ${label}`);
  return value.map(id => positiveInteger(id, label));
}

function awards(value, counts, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value) || !Array.isArray(counts) || value.length !== counts.length) {
    throw new Error(`Invalid first-week goal ${label}`);
  }
  return value.map((id, index) => [positiveInteger(id, label), positiveInteger(counts[index], label)]);
}

function byTid(rows, label) {
  const result = new Map();
  for (const row of rows) {
    const tid = positiveInteger(row.tid, label);
    if (result.has(tid)) throw new Error(`Duplicate first-week goal ${label}: ${tid}`);
    result.set(tid, row);
  }
  return result;
}

export function readFirstWeekGoalTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);

  const constants = byTid(rowsOf(dump, 'Const'), 'constant id');
  const taskRows = rowsOf(dump, 'Task');
  const tasks = new Map();
  for (const source of taskRows) {
    const tid = positiveInteger(source.tid, 'task id');
    if (tasks.has(tid)) throw new Error(`Duplicate first-week goal task: ${tid}`);
    if (!Array.isArray(source.award_list) || source.award_list.length === 0) {
      throw new Error(`First-week goal task ${tid} has no awards`);
    }
    const awardsList = source.award_list.map(pair => {
      if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid first-week goal task award: ${tid}`);
      return [positiveInteger(pair[0], 'task award item'), positiveInteger(pair[1], 'task award count')];
    });
    tasks.set(tid, Object.freeze({
      ...source,
      tid,
      type: positiveInteger(source.type, 'task type'),
      target_count: positiveInteger(source.target_count, 'task target'),
      task_param: Number(source.task_param ?? 0),
      award_list: awardsList
    }));
  }

  const goalsByVersion = new Map();
  const tasksByVersion = new Map();
  const goals = new Map();
  for (const source of rowsOf(dump, 'FirstWeekGoal')) {
    const tid = positiveInteger(source.tid, 'progress id');
    const version = Math.floor(tid / 100);
    const constant = constants.get(version);
    if (!constant) throw new Error(`First-week goal version ${version} has no constants`);
    const growthTasks = ids(source.task_growth, `growth tasks for ${tid}`);
    const challengeTasks = ids(source.task_challenge, `challenge tasks for ${tid}`);
    const taskIds = [...new Set([...growthTasks, ...challengeTasks])];
    for (const taskId of taskIds) if (!tasks.has(taskId)) throw new Error(`First-week goal task ${taskId} is missing`);
    const goal = Object.freeze({
      ...source,
      tid,
      version,
      growth_tasks: growthTasks,
      challenge_tasks: challengeTasks,
      task_ids: taskIds,
      need_score: positiveInteger(source.need_score, 'score threshold'),
      score_tid: positiveInteger(constant.score, 'score item'),
      rewards: awards(source.award, source.award_n, `award for ${tid}`),
      selectable_rewards: Array.isArray(source.select_award) ? source.select_award.map(Number) : [],
      select_count: Number(source.select_n ?? 0)
    });
    goals.set(tid, goal);
    if (!goalsByVersion.has(version)) goalsByVersion.set(version, []);
    goalsByVersion.get(version).push(goal);
    const versionTasks = tasksByVersion.get(version) ?? new Map();
    for (const taskId of taskIds) versionTasks.set(taskId, tasks.get(taskId));
    tasksByVersion.set(version, versionTasks);
  }
  for (const rows of goalsByVersion.values()) rows.sort((left, right) => left.tid - right.tid);

  const result = Object.freeze({
    source: dump.source ?? null,
    constants,
    tasks,
    goals,
    goalsByVersion,
    tasksByVersion,
    counts: EXPECTED_COUNTS
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
