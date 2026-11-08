import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMartialClubTables } from '../config/martial-club-tables.mjs';
import { buildFightReport, rosterFor, simulatePvpBattle } from './pvp-battle.mjs';

// MartialClubCmd: 84401 req_martial_club_first_award, 84404 create_team ... 84426 relic.
//
// Evidence for this module:
//   personal-server/assets/protobuf/martial_club.{db,net}.proto.bin (plain .proto text)
//   client bytecode MartialClubCmd/MartialClubMgr/MartialClubTeamMgr (strings recovered with
//   tools/dump-luajit-prototypes.mjs style constant dumps)
//   login module 123 observed in the recorded client login carries exactly the two blocks
//   MartialClubMgr.LoginParse decodes: pb_martial_club_role and pb_martial_club_employ_role.
//
// The team fight itself is simulated by game/pvp-battle.mjs against a deployment supplied
// opponent roster. The shipped client tables contain no opponent line-up for the team bosses
// (FightTable.def_team is null everywhere), so the fight is refused when no provider is wired.
export const MARTIAL_CLUB_MODULE_ID = 123;
export const MARTIAL_CLUB_LOGIN_SCHEMAS = Object.freeze(['pb_martial_club_role', 'pb_martial_club_employ_role']);

export const MARTIAL_CLUB_REQUEST_SCHEMAS = Object.freeze({
  84404: 'pb_martial_club_team_create_req',
  84410: 'pb_martial_club_set_team_info_req',
  84414: 'pb_martial_club_set_member_pos_req',
  84421: 'pb_martial_club_members_req',
  84425: 'pb_martial_club_match_req',
  84426: 'pb_martial_club_relic_req'
});

const COMMAND_FIRST_AWARD = 84401;
const COMMAND_CREATE_TEAM = 84404;
const COMMAND_ADD_BOT = 84405;
const COMMAND_SET_HELP = 84406;
const COMMAND_JOIN_TEAM = 84407;
const COMMAND_EXIT_TEAM = 84408;
const COMMAND_TEAM_INFO = 84409;
const COMMAND_SET_TEAM_INFO = 84410;
const COMMAND_SET_READY = 84411;
const COMMAND_INVITE = 84412;
const COMMAND_INVITE_ALL = 84413;
const COMMAND_SET_MEMBER_POS = 84414;
const COMMAND_PASS_COUNT = 84415;
const COMMAND_TEAM_KICK = 84416;
const COMMAND_TEAM_FIGHT = 84417;
const COMMAND_BOT_LIST = 84418;
const COMMAND_GIVE_UP = 84419;
const COMMAND_SETTLEMENT = 84420;
const COMMAND_TEAM_MEMBERS = 84421;
const COMMAND_TEAM_SKIP = 84422;
const COMMAND_EMPLOY_LIST = 84423;
const COMMAND_EMPLOY_ENTER = 84424;
const COMMAND_MATCH = 84425;
const COMMAND_RELIC = 84426;

const SUPPORTED = [
  COMMAND_FIRST_AWARD, COMMAND_CREATE_TEAM, COMMAND_ADD_BOT, COMMAND_SET_HELP, COMMAND_JOIN_TEAM,
  COMMAND_EXIT_TEAM, COMMAND_TEAM_INFO, COMMAND_SET_TEAM_INFO, COMMAND_SET_READY, COMMAND_INVITE,
  COMMAND_INVITE_ALL, COMMAND_SET_MEMBER_POS, COMMAND_PASS_COUNT, COMMAND_TEAM_KICK, COMMAND_TEAM_FIGHT,
  COMMAND_BOT_LIST, COMMAND_GIVE_UP, COMMAND_SETTLEMENT, COMMAND_TEAM_MEMBERS, COMMAND_TEAM_SKIP,
  COMMAND_EMPLOY_LIST, COMMAND_EMPLOY_ENTER, COMMAND_MATCH, COMMAND_RELIC
];

const ETF_COMMANDS = new Set(SUPPORTED.filter(type => !(type in MARTIAL_CLUB_REQUEST_SCHEMAS)));

export function isEtfRequest(type) {
  return ETF_COMMANDS.has(Number(type));
}

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;

// Response schema of these commands is not recorded in the static catalogue ("-"). The client
// registers no decoder for the reply, so the command commits its authoritative state and answers
// with a zero length payload. Each one is listed in the delivery note as an unrecovered schema.
const NO_RESPONSE_COMMANDS = new Set([
  COMMAND_INVITE, COMMAND_INVITE_ALL, COMMAND_PASS_COUNT, COMMAND_BOT_LIST,
  COMMAND_GIVE_UP, COMMAND_TEAM_SKIP, COMMAND_EMPLOY_ENTER
]);

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

function seconds(milliseconds) {
  return Math.floor(Number(milliseconds) / 1000);
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(Number(milliseconds) / 1000) * 1000).toISOString();
}

// MartialClubMgr compares daily_refresh_sec with TimeKit.SameDay; the local server refreshes at
// 05:00 like the activity calendar, which is also the boundary the client shows as "next refresh".
function nextDailyRefreshSeconds(milliseconds) {
  const next = new Date(Number(milliseconds));
  next.setHours(5, 0, 0, 0);
  if (next.getTime() <= Number(milliseconds)) next.setDate(next.getDate() + 1);
  return seconds(next.getTime());
}

function dayKey(milliseconds) {
  const date = new Date(Number(milliseconds));
  if (date.getHours() < 5) date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    const value = JSON.parse(text);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function parseHex(text) {
  if (!text) return Buffer.alloc(0);
  try {
    return Buffer.from(String(text), 'hex');
  } catch {
    return Buffer.alloc(0);
  }
}

function ensureTables(db) {
  db.exec([
    'CREATE TABLE IF NOT EXISTS martial_club_role (',
    '  role_id INTEGER PRIMARY KEY,',
    '  pass_boss INTEGER NOT NULL,',
    '  pass_team_boss INTEGER NOT NULL,',
    '  day TEXT NOT NULL,',
    '  today_fight_times INTEGER NOT NULL,',
    '  own_fight_times INTEGER NOT NULL,',
    '  help_times INTEGER NOT NULL,',
    '  normal_award_times INTEGER NOT NULL,',
    '  pass_team_award TEXT NOT NULL,',
    '  award_history TEXT NOT NULL,',
    '  relic_resolve_quality TEXT NOT NULL,',
    '  fight_temp TEXT NOT NULL,',
    '  fight_power INTEGER NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS martial_club_team (',
    '  leader_id INTEGER PRIMARY KEY,',
    '  boss_tid INTEGER NOT NULL,',
    '  fight_power_limit INTEGER NOT NULL,',
    '  enter_limit_type INTEGER NOT NULL,',
    '  is_help INTEGER NOT NULL,',
    '  invite_all INTEGER NOT NULL,',
    '  invite_roles TEXT NOT NULL,',
    '  chat_channel_id INTEGER NOT NULL,',
    '  fight_result TEXT NOT NULL,',
    '  bot_added_at TEXT NOT NULL,',
    '  invite_all_at TEXT NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS martial_club_team_member (',
    '  leader_id INTEGER NOT NULL,',
    '  member_key INTEGER NOT NULL,',
    '  role_id INTEGER NOT NULL,',
    '  pos INTEGER NOT NULL,',
    '  is_ready INTEGER NOT NULL,',
    '  is_bot INTEGER NOT NULL,',
    '  bot_type INTEGER NOT NULL,',
    '  need_settle INTEGER NOT NULL,',
    '  PRIMARY KEY(leader_id, member_key)',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS martial_club_claims (',
    '  role_id INTEGER NOT NULL,',
    '  claim_type TEXT NOT NULL,',
    '  claim_key TEXT NOT NULL,',
    '  created_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, claim_type, claim_key)',
    ')'
  ].join('\n'));
  db.exec([
    'CREATE TABLE IF NOT EXISTS martial_club_employ (',
    '  role_id INTEGER PRIMARY KEY,',
    '  day TEXT NOT NULL,',
    '  today_times INTEGER NOT NULL,',
    '  total_times INTEGER NOT NULL,',
    '  fight_times INTEGER NOT NULL,',
    '  win_times INTEGER NOT NULL,',
    '  updated_at TEXT NOT NULL',
    ')'
  ].join('\n'));
}

function defaultRole(roleId, nowMs, ownFightTimes) {
  return {
    roleId,
    passBoss: 0,
    passTeamBoss: 0,
    day: dayKey(nowMs),
    todayFightTimes: 0,
    ownFightTimes,
    helpTimes: 0,
    normalAwardTimes: 0,
    passTeamAward: Buffer.alloc(0),
    awardHistory: [],
    relicResolveQuality: [],
    fightTemp: null,
    fightPower: 0,
    exists: false
  };
}

function readRole(db, roleId, nowMs, ownFightTimes) {
  const row = db.prepare('SELECT * FROM martial_club_role WHERE role_id=?').get(roleId);
  if (!row) return defaultRole(roleId, nowMs, ownFightTimes);
  const state = {
    roleId,
    passBoss: Number(row.pass_boss ?? 0),
    passTeamBoss: Number(row.pass_team_boss ?? 0),
    day: row.day ?? dayKey(nowMs),
    todayFightTimes: Number(row.today_fight_times ?? 0),
    ownFightTimes: Number(row.own_fight_times ?? 0),
    helpTimes: Number(row.help_times ?? 0),
    normalAwardTimes: Number(row.normal_award_times ?? 0),
    passTeamAward: parseHex(row.pass_team_award),
    awardHistory: parseJson(row.award_history, []),
    relicResolveQuality: parseJson(row.relic_resolve_quality, []),
    fightTemp: parseJson(row.fight_temp, null),
    fightPower: Number(row.fight_power ?? 0),
    exists: true
  };
  if (state.day !== dayKey(nowMs)) {
    state.day = dayKey(nowMs);
    state.todayFightTimes = 0;
  }
  return state;
}

function writeRole(db, state, nowMs) {
  db.prepare([
    'INSERT INTO martial_club_role',
    '  (role_id, pass_boss, pass_team_boss, day, today_fight_times, own_fight_times, help_times,',
    '   normal_award_times, pass_team_award, award_history, relic_resolve_quality, fight_temp,',
    '   fight_power, updated_at)',
    'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    'ON CONFLICT(role_id) DO UPDATE SET',
    '  pass_boss=excluded.pass_boss,',
    '  pass_team_boss=excluded.pass_team_boss,',
    '  day=excluded.day,',
    '  today_fight_times=excluded.today_fight_times,',
    '  own_fight_times=excluded.own_fight_times,',
    '  help_times=excluded.help_times,',
    '  normal_award_times=excluded.normal_award_times,',
    '  pass_team_award=excluded.pass_team_award,',
    '  award_history=excluded.award_history,',
    '  relic_resolve_quality=excluded.relic_resolve_quality,',
    '  fight_temp=excluded.fight_temp,',
    '  fight_power=excluded.fight_power,',
    '  updated_at=excluded.updated_at'
  ].join('\n')).run(
    state.roleId,
    state.passBoss,
    state.passTeamBoss,
    state.day,
    state.todayFightTimes,
    state.ownFightTimes,
    state.helpTimes,
    state.normalAwardTimes,
    state.passTeamAward.toString('hex'),
    JSON.stringify(state.awardHistory),
    JSON.stringify(state.relicResolveQuality),
    JSON.stringify(state.fightTemp),
    state.fightPower,
    isoSeconds(nowMs)
  );
}

function readMembers(db, leaderId) {
  return db.prepare('SELECT * FROM martial_club_team_member WHERE leader_id=? ORDER BY pos, member_key').all(leaderId)
    .map(row => ({
      memberKey: Number(row.member_key),
      roleId: Number(row.role_id),
      pos: Number(row.pos),
      isReady: row.is_ready === 1,
      isBot: row.is_bot === 1,
      botType: Number(row.bot_type ?? 0),
      needSettle: row.need_settle === 1
    }));
}

function writeMembers(db, leaderId, members) {
  db.prepare('DELETE FROM martial_club_team_member WHERE leader_id=?').run(leaderId);
  const insert = db.prepare('INSERT INTO martial_club_team_member VALUES (?,?,?,?,?,?,?,?)');
  members.forEach((member, index) => insert.run(
    leaderId,
    member.memberKey,
    member.roleId ?? 0,
    index + 1,
    member.isReady ? 1 : 0,
    member.isBot ? 1 : 0,
    member.botType ?? 0,
    member.needSettle ? 1 : 0
  ));
}

function readTeam(db, leaderId) {
  const row = db.prepare('SELECT * FROM martial_club_team WHERE leader_id=?').get(leaderId);
  if (!row) return null;
  return {
    leaderId: Number(row.leader_id),
    bossTid: Number(row.boss_tid),
    fightPowerLimit: Number(row.fight_power_limit ?? 0),
    enterLimitType: Number(row.enter_limit_type ?? 0),
    isHelp: row.is_help === 1,
    inviteAll: row.invite_all === 1,
    inviteRoles: parseJson(row.invite_roles, []).map(Number).filter(Number.isSafeInteger),
    chatChannelId: Number(row.chat_channel_id ?? 0),
    fightResult: parseJson(row.fight_result, null),
    botAddedAt: row.bot_added_at || '',
    inviteAllAt: row.invite_all_at || '',
    updatedAt: row.updated_at || '',
    members: readMembers(db, leaderId)
  };
}

function writeTeam(db, team, nowMs) {
  db.prepare([
    'INSERT INTO martial_club_team',
    '  (leader_id, boss_tid, fight_power_limit, enter_limit_type, is_help, invite_all, invite_roles,',
    '   chat_channel_id, fight_result, bot_added_at, invite_all_at, updated_at)',
    'VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    'ON CONFLICT(leader_id) DO UPDATE SET',
    '  boss_tid=excluded.boss_tid,',
    '  fight_power_limit=excluded.fight_power_limit,',
    '  enter_limit_type=excluded.enter_limit_type,',
    '  is_help=excluded.is_help,',
    '  invite_all=excluded.invite_all,',
    '  invite_roles=excluded.invite_roles,',
    '  chat_channel_id=excluded.chat_channel_id,',
    '  fight_result=excluded.fight_result,',
    '  bot_added_at=excluded.bot_added_at,',
    '  invite_all_at=excluded.invite_all_at,',
    '  updated_at=excluded.updated_at'
  ].join('\n')).run(
    team.leaderId,
    team.bossTid,
    team.fightPowerLimit,
    team.enterLimitType,
    team.isHelp ? 1 : 0,
    team.inviteAll ? 1 : 0,
    JSON.stringify(team.inviteRoles ?? []),
    team.chatChannelId ?? 0,
    JSON.stringify(team.fightResult ?? null),
    team.botAddedAt || '',
    team.inviteAllAt || '',
    isoSeconds(nowMs)
  );
  writeMembers(db, team.leaderId, team.members ?? []);
}

function deleteTeam(db, leaderId) {
  db.prepare('DELETE FROM martial_club_team_member WHERE leader_id=?').run(leaderId);
  db.prepare('DELETE FROM martial_club_team WHERE leader_id=?').run(leaderId);
}

function teamOfRole(db, roleId) {
  const row = db.prepare('SELECT leader_id FROM martial_club_team_member WHERE role_id=? AND is_bot=0').get(roleId);
  return row ? readTeam(db, Number(row.leader_id)) : null;
}

export function createMartialClubService({
  store,
  codec,
  tables = readMartialClubTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {},
  enemyRoster = null
}) {
  const log = event => { try { logger(event); } catch { /* logging must never fail a command */ } };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.teams?.size) throw new Error('Martial club configuration is unavailable');
  const allowedPerDay = Math.max(1, Number(tables.teamConst.challengeCountPerDay ?? 1));
  const maxMembers = Math.max(2, Number(tables.teamConst.maxMembers ?? 4));
  const maxNpcCount = Math.max(0, Number(tables.teamConst.maxNpcCount ?? 0));
  const inviteCd = Math.max(0, Number(tables.teamConst.inviteCd ?? 0));
  const inviteAllCd = Math.max(0, Number(tables.teamConst.inviteAllCd ?? 0));
  const addBotCd = Math.max(0, Number(tables.teamConst.addBotCd ?? 0));
  const queryTeamMax = Math.max(1, Number(tables.teamConst.queryTeamMax ?? 1));

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  function bossOf(bossTid) {
    const boss = tables.clubBosses.get(Number(bossTid));
    if (!boss) fail(CODE_STATE, 'Martial club boss configuration is missing: ' + bossTid);
    return boss;
  }

  function teamConfigOf(bossTid) {
    const row = tables.teams.get(Number(bossTid));
    if (!row) fail(CODE_STATE, 'Martial club team configuration is missing: ' + bossTid);
    return row;
  }

  // EnterLimitType rows are the join conditions the client offers when creating a team. A value of
  // 0 means "no restriction" (the client always ships an explicit row for the unrestricted case).
  function checkEnterLimit(limitType) {
    if (limitType === 0) return 0;
    if (!tables.enterLimitTypes.has(limitType)) fail(CODE_INVALID, 'Martial club enter limit type is invalid');
    return limitType;
  }

  // pb_martial_club_team.fight_power_limit is compared with the joining role power by the client
  // (MartialClubTeamMgr.CheckCanJoinTeam), so it must be one of the configured thresholds.
  function checkPowerLimit(powerLimit, teamConfig) {
    if (powerLimit === 0) return 0;
    const limits = (teamConfig.powerLimits ?? []).map(entry => entry.powerLimit);
    if (!limits.includes(powerLimit)) fail(CODE_INVALID, 'Martial club power limit is not configured');
    return powerLimit;
  }

  function rolePayloadOf(state, nowMs) {
    return {
      pass_boss: state.passBoss,
      daily_refresh_sec: nextDailyRefreshSeconds(nowMs),
      award_history: state.awardHistory.map(entry => ({
        tid: Number(entry.tid ?? 0),
        success_times: Number(entry.successTimes ?? entry.success_times ?? 0),
        award: (entry.award ?? []).map(pair => ({ tid: String(pair[0]), num: String(pair[1]) }))
      })),
      pass_team_boss: state.passTeamBoss,
      pass_team_award: state.passTeamAward,
      normal_award_times: state.normalAwardTimes,
      help_times: state.helpTimes,
      today_fight_times: String(state.todayFightTimes),
      fight_temp: state.fightTemp
        ? { tid: String(state.fightTemp.tid ?? 0), is_win: state.fightTemp.isWin === true }
        : undefined,
      own_fight_times: String(state.ownFightTimes),
      relic_resolve_quality_list: state.relicResolveQuality
    };
  }

  function memberPacket(team, member, state) {
    const costLack = !member.isBot && state.ownFightTimes <= state.todayFightTimes;
    return {
      role_id: String(member.isBot ? 0 : member.roleId),
      is_ready: member.isReady,
      is_help: !member.isBot && member.roleId !== team.leaderId && team.isHelp,
      is_bot: member.isBot,
      need_settle: member.needSettle,
      is_cost_lack: costLack,
      bot_type: String(member.botType ?? 0)
    };
  }

  function fightResultPacket(team) {
    if (!team.fightResult) return undefined;
    const reports = (team.fightResult.reports ?? []).map(hex => {
      try {
        return codec.unpack('pb_fight_report', Buffer.from(hex, 'hex'));
      } catch {
        return null;
      }
    }).filter(Boolean);
    return {
      is_win: team.fightResult.isWin === true,
      need_settle: team.fightResult.needSettle === true,
      roles_count: Number(team.fightResult.rolesCount ?? team.members.length),
      stamp: Number(team.fightResult.stamp ?? 0),
      reports
    };
  }

  function teamPacket(team, state) {
    return {
      leader_id: String(team.leaderId),
      fight_tid: String(team.bossTid),
      fight_power_limit: String(team.fightPowerLimit),
      enter_limit_type: team.enterLimitType,
      members: team.members.map(member => memberPacket(team, member, state)),
      timestamp: Number(team.stamp ?? (Math.floor(new Date(team.updatedAt || 0).getTime() / 1000) || 0)),
      invite_roles: team.inviteRoles.map(String),
      invite_all: team.inviteAll,
      friend_add_count: 0,
      fight_result: fightResultPacket(team),
      rank_seq: 0,
      chat_channel_id: String(team.chatChannelId ?? 0)
    };
  }

  function emptyTeamPacket() {
    return {
      leader_id: '0',
      fight_tid: '0',
      fight_power_limit: '0',
      enter_limit_type: 0,
      members: [],
      timestamp: 0,
      invite_roles: [],
      invite_all: false,
      friend_add_count: 0,
      rank_seq: 0,
      chat_channel_id: '0'
    };
  }

  function teamResponse(team, state) {
    const packet = team ? teamPacket(team, state) : emptyTeamPacket();
    return { value: { leaderId: packet.leader_id, members: packet.members.length, bossTid: packet.fight_tid }, data: codec.pack('pb_martial_club_team', packet) };
  }

  function resPacket(changes) {
    return { changes: changes ?? [], is_overflow: false };
  }

  function requireTeam(db, roleId) {
    const team = teamOfRole(db, roleId);
    if (!team) fail(CODE_STATE, 'Martial club team is not joined');
    return team;
  }

  function requireLeader(team, roleId) {
    if (team.leaderId !== roleId) fail(CODE_STATE, 'Martial club team is owned by another role');
    return team;
  }

  function remainingFights(state) {
    return Math.max(0, state.ownFightTimes - state.todayFightTimes);
  }

  function claimed(db, roleId, type, key) {
    return !!db.prepare('SELECT 1 FROM martial_club_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(roleId, type, key);
  }

  function recordClaim(db, roleId, type, key, createdAt) {
    db.prepare('INSERT OR IGNORE INTO martial_club_claims VALUES (?,?,?,?)').run(roleId, type, key, createdAt);
  }

  function claimTime(db, roleId, type, key) {
    const row = db.prepare('SELECT created_at FROM martial_club_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(roleId, type, key);
    return row?.created_at ?? null;
  }

  function secondsSince(stamp, nowMs) {
    if (!stamp) return Number.MAX_SAFE_INTEGER;
    const value = new Date(stamp).getTime();
    if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER;
    return Math.floor((Number(nowMs) - value) / 1000);
  }

  function awardHistoryOf(state, bossTid) {
    return state.awardHistory.find(entry => Number(entry.tid) === Number(bossTid)) ?? null;
  }

  function recordAwardHistory(state, bossTid, award) {
    let entry = awardHistoryOf(state, bossTid);
    if (!entry) {
      entry = { tid: bossTid, successTimes: 0, award: [] };
      state.awardHistory.push(entry);
    }
    entry.successTimes += 1;
    entry.award = award.map(pair => [Number(pair[0]), Number(pair[1])]);
  }

  // ---------------------------------------------------------------- commands

  function firstAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      let bits = Buffer.from(state.passTeamAward);
      const pending = [];
      for (const boss of tables.clubBosses.values()) {
        if (Number(boss.tid) > state.passBoss) continue;
        if (hasBit(bits, Number(boss.tid))) continue;
        if (!boss.firstAward.length) continue;
        pending.push(boss);
        bits = setBit(bits, Number(boss.tid));
      }
      if (!pending.length) fail(CODE_LIMIT, 'Martial club first awards are already received');
      const reward = grantResources(model, pending.flatMap(boss => boss.firstAward), resourceTables());
      state.passTeamAward = bits;
      writeRole(db, state, nowMs);
      log({ event: 'martial_club_first_award_committed', bosses: pending.map(boss => boss.tid), changes: reward.changes.length });
      return {
        value: { bosses: pending.map(boss => boss.tid), changes: reward.changes.length },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  function createTeam(input) {
    const bossTid = integer(input?.fight_tid ?? input?.bossId ?? input?.boss_id, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    const teamConfig = teamConfigOf(bossTid);
    bossOf(bossTid);
    const powerLimit = checkPowerLimit(optionalInteger(input?.fight_power_limit, 0, Number.MAX_SAFE_INTEGER, 'Invalid martial club power limit') ?? 0, teamConfig);
    const enterLimitType = checkEnterLimit(optionalInteger(input?.enter_limit_type, 0, Number.MAX_SAFE_INTEGER, 'Invalid martial club enter limit type') ?? 0);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      if (remainingFights(state) <= 0) fail(CODE_LIMIT, 'Martial club challenge count is insufficient');
      const existing = teamOfRole(db, roleId);
      if (existing) fail(CODE_STATE, 'Martial club team already exists');
      const team = {
        leaderId: roleId,
        bossTid,
        fightPowerLimit: powerLimit,
        enterLimitType,
        isHelp: false,
        inviteAll: false,
        inviteRoles: [],
        chatChannelId: 0,
        fightResult: null,
        botAddedAt: '',
        inviteAllAt: '',
        updatedAt: isoSeconds(nowMs),
        members: [{ memberKey: roleId, roleId, isReady: false, isBot: false, botType: 0, needSettle: false }]
      };
      writeTeam(db, team, nowMs);
      writeRole(db, state, nowMs);
      log({ event: 'martial_club_team_created', bossTid, powerLimit, enterLimitType });
      return { ...teamResponse(readTeam(db, roleId), state), value: { leaderId: String(roleId), bossTid, powerLimit } };
    });
  }

  function addBot() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      const botCount = team.members.filter(member => member.isBot).length;
      if (botCount >= maxNpcCount) fail(CODE_LIMIT, 'Martial club team robot count is full');
      if (team.members.length >= maxMembers) fail(CODE_LIMIT, 'Martial club team is full');
      if (secondsSince(team.botAddedAt, nowMs) < addBotCd) fail(CODE_LIMIT, 'Martial club robot request is cooling down');
      const nextKey = Math.min(0, ...team.members.map(member => member.memberKey)) - 1;
      const nextBotType = botCount + 1;
      team.members.push({
        memberKey: nextKey,
        roleId: 0,
        isReady: true,
        isBot: true,
        botType: nextBotType,
        needSettle: false
      });
      team.botAddedAt = isoSeconds(nowMs);
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_bot_added', botType: nextBotType, members: team.members.length });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  function setHelp(input) {
    const isHelp = input === true || Number(input) === 1 || (input && (input.is_help === true || input.isHelp === true));
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      team.isHelp = isHelp;
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_help_updated', isHelp });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  function joinTeam(input) {
    const list = Array.isArray(input) ? input : [input];
    const bossTid = integer(list[0], 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    const leaderId = integer(list[1], 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club leader id');

    return store.transaction((dbModel, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = dbModel.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      if (remainingFights(state) <= 0) fail(CODE_LIMIT, 'Martial club challenge count is insufficient');
      const team = readTeam(db, leaderId);
      if (!team) fail(CODE_STATE, 'Martial club team is not found');
      if (Number(team.bossTid) !== bossTid) fail(CODE_STATE, 'Martial club team does not match the requested boss');
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      if (team.members.length >= maxMembers) fail(CODE_LIMIT, 'Martial club team is full');
      if (team.members.some(member => !member.isBot && Number(member.roleId) === roleId)) fail(CODE_LIMIT, 'Martial club team is already joined');
      const current = teamOfRole(db, roleId);
      if (current) fail(CODE_STATE, 'Martial club team is already joined');
      if (team.fightPowerLimit > 0 && state.fightPower < team.fightPowerLimit) {
        fail(CODE_STATE, 'Martial club power limit is not reached');
      }
      team.members.push({ memberKey: roleId, roleId, isReady: false, isBot: false, botType: 0, needSettle: false });
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_team_joined', leaderId, bossTid });
      return teamResponse(readTeam(db, leaderId), state);
    });
  }

  function exitTeam() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireTeam(db, roleId);
      if (team.leaderId === roleId) {
        deleteTeam(db, team.leaderId);
        log({ event: 'martial_club_team_disbanded', leaderId: team.leaderId });
        return teamResponse(null, state);
      }
      team.members = team.members.filter(member => Number(member.roleId) !== roleId || member.isBot);
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_team_left', leaderId: team.leaderId });
      return teamResponse(null, state);
    });
  }

  function teamInfo(input) {
    const bossTid = integer(Array.isArray(input) ? input[0] : (input?.fight_tid ?? input), 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    bossOf(bossTid);
    return store.inspect((db) => {
      ensureTables(db);
      const nowMs = now();
      const rows = db.prepare('SELECT leader_id FROM martial_club_team WHERE boss_tid=? ORDER BY updated_at LIMIT ?').all(bossTid, queryTeamMax);
      const teams = rows.map((row) => {
        const team = readTeam(db, Number(row.leader_id));
        return teamPacket(team, readRole(db, team.leaderId, nowMs, allowedPerDay));
      });
      return { data: codec.pack('pb_martial_club_team_rsp', { teams }), value: { bossTid, teams: teams.length } };
    });
  }

  function setTeamInfo(input) {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      const config = teamConfigOf(team.bossTid);
      const powerLimit = checkPowerLimit(optionalInteger(input?.fight_power_limit, 0, Number.MAX_SAFE_INTEGER, 'Invalid martial club power limit') ?? team.fightPowerLimit, config);
      const enterLimitType = checkEnterLimit(optionalInteger(input?.enter_limit_type, 0, Number.MAX_SAFE_INTEGER, 'Invalid martial club enter limit type') ?? team.enterLimitType);
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      team.fightPowerLimit = powerLimit;
      team.enterLimitType = enterLimitType;
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_team_info_updated', powerLimit, enterLimitType });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  function setReady(input) {
    const raw = Array.isArray(input) ? input[0] : input;
    const isReady = raw === true || Number(raw) === 1 || (raw && (raw.is_ready === true || raw.isReady === true));
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireTeam(db, roleId);
      const member = team.members.find(entry => !entry.isBot && Number(entry.roleId) === roleId);
      if (!member) fail(CODE_STATE, 'Martial club team member is not found');
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      member.isReady = isReady;
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_ready_updated', isReady });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  function invite(input) {
    const raw = Array.isArray(input) ? input[0] : input;
    const inviteeId = integer(raw?.role_id ?? raw?.roleId ?? raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club invite role id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      if (inviteeId === roleId) fail(CODE_INVALID, 'Martial club cannot invite itself');
      const inviteKey = 'invite:' + inviteeId;
      if (secondsSince(claimTime(db, roleId, 'mc_invite', inviteKey), nowMs) < inviteCd) {
        fail(CODE_LIMIT, 'Martial club invite is cooling down');
      }
      recordClaim(db, roleId, 'mc_invite', inviteKey, isoSeconds(nowMs));
      if (!team.inviteRoles.includes(inviteeId)) team.inviteRoles.push(inviteeId);
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_invite_sent', inviteeId, members: team.members.length });
      return { value: { inviteeId }, data: Buffer.alloc(0) };
    });
  }

  function inviteAll() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      if (secondsSince(team.inviteAllAt, nowMs) < inviteAllCd) fail(CODE_LIMIT, 'Martial club invite all is cooling down');
      team.inviteAll = true;
      team.inviteAllAt = isoSeconds(nowMs);
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_invite_all_sent', bossTid: team.bossTid, viewers: state.passBoss });
      return { value: { bossTid: team.bossTid }, data: Buffer.alloc(0) };
    });
  }

  function setMemberPos(input) {
    const list = (input?.role_ids ?? input?.roleIds ?? []).map(value => Number(value));
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      const humans = team.members.filter(member => !member.isBot);
      const bots = team.members.filter(member => member.isBot);
      if (list.length !== humans.length) fail(CODE_INVALID, 'Martial club member position list is invalid');
      const byRole = new Map(humans.map(member => [Number(member.roleId), member]));
      const ordered = [];
      for (const id of list) {
        const member = byRole.get(id);
        if (!member || ordered.includes(member)) fail(CODE_INVALID, 'Martial club member position list is invalid');
        ordered.push(member);
      }
      team.members = [...ordered, ...bots];
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_member_pos_updated', order: list });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  // Each team boss reports how many roles already own a team clear; the client keeps this in
  // bossPassCountDic and asks for a refresh when a teammate finishes. The reply schema is not in the
  // static catalogue, so the aggregate is computed from the authoritative rows and only logged.
  function passCount(input) {
    const raw = Array.isArray(input) ? input[0] : (input?.boss_id ?? input?.bossId ?? input);
    const bossTid = optionalInteger(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    return store.inspect((db) => {
      ensureTables(db);
      const rows = bossTid
        ? db.prepare('SELECT COUNT(*) AS total FROM martial_club_role WHERE pass_team_boss>=?').all(bossTid)
        : db.prepare('SELECT pass_team_boss AS tid, COUNT(*) AS total FROM martial_club_role GROUP BY pass_team_boss').all();
      log({ event: 'martial_club_pass_count_read', bossTid, rows: rows.length });
      return { value: { bossTid, counts: rows.map(row => ({ tid: Number(row.tid ?? bossTid ?? 0), total: Number(row.total ?? 0) })) }, data: Buffer.alloc(0) };
    });
  }

  function teamKick(input) {
    const raw = Array.isArray(input) ? input[0] : input;
    const targetId = integer(raw?.role_id ?? raw?.roleId ?? raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club kick role id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is fighting');
      if (targetId === roleId) fail(CODE_INVALID, 'Martial club leader cannot kick itself');
      const before = team.members.length;
      team.members = team.members.filter(member => member.isBot || Number(member.roleId) !== targetId);
      if (team.members.length === before) fail(CODE_STATE, 'Martial club team member is not found');
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_member_kicked', targetId });
      return teamResponse(readTeam(db, roleId), state);
    });
  }

  function teamFight() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      const config = teamConfigOf(team.bossTid);
      if (team.fightResult) fail(CODE_STATE, 'Martial club team is already fighting');
      if (remainingFights(state) <= 0) fail(CODE_LIMIT, 'Martial club challenge count is insufficient');
      const humans = team.members.filter(member => !member.isBot);
      if (humans.some(member => !member.isReady)) fail(CODE_STATE, 'Martial club team member is not ready');
      if (!team.members.length) fail(CODE_STATE, 'Martial club team is empty');
      const attacker = rosterFor({ model, lineupType: 1 });
      let supplied = null;
      if (enemyRoster) supplied = enemyRoster({ bossTid: team.bossTid, fightTid: config.fightId, team: teamPacket(team, state) });
      const entries = Array.isArray(supplied) ? supplied : supplied?.entries;
      if (!entries?.length) fail(CODE_STATE, 'Martial club boss roster is not supplied by the deployment');
      const nowSeconds = seconds(nowMs);
      const battle = simulatePvpBattle({
        codec,
        attacker,
        defender: { entries },
        seedText: ['martial-club', team.bossTid, roleId, nowSeconds, state.todayFightTimes].join(':')
      });
      const report = buildFightReport({
        id: String(nowMs),
        fightTid: config.fightId,
        reportType: 1,
        atkRoleId: roleId,
        defRoleId: 0,
        battle: battle.battle,
        result: battle.battle.result,
        nowSeconds,
        requestBytes: Buffer.alloc(0)
      });
      const reportBytes = codec.pack('pb_fight_report', report);
      team.fightResult = {
        isWin: battle.won,
        needSettle: true,
        stamp: nowSeconds,
        rolesCount: team.members.length,
        reports: [reportBytes.toString('hex')],
        skipped: false
      };
      team.members = team.members.map(member => ({ ...member, needSettle: true }));
      state.todayFightTimes += 1;
      state.fightTemp = { tid: team.bossTid, isWin: battle.won };
      state.fightPower = battle.atkPower;
      writeTeam(db, team, nowMs);
      writeRole(db, state, nowMs);
      log({
        event: 'martial_club_team_fight_committed',
        bossTid: team.bossTid,
        won: battle.won,
        rounds: battle.simulation.overRound,
        atkPower: battle.atkPower,
        defPower: battle.defPower,
        remaining: remainingFights(state)
      });
      const packet = teamPacket(readTeam(db, roleId), state);
      return {
        value: { bossTid: team.bossTid, won: battle.won, rounds: battle.simulation.overRound },
        data: codec.pack('pb_martial_club_team_fight_rsp', { report_list: [report], is_win: battle.won, team: packet })
      };
    });
  }

  // Atmosphere NPC ids decorate the team forming scene; the client stores them per team and the
  // reply schema is not recorded, so the command only refreshes the authoritative team timestamp.
  function botList() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const team = requireTeam(db, roleId);
      const bots = team.members.filter(member => member.isBot);
      log({ event: 'martial_club_bot_list_read', bots: bots.length, atmospherePool: 0 });
      return { value: { bots: bots.length }, data: Buffer.alloc(0) };
    });
  }

  function giveUp() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      if (!team.fightResult) fail(CODE_STATE, 'Martial club team is not fighting');
      team.fightResult = null;
      team.members = team.members.map(member => ({ ...member, needSettle: false }));
      writeTeam(db, team, nowMs);
      state.fightTemp = null;
      writeRole(db, state, nowMs);
      log({ event: 'martial_club_team_gave_up', bossTid: team.bossTid });
      return { value: { bossTid: team.bossTid }, data: Buffer.alloc(0) };
    });
  }

  function settlement() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const team = requireLeader(requireTeam(db, roleId), roleId);
      const config = teamConfigOf(team.bossTid);
      const result = team.fightResult;
      if (!result) fail(CODE_STATE, 'Martial club team is not fighting');
      let changes = [];
      if (result.isWin === true) {
        if (state.passTeamBoss < Number(team.bossTid)) {
          if (!config.firstAward.length) fail(CODE_STATE, 'Martial club team first award configuration is empty');
          const reward = grantResources(model, config.firstAward, resourceTables());
          changes = reward.changes;
          state.passTeamBoss = Number(team.bossTid);
          recordAwardHistory(state, team.bossTid, config.firstAward);
          log({ event: 'martial_club_team_first_pass_award', bossTid: team.bossTid, changes: changes.length });
        } else {
          state.normalAwardTimes += 1;
          recordAwardHistory(state, team.bossTid, []);
          log({ event: 'martial_club_team_repeat_pass', bossTid: team.bossTid, repeatAward: 'not-configured' });
        }
      }
      team.fightResult = null;
      team.members = team.members.map(member => ({ ...member, needSettle: false }));
      writeTeam(db, team, nowMs);
      writeRole(db, state, nowMs);
      const value = {
        daily_refresh_sec: nextDailyRefreshSeconds(nowMs),
        award_history: rolePayloadOf(state, nowMs).award_history,
        pass_team_boss: state.passTeamBoss,
        help_times: state.helpTimes,
        res_change: resPacket(changes),
        today_fight_times: String(state.todayFightTimes),
        own_fight_times: String(state.ownFightTimes)
      };
      return {
        value: { bossTid: team.bossTid, won: result.isWin === true, changes: changes.length, passTeamBoss: state.passTeamBoss },
        data: codec.pack('pb_martial_club_team_settle_rsp', value)
      };
    });
  }

  function teamMembers(input) {
    const teamId = integer(input?.team_id ?? input?.teamId ?? input?.fight_tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club team id');
    return store.inspect((db) => {
      ensureTables(db);
      const team = readTeam(db, teamId);
      const roleIds = team ? team.members.filter(member => !member.isBot).map(member => String(member.roleId)) : [];
      return { value: { teamId, members: roleIds.length }, data: codec.pack('pb_martial_club_members_rsp', { role_ids: roleIds }) };
    });
  }

  function teamSkip() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const team = requireTeam(db, roleId);
      if (!team.fightResult) fail(CODE_STATE, 'Martial club team is not fighting');
      team.fightResult = { ...team.fightResult, skipped: true };
      writeTeam(db, team, nowMs);
      log({ event: 'martial_club_team_skipped', bossTid: team.bossTid, roleId });
      return { value: { bossTid: team.bossTid, skipped: true }, data: Buffer.alloc(0) };
    });
  }

  function employList(input) {
    const raw = Array.isArray(input) ? input[0] : (input?.boss_id ?? input?.bossId ?? input);
    const bossTid = optionalInteger(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    return store.inspect((db) => {
      ensureTables(db);
      const rows = bossTid
        ? db.prepare('SELECT role_id FROM martial_club_role WHERE pass_team_boss>=? ORDER BY role_id LIMIT ?').all(bossTid, queryTeamMax)
        : db.prepare('SELECT role_id FROM martial_club_role ORDER BY role_id LIMIT ?').all(queryTeamMax);
      const roleIds = rows.map(row => String(row.role_id));
      return { value: { bossTid, roles: roleIds.length }, data: codec.pack('pb_martial_club_employ_rsp', { role_ids: roleIds }) };
    });
  }

  function employEnter(input) {
    const raw = Array.isArray(input) ? input[0] : input;
    const targetId = integer(raw?.role_id ?? raw?.roleId ?? raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club employ role id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      if (targetId === roleId) fail(CODE_INVALID, 'Martial club cannot employ itself');
      const target = db.prepare('SELECT role_id, pass_team_boss FROM martial_club_role WHERE role_id=?').get(targetId);
      if (!target) fail(CODE_STATE, 'Martial club employ role is not available');
      const day = dayKey(nowMs);
      const claimKey = targetId + ':' + day;
      if (claimed(db, roleId, 'mc_employ', claimKey)) fail(CODE_LIMIT, 'Martial club employ request was already settled');
      recordClaim(db, roleId, 'mc_employ', claimKey, isoSeconds(nowMs));
      const row = db.prepare('SELECT * FROM martial_club_employ WHERE role_id=?').get(targetId);
      const todayTimes = row && row.day === day ? Number(row.today_times ?? 0) + 1 : 1;
      const totalTimes = Number(row?.total_times ?? 0) + 1;
      const fightTimes = Number(row?.fight_times ?? 0);
      const winTimes = Number(row?.win_times ?? 0);
      db.prepare([
        'INSERT INTO martial_club_employ (role_id, day, today_times, total_times, fight_times, win_times, updated_at)',
        'VALUES (?,?,?,?,?,?,?)',
        'ON CONFLICT(role_id) DO UPDATE SET',
        '  day=excluded.day, today_times=excluded.today_times, total_times=excluded.total_times,',
        '  fight_times=excluded.fight_times, win_times=excluded.win_times, updated_at=excluded.updated_at'
      ].join('\n')).run(targetId, day, todayTimes, totalTimes, fightTimes, winTimes, isoSeconds(nowMs));
      log({ event: 'martial_club_employ_entered', targetId, todayTimes, totalTimes, employer: roleId });
      return { value: { targetId, todayTimes, totalTimes }, data: Buffer.alloc(0) };
    });
  }

  function match(input) {
    const bossTid = integer(input?.boss_id ?? input?.bossId ?? input?.fight_tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid martial club boss id');
    bossOf(bossTid);
    return store.inspect((db) => {
      ensureTables(db);
      const rows = db.prepare('SELECT role_id, fight_power FROM martial_club_role WHERE pass_team_boss>=? ORDER BY fight_power DESC LIMIT ?').all(bossTid, queryTeamMax);
      const roles = rows.map(row => ({ role_id: String(row.role_id), fight_power: String(row.fight_power ?? 0) }));
      return { value: { bossTid, roles: roles.length }, data: codec.pack('pb_martial_club_match_rsp', { roles }) };
    });
  }

  function relic(input) {
    const list = (input?.quality_list ?? input?.qualityList ?? []).map(value => Number(value));
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const allowed = tables.global.relicQuality ?? [];
      for (const quality of list) {
        if (!Number.isSafeInteger(quality) || quality < 0) fail(CODE_INVALID, 'Martial club relic quality is invalid');
        if (allowed.length && !allowed.includes(quality)) fail(CODE_INVALID, 'Martial club relic quality is not configured');
      }
      state.relicResolveQuality = [...new Set(list)].sort((left, right) => left - right);
      writeRole(db, state, nowMs);
      log({ event: 'martial_club_relic_quality_updated', qualities: state.relicResolveQuality });
      return {
        value: { qualities: state.relicResolveQuality },
        data: codec.pack('pb_martial_club_relic_rsp', { martial_club: rolePayloadOf(state, nowMs) })
      };
    });
  }

  async function execute(type, input) {
    switch (Number(type)) {
      case COMMAND_FIRST_AWARD: return firstAward();
      case COMMAND_CREATE_TEAM: return createTeam(input);
      case COMMAND_ADD_BOT: return addBot();
      case COMMAND_SET_HELP: return setHelp(input);
      case COMMAND_JOIN_TEAM: return joinTeam(input);
      case COMMAND_EXIT_TEAM: return exitTeam();
      case COMMAND_TEAM_INFO: return teamInfo(input);
      case COMMAND_SET_TEAM_INFO: return setTeamInfo(input);
      case COMMAND_SET_READY: return setReady(input);
      case COMMAND_INVITE: return invite(input);
      case COMMAND_INVITE_ALL: return inviteAll();
      case COMMAND_SET_MEMBER_POS: return setMemberPos(input);
      case COMMAND_PASS_COUNT: return passCount(input);
      case COMMAND_TEAM_KICK: return teamKick(input);
      case COMMAND_TEAM_FIGHT: return teamFight();
      case COMMAND_BOT_LIST: return botList();
      case COMMAND_GIVE_UP: return giveUp();
      case COMMAND_SETTLEMENT: return settlement();
      case COMMAND_TEAM_MEMBERS: return teamMembers(input);
      case COMMAND_TEAM_SKIP: return teamSkip();
      case COMMAND_EMPLOY_LIST: return employList(input);
      case COMMAND_EMPLOY_ENTER: return employEnter(input);
      case COMMAND_MATCH: return match(input);
      case COMMAND_RELIC: return relic(input);
      default: fail(CODE_INVALID, 'Unsupported martial club command');
    }
    return null;
  }

  // Login state: the client merges module 123 into MartialClubMgr through LoginParse, which decodes
  // pb_martial_club_role and pb_martial_club_employ_role from the two blocks.
  function ensureLoginState() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      writeRole(db, state, nowMs);
      return { roleId, exists: state.exists };
    });
  }

  function loginPayload() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const state = readRole(db, roleId, nowMs, allowedPerDay);
      const employ = db.prepare('SELECT * FROM martial_club_employ WHERE role_id=?').get(roleId);
      const day = dayKey(nowMs);
      const employPayload = {
        next_refresh_stamp: String(nextDailyRefreshSeconds(nowMs)),
        today_times: String(employ && employ.day === day ? Number(employ.today_times ?? 0) : 0),
        total_times: String(Number(employ?.total_times ?? 0)),
        fight_times: String(Number(employ?.fight_times ?? 0)),
        win_times: String(Number(employ?.win_times ?? 0)),
        employs: [],
        thank_infos: []
      };
      return {
        role: codec.pack('pb_martial_club_role', rolePayloadOf(state, nowMs)),
        employ: codec.pack('pb_martial_club_employ_role', employPayload)
      };
    });
  }

  function roleState(roleId) {
    return store.inspect((db) => {
      ensureTables(db);
      return readRole(db, roleId, now(), allowedPerDay);
    });
  }

  return {
    supports,
    execute,
    firstAward,
    createTeam,
    addBot,
    setHelp,
    joinTeam,
    exitTeam,
    teamInfo,
    setTeamInfo,
    setReady,
    invite,
    inviteAll,
    setMemberPos,
    passCount,
    teamKick,
    teamFight,
    botList,
    giveUp,
    settlement,
    teamMembers,
    teamSkip,
    employList,
    employEnter,
    match,
    relic,
    ensureLoginState,
    loginPayload,
    roleState,
    noResponseCommands: NO_RESPONSE_COMMANDS
  };
}
