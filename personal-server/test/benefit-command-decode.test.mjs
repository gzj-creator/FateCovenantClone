import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { BENEFIT_PROTOBUF_REQUESTS } from '../game/benefit-commerce-service.mjs';

const codec = createGameCodec();
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');

function game(directory, { now, logger }) {
  return createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    now,
    logger
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
  return { request };
}

function start(t, events = []) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-benefit-decode-'));
  const instance = game(directory, { now: () => BASE_MS, logger: event => events.push(event) });
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return instance;
}

test('every protobuf benefit request schema is backed by the bundled protobuf assets', () => {
  const entries = Object.entries(BENEFIT_PROTOBUF_REQUESTS);
  assert.equal(entries.length, 28);
  for (const [type, schema] of entries) {
    assert.match(schema, /^pb_/, 'type ' + type + ' must map to a pb_ request schema');
    assert.doesNotThrow(() => codec.root.lookupType(schema), 'missing schema ' + schema + ' for ' + type);
  }
});

test('protobuf benefit requests reach the family refusal instead of code 1', async t => {
  const events = [];
  const instance = start(t, events);
  const { request } = await connect(t, instance);

  const cases = [
    [104801, 'pb_act_shop_info_req', { version: 7 }],
    [104802, 'pb_act_buy_goods_req', { act_tid: 182007, goods_tid: 102, count: 1 }],
    [104803, 'pb_act_shop_level_rewards_req', { act_tid: 182007, shop_level_tid: 1 }],
    [105401, 'pb_premium_free_award_req', { activity_id: 184005, free_gift_id: 100001 }],
    [106101, 'pb_vickrey_auction_act_info_req', { activity_id: 1008004 }],
    [107301, 'pb_subscription_act_subscribe_req', { activity_id: 1015005, round_id: 0 }],
    [106301, 'pb_gift_box_receive_req', { activity_id: 1013004, gift_id_list: [1, 2] }]
  ];
  for (const [type, schema, payload] of cases) {
    const reply = await request(type, codec.pack(schema, payload));
    assert.equal(reply?.err?.err, 5, 'type ' + type + ' must fail closed with the family code');
    const refused = events.filter(event => event.event === 'benefit_command_refused' && event.type === type).at(-1);
    assert.ok(refused, 'type ' + type + ' must log beneficiary refusal');
    assert.equal(refused.schema, schema);
    assert.equal(refused.encoding, 'protobuf');
    assert.equal(typeof refused.reason, 'string');
    assert.ok(refused.reason.length > 0);
  }
  const readRefusal = events.find(event => event.type === 104801 && event.event === 'benefit_command_refused');
  assert.equal(Number(readRefusal.request?.version), 7, 'refusal log keeps the decoded request fields');
  assert.equal(readRefusal.card, 'PAY-ACTSHOP');
});

test('refused writes leave login modules untouched and stay refused on repeat', async t => {
  const instance = start(t);
  const { request } = await connect(t, instance);
  const before = JSON.stringify(instance.store.state().modules.value);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reply = await request(104802, codec.pack('pb_act_buy_goods_req', { act_tid: 182007, goods_tid: 102, count: 1 }));
    assert.equal(reply?.err?.err, 5);
  }
  const claim = await request(104803, codec.pack('pb_act_shop_level_rewards_req', { act_tid: 182007, shop_level_tid: 1 }));
  assert.equal(claim?.err?.err, 5);
  assert.equal(JSON.stringify(instance.store.state().modules.value), before);
});

test('ETF benefit families keep their existing refusal path', async t => {
  const events = [];
  const instance = start(t, events);
  const { request } = await connect(t, instance);

  for (const [type, payload] of [[97401, [100001]], [33001, []]]) {
    const reply = await request(type, await encodeEtf(payload));
    assert.equal(reply?.err?.err, 5, 'type ' + type + ' must stay refused with code 5');
    const refused = events.filter(event => event.event === 'benefit_command_refused' && event.type === type).at(-1);
    assert.equal(refused.encoding, 'etf');
    assert.equal(refused.schema, null);
  }
});

test('a payload that is neither protobuf nor ETF is rejected as invalid', async t => {
  const instance = start(t);
  const { request } = await connect(t, instance);
  const reply = await request(104801, Buffer.from([0xff]));
  assert.equal(reply?.err?.err, 1);
});
