import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('OnlineGiftTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing OnlineGift table: ' + name);
  return table.rows;
}

function byTid(rows) {
  const result = new Map();
  for (const row of rows) {
    const tid = Number(row.tid);
    if (!Number.isSafeInteger(tid) || tid <= 0 || result.has(tid)) throw new Error('Invalid OnlineGift table id: ' + row.tid);
    result.set(tid, row);
  }
  return result;
}

export function readOnlineGiftTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const gifts = byTid(rowsOf(dump, 'OnlineGift'));
  const periods = byTid(rowsOf(dump, 'Period'));
  const periodMax = byTid(rowsOf(dump, 'PeriodMax'));
  const giftsByPeriod = new Map();
  for (const row of gifts.values()) {
    const period = Number(row.period);
    const time = Number(row.time);
    const item = Number(row.item);
    const count = Number(row.count);
    if (!periods.has(period) || !Number.isSafeInteger(time) || time < 0
      || !Number.isSafeInteger(item) || item <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error('Invalid OnlineGift reward row: ' + row.tid);
    }
    if (!giftsByPeriod.has(period)) giftsByPeriod.set(period, []);
    giftsByPeriod.get(period).push(row);
  }
  for (const rows of giftsByPeriod.values()) rows.sort((left, right) => Number(left.tid) - Number(right.tid));
  const result = {
    source: dump.source ?? null,
    periods: new Set(periods.keys()),
    periodMax,
    gifts,
    giftsByPeriod,
    lastConfiguredPeriod: Math.max(...periods.keys())
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}
