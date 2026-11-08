import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

// Shared helpers for the endgame development modules (war rune, museum, pets,
// treasure, elves, spirit beads, pet play, energy burst, divine embryo, badge).
// Modules that own a login slot keep their state inside the login container;
// modules whose slot and payload are not recovered yet keep a role-scoped JSON
// row in develop_module_state, the same containment bonus-draw uses.
export const fail = (code, message) => { throw new GameError(code, message); };

export function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, 'Invalid ' + field);
  return number;
}

export function positiveId(value, field = 'id') {
  return integer(value, field, { min: 1 });
}

export function slotOf(modules, moduleId, index = null) {
  const module = modules.get(moduleId);
  if (!module) return undefined;
  return index === null ? module : (Array.isArray(module.value) ? module.value[index] : undefined);
}

export function readModuleData(modules, moduleId, index, schema, fallback, codec) {
  const target = slotOf(modules, moduleId, index);
  if (!target) fail(5, 'Login module ' + moduleId + ' is unavailable');
  const bytes = rawBinary(target);
  return bytes.length ? codec.unpack(schema, bytes) : structuredClone(fallback);
}

export function writeModuleData(modules, moduleId, index, schema, value, codec) {
  const packed = serializedBinary(codec.pack(schema, value));
  if (index === null) {
    modules.set(moduleId, packed);
    return;
  }
  const module = modules.get(moduleId);
  if (!module || !Array.isArray(module.value)) fail(5, 'Login module ' + moduleId + ' is unavailable');
  while (module.value.length <= index) module.value.push(serializedBinary(Buffer.alloc(0)));
  module.value[index] = packed;
}

export function ensureStateTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS develop_module_state (
    role_id TEXT NOT NULL,
    module TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (role_id, module)` + ')');
}

export function readState(db, roleId, module, fallback) {
  const row = db.prepare('SELECT payload FROM develop_module_state WHERE role_id=? AND module=?').get(String(roleId), module);
  if (!row) return structuredClone(fallback);
  try { return JSON.parse(row.payload); } catch { return structuredClone(fallback); }
}

export function writeState(db, roleId, module, value, now = Date.now()) {
  db.prepare('INSERT INTO develop_module_state (role_id, module, payload, updated_at) VALUES (?,?,?,?) '
    + 'ON CONFLICT(role_id, module) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
    .run(String(roleId), module, JSON.stringify(value), new Date(now).toISOString());
}

export function resourceChange(changes) {
  return { changes, is_overflow: false };
}

export function decodeProtobuf(codec, schema, data, fallback = {}) {
  if (!data?.length) return structuredClone(fallback);
  return codec.unpack(schema, data);
}

// Numeric protobuf ids arrive as strings through the codec (longs: String).
export function numeric(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function indexBy(list, key) {
  const map = new Map();
  for (const entry of list ?? []) map.set(String(entry?.[key]), entry);
  return map;
}

export function uniqueTids(list, field) {
  const seen = new Set();
  for (const value of list ?? []) {
    const id = numeric(value?.[field] ?? value);
    if (id <= 0) fail(1, 'Invalid ' + field);
    if (seen.has(id)) fail(1, 'Duplicate ' + field);
    seen.add(id);
  }
  return [...seen];
}
