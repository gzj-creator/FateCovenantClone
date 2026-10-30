import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const MODULE_ID = 166;
const CLAIM_ACT_ID = 92001;
const CLAIM_PERIOD = 'hundred_acc';

function rechargeTotal(modules, codec) {
  const module = modules.get(19);
  if (!module) return 0;
  return Number(codec.unpack('res_recharge_login', rawBinary(module)).total_amount ?? 0);
}

function activityData(module, codec) {
  if (!module) return { reward_list: [] };
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_hundred_acc', bytes) : { reward_list: [] };
}

function dayIndex(timestampSeconds) {
  return Math.floor((timestampSeconds + 10800) / 86400);
}

function normalizeGroups(value) {
  const rows = Array.isArray(value) ? value : [value];
  if (!rows.length || rows.length > 10) throw new GameError(1, 'Invalid cumulative-recharge claim list');
  const groups = rows.map(Number);
  if (groups.some(group => !Number.isSafeInteger(group) || group <= 0) || new Set(groups).size !== groups.length) {
    throw new GameError(1, 'Invalid cumulative-recharge claim list');
  }
  return groups;
}

export function createHundredAccService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function execute(value) {
    const groups = normalizeGroups(value);
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const data = activityData(modules.get(MODULE_ID), codec);
      data.reward_list ??= [];
      const claimedGroups = new Set(data.reward_list.map(row => Number(row.group_id)));
      const total = rechargeTotal(modules, codec);
      const awards = [];

      for (const groupId of groups) {
        const group = tables.HundredAccGroup?.get(groupId);
        const reward = tables.HundredAccReward?.get(groupId);
        if (!group || !reward || Number(reward.acc_group) !== groupId) {
          throw new GameError(5, 'Cumulative-recharge reward is not configured');
        }
        if (claimedGroups.has(groupId) || db.prepare(
          'SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?'
        ).get(model.state.roleId, CLAIM_ACT_ID, groupId, CLAIM_PERIOD)) {
          throw new GameError(310, 'Reward already claimed');
        }
        const requiredCents = Number(group.amount) * 100;
        if (!Number.isSafeInteger(requiredCents) || requiredCents <= 0) {
          throw new GameError(5, 'Cumulative-recharge tier is invalid');
        }
        if (total < requiredCents) throw new GameError(311, 'Cumulative recharge amount is insufficient');
        awards.push(...(reward.reward ?? []));
      }

      const claimedAt = Math.floor(now() / 1000);
      const created = new Date(claimedAt * 1000).toISOString();
      for (const groupId of groups) {
        data.reward_list.push({
          group_id: groupId,
          day_index: dayIndex(claimedAt),
          reward_id_list: [groupId],
          reward_time: String(claimedAt)
        });
        db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(
          model.state.roleId, CLAIM_ACT_ID, groupId, CLAIM_PERIOD, created
        );
      }
      data.reward_list.sort((a, b) => Number(a.group_id) - Number(b.group_id));
      if (Number(data.start_time ?? 0) <= 0) data.start_time = String(claimedAt);

      const res = grantResources(model, awards, tables);
      modules.set(MODULE_ID, serializedBinary(codec.pack('pb_hundred_acc', data)));
      model.state.modules.value = [...modules];
      log({ event: 'hundred_acc_claim_committed', groups, total, changes: res.changes.length });
      return { value: { res, groups, total }, data: codec.pack('pb_res_to_client', res) };
    });
  }

  return { supports: type => type === CLAIM_ACT_ID, execute };
}
