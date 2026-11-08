import {
  CODE_INVALID, CODE_LIMIT, CODE_INSUFFICIENT, CODE_STATE, fail, integer, isoSeconds,
  affordable, consume, ensureTrimatchTables, grant
} from './trimatch-core.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { towerMissionByFightTid } from '../config/trimatch-tables.mjs';

// Triple match tower activity (BATTLE-TRIMATCHTOWER, 119001-119003).
//
// Evidence used by this module:
//  * TriMatchTowerCmd wraps all three commands with Codec.EncodePB:
//    119001 {act_id, tid_list}, 119002 {act_id}, 119003 {act_id}.
//  * TriMatchTowerMgr parses 119001 as pb_tri_match_tower_rec_process_award_rsp,
//    calls AwardKit.Parse on the returned res and refreshes the activity data;
//    it sends 119002 only while the locally recomputed stamina is below the
//    stored value; 119003 stores pass_list.
//  * TriMatchTowerData.GetStamina/GetCurStamina recompute stamina from
//    Version.recover_time, Version.recover_num and Version.max_stamina with
//    TimeKit.NowSec, and IsProgressAwardReceived reads the got_progress_award
//    BitBlock by ProAward tid.
//  * TriMatchTowerUtil.GetAvailableProgressAwardTidList compares ProAward.pro
//    against the cleared tower level, so a reward is claimable exactly when its
//    progress is reached.
//  * ActFrameAct 1302001 (type 1302) is the shipped tower activity instance.
const COMMAND_PROGRESS_AWARD = 119001;
const COMMAND_RECOVER_STAMINA = 119002;
const COMMAND_PASS_LINEUP = 119003;
const SUPPORTED = [COMMAND_PROGRESS_AWARD, COMMAND_RECOVER_STAMINA, COMMAND_PASS_LINEUP];

const TOWER_ACT_FRAME_TYPE = 1302;

function ensureTowerTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_tower_state (
    role_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    tower INTEGER NOT NULL,
    got_progress_award TEXT NOT NULL,
    stamina INTEGER NOT NULL,
    stamina_last_update INTEGER NOT NULL,
    last_settlement_fight_id INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, act_id)
  )`);
  // First clear line-ups served by 119003. One row per cleared tower level.
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_tower_clear (
    role_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    tower INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    hero_list_json TEXT NOT NULL,
    power INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, act_id, tower)
  )`);
}

export function createTriMatchTowerService({
  store,
  codec,
  tables,
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!tables?.towerVersion) throw new Error('Triple match tower configuration is unavailable');
  const version = tables.towerVersion;
  const recoverTime = Math.max(1, Number(version.recover_time ?? 3600));
  const recoverNum = Math.max(1, Number(version.recover_num ?? 1));
  const maxStamina = Math.max(1, Number(version.max_stamina ?? 1));
  const initStamina = Math.max(0, Math.min(maxStamina, Number(version.init_stamina ?? maxStamina)));
  const delStamina = Math.max(0, Number(version.del_stamina ?? 0));
  const staminaItem = Number(version.stamina_item ?? 0);
  const maxTowerLevel = Math.max(0, ...tables.towerMissions.keys());
  // Mission lookup by fight tid: 11902 style settlements only carry the fight id.
  const missionByFight = new Map();
  for (const row of tables.towerMissions.values()) {
    const fightTid = Number(row.fight_tid);
    if (Number.isSafeInteger(fightTid) && fightTid > 0 && !missionByFight.has(fightTid)) missionByFight.set(fightTid, row);
  }

  // Tower activity instances come from ActFrameAct rows of type 1302.
  function actIds() {
    const ids = [];
    const source = gameTables?.ActFrameAct;
    if (source && typeof source.forEach === 'function') {
      source.forEach((row, tid) => {
        if (Number(row?.type) === TOWER_ACT_FRAME_TYPE) ids.push(Number(tid));
      });
    }
    return ids.sort((left, right) => left - right);
  }

  function resolveActId() {
    const ids = actIds();
    return ids.length ? ids[ids.length - 1] : 0;
  }

  function actIdOf(raw) {
    const requested = integer(raw ?? resolveActId(), 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match tower activity');
    const ids = actIds();
    // The configured activity ids are the shipped instances of ActFrameType 1302;
    // a request for anything else cannot belong to this activity.
    if (ids.length && !ids.includes(requested)) fail(CODE_STATE, 'Triple match tower activity is not configured: ' + requested);
    return requested;
  }

  function readState(db, roleId, actId, nowMs) {
    const row = db.prepare('SELECT * FROM trimatch_tower_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (!row) {
      return {
        roleId, actId,
        tower: 0,
        gotProgressAward: Buffer.alloc(0),
        stamina: initStamina,
        staminaLastUpdate: Math.floor(nowMs / 1000),
        lastSettlementFightId: 0
      };
    }
    let bits = Buffer.alloc(0);
    try { bits = row.got_progress_award ? Buffer.from(row.got_progress_award, 'hex') : Buffer.alloc(0); } catch { bits = Buffer.alloc(0); }
    return {
      roleId,
      actId,
      tower: Number(row.tower ?? 0),
      gotProgressAward: bits,
      stamina: Number(row.stamina ?? initStamina),
      staminaLastUpdate: Number(row.stamina_last_update ?? Math.floor(nowMs / 1000)),
      lastSettlementFightId: Number(row.last_settlement_fight_id ?? 0)
    };
  }

  function writeState(db, state, nowMs) {
    db.prepare(`INSERT INTO trimatch_tower_state
      (role_id, act_id, tower, got_progress_award, stamina, stamina_last_update, last_settlement_fight_id, updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id, act_id) DO UPDATE SET
        tower=excluded.tower,
        got_progress_award=excluded.got_progress_award,
        stamina=excluded.stamina,
        stamina_last_update=excluded.stamina_last_update,
        last_settlement_fight_id=excluded.last_settlement_fight_id,
        updated_at=excluded.updated_at`)
      .run(
        state.roleId, state.actId, state.tower, state.gotProgressAward.toString('hex'),
        state.stamina, state.staminaLastUpdate, state.lastSettlementFightId, isoSeconds(nowMs)
      );
  }

  // Lazy stamina: Version.recover_num stamina every Version.recover_time
  // seconds, capped by Version.max_stamina.
  function normalizeStamina(state, nowMs) {
    const seconds = Math.floor(nowMs / 1000);
    if (state.stamina >= maxStamina) return { stamina: maxStamina, lastUpdate: seconds };
    const elapsed = Math.max(0, seconds - state.staminaLastUpdate);
    const intervals = Math.floor(elapsed / recoverTime);
    if (intervals <= 0) return { stamina: state.stamina, lastUpdate: state.staminaLastUpdate };
    const stamina = Math.min(maxStamina, state.stamina + intervals * recoverNum);
    const consumed = intervals * recoverTime;
    return { stamina, lastUpdate: stamina >= maxStamina ? seconds : state.staminaLastUpdate + consumed };
  }

  function actData(state, nowMs) {
    const normalized = normalizeStamina(state, nowMs);
    return {
      act_tid: state.actId,
      tower: state.tower,
      got_progress_award: state.gotProgressAward,
      stamina: normalized.stamina,
      stamina_last_update_time: normalized.lastUpdate,
      last_settlement_fight_id: state.lastSettlementFightId
    };
  }

  function resPacket(changes) {
    return { changes: changes ?? [], is_overflow: false };
  }

  // 119001: claim the reached progress rewards. Each reward is identified by its
  // ProAward tid and tracked in the got_progress_award BitBlock.
  function claimProgressAward(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const rawTids = Array.isArray(input?.tid_list) ? input.tid_list : [];
    if (!rawTids.length || rawTids.length > 256) fail(CODE_INVALID, 'Invalid triple match tower progress award request');
    const tids = rawTids.map(raw => integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match tower progress award'));
    if (new Set(tids).size !== tids.length) fail(CODE_INVALID, 'Triple match tower progress award is duplicated');
    const state = readState(db, model.state.roleId, actId, nowMs);
    let bits = Buffer.from(state.gotProgressAward);
    const granted = [];
    for (const tid of tids) {
      const row = tables.towerProAwards.get(tid);
      if (!row) fail(CODE_STATE, 'Triple match tower progress award configuration is missing: ' + tid);
      const progress = Number(row.pro ?? 0);
      if (!Number.isSafeInteger(progress) || progress <= 0) fail(CODE_STATE, 'Triple match tower progress award row is invalid: ' + tid);
      if (state.tower < progress) fail(CODE_STATE, 'Triple match tower progress award is not reached: ' + tid);
      if (hasBit(bits, tid)) fail(CODE_LIMIT, 'Triple match tower progress award was already received: ' + tid);
      const award = Array.isArray(row.award) ? row.award : [];
      if (!award.length) fail(CODE_STATE, 'Triple match tower progress award is empty: ' + tid);
      granted.push({ tid, progress, award });
      bits = setBit(bits, tid);
    }
    const reward = grant(model, granted.flatMap(entry => entry.award), gameTables, codec);
    state.gotProgressAward = bits;
    writeState(db, state, nowMs);
    log({ event: 'trimatch_tower_progress_award', actId, tids: granted.map(entry => entry.tid), changes: reward.changes.length });
    return {
      value: { actId, tids: granted.map(entry => entry.tid), changes: reward.changes.length },
      data: codec.pack('pb_tri_match_tower_rec_process_award_rsp', {
        data: { act_data: actData(state, nowMs), res: resPacket(reward.changes) }
      })
    };
  }

  // 119002: bring the stored stamina up to date; when the natural timer produced
  // nothing and the activity is not full, one Version.stamina_item refills
  // Version.recover_num stamina. The item path is the client's "恢复体力" button;
  // the shipped request carries no item, so the amount is the version value.
  function recoverStamina(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const state = readState(db, model.state.roleId, actId, nowMs);
    const before = normalizeStamina(state, nowMs);
    if (before.stamina >= maxStamina) fail(CODE_LIMIT, 'Triple match tower stamina is already full');
    let changes = [];
    let stamina = before.stamina;
    let lastUpdate = before.lastUpdate;
    if (stamina <= state.stamina) {
      if (!staminaItem) fail(CODE_STATE, 'Triple match tower stamina item configuration is missing');
      if (!affordable(model, [[staminaItem, 1]])) fail(CODE_INSUFFICIENT, 'Triple match tower stamina item is insufficient');
      const consumed = consume(model, [[staminaItem, 1]], codec, nowMs);
      changes = consumed.changes;
      stamina = Math.min(maxStamina, stamina + recoverNum);
      lastUpdate = Math.floor(nowMs / 1000);
    }
    state.stamina = stamina;
    state.staminaLastUpdate = stamina >= maxStamina ? Math.floor(nowMs / 1000) : lastUpdate;
    writeState(db, state, nowMs);
    log({ event: 'trimatch_tower_recover_stamina', actId, stamina, usedItem: changes.length > 0 });
    return {
      value: { actId, stamina, usedItem: changes.length > 0, changes: changes.length },
      data: codec.pack('pb_tri_match_tower_recover_stamina_rsp', {
        data: { act_data: actData(state, nowMs), res: resPacket(changes) }
      })
    };
  }

  // 119003: first clear line-ups. The rows are written by the fight settlement
  // hook, never by a client claim.
  function passLineup(model, db, input) {
    const nowMs = now();
    const actId = actIdOf(input?.act_id);
    const rows = db.prepare('SELECT * FROM trimatch_tower_clear WHERE role_id=? AND act_id=? ORDER BY tower').all(model.state.roleId, actId);
    const passList = rows.map((row) => {
      let heroes = [];
      try { heroes = JSON.parse(row.hero_list_json); } catch { heroes = []; }
      return {
        tower: Number(row.tower),
        role_id: model.state.roleId,
        hero_list: (Array.isArray(heroes) ? heroes : []).map(hero => ({
          base_data: { tid: String(hero.tid ?? 0), star: String(hero.star ?? 0) },
          lv: String(hero.level ?? 1)
        })),
        power: String(row.power ?? 0),
        // The shipped Mission rows carry no minimum power column, so the local
        // deployment cannot report one.
        min_power: '0'
      };
    });
    log({ event: 'trimatch_tower_pass_lineup', actId, rows: passList.length });
    return {
      value: { actId, rows: passList.length },
      data: codec.pack('pb_tri_match_tower_act_get_pass_rsp', { pass_list: passList })
    };
  }

  // Settlement hook for the fight pipeline: a won tower fight advances the
  // cleared level and records the line-up 119003 serves; a lost fight costs
  // Version.del_stamina, matching TriMatchTowerUtil.GetFailDelStamina.
  function settleFight(model, db, { fightUid, fightTid, fightType, result, powers, fighters }) {
    const nowMs = now();
    const mission = missionByFight.get(Number(fightTid)) ?? towerMissionByFightTid(tables, fightTid);
    if (!mission) return null;
    const actId = resolveActId();
    if (!actId) {
      log({ event: 'trimatch_tower_settlement_skipped', reason: 'tower_activity_missing', fightTid: Number(fightTid) });
      return null;
    }
    const state = readState(db, model.state.roleId, actId, nowMs);
    const normalized = normalizeStamina(state, nowMs);
    const won = Number(result) === 1;
    if (!won) {
      state.stamina = Math.max(0, normalized.stamina - delStamina);
      state.staminaLastUpdate = normalized.lastUpdate;
      state.lastSettlementFightId = Number(fightUid);
      writeState(db, state, nowMs);
      log({ event: 'trimatch_tower_fight_failed', actId, fightTid: Number(fightTid), stamina: state.stamina });
      return { actId, won: false, stamina: state.stamina };
    }
    const target = Number(mission.index ?? 0);
    if (!Number.isSafeInteger(target) || target <= 0 || target > maxTowerLevel) {
      log({ event: 'trimatch_tower_settlement_skipped', reason: 'mission_row_invalid', fightTid: Number(fightTid) });
      return null;
    }
    if (target > state.tower + 1) {
      log({ event: 'trimatch_tower_settlement_skipped', reason: 'mission_not_next', fightTid: Number(fightTid), target, tower: state.tower });
      return null;
    }
    state.stamina = normalized.stamina;
    state.staminaLastUpdate = normalized.lastUpdate;
    state.lastSettlementFightId = Number(fightUid);
    if (target === state.tower + 1) state.tower = target;
    writeState(db, state, nowMs);
    db.prepare(`INSERT INTO trimatch_tower_clear (role_id, act_id, tower, fight_uid, hero_list_json, power, created_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(role_id, act_id, tower) DO UPDATE SET
        fight_uid=excluded.fight_uid, hero_list_json=excluded.hero_list_json,
        power=excluded.power, created_at=excluded.created_at`)
      .run(
        model.state.roleId, actId, target, Number(fightUid),
        JSON.stringify(Array.isArray(fighters) ? fighters : []),
        Number(powers ?? 0), isoSeconds(nowMs)
      );
    log({ event: 'trimatch_tower_cleared', actId, tower: target, fightTid: Number(fightTid), fightType: Number(fightType ?? 0) });
    return { actId, won: true, tower: target };
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    const command = Number(type);
    if (!SUPPORTED.includes(command)) fail(CODE_INVALID, 'Unsupported triple match tower command');
    return store.transaction((model, db) => {
      ensureTrimatchTables(db);
      ensureTowerTables(db);
      if (command === COMMAND_PROGRESS_AWARD) return claimProgressAward(model, db, input);
      if (command === COMMAND_RECOVER_STAMINA) return recoverStamina(model, db, input);
      if (command === COMMAND_PASS_LINEUP) return passLineup(model, db, input);
      fail(CODE_INVALID, 'Unsupported triple match tower command');
    });
  }

  function state(roleId) {
    return store.inspect(db => {
      ensureTrimatchTables(db);
      ensureTowerTables(db);
      const actId = resolveActId();
      return db.prepare('SELECT * FROM trimatch_tower_state WHERE role_id=? ORDER BY act_id').all(roleId).map((row) => ({
        act_id: Number(row.act_id),
        tower: Number(row.tower),
        stamina: Number(row.stamina),
        stamina_last_update: Number(row.stamina_last_update),
        last_settlement_fight_id: Number(row.last_settlement_fight_id),
        configured_act_id: actId
      }));
    });
  }

  // Settlement seam used by the fight service hook.
  function settle(model, db, payload) {
    ensureTowerTables(db);
    return settleFight(model, db, payload);
  }

  return {
    supports,
    execute,
    state,
    settle,
    requestSchemas: {
      [COMMAND_PROGRESS_AWARD]: 'pb_tri_match_tower_rec_process_award_req',
      [COMMAND_RECOVER_STAMINA]: 'pb_tri_match_tower_recover_stamina_req',
      [COMMAND_PASS_LINEUP]: 'pb_tri_match_tower_act_get_pass_req'
    }
  };
}

