import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readFameHallTables } from '../config/fame-hall-tables.mjs';

// FameHallCmd.lua: 91101-91104 are EncodePB requests, 91105-91111 are EncodeErl.
const CMD_ENTER = 91101;
const CMD_CHOOSE_DROP = 91102;
const CMD_STAGE_AWARD = 91103;
const CMD_EDIT_ARTIFACT = 91104;
const CMD_RESET = 91105;
const CMD_SKIP_CHOOSE = 91106;
const CMD_TERMINATE = 91107;
const CMD_SWEEP = 91108;
const CMD_DATA = 91109;
const CMD_CLIENT_SHOW = 91110;
const CMD_REISSUE = 91111;
const SUPPORTED = [CMD_ENTER, CMD_CHOOSE_DROP, CMD_STAGE_AWARD, CMD_EDIT_ARTIFACT, CMD_RESET,
  CMD_SKIP_CHOOSE, CMD_TERMINATE, CMD_SWEEP, CMD_DATA, CMD_CLIENT_SHOW, CMD_REISSUE];

const CODE_INVALID = 1;
const CODE_STATE = 5;
const ARTIFACT_MODULE_ID = 50;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, label, minimum = 0) {
  const number = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isSafeInteger(number) || number < minimum) fail(CODE_INVALID, 'Invalid fame hall ' + label);
  return number;
}

function pairs(rows, label = 'Fame hall reward') {
  if (!Array.isArray(rows)) return [];
  return rows.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) fail(CODE_STATE, label + ' configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) fail(CODE_STATE, label + ' configuration is invalid');
    return [tid, count];
  });
}

function emptyState() {
  return {
    heroes: [], artifacts: [], badges: [], stage: 0, maxStage: 0, dropStage: 0,
    curDifficult: 0, resetTimes: 0, lastSweepTime: 0, clientShow: false,
    active: false, pendingDrop: null, teamArtifacts: {}
  };
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fame_hall_state (
      role_id INTEGER NOT NULL PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reward_claims (
      role_id INTEGER NOT NULL,
      claim_type TEXT NOT NULL,
      claim_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(role_id,claim_type,claim_key)
    );
  `);
}

function readState(db, roleId) {
  const row = db.prepare('SELECT state_json FROM fame_hall_state WHERE role_id=?').get(roleId);
  if (!row) return emptyState();
  const parsed = JSON.parse(row.state_json);
  if (!parsed || typeof parsed !== 'object') fail(CODE_STATE, 'Fame hall state is corrupt');
  return { ...emptyState(), ...parsed };
}

function writeState(db, roleId, state, nowMs) {
  db.prepare(`INSERT INTO fame_hall_state(role_id,state_json,updated_at) VALUES(?,?,?)
    ON CONFLICT(role_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at`)
    .run(roleId, JSON.stringify(state), new Date(nowMs).toISOString());
}

export function createFameHallService({
  store, codec, tables = readFameHallTables(), gameTables = null, artifact = null,
  now = Date.now, serverOpenedAt = 0, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  store.inspect(ensureTables);
  const resourceTables = () => gameTables ?? readGameTables();
  const constant = tables.constants.get(1) ?? [...tables.constants.values()][0];
  if (!constant) throw new Error('FameHall Const table is empty');

  function dayIndex(nowMs = now()) {
    const opened = Number(serverOpenedAt) > 0 ? Number(serverOpenedAt) * 1000 : 0;
    return Math.max(1, Math.floor((nowMs - opened) / 86400000) + 1);
  }

  function rolePb(state) {
    return {
      heroes: state.heroes.map(hero => ({
        tid: String(hero.tid), star: String(hero.star ?? 0), quality: String(hero.quality ?? 0),
        fetter_tid: Number(hero.fetter_tid ?? 0), mutant: Number(hero.mutant ?? 0), skin_tid: Number(hero.skin_tid ?? 0)
      })),
      artifacts: state.artifacts.map(row => ({ tid: String(row.tid), star: String(row.star ?? 0), quality: String(row.quality ?? 0) })),
      badge_list: state.badges.map(String),
      stage: String(state.stage), pass_award: Buffer.alloc(0),
      drop: state.pendingDrop ? { type: String(state.pendingDrop.type), item_list: state.pendingDrop.options.map(option => ({ tid: String(option), param_list: [], num: '1' })) } : undefined,
      enemy_role_id: '0', lineup_artifact: [], dev_history: [], drop_stage: String(state.dropStage),
      reset_times: String(state.resetTimes), max_stage: String(state.maxStage), cur_difficult: Number(state.curDifficult),
      last_sweep_time: String(state.lastSweepTime), difficult_settle_award: Buffer.alloc(0),
      client_show: Boolean(state.clientShow), enemy_team_format: 0,
      team_lineup_artifact: Object.entries(state.teamArtifacts).map(([team, artifactId]) => ({ team_index: Number(team), lineup_artifact: [String(artifactId)] })),
      fantasy_equips: [], data_version: 1
    };
  }

  function data() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      const value = rolePb(state);
      return { value, data: codec.pack('pb_fame_hall_role', value) };
    });
  }

  function clientShowTag() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      state.clientShow = true;
      writeState(db, model.state.roleId, state, now());
      log({ event: 'fame_hall_client_show_tagged' });
      return { value: { clientShow: true }, data: null, noReply: true };
    });
  }

  function enterDifficult(input) {
    const difficult = integer(input?.difficult, 'difficulty', 1);
    const config = tables.difficulties.get(difficult);
    if (!config) fail(CODE_STATE, 'Fame hall difficulty is not configured');
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      state.curDifficult = difficult;
      state.active = true;
      state.stage = 1;
      state.dropStage = 0;
      // Difficulty.fight names the fight-bootstrap table (9200001...), which is
      // not the same id space as FameHallTable.Fight stage rows (101...). The
      // drop option rows therefore remain empty until their source is proven;
      // choose_drop fails closed instead of inventing options.
      const dropType = tables.dropTypes.get(1) ?? [...tables.dropTypes.values()][0];
      if (!dropType) fail(CODE_STATE, 'Fame hall drop configuration is missing');
      state.pendingDrop = { type: Number(dropType.tid), options: [], source: 'configuration-pending' };
      writeState(db, model.state.roleId, state, now());
      const role = rolePb(state);
      const value = { fame_hall_data: role, pass_settle_res: { changes: [], is_overflow: false } };
      log({ event: 'fame_hall_difficulty_entered', difficult });
      return { value: { difficult }, data: codec.pack('pb_fame_hall_enter_difficult_rsp', value) };
    });
  }

  function chooseDrop(input) {
    const dropTid = integer(input?.drop_tid, 'drop id', 0);
    const giveUp = Boolean(input?.is_give_up);
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      if (!state.active || !state.pendingDrop) fail(CODE_STATE, 'Fame hall has no pending drop');
      const options = state.pendingDrop.options ?? [];
      if (!giveUp) {
        if (!options.length) fail(CODE_STATE, 'Fame hall drop options are not available');
        if (!options.includes(dropTid)) fail(CODE_STATE, 'Fame hall drop option is not offered');
      }
      state.dropStage += 1;
      state.pendingDrop = null;
      writeState(db, model.state.roleId, state, now());
      const role = rolePb(state);
      const value = {
        heroes: role.heroes, artifacts: role.artifacts, badge_list: role.badge_list,
        res: { changes: [], is_overflow: false }, drop: undefined, drop_stage: String(state.dropStage), fantasy_equips: []
      };
      log({ event: 'fame_hall_drop_chosen', dropTid, giveUp });
      return { value: { dropTid, giveUp }, data: codec.pack('pb_fame_hall_choose_drop_rsp', value) };
    });
  }

  function skipChoose() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      if (!state.pendingDrop) fail(CODE_STATE, 'Fame hall has no pending drop');
      state.pendingDrop = null;
      writeState(db, model.state.roleId, state, now());
      const value = rolePb(state);
      log({ event: 'fame_hall_drop_skipped' });
      return { value: { skipped: true }, data: codec.pack('pb_fame_hall_role', value) };
    });
  }

  function terminate() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      state.active = false;
      state.pendingDrop = null;
      writeState(db, model.state.roleId, state, now());
      const value = rolePb(state);
      log({ event: 'fame_hall_terminated' });
      return { value: { terminated: true }, data: codec.pack('pb_fame_hall_role', value) };
    });
  }

  function stageAward(input, reissue = false) {
    const tids = Array.isArray(input?.tid_list) ? input.tid_list.map(Number) : [];
    if (!tids.length) {
      // 91111 is ETF and has no tid payload; reissue the latest cleared pass award.
      const latest = [...tables.endPassAwards.values()].filter(row => Number(row.stage) <= Number(input?.stage ?? 0)).pop();
      if (reissue && latest) tids.push(Number(latest.tid));
    }
    if (!tids.length) fail(CODE_INVALID, 'Fame hall award list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId), awards = [];
      for (const tid of tids) {
        const row = tables.endPassAwards.get(tid);
        if (!row) fail(CODE_STATE, 'Fame hall award is not configured');
        if (Number(state.maxStage) < Number(row.stage)) fail(CODE_STATE, 'Fame hall stage was not cleared');
        if (db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='fame_hall_stage' AND claim_key=?")
          .get(model.state.roleId, String(tid))) fail(CODE_STATE, 'Fame hall award was already received');
        awards.push(...pairs(reissue ? row.award ?? row.change_award : row.award, 'Fame hall stage reward'));
      }
      const result = grantResources(model, awards, resourceTables(), { codec });
      for (const tid of tids) {
        db.prepare("INSERT INTO reward_claims(role_id,claim_type,claim_key,created_at) VALUES(?,'fame_hall_stage',?,?)")
          .run(model.state.roleId, String(tid), new Date(now()).toISOString());
      }
      const value = { award_bin: Buffer.alloc(0), res: { changes: result.changes, is_overflow: false } };
      log({ event: reissue ? 'fame_hall_stage_award_reissued' : 'fame_hall_stage_award_committed', tids });
      return { value: { tids }, data: codec.pack('pb_fame_hall_reward_rsp', value) };
    });
  }

  function ownedArtifactIds(model) {
    const modules = new Map(model.state.modules.value);
    const entry = modules.get(ARTIFACT_MODULE_ID);
    if (!entry?.value?.length) return new Set();
    try {
      const info = codec.unpack('pb_artifact_info', rawBinary(entry.value[0]));
      return new Set((info.artifact_list ?? []).map(row => String(row.tid)));
    } catch { return new Set(); }
  }

  function editArtifact(input) {
    const artifactId = integer(input?.artifact_id, 'artifact id', 1);
    const teamIndex = integer(input?.team_index, 'team index', 0);
    return store.transaction((model, db) => {
      ensureTables(db);
      // Module 50 pb_artifact_info is the authoritative artifact inventory.
      if (!ownedArtifactIds(model).has(String(artifactId))) fail(CODE_STATE, 'Fame hall artifact is not owned');
      const state = readState(db, model.state.roleId);
      state.teamArtifacts[String(teamIndex)] = artifactId;
      writeState(db, model.state.roleId, state, now());
      const value = { team_index: teamIndex, lineup_artifact: [String(artifactId)] };
      log({ event: 'fame_hall_artifact_edited', artifactId, teamIndex });
      return { value, data: codec.pack('pb_fame_hall_line_artifact', value) };
    });
  }

  function reset() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      const limit = Number(constant.day_reset_times ?? 0);
      if (limit > 0 && Number(state.resetTimes) >= limit) fail(CODE_STATE, 'Fame hall reset limit reached');
      state.resetTimes += 1;
      state.stage = 0;
      state.active = false;
      state.pendingDrop = null;
      writeState(db, model.state.roleId, state, now());
      const role = rolePb(state), value = { res: { changes: [], is_overflow: false }, fame_hall: role };
      log({ event: 'fame_hall_reset', resetTimes: state.resetTimes });
      return { value: { resetTimes: state.resetTimes }, data: codec.pack('pb_fame_hall_reset_rsp', value) };
    });
  }

  function sweep() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId), day = dayIndex();
      if (!state.curDifficult) fail(CODE_STATE, 'Fame hall difficulty is not selected');
      if (Number(state.maxStage) <= 0) fail(CODE_STATE, 'Fame hall has no cleared stage');
      const claimKey = `${day}:${state.curDifficult}`;
      if (db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='fame_hall_sweep' AND claim_key=?")
        .get(model.state.roleId, claimKey)) fail(CODE_STATE, 'Fame hall sweep was already used today');
      const config = tables.difficulties.get(Number(state.curDifficult));
      const awards = pairs(config?.sweep_award, 'Fame hall sweep reward');
      if (!awards.length) fail(CODE_STATE, 'Fame hall sweep reward configuration is missing');
      const result = grantResources(model, awards, resourceTables(), { codec });
      db.prepare("INSERT INTO reward_claims(role_id,claim_type,claim_key,created_at) VALUES(?,'fame_hall_sweep',?,?)")
        .run(model.state.roleId, claimKey, new Date(now()).toISOString());
      state.lastSweepTime = Math.floor(now() / 1000);
      writeState(db, model.state.roleId, state, now());
      const value = { res: { changes: result.changes, is_overflow: false }, last_sweep_time: String(state.lastSweepTime) };
      log({ event: 'fame_hall_sweep_committed', day, awards });
      return { value: { lastSweepTime: state.lastSweepTime }, data: codec.pack('pb_fame_hall_sweep_rsp', value) };
    });
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    switch (Number(type)) {
      case CMD_DATA: return data();
      case CMD_CLIENT_SHOW: return clientShowTag();
      case CMD_ENTER: return enterDifficult(input);
      case CMD_CHOOSE_DROP: return chooseDrop(input);
      case CMD_SKIP_CHOOSE: return skipChoose();
      case CMD_TERMINATE: return terminate();
      case CMD_STAGE_AWARD: return stageAward(input, false);
      case CMD_REISSUE: return stageAward(input, true);
      case CMD_EDIT_ARTIFACT: return editArtifact(input);
      case CMD_RESET: return reset();
      case CMD_SWEEP: return sweep();
      default: fail(CODE_INVALID, 'Unsupported fame hall command');
    }
  }

  return { supports, execute, tables };
}
