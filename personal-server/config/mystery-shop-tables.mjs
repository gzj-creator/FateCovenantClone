import { readJsonAsset, tableAsset } from '../assets.mjs';

export const MYSTERY_SHOP_SOURCE_SHA256 = '4c575e23cb8235f43882a908ad6b3d8b3c0d8047c1d1f352bd4f6f582afd1c1c';
export const MYSTERY_SHOP_EXPECTED_COUNTS = Object.freeze({
  CellType: 5,
  Cell: 14,
  ItemLib: 418,
  Const: 1,
  ManualRefresh: 5,
  DiscountLibType: 5,
  DiscountLib: 35
});

const defaultPath = tableAsset('MysteryShopTable.data.json.gz');
const FAMILIES = Object.freeze(Object.keys(MYSTERY_SHOP_EXPECTED_COUNTS));
let defaultCache;

function integer(value, label, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new Error(`Invalid MysteryShop table ${label}: ${value}`);
  return number;
}

function rowsById(raw, family) {
  const rows = raw?.[family];
  if (!Array.isArray(rows) || rows.length !== MYSTERY_SHOP_EXPECTED_COUNTS[family]) {
    throw new Error(`MysteryShop ${family} row count does not match the shipped table`);
  }
  const result = new Map();
  for (const row of rows) {
    const tid = integer(row?.tid, `${family}.tid`, { min: 1 });
    if (result.has(tid)) throw new Error(`MysteryShop ${family} duplicates tid ${tid}`);
    result.set(tid, Object.freeze({ ...row, tid }));
  }
  return result;
}

function grouped(rows, field) {
  const result = new Map();
  for (const row of rows.values()) {
    const key = integer(row[field], `family.${field}`, { min: 1 });
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  for (const list of result.values()) list.sort((left, right) => Number(left.tid) - Number(right.tid));
  return result;
}

function groupedBy(rows, selector) {
  const result = new Map();
  for (const row of rows.values()) {
    const key = selector(row);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  for (const list of result.values()) list.sort((left, right) => Number(left.tid) - Number(right.tid));
  return result;
}

export function readMysteryShopTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const parsed = readJsonAsset(file);
  const raw = parsed?.families ?? parsed;
  const rows = Object.fromEntries(FAMILIES.map(family => [family, rowsById(raw, family)]));

  for (const row of rows.Cell.values()) {
    integer(row.cell_show_type, `Cell ${row.tid} cell_show_type`, { min: 1 });
    integer(row.cell_lib_type, `Cell ${row.tid} cell_lib_type`, { min: 1 });
    if (!rows.DiscountLibType.has(row.cell_lib_type)) {
      throw new Error(`MysteryShop Cell ${row.tid} references unknown DiscountLibType ${row.cell_lib_type}`);
    }
  }

  for (const row of rows.ItemLib.values()) {
    for (const field of ['cost_item', 'count', 'item']) integer(row[field], `ItemLib ${row.tid} ${field}`, { min: 1 });
    if (!Array.isArray(row.discount_price) || row.discount_price.length < 1) {
      throw new Error(`MysteryShop ItemLib ${row.tid} has no discount_price tiers`);
    }
    row.discount_price.forEach((price, index) => integer(price, `ItemLib ${row.tid} discount_price[${index}]`, { min: 1 }));
    if (row.pre_condition !== undefined) integer(row.pre_condition, `ItemLib ${row.tid} pre_condition`, { min: 1 });
  }

  const discountByType = grouped(rows.DiscountLib, 'discount_lib_type');
  for (const row of rows.DiscountLib.values()) {
    integer(row.discount_idx, `DiscountLib ${row.tid} discount_idx`, { min: 1 });
    integer(row.discount, `DiscountLib ${row.tid} discount`, { min: 1 });
    integer(row.auto_refresh_weight, `DiscountLib ${row.tid} auto_refresh_weight`, { min: 0 });
    if (!Array.isArray(row.manual_refresh_cw)) throw new Error(`MysteryShop DiscountLib ${row.tid} has no refresh weights`);
  }
  for (const type of rows.DiscountLibType.keys()) {
    if (!discountByType.get(type)?.length) throw new Error(`MysteryShop DiscountLibType ${type} has no discounts`);
  }

  // ItemLib tid 10101001 encodes its library family in the leading digit.
  // This is the same relation MysteryShopMgr uses through Cell.cell_lib_type.
  const itemLibByType = groupedBy(rows.ItemLib, row => Math.floor(Number(row.tid) / 10000000));
  const itemLibByCell = new Map();
  for (const cell of rows.Cell.values()) {
    const list = itemLibByType.get(cell.cell_lib_type) ?? [];
    if (!list.length) throw new Error(`MysteryShop Cell ${cell.tid} has no ItemLib rows for type ${cell.cell_lib_type}`);
    for (const item of list) {
      if (!itemLibByCell.has(cell.tid)) itemLibByCell.set(cell.tid, []);
      itemLibByCell.get(cell.tid).push(item);
    }
  }

  for (const row of rows.ManualRefresh.values()) {
    integer(row.price, `ManualRefresh ${row.tid} price`, { min: 1 });
    integer(row.currency_type, `ManualRefresh ${row.tid} currency_type`, { min: 1 });
  }
  const constant = rows.Const.get(1);
  for (const field of ['max_manual_refresh', 'buy_count_total', 'high_discount_up', 'bubble_cd_time', 'hero_full_star_correct']) {
    integer(constant[field], `Const.${field}`, { min: 0 });
  }

  const frozen = Object.freeze({
    sourceSha256: MYSTERY_SHOP_SOURCE_SHA256,
    counts: MYSTERY_SHOP_EXPECTED_COUNTS,
    rows,
    discountByType,
    itemLibByType,
    itemLibByCell,
    cell: tid => rows.Cell.get(Number(tid)) ?? null,
    item: tid => rows.ItemLib.get(Number(tid)) ?? null,
    discount: tid => rows.DiscountLib.get(Number(tid)) ?? null,
    manualRefresh: tid => rows.ManualRefresh.get(Number(tid)) ?? null
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}
