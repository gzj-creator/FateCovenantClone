import { decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources, consumeResources } from './resources.mjs';
import { GUILD_MODULE_ID } from './guild-roster-service.mjs';
import { buildLineupAttrInfo } from './attribute-service.mjs';

// Shared authority for the E2 social-cooperation block (GuildBossCmd,
// GuildJointCmd, GuildRuneStoneCmd, GuildGVGCmd, GuildVoteCmd, SlgMapCmd,
// GuildNationCmd, GuildBargainCmd, GuildExpeditionCmd, ChannelEntryCmd,
// GuildHuntCmd, GuildCrusadeCmd, GuildAuctionCmd).
//
// Guild identity comes from login module 24 (pb_res_guild_login), the same
// module GuildMgr writes for 21005-21010. Every command in this block needs a
// real guild membership, so the guild id, member list and job come from that
// single authority instead of a second copy in the cooperation tables.
//
// Variable-shape guild state is stored as JSON documents keyed by
// (scope, guild, role, key). Claim markers are a separate table so every award
// path is idempotent across reconnects and database restarts, and the event log
// keeps the ranked boards derived from real server actions instead of seeded
// numbers.

export const DIAMOND_TID = 101500;

export const COOP_SCHEMA = `
CREATE TABLE IF NOT EXISTS guild_coop_docs (
  scope TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  doc_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(scope,guild_id,role_id,doc_key)
);
CREATE TABLE IF NOT EXISTS guild_coop_claims (
  scope TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  period TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(scope,guild_id,role_id,claim_key,period)
);
CREATE TABLE IF NOT EXISTS guild_coop_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '0',
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS guild_coop_events_scope_idx ON guild_coop_events(scope,guild_id,role_id,event_id);
`;

export function ensureCoopTables(db) {
  db.exec(COOP_SCHEMA);
}

export function toSeconds(now) {
  const value = Number(typeof now === 'function' ? now() : now);
  return Number.isFinite(value) ? Math.floor(value / 1000) : 0;
}

// The deployment runs on Asia/Shanghai; daily and weekly guild resets follow
// the same local midnight that the rest of the server uses for its day keys.
export function dayKey(seconds) {
  return new Date((seconds + 8 * 3600) * 1000).toISOString().slice(0, 10);
}

export function weekKey(seconds) {
  const local = new Date((seconds + 8 * 3600) * 1000);
  const day = (local.getUTCDay() + 6) % 7;
  const monday = new Date(local.getTime() - day * 86400000);
  return monday.toISOString().slice(0, 10);
}

export function isoStamp(seconds) {
  return new Date(Math.max(0, seconds) * 1000).toISOString();
}

export function guildContext(model, codec) {
  const module = new Map(model.state.modules.value).get(GUILD_MODULE_ID);
  if (!module) throw new GameError(5, 'Guild login state is missing');
  let login;
  try {
    login = codec.unpack('pb_res_guild_login', rawBinary(module));
  } catch {
    throw new GameError(5, 'Guild login state is invalid');
  }
  const guildId = String(login.guildId ?? '0').trim();
  if (!/^[0-9]+$/.test(guildId) || guildId === '0' || !login.guild) {
    throw new GameError(7, 'Current role has no guild');
  }
  const roleId = String(model.state.roleId);
  const members = Array.isArray(login.guild.member_list) ? login.guild.member_list : [];
  const member = members.find(entry => String(entry.role_id) === roleId) ?? null;
  if (!member) throw new GameError(7, 'Current role is not a guild member');
  return { guildId, guild: login.guild, roleId, member, job: Number(member.job ?? 0), members };
}

export function readDoc(db, scope, guildId, roleId, key) {
  const row = db.prepare('SELECT payload_json FROM guild_coop_docs WHERE scope=? AND guild_id=? AND role_id=? AND doc_key=?').get(scope, guildId, roleId, key);
  return row ? JSON.parse(row.payload_json) : null;
}

export function writeDoc(db, scope, guildId, roleId, key, value, at) {
  db.prepare('INSERT OR REPLACE INTO guild_coop_docs VALUES (?,?,?,?,?,?)').run(scope, guildId, roleId, key, JSON.stringify(value), isoStamp(at));
  return value;
}

export function deleteDoc(db, scope, guildId, roleId, key) {
  db.prepare('DELETE FROM guild_coop_docs WHERE scope=? AND guild_id=? AND role_id=? AND doc_key=?').run(scope, guildId, roleId, key);
}

export function claimOnce(db, { scope, guildId, roleId, key, period, at }) {
  const existing = db.prepare('SELECT 1 FROM guild_coop_claims WHERE scope=? AND guild_id=? AND role_id=? AND claim_key=? AND period=?').get(scope, guildId, roleId, key, period);
  if (existing) return false;
  db.prepare('INSERT INTO guild_coop_claims VALUES (?,?,?,?,?,?)').run(scope, guildId, roleId, key, period, isoStamp(at));
  return true;
}

export function appendEvent(db, { scope, guildId, roleId = '0', kind, amount = 0, details = {}, at }) {
  db.prepare('INSERT INTO guild_coop_events (scope,guild_id,role_id,kind,amount,details_json,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(scope, guildId, String(roleId), kind, String(amount), JSON.stringify(details), isoStamp(at));
}

export function eventTotal(db, { scope, guildId, roleId = null, kind = null, since = 0 }) {
  const clauses = ['scope=?', 'guild_id=?', 'event_id>?'];
  const params = [scope, guildId, since];
  if (roleId !== null) { clauses.push('role_id=?'); params.push(String(roleId)); }
  if (kind !== null) { clauses.push('kind=?'); params.push(kind); }
  const row = db.prepare('SELECT COALESCE(SUM(CAST(amount AS INTEGER)),0) AS total FROM guild_coop_events WHERE ' + clauses.join(' AND ')).get(...params);
  return Number(row?.total ?? 0);
}

// Ranked boards are built from the guild roster and the real event log. Roles
// that never acted keep their stored zero instead of receiving invented scores.
export function rosterScores(db, { scope, guildId, kind = null, members = [] }) {
  const rows = new Map();
  for (const member of members) rows.set(String(member.role_id), 0);
  const clauses = ['scope=?', 'guild_id=?'];
  const params = [scope, guildId];
  if (kind !== null) { clauses.push('kind=?'); params.push(kind); }
  for (const row of db.prepare(`SELECT role_id, COALESCE(SUM(CAST(amount AS INTEGER)),0) AS total FROM guild_coop_events WHERE ${clauses.join(' AND ')} GROUP BY role_id`).all(...params)) {
    rows.set(String(row.role_id), Number(row.total ?? 0));
  }
  return [...rows].map(([roleId, score]) => ({ role_id: roleId, score }))
    .sort((left, right) => right.score - left.score || (BigInt(left.role_id) < BigInt(right.role_id) ? -1 : 1));
}

export function resOf(changes) {
  return { changes: changes ?? [], is_overflow: false };
}

export function grantAwards(model, tables, items, options = {}) {
  if (!Array.isArray(items) || !items.length) return [];
  return grantResources(model, items, tables, options).changes;
}

export function spendResources(model, costs, options = {}) {
  if (!Array.isArray(costs) || !costs.length) return [];
  return consumeResources(model, costs, options.code ?? 301, options).changes;
}

export function asInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  let number = null;
  if (typeof value === 'number' && Number.isSafeInteger(value)) number = value;
  else if (typeof value === 'bigint') number = Number(value);
  else if (typeof value === 'string' && /^-?[0-9]+$/.test(value.trim())) number = Number(value.trim());
  if (number === null || !Number.isSafeInteger(number) || number < min || number > max) {
    throw new GameError(1, `Invalid ${label}`);
  }
  return number;
}

export function optionalInteger(value, label, options = {}) {
  if (value === undefined || value === null || value === '') return null;
  return asInteger(value, label, options);
}

export function asIdText(value, label) {
  const text = typeof value === 'bigint' ? value.toString() : String(value ?? '').trim();
  if (!/^[0-9]+$/.test(text) || text === '0') throw new GameError(1, `Invalid ${label}`);
  return text;
}

export function etfArgs(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value) && typeof value.improper === 'boolean') return value.value;
  return [value];
}

// ETF request decoding keeps the decoded Erlang term; protobuf requests are
// decoded into plain objects. A command with no request schema still validates
// its payload when the client happens to send one.
export async function decodeCoopRequest(codec, schemas, type, bytes) {
  const schema = schemas?.[Number(type)];
  const buffer = bytes ?? Buffer.alloc(0);
  if (schema) {
    try {
      return codec.unpack(schema, buffer);
    } catch {
      throw new GameError(1, 'Invalid protobuf payload');
    }
  }
  if (!buffer.length) return undefined;
  let decoded;
  try {
    decoded = await decodeEtf(buffer);
  } catch {
    throw new GameError(1, 'Invalid ETF payload');
  }
  return decoded?.value ?? decoded;
}

// Damage in every cooperation module is derived from the player's real lineup
// power, so a stronger account hits harder. The coefficient is a local policy
// value: the client tables that would pin the original formula are not part of
// the recovered evidence set.
export function lineupPower(model, heroTables) {
  try {
    const info = buildLineupAttrInfo({ model, lineupType: 1, heroTables });
    const power = Number(info.lineup_attr.lineup_power);
    return Number.isFinite(power) && power > 0 ? Math.floor(power) : 0;
  } catch {
    return 0;
  }
}

export function damageFromPower(power, percent) {
  const base = Math.max(0, Math.floor(Number(power) || 0));
  return Math.max(1, Math.floor(base * percent / 100));
}

export function bigAdd(current, delta) {
  return (BigInt(current ?? 0) + BigInt(delta ?? 0)).toString();
}

export function bigSub(current, delta) {
  const value = BigInt(current ?? 0) - BigInt(delta ?? 0);
  return value > 0n ? value : 0n;
}

export function bigMin(left, right) {
  return BigInt(left ?? 0) < BigInt(right ?? 0) ? BigInt(left ?? 0) : BigInt(right ?? 0);
}
