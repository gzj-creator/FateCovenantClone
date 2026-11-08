import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { binary, createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createLocalGame } from '../local-game.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readPremiumActTables } from '../config/premium-act-tables.mjs';
import { decodeModuleLoginBlocks, encodeModuleLoginBlock } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const premiumTables = readPremiumActTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 1841010;
const fixedNow = (SERVER_OPENED_AT + 7 * 86400) * 1000;

function seed() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Premium Act Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

async function gatewayFixture(t, activityMode) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-premium-act-'));
  let game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode,
    currentFishingActivityId: 1074011,
    localWallet: true,
    now: () => fixedNow,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
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
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));

  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const loginResponse = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  const login = await decodeEtf(Buffer.from(loginResponse.data, 'base64'));
  return {
    directory,
    get game() { return game; },
    async close() { await game.close(); game = { close: async () => {} }; },
    login,
    request,
    send,
    next
  };
}

function grant(store, tid, amount) {
  store.transaction(model => grantResources(model, [[tid, amount]], tables));
}

function decodePremiumInfo(block) {
  const info = codec.unpack('pb_premium_act', block).recharge_list.find(row => Number(row.act_tid) === ACT_ID);
  assert.ok(info);
  return info;
}

test('PremiumActTable contains the ten white-ling paid-shop gifts', () => {
  assert.equal(premiumTables.Version.get(1002)?.tid, 1002);
  const gifts = premiumTables.configsByVersion.get(1002);
  assert.deepEqual(gifts.map(row => Number(row.gift)), [
    1270973, 1270974, 1270975, 1270976, 1270977,
    1270978, 1270979, 1270980, 1270981, 1270982
  ]);
  for (const row of gifts) {
    const product = tables.Recharge.get(Number(row.gift));
    assert.ok(product, 'missing RechargeTable row ' + row.gift);
    assert.equal(Number(product.type), 128);
    assert.deepEqual(Array.from(product.reward_tid), [835902]);
  }
  assert.equal(tables.Recharge.get(1270973).pay_type, 2);
  assert.equal(tables.Recharge.get(1270974).pay_type, 1);
  assert.equal(tables.Recharge.get(1270975).pay_type, 0);
});

test('all-open white-ling gift mall exposes login data, free/resource gifts, cash gift and limits', async t => {
  const env = await gatewayFixture(t, 'all-open');
  const modules = new Map(env.login[2].value);
  const entry183 = modules.get(183);
  assert.ok(entry183, 'module 183 must be present');
  const entryValues = entry183.value?.value ?? entry183.value;
  const player = codec.unpack('pb_act_role_login', Buffer.from(entryValues[0].value));
  const server = codec.unpack('pb_act_server_data', Buffer.from(entryValues[1].value));
  const playerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === ACT_ID);
  assert.ok(playerRow, '1841010 player row must be materialized');
  assert.ok(server.act_stage_list.some(row => Number(row.act_id) === ACT_ID && Number(row.type) === 184));
  const blocks = decodeModuleLoginBlocks(playerRow.module_login_data);
  assert.equal(blocks.length, 1);
  const loginInfo = decodePremiumInfo(blocks[0]);
  assert.ok(Number(loginInfo.recharge_info?.refresh_time) > 0);
  assert.deepEqual(loginInfo.recharge_info?.buy_num_list ?? [], []);

  grant(env.game.store, 101500, 100000);
  env.game.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'premium-act-test-credit' });
  const buyGift = (rechargeId, seq) => env.request(
    16005,
    seq,
    codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: rechargeId, buy_num: 1 })
  );

  let response = await buyGift(1270973, 20);
  assert.equal(response.err, undefined);
  let gift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.equal(gift.res.changes.find(change => change.tid === '835902').diff_num, '30');
  let limit = gift.extra_ret_list.find(extra => extra.flag === 114);
  assert.ok(limit);
  let info = codec.unpack('pb_recharge_limit_info', Buffer.from(limit.data, 'base64'));
  assert.equal(info.buy_num_list.find(row => row.recharge_id === 1270973).buy_num, 1);

  response = await buyGift(1270973, 23);
  assert.equal(response.err?.err, 16016, 'free gift is limited to one purchase');

  response = await buyGift(1270974, 21);
  assert.equal(response.err, undefined);
  gift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.equal(gift.res.changes.find(change => change.tid === '101500').diff_num, '-3000');
  assert.equal(gift.res.changes.find(change => change.tid === '835902').diff_num, '1');
  limit = gift.extra_ret_list.find(extra => extra.flag === 114);
  info = codec.unpack('pb_recharge_limit_info', Buffer.from(limit.data, 'base64'));
  assert.equal(info.buy_num_list.find(row => row.recharge_id === 1270974).buy_num, 1);

  assert.ok(env.game.wallet.snapshot().products.some(product => product.id === 1270975 && product.price_cents === 600));
  env.send(codec.pack('pb_c2s', {
    type: 16004,
    seq: 22,
    data: await encodeEtf([1270975, binary(Buffer.from('[]')), 0])
  }));
  const walletFrames = [codec.unpack('pb_s2c', await env.next()), codec.unpack('pb_s2c', await env.next())];
  const charged = walletFrames.find(frame => frame.seq === 22);
  assert.ok(charged);
  assert.equal(charged.err, undefined);
  const push = codec.unpack('res_recharge_success', Buffer.from(charged.data, 'base64'));
  limit = push.extra_ret_list.find(extra => extra.flag === 114);
  assert.ok(limit);
  info = codec.unpack('pb_recharge_limit_info', Buffer.from(limit.data, 'base64'));
  assert.equal(info.buy_num_list.find(row => row.recharge_id === 1270975).buy_num, 1);
  assert.equal(env.game.wallet.snapshot().accounts[0].balance_cents, 9400);
  assert.equal(env.game.premiumAct.giftPurchaseCount(1270975), 1);

  const after = env.game.premiumAct.rechargeInfo(ACT_ID);
  assert.deepEqual(
    after.buy_num_list.map(row => [row.recharge_id, row.buy_num]),
    [[1270973, 1], [1270974, 1], [1270975, 1]]
  );
});

test('scheduled mode rejects premium gifts when the activity is not open', async t => {
  const env = await gatewayFixture(t, 'schedule');
  const response = await env.request(
    16005,
    20,
    codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 1270973, buy_num: 1 })
  );
  assert.equal(response.err?.err, 309);
  assert.equal(env.game.store.inspect(db => db.prepare('SELECT count(*) AS n FROM activity_purchases').get().n), 0);
});
