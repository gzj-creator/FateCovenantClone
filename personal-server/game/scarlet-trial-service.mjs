import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readScarletTrialTables, rewardPairs } from '../config/dungeon-activity-tables.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, ensureTables, fail, integer, isoSeconds,
  readActivityState, recordClaim, resPacket, snapshot, unixSeconds, writeActivityState, claimed
} from './dungeon-activity-shared.mjs';

// ScarletTrialCmd 89101 task_award and 89102 select_stone. Both requests are
// ETF; 89102 is reply-less on the wire.
export const SCARLET_TRIAL_COMMANDS = [89101, 89102];
const ACTIVITY = 'scarlet_trial';
const CLAIM_TASK = 'scarlet_trial_task';

function defaults() {
  return { totalDamage: 0, dayMaxDamage: 0, receivedTasks: [], stones: [] };
}

// Damage is derived from the battle engine event log: every damage event lists
// the resolved harms, and their values are the reported hit damage.
export function damageFromSimulation(simulation) {
  if (!simulation || !Array.isArray(simulation.events)) fail(CODE_INVALID, 'Scarlet trial requires a battle engine simulation');
  let total = 0;
  for (const event of simulation.events) {
    if (!event || event.kind !== 'damage' || !Array.isArray(event.harms)) continue;
    for (const harm of event.harms) total += Math.max(0, Number(harm?.value ?? 0));
  }
  if (!Number.isSafeInteger(total) || total < 0) fail(CODE_INVALID, 'Scarlet trial damage could not be derived');
  return total;
}

export function createScarletTrialService({
  store, codec, tables = readScarletTrialTables(), gameTables = null, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.tasks?.size) throw new Error('Scarlet trial configuration is unavailable');
  const allowedStone = Number(tables.const?.source_stone ?? 0);

  function stateOf(db, roleId) {
    const state = readActivityState(db, roleId, ACTIVITY, defaults());
    if (!Array.isArray(state.receivedTasks)) state.receivedTasks = [];
    if (!Array.isArray(state.stones)) state.stones = [];
    return state;
  }

  function dataOf(state, nowMs) {
    return {
      day_max_damage: state.dayMaxDamage,
      turn_max_damage: state.totalDamage,
      received_tasks: state.receivedTasks,
      timestamp: unixSeconds(nowMs),
      source_stone: state.stones.map(entry => ({ pos: entry.pos, tid: entry.tid })),
      version: 0
    };
  }

  function supports(type) { return SCARLET_TRIAL_COMMANDS.includes(type); }

  // Seam for the fight pipeline: the maximum and cumulative damage come from
  // the simulation, never from a client value.
  async function settleFight({ simulation }) {
    const damage = damageFromSimulation(simulation);
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = stateOf(db, model.state.roleId);
      state.totalDamage = Math.max(state.totalDamage, damage);
      state.dayMaxDamage = Math.max(state.dayMaxDamage, damage);
      writeActivityState(db, model.state.roleId, ACTIVITY, state, now());
      log({ event: 'scarlet_trial_fight_settled', damage });
      return { value: { damage, totalDamage: state.totalDamage } };
    });
  }

  async function taskAward(input) {
    const raw = typeof input === 'object' && input !== null ? (input.tid ?? input.task_tid) : input;
    const taskTid = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid scarlet trial task id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId);
      const row = tables.tasks.get(taskTid);
      if (!row) fail(CODE_STATE, 'Scarlet trial task configuration is missing');
      const required = Number(row.damage ?? 0);
      if (!Number.isSafeInteger(required) || required < 0) fail(CODE_STATE, 'Scarlet trial task damage configuration is invalid');
      if (state.totalDamage < required) fail(CODE_STATE, 'Scarlet trial task damage requirement is not reached');
      if (state.receivedTasks.includes(taskTid)) fail(CODE_LIMIT, 'Scarlet trial task was already received');
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_TASK, String(taskTid))) fail(CODE_LIMIT, 'Scarlet trial task was already received');
      const ids = Array.isArray(row.award) ? row.award : [], counts = Array.isArray(row.award_count) ? row.award_count : [];
      if (ids.length !== counts.length) fail(CODE_STATE, 'Scarlet trial task reward configuration is invalid');
      const awards = rewardPairs(ids.map((tid, index) => [tid, counts[index]]), 'Scarlet trial task');
      if (!awards.length) fail(CODE_STATE, 'Scarlet trial task reward configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_TASK, String(taskTid), isoSeconds(nowMs));
      state.receivedTasks = [...state.receivedTasks, taskTid];
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'scarlet_trial_task_committed', taskTid, changes: reward.changes.length });
      return {
        value: { taskTid, changes: reward.changes },
        data: codec.pack('pb_scarlet_trial_award_back', { scarlet_trial_data: dataOf(state, nowMs), res_change: resPacket(reward.changes) })
      };
    });
  }

  // 89102 has no reply frame. The selected stone must be the configured
  // source_stone tid; an unrecovered stone table is a hard failure.
  async function selectStone(input) {
    // ETF lists arrive as list terms; normalise both the plain array and the
    // Erlang list wrapper the decoder produces.
    const list = Array.isArray(input) ? input
      : (input && typeof input === 'object' && input.pos === undefined && input.tid === undefined && '0' in input
        ? [input[0], input[1]] : null);
    const pos = integer(
      list ? list[0] : (typeof input === 'object' && input !== null ? (input.pos ?? input.index) : input),
      1, 6, 'Invalid scarlet trial stone position'
    );
    const tid = integer(
      list ? list[1] : (typeof input === 'object' && input !== null ? input.tid : input),
      1, Number.MAX_SAFE_INTEGER, 'Invalid scarlet trial stone id'
    );
    if (!Number.isSafeInteger(allowedStone) || allowedStone <= 0 || allowedStone !== tid) {
      fail(CODE_STATE, 'Scarlet trial source stone configuration is missing');
    }
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId);
      state.stones = [...state.stones.filter(entry => entry.pos !== pos), { pos, tid }];
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'scarlet_trial_stone_selected', pos, tid });
      return { noReply: true, value: { pos, tid } };
    });
  }

  async function execute(type, input) {
    if (type === 89101) return taskAward(input);
    if (type === 89102) return selectStone(input);
    fail(CODE_INVALID, 'Unsupported scarlet trial command');
  }

  function state(roleId) {
    return store.inspect(db => { ensureTables(db); return stateOf(db, roleId); });
  }

  return { supports, execute, taskAward, selectStone, settleFight, state, dataOf, snapshotState: snapshot };
}
