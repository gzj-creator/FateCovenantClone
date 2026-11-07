import { readJsonAsset, tableAsset } from '../assets.mjs';

// DiamondBankActTable is rebuilt from the client bundle with
// tools/extract-diamond-bank-table.mjs (see
// agent/workflow/gameplay-completion/PAY-DIAMONDBANKACT/implementation.md).
// asset: assets/tables/DiamondBankActTable.data.lua.json.gz
const defaultPath = tableAsset('DiamondBankActTable.data.lua.json');
let defaultCache;

// The shipped table always carries the same three row tables. A different count
// means the extractor picked up another client build, so fail loudly instead of
// serving a half-filled activity.
const EXPECTED_ROWS = Object.freeze({
  VerRecharge: 5,
  LiveTask: 14,
  Ver: 1
});

// DiamondBankActTable.lua: TASK_DAILY=0, TASK_PERIOD=1, TASK_GROUP_DAILY=1,
// TASK_GROUP_EXT=2 (decoded from the registrar prototype's KSHORT constants).
export const TASK_DAILY = 0;
export const TASK_PERIOD = 1;
export const TASK_GROUP_DAILY = 1;
export const TASK_GROUP_EXT = 2;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing DiamondBankAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (table.rows.length !== expected) {
    throw new Error(`DiamondBankAct table ${name} has ${table.rows.length} rows, expected ${expected}`);
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

function groupBy(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const value = Number(row[field]);
    if (!Number.isSafeInteger(value)) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  }
  return map;
}

// VerRecharge.batch_update holds the VerRecharge tids that are refreshed
// together; DiamondBankActMgr.GetDiscountGift treats the non-empty rows as the
// discount bundle for the version.
function discountRowsByVersion(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!Array.isArray(row.batch_update) || !row.batch_update.length) continue;
    const version = Number(row.version);
    if (!Number.isSafeInteger(version)) continue;
    if (!map.has(version)) map.set(version, []);
    map.get(version).push(row);
  }
  return map;
}

export function readDiamondBankActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const verRechargeRows = rowsOf(dump, 'VerRecharge');
  const liveTaskRows = rowsOf(dump, 'LiveTask');
  const verRows = rowsOf(dump, 'Ver');
  const liveTaskByVersionGroup = new Map();
  for (const [version, rows] of groupBy(liveTaskRows, 'ver')) {
    rows.sort((left, right) => Number(left.priority) - Number(right.priority) || Number(left.tid) - Number(right.tid));
    const byGroup = groupBy(rows, 'group');
    for (const [group, groupRows] of byGroup) {
      groupRows.sort((left, right) => Number(left.priority) - Number(right.priority) || Number(left.tid) - Number(right.tid));
      byGroup.set(group, groupRows);
    }
    liveTaskByVersionGroup.set(version, { rows, byGroup });
  }
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    verRecharges: byTid(verRechargeRows),
    verRechargeRows,
    liveTasks: byTid(liveTaskRows),
    liveTaskRows,
    ver: byTid(verRows),
    verRows,
    verRechargeByVersion: groupBy(verRechargeRows, 'version'),
    liveTaskByVersionGroup,
    discountGiftByVersion: discountRowsByVersion(verRechargeRows)
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function diamondBankVerForVersion(tables, version) {
  return tables?.ver?.get(Number(version)) ?? null;
}

export function diamondBankLiveTasksForVersion(tables, version) {
  return tables?.liveTaskByVersionGroup?.get(Number(version))?.rows ?? [];
}

export function diamondBankLiveTasksForGroup(tables, version, group) {
  return tables?.liveTaskByVersionGroup?.get(Number(version))?.byGroup?.get(Number(group)) ?? [];
}

// DiamondBankActMgr.GetNormalGiftList expands Ver.gift through
// VerRechargeValueIndex, so the gift list is every VerRecharge row of that
// version rather than a separate table.
export function diamondBankGiftsForVersion(tables, version) {
  return tables?.verRechargeByVersion?.get(Number(version)) ?? [];
}

export function diamondBankDiscountGiftsForVersion(tables, version) {
  return tables?.discountGiftByVersion?.get(Number(version)) ?? [];
}
