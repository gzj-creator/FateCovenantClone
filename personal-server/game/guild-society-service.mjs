import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { grantResources } from './resources.mjs';
import { serverDayNumber } from './activity-calendar.mjs';

// GuildCmd 21001-21031, GuildDataCmd 171 and GuildActiveCmd 85501-85505.
// Requests are either protobuf (see GUILD_SOCIETY_REQUEST_SCHEMAS) or ETF; the
// gateway decodes them before calling execute(). Responses follow the shipped
// schemas in guild.net.proto.bin, guild_active.net.proto.bin and
// function_cache.net.proto.bin.
//
// Authority: module 24 (pb_res_guild_login) keeps the guild aggregate exactly
// where the client reads it, matching guild-roster-service.mjs. New server-side
// sub-states (directory of other guilds, incoming applications, guild log) live
// in SQLite tables created by this service.
//
// GuildMgr evidence (client bytecode string export, this session): create costs
// CREATE_COST_ITEM, applies use APPLY_MAX_COUNT/APPLY_CD_TIME, seat changes use
// KICK_INDEX/RECRUIT_INDEX count slots, rename uses rename_cost_item/
// normal_rename_times, salaries read pay_and_box (+TID_GUILD_PAY_BOX_CONSTANT),
// logs come from pb_guild_log_data and the guild level award list comes from
// GuildTable. The numeric GuildTable rows themselves are not extractable in this
// workspace, so the limits below are local policies and every command that needs
// a GuildTable/GuildActiveTable reward row fails closed.
export const GUILD_SOCIETY_MODULE_ID = 24;

export const GUILD_SOCIETY_COMMANDS = Object.freeze({
  guildData: 171,
  create: 21001,
  applyJoin: 21002,
  handleApplies: 21003,
  recommends: 21004,
  changeBaseInfo: 21008,
  search: 21012,
  dissolve: 21013,
  impeach: 21014,
  sendRecruit: 21015,
  contribute: 21016,
  receiveActBox: 21017,
  renameForce: 21018,
  guildLog: 21019,
  levelAward: 21020,
  renameNormal: 21021,
  setSocialStamp: 21022,
  enterScene: 21023,
  sendNoticeMail: 21024,
  setReadTransfer: 21025,
  boxAward: 21026,
  specialTaskAward: 21027,
  setDistributionRatio: 21028,
  payRecord: 21029,
  payAward: 21030,
  noticeChangeRead: 21031,
  activeAward: 85501,
  activePoint: 85502,
  activeFinishAward: 85503,
  autoDissolveRead: 85504,
  preAutoDissolveRead: 85505
});

export const GUILD_SOCIETY_REQUEST_SCHEMAS = Object.freeze({
  171: 'pb_function_cache_req',
  21001: 'pb_req_create_guild',
  21003: 'pb_req_handle_join_apply',
  21008: 'pb_req_guild_base_info',
  21015: 'pb_guild_send_recruit_req',
  21021: 'pb_guild_rename_req',
  21024: 'pb_guild_send_notice_mail_req',
  85501: 'pb_guild_active_award_req',
  85503: 'pb_guild_active_award_req'
});

const JOB = Object.freeze({ PRESIDENT: 1, OFFICER: 2, MEMBER: 6 });
const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_DUPLICATE = 310;

// Local policies. Every number here is a placeholder until GuildTable rows can
// be extracted; none of them is a recovered server rule.
const POLICY = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 12,
  NOTICE_MAX: 120,
  RECRUIT_MAX: 60,
  MAX_MEMBERS: 50,
  MAX_OFFICERS: 4,
  MAX_APPLY_TARGETS: 10,
  RECOMMEND_LIMIT: 20,
  DAILY_RECRUIT: 3,
  DAILY_KICK: 5,
  DAILY_CONTRIBUTE: 3,
  LOG_LIMIT: 50,
  RECRUIT_COUNT_INDEX: 0,
  KICK_COUNT_INDEX: 1
});

// Local log ids: GuildTable.log_id rows are not extracted, so the server keeps a
// stable local numbering for pb_guild_log.log_id.
const LOG_ID = Object.freeze({
  create: 1,
  join: 2,
  leave: 3,
  kick: 4,
  apply: 5,
  contribute: 6,
  rename: 7,
  notice: 8,
  recruit: 9,
  dissolve: 10,
  impeach: 11,
  mail: 12
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS guild_directory (
  guild_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  badge INTEGER NOT NULL DEFAULT 0 CHECK(badge>=0),
  level INTEGER NOT NULL DEFAULT 1 CHECK(level>=1),
  active INTEGER NOT NULL DEFAULT 0 CHECK(active>=0),
  audit_type INTEGER NOT NULL DEFAULT 1 CHECK(audit_type>=0),
  level_limit INTEGER NOT NULL DEFAULT 1 CHECK(level_limit>=0),
  power_limit INTEGER NOT NULL DEFAULT 0 CHECK(power_limit>=0),
  leader_role_id INTEGER NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1 CHECK(member_count>=1),
  impeach_uid INTEGER NOT NULL DEFAULT 0 CHECK(impeach_uid>=0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guild_apply_inbox (
  guild_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  apply_time INTEGER NOT NULL,
  PRIMARY KEY(guild_id,role_id),
  CHECK(guild_id<>role_id)
);
CREATE TABLE IF NOT EXISTS guild_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  time INTEGER NOT NULL,
  log_key TEXT NOT NULL,
  params_json TEXT NOT NULL,
  role_name TEXT
);
CREATE INDEX IF NOT EXISTS guild_logs_guild_idx ON guild_logs(guild_id,log_id DESC);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (value && typeof value === 'object' && value.value instanceof Uint8Array) return Buffer.from(value.value).toString('utf8');
  if (value && typeof value === 'object' && value.value && Array.isArray(value.value.data)) return Buffer.from(value.value.data).toString('utf8');
  if (Array.isArray(value) && value.length && value.every(entry => Number.isInteger(entry) && entry >= 0 && entry <= 0x10ffff)) return String.fromCodePoint(...value);
  return null;
}

function idText(value, label) {
  let raw = value;
  if (Array.isArray(raw)) {
    if (raw.length !== 1) fail(CODE_INVALID, 'Invalid ' + label);
    raw = raw[0];
  }
  if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw) && !(raw instanceof Uint8Array)) {
    raw = raw.id ?? raw.guild_id ?? raw.role_id ?? raw.tid;
  }
  const text = typeof raw === 'bigint' ? raw.toString() : String(raw ?? '').trim();
  if (!/^[0-9]+$/.test(text)) fail(CODE_INVALID, 'Invalid ' + label);
  const id = BigInt(text);
  if (id <= 0n) fail(CODE_INVALID, 'Invalid ' + label);
  return id.toString();
}

function optionalIdText(value, label) {
  if (value === undefined || value === null || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return idText(value, label);
}

function emptyLogin() {
  return { guildId: '0', last_leave_time: 0, guild_applies: [] };
}

function countInfoFor(login, day) {
  const info = login.count_info;
  const flush = Number(info?.flush_time ?? 0);
  const list = flush === day ? (info?.count_list ?? []).map(Number) : [];
  return { flush_time: flush === day ? flush : day, count_list: list };
}

function bumpCount(info, index, delta = 1) {
  while (info.count_list.length <= index) info.count_list.push(0);
  info.count_list[index] = Number(info.count_list[index] ?? 0) + delta;
  return info;
}

function normalizeGuildId(value) {
  const text = String(value ?? '0').trim();
  if (!/^[0-9]+$/.test(text)) fail(CODE_UNAVAILABLE, 'Guild login id is invalid');
  return text;
}

export function createGuildSocietyService({
  store,
  codec,
  tables = null,
  serverOpenedAt,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect || !store?.state) throw new Error('Guild society store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CODE_UNAVAILABLE, 'Guild clock is invalid');
    return Math.floor(value);
  }

  const nowSeconds = () => Math.trunc(clockMilliseconds() / 1000);
  const isoNow = () => new Date(clockMilliseconds()).toISOString();
  const today = () => serverDayNumber(openedAt, clockMilliseconds());

  function readLogin(state) {
    const modules = new Map(state.modules.value);
    const module = modules.get(GUILD_SOCIETY_MODULE_ID);
    if (!module) return { modules, login: emptyLogin() };
    const bytes = rawBinary(module);
    if (!bytes.length) return { modules, login: emptyLogin() };
    try {
      return { modules, login: codec.unpack('pb_res_guild_login', bytes) };
    } catch {
      fail(CODE_UNAVAILABLE, 'Guild login state is invalid');
    }
  }

  function writeLogin(model, modules, login) {
    modules.set(GUILD_SOCIETY_MODULE_ID, serializedBinary(codec.pack('pb_res_guild_login', login)));
    model.state.modules.value = [...modules];
  }

  function sub(login, field, schema, fallback) {
    const raw = login[field];
    if (!raw) return structuredClone(fallback);
    const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'base64');
    if (!bytes.length) return structuredClone(fallback);
    try {
      return codec.unpack(schema, bytes);
    } catch {
      return structuredClone(fallback);
    }
  }

  function setSub(login, field, schema, value) {
    login[field] = codec.pack(schema, value);
    return value;
  }

  function directory(db, guildId) {
    if (guildId === null || guildId === undefined) return null;
    return db.prepare('SELECT * FROM guild_directory WHERE guild_id=?').get(Number(guildId)) ?? null;
  }

  function appendLog(db, guildId, key, params, roleName = null) {
    db.prepare('INSERT INTO guild_logs(guild_id,time,log_key,params_json,role_name) VALUES (?,?,?,?,?)')
      .run(Number(guildId), nowSeconds(), key, JSON.stringify(params ?? {}), roleName);
  }

  function recentLogs(db, guildId) {
    return db.prepare('SELECT * FROM guild_logs WHERE guild_id=? ORDER BY log_id DESC LIMIT ?')
      .all(Number(guildId), POLICY.LOG_LIMIT)
      .map(row => ({
        time: Number(row.time),
        log_id: LOG_ID[row.log_key] ?? 0,
        params: Buffer.from(JSON.stringify(JSON.parse(row.params_json)), 'utf8'),
        role_name: row.role_name ?? ''
      }));
  }

  function memberOf(guild, roleId) {
    return (guild?.member_list ?? []).find(member => String(member.role_id) === String(roleId)) ?? null;
  }

  function requireGuildScope(model) {
    const { modules, login } = readLogin(model.state);
    const guildId = normalizeGuildId(login.guildId);
    if (BigInt(guildId) === 0n) fail(CODE_UNAVAILABLE, 'Current role is not in a guild');
    const guild = login.guild;
    if (!guild) fail(CODE_UNAVAILABLE, 'Guild data is missing');
    const actor = String(model.state.roleId);
    const member = memberOf(guild, actor);
    return { modules, login, guildId, guild, actor, member };
  }

  function requireMember(scope) {
    if (!scope.member) fail(CODE_UNAVAILABLE, 'Current role is not a guild member');
    return scope.member;
  }

  function requireJob(scope, allowed, message) {
    const member = requireMember(scope);
    if (!allowed.includes(Number(member.job))) fail(CODE_UNAVAILABLE, message);
    return member;
  }

  function guildName(value) {
    const name = textOf(value)?.trim() ?? '';
    if (name.length < POLICY.NAME_MIN || name.length > POLICY.NAME_MAX) fail(CODE_INVALID, 'Invalid guild name length');
    return name;
  }

  function noticeText(value) {
    const notice = textOf(value) ?? '';
    if (notice.length > POLICY.NOTICE_MAX) fail(CODE_INVALID, 'Guild notice is too long');
    return notice;
  }

  function refreshDirectory(db, guild, extra = {}) {
    db.prepare(`UPDATE guild_directory SET name=?,badge=?,level=?,active=?,audit_type=?,level_limit=?,power_limit=?,member_count=?,updated_at=? WHERE guild_id=?`)
      .run(guild.name, Number(guild.badge ?? 0), Number(guild.level ?? 1), Number(guild.active ?? 0),
        Number(guild.audit_type ?? 1), Number(guild.level_limit ?? 1), Number(guild.power_limit ?? 0),
        (guild.member_list ?? []).length, isoNow(), Number(guild.id));
    if (extra.impeachUid !== undefined) {
      db.prepare('UPDATE guild_directory SET impeach_uid=? WHERE guild_id=?').run(Number(extra.impeachUid), Number(guild.id));
    }
  }

  function simpleInfo(row) {
    return {
      id: String(row.guild_id),
      badge: Number(row.badge),
      level: Number(row.level),
      member_count: Number(row.member_count),
      level_limit: Number(row.level_limit),
      audit_type: Number(row.audit_type),
      active: Number(row.active),
      name: row.name,
      leader: String(row.leader_role_id),
      power_limit: String(row.power_limit ?? 0),
      last_act_count: 0,
      refresh_day: today()
    };
  }

  function guildSnapshot(scope, db, extra = {}) {
    const { login, guildId, guild } = scope;
    const day = today();
    const active = sub(login, 'guild_active', 'pb_guild_day_active', { day, active: 0 });
    const row = directory(db, guildId);
    const value = {
      guild: guild ?? undefined,
      base_info: guild ? {
        name: guild.name,
        badge: guild.badge,
        notice: guild.notice,
        impeach_uid: String(row?.impeach_uid ?? 0),
        social_info: guild.social_info
      } : undefined,
      log_list: guild ? recentLogs(db, guildId) : [],
      join_limit: guild ? {
        audit_type: Number(guild.audit_type ?? 1),
        level_limit: Number(guild.level_limit ?? 1),
        power_limit: String(guild.power_limit ?? 0)
      } : undefined,
      guild_active: { day: Number(active.day ?? day), active: Number(active.active ?? 0) },
      count_info: countInfoFor(login, day),
      contribute_info: sub(login, 'contribute_info', 'pb_guild_contribute', { count_info: { flush_time: day, count_list: [] }, active: 0 }),
      res: extra.res,
      func_data: Buffer.alloc(0),
      sundry: sub(login, 'sundry', 'pb_guild_sundry_role', {}),
      pay_box: sub(login, 'pay_and_box', 'pb_guild_pay_box', {})
    };
    return value;
  }

  function etfBinary(bytes) {
    const payload = Buffer.from(bytes);
    const header = Buffer.alloc(6);
    header[0] = 131; header[1] = 109;
    header.writeUInt32BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }

  function createGuild(model, db, input) {
    const actor = String(model.state.roleId);
    const { modules, login } = readLogin(model.state);
    if (BigInt(normalizeGuildId(login.guildId)) !== 0n) fail(CODE_DUPLICATE, 'Current role already belongs to a guild');
    const name = guildName(input?.name);
    const notice = noticeText(input?.notice);
    const badge = Math.max(0, Number(input?.badge ?? 0) || 0);
    if (db.prepare('SELECT 1 AS id FROM guild_directory WHERE name=?').get(name)) fail(CODE_DUPLICATE, 'Guild name already exists');
    const maximum = Number(db.prepare('SELECT COALESCE(MAX(guild_id),900000) AS id FROM guild_directory WHERE guild_id>=900000').get().id);
    const guildId = String(maximum + 1);
    const day = today();
    const timestamp = String(nowSeconds());
    const guild = {
      id: guildId,
      level: 1,
      exp: 0,
      badge,
      notice,
      active: 0,
      member_list: [{ role_id: actor, job: JOB.PRESIDENT, join_time: timestamp }],
      audit_type: 1,
      apply_list: [],
      name,
      server_id: Number(model.state.serverId ?? 0),
      level_limit: 1,
      today_active: 0,
      active_refresh_day: day,
      power_limit: 0,
      last_act_count: 0,
      refresh_day: day
    };
    db.prepare(`INSERT INTO guild_directory
      (guild_id,name,badge,level,active,audit_type,level_limit,power_limit,leader_role_id,member_count,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(Number(guildId), name, badge, 1, 0, 1, 1, 0, Number(actor), 1, isoNow(), isoNow());
    login.guildId = guildId;
    login.guild = guild;
    login.guild_applies = [];
    appendLog(db, guildId, 'create', { role: actor });
    writeLogin(model, modules, login);
    return {
      data: codec.pack('pb_guild_create_back', { guild, func_data: Buffer.alloc(0) }),
      value: { guildId, name, memberCount: 1 }
    };
  }

  function applyJoin(model, db, input) {
    const actor = String(model.state.roleId);
    const { modules, login } = readLogin(model.state);
    if (BigInt(normalizeGuildId(login.guildId)) !== 0n) fail(CODE_UNAVAILABLE, 'Current role is already in a guild');
    const guildId = idText(input, 'guild id');
    const row = directory(db, guildId);
    if (!row) fail(CODE_UNAVAILABLE, 'Guild does not exist');
    const applies = (login.guild_applies ?? []).map(String);
    if (applies.includes(guildId)) fail(CODE_DUPLICATE, 'Guild application already exists');
    if (applies.length >= POLICY.MAX_APPLY_TARGETS) fail(CODE_UNAVAILABLE, 'Guild application limit reached');
    if (Number(row.member_count) >= POLICY.MAX_MEMBERS) fail(CODE_UNAVAILABLE, 'Guild member limit reached');
    db.prepare('INSERT OR REPLACE INTO guild_apply_inbox(guild_id,role_id,apply_time) VALUES (?,?,?)')
      .run(Number(guildId), Number(actor), nowSeconds());
    login.guild_applies = [...applies, guildId];
    appendLog(db, guildId, 'apply', { role: actor });
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, applies: login.guild_applies.length } };
  }

  function handleApplies(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT, JOB.OFFICER], 'No permission to handle guild applications');
    const { modules, login, guildId, guild } = scope;
    const requested = optionalIdText(input?.guild_id, 'guild id');
    if (requested && requested !== guildId) fail(CODE_UNAVAILABLE, 'Guild id does not match the current guild');
    const agree = Boolean(input?.agree);
    const targets = (input?.applies ?? []).map(value => idText(value, 'applicant role id'));
    if (!targets.length) fail(CODE_UNAVAILABLE, 'No guild application was selected');
    for (const target of targets) {
      const inbox = db.prepare('SELECT 1 AS id FROM guild_apply_inbox WHERE guild_id=? AND role_id=?').get(Number(guildId), Number(target));
      if (!inbox) fail(CODE_UNAVAILABLE, 'Guild application does not exist');
      if (agree && memberOf(guild, target)) fail(CODE_DUPLICATE, 'Role is already a guild member');
    }
    if (agree && (guild.member_list ?? []).length + targets.length > POLICY.MAX_MEMBERS) fail(CODE_UNAVAILABLE, 'Guild member limit reached');
    const timestamp = String(nowSeconds());
    for (const target of targets) {
      db.prepare('DELETE FROM guild_apply_inbox WHERE guild_id=? AND role_id=?').run(Number(guildId), Number(target));
      if (agree) {
        guild.member_list = [...(guild.member_list ?? []), { role_id: target, job: JOB.MEMBER, join_time: timestamp }];
        appendLog(db, guildId, 'join', { role: target });
      }
    }
    refreshDirectory(db, guild);
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { agreed: agree, processed: targets.length, members: guild.member_list.length } };
  }

  function recommends(model, db) {
    const { login } = readLogin(model.state);
    const guildId = normalizeGuildId(login.guildId);
    const exclude = BigInt(guildId) === 0n ? null : guildId;
    const guild_infos = db.prepare('SELECT * FROM guild_directory ORDER BY active DESC, guild_id ASC LIMIT ?')
      .all(POLICY.RECOMMEND_LIMIT)
      .filter(row => exclude === null || String(row.guild_id) !== exclude)
      .map(simpleInfo);
    return { data: codec.pack('pb_res_recommends', { guild_infos }), value: { count: guild_infos.length } };
  }

  function searchGuild(model, db, input) {
    const { login } = readLogin(model.state);
    const guildId = normalizeGuildId(login.guildId);
    let type = null;
    let keyword = null;
    if (Array.isArray(input)) {
      [type, keyword] = input;
    } else if (input && typeof input === 'object' && !Buffer.isBuffer(input) && !(input instanceof Uint8Array)) {
      type = input.type ?? null;
      keyword = input.idOrName ?? input.value ?? input.keyword ?? null;
    } else {
      keyword = input;
    }
    const text = textOf(keyword)?.trim() ?? '';
    if (!text) fail(CODE_INVALID, 'Guild search needs an id or a name');
    const rows = /^[0-9]+$/.test(text)
      ? db.prepare('SELECT * FROM guild_directory WHERE guild_id=?').all(Number(text))
      : db.prepare('SELECT * FROM guild_directory WHERE name LIKE ? ORDER BY active DESC, guild_id ASC LIMIT ?').all('%' + text + '%', POLICY.RECOMMEND_LIMIT);
    const guild_infos = rows.filter(row => BigInt(guildId) === 0n || String(row.guild_id) !== guildId).map(simpleInfo);
    return { data: codec.pack('pb_res_recommends', { guild_infos }), value: { count: guild_infos.length, type: Number(type ?? 0) || 0 } };
  }

  function changeBaseInfo(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT, JOB.OFFICER], 'No permission to change guild information');
    const { modules, login, guildId, guild } = scope;
    const requested = optionalIdText(input?.guild_id, 'guild id');
    if (requested && requested !== guildId) fail(CODE_UNAVAILABLE, 'Guild id does not match the current guild');
    if (input?.notice !== undefined) guild.notice = noticeText(input.notice);
    if (input?.badge !== undefined) guild.badge = Math.max(0, Number(input.badge) || 0);
    if (input?.audit_type !== undefined) guild.audit_type = Math.max(0, Number(input.audit_type) || 0);
    if (input?.level_limit !== undefined) guild.level_limit = Math.max(0, Number(input.level_limit) || 0);
    if (input?.power_limit !== undefined) guild.power_limit = String(Math.max(0, Number(input.power_limit) || 0));
    if (input?.social_info) {
      guild.social_info = {
        type: Number(input.social_info.type ?? 0),
        id: textOf(input.social_info.id) ?? '',
        set_stamp: nowSeconds()
      };
    }
    refreshDirectory(db, guild);
    appendLog(db, guildId, 'notice', { role: scope.actor });
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, audit_type: Number(guild.audit_type), level_limit: Number(guild.level_limit) } };
  }

  function dissolveGuild(model, db) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT], 'Only the president may dissolve the guild');
    const { modules, login, guildId } = scope;
    appendLog(db, guildId, 'dissolve', { role: scope.actor });
    db.prepare('DELETE FROM guild_apply_inbox WHERE guild_id=?').run(Number(guildId));
    db.prepare('DELETE FROM guild_directory WHERE guild_id=?').run(Number(guildId));
    const previous = login.leave_count ? codec.unpack('pb_guild_leave', Buffer.from(login.leave_count, 'base64')) : { count: 0, reset_day: 0 };
    login.guildId = '0';
    delete login.guild;
    login.guild_applies = [];
    login.last_leave_time = nowSeconds();
    login.leave_count = codec.pack('pb_guild_leave', {
      count: Number(previous.count ?? 0) + 1,
      reset_day: Number(previous.reset_day ?? 0)
    });
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { dissolved: guildId } };
  }

  function impeachPresident(model, db) {
    const scope = requireGuildScope(model);
    const member = requireMember(scope);
    if (Number(member.job) === JOB.PRESIDENT) fail(CODE_UNAVAILABLE, 'The president cannot impeach themselves');
    const row = directory(db, scope.guildId);
    if (!row) fail(CODE_UNAVAILABLE, 'Guild directory entry is missing');
    if (Number(row.impeach_uid) !== 0) fail(CODE_DUPLICATE, 'A guild impeachment is already open');
    db.prepare('UPDATE guild_directory SET impeach_uid=?,updated_at=? WHERE guild_id=?').run(Number(scope.actor), isoNow(), Number(scope.guildId));
    appendLog(db, scope.guildId, 'impeach', { role: scope.actor });
    return { data: Buffer.alloc(0), value: { guildId: scope.guildId, impeach_uid: scope.actor } };
  }

  function sendRecruit(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT, JOB.OFFICER], 'No permission to send a guild recruit');
    const { modules, login, guildId } = scope;
    const day = today();
    const counts = countInfoFor(login, day);
    const used = Number(counts.count_list[POLICY.RECRUIT_COUNT_INDEX] ?? 0);
    if (used >= POLICY.DAILY_RECRUIT) fail(CODE_UNAVAILABLE, 'Daily guild recruit limit reached');
    const data = input?.data;
    const bytes = Buffer.isBuffer(data) ? data : (data ? Buffer.from(String(data), 'base64') : Buffer.alloc(0));
    let note = '';
    if (bytes.length) {
      let invite;
      try {
        invite = codec.unpack('pb_guild_invite', bytes);
      } catch {
        fail(CODE_INVALID, 'Invalid guild recruit payload');
      }
      note = textOf(invite?.note) ?? '';
    }
    if (note.length > POLICY.RECRUIT_MAX) fail(CODE_INVALID, 'Guild recruit text is too long');
    bumpCount(counts, POLICY.RECRUIT_COUNT_INDEX, 1);
    login.count_info = counts;
    const sundry = sub(login, 'sundry', 'pb_guild_sundry_role', {});
    sundry.recruit_times = String(Number(sundry.recruit_times ?? 0) + 1);
    sundry.day_refresh_stamp = String(nowSeconds());
    setSub(login, 'sundry', 'pb_guild_sundry_role', sundry);
    appendLog(db, guildId, 'recruit', { role: scope.actor });
    writeLogin(model, modules, login);
    const value = guildSnapshot(scope, db);
    return { data: codec.pack('pb_res_guild_info', value), value: { guildId, recruit: used + 1, noteLength: note.length } };
  }

  function contribute(model, db) {
    const scope = requireGuildScope(model);
    requireMember(scope);
    const { modules, login, guildId, guild } = scope;
    const day = today();
    const contribute = sub(login, 'contribute_info', 'pb_guild_contribute', { count_info: { flush_time: day, count_list: [] }, active: 0 });
    const counts = contribute.count_info ?? { flush_time: day, count_list: [] };
    if (Number(counts.flush_time ?? 0) !== day) {
      counts.flush_time = day;
      counts.count_list = [];
    }
    counts.count_list = (counts.count_list ?? []).map(Number);
    const used = Number(counts.count_list[0] ?? 0);
    if (used >= POLICY.DAILY_CONTRIBUTE) fail(CODE_UNAVAILABLE, 'Daily guild contribution limit reached');
    counts.count_list[0] = used + 1;
    contribute.count_info = counts;
    contribute.active = String(BigInt(Number(contribute.active ?? 0)) + 1n);
    contribute.active_time = String(nowSeconds());
    setSub(login, 'contribute_info', 'pb_guild_contribute', contribute);
    guild.active = Number(guild.active ?? 0) + 1;
    guild.today_active = Number(guild.today_active ?? 0) + 1;
    refreshDirectory(db, guild);
    appendLog(db, guildId, 'contribute', { role: scope.actor });
    writeLogin(model, modules, login);
    const value = guildSnapshot(scope, db);
    return { data: codec.pack('pb_res_guild_info', value), value: { guildId, contribute: used + 1, guildActive: Number(guild.active) } };
  }

  function renameForce(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT], 'Only the president may rename the guild');
    const { modules, login, guildId, guild } = scope;
    if (!login.need_rename) fail(CODE_UNAVAILABLE, 'The guild does not need a forced rename');
    const name = guildName(input?.name ?? input);
    if (db.prepare('SELECT 1 AS id FROM guild_directory WHERE name=? AND guild_id<>?').get(name, Number(guildId))) fail(CODE_DUPLICATE, 'Guild name already exists');
    guild.name = name;
    login.need_rename = false;
    const rename = sub(login, 'guild_rename', 'pb_guild_rename_info', {});
    rename.rename_stamp = String(nowSeconds());
    setSub(login, 'guild_rename', 'pb_guild_rename_info', rename);
    refreshDirectory(db, guild);
    appendLog(db, guildId, 'rename', { role: scope.actor });
    writeLogin(model, modules, login);
    const value = { name, rename_stamp: rename.rename_stamp, res: { changes: [] } };
    return { data: codec.pack('pb_guild_rename_back', value), value: { guildId, name, forced: true } };
  }

  function renameNormal(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT], 'Only the president may rename the guild');
    const { modules, login, guildId, guild } = scope;
    const name = guildName(input?.name);
    if (db.prepare('SELECT 1 AS id FROM guild_directory WHERE name=? AND guild_id<>?').get(name, Number(guildId))) fail(CODE_DUPLICATE, 'Guild name already exists');
    guild.name = name;
    const rename = sub(login, 'guild_rename', 'pb_guild_rename_info', {});
    rename.normal_rename_times = Number(rename.normal_rename_times ?? 0) + 1;
    rename.rename_stamp = String(nowSeconds());
    setSub(login, 'guild_rename', 'pb_guild_rename_info', rename);
    refreshDirectory(db, guild);
    appendLog(db, guildId, 'rename', { role: scope.actor });
    writeLogin(model, modules, login);
    const value = { name, rename_stamp: rename.rename_stamp, res: { changes: [] } };
    return { data: codec.pack('pb_guild_rename_back', value), value: { guildId, name, renameTimes: rename.normal_rename_times } };
  }

  function setSocialStamp(model) {
    const scope = requireGuildScope(model);
    const { modules, login, guildId } = scope;
    const value = { guild_id: guildId, copy_stamp: String(nowSeconds()) };
    setSub(login, 'role_social', 'pb_guild_social_role', value);
    writeLogin(model, modules, login);
    return { data: codec.pack('pb_guild_social_role', value), value: { guildId, copy_stamp: value.copy_stamp } };
  }

  function guildLog(model, db) {
    const scope = requireGuildScope(model);
    const log_list = recentLogs(db, scope.guildId);
    const bytes = codec.pack('pb_guild_log_data', { log_list });
    return { data: etfBinary(bytes), value: { guildId: scope.guildId, logs: log_list.length } };
  }

  function sendNoticeMail(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT, JOB.OFFICER], 'No permission to send guild notice mail');
    const { modules, login, guildId, guild } = scope;
    const title = (textOf(input?.title) ?? '').trim();
    const content = (textOf(input?.content) ?? '').trim();
    if (!title || !content) fail(CODE_INVALID, 'Guild notice mail needs a title and content');
    guild.last_notice_mail_time = String(nowSeconds());
    appendLog(db, guildId, 'mail', { role: scope.actor });
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, titleLength: title.length } };
  }

  function setReadTransfer(model) {
    const scope = requireGuildScope(model);
    const { modules, login, guildId } = scope;
    const sundry = sub(login, 'sundry', 'pb_guild_sundry_role', {});
    sundry.read_transfer_stamp = String(nowSeconds());
    setSub(login, 'sundry', 'pb_guild_sundry_role', sundry);
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, read_transfer_stamp: sundry.read_transfer_stamp } };
  }

  function claimRoleAward(model, db, field) {
    const scope = requireGuildScope(model);
    const { modules, login, guildId } = scope;
    const payBox = sub(login, 'pay_and_box', 'pb_guild_pay_box', {});
    const list = Array.isArray(payBox[field]) ? payBox[field] : [];
    const index = list.findIndex(entry => String(entry.role_id) === scope.actor && !entry.is_get);
    if (index < 0) fail(CODE_UNAVAILABLE, 'No unclaimed guild award for the current role');
    const awards = (list[index].pb_box_award ?? []).map(item => [Number(item.tid), Number(item.num)]);
    if (!awards.length) fail(CODE_UNAVAILABLE, 'Guild award is empty');
    const granted = grantResources(model, awards, tables ?? {}, { codec, now });
    list[index] = { ...list[index], is_get: true };
    payBox[field] = list;
    setSub(login, 'pay_and_box', 'pb_guild_pay_box', payBox);
    writeLogin(model, modules, login);
    return { guildId, entry: list[index], changes: granted.changes };
  }

  function boxAward(model, db) {
    const claimed = claimRoleAward(model, db, 'pb_role_box_award');
    const value = { pb_role_box_award: claimed.entry, res: { changes: claimed.changes } };
    return { data: codec.pack('pb_guild_box_rsp', value), value: { guildId: claimed.guildId, awards: claimed.changes.length } };
  }

  function payAward(model, db) {
    const claimed = claimRoleAward(model, db, 'role_pay_award');
    const value = { role_pay_award: claimed.entry, res: { changes: claimed.changes } };
    return { data: codec.pack('pb_guild_pay_rsp', value), value: { guildId: claimed.guildId, awards: claimed.changes.length } };
  }

  function payRecord(model) {
    const scope = requireGuildScope(model);
    const payBox = sub(scope.login, 'pay_and_box', 'pb_guild_pay_box', {});
    const add_record = Array.isArray(payBox.pay_add_record) ? payBox.pay_add_record : [];
    return { data: codec.pack('pb_req_guild_pay_record', { add_record }), value: { guildId: scope.guildId, records: add_record.length } };
  }

  function setDistributionRatio(model, db, input) {
    const scope = requireGuildScope(model);
    requireJob(scope, [JOB.PRESIDENT], 'Only the president may set the distribution ratio');
    const { modules, login, guildId } = scope;
    const ratio = Number(Array.isArray(input)
      ? input[0]
      : (input && typeof input === 'object' ? (input.ratio ?? input.value) : input));
    if (!Number.isSafeInteger(ratio) || ratio < 0 || ratio > 100) fail(CODE_INVALID, 'Invalid guild distribution ratio');
    const payBox = sub(login, 'pay_and_box', 'pb_guild_pay_box', {});
    payBox.distribution_ratio = ratio;
    setSub(login, 'pay_and_box', 'pb_guild_pay_box', payBox);
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, distribution_ratio: ratio } };
  }

  function noticeChangeRead(model) {
    const scope = requireGuildScope(model);
    const { modules, login, guildId, guild } = scope;
    const sundry = sub(login, 'sundry', 'pb_guild_sundry_role', {});
    sundry.read_notice_notice_stamp = String(guild.last_notice_time ?? 0);
    setSub(login, 'sundry', 'pb_guild_sundry_role', sundry);
    writeLogin(model, modules, login);
    return { data: Buffer.alloc(0), value: { guildId, read_notice_notice_stamp: sundry.read_notice_notice_stamp } };
  }

  function activePoint(model) {
    const scope = requireGuildScope(model);
    const day = today();
    const info = sub(scope.login, 'guild_active', 'pb_role_guild_active', { active: 0, week_active: 0, active_sum: '0', special_active: 0 });
    const current = Number(info.active_refresh_day ?? 0) === day ? Number(info.active ?? 0) : 0;
    const value = {
      today_active: current,
      active_refresh_day: day,
      details: (info.active_finish ?? []).map(entry => ({ tid: Number(entry.tid), times: Number(entry.finish_times ?? 0), score: 0 })),
      refresh_stamp: String(nowSeconds())
    };
    return { data: codec.pack('pb_guild_active_info', value), value: { guildId: scope.guildId, today_active: current } };
  }

  function autoDissolveRead(model, field) {
    const scope = requireGuildScope(model);
    const { modules, login, guildId } = scope;
    const value = sub(login, 'auto_dissolve_role', 'pb_guild_auto_dissolve_role', { dissolve_read: false, pre_dissolve_read: false });
    value[field] = true;
    setSub(login, 'auto_dissolve_role', 'pb_guild_auto_dissolve_role', value);
    writeLogin(model, modules, login);
    return { data: codec.pack('pb_guild_auto_dissolve_role', value), value: { guildId, [field]: true } };
  }

  // Commands whose reward rows live in tables that are not extracted in this
  // workspace. They answer with an explicit business error instead of a fake
  // empty packet, and are registered as evidence gaps.
  const GAPS = new Map([
    [171, 'GuildDataTable block_id mapping is not extracted'],
    [21017, 'guild_box_receive payload schema is not recovered'],
    [21020, 'GuildTable level award rows are not extracted'],
    [21027, 'GuildActiveTable special task rows are not extracted'],
    [85501, 'GuildActiveTable daily award rows are not extracted'],
    [85503, 'GuildActiveTable finish award rows are not extracted']
  ]);

  const SUPPORTED = new Set(Object.values(GUILD_SOCIETY_COMMANDS));

  return {
    moduleId: GUILD_SOCIETY_MODULE_ID,
    supports: type => SUPPORTED.has(Number(type)),
    requestSchema: type => GUILD_SOCIETY_REQUEST_SCHEMAS[Number(type)] ?? null,
    gap: type => GAPS.get(Number(type)) ?? null,
    execute(type, input) {
      const command = Number(type);
      const gap = GAPS.get(command);
      if (gap) fail(CODE_UNAVAILABLE, 'Guild command gap: ' + gap);
      return store.transaction((model, db) => {
        switch (command) {
          case 21001: return createGuild(model, db, input);
          case 21002: return applyJoin(model, db, input);
          case 21003: return handleApplies(model, db, input);
          case 21004: return recommends(model, db);
          case 21008: return changeBaseInfo(model, db, input);
          case 21012: return searchGuild(model, db, input);
          case 21013: return dissolveGuild(model, db);
          case 21014: return impeachPresident(model, db);
          case 21015: return sendRecruit(model, db, input);
          case 21016: return contribute(model, db);
          case 21018: return renameForce(model, db, input);
          case 21019: return guildLog(model, db);
          case 21021: return renameNormal(model, db, input);
          case 21022: return setSocialStamp(model);
          case 21023: {
            const scope = requireGuildScope(model);
            log({ event: 'guild_scene_enter', guildId: scope.guildId, roleId: scope.actor });
            return { data: Buffer.alloc(0), value: { guildId: scope.guildId } };
          }
          case 21024: return sendNoticeMail(model, db, input);
          case 21025: return setReadTransfer(model);
          case 21026: return boxAward(model, db);
          case 21028: return setDistributionRatio(model, db, input);
          case 21029: return payRecord(model);
          case 21030: return payAward(model, db);
          case 21031: return noticeChangeRead(model);
          case 85502: return activePoint(model);
          case 85504: return autoDissolveRead(model, 'dissolve_read');
          case 85505: return autoDissolveRead(model, 'pre_dissolve_read');
          default: fail(CODE_UNAVAILABLE, 'Guild society command is not implemented');
        }
      });
    }
  };
}
