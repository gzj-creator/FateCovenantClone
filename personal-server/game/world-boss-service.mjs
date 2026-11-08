import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readWorldBossTables } from '../config/world-boss-tables.mjs';

// WorldBossCmd.lua: enter/leave/receive/history are EncodeErl (ETF) commands;
// receive_achievement is EncodePB(pb_world_boss_achieve_reward_req).
const COMMAND_ENTER_MAP = 91801;
const COMMAND_LEAVE_MAP = 91802;
const COMMAND_RECEIVE = 91803;
const COMMAND_HISTORY_RANK = 91804;
const COMMAND_ACHIEVEMENT = 91805;
const SUPPORTED = [COMMAND_ENTER_MAP, COMMAND_LEAVE_MAP, COMMAND_RECEIVE, COMMAND_HISTORY_RANK, COMMAND_ACHIEVEMENT];

const CODE_INVALID = 1;
const CODE_STATE = 5;

function fail(code, message) { throw new GameError(code, message); }

function pairs(rows, label = 'World boss reward') {
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
    CREATE TABLE IF NOT EXISTS world_boss_state (
      role_id INTEGER NOT NULL PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS world_boss_daily (
      day_index INTEGER NOT NULL,
      boss_tid INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      damage TEXT NOT NULL,
      PRIMARY KEY(day_index,boss_tid,role_id)
    );
    CREATE TABLE IF NOT EXISTS world_boss_kills (
      day_index INTEGER NOT NULL,
      boss_tid INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      damage TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(day_index,boss_tid,role_id)
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

function emptyState() { return { inMap: false, received: {}, maxDamage: '0', achievements: {} }; }

function readState(db, roleId) {
  const row = db.prepare('SELECT state_json FROM world_boss_state WHERE role_id=?').get(roleId);
  if (!row) return emptyState();
  const parsed = JSON.parse(row.state_json);
  if (!parsed || typeof parsed !== 'object') fail(CODE_STATE, 'World boss state is corrupt');
  return { ...emptyState(), ...parsed };
}

function writeState(db, roleId, state, nowMs) {
  db.prepare(`INSERT INTO world_boss_state(role_id,state_json,updated_at) VALUES(?,?,?)
    ON CONFLICT(role_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at`)
    .run(roleId, JSON.stringify(state), new Date(nowMs).toISOString());
}

export function createWorldBossService({
  store, codec, tables = readWorldBossTables(), gameTables = null, now = Date.now,
  serverOpenedAt = 0, bossTid = 0, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  store.inspect(ensureTables);
  const resourceTables = () => gameTables ?? readGameTables();
  const constant = tables.constants.get(1) ?? [...tables.constants.values()][0];
  if (!constant) throw new Error('WorldBoss Const table is empty');

  function dayIndex(nowMs = now()) {
    const opened = Number(serverOpenedAt) > 0 ? Number(serverOpenedAt) * 1000 : 0;
    return Math.max(1, Math.floor((nowMs - opened) / 86400000) + 1);
  }

  function resolveBoss(day) {
    if (Number(bossTid) > 0) {
      const configured = tables.bosses.get(Number(bossTid));
      if (!configured) fail(CODE_STATE, 'World boss deployment configuration names an unknown boss');
      return configured;
    }
    const date = new Date(now());
    const dayOfMonth = date.getUTCDate(), month = date.getUTCMonth() + 1;
    const matches = [...tables.bosses.values()].filter(row => {
      const open = Array.isArray(row.open_date) ? row.open_date.map(Number) : [];
      return open.length >= 2 && ((open[0] === month && open[1] === dayOfMonth) || open[0] === dayOfMonth || open[1] === dayOfMonth);
    });
    if (matches.length !== 1) {
      // The captured table does not expose enough information to derive the
      // active boss outside its open_date windows. A deployment may pin it
      // explicitly through the constructor option; otherwise fail closed.
      fail(CODE_STATE, 'World boss current-boss configuration is missing for this period');
    }
    return matches[0];
  }

  function dailyTotal(db, day, boss) {
    const rows = db.prepare('SELECT role_id,damage FROM world_boss_daily WHERE day_index=? AND boss_tid=?').all(day, Number(boss.tid));
    const order = rows.map(row => ({ roleId: String(row.role_id), damage: BigInt(String(row.damage)) }))
      .sort((a, b) => a.damage === b.damage ? (a.roleId < b.roleId ? -1 : 1) : (a.damage > b.damage ? -1 : 1));
    const total = rows.reduce((sum, row) => sum + BigInt(String(row.damage)), 0n);
    return { order, total };
  }

  function bossPb(boss, damage) {
    const maxHp = BigInt(String(boss.base_hp ?? 0));
    const curHp = maxHp > damage ? maxHp - damage : 0n;
    return {
      tid: Number(boss.tid), cur_hp: curHp.toString(), max_hp: maxHp.toString(),
      refresh_day: String(dayIndex()), auto_hurt_time: String(0), alive_day: String(0),
      atk: String(0), kill_boss_time: '0'
    };
  }

  function serverPb(db, day, boss, state) {
    const { order, total } = dailyTotal(db, day, boss);
    const rankList = order.map(row => codec.pack('pb_rank_obj', { id: row.roleId, value: row.damage.toString(), extra: Buffer.alloc(0) }));
    const damageList = order.map(row => ({ role_id: row.roleId, damage: row.damage.toString() }));
    return {
      cur_boss: bossPb(boss, total), map_role_list: rankList, damage_list: damageList,
      refresh_day: String(day), skill_list: [], calc_hp_rate: false, cross_state: 0,
      is_close: Number(state?.inMap ? 0 : 1) === 0, last_active_num: Number(constant.init_active_num ?? 0)
    };
  }

  function recordDamage(roleId, damage, options = {}) {
    const amount = Number(damage);
    if (!Number.isSafeInteger(amount) || amount <= 0) fail(CODE_INVALID, 'Invalid world boss damage');
    return store.transaction((model, db) => {
      ensureTables(db);
      const day = Number(options.dayIndex ?? dayIndex());
      const bossRow = options.bossTid ? (tables.bosses.get(Number(options.bossTid)) ?? fail(CODE_STATE, 'World boss deployment configuration names an unknown boss')) : resolveBoss(day);
      const existing = db.prepare('SELECT damage FROM world_boss_daily WHERE day_index=? AND boss_tid=? AND role_id=?')
        .get(day, Number(bossRow.tid), Number(roleId));
      const total = BigInt(String(existing?.damage ?? '0')) + BigInt(amount);
      db.prepare(`INSERT INTO world_boss_daily(day_index,boss_tid,role_id,damage) VALUES(?,?,?,?)
        ON CONFLICT(day_index,boss_tid,role_id) DO UPDATE SET damage=excluded.damage`)
        .run(day, Number(bossRow.tid), Number(roleId), total.toString());
      const raidTotal = dailyTotal(db, day, bossRow).total;
      const maxHp = BigInt(String(bossRow.base_hp ?? 0));
      if (raidTotal >= maxHp) {
        db.prepare(`INSERT OR IGNORE INTO world_boss_kills(day_index,boss_tid,role_id,damage,created_at) VALUES(?,?,?,?,?)`)
          .run(day, Number(bossRow.tid), Number(roleId), total.toString(), new Date(now()).toISOString());
        log({ event: 'world_boss_kill_recorded', day, bossTid: Number(bossRow.tid), roleId: String(roleId) });
      }
      const state = readState(db, model.state.roleId);
      const previousMax = BigInt(String(state.maxDamage ?? '0'));
      if (total > previousMax) state.maxDamage = total.toString();
      writeState(db, model.state.roleId, state, now());
      log({ event: 'world_boss_damage_recorded', day, bossTid: Number(bossRow.tid), damage: amount });
      return { dayIndex: day, bossTid: Number(bossRow.tid), damage: total.toString() };
    });
  }

  function enterMap() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const day = dayIndex(), boss = resolveBoss(day), state = readState(db, model.state.roleId);
      state.inMap = true;
      writeState(db, model.state.roleId, state, now());
      const value = serverPb(db, day, boss, state);
      log({ event: 'world_boss_map_entered', day, bossTid: Number(boss.tid) });
      return { value, data: codec.pack('pb_world_boss_server', value) };
    });
  }

  function leaveMap() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId);
      state.inMap = false;
      writeState(db, model.state.roleId, state, now());
      log({ event: 'world_boss_map_left' });
      return { value: { left: true }, data: null, noReply: true };
    });
  }

  function killRowFor(bossTid) {
    const rows = [...tables.kills.values()].filter(row => Number(row.relation_boss) === Number(bossTid));
    if (!rows.length) fail(CODE_STATE, 'World boss kill reward configuration is missing');
    // The captured rows carry three reward tiers per boss. Until the client
    // evidence pins the tier rule, grant the first (largest) configured tier
    // and keep the claim keyed per kill so it can never be duplicated.
    return rows.sort((a, b) => Number(a.tid) - Number(b.tid))[0];
  }

  function receive() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const kills = db.prepare('SELECT day_index,boss_tid,damage FROM world_boss_kills WHERE role_id=? ORDER BY day_index ASC').all(model.state.roleId);
      if (!kills.length) fail(CODE_STATE, 'World boss kill record is missing');
      const unclaimed = kills.find(kill => !db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='world_boss_kill' AND claim_key=?")
        .get(model.state.roleId, `${kill.day_index}:${kill.boss_tid}`));
      if (!unclaimed) fail(CODE_STATE, 'World boss kill reward was already received');
      const config = killRowFor(unclaimed.boss_tid), awards = pairs(config.award, 'World boss kill reward');
      if (!awards.length) fail(CODE_STATE, 'World boss kill reward configuration is missing');
      const result = grantResources(model, awards, resourceTables(), { codec });
      db.prepare("INSERT INTO reward_claims(role_id,claim_type,claim_key,created_at) VALUES(?,'world_boss_kill',?,?)")
        .run(model.state.roleId, `${unclaimed.day_index}:${unclaimed.boss_tid}`, new Date(now()).toISOString());
      const state = readState(db, model.state.roleId);
      state.received[String(unclaimed.boss_tid)] = true;
      writeState(db, model.state.roleId, state, now());
      const value = {
        person: {
          atk_count: { count: 0, time: '0' }, receive_boss_tid: Number(unclaimed.boss_tid),
          attach_skill: [], max_damage: String(state.maxDamage ?? '0'),
          rank_list: [{ boss_tid: Number(unclaimed.boss_tid), self_rank: 0, self_value: String(unclaimed.damage) }],
          history_max_damage: String(state.maxDamage ?? '0'), last_atk_time: '0',
          receive_ref_day: String(unclaimed.day_index), period_fight_times: 0, achievements: Buffer.alloc(0)
        },
        res: { changes: result.changes, is_overflow: false }
      };
      log({ event: 'world_boss_kill_reward_committed', bossTid: Number(unclaimed.boss_tid), awards });
      return { value, data: codec.pack('pb_world_boss_receive_kill_back', value) };
    });
  }

  function historyRank() {
    return store.inspect(db => {
      ensureTables(db);
      const rankList = [];
      for (const boss of tables.bosses.values()) {
        const totals = new Map();
        for (const row of db.prepare('SELECT role_id,damage FROM world_boss_daily WHERE boss_tid=?').all(Number(boss.tid))) {
          const roleId = String(row.role_id);
          totals.set(roleId, (totals.get(roleId) ?? 0n) + BigInt(String(row.damage)));
        }
        if (!totals.size) continue;
        const order = [...totals].sort((a, b) => a[1] === b[1] ? (a[0] < b[0] ? -1 : 1) : (a[1] > b[1] ? -1 : 1));
        rankList.push({ boss_tid: Number(boss.tid), rank_list: order.map(([roleId, damage]) => codec.pack('pb_rank_obj', { id: roleId, value: damage.toString(), extra: Buffer.alloc(0) })) });
      }
      const value = { rank_list: rankList };
      return { value, data: codec.pack('pb_world_boss_history_rank', value) };
    });
  }

  function achievement(input) {
    const requested = Array.isArray(input?.tid_list) ? input.tid_list.map(Number) : [];
    if (!requested.length) fail(CODE_INVALID, 'World boss achievement list is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const state = readState(db, model.state.roleId), awards = [];
      for (const tid of requested) {
        const row = tables.achievements.get(tid);
        if (!row) fail(CODE_STATE, 'World boss achievement is not configured');
        if (BigInt(String(state.maxDamage ?? '0')) < BigInt(String(row.damage ?? 0))) {
          fail(CODE_STATE, 'World boss achievement condition is not met');
        }
        if (db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='world_boss_achievement' AND claim_key=?")
          .get(model.state.roleId, String(tid))) fail(CODE_STATE, 'World boss achievement was already received');
        awards.push(...pairs(row.award, 'World boss achievement reward'));
      }
      const result = grantResources(model, awards, resourceTables(), { codec });
      for (const tid of requested) {
        db.prepare("INSERT INTO reward_claims(role_id,claim_type,claim_key,created_at) VALUES(?,'world_boss_achievement',?,?)")
          .run(model.state.roleId, String(tid), new Date(now()).toISOString());
        state.achievements[String(tid)] = true;
      }
      writeState(db, model.state.roleId, state, now());
      const value = { changes: result.changes, is_overflow: false };
      log({ event: 'world_boss_achievement_committed', tids: requested });
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    switch (Number(type)) {
      case COMMAND_ENTER_MAP: return enterMap();
      case COMMAND_LEAVE_MAP: return leaveMap();
      case COMMAND_RECEIVE: return receive();
      case COMMAND_HISTORY_RANK: return historyRank();
      case COMMAND_ACHIEVEMENT: return achievement(input);
      default: fail(CODE_INVALID, 'Unsupported world boss command');
    }
  }

  return { supports, execute, recordDamage, enterMap, leaveMap, receive, historyRank, achievement, dayIndex, tables };
}
