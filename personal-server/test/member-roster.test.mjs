import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { createGuildRosterService, GUILD_JOB } from '../game/guild-roster-service.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const staticInterfacesPath = new URL('../../agent/workflow/interface-catalog/static-interfaces.json', import.meta.url);
const staticSchemasPath = new URL('../../agent/workflow/interface-catalog/static-schemas.json', import.meta.url);
const moduleTablePath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_general.bundle/bytecode/ModuleTable.data.lua.json', import.meta.url);
const guildInfoFormPath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/6925042128488278000-GuildInfoForm.lua.bin', import.meta.url);
const guildMgrPath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/17742175181654671000-GuildMgr.lua.bin', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const codec = createGameCodec();

function interfaceByType(entries, type) {
  return entries.find(entry => entry.protocol === 'tcp' && Number(entry.type) === Number(type));
}

function fieldNames(message) {
  return (message?.fields ?? []).map(field => field.name);
}

function findModuleRow(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    if (Number(value[1]) === 24 && value[2] === '航会' && value[6] === 'project/guild') return value;
    for (const item of value) {
      const found = findModuleRow(item, seen);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findModuleRow(item, seen);
    if (found) return found;
  }
  return null;
}

async function guildLoginFromPayload(payload) {
  const login = await decodeEtf(payload);
  const module = login[2].value.find(([id]) => Number(id) === 24);
  assert.ok(module, 'login module 24 is present');
  return codec.unpack('pb_res_guild_login', Buffer.from(module[1].value));
}

function makeGameFactory(prefix = 'fc-guild-roster-') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  const makeGame = () => createLocalGame({
    databasePath,
    statePath,
    capturePath,
    verifySession: (uid, session) => uid === 'guild-user' && session === 'guild-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => (SERVER_OPENED_AT + 3600) * 1000
  });
  return { directory, databasePath, makeGame };
}

function frameSource(socket) {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  return () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
}

async function openClient(game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const next = frameSource(socket);
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    const pushes = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const frame = codec.unpack('pb_s2c', await next());
      if (Number(frame.seq) === seq) return { reply: frame, pushes };
      pushes.push(frame);
    }
    throw new Error(`No matching reply for command ${type} seq ${seq}`);
  };
  const nextPush = async type => {
    const frame = codec.unpack('pb_s2c', await next());
    assert.equal(Number(frame.type), Number(type));
    assert.equal(Number(frame.seq ?? 0), 0);
    return frame;
  };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'guild-user', verify_code: 'guild-session', channel_extra: ''
  }));
  assert.equal(login.reply.err, undefined);
  const roster = await guildLoginFromPayload(Buffer.from(login.reply.data, 'base64'));
  return { socket, request, nextPush, roster };
}

function memberChange(frame) {
  return codec.unpack('pb_res_guild_member_change', Buffer.from(frame.data, 'base64'));
}

test('static client evidence maps the guild member roster to login module 24 and commands 21005/21006/21010/21007', () => {
  const interfaces = JSON.parse(fs.readFileSync(staticInterfacesPath, 'utf8')).interfaces;
  const schemas = JSON.parse(fs.readFileSync(staticSchemasPath, 'utf8')).schemas;
  const moduleRow = findModuleRow(JSON.parse(fs.readFileSync(moduleTablePath, 'utf8')));
  assert.ok(moduleRow, 'ModuleTable row 24 maps to GuildMgr');
  assert.equal(moduleRow[2], '航会');
  assert.ok(JSON.stringify(JSON.parse(fs.readFileSync(moduleTablePath, 'utf8'))).includes('GuildMgr'));
  const guildInfoBytes = fs.readFileSync(guildInfoFormPath);
  const guildMgrBytes = fs.readFileSync(guildMgrPath);
  for (const name of ['GetMyMemberInfo', 'member_list', 'RefreshMemberList', 'GUILD_TRANSFER_PRESIDENT', 'ReqChangePresident', 'GUILD_APPOINT_OFFICER', 'GUILD_REMOVAL_OFFICER', 'ReqDeposeJob', 'GUILD_TO_LEAVE', 'ReqExpelMember']) {
    assert.ok(guildInfoBytes.includes(Buffer.from(name)), `GuildInfoForm contains ${name}`);
  }
  for (const name of ['ReqAppointJob', 'ResGuildMemberChange', 'TID_PRESIDENT', 'TID_OFFICER', 'TID_MEMBER', 'pb_res_guild_login']) {
    assert.ok(guildMgrBytes.includes(Buffer.from(name)), `GuildMgr contains ${name}`);
  }

  for (const [type, name, responseSchema] of [
    [21005, 'req_guild_info', 'pb_guild'],
    [21006, 'req_expel_member', null],
    [21010, 'req_change_member_job', null],
    [21007, 'req_leave_guild', null]
  ]) {
    const entry = interfaceByType(interfaces.filter(value => value.direction === 'c2s'), type);
    assert.ok(entry, `command ${type} is declared`);
    assert.equal(entry.name, name);
    assert.equal(entry.request.encoding, 'etf');
    assert.equal(entry.request.encoderModule, 'GuildCmd');
    if (responseSchema) assert.equal(entry.response.schema?.name, responseSchema);
  }
  const push = interfaceByType(interfaces, 2305);
  assert.equal(push.name, 'rev_guild_member_change');
  assert.equal(push.response.schema?.name, 'pb_res_guild_member_change');
  assert.ok(push.handler?.handlers?.some(handler => handler.target === 'GuildMgr.ResGuildMemberChange'));

  assert.ok(fieldNames(schemas.pb_res_guild_login).includes('guild'));
  assert.ok(fieldNames(schemas.pb_guild).includes('member_list'));
  assert.deepEqual(fieldNames(schemas.pb_guild_member), ['role_id', 'job', 'join_time']);
  assert.deepEqual(fieldNames(schemas.pb_res_guild_member_change), ['member_list', 'log_list', 'impeach_uid', 'can_transfer_time']);
});

test('login module 24 drives guild queries and mutations through a temporary TCP server and survives SQLite reopen', async t => {
  const factory = makeGameFactory();
  let game = factory.makeGame();
  let client;
  t.after(async () => {
    client?.socket.destroy();
    try { await game?.close(); } finally { fs.rmSync(factory.directory, { recursive: true, force: true }); }
  });

  client = await openClient(game);
  const initial = client.roster;
  const guildId = String(initial.guildId);
  const president = initial.guild.member_list.find(member => Number(member.job) === GUILD_JOB.PRESIDENT);
  const memberCandidates = initial.guild.member_list.filter(member => Number(member.job) === GUILD_JOB.MEMBER);
  const [member, expelled, successor] = memberCandidates;
  assert.equal(guildId, '900001');
  assert.ok(president && member && expelled && successor);
  assert.equal(initial.guild.member_list.filter(value => Number(value.job) === GUILD_JOB.PRESIDENT).length, 1);

  let response = await client.request(21005, 2);
  assert.equal(response.reply.err, undefined);
  const queried = codec.unpack('pb_guild', Buffer.from(response.reply.data, 'base64'));
  assert.deepEqual(queried.member_list, initial.guild.member_list);

  response = await client.request(21010, 3, await encodeEtf([member.role_id, GUILD_JOB.OFFICER]));
  assert.equal(response.reply.err, undefined);
  let change = memberChange(await client.nextPush(2305));
  assert.equal(change.member_list.find(value => String(value.role_id) === String(member.role_id)).job, GUILD_JOB.OFFICER);

  response = await client.request(21010, 4, await encodeEtf([member.role_id, GUILD_JOB.MEMBER]));
  assert.equal(response.reply.err, undefined);
  change = memberChange(await client.nextPush(2305));
  assert.equal(change.member_list.find(value => String(value.role_id) === String(member.role_id)).job, GUILD_JOB.MEMBER);
  response = await client.request(21010, 5, await encodeEtf([member.role_id, GUILD_JOB.MEMBER]));
  assert.equal(response.reply.err.err, 5, 'duplicate demotion is rejected');

  response = await client.request(21006, 6, await encodeEtf([guildId, expelled.role_id]));
  assert.equal(response.reply.err, undefined);
  change = memberChange(await client.nextPush(2305));
  assert.equal(change.member_list.some(value => String(value.role_id) === String(expelled.role_id)), false);
  response = await client.request(21006, 7, await encodeEtf([guildId, expelled.role_id]));
  assert.equal(response.reply.err.err, 5, 'duplicate expel is rejected');

  response = await client.request(21010, 8, await encodeEtf([guildId, successor.role_id, GUILD_JOB.PRESIDENT]));
  assert.equal(response.reply.err, undefined);
  change = memberChange(await client.nextPush(2305));
  assert.equal(change.member_list.find(value => String(value.role_id) === String(successor.role_id)).job, GUILD_JOB.PRESIDENT);
  assert.equal(change.member_list.find(value => String(value.role_id) === String(president.role_id)).job, GUILD_JOB.MEMBER);

  const beforeUnauthorized = JSON.stringify(change.member_list);
  response = await client.request(21006, 9, await encodeEtf([guildId, member.role_id]));
  assert.equal(response.reply.err.err, 5, 'the former president no longer has change permissions');
  response = await client.request(21010, 10, await encodeEtf(['999999', GUILD_JOB.OFFICER]));
  assert.equal(response.reply.err.err, 5, 'unknown role target is rejected');
  assert.equal(JSON.stringify((await guildLoginFromPayload(await game.loginPayload())).guild.member_list), beforeUnauthorized);

  client.socket.destroy();
  await game.close();
  game = factory.makeGame();
  let reopened = await guildLoginFromPayload(await game.loginPayload());
  assert.equal(reopened.guild.member_list.find(value => String(value.role_id) === String(successor.role_id)).job, GUILD_JOB.PRESIDENT);
  assert.equal(reopened.guild.member_list.find(value => String(value.role_id) === String(president.role_id)).job, GUILD_JOB.MEMBER);
  assert.equal(reopened.guild.member_list.some(value => String(value.role_id) === String(expelled.role_id)), false);

  client = await openClient(game);
  response = await client.request(21010, 2, await encodeEtf([member.role_id, GUILD_JOB.OFFICER]));
  assert.equal(response.reply.err.err, 5, 'a member cannot change jobs after transfer');
  response = await client.request(21007, 3, await encodeEtf(Number(guildId)));
  assert.equal(response.reply.err, undefined);
  const leaveBytes = (await decodeEtf(Buffer.from(response.reply.data, 'base64')))[0];
  const leave = codec.unpack('pb_guild_leave', Buffer.from(leaveBytes.value));
  assert.equal(Number(leave.count), 1);
  change = memberChange(await client.nextPush(2305));
  assert.equal(change.member_list.some(value => String(value.role_id) === String(president.role_id)), false);

  response = await client.request(21007, 4, await encodeEtf(Number(guildId)));
  assert.equal(response.reply.err.err, 5, 'duplicate leave is rejected');
  response = await client.request(21005, 5);
  assert.equal(response.reply.err.err, 5, 'querying after leaving has no current guild');

  client.socket.destroy();
  await game.close();
  game = factory.makeGame();
  reopened = await guildLoginFromPayload(await game.loginPayload());
  assert.equal(Number(reopened.guildId ?? 0), 0);
  assert.equal(reopened.guild, undefined);
  assert.ok(Number(reopened.last_leave_time) > 0);
  assert.equal(codec.unpack('pb_guild_leave', Buffer.from(reopened.leave_count, 'base64')).count, 1);
});

test('guild roster mutations roll back when response packing fails', async t => {
  const factory = makeGameFactory('fc-guild-rollback-');
  const game = factory.makeGame();
  t.after(async () => {
    try { await game.close(); } finally { fs.rmSync(factory.directory, { recursive: true, force: true }); }
  });
  const seeded = await guildLoginFromPayload(await game.loginPayload());
  const target = seeded.guild.member_list.find(member => Number(member.job) === GUILD_JOB.MEMBER);
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_res_guild_member_change') throw new Error('forced response packing failure');
      return codec.pack(name, value);
    }
  };
  const service = createGuildRosterService({ store: game.store, codec: failingCodec, now: () => SERVER_OPENED_AT + 3600 });
  service.ensureLoginState();
  const before = service.loginPayload();
  await assert.rejects(service.execute(21006, [String(seeded.guildId), target.role_id]), /forced response packing failure/);
  assert.deepEqual(service.loginPayload(), before, 'the failed command must roll back the login-module transaction');
});
