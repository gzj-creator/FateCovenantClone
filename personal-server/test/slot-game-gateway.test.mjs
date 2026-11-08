import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../local-game.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const OPENED_AT = 1792789200;
const ACT_ID = 1095003;
const TICKET = 6921900;
const DIAMOND = 101500;
const NOW_MS = (OPENED_AT + 90000) * 1000;
const int = value => Number(value ?? 0);

function seedDatabase(databasePath) {
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  store.transaction(model => grantResources(model, [[TICKET, 4]], tables, { codec }));
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
    now: () => NOW_MS,
    random: () => 0
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

function slotEntry(activity, actId = ACT_ID) {
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === actId);
  assert.ok(entry, 'slot game login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return { entry, payload: codec.unpack('pb_slot_game_act_role_data', raw.subarray(6)) };
}

const goRequest = (item = TICKET, actId = ACT_ID) => codec.pack('pb_slot_game_act_go_req', {
  act_tid: String(actId), item_tid: String(item)
});
const drawRequest = (challenge = false, actId = ACT_ID) => codec.pack('pb_slot_game_act_draw_req', {
  act_tid: String(actId), challenge_multiplier: challenge
});

test('SlotGameActCmd 110801/110802 answer over the temporary handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-slot-game-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  let game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  let client = await connectClient(t, game);

  const activity = await loginActivity(client);
  const entry = slotEntry(activity);
  assert.equal(int(entry.payload.act_id), ACT_ID);
  assert.equal(int(entry.payload.draw_num), 0);
  assert.equal(int(entry.payload.award_lib_tid), 0);
  assert.ok(game.slotGameAct.runningActIds(null, Math.floor(NOW_MS / 1000)).includes(ACT_ID));

  const armed = await client.request(110801, 2, goRequest());
  assert.equal(armed.err, undefined);
  const armedValue = codec.unpack('pb_slot_game_act_role_data', client.payloadOf(armed));
  assert.equal(int(armedValue.act_id), ACT_ID);
  assert.equal(int(armedValue.award_lib_tid), 101);

  const drawn = await client.request(110802, 3, drawRequest());
  assert.equal(drawn.err, undefined);
  const drawValue = codec.unpack('pb_slot_game_act_draw_rsp', client.payloadOf(drawn));
  assert.equal(int(drawValue.multiplier), 120);
  assert.equal(int(drawValue.act_data.draw_num), 1);
  assert.equal(int(drawValue.act_data.award_lib_tid), 0);
  assert.deepEqual(
    drawValue.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[DIAMOND, 360]]
  );

  // A draw without an assigned award library is refused without charging.
  const withoutArm = await client.request(110802, 4, drawRequest());
  assert.equal(client.errorCode(withoutArm), 311);

  // The challenge flag is not recovered; it fails closed and leaves the
  // second ticket's award library armed for a normal draw.
  const armedAgain = await client.request(110801, 5, goRequest());
  assert.equal(armedAgain.err, undefined);
  const challenge = await client.request(110802, 6, drawRequest(true));
  assert.equal(client.errorCode(challenge), 5);
  const drawnAfterChallenge = await client.request(110802, 7, drawRequest());
  assert.equal(drawnAfterChallenge.err, undefined);
  const challengeValue = codec.unpack('pb_slot_game_act_draw_rsp', client.payloadOf(drawnAfterChallenge));
  assert.equal(int(challengeValue.act_data.draw_num), 2);
  assert.equal(int(challengeValue.act_data.award_lib_tid), 0);

  await game.close();
  game = openGame(databasePath);
  client = await connectClient(t, game);
  const reopenedActivity = await loginActivity(client);
  const reopenedEntry = slotEntry(reopenedActivity);
  assert.equal(int(reopenedEntry.payload.draw_num), 2);
  assert.equal(int(reopenedEntry.payload.award_lib_tid), 0);

  const afterReopen = await client.request(110802, 2, drawRequest());
  assert.equal(client.errorCode(afterReopen), 311);
  const armedAfterReopen = await client.request(110801, 3, goRequest());
  assert.equal(armedAfterReopen.err, undefined);
  const drawnAfterReopen = await client.request(110802, 4, drawRequest());
  assert.equal(drawnAfterReopen.err, undefined);
  assert.equal(int(codec.unpack('pb_slot_game_act_draw_rsp', client.payloadOf(drawnAfterReopen)).act_data.draw_num), 3);
});

test('SlotGameActCmd rejects an unconfigured activity id over the wire', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-slot-game-reject-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  const game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const client = await connectClient(t, game);
  const unknownGo = await client.request(110801, 2, goRequest(TICKET, 1036001));
  assert.equal(client.errorCode(unknownGo), 1);
  const unknownDraw = await client.request(110802, 3, drawRequest(false, 1036001));
  assert.equal(client.errorCode(unknownDraw), 1);
});
