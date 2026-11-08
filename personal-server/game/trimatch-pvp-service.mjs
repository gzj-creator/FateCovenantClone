import { encodeEtfIntegerTuple } from '../protocol/game-codec.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, fail, integer, isoSeconds,
  ensureTrimatchTables, grant
} from './trimatch-core.mjs';

// Triple match PVP activity (BATTLE-TRIMATCHPVP, 121001-121004).
//
// Evidence used by this module:
//  * TriMatchPvpCmd wraps 121001 {act_id, ids}, 121002 {act_id, ids} and
//    121003 {act_id} with Codec.EncodePB; 121004 (req_tri_match_pvp_rec_giveup)
//    sends a bare Erlang term.
//  * TriMatchPvpMgr gates 121002 on TriMatchPvpData.GetGradeAwardState() ==
//    STATE_RECEIVE, stores 121003's report_list through SetReportList and limits
//    121004 with IsGiveUpLimitReached against Version.day_giveup.
//  * TriMatchPvpData computes the grade award state from GetMaxScore() >=
//    ActGrade.need_score and the daily task state from ActTask.FlushTime with a
//    per day TaskMgr.IsTaskFinishCommon(task_type, target_count, task_param)
//    check, so a task is claimable exactly when its counter reaches
//    target_count and it was not received today.
//  * ActFrameAct 1304001 (type 1304) is the shipped PVP activity instance.
const COMMAND_TASK_AWARD = 121001;
const COMMAND_GRADE_AWARD = 121002;
const COMMAND_REPORT_LIST = 121003;
const COMMAND_GIVEUP = 121004;
const SUPPORTED = [COMMAND_TASK_AWARD, COMMAND_GRADE_AWARD, COMMAND_REPORT_LIST, COMMAND_GIVEUP];

const PVP_ACT_FRAME_TYPE = 1304;
const CLAIM_DAILY_TASK = 'daily_task';
const CLAIM_GRADE = 'grade';

// ActTask.task_type ids map to CountStatistics counters that are not part of the
// readable table dump (stat 82 with the expand ids 10019/10020/10021). The
// deployment therefore counts progress in its own PVP state, using the natural
// reading of the three shipped ladders: wins, win streak and matches played.
const TASK_WINS = 102001;
const TASK_STREAK = 102002;
const TASK_MATCHES = 102003;

function ensurePvpTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_pvp_state (
    role_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    daily_success_times INTEGER NOT NULL,
    daily_match_times INTEGER NOT NULL,
    daily_give_up INTEGER NOT NULL,
    give_up_num INTEGER NOT NULL,
    success_streak_times INTEGER NOT NULL,
    match_times INTEGER NOT NULL,
    day_key TEXT NOT NULL,
    last_update_time INTEGER NOT NULL,
    last_settlement_fight_id INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, act_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_pvp_claim (
    role_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, act_id, claim_type, claim_key)
  )`);
  // Reports come from real fights; the future PVP match pipeline writes them.
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_pvp_report (
    role_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    fight_tid INTEGER NOT NULL,
    time INTEGER NOT NULL,
    atk_role_id INTEGER NOT NULL,
    def_role_id INTEGER NOT NULL,
    result INTEGER NOT NULL,
    atk_score_change INTEGER NOT NULL,
    def_score_change INTEGER NOT NULL,
    atk_power INTEGER NOT NULL,
    def_power INTEGER NOT NULL,
    is_robot INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, act_id, fight_uid)
  )`);
}

function dayKey(milliseconds) {
  return new Date(milliseconds).toISOString().slice(0, 10);
}

export function createTriMatchPvpService({
  store,
  codec,
  tables,
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!tables?.pvpVersion) throw new Error('Triple match pvp configuration is unavailable');
  const version = tables.pvpVersion;
  const taskLib = Number(version.task_lib ?? 1);
  const gradeLib = Number(version.grade_lib ?? 1);
  const initScore = Number(version.init_score ?? 0);
  const dayGiveUp = Math.max(1, Number(version.day_giveup ?? 1));
  const reportMax = Math.max(1, Number(version.report_max ?? 30));

  function actIds() {
    const ids = [];
    const source = gameTables?.ActFrameAct;
    if (source && typeof source.forEach === 'function') {
      source.forEach((row, tid) => {
        if (Number(row?.type) === PVP_ACT_FRAME_TYPE) ids.push(Number(tid));
      });
    }
    return ids.sort((left, right) => left - right);
  }

  const resolveActId = () => {
    const ids = actIds();
    return ids.length ? ids[ids.length - 1] : 0;
  };

  function actIdOf(raw) {
    const requested = integer(raw ?? resolveActId(), 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match pvp activity');
    const ids = actIds();
    if (ids.length && !ids.includes(requested)) fail(CODE_STATE, 'Triple match pvp activity is not configured: ' + requested);
    return requested;
  }

  function readState(db, roleId, actId, nowMs) {
    const row = db.prepare('SELECT * FROM trimatch_pvp_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    const today = dayKey(nowMs);
    if (!row) {
      return {
        roleId, actId, score: initScore, maxScore: initScore,
        dailySuccessTimes: 0, dailyMatchTimes: 0, dailyGiveUp: 0,
        giveUpNum: 0, successStreakTimes: 0, matchTimes: 0,
        dayKey: today, lastUpdateTime: Math.floor(nowMs / 1000), lastSettlementFightId: 0
      };
    }
    // Daily counters reset when the stored day differs from the current day; the
    // activity wide counters (score, match times, give up total) are kept.
    const sameDay = String(row.day_key ?? today) === today;
    return {
      roleId,
      actId,
      score: Number(row.score ?? initScore),
      maxScore: Number(row.max_score ?? initScore),
      dailySuccessTimes: sameDay ? Number(row.daily_success_times ?? 0) : 0,
      dailyMatchTimes: sameDay ? Number(row.daily_match_times ?? 0) : 0,
      dailyGiveUp: sameDay ? Number(row.daily_give_up ?? 0) : 0,
      giveUpNum: Number(row.give_up_num ?? 0),
      successStreakTimes: sameDay ? Number(row.success_streak_times ?? 0) : 0,
      matchTimes: Number(row.match_times ?? 0),
      dayKey: today,
      lastUpdateTime: Number(row.last_update_time ?? Math.floor(nowMs / 1000)),
      lastSettlementFightId: Number(row.last_settlement_fight_id ?? 0)
    };
  }

  function writeState(db, state, nowMs) {
    db.prepare(`INSERT INTO trimatch_pvp_state
      (role_id, act_id, score, max_score, daily_success_times, daily_match_times, daily_give_up, give_up_num,
       success_streak_times, match_times, day_key, last_update_time, last_settlement_fight_id, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id, act_id) DO UPDATE SET
        score=excluded.score, max_score=excluded.max_score,
        daily_success_times=excluded.daily_success_times, daily_match_times=excluded.daily_match_times,
        daily_give_up=excluded.daily_give_up, give_up_num=excluded.give_up_num,
        success_streak_times=excluded.success_streak_times, match_times=excluded.match_times,
        day_key=excluded.day_key, last_update_time=excluded.last_update_time,
        last_settlement_fight_id=excluded.last_settlement_fight_id, updated_at=excluded.updated_at`)
      .run(
        state.roleId, state.actId, state.score, state.maxScore, state.dailySuccessTimes,
        state.dailyMatchTimes, state.dailyGiveUp, state.giveUpNum, state.successStreakTimes,
        state.matchTimes, state.dayKey, state.lastUpdateTime, state.lastSettlementFightId, isoSeconds(nowMs)
      );
  }

  function claimed(db, roleId, actId, type, key) {
    return !!db.prepare('SELECT 1 FROM trimatch_pvp_claim WHERE role_id=? AND act_id=? AND claim_type=? AND claim_key=?')
      .get(roleId, actId, type, key);
  }

  function recordClaim(db, roleId, actId, type, key, createdAt) {
    db.prepare('INSERT INTO trimatch_pvp_claim VALUES (?,?,?,?,?)').run(roleId, actId, type, key, createdAt);
  }

  function taskProgress(state, taskType) {
    if (taskType === TASK_WINS) return state.dailySuccessTimes;
    if (taskType === TASK_STREAK) return state.successStreakTimes;
    if (taskType === TASK_MATCHES) return state.dailyMatchTimes;
    return null;
  }

  function reports(db, roleId, actId) {
    return db.prepare('SELECT * FROM trimatch_pvp_report WHERE role_id=? AND act_id=? ORDER BY time DESC, fight_uid DESC LIMIT ?')
      .all(roleId, actId, reportMax)
      .map(row => ({
        fight_uid: String(row.fight_uid),
        time: String(row.time),
        atk_role_id: String(row.atk_role_id),
        def_role_id: String(row.def_role_id),
        result: Number(row.result),
        atk_score_change: String(row.atk_score_change),
        def_score_change: String(row.def_score_change),
        atk_power: String(row.atk_power),
        def_power: String(row.def_power),
        is_robot: Number(row.is_robot) === 1,
        fight_tid: String(row.fight_tid)
      }));
  }

  function actData(db, state, nowMs) {
    const receivedDailyTaskIds = state.dayKey
      ? db.prepare('SELECT claim_key FROM trimatch_pvp_claim WHERE role_id=? AND act_id=? AND claim_type=? AND claim_key LIKE ? ORDER BY claim_key')
        .all(state.roleId, state.actId, CLAIM_DAILY_TASK, state.dayKey + ':%').map(row => Number(String(row.claim_key).split(':')[1]))
      : [];
    const receivedGradeIds = db.prepare('SELECT claim_key FROM trimatch_pvp_claim WHERE role_id=? AND act_id=? AND claim_type=? ORDER BY claim_key')
      .all(state.roleId, state.actId, CLAIM_GRADE).map(row => Number(row.claim_key));
    return {
      act_id: state.actId,
      last_update_time: state.lastUpdateTime,
      received_daily_task_ids: receivedDailyTaskIds.filter(Number.isSafeInteger),
      received_grade_ids: receivedGradeIds.filter(Number.isSafeInteger),
      score: state.score,
      daily_success_times: state.dailySuccessTimes,
      last_settlement_fight_id: state.lastSettlementFightId,
      match_times: state.matchTimes,
      give_up_num: state.giveUpNum,
      success_streak_times: state.successStreakTimes,
      report_list: reports(db, state.roleId, state.actId),
      max_score: state.maxScore
    };
  }

  const resPacket = changes => ({ changes: changes ?? [], is_overflow: false });

  // 121001: daily task rewards. Progress is the deployment counter for the task
  // type, the claim is recorded per day because ActTask rows flush daily.
  function taskAward(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const rawIds = Array.isArray(input?.ids) ? input.ids : [];
    if (!rawIds.length || rawIds.length > 64) fail(CODE_INVALID, 'Invalid triple match pvp task award request');
    const ids = rawIds.map(raw => integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match pvp task award'));
    if (new Set(ids).size !== ids.length) fail(CODE_INVALID, 'Triple match pvp task award is duplicated');
    const state = readState(db, model.state.roleId, actId, nowMs);
    const pending = [];
    for (const id of ids) {
      const row = tables.pvpTasks.get(id);
      if (!row) fail(CODE_STATE, 'Triple match pvp task configuration is missing: ' + id);
      if (Number(row.lib ?? 0) !== taskLib) fail(CODE_STATE, 'Triple match pvp task belongs to another task library: ' + id);
      const taskType = Number(row.task_type ?? 0);
      const target = Number(row.target_count ?? 0);
      if (!Number.isSafeInteger(target) || target <= 0) fail(CODE_STATE, 'Triple match pvp task target is invalid: ' + id);
      const progress = taskProgress(state, taskType);
      if (progress === null) {
        // Unproven task type: refuse instead of guessing the counter.
        log({ event: 'trimatch_pvp_task_type_unsupported', actId, taskId: id, taskType });
        fail(CODE_STATE, 'Triple match pvp task type is not implemented: ' + taskType);
      }
      if (progress < target) fail(CODE_STATE, 'Triple match pvp task is not finished: ' + id);
      const key = state.dayKey + ':' + id;
      if (claimed(db, state.roleId, actId, CLAIM_DAILY_TASK, key)) fail(CODE_LIMIT, 'Triple match pvp task award was already received: ' + id);
      const award = Array.isArray(row.award) ? row.award : [];
      if (!award.length) fail(CODE_STATE, 'Triple match pvp task award is empty: ' + id);
      pending.push({ id, award, key });
    }
    const reward = grant(model, pending.flatMap(entry => entry.award), gameTables, codec);
    const createdAt = isoSeconds(nowMs);
    for (const entry of pending) recordClaim(db, state.roleId, actId, CLAIM_DAILY_TASK, entry.key, createdAt);
    state.lastUpdateTime = Math.floor(nowMs / 1000);
    writeState(db, state, nowMs);
    log({ event: 'trimatch_pvp_task_award', actId, ids: pending.map(entry => entry.id), changes: reward.changes.length });
    return {
      value: { actId, ids: pending.map(entry => entry.id), changes: reward.changes.length },
      data: codec.pack('pb_tri_match_pvp_rec_task_award_rsp', {
        data: { act_data: actData(db, state, nowMs), res: resPacket(reward.changes) }
      })
    };
  }

  // 121002: grade rewards. ActGrade.need_score is compared against the recorded
  // maximum score, matching TriMatchPvpData.GetGradeAwardState.
  function gradeAward(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const rawIds = Array.isArray(input?.ids) ? input.ids : [];
    if (!rawIds.length || rawIds.length > 64) fail(CODE_INVALID, 'Invalid triple match pvp grade award request');
    const ids = rawIds.map(raw => integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match pvp grade award'));
    if (new Set(ids).size !== ids.length) fail(CODE_INVALID, 'Triple match pvp grade award is duplicated');
    const state = readState(db, model.state.roleId, actId, nowMs);
    const pending = [];
    for (const id of ids) {
      const row = tables.pvpGrades.get(id);
      if (!row) fail(CODE_STATE, 'Triple match pvp grade configuration is missing: ' + id);
      if (Number(row.lib ?? 0) !== gradeLib) fail(CODE_STATE, 'Triple match pvp grade belongs to another grade library: ' + id);
      const needScore = Number(row.need_score ?? 0);
      if (!Number.isSafeInteger(needScore) || needScore < 0) fail(CODE_STATE, 'Triple match pvp grade score is invalid: ' + id);
      if (state.maxScore < needScore) fail(CODE_STATE, 'Triple match pvp grade is not reached: ' + id);
      if (claimed(db, state.roleId, actId, CLAIM_GRADE, String(id))) fail(CODE_LIMIT, 'Triple match pvp grade award was already received: ' + id);
      const award = Array.isArray(row.award) ? row.award : [];
      // ActGrade 101 (need_score 0) ships an empty award list and only a non-zero
      // success_award, so an empty grade award is valid shipped data: record the
      // claim and grant nothing instead of failing the whole batch.
      pending.push({ id, award });
    }
    const reward = grant(model, pending.flatMap(entry => entry.award), gameTables, codec);
    const createdAt = isoSeconds(nowMs);
    for (const entry of pending) recordClaim(db, state.roleId, actId, CLAIM_GRADE, String(entry.id), createdAt);
    state.lastUpdateTime = Math.floor(nowMs / 1000);
    writeState(db, state, nowMs);
    log({ event: 'trimatch_pvp_grade_award', actId, ids: pending.map(entry => entry.id), changes: reward.changes.length });
    return {
      value: { actId, ids: pending.map(entry => entry.id), changes: reward.changes.length },
      data: codec.pack('pb_tri_match_pvp_rec_grade_award_rsp', {
        data: { act_data: actData(db, state, nowMs), res: resPacket(reward.changes) }
      })
    };
  }

  // 121003: the stored report list. Rows are written by the PVP match pipeline,
  // so the list stays empty until that pipeline records real fights.
  function reportList(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const list = reports(db, model.state.roleId, actId);
    log({ event: 'trimatch_pvp_report_list', actId, rows: list.length });
    return {
      value: { actId, rows: list.length },
      data: codec.pack('pb_tri_match_pvp_get_report_list_rsp', { report_list: list })
    };
  }

  // 121004: abandon a match. Version.day_giveup bounds the daily count and
  // give_up_num keeps the activity wide total.
  function giveUp(model, db, _input) {
    const nowMs = now();
    const actId = resolveActId();
    if (!actId) fail(CODE_STATE, 'Triple match pvp activity is missing');
    const state = readState(db, model.state.roleId, actId, nowMs);
    if (state.dailyGiveUp >= dayGiveUp) fail(CODE_LIMIT, 'Triple match pvp give up limit is reached');
    state.dailyGiveUp += 1;
    state.giveUpNum += 1;
    state.lastUpdateTime = Math.floor(nowMs / 1000);
    writeState(db, state, nowMs);
    log({ event: 'trimatch_pvp_give_up', actId, dailyGiveUp: state.dailyGiveUp, giveUpNum: state.giveUpNum });
    return {
      value: { actId, dailyGiveUp: state.dailyGiveUp, giveUpNum: state.giveUpNum },
      // The 121004 response schema is not recovered; the client sends it with
      // Codec.EncodeErl and reads the refreshed activity data from the push.
      data: encodeEtfIntegerTuple([])
    };
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    const command = Number(type);
    if (!SUPPORTED.includes(command)) fail(CODE_INVALID, 'Unsupported triple match pvp command');
    return store.transaction((model, db) => {
      ensureTrimatchTables(db);
      ensurePvpTables(db);
      if (command === COMMAND_TASK_AWARD) return taskAward(model, db, input);
      if (command === COMMAND_GRADE_AWARD) return gradeAward(model, db, input);
      if (command === COMMAND_REPORT_LIST) return reportList(model, db, input);
      if (command === COMMAND_GIVEUP) return giveUp(model, db, input);
      fail(CODE_INVALID, 'Unsupported triple match pvp command');
    });
  }

  // Settlement seam for the future PVP match pipeline: it records the real fight
  // and moves the score/streak counters the task and grade rewards read.
  function recordFight(model, db, payload) {
    ensurePvpTables(db);
    const nowMs = now();
    const actId = Number(payload?.actId) || resolveActId();
    if (!actId) fail(CODE_STATE, 'Triple match pvp activity is missing');
    const state = readState(db, model.state.roleId, actId, nowMs);
    const result = Number(payload?.result ?? 0);
    const scoreChange = Number(payload?.atkScoreChange ?? 0);
    state.score += scoreChange;
    if (state.score > state.maxScore) state.maxScore = state.score;
    state.matchTimes += 1;
    state.dailyMatchTimes += 1;
    if (result === 1) {
      state.dailySuccessTimes += 1;
      state.successStreakTimes += 1;
    } else {
      state.successStreakTimes = 0;
    }
    state.lastSettlementFightId = Number(payload?.fightUid ?? 0);
    state.lastUpdateTime = Math.floor(nowMs / 1000);
    writeState(db, state, nowMs);
    db.prepare(`INSERT INTO trimatch_pvp_report
      (role_id, act_id, fight_uid, fight_tid, time, atk_role_id, def_role_id, result, atk_score_change,
       def_score_change, atk_power, def_power, is_robot, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id, act_id, fight_uid) DO NOTHING`)
      .run(
        model.state.roleId, actId, Number(payload?.fightUid ?? 0), Number(payload?.fightTid ?? 0),
        Math.floor(nowMs / 1000), Number(payload?.atkRoleId ?? model.state.roleId), Number(payload?.defRoleId ?? 0),
        result, scoreChange, Number(payload?.defScoreChange ?? 0), Number(payload?.atkPower ?? 0),
        Number(payload?.defPower ?? 0), payload?.isRobot ? 1 : 0, isoSeconds(nowMs)
      );
    log({ event: 'trimatch_pvp_fight_recorded', actId, fightUid: Number(payload?.fightUid ?? 0), result, score: state.score });
    return { actId, score: state.score, maxScore: state.maxScore };
  }

  function state(roleId) {
    return store.inspect(db => {
      ensureTrimatchTables(db);
      ensurePvpTables(db);
      return db.prepare('SELECT * FROM trimatch_pvp_state WHERE role_id=? ORDER BY act_id').all(roleId).map(row => ({
        act_id: Number(row.act_id),
        score: Number(row.score),
        max_score: Number(row.max_score),
        daily_success_times: Number(row.daily_success_times),
        daily_match_times: Number(row.daily_match_times),
        daily_give_up: Number(row.daily_give_up),
        give_up_num: Number(row.give_up_num),
        success_streak_times: Number(row.success_streak_times),
        match_times: Number(row.match_times),
        day_key: row.day_key
      }));
    });
  }

  return {
    supports,
    execute,
    state,
    recordFight,
    requestSchemas: {
      [COMMAND_TASK_AWARD]: 'pb_tri_match_pvp_rec_task_award_req',
      [COMMAND_GRADE_AWARD]: 'pb_tri_match_pvp_rec_grade_award_req',
      [COMMAND_REPORT_LIST]: 'pb_tri_match_pvp_get_report_list_req'
    }
  };
}

