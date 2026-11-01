import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { grantResources, partitionGrantableResources, releaseGrantablePendingRewards } from './resources.mjs';

const MODULE_ID = 106;
const ACT_TYPE = 106;
const AWARD_STATE_WIDTH = 100;
const RUNNING_STATE_ID = 50;

function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Cumulative-recharge activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function rechargeDayIndex(timestampSeconds) {
  return Math.floor((timestampSeconds + 10800) / 86400);
}

function rechargeRangeTotal(modules, codec, activity, serverOpenedAt, activityMode) {
  const window = activityWindow(activity, serverOpenedAt);
  if (!window || !Number.isSafeInteger(window.start) || !Number.isSafeInteger(window.end) || window.end < window.start) {
    throw new GameError(5, 'Cumulative-recharge activity window is invalid');
  }
  const scheduledStartDay = rechargeDayIndex(window.start);
  const scheduledEndDay = rechargeDayIndex(window.end);
  const module = modules.get(19);
  if (!module) return { totalCents: 0, startDay, endDay };
  const login = codec.unpack('res_recharge_login', rawBinary(module));
  const records = login.recharge_record?.recent_record ?? [];
  if (!Array.isArray(records)) throw new GameError(5, 'Cumulative-recharge records are invalid');
  let totalCents = 0;
  for (const record of records) {
    const dayIndex = Number(record?.day_index);
    const amountCents = Number(record?.amount);
    if (!Number.isSafeInteger(dayIndex) || !Number.isSafeInteger(amountCents) || amountCents < 0) {
      throw new GameError(5, 'Cumulative-recharge record is invalid');
    }
    if (activityMode !== 'all-open' && (dayIndex < scheduledStartDay || dayIndex > scheduledEndDay)) continue;
    totalCents += amountCents;
    if (!Number.isSafeInteger(totalCents)) throw new GameError(5, 'Cumulative-recharge range total is invalid');
  }
  return {
    totalCents,
    startDay: activityMode === 'all-open' ? (records.length ? Math.min(...records.map(record => Number(record.day_index))) : null) : scheduledStartDay,
    endDay: activityMode === 'all-open' ? (records.length ? Math.max(...records.map(record => Number(record.day_index))) : null) : scheduledEndDay
  };
}

function recharges(module, codec) {
  if (!module) return { list: [] };
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_acc_recharge_list', bytes) : { list: [] };
}

function awardStateBytes(value) {
  const current = Buffer.from(String(value ?? ''), 'base64');
  const bits = Buffer.alloc(Math.max(AWARD_STATE_WIDTH, current.length));
  current.copy(bits);
  return bits;
}

export function createAccRechargeService({ store, codec, tables, calendar, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const activityMode = calendar?.mode ?? 'schedule';

  // The first implementation treated award_state as one byte per tier. The
  // client reads it through Core.BitBlock, so legacy claims need a one-time
  // repair before login exposes the module again.
  function repairAwardStates() {
    const state = store.state();
    const modules = new Map(state.modules.value);
    const module = modules.get(MODULE_ID);
    if (!module) return;
    const rows = recharges(module, codec);
    rows.list ??= [];
    const claims = store.inspect(db => db.prepare(
      'SELECT act_id,task_id,period FROM activity_claims WHERE role_id=?'
    ).all(state.roleId));
    if (!claims.length) return;

    const repairs = new Map();
    for (const row of rows.list) {
      const actId = Number(row.act_id);
      const act = tables.ActFrameAct?.get(actId);
      if (!act || Number(act.type) !== ACT_TYPE) continue;
      const period = 'v' + Number(act.version);
      const matching = claims.filter(claim => Number(claim.act_id) === actId && claim.period === period);
      if (!matching.length) continue;
      const bits = Buffer.alloc(AWARD_STATE_WIDTH);
      for (const claim of matching) {
        const bit = Number(claim.task_id) % AWARD_STATE_WIDTH;
        if (bit > 0) setBit(bits, bit);
      }
      if (!awardStateBytes(row.award_state).equals(bits)) repairs.set(actId, bits);
    }
    if (!repairs.size) return;

    const expectedModule = JSON.stringify(module);
    store.transaction((model, db) => {
      const freshModules = new Map(model.state.modules.value);
      if (JSON.stringify(freshModules.get(MODULE_ID) ?? null) !== expectedModule) {
        throw new GameError(1, 'Activity changed; retry claim-state repair');
      }
      const freshRows = recharges(freshModules.get(MODULE_ID), codec);
      freshRows.list ??= [];
      for (const row of freshRows.list) {
        const bits = repairs.get(Number(row.act_id));
        if (bits) row.award_state = bits.toString('base64');
      }
      freshModules.set(MODULE_ID, serializedBinary(codec.pack('pb_acc_recharge_list', freshRows)));
      model.state.modules.value = [...freshModules];
      log({ event: 'acc_recharge_award_state_repaired', actIds: [...repairs.keys()] });
      return { value: null, data: Buffer.alloc(0) };
    });
  }

  repairAwardStates();

  function releaseEligiblePendingRewards() {
    const hasPending = store.inspect(db => Boolean(db.prepare(
      "SELECT 1 FROM pending_rewards WHERE role_id=? AND status='pending' AND source_key LIKE 'acc_recharge:%' LIMIT 1"
    ).get(store.state().roleId)));
    if (!hasPending) return;
    try {
      const result = store.transaction((model, db) => releaseGrantablePendingRewards(
        model, db, tables, { sourcePrefix: 'acc_recharge:' }
      ));
      if (result.released.length) log({ event: 'acc_recharge_pending_rewards_released', released: result.released });
    } catch (error) {
      log({ event: 'acc_recharge_pending_rewards_release_failed', error: error?.message ?? String(error) });
    }
  }

  releaseEligiblePendingRewards();

  function synchronizeLogin(activity, at = Math.floor(Date.now() / 1000)) {
    if (!activity || typeof activity !== 'object') {
      throw new GameError(5, 'Activity login data is invalid');
    }
    const rows = recharges(new Map(store.state().modules.value).get(MODULE_ID), codec);
    rows.list ??= [];
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];

    const synced = [];
    for (const row of rows.list) {
      const actId = Number(row?.act_id);
      const act = tables.ActFrameAct?.get(actId);
      if (!act || Number(act.type) !== ACT_TYPE) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(actId, null, activity, at)) continue;

      let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === actId);
      if (!entry) {
        entry = { state_data: { act_id: actId }, module_login_data: '' };
        activity.act_list.push(entry);
      }
      entry.state_data ??= {};
      entry.state_data.act_id = actId;
      entry.state_data.cur_state_id = RUNNING_STATE_ID;
      entry.state_data.history_time ??= [];
      if (!Array.isArray(entry.state_data.history_time)) entry.state_data.history_time = [];
      let runningState = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
      if (!runningState) {
        const enterTime = activityMode === 'all-open'
          ? serverOpenedAt
          : Number(activityWindow(act, serverOpenedAt)?.start ?? at);
        runningState = { state_id: RUNNING_STATE_ID, enter_time: enterTime };
        entry.state_data.history_time.push(runningState);
      } else if (activityMode === 'all-open') {
        // Future-scheduled test activities still need a client date range that
        // includes the account's existing recharge records. The claim handler
        // intentionally sums account-wide records in all-open mode, so expose
        // that same range from server opening to now instead of the future
        // scheduled start (which made the progress display stay at zero).
        runningState.enter_time = serverOpenedAt;
      }
      const awardState = String(row.award_state ?? '');
      entry.module_login_data = wrapEtfBinary(codec.pack('pb_acc_recharge', {
        act_id: actId,
        award_state: awardState
      })).toString('base64');
      synced.push({ actId, awardState });
    }

    const syncedIds = new Set(synced.map(item => item.actId));
    const seen = new Set();
    activity.act_list = activity.act_list.filter(entry => {
      const actId = Number(entry?.state_data?.act_id);
      if (!syncedIds.has(actId)) return true;
      if (seen.has(actId)) return false;
      seen.add(actId);
      return true;
    });
    activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
      const states = (group.states_data ?? []).filter(state => !syncedIds.has(Number(state?.act_id)));
      return states.length ? [{ ...group, states_data: states }] : [];
    });
    log({
      event: 'acc_recharge_login_synchronized',
      actIds: synced.map(item => item.actId),
      awardedStates: synced.map(item => Buffer.from(item.awardState, 'base64').subarray(0, 4).toString('hex'))
    });
    return { activityIds: synced.map(item => item.actId) };
  }

  function execute(data) {
    const request = codec.unpack('pb_acc_recharge_award_req', data);
    const actId = Number(request.act_id);
    const awardTid = Number(request.award_tid);
    if (!Number.isSafeInteger(actId) || !Number.isSafeInteger(awardTid) || actId <= 0 || awardTid <= 0) {
      throw new GameError(1, 'Invalid cumulative-recharge claim');
    }

    const act = tables.ActFrameAct?.get(actId);
    if (!act || Number(act.type) !== ACT_TYPE) throw new GameError(5, 'Activity is not a cumulative-recharge activity');
    const award = tables.AccRechargeAward?.get(awardTid);
    if (!award || Number(award.version) !== Number(act.version)) throw new GameError(1, 'Award does not belong to the current activity version');
    const slot = awardTid % AWARD_STATE_WIDTH;
    if (slot < 1) throw new GameError(5, 'Cumulative-recharge award slot is invalid');

    const modules = new Map(store.state().modules.value);
    const expectedModule = JSON.stringify(modules.get(MODULE_ID) ?? null);
    return store.transaction((model, db) => {
      const freshModules = new Map(model.state.modules.value);
      if (JSON.stringify(freshModules.get(MODULE_ID) ?? null) !== expectedModule) throw new GameError(1, 'Activity changed; retry claim');

      const dataRows = recharges(freshModules.get(MODULE_ID), codec);
      dataRows.list ??= [];
      let entry = dataRows.list.find(row => Number(row.act_id) === actId);
      if (!entry) {
        entry = { act_id: actId, award_state: '' };
        dataRows.list.push(entry);
      }
      const awardState = awardStateBytes(entry.award_state);
      const period = 'v' + act.version;
      const existingClaim = db.prepare(
        'SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?'
      ).get(model.state.roleId, actId, awardTid, period);
      if (existingClaim || hasBit(awardState, slot)) {
        // AccRechargeActMgr sets the item's in-memory isAwarded flag before
        // parsing changes. An empty successful response therefore clears old
        // clickable rows without issuing the reward a second time.
        if (!hasBit(awardState, slot)) {
          setBit(awardState, slot);
          entry.award_state = awardState.toString('base64');
          const repaired = new Map(model.state.modules.value);
          repaired.set(MODULE_ID, serializedBinary(codec.pack('pb_acc_recharge_list', dataRows)));
          model.state.modules.value = [...repaired];
        }
        const res = { changes: [] };
        log({ event: 'acc_recharge_duplicate_acknowledged', actId, awardTid, slot, claimRecord: Boolean(existingClaim) });
        return { value: { res }, data: codec.pack('pb_res_to_client', res) };
      }

      // The client compares this activity's inclusive day range from the recharge
      // records, and both record amounts and award.acc_cnt are stored in cents.
      const { totalCents, startDay, endDay } = rechargeRangeTotal(freshModules, codec, act, serverOpenedAt, activityMode);
      const requiredCents = Number(award.acc_cnt);
      if (!Number.isSafeInteger(requiredCents) || requiredCents <= 0) {
        throw new GameError(5, 'Cumulative-recharge threshold is invalid');
      }
      if (totalCents < requiredCents) throw new GameError(311, 'Cumulative recharge amount is insufficient');

      setBit(awardState, slot);
      entry.award_state = awardState.toString('base64');
      const partitioned = partitionGrantableResources(award.award, tables);
      const res = grantResources(model, partitioned.grantable, tables);
      const nextModule = serializedBinary(codec.pack('pb_acc_recharge_list', dataRows));
      const updated = new Map(model.state.modules.value);
      updated.set(MODULE_ID, nextModule);
      model.state.modules.value = [...updated];
      const createdAt = new Date().toISOString();
      const sourceKey = ['acc_recharge', actId, awardTid, period].join(':');
      const insertPending = db.prepare(
        'INSERT INTO pending_rewards(role_id,source_key,item_tid,quantity,res_type,reason,status,created_at) VALUES (?,?,?,?,?,?,\'pending\',?)'
      );
      for (const reward of partitioned.pending) {
        insertPending.run(
          model.state.roleId, sourceKey, reward.tid, reward.quantity, reward.resType,
          reward.resType === null ? reward.reason : `${reward.reason}:${reward.resType}`, createdAt
        );
      }
      db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(
        model.state.roleId, actId, awardTid, period, createdAt
      );
      log({
        event: 'acc_recharge_claim_committed', actId, awardTid, total: totalCents, startDay, endDay, slot,
        changes: res.changes.length, pending: partitioned.pending.map(reward => reward.tid)
      });
      return { value: { res }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  return { supports: type => type === 98620, execute, synchronizeLogin };
}
