import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readRedCliffTables, rewardPairs } from '../config/dungeon-activity-tables.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, dayKey, ensureTables, fail, integer, isoSeconds,
  optionalInteger, readActivityState, recordClaim, resPacket, snapshot, unixSeconds,
  writeActivityState, claimed, battleWon
} from './dungeon-activity-shared.mjs';

// RedCliffCmd (module 17): 55001 box, 55002 buff, 55003 reset, 55004 refresh.
// Every request is ETF encoded by the client (RedCliffCmd.lua uses EncodeErl
// for all four).
export const RED_CLIFF_COMMANDS = [55001, 55002, 55003, 55004];
const ACTIVITY = 'red_cliff';
const CLAIM_BOX = 'red_cliff_box';
const CLAIM_BUFF = 'red_cliff_buff';
const CLAIM_CLEAR = 'red_cliff_clear';
const CLAIM_RESET = 'red_cliff_reset';

function defaults(nowMs) {
  return {
    curLevel: 0,
    stars: 0,
    resetTimes: 0,
    lastResetSecond: unixSeconds(nowMs),
    refreshCount: 0,
    refreshDay: dayKey(nowMs),
    assembled: [],
    selected: [],
    challengePoints: 0,
    lastChallengePoints: 0
  };
}

function levelRewards(tables, level) {
  const row = tables.levels.get(Number(level));
  if (!row) fail(CODE_STATE, 'Red cliff level configuration is missing: ' + level);
  return rewardPairs(row.res_list, 'Red cliff level');
}

export function createRedCliffService({
  store, codec, tables = readRedCliffTables(), gameTables = null, now = Date.now, random = Math.random, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.levels?.size) throw new Error('Red cliff configuration is unavailable');
  const maxLevel = Math.max(...tables.levels.keys());
  const minLevel = Math.min(...tables.levels.keys());
  const dailyRefreshLimit = Math.max(0, Number(tables.const?.refresh_fight ?? 0));
  const buffPool = [...tables.buffers.keys()].sort((a, b) => a - b);
  const candidateCount = Math.max(1, Math.min(3, buffPool.length));

  function stateOf(db, roleId, nowMs) {
    const state = readActivityState(db, roleId, ACTIVITY, defaults(nowMs));
    const today = dayKey(nowMs);
    if (state.refreshDay !== today) { state.refreshDay = today; state.refreshCount = 0; }
    for (const field of ['assembled', 'selected']) {
      if (!Array.isArray(state[field])) state[field] = [];
      state[field] = state[field].map(Number).filter(Number.isSafeInteger);
    }
    return state;
  }

  function dataOf(state, nowMs) {
    return {
      cur_level: state.curLevel,
      last_reset_second: state.lastResetSecond,
      assemble_buff_list: state.assembled,
      select_buff_list: state.selected,
      box_level_id: state.curLevel,
      star_count: state.stars,
      refresh_count: state.refreshCount,
      challenge_points: state.challengePoints,
      cross_level: [...tables.levels.keys()].filter(tid => tid <= state.curLevel).sort((a, b) => a - b),
      reset_times: state.resetTimes,
      last_challenge_points: state.lastChallengePoints,
      award_list: []
    };
  }

  function dataToClient(state, nowMs) {
    return { red_cliff_data: dataOf(state, nowMs), snapshot_list: [] };
  }

  function supports(type) { return RED_CLIFF_COMMANDS.includes(type); }

  // Seam for the shared fight pipeline. Only a real simulateBattle result that
  // won may advance the run; the client cannot report progress through these
  // four commands.
  async function clearLevel({ level, simulation }) {
    const target = integer(level, 1, maxLevel, 'Invalid red cliff level');
    const won = battleWon(simulation);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (!won) {
        log({ event: 'red_cliff_level_lost', level: target });
        return { value: { level: target, won: false }, data: codec.pack('pb_red_cliff_data_to_client', dataToClient(state, nowMs)) };
      }
      levelRewards(tables, target);
      const nextLevel = state.curLevel === 0 ? minLevel : state.curLevel + 1;
      if (target !== nextLevel) fail(CODE_STATE, 'Red cliff level is not the next challenge level');
      if (!claimed(db, model.state.roleId, ACTIVITY, CLAIM_CLEAR, String(target))) {
        recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_CLEAR, String(target), isoSeconds(nowMs));
      }
      state.curLevel = Math.max(state.curLevel, target);
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'red_cliff_level_cleared', level: target });
      return { value: { level: target, won: true }, data: codec.pack('pb_red_cliff_data_to_client', dataToClient(state, nowMs)) };
    });
  }

  async function box(input) {
    const requested = optionalInteger(
      typeof input === 'object' && input !== null ? (input.level ?? input.level_id ?? input.tid) : input,
      1, maxLevel, 'Invalid red cliff box level'
    );
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const level = requested ?? state.curLevel;
      if (level < minLevel || level > state.curLevel) fail(CODE_STATE, 'Red cliff box level is not cleared');
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_BOX, String(level))) fail(CODE_LIMIT, 'Red cliff box was already received');
      const awards = levelRewards(tables, level);
      if (!awards.length) fail(CODE_STATE, 'Red cliff box reward configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_BOX, String(level), isoSeconds(nowMs));
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'red_cliff_box_committed', level, changes: reward.changes.length });
      return {
        value: { level, changes: reward.changes },
        data: codec.pack('pb_red_cliff_box_result', {
          data_to_client: dataToClient(state, nowMs),
          res_change: resPacket(reward.changes)
        })
      };
    });
  }

  async function buff(input) {
    const raw = typeof input === 'object' && input !== null ? (input.tid ?? input.buff_tid ?? input.buff_id) : input;
    const tid = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid red cliff buff id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (!tables.buffers.has(tid)) fail(CODE_STATE, 'Red cliff buff configuration is missing');
      if (!state.selected.includes(tid)) fail(CODE_STATE, 'Red cliff buff is not in the current selection');
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_BUFF, String(tid))) fail(CODE_LIMIT, 'Red cliff buff was already selected');
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_BUFF, String(tid), isoSeconds(nowMs));
      state.selected = state.selected.filter(value => value !== tid);
      state.assembled = [...state.assembled, tid];
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'red_cliff_buff_committed', tid });
      return {
        value: { tid, assembled: snapshot(state.assembled) },
        data: codec.pack('pb_red_cliff_data_to_client', dataToClient(state, nowMs))
      };
    });
  }

  // A reset window is only defined for a completed run: const data has no
  // period field, so an in-progress reset is rejected instead of guessing a
  // daily/weekly cadence.
  async function reset() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (state.curLevel < maxLevel) fail(CODE_STATE, 'Red cliff reset requires a completed run; reset window semantics are not recovered');
      const key = String(state.resetTimes + 1);
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_RESET, key)) fail(CODE_LIMIT, 'Red cliff run was already reset');
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_RESET, key, isoSeconds(nowMs));
      state.resetTimes += 1;
      state.lastChallengePoints = state.challengePoints;
      state.challengePoints = 0;
      state.stars = 0;
      state.curLevel = 0;
      state.assembled = [];
      state.selected = [];
      state.lastResetSecond = unixSeconds(nowMs);
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'red_cliff_reset_committed', resetTimes: state.resetTimes });
      return { value: { resetTimes: state.resetTimes }, data: codec.pack('pb_red_cliff_data_to_client', dataToClient(state, nowMs)) };
    });
  }

  // The buff library per level is not recoverable from the shipped table
  // (buff_lib is a nested table reference), so candidates are drawn from the
  // Buff table itself. The daily cap comes from Const.refresh_fight.
  async function refresh() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (!buffPool.length) fail(CODE_STATE, 'Red cliff buff configuration is empty');
      if (state.curLevel <= 0) fail(CODE_STATE, 'Red cliff buff refresh requires a cleared level');
      if (state.refreshCount >= dailyRefreshLimit) fail(CODE_LIMIT, 'Red cliff refresh count is insufficient');
      const pool = buffPool.filter(tid => !state.assembled.includes(tid));
      if (!pool.length) fail(CODE_STATE, 'Red cliff buff pool is exhausted');
      const selected = [];
      const remaining = [...pool];
      while (selected.length < candidateCount && remaining.length) {
        const index = Math.min(remaining.length - 1, Math.max(0, Math.floor(random() * remaining.length)));
        selected.push(remaining.splice(index, 1)[0]);
      }
      state.selected = selected;
      state.refreshCount += 1;
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'red_cliff_refresh_committed', refreshCount: state.refreshCount, selected });
      return { value: { selected: snapshot(selected), refreshCount: state.refreshCount }, data: codec.pack('pb_red_cliff_data_to_client', dataToClient(state, nowMs)) };
    });
  }

  async function execute(type, input) {
    if (type === 55001) return box(input);
    if (type === 55002) return buff(input);
    if (type === 55003) return reset();
    if (type === 55004) return refresh();
    fail(CODE_INVALID, 'Unsupported red cliff command');
  }

  function state(roleId) {
    return store.inspect(db => { ensureTables(db); return stateOf(db, roleId, now()); });
  }

  return { supports, execute, box, buff, reset, refresh, clearLevel, state };
}
