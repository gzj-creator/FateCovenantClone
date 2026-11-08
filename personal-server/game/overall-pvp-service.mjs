import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { readGameTables } from '../config/game-tables.mjs';

import {
  elmsQualification,
  overallPvpStageInGroup,
  prelimsLevelForScore,
  readOverallPvpTables,
  resolveOverallPvpCycle,
  rewardPairs
} from '../config/overall-pvp-tables.mjs';

// OverallPvpCmd (types 101101-101130) is the cross-server "overall PVP" card:
// preview -> prelims -> prelims settle -> double-elimination bracket -> bracket
// settle -> finals. The client managers are OverallPvpMgr, OverallPrelimsMgr,
// OverallElmsMgr, OverallChampionMgr and OverallPvpGuessMgr; the configuration
// is OverallPvpTable. Everything below reads that table and stores its own
// authoritative per-role state in SQLite.
//
// A single local server cannot host a 128-role double-elimination bracket or a
// cross-server finals bracket, so the commands that need real bracket
// participants or a real multi-role ranking (elms match/sweep, final record,
// final watch award, fight guess, rank guess and its rewards) fail closed with
// a named reason instead of inventing opponents or payouts. The commands whose
// inputs exist locally (prelims opponents from the configured bot rows, day and
// period tasks, sign-in tasks, preview/show rewards, lineup awards, view state,
// report reads, history, get_info) run on real state.

const COMMAND_ELF_BUY_COUNT = 101101;
const COMMAND_DAY_TASK_AWARD = 101102;
const COMMAND_PERIOD_TASK_AWARD = 101103;
const COMMAND_ELMS_MATCH = 101104;
const COMMAND_PRELIMS_MATCH = 101105;
const COMMAND_PRELIMS_BUY_TIMES = 101106;
const COMMAND_ELMS_SWEEP = 101107;
const COMMAND_PREVIEW_REWARD = 101108;
const COMMAND_TEAM_NUM_REWARD = 101109;
const COMMAND_PRELIMS_SPECIAL_MATCH = 101110;
const COMMAND_REPORT_PERSON = 101111;
const COMMAND_REPORT_TOP = 101112;
const COMMAND_ELMS_CLEAR_GROUP_DIRTY = 101113;
const COMMAND_ELMS_CLEAR_FINAL_DIRTY = 101114;
const COMMAND_ENTER_VIEW = 101115;
const COMMAND_EXIT_VIEW = 101116;
const COMMAND_ELMS_CLEAR_FAIL_REPORT = 101117;
const COMMAND_SCROLL = 101118;
const COMMAND_FINAL_RECORD = 101119;
const COMMAND_FINAL_WATCH_AWARD = 101120;
const COMMAND_SIGN_TASK_AWARD = 101121;
const COMMAND_GET_INFO = 101122;
const COMMAND_TRY_INIT_LINEUP = 101123;
const COMMAND_SHOW_REWARD = 101124;
const COMMAND_FIGHT_GUESS = 101125;
const COMMAND_RANK_GUESS = 101126;
const COMMAND_FIGHT_GUESS_REWARD = 101127;
const COMMAND_RANK_GUESS_REWARD = 101128;
const COMMAND_RANK_GUESS_NUM = 101129;
const COMMAND_HISTORY_DATA = 101130;

const SUPPORTED = new Set([
  COMMAND_ELF_BUY_COUNT, COMMAND_DAY_TASK_AWARD, COMMAND_PERIOD_TASK_AWARD, COMMAND_ELMS_MATCH,
  COMMAND_PRELIMS_MATCH, COMMAND_PRELIMS_BUY_TIMES, COMMAND_ELMS_SWEEP, COMMAND_PREVIEW_REWARD,
  COMMAND_TEAM_NUM_REWARD, COMMAND_PRELIMS_SPECIAL_MATCH, COMMAND_REPORT_PERSON, COMMAND_REPORT_TOP,
  COMMAND_ELMS_CLEAR_GROUP_DIRTY, COMMAND_ELMS_CLEAR_FINAL_DIRTY, COMMAND_ENTER_VIEW, COMMAND_EXIT_VIEW,
  COMMAND_ELMS_CLEAR_FAIL_REPORT, COMMAND_SCROLL, COMMAND_FINAL_RECORD, COMMAND_FINAL_WATCH_AWARD,
  COMMAND_SIGN_TASK_AWARD, COMMAND_GET_INFO, COMMAND_TRY_INIT_LINEUP, COMMAND_SHOW_REWARD,
  COMMAND_FIGHT_GUESS, COMMAND_RANK_GUESS, COMMAND_FIGHT_GUESS_REWARD, COMMAND_RANK_GUESS_REWARD,
  COMMAND_RANK_GUESS_NUM, COMMAND_HISTORY_DATA
]);

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;
const CODE_ALREADY = 310;

const DAY_SECONDS = 86400;
// OverallPvpElmsMgr.CONST_BUY_CHALLENGE_ONCE: a single buy click adds one
// challenge. The request may still carry a repeat count.
const ELMS_BUY_STEP = 1;
const MAX_ELMS_BUY_PER_REQUEST = 10;

const STATE_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_state (
  role_id INTEGER NOT NULL PRIMARY KEY,
  version INTEGER NOT NULL,
  settle_index INTEGER NOT NULL,
  init_index INTEGER NOT NULL,
  spec_handle INTEGER NOT NULL,
  team_award TEXT NOT NULL,
  enter_view INTEGER NOT NULL,
  viewing INTEGER NOT NULL,
  updated_at TEXT NOT NULL
)`;

const PRELIMS_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_prelims (
  role_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  challenge_used INTEGER NOT NULL,
  match_used INTEGER NOT NULL,
  buy_challenge INTEGER NOT NULL,
  buy_match INTEGER NOT NULL,
  win_times INTEGER NOT NULL,
  fight_times INTEGER NOT NULL,
  refresh_day INTEGER NOT NULL,
  def_before_score INTEGER NOT NULL,
  is_settle INTEGER NOT NULL,
  is_init INTEGER NOT NULL,
  match_list TEXT NOT NULL,
  refresh_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, version)
)`;

const ELMS_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_elms (
  role_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  is_ticket INTEGER NOT NULL,
  is_win INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  best_win_rank INTEGER NOT NULL,
  best_fail_rank INTEGER NOT NULL,
  attack_used INTEGER NOT NULL,
  attack_buy INTEGER NOT NULL,
  match_used INTEGER NOT NULL,
  match_buy INTEGER NOT NULL,
  match_list TEXT NOT NULL,
  group_dirty INTEGER NOT NULL,
  group_dirty_rank INTEGER NOT NULL,
  final_dirty INTEGER NOT NULL,
  fail_reports TEXT NOT NULL,
  day_key TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, version)
)`;

const CLAIM_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_claims (
  role_id INTEGER NOT NULL,
  claim_type TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id, claim_type, claim_key)
)`;

const REPORT_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_reports (
  role_id INTEGER NOT NULL,
  stage INTEGER NOT NULL,
  fight_uid INTEGER NOT NULL,
  fight_time INTEGER NOT NULL,
  atk_role_id TEXT NOT NULL,
  def_role_id TEXT NOT NULL,
  final_result INTEGER NOT NULL,
  atk_before INTEGER NOT NULL,
  atk_after INTEGER NOT NULL,
  def_before INTEGER NOT NULL,
  def_after INTEGER NOT NULL,
  def_is_bot INTEGER NOT NULL,
  other_data BLOB NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id, fight_uid)
)`;

const GUESS_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_guesses (
  role_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  guess_type INTEGER NOT NULL,
  round INTEGER NOT NULL,
  win_role_id TEXT NOT NULL,
  is_reward INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id, version, guess_type, round)
)`;

const RANK_GUESS_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_rank_guesses (
  role_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  role_list TEXT NOT NULL,
  guess_times INTEGER NOT NULL,
  change_times INTEGER NOT NULL,
  is_rank_reward INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id, version)
)`;

const HISTORY_TABLE = `CREATE TABLE IF NOT EXISTS overall_pvp_history (
  version INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  role_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(version, rank)
)`;

function fail(code, message) { throw new GameError(code, message); }
function invalid(message) { fail(CODE_INVALID, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) invalid(message);
  return number;
}

function iso(seconds) {
  return new Date(Math.floor(Number(seconds)) * 1000).toISOString();
}

function parseList(text) {
  if (!text) return [];
  try {
    const value = JSON.parse(text);
    return Array.isArray(value) ? value : [];
  } catch {
    fail(CODE_STATE, 'Overall PVP state is corrupt');
  }
}


export function createOverallPvpService({
  store,
  codec,
  tables = readOverallPvpTables(),
  gameTables = null,
  now = Date.now,
  version = 0,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  for (const statement of [STATE_TABLE, PRELIMS_TABLE, ELMS_TABLE, CLAIM_TABLE, REPORT_TABLE, GUESS_TABLE, RANK_GUESS_TABLE, HISTORY_TABLE]) {
    store.inspect(db => db.exec(statement));
  }

  const resourceTables = () => gameTables ?? readGameTables();
  const constant = tables.prelimsConst;
  if (!constant) throw new Error('OverallPvpTable.PrelimsConst is empty');
  const elmsConstant = tables.elmsConst.get(1) ?? [...tables.elmsConst.values()][0] ?? null;

  const nowSeconds = () => Math.floor(Number(typeof now === 'function' ? now() : now) / 1000);

  function cycleAt(at = nowSeconds()) {
    return resolveOverallPvpCycle(tables, at, { version });
  }

  function stageOf(cycle) {
    return cycle?.stage?.stage ?? 0;
  }

  // ---- role level state -----------------------------------------------------

  function readRoleState(db, roleId, cycle) {
    const row = db.prepare('SELECT * FROM overall_pvp_state WHERE role_id=?').get(roleId);
    if (!row) {
      return {
        roleId, version: cycle.version, settleIndex: 0, initIndex: 0, specHandle: 0,
        teamAward: [], enterView: 0, viewing: 0, exists: false
      };
    }
    return {
      roleId,
      version: Number(row.version),
      settleIndex: Number(row.settle_index),
      initIndex: Number(row.init_index),
      specHandle: Number(row.spec_handle),
      teamAward: parseList(row.team_award).map(Number).filter(Number.isSafeInteger),
      enterView: Number(row.enter_view),
      viewing: Number(row.viewing),
      exists: true
    };
  }

  function writeRoleState(db, state, at) {
    db.prepare(`INSERT INTO overall_pvp_state(role_id,version,settle_index,init_index,spec_handle,team_award,enter_view,viewing,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id) DO UPDATE SET
        version=excluded.version, settle_index=excluded.settle_index, init_index=excluded.init_index,
        spec_handle=excluded.spec_handle, team_award=excluded.team_award, enter_view=excluded.enter_view,
        viewing=excluded.viewing, updated_at=excluded.updated_at`)
      .run(state.roleId, state.version, state.settleIndex, state.initIndex, state.specHandle,
        JSON.stringify(state.teamAward), state.enterView, state.viewing, iso(at));
  }

  function emptyPrelims(roleId, cycle) {
    const score = Number(constant.init_score ?? 0);
    return {
      roleId, version: cycle.version, score, maxScore: score,
      challengeUsed: 0, matchUsed: 0, buyChallenge: 0, buyMatch: 0,
      winTimes: 0, fightTimes: 0, refreshDay: cycle.openDay, defBeforeScore: 0,
      isSettle: 0, isInit: 0, matchList: [], refreshAt: 0
    };
  }

  function readPrelims(db, roleId, cycle) {
    const row = db.prepare('SELECT * FROM overall_pvp_prelims WHERE role_id=? AND version=?').get(roleId, cycle.version);
    if (!row) return emptyPrelims(roleId, cycle);
    const state = {
      roleId,
      version: Number(row.version),
      score: Number(row.score),
      maxScore: Number(row.max_score),
      challengeUsed: Number(row.challenge_used),
      matchUsed: Number(row.match_used),
      buyChallenge: Number(row.buy_challenge),
      buyMatch: Number(row.buy_match),
      winTimes: Number(row.win_times),
      fightTimes: Number(row.fight_times),
      refreshDay: Number(row.refresh_day),
      defBeforeScore: Number(row.def_before_score),
      isSettle: Number(row.is_settle),
      isInit: Number(row.is_init),
      matchList: parseList(row.match_list),
      refreshAt: Number(row.refresh_at)
    };
    return resetPrelimsDay(state, cycle);
  }

  // OverallPrelimsMgr.CrossDay clears the daily challenge/refresh counters and
  // the current opponent list; the score, win count and settlement flag carry
  // over within the same version.
  function resetPrelimsDay(state, cycle) {
    if (state.refreshDay === cycle.openDay) return state;
    state.challengeUsed = 0;
    state.matchUsed = 0;
    state.buyChallenge = 0;
    state.buyMatch = 0;
    state.matchList = [];
    state.refreshAt = 0;
    state.refreshDay = cycle.openDay;
    return state;
  }

  function writePrelims(db, state, at) {
    db.prepare(`INSERT INTO overall_pvp_prelims(role_id,version,score,max_score,challenge_used,match_used,buy_challenge,buy_match,
        win_times,fight_times,refresh_day,def_before_score,is_settle,is_init,match_list,refresh_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id,version) DO UPDATE SET
        score=excluded.score, max_score=excluded.max_score, challenge_used=excluded.challenge_used,
        match_used=excluded.match_used, buy_challenge=excluded.buy_challenge, buy_match=excluded.buy_match,
        win_times=excluded.win_times, fight_times=excluded.fight_times, refresh_day=excluded.refresh_day,
        def_before_score=excluded.def_before_score, is_settle=excluded.is_settle, is_init=excluded.is_init,
        match_list=excluded.match_list, refresh_at=excluded.refresh_at, updated_at=excluded.updated_at`)
      .run(state.roleId, state.version, state.score, state.maxScore, state.challengeUsed, state.matchUsed,
        state.buyChallenge, state.buyMatch, state.winTimes, state.fightTimes, state.refreshDay,
        state.defBeforeScore, state.isSettle, state.isInit, JSON.stringify(state.matchList), state.refreshAt, iso(at));
  }

  function emptyElms(roleId, cycle) {
    return {
      roleId, version: cycle.version, isTicket: 0, isWin: 0, rank: 0, bestWinRank: 0, bestFailRank: 0,
      attackUsed: 0, attackBuy: 0, matchUsed: 0, matchBuy: 0, matchList: [],
      groupDirty: 0, groupDirtyRank: 0, finalDirty: 0, failReports: [], dayKey: String(cycle.openDay),
      exists: false
    };
  }

  function readElms(db, roleId, cycle) {
    const row = db.prepare('SELECT * FROM overall_pvp_elms WHERE role_id=? AND version=?').get(roleId, cycle.version);
    if (!row) return emptyElms(roleId, cycle);
    const state = {
      roleId,
      version: Number(row.version),
      isTicket: Number(row.is_ticket),
      isWin: Number(row.is_win),
      rank: Number(row.rank),
      bestWinRank: Number(row.best_win_rank),
      bestFailRank: Number(row.best_fail_rank),
      attackUsed: Number(row.attack_used),
      attackBuy: Number(row.attack_buy),
      matchUsed: Number(row.match_used),
      matchBuy: Number(row.match_buy),
      matchList: parseList(row.match_list),
      groupDirty: Number(row.group_dirty),
      groupDirtyRank: Number(row.group_dirty_rank),
      finalDirty: Number(row.final_dirty),
      failReports: parseList(row.fail_reports).map(Number).filter(Number.isSafeInteger),
      dayKey: String(row.day_key),
      exists: true
    };
    return resetElmsDay(state, cycle);
  }

  function resetElmsDay(state, cycle) {
    const key = String(cycle.openDay);
    if (state.dayKey === key) return state;
    state.attackUsed = 0;
    state.matchUsed = 0;
    state.attackBuy = 0;
    state.matchBuy = 0;
    state.matchList = [];
    state.dayKey = key;
    return state;
  }

  function writeElms(db, state, at) {
    db.prepare(`INSERT INTO overall_pvp_elms(role_id,version,is_ticket,is_win,rank,best_win_rank,best_fail_rank,
        attack_used,attack_buy,match_used,match_buy,match_list,group_dirty,group_dirty_rank,final_dirty,
        fail_reports,day_key,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id,version) DO UPDATE SET
        is_ticket=excluded.is_ticket, is_win=excluded.is_win, rank=excluded.rank,
        best_win_rank=excluded.best_win_rank, best_fail_rank=excluded.best_fail_rank,
        attack_used=excluded.attack_used, attack_buy=excluded.attack_buy, match_used=excluded.match_used,
        match_buy=excluded.match_buy, match_list=excluded.match_list, group_dirty=excluded.group_dirty,
        group_dirty_rank=excluded.group_dirty_rank, final_dirty=excluded.final_dirty,
        fail_reports=excluded.fail_reports, day_key=excluded.day_key, updated_at=excluded.updated_at`)
      .run(state.roleId, state.version, state.isTicket, state.isWin, state.rank, state.bestWinRank,
        state.bestFailRank, state.attackUsed, state.attackBuy, state.matchUsed, state.matchBuy,
        JSON.stringify(state.matchList), state.groupDirty, state.groupDirtyRank, state.finalDirty,
        JSON.stringify(state.failReports), state.dayKey, iso(at));
  }

  // Once the bracket stage opens, the prelims score decides the bracket: the
  // ElmsInit split_score puts scores at or above the first entry in the winner
  // bracket, the second entry in the loser bracket and everything below out of
  // the tournament. The ticket is derived once per version and then stored.
  function seedElmsQualification(db, roleId, cycle, at) {
    const elms = readElms(db, roleId, cycle);
    if (elms.exists) return elms;
    if (!cycle?.stage || Number(cycle.stage.stage) < STAGE_ELMS) return elms;
    const prelims = readPrelims(db, roleId, cycle);
    const qualification = elmsQualification(tables, prelims.maxScore || prelims.score);
    if (!qualification) return elms;
    elms.isTicket = qualification.qualified ? 1 : 0;
    elms.isWin = qualification.isWin ? 1 : 0;
    writeElms(db, elms, at);
    log({ event: 'overall_pvp_bracket_seeded', qualified: qualification.qualified, isWin: qualification.isWin });
    return elms;
  }
  function claimExists(db, roleId, claimType, claimKey) {
    return Boolean(db.prepare('SELECT 1 FROM overall_pvp_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
      .get(roleId, claimType, String(claimKey)));
  }

  function addClaim(db, roleId, claimType, claimKey, at) {
    db.prepare('INSERT INTO overall_pvp_claims(role_id,claim_type,claim_key,created_at) VALUES(?,?,?,?)')
      .run(roleId, claimType, String(claimKey), iso(at));
  }

  // Claim bits travel to the client as a BitBlock: zero based, MSB first per
  // byte (see game/bit-block.mjs). Day tasks and period tasks each own one bit
  // block; the sign-in board keeps a single receive_sign_tid cursor instead.
  function claimBits(db, roleId, claimType, scope = '') {
    const prefix = scope === '' ? '' : String(scope) + ':';
    const ids = db.prepare('SELECT claim_key FROM overall_pvp_claims WHERE role_id=? AND claim_type=?')
      .all(roleId, claimType)
      .map(row => String(row.claim_key))
      .filter(key => key.startsWith(prefix))
      .map(key => Number(key.slice(prefix.length)))
      .filter(Number.isSafeInteger);
    let bits = Buffer.alloc(0);
    for (const tid of ids) if (tid > 0) bits = setBit(bits, tid - 1);
    return bits;
  }

  function hasClaimBit(db, roleId, claimType, tid, scope = '') {
    return hasBit(claimBits(db, roleId, claimType, scope), Number(tid) - 1);
  }

  // Day and season task claims are scoped per PVP version so a later cycle
  // starts with an empty board, while the claim rows themselves stay keyed by
  // the same BitBlock index the client uses (tid - 1).
  function claimKey(scope, tid) {
    return String(scope) + ':' + String(tid);
  }

  function signCursor(db, roleId) {
    const rows = db.prepare("SELECT claim_key FROM overall_pvp_claims WHERE role_id=? AND claim_type='sign_task'")
      .all(roleId).map(row => Number(row.claim_key)).filter(Number.isSafeInteger);
    return rows.length ? Math.max(...rows) : 0;
  }

  // ---- local constants ------------------------------------------------------

  // OverallPvpTable.lua stage ids, in table order: notify, prelims, prelims
  // settle, ko, ko settle, finals, finals settle.
  const STAGE_NOTIFY = 1;
  const STAGE_PRELIMS = 2;
  const STAGE_ELMS = 4;
  const STAGE_FINALS = 6;
  const STAGE_FINALS_SETTLE = 7;
  // Task.task_type values. 100501/100505 are counted by this server; the two
  // elimination counters stay at zero because elms match and sweep fail closed.
  const TASK_TYPE_PRELIMS_CHALLENGE = 100501;
  const TASK_TYPE_ELMS_ATTACK = 100502;
  const TASK_TYPE_ELMS_SWEEP = 100503;
  const TASK_TYPE_ELMS_WIN = 100504;
  const TASK_TYPE_PRELIMS_SCORE = 100505;
  // TID_OVERALL_PVP_GUESS_FINAL_RANK
  const GUESS_TYPE_FINAL_RANK = 3;
  // PrelimsBot role ids are synthetic: the local server has no real opponent
  // accounts, so a bot is addressed by a stable offset plus its PrelimsBot tid.
  const BOT_ROLE_ID_BASE = 700000000000;
  const MAX_ELMS_PURCHASE = 999;

  // ---- argument helpers -----------------------------------------------------

  function scalarArgument(value) {
    if (Array.isArray(value)) return value[0];
    if (value && typeof value === 'object') {
      if (value.tid !== undefined) return value.tid;
      if (value[0] !== undefined) return value[0];
      return undefined;
    }
    return value;
  }

  function tidArgument(value, label) {
    const tid = Number(scalarArgument(value));
    if (!Number.isSafeInteger(tid) || tid <= 0) invalid(label);
    return tid;
  }

  function countArgument(value, max) {
    const raw = scalarArgument(value);
    if (raw === undefined || raw === null || raw === false) return 1;
    const count = Number(raw);
    if (!Number.isSafeInteger(count) || count <= 0 || count > max) invalid('Invalid overall PVP count argument');
    return count;
  }

  // ---- cycle helpers --------------------------------------------------------

  function stageGate(cycle, group, message) {
    if (!cycle?.stage || !overallPvpStageInGroup(tables, cycle.stage.stage, group)) fail(CODE_STATE, message);
    return cycle.stage.stage;
  }

  function exactStage(cycle, stage, message) {
    if (!cycle?.stage || cycle.stage.stage !== Number(stage)) fail(CODE_STATE, message);
    return Number(stage);
  }

  function dayWindowContains(range, day) {
    if (!Array.isArray(range) || range.length < 2) return false;
    const from = Number(range[0]), to = Number(range[1]);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) return false;
    return day >= from && day <= to;
  }

  function dayStartSeconds(cycle, day = cycle.openDay) {
    return cycle.cycleStart + (Number(day) - 1) * DAY_SECONDS;
  }

  // Task.stage and SignTask.stage name the big stage a row belongs to; both are
  // matched against the whole group so a claim still works during its settle
  // stage.
  function stageGroupFor(rowStage) {
    const stage = Number(rowStage);
    if (stage === STAGE_PRELIMS) return 'prelims';
    if (stage === STAGE_ELMS) return 'elms';
    if (stage === STAGE_FINALS) return 'finals';
    return 'preview';
  }

  function taskProgress(taskType, { prelims, elms }) {
    switch (Number(taskType)) {
      case TASK_TYPE_PRELIMS_CHALLENGE: return prelims.challengeUsed;
      case TASK_TYPE_ELMS_ATTACK: return elms.attackUsed;
      case TASK_TYPE_ELMS_SWEEP: return 0;
      case TASK_TYPE_ELMS_WIN: return 0;
      case TASK_TYPE_PRELIMS_SCORE: return prelims.score;
      default: return null;
    }
  }

  function ensureState(db, roleId, cycle, at) {
    const state = readRoleState(db, roleId, cycle);
    if (!state.exists || state.version !== Number(cycle.version)) {
      state.version = Number(cycle.version);
      state.settleIndex = 0;
      state.initIndex = 0;
      state.specHandle = 0;
      state.teamAward = [];
      writeRoleState(db, state, at);
    }
    return state;
  }

  function matchPerson(person) {
    return { role_id: String(person.role_id), score: Number(person.score ?? 0), is_bot: Boolean(person.is_bot) };
  }

  // ---- prelims opponents ----------------------------------------------------

  // PrelimsConst.init_bot_lib lists the bot rows that seed a fresh opponent
  // list. Opponents are taken in table order starting at the bot whose score is
  // closest to the challenger, so the seeded list tracks the real score band.
  function prelimsOpponents(score, count) {
    const library = Array.isArray(constant.init_bot_lib) ? constant.init_bot_lib.map(Number) : [];
    const bots = library.map(tid => tables.prelimsBot.get(tid)).filter(Boolean)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!bots.length) return [];
    const target = Number(score) || 0;
    let start = 0, best = Infinity;
    bots.forEach((bot, index) => {
      const delta = Math.abs(Number(bot.score ?? 0) - target);
      if (delta < best) { best = delta; start = index; }
    });
    const picked = [];
    for (let offset = 0; offset < count; offset += 1) picked.push(bots[(start + offset) % bots.length]);
    const seen = new Set();
    return picked.filter(bot => {
      const key = String(bot.tid);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(bot => ({ role_id: String(BOT_ROLE_ID_BASE + Number(bot.tid)), score: Number(bot.score ?? 0), is_bot: true }));
  }

  function prelimsRemainingMatch(prelims) {
    const free = Number(constant.free_refresh_count ?? 0);
    return Math.max(0, free + prelims.buyMatch - prelims.matchUsed);
  }

  function prelimsRemainingChallenge(prelims) {
    const free = Number(constant.free_challenge_count ?? 0);
    return Math.max(0, free + prelims.buyChallenge - prelims.challengeUsed);
  }

  // 101105 req_overall_pvp_prelims_match: the client asks for a fresh opponent
  // list; the exchange costs one refresh from the free plus bought budget.
  function prelimsRefresh() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      exactStage(cycle, STAGE_PRELIMS, 'Overall PVP prelims are not open');
      const prelims = readPrelims(db, roleId, cycle);
      if (prelimsRemainingMatch(prelims) <= 0) fail(CODE_LIMIT, 'Overall PVP prelims refresh count is exhausted');
      const opponents = prelimsOpponents(prelims.score, Number(constant.init_bot_num ?? 0));
      if (!opponents.length) fail(CODE_STATE, 'Overall PVP prelims bot library is empty');
      prelims.matchUsed += 1;
      prelims.matchList = opponents;
      prelims.refreshAt = at;
      writePrelims(db, prelims, at);
      const value = { match_times: prelimsRemainingMatch(prelims), match_person: opponents.map(matchPerson) };
      log({ event: 'overall_pvp_prelims_refreshed', opponents: opponents.length });
      return { value, data: codec.pack('pb_overall_pvp_prelims_refresh_opponent_back', value) };
    });
  }

  // 101110 req_overall_pvp_prelims_special_match: free top-up used when the
  // current list is shorter than PrelimsConst.init_bot_num.
  function prelimsSpecialMatch() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      exactStage(cycle, STAGE_PRELIMS, 'Overall PVP prelims are not open');
      const prelims = readPrelims(db, roleId, cycle);
      const wanted = Number(constant.init_bot_num ?? 0);
      const needed = Math.max(0, wanted - prelims.matchList.length);
      if (needed > 0) {
        const candidates = prelimsOpponents(prelims.score, prelims.matchList.length + needed)
          .filter(person => !prelims.matchList.some(existing => String(existing.role_id) === person.role_id))
          .slice(0, needed);
        if (!candidates.length) fail(CODE_STATE, 'Overall PVP prelims bot library is exhausted');
        prelims.matchList = [...prelims.matchList, ...candidates];
        writePrelims(db, prelims, at);
      }
      const value = { match_person: prelims.matchList.map(matchPerson) };
      return { value, data: codec.pack('pb_overall_pvp_prelims_special_match_back', value) };
    });
  }

  // 101106 req_overall_pvp_prelims_buy_times: the client passes
  // OverallPvpTable.OVERALL_PVP_PRE_CHALLENGE_TIMES (0) or
  // OVERALL_PVP_PRE_REFRESH_TIMES (1) and PrelimsBuyTimes prices the purchase.
  function prelimsBuyTimes(etf) {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    const buyType = Number(scalarArgument(etf));
    if (!Number.isSafeInteger(buyType) || buyType < 0 || buyType > 1) invalid('Invalid overall PVP buy type');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      exactStage(cycle, STAGE_PRELIMS, 'Overall PVP prelims are not open');
      const prelims = readPrelims(db, roleId, cycle);
      const bought = buyType === 0 ? prelims.buyChallenge : prelims.buyMatch;
      const index = bought + 1;
      const row = tables.prelimsBuyTimes.find(candidate => Number(candidate.buy_type) === buyType
        && Array.isArray(candidate.rang)
        && index >= Number(candidate.rang[0]) && index <= Number(candidate.rang[1]));
      if (!row) fail(CODE_LIMIT, 'Overall PVP prelims purchase limit reached');
      const costs = rewardPairs(row.consume_list, 'Overall PVP prelims buy');
      if (!costs.length) fail(CODE_STATE, 'Overall PVP prelims buy price is empty');
      const result = consumeResources(model, costs, CODE_INSUFFICIENT, { codec });
      if (buyType === 0) prelims.buyChallenge += 1;
      else prelims.buyMatch += 1;
      writePrelims(db, prelims, at);
      const value = {
        buy_challenge_times: prelims.buyChallenge,
        buy_match_times: prelims.buyMatch,
        res: { changes: result.changes, is_overflow: false }
      };
      log({ event: 'overall_pvp_prelims_purchase_committed', buyType, index });
      return { value, data: codec.pack('pb_overall_pvp_buy_times_back', value) };
    });
  }

  // 101101 req_overall_pvp_elms_buy_count: one click adds one challenge; the
  // price comes from ElmsBuy indexed by the purchase sequence.
  function elmsBuyCount(etf) {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    const wanted = countArgument(etf, MAX_ELMS_BUY_PER_REQUEST);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      stageGate(cycle, 'elms', 'Overall PVP elimination stage is closed');
      const elms = seedElmsQualification(db, roleId, cycle, at);
      if (!elms.isTicket) fail(CODE_STATE, 'Overall PVP elimination qualification is missing');
      if (elms.attackBuy + wanted > MAX_ELMS_PURCHASE) fail(CODE_LIMIT, 'Overall PVP elimination purchase limit reached');
      const costs = [];
      for (let step = ELMS_BUY_STEP; step <= wanted; step += ELMS_BUY_STEP) {
        const row = tables.elmsBuy.get(elms.attackBuy + step);
        if (!row) fail(CODE_STATE, 'Overall PVP elimination price row is missing');
        costs.push([Number(row.cost_item), Number(row.cost_num)]);
      }
      const result = consumeResources(model, costs, CODE_INSUFFICIENT, { codec });
      elms.attackBuy += wanted;
      writeElms(db, elms, at);
      const value = {
        flush: { time: dayStartSeconds(cycle), use_count: elms.attackUsed, buy_count: elms.attackBuy },
        res: { changes: result.changes, is_overflow: false }
      };
      log({ event: 'overall_pvp_elms_purchase_committed', bought: wanted });
      return { value, data: codec.pack('pb_overall_pvp_elms_buy_count_back', value) };
    });
  }

  // ---- task board -----------------------------------------------------------

  function taskRolePb(db, roleId, cycle) {
    return {
      day_bin: claimBits(db, roleId, 'day_task', cycle.version),
      day_ref_time: String(dayStartSeconds(cycle)),
      season_bin: claimBits(db, roleId, 'season_task', cycle.version),
      receive_sign_tid: signCursor(db, roleId)
    };
  }

  // DailyExtraAwad pairs a day window with an ExtraAwadLib row index by index;
  // every window that contains the open day contributes its library once per
  // cycle occurrence.
  function extraDayRewards(db, roleId, cycle) {
    const awards = [], keys = [];
    for (const row of tables.dailyExtraAward) {
      const ranges = Array.isArray(row.day_range) ? row.day_range : [];
      const library = Array.isArray(row.extra_award) ? row.extra_award : [];
      for (let index = 0; index < ranges.length && index < library.length; index += 1) {
        if (!dayWindowContains(ranges[index], cycle.openDay)) continue;
        const lib = tables.extraAwardLib.get(Number(library[index]));
        if (!lib || !Array.isArray(lib.extra_award)) continue;
        const key = cycle.cycleStart + ':' + cycle.openDay + ':' + Number(row.tid) + ':' + index;
        if (claimExists(db, roleId, 'extra_day', key)) continue;
        awards.push(...rewardPairs(lib.extra_award, 'Overall PVP daily extra reward'));
        keys.push(key);
      }
    }
    return { awards, keys };
  }

  // 101102 req_overall_pvp_rev_day_task_award (ETF: {tid}).
  function dayTaskAward(etf) {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    const tid = tidArgument(etf, 'Invalid overall PVP day task id');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const row = tables.tasks.get(tid);
      if (!row) invalid('Overall PVP day task is not configured');
      stageGate(cycle, stageGroupFor(row.stage), 'Overall PVP day task stage is closed');
      if (!dayWindowContains(row.day_range, cycle.openDay)) fail(CODE_STATE, 'Overall PVP day task day window is closed');
      const prelims = readPrelims(db, roleId, cycle);
      const elms = seedElmsQualification(db, roleId, cycle, at);
      if (row.is_fall && !(elms.isTicket && !elms.isWin)) fail(CODE_STATE, 'Overall PVP day task requires the loser bracket');
      if (hasClaimBit(db, roleId, 'day_task', tid, cycle.version)) fail(CODE_ALREADY, 'Overall PVP day task reward was already received');
      const progress = taskProgress(row.task_type, { prelims, elms });
      if (progress === null) {
        fail(CODE_STATE, 'Overall PVP day task progress is not tracked for task type ' + Number(row.task_type));
      }
      if (progress < Number(row.task_count ?? 0)) fail(CODE_STATE, 'Overall PVP day task progress is not met');
      const extra = extraDayRewards(db, roleId, cycle);
      const awards = rewardPairs(row.award, 'Overall PVP day task reward');
      awards.push(...extra.awards);
      const result = grantResources(model, awards, resourceTables(), { codec });
      addClaim(db, roleId, 'day_task', claimKey(cycle.version, tid), at);
      for (const key of extra.keys) addClaim(db, roleId, 'extra_day', key, at);
      const value = { info: taskRolePb(db, roleId, cycle), res: { changes: result.changes, is_overflow: false } };
      log({ event: 'overall_pvp_day_task_committed', tid, extraDays: extra.keys.length });
      return { value, data: codec.pack('pb_overall_pvp_rev_task_award_back', value) };
    });
  }

  // 101103 req_overall_pvp_rev_period_task_award (ETF: tid). EachTask gates on
  // PrelimsLevel tid and carries the matching score threshold in task_count.
  function periodTaskAward(etf) {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    const tid = tidArgument(etf, 'Invalid overall PVP period task id');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const row = tables.eachTasks.get(tid);
      if (!row) invalid('Overall PVP period task is not configured');
      stageGate(cycle, stageGroupFor(row.stage), 'Overall PVP period task stage is closed');
      if (hasClaimBit(db, roleId, 'season_task', tid, cycle.version)) {
        fail(CODE_ALREADY, 'Overall PVP period task reward was already received');
      }
      const prelims = readPrelims(db, roleId, cycle);
      if (prelims.score < Number(row.task_count ?? 0)) fail(CODE_STATE, 'Overall PVP period task score is not reached');
      const level = prelimsLevelForScore(tables, prelims.score);
      if (!level || Number(level.tid) < Number(row.prelims_lv ?? 0)) {
        fail(CODE_STATE, 'Overall PVP period task level is not reached');
      }
      const awards = rewardPairs(row.award, 'Overall PVP period task reward');
      const result = grantResources(model, awards, resourceTables(), { codec });
      addClaim(db, roleId, 'season_task', claimKey(cycle.version, tid), at);
      const value = { info: taskRolePb(db, roleId, cycle), res: { changes: result.changes, is_overflow: false } };
      log({ event: 'overall_pvp_period_task_committed', tid, level: Number(level.tid) });
      return { value, data: codec.pack('pb_overall_pvp_rev_task_award_back', value) };
    });
  }

  // 101121 req_overall_pvp_rev_sign_task_award (ETF: tid). SignTask.day is the
  // open day the entry unlocks on and receive_sign_tid is a single cursor, so
  // the board must be walked in tid order.
  function signTaskAward(etf) {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    const tid = tidArgument(etf, 'Invalid overall PVP sign task id');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const row = tables.signTasks.get(tid);
      if (!row) invalid('Overall PVP sign task is not configured');
      if (tid !== signCursor(db, roleId) + 1) fail(CODE_STATE, 'Overall PVP sign task must be received in order');
      if (Number(row.day ?? 0) > cycle.openDay) fail(CODE_STATE, 'Overall PVP sign task day is not reached');
      stageGate(cycle, stageGroupFor(row.stage), 'Overall PVP sign task stage is closed');
      const awards = rewardPairs(row.award, 'Overall PVP sign task reward');
      const result = grantResources(model, awards, resourceTables(), { codec });
      addClaim(db, roleId, 'sign_task', tid, at);
      const value = { info: taskRolePb(db, roleId, cycle), res: { changes: result.changes, is_overflow: false } };
      log({ event: 'overall_pvp_sign_task_committed', tid });
      return { value, data: codec.pack('pb_overall_pvp_rev_task_award_back', value) };
    });
  }

  // ---- stage rewards --------------------------------------------------------

  // 101108 req_overall_pvp_preview_reward: PreviewRewards is keyed by PVP
  // version and only pays during the notify stage. The command has no dedicated
  // reply message, so the flag is re-read through get_info.
  function previewReward() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      exactStage(cycle, STAGE_NOTIFY, 'Overall PVP preview stage is closed');
      const row = tables.previewRewards.get(Number(cycle.version));
      if (!row) fail(CODE_STATE, 'Overall PVP preview reward is not configured');
      if (claimExists(db, roleId, 'preview', String(cycle.version))) {
        fail(CODE_ALREADY, 'Overall PVP preview reward was already received');
      }
      const awards = rewardPairs(row.award_list, 'Overall PVP preview reward');
      const result = grantResources(model, awards, resourceTables(), { codec });
      addClaim(db, roleId, 'preview', String(cycle.version), at);
      log({ event: 'overall_pvp_preview_reward_committed', version: Number(cycle.version) });
      return { value: { is_reward: true, changes: result.changes }, data: Buffer.alloc(0) };
    });
  }

  // 101124 req_overall_pvp_show_reward: ShowRewards is keyed by PVP version and
  // pays during the finals settle stage.
  function showReward() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      exactStage(cycle, STAGE_FINALS_SETTLE, 'Overall PVP show stage is closed');
      const row = tables.showRewards.get(Number(cycle.version));
      if (!row) fail(CODE_STATE, 'Overall PVP show reward is not configured');
      if (claimExists(db, roleId, 'show', String(cycle.version))) {
        fail(CODE_ALREADY, 'Overall PVP show reward was already received');
      }
      const awards = rewardPairs(row.award_list, 'Overall PVP show reward');
      const result = grantResources(model, awards, resourceTables(), { codec });
      addClaim(db, roleId, 'show', String(cycle.version), at);
      log({ event: 'overall_pvp_show_reward_committed', version: Number(cycle.version) });
      return { value: { is_reward: true, changes: result.changes }, data: Buffer.alloc(0) };
    });
  }

  // 101109 req_overall_pvp_team_num_reward: Lineup rows open a team slot on
  // open_day and carry the award for having that many teams. Every opened row
  // with a non-empty award is paid once per version.
  function teamNumReward() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = ensureState(db, roleId, cycle, at);
      const rows = [...tables.lineups.values()]
        .filter(row => Number(row.version) === Number(cycle.version))
        .sort((left, right) => Number(left.open_day) - Number(right.open_day));
      const claimed = [], awards = [];
      for (const row of rows) {
        const tid = Number(row.tid);
        if (Number(row.open_day) > cycle.openDay) continue;
        if (state.teamAward.includes(tid)) continue;
        const list = Array.isArray(row.award_list) ? rewardPairs(row.award_list, 'Overall PVP lineup reward') : [];
        if (!list.length) continue;
        claimed.push(tid);
        awards.push(...list);
      }
      if (!claimed.length) fail(CODE_STATE, 'Overall PVP lineup reward is not available');
      const result = grantResources(model, awards, resourceTables(), { codec });
      state.teamAward = [...state.teamAward, ...claimed].sort((left, right) => left - right);
      writeRoleState(db, state, at);
      const value = {
        res: { changes: result.changes, is_overflow: false },
        team_award_list: state.teamAward
      };
      log({ event: 'overall_pvp_team_reward_committed', tids: claimed });
      return { value, data: codec.pack('pb_overall_pvp_team_num_award_back', value) };
    });
  }

  // ---- view flags -----------------------------------------------------------

  // 101113/101114/101117 only clear client display flags and have no reply
  // message in the captured protobuf set.
  function clearGroupDirty() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const elms = readElms(db, model.state.roleId, cycle);
      const rank = elms.groupDirtyRank;
      elms.groupDirty = 0;
      writeElms(db, elms, at);
      return { value: { group_dirty: false, group_dirty_rank: String(rank) }, data: Buffer.alloc(0) };
    });
  }

  function clearFinalDirty() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const elms = readElms(db, model.state.roleId, cycle);
      elms.finalDirty = 0;
      writeElms(db, elms, at);
      return { value: { final_dirty: false }, data: Buffer.alloc(0) };
    });
  }

  function clearFailReport() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const elms = readElms(db, model.state.roleId, cycle);
      const cleared = elms.failReports.length;
      elms.failReports = [];
      writeElms(db, elms, at);
      return { value: { cleared }, data: Buffer.alloc(0) };
    });
  }

  // 101115/101116 req_overall_pvp_enter_view / exit_view: the view flags are
  // persisted and the full enter-view payload is delivered inside get_info.
  function enterView() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const state = ensureState(db, model.state.roleId, cycle, at);
      state.enterView = 1;
      state.viewing = 1;
      writeRoleState(db, state, at);
      return { value: { entered: true }, data: Buffer.alloc(0) };
    });
  }

  function exitView() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const state = ensureState(db, model.state.roleId, cycle, at);
      state.enterView = 0;
      state.viewing = 0;
      writeRoleState(db, state, at);
      return { value: { entered: false }, data: Buffer.alloc(0) };
    });
  }

  // ---- reports --------------------------------------------------------------

  function reportPb(row) {
    return {
      stage: Number(row.stage),
      fight_uid: String(row.fight_uid),
      time: String(row.fight_time),
      atk_role_id: String(row.atk_role_id),
      def_role_id: String(row.def_role_id),
      final_result: Number(row.final_result) === 1 ? 1 : 0,
      atk_before_fight_value: Number(row.atk_before),
      atk_after_fight_value: Number(row.atk_after),
      def_before_fight_value: Number(row.def_before),
      def_after_fight_value: Number(row.def_after),
      other_data: Buffer.from(row.other_data ?? []),
      def_is_bot: Number(row.def_is_bot) === 1
    };
  }

  function reportObject(cycle, rows) {
    const value = {
      version: Number(cycle.version),
      stage: Number(cycle.stage?.stage ?? 0),
      report_list: rows.map(reportPb)
    };
    return { value, data: codec.pack('pb_overall_pvp_report_obj', value) };
  }

  // 101111 req_overall_pvp_req_report_person (ETF: role id).
  function reportPersonRequest(etf) {
    const roleId = Number(scalarArgument(etf));
    if (!Number.isSafeInteger(roleId) || roleId <= 0) invalid('Invalid overall PVP report role id');
    const cycle = cycleAt(nowSeconds());
    return store.inspect(db => {
      const limit = Number(elmsConstant?.role_report_num ?? 0) || 30;
      const rows = db.prepare('SELECT * FROM overall_pvp_reports WHERE atk_role_id=? OR def_role_id=? ORDER BY fight_time DESC LIMIT ?')
        .all(String(roleId), String(roleId), limit);
      return reportObject(cycle, rows);
    });
  }

  // 101112 req_overall_pvp_report_top.
  function reportTopRequest() {
    const cycle = cycleAt(nowSeconds());
    return store.inspect(db => {
      const limit = Number(elmsConstant?.peak_report_num ?? 0) || 30;
      const rows = db.prepare('SELECT * FROM overall_pvp_reports ORDER BY fight_time DESC LIMIT ?').all(limit);
      return reportObject(cycle, rows);
    });
  }

  // 101118 req_overall_pvp_scroll: the marquee is built from real stored fights
  // and stays empty until a fight path writes rows.
  function scrollList() {
    return store.inspect(db => {
      const limit = Number(elmsConstant?.peak_show ?? 0) || 10;
      const rows = db.prepare('SELECT * FROM overall_pvp_reports ORDER BY fight_time DESC LIMIT ?').all(limit);
      const value = {
        scroll_list: rows.map(row => {
          const atk = String(row.atk_role_id), def = String(row.def_role_id);
          const atkWin = Number(row.final_result) === 1;
          const defBot = Number(row.def_is_bot) === 1;
          const botId = defBot ? Number(def) - BOT_ROLE_ID_BASE : 0;
          return {
            win_role: atkWin ? atk : def,
            lose_role: atkWin ? def : atk,
            bot_id: Number.isSafeInteger(botId) && botId > 0 ? botId : 0
          };
        })
      };
      return { value, data: codec.pack('pb_overall_pvp_scroll_list', value) };
    });
  }

  // 101130 req_overall_pvp_history_data: Base.history_rank_len caps how many
  // entries each past version keeps.
  function historyData() {
    const cycle = cycleAt(nowSeconds());
    return store.inspect(db => {
      const rows = db.prepare('SELECT * FROM overall_pvp_history ORDER BY version ASC, rank ASC').all();
      const base = baseConfigForVersion(tables, cycle.version);
      const limit = Number(base?.history_rank_len ?? 0);
      const groups = new Map();
      for (const row of rows) {
        const version = Number(row.version);
        const list = groups.get(version) ?? [];
        if (limit > 0 && list.length >= limit) continue;
        list.push({ rank: Number(row.rank), role_id: String(row.role_id) });
        groups.set(version, list);
      }
      const value = {
        history_version_list: [...groups.entries()]
          .sort((left, right) => left[0] - right[0])
          .map(([version, list]) => ({ version, history_person_list: list }))
      };
      return { value, data: codec.pack('pb_overall_pvp_history_version_list', value) };
    });
  }

  // ---- guess board ----------------------------------------------------------

  function guessList(db, roleId, cycle) {
    const rows = db.prepare('SELECT * FROM overall_pvp_guesses WHERE role_id=? AND version=? ORDER BY guess_type, round')
      .all(roleId, Number(cycle.version));
    const groups = new Map();
    const ensure = type => {
      let group = groups.get(type);
      if (!group) {
        group = { guess_type: type, guess_person_list: [], rank_role_list: [], guess_times: 0, guess_change_times: 0, is_rank_reward: false };
        groups.set(type, group);
      }
      return group;
    };
    for (const row of rows) {
      const group = ensure(Number(row.guess_type));
      group.guess_person_list.push({
        round: Number(row.round),
        win_role_id: String(row.win_role_id),
        is_reward: Number(row.is_reward) === 1
      });
      group.guess_times += 1;
    }
    const rank = db.prepare('SELECT * FROM overall_pvp_rank_guesses WHERE role_id=? AND version=?').get(roleId, Number(cycle.version));
    if (rank) {
      const group = ensure(GUESS_TYPE_FINAL_RANK);
      group.rank_role_list = parseList(rank.role_list).map(String);
      group.guess_times = Number(rank.guess_times);
      group.guess_change_times = Number(rank.change_times);
      group.is_rank_reward = Number(rank.is_rank_reward) === 1;
    }
    return [...groups.values()].sort((left, right) => left.guess_type - right.guess_type);
  }

  // 101129 req_overall_pvp_rank_guess_num: the popularity board counts how many
  // roles guessed each final ranking.
  function rankGuessNum() {
    const cycle = cycleAt(nowSeconds());
    return store.inspect(db => {
      const rows = db.prepare('SELECT role_list FROM overall_pvp_rank_guesses WHERE version=?').all(Number(cycle.version));
      const counts = new Map();
      for (const row of rows) {
        for (const roleId of parseList(row.role_list)) {
          const key = String(roleId);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      const ordered = [...counts.entries()].sort((left, right) => right[1] - left[1] || (left[0] < right[0] ? -1 : 1));
      const value = { rank_guess_num_list: ordered.map(([roleId, score]) => ({ role_id: roleId, score })) };
      return { value, data: codec.pack('pb_overall_pvp_rank_guess_num_list', value) };
    });
  }

  // ---- full snapshot --------------------------------------------------------

  // 101122 req_overall_pvp_get_info. The client asks for this snapshot instead of
  // a login module, so every person record is built here from authoritative
  // state. The optional enter_view_back field stays empty: the enter-view payload
  // is produced by req_overall_pvp_try_init_lineup.
  function getInfo() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = ensureState(db, roleId, cycle, at);
      const prelims = readPrelims(db, roleId, cycle);
      const elms = seedElmsQualification(db, roleId, cycle, at);
      const prePerson = {
        score: prelims.score,
        challenge_times: prelimsRemainingChallenge(prelims),
        match_times: prelimsRemainingMatch(prelims),
        match_list: prelims.matchList.map(matchPerson),
        win_times: prelims.winTimes,
        fight_times: prelims.fightTimes,
        refresh_day: prelims.refreshDay,
        def_before_score: prelims.defBeforeScore,
        buy_challenge_times: prelims.buyChallenge,
        buy_match_times: prelims.buyMatch,
        is_settle: prelims.isSettle === 1,
        is_init: prelims.isInit === 1,
        max_score: prelims.maxScore
      };
      const elmsPerson = {
        is_ticket: elms.isTicket === 1,
        is_win: elms.isWin === 1,
        rank: String(elms.rank),
        best_win_rank: String(elms.bestWinRank),
        best_fail_rank: String(elms.bestFailRank),
        attack_flush: { time: dayStartSeconds(cycle), use_count: elms.attackUsed, buy_count: elms.attackBuy },
        match_flush: { time: dayStartSeconds(cycle), use_count: elms.matchUsed, buy_count: elms.matchBuy },
        match_list: elms.matchList.map(person => ({ role_id: String(person.role_id), rank: String(person.rank ?? 0) })),
        group_dirty: elms.groupDirty === 1,
        group_dirty_rank: String(elms.groupDirtyRank),
        final_dirty: elms.finalDirty === 1,
        fail_report_list: elms.failReports.map(String)
      };
      const value = {
        pre_person: prePerson,
        elms_person: elmsPerson,
        final_person: {
          join_version: 0,
          is_player: false,
          day_watch: { flush_time: dayStartSeconds(cycle), count: 0 },
          last_watch_time: '0'
        },
        task_role: taskRolePb(db, roleId, cycle),
        pvp_data: {
          version: Number(cycle.version),
          stage: stageOf(cycle),
          stage_control_list: tables.stages.map(row => ({
            stage: Number(row.tid),
            start_time: cycle.cycleStart + Number(row.start_time),
            continued_time: Number(row.continued_time)
          })),
          start_time: cycle.cycleStart,
          end_time: cycle.cycleEnd
        },
        preview_person: { is_reward: claimExists(db, roleId, 'preview', String(cycle.version)) },
        pvp_person: {
          team_award_list: state.teamAward,
          settle_index: state.settleIndex === 1,
          init_index: state.initIndex === 1,
          version: Number(cycle.version),
          spec_handle: state.specHandle === 1
        },
        show_person: { is_reward: claimExists(db, roleId, 'show', String(cycle.version)) },
        guess_person: { guess_list: guessList(db, roleId, cycle) }
      };
      return { value, data: codec.pack('pb_overall_pvp_get_info', value) };
    });
  }

  // 101123 req_overall_pvp_try_init_lineup: returns the play lineups whose
  // Lineup row is already open for this version and marks the role initialised.
  function tryInitLineup() {
    const at = nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const state = ensureState(db, model.state.roleId, cycle, at);
      const types = [...tables.lineups.values()]
        .filter(row => Number(row.version) === Number(cycle.version) && Number(row.open_day) <= cycle.openDay)
        .map(row => Number(row.lineup));
      const lineupList = (model.playLineups ?? [])
        .filter(lineup => types.includes(Number(lineup.type)))
        .map(lineup => ({ ...lineup }));
      state.initIndex = 1;
      writeRoleState(db, state, at);
      const value = { is_init: true, lineup_list: lineupList };
      log({ event: 'overall_pvp_lineup_initialised', types: lineupList.map(lineup => Number(lineup.type)) });
      return { value, data: codec.pack('pb_overall_pvp_enter_view_back', value) };
    });
  }

  // ---- storage hooks --------------------------------------------------------

  // Fight reports are written by any future battle path; reads above stay empty
  // while no row exists, which is the honest state for a single local server.
  function recordReport(entry) {
    const at = Number.isSafeInteger(Number(entry?.fightTime)) ? Number(entry.fightTime) : nowSeconds();
    const fightUid = Number(entry?.fightUid);
    if (!Number.isSafeInteger(fightUid) || fightUid <= 0) invalid('Invalid overall PVP fight id');
    const stage = integer(entry?.stage ?? 0, 0, 100, 'Invalid overall PVP report stage');
    return store.transaction((model, db) => {
      db.prepare(`INSERT INTO overall_pvp_reports(role_id,stage,fight_uid,fight_time,atk_role_id,def_role_id,final_result,
          atk_before,atk_after,def_before,def_after,def_is_bot,other_data,created_at)
        VALUES(0,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(role_id,fight_uid) DO NOTHING`)
        .run(stage, fightUid, at, String(entry.atkRoleId ?? ''), String(entry.defRoleId ?? ''),
          Number(entry.result ?? 0) === 1 ? 1 : 0, Number(entry.atkBefore ?? 0), Number(entry.atkAfter ?? 0),
          Number(entry.defBefore ?? 0), Number(entry.defAfter ?? 0), entry.defIsBot ? 1 : 0,
          Buffer.from(entry.otherData ?? []), iso(at));
      return { fightUid };
    });
  }

  // The client has no recovered login module for OverallPvpMgr: the snapshot
  // arrives through 101122. Login only makes sure the cycle row exists so the
  // first get_info already reports the right version.
  function ensureLoginState(loginSeconds) {
    const provided = Number(loginSeconds);
    const at = Number.isSafeInteger(provided) && provided > 0 ? provided : nowSeconds();
    const cycle = cycleAt(at);
    return store.transaction((model, db) => {
      const state = ensureState(db, model.state.roleId, cycle, at);
      return { version: Number(cycle.version), stage: stageOf(cycle), openDay: cycle.openDay, enterView: state.enterView };
    });
  }

  function supports(type) { return SUPPORTED.has(Number(type)); }

  async function execute(type, input, context = {}) {
    const argument = context && context.etf !== undefined ? context.etf : input;
    switch (Number(type)) {
      case COMMAND_ELF_BUY_COUNT: return elmsBuyCount(argument);
      case COMMAND_DAY_TASK_AWARD: return dayTaskAward(argument);
      case COMMAND_PERIOD_TASK_AWARD: return periodTaskAward(argument);
      case COMMAND_PRELIMS_MATCH: return prelimsRefresh();
      case COMMAND_PRELIMS_BUY_TIMES: return prelimsBuyTimes(argument);
      case COMMAND_PREVIEW_REWARD: return previewReward();
      case COMMAND_TEAM_NUM_REWARD: return teamNumReward();
      case COMMAND_PRELIMS_SPECIAL_MATCH: return prelimsSpecialMatch();
      case COMMAND_REPORT_PERSON: return reportPersonRequest(argument);
      case COMMAND_REPORT_TOP: return reportTopRequest();
      case COMMAND_ELMS_CLEAR_GROUP_DIRTY: return clearGroupDirty();
      case COMMAND_ELMS_CLEAR_FINAL_DIRTY: return clearFinalDirty();
      case COMMAND_ENTER_VIEW: return enterView();
      case COMMAND_EXIT_VIEW: return exitView();
      case COMMAND_ELMS_CLEAR_FAIL_REPORT: return clearFailReport();
      case COMMAND_SCROLL: return scrollList();
      case COMMAND_SIGN_TASK_AWARD: return signTaskAward(argument);
      case COMMAND_GET_INFO: return getInfo();
      case COMMAND_TRY_INIT_LINEUP: return tryInitLineup();
      case COMMAND_SHOW_REWARD: return showReward();
      case COMMAND_RANK_GUESS_NUM: return rankGuessNum();
      case COMMAND_HISTORY_DATA: return historyData();
      // Everything below needs opponents or a ranking that a single local
      // server cannot produce. Each one fails with a named reason instead of
      // inventing a bracket or paying a reward that was never earned.
      case COMMAND_ELMS_MATCH:
        fail(CODE_STATE, 'Overall PVP elimination match needs a real bracket opponent list');
        return null;
      case COMMAND_ELMS_SWEEP:
        fail(CODE_STATE, 'Overall PVP elimination sweep needs real bracket opponents');
        return null;
      case COMMAND_FINAL_RECORD:
        fail(CODE_STATE, 'Overall PVP final record needs a real cross-server final bracket');
        return null;
      case COMMAND_FINAL_WATCH_AWARD:
        fail(CODE_STATE, 'Overall PVP watch award needs a real final bracket');
        return null;
      case COMMAND_FIGHT_GUESS:
        fail(CODE_STATE, 'Overall PVP fight guess needs a real final bracket pair');
        return null;
      case COMMAND_RANK_GUESS:
        fail(CODE_STATE, 'Overall PVP rank guess needs a real final ranking');
        return null;
      case COMMAND_FIGHT_GUESS_REWARD:
        fail(CODE_STATE, 'Overall PVP fight guess reward needs a settled final round');
        return null;
      case COMMAND_RANK_GUESS_REWARD:
        fail(CODE_STATE, 'Overall PVP rank guess reward needs a settled final ranking');
        return null;
      default:
        fail(CODE_INVALID, 'Unsupported overall PVP command');
        return null;
    }
  }

  return {
    supports, execute, ensureLoginState, recordReport,
    cycleAt, stageOf, tables,
    elmsBuyCount, dayTaskAward, periodTaskAward, signTaskAward, previewReward, showReward, teamNumReward,
    prelimsRefresh, prelimsSpecialMatch, prelimsBuyTimes, reportPersonRequest, reportTopRequest,
    clearGroupDirty, clearFinalDirty, clearFailReport, enterView, exitView, scrollList,
    getInfo, tryInitLineup, rankGuessNum, historyData
  };
}