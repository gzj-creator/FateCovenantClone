import { GameError } from './hero-progression.mjs';

export function ensureActivitySchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS activity_instance (
    server_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    period_no INTEGER NOT NULL,
    family TEXT NOT NULL DEFAULT '',
    parent_act_id INTEGER,
    preview_at INTEGER,
    open_at INTEGER,
    close_at INTEGER,
    claim_until INTEGER,
    show_until INTEGER,
    stage TEXT NOT NULL DEFAULT 'closed',
    settled_at INTEGER,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (server_id, act_id, period_no)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS activity_override (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    start_at INTEGER,
    end_at INTEGER,
    conditions_json TEXT NOT NULL DEFAULT '[]',
    reason TEXT NOT NULL DEFAULT '',
    operator TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL,
    revoked_at INTEGER
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS activity_settlement (
    server_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    period_no INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    step TEXT NOT NULL,
    done_at INTEGER NOT NULL,
    PRIMARY KEY (server_id, act_id, period_no, role_id, step)
  )`);
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

function integer(value, field, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new GameError(1, `${field} is invalid`);
  return number;
}

function optionalInteger(value, field) {
  if (value == null || value === '') return null;
  return integer(value, field);
}

export function createActivityStore({ store, now = Date.now }) {
  if (!store?.inspect) throw new TypeError('store.inspect is required');
  store.inspect(ensureActivitySchema);
  const stamp = () => new Date(Number(now())).toISOString();
  const at = () => Math.floor(Number(now()) / 1000);

  function upsertInstance(instance) {
    const row = {
      serverId: integer(instance.serverId, 'serverId', { min: 1 }),
      actId: integer(instance.actId, 'actId', { min: 1 }),
      periodNo: integer(instance.periodNo, 'periodNo', { min: 1 }),
      family: String(instance.family ?? ''),
      parentActId: optionalInteger(instance.parentActId, 'parentActId'),
      previewAt: optionalInteger(instance.previewAt, 'previewAt'),
      openAt: optionalInteger(instance.openAt, 'openAt'),
      closeAt: optionalInteger(instance.closeAt, 'closeAt'),
      claimUntil: optionalInteger(instance.claimUntil, 'claimUntil'),
      showUntil: optionalInteger(instance.showUntil, 'showUntil'),
      stage: String(instance.stage ?? 'closed'),
      settledAt: optionalInteger(instance.settledAt, 'settledAt')
    };
    store.inspect(db => db.prepare(`INSERT INTO activity_instance
      (server_id,act_id,period_no,family,parent_act_id,preview_at,open_at,close_at,claim_until,show_until,stage,settled_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(server_id,act_id,period_no) DO UPDATE SET
        family=excluded.family,parent_act_id=excluded.parent_act_id,preview_at=excluded.preview_at,
        open_at=excluded.open_at,close_at=excluded.close_at,claim_until=excluded.claim_until,
        show_until=excluded.show_until,stage=excluded.stage,settled_at=excluded.settled_at,updated_at=excluded.updated_at`)
      .run(row.serverId, row.actId, row.periodNo, row.family, row.parentActId, row.previewAt, row.openAt,
        row.closeAt, row.claimUntil, row.showUntil, row.stage, row.settledAt, stamp()));
    return row;
  }

  function instance(serverId, actId, periodNo = null) {
    return store.inspect(db => periodNo == null
      ? db.prepare('SELECT * FROM activity_instance WHERE server_id=? AND act_id=? ORDER BY period_no DESC LIMIT 1').get(serverId, actId)
      : db.prepare('SELECT * FROM activity_instance WHERE server_id=? AND act_id=? AND period_no=?').get(serverId, actId, periodNo));
  }

  function listInstances(serverId) {
    return store.inspect(db => db.prepare('SELECT * FROM activity_instance WHERE server_id=? ORDER BY act_id, period_no').all(serverId));
  }

  function listOverrides(serverId) {
    return store.inspect(db => db.prepare('SELECT * FROM activity_override WHERE server_id=? ORDER BY id DESC').all(serverId));
  }

  function listSettlements(serverId) {
    return store.inspect(db => db.prepare('SELECT * FROM activity_settlement WHERE server_id=? ORDER BY done_at DESC, act_id, period_no LIMIT 500').all(serverId));
  }

  function setStage(serverId, actId, periodNo, stage, settledAt = null) {
    const value = String(stage ?? '');
    if (!value) throw new GameError(1, 'Activity stage is invalid');
    store.inspect(db => db.prepare('UPDATE activity_instance SET stage=?, settled_at=?, updated_at=? WHERE server_id=? AND act_id=? AND period_no=?')
      .run(value, settledAt, stamp(), serverId, actId, periodNo));
  }

  function recordOverride({ serverId, actId, kind, startAt = null, endAt = null, conditions = [], reason = '', operator = '' }) {
    const allowed = new Set(['shift', 'extend', 'close_early', 'pause', 'resume', 'force_open', 'condition']);
    if (!allowed.has(kind)) throw new GameError(1, 'Activity override kind is invalid');
    if (kind === 'force_open' && (startAt == null || endAt == null)) throw new GameError(1, 'force_open requires a bounded window');
    const before = activeOverride(serverId, actId);
    const id = store.inspect(db => {
      const result = db.prepare(`INSERT INTO activity_override (server_id,act_id,kind,start_at,end_at,conditions_json,reason,operator,at,revoked_at)
        VALUES (?,?,?,?,?,?,?,?,?,NULL)`)
        .run(serverId, actId, kind, optionalInteger(startAt, 'startAt'), optionalInteger(endAt, 'endAt'),
          JSON.stringify(Array.isArray(conditions) ? conditions : []), String(reason), String(operator), at());
      return Number(result.lastInsertRowid);
    });
    audit(operator, `activity.${kind}`, `${serverId}:${actId}`, before ?? {}, { id, kind, startAt, endAt, conditions }, reason);
    return id;
  }

  function activeOverride(serverId, actId, atSeconds = at()) {
    return store.inspect(db => db.prepare(`SELECT * FROM activity_override
      WHERE server_id=? AND act_id=? AND revoked_at IS NULL AND at<=?
      ORDER BY id DESC LIMIT 1`).get(serverId, actId, atSeconds));
  }

  function revokeOverride(id, operator = '', reason = '') {
    const before = store.inspect(db => db.prepare('SELECT * FROM activity_override WHERE id=?').get(id));
    if (!before) throw new GameError(1, 'Activity override was not found');
    store.inspect(db => db.prepare('UPDATE activity_override SET revoked_at=? WHERE id=?').run(at(), id));
    audit(operator, 'activity.override.revoke', String(id), before, { revokedAt: at() }, reason);
  }

  function settlementDone(serverId, actId, periodNo, roleId, step) {
    return !!store.inspect(db => db.prepare('SELECT 1 FROM activity_settlement WHERE server_id=? AND act_id=? AND period_no=? AND role_id=? AND step=?')
      .get(serverId, actId, periodNo, roleId, step));
  }

  function markSettlement(serverId, actId, periodNo, roleId, step) {
    const result = store.inspect(db => db.prepare(`INSERT OR IGNORE INTO activity_settlement
      (server_id,act_id,period_no,role_id,step,done_at) VALUES (?,?,?,?,?,?)`)
      .run(serverId, actId, periodNo, roleId, step, at()));
    return Number(result.changes) === 1;
  }

  function audit(operator, action, target, before, after, reason = '') {
    store.inspect(db => db.prepare('INSERT INTO ops_audit (operator,action,target,before_json,after_json,reason,at) VALUES (?,?,?,?,?,?,?)')
      .run(String(operator ?? ''), String(action ?? ''), String(target ?? ''), JSON.stringify(before ?? {}), JSON.stringify(after ?? {}), String(reason ?? ''), stamp()));
  }

  return { upsertInstance, instance, listInstances, listOverrides, listSettlements, setStage, recordOverride, activeOverride, revokeOverride, settlementDone, markSettlement, audit };
}

