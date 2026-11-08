import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  arenaAwardPairs,
  arenaRange,
  readSwapArenaTables,
  swapArenaMatchBucket
} from '../config/arena-tables.mjs';
import { encodeEtf } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';

// SwapArenaCmd.lua: 4031-4037 are EncodeErl(nil) commands, 4038 carries
// pb_swap_arena_rank_award_req, 4039 sends an empty ETF table and 4040 sends
// the target role id. See agent/workflow/gameplay-completion/BATTLE-SWAPARENA.
const COMMAND_GET_MATCH = 4031;
const COMMAND_REFRESH_MATCH = 4032;
const COMMAND_BUY_FIGHT_TIMES = 4033;
const COMMAND_MORE_FIGHT = 4034;
const COMMAND_FIGHT_REPORT = 4035;
const COMMAND_READ_RANK_CHANGE = 4036;
const COMMAND_SET_READ_REPORT_TIME = 4037;
const COMMAND_RANK_AWARD = 4038;
const COMMAND_UPDATE_CROSS_STAGE = 4039;
const COMMAND_INIT_DOUBLE_TEAM = 4040;
const SUPPORTED = [
  COMMAND_GET_MATCH, COMMAND_REFRESH_MATCH, COMMAND_BUY_FIGHT_TIMES, COMMAND_MORE_FIGHT,
  COMMAND_FIGHT_REPORT, COMMAND_READ_RANK_CHANGE, COMMAND_SET_READ_REPORT_TIME,
  COMMAND_RANK_AWARD, COMMAND_UPDATE_CROSS_STAGE, COMMAND_INIT_DOUBLE_TEAM
];

// LineupTable.lua TID_LINEUP_TYPE_SWAP_ARENA = 40, TID_LINEUP_TYPE_SWAP_ARENA_66 = 66.
const LINEUP_TYPE_SWAP_ARENA = 40;
const LINEUP_TYPE_SWAP_ARENA_DOUBLE = 66;

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;

const CLAIM_RANK_AWARD = 'swap_arena_rank_award';

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function dayKey(milliseconds) {
  return new Date(milliseconds).toISOString().slice(0, 10);
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function secondsOf(iso) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? Math.floor(value / 1000) : 0;
}

function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS swap_arena_state (
    role_id INTEGER PRIMARY KEY,
    rank INTEGER NOT NULL,
    history_rank INTEGER NOT NULL,
    last_rank INTEGER NOT NULL,
    fight_times INTEGER NOT NULL,
    buy_fight_times INTEGER NOT NULL,
    extra_fight_times INTEGER NOT NULL,
    refresh_match_times INTEGER NOT NULL,
    reset_day TEXT NOT NULL,
    match_list TEXT NOT NULL,
    init_match INTEGER NOT NULL,
    refresh_time TEXT NOT NULL,
    show_rank_change_red INTEGER NOT NULL,
    rank_award TEXT NOT NULL,
    cross_stage INTEGER NOT NULL,
    win_times INTEGER NOT NULL,
    defend_times INTEGER NOT NULL,
    report_read_time INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS swap_arena_reports (
    role_id INTEGER NOT NULL,
    fight_id INTEGER NOT NULL,
    before_rank INTEGER NOT NULL,
    after_rank INTEGER NOT NULL,
    fight_time INTEGER NOT NULL,
    attack_role_id INTEGER NOT NULL,
    def_role_id INTEGER NOT NULL,
    self_fight_result INTEGER NOT NULL,
    enemy_rank INTEGER NOT NULL,
    PRIMARY KEY(role_id, fight_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS swap_arena_claims (
    role_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, claim_type, claim_key)
  )`);
}

export function createSwapArenaService({
  store,
  codec,
  tables = readSwapArenaTables(),
  gameTables = null,
  serverOpenedAt = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = (event) => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  const base = tables.base ?? {};
  const freeFightTimes = integer(base.free_fight_times ?? 0, 0, 9999, 'Swap arena free fight times are invalid');
  const refreshLimit = integer(base.refresh_match_times ?? 0, 0, 9999, 'Swap arena refresh limit is invalid');
  const refreshCd = integer(base.refresh_cd ?? 0, 0, 86400, 'Swap arena refresh cooldown is invalid');
  const topNum = integer(base.top_num ?? 0, 0, 100, 'Swap arena opponent count is invalid');
  const initRank = integer(base.init_rank ?? 0, 1, 100000000, 'Swap arena initial rank is invalid');
  const currencyTid = integer(base.bft_cost ?? 0, 1, Number.MAX_SAFE_INTEGER, 'Swap arena fight cost resource is missing');

  function emptyState(roleId, nowMs) {
    return {
      roleId,
      rank: initRank,
      historyRank: initRank,
      lastRank: 0,
      fightTimes: 0,
      buyFightTimes: 0,
      extraFightTimes: 0,
      refreshMatchTimes: 0,
      resetDay: dayKey(nowMs),
      matchList: [],
      initMatch: false,
      refreshTime: isoSeconds(0),
      showRankChangeRed: false,
      rankAward: Buffer.alloc(0),
      crossStage: 0,
      winTimes: 0,
      defendTimes: 0,
      reportReadTime: 0
    };
  }

  function readState(db, roleId, nowMs) {
    const row = db.prepare('SELECT * FROM swap_arena_state WHERE role_id=?').get(roleId);
    const state = emptyState(roleId, nowMs);
    if (!row) return state;
    let matchList = [];
    try { matchList = JSON.parse(row.match_list || '[]'); } catch { matchList = []; }
    let rankAward = Buffer.alloc(0);
    try { rankAward = row.rank_award ? Buffer.from(row.rank_award, 'hex') : Buffer.alloc(0); } catch { rankAward = Buffer.alloc(0); }
    Object.assign(state, {
      rank: Number(row.rank ?? initRank),
      historyRank: Number(row.history_rank ?? initRank),
      lastRank: Number(row.last_rank ?? 0),
      fightTimes: Number(row.fight_times ?? 0),
      buyFightTimes: Number(row.buy_fight_times ?? 0),
      extraFightTimes: Number(row.extra_fight_times ?? 0),
      refreshMatchTimes: Number(row.refresh_match_times ?? 0),
      resetDay: row.reset_day || dayKey(nowMs),
      matchList: Array.isArray(matchList) ? matchList.map(Number).filter(Number.isSafeInteger) : [],
      initMatch: Number(row.init_match ?? 0) === 1,
      refreshTime: row.refresh_time || isoSeconds(0),
      showRankChangeRed: Number(row.show_rank_change_red ?? 0) === 1,
      rankAward,
      crossStage: Number(row.cross_stage ?? 0),
      winTimes: Number(row.win_times ?? 0),
      defendTimes: Number(row.defend_times ?? 0),
      reportReadTime: Number(row.report_read_time ?? 0)
    });
    // SwapArenaData.reset_time resets the challenge counters and the refresh
    // allowance; the operator resets them at the stored day boundary.
    const today = dayKey(nowMs);
    if (state.resetDay !== today) {
      state.resetDay = today;
      state.fightTimes = 0;
      state.buyFightTimes = 0;
      state.extraFightTimes = 0;
      state.refreshMatchTimes = 0;
      state.matchList = [];
      state.initMatch = false;
    }
    return state;
  }

  function writeState(db, state, nowMs) {
    db.prepare(`INSERT INTO swap_arena_state (
      role_id, rank, history_rank, last_rank, fight_times, buy_fight_times, extra_fight_times,
      refresh_match_times, reset_day, match_list, init_match, refresh_time, show_rank_change_red,
      rank_award, cross_stage, win_times, defend_times, report_read_time, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id) DO UPDATE SET
        rank=excluded.rank, history_rank=excluded.history_rank, last_rank=excluded.last_rank,
        fight_times=excluded.fight_times, buy_fight_times=excluded.buy_fight_times,
        extra_fight_times=excluded.extra_fight_times, refresh_match_times=excluded.refresh_match_times,
        reset_day=excluded.reset_day, match_list=excluded.match_list, init_match=excluded.init_match,
        refresh_time=excluded.refresh_time, show_rank_change_red=excluded.show_rank_change_red,
        rank_award=excluded.rank_award, cross_stage=excluded.cross_stage, win_times=excluded.win_times,
        defend_times=excluded.defend_times, report_read_time=excluded.report_read_time,
        updated_at=excluded.updated_at`)
      .run(
        state.roleId, state.rank, state.historyRank, state.lastRank, state.fightTimes,
        state.buyFightTimes, state.extraFightTimes, state.refreshMatchTimes, state.resetDay,
        JSON.stringify(state.matchList), state.initMatch ? 1 : 0, state.refreshTime,
        state.showRankChangeRed ? 1 : 0, state.rankAward.toString('hex'), state.crossStage,
        state.winTimes, state.defendTimes, state.reportReadTime, isoSeconds(nowMs)
      );
  }

  function claimed(db, roleId, type, key) {
    return !!db.prepare('SELECT 1 FROM swap_arena_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
      .get(roleId, type, key);
  }

  function recordClaim(db, roleId, type, key, createdAt) {
    db.prepare('INSERT INTO swap_arena_claims VALUES (?,?,?,?)').run(roleId, type, key, createdAt);
  }

  // pb_swap_arena_match.role_id = 0 means "robot": the shipped client renders a
  // robot figure for those rows (SwapArenaMgr.GetRobotDataByRank). This single
  // deployment has one role, so every opponent slot is a robot slot.
  function buildOpponents(state) {
    const opponents = [];
    const limit = Math.max(0, state.rank - 1);
    for (let offset = 1; offset <= topNum && offset <= limit; offset += 1) {
      opponents.push({ rank: state.rank - offset, role_id: '0' });
    }
    return opponents;
  }

  function matchListOf(state) {
    if (!state.matchList.length) return buildOpponents(state);
    return state.matchList.map((rank) => ({ rank, role_id: '0' }));
  }

  function refreshOpponents(state, nowMs) {
    const opponents = buildOpponents(state);
    state.matchList = opponents.map((entry) => Number(entry.rank));
    state.initMatch = true;
    state.refreshTime = isoSeconds(nowMs);
    return opponents;
  }

  function allowedFightTimes(state) {
    return freeFightTimes + state.buyFightTimes + state.extraFightTimes;
  }

  function remainingFightTimes(state) {
    return allowedFightTimes(state) - state.fightTimes;
  }

  function botList() {
    const rows = [];
    for (const robot of tables.robot) {
      if (Number(robot.cross_stage) !== 0) continue;
      const detail = tables.robotDetail.get(Number(robot.detail_id));
      if (!detail) continue;
      const [from, to] = Array.isArray(robot.range) && robot.range.length === 2 ? robot.range.map(Number) : [0, 0];
      rows.push({ tid: String(robot.tid ?? 0), level: Number(detail.robot_lv ?? 0), power: Number(detail.power ?? 0), from, to });
      if (rows.length >= 32) break;
    }
    return rows.map((row) => ({ tid: row.tid, level: row.level, power: row.power }));
  }

  function roleData(state) {
    return {
      reset_time: secondsOf(state.resetDay + 'T00:00:00.000Z'),
      fight_times: state.fightTimes,
      buy_fight_times: state.buyFightTimes,
      refresh_match_times: state.refreshMatchTimes,
      match_list: state.matchList,
      show_rank_change_red: state.showRankChangeRed,
      refresh_match_time: secondsOf(state.refreshTime),
      init_match: state.initMatch,
      history_rank: state.historyRank,
      last_rank: state.lastRank,
      rank_award: state.rankAward,
      cross_stage: state.crossStage,
      win_times: state.winTimes,
      defend_times: state.defendTimes
    };
  }

  function reportData(db, roleId) {
    const rows = db.prepare('SELECT * FROM swap_arena_reports WHERE role_id=? ORDER BY fight_time DESC LIMIT 20').all(roleId);
    return {
      fight_report_list: rows.map((row) => ({
        fight_id: String(row.fight_id),
        before_fight_rank: Number(row.before_rank),
        after_fight_rank: Number(row.after_rank),
        time: String(row.fight_time),
        attack_role_id: String(row.attack_role_id),
        def_role_id: String(row.def_role_id),
        self_fight_result: Number(row.self_fight_result),
        enemy_rank: Number(row.enemy_rank)
      })),
      read_time: String(0)
    };
  }

  function loginPayload() {
    return store.inspect((db) => {
      ensureTables(db);
      const state = readState(db, store.state().roleId, now());
      const report = reportData(db, state.roleId);
      report.read_time = String(state.reportReadTime);
      return codec.pack('pb_swap_arena_login', {
        role_data: roleData(state),
        report_data: report,
        rank: state.rank,
        bot_list: botList()
      });
    });
  }

  function resPacket(changes) {
    return codec.pack('pb_res_to_client', { changes: changes ?? [], is_overflow: false });
  }

  function supports(type) { return SUPPORTED.includes(type); }

  async function getMatch() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (!state.matchList.length || !state.initMatch) refreshOpponents(state, nowMs);
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_match_served', rank: state.rank, opponents: state.matchList.length });
      return {
        value: { rank: state.rank, opponents: state.matchList.length },
        data: codec.pack('pb_swap_arena_match_toc', { match_list: matchListOf(state) })
      };
    });
  }

  async function refreshMatch() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (state.refreshMatchTimes >= refreshLimit) fail(CODE_LIMIT, 'Swap arena refresh count is insufficient');
      const lastRefresh = new Date(state.refreshTime).getTime();
      if (Number.isFinite(lastRefresh) && lastRefresh > 0 && Math.floor(nowMs / 1000) - Math.floor(lastRefresh / 1000) < refreshCd) {
        fail(CODE_LIMIT, 'Swap arena refresh is cooling down');
      }
      const opponents = refreshOpponents(state, nowMs);
      state.refreshMatchTimes += 1;
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_match_refreshed', rank: state.rank, times: state.refreshMatchTimes });
      return {
        value: { rank: state.rank, refreshTimes: state.refreshMatchTimes },
        data: codec.pack('pb_swap_arena_match_toc', { match_list: opponents })
      };
    });
  }

  // SwapArenaMgr.BuyChallengeCount prices the next purchase with
  // SwapArenaTable.Cost[GetBuyChallengeCount()+1].bft_cost_num paid in the
  // resource Base.bft_cost, capped by the number of configured Cost rows.
  async function buyFightTimes() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      const next = state.buyFightTimes + 1;
      const row = tables.cost.get(next);
      if (!row) fail(CODE_LIMIT, 'Swap arena fight purchase limit is reached');
      const price = integer(row.bft_cost_num, 1, Number.MAX_SAFE_INTEGER, 'Swap arena fight price is invalid');
      consumeResources(model, [[currencyTid, price]], CODE_INSUFFICIENT);
      state.buyFightTimes = next;
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_fight_bought', price, currencyTid, buyFightTimes: next });
      return {
        value: { currencyTid, price, buyFightTimes: next },
        data: resPacket([{ tid: String(currencyTid), new_num: '0', diff_num: String(-price) }])
      };
    });
  }

  // SwapArenaMgr asks for this command only when GetChallengeCount() < 0, i.e.
  // when the free and purchased attempts are already spent. It then increments
  // its local fight counter by the amount the server granted; the granted
  // amount itself is not part of SwapArenaTable, so one attempt per request is
  // the local rule (recorded as an evidence gap in the delivery note).
  async function moreFight() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (remainingFightTimes(state) > 0) fail(CODE_LIMIT, 'Swap arena challenge attempts are not exhausted');
      state.extraFightTimes += 1;
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_extra_fight_granted', extraFightTimes: state.extraFightTimes });
      return {
        value: { granted: 1, allowed: allowedFightTimes(state), used: state.fightTimes },
        data: resPacket([])
      };
    });
  }

  async function fightReport() {
    return store.inspect((db) => {
      ensureTables(db);
      const roleId = store.state().roleId;
      const state = readState(db, roleId, now());
      const report = reportData(db, roleId);
      report.read_time = String(state.reportReadTime);
      log({ event: 'swap_arena_reports_served', reports: report.fight_report_list.length });
      return {
        value: { reports: report.fight_report_list.length },
        data: codec.pack('pb_swap_arena_fight_report_data', report)
      };
    });
  }

  async function readRankChange() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      state.showRankChangeRed = false;
      const previousRank = state.lastRank > 0 ? state.lastRank : state.rank;
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_rank_change_read', rank: state.rank });
      // pb_swap_arena_rank_chang_toc carries last_rank, cur_rank and the new
      // opponent list, which is what SwapArenaMgr repaints after the red dot
      // is cleared.
      return {
        value: { rank: state.rank, previousRank, opponents: state.matchList.length },
        data: codec.pack('pb_swap_arena_rank_chang_toc', {
          last_rank: previousRank,
          cur_rank: state.rank,
          match_list: matchListOf(state)
        })
      };
    });
  }

  async function setReadReportTime() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      state.reportReadTime = Math.floor(nowMs / 1000);
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_report_read_time_set', readTime: state.reportReadTime });
      return { value: { readTime: state.reportReadTime }, data: encodeEtf([state.reportReadTime]) };
    });
  }

  async function rankAward(input) {
    const tids = Array.isArray(input?.tid_list) ? input.tid_list.map(Number) : [];
    if (!tids.length) fail(CODE_INVALID, 'Swap arena rank award list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      const pending = [];
      let bits = Buffer.from(state.rankAward);
      for (const tid of tids) {
        if (!Number.isSafeInteger(tid) || tid <= 0) fail(CODE_INVALID, 'Invalid swap arena rank award id');
        const row = tables.rankAward.find((candidate) => Number(candidate.tid) === tid);
        if (!row) fail(CODE_STATE, 'Swap arena rank award configuration is missing');
        if (Number(row.cross_stage) !== state.crossStage) fail(CODE_STATE, 'Swap arena rank award belongs to another cross stage');
        const [from, to] = arenaRange(row.rank_range, 'Swap arena rank award');
        if (state.rank < from || state.rank > to) fail(CODE_STATE, 'Swap arena rank award was not reached');
        if (hasBit(bits, tid) || claimed(db, state.roleId, CLAIM_RANK_AWARD, String(tid))) {
          fail(CODE_LIMIT, 'Swap arena rank award was already received');
        }
        pending.push({ tid, award: arenaAwardPairs(row.award, 'Swap arena rank award ' + tid) });
        bits = setBit(bits, tid);
      }
      const reward = grantResources(model, pending.flatMap((entry) => entry.award), resourceTables());
      const createdAt = isoSeconds(nowMs);
      for (const entry of pending) recordClaim(db, state.roleId, CLAIM_RANK_AWARD, String(entry.tid), createdAt);
      state.rankAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_rank_award_committed', tids: pending.map((entry) => entry.tid), changes: reward.changes.length });
      return {
        value: { tids: pending.map((entry) => entry.tid), changes: reward.changes },
        data: resPacket(reward.changes)
      };
    });
  }

  // 4039 is requested after the cross stage rolls over. The persisted stage is
  // authoritative here; the seasonal rollover itself is a scheduled settle that
  // this card does not own (no settle command exists in 4031-4040).
  async function updateCrossStage() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      writeState(db, state, nowMs);
      log({ event: 'swap_arena_cross_stage_served', crossStage: state.crossStage, rank: state.rank });
      return {
        value: { crossStage: state.crossStage, rank: state.rank },
        data: codec.pack('pb_swap_arena_update_cross', {
          arena: roleData(state),
          res: { changes: [], is_overflow: false },
          bot_list: botList()
        })
      };
    });
  }

  // SwapArenaMgr.ReqInitOtherDoubleTeam sends the role id and the client adds the
  // returned pb_lineup to the local lineup list, so the reply must be the
  // multi-team arena lineup of LineupTable type 66.
  async function initDoubleTeam(input) {
    const target = Array.isArray(input) ? input[0] : input;
    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const requested = target === undefined || target === null || target === '' ? roleId : Number(target);
      if (!Number.isSafeInteger(requested) || requested <= 0) fail(CODE_INVALID, 'Invalid swap arena double team role');
      if (requested !== roleId) fail(CODE_STATE, 'Swap arena double team belongs to another role');
      const lineups = Array.isArray(model.playLineups) ? model.playLineups : [];
      let lineup = lineups.find((candidate) => Number(candidate.type) === LINEUP_TYPE_SWAP_ARENA_DOUBLE);
      if (!lineup) {
        const single = lineups.find((candidate) => Number(candidate.type) === LINEUP_TYPE_SWAP_ARENA);
        const preset = (model.lineups?.pre_lineups ?? []).find((entry) => Number(entry.index) === Number(model.lineups?.cur_pre_index ?? 1));
        const team = single?.team_list?.[0] ?? preset?.lineup ?? null;
        if (!team) fail(CODE_STATE, 'Swap arena double team lineup source is missing');
        lineup = { type: LINEUP_TYPE_SWAP_ARENA_DOUBLE, team_list: [structuredClone(team), structuredClone(team)], custom_attr: [] };
        lineups.push(lineup);
        model.playLineups = lineups;
        log({ event: 'swap_arena_double_team_created', type: LINEUP_TYPE_SWAP_ARENA_DOUBLE });
      }
      return { value: { type: Number(lineup.type), teams: lineup.team_list?.length ?? 0 }, data: codec.pack('pb_player_lineup', { lineup_list: [lineup] }) };
    });
  }

  // Settlement seam for the arena battle pipeline. The battle command itself is
  // not part of SwapArenaCmd 4031-4040, so difficulty results arrive here.
  async function settleFight({ won, enemyRank, nowMs = now() } = {}) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId, nowMs);
      if (remainingFightTimes(state) <= 0) fail(CODE_LIMIT, 'Swap arena challenge attempts are exhausted');
      state.fightTimes += 1;
      if (won) {
        const target = integer(enemyRank, 1, Number.MAX_SAFE_INTEGER, 'Invalid swap arena enemy rank');
        if (target < state.rank) {
          state.lastRank = state.rank;
          state.rank = target;
          state.showRankChangeRed = true;
          if (target < state.historyRank) state.historyRank = target;
        }
        state.winTimes += 1;
      }
      writeState(db, state, nowMs);
      return { value: { rank: state.rank, fightTimes: state.fightTimes, won: !!won } };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_GET_MATCH) return getMatch();
    if (type === COMMAND_REFRESH_MATCH) return refreshMatch();
    if (type === COMMAND_BUY_FIGHT_TIMES) return buyFightTimes();
    if (type === COMMAND_MORE_FIGHT) return moreFight();
    if (type === COMMAND_FIGHT_REPORT) return fightReport();
    if (type === COMMAND_READ_RANK_CHANGE) return readRankChange();
    if (type === COMMAND_SET_READ_REPORT_TIME) return setReadReportTime();
    if (type === COMMAND_RANK_AWARD) return rankAward(input);
    if (type === COMMAND_UPDATE_CROSS_STAGE) return updateCrossStage();
    if (type === COMMAND_INIT_DOUBLE_TEAM) return initDoubleTeam(input);
    fail(CODE_INVALID, 'Unsupported swap arena command');
  }

  return {
    supports, execute, loginPayload, settleFight,
    commands: SUPPORTED,
    lineupTypes: { single: LINEUP_TYPE_SWAP_ARENA, double: LINEUP_TYPE_SWAP_ARENA_DOUBLE },
    constants: { freeFightTimes, refreshLimit, refreshCd, topNum, initRank, currencyTid, serverOpenedAt }
  };
}

