import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createMonthlyCardService } from '../game/monthly-card-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const DAY = 20758;
const NOW = DAY * 86400 + 3600;
const CARD_ID = 1;
const PRODUCT_ID = 140001;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t, prefix, purchaseAt = NOW) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  let cards = createMonthlyCardService({ codec, tables, now: () => NOW });
  store.transaction(model => cards.purchase({
    model,
    product: tables.Recharge.get(PRODUCT_ID),
    at: purchaseAt
  }));
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    get store() { return store; },
    get cards() { return cards; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      cards = createMonthlyCardService({ codec, tables, now: () => NOW });
    }
  };
}

function monthlyInfo(store) {
  return codec.unpack('pb_monthly_card_info', rawBinary(new Map(store.state().modules.value).get(20)));
}

function cardRow(store) {
  return monthlyInfo(store).card_list.find(row => Number(row.id) === CARD_ID);
}

function rewardBits(row) {
  if (Buffer.isBuffer(row.got_reward)) return row.got_reward;
  if (typeof row.got_reward === 'string') return Buffer.from(row.got_reward, 'base64');
  return Buffer.from(row.got_reward ?? []);
}

test('monthly card reward claim grants configured rewards, records the bit, rejects a repeat and persists', t => {
  const env = setup(t, 'fc-monthly-card-reward-');
  const before = new Map(['122702', '8501900', '101500']
    .map(id => [id, BigInt(env.store.read().resources.get(id)?.num ?? 0)]));

  const result = env.store.transaction(model => env.cards.claim({
    model,
    request: { card_list: [{ card_id: CARD_ID, day: [1] }] }
  }));
  assert.deepEqual(result.claims, [{ cardId: CARD_ID, day: 1 }]);
  assert.deepEqual(result.response.card.map(row => [Number(row.id), Number(row.got_count)]), [[CARD_ID, 1]]);
  assert.equal(result.response.res.changes.length, 3);
  assert.equal(rewardBits(cardRow(env.store))[0], 0x80);
  const expectedDiffs = new Map([
    ['122702', 1n],
    ['8501900', 2n],
    ['101500', 300n]
  ]);
  for (const [id, diff] of expectedDiffs) {
    assert.equal(BigInt(env.store.read().resources.get(id).num) - before.get(id), diff);
  }

  assert.throws(
    () => env.store.transaction(model => env.cards.claim({
      model,
      request: { card_list: [{ card_id: CARD_ID, day: [1] }] }
    })),
    error => error.code === 310
  );

  env.reopen();
  assert.equal(rewardBits(cardRow(env.store))[0], 0x80);
  assert.equal(Number(cardRow(env.store).got_count), 1);
});

test('monthly card reward claim rejects invalid, future, duplicate and inactive requests', t => {
  const env = setup(t, 'fc-monthly-card-reward-invalid-');
  for (const days of [[0], [31]]) {
    assert.throws(
      () => env.store.transaction(model => env.cards.claim({
        model,
        request: { card_list: [{ card_id: CARD_ID, day: days }] }
      })),
      error => error.code === 1
    );
  }
  assert.throws(
    () => env.store.transaction(model => env.cards.claim({
      model,
      request: { card_list: [{ card_id: CARD_ID, day: [2] }] }
    })),
    error => error.code === 309
  );
  assert.throws(
    () => env.store.transaction(model => env.cards.claim({
      model,
      request: { card_list: [{ card_id: CARD_ID, day: [1, 1] }] }
    })),
    error => error.code === 1
  );
  assert.throws(
    () => env.store.transaction(model => env.cards.claim({
      model,
      request: { card_list: [{ card_id: 999999, day: [1] }] }
    })),
    error => error.code === 5
  );
  assert.equal(Number(cardRow(env.store).got_count ?? 0), 0);

  const expired = setup(t, 'fc-monthly-card-reward-expired-', NOW - 31 * 86400);
  assert.throws(
    () => expired.store.transaction(model => expired.cards.claim({
      model,
      request: { card_list: [{ card_id: CARD_ID, day: [1] }] }
    })),
    error => error.code === 309
  );
});

test('gateway routes 17001 over real TCP and returns res_get_monthly_card_reward', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-monthly-card-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    activityMode: 'all-open',
    now: () => NOW * 1000,
    verifySession: (uid, code) => uid === 'monthly-user' && code === 'monthly-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => game.monthlyCard.purchase({
    model,
    product: tables.Recharge.get(PRODUCT_ID),
    at: NOW
  }));

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [];
  const waiters = [];
  socket.on('data', chunk => {
    for (const frame of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(frame);
      else queue.push(frame);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(frame => { clearTimeout(timer); resolve(frame); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'monthly-user', verify_code: 'monthly-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const response = await request(17001, 2, codec.pack('req_get_monthly_card_reward', {
    card_list: [{ card_id: CARD_ID, day: [1] }]
  }));
  assert.equal(response.err, undefined, JSON.stringify(events.filter(event => event.seq === 2)));
  const value = codec.unpack('res_get_monthly_card_reward', Buffer.from(response.data, 'base64'));
  assert.equal(Number(value.card[0].id), CARD_ID);
  assert.equal(rewardBits(value.card[0])[0], 0x80);
  assert.deepEqual(value.res.changes.map(change => change.diff_num).sort(), ['1', '2', '300'].sort());
  assert.ok(events.some(event => event.event === 'monthly_card_reward_committed' && event.type === 17001));
  assert.equal(events.some(event => event.event === 'unsupported_command' && event.type === 17001), false);
});
