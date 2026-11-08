import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readPitLordTables } from '../config/pit-lord-tables.mjs';

// PitLordCmd.lua routes all four commands through EncodeErl, so every request
// is an empty ETF argument list. Ranking state reuses the BATTLE-RANK SQLite
// table (rank_entries) as the authoritative board; this service owns only the
// PitLord period/settlement bookkeeping around it.
const COMMAND_RANK_AWARD = 92801;
const COMMAND_HISTORY_RANK = 92802;
const COMMAND_REISSUE_AWARD = 92803;
const COMMAND_FREE_AWARD = 92804;
const SUPPORTED = [COMMAND_RANK_AWARD, COMMAND_HISTORY_RANK, COMMAND_REISSUE_AWARD, COMMAND_FREE_AWARD];

// Internal rank namespace for pit-lord damage. RankTable does not publish a
// PitLord id in the captured rows, so this value is deliberately outside the
// client RankTable space and is used only inside rank_entries.
const PIT_LORD_RANK_ID = 990001;
const CODE_INVALID = 1;
const CODE_STATE = 5;

function fail(code, message) { throw new GameError(code, message); }

function pairs(rows, label = 'PitLord reward') {
  if (!Array.isArray(rows)) return [];
  return rows.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) fail(CODE_STATE, label + ' configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      fail(CODE_STATE, label + ' configuration is invalid');
    }
    return [tid, count];
  });
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rank_entries (
      rank_id INTEGER NOT NULL,
      scope_key TEXT NOT NULL,
      period_key TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      server_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      extra BLOB NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(rank_id,scope_key,period_key,participant_id)
    );
    CREATE TABLE IF NOT EXISTS pit_lord_state (
      role_id INTEGER NOT NULL PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pit_lord_history (
      day_index INTEGER NOT NULL PRIMARY KEY,
      entries_json TEXT NOT NULL,
      created_at TEXT NOT NULL
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
  const row = db.prepare('SELECT state_json FROM pit_lord_state WHERE role_id=?').get(roleId);
  if (!row) return { settles: {}, freeAwardDay: 0 };
  const parsed = JSON.parse(row.state_json);
  if (!parsed || typeof parsed !== 'object' || !parsed.settles || typeof parsed.settles !== 'object') {
    fail(CODE_STATE, 'PitLord state is corrupt');
  }
  return parsed;
}

function writeState(db, roleId, state, nowMs) {
  db.prepare(`INSERT INTO pit_lord_state(role_id,state_json,updated_at) VALUES(?,?,?)
    ON CONFLICT(role_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at`)
    .run(roleId, JSON.stringify(state), new Date(nowMs).toISOString());
}

function iso(nowMs) { return new Date(nowMs).toISOString(); }

export function createPitLordService({
  store, codec, tables = readPitLordTables(), gameTables = null, now = Date.now,
  serverOpenedAt = 0, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  store.inspect(ensureTables);
  const resourceTables = () => gameTables ?? readGameTables();
  const constant = tables.constants.get(1) ?? [...tables.constants.values()][0];
  if (!constant) throw new Error('PitLord Const table is empty');

  function dayIndex(nowMs = now()) {
    const opened = Number(serverOpenedAt) > 0 ? Number(serverOpenedAt) * 1000 : 0;
    return Math.max(1, Math.floor((nowMs - opened) / 86400000) + 1);
  }

  function rankGroup(day) {
    const groups = [...tables.rankGroups.values()].sort((a, b) => Number(a.open_server_day) - Number(b.open_server_day));
    let selected = groups[0];
    for (const group of groups) if (day >= Number(group.open_server_day)) selected = group;
    if (!selected) fail(CODE_STATE, 'PitLord rank group configuration is missing');
    return Number(selected.tid);
  }

  function recordDamage(roleId, damage, options = {}) {
    const amount = Number(damage);
    if (!Number.isSafeInteger(amount) || amount <= 0) fail(CODE_INVALID, 'Invalid PitLord damage');
    return store.transaction((model, db) => {
      ensureTables(db);
      const day = Number(options.dayIndex ?? dayIndex());
      const scope = `pit-lord:${day}`, period = `day:${day}`;
      const existing = db.prepare(`SELECT value FROM rank_entries
        WHERE rank_id=? AND scope_key=? AND period_key=? AND participant_id=?`)
        .get(PIT_LORD_RANK_ID, scope, period, String(model.state.roleId));
      const total = BigInt(existing?.value ?? '0') + BigInt(amount);
      db.prepare(`INSERT INTO rank_entries
        (rank_id,scope_key,period_key,participant_id,server_id,value,extra,updated_at)
        VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(rank_id,scope_key,period_key,participant_id) DO UPDATE SET
          value=excluded.value,updated_at=excluded.updated_at`)
        .run(PIT_LORD_RANK_ID, scope, period, String(model.state.roleId), Number(model.state.serverId ?? 1), total.toString(), Buffer.alloc(0), Math.floor(now() / 1000));
      log({ event: 'pit_lord_damage_recorded', day, damage: amount });
      return { dayIndex: day, value: total.toString() };
    });
  }

  function snapshot(day) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const rows = db.prepare(`SELECT participant_id,server_id,value FROM rank_entries
        WHERE rank_id=? AND scope_key=? ORDER BY CAST(value AS INTEGER) DESC, participant_id ASC`)
        .all(PIT_LORD_RANK_ID, `pit-lord:${day}`);
      db.prepare(`INSERT INTO pit_lord_history(day_index,entries_json,created_at) VALUES(?,?,?)
        ON CONFLICT(day_index) DO UPDATE SET entries_json=excluded.entries_json,created_at=excluded.created_at`)
        .run(day, JSON.stringify(rows.map(row => ({ roleId: String(row.participant_id), serverId: Number(row.server_id), value: String(row.value) }))), iso(now()));
      return rows.length;
    });
  }

  function historyRows(day) {
    const row = store.inspect(db => {
      ensureTables(db);
      return db.prepare('SELECT entries_json FROM pit_lord_history WHERE day_index=?').get(day);
    });
    return row ? JSON.parse(row.entries_json) : null;
  }

  function rankListValue(day) {
    const rows = historyRows(day) ?? [];
    return rows.map(row => codec.pack('pb_rank_obj', { id: String(row.roleId), value: String(row.value), extra: Buffer.alloc(0) }));
  }

  function historyRankList() {
    return store.inspect(db => {
      ensureTables(db);
      const days = db.prepare('SELECT day_index FROM pit_lord_history ORDER BY day_index ASC').all().map(row => Number(row.day_index));
      const history = days.map(day => ({ day_index: String(day), rank_list: rankListValue(day) }));
      const settle = db.prepare("SELECT claim_key FROM reward_claims WHERE claim_type='pit_lord_rank_award' ORDER BY claim_key DESC LIMIT 1").get();
      const settleDay = settle ? Number(String(settle.claim_key).split(':')[0]) : 0;
      const value = { history_rank_list: history, settle_day_index: String(settleDay), clear_double_cache: false, clear_quadruple_cache: false, clear_single_cache: false };
      return { value, data: codec.pack('pb_pit_lord_history_rank_list', value) };
    });
  }

  function rankAwardRow(group, rank) {
    for (const row of tables.ranks.values()) {
      if (Number(row.rank_group) !== Number(group)) continue;
      const rangeValue = row.rank_range;
      const range = Array.isArray(rangeValue) ? rangeValue.map(Number)
        : Number.isSafeInteger(Number(rangeValue)) ? [Number(rangeValue), Number(rangeValue)] : [];
      if (range.length >= 2 && rank >= range[0] && rank <= range[1]) return row;
    }
    return null;
  }

  function latestSettledDay(day) {
    const target = Number(day ?? dayIndex() - 1);
    return Math.max(1, target);
  }

  function snapshotIn(db, day) {
    const rows = db.prepare(`SELECT participant_id,server_id,value FROM rank_entries
      WHERE rank_id=? AND scope_key=? ORDER BY CAST(value AS INTEGER) DESC, participant_id ASC`)
      .all(PIT_LORD_RANK_ID, `pit-lord:${day}`);
    db.prepare(`INSERT INTO pit_lord_history(day_index,entries_json,created_at) VALUES(?,?,?)
      ON CONFLICT(day_index) DO UPDATE SET entries_json=excluded.entries_json,created_at=excluded.created_at`)
      .run(day, JSON.stringify(rows.map(row => ({ roleId: String(row.participant_id), serverId: Number(row.server_id), value: String(row.value) }))), iso(now()));
    return rows.map(row => ({ roleId: String(row.participant_id), serverId: Number(row.server_id), value: String(row.value) }));
  }

  function grantRankAward(db, model, day, reissue = false) {
    const row = db.prepare('SELECT entries_json FROM pit_lord_history WHERE day_index=?').get(day);
    const rows = row ? JSON.parse(row.entries_json) : snapshotIn(db, day);
    if (!rows.length) fail(CODE_STATE, 'PitLord rank data is missing');
    const index = rows.findIndex(row => String(row.roleId) === String(model.state.roleId));
    if (index < 0) fail(CODE_STATE, 'Player has no PitLord rank');
    const rank = index + 1, group = rankGroup(day), config = rankAwardRow(group, rank);
    if (!config) fail(CODE_STATE, 'PitLord rank reward is not configured');
    const claimKey = `${day}:${group}:${rank}`;
    const claimed = db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='pit_lord_rank_award' AND claim_key=?").get(model.state.roleId, claimKey);
    if (claimed) fail(CODE_STATE, reissue ? 'PitLord rank award was already reissued' : 'PitLord rank award was already received');
    const awards = pairs(config.award, 'PitLord rank reward');
    const result = grantResources(model, awards, resourceTables(), { codec });
    db.prepare("INSERT INTO reward_claims(role_id,claim_type,claim_key,created_at) VALUES(?,'pit_lord_rank_award',?,?)")
      .run(model.state.roleId, claimKey, iso(now()));
    const state = readState(db, model.state.roleId);
    state.settles[String(day)] = { rank, group, award: true, reissue };
    state.lastSettleDay = day;
    writeState(db, model.state.roleId, state, now());
    log({ event: reissue ? 'pit_lord_rank_award_reissued' : 'pit_lord_rank_award_committed', day, rank, awards });
    return { day, rank, group, changes: result.changes };
  }

  function statePb(day, db, roleId) {
    const state = readState(db, roleId);
    const settle = state.settles[String(day)];
    const lords = [...tables.levels.values()].slice(0, 4).map(row => ({
      level_id: Number(row.tid), level_max_award: 0, max_damage: String(0)
    }));
    return {
      lords,
      settle_award: [{ day_index: String(settle ? day : 0), rank: Number(settle?.rank ?? 0), award: Boolean(settle?.award) }],
      cross_settle_award: [],
      last_fight_day_index: String(state.lastFightDay ?? 0),
      free_award: String(state.freeAwardDay === day ? 1 : 0)
    };
  }

  function rankAward(input, reissue = false) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const day = latestSettledDay();
      const result = grantRankAward(db, model, day, reissue);
      const value = { res: { changes: result.changes, is_overflow: false }, lord_sys: statePb(day, db, model.state.roleId) };
      return { value, data: codec.pack('pb_pit_lord_rank_award_rsp', value) };
    });
  }

  function freeAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const day = dayIndex(), state = readState(db, model.state.roleId);
      if (Number(state.freeAwardDay) === day) fail(CODE_STATE, 'PitLord free award was already received');
      const awards = pairs(constant.free_award, 'PitLord free reward');
      if (!awards.length) fail(CODE_STATE, 'PitLord free reward configuration is missing');
      const result = grantResources(model, awards, resourceTables(), { codec });
      state.freeAwardDay = day;
      writeState(db, model.state.roleId, state, now());
      log({ event: 'pit_lord_free_award_committed', day, awards });
      return { value: { changes: result.changes }, data: codec.pack('pb_res_to_client', { changes: result.changes, is_overflow: false }) };
    });
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    switch (Number(type)) {
      case COMMAND_RANK_AWARD: return rankAward(input, false);
      case COMMAND_HISTORY_RANK: return historyRankList();
      case COMMAND_REISSUE_AWARD: return rankAward(input, true);
      case COMMAND_FREE_AWARD: return freeAward();
      default: fail(CODE_INVALID, 'Unsupported PitLord command');
    }
  }

  return {
    supports, execute, recordDamage, snapshot, historyRankList,
    dayIndex, rankGroup, tables
  };
}
