import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeClaimKey, rechargeDayIndex, rechargeServerDayNumber, requireRechargeRequestTuple } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const MODULE_ID = 149;
const SELECT_COMMAND = 88301;
const CLAIM_COMMAND = 88302;

function readInfo(module, codec) {
  if (!module) throw new GameError(5, 'Recharge bonus module is unavailable');
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_recharge_bonus', bytes) : { tid: 0, group: 0, award_bin: '', last_recharge_day: 0, acc_recharge_days: 0 };
}

function writeInfo(modules, info, codec) {
  modules.set(MODULE_ID, serializedBinary(codec.pack('pb_recharge_bonus', info)));
}

function currentRound(tables, serverOpenedAt, atSeconds) {
  const serverDay = rechargeServerDayNumber(serverOpenedAt, atSeconds);
  return [...tables.RechargeBonus.values()]
    .filter(row => Number(row.open_day) <= serverDay)
    .sort((a, b) => Number(b.open_day) - Number(a.open_day) || Number(b.tid) - Number(a.tid))[0] ?? null;
}

function resetInfo() {
  return { tid: 0, group: 0, award_bin: '', last_recharge_day: 0, acc_recharge_days: 0 };
}

export function createRechargeBonusService({ store, codec, tables, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const seconds = () => Math.floor(Number(now()) / 1000);
  const roundAt = at => currentRound(tables, Number(calendar?.serverOpenedAt ?? store.serverOpenedAt), at);

  function synchronizeRound(model, modules, at = seconds()) {
    const info = readInfo(modules.get(MODULE_ID), codec);
    const round = roundAt(at);
    if (!Number(info.tid)) return { info, round, changed: false };
    if (round && Number(info.tid) === Number(round.tid)) return { info, round, changed: false };
    const reset = resetInfo();
    writeInfo(modules, reset, codec);
    return { info: reset, round, changed: true };
  }

  function select(value) {
    const [group] = requireRechargeRequestTuple(value, 1, 'Recharge bonus group');
    const at = seconds();
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const { info, round } = synchronizeRound(model, modules, at);
      if (!round) throw new GameError(309, 'Recharge bonus is not open');
      if (!(round.group ?? []).map(Number).includes(group) || !tables.RechargeBonusGroup.has(group)) {
        throw new GameError(5, 'Recharge bonus group is not configured for the current round');
      }
      if (Number(info.group) && Number(info.group) !== group) throw new GameError(1, 'Recharge bonus group is already selected');
      if (!Number(info.group)) {
        info.tid = Number(round.tid);
        info.group = group;
        info.award_bin = '';
        info.last_recharge_day = 0;
        info.acc_recharge_days = 0;
        writeInfo(modules, info, codec);
      }
      model.state.modules.value = [...modules];
      log({ event: 'recharge_bonus_group_selected', round: Number(round.tid), group, duplicate: Number(info.tid) === Number(round.tid) && Number(info.group) === group && info._selectedBefore === true });
      return { value: info, data: codec.pack('pb_recharge_bonus', info) };
    });
  }

  // RechargeBonusMgr.OnRecharge increments once per distinct 05:00 recharge day
  // after a group has been selected. A new round starts at zero and requires a
  // fresh group selection.
  function recordRecharge({ model, modules, at }) {
    const { info, round, changed } = synchronizeRound(model, modules, at);
    if (!round || Number(info.tid) !== Number(round.tid) || !Number(info.group)) return { changed, incremented: false, info };
    const day = rechargeDayIndex(at);
    if (Number(info.last_recharge_day) === day) return { changed, incremented: false, info };
    info.last_recharge_day = day;
    info.acc_recharge_days = Number(info.acc_recharge_days ?? 0) + 1;
    writeInfo(modules, info, codec);
    return { changed: true, incremented: true, info };
  }

  function synchronize() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const result = synchronizeRound(model, modules, seconds());
      if (result.changed) {
        model.state.modules.value = [...modules];
        log({ event: 'recharge_bonus_round_reset', round: result.round ? Number(result.round.tid) : null });
      }
      return result;
    });
  }

  function claim(value) {
    const [requestedDay] = requireRechargeRequestTuple(value, 1, 'Recharge bonus day');
    const at = seconds();
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const { info, round } = synchronizeRound(model, modules, at);
      if (!round || Number(info.tid) !== Number(round.tid) || !Number(info.group)) throw new GameError(309, 'Recharge bonus group is not selected');
      const actualDays = Number(info.acc_recharge_days ?? 0);
      const slot = actualDays % 100;
      if (!actualDays || slot <= 0 || requestedDay !== slot) throw new GameError(1, 'Recharge bonus day is stale');
      const awardTid = Number(info.group) * 100 + slot;
      const award = tables.RechargeBonusAward.get(awardTid);
      if (!award || Number(award.belong_group) !== Number(info.group)) throw new GameError(5, 'Recharge bonus award is not configured');
      const bits = Buffer.from(info.award_bin ?? '', 'base64');
      if (hasBit(bits, slot)) throw new GameError(310, 'Reward already claimed');
      const key = rechargeClaimKey('recharge_bonus', round.tid, info.group, actualDays);
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'recharge_bonus', key)) {
        throw new GameError(310, 'Reward already claimed');
      }
      const res = grantResources(model, (award.award_list ?? []).map(([tid, count]) => [Number(tid), Number(count)]), tables, { codec });
      info.award_bin = setBit(bits, slot).toString('base64');
      writeInfo(modules, info, codec);
      model.state.modules.value = [...modules];
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(
        model.state.roleId, 'recharge_bonus', key, new Date(at * 1000).toISOString()
      );
      const response = { info, res };
      log({ event: 'recharge_bonus_claim_committed', round: Number(round.tid), group: Number(info.group), day: actualDays, awardTid, changes: res.changes.length });
      return { value: response, data: codec.pack('pb_recharge_bonus_back', response) };
    });
  }

  return {
    supports: type => type === SELECT_COMMAND || type === CLAIM_COMMAND,
    execute(type, value) { return type === SELECT_COMMAND ? select(value) : claim(value); },
    recordRecharge,
    synchronize,
    moduleId: MODULE_ID
  };
}
