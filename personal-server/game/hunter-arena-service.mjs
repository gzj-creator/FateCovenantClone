import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  arenaAwardPairs,
  arenaRange,
  readHunterArenaTables
} from '../config/arena-tables.mjs';
import { encodeEtf } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';

// HunterArenaCmd.lua (module 121, ModuleTable name HunterArenaReqMgr) declares the
// eleven commands below in this order; HunterArenaReqMgr wires one Send() per
// command and the login module payload is a single pb_hunter_arena_login that
// HunterArenaReqMgr.LoginParse decodes. See
// agent/workflow/gameplay-completion/BATTLE-HUNTERARENA/implementation.md.
const COMMAND_CLEAR_CHANGE = 84001;
const COMMAND_DAY_AWARD = 84002;
const COMMAND_SEASON_AWARD = 84003;
const COMMAND_PALACE = 84004;
const COMMAND_FIGHT = 84005;
const COMMAND_SET_IGNORE = 84006;
const COMMAND_SET_READ_REPORT_TIME = 84007;
const COMMAND_HISTORY_RANK = 84008;
const COMMAND_REPORT_LOCK = 84009;
const COMMAND_SET_AWARD_TIPS = 84010;
const COMMAND_ENTER_FORM = 84011;
const SUPPORTED = [
  COMMAND_CLEAR_CHANGE, COMMAND_DAY_AWARD, COMMAND_SEASON_AWARD, COMMAND_PALACE,
  COMMAND_FIGHT, COMMAND_SET_IGNORE, COMMAND_SET_READ_REPORT_TIME, COMMAND_HISTORY_RANK,
  COMMAND_REPORT_LOCK, COMMAND_SET_AWARD_TIPS, COMMAND_ENTER_FORM
];

// HunterArenaTable.DayTask.task_type: 7002 counts fights, 7003 counts wins.
const TASK_TYPE_FIGHT_TIMES = 7002;
const TASK_TYPE_WIN_TIMES = 7003;

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;

const CLAIM_DAY_AWARD = 'hunter_arena_day_award';
const CLAIM_SEASON_AWARD = 'hunter_arena_season_award';

// A hunter-arena season lasts one week in the shipped schedule: the State rows
// only describe intra-week windows, and no season length table was recovered.
// Replace this constant when the season table is extracted.
const SEASON_SECONDS = 7 * 86400;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function idList(value, message) {
  const raw = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const ids = [];
  for (const entry of raw) {
    const tid = Number(entry);
    if (!Number.isSafeInteger(tid) || tid <= 0) fail(CODE_INVALID, message);
    if (!ids.includes(tid)) ids.push(tid);
  }
  if (!ids.length) fail(CODE_INVALID, message);
  return ids;
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function secondsOf(iso) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? Math.floor(value / 1000) : 0;
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS hunter_arena_state (' +
    'role_id INTEGER PRIMARY KEY,' +
    'season INTEGER NOT NULL,' +
    'score INTEGER NOT NULL,' +
    'max_score INTEGER NOT NULL,' +
    'last_max_score INTEGER NOT NULL,' +
    'score_change INTEGER NOT NULL,' +
    'recent_fight_result INTEGER NOT NULL,' +
    'fight_times INTEGER NOT NULL,' +
    'win_times INTEGER NOT NULL,' +
    'got_day_award TEXT NOT NULL,' +
    'got_season_award TEXT NOT NULL,' +
    'season_award_tips TEXT NOT NULL,' +
    'last_flush_stamp INTEGER NOT NULL,' +
    'read_report_time INTEGER NOT NULL,' +
    'ignore_match_show INTEGER NOT NULL,' +
    'last_join_season INTEGER NOT NULL,' +
    'last_season_win_times INTEGER NOT NULL,' +
    'last_season_fight_times INTEGER NOT NULL,' +
    'new_stage_fight_times INTEGER NOT NULL,' +
    'cross_open_day INTEGER NOT NULL,' +
    'last_cross_open_day INTEGER NOT NULL,' +
    'updated_at TEXT NOT NULL)'
  );
  db.exec('CREATE TABLE IF NOT EXISTS hunter_arena_reports (' +
    'role_id INTEGER NOT NULL,' +
    'fight_uid INTEGER NOT NULL,' +
    'score_change INTEGER NOT NULL,' +
    'fight_stamp INTEGER NOT NULL,' +
    'enemy_id INTEGER NOT NULL,' +
    'is_atk INTEGER NOT NULL,' +
    'is_win INTEGER NOT NULL,' +
    'locked INTEGER NOT NULL,' +
    'old_score INTEGER NOT NULL,' +
    'new_score INTEGER NOT NULL,' +
    'PRIMARY KEY(role_id, fight_uid))'
  );
  db.exec('CREATE TABLE IF NOT EXISTS hunter_arena_claims (' +
    'role_id INTEGER NOT NULL,' +
    'claim_type TEXT NOT NULL,' +
    'claim_key TEXT NOT NULL,' +
    'created_at TEXT NOT NULL,' +
    'PRIMARY KEY(role_id, claim_type, claim_key))'
  );
}

export function createHunterArenaService({
  store,
  codec,
  tables = readHunterArenaTables(),
  gameTables = null,
  serverOpenedAt = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = (event) => { try { logger(event); } catch {} };
  const resourceTables = () => (gameTables ? gameTables : readGameTables());
  const constant = tables.const || {};
  const initScore = integer(constant.init_score ?? 0, 0, 1000000, 'Hunter arena init score is invalid');
  const minScore = integer(constant.min_score ?? 0, 0, 1000000, 'Hunter arena min score is invalid');
  const reportLimit = integer(constant.fight_report_num ?? 15, 1, 100, 'Hunter arena report limit is invalid');
  const lockMax = integer(constant.lock_fight_report_max ?? 0, 0, 15, 'Hunter arena lock limit is invalid');

  function emptyState(roleId) {
    return {
      roleId,
      season: 1,
      score: initScore,
      maxScore: initScore,
      lastMaxScore: initScore,
      scoreChange: 0,
      recentFightResult: 0,
      fightTimes: 0,
      winTimes: 0,
      gotDayAward: Buffer.alloc(0),
      gotSeasonAward: Buffer.alloc(0),
      seasonAwardTips: Buffer.alloc(0),
      lastFlushStamp: 0,
      readReportTime: 0,
      ignoreMatchShow: false,
      lastJoinSeason: 0,
      lastSeasonWinTimes: 0,
      lastSeasonFightTimes: 0,
      newStageFightTimes: 0,
      crossOpenDay: 0,
      lastCrossOpenDay: 0
    };
  }

  function hexBuffer(value) {
    try { return value ? Buffer.from(String(value), 'hex') : Buffer.alloc(0); } catch { return Buffer.alloc(0); }
  }

  function readState(db, roleId) {
    const row = db.prepare('SELECT * FROM hunter_arena_state WHERE role_id=?').get(roleId);
    const state = emptyState(roleId);
    if (!row) return state;
    Object.assign(state, {
      season: Number(row.season ?? 1),
      score: Number(row.score ?? initScore),
      maxScore: Number(row.max_score ?? initScore),
      lastMaxScore: Number(row.last_max_score ?? initScore),
      scoreChange: Number(row.score_change ?? 0),
      recentFightResult: Number(row.recent_fight_result ?? 0),
      fightTimes: Number(row.fight_times ?? 0),
      winTimes: Number(row.win_times ?? 0),
      gotDayAward: hexBuffer(row.got_day_award),
      gotSeasonAward: hexBuffer(row.got_season_award),
      seasonAwardTips: hexBuffer(row.season_award_tips),
      lastFlushStamp: Number(row.last_flush_stamp ?? 0),
      readReportTime: Number(row.read_report_time ?? 0),
      ignoreMatchShow: Number(row.ignore_match_show ?? 0) === 1,
      lastJoinSeason: Number(row.last_join_season ?? 0),
      lastSeasonWinTimes: Number(row.last_season_win_times ?? 0),
      lastSeasonFightTimes: Number(row.last_season_fight_times ?? 0),
      newStageFightTimes: Number(row.new_stage_fight_times ?? 0),
      crossOpenDay: Number(row.cross_open_day ?? 0),
      lastCrossOpenDay: Number(row.last_cross_open_day ?? 0)
    });
    return state;
  }

  function writeState(db, state, nowMs) {
    db.prepare('INSERT INTO hunter_arena_state (role_id, season, score, max_score, last_max_score,' +
      ' score_change, recent_fight_result, fight_times, win_times, got_day_award, got_season_award,' +
      ' season_award_tips, last_flush_stamp, read_report_time, ignore_match_show, last_join_season,' +
      ' last_season_win_times, last_season_fight_times, new_stage_fight_times, cross_open_day,' +
      ' last_cross_open_day, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)' +
      ' ON CONFLICT(role_id) DO UPDATE SET season=excluded.season, score=excluded.score,' +
      ' max_score=excluded.max_score, last_max_score=excluded.last_max_score,' +
      ' score_change=excluded.score_change, recent_fight_result=excluded.recent_fight_result,' +
      ' fight_times=excluded.fight_times, win_times=excluded.win_times,' +
      ' got_day_award=excluded.got_day_award, got_season_award=excluded.got_season_award,' +
      ' season_award_tips=excluded.season_award_tips, last_flush_stamp=excluded.last_flush_stamp,' +
      ' read_report_time=excluded.read_report_time, ignore_match_show=excluded.ignore_match_show,' +
      ' last_join_season=excluded.last_join_season, last_season_win_times=excluded.last_season_win_times,' +
      ' last_season_fight_times=excluded.last_season_fight_times,' +
      ' new_stage_fight_times=excluded.new_stage_fight_times, cross_open_day=excluded.cross_open_day,' +
      ' last_cross_open_day=excluded.last_cross_open_day, updated_at=excluded.updated_at')
      .run(
        state.roleId, state.season, state.score, state.maxScore, state.lastMaxScore,
        state.scoreChange, state.recentFightResult, state.fightTimes, state.winTimes,
        state.gotDayAward.toString('hex'), state.gotSeasonAward.toString('hex'),
        state.seasonAwardTips.toString('hex'), state.lastFlushStamp, state.readReportTime,
        state.ignoreMatchShow ? 1 : 0, state.lastJoinSeason, state.lastSeasonWinTimes,
        state.lastSeasonFightTimes, state.newStageFightTimes, state.crossOpenDay,
        state.lastCrossOpenDay, isoSeconds(nowMs)
      );
  }

  function claimed(db, roleId, type, key) {
    return !!db.prepare('SELECT 1 FROM hunter_arena_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
      .get(roleId, type, key);
  }

  function recordClaim(db, roleId, type, key, createdAt) {
    db.prepare('INSERT INTO hunter_arena_claims VALUES (?,?,?,?)').run(roleId, type, key, createdAt);
  }

  function reportsOf(db, roleId, limit) {
    const rows = db.prepare('SELECT * FROM hunter_arena_reports WHERE role_id=? ORDER BY fight_stamp DESC, fight_uid DESC LIMIT ?')
      .all(roleId, limit);
    return rows.map((row) => ({
      score_change: Number(row.score_change),
      fight_uid: String(row.fight_uid),
      fight_stamp: Number(row.fight_stamp),
      enemy: String(row.enemy_id),
      is_atk: Number(row.is_atk) === 1,
      atk_change: { old_rank: 0, new_rank: 0, old_score: Number(row.old_score), new_score: Number(row.new_score), rank_type: 0 },
      def_change: { old_rank: 0, new_rank: 0, old_score: Number(row.old_score), new_score: Number(row.new_score), rank_type: 0 },
      locked: Number(row.locked) === 1,
      is_win: Number(row.is_win) === 1
    }));
  }

  function seasonWindow(nowMs) {
    const base = Number(serverOpenedAt ?? secondsOf(isoSeconds(nowMs))) * 1000;
    const elapsed = Math.max(0, Math.floor((nowMs - base) / 1000));
    const season = Math.floor(elapsed / SEASON_SECONDS) + 1;
    const close = Math.floor(base / 1000) + season * SEASON_SECONDS;
    return { season, closeStamp: close, openStamp: close - SEASON_SECONDS };
  }

  // This deployment serves one role, so the ladder has a single entry and the
  // role is rank 1. HunterArenaTable.Rank then selects the season award row.
  function selfRank() {
    return 1;
  }

  function roleData(db, state) {
    return {
      season: state.season,
      max_score: state.maxScore,
      last_max_score: state.lastMaxScore,
      score_change: state.scoreChange,
      recent_fight_result: state.recentFightResult,
      fight_times: state.fightTimes,
      win_times: state.winTimes,
      got_day_award: state.gotDayAward,
      got_season_award: state.gotSeasonAward,
      last_flush_stamp: state.lastFlushStamp,
      fight_reports: reportsOf(db, state.roleId, reportLimit),
      read_report_time: state.readReportTime,
      ignore_match_show: state.ignoreMatchShow,
      season_award_tips: state.seasonAwardTips,
      last_join_season: state.lastJoinSeason,
      last_season_win_times: state.lastSeasonWinTimes,
      last_season_fight_times: state.lastSeasonFightTimes,
      new_stage_fight_times: state.newStageFightTimes,
      cross_open_day: state.crossOpenDay,
      last_cross_open_day: state.lastCrossOpenDay,
      stage_wins: [],
      best_rank: [],
      best_stage: []
    };
  }

  function loginPayload() {
    return store.inspect((db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, store.state().roleId);
      const window = seasonWindow(nowMs);
      return codec.pack('pb_hunter_arena_login', {
        hunter_arena: roleData(db, state),
        score: state.score,
        rank: selfRank(),
        season_state: {
          cur_season: state.season,
          cur_season_close_stamp: window.closeStamp,
          next_season_open_stamp: window.closeStamp
        },
        palace: { palaces: [] },
        open_double_time: 0
      });
    });
  }

  function resPacket(changes) {
    return codec.pack('pb_res_to_client', { changes: changes ? changes : [], is_overflow: false });
  }

  function supports(type) { return SUPPORTED.includes(type); }

  async function clearChange() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      state.scoreChange = 0;
      state.recentFightResult = 0;
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_change_cleared', score: state.score });
      // HunterArenaReqMgr clears the change locally; the ETF reply reports the
      // score that was kept so the acknowledgement carries a real value.
      return { value: { score: state.score, rank: selfRank() }, data: encodeEtf([state.score, selfRank()]) };
    });
  }

  // HunterArenaTable.DayTask rows are counted by task_type: 7002 compares the
  // season fight count, 7003 the season win count.
  async function dayAward(input) {
    const tids = idList(input, 'Hunter arena day award list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      const awards = [];
      let bits = Buffer.from(state.gotDayAward);
      for (const tid of tids) {
        const row = tables.dayTask.find((candidate) => Number(candidate.tid) === tid);
        if (!row) fail(CODE_STATE, 'Hunter arena day award configuration is missing');
        const needed = integer(row.task_count ?? 0, 1, 1000000, 'Hunter arena day task count is invalid');
        const taskType = Number(row.task_type);
        const progress = taskType === TASK_TYPE_FIGHT_TIMES ? state.fightTimes : taskType === TASK_TYPE_WIN_TIMES ? state.winTimes : null;
        if (progress === null) fail(CODE_STATE, 'Hunter arena day task type is unsupported');
        if (progress < needed) fail(CODE_STATE, 'Hunter arena day task is not complete');
        if (hasBit(bits, tid) || claimed(db, state.roleId, CLAIM_DAY_AWARD, String(tid))) {
          fail(CODE_LIMIT, 'Hunter arena day award was already received');
        }
        awards.push.apply(awards, arenaAwardPairs(row.award, 'Hunter arena day award ' + tid));
        bits = setBit(bits, tid);
      }
      const reward = grantResources(model, awards, resourceTables());
      const createdAt = isoSeconds(nowMs);
      for (const tid of tids) recordClaim(db, state.roleId, CLAIM_DAY_AWARD, String(tid), createdAt);
      state.gotDayAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_day_award_committed', tids, changes: reward.changes.length });
      return { value: { tids, changes: reward.changes }, data: resPacket(reward.changes) };
    });
  }

  // The season award row is chosen by the close-of-season rank, which this
  // single-role deployment pins to rank 1 unless the role fought in the season.
  async function seasonAward(input) {
    const tids = idList(input, 'Hunter arena season award list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      const rank = selfRank();
      const awards = [];
      let bits = Buffer.from(state.gotSeasonAward);
      for (const tid of tids) {
        const row = tables.rank.find((candidate) => Number(candidate.tid) === tid);
        if (!row) fail(CODE_STATE, 'Hunter arena season award configuration is missing');
        const [from, to] = arenaRange(row.rank_range, 'Hunter arena season award');
        if (rank < from || rank > to) fail(CODE_STATE, 'Hunter arena season award was not reached');
        if (hasBit(bits, tid) || claimed(db, state.roleId, CLAIM_SEASON_AWARD, String(state.season) + ':' + tid)) {
          fail(CODE_LIMIT, 'Hunter arena season award was already received');
        }
        awards.push.apply(awards, arenaAwardPairs(row.award, 'Hunter arena season award ' + tid));
        bits = setBit(bits, tid);
      }
      const reward = grantResources(model, awards, resourceTables());
      const createdAt = isoSeconds(nowMs);
      for (const tid of tids) recordClaim(db, state.roleId, CLAIM_SEASON_AWARD, String(state.season) + ':' + tid, createdAt);
      state.gotSeasonAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_season_award_committed', season: state.season, tids, changes: reward.changes.length });
      return { value: { season: state.season, tids, changes: reward.changes }, data: resPacket(reward.changes) };
    });
  }
  
  // pb_hunter_arena_palace holds the per-season palace records written when a
  // season closes. This server has no closed cross season yet, so the list is
  // genuinely empty instead of fabricated.
  async function palace() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId);
      log({ event: 'hunter_arena_palace_served', season: state.season });
      return { value: { palaces: 0 }, data: codec.pack('pb_hunter_role_palace', { palaces: [] }) };
    });
  }

  // 84005 needs the enemy line-up of the matched ladder role. HunterArenaTable
  // BotLib only stores fight_tid/score/power, and the referenced FightTable rows
  // are not part of the recovered arena tables, so the fight stays closed until
  // an authoritative opponent source exists.
  async function fight() {
    fail(CODE_STATE, 'Hunter arena fight needs an enemy line-up that the recovered tables do not contain');
  }

  async function setIgnore(input) {
    const value = Array.isArray(input) ? input[0] : input;
    const ignore = value === true || Number(value) === 1;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      state.ignoreMatchShow = ignore;
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_ignore_match_show_set', ignore });
      return { value: { ignore }, data: encodeEtf([ignore ? 1 : 0]) };
    });
  }

  async function setReadReportTime() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      state.readReportTime = Math.floor(nowMs / 1000);
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_report_read_time_set', readTime: state.readReportTime });
      return { value: { readTime: state.readReportTime }, data: encodeEtf([state.readReportTime]) };
    });
  }

  async function historyRank() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_history_rank_served', season: state.season, rank: selfRank() });
      return {
        value: { rank: selfRank(), score: state.score, season: state.season },
        data: codec.pack('pb_hunter_arena_history_rank_rsp', {
          rank: selfRank(),
          score: state.score,
          season: state.season,
          hunter_arena: roleData(db, state)
        })
      };
    });
  }

  // pb_hunter_arena_set_report_lock.fight_uid: the report is locked so the
  // client cannot hide it. lock_fight_report_max caps the locked reports.
  async function reportLock(input) {
    const fightUid = integer(input ? input.fight_uid : undefined, 0, Number.MAX_SAFE_INTEGER, 'Hunter arena report lock needs a fight uid');
    const lock = input ? input.lock === true : false;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const row = db.prepare('SELECT locked FROM hunter_arena_reports WHERE role_id=? AND fight_uid=?').get(roleId, fightUid);
      if (!row) fail(CODE_STATE, 'Hunter arena report is missing');
      if (lock && Number(row.locked) !== 1) {
        const locked = db.prepare('SELECT COUNT(*) AS total FROM hunter_arena_reports WHERE role_id=? AND locked=1').get(roleId);
        if (Number(locked.total ?? 0) >= lockMax) fail(CODE_LIMIT, 'Hunter arena locked report limit is reached');
      }
      db.prepare('UPDATE hunter_arena_reports SET locked=? WHERE role_id=? AND fight_uid=?').run(lock ? 1 : 0, roleId, fightUid);
      log({ event: 'hunter_arena_report_lock_set', fightUid, lock });
      return { value: { fightUid, lock }, data: resPacket([]) };
    });
  }

  async function setAwardTips(input) {
    const value = Array.isArray(input) ? input[0] : input;
    const seen = value === undefined || value === null ? true : value === true || Number(value) === 1;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      state.seasonAwardTips = seen ? setBit(Buffer.from(state.seasonAwardTips), state.season) : Buffer.from(state.seasonAwardTips);
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_season_award_tip_set', season: state.season, seen });
      return { value: { season: state.season, seen }, data: encodeEtf([state.season]) };
    });
  }

  // HunterArenaReqMgr.RecentCache reads best_rank/best_stage from the reply, so
  // the enter_form answer is the role record that carries those fields.
  async function enterForm() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId);
      writeState(db, state, nowMs);
      log({ event: 'hunter_arena_enter_form_served', season: state.season });
      return { value: { season: state.season, rank: selfRank() }, data: codec.pack('pb_role_hunter_arena', roleData(db, state)) };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_CLEAR_CHANGE) return clearChange();
    if (type === COMMAND_DAY_AWARD) return dayAward(input);
    if (type === COMMAND_SEASON_AWARD) return seasonAward(input);
    if (type === COMMAND_PALACE) return palace();
    if (type === COMMAND_FIGHT) return fight();
    if (type === COMMAND_SET_IGNORE) return setIgnore(input);
    if (type === COMMAND_SET_READ_REPORT_TIME) return setReadReportTime();
    if (type === COMMAND_HISTORY_RANK) return historyRank();
    if (type === COMMAND_REPORT_LOCK) return reportLock(input);
    if (type === COMMAND_SET_AWARD_TIPS) return setAwardTips(input);
    if (type === COMMAND_ENTER_FORM) return enterForm();
    fail(CODE_INVALID, 'Unsupported hunter arena command');
  }

  return {
    supports, execute, loginPayload,
    commands: SUPPORTED,
    constants: { initScore, minScore, reportLimit, lockMax, seasonSeconds: SEASON_SECONDS, serverOpenedAt }
  };
}

