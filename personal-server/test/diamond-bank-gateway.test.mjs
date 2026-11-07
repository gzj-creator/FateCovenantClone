import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import {
  createGameCodec, decodeEtf, encodeEtfInteger, encodeEtfIntegerTuple, serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../local-game.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { grantResources } from '../game/resources.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const OPENED_AT = 1792789200;
const ACT_ID = 1059001;
const ACT_ITEM = 820902;
const DIAMOND = 101500;
const DAY_ONE = activityWindow(tables.ActFrameAct.get(ACT_ID), OPENED_AT).start + 3600;
const NOW_MS = DAY_ONE * 1000;

const roleStatistics = [...tables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setStatistic(store, statisticType, id, total) {
  const index = roleStatistics.findIndex(row => Number(row.tid) === statisticType);
  assert.ok(index >= 0);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value));
    module.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: String(id), total: String(total) }]
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function seedDatabase(databasePath) {
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  store.transaction(model => grantResources(model, [[DIAMOND, 5000]], tables, { codec }));
  setStatistic(store, 29, '1', 60);
  store.close();
}

function openGame(databasePath) {
  return createLocalGame({
    databasePath,
    statePath: path.join(path.dirname(databasePath), 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    activityMode: 'all-open',
    now: () => NOW_MS
  });
}

async function connectClient(t, game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const nextFrame = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await nextFrame()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const pushes = [];
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const message = codec.unpack('pb_s2c', await nextFrame());
      if (message.seq === seq) return message;
      if (Number.isSafeInteger(Number(message.type))) pushes.push(message);
    }
  };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(Number(login.code ?? 1), 1);
  return {
    login,
    request,
    pushes,
    payloadOf: reply => Buffer.from(reply.data ?? '', 'base64'),
    errorCode: reply => Number(reply.err?.err ?? reply.err)
  };
}

async function loginActivity(client) {
  const loginModuleEntries = (await decodeEtf(client.payloadOf(client.login)))[2].value;
  const loginModules = new Map(loginModuleEntries.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  const activityModule = loginModules.get(92);
  assert.ok(activityModule, 'login module 92 is missing');
  return codec.unpack('pb_act_login', Array.from(activityModule.value));
}

function bankEntry(activity) {
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === ACT_ID);
  assert.ok(entry, 'diamond bank login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return { entry, payload: codec.unpack('pb_diamond_bank_act_role_data', raw.subarray(6)) };
}

const taskRequest = ids => codec.pack('pb_diamond_bank_act_base_req', {
  act_id: String(ACT_ID), value: ids.map(String)
});

test('DiamondBankActCmd 110201-110203 answer over the temporary handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-diamond-bank-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  let game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  let client = await connectClient(t, game);

  const activity = await loginActivity(client);
  const entry = bankEntry(activity);
  assert.equal(Number(entry.payload.act_tid), ACT_ID);
  assert.ok(!entry.payload.is_buy);
  assert.ok(!entry.payload.is_get);
  assert.equal(game.diamondBankAct.currentActivity().actId, ACT_ID);

  // 110201 gates on the opened bank before touching task progress.
  const early = await client.request(110201, 2, taskRequest([101]));
  assert.equal(client.errorCode(early), 311);

  // 110203 carries one ETF integer positional (DiamondBankActCmd wraps act_id).
  const opened = await client.request(110203, 3, encodeEtfInteger(ACT_ID));
  assert.equal(opened.err, undefined);
  assert.deepEqual(
    codec.unpack('pb_res_to_client', client.payloadOf(opened)).changes
      .map(change => [Number(change.tid), Number(change.diff_num)]),
    [[DIAMOND, -1000], [ACT_ITEM, 1000]]
  );

  // A single-element ETF tuple decodes through the same path.
  const reopened = await client.request(110203, 4, encodeEtfIntegerTuple([ACT_ID]));
  assert.equal(reopened.err, undefined);
  assert.deepEqual(codec.unpack('pb_res_to_client', client.payloadOf(reopened)).changes, []);

  const claimed = await client.request(110201, 5, taskRequest([101]));
  assert.equal(claimed.err, undefined);
  const claimValue = codec.unpack('pb_diamond_bank_act_task_rsp', client.payloadOf(claimed));
  assert.deepEqual(
    claimValue.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[ACT_ITEM, 50]]
  );
  assert.deepEqual(claimValue.role_data.task_get.map(row => Number(row.tid)), [101]);
  assert.equal(claimValue.role_data.is_buy, true);

  const duplicate = await client.request(110201, 6, taskRequest([101]));
  assert.equal(codec.unpack('pb_diamond_bank_act_task_rsp', client.payloadOf(duplicate)).res.changes.length, 0);

  const paid = await client.request(110202, 7, encodeEtfInteger(ACT_ID));
  assert.equal(paid.err, undefined);
  assert.deepEqual(
    codec.unpack('pb_res_to_client', client.payloadOf(paid)).changes
      .map(change => [Number(change.tid), Number(change.diff_num)]),
    [[ACT_ITEM, -1050], [DIAMOND, 1050]]
  );

  const paidAgain = await client.request(110202, 8, encodeEtfInteger(ACT_ID));
  assert.equal(paidAgain.err, undefined);
  assert.deepEqual(codec.unpack('pb_res_to_client', client.payloadOf(paidAgain)).changes, []);

  await game.close();
  game = openGame(databasePath);
  client = await connectClient(t, game);
  const reopenedActivity = await loginActivity(client);
  const reopenedEntry = bankEntry(reopenedActivity);
  assert.equal(reopenedEntry.payload.is_buy, true);
  assert.equal(reopenedEntry.payload.is_get, true);
  assert.deepEqual(reopenedEntry.payload.task_get.map(row => Number(row.tid)), [101]);

  const claimedAfterReopen = await client.request(110201, 2, taskRequest([101]));
  assert.equal(codec.unpack('pb_diamond_bank_act_task_rsp', client.payloadOf(claimedAfterReopen)).res.changes.length, 0);
  const paidAfterReopen = await client.request(110202, 3, encodeEtfInteger(ACT_ID));
  assert.deepEqual(codec.unpack('pb_res_to_client', client.payloadOf(paidAfterReopen)).changes, []);
});

test('DiamondBankActCmd rejects an unconfigured activity id over the wire', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-diamond-bank-reject-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  const game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const client = await connectClient(t, game);
  const unknownBuy = await client.request(110203, 2, encodeEtfInteger(1036001));
  assert.equal(Number(unknownBuy.err?.err ?? unknownBuy.err), 1);
  const unknownAward = await client.request(110202, 3, encodeEtfInteger(1036001));
  assert.equal(Number(unknownAward.err?.err ?? unknownAward.err), 1);
  const unknownTask = await client.request(110201, 4, codec.pack('pb_diamond_bank_act_base_req', {
    act_id: '1036001', value: ['101']
  }));
  assert.equal(Number(unknownTask.err?.err ?? unknownTask.err), 1);
});

