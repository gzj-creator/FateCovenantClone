import { randomUUID } from 'node:crypto';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { consumeResources, grantResources, rewardHandlerFor } from './resources.mjs';
import { GameError } from './hero-progression.mjs';
import { gameDay, gameDayIndex } from './time.mjs';
import { createMonthPermitService } from './month-permit-service.mjs';
import { createPermitService } from './permit-service.mjs';
import { createMonthlyCardService } from './monthly-card-service.mjs';
import { createDiamondFundService } from './diamond-fund-service.mjs';
import { createPermanentCardService } from './permanent-card-service.mjs';
import { createDailyDiscountPurchaseRules } from './daily-discount-purchase.mjs';
import { createRegularGiftService, REGULAR_GIFT_HANDLE } from './regular-gift-service.mjs';
import { isDailyDiscountOrder, rechargeCycleKey } from './recharge-rules.mjs';
const DAILY_DISCOUNT_RECHARGE = 46;
const DAILY_DISCOUNT_HANDLE = 40;
const DAILY_DISCOUNT_MODULE = 108;
const key = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,120}$/.test(value);
// res_recharge_success.extra_params is an ETF argument list. RechargeMgr takes
// its first element and passes it to the recharge event as extraParams; the
// WishTree and WeekHunt handlers index that value as [isExtraBuy, period, day].
function etfTerm(value) {
  if (Array.isArray(value)) {
    const parts = [Buffer.from([0x6c]), Buffer.alloc(4)];
    parts[1].writeUInt32BE(value.length, 0);
    for (const item of value) parts.push(etfTerm(item));
    parts.push(Buffer.from([0x6a]));
    return Buffer.concat(parts);
  }
  if (typeof value === 'boolean') {
    const atom = Buffer.from(value ? 'true' : 'false');
    return Buffer.concat([Buffer.from([0x77, atom.length]), atom]);
  }
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) throw new TypeError('Unsupported ETF value');
  if (value >= 0 && value <= 255) return Buffer.from([0x61, value]);
  const bytes = Buffer.alloc(5);
  bytes[0] = 0x62;
  bytes.writeInt32BE(value, 1);
  return bytes;
}
function etfList(values) {
  return Buffer.concat([Buffer.from([0x83]), etfTerm(values)]);
}
function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}
// Payloads are stored as JSON for idempotent replay. JSON turns Buffers into
// {type:'Buffer',data:[...]}; restore them before handing the payload back to
// protobufjs so a retried request cannot fail while encoding its response.
function reviveJsonBuffers(value) {
  if (Array.isArray(value)) return value.map(reviveJsonBuffers);
  if (!value || typeof value !== 'object') return value;
  if (value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data);
  for (const [key, entry] of Object.entries(value)) value[key] = reviveJsonBuffers(entry);
  return value;
}
const parseStoredPayload = json => reviveJsonBuffers(JSON.parse(json ?? '{}'));
export function createWalletService({
  store, codec, tables, voucher, monthPermit, permitService, monthlyCard, diamondFund, permanentCard, petActivity, premiumActivity, heroDrawActivity,
  groupBuyActivity, wishTreasure, wishTree, weekHunt, rechargeBonus, lineFirstRecharge, rechargeExtraAward, minigameActivity,
  regularGift,
  accountId = 'local-1', phone = '19900000000', publish = () => {}, logger = () => {}, now = () => Math.floor(Date.now() / 1000)
}) {
  const log = event => { try { logger(event); } catch {} };
  const configuredAccountId = accountId;
  const accountIdFor = () => store.currentAccountId?.() ?? configuredAccountId;
  function roleIdForAccount(account) {
    const row = store.inspect(db => db.prepare('SELECT role_id FROM accounts WHERE account_id=?').get(account)
      ?? db.prepare('SELECT role_id FROM local_wallets WHERE account_id=?').get(account));
    if (!row) throw new GameError(5, 'Unknown local account');
    return Number(row.role_id);
  }
  const permits = monthPermit ?? createMonthPermitService({ codec, tables });
  const standardPermits = permitService ?? createPermitService({ codec, tables });
  const monthlyCards = monthlyCard ?? createMonthlyCardService({ codec, tables });
  const diamondFunds = diamondFund ?? createDiamondFundService({ codec, tables });
  const permanentCards = permanentCard ?? createPermanentCardService({ codec, tables });
  const regularGifts = regularGift ?? createRegularGiftService({ codec, tables, accountId: accountIdFor });
  const GIFT_BUY_RECORD_HANDLE = 73;
  const dailyRechargeRows = [...(tables.DailyDiscountRecharge?.values?.() ?? [])];
  const dailyDiscountProductIds = new Set(dailyRechargeRows.map(row => Number(row.recharge_id)));
  const dailyRechargeRowByTid = new Map(dailyRechargeRows.map(row => [Number(row.tid), row]));
  const dailyRechargeRowByProductId = new Map(dailyRechargeRows.map(row => [Number(row.recharge_id), row]));
  const dailyPurchaseRules = createDailyDiscountPurchaseRules({
    rows: dailyRechargeRows,
    rechargeTable: tables.Recharge
  });
  const dailyDay = seconds => gameDayIndex(seconds);
  const nextDailyRefresh = seconds => gameDay(seconds) + 86400;
  // WishTree only accepts rebate days inside the open 14-day cycle. A purchase
  // whose server day falls outside that cycle still debits vouchers, grants
  // rewards and records its order; only the rebate bookkeeping is unavailable.
  // Skip that entry instead of failing the whole purchase, and leave every
  // other wish-tree error visible.
  const recordWishTreePurchase = args => {
    if (typeof wishTree?.recordPurchase !== 'function') return null;
    try {
      return wishTree.recordPurchase(args);
    } catch (error) {
      if (Number(error?.code) !== 310) throw error;
      log({ event: 'wish_tree_rebate_skipped', product_id: args.productId, day: args.day, code: 310, reason: error.message });
      return null;
    }
  };
  // Week Hunt shares 40008 and 40010 with DailyDiscount and Hundred Schools.
  // RechargeMgr can retain the closed Week Hunt period in the optional tuple
  // even when the recruitment gift page is the actual source. Treat that
  // auxiliary task ledger as unavailable and continue the purchase, while a
  // real Week Hunt purchase without another live gift source still reports 309.
  const resolveWeekHuntPurchase = (args, { allowClosedPeriod = false, logSkipped = false } = {}) => {
    if (typeof weekHunt?.resolvePurchase !== 'function') return null;
    try {
      return weekHunt.resolvePurchase(args);
    } catch (error) {
      if (!allowClosedPeriod || Number(args?.period) <= 0 || Number(error?.code) !== 309) throw error;
      if (logSkipped) {
        log({
          event: 'week_hunt_period_skipped', productId: Number(args?.product?.tid),
          period: Number(args.period), dayIndex: Number(args.dayIndex ?? 0), code: 309, reason: error.message
        });
      }
      return null;
    }
  };
  const dailyDiscountInfo = modules => {
    const raw = modules.get(DAILY_DISCOUNT_MODULE);
    if (!raw) return { refresh_time: 0, buy_additionally: 0, daily_discount_list: [], select_list: [], data_version: 0 };
    return codec.unpack('pb_daily_discount_all', rawBinary(raw));
  };
  const normalizeDailyDiscount = (info, seconds) => {
    let changed = false;
    if (!(Number(info.refresh_time ?? 0) > seconds)) {
      for (const row of info.daily_discount_list ?? []) if ((row.buy_times ?? 0) !== 0) { row.buy_times = 0; changed = true; }
      info.refresh_time = nextDailyRefresh(seconds);
      changed = true;
    }
    if (!Array.isArray(info.daily_discount_list)) { info.daily_discount_list = []; changed = true; }
    // Keep row and module timestamps in the same daily reset cycle.
    for (const row of info.daily_discount_list) {
      if (Number(row.refresh_time ?? 0) !== Number(info.refresh_time)) {
        row.refresh_time = info.refresh_time;
        changed = true;
      }
    }
    if (!Array.isArray(info.select_list)) { info.select_list = []; changed = true; }
    info.buy_additionally ??= 0;
    info.data_version ??= 0;
    return changed;
  };
  const setDailyDiscountInfo = (modules, info) => {
    const data = codec.pack('pb_daily_discount_all', info);
    modules.set(DAILY_DISCOUNT_MODULE, serializedBinary(data));
    return data;
  };
  const dailyPurchaseFacts = product => {
    const facts = dailyPurchaseRules.resolve(product);
    if (!facts) throw new GameError(5, 'Daily discount product is not mapped');
    return facts;
  };
  const affectedDailyDiscountTids = product => dailyPurchaseFacts(product).affectedTids;
  const dailyDiscountRow = (info, rechargeTid) => {
    let row = info.daily_discount_list.find(value => Number(value.recharge_tid) === rechargeTid);
    if (!row) {
      row = { recharge_tid: rechargeTid, buy_times: 0, refresh_time: info.refresh_time, buy_additionally: 0 };
      info.daily_discount_list.push(row);
    }
    row.buy_times = Math.max(0, Number(row.buy_times ?? 0));
    row.buy_additionally = Math.max(0, Number(row.buy_additionally ?? 0));
    row.refresh_time ??= info.refresh_time;
    return row;
  };
  const planDailyDiscountPurchase = (modules, product, seconds, allowAdditional = false) => {
    const facts = dailyPurchaseFacts(product);
    const info = dailyDiscountInfo(modules);
    normalizeDailyDiscount(info, seconds);
    const optionalTids = new Set(facts.optionalTids);
    const rows = facts.affectedTids.map(tid => ({
      tid,
      row: dailyDiscountRow(info, tid),
      product: tables.Recharge.get(Number(dailyRechargeRowByTid.get(tid)?.recharge_id ?? product.tid))
    }));
    const requiredRows = rows.filter(({ tid }) => !optionalTids.has(tid));
    const regularAvailable = requiredRows.every(({ row, product: affectedProduct }) => affectedProduct && Number(affectedProduct.can_buy_times ?? 0) > row.buy_times);
    if (regularAvailable) {
      for (const { row } of requiredRows) row.buy_times += 1;
      let oneKeyFreeGiftConsumed = false;
      for (const { tid, row, product: affectedProduct } of rows) {
        if (!optionalTids.has(tid) || !affectedProduct
          || Number(affectedProduct.can_buy_times ?? 0) <= row.buy_times) continue;
        row.buy_times += 1;
        oneKeyFreeGiftConsumed = true;
      }
      return { info, additional: false, oneKeyFreeGiftConsumed };
    }
    if (allowAdditional) {
      // A batch offer owns every component row. The batch row itself can be
      // non-additional while its component rows carry the replenishment stock.
      // Consume one additional purchase from every configured component or
      // reject the whole plan without changing the module.
      const additionalRows = rows.filter(({ row, product: affectedProduct }) => {
        const rotation = dailyRechargeRowByTid.get(row.recharge_tid);
        return Boolean(rotation?.is_buy_additionally)
          && affectedProduct?.can_buy_times > 0;
      });
      if (!additionalRows.length || additionalRows.some(({ row }) => row.buy_additionally <= 0)) return null;
      for (const { row } of additionalRows) row.buy_additionally -= 1;
      return { info, additional: true, oneKeyFreeGiftConsumed: false };
    }
    return null;
  };
  const buyGiftRecords = login => {
    const bytes = login.buy_gift_record ? Buffer.from(login.buy_gift_record, 'base64') : Buffer.alloc(0);
    return bytes.length ? codec.unpack('pb_buy_gift_record_list', bytes).record_list ?? [] : [];
  };
  const setBuyGiftRecords = (login, records) => {
    login.buy_gift_record = records.length ? codec.pack('pb_buy_gift_record_list', { record_list: records }) : Buffer.alloc(0);
  };
  const recordRecharge = (login, productId, amountCents, purchasedAt) => {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return false;
    const day = dailyDay(purchasedAt);
    const total = (login.total_amount ?? 0) + amountCents;
    if (total > 2147483647) throw new GameError(1, 'Recharge total limit reached');
    login.total_amount = total;
    login.recharge_record ??= { recent_record: [], total_day: 0 };
    login.recharge_record.recent_record ??= [];
    let daily = login.recharge_record.recent_record.find(row => Number(row.day_index) === day);
    if (!daily) {
      daily = { day_index: day, recharge_ids: [], amount: 0 };
      login.recharge_record.recent_record.push(daily);
      login.recharge_record.total_day = (login.recharge_record.total_day ?? 0) + 1;
    }
    daily.recharge_ids ??= [];
    daily.recharge_ids.push(productId);
    daily.amount = (daily.amount ?? 0) + amountCents;
    login.recharge_record.recent_record.sort((left, right) => Number(right.day_index) - Number(left.day_index));
    if (!login.max_record || daily.amount >= (login.max_record.amount ?? 0)) login.max_record = structuredClone(daily);
    return true;
  };
  const addBuyGiftRecord = (login, rechargeTid, buyTime) => {
    const records = buyGiftRecords(login);
    records.push({ recharge_tid: rechargeTid, buy_time: buyTime });
    setBuyGiftRecords(login, records);
  };
  function synchronizeAccount() {
    // Public empty realms run this during construction, before an account has
    // logged in. Login calls ensureAccount() again inside the role context.
    if (store.empty && !store.hasRoles()) return { accountId: null, roleId: null };
    const currentAccountId = accountIdFor();
    return store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id) VALUES (?,?)').run(currentAccountId, model.state.roleId);
    // Rebuild the client's gift purchase history from orders so purchase limits
    // remain visible after a server restart or a fresh client login.
    const rows = db.prepare('SELECT product_id,created_at,payload_json FROM recharge_orders WHERE account_id=? ORDER BY rowid').all(currentAccountId);
    const modules = new Map(model.state.modules.value);
    let changed = false;
    if (diamondFunds.restoreFromOrders({ modules, rows, at: now() })) changed = true;
    if (permanentCards.restoreFromOrders({ modules, rows })) changed = true;
    if (regularGifts.restoreFromOrders({ modules, rows, at: now() })) changed = true;
    const loginRaw = modules.get(19);
    if (loginRaw) {
      const login = codec.unpack('res_recharge_login', rawBinary(loginRaw));
      const recent = login.recharge_record?.recent_record ?? [];
      const oldDays = recent.map(row => row.day_index);
      // RechargeMgr scans newest days first. Preserve amounts and historical
      // records that predate the local order ledger.
      recent.sort((left, right) => Number(right.day_index) - Number(left.day_index));
      let loginChanged = recent.some((row, index) => row.day_index !== oldDays[index]);
      const records = buyGiftRecords(login);
      const seen = new Set(records.map(record => String(record.recharge_tid) + ':' + String(record.buy_time)));
      for (const row of rows) {
        const product = tables.Recharge.get(row.product_id);
        if (!product || !(product.can_buy_times > 0)) continue;
        const parsed = Math.floor(Date.parse(row.created_at) / 1000);
        const buyTime = Number.isSafeInteger(parsed) ? parsed : now();
        const key = String(row.product_id) + ':' + String(buyTime);
        if (seen.has(key)) continue;
        records.push({ recharge_tid: row.product_id, buy_time: buyTime });
        seen.add(key); loginChanged = true;
      }
      if (loginChanged) {
        setBuyGiftRecords(login, records);
        modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
        changed = true;
      }
    }
    const currentSeconds = now();
    const hasDailyOrders = rows.some(row => {
      if (tables.Recharge.get(row.product_id)?.type !== DAILY_DISCOUNT_RECHARGE) return false;
      let payload = {};
      try { payload = JSON.parse(row.payload_json ?? '{}'); } catch {}
      return isDailyDiscountOrder(payload, codec);
    });
    if (modules.has(DAILY_DISCOUNT_MODULE) || hasDailyOrders) {
      const info = dailyDiscountInfo(modules), today = dailyDay(currentSeconds);
      let dailyChanged = normalizeDailyDiscount(info, currentSeconds);
      const counts = new Map(), limits = new Map();
      for (const row of rows) {
        const product = tables.Recharge.get(row.product_id);
        if (product?.type !== DAILY_DISCOUNT_RECHARGE || !dailyRechargeRowByProductId.has(Number(row.product_id))) continue;
        const parsed = Math.floor(Date.parse(row.created_at) / 1000);
        if (!Number.isSafeInteger(parsed) || dailyDay(parsed) !== today) continue;
        let payload = {};
        try { payload = JSON.parse(row.payload_json ?? '{}'); } catch {}
        // A shared RechargeTable row such as 40008 can be bought from both the
        // daily-discount and hundred-schools UIs. Keep their counters separate.
        if (!isDailyDiscountOrder(payload, codec)) continue;
        // Additional buys share the daily row but do not consume its normal
        // `can_buy_times` allowance.
        if (payload.daily_discount_additional === true) continue;
        for (const rechargeTid of affectedDailyDiscountTids(product)) {
          const affectedProduct = tables.Recharge.get(Number(dailyRechargeRowByTid.get(rechargeTid)?.recharge_id ?? product.tid));
          counts.set(rechargeTid, (counts.get(rechargeTid) ?? 0) + 1);
          limits.set(rechargeTid, Number(affectedProduct?.can_buy_times ?? 1));
        }
      }
      for (const [rechargeTid, count] of counts) {
        const daily = dailyDiscountRow(info, rechargeTid);
        const normalized = Math.min(limits.get(rechargeTid) ?? count, count);
        if ((daily.buy_times ?? 0) !== normalized) { daily.buy_times = normalized; dailyChanged = true; }
      }
      if (dailyChanged) { setDailyDiscountInfo(modules, info); changed = true; }
    }
    if (changed) model.state.modules.value = [...modules];
    return { accountId: currentAccountId, roleId: model.state.roleId };
  });
  }
  synchronizeAccount();
  const hasCompleteRewards = row => Array.isArray(row?.reward_tid)
    && Array.isArray(row?.reward_count)
    && row.reward_tid.length === row.reward_count.length
    && row.reward_count.every(count => Number.isSafeInteger(Number(count)) && Number(count) > 0);
  // Every granted resource must have an explicit module handler. Permits are
  // the exception because they update their own activity module and expose an
  // empty RechargeTable reward list.
  const rewardIsHandled = tid => Boolean(rewardHandlerFor(tid, tables))
    || Boolean(minigameActivity?.isSourcePointReward?.(tid));
  const rewardsAreHandled = row => hasCompleteRewards(row)
    && row.reward_tid.every(rewardIsHandled);
  function grantPurchaseRewards(model, db, awards, at) {
    const sourcePointAwards = [], resourceAwards = [];
    for (const award of awards) {
      if (minigameActivity?.isSourcePointReward?.(award[0])) sourcePointAwards.push(award);
      else resourceAwards.push(award);
    }
    const changes = [];
    if (resourceAwards.length) changes.push(...grantResources(model, resourceAwards, tables, { codec, db }).changes);
    if (sourcePointAwards.length) {
      changes.push(...minigameActivity.grantSourcePointRewards({ model, db, awards: sourcePointAwards, at }).changes);
    }
    return { changes };
  }
  const ordinaryCashProduct = row => Boolean(row)
    && row.pay_type === 0
    && Number.isSafeInteger(Number(row.price))
    && Number(row.price) > 0
    && Number(row.sync_handle ?? 0) === 0
    && rewardsAreHandled(row);
  const supported = row => {
    if (!row) return false;
    if (diamondFunds.supports(row)) return true;
    if (permanentCards.supports(row)) return true;
    if (Number(row.type) === 130) return permits.supports(row);
    // Only cash monthly cards are advertised to the SDK/native 16004 payment
    // list. Free and resource-priced cards still use the shared 16005 path.
    if (monthlyCards.supports(row)) return ordinaryCashProduct(row);
    if (Number(row.type) === 76) return Boolean(petActivity?.isGiftRunning?.(row.tid)) && ordinaryCashProduct(row);
    if (premiumActivity?.isConfiguredGift(row.tid)) {
      return Boolean(premiumActivity.isGiftRunning?.(row.tid)) && ordinaryCashProduct(row);
    }
    if (Number(row.type) === 107 && groupBuyActivity) {
      return Boolean(groupBuyActivity.isGiftRunning?.(row.tid)) && ordinaryCashProduct(row);
    }
    if (Number(row.type) === 113) return Boolean(lineFirstRecharge?.supportsProduct(row)) && ordinaryCashProduct(row);
    if (Boolean(heroDrawActivity?.giftConfig(row.tid)) && ordinaryCashProduct(row)) return true;
    return standardPermits.supports(row) || ordinaryCashProduct(row);
  };
  // Activity services learn their live act ids during login. Compute this list
  // per snapshot so a mall opened after wallet construction cannot expose a
  // stale product set (or retain one after the activity closes).
  const supportedProducts = () => [...tables.Recharge.values()].filter(supported);

  const payloadOf = row => {
    try { return JSON.parse(row.payload_json ?? '{}'); } catch { return {}; }
  };
  const scopedPurchaseQuantity = (db, account, product, at, period = 0) => {
    const cycle = Number(product.buy_cycle_limit ?? 0);
    const wanted = rechargeCycleKey(product, at, { period });
    return db.prepare('SELECT created_at,payload_json FROM recharge_orders WHERE account_id=? AND product_id=? ORDER BY rowid')
      .all(account, product.tid)
      .reduce((total, row) => {
        const seconds = Math.floor(Date.parse(row.created_at) / 1000);
        if (!Number.isSafeInteger(seconds)) return total;
        const payload = payloadOf(row);
        let key;
        try {
          key = rechargeCycleKey(product, seconds, {
            period: Number.isSafeInteger(Number(payload.period)) ? Number(payload.period) : 0
          });
        } catch { return total; }
        if (cycle !== 0 && key !== wanted) return total;
        const quantity = Number(payload.buy_num ?? 1);
        return total + (Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1);
      }, 0);
  };
  function heroGiftForPurchase(productId, activityVersion) {
    const gift = heroDrawActivity?.giftConfig(productId);
    if (!gift) return null;
    if (activityVersion === undefined || activityVersion === null) {
      // 40008 and 40010 are shared by DailyDiscount and Hundred Schools. Their
      // DailyDiscount request has the binary JSON extra-parameter payload; the
      // Hundred Schools request carries a plain activity-version argument.
      return dailyDiscountProductIds.has(Number(productId)) ? null : gift;
    }
    const version = Number(activityVersion);
    if (!Number.isSafeInteger(version) || version !== Number(gift.config.version)) {
      throw new GameError(5, 'Hundred schools purchase version does not match the running activity');
    }
    return gift;
  }
  function heroGiftShadowForDailyPurchase(productId) {
    // HeroDrawActGiftItemNode sends type 46 gifts through DailyDiscountMgr:
    // RechargeGift instead of HeroDrawActMgr.ReqBuyRechargeGift. The server
    // still has to count that shared SKU for Hundred Schools and publish flag 92,
    // otherwise the gift page and recommendation page remain stale until relogin.
    if (!dailyDiscountProductIds.has(Number(productId))) return null;
    return heroDrawActivity?.giftConfig(productId) ?? null;
  }
  function snapshot() {
    const currentAccountId = accountIdFor();
    return store.inspect(db => ({
      accounts: db.prepare(`SELECT w.account_id,w.role_id,w.balance_cents,
        coalesce(a.phone,'') phone,r.profile_json
        FROM local_wallets w
        LEFT JOIN accounts a ON a.account_id=w.account_id
        LEFT JOIN roles r ON r.role_id=w.role_id
        ORDER BY w.account_id`).all().map(row => {
          let nickname = '';
          try {
            const profile = JSON.parse(row.profile_json);
            nickname = profile.nick_name ? Buffer.from(profile.nick_name, 'base64').toString() : '';
          } catch {}
          return { account_id: row.account_id, role_id: row.role_id, balance_cents: row.balance_cents, phone: row.phone, nickname };
        }),
      ledger: db.prepare('SELECT * FROM wallet_ledger ORDER BY rowid DESC LIMIT 100').all().map(row => ({ ...row, details: JSON.parse(row.details_json), details_json: undefined })),
      orders: db.prepare(`SELECT o.order_id,o.account_id,o.product_id,o.price_cents,o.created_at,o.acknowledged,
        coalesce(r.quantity,0) voucher_quantity, coalesce(r.amount_cents,0) voucher_amount_cents,
        o.price_cents-coalesce(r.amount_cents,0) balance_paid_cents
        FROM recharge_orders o LEFT JOIN voucher_redemptions r ON r.order_id=o.order_id ORDER BY o.rowid DESC LIMIT 100`).all(),
      totals: { credited_cents: db.prepare("SELECT coalesce(sum(delta_cents),0) n FROM wallet_ledger WHERE kind='credit'").get().n,
        order_count: db.prepare('SELECT count(*) n FROM recharge_orders').get().n,
        voucher_redeemed_cents: db.prepare('SELECT coalesce(sum(amount_cents),0) n FROM voucher_redemptions').get().n,
        voucher_order_count: db.prepare('SELECT count(*) n FROM voucher_redemptions').get().n },
      products: supportedProducts().map(row => {
        const purchaseCount = store.inspect(db => {
          return db.prepare('SELECT count(*) AS purchase_count FROM recharge_orders WHERE account_id=? AND product_id=?').get(currentAccountId, row.tid).purchase_count;
        });
        return {
          id: row.tid,
          price_cents: row.price,
          rewards: row.reward_tid.map((tid,i) => ({ tid, count: row.reward_count[i] })),
          type: row.type,
          can_buy_times: row.can_buy_times,
          purchased: purchaseCount,
          available: row.can_buy_times > 0 ? Math.max(0, row.can_buy_times - purchaseCount) : 0
        };
      })
    }));
  }
  function credit({ account_id, amount_cents, request_id, note = '' }) {
    const ownerRoleId = typeof account_id === 'string' ? roleIdForAccount(account_id) : null;
    if (!ownerRoleId || !key(request_id) || !Number.isSafeInteger(amount_cents) || amount_cents <= 0 || amount_cents > 100000000 || typeof note !== 'string' || note.length > 200) throw new GameError(1, 'Invalid local balance credit');
    return store.transaction((model, db) => {
      const id = account_id + ':credit:' + request_id;
      const old = db.prepare('SELECT * FROM wallet_ledger WHERE entry_id=?').get(id);
      if (old) { if (old.delta_cents !== amount_cents || JSON.parse(old.details_json).note !== note) throw new GameError(1, 'Credit request ID already used'); return { balance_cents: old.balance_cents, duplicate: true }; }
      const balance = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(account_id).balance_cents + amount_cents;
      if (!Number.isSafeInteger(balance) || balance > 100000000000) throw new GameError(1, 'Balance limit reached');
      db.prepare('UPDATE local_wallets SET balance_cents=? WHERE account_id=?').run(balance, account_id);
      db.prepare('INSERT INTO wallet_ledger VALUES (?,?,?,?,?,?,?)').run(id, account_id, 'credit', amount_cents, balance, new Date().toISOString(), JSON.stringify({ note }));
      log({ event: 'wallet_credited', accountId: account_id, amountCents: amount_cents });
      return { balance_cents: balance, duplicate: false };
    }, ownerRoleId);
  }
  function assertPurchaseAvailable({ account_id = accountIdFor(), product_id, extra_buy = false, activity_id, activity_version, period = 0, day_index = 0 } = {}) {
    const product = tables.Recharge.get(product_id);
    if (!product || !supported(product)) throw new GameError(5, 'This product needs an additional gameplay handler');
    if (Number(product.type) === 107 && groupBuyActivity) {
      const groupBuyGift = groupBuyActivity.assertGiftAvailable(product_id, activity_id);
      const purchaseCount = groupBuyActivity.giftPurchaseCount(product_id, null, groupBuyGift.activityId);
      if (product.can_buy_times > 0 && purchaseCount >= product.can_buy_times) {
        throw new GameError(307, 'Product purchase limit reached');
      }
      return;
    }
    if (lineFirstRecharge?.supportsProduct(product)) {
      lineFirstRecharge.assertPurchaseAvailable({
        modules: new Map(store.state().modules.value),
        product,
        at: now()
      });
      return;
    }
    const heroGift = heroGiftForPurchase(product_id, activity_version);
    if (heroGift) {
      if (![16, 46, 106].includes(Number(product.type)) || Number(product.pay_type) !== 0) throw new GameError(5, 'Hundred schools gift has an unsupported price');
      if (!heroDrawActivity.giftPurchaseAllowed(product_id, 1)) throw new GameError(307, 'Product purchase limit reached');
      return;
    }
    if (product.type === 76) {
      const petGift = petActivity.assertGiftAvailable(product_id, activity_id);
      const purchaseCount = petActivity.giftPurchaseCount(product_id, null, petGift.activityId);
      if (product.can_buy_times > 0 && purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
      return;
    }
    if (premiumActivity?.isConfiguredGift(product_id)) {
      if (Number(product.pay_type) !== 0) throw new GameError(5, 'Premium activity cash gift has an unsupported price');
      const premiumGift = premiumActivity.assertGiftAvailable(product_id, activity_id);
      const purchaseCount = premiumActivity.giftPurchaseCount(product_id, null, premiumGift.activityId);
      if (product.can_buy_times > 0 && purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
      return;
    }
    if (diamondFunds.supports(product)) {
      diamondFunds.assertPurchaseAvailable({ modules: new Map(store.state().modules.value), product, at: now() });
      return;
    }
    if (permanentCards.supports(product)) {
      permanentCards.assertPurchaseAvailable({ modules: new Map(store.state().modules.value), product });
      return;
    }
    if (monthlyCards.supports(product)) {
      monthlyCards.assertPurchaseAvailable({ modules: new Map(store.state().modules.value), product, at: now() });
      return;
    }
    if (standardPermits.supports(product)) {
      standardPermits.assertPurchaseAvailable({ modules: new Map(store.state().modules.value), product });
      return;
    }
    if (!(product.can_buy_times > 0)) return;
    if (product.type === DAILY_DISCOUNT_RECHARGE) {
      const modules = new Map(store.state().modules.value);
      const plan = planDailyDiscountPurchase(modules, product, now(), extra_buy === true);
      if (!plan) throw new GameError(307, 'Product purchase limit reached');
      resolveWeekHuntPurchase(
        { modules, product, extraBuy: plan.additional, period, dayIndex: day_index, at: now() },
        { allowClosedPeriod: Boolean(heroGiftShadowForDailyPurchase(product_id)) }
      );
      return;
    }
    const purchaseCount = store.inspect(db => scopedPurchaseQuantity(
      db,
      account_id,
      product,
      now(),
      Number.isSafeInteger(period) && period >= 0 ? period : 0,
      day_index
    ));
    if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
  }
  function buy(options = {}) {
    const account_id = options.account_id ?? accountIdFor();
    const ownerRoleId = roleIdForAccount(account_id);
    if (store.currentRoleId() !== ownerRoleId) {
      return store.runWithRole(ownerRoleId, () => buy({ ...options, account_id }));
    }
    const { product_id, request_id, voucher_count = 0, voucher_amount_cents, voucher_item_tid, extra_buy = false, activity_id, activity_version, period = 0, day_index = 0 } = options;
    if (typeof account_id !== 'string' || !key(request_id) || !Number.isSafeInteger(product_id)) throw new GameError(1, 'Invalid local purchase');
    const product = tables.Recharge.get(product_id);
    if (!product || !supported(product)) throw new GameError(5, 'This product needs an additional gameplay handler');
    const heroGift = heroGiftForPurchase(product_id, activity_version);
    const heroShadowGift = heroGift ? null : heroGiftShadowForDailyPurchase(product_id);
    const petGift = !heroGift && product.type === 76 ? petActivity.assertGiftAvailable(product_id, activity_id) : null;
    const premiumGift = !heroGift && !petGift && premiumActivity?.isConfiguredGift(product_id)
      ? premiumActivity.assertGiftAvailable(product_id, activity_id)
      : null;
    const groupBuyGift = !heroGift && !petGift && !premiumGift && Number(product.type) === 107 && groupBuyActivity
      ? groupBuyActivity.assertGiftAvailable(product_id, activity_id)
      : null;
    const regularGiftGroupId = regularGifts.groupIdForProduct(product_id);
    const requestedActivityId = positiveInteger(activity_id);
    if (premiumGift && Number(product.pay_type) !== 0) {
      throw new GameError(5, 'Premium activity cash gift has an unsupported price');
    }
    if ((voucher_item_tid !== undefined || voucher_amount_cents !== undefined || voucher_count !== 0) && !voucher) throw new GameError(5, 'Voucher payment is not configured');
    const purchasedAt = now();
    if (!Number.isSafeInteger(purchasedAt) || purchasedAt <= 0) throw new GameError(1, 'Invalid purchase time');
    let requestedQuantity = 0;
    if (voucher_item_tid !== undefined) {
      const sku = voucher.sku();
      if (Number(voucher_item_tid) !== sku.item_tid) throw new GameError(5, 'Unsupported voucher item');
      requestedQuantity = voucher.autoCount(product.price);
    } else if (voucher_amount_cents !== undefined) {
      if (!Number.isSafeInteger(voucher_amount_cents) || voucher_amount_cents < 0) throw new GameError(1, 'Invalid voucher amount');
      const sku = voucher.sku();
      if (voucher_amount_cents % sku.face_value_cents !== 0) throw new GameError(1, 'Voucher amount does not match its face value');
      requestedQuantity = voucher_amount_cents / sku.face_value_cents;
    } else {
      if (!Number.isSafeInteger(voucher_count) || voucher_count < 0) throw new GameError(1, 'Invalid voucher quantity');
      requestedQuantity = voucher_count;
    }
    const quote = requestedQuantity ? voucher.quote(product.price, requestedQuantity) : { quantity: 0, amount_cents: 0, balance_cents: product.price };
    const result = store.transaction((model, db) => {
      const old = db.prepare('SELECT * FROM recharge_orders WHERE account_id=? AND request_id=?').get(account_id, request_id);
      if (old) {
        const oldPayload = parseStoredPayload(old.payload_json);
        if (old.product_id !== product_id || (oldPayload.voucher_quantity ?? 0) !== quote.quantity) throw new GameError(1, 'Purchase request ID already used');
        return { ...oldPayload, duplicate: true };
      }
      const limitModules = new Map(model.state.modules.value);
      let dailyPlan = null;
      const diamondFundPurchase = diamondFunds.supports(product)
        ? diamondFunds.purchase({ model, product, at: purchasedAt })
        : null;
      const permanentCardPurchase = permanentCards.supports(product)
        ? permanentCards.purchase({ model, product })
        : null;
      if (monthlyCards.supports(product)) {
        monthlyCards.assertPurchaseAvailable({ modules: limitModules, product, at: purchasedAt });
      } else if (standardPermits.supports(product)) {
        standardPermits.assertPurchaseAvailable({ modules: limitModules, product });
      }
      if (product.can_buy_times > 0) {
        if (lineFirstRecharge?.supportsProduct(product)) {
          lineFirstRecharge.assertPurchaseAvailable({ modules: limitModules, product, at: purchasedAt });
        } else if (heroGift) {
          if (!heroDrawActivity.giftPurchaseAllowed(product_id, 1, db, purchasedAt)) throw new GameError(307, 'Product purchase limit reached');
        } else if (product.type === 76) {
          const purchaseCount = petActivity.giftPurchaseCount(product_id, db, petGift.activityId);
          if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (premiumGift) {
          const purchaseCount = premiumActivity.giftPurchaseCount(product_id, db, premiumGift.activityId);
          if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (groupBuyGift) {
          const purchaseCount = groupBuyActivity.giftPurchaseCount(product_id, db, groupBuyGift.activityId);
          if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (product.type === DAILY_DISCOUNT_RECHARGE) {
          dailyPlan = planDailyDiscountPurchase(limitModules, product, purchasedAt, extra_buy === true);
          if (!dailyPlan) throw new GameError(307, 'Product purchase limit reached');
        } else {
          const purchaseCount = scopedPurchaseQuantity(
            db,
            account_id,
            product,
            purchasedAt,
            Number.isSafeInteger(period) && period >= 0 ? period : 0,
            day_index
          );
          if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        }
      }
      // Check the purchase allowance before the wallet. A sold-out gift must
      // keep returning 307 even when the previous purchase left no balance;
      // otherwise QuickSDK shows the unrelated insufficient-balance message.
      const balance = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(account_id).balance_cents;
      if (balance < quote.balance_cents) throw new GameError(301, 'Account balance is insufficient');
      const weekPurchase = dailyPlan
        ? resolveWeekHuntPurchase(
          { modules: limitModules, product, extraBuy: dailyPlan.additional, period, dayIndex: day_index, at: purchasedAt },
          { allowClosedPeriod: Boolean(heroShadowGift), logSkipped: true }
        )
        : null;
      const day = dailyDay(purchasedAt);
      const purchaseDay = weekPurchase?.day ?? (Number.isSafeInteger(day_index) && day_index > 0 ? day_index : day);
      const order = 'local-' + randomUUID();
      const createdAt = new Date(purchasedAt * 1000).toISOString();
      db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)').run(order,account_id,request_id,product_id,product.price,'{}',createdAt);
      const changes = [];
      if (quote.quantity > 0) changes.push(voucher.consume({ model, db, orderId: order, roleId: model.state.roleId, quantity: quote.quantity, amountCents: quote.amount_cents }));
      const dailyAwards = dailyPlan
        ? dailyPurchaseRules.rewards(product, dailyPlan.oneKeyFreeGiftConsumed)
        : [];
      changes.push(...grantPurchaseRewards(model, db, [
        ...product.reward_tid.map((tid,i) => [tid, product.reward_count[i]]),
        ...dailyAwards
      ], purchasedAt).changes);
      const monthlyCardPurchase = monthlyCards.supports(product)
        ? monthlyCards.purchase({ model, product, at: purchasedAt })
        : null;
      const permit = product.type === 130
        ? permits.purchase({ model, product })
        : (standardPermits.supports(product) ? standardPermits.purchase({ model, product }) : null);
      const res = { changes, is_overflow: false };
      // Resource and permit handlers may replace the module map directly.
      // Re-read it before layering recharge, daily-discount and wish-treasure
      // login state on top.
      let modules = new Map(model.state.modules.value);
      const login = codec.unpack('res_recharge_login',rawBinary(modules.get(19)));
      if (Number(product.pay_type) === 0) recordRecharge(login, product_id, product.price, purchasedAt);
      const giftRecord = product.can_buy_times > 0 ? codec.pack('pb_buy_gift_record', { recharge_tid: product_id, buy_time: purchasedAt }) : null;
      if (giftRecord) addBuyGiftRecord(login, product_id, purchasedAt);
      const extraRetList = [...(diamondFundPurchase?.extraRetList ?? []), ...(monthlyCardPurchase?.extraRetList ?? []), ...(permit?.extraRetList ?? [])];
      if (giftRecord) extraRetList.push({ flag: GIFT_BUY_RECORD_HANDLE, data: giftRecord });
      const dailyDiscount = dailyPlan ? setDailyDiscountInfo(modules, dailyPlan.info) : null;
      if (dailyDiscount) extraRetList.push({ flag: DAILY_DISCOUNT_HANDLE, data: dailyDiscount });
      weekHunt?.recordPurchase({ modules, context: weekPurchase });
      const wishPurchase = dailyPlan && wishTreasure
        ? wishTreasure.recordPurchase({ modules, productId: product_id, at: purchasedAt * 1000 })
        : null;
      // WishTree is a server-day ledger. RechargeMgr may retain a stale client
      // day or a WeekHunt makeup day in extra_params; neither may move rebate
      // purchases outside the current 14-day cycle.
      recordWishTreePurchase({ modules, productId: product_id, day, at: purchasedAt * 1000 });
      if (petGift) {
        petActivity.recordGiftPurchase({
          model, db, activityId: petGift.activityId, productId: product_id, buyNum: 1,
          priceItemTid: 0, priceAmount: product.price, requestId: request_id,
          payload: { product_id, activity_id: petGift.activityId, wallet_purchase: true }
        });
        extraRetList.push(petActivity.rechargeExtra(petGift.activityId, db));
      }
      if (premiumGift) {
        premiumActivity.recordGiftPurchase({
          model, db, activityId: premiumGift.activityId, productId: product_id, buyNum: 1,
          priceItemTid: 0, priceAmount: product.price, requestId: request_id,
          payload: { product_id, activity_id: premiumGift.activityId, wallet_purchase: true }
        });
        extraRetList.push(premiumActivity.rechargeExtra(premiumGift.activityId, db));
      }
      if (groupBuyGift) extraRetList.push(groupBuyActivity.purchaseExtra(product_id));
      let heroShadowRecorded = false;
      if (heroShadowGift && dailyPlan && heroDrawActivity.giftPurchaseAllowed(product_id, 1, db, purchasedAt)) {
        heroDrawActivity.recordGiftPurchase({
          model, db, activityId: heroShadowGift.activityId, productId: product_id, buyNum: 1,
          priceItemTid: 0, priceAmount: product.price, requestId: request_id,
          payload: {
            product_id, activity_id: heroShadowGift.activityId, wallet_purchase: true,
            hero_activity_id: heroShadowGift.activityId, source: 'daily_discount'
          }
        });
        extraRetList.push(heroDrawActivity.rechargeExtra(heroShadowGift.activityId, db));
        heroShadowRecorded = true;
      }
      if (heroGift) {
        heroDrawActivity.recordGiftPurchase({
          model, db, activityId: heroGift.activityId, productId: product_id, buyNum: 1,
          priceItemTid: 0, priceAmount: product.price, requestId: request_id,
          payload: { product_id, activity_id: heroGift.activityId, wallet_purchase: true, hero_activity_id: heroGift.activityId }
        });
        extraRetList.push(heroDrawActivity.rechargeExtra(heroGift.activityId, db));
      }
      rechargeBonus?.recordRecharge({ model, modules, at: purchasedAt });
      if (lineFirstRecharge?.supportsProduct(product)) {
        const purchase = lineFirstRecharge.purchase({ modules, product, at: purchasedAt });
        extraRetList.push(...purchase.extraRetList);
      }
      if (rechargeExtraAward) {
        model.state.modules.value = [...modules];
        const extra = rechargeExtraAward.recordRecharge({ model, login, product, at: purchasedAt });
        modules = new Map(model.state.modules.value);
        res.changes.push(...extra.changes);
        extraRetList.push(...extra.extraRetList);
      }
      if (regularGifts.supportsProduct(product_id)) {
        modules = new Map(model.state.modules.value);
        const regularGiftInfo = regularGifts.purchaseExtra({ modules, db, at: purchasedAt });
        extraRetList.push({ flag: REGULAR_GIFT_HANDLE, data: regularGiftInfo });
        model.state.modules.value = [...modules];
      }
      // Some otherwise ordinary products have no dedicated login-module
      // handoff. The native RechargeMgr still requires a non-empty list before
      // it fires EVT_RECHARGE, so persist and return the real purchase record.
      if (extraRetList.length === 0) {
        const dispatchRecord = codec.pack('pb_buy_gift_record', { recharge_tid: product_id, buy_time: purchasedAt });
        addBuyGiftRecord(login, product_id, purchasedAt);
        extraRetList.push({ flag: GIFT_BUY_RECORD_HANDLE, data: dispatchRecord });
      }
      const purchasePeriod = weekPurchase?.period ?? (Number.isSafeInteger(period) ? period : 0);
      // get_token means "the recharge failed and was compensated with tokens".
      // A successful purchase that *uses* tokens is identified by is_use_token;
      // setting get_token here makes RechargeSuccessFire skip DispatchRechargeEv
      // and leaves live activity/permit screens stale until the next login.
      // Activity gift managers pass their act id through RechargeMgr and read it
      // back from extra_params on EVT_RECHARGE. PremiumActMgr and PetActGiftMgr
      // are two examples; group-buy and several other seasonal managers follow
      // the same contract. Echo that numeric id so their in-memory stock updates
      // without a relogin. Daily-discount controls keep their tuple context.
      const activityExtraId = petGift?.activityId
        ?? premiumGift?.activityId
        ?? groupBuyGift?.activityId
        ?? (product.type !== DAILY_DISCOUNT_RECHARGE ? requestedActivityId : 0);
      // RegularGiftMgr reads the purchased group ID from extra_params[1]. The
      // client derives the mall tab from floor(groupId / 1000000), then emits
      // REGULAR_GIFT_REFRESH_EVT so the complete module-26 snapshot is applied
      // without a relogin. Activity IDs and the daily-discount tuple do not
      // satisfy this callback contract for mall gifts.
      const extraParams = regularGiftGroupId > 0
        ? etfList([regularGiftGroupId])
        : activityExtraId > 0
          ? etfList([activityExtraId])
          : etfList([[dailyPlan?.additional === true, purchasePeriod, purchaseDay]]);
      const value = { recharge_id: product_id, time: purchasedAt, order, get_token: false, extra_params: extraParams, package_is_full: false, res, extra_ret_list: extraRetList, is_use_token: quote.quantity > 0, display_id: 0, use_item_tid: quote.quantity > 0 ? voucher.itemTid : 0 };
      const data = codec.pack('res_recharge_success',value);
      login.tmp_recharge_record ??= { tmp_record_list: [] };
      login.tmp_recharge_record.tmp_record_list.push({ recharge_id: product_id, recharge_time: purchasedAt, order_no: order });
      modules.set(19,serializedBinary(codec.pack('res_recharge_login',login))); model.state.modules.value = [...modules];
      const balanceAfter = balance - quote.balance_cents;
      db.prepare('UPDATE local_wallets SET balance_cents=? WHERE account_id=?').run(balanceAfter,account_id);
      const wishNotification = wishPurchase?.item_list?.length
        ? codec.pack('pb_wish_treasure_push', { item_list: wishPurchase.item_list }).toString('base64')
        : null;
      const result = {
        order_id: order, product_id, price_cents: product.price, voucher_quantity: quote.quantity,
        voucher_amount_cents: quote.amount_cents, balance_paid_cents: quote.balance_cents,
        balance_cents: balanceAfter, notification: data.toString('base64'),
        wish_treasure_notification: wishNotification,
        daily_discount_additional: Boolean(dailyPlan?.additional), requested_extra_buy: extra_buy === true,
        daily_discount_purchase: Boolean(dailyPlan),
        period: purchasePeriod,
        day_index: purchaseDay,
        ...(weekPurchase ? { week_hunt_period: purchasePeriod, week_hunt_day: purchaseDay } : {}),
        ...(petGift ? { pet_activity_id: petGift.activityId } : {}),
        ...(heroGift || heroShadowRecorded ? { hero_activity_id: (heroGift ?? heroShadowGift).activityId } : {}),
        ...(premiumGift ? { premium_activity_id: premiumGift.activityId } : {}),
        ...(groupBuyGift ? { group_buy_activity_id: groupBuyGift.activityId } : {}),
        ...(regularGiftGroupId > 0 ? { regular_gift_group_id: regularGiftGroupId } : {})
      };
      db.prepare('UPDATE recharge_orders SET payload_json=? WHERE order_id=?').run(JSON.stringify(result),order);
      db.prepare('INSERT INTO wallet_ledger VALUES (?,?,?,?,?,?,?)').run(order,account_id,'purchase',-quote.balance_cents,balanceAfter,createdAt,JSON.stringify({ product_id, order_id: order, voucher_quantity: quote.quantity, voucher_amount_cents: quote.amount_cents, daily_discount_additional: Boolean(dailyPlan?.additional), requested_extra_buy: extra_buy === true, period: purchasePeriod, day_index: purchaseDay }));
      return { ...result, duplicate: false };
    });
    if (!result.duplicate) {
      // The order is committed; a disconnected client must not turn it into a failed purchase.
      if (result.wish_treasure_notification) {
        try { publish(9132, Buffer.from(result.wish_treasure_notification, 'base64')); }
        catch { log({ event: 'wish_treasure_notification_pending', orderId: result.order_id }); }
      }
      try { publish(1900,Buffer.from(result.notification,'base64')); }
      catch { log({event:'wallet_notification_pending',orderId:result.order_id}); }
      log({event:'wallet_purchase_committed',productId:product_id,orderId:result.order_id});
    }
    return result;
  }
  // Command 16005 covers free, inventory-priced and local-balance gifts. The
  // same transaction owns order creation, limit checks, payment, rewards and
  // activity bookkeeping so an injected failure cannot leave a paid order.
  function purchaseGift(options = {}) {
    const account_id = options.account_id ?? accountIdFor();
    const ownerRoleId = roleIdForAccount(account_id);
    if (store.currentRoleId() !== ownerRoleId) {
      return store.runWithRole(ownerRoleId, () => purchaseGift({ ...options, account_id }));
    }
    const { product_id, request_id, buy_num = 1, extra_buy = false, activity_id, period = 0, day_index = 0 } = options;
    if (typeof account_id !== 'string' || !key(request_id) || !Number.isSafeInteger(product_id)
      || !Number.isSafeInteger(buy_num) || buy_num < 1 || buy_num > 100) throw new GameError(1, 'Invalid local gift purchase');
    const product = tables.Recharge.get(product_id);
    if (!product) throw new GameError(5, 'Gift is not configured');
    const regularGiftGroupId = regularGifts.groupIdForProduct(product_id);
    const purchasedAt = now();
    if (!Number.isSafeInteger(purchasedAt) || purchasedAt <= 0) throw new GameError(1, 'Invalid purchase time');
    const heroGift = heroDrawActivity?.giftConfig(product_id, purchasedAt) ?? null;
    const petGift = !heroGift && product.type === 76 ? petActivity.assertGiftAvailable(product_id, activity_id) : null;
    const premiumGift = !heroGift && !petGift && premiumActivity?.isConfiguredGift(product_id)
      ? premiumActivity.assertGiftAvailable(product_id, activity_id)
      : null;
    const groupBuyGift = !heroGift && !petGift && !premiumGift && Number(product.type) === 107 && groupBuyActivity
      ? groupBuyActivity.assertGiftAvailable(product_id, activity_id)
      : null;
    const monthlyCard = !heroGift && !petGift && !premiumGift && !groupBuyGift && monthlyCards.supports(product);
    const permanentCard = !heroGift && !petGift && !premiumGift && !groupBuyGift && permanentCards.supports(product);
    const diamondFund = !heroGift && !petGift && !premiumGift && !groupBuyGift && diamondFunds.supports(product);
    const activityPermit = !heroGift && !petGift && !premiumGift && !groupBuyGift && Number(product.type) === 130;
    const standardPermit = !heroGift && !petGift && !premiumGift && !groupBuyGift && standardPermits.supports(product);
    const free = Number(product.pay_type) === 2;
    const balancePrice = Number(product.price) * buy_num;
    const itemPrice = Number(product.price) * buy_num;

    if (heroGift && ![16, 46, 106].includes(Number(product.type))) {
      throw new GameError(5, 'Hundred schools gift type is unsupported');
    }
    if ((heroGift || petGift || premiumGift || groupBuyGift) && product.pay_type === 0) {
      throw new GameError(5, 'This activity gift must be purchased through the recharge flow');
    }
    if (Number(product.pay_type) === 0) {
      if (buy_num !== 1) throw new GameError(5, 'Cash gifts must be purchased one at a time');
      const purchase = buy({
        account_id,
        product_id,
        request_id,
        extra_buy,
        activity_id,
        period,
        day_index
      });
      const recharge = codec.unpack('res_recharge_success', Buffer.from(purchase.notification, 'base64'));
      return {
        order_id: purchase.order_id,
        product_id,
        price_cents: purchase.price_cents,
        balance_cents: purchase.balance_cents,
        recharge_id: product_id,
        time: recharge.time,
        buy_num: 1,
        res: recharge.res,
        extra_ret_list: recharge.extra_ret_list ?? []
      };
    }
    if (!heroGift && !petGift && !premiumGift && !groupBuyGift) {
      if (Number(product.sync_handle ?? 0) !== 0) {
        throw new GameError(5, 'This gift needs an additional gameplay handler');
      }
      if (!rewardsAreHandled(product) && !hasCompleteRewards(product)) {
        throw new GameError(5, 'Gift has no configured rewards');
      }
      if (!rewardsAreHandled(product)) throw new GameError(5, 'Gift reward needs an explicit gameplay handler');
    } else if (!hasCompleteRewards(product)) {
      throw new GameError(5, 'Gift has no configured rewards');
    }
    if (free) {
      if (Number(product.price) !== 0) throw new GameError(5, 'Free gift has an invalid price');
    } else if (Number(product.pay_type) === 1) {
      if (!Number.isSafeInteger(itemPrice) || itemPrice <= 0
        || !Number.isSafeInteger(Number(product.cost_item)) || Number(product.cost_item) <= 0) {
        throw new GameError(5, 'Gift resource price is invalid');
      }
    } else if (Number(product.pay_type) === 0) {
      if (!Number.isSafeInteger(balancePrice) || balancePrice <= 0) throw new GameError(5, 'Gift balance price is invalid');
    } else {
      throw new GameError(5, 'Gift payment type is unsupported');
    }

    const normalizedPeriod = Number.isSafeInteger(period) && period >= 0 ? period : 0;
    const normalizedDay = Number.isSafeInteger(day_index) && day_index >= 0 ? day_index : 0;
    const result = store.transaction((model, db) => {
      const old = db.prepare('SELECT * FROM recharge_orders WHERE account_id=? AND request_id=?').get(account_id, request_id);
      if (old) {
        const oldPayload = parseStoredPayload(old.payload_json);
        if (old.product_id !== product_id || Number(oldPayload.buy_num ?? 1) !== buy_num) {
          throw new GameError(1, 'Purchase request ID already used');
        }
        return { ...oldPayload, duplicate: true };
      }
      const walletRow = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(account_id);
      if (!walletRow) throw new GameError(5, 'Local wallet is not configured');
      const balance = walletRow.balance_cents;
      const chargeCents = Number(product.pay_type) === 0 ? balancePrice : 0;

      let dailyPlan = null;
      if (monthlyCard) {
        monthlyCards.assertPurchaseAvailable({
          modules: new Map(model.state.modules.value),
          product,
          at: purchasedAt
        });
      }
      if (permanentCard) {
        permanentCards.assertPurchaseAvailable({ modules: new Map(model.state.modules.value), product });
      }
      if (diamondFund) {
        diamondFunds.assertPurchaseAvailable({
          modules: new Map(model.state.modules.value),
          product,
          at: purchasedAt
        });
      }
      if (activityPermit) {
        permits.assertPurchaseAvailable({ modules: new Map(model.state.modules.value), product });
      }
      if (standardPermit) {
        standardPermits.assertPurchaseAvailable({ modules: new Map(model.state.modules.value), product });
      }
      if (product.can_buy_times > 0) {
        if (heroGift) {
          if (!heroDrawActivity.giftPurchaseAllowed(product_id, buy_num, db, purchasedAt)) {
            throw new GameError(307, 'Product purchase limit reached');
          }
        } else if (petGift) {
          const purchaseCount = petActivity.giftPurchaseCount(product_id, db, petGift.activityId);
          if (purchaseCount + buy_num > product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (premiumGift) {
          const purchaseCount = premiumActivity.giftPurchaseCount(product_id, db, premiumGift.activityId);
          if (purchaseCount + buy_num > product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (groupBuyGift) {
          const purchaseCount = groupBuyActivity.giftPurchaseCount(product_id, db, groupBuyGift.activityId);
          if (purchaseCount + buy_num > product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        } else if (product.type === DAILY_DISCOUNT_RECHARGE && dailyRechargeRowByProductId.has(product_id)) {
          if (buy_num !== 1) throw new GameError(307, 'Product purchase limit reached');
          dailyPlan = planDailyDiscountPurchase(new Map(model.state.modules.value), product, purchasedAt, extra_buy === true);
          if (!dailyPlan) throw new GameError(307, 'Product purchase limit reached');
        } else {
          const purchaseCount = scopedPurchaseQuantity(db, account_id, product, purchasedAt, normalizedPeriod);
          if (purchaseCount + buy_num > product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        }
      }
      if (balance < chargeCents) throw new GameError(301, 'Account balance is insufficient');

      const order = 'local-' + randomUUID();
      const createdAt = new Date(purchasedAt * 1000).toISOString();
      db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)')
        .run(order, account_id, request_id, product_id, chargeCents, JSON.stringify({
          product_id, buy_num, period: normalizedPeriod, day_index: normalizedDay
        }), createdAt);
      const changes = [];
      if (Number(product.pay_type) === 1) {
        changes.push(...consumeResources(model, [[Number(product.cost_item), itemPrice]]).changes);
      }
      changes.push(...grantPurchaseRewards(
        model,
        db,
        product.reward_tid.map((tid, i) => [tid, Number(product.reward_count[i]) * buy_num]),
        purchasedAt
      ).changes);
      const monthlyCardPurchase = monthlyCard
        ? monthlyCards.purchase({ model, product, at: purchasedAt })
        : null;
      const permanentCardPurchase = permanentCard
        ? permanentCards.purchase({ model, product })
        : null;
      const diamondFundPurchase = diamondFund
        ? diamondFunds.purchase({ model, product, at: purchasedAt })
        : null;
      const permit = activityPermit
        ? permits.purchase({ model, product })
        : (standardPermit ? standardPermits.purchase({ model, product }) : null);
      const res = { changes, is_overflow: false };

      const modules = new Map(model.state.modules.value);
      const login = modules.has(19) ? codec.unpack('res_recharge_login', rawBinary(modules.get(19))) : {};
      const giftRecord = codec.pack('pb_buy_gift_record', { recharge_tid: product_id, buy_time: purchasedAt });
      addBuyGiftRecord(login, product_id, purchasedAt);
      modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
      const dailyDiscount = dailyPlan ? setDailyDiscountInfo(modules, dailyPlan.info) : null;
      recordWishTreePurchase({
        modules,
        productId: product_id,
        day: wishTree?.supportsProduct?.(product_id) ? dailyDay(purchasedAt) : (normalizedDay > 0 ? normalizedDay : dailyDay(purchasedAt)),
        at: purchasedAt * 1000
      });
      model.state.modules.value = [...modules];

      // Pet gifts are refreshed by their activity-specific flag below. Adding
      // the generic recharge record ahead of it changes the client handler
      // order and leaves pet stock stale.
      const extraRetList = [
        ...(diamondFundPurchase?.extraRetList ?? []),
        ...(monthlyCardPurchase?.extraRetList ?? []),
        ...(permit?.extraRetList ?? [])
      ];
      if (!petGift && !premiumGift && !groupBuyGift) {
        extraRetList.push({ flag: GIFT_BUY_RECORD_HANDLE, data: giftRecord });
      }
      if (dailyDiscount) extraRetList.push({ flag: DAILY_DISCOUNT_HANDLE, data: dailyDiscount });
      if (petGift) {
        petActivity.recordGiftPurchase({
          model, db, activityId: petGift.activityId, productId: product_id, buyNum: buy_num,
          priceItemTid: product.pay_type === 1 ? Number(product.cost_item) : 0,
          priceAmount: product.pay_type === 1 ? itemPrice : 0,
          requestId: request_id,
          payload: { product_id, activity_id: petGift.activityId, buy_num, extra_buy: extra_buy === true, period: normalizedPeriod, day_index: normalizedDay }
        });
        extraRetList.push(petActivity.rechargeExtra(petGift.activityId, db));
      }
      if (premiumGift) {
        premiumActivity.recordGiftPurchase({
          model, db, activityId: premiumGift.activityId, productId: product_id, buyNum: buy_num,
          priceItemTid: product.pay_type === 1 ? Number(product.cost_item) : 0,
          priceAmount: product.pay_type === 1 ? itemPrice : 0,
          requestId: request_id,
          payload: {
            product_id, activity_id: premiumGift.activityId, buy_num,
            extra_buy: extra_buy === true, period: normalizedPeriod, day_index: normalizedDay
          }
        });
        extraRetList.push(premiumActivity.rechargeExtra(premiumGift.activityId, db));
      }
      if (groupBuyGift) extraRetList.push(groupBuyActivity.purchaseExtra(product_id));
      if (heroGift) {
        heroDrawActivity.recordGiftPurchase({
          model, db, activityId: heroGift.activityId, productId: product_id, buyNum: buy_num,
          priceItemTid: product.pay_type === 1 ? Number(product.cost_item) : 0,
          priceAmount: product.pay_type === 1 ? itemPrice : 0,
          requestId: request_id,
          payload: { product_id, activity_id: heroGift.activityId, buy_num, hero_activity_id: heroGift.activityId, extra_buy: extra_buy === true, period: normalizedPeriod, day_index: normalizedDay }
        });
        extraRetList.push(heroDrawActivity.rechargeExtra(heroGift.activityId, db));
      }
      if (regularGifts.supportsProduct(product_id)) {
        const latestModules = new Map(model.state.modules.value);
        const regularGiftInfo = regularGifts.purchaseExtra({ modules: latestModules, db, at: purchasedAt });
        extraRetList.push({ flag: REGULAR_GIFT_HANDLE, data: regularGiftInfo });
        model.state.modules.value = [...latestModules];
      }

      const balanceAfter = balance - chargeCents;
      if (chargeCents > 0) db.prepare('UPDATE local_wallets SET balance_cents=? WHERE account_id=?').run(balanceAfter, account_id);
      const value = {
        order_id: order, product_id, price_cents: chargeCents, balance_cents: balanceAfter,
        time: purchasedAt, buy_num, res, extra_ret_list: extraRetList,
        extra_buy: extra_buy === true, period: normalizedPeriod, day_index: normalizedDay,
        ...(dailyPlan ? {
          daily_discount_purchase: true,
          daily_discount_additional: Boolean(dailyPlan.additional)
        } : {}),
        ...(petGift ? { pet_activity_id: petGift.activityId } : {}),
        ...(heroGift ? { hero_activity_id: heroGift.activityId } : {}),
        ...(premiumGift ? { premium_activity_id: premiumGift.activityId } : {}),
        ...(groupBuyGift ? { group_buy_activity_id: groupBuyGift.activityId } : {}),
        ...(regularGiftGroupId > 0 ? { regular_gift_group_id: regularGiftGroupId } : {})
      };
      db.prepare('UPDATE recharge_orders SET payload_json=? WHERE order_id=?').run(JSON.stringify(value), order);
      if (chargeCents > 0) {
        db.prepare('INSERT INTO wallet_ledger VALUES (?,?,?,?,?,?,?)').run(
          order, account_id, 'gift_purchase', -chargeCents, balanceAfter, createdAt,
          JSON.stringify({ product_id, order_id: order, buy_num, extra_buy: extra_buy === true, period: normalizedPeriod, day_index: normalizedDay })
        );
      }
      return { ...value, duplicate: false };
    });
    if (!result.duplicate) {
      log({
        event: 'wallet_gift_purchase_committed', productId: product_id,
        orderId: result.order_id, free, paymentType: Number(product.pay_type), buyNum: buy_num
      });
    }
    return result;
  }
  function acknowledge(order) {
    if (typeof order !== 'string' || order.length > 120) throw new GameError(1,'Invalid order acknowledgement');
    store.transaction((model,db) => {
      const row = db.prepare('SELECT order_id FROM recharge_orders WHERE account_id=? AND order_id=?').get(accountIdFor(),order);
      if (!row) throw new GameError(1,'Local order not found');
      const modules = new Map(model.state.modules.value), login = codec.unpack('res_recharge_login',rawBinary(modules.get(19)));
      if (login.tmp_recharge_record) login.tmp_recharge_record.tmp_record_list = login.tmp_recharge_record.tmp_record_list.filter(x=>x.order_no!==order);
      modules.set(19,serializedBinary(codec.pack('res_recharge_login',login))); model.state.modules.value=[...modules];
      db.prepare('UPDATE recharge_orders SET acknowledged=1 WHERE order_id=?').run(order);
    });
  }
  // /pay/recharge/order sends the QuickSDK order_id as cp_order. Look it up
  // before buying so a confirmed payment can never create a second order.
  function findOrder(order_id) {
    if (!key(order_id)) return null;
    return store.inspect(db => {
      const row = db.prepare('SELECT order_id,account_id,product_id,price_cents,created_at,acknowledged,payload_json FROM recharge_orders WHERE order_id=?').get(order_id);
      if (!row) return null;
      let payload = {};
      try { payload = JSON.parse(row.payload_json); } catch {}
      const wallet = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(row.account_id);
      return { order_id: row.order_id, account_id: row.account_id, product_id: row.product_id, price_cents: row.price_cents, created_at: row.created_at, acknowledged: Boolean(row.acknowledged), balance_cents: wallet?.balance_cents ?? payload.balance_cents ?? 0 };
    });
  }
  return {
    snapshot, credit, assertPurchaseAvailable, buy, purchaseGift, acknowledge, findOrder, ensureAccount: synchronizeAccount,
    get accountId() { return accountIdFor(); },
    isPetGift: productId => Boolean(petActivity?.isConfiguredGift?.(productId)),
    isPremiumGift: productId => Boolean(premiumActivity?.isConfiguredGift(productId))
  };
}
