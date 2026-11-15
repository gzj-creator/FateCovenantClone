import { readBuySkinActTables } from '../config/buy-skin-act-tables.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';
import { openFeatureIds } from './feature-service.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeHandleForType } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

export const BUY_SKIN_ACT_ID = 175001;
export const BUY_SKIN_ACT_VERSION = 1;
export const BUY_SKIN_FEATURE_ID = 1514;

const ACTIVITY_LOGIN_MODULE = 92;
const FEATURE_LOGIN_MODULE = 3;
const FREE_CLAIM_TYPE = 104001;
const RECHARGE_TYPE = 120;
const RUNNING_STATE_ID = 50;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function parsePayload(row) {
  try { return JSON.parse(row?.payload_json ?? '{}'); } catch { return {}; }
}

export function createBuySkinActService({
  store,
  codec,
  tables,
  buySkinTables = readBuySkinActTables(),
  calendar,
  now = Date.now,
  logger = () => {},
  featureGate = null
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const rechargeHandle = rechargeHandleForType(tables, RECHARGE_TYPE);

  if (!Number.isSafeInteger(rechargeHandle) || rechargeHandle <= 0) {
    throw new Error('BuySkinAct recharge handle is not configured');
  }
  for (const row of buySkinTables.activeRows) {
    const product = tables.Recharge?.get(row.gift);
    if (!product || Number(product.type) !== RECHARGE_TYPE || Number(product.pay_type) !== 0
      || Number(product.price) !== 32800 || Number(product.can_buy_times) !== 1) {
      throw new Error(`BuySkinAct product ${row.gift} does not match the R1 configuration`);
    }
    if (!product.reward_tid.some(tid => Number(tid) === row.skin)) {
      throw new Error(`BuySkinAct product ${row.gift} does not grant skin ${row.skin}`);
    }
  }

  function activityOccurrence(at) {
    const occurrence = calendar?.occurrenceFor?.(BUY_SKIN_ACT_ID, at) ?? null;
    if (!occurrence || Number(occurrence.actId) !== BUY_SKIN_ACT_ID
      || Number(occurrence.version) !== BUY_SKIN_ACT_VERSION
      || at < Number(occurrence.start) || at >= Number(occurrence.end)) {
      throw new GameError(309, 'Buy-skin activity is not running');
    }
    return occurrence;
  }

  function featureIsOpen(modules = new Map(store.state().modules.value)) {
    if (typeof featureGate === 'function') return Boolean(featureGate({ modules }));
    try {
      const raw = modules.get(FEATURE_LOGIN_MODULE);
      if (!raw) return false;
      return openFeatureIds(codec.unpack('res_fun_open_login', rawBinary(raw))).has(BUY_SKIN_FEATURE_ID);
    } catch (error) {
      log({ event: 'buy_skin_feature_parse_failed', message: error?.message ?? String(error) });
      return false;
    }
  }

  function assertFeatureOpen(modules) {
    if (!featureIsOpen(modules)) throw new GameError(5, 'Buy-skin feature 1514 is not open');
  }

  function activityDay(occurrence, at) {
    const day = gameDayIndex(at) - gameDayIndex(occurrence.start) + 1;
    if (!Number.isSafeInteger(day) || day <= 0) throw new GameError(309, 'Buy-skin activity day is invalid');
    return day;
  }

  function freeRow(itemId) {
    const item = Number(itemId);
    const row = Number.isSafeInteger(item) && item > 0 ? buySkinTables.activeByTid.get(item) : null;
    if (!row) throw new GameError(5, 'Buy-skin free award item is not configured');
    return row;
  }

  function productRow(productId, buySkinTid = null) {
    const rechargeId = Number(productId);
    const row = Number.isSafeInteger(rechargeId) && rechargeId > 0 ? buySkinTables.activeByGift.get(rechargeId) : null;
    if (!row) return null;
    if (buySkinTid != null && Number(buySkinTid) !== row.tid) {
      throw new GameError(5, 'Buy-skin item id does not match its recharge product');
    }
    return row;
  }

  function requestActivity(requestedActivityId, occurrence) {
    if (requestedActivityId == null || requestedActivityId === 0 || requestedActivityId === '') return;
    const requested = Number(requestedActivityId);
    if (!Number.isSafeInteger(requested) || requested !== occurrence.actId) {
      throw new GameError(309, 'Buy-skin activity id does not match the running instance');
    }
  }

  function purchaseCount(db, roleId, row, occurrence) {
    const rows = db.prepare(`SELECT buy_num,payload_json FROM activity_purchases
      WHERE role_id=? AND activity_id=? AND kind='gift' AND product_id=? ORDER BY rowid`)
      .all(roleId, occurrence.actId, row.gift);
    return rows.reduce((total, purchase) => {
      const payload = parsePayload(purchase);
      if (String(payload.period_key ?? '') !== String(occurrence.instanceKey)) return total;
      return total + Math.max(1, Number(purchase.buy_num) || 1);
    }, 0);
  }

  function moduleSkinOwned(modules, skinId) {
    const raw = modules.get(65);
    if (!raw) return false;
    try {
      const info = codec.unpack('pb_skin_info', rawBinary(raw));
      return (info.skin_list ?? []).some(item => Number(item.id) === Number(skinId) && Number(item.num ?? 0) > 0);
    } catch {
      return false;
    }
  }

  function skinOwned({ model = store.read(), db = null, row }) {
    const roleId = Number(model.state.roleId);
    if (db && db.prepare('SELECT 1 FROM role_skins WHERE role_id=? AND skin_tid=? AND num>0 LIMIT 1').get(roleId, row.skin)) {
      return true;
    }
    return moduleSkinOwned(new Map(model.state.modules.value), row.skin);
  }

  function assertPurchaseAvailable({
    productId,
    buySkinTid = null,
    activityId = null,
    at = currentSeconds(),
    model = null,
    db = null
  } = {}) {
    const row = productRow(productId, buySkinTid);
    if (!row) throw new GameError(5, 'Recharge product is not configured by BuySkinAct version 1');
    const occurrence = activityOccurrence(at);
    requestActivity(activityId, occurrence);
    const currentModel = model ?? store.read();
    assertFeatureOpen(new Map(currentModel.state.modules.value));
    const day = activityDay(occurrence, at);
    if (day < row.unlock_day) throw new GameError(309, 'Buy-skin product is not unlocked yet');
    if (skinOwned({ model: currentModel, db, row })) {
      throw new GameError(5, 'Buy-skin product is already owned');
    }
    let count;
    if (db) count = purchaseCount(db, currentModel.state.roleId, row, occurrence);
    else count = store.inspect(database => purchaseCount(database, currentModel.state.roleId, row, occurrence));
    if (count >= 1) throw new GameError(307, 'Product purchase limit reached');
    return { row, occurrence, day };
  }

  function latestFreeClaims(db, roleId, occurrence) {
    const rows = db.prepare(`SELECT item_id,claim_day,claimed_at FROM buy_skin_free_claims
      WHERE role_id=? AND act_id=? AND period_key=? ORDER BY claimed_at DESC,rowid DESC`)
      .all(roleId, occurrence.actId, occurrence.instanceKey);
    const latest = new Map();
    for (const row of rows) if (!latest.has(Number(row.item_id))) latest.set(Number(row.item_id), row);
    return [...latest.values()]
      .sort((left, right) => Number(left.item_id) - Number(right.item_id))
      .map(row => ({ item_id: Number(row.item_id), time_sec: Number(row.claimed_at) }));
  }

  function purchaseRows(db, roleId, occurrence) {
    return db.prepare(`SELECT product_id,buy_num,payload_json FROM activity_purchases
      WHERE role_id=? AND activity_id=? AND kind='gift' ORDER BY rowid`)
      .all(roleId, occurrence.actId)
      .filter(row => String(parsePayload(row).period_key ?? '') === String(occurrence.instanceKey));
  }

  function rechargeRecord(db, roleId, occurrence) {
    const counts = new Map();
    for (const row of purchaseRows(db, roleId, occurrence)) {
      const productId = Number(row.product_id);
      counts.set(productId, (counts.get(productId) ?? 0) + Math.max(1, Number(row.buy_num) || 1));
    }
    return {
      refresh_time: Number(occurrence.end),
      buy_num_list: [...counts.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([rechargeId, buyNum]) => ({
          recharge_id: rechargeId,
          buy_num: buyNum,
          refresh_time: Number(occurrence.end),
          used_extra_times: 0
        }))
    };
  }

  function rolePayload(db, roleId, occurrence) {
    return {
      act_id: occurrence.actId,
      record: rechargeRecord(db, roleId, occurrence),
      free_award: latestFreeClaims(db, roleId, occurrence)
    };
  }

  function loginStateEntry(activity, occurrence) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === occurrence.actId)
      ?? null;
    for (const group of activity.act_parallel_list) {
      entry ??= (group?.states_data ?? []).find(state => Number(state?.act_id) === occurrence.actId) ?? null;
    }
    if (!entry) {
      entry = { state_data: { act_id: occurrence.actId }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = occurrence.actId;
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = (entry.state_data.history_time ?? [])
      .filter(item => Number(item?.state_id) !== RUNNING_STATE_ID);
    entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: occurrence.start });
    return entry;
  }

  function applyLoginPayload(activity, occurrence, rolePb) {
    const entry = loginStateEntry(activity, occurrence);
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_buy_skin_person', rolePb)).toString('base64');
    return entry;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    let occurrence;
    try { occurrence = activityOccurrence(at); } catch (error) {
      if (error instanceof GameError && error.code === 309) return { actId: null };
      throw error;
    }
    const roleId = store.state().roleId;
    const rolePb = store.inspect(db => rolePayload(db, roleId, occurrence));
    applyLoginPayload(activity, occurrence, rolePb);
    log({
      event: 'buy_skin_login_synchronized', actId: occurrence.actId,
      periodKey: occurrence.instanceKey,
      bought: rolePb.record.buy_num_list.map(row => row.recharge_id),
      freeAwards: rolePb.free_award.map(row => row.item_id)
    });
    return { actId: occurrence.actId, periodKey: occurrence.instanceKey, rolePb };
  }

  function assertFreeAvailable({ itemId, activityId, at, modules }) {
    const row = freeRow(itemId);
    const occurrence = activityOccurrence(at);
    requestActivity(activityId, occurrence);
    assertFeatureOpen(modules);
    const day = activityDay(occurrence, at);
    if (day < row.unlock_day || day >= row.unlock_day + row.con_time) {
      throw new GameError(309, 'Buy-skin free award is outside its current day window');
    }
    return { row, occurrence, day };
  }

  function claimFree(input) {
    const request = Buffer.isBuffer(input) || input instanceof Uint8Array
      ? codec.unpack('pb_buy_skin_free_req', Buffer.from(input))
      : input;
    const actId = Number(request?.act_id), itemId = Number(request?.item_id);
    if (!Number.isSafeInteger(actId) || !Number.isSafeInteger(itemId) || actId <= 0 || itemId <= 0) {
      throw new GameError(1, 'Invalid buy-skin free award request');
    }
    const at = currentSeconds();
    const preliminary = assertFreeAvailable({
      itemId, activityId: actId, at, modules: new Map(store.state().modules.value)
    });
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      // Recheck the running instance and 05:00 boundary inside the write
      // transaction; the process clock may cross midnight or the instance end.
      const current = assertFreeAvailable({
        itemId, activityId: actId, at: currentSeconds(), modules: new Map(model.state.modules.value)
      });
      if (current.occurrence.instanceKey !== preliminary.occurrence.instanceKey) {
        throw new GameError(309, 'Buy-skin activity instance changed during claim');
      }
      const duplicate = db.prepare(`SELECT 1 FROM buy_skin_free_claims
        WHERE role_id=? AND act_id=? AND period_key=? AND item_id=? AND claim_day=?`)
        .get(roleId, actId, current.occurrence.instanceKey, itemId, current.day);
      if (duplicate) throw new GameError(311, 'Buy-skin free award was already claimed today');
      const res = grantResources(model, current.row.award_list, tables, { codec, db });
      const createdAt = new Date(at * 1000).toISOString();
      db.prepare(`INSERT INTO buy_skin_free_claims(
        role_id,act_id,period_key,item_id,claim_day,claimed_at,created_at
      ) VALUES (?,?,?,?,?,?,?)`).run(
        roleId, actId, current.occurrence.instanceKey, itemId, current.day, at, createdAt
      );
      const modules = new Map(model.state.modules.value);
      const stored = modules.get(ACTIVITY_LOGIN_MODULE);
      if (stored) {
        const activity = codec.unpack('pb_act_login', rawBinary(stored));
        applyLoginPayload(activity, current.occurrence, rolePayload(db, roleId, current.occurrence));
        modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
        model.state.modules.value = [...modules];
      }
      return { res, value: { actId, itemId, day: current.day, periodKey: current.occurrence.instanceKey } };
    });
    log({ event: 'buy_skin_free_award_committed', ...result.value, changes: result.res.changes.length });
    return { value: result.value, data: codec.pack('pb_res_to_client', { changes: result.res.changes }) };
  }

  function recordPurchase({ model, db, productId, requestId, buySkinTid = null, activityId = null, at = currentSeconds() }) {
    const row = productRow(productId, buySkinTid);
    const occurrence = activityOccurrence(at);
    requestActivity(activityId, occurrence);
    assertFeatureOpen(new Map(model.state.modules.value));
    if (activityDay(occurrence, at) < row.unlock_day) throw new GameError(309, 'Buy-skin product is not unlocked yet');
    const roleId = Number(model.state.roleId);
    if (purchaseCount(db, roleId, row, occurrence) >= 1) throw new GameError(307, 'Product purchase limit reached');
    const createdAt = new Date(at * 1000).toISOString();
    db.prepare(`INSERT INTO role_skins(role_id,skin_tid,num,increase_level,source,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(role_id,skin_tid) DO UPDATE SET num=excluded.num,source=excluded.source,updated_at=excluded.updated_at`)
      .run(roleId, row.skin, 1, 0, `buy_skin_act:${occurrence.actId}`, createdAt, createdAt);
    const product = tables.Recharge.get(row.gift);
    db.prepare(`INSERT INTO activity_purchases(
      role_id,activity_id,kind,product_id,buy_num,price_item_tid,price_amount,request_id,payload_json,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      roleId, occurrence.actId, 'gift', row.gift, 1, 0, Number(product.price), requestId,
      JSON.stringify({
        product_id: row.gift, activity_id: occurrence.actId, buy_skin_tid: row.tid,
        skin: row.skin, period_key: occurrence.instanceKey, wallet_purchase: true
      }), createdAt
    );
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(ACTIVITY_LOGIN_MODULE);
    if (stored) {
      const activity = codec.unpack('pb_act_login', rawBinary(stored));
      applyLoginPayload(activity, occurrence, rolePayload(db, roleId, occurrence));
      modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      model.state.modules.value = [...modules];
    }
    return { activityId: occurrence.actId, periodKey: occurrence.instanceKey, buySkinTid: row.tid, skin: row.skin };
  }

  function purchaseExtra(productId, db = null, activityId = null, at = currentSeconds()) {
    const row = productRow(productId);
    if (!row) return null;
    const occurrence = activityOccurrence(at);
    requestActivity(activityId, occurrence);
    const roleId = store.state().roleId;
    const record = db
      ? rechargeRecord(db, roleId, occurrence)
      : store.inspect(database => rechargeRecord(database, roleId, occurrence));
    return {
      flag: rechargeHandle,
      data: codec.pack('pb_recharge_limit_info', record),
      activityId: occurrence.actId,
      periodKey: occurrence.instanceKey
    };
  }

  function productInfo(row, accountId = null) {
    if (!productRow(row?.tid)) return null;
    let count = 0;
    try {
      const occurrence = activityOccurrence(currentSeconds());
      const roleId = store.state().roleId;
      count = store.inspect(db => purchaseCount(db, roleId, productRow(row.tid), occurrence));
      if (!featureIsOpen()) count = 0;
    } catch { count = 0; }
    return { configured: true, running: isRunning(), purchased: count };
  }

  function isRunning(at = currentSeconds()) {
    try {
      activityOccurrence(at);
      return featureIsOpen();
    } catch { return false; }
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    rechargeHandle,
    supports: type => Number(type) === FREE_CLAIM_TYPE,
    supportsProduct: type => Number(type) === RECHARGE_TYPE,
    isConfiguredProduct: row => Boolean(productRow(row?.tid)),
    isRunning,
    currentActivity(at = currentSeconds()) { try { return activityOccurrence(at); } catch { return null; } },
    activityDay,
    purchaseCount: (productId, at = currentSeconds()) => {
      const row = productRow(productId);
      if (!row) return 0;
      const occurrence = activityOccurrence(at);
      return store.inspect(db => purchaseCount(db, Number(store.state().roleId), row, occurrence));
    },
    productInfo,
    assertPurchaseAvailable,
    recordPurchase,
    purchaseExtra,
    synchronizeLogin,
    execute(type, input) {
      if (Number(type) !== FREE_CLAIM_TYPE) throw new GameError(5, 'Buy-skin command is not implemented');
      return claimFree(input);
    }
  };
}
