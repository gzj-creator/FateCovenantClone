import { GameError } from './hero-progression.mjs';
import { encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMatchPvpTables, stageForScore } from '../config/match-pvp-tables.mjs';
import { buildFightReport, rosterFor, simulatePvpBattle } from './pvp-battle.mjs';

// TournamentCmd: 88501 req_tournament_clear_change ... 88511 req_tournament_enter_form.
//
// Evidence for this module:
//   personal-server/assets/protobuf/tournament.{db,net}.proto.bin plus the shared
//   match_pvp.{db,net}.proto.bin and fight.net.proto.bin (plain .proto text).
//   Client bytecode TournamentCmd / TournamentMgr / MatchPVPNetMgr / MatchPVPDataMgr.
//   Cmd.lua c2s_back registers the reply schemas, including the shared
//   pb_hunter_arena_history_rank_rsp reply of 88508, and c2s_index shows that every request is
//   ETF encoded except 88509, which the client builds with EncodePB.
//   The recorded login fixture carries module 150 as a single 38 byte pb_tournament_login
//   block (TournamentMgr.ParseLoginData).
//
// MatchPvpTable type 1 is the tournament (位面锦标赛): init_score 100, min_score 100,
// min_win_gain 3, fight_report_num 15, palace_season 5, fight_tid 1501001, start_day 15.
// Type 2 of the same table belongs to the 时空冠位赛 (HunterArenaCmd) and is only read here
// through the shared stage ladder helper.
//
// Ranked battles are simulated by game/pvp-battle.mjs against a roster the deployment supplies
// through the enemyRoster option. The shipped tables carry no opponent line-up (FightTable
// def_team is null for every row), so the fight and the promote battle fail closed when no
// provider is wired.
export const TOURNAMENT_MODULE_ID = 150;
export const TOURNAMENT_LOGIN_SCHEMA = 'pb_tournament_login';
export const TOURNAMENT_FUN_TYPE = 1;
export const TOURNAMENT_COMMANDS = Object.freeze([88501, 88502, 88503, 88504, 88505, 88506, 88507, 88508, 88509, 88510, 88511]);
export const TOURNAMENT_PROTOBUF_COMMANDS = Object.freeze({ 88509: 'pb_match_pvp_set_report_lock' });

const COMMAND_CLEAR_CHANGE = 88501;
const COMMAND_DAY_AWARD = 88502;
const COMMAND_SEASON_AWARD = 88503;
const COMMAND_PALACE = 88504;
const COMMAND_FIGHT = 88505;
const COMMAND_SET_IGNORE = 88506;
const COMMAND_SET_READ_REPORT_TIME = 88507;
const COMMAND_HISTORY_RANK = 88508;
const COMMAND_REPORT_LOCK = 88509;
const COMMAND_START_PROMOTE = 88510;
const COMMAND_ENTER_FORM = 88511;

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;

// TaskTable.Type maps the day task families onto shared statistics rows:
//   12401 -> CountStatistics 50 expand 1 (tournament attacks)
//   12402 -> CountStatistics 50 expand 2 (tournament wins)
//   7002  -> CountStatistics 37 expand 1 (hunter arena attacks)
//   7003  -> CountStatistics 37 expand 2 (hunter arena wins)
const TASK_TYPE_ATTACKS = new Set([12401, 7002]);
const TASK_TYPE_WINS = new Set([12402, 7003]);

// pb_tournament_promote.state is "defined by the 位面锦标赛 table". The shipped tables do not
// name that enumeration, so this service uses 0 = not fought, 1 = won, 2 = lost.
const PROMOTE_PENDING = 0;
const PROMOTE_WON = 1;
const PROMOTE_LOST = 2;

const SEASON = 1;
const DAY_SECONDS = 86400;
const WEEK_SECONDS = 604800;

export function isTournamentEtfRequest(type) {
  return !(Number(type) in TOURNAMENT_PROTOBUF_COMMANDS);
}

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function optionalInteger(value, min, max, message) {
  if (value === null || value === undefined || value === '') return null;
  return integer(value, min, max, message);
}

function seconds(milliseconds) {
  return Math.floor(Number(milliseconds) / 1000);
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(Number(milliseconds) / 1000) * 1000).toISOString();
}

function dayKeyOf(nowSeconds) {
  return new Date(Math.floor(Number(nowSeconds)) * 1000).toISOString().slice(0, 10);
}

// The client renders the season countdown from the MatchPvpTable State rows of type 1
// (101 open, 104 close). The week is anchored to Monday 00:00 of the server time zone because
// the rows only store [day, hour, minute].
function weekStartSeconds(nowMilliseconds) {
  const date = new Date(Number(nowMilliseconds));
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (midnight.getDay() + 6) % 7;
  return Math.floor((midnight.getTime() - offset * DAY_SECONDS * 1000) / 1000);
}

function boundarySeconds(row, weekStart) {
  const date = Array.isArray(row?.date) ? row.date.map(Number) : [];
  if (date.length < 3 || !date.slice(0, 3).every(Number.isSafeInteger)) return 0;
  return weekStart + date[0] * DAY_SECONDS + date[1] * 3600 + date[2] * 60;
}

function nextWeeklyBoundary(tables, tid, nowSeconds) {
  const weekStart = weekStartSeconds(nowSeconds * 1000);
  const row = tables.states.find(entry => Number(entry.tid) === Number(tid) && Number(entry.type) === TOURNAMENT_FUN_TYPE);
  if (!row) return 0;
  let boundary = boundarySeconds(row, weekStart);
  if (!boundary) return 0;
  while (boundary <= nowSeconds) boundary += WEEK_SECONDS;
  return boundary;
}

function firstInteger(value) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstInteger(entry);
      if (found !== null) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const key of ['idx', 'index', 'tid', 'stage', 'level', 'value']) {
      const raw = value[key];
      if (raw === undefined || raw === null || raw === '') continue;
      const number = Number(raw);
      if (Number.isSafeInteger(number)) return number;
    }
    return null;
  }
  if (value === undefined || value === null || value === '' || value === true || value === false) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function firstBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstBoolean(entry);
      if (found !== null) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const key of ['ignore', 'ignore_match_show', 'is_ignore', 'value']) {
      if (value[key] !== undefined) {
        const found = firstBoolean(value[key]);
        if (found !== null) return found;
      }
    }
    return null;
  }
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return null;
  return number !== 0;
}

function integerList(value) {
  const list = [];
  const visit = (entry) => {
    if (entry === undefined || entry === null || entry === '') return;
    if (Array.isArray(entry)) { entry.forEach(visit); return; }
    if (typeof entry === 'object') {
      for (const key of ['idx', 'index', 'idx_list', 'idxs', 'indexes']) {
        if (entry[key] !== undefined) visit(entry[key]);
      }
      return;
    }
    const number = Number(entry);
    if (Number.isSafeInteger(number)) list.push(number);
  };
  visit(value);
  return [...new Set(list)];
}

function parseJson(text, fallback) {
  try { const value = JSON.parse(text || ''); return value ?? fallback; } catch { return fallback; }
}

function parseHex(text) {
  return text ? Buffer.from(text, 'hex') : Buffer.alloc(0);
}

function enable(tables) {
  const type = tables.types.get(TOURNAMENT_FUN_TYPE);
  if (!type) throw new Error('Tournament type configuration is missing');
  return type;
}

function ensureTables(db) {
  db.exec([
    'CREATE TABLE IF NOT EXISTS tournament_role (',
    '  role_id INTEGER PRIMARY KEY,',
    '  season INTEGER NOT NULL,',
    '  score INTEGER NOT NULL,',
    '  max_score INTEGER NOT NULL,',
    '  last_max_score INTEGER NOT NULL,',
    '  score_change INTEGER NOT NULL,',
    '  recent_fight_result INTEGER NOT NULL,',
    '  fight_times INTEGER NOT NULL,',
    '  win_times INTEGER NOT NULL,',
    '  got_day_award TEXT NOT NULL,',
    '  got_season_award TEXT NOT NULL,',
    '  last_flush_stamp INTEGER NOT NULL,',
    '  day_key TEXT NOT NULL,',
    '  read_report_time INTEGER NOT NULL,',
    '  ignore_match_show INTEGER NOT NULL,',
    '  stage INTEGER NOT NULL,',
    '  score_cache INTEGER NOT NULL,',
    '  promote TEXT NOT NULL,',
    '  fight_reports TEXT NOT NULL,',
    '  last_join_season INTEGER NOT NULL,',
    '  got_rank_award_day INTEGER NOT NULL,',
    '  day_fight_times INTEGER NOT NULL,',
    '  day_win_times INTEGER NOT NULL,',
    '  best_rank TEXT NOT NULL,',
    '  fight_seq INTEGER NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS tournament_claims (',
    '  role_id INTEGER NOT NULL,',
    '  claim_type TEXT NOT NULL,',
    '  claim_key TEXT NOT NULL,',
    '  created_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, claim_type, claim_key)',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS tournament_fight (',
    '  role_id INTEGER NOT NULL,',
    '  fight_uid TEXT NOT NULL,',
    '  atk_win INTEGER NOT NULL,',
    '  score_change INTEGER NOT NULL,',
    '  atk_score INTEGER NOT NULL,',
    '  def_score INTEGER NOT NULL,',
    '  atk_stage INTEGER NOT NULL,',
    '  def_stage INTEGER NOT NULL,',
    '  stamp INTEGER NOT NULL,',
    '  locked INTEGER NOT NULL,',
    '  PRIMARY KEY(role_id, fight_uid)',
    ')'
  ].join('\n'));
}

function emptyState(roleId, nowSeconds, type) {
  return {
    roleId,
    season: SEASON,
    score: type.initScore,
    maxScore: type.initScore,
    lastMaxScore: 0,
    scoreChange: 0,
    recentFightResult: 0,
    fightTimes: 0,
    winTimes: 0,
    gotDayAward: Buffer.alloc(0),
    gotSeasonAward: Buffer.alloc(0),
    lastFlushStamp: nowSeconds,
    dayKey: dayKeyOf(nowSeconds),
    readReportTime: 0,
    ignoreMatchShow: false,
    stage: 0,
    scoreCache: 0,
    promote: [],
    fightReports: [],
    lastJoinSeason: 0,
    gotRankAwardDay: 0,
    dayFightTimes: 0,
    dayWinTimes: 0,
    bestRank: [],
    fightSeq: 0,
    exists: false
  };
}

function readState(db, roleId, nowMs, type) {
  const nowSeconds = seconds(nowMs);
  const row = db.prepare('SELECT * FROM tournament_role WHERE role_id=?').get(roleId);
  let state;
  if (!row) {
    state = emptyState(roleId, nowSeconds, type);
  } else {
    const promote = parseJson(row.promote, []);
    const fightReports = parseJson(row.fight_reports, []);
    const bestRank = parseJson(row.best_rank, []);
    state = {
      roleId,
      season: Number(row.season ?? SEASON),
      score: Number(row.score ?? type.initScore),
      maxScore: Number(row.max_score ?? type.initScore),
      lastMaxScore: Number(row.last_max_score ?? 0),
      scoreChange: Number(row.score_change ?? 0),
      recentFightResult: Number(row.recent_fight_result ?? 0),
      fightTimes: Number(row.fight_times ?? 0),
      winTimes: Number(row.win_times ?? 0),
      gotDayAward: parseHex(row.got_day_award),
      gotSeasonAward: parseHex(row.got_season_award),
      lastFlushStamp: Number(row.last_flush_stamp ?? nowSeconds),
      dayKey: row.day_key || dayKeyOf(nowSeconds),
      readReportTime: Number(row.read_report_time ?? 0),
      ignoreMatchShow: Boolean(row.ignore_match_show),
      stage: Number(row.stage ?? 0),
      scoreCache: Number(row.score_cache ?? 0),
      promote: Array.isArray(promote) ? promote : [],
      fightReports: Array.isArray(fightReports) ? fightReports : [],
      lastJoinSeason: Number(row.last_join_season ?? 0),
      gotRankAwardDay: Number(row.got_rank_award_day ?? 0),
      dayFightTimes: Number(row.day_fight_times ?? 0),
      dayWinTimes: Number(row.day_win_times ?? 0),
      bestRank: Array.isArray(bestRank) ? bestRank : [],
      fightSeq: Number(row.fight_seq ?? 0),
      exists: true
    };
  }
  // Cross day flush keeps the score, the season counters and the season award bits, and resets
  // the daily counters and the day award bits. The client detects the same boundary through
  // base.last_flush_stamp (MatchPVPDataMgr.IsSameDay).
  const today = dayKeyOf(nowSeconds);
  if (state.dayKey !== today) {
    state.dayKey = today;
    state.lastFlushStamp = nowSeconds;
    state.dayFightTimes = 0;
    state.dayWinTimes = 0;
    state.gotDayAward = Buffer.alloc(0);
    state.gotRankAwardDay = 0;
  }
  return state;
}

const WRITE_COLUMNS = [
  'role_id', 'season', 'score', 'max_score', 'last_max_score', 'score_change',
  'recent_fight_result', 'fight_times', 'win_times', 'got_day_award', 'got_season_award',
  'last_flush_stamp', 'day_key', 'read_report_time', 'ignore_match_show', 'stage',
  'score_cache', 'promote', 'fight_reports', 'last_join_season', 'got_rank_award_day',
  'day_fight_times', 'day_win_times', 'best_rank', 'fight_seq', 'updated_at'
];

const WRITE_UPDATE = [
  'season=excluded.season',
  'score=excluded.score',
  'max_score=excluded.max_score',
  'last_max_score=excluded.last_max_score',
  'score_change=excluded.score_change',
  'recent_fight_result=excluded.recent_fight_result',
  'fight_times=excluded.fight_times',
  'win_times=excluded.win_times',
  'got_day_award=excluded.got_day_award',
  'got_season_award=excluded.got_season_award',
  'last_flush_stamp=excluded.last_flush_stamp',
  'day_key=excluded.day_key',
  'read_report_time=excluded.read_report_time',
  'ignore_match_show=excluded.ignore_match_show',
  'stage=excluded.stage',
  'score_cache=excluded.score_cache',
  'promote=excluded.promote',
  'fight_reports=excluded.fight_reports',
  'last_join_season=excluded.last_join_season',
  'got_rank_award_day=excluded.got_rank_award_day',
  'day_fight_times=excluded.day_fight_times',
  'day_win_times=excluded.day_win_times',
  'best_rank=excluded.best_rank',
  'fight_seq=excluded.fight_seq',
  'updated_at=excluded.updated_at'
];

function writeState(db, state, nowMs) {
  const values = [
    state.roleId, state.season, state.score, state.maxScore, state.lastMaxScore, state.scoreChange,
    state.recentFightResult, state.fightTimes, state.winTimes, state.gotDayAward.toString('hex'),
    state.gotSeasonAward.toString('hex'), state.lastFlushStamp, state.dayKey, state.readReportTime,
    state.ignoreMatchShow ? 1 : 0, state.stage, state.scoreCache, JSON.stringify(state.promote),
    JSON.stringify(state.fightReports), state.lastJoinSeason, state.gotRankAwardDay,
    state.dayFightTimes, state.dayWinTimes, JSON.stringify(state.bestRank), state.fightSeq,
    isoSeconds(nowMs)
  ];
  db.prepare([
    'INSERT INTO tournament_role (' + WRITE_COLUMNS.join(', ') + ')',
    'VALUES (' + WRITE_COLUMNS.map(() => '?').join(',') + ')',
    'ON CONFLICT(role_id) DO UPDATE SET ' + WRITE_UPDATE.join(', ')
  ].join('\n')).run(...values);
}

function claimed(db, roleId, claimType, claimKey) {
  return Boolean(db.prepare('SELECT 1 FROM tournament_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
    .get(roleId, claimType, claimKey));
}

function recordClaim(db, roleId, claimType, claimKey, createdAt) {
  db.prepare('INSERT INTO tournament_claims VALUES (?,?,?,?)').run(roleId, claimType, claimKey, createdAt);
}

function resPacket(changes) {
  return { changes: changes ?? [], is_overflow: false };
}

export function createTournamentService({
  store,
  codec,
  tables = readMatchPvpTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {},
  enemyRoster = null
}) {
  const log = event => { try { logger(event); } catch { /* logging must not fail a command */ } };
  const resourceTables = () => gameTables ?? readGameTables();
  const type = enable(tables);

  const dayTaskRows = () => tables.dayTasks
    .filter(row => Number(row.type) === TOURNAMENT_FUN_TYPE)
    .sort((left, right) => Number(left.tid) - Number(right.tid));
  const levelRows = () => (tables.levelsByType.get(TOURNAMENT_FUN_TYPE) ?? [])
    .filter(row => Number(row.type) === TOURNAMENT_FUN_TYPE);

  function stageTidOf(score) {
    return Number(stageForScore(tables, TOURNAMENT_FUN_TYPE, score)?.tid ?? 0);
  }

  function nextLevelRow(stageTid) {
    const rows = levelRows();
    const position = rows.findIndex(row => Number(row.tid) === Number(stageTid));
    if (position < 0) return null;
    return rows[position + 1] ?? null;
  }

  function rankOf(db, roleId, score) {
    const row = db.prepare('SELECT COUNT(*) AS total FROM tournament_role WHERE role_id<>? AND score>?').get(roleId, Number(score));
    return Number(row?.total ?? 0) + 1;
  }

  function dayProgress(state, taskType) {
    const key = Number(taskType);
    if (TASK_TYPE_ATTACKS.has(key)) return state.dayFightTimes;
    if (TASK_TYPE_WINS.has(key)) return state.dayWinTimes;
    return 0;
  }

  function bestRankPacket(state) {
    return state.bestRank.map(entry => ({
      day_index: Number(entry.dayIndex ?? entry.day_index ?? 0),
      best_value: Number(entry.bestValue ?? entry.best_value ?? 0)
    }));
  }

  function reportPacket(entry) {
    return {
      score_change: Number(entry.scoreChange ?? entry.score_change ?? 0),
      fight_uid: String(entry.fightUid ?? entry.fight_uid ?? '0'),
      fight_stamp: Number(entry.fightStamp ?? entry.fight_stamp ?? 0),
      enemy: String(entry.enemy ?? '0'),
      is_atk: Boolean(entry.isAtk ?? entry.is_atk),
      atk_change: entry.atkChange ?? entry.atk_change ?? {},
      def_change: entry.defChange ?? entry.def_change ?? {},
      locked: Boolean(entry.locked),
      atk_win: Boolean(entry.atkWin ?? entry.atk_win),
      atk_stage: Number(entry.atkStage ?? entry.atk_stage ?? 0),
      def_stage: Number(entry.defStage ?? entry.def_stage ?? 0)
    };
  }

  function basePacket(state) {
    return {
      season: state.season,
      max_score: state.maxScore,
      last_max_score: state.lastMaxScore,
      score_change: state.scoreChange,
      recent_fight_result: state.recentFightResult,
      fight_times: state.fightTimes,
      win_times: state.winTimes,
      got_day_award: encodeBitBlock(state.gotDayAward),
      got_season_award: encodeBitBlock(state.gotSeasonAward),
      last_flush_stamp: state.lastFlushStamp,
      fight_reports: state.fightReports.map(reportPacket),
      read_report_time: state.readReportTime,
      ignore_match_show: state.ignoreMatchShow,
      last_join_season: state.lastJoinSeason,
      last_season_win_times: 0,
      last_season_fight_times: 0,
      got_rank_award_day: state.gotRankAwardDay,
      got_stage_award: false,
      new_stage_fight_times: 0,
      cross_open_day: '0',
      last_cross_open_day: '0',
      stage_wins: [],
      recent_not_repeat_enemy: [],
      best_rank: bestRankPacket(state),
      best_stage: []
    };
  }

  function rolePacket(state) {
    return {
      base: basePacket(state),
      promote: state.promote.map(entry => ({
        role_id: String(entry.roleId),
        state: Number(entry.state),
        score: Number(entry.score)
      })),
      stage: state.stage,
      score_cache: state.scoreCache
    };
  }

  function updateBestRank(state, nowSeconds, rank) {
    const dayIndex = Math.floor(Number(nowSeconds) / DAY_SECONDS);
    const list = state.bestRank.slice();
    const entry = list.find(item => Number(item.dayIndex ?? item.day_index) === dayIndex);
    if (entry) {
      if (Number(rank) < Number(entry.bestValue ?? entry.best_value)) entry.bestValue = Number(rank);
    } else {
      list.push({ dayIndex, bestValue: Number(rank) });
    }
    list.sort((left, right) => Number(right.dayIndex) - Number(left.dayIndex));
    state.bestRank = list.slice(0, 7);
  }

  function nextFightUid(state, nowMs) {
    state.fightSeq = (state.fightSeq + 1) % 1000;
    return (BigInt(Math.floor(Number(nowMs))) * 1000n + BigInt(state.fightSeq)).toString();
  }

  function resolveOpponent({ score, stage, fightTid, botTid }) {
    if (typeof enemyRoster !== 'function') {
      fail(CODE_STATE, 'Tournament opponent roster is not supplied by the deployment');
    }
    let supplied = null;
    try {
      supplied = enemyRoster({ score: Number(score), stage: Number(stage), fightTid: Number(fightTid), botTid: botTid ? Number(botTid) : 0 });
    } catch (error) {
      if (error instanceof GameError) throw error;
      fail(CODE_STATE, 'Tournament opponent roster could not be resolved');
    }
    const entries = Array.isArray(supplied) ? supplied : supplied?.entries;
    if (!entries?.length) fail(CODE_STATE, 'Tournament opponent roster is not supplied by the deployment');
    const roleId = supplied?.roleId ?? (botTid ? -Number(botTid) : 0);
    return { entries, roleId: Number(roleId), score: Number(supplied?.score ?? score), stage: Number(supplied?.stage ?? stage) };
  }

  // 88501: the client clears the score change banner (MatchPVPNetMgr.ReqClearScoreChange).
  function clearChange() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      const previous = state.scoreChange;
      state.scoreChange = 0;
      state.scoreCache = 0;
      writeState(db, state, nowMs);
      log({ event: 'tournament_score_change_cleared', previous });
      return { value: { previous }, data: Buffer.alloc(0) };
    });
  }

  // 88502: daily task rewards. The row index of MatchPvpTable.DayTask (type 1) is the client
  // side award index and the bit index of base.got_day_award.
  function dayAward(input) {
    const rows = dayTaskRows();
    if (!rows.length) fail(CODE_STATE, 'Tournament day task configuration is empty');
    const requested = integerList(input);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      let bits = Buffer.from(state.gotDayAward);
      const targets = [];
      rows.forEach((row, position) => {
        const idx = position + 1;
        if (requested.length && !requested.includes(idx)) return;
        if (hasBit(bits, idx)) return;
        const claimKey = state.dayKey + ':' + idx;
        if (claimed(db, state.roleId, 'tournament_day_award', claimKey)) return;
        if (dayProgress(state, row.taskType) < Number(row.taskCount)) return;
        if (!row.award.length) fail(CODE_STATE, 'Tournament day task reward is empty: ' + row.tid);
        targets.push({ idx, row, claimKey });
        bits = setBit(bits, idx);
      });
      if (!targets.length) fail(CODE_LIMIT, 'Tournament day task award is not available');
      const reward = grantResources(model, targets.flatMap(target => target.row.award), resourceTables());
      const createdAt = isoSeconds(nowMs);
      for (const target of targets) recordClaim(db, state.roleId, 'tournament_day_award', target.claimKey, createdAt);
      state.gotDayAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'tournament_day_award_committed', idx: targets.map(target => target.idx), changes: reward.changes.length });
      return {
        value: { idx: targets.map(target => target.idx), changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // 88503: season reward is the stage ladder reward (MatchPVPNetMgr.ReqRevStageAward ->
  // req_tournament_season_award, MatchPvpRankAwardNode). The Level row index of the type 1
  // ladder is the client index and the bit index of base.got_season_award.
  function seasonAward(input) {
    const rows = levelRows();
    if (!rows.length) fail(CODE_STATE, 'Tournament stage configuration is empty');
    const requested = integerList(input);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      let bits = Buffer.from(state.gotSeasonAward);
      const targets = [];
      rows.forEach((row, position) => {
        const idx = position + 1;
        if (requested.length && !requested.includes(idx) && !requested.includes(Number(row.tid))) return;
        if (hasBit(bits, idx)) return;
        if (claimed(db, state.roleId, 'tournament_season_award', String(idx))) return;
        if (state.score < Number(row.integral)) return;
        if (!row.award.length) return;
        targets.push({ idx, row });
        bits = setBit(bits, idx);
      });
      if (!targets.length) fail(CODE_LIMIT, 'Tournament stage award is not available');
      const reward = grantResources(model, targets.flatMap(target => target.row.award), resourceTables());
      const createdAt = isoSeconds(nowMs);
      for (const target of targets) recordClaim(db, state.roleId, 'tournament_season_award', String(target.idx), createdAt);
      state.gotSeasonAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'tournament_season_award_committed', idx: targets.map(target => target.idx), changes: reward.changes.length });
      return {
        value: { idx: targets.map(target => target.idx), stage: state.stage, changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // 88504: the honour hall is written by the season settlement, which is out of this card.
  // A fresh local server has no settled season, so the reply is an empty palace.
  function palace() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      writeState(db, state, nowMs);
      log({ event: 'tournament_palace_read', seasons: 0 });
      return { value: { seasons: 0 }, data: codec.pack('pb_match_pvp_palace', { palaces: [] }) };
    });
  }

  function fight() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const nowSeconds = seconds(nowMs);
      const state = readState(db, model.state.roleId, nowMs, type);
      const minScore = Number(type.minScore);
      if (state.score < minScore) state.score = minScore;
      const attacker = rosterFor({ model, lineupType: 1 });
      const opponent = resolveOpponent({ score: state.score, stage: state.stage, fightTid: type.fightTid, botTid: 0 });
      const oldScore = state.score;
      const oldRank = rankOf(db, state.roleId, oldScore);
      const battle = simulatePvpBattle({
        codec,
        attacker,
        defender: { entries: opponent.entries },
        seedText: ['tournament', state.roleId, oldScore, state.fightTimes, nowSeconds].join(':')
      });
      const won = battle.won;
      const gain = Math.max(1, Number(type.minWinGain) || 1);
      let newScore = won ? oldScore + gain : oldScore - gain;
      if (newScore < minScore) newScore = minScore;
      const newRank = rankOf(db, state.roleId, newScore);
      state.fightTimes += 1;
      state.dayFightTimes += 1;
      if (won) {
        state.winTimes += 1;
        state.dayWinTimes += 1;
        state.recentFightResult = state.recentFightResult > 0 ? state.recentFightResult + 1 : 1;
      } else {
        state.recentFightResult = state.recentFightResult < 0 ? state.recentFightResult - 1 : -1;
      }
      state.score = newScore;
      state.scoreChange = newScore - oldScore;
      if (newScore > state.maxScore) state.maxScore = newScore;
      state.stage = stageTidOf(newScore);
      const fightUid = nextFightUid(state, nowMs);
      const atkChange = { old_rank: oldRank, new_rank: newRank, old_score: oldScore, new_score: newScore };
      const defChange = { old_rank: 0, new_rank: 0, old_score: opponent.score, new_score: opponent.score };
      state.fightReports.unshift({
        scoreChange: newScore - oldScore,
        fightUid,
        fightStamp: nowSeconds,
        enemy: String(opponent.roleId),
        isAtk: true,
        atkChange,
        defChange,
        locked: false,
        atkWin: won,
        atkStage: state.stage,
        defStage: opponent.stage
      });
      state.fightReports = state.fightReports.slice(0, Math.max(1, Number(type.fightReportNum) || 1));
      updateBestRank(state, nowSeconds, newRank);
      db.prepare('INSERT OR REPLACE INTO tournament_fight VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        state.roleId, fightUid, won ? 1 : 0, newScore - oldScore, oldScore, opponent.score,
        state.stage, opponent.stage, nowSeconds, 0
      );
      writeState(db, state, nowMs);
      const report = buildFightReport({
        id: fightUid,
        fightTid: type.fightTid,
        reportType: 1,
        atkRoleId: state.roleId,
        defRoleId: opponent.roleId,
        battle: battle.battle,
        result: battle.battle.result,
        nowSeconds,
        requestBytes: Buffer.alloc(0)
      });
      const stmData = codec.pack('pb_match_pvp_fight_rsp', {
        role_id: String(opponent.roleId),
        atk_change: atkChange,
        def_change: defChange,
        def_base: { stage: opponent.stage, fight_times: 0, win_times: 0 },
        palace: { palaces: [] },
        best_rank: bestRankPacket(state)
      });
      log({
        event: 'tournament_fight_committed',
        won,
        oldScore,
        newScore,
        oldRank,
        newRank,
        rounds: battle.simulation.overRound,
        atkPower: battle.atkPower,
        defPower: battle.defPower
      });
      return {
        value: { won, oldScore, newScore, oldRank, newRank, rounds: battle.simulation.overRound },
        data: codec.pack('pb_fight_response', {
          report,
          rsp: {},
          stm: { result: battle.battle.result, stm_data: stmData, exception: false }
        })
      };
    });
  }

  function setIgnore(input) {
    const parsed = firstBoolean(input);
    if (parsed === null) fail(CODE_INVALID, 'Invalid tournament ignore match show flag');
    const flag = parsed;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      state.ignoreMatchShow = flag;
      writeState(db, state, nowMs);
      log({ event: 'tournament_ignore_match_show_set', ignore: flag });
      return { value: { ignore: flag }, data: Buffer.alloc(0) };
    });
  }

  function setReadReportTime(input) {
    const raw = firstInteger(input);
    if (raw === null) fail(CODE_INVALID, 'Invalid tournament report read time');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      const bounded = Math.max(0, Math.min(seconds(nowMs) + DAY_SECONDS, raw));
      state.readReportTime = Math.max(state.readReportTime, bounded);
      writeState(db, state, nowMs);
      log({ event: 'tournament_report_read_time_set', readReportTime: state.readReportTime });
      return { value: { readReportTime: state.readReportTime }, data: Buffer.alloc(0) };
    });
  }

  // 88508: Cmd.lua c2s_back registers pb_hunter_arena_history_rank_rsp for this command; the
  // tournament only fills rank / score / season and leaves the arena specific block empty.
  function historyRank() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      writeState(db, state, nowMs);
      const rank = rankOf(db, state.roleId, state.score);
      log({ event: 'tournament_history_rank_read', rank, season: state.season });
      return {
        value: { rank, score: state.score, season: state.season },
        data: codec.pack('pb_hunter_arena_history_rank_rsp', {
          rank,
          score: state.score,
          season: state.season,
          hunter_arena: {}
        })
      };
    });
  }

  function reportLock(input) {
    const uid = String(input?.fight_uid ?? input?.fightUid ?? '');
    if (!uid || uid === 'undefined') fail(CODE_INVALID, 'Invalid tournament report id');
    const lock = Boolean(input?.lock);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      const row = db.prepare('SELECT fight_uid FROM tournament_fight WHERE role_id=? AND fight_uid=?').get(state.roleId, uid);
      if (!row) fail(CODE_STATE, 'Tournament fight report is not found');
      db.prepare('UPDATE tournament_fight SET locked=? WHERE role_id=? AND fight_uid=?').run(lock ? 1 : 0, state.roleId, uid);
      let changed = false;
      for (const report of state.fightReports) {
        if (String(report.fightUid) === uid) { report.locked = lock; changed = true; }
      }
      if (!changed) fail(CODE_STATE, 'Tournament fight report is not found');
      writeState(db, state, nowMs);
      log({ event: 'tournament_report_lock_set', fightUid: uid, lock });
      return { value: { fightUid: uid, lock }, data: Buffer.alloc(0) };
    });
  }

  function promoteCandidates() {
    const seen = new Map();
    for (const match of tables.matches.values()) {
      if (Number(match.type) !== TOURNAMENT_FUN_TYPE) continue;
      for (const tid of match.promoteBots ?? []) {
        const bot = tables.bots.get(Number(tid));
        if (!bot || seen.has(Number(bot.tid))) continue;
        seen.set(Number(bot.tid), bot);
      }
    }
    return [...seen.values()];
  }

  function pickPromoteTarget(state, input) {
    const raw = firstInteger(input);
    if (raw === null) {
      return state.promote.find(entry => Number(entry.state) !== PROMOTE_WON) ?? state.promote[0] ?? null;
    }
    if (raw < 0) return state.promote.find(entry => Number(entry.roleId) === raw) ?? null;
    const byIndex = state.promote[raw - 1];
    if (byIndex) return byIndex;
    return state.promote.find(entry => Math.abs(Number(entry.roleId)) === raw) ?? null;
  }

  // 88511: opens the promote session and returns the opponent list the client renders. The
  // opponents are the promote_bot rows of MatchPvpTable.Match (BotLib robots, negative ids).
  function enterForm() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      if (!state.promote.length) {
        const candidates = promoteCandidates();
        if (!candidates.length) fail(CODE_STATE, 'Tournament promote opponent configuration is missing');
        const ordered = candidates.slice()
          .sort((left, right) => Math.abs(Number(left.score) - state.score) - Math.abs(Number(right.score) - state.score))
          .slice(0, 3);
        state.promote = ordered.map(bot => ({ roleId: -Number(bot.tid), state: PROMOTE_PENDING, score: Number(bot.score) }));
      }
      if (!state.stage) state.stage = stageTidOf(state.score);
      state.lastJoinSeason = SEASON;
      writeState(db, state, nowMs);
      log({ event: 'tournament_promote_form_opened', opponents: state.promote.map(entry => entry.roleId) });
      return { value: { opponents: state.promote.map(entry => entry.roleId) }, data: codec.pack('pb_tournament_role', rolePacket(state)) };
    });
  }

  // 88510: one promote battle. Winning every opponent of the list advances the stage ladder.
  function startPromote(input) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const nowSeconds = seconds(nowMs);
      const state = readState(db, model.state.roleId, nowMs, type);
      if (!state.promote.length) fail(CODE_STATE, 'Tournament promote session is not opened');
      const target = pickPromoteTarget(state, input);
      if (!target) fail(CODE_STATE, 'Tournament promote opponent is not found');
      if (Number(target.state) === PROMOTE_WON) fail(CODE_LIMIT, 'Tournament promote opponent was already defeated');
      const bot = tables.bots.get(Math.abs(Number(target.roleId)));
      const fightTid = Number(bot?.fightTid ?? type.fightTid);
      const attacker = rosterFor({ model, lineupType: 1 });
      const opponent = resolveOpponent({
        score: Number(bot?.score ?? target.score),
        stage: Number(target.score),
        fightTid,
        botTid: Math.abs(Number(target.roleId))
      });
      const battle = simulatePvpBattle({
        codec,
        attacker,
        defender: { entries: opponent.entries },
        seedText: ['tournament-promote', state.roleId, target.roleId, state.promote.length, nowSeconds].join(':')
      });
      target.state = battle.won ? PROMOTE_WON : PROMOTE_LOST;
      let stageUp = false;
      if (battle.won && state.promote.every(entry => Number(entry.state) === PROMOTE_WON)) {
        const next = nextLevelRow(state.stage);
        if (!next) fail(CODE_STATE, 'Tournament stage is already at the maximum');
        state.stage = Number(next.tid);
        state.score = Math.max(state.score, Number(next.integral));
        state.scoreCache = 0;
        state.promote = [];
        stageUp = true;
      }
      writeState(db, state, nowMs);
      log({
        event: 'tournament_promote_fight_committed',
        opponent: target.roleId,
        won: battle.won,
        stageUp,
        stage: state.stage,
        rounds: battle.simulation.overRound
      });
      return {
        value: { opponent: target.roleId, won: battle.won, stageUp, stage: state.stage },
        data: codec.pack('pb_tournament_role', rolePacket(state))
      };
    });
  }

  function supports(command) { return TOURNAMENT_COMMANDS.includes(Number(command)); }

  async function execute(command, input) {
    const type8 = Number(command);
    if (type8 === COMMAND_CLEAR_CHANGE) return clearChange();
    if (type8 === COMMAND_DAY_AWARD) return dayAward(input);
    if (type8 === COMMAND_SEASON_AWARD) return seasonAward(input);
    if (type8 === COMMAND_PALACE) return palace();
    if (type8 === COMMAND_FIGHT) return fight();
    if (type8 === COMMAND_SET_IGNORE) return setIgnore(input);
    if (type8 === COMMAND_SET_READ_REPORT_TIME) return setReadReportTime(input);
    if (type8 === COMMAND_HISTORY_RANK) return historyRank();
    if (type8 === COMMAND_REPORT_LOCK) return reportLock(input);
    if (type8 === COMMAND_START_PROMOTE) return startPromote(input);
    if (type8 === COMMAND_ENTER_FORM) return enterForm();
    fail(CODE_INVALID, 'Unsupported tournament command');
    return null;
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs, type);
      if (!state.stage) state.stage = stageTidOf(state.score);
      writeState(db, state, nowMs);
      return { roleId: state.roleId, exists: state.exists, score: state.score, stage: state.stage };
    });
  }

  // pb_tournament_login = { tournament, score, rank, season_state, palace }
  // (TournamentMgr.ParseLoginData; module 150 in the recorded login fixture).
  function loginPayload() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const nowSeconds = seconds(nowMs);
      const state = readState(db, model.state.roleId, nowMs, type);
      if (!state.stage) state.stage = stageTidOf(state.score);
      writeState(db, state, nowMs);
      return {
        data: codec.pack(TOURNAMENT_LOGIN_SCHEMA, {
          tournament: rolePacket(state),
          score: state.score,
          rank: rankOf(db, state.roleId, state.score),
          season_state: {
            cur_season: SEASON,
            cur_season_close_stamp: nextWeeklyBoundary(tables, 104, nowSeconds),
            next_season_open_stamp: nextWeeklyBoundary(tables, 101, nowSeconds)
          },
          palace: { palaces: [] }
        })
      };
    });
  }

  return {
    supports, execute, ensureLoginState, loginPayload,
    clearChange, dayAward, seasonAward, palace, fight, setIgnore, setReadReportTime,
    historyRank, reportLock, startPromote, enterForm
  };
}
