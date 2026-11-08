import { GameError } from './hero-progression.mjs';
import { BATTLE_RESULT } from './battle-engine.mjs';

// Shared persistence for the block A1 dungeon/activity commands. Every
// activity keeps its own JSON row so the login module containers are not
// touched, and all read-modify-write cycles run inside store.transaction.
export const CODE_INVALID = 1;
export const CODE_LIMIT = 3;
export const CODE_STATE = 5;
export const CODE_INSUFFICIENT = 301;

export function fail(code, message) { throw new GameError(code, message); }

export function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

export function optionalInteger(value, min, max, message) {
  if (value === undefined || value === null || value === '') return null;
  return integer(value, min, max, message);
}

export function dayKey(milliseconds) {
  return new Date(milliseconds).toISOString().slice(0, 10);
}

export function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

export function unixSeconds(milliseconds) {
  return Math.floor(milliseconds / 1000);
}

export function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS dungeon_activity_state (
    role_id INTEGER NOT NULL,
    activity TEXT NOT NULL,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, activity)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS dungeon_activity_claims (
    role_id INTEGER NOT NULL,
    activity TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, activity, claim_type, claim_key)
  )`);
}

export function readActivityState(db, roleId, activity, defaults) {
  const row = db.prepare('SELECT state_json FROM dungeon_activity_state WHERE role_id=? AND activity=?').get(roleId, activity);
  if (!row) return { ...defaults };
  let parsed;
  try { parsed = JSON.parse(row.state_json); } catch { parsed = null; }
  if (!parsed || typeof parsed !== 'object') return { ...defaults };
  return { ...defaults, ...parsed };
}

export function writeActivityState(db, roleId, activity, state, nowMs) {
  db.prepare(`INSERT INTO dungeon_activity_state (role_id, activity, state_json, updated_at)
    VALUES (?,?,?,?)
    ON CONFLICT(role_id, activity) DO UPDATE SET
      state_json=excluded.state_json, updated_at=excluded.updated_at`)
    .run(roleId, activity, JSON.stringify(state), isoSeconds(nowMs));
}

export function claimed(db, roleId, activity, type, key) {
  return !!db.prepare('SELECT 1 FROM dungeon_activity_claims WHERE role_id=? AND activity=? AND claim_type=? AND claim_key=?')
    .get(roleId, activity, type, key);
}

export function recordClaim(db, roleId, activity, type, key, createdAt) {
  db.prepare('INSERT INTO dungeon_activity_claims VALUES (?,?,?,?,?)')
    .run(roleId, activity, type, key, createdAt);
}

// The activities in this block only accept a real battle-engine simulation.
// Both the terminal event and the summary result must agree.
export function battleWon(simulation) {
  if (!simulation || !Array.isArray(simulation.events) || !Number.isSafeInteger(Number(simulation.result))) {
    fail(CODE_INVALID, 'Activity challenge requires a battle engine simulation');
  }
  const end = [...simulation.events].reverse().find(event => event && event.kind === 'battle-end');
  if (!end) fail(CODE_INVALID, 'Activity simulation is missing the battle result');
  if (Number(end.result) !== Number(simulation.result)) fail(CODE_INVALID, 'Activity simulation result is inconsistent');
  return Number(simulation.result) === BATTLE_RESULT.WIN;
}

export function resPacket(changes) {
  return { changes: changes ?? [], is_overflow: false };
}

// State snapshots are copied before being handed to the codec so a failed
// encode cannot leave a caller holding a mutated reference.
export function snapshot(value) {
  return JSON.parse(JSON.stringify(value));
}
