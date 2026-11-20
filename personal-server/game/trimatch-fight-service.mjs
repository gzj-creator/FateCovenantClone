import { encodeEtfIntegerTuple } from '../protocol/game-codec.mjs';
import { BATTLE_RESULT } from './battle-engine.mjs';
import { CODE_INVALID, CODE_STATE, fail, isoSeconds, ensureTrimatchTables, int64Id } from './trimatch-core.mjs';

const FIGHT_START = 115001;
const FIGHT_SWAP = 115002;
const FIGHT_RETRY = 115003;
const FIGHT_READY = 115004;
const FIGHT_GIVEUP = 115005;
const FIGHT_RECORD = 115006;
const SUPPORTED = [FIGHT_START, FIGHT_SWAP, FIGHT_RETRY, FIGHT_READY, FIGHT_GIVEUP, FIGHT_RECORD];
const BOARD_COMMANDS = new Set([FIGHT_START, FIGHT_SWAP, FIGHT_RETRY, FIGHT_READY]);

// The fight lifecycle has no configured expiry, so the deployment keeps a stored
// report for a week before 115006 stops replaying it.
const REPORT_RETENTION_SECONDS = 7 * 86400;
export function selectTriMatchActionIds(tables, ids) {
  const boardIds = [tables.fightConst?.board_skill, tables.fightConst?.board_skill_four, tables.fightConst?.board_skill_five];
  const rows = (Array.isArray(ids) ? ids : []).map(id => tables.fightAbilities.get(Number(id)));
  if (rows.some(row => !row || boardIds.includes(row.tid))) fail(CODE_STATE, 'Invalid triple match fighter skill reference');
  const normal = rows.filter(row => row.type === 1);
  const active = rows.filter(row => row.type === 2);
  if (normal.length !== 1 || active.length !== 1) fail(CODE_STATE, 'Triple match fighter action configuration is missing or ambiguous');
  return { abilityId: normal[0].tid, activeAbilityId: active[0].tid };
}

function ensureFightTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    fight_tid INTEGER NOT NULL,
    fight_type INTEGER NOT NULL,
    is_pve INTEGER NOT NULL,
    lineup_type INTEGER NOT NULL,
    board_tid INTEGER NOT NULL,
    board_json TEXT NOT NULL,
    red_team_json TEXT NOT NULL,
    blue_team_json TEXT NOT NULL,
    atk_power TEXT NOT NULL,
    def_power TEXT NOT NULL,
    atk_role_id INTEGER NOT NULL,
    def_role_id INTEGER NOT NULL,
    result INTEGER NOT NULL,
    attempt INTEGER NOT NULL,
    round_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    remaining_ms INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, fight_uid)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight_action (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    action_type INTEGER NOT NULL,
    payload BLOB NOT NULL,
    PRIMARY KEY(role_id, fight_uid, seq)
  )`);
  // client_op_id is the client's monotonic swap id; the primary key makes a
  // retried request idempotent.
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight_op (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    client_op_id INTEGER NOT NULL,
    round_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    x1 INTEGER NOT NULL,
    y1 INTEGER NOT NULL,
    x2 INTEGER NOT NULL,
    y2 INTEGER NOT NULL,
    is_auto INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, fight_uid, client_op_id)
  )`);
}

export function createTriMatchFightService({
  store,
  codec,
  tables,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!tables?.fightRows?.size) throw new Error('Triple match fight configuration is unavailable');

  function persistedFight(db, roleId, fightUid) {
    const row = db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, CAST(fight_tid AS TEXT) AS fight_tid,
      fight_type, is_pve, lineup_type, board_tid, board_json, red_team_json, blue_team_json, atk_power, def_power,
      CAST(atk_role_id AS TEXT) AS atk_role_id, CAST(def_role_id AS TEXT) AS def_role_id, result, attempt,
      CAST(round_id AS TEXT) AS round_id, CAST(phase_id AS TEXT) AS phase_id, remaining_ms, status, created_at, updated_at
      FROM trimatch_fight WHERE role_id=? AND fight_uid=?`).get(roleId, fightUid);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing: ' + fightUid);
    return row;
  }

  function storedActions(db, roleId, fightUid) {
    return db.prepare('SELECT payload FROM trimatch_fight_action WHERE role_id=? AND fight_uid=? ORDER BY seq').all(roleId, fightUid)
      .map(row => Buffer.from(row.payload));
  }

  // 115005 marks an archived attempt as abandoned without replaying it.
  function giveUp(model, db, input) {
    const roleId = model.state.roleId;
    const requested = fightIdArgument(input);
    const row = requested
      ? persistedFight(db, roleId, requested)
      : db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, CAST(fight_tid AS TEXT) AS fight_tid, status
        FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid DESC LIMIT 1`).get(roleId);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing');
    if (row.status === 'given_up') {
      log({ event: 'trimatch_fight_giveup_replayed', fightUid: row.fight_uid });
      return { value: { fightUid: int64Id(row.fight_uid, 'triple match fight uid', { min: 1n }), result: BATTLE_RESULT.LOSS }, data: encodeEtfIntegerTuple([]) };
    }
    db.prepare('UPDATE trimatch_fight SET status=?, result=?, updated_at=? WHERE role_id=? AND fight_uid=?')
      .run('given_up', BATTLE_RESULT.LOSS, isoSeconds(now()), roleId, row.fight_uid);
    log({ event: 'trimatch_fight_given_up', fightUid: row.fight_uid, fightTid: Number(row.fight_tid) });
    return { value: { fightUid: int64Id(row.fight_uid, 'triple match fight uid', { min: 1n }), result: BATTLE_RESULT.LOSS }, data: encodeEtfIntegerTuple([]) };
  }

  // 115006 serves the archived action bytes without resimulating the fight.
  function getRecord(model, db, input) {
    const roleId = model.state.roleId;
    const requested = fightIdArgument(input);
    const row = requested
      ? persistedFight(db, roleId, requested)
      : db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, CAST(fight_tid AS TEXT) AS fight_tid,
        fight_type, created_at, board_json FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid DESC LIMIT 1`).get(roleId);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing');
    const actions = storedActions(db, roleId, row.fight_uid);
    if (!actions.length) fail(CODE_STATE, 'Triple match fight report is missing');
    const created = Math.floor(new Date(row.created_at).getTime() / 1000);
    // A record is served as-is while it is inside the retention window; a stale
    // row fails closed instead of returning a report the activity already closed.
    const ageSeconds = Math.floor(now() / 1000) - created;
    if (Number.isSafeInteger(created) && ageSeconds > REPORT_RETENTION_SECONDS) {
      fail(CODE_STATE, 'Triple match fight report has expired');
    }
    log({ event: 'trimatch_fight_record_read', fightUid: row.fight_uid, actions: actions.length });
    return {
      value: { fightUid: int64Id(row.fight_uid, 'triple match fight uid', { min: 1n }), actions: actions.length },
      data: codec.pack('pb_triple_match_fight_report', {
        fight_id: String(row.fight_uid),
        fight_tid: String(row.fight_tid),
        fight_type: Number(row.fight_type),
        create_time: String(created),
        expire_time: String(created + REPORT_RETENTION_SECONDS),
        action_list: actions,
        map: { tile_list: JSON.parse(row.board_json) }
      })
    };
  }

  // Giveup and get_record arrive as a bare Erlang term carrying the fight
  // id; an empty or absent payload falls back to the newest fight of the role.
  function fightIdArgument(input) {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? (input.value ?? input) : input;
    const candidate = Array.isArray(value) ? value[0] : value;
    if (candidate === undefined || candidate === null || candidate === '') return null;
    return int64Id(candidate, 'Invalid triple match fight id', { min: 1n });
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    const command = Number(type);
    if (!SUPPORTED.includes(command)) fail(CODE_INVALID, 'Unsupported triple match fight command');
    if (BOARD_COMMANDS.has(command)) fail(CODE_STATE, 'Triple match board resolution is not verified');
    return store.transaction((model, db) => {
      ensureTrimatchTables(db);
      ensureFightTables(db);
      if (command === FIGHT_GIVEUP) return giveUp(model, db, input);
      return getRecord(model, db, input);
    });
  }

  // Read only view used by the tower and PVP services and by the delivery note.
  function state(roleId) {
    return store.inspect(db => {
      ensureTrimatchTables(db);
      ensureFightTables(db);
      return db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, CAST(fight_tid AS TEXT) AS fight_tid,
        fight_type, is_pve, result, attempt, status, atk_power, def_power
        FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid`).all(roleId).map(row => ({
        fight_uid: int64Id(row.fight_uid, 'triple match fight uid', { min: 1n }),
        fight_tid: int64Id(row.fight_tid, 'triple match fight tid', { min: 1n }),
        fight_type: Number(row.fight_type),
        is_pve: Number(row.is_pve) === 1,
        result: Number(row.result),
        attempt: Number(row.attempt),
        status: row.status,
        atk_power: row.atk_power,
        def_power: row.def_power
      }));
    });
  }

  return {
    supports,
    execute,
    state,
    requestSchemas: {
      [FIGHT_START]: 'pb_triple_match_fight_request',
      [FIGHT_SWAP]: 'pb_triple_match_fight_swap_tile_req',
      [FIGHT_READY]: 'pb_triple_match_fight_ready_req'
    }
  };
}

