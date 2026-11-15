import crypto from 'node:crypto';
import { readJsonAsset, tableAsset } from '../assets.mjs';

// GrowthTargetTable.data.lua ships four generated families and is reproduced with
// `node tools/extract-lua-table-rows.mjs <7835156705496659000-GrowthTargetTable.data.lua.bin>
//   personal-server/assets/tables/GrowthTargetTable.data.json.gz`.
// Source chunk SHA256 2fb12eae338afda51e5d03b2ba173f46d0637fd03558cea72c15777598731496.
const defaultPath = tableAsset('GrowthTargetTable.data.json.gz');
const EXPECTED_COUNTS = Object.freeze({ Task: 666, Const: 3, Version: 3, Phase: 111 });
// sha256 of JSON.stringify({Task,Const,Version,Phase}) over the shipped rows. Any
// re-extraction that changes a target, award or phase break this check.
const EXPECTED_ROW_DIGEST = 'a5b53f9167f665d1327a75acd9cb0dac86eb1458f8f1ec8e624ca1af9e9ed515';
const PHASES_PER_VERSION = 37;

// GrowthTargetTable.lua: PERIOD_DAY = 1, PERIOD_ACT = 2. 69006/69007 never gate on
// period; the field only tells TaskMgr which progress scope the client displays.
export const GROWTH_TARGET_PERIOD_DAY = 1;
export const GROWTH_TARGET_PERIOD_ACT = 2;
export const GROWTH_TARGET_PHASES_PER_VERSION = PHASES_PER_VERSION;
export const GROWTH_TARGET_TABLE_DIGEST = EXPECTED_ROW_DIGEST;

let defaultCache;

function integer(value, label, { min = Number.MIN_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new Error(`Invalid GrowthTarget ${label}: ${value}`);
  return number;
}

function awardPairs(list, label) {
  if (!Array.isArray(list) || list.length === 0) throw new Error(`GrowthTarget ${label} award list is missing`);
  return Object.freeze(list.map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error(`GrowthTarget ${label} award ${index} is invalid`);
    return Object.freeze([
      integer(entry[0], `${label} award tid`, { min: 1 }),
      integer(entry[1], `${label} award count`, { min: 1 })
    ]);
  }));
}

function normalizeTask(row) {
  const tid = integer(row?.tid, 'task tid', { min: 1 });
  return Object.freeze({
    tid,
    phase: integer(row.phase, `task ${tid} phase`, { min: 1 }),
    type: integer(row.type, `task ${tid} type`, { min: 1 }),
    period: integer(row.period, `task ${tid} period`, { min: 0 }),
    target_count: integer(row.target_count, `task ${tid} target_count`, { min: 1 }),
    task_param: integer(row.task_param ?? 0, `task ${tid} task_param`, { min: 0 }),
    des: Number(row.task_des ?? 0),
    title: Number(row.title ?? 0),
    award_list: awardPairs(row.award_list, `task ${tid}`)
  });
}

function normalizePhase(row) {
  const tid = integer(row?.tid, 'phase tid', { min: 1 });
  return Object.freeze({
    tid,
    version: integer(row.version, `phase ${tid} version`, { min: 1 }),
    award_list: awardPairs(row.award_list, `phase ${tid}`),
    // Phase.reissue_award_list has no consumer in the extracted client modules and
    // no recovered server rule, so it is carried for evidence and never granted.
    reissue_award_list: Array.isArray(row.reissue_award_list)
      ? Object.freeze(row.reissue_award_list.map(entry => Object.freeze([Number(entry?.[0]), Number(entry?.[1])])))
      : Object.freeze([])
  });
}

function byTid(rows, label) {
  const map = new Map();
  for (const row of rows) {
    if (map.has(row.tid)) throw new Error(`GrowthTarget ${label} has duplicate tid ${row.tid}`);
    map.set(row.tid, row);
  }
  return map;
}

function assertCounts(tables) {
  if (!tables || typeof tables !== 'object') throw new Error('GrowthTargetTable dump is missing its tables');
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    const rows = tables[name];
    if (!Array.isArray(rows)) throw new Error(`GrowthTargetTable ${name} family is missing`);
    if (rows.length !== expected) throw new Error(`GrowthTargetTable ${name} has ${rows.length} rows, expected ${expected}`);
  }
}

export function readGrowthTargetTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  assertCounts(dump?.tables);
  const canonical = JSON.stringify({
    Task: dump.tables.Task,
    Const: dump.tables.Const,
    Version: dump.tables.Version,
    Phase: dump.tables.Phase
  });
  const digest = crypto.createHash('sha256').update(canonical).digest('hex');
  if (digest !== EXPECTED_ROW_DIGEST) throw new Error('GrowthTargetTable rows do not match the R1 evidence digest');

  const versions = byTid(dump.tables.Version.map(row => Object.freeze({
    tid: integer(row?.tid, 'version tid', { min: 1 })
  })), 'Version');
  const constants = byTid(dump.tables.Const.map(row => Object.freeze({
    tid: integer(row?.tid, 'const tid', { min: 1 }),
    bubble_show_interval_times: Number(row.bubble_show_interval_times ?? 0),
    bubble_show_count_limit: Number(row.bubble_show_count_limit ?? 0)
  })), 'Const');
  const phases = byTid(dump.tables.Phase.map(normalizePhase), 'Phase');
  const tasks = byTid(dump.tables.Task.map(normalizeTask), 'Task');

  const phasesByVersion = new Map();
  for (const phase of phases.values()) {
    if (!versions.has(phase.version)) throw new Error(`GrowthTarget phase ${phase.tid} uses unknown version ${phase.version}`);
    if (!phasesByVersion.has(phase.version)) phasesByVersion.set(phase.version, new Map());
    phasesByVersion.get(phase.version).set(phase.tid, phase);
  }
  for (const version of versions.keys()) {
    const list = phasesByVersion.get(version);
    if (!list || list.size !== PHASES_PER_VERSION) {
      throw new Error(`GrowthTarget version ${version} has ${list?.size ?? 0} phases, expected ${PHASES_PER_VERSION}`);
    }
  }

  const tasksByVersion = new Map();
  const tasksByPhase = new Map();
  for (const task of tasks.values()) {
    const phase = phases.get(task.phase);
    if (!phase) throw new Error(`GrowthTarget task ${task.tid} uses unknown phase ${task.phase}`);
    if (!tasksByPhase.has(task.phase)) tasksByPhase.set(task.phase, []);
    tasksByPhase.get(task.phase).push(task);
    if (!tasksByVersion.has(phase.version)) tasksByVersion.set(phase.version, new Map());
    tasksByVersion.get(phase.version).set(task.tid, task);
  }
  for (const [phaseTid, list] of tasksByPhase) {
    if (list.length !== 6) throw new Error(`GrowthTarget phase ${phaseTid} has ${list.length} tasks, expected 6`);
    list.sort((left, right) => left.tid - right.tid);
    Object.freeze(list);
  }
  for (const [version, list] of phasesByVersion) {
    for (const phase of list.values()) {
      if (!tasksByPhase.has(phase.tid)) throw new Error(`GrowthTarget phase ${phase.tid} of version ${version} has no tasks`);
    }
  }

  const result = Object.freeze({
    source: dump.source ?? null,
    extractor: dump.extractor ?? null,
    rowDigest: digest,
    versions,
    versionTids: Object.freeze([...versions.keys()].sort((left, right) => left - right)),
    constants,
    phases,
    phasesByVersion,
    tasks,
    tasksByPhase,
    tasksByVersion
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
