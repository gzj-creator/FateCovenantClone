import { randomUUID } from 'node:crypto';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { grantResources } from './resources.mjs';
import { GameError } from './hero-progression.mjs';
import { createMonthPermitService } from './month-permit-service.mjs';
const DAILY_DISCOUNT_RECHARGE = 46;
const DAILY_DISCOUNT_HANDLE = 40;
const DAILY_DISCOUNT_MODULE = 108;
const DAILY_RESET_OFFSET_SECONDS = 10800;
// DailyDiscountTable.Recharge_ValueIndex maps the recharge row to the short tid
// that pb_daily_discount_data stores on the wire.
const DAILY_DISCOUNT_VALUE_INDEX = new Map([[40008,4],[40006,1],[46002,5],[46003,6],[40010,3],[40009,2]]);
const key = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,120}$/.test(value);
// ETF INTEGER_EXT list [price]. The client's RechargeMgr uses extra_params[1]
// to add voucher payments to the cumulative recharge amount.
function etfIntList(values) {
  const parts = [Buffer.from([0x83, 0x6c]), Buffer.alloc(4)];
  parts[1].writeUInt32BE(values.length, 0);
  for (const value of values) {
    if (Number.isInteger(value) && value >= 0 && value <= 255) parts.push(Buffer.from([0x61, value]));
    else {
      const bytes = Buffer.alloc(5);
      bytes[0] = 0x62;
      bytes.writeInt32BE(value, 1);
      parts.push(bytes);
    }
  }
  parts.push(Buffer.from([0x6a]));
  return Buffer.concat(parts);
}
export function createWalletService({ store, codec, tables, voucher, monthPermit, accountId = 'local-1', phone = '19900000000', publish = () => {}, logger = () => {}, now = () => Math.floor(Date.now() / 1000) }) {
  const log = event => { try { logger(event); } catch {} };
  const permits = monthPermit ?? createMonthPermitService({ codec, tables });
  const GIFT_BUY_RECORD_HANDLE = 73;
  const dailyDay = seconds => Math.floor((seconds + DAILY_RESET_OFFSET_SECONDS) / 86400);
  const nextDailyRefresh = seconds => (dailyDay(seconds) + 1) * 86400 - DAILY_RESET_OFFSET_SECONDS;
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
  const planDailyDiscountPurchase = (modules, product, seconds) => {
    const rechargeTid = DAILY_DISCOUNT_VALUE_INDEX.get(Number(product.tid));
    if (!rechargeTid) throw new GameError(5, 'Daily discount product is not mapped');
    const info = dailyDiscountInfo(modules);
    normalizeDailyDiscount(info, seconds);
    let row = info.daily_discount_list.find(value => Number(value.recharge_tid) === rechargeTid);
    if (!row) {
      row = { recharge_tid: rechargeTid, buy_times: 0, refresh_time: info.refresh_time, buy_additionally: 0 };
      info.daily_discount_list.push(row);
    }
    row.buy_times = Math.max(0, Number(row.buy_times ?? 0));
    row.buy_additionally = Math.max(0, Number(row.buy_additionally ?? 0));
    row.refresh_time ??= info.refresh_time;
    const regularRemaining = Math.max(0, Number(product.can_buy_times ?? 0) - row.buy_times);
    if (regularRemaining > 0) {
      row.buy_times += 1;
      return { info, additional: false };
    }
    if (row.buy_additionally > 0) {
      row.buy_additionally -= 1;
      return { info, additional: true };
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
  const addBuyGiftRecord = (login, rechargeTid, buyTime) => {
    const records = buyGiftRecords(login);
    records.push({ recharge_tid: rechargeTid, buy_time: buyTime });
    setBuyGiftRecords(login, records);
  };
  store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id) VALUES (?,?)').run(accountId, model.state.roleId);
    // Rebuild the client's gift purchase history from orders so purchase limits
    // remain visible after a server restart or a fresh client login.
    const rows = db.prepare('SELECT product_id,created_at,payload_json FROM recharge_orders ORDER BY rowid').all();
    const modules = new Map(model.state.modules.value);
    let changed = false;
    const loginRaw = modules.get(19);
    if (rows.length && loginRaw) {
      const login = codec.unpack('res_recharge_login', rawBinary(loginRaw));
      const records = buyGiftRecords(login);
      const seen = new Set(records.map(record => String(record.recharge_tid) + ':' + String(record.buy_time)));
      let loginChanged = false;
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
    const hasDailyOrders = rows.some(row => tables.Recharge.get(row.product_id)?.type === DAILY_DISCOUNT_RECHARGE);
    if (modules.has(DAILY_DISCOUNT_MODULE) || hasDailyOrders) {
      const info = dailyDiscountInfo(modules), today = dailyDay(currentSeconds);
      let dailyChanged = normalizeDailyDiscount(info, currentSeconds);
      const counts = new Map(), limits = new Map();
      for (const row of rows) {
        const product = tables.Recharge.get(row.product_id);
        const rechargeTid = DAILY_DISCOUNT_VALUE_INDEX.get(Number(row.product_id));
        if (product?.type !== DAILY_DISCOUNT_RECHARGE || !rechargeTid) continue;
        const parsed = Math.floor(Date.parse(row.created_at) / 1000);
        if (!Number.isSafeInteger(parsed) || dailyDay(parsed) !== today) continue;
        let payload = {};
        try { payload = JSON.parse(row.payload_json ?? '{}'); } catch {}
        // Additional buys share the daily row but do not consume its normal
        // `can_buy_times` allowance.
        if (payload.daily_discount_additional === true) continue;
        counts.set(rechargeTid, (counts.get(rechargeTid) ?? 0) + 1);
        limits.set(rechargeTid, Number(product.can_buy_times ?? 1));
      }
      for (const [rechargeTid, count] of counts) {
        let daily = info.daily_discount_list.find(row => Number(row.recharge_tid) === rechargeTid);
        if (!daily) {
          daily = { recharge_tid: rechargeTid, buy_times: 0, refresh_time: info.refresh_time, buy_additionally: 0 };
          info.daily_discount_list.push(daily);
        }
        const normalized = Math.min(limits.get(rechargeTid) ?? count, count);
        if ((daily.buy_times ?? 0) !== normalized) { daily.buy_times = normalized; dailyChanged = true; }
      }
      if (dailyChanged) { setDailyDiscountInfo(modules, info); changed = true; }
    }
    if (changed) model.state.modules.value = [...modules];
  });
  // Direct-purchase rows can mix currency with ordinary inventory items (for
  // example a month card grants diamonds plus its activation item). Only rows
  // whose rewards can be granted by resources.mjs are eligible here.
  const resourceProduct = row => [1,43,46,47,81].includes(row.type) && row.reward_tid?.length > 0 && row.reward_tid.length === row.reward_count?.length && row.reward_tid.every((tid,i) => tables.Item.has(tid) && Number.isSafeInteger(row.reward_count[i]) && row.reward_count[i] > 0);
  const supported = row => Boolean(row) && row.pay_type === 0 && row.price > 0 && Number.isSafeInteger(row.price) && (row.sync_handle ?? 0) === 0 && (row.type === 130 ? permits.supports(row) : resourceProduct(row));
  const products = [...tables.Recharge.values()].filter(supported);
  function snapshot() {
    return store.inspect(db => ({
      accounts: db.prepare('SELECT account_id,role_id,balance_cents FROM local_wallets ORDER BY account_id').all().map(row => ({ ...row, phone: row.account_id === accountId ? phone : '', nickname: store.read().role.nick_name ? Buffer.from(store.read().role.nick_name, 'base64').toString() : '' })),
      ledger: db.prepare('SELECT * FROM wallet_ledger ORDER BY rowid DESC LIMIT 100').all().map(row => ({ ...row, details: JSON.parse(row.details_json), details_json: undefined })),
      orders: db.prepare(`SELECT o.order_id,o.account_id,o.product_id,o.price_cents,o.created_at,o.acknowledged,
        coalesce(r.quantity,0) voucher_quantity, coalesce(r.amount_cents,0) voucher_amount_cents,
        o.price_cents-coalesce(r.amount_cents,0) balance_paid_cents
        FROM recharge_orders o LEFT JOIN voucher_redemptions r ON r.order_id=o.order_id ORDER BY o.rowid DESC LIMIT 100`).all(),
      totals: { credited_cents: db.prepare("SELECT coalesce(sum(delta_cents),0) n FROM wallet_ledger WHERE kind='credit'").get().n,
        order_count: db.prepare('SELECT count(*) n FROM recharge_orders').get().n,
        voucher_redeemed_cents: db.prepare('SELECT coalesce(sum(amount_cents),0) n FROM voucher_redemptions').get().n,
        voucher_order_count: db.prepare('SELECT count(*) n FROM voucher_redemptions').get().n },
      products: products.map(row => ({ id: row.tid, price_cents: row.price, rewards: row.reward_tid.map((tid,i) => ({ tid, count: row.reward_count[i] })), type: row.type }))
    }));
  }
  function credit({ account_id, amount_cents, request_id, note = '' }) {
    if (account_id !== accountId || !key(request_id) || !Number.isSafeInteger(amount_cents) || amount_cents <= 0 || amount_cents > 100000000 || typeof note !== 'string' || note.length > 200) throw new GameError(1, 'Invalid local balance credit');
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
    });
  }
  function buy({ account_id = accountId, product_id, request_id, voucher_count = 0, voucher_amount_cents, voucher_item_tid, extra_buy = false }) {
    if (account_id !== accountId || !key(request_id) || !Number.isSafeInteger(product_id)) throw new GameError(1, 'Invalid local purchase');
    const product = tables.Recharge.get(product_id);
    if (!product || !supported(product)) throw new GameError(5, 'This product needs an additional gameplay handler');
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
        const oldPayload = JSON.parse(old.payload_json);
        if (old.product_id !== product_id || (oldPayload.voucher_quantity ?? 0) !== quote.quantity) throw new GameError(1, 'Purchase request ID already used');
        return { ...oldPayload, duplicate: true };
      }
      const balance = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(account_id).balance_cents;
      if (balance < quote.balance_cents) throw new GameError(301, 'Account balance is insufficient');
      if (product.can_buy_times > 0 && (product.buy_cycle_limit ?? 0) !== 0) throw new GameError(5, 'Periodic product limits require a gameplay handler');
      const modules = new Map(model.state.modules.value);
      let dailyPlan = null;
      if (product.can_buy_times > 0) {
        if (product.type === DAILY_DISCOUNT_RECHARGE) {
          dailyPlan = planDailyDiscountPurchase(modules, product, purchasedAt);
          if (!dailyPlan) throw new GameError(307, 'Product purchase limit reached');
        } else {
          const purchaseCount = db.prepare('SELECT count(*) n FROM recharge_orders WHERE account_id=? AND product_id=?').get(account_id, product_id).n;
          if (purchaseCount >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
        }
      }
      const order = 'local-' + randomUUID();
      const createdAt = new Date(purchasedAt * 1000).toISOString();
      db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)').run(order,account_id,request_id,product_id,product.price,'{}',createdAt);
      const changes = [];
      if (quote.quantity > 0) changes.push(voucher.consume({ model, db, orderId: order, roleId: model.state.roleId, quantity: quote.quantity, amountCents: quote.amount_cents }));
      changes.push(...grantResources(model, product.reward_tid.map((tid,i) => [tid,product.reward_count[i]]), tables).changes);
      const permit = product.type === 130 ? permits.purchase({ model, product }) : null;
      const res = { changes, is_overflow: false };
      const login = codec.unpack('res_recharge_login',rawBinary(modules.get(19)));
      const total = (login.total_amount ?? 0) + product.price;
      if (total > 2147483647) throw new GameError(1, 'Recharge total limit reached');
      login.total_amount = total;
      const day = dailyDay(purchasedAt);
      login.recharge_record ??= { recent_record: [], total_day: 0 };
      let daily = login.recharge_record.recent_record.find(row => row.day_index === day);
      if (!daily) { daily = { day_index: day, recharge_ids: [], amount: 0 }; login.recharge_record.recent_record.push(daily); login.recharge_record.total_day = (login.recharge_record.total_day ?? 0) + 1; }
      daily.recharge_ids.push(product_id); daily.amount = (daily.amount ?? 0) + product.price;
      if (!login.max_record || daily.amount >= (login.max_record.amount ?? 0)) login.max_record = structuredClone(daily);
      const giftRecord = product.can_buy_times > 0 ? codec.pack('pb_buy_gift_record', { recharge_tid: product_id, buy_time: purchasedAt }) : null;
      if (giftRecord) addBuyGiftRecord(login, product_id, purchasedAt);
      const extraRetList = [...(permit?.extraRetList ?? [])];
      if (giftRecord) extraRetList.push({ flag: GIFT_BUY_RECORD_HANDLE, data: giftRecord });
      const dailyDiscount = dailyPlan ? setDailyDiscountInfo(modules, dailyPlan.info) : null;
      if (dailyDiscount) extraRetList.push({ flag: DAILY_DISCOUNT_HANDLE, data: dailyDiscount });
      const value = { recharge_id: product_id, time: purchasedAt, order, get_token: quote.quantity > 0, extra_params: quote.quantity > 0 ? etfIntList([product.price]) : Buffer.alloc(0), package_is_full: false, res, extra_ret_list: extraRetList, is_use_token: quote.quantity > 0, display_id: 0, use_item_tid: quote.quantity > 0 ? voucher.itemTid : 0 };
      const data = codec.pack('res_recharge_success',value);
      login.tmp_recharge_record ??= { tmp_record_list: [] };
      login.tmp_recharge_record.tmp_record_list.push({ recharge_id: product_id, recharge_time: purchasedAt, order_no: order });
      modules.set(19,serializedBinary(codec.pack('res_recharge_login',login))); model.state.modules.value = [...modules];
      const balanceAfter = balance - quote.balance_cents;
      db.prepare('UPDATE local_wallets SET balance_cents=? WHERE account_id=?').run(balanceAfter,account_id);
      const result = { order_id: order, product_id, price_cents: product.price, voucher_quantity: quote.quantity, voucher_amount_cents: quote.amount_cents, balance_paid_cents: quote.balance_cents, balance_cents: balanceAfter, notification: data.toString('base64'), daily_discount_additional: Boolean(dailyPlan?.additional), requested_extra_buy: extra_buy === true };
      db.prepare('UPDATE recharge_orders SET payload_json=? WHERE order_id=?').run(JSON.stringify(result),order);
      db.prepare('INSERT INTO wallet_ledger VALUES (?,?,?,?,?,?,?)').run(order,account_id,'purchase',-quote.balance_cents,balanceAfter,createdAt,JSON.stringify({ product_id, order_id: order, voucher_quantity: quote.quantity, voucher_amount_cents: quote.amount_cents, daily_discount_additional: Boolean(dailyPlan?.additional), requested_extra_buy: extra_buy === true }));
      return { ...result, duplicate: false };
    });
    if (!result.duplicate) {
      // The order is committed; a disconnected client must not turn it into a failed purchase.
      try { publish(1900,Buffer.from(result.notification,'base64')); }
      catch { log({event:'wallet_notification_pending',orderId:result.order_id}); }
      log({event:'wallet_purchase_committed',productId:product_id,orderId:result.order_id});
    }
    const { notification, ...publicResult } = result; return publicResult;
  }
  // RechargeTable type 46 is the in-game gift family. Its rewards are ordinary inventory items
  // (not only diamonds), and its limit is counted from local orders instead of a recharge SDK
  // notification. Free gifts (pay_type 2, price 0) use the same order table so their one-time
  // limit survives restarts.
  function purchaseGift({ account_id = accountId, product_id, request_id, buy_num = 1 }) {
    if (account_id !== accountId || !key(request_id) || !Number.isSafeInteger(product_id) || buy_num !== 1) throw new GameError(1, 'Invalid local gift purchase');
    const product = tables.Recharge.get(product_id);
    if (!product || product.type !== 46) throw new GameError(5, 'This gift needs an additional gameplay handler');
    const free = product.pay_type === 2;
    if (free ? product.price !== 0 : !(product.pay_type === 0 && Number.isSafeInteger(product.price) && product.price > 0)) throw new GameError(5, 'Unsupported gift price');
    if (!Array.isArray(product.reward_tid) || !product.reward_tid.length || !Array.isArray(product.reward_count) || product.reward_tid.length !== product.reward_count.length) throw new GameError(5, 'Gift has no configured rewards');
    const result = store.transaction((model, db) => {
      const old = db.prepare('SELECT * FROM recharge_orders WHERE account_id=? AND request_id=?').get(account_id, request_id);
      if (old) {
        if (old.product_id !== product_id) throw new GameError(1, 'Purchase request ID already used');
        return { ...JSON.parse(old.payload_json), duplicate: true };
      }
      const balance = db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get(account_id).balance_cents;
      if (!free && balance < product.price) throw new GameError(301, 'Account balance is insufficient');
      if (product.can_buy_times > 0 && db.prepare('SELECT count(*) n FROM recharge_orders WHERE account_id=? AND product_id=?').get(account_id, product_id).n >= product.can_buy_times) throw new GameError(307, 'Product purchase limit reached');
      const order = 'local-' + randomUUID(), now = Math.floor(Date.now() / 1000);
      db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)').run(order, account_id, request_id, product_id, product.price, '{}', new Date().toISOString());
      const res = grantResources(model, product.reward_tid.map((tid, i) => [tid, product.reward_count[i]]), tables);
      const modules = new Map(model.state.modules.value);
      const login = modules.has(19) ? codec.unpack('res_recharge_login', rawBinary(modules.get(19))) : {};
      const giftRecord = login.buy_gift_record ? codec.unpack('pb_buy_gift_record_list', Buffer.from(login.buy_gift_record, 'base64')) : { record_list: [] };
      giftRecord.record_list.push({ recharge_tid: product_id, buy_time: now });
      if (giftRecord.record_list.length > 200) giftRecord.record_list = giftRecord.record_list.slice(-200);
      login.buy_gift_record = codec.pack('pb_buy_gift_record_list', giftRecord).toString('base64');
      modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
      model.state.modules.value = [...modules];
      const balanceAfter = free ? balance : balance - product.price;
      if (!free) db.prepare('UPDATE local_wallets SET balance_cents=? WHERE account_id=?').run(balanceAfter, account_id);
      const value = { order_id: order, product_id, price_cents: product.price, balance_cents: balanceAfter, time: now, res };
      db.prepare('UPDATE recharge_orders SET payload_json=? WHERE order_id=?').run(JSON.stringify(value), order);
      db.prepare('INSERT INTO wallet_ledger VALUES (?,?,?,?,?,?,?)').run(order, account_id, 'gift_purchase', -product.price, balanceAfter, new Date().toISOString(), JSON.stringify({ product_id, order_id: order }));
      return { ...value, duplicate: false };
    });
    if (!result.duplicate) log({ event: 'wallet_gift_purchase_committed', productId: product_id, orderId: result.order_id, free });
    return result;
  }
  function acknowledge(order) {
    if (typeof order !== 'string' || order.length > 120) throw new GameError(1,'Invalid order acknowledgement');
    store.transaction((model,db) => {
      const row = db.prepare('SELECT order_id FROM recharge_orders WHERE account_id=? AND order_id=?').get(accountId,order);
      if (!row) throw new GameError(1,'Local order not found');
      const modules = new Map(model.state.modules.value), login = codec.unpack('res_recharge_login',rawBinary(modules.get(19)));
      if (login.tmp_recharge_record) login.tmp_recharge_record.tmp_record_list = login.tmp_recharge_record.tmp_record_list.filter(x=>x.order_no!==order);
      modules.set(19,serializedBinary(codec.pack('res_recharge_login',login))); model.state.modules.value=[...modules];
      db.prepare('UPDATE recharge_orders SET acknowledged=1 WHERE order_id=?').run(order);
    });
  }
  return { snapshot, credit, buy, purchaseGift, acknowledge, accountId };
}
