import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const DIAMOND_FUND_MODULE = 532;
const DIAMOND_FUND_RECHARGE = 89;
const DIAMOND_FUND_HANDLE_FLAG = 76;
const DIAMOND_FUND_CYCLE_DAYS = 15;
const DIAMOND_FUND_CYCLE_SECONDS = DIAMOND_FUND_CYCLE_DAYS * 86400;

const slotForType = type => {
  if (Number(type) === 1) return 'steady';
  if (Number(type) === 2) return 'fortune';
  return null;
};

function emptySlot() {
  return { day_award: [], day_award_history: [] };
}

function normalizeSlot(slot) {
  const normalized = slot ?? emptySlot();
  normalized.day_award ??= [];
  normalized.day_award_history ??= [];
  return normalized;
}

function normalizeInfo(info) {
  const normalized = info ?? {};
  normalized.steady = normalizeSlot(normalized.steady);
  normalized.fortune = normalizeSlot(normalized.fortune);
  return normalized;
}

function purchaseTimestamp(row) {
  const timestamp = Math.floor(Date.parse(row.created_at) / 1000);
  return Number.isSafeInteger(timestamp) && timestamp > 0 ? timestamp : null;
}

// RechargeTable type 89 is consumed by DiamondFundMgr. Login module 532 owns
// the fund state, while flag 76 carries the same pb_diamond_fund message in a
// recharge response. The client treats cycle_time as the end of the active
// cycle, so reconstruct it from the order time instead of the server restart
// time; otherwise a restart silently shortens or extends the fund.
export function createDiamondFundService({ codec, tables }) {
  const fundByRecharge = new Map();
  for (const row of tables.DiamondFundType?.values?.() ?? []) {
    const slot = slotForType(row.tid);
    const rechargeTid = Number(row.recharge_tid);
    if (!slot || !Number.isSafeInteger(rechargeTid) || rechargeTid <= 0) continue;
    if (!fundByRecharge.has(rechargeTid)) fundByRecharge.set(rechargeTid, { slot, rechargeTid });
  }
  // Keep these generated-table fallbacks so a reduced fixture can still test a
  // real client purchase without inventing a second source of fund ids.
  if (!fundByRecharge.has(155001)) fundByRecharge.set(155001, { slot: 'steady', rechargeTid: 155001 });
  if (!fundByRecharge.has(155002)) fundByRecharge.set(155002, { slot: 'fortune', rechargeTid: 155002 });

  function supports(product) {
    return Number(product?.type) === DIAMOND_FUND_RECHARGE
      && fundByRecharge.has(Number(product?.tid));
  }

  function readInfo(modules) {
    const moduleValue = modules.get(DIAMOND_FUND_MODULE);
    if (!moduleValue) throw new GameError(5, 'Diamond fund login data is unavailable');
    return normalizeInfo(codec.unpack('pb_diamond_fund', rawBinary(moduleValue)));
  }

  function isActive(slot, at) {
    const cycleTime = Number(slot?.cycle_time ?? 0);
    return Number.isSafeInteger(cycleTime) && cycleTime > at;
  }

  function setPurchased(info, fund, purchasedAt) {
    const cycleTime = purchasedAt + DIAMOND_FUND_CYCLE_SECONDS;
    const slot = info[fund.slot];
    slot.cycle_time = cycleTime;
    slot.day_award ??= [];
    slot.day_award_history ??= [];
    slot.buy_limit_info = {
      refresh_time: cycleTime,
      buy_num_list: [{
        recharge_id: fund.rechargeTid,
        buy_num: 1,
        refresh_time: cycleTime,
        used_extra_times: 0
      }]
    };
    return { cycleTime, slot };
  }

  function assertPurchaseAvailable({ modules, product, at }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported diamond fund product');
    const info = readInfo(modules);
    const fund = fundByRecharge.get(Number(product.tid));
    if (isActive(info[fund.slot], at)) throw new GameError(307, 'Diamond fund is already active');
  }

  function purchase({ model, product, at }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported diamond fund product');
    const modules = new Map(model.state.modules.value);
    assertPurchaseAvailable({ modules, product, at });
    const info = readInfo(modules);
    const fund = fundByRecharge.get(Number(product.tid));
    const { cycleTime } = setPurchased(info, fund, at);
    const data = codec.pack('pb_diamond_fund', info);
    modules.set(DIAMOND_FUND_MODULE, serializedBinary(data));
    model.state.modules.value = [...modules];
    return {
      slot: fund.slot,
      cycleTime,
      info,
      extraRetList: [{ flag: DIAMOND_FUND_HANDLE_FLAG, data }]
    };
  }

  function restoreFromOrders({ modules, rows, at }) {
    const purchases = rows
      .filter(row => fundByRecharge.has(Number(row.product_id)))
      .map(row => ({ row, purchasedAt: purchaseTimestamp(row) }))
      .filter(row => row.purchasedAt !== null)
      .sort((left, right) => left.purchasedAt - right.purchasedAt);
    if (!purchases.length) return false;

    const info = modules.has(DIAMOND_FUND_MODULE)
      ? readInfo(modules)
      : normalizeInfo({});
    let changed = false;

    // The normal purchase path has no business changing once the order is
    // committed. Repair missing or partial state by replaying purchases from
    // their original timestamps in chronological order.
    for (const { row, purchasedAt } of purchases) {
      const fund = fundByRecharge.get(Number(row.product_id));
      const slot = info[fund.slot];
      const expectedCycleTime = purchasedAt + DIAMOND_FUND_CYCLE_SECONDS;
      const hasLimit = slot.buy_limit_info?.buy_num_list?.some(entry =>
        Number(entry.recharge_id) === fund.rechargeTid && Number(entry.buy_num ?? 0) > 0
      );
      if (isActive(slot, at) && hasLimit
        && Number(slot.cycle_time) === expectedCycleTime) continue;

      // Preserve the current reward ledger and cycle if it is valid. A legacy
      // order row can only repair an empty, expired or partially initialized
      // slot; it must not erase claims that were persisted by a later server.
      if (isActive(slot, at) && hasLimit) continue;
      setPurchased(info, fund, purchasedAt);
      changed = true;
    }

    if (!changed && modules.has(DIAMOND_FUND_MODULE)) return false;
    modules.set(DIAMOND_FUND_MODULE, serializedBinary(codec.pack('pb_diamond_fund', info)));
    return true;
  }

  return {
    moduleId: DIAMOND_FUND_MODULE,
    handleFlag: DIAMOND_FUND_HANDLE_FLAG,
    supports,
    assertPurchaseAvailable,
    purchase,
    restoreFromOrders,
    readInfo,
    fundByRecharge
  };
}
