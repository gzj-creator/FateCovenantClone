import { readMysteryShopTables } from './mystery-shop-tables.mjs';

// 91501 (auto refresh) and 91502 (manual refresh) share pb_mystery_shop with
// 91503, but their server side must regenerate discount_items. The shipped
// table only supplies per-discount weights, the manual price ladder and two
// global limits; it does not describe which ItemLib rows form a cell's pool,
// how many items a refresh produces, or how all_times_data is advanced. This
// module freezes exactly what the table proves so the residual gap in the
// shared refusal reasons stays verifiable.
export const MYSTERY_REFRESH_COMMAND_TYPES = Object.freeze({ autoRefresh: 91501, manualRefresh: 91502 });

export const MYSTERY_REFRESH_DECISIONS = Object.freeze({
  91501: 'R1-ITEM-MYSTERYSHOP-AUTOREFRESH',
  91502: 'R1-ITEM-MYSTERYSHOP-MANUALREFRESH'
});

export const MANUAL_REFRESH_CURRENCY = 101500;
// MysteryShopMgr.GetRefreshPriceCfg takes the last ManualRefresh row whose
// tid <= manualRefreshCount + 1, and IsManualRefreshLimit compares
// Const.max_manual_refresh <= manualRefreshCount (prototypes #12 and #15).
export const MANUAL_REFRESH_PRICE_TIERS = Object.freeze([100, 100, 120, 120, 150]);
export const MAX_MANUAL_REFRESH = 5;
export const MANUAL_REFRESH_WEIGHT_STAGES = Object.freeze([2, 4, 5, 20]);

export const MYSTERY_REFRESH_MISSING_EVIDENCE = Object.freeze([
  'which ItemLib rows (418 shipped) form each cell_lib_type candidate pool and how many items one refresh emits',
  'how Cell.cell_show_type (1/3/4) and cell_lib_type select the refreshed cells, including pre_condition evaluation for 3 Cells and 116 ItemLib rows',
  'the stage selector behind DiscountLib.manual_refresh_cw pairs [2/4/5/20, weight] and the automatic path behind DiscountLib.auto_refresh_weight',
  'how pb_mystery_shop.all_times_data (times_type/tid/stage/times) and customize_auto_refresh_times are advanced by either refresh',
  'next_auto_refresh_time computation and whether 91501 itself mutates state or only returns the regenerated shop',
  'is_rare_goods and Const.hero_full_star_correct eligibility rules (no rare goods rows are shipped)'
]);

const defaultEvidence = new WeakMap();

function integer(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid mystery shop refresh evidence ${label}: ${value}`);
  return number;
}

function weightPairs(value, label) {
  if (!Array.isArray(value) || value.length !== MANUAL_REFRESH_WEIGHT_STAGES.length) {
    throw new Error(`Mystery shop ${label} must carry ${MANUAL_REFRESH_WEIGHT_STAGES.length} weighted stages`);
  }
  return Object.freeze(value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Mystery shop ${label}[${index}] is not a pair`);
    const stage = integer(pair[0], `${label}[${index}].stage`);
    const weight = integer(pair[1], `${label}[${index}].weight`);
    if (stage !== MANUAL_REFRESH_WEIGHT_STAGES[index]) {
      throw new Error(`Mystery shop ${label}[${index}] stage ${stage} is not ${MANUAL_REFRESH_WEIGHT_STAGES[index]}`);
    }
    return Object.freeze([stage, weight]);
  }));
}

export function readMysteryShopRefreshEvidence(tables = readMysteryShopTables()) {
  const cached = defaultEvidence.get(tables);
  if (cached) return cached;

  const manualRows = [...tables.rows.ManualRefresh.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
  if (manualRows.length !== MANUAL_REFRESH_PRICE_TIERS.length) {
    throw new Error('Mystery shop ManualRefresh row count does not match the frozen ladder');
  }
  const priceTiers = manualRows.map((row, index) => {
    const tid = integer(row.tid, 'ManualRefresh.tid');
    const price = integer(row.price, `ManualRefresh ${tid} price`);
    const currency = integer(row.currency_type, `ManualRefresh ${tid} currency`);
    if (tid !== index + 1) throw new Error(`Mystery shop ManualRefresh tid ${tid} is not contiguous`);
    if (price !== MANUAL_REFRESH_PRICE_TIERS[index]) {
      throw new Error(`Mystery shop ManualRefresh ${tid} price ${price} is not ${MANUAL_REFRESH_PRICE_TIERS[index]}`);
    }
    if (currency !== MANUAL_REFRESH_CURRENCY) {
      throw new Error(`Mystery shop ManualRefresh ${tid} currency ${currency} is not ${MANUAL_REFRESH_CURRENCY}`);
    }
    return Object.freeze({ tid, price, currency_type: currency });
  });

  const constant = tables.rows.Const.get(1);
  if (integer(constant?.max_manual_refresh, 'Const.max_manual_refresh') !== MAX_MANUAL_REFRESH) {
    throw new Error('Mystery shop Const.max_manual_refresh does not match the frozen limit');
  }

  const discountWeights = new Map();
  for (const [type, rows] of [...tables.discountByType].sort((left, right) => Number(left[0]) - Number(right[0]))) {
    if (!rows.length) throw new Error(`Mystery shop DiscountLibType ${type} has no discount rows`);
    discountWeights.set(Number(type), Object.freeze(rows.map(row => Object.freeze({
      tid: Number(row.tid),
      discount_idx: integer(row.discount_idx, `DiscountLib ${row.tid} discount_idx`),
      discount: integer(row.discount, `DiscountLib ${row.tid} discount`),
      auto_refresh_weight: integer(row.auto_refresh_weight, `DiscountLib ${row.tid} auto_refresh_weight`),
      manual_refresh_cw: weightPairs(row.manual_refresh_cw, `DiscountLib ${row.tid} manual_refresh_cw`)
    }))));
  }
  if (discountWeights.size !== tables.rows.DiscountLibType.size) {
    throw new Error('Mystery shop DiscountLib does not cover every DiscountLibType');
  }

  const cells = [...tables.rows.Cell.values()];
  const items = [...tables.rows.ItemLib.values()];
  const frozen = Object.freeze({
    // The ladder, limits and weights are provable; the candidate generation and
    // state transition are not, so no 91501/91502 mutation may be enabled.
    gameplayReady: false,
    decisions: MYSTERY_REFRESH_DECISIONS,
    missingEvidence: MYSTERY_REFRESH_MISSING_EVIDENCE,
    priceTiers: Object.freeze(priceTiers),
    maxManualRefresh: MAX_MANUAL_REFRESH,
    currency: MANUAL_REFRESH_CURRENCY,
    discountWeights,
    // Mirrors MysteryShopMgr.GetRefreshPriceCfg / IsManualRefreshLimit. Returning
    // null means the client blocks the request before it is even sent.
    priceForRefreshCount(count) {
      const consumed = integer(count, 'manualRefreshCount');
      if (consumed >= MAX_MANUAL_REFRESH) return null;
      const target = consumed + 1;
      let chosen = null;
      for (const tier of priceTiers) if (tier.tid <= target) chosen = tier;
      return chosen;
    },
    facts: Object.freeze({
      cellCount: cells.length,
      itemLibCount: items.length,
      cellsWithPreCondition: cells.filter(row => row.pre_condition !== undefined).length,
      itemsWithPreCondition: items.filter(row => row.pre_condition !== undefined).length,
      rareGoodsRows: items.filter(row => row.is_rare_goods).length,
      cellsWithAutoWeight: [...discountWeights.values()].filter(rows => rows.some(row => row.auto_refresh_weight > 0)).length,
      autoRefreshClockField: 'next_auto_refresh_time',
      unsolvedStateFields: Object.freeze(['all_times_data', 'customize_auto_refresh_times'])
    })
  });
  defaultEvidence.set(tables, frozen);
  return frozen;
}
