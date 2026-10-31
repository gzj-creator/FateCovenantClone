import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createMonthPermitService } from '../game/month-permit-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const ACT_ID = 1004012;
const EXP_ITEM = 10004200;
const PRICE_ITEM = 101500;

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

function monthPermitInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  for (const element of moduleValue.value) {
    const login = codec.unpack('pb_act_role_login', rawBinary(element));
    for (const entry of login.data_list ?? []) {
      if (typeof entry.module_login_data !== 'string') continue;
      const wrapped = Buffer.from(entry.module_login_data, 'base64');
      if (wrapped.length < 6 || wrapped[0] !== 0x83 || wrapped[1] !== 0x6d) continue;
      const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
      const info = message.month_permit_data?.month_permit_list?.find(row => Number(row.id) === ACT_ID);
      if (info) return info;
    }
  }
  throw new Error('Active month permit fixture not found');
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-buy-level-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  let service = createMonthPermitService({ codec, tables });
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    get store() { return store; },
    get service() { return service; },
    grant(awards) {
      store.transaction(model => grantResources(model, awards, tables, { codec }));
    },
    buy(request) {
      return store.transaction(model => service.buyLevel({ model, request }));
    },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      service = createMonthPermitService({ codec, tables });
    }
  };
}

test('buying a permit level charges 3000, grants 1000 exp, updates buy_exp_num and persists', t => {
  const e = setup(t);
  e.grant([[PRICE_ITEM, 6000]]);

  const first = e.buy({ tid: ACT_ID, buy_num: 1 });
  assert.equal(Number(first.response.buy_exp_num), 1000);
  assert.equal(first.expGain, 1000);
  assert.deepEqual(first.cost, { tid: PRICE_ITEM, num: 3000 });
  assert.equal(e.store.read().resources.get(String(PRICE_ITEM)).num, '3000');
  assert.equal(e.store.read().resources.get(String(EXP_ITEM)).num, '1000');
  assert.equal(Number(monthPermitInfo(e.store).buy_exp_num), 1000);
  assert.deepEqual(first.response.res.changes, [
    { tid: String(PRICE_ITEM), new_num: '3000', diff_num: '-3000' },
    { tid: String(EXP_ITEM), new_num: '1000', diff_num: '1000', new_bin: first.response.res.changes[1].new_bin }
  ]);
  assert.ok(Buffer.isBuffer(first.response.res.changes[1].new_bin));

  e.reopen();
  assert.equal(e.store.read().resources.get(String(PRICE_ITEM)).num, '3000');
  assert.equal(e.store.read().resources.get(String(EXP_ITEM)).num, '1000');
  assert.equal(Number(monthPermitInfo(e.store).buy_exp_num), 1000);

  const second = e.buy({ tid: ACT_ID, buy_num: 1 });
  assert.equal(Number(second.response.buy_exp_num), 2000);
  assert.equal(e.store.read().resources.get(String(PRICE_ITEM)).num, '0');
  assert.equal(e.store.read().resources.get(String(EXP_ITEM)).num, '2000');
});

test('permit level cap rejects a repeat or a multi-buy without changing resources', t => {
  const e = setup(t);
  e.grant([[PRICE_ITEM, 9000], [EXP_ITEM, 29000]]);
  const result = e.buy({ tid: ACT_ID, buy_num: 1 });
  assert.equal(Number(result.response.buy_exp_num), 1000);
  assert.equal(e.store.read().resources.get(String(EXP_ITEM)).num, '30000');

  const atCap = e.store.state();
  assert.throws(() => e.buy({ tid: ACT_ID, buy_num: 1 }), error => error.code === 307);
  assert.deepEqual(e.store.state(), atCap);

  const cross = setup(t);
  cross.grant([[PRICE_ITEM, 9000], [EXP_ITEM, 29000]]);
  const beforeCross = cross.store.state();
  assert.throws(() => cross.buy({ tid: ACT_ID, buy_num: 2 }), error => error.code === 307);
  assert.deepEqual(cross.store.state(), beforeCross);
});

test('insufficient price and invalid quantities are rejected atomically', t => {
  const e = setup(t);
  e.grant([[PRICE_ITEM, 2999], [EXP_ITEM, 29000]]);
  const before = e.store.state();
  assert.throws(() => e.buy({ tid: ACT_ID, buy_num: 1 }), error => error.code === 301);
  assert.deepEqual(e.store.state(), before);
  assert.throws(() => e.buy({ tid: ACT_ID, buy_num: 0 }), error => error.code === 1);
  assert.deepEqual(e.store.state(), before);
  assert.throws(() => e.buy({ tid: 1004999, buy_num: 1 }), error => error.code === 5);
  assert.deepEqual(e.store.state(), before);
});

test('gateway routes 105802 over real TCP and returns a decodable purchase response', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-buy-level-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: (uid, code) => uid === 'permit-user' && code === 'permit-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => grantResources(model, [[PRICE_ITEM, 6000]], tables, { codec }));

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
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
    server_id: 1, channel_uid: 'permit-user', verify_code: 'permit-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(new Map(loginPayload[2].value).has(183));

  const response = await request(105802, 2, codec.pack('pb_month_permit_buy_exp_req', { tid: ACT_ID, buy_num: 1 }));
  assert.equal(response.err, undefined);
  const value = codec.unpack('pb_month_permit_buy_level_back', Buffer.from(response.data, 'base64'));
  assert.equal(Number(value.buy_exp_num), 1000);
  assert.deepEqual(value.res.changes.map(change => [Number(change.tid), change.new_num, change.diff_num]), [
    [PRICE_ITEM, '3000', '-3000'],
    [EXP_ITEM, '1000', '1000']
  ]);
  assert.equal(game.store.read().resources.get(String(PRICE_ITEM)).num, '3000');
  assert.equal(game.store.read().resources.get(String(EXP_ITEM)).num, '1000');
  assert.equal(Number(monthPermitInfo(game.store).buy_exp_num), 1000);
  assert.ok(events.some(event => event.event === 'month_permit_buy_level_committed' && event.seq === 2));
  assert.equal(events.some(event => event.event === 'unsupported_command' && event.type === 105802), false);
});
