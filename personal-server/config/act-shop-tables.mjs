import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// ActShopTable.data.lua is shipped in 64_lua_project.bundle. The checked-in
// row dump is extracted without executing Lua; its source identity and hashes
// are recorded in agent/workflow/fixes/act-shop-20261112.md.
const defaultPath = tableAsset('ActShopTable.data.lua.json');
let defaultCache;

const EXPECTED_ROWS = Object.freeze({
  Goods: 1588,
  MultiLevel: 152,
  ActShop: 84
});

function rowsOf(dump, name) {
  const rows = dump?.[name];
  if (!(rows instanceof Map)) throw new Error('Missing ActShop table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (rows.size !== expected) {
    throw new Error('ActShop table ' + name + ' has ' + rows.size + ' rows, expected ' + expected);
  }
  return rows;
}

function positive(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(label + ' is invalid');
  return number;
}

function nonNegative(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(label + ' is invalid');
  return number;
}

function optionalPositive(value, label) {
  if (value == null) return null;
  return positive(value, label);
}

function award(value, label) {
  if (value == null || (typeof value === 'object' && !Array.isArray(value))) return [];
  if (!Array.isArray(value)) throw new Error(label + ' is invalid');
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length < 2) throw new Error(label + ' is invalid');
    return [positive(pair[0], label + ' tid'), positive(pair[1], label + ' count')];
  });
}

function normalizeGoods(row) {
  const tid = positive(row.tid, 'Goods tid');
  return {
    tid,
    version: positive(row.version, 'Goods ' + tid + ' version'),
    goodsTid: positive(row.goods_tid, 'Goods ' + tid + ' goods_tid'),
    count: positive(row.count, 'Goods ' + tid + ' count'),
    buyLimit: positive(row.buy_limit, 'Goods ' + tid + ' buy_limit'),
    buyItem: positive(row.buy_item, 'Goods ' + tid + ' buy_item'),
    buyPrice: nonNegative(row.buy_price, 'Goods ' + tid + ' buy_price'),
    goodsLevelTid: nonNegative(row.goods_level_tid, 'Goods ' + tid + ' goods_level_tid'),
    unlockCondition: optionalPositive(row.unlock_condition, 'Goods ' + tid + ' unlock_condition'),
    lockText: nonNegative(row.lock_text, 'Goods ' + tid + ' lock_text'),
    onOffCondition: optionalPositive(row.on_off_condition, 'Goods ' + tid + ' on_off_condition'),
    sortWeight: nonNegative(row.sort_weight, 'Goods ' + tid + ' sort_weight')
  };
}

function normalizeMultiLevel(row) {
  const tid = positive(row.tid, 'MultiLevel tid');
  return {
    tid,
    version: positive(row.version, 'MultiLevel ' + tid + ' version'),
    goodsLevel: positive(row.goods_level, 'MultiLevel ' + tid + ' goods_level'),
    award: award(row.award, 'MultiLevel ' + tid),
    tips: nonNegative(row.tips, 'MultiLevel ' + tid + ' tips')
  };
}

function normalizeShop(row) {
  const tid = positive(row.tid, 'ActShop tid');
  return {
    tid,
    buyItem: positive(row.buy_item, 'ActShop ' + tid + ' buy_item'),
    shopTitle: nonNegative(row.shop_title, 'ActShop ' + tid + ' shop_title'),
    recycleMailTid: nonNegative(row.recycle_mail_tid, 'ActShop ' + tid + ' recycle_mail_tid'),
    recycleTid: nonNegative(row.recycle_tid, 'ActShop ' + tid + ' recycle_tid'),
    awardTid: nonNegative(row.award_tid, 'ActShop ' + tid + ' award_tid'),
    awardNum: nonNegative(row.award_num, 'ActShop ' + tid + ' award_num')
  };
}

function append(map, key, row) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(row);
}

export function readActShopTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const parsed = readJsonAsset(file);
  const dump = readGeneratedDump(parsed, ['Goods', 'MultiLevel', 'ActShop']);
  const goodsRows = rowsOf(dump, 'Goods');
  const multiLevelRows = rowsOf(dump, 'MultiLevel');
  const shopRows = rowsOf(dump, 'ActShop');

  const shopsByVersion = new Map();
  for (const row of shopRows.values()) {
    const shop = normalizeShop(row);
    if (shopsByVersion.has(shop.tid)) throw new Error('ActShop has duplicate tid ' + shop.tid);
    shopsByVersion.set(shop.tid, shop);
  }

  const goodsById = new Map();
  const goodsByVersion = new Map();
  for (const row of goodsRows.values()) {
    const goods = normalizeGoods(row);
    if (goodsById.has(goods.tid)) throw new Error('ActShop Goods has duplicate tid ' + goods.tid);
    goodsById.set(goods.tid, goods);
    append(goodsByVersion, goods.version, goods);
  }
  for (const [version, rows] of goodsByVersion) {
    rows.sort((left, right) => left.tid - right.tid);
    if (!shopsByVersion.has(version)) throw new Error('ActShop Goods version ' + version + ' has no ActShop row');
  }

  const multiLevelById = new Map();
  const multiLevelByVersion = new Map();
  for (const row of multiLevelRows.values()) {
    const level = normalizeMultiLevel(row);
    if (multiLevelById.has(level.tid)) throw new Error('ActShop MultiLevel has duplicate tid ' + level.tid);
    multiLevelById.set(level.tid, level);
    append(multiLevelByVersion, level.version, level);
  }
  for (const [version, rows] of multiLevelByVersion) {
    rows.sort((left, right) => left.goodsLevel - right.goodsLevel || left.tid - right.tid);
    if (!shopsByVersion.has(version)) throw new Error('ActShop MultiLevel version ' + version + ' has no ActShop row');
    const levels = new Set();
    for (const row of rows) {
      if (levels.has(row.goodsLevel)) {
        throw new Error('ActShop MultiLevel version ' + version + ' has duplicate level ' + row.goodsLevel);
      }
      levels.add(row.goodsLevel);
    }
  }

  const result = {
    source: parsed.source ?? null,
    Goods: goodsRows,
    MultiLevel: multiLevelRows,
    ActShop: shopRows,
    shopsByVersion,
    goodsById,
    goodsByVersion,
    multiLevelById,
    multiLevelByVersion
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function actShopGoodsForVersion(tables, version) {
  return tables?.goodsByVersion?.get(Number(version)) ?? [];
}

export function actShopLevelsForVersion(tables, version) {
  return tables?.multiLevelByVersion?.get(Number(version)) ?? [];
}
