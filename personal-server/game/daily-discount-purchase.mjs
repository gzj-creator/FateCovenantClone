const DAILY_DISCOUNT_ONE_KEY_PRODUCT_ID = 46003;
const DAILY_DISCOUNT_ONE_KEY_FREE_PRODUCT_ID = 40006;

// DailyDiscountTable.Recharge_ValueIndex maps a recharge product to the short
// tid stored in pb_daily_discount_data.
export const DAILY_DISCOUNT_VALUE_INDEX = new Map([
  [40008, 4], [40006, 1], [46002, 5], [46003, 6], [40010, 3], [40009, 2]
]);

const rewardPairs = product => (product.reward_tid ?? []).map((tid, index) => [
  Number(tid),
  Number(product.reward_count[index])
]);

export function createDailyDiscountPurchaseRules({ rows, rechargeTable, valueIndex = DAILY_DISCOUNT_VALUE_INDEX }) {
  const rowByTid = new Map(rows.map(row => [Number(row.tid), row]));
  const rowByProductId = new Map(rows.map(row => [Number(row.recharge_id), row]));

  const resolve = product => {
    const productId = Number(product?.tid);
    const own = rowByProductId.get(productId);
    const ownTid = Number(own?.tid ?? valueIndex.get(productId));
    if (!ownTid) return null;

    const affectedTids = [ownTid];
    const addTid = tid => {
      const normalized = Number(tid);
      if (!rowByTid.has(normalized) || !rechargeTable.get(Number(rowByTid.get(normalized)?.recharge_id))) return false;
      if (!affectedTids.includes(normalized)) affectedTids.push(normalized);
      return true;
    };

    if (!addTid(ownTid)) return null;
    for (const dependency of own?.batch_update ?? []) {
      if (!addTid(dependency)) return null;
    }

    const oneKey = productId === DAILY_DISCOUNT_ONE_KEY_PRODUCT_ID;
    const optionalTids = [];
    if (oneKey) {
      const freeRow = rowByProductId.get(DAILY_DISCOUNT_ONE_KEY_FREE_PRODUCT_ID);
      const freeProduct = rechargeTable.get(DAILY_DISCOUNT_ONE_KEY_FREE_PRODUCT_ID);
      if (!freeRow || !freeProduct || !addTid(freeRow.tid)) return null;
      optionalTids.push(Number(freeRow.tid));
    }

    return { affectedTids, oneKey, optionalTids };
  };

  const affectedTids = product => {
    const facts = resolve(product);
    if (!facts) throw new TypeError('Invalid daily discount purchase configuration');
    return facts.affectedTids;
  };

  const rewards = (product, includeOneKeyFreeGift = true) => {
    const facts = resolve(product);
    if (!facts) throw new TypeError('Invalid daily discount purchase configuration');
    const result = facts.affectedTids.flatMap(tid => (rowByTid.get(tid)?.award ?? []).map(pair => [
      Number(pair[0]), Number(pair[1])
    ]));
    if (facts.oneKey && includeOneKeyFreeGift) result.push(...rewardPairs(rechargeTable.get(DAILY_DISCOUNT_ONE_KEY_FREE_PRODUCT_ID)));
    return result;
  };

  return { rowByTid, rowByProductId, resolve, affectedTids, rewards };
}
