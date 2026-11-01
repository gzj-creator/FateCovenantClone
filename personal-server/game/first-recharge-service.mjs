import { rawBinary } from '../protocol/game-codec.mjs';
import { setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeClaimKey, roleLoginDayCount } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const COMMAND = 16001;
const MODULE_ID = 51;

function totalRechargeCents(modules, codec) {
  const module = modules.get(19);
  if (!module) return 0;
  return Number(codec.unpack('res_recharge_login', rawBinary(module)).total_amount ?? 0);
}

function claimedDays(db, roleId, grade) {
  const prefix = rechargeClaimKey('first_recharge', grade);
  const rows = db.prepare(
    "SELECT claim_key FROM reward_claims WHERE role_id=? AND claim_type='first_recharge' AND claim_key LIKE ?"
  ).all(roleId, prefix + ':%');
  return new Set(rows.map(row => Number(String(row.claim_key).split(':').at(-1))).filter(Number.isSafeInteger));
}

function gradeList(db, roleId, tables) {
  return [...tables.FirstRecharge.values()].map(config => {
    const days = claimedDays(db, roleId, Number(config.tid));
    let rewardStates = Buffer.alloc(0);
    for (const day of days) rewardStates = setBit(rewardStates, day);
    return { grade: Number(config.tid), reward_states: rewardStates };
  });
}

export function createFirstRechargeService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function execute() {
    log({ event: 'first_recharge_execute_entry' });
    const at = Math.floor(Number(now()) / 1000);
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const totalCents = totalRechargeCents(modules, codec);
      if (!Number.isSafeInteger(totalCents) || totalCents < 0) throw new GameError(5, 'Recharge total is invalid');
      const loginDay = roleLoginDayCount(model.state.createdAt, at);
      let selected = null;

      for (const config of tables.FirstRecharge.values()) {
        const grade = Number(config.tid);
        const requiredCents = Number(config.need_amount);
        if (!Number.isSafeInteger(requiredCents) || requiredCents <= 0) throw new GameError(5, 'First-recharge threshold is invalid');
        if (totalCents < requiredCents) continue;
        const rewards = config.rewards ?? [], days = config.days ?? [];
        if (rewards.length !== days.length) throw new GameError(5, 'First-recharge reward days and awards differ');
        for (let index = 0; index < days.length; index++) {
          const day = Number(days[index]);
          if (!Number.isSafeInteger(day) || day <= 0 || loginDay < day) continue;
          const key = rechargeClaimKey('first_recharge', grade, day);
          if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'first_recharge', key)) continue;
          const awardTid = Number(rewards[index]);
          const award = tables.FirstRechargeAward.get(awardTid);
          if (!award || !Array.isArray(award.award) || !award.award.length) {
            throw new GameError(5, 'First-recharge award is not configured');
          }
          selected = { grade, day, key, award };
          break;
        }
        if (selected) break;
      }

      if (!selected) throw new GameError(311, 'No first-recharge reward is available');
      const res = grantResources(model, selected.award.award.map(([tid, count]) => [Number(tid), Number(count)]), tables, { codec });
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(
        model.state.roleId, 'first_recharge', selected.key, new Date(at * 1000).toISOString()
      );
      const list = gradeList(db, model.state.roleId, tables);
      const value = { res, grade_list: list };
      log({ event: 'first_recharge_claim_committed', grade: selected.grade, day: selected.day, totalCents, loginDay, changes: res.changes.length });
      return { value, data: codec.pack('pb_res_rev_first_recharge_reward', value) };
    });
  }

  return { supports: type => type === COMMAND, execute, moduleId: MODULE_ID };
}
