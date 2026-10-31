import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';

const MODULE_ID = 106;
const ACT_TYPE = 106;
const AWARD_STATE_WIDTH = 100;

function rechargeDayIndex(timestampSeconds) {
  return Math.floor((timestampSeconds + 10800) / 86400);
}

function rechargeRangeTotal(modules, codec, activity, serverOpenedAt) {
  const window = activityWindow(activity, serverOpenedAt);
  if (!window || !Number.isSafeInteger(window.start) || !Number.isSafeInteger(window.end) || window.end < window.start) {
    throw new GameError(5, 'Cumulative-recharge activity window is invalid');
  }
  const startDay = rechargeDayIndex(window.start);
  const endDay = rechargeDayIndex(window.end);
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
    if (dayIndex < startDay || dayIndex > endDay) continue;
    totalCents += amountCents;
    if (!Number.isSafeInteger(totalCents)) throw new GameError(5, 'Cumulative-recharge range total is invalid');
  }
  return { totalCents, startDay, endDay };
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
      if (hasBit(awardState, slot)) throw new GameError(310, 'Reward already claimed');

      // The client compares this activity's inclusive day range from the recharge
      // records, and both record amounts and award.acc_cnt are stored in cents.
      const { totalCents, startDay, endDay } = rechargeRangeTotal(freshModules, codec, act, serverOpenedAt);
      const requiredCents = Number(award.acc_cnt);
      if (!Number.isSafeInteger(requiredCents) || requiredCents <= 0) {
        throw new GameError(5, 'Cumulative-recharge threshold is invalid');
      }
      if (totalCents < requiredCents) throw new GameError(311, 'Cumulative recharge amount is insufficient');
      if (db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?').get(model.state.roleId, actId, awardTid, 'v' + act.version)) {
        throw new GameError(310, 'Reward already claimed');
      }

      setBit(awardState, slot);
      entry.award_state = awardState.toString('base64');
      const res = grantResources(model, award.award, tables);
      const nextModule = serializedBinary(codec.pack('pb_acc_recharge_list', dataRows));
      const updated = new Map(model.state.modules.value);
      updated.set(MODULE_ID, nextModule);
      model.state.modules.value = [...updated];
      db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(
        model.state.roleId, actId, awardTid, 'v' + act.version, new Date().toISOString()
      );
      log({ event: 'acc_recharge_claim_committed', actId, awardTid, total: totalCents, startDay, endDay, slot, changes: res.changes.length });
      return { value: { res }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  return { supports: type => type === 98620, execute };
}
