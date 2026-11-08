import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  arenaAwardPairs,
  arenaContestStateAt,
  readArenaContestTables
} from '../config/arena-tables.mjs';
import { encodeEtf } from '../protocol/game-codec.mjs';

// ArenaContestCmd.lua declares the fifteen commands below in this order and
// ArenaContestMgr.LoginParse decodes module 113 as three binaries:
// pb_arena_contest_act, pb_arena_contest_role and pb_arena_contest_match.
// See agent/workflow/gameplay-completion/BATTLE-ARENACONTEST/implementation.md.
const COMMAND_ENTER = 83301;
const COMMAND_LEAVE = 83302;
const COMMAND_SIGN_UP = 83303;
const COMMAND_GUESS = 83304;
const COMMAND_REV_FIGHT_AWARD = 83305;
const COMMAND_GET_GUESS_INFO = 83306;
const COMMAND_GET_ROLE_FIGHT_REPORT = 83307;
const COMMAND_GET_FINAL_INFO = 83308;
const COMMAND_GET_FINAL_POWER_INFO = 83309;
const COMMAND_CONGRATULATE = 83310;
const COMMAND_GET_TOP_ROLES = 83311;
const COMMAND_WATCH_FIGHT = 83312;
const COMMAND_REV_TASK_AWARD = 83313;
const COMMAND_REV_GUESS_AWARD = 83314;
const COMMAND_WATCH_AWARD = 83315;
const SUPPORTED = [
  COMMAND_ENTER, COMMAND_LEAVE, COMMAND_SIGN_UP, COMMAND_GUESS, COMMAND_REV_FIGHT_AWARD,
  COMMAND_GET_GUESS_INFO, COMMAND_GET_ROLE_FIGHT_REPORT, COMMAND_GET_FINAL_INFO,
  COMMAND_GET_FINAL_POWER_INFO, COMMAND_CONGRATULATE, COMMAND_GET_TOP_ROLES,
  COMMAND_WATCH_FIGHT, COMMAND_REV_TASK_AWARD, COMMAND_REV_GUESS_AWARD, COMMAND_WATCH_AWARD
];

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;

// ArenaContestTable.State.state 1 is the sign-up window before the daily
// contest starts; big_state 1 is also the resting phase, so sign-up is open
// while the current phase is big_state 1.
const SIGN_UP_BIG_STATE = 1;
const RUNNING_BIG_STATE = 2;

const DEFAULT_TIMEZONE_OFFSET = 28800; // login reply carries UTC+8

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function secondsOf(iso) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? Math.floor(value / 1000) : 0;
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS arena_contest_state (' +
    'role_id INTEGER PRIMARY KEY,' +
    'period INTEGER NOT NULL,' +
    'sign_up_time INTEGER NOT NULL,' +
    'sign_up_num INTEGER NOT NULL,' +
    'congratulate_period INTEGER NOT NULL,' +
    'congratulate_states TEXT NOT NULL,' +
    'fight_award_states TEXT NOT NULL,' +
    'task_rev_states TEXT NOT NULL,' +
    'daily_time INTEGER NOT NULL,' +
    'guess TEXT NOT NULL,' +
    'watch_enter_time INTEGER NOT NULL,' +
    'watch_award_time INTEGER NOT NULL,' +
    'updated_at TEXT NOT NULL'
  );
  db.exec('CREATE TABLE IF NOT EXISTS arena_contest_claims (' +
    'role_id INTEGER NOT NULL,' +
    'claim_type TEXT NOT NULL,' +
    'claim_key TEXT NOT NULL,' +
    'created_at TEXT NOT NULL,' +
    'PRIMARY KEY(role_id, claim_type, claim_key)'
  );
}

export function createArenaContestService({
  store,
  codec,
  tables = readArenaContestTables(),
  gameTables = null,
  serverOpenedAt = null,
  timezoneOffsetSeconds = DEFAULT_TIMEZONE_OFFSET,
  now = Date.now,
  logger = () => {}
}) {
  const log = (event) => { try { logger(event); } catch {} };
  const resourceTables = () => (gameTables ? gameTables : readGameTables());
  const constant = tables.const || {};
  const openLevel = integer(constant.player_lv ?? 0, 0, 999, 'Arena contest level gate is invalid');
  const openServerDay = integer(constant.server_day ?? 1, 1, 999, 'Arena contest server day gate is invalid');
  const guessInterval = integer(constant.guess_interval ?? 0, 0, 86400, 'Arena contest guess interval is invalid');
  const guessShowCount = integer(constant.guess_record_show_count ?? 7, 1, 50, 'Arena contest guess record count is invalid');
  const congratulateMax = integer(constant.congratulate_num_max ?? 0, 0, 99, 'Arena contest congratulate limit is invalid');

  function hexBuffer(value) {
    try { return value ? Buffer.from(String(value), 'hex') : Buffer.alloc(0); } catch { return Buffer.alloc(0); }
  }

  function emptyState(roleId, period) {
    return {
      roleId,
      period,
      signUpTime: 0,
      signUpNum: 0,
      congratulatePeriod: 0,
      congratulateStates: Buffer.alloc(0),
      fightAwardStates: Buffer.alloc(0),
      taskRevStates: Buffer.alloc(0),
      dailyTime: 0,
      guess: [],
      watchEnterTime: 0,
      watchAwardTime: 0
    };
  }

  function readState(db, roleId, period) {
    const row = db.prepare('SELECT * FROM arena_contest_state WHERE role_id=?').get(roleId);
    const state = emptyState(roleId, period);
    if (!row) return state;
    let guesses = [];
    try { guesses = JSON.parse(row.guess || '[]'); } catch { guesses = []; }
    Object.assign(state, {
      period: Number(row.period ?? period),
      signUpTime: Number(row.sign_up_time ?? 0),
      signUpNum: Number(row.sign_up_num ?? 0),
      congratulatePeriod: Number(row.congratulate_period ?? 0),
      congratulateStates: hexBuffer(row.congratulate_states),
      fightAwardStates: hexBuffer(row.fight_award_states),
      taskRevStates: hexBuffer(row.task_rev_states),
      dailyTime: Number(row.daily_time ?? 0),
      guess: Array.isArray(guesses) ? guesses : [],
      watchEnterTime: Number(row.watch_enter_time ?? 0),
      watchAwardTime: Number(row.watch_award_time ?? 0)
    });
    // Sign-up and contest records belong to one period; a new period starts
    // from a clean local record instead of carrying the previous contest.
    if (state.period !== period) {
      const carry = state.period;
      Object.assign(state, emptyState(roleId, period));
      log({ event: 'arena_contest_period_rolled', from: carry, to: period });
    }
    return state;
  }

  function writeState(db, state, nowMs) {
    db.prepare('INSERT INTO arena_contest_state (role_id, period, sign_up_time, sign_up_num,' +
      ' congratulate_period, congratulate_states, fight_award_states, task_rev_states,' +
      ' daily_time, guess, watch_enter_time, watch_award_time, updated_at)' +
      ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(role_id) DO UPDATE SET' +
      ' period=excluded.period, sign_up_time=excluded.sign_up_time,' +
      ' sign_up_num=excluded.sign_up_num, congratulate_period=excluded.congratulate_period,' +
      ' congratulate_states=excluded.congratulate_states,' +
      ' fight_award_states=excluded.fight_award_states, task_rev_states=excluded.task_rev_states,' +
      ' daily_time=excluded.daily_time, guess=excluded.guess,' +
      ' watch_enter_time=excluded.watch_enter_time, watch_award_time=excluded.watch_award_time,' +
      ' updated_at=excluded.updated_at')
      .run(
        state.roleId, state.period, state.signUpTime, state.signUpNum, state.congratulatePeriod,
        state.congratulateStates.toString('hex'), state.fightAwardStates.toString('hex'),
        state.taskRevStates.toString('hex'), state.dailyTime, JSON.stringify(state.guess),
        state.watchEnterTime, state.watchAwardTime, isoSeconds(nowMs)
      );
  }

  function periodAt(nowMs) {
    // ArenaContest opens on server day 3 and runs one contest per day; the
    // period number is the server day count.
    if (!serverOpenedAt) return 1;
    const opened = Number(serverOpenedAt) * 1000;
    return Math.max(1, Math.floor((nowMs - opened) / 86400000) + 1);
  }

  function phaseAt(nowMs) {
    const seconds = Math.floor(nowMs / 1000) + timezoneOffsetSeconds;
    const secondsOfDay = ((seconds % 86400) + 86400) % 86400;
    const row = arenaContestStateAt(tables, secondsOfDay);
    if (!row) return { secondsOfDay, phase: null, running: false, signUpOpen: false };
    const bigState = Number(row.big_state);
    return {
      secondsOfDay,
      row,
      phase: Number(row.state),
      arenaType: Number(row.arena_type),
      bigState,
      running: bigState >= RUNNING_BIG_STATE,
      signUpOpen: bigState === SIGN_UP_BIG_STATE
    };
  }

  function actData(state, phase) {
    return {
      period: state.period,
      top_roles: [],
      round: 0,
      start_time: Math.floor(now() / 1000),
      enter_round_time: state.dailyTime,
      is_act_running: Boolean(phase.running),
      is_first_match: true,
      watch_num: state.watchEnterTime > 0 ? 1 : 0
    };
  }

  function roleData(state) {
    return {
      period: state.period,
      sign_up_time: state.signUpTime,
      sign_up_num: state.signUpNum,
      congratulate_period: state.congratulatePeriod,
      congratulate_states: state.congratulateStates,
      fight_award_states: state.fightAwardStates,
      task_rev_states: state.taskRevStates,
      daily_time: state.dailyTime,
      guess: state.guess.slice(-guessShowCount),
      watch_award_time: state.watchAwardTime
    };
  }

  function lastMatchData(state) {
    return { match_id: '0', fight_id: '0', winner_id: '0', round: 0, role1: null, role2: null };
  }

  function loginPayloads() {
    return store.inspect((db) => {
      ensureTables(db);
      const nowMs = now();
      const phase = phaseAt(nowMs);
      const state = readState(db, store.state().roleId, periodAt(nowMs));
      return [
        codec.pack('pb_arena_contest_act', actData(state, phase)),
        codec.pack('pb_arena_contest_role', roleData(state)),
        codec.pack('pb_arena_contest_match', lastMatchData(state))
      ];
    });
  }

  function resPacket(changes) {
    return codec.pack('pb_res_to_client', { changes: changes ? changes : [], is_overflow: false });
  }

  function supports(type) { return SUPPORTED.includes(type); }

  async function enter() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      state.watchEnterTime = Math.floor(nowMs / 1000);
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_entered', period: state.period });
      return { value: { period: state.period }, data: encodeEtf([1]) };
    });
  }

  async function leave() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      state.watchEnterTime = 0;
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_left', period: state.period });
      return { value: { period: state.period }, data: encodeEtf([0]) };
    });
  }

  async function signUp() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const phase = phaseAt(nowMs);
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      const level = Number(model.role?.level ?? 0);
      if (level < openLevel) fail(CODE_STATE, 'Arena contest requires role level ' + openLevel);
      if (serverOpenedAt) {
        const serverDay = Math.floor((nowMs / 1000 - Number(serverOpenedAt)) / 86400) + 1;
        if (serverDay < openServerDay) fail(CODE_STATE, 'Arena contest opens on server day ' + openServerDay);
      }
      if (!phase.signUpOpen) fail(CODE_STATE, 'Arena contest sign-up window is closed');
      if (state.signUpTime > 0) fail(CODE_LIMIT, 'Arena contest sign-up was already recorded');
      state.signUpTime = Math.floor(nowMs / 1000);
      state.signUpNum += 1;
      state.dailyTime = Math.floor(nowMs / 1000);
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_signed_up', period: state.period, phase: phase.phase });
      return { value: { period: state.period, signUpNum: state.signUpNum }, data: resPacket([]) };
    });
  }

  // Guesses are stored per period. The contest bracket is produced by a
  // cross-server settle that this deployment does not run, so guess correctness
  // stays empty and the guess award stays closed.
  async function guess(input) {
    const list = Array.isArray(input?.role_id_list) ? input.role_id_list.map(Number) : [];
    if (!list.length) fail(CODE_INVALID, 'Arena contest guess list is empty');
    for (const roleId of list) integer(roleId, 1, Number.MAX_SAFE_INTEGER, 'Invalid arena contest guess role');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      const nowSeconds = Math.floor(nowMs / 1000);
      const latest = state.guess[state.guess.length - 1];
      if (latest && nowSeconds - Number(latest.guess_time) < guessInterval) {
        fail(CODE_LIMIT, 'Arena contest guess interval is not reached');
      }
      state.guess.push({
        guess_role_id: list.map((roleId) => String(roleId)),
        guess_time: String(nowSeconds),
        guess_correct: [],
        got_guess_award: false,
        period: state.period
      });
      if (state.guess.length > guessShowCount) state.guess = state.guess.slice(-guessShowCount);
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_guess_recorded', period: state.period, roles: list.length });
      return {
        value: { period: state.period, guesses: state.guess.length },
        data: codec.pack('pb_arena_contest_guess_rsp', { guess_role_list: [], guess: state.guess })
      };
    });
  }

  // No contest fight is simulated here, so the award set is empty and the reply
  // returns the stored award block unchanged.
  async function revFightAward() {
    return store.inspect((db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, store.state().roleId, periodAt(nowMs));
      log({ event: 'arena_contest_fight_award_served', period: state.period });
      return {
        value: { period: state.period, granted: 0 },
        data: codec.pack('pb_arena_contest_fight_award_back', {
          res: { changes: [], is_overflow: false },
          fight_award_states: state.fightAwardStates
        })
      };
    });
  }

  async function getGuessInfo() {
    return store.inspect((db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, store.state().roleId, periodAt(nowMs));
      log({ event: 'arena_contest_guess_info_served', period: state.period });
      return {
        value: { period: state.period, guesses: state.guess.length },
        data: codec.pack('pb_arena_contest_guess_info', {
          guess_role_list: [],
          flush_time: Math.floor(nowMs / 1000)
        })
      };
    });
  }

  // The bracket matches are produced by the cross-server settle, so this
  // deployment has no fight report to return for the role yet.
  async function getRoleFightReport() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId, periodAt(now()));
      log({ event: 'arena_contest_fight_report_served', period: state.period });
      return {
        value: { period: state.period, reports: 0 },
        data: codec.pack('pb_arena_contest_fight_report_role', { role_id: store.state().roleId, reports: [] })
      };
    });
  }

  async function getFinalInfo() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId, periodAt(now()));
      log({ event: 'arena_contest_final_info_served', period: state.period });
      return {
        value: { period: state.period, levels: 0 },
        data: codec.pack('pb_arena_contest_final_match_info', { final_level_list: [], self_stage_index: 0 })
      };
    });
  }

  async function getFinalPowerInfo() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId, periodAt(now()));
      log({ event: 'arena_contest_final_power_served', period: state.period });
      return {
        value: { period: state.period, roles: 0 },
        data: codec.pack('pb_arena_contest_role_power_ret', { role_power_list: [] })
      };
    });
  }

  // CongratulateAward rows are ordered by the number of congratulations sent in
  // the period; congratulate_num_max caps the sends.
  async function congratulate() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      if (state.congratulatePeriod !== state.period) {
        state.congratulatePeriod = state.period;
        state.congratulateStates = Buffer.alloc(0);
      }
      const sent = state.congratulateStates.length ? countBits(state.congratulateStates) : 0;
      if (sent >= congratulateMax) fail(CODE_LIMIT, 'Arena contest congratulate limit is reached');
      const row = tables.congratulateAward.get(sent + 1) ?? tables.congratulateAward.get(1);
      if (!row) fail(CODE_STATE, 'Arena contest congratulate award configuration is missing');
      const awards = arenaAwardPairs(row.award, 'Arena contest congratulate award');
      const reward = grantResources(model, awards, resourceTables());
      state.congratulateStates = setBitFor(state.congratulateStates, sent + 1);
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_congratulated', period: state.period, count: sent + 1, changes: reward.changes.length });
      return {
        value: { period: state.period, count: sent + 1, changes: reward.changes },
        data: codec.pack('pb_arena_contest_congratulate_back', {
          res: { changes: reward.changes, is_overflow: false },
          popularity: sent + 1,
          congratulate_period: state.period,
          congratulate_states: state.congratulateStates
        })
      };
    });
  }

  async function getTopRoles() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId, periodAt(now()));
      log({ event: 'arena_contest_top_roles_served', period: state.period });
      return { value: { period: state.period, roles: 0 }, data: codec.pack('pb_arena_contest_top_info', { top_role_list: [] }) };
    });
  }

  async function watchFight() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      if (!state.watchEnterTime) state.watchEnterTime = Math.floor(nowMs / 1000);
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_watch_started', period: state.period });
      return { value: { period: state.period }, data: encodeEtf([1]) };
    });
  }

  // ArenaContestTable.ArenaDailyTask is empty in the shipped bundle, so the task
  // award cannot be priced and the command stays closed.
  async function revTaskAward() {
    if (!tables.arenaDailyTask.length) {
      fail(CODE_STATE, 'Arena contest daily task configuration is missing');
    }
    fail(CODE_STATE, 'Arena contest daily task progress is not produced by this server');
  }

  async function revGuessAward(input) {
    const times = Array.isArray(input?.award_guess_time) ? input.award_guess_time.map(Number) : [];
    if (!times.length) fail(CODE_INVALID, 'Arena contest guess award list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      for (const value of times) integer(value, 0, Number.MAX_SAFE_INTEGER, 'Invalid arena contest guess time');
      // The contest result per guess is produced by the bracket settle, so no
      // guess can be marked correct here.
      fail(CODE_STATE, 'Arena contest guess results are not produced by this server');
    });
  }

  async function watchAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, periodAt(nowMs));
      const row = tables.watchAward.get(1);
      if (!row) fail(CODE_STATE, 'Arena contest watch award configuration is missing');
      const need = integer(row.need_time ?? 0, 0, 86400, 'Arena contest watch time is invalid');
      const nowSeconds = Math.floor(nowMs / 1000);
      if (!state.watchEnterTime) fail(CODE_STATE, 'Arena contest watch has not started');
      if (nowSeconds - state.watchEnterTime < need) fail(CODE_STATE, 'Arena contest watch time is not reached');
      if (state.watchAwardTime >= state.watchEnterTime) fail(CODE_LIMIT, 'Arena contest watch award was already received');
      const awards = arenaAwardPairs(row.res_list, 'Arena contest watch award');
      const reward = grantResources(model, awards, resourceTables());
      state.watchAwardTime = nowSeconds;
      writeState(db, state, nowMs);
      log({ event: 'arena_contest_watch_award_committed', period: state.period, changes: reward.changes.length });
      return { value: { period: state.period, changes: reward.changes }, data: resPacket(reward.changes) };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_ENTER) return enter();
    if (type === COMMAND_LEAVE) return leave();
    if (type === COMMAND_SIGN_UP) return signUp();
    if (type === COMMAND_GUESS) return guess(input);
    if (type === COMMAND_REV_FIGHT_AWARD) return revFightAward();
    if (type === COMMAND_GET_GUESS_INFO) return getGuessInfo();
    if (type === COMMAND_GET_ROLE_FIGHT_REPORT) return getRoleFightReport();
    if (type === COMMAND_GET_FINAL_INFO) return getFinalInfo();
    if (type === COMMAND_GET_FINAL_POWER_INFO) return getFinalPowerInfo();
    if (type === COMMAND_CONGRATULATE) return congratulate();
    if (type === COMMAND_GET_TOP_ROLES) return getTopRoles();
    if (type === COMMAND_WATCH_FIGHT) return watchFight();
    if (type === COMMAND_REV_TASK_AWARD) return revTaskAward();
    if (type === COMMAND_REV_GUESS_AWARD) return revGuessAward(input);
    if (type === COMMAND_WATCH_AWARD) return watchAward();
    fail(CODE_INVALID, 'Unsupported arena contest command');
  }

  return {
    supports, execute, loginPayloads,
    commands: SUPPORTED,
    moduleId: 113,
    constants: { openLevel, openServerDay, guessInterval, guessShowCount, congratulateMax, serverOpenedAt }
  };
}

// Congratulations are counted through the congratulate bit block; the setter
// lives here so the service keeps one canonical key order.
function setBitFor(buffer, bit) {
  const bits = Buffer.from(buffer);
  const size = Math.max(bits.length, Math.ceil((bit + 1) / 8));
  const out = Buffer.alloc(size);
  bits.copy(out);
  const index = size - 1 - Math.floor((bit - 1) / 8);
  out[index] |= 1 << ((bit - 1) % 8);
  return out;
}

function countBits(buffer) {
  let total = 0;
  for (const byte of Buffer.from(buffer)) {
    let value = byte;
    while (value) { total += value & 1; value >>= 1; }
  }
  return total;
}

