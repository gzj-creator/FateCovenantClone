import { binary, rawBinary, serializedBinary, encodeEtf } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

export const GUILD_MODULE_ID = 24;
export const GUILD_JOB = Object.freeze({ PRESIDENT: 1, OFFICER: 2, MEMBER: 6 });
const LOCAL_GUILD_ID = '900001';
const MAX_OFFICERS = 4; // Local fixture policy; the original server limit is not evidenced.

const fail = (code, message) => { throw new GameError(code, message); };

function idText(value, label, { allowZero = false } = {}) {
  const text = typeof value === 'bigint' ? value.toString() : String(value ?? '').trim();
  if (!/^[0-9]+$/.test(text)) fail(1, `Invalid ${label}`);
  let id;
  try { id = BigInt(text); } catch { fail(1, `Invalid ${label}`); }
  if (id < 0n || (!allowZero && id === 0n)) fail(1, `Invalid ${label}`);
  return id.toString();
}

function optionalGuildId(value) {
  if (value === undefined || value === null || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return idText(value, 'guild id');
}

function seedLogin(model) {
  // The original server has no guild data for this offline fixture, so the
  // login state starts with one deterministic local guild owned by the actor.
  const actor = idText(model.state.roleId, 'role id');
  const roleId = BigInt(actor);
  const member = (role, job, offset) => ({ role_id: role, job, join_time: String(BigInt(model.state.createdAt) + BigInt(offset)) });
  const members = [
    member(actor, GUILD_JOB.PRESIDENT, 0),
    member(String(roleId + 1n), GUILD_JOB.OFFICER, 1),
    member(String(roleId + 2n), GUILD_JOB.MEMBER, 2),
    member(String(roleId + 3n), GUILD_JOB.MEMBER, 3),
    member(String(roleId + 4n), GUILD_JOB.MEMBER, 4)
  ];
  return {
    guildId: LOCAL_GUILD_ID,
    last_leave_time: 0,
    leave_count: Buffer.alloc(0),
    guild: {
      id: LOCAL_GUILD_ID,
      level: 1,
      exp: 0,
      badge: 1,
      notice: 'Local guild roster',
      active: 0,
      name: 'Local Covenant',
      server_id: model.state.serverId,
      audit_type: 2,
      member_list: members,
      apply_list: []
    },
    guild_applies: []
  };
}

function moduleFrom(model) {
  return new Map((model.state ?? model).modules.value).get(GUILD_MODULE_ID);
}

function writeModule(model, codec, value) {
  const modules = new Map(model.state.modules.value);
  modules.set(GUILD_MODULE_ID, serializedBinary(codec.pack('pb_res_guild_login', value)));
  model.state.modules.value = [...modules];
}

function writeModuleBytes(model, bytes) {
  const modules = new Map(model.state.modules.value);
  modules.set(GUILD_MODULE_ID, serializedBinary(bytes));
  model.state.modules.value = [...modules];
}

function isUninitialized(module, codec) {
  if (!module) return true;
  const bytes = rawBinary(module);
  if (!bytes.length) return true;
  const value = codec.unpack('pb_res_guild_login', bytes);
  return value.guildId === undefined && value.guild === undefined && value.last_leave_time === undefined;
}

function readLogin(model, codec) {
  const module = moduleFrom(model);
  if (!module) fail(5, 'Guild login state is missing');
  try {
    return codec.unpack('pb_res_guild_login', rawBinary(module));
  } catch {
    fail(5, 'Guild login state is invalid');
  }
}

function currentGuild(model, codec) {
  const login = readLogin(model, codec);
  const guildId = idText(login.guildId ?? '0', 'guild id', { allowZero: true });
  if (guildId === '0' || !login.guild) fail(5, 'Guild does not exist');
  if (!Array.isArray(login.guild.member_list)) login.guild.member_list = [];
  return { login, guildId, guild: login.guild };
}

function memberById(guild, roleId) {
  return guild.member_list.find(member => idText(member.role_id, 'member role id') === roleId);
}

function actorMember(model, guild) {
  return memberById(guild, idText((model.state ?? model).roleId, 'role id'));
}

function assertGuildMatches(value, guildId) {
  const supplied = optionalGuildId(value);
  if (supplied && supplied !== guildId) fail(5, 'Guild id does not match the current guild');
}

export function createGuildRosterService({ store, codec, now = () => Math.floor(Date.now() / 1000), encodeResponse = encodeEtf, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const nowSeconds = () => Math.max(0, Math.trunc(Number(now())));

  function ensureLoginState() {
    log({ event: 'guild_roster_ensureLoginState_entry' });
    return store.transaction(model => {
      const module = moduleFrom(model);
      if (!isUninitialized(module, codec)) return false;
      writeModule(model, codec, seedLogin(model));
      return true;
    });
  }

  function loginPayload() {
    const state = store.state();
    const login = readLogin(state, codec);
    return codec.pack('pb_res_guild_login', login);
  }

  function queryGuild(input) {
    const state = store.state();
    const { login, guildId, guild } = currentGuild(state, codec);
    assertGuildMatches(Array.isArray(input) ? input[0] : input, guildId);
    const value = structuredClone(guild);
    return { data: codec.pack('pb_guild', value), value, login };
  }

  function change(type, input) {
    return store.transaction(model => {
      const { login, guildId, guild } = currentGuild(model, codec);
      const actor = actorMember(model, guild);
      if (!actor) fail(5, 'Current role is not a guild member');

      if (type === 21006) {
        if (!Array.isArray(input) || input.length !== 2) fail(1, 'Invalid expel-member payload');
        assertGuildMatches(input[0], guildId);
        const targetId = idText(input[1], 'target role id');
        if (targetId === idText(model.state.roleId, 'role id')) fail(5, 'Cannot expel the current role');
        if (![GUILD_JOB.PRESIDENT, GUILD_JOB.OFFICER].includes(Number(actor.job))) fail(5, 'No permission to expel guild members');
        const target = memberById(guild, targetId);
        if (!target) fail(5, 'Guild member does not exist');
        if (Number(target.job) <= Number(actor.job)) fail(5, 'Cannot expel a member of equal or higher rank');
        guild.member_list = guild.member_list.filter(member => idText(member.role_id, 'member role id') !== targetId);
      } else if (type === 21010) {
        if (!Array.isArray(input) || ![2, 3].includes(input.length)) fail(1, 'Invalid guild-job payload');
        if (Number(actor.job) !== GUILD_JOB.PRESIDENT) fail(5, 'Only the president may change guild jobs');
        let targetIdValue, job;
        if (input.length === 3) {
          assertGuildMatches(input[0], guildId);
          targetIdValue = input[1];
          job = Number(input[2]);
        } else {
          targetIdValue = input[0];
          job = Number(input[1]);
        }
        const targetId = idText(targetIdValue, 'target role id');
        if (targetId === idText(model.state.roleId, 'role id')) fail(5, 'Cannot change the current president job');
        const target = memberById(guild, targetId);
        if (!target) fail(5, 'Guild member does not exist');
        if (job === GUILD_JOB.PRESIDENT) {
          if (input.length !== 3) fail(1, 'President transfer requires the guild id');
          if (Number(actor.job) !== GUILD_JOB.PRESIDENT) fail(5, 'Only the president may transfer leadership');
          target.job = GUILD_JOB.PRESIDENT;
          // The request proves the new president's job. The former president's
          // fallback rank is a local rule until the server response is observed.
          actor.job = GUILD_JOB.MEMBER;
        } else if (job === GUILD_JOB.OFFICER) {
          if (Number(target.job) !== GUILD_JOB.MEMBER) fail(5, 'Only a member can be appointed officer');
          if (guild.member_list.filter(member => Number(member.job) === GUILD_JOB.OFFICER).length >= MAX_OFFICERS) fail(5, 'Guild officer limit reached');
          target.job = GUILD_JOB.OFFICER;
        } else if (job === GUILD_JOB.MEMBER) {
          if (Number(target.job) !== GUILD_JOB.OFFICER) fail(5, 'Only an officer can be demoted');
          target.job = GUILD_JOB.MEMBER;
        } else {
          fail(1, 'Unsupported guild job change');
        }
      } else {
        fail(1, 'Invalid guild roster command');
      }

      writeModule(model, codec, login);
      const members = structuredClone(guild.member_list);
      return { data: Buffer.alloc(0), value: { members }, pushes: [{ type: 2305, data: codec.pack('pb_res_guild_member_change', { member_list: members, log_list: [] }) }] };
    });
  }

  function planLeave(model, input, leaveTime) {
    const { login, guildId, guild } = currentGuild(model, codec);
    assertGuildMatches(input, guildId);
    const actor = actorMember(model, guild);
    if (!actor) fail(5, 'Current role is not a guild member');
    if (Number(actor.job) === GUILD_JOB.PRESIDENT) fail(5, 'The president cannot leave without transferring leadership');
    const sourceBytes = codec.pack('pb_res_guild_login', login);
    const actorId = idText((model.state ?? model).roleId, 'role id');
    guild.member_list = guild.member_list.filter(member => idText(member.role_id, 'member role id') !== actorId);
    const previous = login.leave_count?.length ? codec.unpack('pb_guild_leave', Buffer.from(login.leave_count, 'base64')) : { count: 0, reset_day: 0 };
    const leaveInfo = { count: Number(previous.count ?? 0) + 1, reset_day: Number(previous.reset_day ?? 0) };
    login.guildId = '0';
    login.last_leave_time = leaveTime;
    login.leave_count = codec.pack('pb_guild_leave', leaveInfo);
    delete login.guild;
    login.guild_applies = [];
    const members = structuredClone(guild.member_list);
    return {
      leaveInfo,
      members,
      sourceBytes,
      loginBytes: codec.pack('pb_res_guild_login', login),
      data: codec.pack('pb_guild_leave', leaveInfo),
      pushData: codec.pack('pb_res_guild_member_change', { member_list: members, log_list: [] })
    };
  }

  async function leave(input) {
    const leaveTime = nowSeconds();
    // ETF serialization is asynchronous while game-store transactions are
    // synchronous. Encode the prospective response first, then use module 24's
    // canonical bytes as a compare-and-swap token inside the write transaction.
    // A concurrent roster change invalidates the plan and is retried from fresh
    // state instead of committing a stale response.
    for (let attempt = 0; attempt < 3; attempt++) {
      const planned = planLeave(store.state(), input, leaveTime);
      const responseData = await encodeResponse([binary(planned.data)]);
      const commit = store.transaction(model => {
        const current = planLeave(model, input, leaveTime);
        if (!current.sourceBytes.equals(planned.sourceBytes)) return null;
        writeModuleBytes(model, current.loginBytes);
        return {
          leaveInfo: current.leaveInfo,
          members: current.members,
          pushData: current.pushData
        };
      });
      if (!commit) continue;
      return {
        data: responseData,
        value: { leave_info: commit.leaveInfo, members: commit.members },
        pushes: [{ type: 2305, data: commit.pushData }]
      };
    }
    fail(5, 'Guild state changed concurrently');
  }

  return {
    moduleId: GUILD_MODULE_ID,
    ensureLoginState,
    loginPayload,
    supports: type => [21005, 21006, 21007, 21010].includes(Number(type)),
    async execute(type, input) {
      log({ event: 'guild_roster_execute_entry', type, input, inputHex: Buffer.isBuffer(input) ? input.toString('base64') : null });
      switch (Number(type)) {
        case 21005: return queryGuild(input);
        case 21006:
        case 21010: return change(Number(type), input);
        case 21007: return leave(Array.isArray(input) && input.length === 1 ? input[0] : input);
        default: fail(5, 'Guild roster command is not implemented');
      }
    }
  };
}
