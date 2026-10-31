import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { isDailyDiscountOrder, rechargeDayIndex } from './recharge-rules.mjs';

export const WEEK_HUNT_MODULE = 533;

export function createWeekHuntService({ store, codec, tables, now = Date.now }) {
  const config = tables.WeekHuntConst.get(1);
  const periodDays = Number(config?.period_day), durationDays = Number(config?.duration_day);
  if (!Number.isSafeInteger(periodDays) || periodDays < 1 || !Number.isSafeInteger(durationDays) || durationDays < periodDays) {
    throw new Error('Week Hunt duration is invalid');
  }
  const dailyRows = tables.DailyDiscountRecharge;
  const productIdFor = tid => Number(dailyRows.get(Number(tid))?.recharge_id ?? 0);
  const read = modules => modules.has(WEEK_HUNT_MODULE)
    ? codec.unpack('pb_week_hunt', rawBinary(modules.get(WEEK_HUNT_MODULE)))
    : { cur_versions: [], week_period_info: [] };
  const write = (modules, info) => modules.set(WEEK_HUNT_MODULE, serializedBinary(codec.pack('pb_week_hunt', info)));
  const kindFor = (week, productId) => {
    const period = tables.WeekHuntPeriod.get(Number(week.version));
    if (!period) return null;
    if (productIdFor(period.common_one_key_gift) === Number(productId)) return 'one';
    if ((period.common_gift ?? []).some(tid => productIdFor(tid) === Number(productId))) return 'split';
    if ((period.upgrade_gift ?? []).some(tid => productIdFor(tid) === Number(productId))) return 'upgrade';
    return null;
  };
  const inGiftDays = (week, day) => day >= Number(week.start_day) && day < Number(week.start_day) + periodDays;
  const purchased = (week, day, kind, productId) => {
    if (kind === 'upgrade') return (week.upgrade_list ?? []).some(row => Number(row.day_index) === day);
    const row = (week.discount_buy_list ?? []).find(row => Number(row.day_index) === day);
    if (!row) return false;
    return Boolean(row.one_buy_id) || (kind === 'one'
      ? Boolean(row.split_buy_ids?.length)
      : (row.split_buy_ids ?? []).map(Number).includes(Number(productId)));
  };

  function addRecord(week, day, kind, productId) {
    if (!inGiftDays(week, day)) return;
    if (kind === 'upgrade') {
      week.upgrade_list ??= [];
      if (!week.upgrade_list.some(row => Number(row.day_index) === day && Number(row.recharge_id) === productId)) {
        week.upgrade_list.push({ day_index: day, recharge_id: productId });
      }
      return;
    }
    week.discount_buy_list ??= [];
    let row = week.discount_buy_list.find(row => Number(row.day_index) === day);
    if (!row) { row = { day_index: day, split_buy_ids: [], one_buy_id: 0 }; week.discount_buy_list.push(row); }
    if (kind === 'one') row.one_buy_id = productId;
    else row.split_buy_ids = [...new Set([...(row.split_buy_ids ?? []).map(Number), productId])].sort((a, b) => a - b);
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value), info = read(modules);
      const orders = db.prepare('SELECT product_id,created_at,payload_json FROM recharge_orders ORDER BY rowid').all();
      for (const order of orders) {
        let payload = {};
        try { payload = JSON.parse(order.payload_json ?? '{}'); } catch {}
        if (!isDailyDiscountOrder(payload, codec)) continue;
        const at = Math.floor(Date.parse(order.created_at) / 1000);
        if (!Number.isSafeInteger(at)) continue;
        const period = Number(payload.week_hunt_period ?? payload.period ?? 0);
        const day = Number(payload.week_hunt_day ?? payload.day_index ?? 0) || rechargeDayIndex(at);
        for (const week of info.week_period_info ?? []) {
          if (period && period !== Number(week.version)) continue;
          const kind = kindFor(week, order.product_id);
          if (kind) addRecord(week, day, kind, Number(order.product_id));
        }
      }
      // Orders only add evidenced purchases to retained periods. Existing task
      // progress is preserved, and this does not create a new activity cycle.
      if (modules.has(WEEK_HUNT_MODULE)) {
        write(modules, info);
        model.state.modules.value = [...modules];
      }
    });
  }

  function resolvePurchase({ modules, product, extraBuy = false, period = 0, dayIndex = 0, at = now() }) {
    if (Number(product?.type) !== 46) return null;
    const info = read(modules), today = rechargeDayIndex(at);
    const candidates = (info.week_period_info ?? []).filter(week =>
      (info.cur_versions ?? []).map(Number).includes(Number(week.version))
      && today >= Number(week.start_day) && today < Number(week.start_day) + durationDays
      && kindFor(week, product.tid)
    ).sort((a, b) => Number(b.version) - Number(a.version));
    const week = Number(period) > 0 ? candidates.find(row => Number(row.version) === Number(period)) : candidates[0];
    if (!week) {
      if (Number(period) > 0) throw new GameError(309, 'Week Hunt period is not open');
      return null;
    }
    const kind = kindFor(week, product.tid);
    let day = Number(dayIndex) || 0;
    if (!day && (extraBuy || kind === 'upgrade')) {
      for (let candidate = Math.min(today, Number(week.start_day) + periodDays - 1); candidate >= Number(week.start_day); candidate--) {
        if (!purchased(week, candidate, kind, product.tid)) { day = candidate; break; }
      }
      if (!day) throw new GameError(307, 'Week Hunt gift purchase limit reached');
    }
    day ||= today;
    // A daily offer can use today's allowance after the seven task days.
    // Makeup purchases must reference a past task day in the retained period.
    if (day > today || (!inGiftDays(week, day) && (extraBuy || day !== today))) throw new GameError(1, 'Invalid Week Hunt gift day');
    if (inGiftDays(week, day) && purchased(week, day, kind, product.tid)) throw new GameError(307, 'Week Hunt gift was already purchased');
    return { period: Number(week.version), day, kind, productId: Number(product.tid) };
  }

  function recordPurchase({ modules, context }) {
    if (!context) return;
    const info = read(modules);
    const week = (info.week_period_info ?? []).find(row => Number(row.version) === context.period);
    if (!week) throw new GameError(309, 'Week Hunt period is missing');
    addRecord(week, context.day, context.kind, context.productId);
    write(modules, info);
  }

  return { ensureLoginState, resolvePurchase, recordPurchase, moduleId: WEEK_HUNT_MODULE };
}
