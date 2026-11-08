import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import {
  createGameCodec, decodeEtf, encodeEtfInteger, encodeEtfIntegerTuple
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../local-game.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const OPENED_AT = 1792789200;
const ACT_ID = 1060003;
const VERSION_ACT_ID = 1060013;
const DAY_SECONDS = 86400;
const actWindow = activityWindow(tables.ActFrameAct.get(ACT_ID), OPENED_AT);
const NOW_SECONDS = actWindow.start + 3600;
const NOW_MS = NOW_SECONDS * 1000;

function seedDatabase(databasePath) {
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
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

function freePrivilegeEntry(activity, actId) {
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === actId);
  assert.ok(entry, 'free privilege login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return { entry, payload: codec.unpack('pb_free_privilege_act_act_role_data', raw.subarray(6)) };
}

test('FreePrivilegeActCmd 110601/110602 answer over the temporary handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-free-privilege-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  let game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  let client = await connectClient(t, game);

  const activity = await loginActivity(client);
  const loginActId = game.freePrivilegeAct.currentActivity().actId;
  const loginEntry = freePrivilegeEntry(activity, loginActId);
  assert.equal(Number(loginEntry.payload.act_id), loginActId);
  assert.equal(Number(loginEntry.payload.active_time ?? 0), 0);
  assert.equal(Number(loginEntry.payload.monthly_card_active_time ?? 0), 0);

  // 110601 takes one ETF integer positional (FreePrivilegeActCmd wraps act_id).
  const activated = await client.request(110601, 2, encodeEtfInteger(ACT_ID));
  assert.equal(activated.err, undefined);
  const activatedValue = codec.unpack('pb_free_privilege_act_activate_back', client.payloadOf(activated));
  assert.equal(Number(activatedValue.act_data.act_id), ACT_ID);
  assert.equal(Number(activatedValue.act_data.active_time), NOW_SECONDS);
  assert.equal(Number(activatedValue.permanent_card.free_endtime), NOW_SECONDS + 30 * DAY_SECONDS);

  // 110602 reuses the same single-integer envelope and returns the month card.
  const monthly = await client.request(110602, 3, encodeEtfIntegerTuple([ACT_ID]));
  assert.equal(monthly.err, undefined);
  const monthlyValue = codec.unpack('pb_free_privilege_act_activate_month_back', client.payloadOf(monthly));
  assert.equal(Number(monthlyValue.act_data.monthly_card_active_time), NOW_SECONDS);
  assert.equal(monthlyValue.monthly_card.card_list.length, 1);
  assert.equal(Number(monthlyValue.monthly_card.card_list[0].id), 1);
  assert.deepEqual(monthlyValue.res.changes, []);

  // A second activation is acknowledged without extending either window.
  const repeated = await client.request(110601, 4, encodeEtfInteger(ACT_ID));
  assert.equal(Number(codec.unpack('pb_free_privilege_act_activate_back', client.payloadOf(repeated)).act_data.active_time), NOW_SECONDS);

  await game.close();
  game = openGame(databasePath);
  client = await connectClient(t, game);
  const reopenedActivity = await loginActivity(client);
  const reopenedEntry = freePrivilegeEntry(reopenedActivity, ACT_ID);
  assert.equal(Number(reopenedEntry.payload.active_time), NOW_SECONDS);
  assert.equal(Number(reopenedEntry.payload.monthly_card_active_time), NOW_SECONDS);
  assert.ok([ACT_ID, VERSION_ACT_ID].includes(Number(reopenedEntry.payload.act_id)));
});

test('FreePrivilegeActCmd rejects an unconfigured activity id over the wire', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-free-privilege-reject-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  const game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const client = await connectClient(t, game);
  const unknown = await client.request(110601, 2, encodeEtfInteger(9999999));
  assert.equal(client.errorCode(unknown), 1);
  const unknownMonth = await client.request(110602, 3, encodeEtfInteger(9999999));
  assert.equal(client.errorCode(unknownMonth), 1);
  // A body that is not ETF cannot be decoded; the gateway answers its
  // generic payload error instead of guessing an activity id.
  const empty = await client.request(110601, 4, Buffer.alloc(0));
  assert.equal(client.errorCode(empty), 2);
});
