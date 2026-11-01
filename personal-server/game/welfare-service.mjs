import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { parseRechargeExtraParam } from './recharge-rules.mjs';
import { decodeBitBlock, encodeBitBlock, hasBit, setBit } from './bit-block.mjs';

// All activity day counters use the same 04:00 UTC+8 reset as the existing sprint service.
const dayIndex = now => Math.floor((now / 1000 + 10800) / 86400);

async function readEtfBinary(raw) {
  try { return await decodeBitBlock(raw); }
  catch { throw new GameError(5, 'Unsupported activity login payload'); }
}

const resToClient = res => ({ changes: res.changes, is_overflow: false });

export function createWelfareService({ store, codec, tables, wallet, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set([82101, 84601, 99300, 16005]);

  async function multiLoginAward(request) {
    const actId = Number(request.act_id);
    const items = Array.isArray(request.req_item_list) ? request.req_item_list : [];
    if (!Number.isSafeInteger(actId) || !items.length || items.length > 50) throw new GameError(1, 'Invalid multi-login claim');
    const seen = new Set();
    for (const item of items) {
      const awardTid = Number(item.award_tid);
      if (!Number.isSafeInteger(awardTid) || seen.has(awardTid)) throw new GameError(1, 'Invalid multi-login award');
      seen.add(awardTid);
    }

    const state = store.state();
    const modules = new Map(state.modules.value);
    const raw = modules.get(92) ? rawBinary(modules.get(92)) : Buffer.alloc(0);
    const activity = codec.unpack('pb_act_login', raw);
    const entry = (activity.act_list ?? []).find(row => Number(row.state_data?.act_id) === actId);
    if (!entry) throw new GameError(309, 'Activity is not running');
    const running = calendar
      ? calendar.isActivityRunning(actId, entry.state_data, activity, Math.floor(now() / 1000))
      : Number(entry.state_data.cur_state_id) === 50 && !(activity.act_pause_list ?? []).map(Number).includes(actId);
    if (!running) throw new GameError(309, 'Activity is not running');
    const cfg = tables.Activity.get(actId);
    if (!cfg || cfg.func !== 53) throw new GameError(5, 'Activity is not a multi-login activity');
    const version = Number(cfg.version);
    const duration = Number(cfg.duration_day) || 7;
    const enterTime = entry.state_data.history_time?.find(row => Number(row.state_id) === 50)?.enter_time;
    if (enterTime === undefined) throw new GameError(5, 'Multi-login activity has no running state');
    const currentDay = Math.min(duration, dayIndex(now()) - dayIndex(Number(enterTime) * 1000) + 1);
    if (currentDay < 1) throw new GameError(309, 'Activity is not running');

    const awards = [];
    const days = [];
    for (const item of items) {
      const awardTid = Number(item.award_tid);
      const day = awardTid % 100;
      if (awardTid < version * 100 + 1 || awardTid > version * 100 + duration || day < 1 || day > duration) throw new GameError(1, 'Award does not belong to the current version');
      if (day > currentDay) throw new GameError(311, 'Award day has not been reached');
      const cfgAward = tables.MultiLogin.get(awardTid);
      if (!cfgAward) throw new GameError(5, 'Multi-login award is not configured');
      awards.push([cfgAward.item, cfgAward.count]);
      days.push(day);
    }

    const bits = await readEtfBinary(Buffer.from(entry.module_login_data ?? '', 'base64'));
    const period = 'v' + version;
    for (const day of days) if (hasBit(bits, day)) throw new GameError(310, 'Reward already claimed');
    const expectedModule = JSON.stringify(modules.get(92));
    let nextBits = Buffer.alloc(Math.max(bits.length, Math.floor(Math.max(...days) / 8) + 1));
    bits.copy(nextBits);
    for (const day of days) nextBits = setBit(nextBits, day);
    entry.module_login_data = (await encodeBitBlock(nextBits)).toString('base64');
    const moduleBytes = serializedBinary(codec.pack('pb_act_login', activity));

    return store.transaction((model, db) => {
      const fresh = new Map(model.state.modules.value);
      if (JSON.stringify(fresh.get(92)) !== expectedModule) throw new GameError(1, 'Activity changed; retry claim');
      for (const item of items) {
        const awardTid = Number(item.award_tid);
        if (db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?').get(model.state.roleId, actId, awardTid, period)) throw new GameError(310, 'Reward already claimed');
      }
      for (const item of items) db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(model.state.roleId, actId, Number(item.award_tid), period, new Date(now()).toISOString());
      const res = resToClient(grantResources(model, awards, tables));
      const updated = new Map(model.state.modules.value); updated.set(92, moduleBytes); model.state.modules.value = [...updated];
      return { value: { res }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  async function princessAward(request) {
    const reqList = Array.isArray(request.req_list) ? request.req_list : [];
    if (!reqList.length || reqList.length > 20) throw new GameError(1, 'Invalid princess reward request');
    const state = store.state();
    const modules = new Map(state.modules.value);
    const princess = modules.get(126) ? codec.unpack('pb_princess', rawBinary(modules.get(126))) : {};
    const energy = princess.energy ??= {};
    const today = dayIndex(now());
    const awards = [];
    for (const item of reqList) {
      const typeTid = Number(item.type_tid), param = Number(item.param);
      if (typeTid !== 2) throw new GameError(5, 'Princess reward type is not configured');
      const cfg = tables.EnergyAward.get(param);
      if (!cfg) throw new GameError(1, 'Invalid princess energy slot');
      const field = param === 1 ? 'last_noon_day' : 'last_night_day';
      if (Number(energy[field] ?? 0) === today) throw new GameError(310, 'Reward already claimed');
      energy[field] = String(today);
      awards.push([cfg.award_item, cfg.award_count]);
    }
    const expectedModule = JSON.stringify(modules.get(126));
    const moduleBytes = serializedBinary(codec.pack('pb_princess', princess));
    return store.transaction(model => {
      const fresh = new Map(model.state.modules.value);
      if (JSON.stringify(fresh.get(126)) !== expectedModule) throw new GameError(1, 'Princess data changed; retry claim');
      const res = resToClient(grantResources(model, awards, tables));
      const updated = new Map(model.state.modules.value); updated.set(126, moduleBytes); model.state.modules.value = [...updated];
      return { value: { energy_back: energy, res }, data: codec.pack('pb_princess_back', { energy_back: energy, res }) };
    });
  }

  async function dailyDiscountSelect(request) {
    const rechargeTid = Number(request.recharge_tid), selectTid = Number(request.select_tid), day = request.day_index;
    if (!Number.isSafeInteger(rechargeTid) || !Number.isSafeInteger(selectTid) || selectTid < 1 || selectTid > 100 || !/^\d+$/.test(String(day))) throw new GameError(1, 'Invalid daily discount selection');
    const product = tables.Recharge.get(rechargeTid);
    if (!product || product.type !== 46) throw new GameError(5, 'Gift is not a recharge gift');
    const rotation = [...(tables.DailyDiscountRecharge?.values() ?? [])].find(row => Number(row.recharge_id) === rechargeTid);
    const selectCfg = [...(tables.DailyDiscountSelect?.values() ?? [])].find(row => Number(row.gift) === rechargeTid);
    if (!rotation || !selectCfg) throw new GameError(5, 'Gift has no daily discount selection');
    const state = store.state();
    const modules = new Map(state.modules.value);
    const all = modules.get(108) ? codec.unpack('pb_daily_discount_all', rawBinary(modules.get(108))) : {};
    if (!(all.daily_discount_list ?? []).some(row => Number(row.recharge_tid) === Number(rotation.tid))) throw new GameError(5, 'Gift is not in the current daily discount rotation');
    all.select_list ??= [];
    const existing = all.select_list.find(row => Number(row.recharge_tid) === rechargeTid && String(row.day_index) === String(day));
    if (existing) existing.select_tid = selectTid; else all.select_list.push({ recharge_tid: rechargeTid, select_tid: selectTid, day_index: String(day) });
    if (all.select_list.length > 100) all.select_list = all.select_list.slice(-100);
    const expectedModule = JSON.stringify(modules.get(108));
    const moduleBytes = serializedBinary(codec.pack('pb_daily_discount_all', all));
    const value = { recharge_tid: rechargeTid, select_tid: selectTid, day_index: String(day) };
    return store.transaction(model => {
      const fresh = new Map(model.state.modules.value);
      if (JSON.stringify(fresh.get(108)) !== expectedModule) throw new GameError(1, 'Daily discount data changed; retry selection');
      const updated = new Map(model.state.modules.value); updated.set(108, moduleBytes); model.state.modules.value = [...updated];
      return { value, data: codec.pack('pb_daily_discount_select_info', value) };
    });
  }

  async function purchaseGift(request, context) {
    if (!wallet?.purchaseGift) throw new GameError(5, 'Local wallet is not configured');
    const productId = Number(request.recharge_id), buyNum = Number(request.buy_num ?? 1);
    if (!Number.isSafeInteger(productId) || !Number.isSafeInteger(buyNum) || buyNum < 1) throw new GameError(1, 'Invalid gift purchase');
    const product = tables.Recharge.get(productId);
    if (!product) throw new GameError(5, 'Gift is not configured');
    let options;
    try { options = parseRechargeExtraParam(request.extra_param); }
    catch (error) {
      // Purchase UIs wrap unrelated context in extra_param. Only the daily
      // discount and period-scoped products need its tuple; requiring the same
      // shape for monthly/permanent cards made the shared 16005 command reject
      // the whole payment before the wallet could process it.
      const requiresContext = Number(product.type) === 46 || [4, 5, 7].includes(Number(product.buy_cycle_limit));
      if (requiresContext) throw new GameError(1, error.message);
      options = { is_extra_buy: false, period: 0, day_index: 0 };
      log({ event: 'purchase_extra_param_ignored', productId, length: String(request.extra_param ?? '').length });
    }
    const result = wallet.purchaseGift({
      product_id: productId,
      request_id: 'gift:' + context.connection + ':' + context.seq,
      buy_num: buyNum,
      extra_buy: options.is_extra_buy,
      period: options.period,
      day_index: options.day_index
    });
    const value = { recharge_id: productId, time: result.time, res: result.res, extra_ret_list: result.extra_ret_list ?? [] };
    return { value, data: codec.pack('res_buy_or_Rev_gift', value) };
  }

  return {
    supports: type => supported.has(type),
    async execute(type, data, context = {}) {
      switch (type) {
        case 82101: return multiLoginAward(codec.unpack('pb_multi_login_award_req', data));
        case 84601: return princessAward(codec.unpack('pb_princess_req', data));
        case 99300: return dailyDiscountSelect(codec.unpack('pb_daily_discount_select_req', data));
        case 16005: return purchaseGift(codec.unpack('pb_recharge_buy_or_rev_req', data), context);
        default: throw new GameError(5, 'Welfare command is not implemented');
      }
    }
  };
}
