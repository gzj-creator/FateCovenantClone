import { readJsonAsset, tableAsset } from '../assets.mjs';

// GrowthRoadTable.data.lua is shipped by client 1.55.090365 and recovered with
// tools/extract-growth-road-table.mjs. The table carries the Task, Version,
// Progress and Tag sub tables used by module 92009 (login container 53696).
const defaultPath = tableAsset('GrowthRoadTable.data.lua.json.gz');
let defaultCache;

const EXPECTED_COUNTS = Object.freeze({ Task: 318, Version: 1, Progress: 12, Tag: 4 });

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows) || table.rows.length !== EXPECTED_COUNTS[name]) {
    throw new Error(`Growth road table ${name} has an unexpected row count`);
  }
  return table.rows;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid growth road ${label}`);
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid growth road ${label}`);
  return number;
}

function awards(value, counts, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value) || !Array.isArray(counts) || value.length !== counts.length) {
    throw new Error(`Invalid growth road ${label}`);
  }
  return value.map((id, index) => [positiveInteger(id, label), positiveInteger(counts[index], label)]);
}

function awardList(value, label) {
  if (value == null || value?.global === 'TableEmpty') return [];
  if (!Array.isArray(value)) throw new Error(`Invalid growth road ${label}`);
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid growth road ${label}`);
    return [positiveInteger(pair[0], label), positiveInteger(pair[1], label)];
  });
}

function byTid(rows, label) {
  const result = new Map();
  for (const row of rows) {
    const tid = positiveInteger(row.tid, label);
    if (result.has(tid)) throw new Error(`Duplicate growth road ${label}: ${tid}`);
    result.set(tid, row);
  }
  return result;
}

export function readGrowthRoadTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);

  const tags = byTid(rowsOf(dump, 'Tag'), 'tag id');
  const versions = byTid(rowsOf(dump, 'Version'), 'version id');
  const tasks = byTid(rowsOf(dump, 'Task'), 'task id');
  const progress = byTid(rowsOf(dump, 'Progress'), 'progress id');

  for (const [tid, row] of tasks) {
    const tag = positiveInteger(row.tag, 'task tag');
    if (!tags.has(tag)) throw new Error(`Growth road task ${tid} references unknown tag ${tag}`);
    positiveInteger(row.type, 'task type');
    positiveInteger(row.target_count, 'task target');
    nonNegativeInteger(row.growth_value, 'task growth value');
    awardList(row.award_list, 'task award');
  }
  for (const [tid, row] of progress) {
    positiveInteger(row.need_count, 'progress threshold');
    for (const key of ['award', 'award_new', 'overdue_award']) {
      const value = Number(row[key] ?? 0);
      if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid growth road progress reward ${tid}.${key}`);
    }
  }
  const versionRows = [...versions.values()];
  if (versionRows.length !== 1) throw new Error('Growth road must expose exactly one version row');
  const version = positiveInteger(versionRows[0].tid, 'version id');

  const progressList = [...progress.values()]
    .map(row => ({ ...row, tid: Number(row.tid), need_count: Number(row.need_count) }))
    .sort((left, right) => left.need_count - right.need_count || left.tid - right.tid);

  const table = Object.freeze({
    version,
    versionRow: Object.freeze({ ...versionRows[0] }),
    tags,
    tasks,
    progress,
    progressList: Object.freeze(progressList)
  });
  if (file === defaultPath) defaultCache = table;
  return table;
}

export { EXPECTED_COUNTS as GROWTH_ROAD_TABLE_COUNTS };
