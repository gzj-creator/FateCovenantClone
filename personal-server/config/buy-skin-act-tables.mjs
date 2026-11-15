import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('BuySkinActTable.data.json');
const EXPECTED_ACTIVE_TIDS = Object.freeze([1, 2, 3, 4, 5]);
const EXPECTED_ASSET_SHA256 = 'fd16a150a332cddd643f23b83d56aa3c5e35e47eb92bcd97abbc9a21049ebae1';
let defaultCache;

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`BuySkinActTable ${field} must be a positive integer`);
  return number;
}

function normalizeRow(row) {
  const tid = positiveInteger(row?.tid, 'tid');
  const version = positiveInteger(row?.version, `row ${tid} version`);
  const skin = positiveInteger(row?.skin, `row ${tid} skin`);
  const gift = positiveInteger(row?.gift, `row ${tid} gift`);
  const unlockDay = positiveInteger(row?.unlock_day, `row ${tid} unlock_day`);
  const conTime = positiveInteger(row?.con_time, `row ${tid} con_time`);
  const privilegeItem = Number(row?.privilege_item ?? 0);
  if (!Number.isSafeInteger(privilegeItem) || privilegeItem < 0) {
    throw new Error(`BuySkinActTable row ${tid} privilege_item is invalid`);
  }
  if (!Array.isArray(row?.award_list) || row.award_list.length === 0) {
    throw new Error(`BuySkinActTable row ${tid} award_list is missing`);
  }
  const awardList = row.award_list.map((award, index) => {
    if (!Array.isArray(award) || award.length < 2) throw new Error(`BuySkinActTable row ${tid} award ${index} is invalid`);
    return [positiveInteger(award[0], `row ${tid} award tid`), positiveInteger(award[1], `row ${tid} award count`)];
  });
  return Object.freeze({
    ...row,
    tid,
    version,
    skin,
    gift,
    unlock_day: unlockDay,
    con_time: conTime,
    privilege_item: privilegeItem,
    award_list: Object.freeze(awardList.map(Object.freeze))
  });
}

export function readBuySkinActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const family = dump?.families?.BuySkinAct;
  if (dump?.table !== 'BuySkinActTable' || family?.status !== 'decoded-rows' || !Array.isArray(family.rows)) {
    throw new Error('BuySkinActTable generated dump is missing its decoded BuySkinAct rows');
  }
  if (family.rows.length !== 13) throw new Error(`BuySkinActTable has ${family.rows.length} rows, expected 13`);
  if (String(dump.assetSha256).toLowerCase() !== EXPECTED_ASSET_SHA256) {
    throw new Error('BuySkinActTable source asset hash does not match the R1 evidence');
  }
  const rows = family.rows.map(normalizeRow);
  const activeRows = rows.filter(row => row.version === 1);
  if (activeRows.length !== EXPECTED_ACTIVE_TIDS.length
    || activeRows.some((row, index) => row.tid !== EXPECTED_ACTIVE_TIDS[index])) {
    throw new Error('BuySkinActTable version 1 rows do not match the R1 evidence');
  }
  const byTid = new Map(rows.map(row => [row.tid, row]));
  const activeByTid = new Map(activeRows.map(row => [row.tid, row]));
  const activeByGift = new Map(activeRows.map(row => [row.gift, row]));
  const activeBySkin = new Map(activeRows.map(row => [row.skin, row]));
  if (activeByGift.size !== activeRows.length || activeBySkin.size !== activeRows.length) {
    throw new Error('BuySkinActTable version 1 gift or skin ids are duplicated');
  }
  const result = Object.freeze({
    source: dump.assetPath ?? null,
    assetSha256: EXPECTED_ASSET_SHA256,
    rows,
    activeRows,
    byTid,
    activeByTid,
    activeByGift,
    activeBySkin
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
