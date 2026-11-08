import { readJsonAsset, tableAsset } from '../assets.mjs';

// D block (items, shops, daily/weekly tasks). These two table families come
// from the client's generated Lua tables through
// tools/extract-lua-table-rows.mjs, which stores plain row arrays:
// {source, extractor, tables:{Name:[row, ...]}}.
//
// FunctionManualTable keys its rows by the position the client shows
// (FunctionManualTable.TaskByIndex walks Task_List), so the tid doubles as the
// claim-bit index of pb_function_manual.got_award.
// TaskActivityTable indexes its tasks by version; ActFrameTable type 1003
// selects the version that is currently running.

const EXPECTED_COUNTS = Object.freeze({
  FunctionManual: Object.freeze({ Task: 28 }),
  TaskActivity: Object.freeze({ Lib: 138, Common: 6, Tag: 12 })
});

let functionManualCache;
let taskActivityCache;

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid ${label}`);
  return number;
}

function rowsOf(document, family, name) {
  const rows = document?.tables?.[name];
  const expected = EXPECTED_COUNTS[family][name];
  if (!Array.isArray(rows) || rows.length !== expected) {
    throw new Error(`${family} table ${name} has an unexpected row count`);
  }
  return rows;
}

function byTid(rows, label) {
  const result = new Map();
  for (const row of rows) {
    const tid = positiveInteger(row.tid, label);
    if (result.has(tid)) throw new Error(`Duplicate ${label}: ${tid}`);
    result.set(tid, row);
  }
  return result;
}

function awardPairs(value, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value)) throw new Error(`Invalid ${label}`);
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid ${label}`);
    return [positiveInteger(pair[0], label), positiveInteger(pair[1], label)];
  });
}

function taskEntries(value, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value)) throw new Error(`Invalid ${label}`);
  return value.map(entry => {
    if (!Array.isArray(entry) || entry.length !== 3) throw new Error(`Invalid ${label}`);
    // The tuple is (task type, task param, target count); TaskMgr passes the
    // param through to its progress function, so 0 is a valid value here.
    const type = positiveInteger(entry[0], label);
    const param = Number(entry[1] ?? 0);
    if (!Number.isSafeInteger(param) || param < 0) throw new Error(`Invalid ${label}`);
    const count = positiveInteger(entry[2], label);
    return { type, param, count };
  });
}

export function readFunctionManualTables({ document } = {}) {
  if (document == null && functionManualCache) return functionManualCache;
  const dump = document ?? readJsonAsset(tableAsset('FunctionManualTable.rows.json.gz'));
  const taskRows = rowsOf(dump, 'FunctionManual', 'Task');
  const tasks = new Map();
  for (const [tid, row] of byTid(taskRows, 'function manual task')) {
    const taskList = taskEntries(row.task_list, `function manual task ${tid} task_list`);
    const award = awardPairs(row.award, `function manual task ${tid} award`);
    tasks.set(tid, {
      tid,
      funcOpen: positiveInteger(row.func_open, `function manual task ${tid} func_open`),
      taskList,
      award
    });
  }
  const result = Object.freeze({ tasks });
  if (document == null) functionManualCache = result;
  return result;
}

export function readTaskActivityTables({ document } = {}) {
  if (document == null && taskActivityCache) return taskActivityCache;
  const dump = document ?? readJsonAsset(tableAsset('TaskActivityTable.rows.json.gz'));
  const libRows = rowsOf(dump, 'TaskActivity', 'Lib');
  const byVersion = new Map();
  for (const [tid, row] of byTid(libRows, 'task activity task')) {
    const version = positiveInteger(row.version, `task activity task ${tid} version`);
    const task = {
      tid,
      version,
      type: positiveInteger(row.type, `task activity task ${tid} type`),
      targetCount: positiveInteger(row.target_count, `task activity task ${tid} target_count`),
      taskParam: Number(row.task_param ?? 0),
      tag: positiveInteger(row.tag, `task activity task ${tid} tag`),
      award: awardPairs(row.award, `task activity task ${tid} award`)
    };
    if (!Number.isSafeInteger(task.taskParam) || task.taskParam < 0) {
      throw new Error(`Invalid task activity task ${tid} task_param`);
    }
    const rows = byVersion.get(version) ?? new Map();
    rows.set(tid, task);
    byVersion.set(version, rows);
  }
  const result = Object.freeze({
    versions: byVersion,
    tags: byTid(rowsOf(dump, 'TaskActivity', 'Tag'), 'task activity tag'),
    common: byTid(rowsOf(dump, 'TaskActivity', 'Common'), 'task activity common')
  });
  if (document == null) taskActivityCache = result;
  return result;
}
