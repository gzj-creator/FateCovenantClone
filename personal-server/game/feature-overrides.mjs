import { GameError } from './hero-progression.mjs';

export function ensureFeatureOverrideSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS fun_open_override (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    fun_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    operator TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL,
    revoked_at INTEGER
  )`);
  // The activity store owns the shared audit table, but feature overrides are
  // valid before any activity service has been constructed. Keep both entry
  // points able to create the schema with the same definition.
  db.exec(`CREATE TABLE IF NOT EXISTS ops_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    before_json TEXT NOT NULL DEFAULT '{}',
    after_json TEXT NOT NULL DEFAULT '{}',
    reason TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL
  )`);
}

export function createFeatureOverrideStore({ store, now = Date.now }) {
  if (!store?.inspect) throw new TypeError('store.inspect is required');
  store.inspect(ensureFeatureOverrideSchema);
  const at = () => Math.floor(Number(now()) / 1000);
  const stamp = () => new Date(Number(now())).toISOString();

  function set({ serverId, funId, mode, reason = '', operator = '' }) {
    if (!Number.isSafeInteger(Number(serverId)) || Number(serverId) <= 0) throw new GameError(1, 'serverId is invalid');
    if (!Number.isSafeInteger(Number(funId)) || Number(funId) <= 0) throw new GameError(1, 'funId is invalid');
    if (!['force_open', 'force_close'].includes(mode)) throw new GameError(1, 'Feature override mode is invalid');
    const id = store.inspect(db => {
      const result = db.prepare('INSERT INTO fun_open_override (server_id,fun_id,mode,reason,operator,at,revoked_at) VALUES (?,?,?,?,?,?,NULL)')
        .run(Number(serverId), Number(funId), mode, String(reason), String(operator), at());
      return Number(result.lastInsertRowid);
    });
    store.inspect(db => db.prepare('INSERT INTO ops_audit (operator,action,target,before_json,after_json,reason,at) VALUES (?,?,?,?,?,?,?)')
      .run(String(operator), `fun_open.${mode}`, `${serverId}:${funId}`, '{}', JSON.stringify({ id, funId, mode }), String(reason), stamp()));
    return id;
  }

  function activeFor(serverId, atSeconds = at()) {
    return store.inspect(db => db.prepare(`SELECT * FROM fun_open_override
      WHERE server_id=? AND revoked_at IS NULL AND at<=?
      ORDER BY id DESC`).all(serverId, atSeconds));
  }

  function list(serverId, { includeRevoked = true } = {}) {
    const sql = includeRevoked
      ? 'SELECT * FROM fun_open_override WHERE server_id=? ORDER BY id DESC LIMIT 500'
      : 'SELECT * FROM fun_open_override WHERE server_id=? AND revoked_at IS NULL ORDER BY id DESC LIMIT 500';
    return store.inspect(db => db.prepare(sql).all(serverId));
  }

  function revoke(id, operator = '', reason = '') {
    const row = store.inspect(db => db.prepare('SELECT * FROM fun_open_override WHERE id=?').get(id));
    if (!row) throw new GameError(1, 'Feature override was not found');
    store.inspect(db => db.prepare('UPDATE fun_open_override SET revoked_at=? WHERE id=?').run(at(), id));
    store.inspect(db => db.prepare('INSERT INTO ops_audit (operator,action,target,before_json,after_json,reason,at) VALUES (?,?,?,?,?,?,?)')
      .run(String(operator), 'fun_open.revoke', String(id), JSON.stringify(row), '{}', String(reason), stamp()));
  }

  return { set, activeFor, list, revoke };
}

