import { readJsonAsset, tableAsset } from '../assets.mjs';

// GroupBuyActTable is rebuilt from the client bundle with
// tools/extract-group-buy-table.mjs (see
// agent/workflow/gameplay-completion/PAY-GROUPBUYACT/implementation.md).
// asset: assets/tables/GroupBuyActTable.data.lua.json.gz
const defaultPath = tableAsset('GroupBuyActTable.data.lua.json');
let defaultCache;

// The shipped table always carries the same four sub tables. A different count
// means the extractor picked up another client build, so fail loudly instead of
// serving a half-filled activity.
const EXPECTED_ROWS = Object.freeze({
  Gift: 218,
  GroupAward: 104,
  Version: 14,
  HeadCompensate: 364
});

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing GroupBuyAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (table.rows.length !== expected) {
    throw new Error(`GroupBuyAct table ${name} has ${table.rows.length} rows, expected ${expected}`);
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

export function readGroupBuyActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const gifts = byTid(rowsOf(dump, 'Gift'));
  const awards = byTid(rowsOf(dump, 'GroupAward'));
  const versions = byTid(rowsOf(dump, 'Version'));
  const compensations = byTid(rowsOf(dump, 'HeadCompensate'));
  const giftRows = rowsOf(dump, 'Gift');
  const awardRows = rowsOf(dump, 'GroupAward');
  const compensateRows = rowsOf(dump, 'HeadCompensate');
  const compensationByGift = groupBy(compensateRows, 'gift');
  for (const [gift, rows] of compensationByGift) {
    rows.sort((left, right) => Number(left.compensate_time) - Number(right.compensate_time)
      || Number(left.tid) - Number(right.tid));
    compensationByGift.set(gift, rows);
  }
  const awardsByGift = groupBy(awardRows, 'gift');
  for (const [gift, rows] of awardsByGift) {
    rows.sort((left, right) => Number(left.tid) - Number(right.tid));
    awardsByGift.set(gift, rows);
  }
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    gifts,
    awards,
    versions,
    compensations,
    giftsByVersion: groupBy(giftRows, 'version'),
    awardsByGift,
    compensationByGift
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function groupBuyGiftsForVersion(tables, version) {
  return tables?.giftsByVersion?.get(Number(version)) ?? [];
}

// GroupAward and HeadCompensate only exist for gifts flagged as group gifts.
export function groupBuyGroupGiftsForVersion(tables, version) {
  return groupBuyGiftsForVersion(tables, version).filter(row => row.is_group_gift === true);
}
