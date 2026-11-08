import { GameError } from './hero-progression.mjs';
import { readPlayMatchTables } from '../config/arena-tables.mjs';
import { encodeEtf } from '../protocol/game-codec.mjs';

// PlayMatchCmd.lua declares req_play_match_start / req_play_match_cancel and
// sends both with EncodeErl(nil). PlayMatchMgr has no protobuf schema for the
// pair, and its callbacks are empty stubs in this build, so the replies are
// truthful ETF acknowledgements. See
// agent/workflow/gameplay-completion/BATTLE-PLAYMATCH/implementation.md.
const COMMAND_START = 98900;
const COMMAND_CANCEL = 98901;
const SUPPORTED = [COMMAND_START, COMMAND_CANCEL];

const CODE_INVALID = 1;
const CODE_STATE = 5;

function fail(code, message) { throw new GameError(code, message); }

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS play_match_queue (' +
    'role_id INTEGER PRIMARY KEY,' +
    'play_tid INTEGER NOT NULL,' +
    'match_type INTEGER NOT NULL,' +
    'module TEXT NOT NULL,' +
    'state INTEGER NOT NULL,' +
    'started_at INTEGER NOT NULL,' +
    'expires_at INTEGER NOT NULL,' +
    'updated_at TEXT NOT NULL)'
  );
}

export function createPlayMatchService({
  store,
  codec,
  tables = readPlayMatchTables(),
  now = Date.now,
  logger = () => {}
}) {
  const log = (event) => { try { logger(event); } catch {} };
  const plays = Array.from(tables.play.values());

  function playRow(playTid) {
    const row = tables.play.get(Number(playTid));
    if (!row) fail(CODE_STATE, 'Play match configuration is missing for ' + playTid);
    return row;
  }

  // PlayStateLib.state_list names the phase rows of one match; the total keep
  // time is the sum of their PlayStateType.keep_time values.
  function keepSeconds(row) {
    const lib = tables.playStateLib.get(Number(row.state_lib));
    const states = Array.isArray(lib?.state_list) ? lib.state_list.map(Number) : [];
    if (!states.length) fail(CODE_STATE, 'Play match state list is missing');
    let total = 0;
    for (const state of states) {
      const type = tables.playStateType.get(state);
      if (!type) fail(CODE_STATE, 'Play match state configuration is missing');
      total += Number(type.keep_time ?? 0);
    }
    if (total <= 0) fail(CODE_STATE, 'Play match keep time is missing');
    return total;
  }

  function readQueue(db, roleId) {
    const row = db.prepare('SELECT * FROM play_match_queue WHERE role_id=?').get(roleId);
    if (!row) return null;
    return {
      playTid: Number(row.play_tid),
      matchType: Number(row.match_type),
      module: String(row.module),
      state: Number(row.state),
      startedAt: Number(row.started_at),
      expiresAt: Number(row.expires_at)
    };
  }

  function supports(type) { return SUPPORTED.includes(type); }

  // The round itself is driven by play_cake state pushes that the shipped
  // client bundle does not document, so the queue entry records the window the
  // player may stay in instead of fabricating match phases.
  async function start() {
    if (!plays.length) fail(CODE_STATE, 'Play match configuration is empty');
    const row = plays[0];
    const keep = keepSeconds(row);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const existing = readQueue(db, roleId);
      const startedAt = Math.floor(nowMs / 1000);
      const expiresAt = startedAt + keep;
      db.prepare('INSERT INTO play_match_queue (role_id, play_tid, match_type, module, state,' +
        ' started_at, expires_at, updated_at) VALUES (?,?,?,?,?,?,?,?)' +
        ' ON CONFLICT(role_id) DO UPDATE SET play_tid=excluded.play_tid,' +
        ' match_type=excluded.match_type, module=excluded.module, state=excluded.state,' +
        ' started_at=excluded.started_at, expires_at=excluded.expires_at,' +
        ' updated_at=excluded.updated_at')
        .run(roleId, Number(row.tid), Number(row.match_type), String(row.module ?? ''), 1,
          startedAt, expiresAt, isoSeconds(nowMs));
      log({
        event: 'play_match_queued',
        playTid: Number(row.tid),
        module: row.module ?? null,
        keep,
        renewed: Boolean(existing)
      });
      return {
        value: { playTid: Number(row.tid), module: row.module ?? null, keep, expiresAt },
        data: encodeEtf([1, Number(row.tid), keep, expiresAt])
      };
    });
  }

  async function cancel() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const existing = readQueue(db, roleId);
      if (existing) db.prepare('DELETE FROM play_match_queue WHERE role_id=?').run(roleId);
      log({ event: 'play_match_cancelled', playTid: existing ? existing.playTid : null });
      return { value: { cancelled: Boolean(existing) }, data: encodeEtf([existing ? 1 : 0]) };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_START) return start(input);
    if (type === COMMAND_CANCEL) return cancel();
    fail(CODE_INVALID, 'Unsupported play match command');
  }

  return {
    supports, execute, queueOf: () => store.inspect((db) => { ensureTables(db); return readQueue(db, store.state().roleId); }),
    commands: SUPPORTED,
    constants: { plays: plays.length }
  };
}

