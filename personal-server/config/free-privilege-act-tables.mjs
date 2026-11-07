import { readJsonAsset, tableAsset } from '../assets.mjs';

// FreePrivilegeActTable is rebuilt from the client bundle with
// tools/extract-free-privilege-table.mjs (see
// agent/workflow/gameplay-completion/PAY-FREEPRIVILEGEACT/implementation.md).
// asset: assets/tables/FreePrivilegeActTable.data.lua.json.gz
const defaultPath = tableAsset('FreePrivilegeActTable.data.lua.json');
let defaultCache;

// FreePrivilegeActTable.lua registers exactly two sub tables. A different count
// means the extractor picked up another client build, so fail loudly instead of
// serving a half-filled activity.
const EXPECTED_ROWS = Object.freeze({ Version: 2, Show: 2 });

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing FreePrivilegeAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (table.rows.length !== expected) {
    throw new Error(`FreePrivilegeAct table ${name} has ${table.rows.length} rows, expected ${expected}`);
  }
  return table.rows;
}

function byTid(rows) {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

// Version rows are keyed by ActFrameAct.version: privilege_day is the free
// permanent-card trial length, is_month_card gates the free month-card command
// and month_card names the MonthlyCardTable row that command activates.
export function readFreePrivilegeActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const versionRows = rowsOf(dump, 'Version');
  const showRows = rowsOf(dump, 'Show');
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    versions: byTid(versionRows),
    versionRows,
    shows: byTid(showRows),
    showRows
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function freePrivilegeVersionFor(tables, version) {
  const id = Number(version);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return tables?.versions?.get(id) ?? null;
}

