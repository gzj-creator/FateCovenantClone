import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGroupBuyActTables, groupBuyGroupGiftsForVersion } from '../config/group-buy-act-tables.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeHandleForType } from './recharge-rules.mjs';
import { grantResources, partitionGrantableResources, releaseGrantablePendingRewards } from './resources.mjs';

const ACTIVITY_LOGIN_MODULE = 92;
const GROUP_BUY_FUNC = 135;
const RUNNING_STATE_ID = 50;
// GroupBuyActData.StaticGetGroupAwardIdx uses award.tid % 100 and stores the
// result in a Core.BitBlock, so the award slot table is shared with the other
// recharge activities.
const AWARD_STATE_WIDTH = 100;
const GROUP_BUY_RECHARGE_TYPE = 107;
const SERVER_DATA_TYPE = 100601;
const GROUP_AWARD_TYPE = 100602;
const SOURCE_PREFIX = 'group_buy_act:';

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

// ActivityMgr.DecodeErl unwraps module_login_data as ETF before handing the
// payload to GroupBuyActMgr.EnterState, so the protobuf is ETF-wrapped here.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Group-buy activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function parsePayload(row) {
  try { return JSON.parse(row?.payload_json ?? '{}'); } catch { return {}; }
}

export function createGroupBuyActService({
  store,
  codec,
  tables,
  groupBuyTables = readGroupBuyActTables(),
  calendar,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const activityReferenceOpenedAt = calendar?.activityReferenceOpenedAt ?? null;
  const rechargeHandle = rechargeHandleForType(tables, GROUP_BUY_RECHARGE_TYPE);

  // func=135 lives in ActivityTable; ActFrameTable has no type 135 entry.
  const activities = [...(tables.Activity?.values?.() ?? [])]
    .filter(row => Number(row.func) === GROUP_BUY_FUNC)
    .map(row => ({ actId: Number(row.tid), config: row, version: Number(row.version) }))
    .filter(act => Number.isSafeInteger(act.actId) && act.actId > 0
      && Number.isSafeInteger(act.version)
      && groupBuyTables.versions.has(act.version))
    .sort((left, right) => left.actId - right.actId);

  function groupGifts(version) {
    return groupBuyGroupGiftsForVersion(groupBuyTables, version);
  }

  function groupGiftIds(act) {
    return groupGifts(act.version).map(row => Number(row.tid));
  }

  function versionGiftIds(act) {
    return (groupBuyTables.giftsByVersion.get(act.version) ?? []).map(row => Number(row.tid));
  }

  function loadActivity() {
    const module = new Map(store.state().modules.value).get(ACTIVITY_LOGIN_MODULE);
    if (!module) return null;
    const bytes = rawBinary(module);
    if (!bytes.length) return null;
    try {
      return codec.unpack('pb_act_login', bytes);
    } catch {
      throw new GameError(5, 'Activity login data is invalid');
    }
  }

  // The local all-open calendar treats every configured activity as running,
  // so pick a deterministic act instead of the first table row: prefer the
  // newest version whose configured window already started, because its
  // HeadCompensate timeline can be reproduced from the same start time the
  // client derives from ActivityTimeUtil.GetActStateTime.
  function selectActivity(activity = null, at = currentSeconds()) {
    const candidates = activities.filter(act => groupGifts(act.version).length > 0);
    if (!candidates.length) return null;
    const withWindow = candidates.map(act => ({
      ...act,
      window: activityWindow(act.config, serverOpenedAt, activityReferenceOpenedAt)
    }));
    if (calendar?.mode === 'all-open') {
      const started = withWindow
        .filter(act => Number.isSafeInteger(act.window?.start) && act.window.start <= at)
        .sort((left, right) => right.actId - left.actId);
      const pick = started[0] ?? withWindow.sort((left, right) => right.actId - left.actId)[0];
      return { ...pick, start: Number(pick.window?.start ?? serverOpenedAt) };
    }
    if (!calendar?.isActivityRunning) throw new GameError(5, 'Group-buy activity calendar is unavailable');
    const running = withWindow
      .filter(act => calendar.isActivityRunning(act.actId, null, activity, at))
      .sort((left, right) => right.actId - left.actId);
    if (!running.length) return null;
    return { ...running[0], start: Number(running[0].window?.start ?? serverOpenedAt) };
  }

  function periodOf(act) {
    return 'v' + act.version;
  }

  // Purchases are only ever written to recharge_orders by the local wallet, so
  // every count below is derived from paid order rows in this database.
  function purchaseSnapshot(db, roleId, giftIds) {
    const mine = new Map(), buyers = new Map();
    if (!giftIds.length) return { mine, buyers };
    const placeholders = giftIds.map(() => '?').join(',');
    const rows = db.prepare(`SELECT o.account_id, o.product_id, o.payload_json, w.role_id
      FROM recharge_orders o LEFT JOIN local_wallets w ON w.account_id=o.account_id
      WHERE o.product_id IN (${placeholders})`).all(...giftIds);
    const buyerSets = new Map();
    for (const row of rows) {
      const gift = Number(row.product_id);
      if (!Number.isSafeInteger(gift)) continue;
      const quantity = Number(parsePayload(row).buy_num ?? 1);
      const amount = Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1;
      if (!buyerSets.has(gift)) buyerSets.set(gift, new Set());
      buyerSets.get(gift).add(String(row.account_id));
      if (Number(row.role_id) === Number(roleId)) mine.set(gift, (mine.get(gift) ?? 0) + amount);
    }
    for (const [gift, set] of buyerSets) buyers.set(gift, set.size);
    return { mine, buyers };
  }

  // GroupBuyActData.GetCompensateGiftBuyCnt adds the configured head
  // compensations that have elapsed since the activity start; the server must
  // use the same rule or the displayed head count and the claim check diverge.
  function compensationHeads(giftId, start, at) {
    const rows = groupBuyTables.compensationByGift.get(Number(giftId)) ?? [];
    let heads = 0;
    for (const row of rows) {
      const offset = Number(row.compensate_time), count = Number(row.compensate_cnt);
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(count) || count < 0) {
        throw new GameError(5, 'Group-buy compensation configuration is invalid');
      }
      if (start + offset <= at) heads += count;
    }
    return heads;
  }

  function awardState(db, roleId, act, giftId) {
    const bits = Buffer.alloc(AWARD_STATE_WIDTH);
    const slots = new Set((groupBuyTables.awardsByGift.get(Number(giftId)) ?? [])
      .map(award => Number(award.tid) % AWARD_STATE_WIDTH));
    if (!slots.size) return bits;
    const claims = db.prepare(
      'SELECT task_id FROM activity_claims WHERE role_id=? AND act_id=? AND period=?'
    ).all(roleId, act.actId, periodOf(act));
    for (const claim of claims) {
      const slot = Number(claim.task_id) % AWARD_STATE_WIDTH;
      if (slots.has(slot)) setBit(bits, slot);
    }
    return bits;
  }

  function deadlineOf(act) {
    const end = Number(act.window?.end);
    return Number.isSafeInteger(end) && end > 0 ? end : 0;
  }

  function rechargeRecord(act, mine) {
    const refreshTime = deadlineOf(act);
    return {
      refresh_time: refreshTime,
      buy_num_list: [...mine.entries()]
        .filter(([, count]) => count > 0)
        .sort((left, right) => left[0] - right[0])
        .map(([rechargeId, buyNum]) => ({
          recharge_id: rechargeId,
          buy_num: buyNum,
          refresh_time: refreshTime,
          used_extra_times: 0
        }))
    };
  }

  function rolePayload(db, roleId, act) {
    const { mine } = purchaseSnapshot(db, roleId, versionGiftIds(act));
    return {
      act_id: act.actId,
      record: rechargeRecord(act, mine),
      award_record: groupGiftIds(act).map(giftId => ({
        recharge_tid: giftId,
        award_state: awardState(db, roleId, act, giftId).toString('base64')
      }))
    };
  }

  function applyLoginEntry(activity, act, rolePb) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    // Other stored activities stay untouched: the local calendar keeps every
    // seeded act visible in all-open mode, and a skin-only version of the same
    // feature is a separate activity the client already renders.
    activity.act_list = activity.act_list.filter(entry => {
      const actId = Number(entry?.state_data?.act_id);
      return actId !== act.actId;
    });
    activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
      const states = (group.states_data ?? []).filter(state => Number(state?.act_id) !== act.actId);
      return states.length ? [{ ...group, states_data: states }] : [];
    });
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === act.actId);
    if (!entry) {
      entry = { state_data: { act_id: act.actId }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = act.actId;
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (running) running.enter_time = act.start;
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: act.start });
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_group_buy_act_role', rolePb)).toString('base64');
    return entry;
  }

  function releaseEligiblePendingRewards() {
    const roleId = store.state().roleId;
    const hasPending = store.inspect(db => Boolean(db.prepare(
      "SELECT 1 FROM pending_rewards WHERE role_id=? AND status='pending' AND source_key LIKE 'group_buy_act:%' LIMIT 1"
    ).get(roleId)));
    if (!hasPending) return;
    try {
      const result = store.transaction((model, db) => releaseGrantablePendingRewards(
        model, db, tables, { sourcePrefix: SOURCE_PREFIX }
      ));
      if (result.released.length) log({ event: 'group_buy_pending_rewards_released', released: result.released });
    } catch (error) {
      log({ event: 'group_buy_pending_rewards_release_failed', error: error?.message ?? String(error) });
    }
  }

  releaseEligiblePendingRewards();

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    const act = selectActivity(activity, at);
    if (!act) return { actId: null, giftIds: [], start: null };
    const roleId = store.state().roleId;
    const rolePb = store.inspect(db => rolePayload(db, roleId, act));
    applyLoginEntry(activity, act, rolePb);
    const result = { actId: act.actId, giftIds: groupGiftIds(act), start: act.start };
    log({
      event: 'group_buy_login_synchronized',
      actId: act.actId,
      version: act.version,
      start: act.start,
      bought: rolePb.record.buy_num_list.map(row => row.recharge_id)
    });
    return result;
  }

  function serverData() {
    const at = currentSeconds();
    const act = selectActivity(loadActivity(), at);
    if (!act) throw new GameError(309, 'Group buy activity is not running');
    const roleId = store.state().roleId;
    const value = store.inspect(db => {
      const { buyers } = purchaseSnapshot(db, roleId, groupGiftIds(act));
      return {
        act_id: act.actId,
        record_list: groupGiftIds(act).map(giftId => ({
          gift_tid: giftId,
          buy_cnt: buyers.get(giftId) ?? 0,
          last_refresh_sec: act.start
        }))
      };
    });
    log({
      event: 'group_buy_server_data_sent',
      actId: act.actId,
      start: act.start,
      counts: value.record_list.map(row => [row.gift_tid, row.buy_cnt])
    });
    return { value, data: codec.pack('pb_group_buy_act_server', value) };
  }

  function claim(data) {
    const request = codec.unpack('pb_group_buy_act_group_award_req', data);
    const actId = Number(request.act_id), awardTid = Number(request.award_tid);
    if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(awardTid) || awardTid <= 0) {
      throw new GameError(1, 'Invalid group-buy award request');
    }
    const at = currentSeconds();
    const act = selectActivity(loadActivity(), at);
    if (!act || act.actId !== actId) throw new GameError(309, 'Group buy activity is not running');
    const award = groupBuyTables.awards.get(awardTid);
    if (!award) throw new GameError(5, 'Group-buy award is not configured');
    const giftId = Number(award.gift);
    if (!groupGiftIds(act).includes(giftId)) {
      throw new GameError(1, 'Group-buy award does not belong to the current activity version');
    }
    const gift = groupBuyTables.gifts.get(giftId);
    if (!gift || gift.is_group_gift !== true) throw new GameError(5, 'Group-buy gift is not configured');
    const headCnt = Number(award.head_cnt), rewardTid = Number(award.item_tid), rewardCount = Number(award.item_num);
    if (!Number.isSafeInteger(headCnt) || headCnt <= 0
      || !Number.isSafeInteger(rewardTid) || rewardTid <= 0
      || !Number.isSafeInteger(rewardCount) || rewardCount <= 0) {
      throw new GameError(5, 'Group-buy award configuration is invalid');
    }
    const slot = awardTid % AWARD_STATE_WIDTH;
    if (slot <= 0) throw new GameError(5, 'Group-buy award slot is invalid');

    const roleId = store.state().roleId;
    const period = periodOf(act);
    return store.transaction((model, db) => {
      const claimed = db.prepare(
        'SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?'
      ).get(roleId, actId, awardTid, period);
      if (claimed || hasBit(awardState(db, roleId, act, giftId), slot)) {
        // The client clears its clickable row after an empty successful reply,
        // so an already claimed tier is acknowledged without a second grant.
        const res = { changes: [] };
        log({ event: 'group_buy_award_duplicate_acknowledged', actId, awardTid, giftId, slot });
        return { value: { res }, data: codec.pack('pb_res_to_client', res) };
      }

      const { mine, buyers } = purchaseSnapshot(db, roleId, [giftId]);
      if (!(mine.get(giftId) > 0)) {
        throw new GameError(311, 'Group-buy gift must be purchased before its award can be claimed');
      }
      const heads = (buyers.get(giftId) ?? 0) + compensationHeads(giftId, act.start, at);
      if (heads < headCnt) {
        throw new GameError(311, 'Group-buy has not reached the required buyer count');
      }

      const partitioned = partitionGrantableResources([[rewardTid, rewardCount]], tables);
      const res = grantResources(model, partitioned.grantable, tables);
      const createdAt = new Date(at * 1000).toISOString();
      const sourceKey = [SOURCE_PREFIX.slice(0, -1), actId, awardTid, period].join(':');
      const insertPending = db.prepare(
        'INSERT INTO pending_rewards(role_id,source_key,item_tid,quantity,res_type,reason,status,created_at) VALUES (?,?,?,?,?,?,\'pending\',?)'
      );
      for (const reward of partitioned.pending) {
        insertPending.run(
          roleId, sourceKey, reward.tid, reward.quantity, reward.resType,
          reward.resType === null ? reward.reason : `${reward.reason}:${reward.resType}`, createdAt
        );
      }
      db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(roleId, actId, awardTid, period, createdAt);

      // Refresh the stored login block so a relogin starts from the committed
      // award bits without waiting for the client to rebuild them.
      const modules = new Map(model.state.modules.value);
      const stored = modules.get(ACTIVITY_LOGIN_MODULE);
      if (stored) {
        const bytes = rawBinary(stored);
        if (bytes.length) {
          try {
            const activity = codec.unpack('pb_act_login', bytes);
            applyLoginEntry(activity, act, rolePayload(db, roleId, act));
            modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
            model.state.modules.value = [...modules];
          } catch {
            log({ event: 'group_buy_login_refresh_skipped', actId });
          }
        }
      }
      log({
        event: 'group_buy_award_committed',
        actId, awardTid, giftId, slot, heads, headCnt, period,
        changes: res.changes.length,
        pending: partitioned.pending.map(reward => reward.tid)
      });
      return { value: { res }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  function giftConfig(productId, activityId = null) {
    const rechargeId = Number(productId);
    if (!Number.isSafeInteger(rechargeId) || rechargeId <= 0) return null;
    const product = tables.Recharge?.get(rechargeId);
    const config = groupBuyTables.gifts.get(rechargeId);
    if (!product || Number(product.type) !== GROUP_BUY_RECHARGE_TYPE || !config) return null;

    const act = selectActivity(loadActivity(), currentSeconds());
    if (!act || !versionGiftIds(act).includes(rechargeId)) return null;
    const requestedActivityId = activityId === undefined || activityId === null ? 0 : Number(activityId);
    if (requestedActivityId > 0 && requestedActivityId !== act.actId) return null;
    return { activityId: act.actId, version: act.version, config, product, act };
  }

  function isGiftRunning(productId) {
    return Boolean(giftConfig(productId));
  }

  function assertGiftAvailable(productId, activityId = null) {
    const gift = giftConfig(productId, activityId);
    if (!gift) throw new GameError(309, 'Group-buy activity gift is not running');
    return gift;
  }

  function giftPurchaseCount(productId, db = null, activityId = null) {
    if (!db) {
      const gift = giftConfig(productId, activityId);
      if (!gift) return 0;
      return store.inspect(database => giftPurchaseCount(productId, database, gift.activityId));
    }
    const gift = giftConfig(productId, activityId);
    if (!gift) return 0;
    const roleId = store.state().roleId;
    return purchaseSnapshot(db, roleId, versionGiftIds(gift.act)).mine.get(Number(productId)) ?? 0;
  }

  function purchaseExtra(productId) {
    if (!Number.isSafeInteger(rechargeHandle) || rechargeHandle <= 0) {
      throw new GameError(5, 'Group-buy recharge handle is not configured');
    }
    const gift = giftConfig(productId);
    if (!gift) return null;
    const roleId = store.state().roleId;
    const record = store.inspect(db => rechargeRecord(
      gift.act,
      purchaseSnapshot(db, roleId, versionGiftIds(gift.act)).mine
    ));
    return { flag: rechargeHandle, data: codec.pack('pb_recharge_limit_info', record) };
  }

  // RechargeMgr dispatches extra_ret_list entries by RechargeTable.Handle.tid.
  // Handle 93 maps to type 107, which is the group-buy gift family, so the
  // purchase reply carries the refreshed limit record for the activity screen.
  function augmentPurchaseResponse(data, productId) {
    if (!data?.length) return data;
    // A committed purchase must keep its success reply even if the activity
    // block cannot be rebuilt; the next login still exposes the order.
    try {
      const extra = purchaseExtra(productId);
      if (!extra) return data;
      const value = codec.unpack('res_buy_or_Rev_gift', data);
      value.extra_ret_list ??= [];
      if (value.extra_ret_list.some(entry => Number(entry.flag) === extra.flag)) return data;
      value.extra_ret_list.push(extra);
      return codec.pack('res_buy_or_Rev_gift', value);
    } catch (error) {
      log({ event: 'group_buy_purchase_sync_failed', productId, error: error?.message ?? String(error) });
      return data;
    }
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    rechargeHandle,
    supports: type => type === SERVER_DATA_TYPE || type === GROUP_AWARD_TYPE,
    currentActivity: (at = currentSeconds()) => selectActivity(loadActivity(), at),
    giftConfig,
    isGiftRunning,
    assertGiftAvailable,
    giftPurchaseCount,
    synchronizeLogin,
    serverData,
    claim,
    purchaseExtra,
    augmentPurchaseResponse,
    execute(type, data) {
      switch (type) {
        case SERVER_DATA_TYPE: return serverData();
        case GROUP_AWARD_TYPE: return claim(data);
        default: throw new GameError(5, 'Group-buy command is not implemented');
      }
    }
  };
}
