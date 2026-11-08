import { GameError } from './hero-progression.mjs';
import { encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readTopArenaTables, rankRewardFor, rangeRowFor } from '../config/top-arena-tables.mjs';

// TopArenaCmd: 98500 98505 98526 98527 98532 98560-98565 98580-98583 98590 98601 98602.
//
// Evidence for this module:
//   personal-server/assets/protobuf/top_arena.{db,net}.proto.bin and fight_report.net.proto.bin
//   (plain .proto text). personal-server/config/top-arena-tables.mjs already reads
//   TopArenaTable (Act/Time/Stage/Area/RankReward/RankServerAward/RankServerMaxAward/
//   HelpConst/HelpAward/HelpStage/GuessType/GuessAward/PublicityConst/Scatter).
//   Client bytecode TopArenaCmd / TopArenaMgr / TopArenaSemiMgr / TopArenaTowerMgr.
//   Cmd.lua c2s_back registers the reply of every command; TopArenaCmd shows which requests are
//   EncodePB (98526/98527/98560/98561/98562/98580) and which are EncodeErl.
//
// The module is a cross-server activity (预选爬塔 + 海选擂台 + 决赛 + 公示). This deployment is a
// single local server, so the server wide aggregates (help points, server score rank, server
// awards) are derived from the authoritative local rows. The activity schedule is anchored on
// the server open time because the activity frame tables for this activity are not part of the
// project configuration; see the delivery note for every derived rule.
export const TOP_ARENA_COMMANDS = Object.freeze([
  98500, 98505, 98526, 98527, 98532, 98560, 98561, 98562, 98563, 98564, 98565,
  98580, 98581, 98582, 98583, 98590, 98601, 98602
]);

// Cmd.lua c2s_index: EncodePB requests.
export const TOP_ARENA_PROTOBUF_COMMANDS = Object.freeze({
  98526: 'pb_top_arena_server_help_req',
  98527: 'pb_top_arena_server_help_reward_req',
  98560: 'pb_top_arena_attack_req',
  98561: 'pb_top_arena_guess_req',
  98562: 'pb_get_fight_report',
  98580: 'pb_top_arena_winner_history_req'
});

const COMMAND_PRE_FAVORITE = 98500;
const COMMAND_GET_RANK_REWARD = 98505;
const COMMAND_SEMI_SERVER_HELP = 98526;
const COMMAND_SEMI_HELP_REWARD = 98527;
const COMMAND_SEMI_HELP_EXCHANGE = 98532;
const COMMAND_FINAL_ATTACK = 98560;
const COMMAND_FINAL_GUESS = 98561;
const COMMAND_FINAL_BATTLE_RECORD = 98562;
const COMMAND_FINAL_RANK_REWARD = 98563;
const COMMAND_FINAL_SERVER_RANK = 98564;
const COMMAND_FINAL_JOIN = 98565;
const COMMAND_GET_HISTORY = 98580;
const COMMAND_SET_DECLARATION = 98581;
const COMMAND_VOTE = 98582;
const COMMAND_GET_SERVER_HELP = 98583;
const COMMAND_ENTER = 98590;
const COMMAND_PUBLICITY_SERVER_AWARD = 98601;
const COMMAND_SERVER_MAX_RANK_AWARD = 98602;

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;

const SEASON_CYCLE_SECONDS = 7 * 86400;
const DAY_SECONDS = 86400;

export function isTopArenaEtfRequest(type) {
  return !(Number(type) in TOP_ARENA_PROTOBUF_COMMANDS);
}

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
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

function parseJson(text, fallback) {
  try { const value = JSON.parse(text || ''); return value ?? fallback; } catch { return fallback; }
}

function parseHex(text) {
  return text ? Buffer.from(text, 'hex') : Buffer.alloc(0);
}

function firstInteger(value) {
  if (value === undefined || value === null || value === '' || typeof value === 'boolean') return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstInteger(entry);
      if (found !== null) return found;
    }
    return null;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function integerList(value) {
  const list = [];
  const visit = (entry) => {
    if (entry === undefined || entry === null || entry === '') return;
    if (Array.isArray(entry)) { entry.forEach(visit); return; }
    if (typeof entry === 'object') {
      for (const key of ['tid_list', 'tidList', 'list']) if (entry[key] !== undefined) visit(entry[key]);
      return;
    }
    const number = Number(entry);
    if (Number.isSafeInteger(number)) list.push(number);
  };
  visit(value);
  return [...new Set(list)];
}

function resPacket(changes) {
  return { changes: changes ?? [], is_overflow: false };
}

function ensureTables(db) {
  db.exec([
    'CREATE TABLE IF NOT EXISTS top_arena_activity (',
    '  id INTEGER PRIMARY KEY,',
    '  season INTEGER NOT NULL,',
    '  state_id INTEGER NOT NULL,',
    '  start_time INTEGER NOT NULL,',
    '  end_time INTEGER NOT NULL,',
    '  help_point INTEGER NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS top_arena_role (',
    '  role_id INTEGER PRIMARY KEY,',
    '  season INTEGER NOT NULL,',
    '  score_total INTEGER NOT NULL,',
    '  joined INTEGER NOT NULL,',
    '  semi TEXT NOT NULL,',
    '  guess TEXT NOT NULL,',
    '  declaration TEXT NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS top_arena_claims (',
    '  role_id INTEGER NOT NULL,',
    '  claim_type TEXT NOT NULL,',
    '  claim_key TEXT NOT NULL,',
    '  created_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, claim_type, claim_key)',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS top_arena_ring (',
    '  group_area_uid INTEGER NOT NULL,',
    '  slot_index INTEGER NOT NULL,',
    '  role_id INTEGER NOT NULL,',
    '  team_id INTEGER NOT NULL,',
    '  scatter_tid INTEGER NOT NULL,',
    '  lode_time INTEGER NOT NULL,',
    '  updated_at TEXT NOT NULL,',
    '  PRIMARY KEY(group_area_uid, slot_index)',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS top_arena_fight (',
    '  role_id INTEGER NOT NULL,',
    '  fight_uid TEXT NOT NULL,',
    '  atk_role_id TEXT NOT NULL,',
    '  def_role_id TEXT NOT NULL,',
    '  final_result INTEGER NOT NULL,',
    '  stamp INTEGER NOT NULL,',
    '  report_hex TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, fight_uid)',
    ')'
  ].join('\n'));
}

function emptySemi(nowSeconds) {
  return {
    scoreList: [],
    dayAttackNum: 0,
    dayRefreshNum: 0,
    updateTime: nowSeconds,
    areaTid: 0,
    fightReports: [],
    readReportTime: 0,
    dayGotAward: [],
    serverHelpAward: Buffer.alloc(0).toString('hex'),
    teamList: [],
    groupId: 0,
    promotionAward: [],
    conWinNum: 0,
    defConWinNum: 0,
    gotServerAward: false,
    helpExchange: Buffer.alloc(0).toString('hex'),
    isHelp: false,
    gotMaxServerAward: false,
    hasCounted: false,
    helpDay: '',
    helpDayCount: 0,
    likeDay: '',
    likeCount: 0
  };
}

function normalizeSemi(raw, nowSeconds) {
  const base = emptySemi(nowSeconds);
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = { ...base, ...source };
  if (!Array.isArray(result.scoreList)) result.scoreList = [];
  if (!Array.isArray(result.fightReports)) result.fightReports = [];
  if (!Array.isArray(result.dayGotAward)) result.dayGotAward = [];
  if (!Array.isArray(result.teamList)) result.teamList = [];
  if (!Array.isArray(result.promotionAward)) result.promotionAward = [];
  if (typeof result.serverHelpAward !== 'string') result.serverHelpAward = Buffer.alloc(0).toString('hex');
  if (typeof result.helpExchange !== 'string') result.helpExchange = Buffer.alloc(0).toString('hex');
  return result;
}

function readRoleRow(db, roleId, season, nowSeconds) {
  const row = db.prepare('SELECT * FROM top_arena_role WHERE role_id=?').get(roleId);
  if (!row || Number(row.season) !== Number(season)) {
    return {
      roleId,
      season,
      scoreTotal: 0,
      joined: false,
      semi: emptySemi(nowSeconds),
      guess: [],
      declaration: '',
      exists: Boolean(row)
    };
  }
  const guess = parseJson(row.guess, []);
  return {
    roleId,
    season,
    scoreTotal: Number(row.score_total ?? 0),
    joined: Boolean(row.joined),
    semi: normalizeSemi(parseJson(row.semi, null), nowSeconds),
    guess: Array.isArray(guess) ? guess : [],
    declaration: row.declaration ?? '',
    exists: true
  };
}

function writeRoleRow(db, row, nowMs) {
  db.prepare([
    'INSERT INTO top_arena_role (role_id, season, score_total, joined, semi, guess, declaration, updated_at)',
    'VALUES (?,?,?,?,?,?,?,?)',
    'ON CONFLICT(role_id) DO UPDATE SET',
    '  season=excluded.season,',
    '  score_total=excluded.score_total,',
    '  joined=excluded.joined,',
    '  semi=excluded.semi,',
    '  guess=excluded.guess,',
    '  declaration=excluded.declaration,',
    '  updated_at=excluded.updated_at'
  ].join('\n')).run(
    row.roleId, row.season, row.scoreTotal, row.joined ? 1 : 0,
    JSON.stringify(row.semi), JSON.stringify(row.guess), row.declaration ?? '', isoSeconds(nowMs)
  );
}

function readActivity(db, season, stateId, startTime, endTime, nowMs) {
  const row = db.prepare('SELECT * FROM top_arena_activity WHERE id=1').get();
  if (!row || Number(row.season) !== Number(season)) {
    return { season, stateId, startTime, endTime, helpPoint: 0, exists: Boolean(row) };
  }
  return {
    season,
    stateId,
    startTime,
    endTime,
    helpPoint: Number(row.help_point ?? 0),
    exists: true
  };
}

function writeActivity(db, activity, nowMs) {
  db.prepare([
    'INSERT INTO top_arena_activity (id, season, state_id, start_time, end_time, help_point, updated_at)',
    'VALUES (1,?,?,?,?,?,?)',
    'ON CONFLICT(id) DO UPDATE SET',
    '  season=excluded.season,',
    '  state_id=excluded.state_id,',
    '  start_time=excluded.start_time,',
    '  end_time=excluded.end_time,',
    '  help_point=excluded.help_point,',
    '  updated_at=excluded.updated_at'
  ].join('\n')).run(activity.season, activity.stateId, activity.startTime, activity.endTime, activity.helpPoint, isoSeconds(nowMs));
}

function claimed(db, roleId, claimType, claimKey) {
  return Boolean(db.prepare('SELECT 1 FROM top_arena_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
    .get(roleId, claimType, claimKey));
}

function recordClaim(db, roleId, claimType, claimKey, createdAt) {
  db.prepare('INSERT INTO top_arena_claims VALUES (?,?,?,?)').run(roleId, claimType, claimKey, createdAt);
}

export function createTopArenaService({
  store,
  codec,
  tables = readTopArenaTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch { /* logging must not fail a command */ } };
  const resourceTables = () => gameTables ?? readGameTables();

  if (!tables?.stages?.size) throw new Error('Top arena stage configuration is empty');
  const actTids = [...tables.acts.keys()].map(Number).sort((left, right) => left - right);
  if (!actTids.length) throw new Error('Top arena act configuration is empty');
  const rankTypeTids = [...new Set(tables.rankRewards.map(row => Number(row.type)))].sort((left, right) => left - right);
  const timeRows = [...tables.times.values()].sort((left, right) => left.startDay - right.startDay || left.startTime - right.startTime);

  function planOf(nowMs) {
    const nowSeconds = seconds(nowMs);
    const openSeconds = Math.floor(Number(store.serverOpenedAt ?? nowMs) / 1000);
    const elapsed = Math.max(0, nowSeconds - openSeconds);
    const cycle = Math.floor(elapsed / SEASON_CYCLE_SECONDS);
    const season = actTids[cycle % actTids.length];
    const seasonStart = openSeconds + cycle * SEASON_CYCLE_SECONDS;
    let stateId = 0;
    let endTime = seasonStart + SEASON_CYCLE_SECONDS;
    for (const row of timeRows) {
      const boundary = seasonStart + Number(row.startDay) * DAY_SECONDS + Number(row.startTime);
      if (boundary <= nowSeconds) {
        stateId = Math.max(stateId, Number(row.tid));
        if (Number(row.tid) === Math.max(...timeRows.map(entry => Number(entry.tid)))) endTime = boundary;
      }
    }
    return { season, seasonStart, stateId, endTime, nowSeconds };
  }

  function stageOf(stateId) {
    let current = null;
    for (const stage of [...tables.stages.values()].sort((left, right) => left.startState - right.startState)) {
      if (Number(stateId) >= Number(stage.startState)) current = stage;
    }
    return current;
  }

  function rankTypeOf(season) {
    const position = actTids.indexOf(Number(season));
    if (position < 0 || !rankTypeTids.length) return 0;
    return rankTypeTids[position % rankTypeTids.length];
  }

  function requireOpen(plan) {
    if (!plan.stateId) fail(CODE_STATE, 'Top arena activity is not open');
    return stageOf(plan.stateId);
  }

  function requireStage(plan, minimumStageId, message) {
    const stage = requireOpen(plan);
    if (!stage || Number(stage.tid) < Number(minimumStageId)) fail(CODE_STATE, message);
    return stage;
  }

  function scoreTotalOf(semi) {
    return semi.scoreList.reduce((sum, entry) => sum + Number(entry.score ?? 0), 0);
  }

  function scorePacket(semi) {
    return semi.scoreList.map(entry => ({
      stage: Number(entry.stage ?? 0),
      score: Number(entry.score ?? 0),
      last_score: Number(entry.lastScore ?? entry.last_score ?? 0)
    }));
  }

  function semiPacket(row) {
    const semi = row.semi;
    return {
      season: row.season,
      score_list: scorePacket(semi),
      day_attack_num: Number(semi.dayAttackNum ?? 0),
      day_refresh_num: Number(semi.dayRefreshNum ?? 0),
      update_time: Number(semi.updateTime ?? 0),
      area_tid: Number(semi.areaTid ?? 0),
      fight_reports: semi.fightReports.map(entry => ({
        fight_uid: String(entry.fightUid ?? '0'),
        time: Number(entry.time ?? 0),
        atk_role_id: String(entry.atkRoleId ?? row.roleId),
        def_role_id: String(entry.defRoleId ?? '0'),
        final_result: Number(entry.finalResult ?? 0),
        atk_scatter_tid: Number(entry.atkScatterTid ?? 0),
        def_scatter_tid: Number(entry.defScatterTid ?? 0)
      })),
      read_report_time: Number(semi.readReportTime ?? 0),
      day_got_award: (semi.dayGotAward ?? []).map(Number),
      server_help_award: encodeBitBlock(parseHex(semi.serverHelpAward)),
      team_list: (semi.teamList ?? []).map(entry => ({
        team_id: Number(entry.teamId ?? 0),
        healthy_time: String(entry.healthyTime ?? '0'),
        last_update_score: String(entry.lastUpdateScore ?? '0'),
        last_is_win: Boolean(entry.lastIsWin)
      })),
      group_id: Number(semi.groupId ?? 0),
      promotion_award: (semi.promotionAward ?? []).map(Number),
      con_win_num: Number(semi.conWinNum ?? 0),
      def_con_win_num: Number(semi.defConWinNum ?? 0),
      got_server_award: Boolean(semi.gotServerAward),
      help_exchange: encodeBitBlock(parseHex(semi.helpExchange)),
      is_help: Boolean(semi.isHelp),
      got_max_server_award: Boolean(semi.gotMaxServerAward),
      has_counted: Boolean(semi.hasCounted)
    };
  }

  function rankOf(db, season, roleId, scoreTotal) {
    const row = db.prepare('SELECT COUNT(*) AS total FROM top_arena_role WHERE season=? AND role_id<>? AND score_total>?')
      .get(Number(season), roleId, Number(scoreTotal));
    return Number(row?.total ?? 0) + 1;
  }

  function seasonTotal(db, season) {
    const row = db.prepare('SELECT COALESCE(SUM(score_total), 0) AS total FROM top_arena_role WHERE season=?').get(Number(season));
    return Number(row?.total ?? 0);
  }

  function topRoles(db, season, limit) {
    return db.prepare('SELECT role_id, score_total FROM top_arena_role WHERE season=? AND score_total>0 ORDER BY score_total DESC, role_id ASC LIMIT ?')
      .all(Number(season), Number(limit));
  }

  function loadState(db, roleId, plan, nowMs) {
    const row = readRoleRow(db, roleId, plan.season, plan.nowSeconds);
    const activity = readActivity(db, plan.season, plan.stateId, plan.seasonStart, plan.endTime, nowMs);
    // 当日数据在 05:00 之后由半决赛的客户端 CrossDay 逻辑刷新，这里同样按 UTC 日界懒刷新。
    const today = dayKeyOf(plan.nowSeconds);
    if (row.semi.helpDay !== today) {
      row.semi.helpDay = today;
      row.semi.helpDayCount = 0;
      row.semi.isHelp = false;
      row.semi.helpExchange = Buffer.alloc(0).toString('hex');
    }
    if (row.semi.likeDay !== today) {
      row.semi.likeDay = today;
      row.semi.likeCount = 0;
    }
    return { row, activity };
  }

  function saveState(db, row, activity, nowMs) {
    row.scoreTotal = scoreTotalOf(row.semi);
    writeRoleRow(db, row, nowMs);
    writeActivity(db, activity, nowMs);
  }

  function currencyRow(row, season, rank) {
    const type = rankTypeOf(season);
    if (!type) fail(CODE_STATE, 'Top arena rank reward type is not configured');
    return rankRewardFor(tables, type, rank);
  }

  // 98500 预告夺冠热门：单服把本服积分前列的玩家作为跨服热门列表的一项。
  function preFavorite() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const tops = topRoles(db, plan.season, Number(tables.const.peakDuelShowCount ?? 3) || 3);
      const ids = tops.map(row => String(row.role_id));
      const serverId = Number(model.state.serverId ?? 0);
      log({ event: 'top_arena_pre_favorite_read', season: plan.season, roles: ids.length });
      return {
        value: { season: plan.season, roles: ids.length },
        data: codec.pack('pb_top_arena_favorite_rsp', {
          favorite_list: ids.length ? [{ server_id: serverId, role_id_lists: ids, cross_id: 0 }] : []
        })
      };
    });
  }

  // 98505 / 98563 排行榜奖励：RankReward 按赛季对应的排行榜类型与名次段发放。名次来源是本服
  // 赛季积分榜（单服语义，跨服榜未实现）。
  function claimRankReward(claimType, nowMs) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const plan = planOf(nowMs);
      requireOpen(plan);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const rank = rankOf(db, plan.season, row.roleId, scoreTotalOf(row.semi));
      const reward = currencyRow(row, plan.season, rank);
      if (!reward) fail(CODE_STATE, 'Top arena rank reward is not configured for rank ' + rank);
      if (!reward.award.length) fail(CODE_STATE, 'Top arena rank reward configuration is empty');
      if (claimed(db, row.roleId, claimType, String(plan.season))) fail(CODE_LIMIT, 'Top arena rank reward was already received');
      const granted = grantResources(model, reward.award, resourceTables());
      recordClaim(db, row.roleId, claimType, String(plan.season), isoSeconds(nowMs));
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_rank_reward_committed', claimType, season: plan.season, rank, changes: granted.changes.length });
      return {
        value: { claimType, rank, changes: granted.changes },
        data: codec.pack('pb_res_to_client', resPacket(granted.changes))
      };
    });
  }

  // 98526 海选全服助力：count 次助力累加到本服助力池，personal 每日上限 HelpConst.help_max。
  function semiServerHelp(input) {
    const count = integer(input?.count ?? firstInteger(input), 1, Number(tables.helpConst.helpCount), 'Invalid top arena help count');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireOpen(plan);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const remaining = Number(tables.helpConst.helpMax) - Number(row.semi.helpDayCount ?? 0);
      if (remaining <= 0) fail(CODE_LIMIT, 'Top arena help count for today is used up');
      if (count > remaining) fail(CODE_LIMIT, 'Top arena help count exceeds the daily limit');
      row.semi.helpDayCount = Number(row.semi.helpDayCount ?? 0) + count;
      row.semi.isHelp = true;
      activity.helpPoint = Number(activity.helpPoint ?? 0) + count;
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_server_help_committed', count, helpPoint: activity.helpPoint });
      return {
        value: { count, helpPoint: activity.helpPoint },
        data: codec.pack('pb_top_arena_server_help_rsp', {
          res: resPacket([]),
          help_point: activity.helpPoint,
          server_help_award: encodeBitBlock(parseHex(row.semi.serverHelpAward))
        })
      };
    });
  }

  // 98583 读取本服助力池。
  function getServerHelp() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const { activity } = loadState(db, model.state.roleId, plan, nowMs);
      log({ event: 'top_arena_server_help_read', helpPoint: activity.helpPoint });
      return {
        value: { helpPoint: activity.helpPoint },
        data: codec.pack('pb_top_arena_server_help_info_rsp', { help_point: activity.helpPoint })
      };
    });
  }

  // 98527 助力进度奖励：HelpAward 按 help_count 阈值，位号取行序号（1 起），每赛季一次。
  function semiHelpReward(input) {
    const requested = integerList(input?.tid_list ?? input?.tidList ?? input);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireOpen(plan);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const rows = [...tables.helpAwards.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
      let bits = parseHex(row.semi.serverHelpAward);
      const targets = [];
      rows.forEach((entry, position) => {
        const idx = position + 1;
        if (requested.length && !requested.includes(Number(entry.tid)) && !requested.includes(idx)) return;
        if (hasBit(bits, idx)) return;
        if (Number(activity.helpPoint) < Number(entry.helpCount)) return;
        if (!entry.award.length) return;
        targets.push({ idx, entry });
        bits = setBit(bits, idx);
      });
      if (!targets.length) fail(CODE_LIMIT, 'Top arena help reward is not available');
      const reward = grantResources(model, targets.flatMap(target => target.entry.award), resourceTables());
      row.semi.serverHelpAward = bits.toString('hex');
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_help_reward_committed', tids: targets.map(target => target.entry.tid), changes: reward.changes.length });
      return {
        value: { tids: targets.map(target => target.entry.tid), changes: reward.changes },
        data: codec.pack('pb_top_arena_server_help_rsp', {
          res: resPacket(reward.changes),
          help_point: activity.helpPoint,
          server_help_award: encodeBitBlock(bits)
        })
      };
    });
  }

  // 98532 助力点数兑换：每次消耗 Const.help_exchange_ratio 点助力池换取 HelpConst.exchange_item，
  // 每人每日上限 HelpConst.exchange_count 次。
  function semiHelpExchange() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireOpen(plan);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const ratio = Math.max(1, Number(tables.const.helpExchangeRatio));
      if (Number(activity.helpPoint) < ratio) fail(CODE_LIMIT, 'Top arena help point is insufficient');
      const bits = parseHex(row.semi.helpExchange);
      let used = 0;
      for (let index = 0; index < Math.max(1, Number(tables.helpConst.exchangeCount)); index += 1) {
        if (hasBit(bits, index)) used += 1;
      }
      if (used >= Number(tables.helpConst.exchangeCount)) fail(CODE_LIMIT, 'Top arena help exchange count for today is used up');
      if (!tables.helpConst.exchangeItem.length) fail(CODE_STATE, 'Top arena help exchange reward configuration is empty');
      activity.helpPoint = Number(activity.helpPoint) - ratio;
      const nextBits = setBit(bits, used);
      row.semi.helpExchange = nextBits.toString('hex');
      const reward = grantResources(model, tables.helpConst.exchangeItem, resourceTables());
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_help_exchange_committed', ratio, changes: reward.changes.length });
      return {
        value: { ratio, changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // 98560 决赛占领空擂台：group_area_uid = group_id * 100000 + area_tid（proto 注释）。
  function finalAttack(input) {
    const groupId = integer(input?.group_id ?? input?.groupId, 0, 1000, 'Invalid top arena group id');
    const areaTid = integer(input?.area_tid ?? input?.areaTid, 1, Number.MAX_SAFE_INTEGER, 'Invalid top arena area id');
    const index = integer(input?.index, 1, 1000, 'Invalid top arena slot index');
    const teamId = integer(input?.team_id ?? input?.teamId ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Invalid top arena team id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireStage(plan, 2, 'Top arena final stage is not open');
      const area = tables.areas.get(areaTid);
      if (!area) fail(CODE_STATE, 'Top arena area configuration is missing: ' + areaTid);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const groupAreaUid = groupId * 100000 + areaTid;
      const current = db.prepare('SELECT * FROM top_arena_ring WHERE group_area_uid=? AND slot_index=?').get(groupAreaUid, index);
      if (current && Number(current.role_id) !== Number(row.roleId)) {
        fail(CODE_STATE, 'Top arena slot is occupied by another role');
      }
      db.prepare([
        'INSERT INTO top_arena_ring (group_area_uid, slot_index, role_id, team_id, scatter_tid, lode_time, updated_at)',
        'VALUES (?,?,?,?,?,?,?)',
        'ON CONFLICT(group_area_uid, slot_index) DO UPDATE SET',
        '  role_id=excluded.role_id,',
        '  team_id=excluded.team_id,',
        '  scatter_tid=excluded.scatter_tid,',
        '  lode_time=excluded.lode_time,',
        '  updated_at=excluded.updated_at'
      ].join('\n')).run(groupAreaUid, index, row.roleId, teamId, 0, plan.nowSeconds, isoSeconds(nowMs));
      row.semi.groupId = groupId;
      row.semi.areaTid = areaTid;
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_slot_occupied', groupAreaUid, index, areaTid, teamId });
      return {
        value: { groupAreaUid, index },
        data: codec.pack('pb_top_arena_attack_rsp', {
          area_data_list: [{
            index,
            role_id: String(row.roleId),
            team_id: teamId,
            lode_time: String(plan.nowSeconds),
            scatter_tid: 0,
            group_area_uid: groupAreaUid
          }],
          role_top_arena_data: semiPacket(row)
        })
      };
    });
  }

  // 98561 决赛竞猜：GuessType 定义赛区与支持对象数，竞猜结果要等结算，本次只记录支持对象。
  function finalGuess(input) {
    const tid = integer(input?.tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid top arena guess id');
    const supportId = integer(input?.support_obj_id ?? input?.supportObjId, 0, Number.MAX_SAFE_INTEGER, 'Invalid top arena guess target');
    const areaIdx = integer(input?.area_idx ?? input?.areaIdx ?? 0, 0, 1000, 'Invalid top arena guess area');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const stage = requireStage(plan, 2, 'Top arena final stage is not open');
      const guessType = tables.guessTypes.get(tid);
      if (!guessType) fail(CODE_STATE, 'Top arena guess configuration is missing: ' + tid);
      if (Number(guessType.stage) > Number(stage.tid)) fail(CODE_STATE, 'Top arena guess is not open yet');
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      if (row.guess.some(entry => Number(entry.tid) === tid)) fail(CODE_LIMIT, 'Top arena guess was already submitted');
      row.guess = [...row.guess, { tid, supportId, areaIdx, stamp: plan.nowSeconds }];
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_guess_committed', tid, supportId, areaIdx });
      return {
        value: { tid, supportId },
        data: codec.pack('pb_top_arena_guess', {
          season: plan.season,
          guess_list: row.guess.map(entry => ({
            tid: Number(entry.tid),
            obj_list: [{ win_obj_id: String(entry.supportId ?? 0), is_win: false }],
            is_got_award: false
          }))
        })
      };
    });
  }

  // 98562 决赛战报：pb_get_fight_report{fight_id[]} -> pb_fight_report_res{report[]}。
  function finalBattleRecord(input) {
    const ids = integerList(input?.fight_id ?? input?.fightId ?? input?.fight_id_list ?? input).map(value => String(value));
    if (!ids.length) fail(CODE_INVALID, 'Invalid top arena fight report id list');
    return store.inspect((db) => {
      ensureTables(db);
      const reports = [];
      for (const id of ids) {
        const row = db.prepare('SELECT report_hex FROM top_arena_fight WHERE fight_uid=?').get(id);
        if (!row) continue;
        reports.push(codec.unpack('pb_fight_report', Buffer.from(row.report_hex, 'hex')));
      }
      log({ event: 'top_arena_battle_record_read', requested: ids.length, found: reports.length });
      return { value: { requested: ids.length, found: reports.length }, data: codec.pack('pb_fight_report_res', { report: reports }) };
    });
  }

  // 98564 服务器排名：单服把本服积分总和作为服务器积分，队长取本服积分第一名。
  function finalServerRank() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const total = seasonTotal(db, plan.season);
      const top = topRoles(db, plan.season, 1)[0];
      const serverId = Number(model.state.serverId ?? 0);
      log({ event: 'top_arena_server_rank_read', season: plan.season, total });
      return {
        value: { total, captain: top ? Number(top.role_id) : 0 },
        data: codec.pack('pb_top_arena_get_server_rank_rsp', {
          server_rank_list: [{ server_id: String(serverId), score: String(total), captain_id: String(top ? top.role_id : 0), cross_id: 0 }]
        })
      };
    });
  }

  // 98565 加入决赛小世界。
  function finalJoin() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireStage(plan, 2, 'Top arena final stage is not open');
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const areaTids = [...tables.areas.keys()].map(Number).sort((left, right) => left - right);
      if (!areaTids.length) fail(CODE_STATE, 'Top arena area configuration is empty');
      row.joined = true;
      row.semi.hasCounted = true;
      row.semi.groupId = Number(row.semi.groupId ?? 0) || 1;
      row.semi.areaTid = Number(row.semi.areaTid ?? 0) || areaTids[0];
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_final_joined', areaTid: row.semi.areaTid, groupId: row.semi.groupId });
      return { value: { areaTid: row.semi.areaTid, groupId: row.semi.groupId }, data: codec.pack('pb_top_arena_semi_data', semiPacket(row)) };
    });
  }

  // 98580 历届冠军：本服还没有结算过赛季，返回当前届数 + 空历届列表。
  function getHistory(input) {
    const terms = integerList(input?.term_list ?? input?.termList ?? input);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      log({ event: 'top_arena_history_read', season: plan.season, terms: terms.length });
      return {
        value: { season: plan.season, terms: terms.length },
        data: codec.pack('pb_top_arena_winner_history_rsp', { now_term: plan.season, history_wins_list: [] })
      };
    });
  }

  // 98581 设置宣言：客户端只要求回 pb_top_arena_history_win_info。
  function setDeclaration(input) {
    const raw = typeof input === 'string'
      ? input
      : (input?.declaration ?? input?.text ?? (Array.isArray(input) ? input.find(entry => typeof entry === 'string') : ''));
    const text = String(raw ?? '').slice(0, 200);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      row.declaration = text;
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_declaration_set', length: text.length });
      return {
        value: { length: text.length },
        data: codec.pack('pb_top_arena_history_win_info', { term: plan.season, rank_list: [], arena_contribute_list: [] })
      };
    });
  }

  // 98582 公示点赞：PublicityConst 的 role_like_cout / team_like_cout 是每日点赞上限，
  // 达到上限时发放对应的点赞奖励。
  function vote() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireStage(plan, 3, 'Top arena publicity stage is not open');
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      const roleLimit = Math.max(1, Number(tables.publicityConst.roleLikeCount) || 1);
      const teamLimit = Math.max(0, Number(tables.publicityConst.teamLikeCount) || 0);
      const limit = roleLimit + teamLimit;
      if (Number(row.semi.likeCount ?? 0) >= limit) fail(CODE_LIMIT, 'Top arena like count for today is used up');
      row.semi.likeCount = Number(row.semi.likeCount ?? 0) + 1;
      const awards = [];
      if (Number(row.semi.likeCount) === roleLimit && tables.publicityConst.roleLikeAward.length) {
        awards.push(...tables.publicityConst.roleLikeAward);
      }
      if (Number(row.semi.likeCount) === limit && teamLimit > 0 && tables.publicityConst.teamLikeAward.length) {
        awards.push(...tables.publicityConst.teamLikeAward);
      }
      const reward = awards.length ? grantResources(model, awards, resourceTables()) : { changes: [] };
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_like_committed', count: row.semi.likeCount, changes: reward.changes.length });
      return {
        value: { count: row.semi.likeCount, changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // 98590 进入巅峰赛：返回本服当前擂台占用数据（纯单服）。
  function enter() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireOpen(plan);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      saveState(db, row, activity, nowMs);
      const rows = db.prepare('SELECT * FROM top_arena_ring ORDER BY group_area_uid, slot_index').all();
      const byUid = new Map();
      for (const entry of rows) {
        const uid = Number(entry.group_area_uid);
        if (!byUid.has(uid)) byUid.set(uid, []);
        byUid.get(uid).push({
          index: Number(entry.slot_index),
          role_id: String(entry.role_id),
          team_id: Number(entry.team_id),
          lode_time: String(entry.lode_time),
          scatter_tid: Number(entry.scatter_tid),
          group_area_uid: uid
        });
      }
      log({ event: 'top_arena_entered', areas: byUid.size });
      return {
        value: { areas: byUid.size },
        data: codec.pack('pb_top_arena_enter_rsp', {
          area_data: {
            server_area_data_list: [...byUid.entries()].map(([uid, list]) => ({ group_area_uid: uid, role_list: list }))
          }
        })
      };
    });
  }

  function serverAwardRows(rows, version, rank) {
    const list = rows.filter(row => Number(row.version) === Number(version))
      .slice()
      .sort((left, right) => left.range[0] - right.range[0]);
    return rangeRowFor(list, rank);
  }

  // 98601 公示期全服排名奖励（RankServerAward，按赛季 version + 名次段）。单服名次恒为 1。
  function publicityServerAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireStage(plan, 3, 'Top arena publicity stage is not open');
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      if (row.semi.gotServerAward) fail(CODE_LIMIT, 'Top arena server award was already received');
      const rank = 1;
      const reward = serverAwardRows(tables.rankServerAwards, plan.season, rank);
      if (!reward) fail(CODE_STATE, 'Top arena server award is not configured for version ' + plan.season);
      if (!reward.award.length) fail(CODE_STATE, 'Top arena server award configuration is empty');
      const granted = grantResources(model, reward.award, resourceTables());
      row.semi.gotServerAward = true;
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_publicity_server_award_committed', season: plan.season, rank, changes: granted.changes.length });
      return {
        value: { rank, changes: granted.changes },
        data: codec.pack('pb_res_to_client', resPacket(granted.changes))
      };
    });
  }

  // 98602 全服最高排名奖励（RankServerMaxAward）。
  function serverMaxRankAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      requireStage(plan, 3, 'Top arena publicity stage is not open');
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      if (row.semi.gotMaxServerAward) fail(CODE_LIMIT, 'Top arena max server award was already received');
      const rank = 1;
      const reward = serverAwardRows(tables.rankServerMaxAwards, plan.season, rank);
      if (!reward) fail(CODE_STATE, 'Top arena max server award is not configured for version ' + plan.season);
      if (!reward.award.length) fail(CODE_STATE, 'Top arena max server award configuration is empty');
      const granted = grantResources(model, reward.award, resourceTables());
      row.semi.gotMaxServerAward = true;
      saveState(db, row, activity, nowMs);
      log({ event: 'top_arena_server_max_award_committed', season: plan.season, rank, changes: granted.changes.length });
      return {
        value: { rank, changes: granted.changes },
        data: codec.pack('pb_res_to_client', resPacket(granted.changes))
      };
    });
  }

  function supports(command) {
    return TOP_ARENA_COMMANDS.includes(Number(command));
  }

  async function execute(command, input) {
    const type = Number(command);
    if (type === COMMAND_PRE_FAVORITE) return preFavorite();
    if (type === COMMAND_GET_RANK_REWARD) return claimRankReward('preview_rank_award', now());
    if (type === COMMAND_SEMI_SERVER_HELP) return semiServerHelp(input);
    if (type === COMMAND_SEMI_HELP_REWARD) return semiHelpReward(input);
    if (type === COMMAND_SEMI_HELP_EXCHANGE) return semiHelpExchange();
    if (type === COMMAND_FINAL_ATTACK) return finalAttack(input);
    if (type === COMMAND_FINAL_GUESS) return finalGuess(input);
    if (type === COMMAND_FINAL_BATTLE_RECORD) return finalBattleRecord(input);
    if (type === COMMAND_FINAL_RANK_REWARD) return claimRankReward('final_rank_award', now());
    if (type === COMMAND_FINAL_SERVER_RANK) return finalServerRank();
    if (type === COMMAND_FINAL_JOIN) return finalJoin();
    if (type === COMMAND_GET_HISTORY) return getHistory(input);
    if (type === COMMAND_SET_DECLARATION) return setDeclaration(input);
    if (type === COMMAND_VOTE) return vote();
    if (type === COMMAND_GET_SERVER_HELP) return getServerHelp();
    if (type === COMMAND_ENTER) return enter();
    if (type === COMMAND_PUBLICITY_SERVER_AWARD) return publicityServerAward();
    if (type === COMMAND_SERVER_MAX_RANK_AWARD) return serverMaxRankAward();
    fail(CODE_INVALID, 'Unsupported top arena command');
    return null;
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const { row, activity } = loadState(db, model.state.roleId, plan, nowMs);
      saveState(db, row, activity, nowMs);
      return { season: plan.season, stateId: plan.stateId, joined: row.joined };
    });
  }

  // 登录块：本轮没有取得 TopArenaMgr 期望的完整 4 块构造证据（候选模块 113 只能解出
  // pb_top_arena_tower_data 一块），因此只提供 ensureLoginState，挂载记为缺口。
  function state(roleId) {
    return store.inspect(db => {
      ensureTables(db);
      const nowMs = now();
      const plan = planOf(nowMs);
      const row = readRoleRow(db, roleId, plan.season, plan.nowSeconds);
      return { season: plan.season, stateId: plan.stateId, scoreTotal: scoreTotalOf(row.semi), joined: row.joined };
    });
  }

  return {
    supports, execute, ensureLoginState, state,
    preFavorite, claimRankReward, semiServerHelp, semiHelpReward, semiHelpExchange,
    finalAttack, finalGuess, finalBattleRecord, finalServerRank, finalJoin,
    getHistory, setDeclaration, vote, getServerHelp, enter,
    publicityServerAward, serverMaxRankAward
  };
}
