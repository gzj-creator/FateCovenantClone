import { readJsonAsset, tableAsset } from '../assets.mjs';

// PeriodTaskTable ships as a client Lua table bundle
// (11485873983200618000-PeriodTaskTable.data.lua.bin). The row-level dump below
// is produced by tools/extract-lua-table-rows.mjs from that same bundle and
// preserved verbatim: Task/Version/Score/Stage are genuinely empty families and
// only RefreshType carries rows. Registering the asset keeps the missing rows
// auditable; it does not make any 101301-101303 action executable.
export const PERIOD_TASK_SOURCE_SHA256 = '4d1a2deeb86e235c771b2519271f5b507ee32a159642cfa075066a7348abf7d7';
export const PERIOD_TASK_EXPECTED_COUNTS = Object.freeze({
  Task: 0,
  RefreshType: 3,
  Version: 0,
  Score: 0,
  Stage: 0
});

// RefreshType.tid -> the Lua module that owns award/finish/progress semantics.
// Recovered from PeriodTaskTable.data prototype #6 and the three refresh modules.
export const PERIOD_TASK_REFRESH_MODULES = Object.freeze({
  1: 'PeriodTaskDayRefresh',
  2: 'PeriodTaskPeriodRefresh',
  3: 'PeriodTaskPermanent'
});

export const PERIOD_TASK_DECISIONS = Object.freeze({
  101301: 'R1-ITEM-PERIODTASK-TASK',
  101302: 'R1-ITEM-PERIODTASK-STAGE',
  101303: 'R1-ITEM-PERIODTASK-SCORE'
});

// R1 requires a specific residual gap per type instead of a vague "not
// implemented". Each entry names the row family/column that is missing.
export const PERIOD_TASK_MISSING_EVIDENCE = Object.freeze([
  'PeriodTaskTable.Task has 0 shipped rows: task_type/task_count/task_param/pre_task/refresh_type cannot be resolved',
  'PeriodTaskTable.Version has 0 shipped rows: act id, server_valid_day and score_item cannot be resolved',
  'PeriodTaskTable.Stage has 0 shipped rows: stage task_range and the original stage award rows cannot be resolved',
  'PeriodTaskTable.Score has 0 shipped rows: score thresholds and the original score awards cannot be resolved',
  'pb_period_task_all login host slot is not recovered from ModuleTable/LoginParse',
  'the task_type producer set consumed through TaskMgr.RegisterTaskTypeEvent is not recovered'
]);

const defaultPath = tableAsset('PeriodTaskTable.data.json.gz');
const FAMILIES = Object.freeze(Object.keys(PERIOD_TASK_EXPECTED_COUNTS));
let defaultCache;

function familyRows(families, family) {
  const entry = families?.[family];
  if (!entry || !Array.isArray(entry.rows)) throw new Error(`PeriodTask ${family} family is missing`);
  if (Number(entry.count) !== entry.rows.length) {
    throw new Error(`PeriodTask ${family} count ${entry.count} does not match ${entry.rows.length} rows`);
  }
  return entry.rows;
}

export function readPeriodTaskTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const parsed = readJsonAsset(file);
  const sha256 = parsed?.sha256;
  if (sha256 !== PERIOD_TASK_SOURCE_SHA256) {
    throw new Error(`PeriodTask source hash ${sha256} does not match the frozen bundle`);
  }
  const families = parsed?.families;
  const rows = Object.fromEntries(FAMILIES.map(family => [family, familyRows(families, family)]));
  for (const family of FAMILIES) {
    if (rows[family].length !== PERIOD_TASK_EXPECTED_COUNTS[family]) {
      throw new Error(
        `PeriodTask ${family} carries ${rows[family].length} rows; the frozen shipped export has ${PERIOD_TASK_EXPECTED_COUNTS[family]}`
      );
    }
  }

  const refreshType = new Map();
  for (const row of rows.RefreshType) {
    const tid = Number(row?.tid);
    const name = row?.lua_module?.reference ?? row?.lua_module?.global ?? null;
    if (PERIOD_TASK_REFRESH_MODULES[tid] !== name) {
      throw new Error(`PeriodTask RefreshType ${tid} does not reference ${PERIOD_TASK_REFRESH_MODULES[tid]}`);
    }
    refreshType.set(tid, name);
  }
  if (refreshType.size !== Object.keys(PERIOD_TASK_REFRESH_MODULES).length) {
    throw new Error('PeriodTask RefreshType rows are incomplete');
  }

  const frozen = Object.freeze({
    sourceSha256: sha256,
    counts: PERIOD_TASK_EXPECTED_COUNTS,
    // This module never opens a gameplay path: the award consumers exist in the
    // client only and every configuration row they need is absent.
    gameplayReady: false,
    rowsPresent: Object.freeze({
      Task: rows.Task.length > 0,
      Version: rows.Version.length > 0,
      Score: rows.Score.length > 0,
      Stage: rows.Stage.length > 0
    }),
    decisions: PERIOD_TASK_DECISIONS,
    missingEvidence: PERIOD_TASK_MISSING_EVIDENCE,
    refreshType,
    rows
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}
