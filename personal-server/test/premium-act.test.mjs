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
import { grantResources, rewardHandlerFor } from '../game/resources.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readPremiumActTables } from '../config/premium-act-tables.mjs';
import { readMinigameActTables } from '../config/minigame-act-tables.mjs';
import { ensureTrimatchTables, writeHeroStar } from '../game/trimatch-core.mjs';
import { decodeModuleLoginBlocks, encodeModuleLoginBlock } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const premiumTables = readPremiumActTables();
const minigameTables = readMinigameActTables();
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

async function nativeCashPurchase(env, productId, activityId, seq) {
  env.send(codec.pack('pb_c2s', {
    type: 16004,
    seq,
    data: await encodeEtf([productId, activityId, 0])
  }));
  const frames = [codec.unpack('pb_s2c', await env.next()), codec.unpack('pb_s2c', await env.next())];
  const response = frames.find(frame => frame.seq === seq);
  assert.ok(response);
  assert.equal(response.err, undefined);
  return codec.unpack('res_recharge_success', Buffer.from(response.data, 'base64'));
}

function activityPurchaseRows(env) {
  return env.game.store.inspect(db => db.prepare(
    'SELECT activity_id,product_id,buy_num FROM activity_purchases ORDER BY rowid'
  ).all());
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

test('every PremiumAct gift has complete rewards with a concrete grant handler', () => {
  const sourcePointTids = new Set(minigameTables.sourcePoint.SourcePoint.byTid.keys());
  const gifts = new Set();
  const issues = [];
  for (const config of premiumTables.Config.values()) {
    const gift = Number(config.gift);
    gifts.add(gift);
    const product = tables.Recharge.get(gift);
    const label = 'gift:' + gift;
    if (!product) {
      issues.push(label + ':missing-product');
      continue;
    }
    if (Number(product.sync_handle ?? 0) !== 0) issues.push(label + ':sync-handle:' + product.sync_handle);
    const rewardTids = Array.from(product.reward_tid ?? []);
    const rewardCounts = Array.from(product.reward_count ?? []);
    if (!rewardTids.length || rewardTids.length !== rewardCounts.length) {
      issues.push(label + ':reward-shape');
    } else {
      for (let index = 0; index < rewardTids.length; index += 1) {
        const tid = Number(rewardTids[index]);
        const count = Number(rewardCounts[index]);
        if (!Number.isSafeInteger(count) || count <= 0) issues.push(`${label}:${tid}:invalid-count:${count}`);
        if (!rewardHandlerFor(tid, tables) && !sourcePointTids.has(tid)) issues.push(`${label}:${tid}:no-handler`);
      }
    }
    const payType = Number(product.pay_type);
    if (![0, 1, 2].includes(payType)) issues.push(label + ':invalid-pay-type:' + payType);
    if (payType === 0 && !(Number(product.price) > 0)) issues.push(label + ':invalid-cash-price');
    if (payType === 1 && (!(Number(product.price) > 0) || !(Number(product.cost_item) > 0))) {
      issues.push(label + ':invalid-resource-price');
    }
    if (payType === 2 && Number(product.price) !== 0) issues.push(label + ':invalid-free-price');
  }
  assert.equal(premiumTables.Config.size, 852);
  assert.equal(gifts.size, 558);
  assert.deepEqual(issues, []);
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
  const rechargeExtra = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.equal(Number(rechargeExtra.value[0]?.value ?? rechargeExtra.value[0]), ACT_ID);
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

test('monthly battle-pass source-point gifts buy through native recharge and persist purchase limits', async t => {
  const env = await gatewayFixture(t, 'all-open');
  const products = env.game.wallet.snapshot().products;
  for (const productId of [1270301, 1270302]) {
    const product = products.find(row => row.id === productId);
    assert.ok(product, 'missing native recharge product ' + productId);
    assert.deepEqual([product.price_cents, product.purchased, product.available], [64800, 0, 3]);
  }

  // The native client sends coupon item 701500 whenever voucher payment is
  // available. Fund both purchases so this exercises the captured 16004 shape.
  grant(env.game.store, 701500, 1296);
  env.game.wallet.credit({
    account_id: 'local-1',
    amount_cents: 129600,
    request_id: 'monthly-battle-pass-source-points'
  });
  const buyNative = async (productId, seq) => {
    env.send(codec.pack('pb_c2s', {
      type: 16004,
      seq,
      data: await encodeEtf([productId, binary(Buffer.from('[]')), 701500])
    }));
    let response;
    for (let index = 0; index < 4 && !response; index += 1) {
      const frame = codec.unpack('pb_s2c', await env.next());
      if (frame.seq === seq) response = frame;
    }
    assert.ok(response, 'missing 16004 response for ' + productId);
    assert.equal(response.err, undefined);
    return codec.unpack('res_recharge_success', Buffer.from(response.data, 'base64'));
  };

  const first = await buyNative(1270301, 24);
  const firstChange = first.res.changes.find(change => change.tid === '100334300');
  assert.ok(firstChange);
  assert.deepEqual(
    codec.unpack('pb_source_point', Buffer.from(firstChange.new_bin, 'base64')),
    { tid: '100334300', uid: '1' }
  );
  let limit = first.extra_ret_list.find(extra => extra.flag === 114);
  assert.ok(limit);
  let info = codec.unpack('pb_recharge_limit_info', Buffer.from(limit.data, 'base64'));
  assert.equal(info.buy_num_list.find(row => row.recharge_id === 1270301).buy_num, 1);

  const second = await buyNative(1270302, 25);
  const secondChange = second.res.changes.find(change => change.tid === '100344300');
  assert.ok(secondChange);
  assert.deepEqual(
    codec.unpack('pb_source_point', Buffer.from(secondChange.new_bin, 'base64')),
    { tid: '100344300', uid: '2' }
  );
  limit = second.extra_ret_list.find(extra => extra.flag === 114);
  assert.ok(limit);
  info = codec.unpack('pb_recharge_limit_info', Buffer.from(limit.data, 'base64'));
  assert.deepEqual(
    info.buy_num_list.map(row => [row.recharge_id, row.buy_num]).sort((left, right) => left[0] - right[0]),
    [[1270301, 1], [1270302, 1]]
  );

  const state = env.game.store.inspect(db => ({
    state: JSON.parse(db.prepare('SELECT data FROM minigame_act_state WHERE act_key=?').get('source_point:1').data),
    purchases: db.prepare("SELECT activity_id,product_id,buy_num FROM activity_purchases ORDER BY product_id").all()
  }));
  assert.deepEqual(state.state.source_point_list, [
    { tid: 100334300, uid: 1 },
    { tid: 100344300, uid: 2 }
  ]);
  assert.deepEqual(state.purchases.map(row => [row.activity_id, row.product_id, row.buy_num]), [
    [1007101, 1270301, 1],
    [1007101, 1270302, 1]
  ]);
  assert.deepEqual(
    env.game.premiumAct.rechargeInfo(1007101).buy_num_list.map(row => [row.recharge_id, row.buy_num]),
    [[1270301, 1], [1270302, 1]]
  );
});

test('battle-pass match-hero and triple-match tower gifts grant their dedicated resources', async t => {
  const env = await gatewayFixture(t, 'all-open');
  env.game.store.transaction((model, db) => {
    ensureTrimatchTables(db);
    writeHeroStar(db, model.state.roleId, 10134600, 3, fixedNow);
  });

  const products = env.game.wallet.snapshot().products;
  for (const [productId, price] of [[1270867, 6800], [1270872, 600], [1270873, 3000]]) {
    const product = products.find(row => row.id === productId);
    assert.ok(product, 'missing native recharge product ' + productId);
    assert.equal(product.price_cents, price);
  }

  // Fund the native purchases with both the same coupon item used by the
  // client and the local wallet's cash-equivalent balance.
  grant(env.game.store, 701500, 104);
  env.game.wallet.credit({ account_id: 'local-1', amount_cents: 10400, request_id: 'battle-pass-trimatch-gifts' });
  const buyNative = async (productId, seq) => {
    env.send(codec.pack('pb_c2s', {
      type: 16004,
      seq,
      data: await encodeEtf([productId, binary(Buffer.from('[]')), 701500])
    }));
    let response;
    for (let index = 0; index < 4 && !response; index += 1) {
      const frame = codec.unpack('pb_s2c', await env.next());
      if (frame.seq === seq) response = frame;
    }
    assert.ok(response, 'missing 16004 response for ' + productId);
    assert.equal(response.err, undefined);
    return codec.unpack('res_recharge_success', Buffer.from(response.data, 'base64'));
  };

  const matchHero = await buyNative(1270867, 30);
  assert.equal(matchHero.res.changes.find(change => change.tid === '835502').diff_num, '20');
  assert.equal(matchHero.res.changes.find(change => change.tid === '835402').diff_num, '50');
  const matchHeroChange = matchHero.res.changes.find(change => change.tid === '10134600');
  assert.ok(matchHeroChange);
  assert.deepEqual(
    codec.unpack('pb_battle_tri_match_hero_data', Buffer.from(matchHeroChange.new_bin, 'base64')),
    { tid: '10134600', star: '3' }
  );
  assert.ok(matchHero.extra_ret_list.some(extra => extra.flag === 114));

  grant(env.game.store, 101500, 300);
  const resourcePurchase = await env.request(
    16005,
    31,
    codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 1270871, buy_num: 1 })
  );
  assert.equal(resourcePurchase.err, undefined);
  const resourceGift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(resourcePurchase.data, 'base64'));
  assert.equal(resourceGift.res.changes.find(change => change.tid === '101500').diff_num, '-300');
  assert.equal(resourceGift.res.changes.find(change => change.tid === '1014800').diff_num, '1');
  assert.ok(resourceGift.extra_ret_list.some(extra => extra.flag === 114));

  const staminaSmall = await buyNative(1270872, 32);
  assert.equal(staminaSmall.res.changes.find(change => change.tid === '1014800').diff_num, '5');
  const staminaLarge = await buyNative(1270873, 33);
  assert.equal(staminaLarge.res.changes.find(change => change.tid === '1014800').diff_num, '25');

  const roleId = env.game.store.state().roleId;
  const state = env.game.store.inspect(db => ({
    matchHero: db.prepare("SELECT amount,location_json FROM resources WHERE role_id=? AND tid='10134600'").get(roleId),
    stamina: db.prepare("SELECT amount,location_json FROM resources WHERE role_id=? AND tid='1014800'").get(roleId),
    star: db.prepare('SELECT star FROM trimatch_hero WHERE role_id=? AND hero_tid=?').get(roleId, 10134600),
    purchases: db.prepare('SELECT activity_id,product_id,buy_num FROM activity_purchases WHERE activity_id=? ORDER BY product_id').all(186420)
  }));
  assert.equal(state.matchHero.amount, '1');
  assert.equal(JSON.parse(state.matchHero.location_json)[0], 6);
  assert.equal(state.stamina.amount, '31');
  assert.equal(JSON.parse(state.stamina.location_json)[0], 6);
  assert.equal(state.star.star, 3);
  assert.deepEqual(state.purchases.map(row => [row.product_id, row.buy_num]), [
    [1270867, 1], [1270871, 1], [1270872, 1], [1270873, 1]
  ]);
  assert.deepEqual(
    env.game.premiumAct.rechargeInfo(186420).buy_num_list.map(row => [row.recharge_id, row.buy_num]),
    [[1270867, 1], [1270871, 1], [1270872, 1], [1270873, 1]]
  );
});

test('matching-game cash gifts return their activity id and keep shared skus isolated', async t => {
  const env = await gatewayFixture(t, 'all-open');
  env.game.wallet.credit({ account_id: 'local-1', amount_cents: 20000, request_id: 'matching-gifts-credit' });

  let push = await nativeCashPurchase(env, 1270115, 184401, 30);
  let params = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.equal(Number(params.value[0]?.value ?? params.value[0]), 184401);
  let limit = codec.unpack(
    'pb_recharge_limit_info',
    Buffer.from(push.extra_ret_list.find(extra => extra.flag === 114).data, 'base64')
  );
  assert.equal(limit.buy_num_list.find(row => row.recharge_id === 1270115).buy_num, 1);

  push = await nativeCashPurchase(env, 1270115, 184402, 31);
  params = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.equal(Number(params.value[0]?.value ?? params.value[0]), 184402);
  limit = codec.unpack(
    'pb_recharge_limit_info',
    Buffer.from(push.extra_ret_list.find(extra => extra.flag === 114).data, 'base64')
  );
  assert.equal(limit.buy_num_list.find(row => row.recharge_id === 1270115).buy_num, 1);

  assert.deepEqual(activityPurchaseRows(env).map(row => ({ ...row })), [
    { activity_id: 184401, product_id: 1270115, buy_num: 1 },
    { activity_id: 184402, product_id: 1270115, buy_num: 1 }
  ]);
  const firstCount = env.game.premiumAct.giftPurchaseCount(1270115, null, 184401);
  const secondCount = env.game.premiumAct.giftPurchaseCount(1270115, null, 184402);
  assert.equal(firstCount, 1);
  assert.equal(secondCount, 1);
});

test('matching-game free and resource gifts preserve their requested activity id', async t => {
  const env = await gatewayFixture(t, 'all-open');
  grant(env.game.store, 101500, 8000);
  const buyGift = (rechargeId, activityId, seq) => env.request(
    16005,
    seq,
    codec.pack('pb_recharge_buy_or_rev_req', {
      recharge_id: rechargeId,
      extra_param: String(activityId),
      buy_num: 1
    })
  );

  let response = await buyGift(1270111, 184401, 40);
  assert.equal(response.err, undefined);
  let gift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.ok(gift.extra_ret_list.some(extra => extra.flag === 114));

  response = await buyGift(1270112, 184402, 41);
  assert.equal(response.err, undefined);
  gift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.ok(gift.extra_ret_list.some(extra => extra.flag === 114));
  assert.deepEqual(activityPurchaseRows(env).map(row => ({ ...row })), [
    { activity_id: 184401, product_id: 1270111, buy_num: 1 },
    { activity_id: 184402, product_id: 1270112, buy_num: 1 }
  ]);
});

test('scheduled mode rejects premium gifts when the activity is not open', async t => {
  const env = await gatewayFixture(t, 'schedule');
  assert.equal(
    env.game.wallet.snapshot().products.some(product => product.id === 1270975),
    false,
    'closed PremiumAct cash gifts must not remain in the native product list'
  );
  const response = await env.request(
    16005,
    20,
    codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 1270973, buy_num: 1 })
  );
  assert.equal(response.err?.err, 309);
  assert.equal(env.game.store.inspect(db => db.prepare('SELECT count(*) AS n FROM activity_purchases').get().n), 0);
});
