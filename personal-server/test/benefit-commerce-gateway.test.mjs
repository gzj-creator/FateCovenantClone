import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');

// All 114 block I commands (53 cards) must never reach LOCAL_NOT_IMPLEMENTED.
const BLOCK_I_TYPES = [
  16001, 16005, 16006, 18001, 18002, 31052, 31053, 33001, 33002, 35001, 35002, 35003, 35004,
  35005, 35006, 35007, 35008, 35009, 35010, 35011, 37010, 51001, 76201, 76301, 77001, 77002, 77003, 77101,
  82602, 82603, 82604, 82701, 84601, 84602, 84603, 87301, 87401, 87501, 87502, 88101, 88201, 88202, 88203,
  88204, 88601, 88602, 88701, 88702, 88901, 88902, 88903, 92401, 92402, 92501, 92601, 92602, 92603, 92901,
  92902, 92903, 93201, 93202, 93401, 93402, 93403, 97401, 98001, 98630, 98800, 99000, 99001, 99002, 99500,
  99501, 99502, 99901, 99902, 100401, 100601, 100602, 100701, 101701, 101903, 102701, 102702, 102703, 102704,
  102705, 103601, 104001, 104801, 104802, 104803, 105401, 105901, 106101, 106102, 106301, 107301, 107302,
  107303, 107401, 107701, 107702, 107703, 110201, 110202, 110203, 110601, 110602, 110801, 110802
];

function game(directory, { now }) {
  return createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    now
  });
}

async function connect(t, instance) {
  const address = await instance.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  t.after(async () => { socket.destroy(); });
  await once(socket, 'connect');
  socket.write(encodeGameFrame(Buffer.from('verify')));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  socket.write(encodeGameFrame(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ])));
  let seq = 0;
  const request = async (type, data) => {
    socket.write(encodeGameFrame(codec.pack('pb_c2s', { type, seq: ++seq, data })));
    return codec.unpack('pb_s2c', await next());
  };
  const login = await request(909103, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);
  return { request, socket };
}

test('block I commands answer through the real gateway instead of LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-benefit-i-routing-'));
  let now = BASE_MS;
  const instance = game(directory, { now: () => now });
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const { request } = await connect(t, instance);

  const payload = await encodeEtf([]);
  const unrouted = [];
  for (const type of BLOCK_I_TYPES) {
    const reply = await request(type, payload);
    if (reply?.err?.err === -1) unrouted.push(type);
  }
  assert.deepEqual(unrouted, [], 'every block I command must have a routed handler');
});

test('87301 permanent card award settles daily rewards and survives a database reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-permanent-card-award-'));
  let now = BASE_MS;
  let instance = game(directory, { now: () => now });
  let reopened;
  t.after(async () => {
    await reopened?.close();
    if (instance) await instance.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  instance.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(62, serializedBinary(codec.pack('pb_permanent_card', {
      element_list: [{ tid: 1, last_reward_day: 0, data_version: 0 }],
      record_list: [],
      free_endtime: 0
    })));
    model.state.modules.value = [...modules];
  });
  const { request } = await connect(t, instance);

  const claimed = await request(87301, await encodeEtf([]));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_permanent_card_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(Number(response.card.element_list[0].last_reward_day) > 0, true);
  const award = response.res.changes.find(row => String(row.tid) === '101500');
  assert.equal(award.diff_num, '200');

  const repeated = await request(87301, await encodeEtf([]));
  assert.equal(repeated.err.err, 310);

  const malformed = await request(87301, await encodeEtf([1]));
  assert.equal(malformed.err.err, 1);

  await instance.close();
  instance = undefined;
  reopened = game(directory, { now: () => now });
  const stored = codec.unpack('pb_permanent_card', rawBinary(new Map(reopened.store.state().modules.value).get(62)));
  assert.equal(Number(stored.element_list[0].last_reward_day) > 0, true);
});

test('84602 princess supplement grants the unclaimed daily energy once per day', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-princess-supplement-'));
  let now = BASE_MS;
  const instance = game(directory, { now: () => now });
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  instance.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(126, serializedBinary(codec.pack('pb_princess', {
      login: {}, energy: { last_noon_day: '0', last_night_day: '0' }, holiday: {}, supplement: { last_supplement_day: '0', princess_energy: [] }
    })));
    model.state.modules.value = [...modules];
  });
  const { request } = await connect(t, instance);

  const claimed = await request(84602, await encodeEtf([]));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_princess_supplement_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(response.supplement.princess_energy.length, 1);
  assert.equal(response.supplement.princess_energy[0].moon, true);
  assert.equal(response.supplement.princess_energy[0].night, true);
  assert.equal(response.res.changes.length >= 1, true);

  const repeated = await request(84602, await encodeEtf([]));
  assert.equal(repeated.err.err, 310);
});

test('block I refusals carry the family reason instead of an empty success', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-benefit-i-refusal-'));
  let now = BASE_MS;
  const instance = game(directory, { now: () => now });
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const { request } = await connect(t, instance);

  for (const type of [33001, 102701, 107301]) {
    const reply = await request(type, await encodeEtf([]));
    assert.equal(reply.err.err, 5, 'type ' + type + ' must fail closed');
  }
});


