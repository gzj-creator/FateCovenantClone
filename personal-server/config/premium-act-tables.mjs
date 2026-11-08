import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// PremiumActTable.data.lua is shipped as LuaJIT prototypes. The extracted
// bundle is kept beside the other local table assets; the server only needs the
// four row families used by ActFrame type 184 (PremiumActMgr).
// asset: assets/tables/PremiumActTable.data.lua.json.gz
const defaultPath = tableAsset('PremiumActTable.data.lua.json');
let defaultCache;

const EXPECTED_ROWS = Object.freeze({
  Version: 110,
  Config: 852,
  Free: 72,
  GiftShopShow: 5
});

function rowsOf(dump, name) {
  const table = dump?.[name];
  if (!(table instanceof Map)) throw new Error('Missing PremiumAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (expected !== undefined && table.size !== expected) {
    throw new Error('PremiumAct table ' + name + ' has ' + table.size + ' rows, expected ' + expected);
  }
  return table;
}

export function readPremiumActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readGeneratedDump(readJsonAsset(file), [
    'Version',
    'Config',
    'Free',
    'GiftShopShow'
  ]);
  const Version = rowsOf(dump, 'Version');
  const Config = rowsOf(dump, 'Config');
  const Free = rowsOf(dump, 'Free');
  const GiftShopShow = rowsOf(dump, 'GiftShopShow');

  const configsByVersion = new Map();
  const configsByGift = new Map();
  for (const row of Config.values()) {
    const tid = Number(row?.tid);
    const version = Number(row?.version);
    const gift = Number(row?.gift);
    if (!Number.isSafeInteger(tid) || tid < 1) throw new Error('PremiumAct Config has an invalid tid');
    if (!Number.isSafeInteger(version) || version < 1) throw new Error('PremiumAct Config ' + tid + ' has an invalid version');
    if (!Number.isSafeInteger(gift) || gift < 1) throw new Error('PremiumAct Config ' + tid + ' has an invalid gift');
    if (!configsByVersion.has(version)) configsByVersion.set(version, []);
    configsByVersion.get(version).push(row);
    if (!configsByGift.has(gift)) configsByGift.set(gift, []);
    configsByGift.get(gift).push(row);
  }
  for (const rows of configsByVersion.values()) {
    rows.sort((left, right) => Number(left.tid) - Number(right.tid));
  }
  const version1002 = configsByVersion.get(1002);
  if (version1002?.length !== 10) {
    throw new Error('PremiumAct version 1002 has ' + (version1002?.length ?? 0) + ' gifts, expected 10');
  }

  const result = {
    Version,
    Config,
    Free,
    GiftShopShow,
    configsByVersion,
    configsByGift
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function premiumGiftConfigs(tables, version) {
  return tables?.configsByVersion?.get(Number(version)) ?? [];
}
