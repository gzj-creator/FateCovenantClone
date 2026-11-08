import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMartialClubActTables } from '../config/martial-club-act-tables.mjs';

// MartialClubActCmd: 84431 req_martial_act_pass_team_award, 84432 req_martial_act_server_award.
//
// 武馆活动是永久武馆每四关一场的限时复刻。MartialClubActTable 只有两份奖励列：
//   first_award  - 本版客户端所有 10 行都是空字面量（{}）
//   server_award - 真实奖励，按 boss 发放
// 因此 84431（个人首通队伍奖）在本版数据里没有可发的奖池，按 fail closed 拒绝并记录；
// 84432（全服奖励）用 server_award 真实发放。
export const MARTIAL_CLUB_ACT_COMMANDS = Object.freeze([84431, 84432]);
export const MARTIAL_CLUB_ACT_LOGIN_SCHEMA = 'pb_martial_club_act_login_data';

const COMMAND_PASS_AWARD = 84431;
const COMMAND_SERVER_AWARD = 84432;

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function optionalInteger(value, min, max, message) {
  if (value === null || value === undefined || value === '') return null;
  return integer(value, min, max, message);
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(Number(milliseconds) / 1000) * 1000).toISOString();
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS martial_club_act_role (role_id INTEGER PRIMARY KEY, got_pass_award TEXT NOT NULL, got_server_award TEXT NOT NULL, updated_at TEXT NOT NULL)');
}

function readState(db, roleId, nowMs) {
  const row = db.prepare('SELECT * FROM martial_club_act_role WHERE role_id=?').get(roleId);
  return {
    roleId,
    gotPassAward: row ? Buffer.from(row.got_pass_award || '', 'hex') : Buffer.alloc(0),
    gotServerAward: row ? Buffer.from(row.got_server_award || '', 'hex') : Buffer.alloc(0),
    updatedAt: row?.updated_at ?? isoSeconds(nowMs),
    exists: !!row
  };
}

function writeState(db, state, nowMs) {
  db.prepare([
    'INSERT INTO martial_club_act_role (role_id, got_pass_award, got_server_award, updated_at)',
    'VALUES (?,?,?,?)',
    'ON CONFLICT(role_id) DO UPDATE SET',
    '  got_pass_award=excluded.got_pass_award,',
    '  got_server_award=excluded.got_server_award,',
    '  updated_at=excluded.updated_at'
  ].join('\n')).run(state.roleId, state.gotPassAward.toString('hex'), state.gotServerAward.toString('hex'), isoSeconds(nowMs));
}

function resPacket(changes) {
  return { changes: changes ?? [], is_overflow: false };
}

export function createMartialClubActService({
  store,
  codec,
  tables = readMartialClubActTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch { /* logging must not fail a command */ } };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.rows?.size) throw new Error('Martial club activity configuration is unavailable');

  function supports(type) { return MARTIAL_CLUB_ACT_COMMANDS.includes(Number(type)); }

  function actRowOf(bossId) {
    const row = tables.rows.get(Number(bossId));
    if (!row) fail(CODE_STATE, 'Martial club activity boss is not configured: ' + bossId);
    return row;
  }

  // 通关进度由武馆组队结算写入 martial_club_role.pass_team_boss；活动不复制这份进度。
  function passTeamBossOf(db, roleId) {
    const row = db.prepare('SELECT pass_team_boss FROM martial_club_role WHERE role_id=?').get(roleId);
    return Number(row?.pass_team_boss ?? 0);
  }

  // 单服语义：全服是否通关由本服任意角色在该 boss 上的组队通关推导。
  function serverPassedBoss(db, bossId) {
    const row = db.prepare('SELECT COUNT(*) AS total FROM martial_club_role WHERE pass_team_boss>=?').get(bossId);
    return Number(row?.total ?? 0) > 0;
  }

  function passAward(input) {
    const raw = Array.isArray(input) ? input[0] : (input?.boss_id ?? input?.bossId ?? input);
    const bossId = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club activity boss id');
    const row = actRowOf(bossId);
    if (!row.firstAward.length) {
      fail(CODE_STATE, 'Martial club activity pass award configuration is empty for boss ' + bossId);
    }
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readState(db, roleId, nowMs);
      if (passTeamBossOf(db, roleId) < bossId) fail(CODE_STATE, 'Martial club activity boss is not passed');
      if (hasBit(state.gotPassAward, bossId)) fail(CODE_LIMIT, 'Martial club activity pass award was already received');
      const reward = grantResources(model, row.firstAward, resourceTables());
      state.gotPassAward = setBit(state.gotPassAward, bossId);
      writeState(db, state, nowMs);
      log({ event: 'martial_club_act_pass_award_committed', bossId, changes: reward.changes.length });
      return {
        value: { bossId, changes: reward.changes.length },
        data: codec.pack('pb_martial_club_act_pass_award_rsp', {
          res_change: resPacket(reward.changes),
          got_pass_award: state.gotPassAward
        })
      };
    });
  }

  function serverAward(input) {
    const raw = Array.isArray(input) ? input[0] : (input?.boss_id ?? input?.bossId ?? input);
    const requested = optionalInteger(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club activity boss id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readState(db, roleId, nowMs);
      const candidates = [];
      let bits = Buffer.from(state.gotServerAward);
      for (const row of tables.rows.values()) {
        if (requested !== null && Number(row.tid) !== requested) continue;
        if (hasBit(bits, Number(row.tid))) continue;
        if (!serverPassedBoss(db, Number(row.tid))) continue;
        if (!row.serverAward.length) continue;
        candidates.push(row);
        bits = setBit(bits, Number(row.tid));
      }
      if (!candidates.length) fail(CODE_LIMIT, 'Martial club activity server award is not available');
      const reward = grantResources(model, candidates.flatMap(row => row.serverAward), resourceTables());
      state.gotServerAward = bits;
      writeState(db, state, nowMs);
      log({ event: 'martial_club_act_server_award_committed', bosses: candidates.map(row => row.tid), changes: reward.changes.length });
      return {
        value: { bosses: candidates.map(row => row.tid), changes: reward.changes.length },
        data: codec.pack('pb_martial_club_act_server_award_rsp', {
          res_change: resPacket(reward.changes),
          got_server_award: state.gotServerAward
        })
      };
    });
  }

  async function execute(type, input) {
    if (Number(type) === COMMAND_PASS_AWARD) return passAward(input);
    if (Number(type) === COMMAND_SERVER_AWARD) return serverAward(input);
    fail(CODE_INVALID, 'Unsupported martial club activity command');
    return null;
  }

  // pb_martial_club_act_login_data = { award: pb_role_martial_club_act, roles: [pb_role_martial_club_act_pass] }.
  // The block rides inside activity module 92 module_login_data; mounting it needs the activity
  // framework entry for this act, which is not part of this card (recorded as a gap).
  function loginPayload() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readState(db, roleId, nowMs);
      const roles = [];
      for (const row of tables.rows.values()) {
        const passed = db.prepare('SELECT role_id FROM martial_club_role WHERE pass_team_boss>=? ORDER BY role_id').all(Number(row.tid));
        if (!passed.length) continue;
        roles.push({ boss_id: Number(row.tid), role_id: passed.map(entry => String(entry.role_id)) });
      }
      writeState(db, state, nowMs);
      return {
        data: codec.pack(MARTIAL_CLUB_ACT_LOGIN_SCHEMA, {
          award: { got_server_award: state.gotServerAward, got_pass_award: state.gotPassAward },
          roles
        })
      };
    });
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      writeState(db, state, nowMs);
      return { roleId: state.roleId, exists: state.exists };
    });
  }

  return { supports, execute, passAward, serverAward, loginPayload, ensureLoginState };
}
