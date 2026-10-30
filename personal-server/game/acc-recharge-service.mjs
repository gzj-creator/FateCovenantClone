import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const MODULE_ID = 106;
const ACT_TYPE = 106;
const AWARD_STATE_WIDTH = 100;

function rechargeTotal(modules, codec) {
  const module = modules.get(19);
  if (!module) return 0;
  const login = codec.unpack('res_recharge_login', rawBinary(module));
  return Number(login.total_amount ?? 0);
}

function recharges(module, codec) {
  if (!module) return { list: [] };
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_acc_recharge_list', bytes) : { list: [] };
}

export function createAccRechargeService({ store, codec, tables, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

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
      const current = Buffer.from(String(entry.award_state ?? ''), 'base64');
      const awardState = Buffer.alloc(Math.max(AWARD_STATE_WIDTH, current.length));
      current.copy(awardState);
      if (awardState[slot - 1] > 0) throw new GameError(310, 'Reward already claimed');

      const count = rechargeTotal(freshModules, codec);
      if (count < Number(award.acc_cnt)) throw new GameError(311, 'Cumulative recharge amount is insufficient');
      if (db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?').get(model.state.roleId, actId, awardTid, 'v' + act.version)) {
        throw new GameError(310, 'Reward already claimed');
      }

      awardState[slot - 1] = 1;
      entry.award_state = awardState.toString('base64');
      const res = grantResources(model, award.award, tables);
      const nextModule = serializedBinary(codec.pack('pb_acc_recharge_list', dataRows));
      const updated = new Map(model.state.modules.value);
      updated.set(MODULE_ID, nextModule);
      model.state.modules.value = [...updated];
      db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(
        model.state.roleId, actId, awardTid, 'v' + act.version, new Date().toISOString()
      );
      log({ event: 'acc_recharge_claim_committed', actId, awardTid, total: count, slot, changes: res.changes.length });
      return { value: { res }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  return { supports: type => type === 98620, execute };
}
