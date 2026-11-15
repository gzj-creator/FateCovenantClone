import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import {
  E,
  binary,
  createGameCodec,
  decodeEtf,
  encodeEtf,
  serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readGrowthTargetTables } from '../config/growth-target-tables.mjs';
import { readTaskAwardTables } from '../config/task-award-tables.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const growthTables = readGrowthTargetTables();
const taskAwardTables = readTaskAwardTables();
const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

const GROWTH_OPENED_AT = Math.floor(Date.parse('2026-01-01T05:00:00+08:00') / 1000);
const GROWTH_NOW = Date.parse('2026-01-02T10:00:00+08:00');
const TASK_OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const TASK_NOW = Date.parse('2026-11-25T06:00:00+08:00');

function bytesOf(entry) {
  if (entry == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(entry)) return entry;
  if (typeof entry === 'string') return Buffer.from(entry, 'base64');
  if (Buffer.isBuffer(entry.value)) return entry.value;
  if (Buffer.isBuffer(entry.value?.data)) return entry.value.data;
  return Buffer.alloc(0);
}

function loginModules(login) {
  return new Map(login[2].value.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
}

function activityModule(modules) {
  const module = modules.get(92);
  assert.ok(module, 'login module 92 exists');
  return codec.unpack('pb_act_login', bytesOf(module));
}

async function connectClient(t, game, accountId, session) {
  const socket = net.connect((await game.listen(0)).port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [];
  const waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next());
  const key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: accountId,
    verify_code: session,
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const decoded = await decodeEtf(Buffer.from(login.data, 'base64'));
  return { request, socket, modules: loginModules(decoded) };
}

function prepareDatabase({ directory, accountId, openedAt, now, roleName }) {
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: openedAt, roleName });
  const store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt, now: () => now });
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run(accountId, roleId, accountId, '', new Date(now).toISOString(), new Date(now).toISOString());
  });
  store.close();
  return { databasePath, seed };
}

function startGateway({ databasePath, seed, openedAt, now, accountId, session }) {
  // These four commands are tested through their real business owners here.
  // Fun-open eligibility has its own gateway suite; an empty local rule file
  // prevents the fixture role's incomplete lobby bitmap from masking routing.
  const rulesPath = path.join(path.dirname(databasePath), 'gate-rules.json');
  fs.writeFileSync(rulesPath, JSON.stringify({ rules: [] }));
  const previousRulesPath = process.env.FC_COMMAND_GATE_RULES_PATH;
  process.env.FC_COMMAND_GATE_RULES_PATH = rulesPath;
  try {
    return createLocalGame({
      databasePath,
      statePath: path.join(path.dirname(databasePath), 'absent.json'),
      capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
      serverOpenedAt: openedAt,
      now: () => now,
      resolveSession: (uid, token) => uid === accountId && token === session
        ? { userId: uid, loginCode: uid }
        : null
    });
  } finally {
    if (previousRulesPath == null) delete process.env.FC_COMMAND_GATE_RULES_PATH;
    else process.env.FC_COMMAND_GATE_RULES_PATH = previousRulesPath;
  }
}

function completeTask(store, task) {
  const typeConfig = gameTables.TaskType.get(Number(task.type));
  assert.equal(typeConfig.progress_type, 2);
  const slot = roleStatistics.findIndex(row => Number(row.tid) === Number(typeConfig.data));
  assert.ok(slot >= 0, `statistics slot ${typeConfig.data} exists`);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value));
    module.value[slot + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: typeConfig.stat_expand.map(id => ({ id: String(id), total: String(task.target_count) }))
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function amount(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('69006/69007 use ETF+PB, fail closed, persist, and project through module 92 on SQLite reopen', { timeout: 25000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-growth-target-gateway-'));
  const prepared = prepareDatabase({
    directory, accountId: 'growth-gateway', openedAt: GROWTH_OPENED_AT, now: GROWTH_NOW,
    roleName: 'Growth Target Gateway'
  });
  let liveGame;
  t.after(async () => {
    await liveGame?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const game = startGateway({ ...prepared, openedAt: GROWTH_OPENED_AT, now: GROWTH_NOW,
    accountId: 'growth-gateway', session: 'growth-session' });
  liveGame = game;
  let client = await connectClient(t, game, 'growth-gateway', 'growth-session');
  let activity = activityModule(client.modules);
  let projected = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 18001);
  assert.ok(projected?.module_login_data);
  let wrapped = await decodeEtf(Buffer.from(projected.module_login_data, 'base64'));
  let role = codec.unpack('pb_growth_target_role', wrapped.value);
  assert.deepEqual(role.act_data_list[0].task_award_list, []);

  const taskRequest = async seq => encodeEtf([
    new E.OtpErlangAtom('req_growth_target_task_award'),
    binary(codec.pack('pb_growth_target_task_award_req', {
      act_tid: 18001,
      task_tid_list: [100106]
    }))
  ]);
  const currencyBefore = amount(game.store, 201500);
  let response = await client.request(69007, 2, await taskRequest());
  assert.equal(Number(response.err?.err ?? response.err), 5);
  assert.equal(amount(game.store, 201500), currencyBefore);

  completeTask(game.store, growthTables.tasks.get(100106));
  response = await client.request(69007, 3, await taskRequest());
  assert.equal(response.err, undefined);
  const taskAward = codec.unpack('pb_growth_target_task_award_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(taskAward.act_data.task_award_list.map(Number), [100106]);
  assert.deepEqual(taskAward.act_data.finish_task_list.map(Number), [100106]);

  response = await client.request(69006, 4, await encodeEtf([
    new E.OtpErlangAtom('req_growth_target_phase_award'),
    binary(codec.pack('pb_growth_target_phase_award_req', { act_tid: 18001, phase_tid: 1001 }))
  ]));
  assert.equal(Number(response.err?.err ?? response.err), 5);

  client.socket.destroy();
  await game.close();
  liveGame = null;
  const reopened = startGateway({ ...prepared, openedAt: GROWTH_OPENED_AT, now: GROWTH_NOW,
    accountId: 'growth-gateway', session: 'growth-session' });
  liveGame = reopened;
  client = await connectClient(t, reopened, 'growth-gateway', 'growth-session');
  activity = activityModule(client.modules);
  projected = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 18001);
  wrapped = await decodeEtf(Buffer.from(projected.module_login_data, 'base64'));
  role = codec.unpack('pb_growth_target_role', wrapped.value);
  assert.deepEqual(role.act_data_list[0].task_award_list.map(Number), [100106]);
  assert.deepEqual(role.act_data_list[0].finish_task_list.map(Number), [100106]);
});

test('69101/69102 use ETF requests, return pb_task_award_back, persist and project on SQLite reopen', { timeout: 25000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-task-award-gateway-'));
  const prepared = prepareDatabase({
    directory, accountId: 'task-award-gateway', openedAt: TASK_OPENED_AT, now: TASK_NOW,
    roleName: 'Task Award Gateway'
  });
  let liveGame;
  t.after(async () => {
    await liveGame?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const game = startGateway({ ...prepared, openedAt: TASK_OPENED_AT, now: TASK_NOW,
    accountId: 'task-award-gateway', session: 'task-award-session' });
  liveGame = game;
  let client = await connectClient(t, game, 'task-award-gateway', 'task-award-session');
  let activity = activityModule(client.modules);
  let projected = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 19001);
  assert.ok(projected?.module_login_data);
  let wrapped = await decodeEtf(Buffer.from(projected.module_login_data, 'base64'));
  let master = codec.unpack('pb_task_award_master', wrapped.value);
  assert.equal(master.data_list.length, 1);

  const diamondBefore = amount(game.store, 101500);
  let response = await client.request(69102, 2, await encodeEtf([1001]));
  assert.equal(Number(response.err?.err ?? response.err), 5);
  assert.equal(amount(game.store, 101500), diamondBefore);

  completeTask(game.store, taskAwardTables.tasks.get(1001));
  response = await client.request(69102, 3, await encodeEtf([1001]));
  assert.equal(response.err, undefined);
  let award = codec.unpack('pb_task_award_back', Buffer.from(response.data, 'base64'));
  assert.equal(award.info.progress_value, 10);
  response = await client.request(69102, 4, await encodeEtf([1001]));
  assert.equal(Number(response.err?.err ?? response.err), 310);

  response = await client.request(69101, 5, await encodeEtf([101]));
  assert.equal(Number(response.err?.err ?? response.err), 5);
  game.store.inspect(db => db.prepare('UPDATE task_award_state SET progress_value=600 WHERE role_id=? AND version=1')
    .run(game.store.read().state.roleId));
  response = await client.request(69101, 6, await encodeEtf([101]));
  assert.equal(response.err, undefined);
  award = codec.unpack('pb_task_award_back', Buffer.from(response.data, 'base64'));
  assert.equal(award.info.progress_value, 600);
  assert.ok(Buffer.from(award.info.progress_award ?? '', 'base64').length > 0);
  response = await client.request(69101, 7, await encodeEtf([101]));
  assert.equal(Number(response.err?.err ?? response.err), 310);

  client.socket.destroy();
  await game.close();
  liveGame = null;
  const reopened = startGateway({ ...prepared, openedAt: TASK_OPENED_AT, now: TASK_NOW,
    accountId: 'task-award-gateway', session: 'task-award-session' });
  liveGame = reopened;
  client = await connectClient(t, reopened, 'task-award-gateway', 'task-award-session');
  activity = activityModule(client.modules);
  projected = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 19001);
  wrapped = await decodeEtf(Buffer.from(projected.module_login_data, 'base64'));
  master = codec.unpack('pb_task_award_master', wrapped.value);
  assert.equal(master.data_list[0].progress_value, 600);
  assert.ok(Buffer.from(master.data_list[0].task_award ?? '', 'base64').length > 0);
  assert.ok(Buffer.from(master.data_list[0].progress_award ?? '', 'base64').length > 0);
});
