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
  db.exec(`CREATE TABLE IF NOT EXISTS activity_personal_state (
    server_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    period_no INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    counters_json TEXT NOT NULL DEFAULT '{}',
    cumulative_json TEXT NOT NULL DEFAULT '{}',
    claims_json TEXT NOT NULL DEFAULT '{}',
    currency_json TEXT NOT NULL DEFAULT '{}',
    archived_at INTEGER,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (server_id, act_id, period_no, role_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS activity_rank_snapshot (
    server_id INTEGER NOT NULL,
    act_id INTEGER NOT NULL,
    period_no INTEGER NOT NULL,
    board_key TEXT NOT NULL,
    rank_no INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    score TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    frozen_at INTEGER NOT NULL,
    PRIMARY KEY (server_id, act_id, period_no, board_key, rank_no)
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

function jsonObject(value, field) {
  if (value == null) return {};
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { throw new GameError(5, `${field} is invalid JSON`); }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GameError(1, `${field} must be an object`);
  return structuredClone(value);
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

  // Login refreshes the reproducible window but never owns lifecycle state.
  // In particular, an extend or a login racing the scheduler must not roll a
  // closed/claim stage back to running or erase the settled marker.
  function observeInstance(instance) {
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
      stage: String(instance.stage ?? 'closed')
    };
    store.inspect(db => db.prepare(`INSERT INTO activity_instance
      (server_id,act_id,period_no,family,parent_act_id,preview_at,open_at,close_at,claim_until,show_until,stage,settled_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?)
      ON CONFLICT(server_id,act_id,period_no) DO UPDATE SET
        family=excluded.family,parent_act_id=excluded.parent_act_id,preview_at=excluded.preview_at,
        open_at=excluded.open_at,close_at=excluded.close_at,claim_until=excluded.claim_until,
        show_until=excluded.show_until,updated_at=excluded.updated_at`)
      .run(row.serverId, row.actId, row.periodNo, row.family, row.parentActId, row.previewAt, row.openAt,
        row.closeAt, row.claimUntil, row.showUntil, row.stage, stamp()));
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
    const row = store.inspect(db => db.prepare(`SELECT * FROM activity_override
      WHERE server_id=? AND act_id=? AND revoked_at IS NULL AND at<=?
      ORDER BY id DESC LIMIT 1`).get(serverId, actId, atSeconds));
    return row ? { ...row, startAt: row.start_at, endAt: row.end_at } : null;
  }

  function revokeOverride(id, operator = '', reason = '') {
    const before = store.inspect(db => db.prepare('SELECT * FROM activity_override WHERE id=?').get(id));
    if (!before) throw new GameError(1, 'Activity override was not found');
    store.inspect(db => db.prepare('UPDATE activity_override SET revoked_at=? WHERE id=?').run(at(), id));
    audit(operator, 'activity.override.revoke', String(id), before, { revokedAt: at() }, reason);
  }

  function personalState(serverId, actId, periodNo, roleId, db = null) {
    const read = database => database.prepare(`SELECT * FROM activity_personal_state
      WHERE server_id=? AND act_id=? AND period_no=? AND role_id=?`).get(serverId, actId, periodNo, roleId);
    const row = store.inspect(database => read(db ?? database));
    if (!row) return null;
    return {
      server_id: Number(row.server_id), act_id: Number(row.act_id), period_no: Number(row.period_no),
      role_id: Number(row.role_id), counters: jsonObject(row.counters_json, 'activity counters'),
      cumulative: jsonObject(row.cumulative_json, 'activity cumulative state'),
      claims: jsonObject(row.claims_json, 'activity claims'),
      currency: jsonObject(row.currency_json, 'activity currency'),
      archived_at: row.archived_at == null ? null : Number(row.archived_at), updated_at: row.updated_at
    };
  }

  // New periods start with empty counters/claims/currency. A family must name
  // every cumulative key that survives a period rollover; the default is no
  // carry-over. This makes T13 explicit instead of relying on old rows.
  function ensurePersonalState({ serverId, actId, periodNo, roleId, carryCumulativeKeys = [] }, db = null) {
    const row = {
      serverId: integer(serverId, 'serverId', { min: 1 }), actId: integer(actId, 'actId', { min: 1 }),
      periodNo: integer(periodNo, 'periodNo', { min: 1 }), roleId: integer(roleId, 'roleId', { min: 1 })
    };
    const carry = [...new Set((Array.isArray(carryCumulativeKeys) ? carryCumulativeKeys : [])
      .map(key => String(key)).filter(Boolean))].sort();
    store.inspect(database => {
      const current = database.prepare(`SELECT 1 FROM activity_personal_state
        WHERE server_id=? AND act_id=? AND period_no=? AND role_id=?`).get(row.serverId, row.actId, row.periodNo, row.roleId);
      if (current) return;
      const previous = database.prepare(`SELECT cumulative_json FROM activity_personal_state
        WHERE server_id=? AND act_id=? AND role_id=? AND period_no<?
        ORDER BY period_no DESC LIMIT 1`).get(row.serverId, row.actId, row.roleId, row.periodNo);
      const previousCumulative = jsonObject(previous?.cumulative_json, 'previous activity cumulative state');
      const cumulative = Object.fromEntries(carry.filter(key => Object.hasOwn(previousCumulative, key))
        .map(key => [key, previousCumulative[key]]));
      database.prepare(`INSERT OR IGNORE INTO activity_personal_state
        (server_id,act_id,period_no,role_id,counters_json,cumulative_json,claims_json,currency_json,archived_at,updated_at)
        VALUES (?,?,?,?,'{}',?,'{}','{}',NULL,?)`)
        .run(row.serverId, row.actId, row.periodNo, row.roleId, JSON.stringify(cumulative), stamp());
    });
    return personalState(row.serverId, row.actId, row.periodNo, row.roleId, db);
  }

  function savePersonalState({ serverId, actId, periodNo, roleId, counters = {}, cumulative = {}, claims = {}, currency = {}, archivedAt = null }, db = null) {
    const ids = {
      serverId: integer(serverId, 'serverId', { min: 1 }), actId: integer(actId, 'actId', { min: 1 }),
      periodNo: integer(periodNo, 'periodNo', { min: 1 }), roleId: integer(roleId, 'roleId', { min: 1 })
    };
    const normalized = {
      counters: jsonObject(counters, 'activity counters'), cumulative: jsonObject(cumulative, 'activity cumulative state'),
      claims: jsonObject(claims, 'activity claims'), currency: jsonObject(currency, 'activity currency'),
      archivedAt: optionalInteger(archivedAt, 'archivedAt')
    };
    store.inspect(database => (db ?? database).prepare(`INSERT INTO activity_personal_state
      (server_id,act_id,period_no,role_id,counters_json,cumulative_json,claims_json,currency_json,archived_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(server_id,act_id,period_no,role_id) DO UPDATE SET
        counters_json=excluded.counters_json,cumulative_json=excluded.cumulative_json,
        claims_json=excluded.claims_json,currency_json=excluded.currency_json,
        archived_at=excluded.archived_at,updated_at=excluded.updated_at`)
      .run(ids.serverId, ids.actId, ids.periodNo, ids.roleId, JSON.stringify(normalized.counters),
        JSON.stringify(normalized.cumulative), JSON.stringify(normalized.claims), JSON.stringify(normalized.currency),
        normalized.archivedAt, stamp()));
    return { ...ids, ...normalized };
  }

  function archivePersonalState({ serverId, actId, periodNo, roleId, archivedAt = at() }, db = null) {
    store.inspect(database => (db ?? database).prepare(`UPDATE activity_personal_state SET archived_at=?,updated_at=?
      WHERE server_id=? AND act_id=? AND period_no=? AND role_id=?`)
      .run(archivedAt, stamp(), serverId, actId, periodNo, roleId));
  }

  function clearPersonalCurrency(serverId, actId, periodNo, roleId = null, db = null) {
    store.inspect(database => {
      if (roleId == null) database.prepare(`UPDATE activity_personal_state SET currency_json='{}',updated_at=?
        WHERE server_id=? AND act_id=? AND period_no=?`).run(stamp(), serverId, actId, periodNo);
      else database.prepare(`UPDATE activity_personal_state SET currency_json='{}',updated_at=?
        WHERE server_id=? AND act_id=? AND period_no=? AND role_id=?`).run(stamp(), serverId, actId, periodNo, roleId);
    });
  }

  function replaceRankSnapshot({ serverId, actId, periodNo, boardKey, rows }, db = null) {
    const ids = {
      serverId: integer(serverId, 'serverId', { min: 1 }), actId: integer(actId, 'actId', { min: 1 }),
      periodNo: integer(periodNo, 'periodNo', { min: 1 }), boardKey: String(boardKey ?? '')
    };
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(ids.boardKey)) throw new GameError(1, 'Activity rank board key is invalid');
    if (!Array.isArray(rows)) throw new GameError(1, 'Activity rank rows are invalid');
    const seen = new Set();
    const normalized = rows.map((row, index) => {
      const rank = integer(row?.rankNo ?? index + 1, 'rankNo', { min: 1 });
      if (seen.has(rank)) throw new GameError(1, 'Activity rank numbers must be unique');
      seen.add(rank);
      return {
        rank, roleId: integer(row?.roleId, 'roleId', { min: 1 }),
        score: String(row?.score ?? 0), payload: jsonObject(row?.payload, 'activity rank payload')
      };
    }).sort((left, right) => left.rank - right.rank);
    store.inspect(database => {
      const target = db ?? database;
      target.prepare('DELETE FROM activity_rank_snapshot WHERE server_id=? AND act_id=? AND period_no=? AND board_key=?')
        .run(ids.serverId, ids.actId, ids.periodNo, ids.boardKey);
      const insert = target.prepare(`INSERT INTO activity_rank_snapshot
        (server_id,act_id,period_no,board_key,rank_no,role_id,score,payload_json,frozen_at)
        VALUES (?,?,?,?,?,?,?,?,?)`);
      for (const row of normalized) insert.run(ids.serverId, ids.actId, ids.periodNo, ids.boardKey, row.rank,
        row.roleId, row.score, JSON.stringify(row.payload), at());
    });
    return normalized;
  }

  function listRankSnapshot(serverId, actId, periodNo, boardKey) {
    return store.inspect(db => db.prepare(`SELECT rank_no,role_id,score,payload_json,frozen_at
      FROM activity_rank_snapshot WHERE server_id=? AND act_id=? AND period_no=? AND board_key=?
      ORDER BY rank_no`).all(serverId, actId, periodNo, boardKey)).map(row => ({
      rank_no: Number(row.rank_no), role_id: Number(row.role_id), score: row.score,
      payload: jsonObject(row.payload_json, 'activity rank snapshot'), frozen_at: Number(row.frozen_at)
    }));
  }

  function settlementDone(serverId, actId, periodNo, roleId, step) {
    return !!store.inspect(db => db.prepare('SELECT 1 FROM activity_settlement WHERE server_id=? AND act_id=? AND period_no=? AND role_id=? AND step=?')
      .get(serverId, actId, periodNo, roleId, step));
  }

  function markSettlement(serverId, actId, periodNo, roleId, step, db = null) {
    const result = store.inspect(database => (db ?? database).prepare(`INSERT OR IGNORE INTO activity_settlement
      (server_id,act_id,period_no,role_id,step,done_at) VALUES (?,?,?,?,?,?)`)
      .run(serverId, actId, periodNo, roleId, step, at()));
    return Number(result.changes) === 1;
  }

  function audit(operator, action, target, before, after, reason = '') {
    store.inspect(db => db.prepare('INSERT INTO ops_audit (operator,action,target,before_json,after_json,reason,at) VALUES (?,?,?,?,?,?,?)')
      .run(String(operator ?? ''), String(action ?? ''), String(target ?? ''), JSON.stringify(before ?? {}), JSON.stringify(after ?? {}), String(reason ?? ''), stamp()));
  }

  return {
    upsertInstance, observeInstance, instance, listInstances, listOverrides, listSettlements, setStage,
    recordOverride, activeOverride, revokeOverride, personalState, ensurePersonalState, savePersonalState,
    archivePersonalState, clearPersonalCurrency, replaceRankSnapshot, listRankSnapshot,
    settlementDone, markSettlement, audit
  };
}

