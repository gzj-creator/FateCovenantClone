import { binary, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

const ACTIVITY_LOGIN_MODULE = 92;
const PET_ACTIVITY_LOGIN_MODULE = 83;
const RUNNING_STATE = 50;
const SHOP_PERIOD = 1;
const PET_ACT_RECHARGE_HANDLE = 65;
const FEATURED_PET_TID = 500313;
const FEATURED_WOUND_TIDS = [98, 99, 100, 97];
const ONE_YEAR_SECONDS = 365 * 86400;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function activityState(activity, actId) {
  const id = Number(actId);
  for (const entry of activity.act_list ?? []) {
    if (Number(entry.state_data?.act_id) === id) return entry.state_data;
  }
  for (const group of activity.act_parallel_list ?? []) {
    const state = (group.states_data ?? []).find(value => Number(value.act_id) === id);
    if (state) return state;
  }
  return null;
}

function activityGroup(activity, actId) {
  const id = Number(actId);
  return (activity.act_parallel_list ?? []).find(group => (
    (group.states_data ?? []).some(state => Number(state.act_id) === id)
  )) ?? null;
}

function requestKey(prefix, context) {
  const value = String(context?.requestId ?? `${prefix}:${context?.connection ?? 'direct'}:${context?.seq ?? 0}`);
  if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(value)) throw new GameError(1, 'Invalid activity request ID');
  return value;
}

export function createPetActivityService({
  store,
  codec,
  tables,
  calendar,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(now());

  function loginActivity() {
    const raw = new Map(store.state().modules.value).get(ACTIVITY_LOGIN_MODULE);
    if (!raw) return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    return codec.unpack('pb_act_login', rawBinary(raw));
  }

  function openState(actId, activity = loginActivity(), at = currentSeconds()) {
    const state = activityState(activity, actId);
    if (!state || Number(state.cur_state_id) !== RUNNING_STATE) return null;
    if ((activity.act_pause_list ?? []).map(Number).includes(Number(actId))) return null;
    if (!calendar.isActivityRunning(Number(actId), state, activity, at)) return null;
    return state;
  }

  function configForActivity(actId) {
    return tables.PetActivity?.get(Number(actId)) ?? null;
  }

  function findOpenPetActivity(activity = loginActivity(), at = currentSeconds()) {
    const candidates = new Map();
    for (const entry of activity.act_list ?? []) candidates.set(Number(entry.state_data?.act_id), entry.state_data);
    for (const group of activity.act_parallel_list ?? []) {
      for (const state of group.states_data ?? []) candidates.set(Number(state.act_id), state);
    }
    const open = [...candidates.keys()]
      .filter(actId => configForActivity(actId) && openState(actId, activity, at))
      .sort((left, right) => right - left);
    return open.length ? { actId: open[0], config: configForActivity(open[0]) } : null;
  }

  function activityDeadline(actId, activity = loginActivity()) {
    const custom = (activity.act_custom_list ?? []).find(row => Number(row.act_id) === Number(actId));
    const customEnd = Number(custom?.end_time ?? 0);
    if (customEnd > currentSeconds()) return customEnd;
    if (calendar.mode === 'all-open') return currentSeconds() + ONE_YEAR_SECONDS;
    const cfg = tables.Activity?.get(Number(actId));
    const configuredEnd = Number(cfg?.world_time ?? 0) + Math.max(1, Number(cfg?.duration_day ?? 1)) * 86400;
    return configuredEnd > currentSeconds() ? configuredEnd : currentSeconds() + 86400;
  }

  function exclusiveShopConfig(activity) {
    const shopEntry = tables.PetExclusiveShop?.get(Number(activity.shop));
    if (!shopEntry) throw new GameError(5, 'Pet activity exclusive shop is not configured');
    return {
      shopId: Number(shopEntry.shop),
      currencyTid: Number(shopEntry.res?.[0]),
      redCurrencyCount: Number(shopEntry.res_red_count?.[0] ?? 0),
      periodId: Math.floor(Number(shopEntry.shop) / 10000)
    };
  }

  function allShopItems(activity) {
    const { shopId, periodId, currencyTid } = exclusiveShopConfig(activity);
    const candidates = [...(tables.ShopItem?.values() ?? [])]
      .filter(item => String(item.tid).startsWith(String(periodId)) && Number(item.currency_type) === currencyTid)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    const start = candidates.findIndex(item => Number(item.item) === FEATURED_PET_TID);
    if (start < 0) return [];
    let end = start + 1;
    while (end < candidates.length) {
      const item = candidates[end];
      if (Number(item.sort_weight) === 999 && Number(item.count) === 1) break;
      end++;
    }
    return candidates.slice(start, end)
      .sort((left, right) => Number(right.sort_weight ?? 0) - Number(left.sort_weight ?? 0) || Number(left.tid) - Number(right.tid));
  }

  function shopBuyCounts(activityId, db = null) {
    const query = db ?? null;
    if (!query) return store.inspect(database => shopBuyCounts(activityId, database));
    const roleId = store.read().state.roleId;
    return new Map(query.prepare(`SELECT product_id,sum(buy_num) AS n FROM activity_purchases
      WHERE role_id=? AND activity_id=? AND kind='shop'
      GROUP BY product_id`).all(roleId, Number(activityId)).map(row => [Number(row.product_id), Number(row.n)]));
  }

  function shopInfo(activity, actId = Number(activity.tid), db = null) {
    const { shopId, periodId } = exclusiveShopConfig(activity);
    const counts = shopBuyCounts(actId, db);
    const items = allShopItems(activity);
    const deadlineTime = activityDeadline(actId);
    return {
      id: shopId,
      version: Number(tables.ShopPeriod?.get(periodId)?.version ?? 0),
      items_groups: items.length ? [{
        item_list: items.map(item => ({ tid: Number(item.tid), buy_count: counts.get(Number(item.tid)) ?? 0 })),
        group_data_bin: codec.pack('pb_shop_period', {
          period: SHOP_PERIOD,
          deadline_time: deadlineTime,
          act_id: actId
        })
      }] : []
    };
  }

  function emptyShopInfo(shopId) {
    return { id: Number(shopId), version: 0, items_groups: [] };
  }

  function giftBuyCounts(activityId, db = null) {
    if (!db) return store.inspect(database => giftBuyCounts(activityId, database));
    const roleId = store.read().state.roleId;
    return new Map(db.prepare(`SELECT product_id,sum(buy_num) AS n FROM activity_purchases
      WHERE role_id=? AND activity_id=? AND kind='gift' GROUP BY product_id`).all(roleId, activityId)
      .map(row => [Number(row.product_id), Number(row.n)]));
  }

  function rechargeInfo(activityId, db = null) {
    const deadlineTime = activityDeadline(activityId);
    const counts = giftBuyCounts(activityId, db);
    return {
      refresh_time: deadlineTime,
      buy_num_list: [...counts.entries()].filter(([, count]) => count > 0).map(([rechargeId, buyNum]) => ({
        recharge_id: rechargeId,
        buy_num: buyNum,
        refresh_time: deadlineTime,
        used_extra_times: 0
      }))
    };
  }

  function actPlayer(activityId, db = null) {
    return {
      act_tid: activityId,
      fight_record: { mission_tid: 0, last_fight_time_sec: 0, acc_dmg: '0', max_dmg: '0', award_state: Buffer.alloc(0) },
      wounds: FEATURED_WOUND_TIDS.map(wound_tid => ({ wound_tid, last_cure_time_sec: 0, cure_times: 0, today_finish: false })),
      selected_pet_tid: FEATURED_PET_TID,
      likability_award_state: Buffer.alloc(0),
      recharge_info: rechargeInfo(activityId, db),
      rev_daily_award_num: 0,
      daily_time: 0,
      vitality_award_state: Buffer.alloc(0)
    };
  }

  async function synchronizeLogin(activity, at = currentSeconds()) {
    const current = findOpenPetActivity(activity, at);
    if (!current) return null;
    const player = actPlayer(current.actId);
    const begin = codec.pack('pb_pet_act_begin', {
      shop_info: shopInfo(current.config, current.actId),
      act_player: player
    });
    const group = activityGroup(activity, current.actId);
    if (group) group.module_login_data = (await encodeEtf(binary(begin))).toString('base64');
    return {
      actId: current.actId,
      module: codec.pack('pb_pet_act_player_list', { act_data_list: [player] }),
      shopId: exclusiveShopConfig(current.config).shopId
    };
  }

  function giftConfig(productId) {
    const id = Number(productId);
    const activity = loginActivity();
    for (const [actId, cfg] of tables.PetActivity?.entries() ?? []) {
      if (!openState(actId, activity)) continue;
      const shop = tables.GiftShop?.get(Number(cfg.gift));
      if ((shop?.gift ?? []).map(Number).includes(id)) return { activityId: Number(actId), config: cfg, productId: id };
    }
    return null;
  }

  function assertGiftAvailable(productId) {
    const product = tables.Recharge?.get(Number(productId));
    const gift = giftConfig(productId);
    if (!product || product.type !== 76 || !gift) throw new GameError(309, 'Pet activity gift is not running');
    return { ...gift, product };
  }

  function giftPurchaseCount(productId, db = null) {
    const gift = giftConfig(productId);
    if (!gift) return 0;
    return giftBuyCounts(gift.activityId, db).get(Number(productId)) ?? 0;
  }

  function recordGiftPurchase({ model, db, activityId, productId, buyNum, priceItemTid, priceAmount, requestId, payload }) {
    db.prepare(`INSERT INTO activity_purchases
      (role_id,activity_id,kind,product_id,buy_num,price_item_tid,price_amount,request_id,payload_json,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      model.state.roleId, Number(activityId), 'gift', Number(productId), Number(buyNum),
      Number(priceItemTid ?? 0), Number(priceAmount ?? 0), requestId, JSON.stringify(payload),
      new Date(currentSeconds() * 1000).toISOString()
    );
  }

  function rechargeExtra(activityId, db = null) {
    const data = codec.pack('pb_recharge_limit_info', rechargeInfo(activityId, db));
    return { flag: PET_ACT_RECHARGE_HANDLE, data };
  }

  function queryShops(shopIds) {
    const activity = loginActivity();
    const current = findOpenPetActivity(activity);
    const petShopId = current ? exclusiveShopConfig(current.config).shopId : null;
    return shopIds.map(shopId => (
      current && Number(shopId) === petShopId ? shopInfo(current.config, current.actId) : emptyShopInfo(shopId)
    ));
  }

  function purchaseShop(request, context = {}) {
    const shopId = Number(request.shop_id), productId = Number(request.shop_item_id);
    const cellIndex = Number(request.cell_index ?? 0), requestedCount = Number(request.count ?? 1);
    const count = requestedCount > 0 ? requestedCount : 1;
    if (!Number.isSafeInteger(shopId) || !Number.isSafeInteger(productId) || count < 1 || count > 1000) throw new GameError(1, 'Invalid shop purchase');
    const activity = loginActivity();
    const current = findOpenPetActivity(activity);
    if (!current || exclusiveShopConfig(current.config).shopId !== shopId) throw new GameError(309, 'Pet activity shop is not running');
    const items = allShopItems(current.config);
    const product = items.find(item => Number(item.tid) === productId);
    if (!product) throw new GameError(1, 'Shop item does not belong to the current activity');
    if (cellIndex > 0 && items[cellIndex - 1]?.tid !== productId) throw new GameError(1, 'Shop cell does not match its item');
    const requestId = requestKey('shop', context);
    const priceAmount = Number(product.price?.[0]?.[1] ?? 0);
    if (!Number.isSafeInteger(priceAmount) || priceAmount < 0) throw new GameError(5, 'Shop price is invalid');

    const result = store.transaction((model, db) => {
      const old = db.prepare(`SELECT product_id,payload_json FROM activity_purchases
        WHERE role_id=? AND kind='shop' AND request_id=?`).get(model.state.roleId, requestId);
      if (old) {
        if (Number(old.product_id) !== productId) throw new GameError(1, 'Activity request ID already used');
        return { ...JSON.parse(old.payload_json), duplicate: true };
      }
      const bought = shopBuyCounts(current.actId, db).get(productId) ?? 0;
      if (Number(product.purchase_limit ?? 0) > 0 && bought + count > Number(product.purchase_limit)) throw new GameError(307, 'Shop purchase limit reached');
      const cost = priceAmount * count;
      const consume = consumeResources(model, [[Number(product.currency_type), cost]]);
      const award = grantResources(model, [[Number(product.item), Number(product.count) * count]], tables);
      const value = { changes: [...consume.changes, ...award.changes], is_overflow: false };
      db.prepare(`INSERT INTO activity_purchases
        (role_id,activity_id,kind,product_id,buy_num,price_item_tid,price_amount,request_id,payload_json,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        model.state.roleId, current.actId, 'shop', productId, count, Number(product.currency_type), cost,
        requestId, JSON.stringify(value), new Date(currentSeconds() * 1000).toISOString()
      );
      return { ...value, duplicate: false };
    });
    const { duplicate, ...value } = result;
    return { value, data: codec.pack('pb_res_to_client', value), duplicate };
  }

  return {
    moduleId: PET_ACTIVITY_LOGIN_MODULE,
    rechargeHandle: PET_ACT_RECHARGE_HANDLE,
    loginActivity,
    findOpenPetActivity,
    synchronizeLogin,
    queryShops,
    purchaseShop,
    giftConfig,
    assertGiftAvailable,
    giftPurchaseCount,
    recordGiftPurchase,
    rechargeExtra,
    rechargeInfo,
    isActivityOpen: actId => Boolean(openState(actId))
  };
}
