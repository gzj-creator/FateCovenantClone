import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import {
  binary,
  createGameCodec,
  decodeEtf,
  encodeEtf,
  rawBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createVoucherService } from '../game/voucher-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { rechargeDayIndex } from '../game/recharge-rules.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const FIXED_NOW = 1790000000;

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

function setup(t, { currentTime = FIXED_NOW } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-purchase-regression-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  const pushes = [];
  let store = createGameStore({ databasePath, seed, codec });
  const make = () => {
    const voucher = createVoucherService({ store, tables, now: () => currentTime });
    const wallet = createWalletService({
      store,
      codec,
      tables,
      voucher,
      publish: (type, data) => pushes.push({ type, data }),
      now: () => currentTime
    });
    return { voucher, wallet };
  };
  let services = make();
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    pushes,
    databasePath,
    get store() { return store; },
    get voucher() { return services.voucher; },
    get wallet() { return services.wallet; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      services = make();
    }
  };
}

function latestPurchase(env) {
  const push = env.pushes.filter(row => row.type === 1900).at(-1);
  assert.ok(push, 'expected a 1900 recharge notification');
  return codec.unpack('res_recharge_success', push.data);
}

function flags(purchase) {
  return purchase.extra_ret_list.map(row => Number(row.flag));
}

function rechargeLogin(store) {
  return codec.unpack('res_recharge_login', rawBinary(new Map(store.state().modules.value).get(19)));
}

function monthlyCardInfo(store) {
  return codec.unpack('pb_monthly_card_info', rawBinary(new Map(store.state().modules.value).get(20)));
}

function diamondFundInfo(store) {
  return codec.unpack('pb_diamond_fund', rawBinary(new Map(store.state().modules.value).get(532)));
}

function permanentCardInfo(store) {
  return codec.unpack('pb_permanent_card', rawBinary(new Map(store.state().modules.value).get(62)));
}

function permitRows(store) {
  const moduleValue = new Map(store.state().modules.value).get(38);
  return moduleValue.value.flatMap(element => codec.unpack('pb_permit_data', rawBinary(element)).permit_list ?? []);
}

test('limited gift purchase counts are numeric, persist in module 19 and reject repeats', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 40000, request_id: 'limited-fund' });

  const before = env.wallet.snapshot().products.find(row => row.id === 112037);
  assert.equal(Number.isSafeInteger(before.purchased), true);
  assert.equal(Number.isSafeInteger(before.available), true);
  assert.deepEqual([before.purchased, before.available], [0, 1]);

  env.wallet.buy({ product_id: 112037, request_id: 'limited-first' });
  const purchase = latestPurchase(env);
  assert.deepEqual(flags(purchase), [73]);
  const giftRecord = purchase.extra_ret_list.find(row => Number(row.flag) === 73);
  const decodedRecord = codec.unpack('pb_buy_gift_record', Buffer.from(giftRecord.data, 'base64'));
  assert.equal(Number(decodedRecord.recharge_tid), 112037);

  const login = rechargeLogin(env.store);
  assert.equal(login.recharge_record.recent_record.some(row => row.recharge_ids.includes(112037)), true);
  const persistedRecords = codec.unpack(
    'pb_buy_gift_record_list',
    Buffer.from(login.buy_gift_record, 'base64')
  ).record_list;
  assert.equal(persistedRecords.some(row => Number(row.recharge_tid) === 112037), true);

  const after = env.wallet.snapshot().products.find(row => row.id === 112037);
  assert.deepEqual([after.purchased, after.available], [1, 0]);
  const state = env.store.state();
  const orders = env.wallet.snapshot().orders.length;
  const balance = env.wallet.snapshot().accounts[0].balance_cents;
  const pushCount = env.pushes.length;
  assert.throws(
    () => env.wallet.buy({ product_id: 112037, request_id: 'limited-second' }),
    error => error.code === 307
  );
  assert.deepEqual(env.store.state(), state);
  assert.equal(env.wallet.snapshot().orders.length, orders);
  assert.equal(env.wallet.snapshot().accounts[0].balance_cents, balance);
  assert.equal(env.pushes.length, pushCount);

  env.reopen();
  const reopened = env.wallet.snapshot().products.find(row => row.id === 112037);
  assert.deepEqual([reopened.purchased, reopened.available], [1, 0]);
});

test('monthly card purchase writes login module 20, returns flag 5 and rejects a second activation', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'monthly-card-fund' });
  const expectedDay = rechargeDayIndex(FIXED_NOW);

  const result = env.wallet.buy({ product_id: 140002, request_id: 'monthly-card-first' });
  assert.equal(result.balance_cents, 4000);
  const purchase = latestPurchase(env);
  const monthlyEvent = purchase.extra_ret_list.find(row => Number(row.flag) === 5);
  assert.ok(monthlyEvent);
  const pushedInfo = codec.unpack('pb_monthly_card_info', Buffer.from(monthlyEvent.data, 'base64'));
  assert.deepEqual(pushedInfo.card_list.map(row => Number(row.id)), [2]);
  assert.equal(Number(pushedInfo.card_list[0].start_day), expectedDay);
  assert.deepEqual(monthlyCardInfo(env.store).card_list.map(row => [Number(row.id), Number(row.start_day)]), [[2, expectedDay]]);

  const state = env.store.state();
  const orders = env.wallet.snapshot().orders.length;
  const balance = env.wallet.snapshot().accounts[0].balance_cents;
  const pushCount = env.pushes.length;
  assert.throws(
    () => env.wallet.buy({ product_id: 140002, request_id: 'monthly-card-second' }),
    error => error.code === 307
  );
  assert.deepEqual(env.store.state(), state);
  assert.equal(env.wallet.snapshot().orders.length, orders);
  assert.equal(env.wallet.snapshot().accounts[0].balance_cents, balance);
  assert.equal(env.pushes.length, pushCount);

  env.reopen();
  assert.deepEqual(monthlyCardInfo(env.store).card_list.map(row => [Number(row.id), Number(row.start_day)]), [[2, expectedDay]]);
});

test('diamond fund returns flag 76, persists its paid cycle and restores a missing module from the order', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'diamond-fund-balance' });
  const expectedCycle = FIXED_NOW + 15 * 86400;

  env.wallet.buy({ product_id: 155001, request_id: 'diamond-fund-first' });
  const purchase = latestPurchase(env);
  const fundEvent = purchase.extra_ret_list.find(row => Number(row.flag) === 76);
  assert.ok(fundEvent, 'expected the diamond fund-specific flag 76');
  const pushedInfo = codec.unpack('pb_diamond_fund', Buffer.from(fundEvent.data, 'base64'));
  assert.equal(Number(pushedInfo.steady.cycle_time), expectedCycle);
  assert.deepEqual(pushedInfo.steady.buy_limit_info.buy_num_list.map(row => ({
    recharge_id: Number(row.recharge_id),
    buy_num: Number(row.buy_num),
    refresh_time: Number(row.refresh_time)
  })), [{ recharge_id: 155001, buy_num: 1, refresh_time: expectedCycle }]);
  assert.deepEqual(diamondFundInfo(env.store), pushedInfo);

  assert.throws(
    () => env.wallet.buy({ product_id: 155001, request_id: 'diamond-fund-second' }),
    error => error.code === 307
  );

  // Reproduce the already-paid order that reached disk with an empty module
  // before flag-76 support was deployed. The next wallet construction must
  // reconstruct the same active cycle from created_at.
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(532, {
      value: { type: 'Buffer', data: Array.from(codec.pack('pb_diamond_fund', {
        steady: { day_award: [], day_award_history: [] },
        fortune: { day_award: [], day_award_history: [] }
      })) }
    });
    model.state.modules.value = [...modules];
  });
  env.reopen();
  const restored = diamondFundInfo(env.store);
  assert.equal(Number(restored.steady.cycle_time), expectedCycle);
  assert.equal(Number(restored.steady.buy_limit_info.buy_num_list[0].recharge_id), 155001);
  assert.equal(Number(restored.steady.buy_limit_info.buy_num_list[0].buy_num), 1);
});

test('permanent card purchase persists module 62, dispatches a recharge event and restores from the order', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 20000, request_id: 'permanent-card-balance' });

  env.wallet.buy({ product_id: 490002, request_id: 'permanent-card-first' });
  const purchase = latestPurchase(env);
  assert.deepEqual(flags(purchase), [73]);
  assert.deepEqual(permanentCardInfo(env.store).element_list.map(row => Number(row.tid)), [2]);
  assert.throws(
    () => env.wallet.buy({ product_id: 490003, request_id: 'permanent-card-discount-repeat' }),
    error => error.code === 307
  );

  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(62, {
      value: { type: 'Buffer', data: Array.from(codec.pack('pb_permanent_card', {
        element_list: [], record_list: [], free_endtime: 0
      })) }
    });
    model.state.modules.value = [...modules];
  });
  env.reopen();
  assert.deepEqual(permanentCardInfo(env.store).element_list.map(row => Number(row.tid)), [2]);
});

test('monthly card can be paid entirely with vouchers and publishes the same module 20 handoff', t => {
  const env = setup(t);
  env.store.transaction(model => grantResources(model, [[701500, 60]], tables));
  assert.equal(env.voucher.balance().quantity, 60);

  const result = env.wallet.buy({
    product_id: 140002,
    request_id: 'monthly-card-voucher',
    voucher_item_tid: 701500
  });
  assert.deepEqual(
    [result.voucher_quantity, result.voucher_amount_cents, result.balance_paid_cents],
    [60, 6000, 0]
  );
  assert.equal(env.voucher.balance().quantity, 0);
  const purchase = latestPurchase(env);
  assert.equal(Boolean(purchase.get_token), false);
  assert.equal(purchase.is_use_token, true);
  assert.deepEqual(flags(purchase), [5]);
  assert.equal(Number(monthlyCardInfo(env.store).card_list[0].id), 2);
});

test('free and resource monthly cards use 16005, activate module 20 and stay out of the cash product list', t => {
  const env = setup(t);
  const cashProducts = env.wallet.snapshot().products.map(row => row.id);
  assert.equal(cashProducts.includes(140006), false);
  assert.equal(cashProducts.includes(140007), false);

  const free = env.wallet.purchaseGift({ product_id: 140006, request_id: 'monthly-card-free' });
  assert.ok(free.extra_ret_list.some(row => Number(row.flag) === 5));
  assert.ok(free.extra_ret_list.some(row => Number(row.flag) === 73));
  assert.equal(Number(monthlyCardInfo(env.store).card_list.find(row => Number(row.id) === 6).id), 6);
  assert.throws(
    () => env.wallet.purchaseGift({ product_id: 140006, request_id: 'monthly-card-free-repeat' }),
    error => error.code === 307
  );

  env.store.transaction(model => grantResources(model, [[805002, 1]], tables));
  const resource = env.wallet.purchaseGift({ product_id: 140007, request_id: 'monthly-card-resource' });
  assert.ok(resource.extra_ret_list.some(row => Number(row.flag) === 5));
  assert.equal(resource.res.changes.find(row => Number(row.tid) === 805002).diff_num, '-1');
  assert.equal(Number(monthlyCardInfo(env.store).card_list.find(row => Number(row.id) === 7).id), 7);
});

test('standard permit product 2000001 updates permit 1401 with a non-empty flag-9 response', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'standard-permit-fund' });

  env.wallet.buy({ product_id: 2000001, request_id: 'standard-permit-first' });
  const purchase = latestPurchase(env);
  assert.deepEqual(flags(purchase), [9]);
  const event = purchase.extra_ret_list.find(row => Number(row.flag) === 9);
  const info = codec.unpack('pb_permit_info', Buffer.from(event.data, 'base64'));
  assert.equal(Number(info.id), 1401);
  assert.equal(info.is_pay, true);
  assert.equal(permitRows(env.store).find(row => Number(row.id) === 1401).is_pay, true);

  const state = env.store.state();
  const orders = env.wallet.snapshot().orders.length;
  const balance = env.wallet.snapshot().accounts[0].balance_cents;
  const pushCount = env.pushes.length;
  assert.throws(
    () => env.wallet.buy({ product_id: 2000001, request_id: 'standard-permit-second' }),
    error => error.code === 307
  );
  assert.deepEqual(env.store.state(), state);
  assert.equal(env.wallet.snapshot().orders.length, orders);
  assert.equal(env.wallet.snapshot().accounts[0].balance_cents, balance);
  assert.equal(env.pushes.length, pushCount);

  env.reopen();
  assert.equal(permitRows(env.store).find(row => Number(row.id) === 1401).is_pay, true);
});

test('representative ordinary, daily, monthly-card, standard-permit and activity-permit purchases all dispatch events', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'all-purchase-classes-fund' });
  const expected = new Map([
    [11, 73],
    [46003, 40],
    [112037, 73],
    [140002, 5],
    [2000001, 9],
    [1300071, 116]
  ]);

  for (const [productId, expectedFlag] of expected) {
    env.wallet.buy({ product_id: productId, request_id: 'all-class-' + productId });
    const purchase = latestPurchase(env);
    assert.ok(purchase.extra_ret_list.length > 0, `product ${productId} returned an empty event list`);
    assert.ok(flags(purchase).includes(expectedFlag), `product ${productId} did not return flag ${expectedFlag}`);
  }
});

test('native 16004 monthly-card voucher request returns a decodable flag-5 event and commits module 20', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-purchase-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    localWallet: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => grantResources(model, [[701500, 60]], tables));
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
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
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next());
  const key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(
    909103,
    1,
    codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' })
  );
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  send(codec.pack('pb_c2s', {
    type: 16004,
    seq: 2,
    data: await encodeEtf([140002, '', 701500])
  }));
  const frames = [];
  while (!frames.some(frame => frame.seq === 2) || !frames.some(frame => frame.type === 1900)) {
    frames.push(codec.unpack('pb_s2c', await next()));
    assert.ok(frames.length < 8, '16004 did not produce both a response and recharge notification');
  }
  assert.equal(frames.find(frame => frame.seq === 2)?.err, undefined);
  const notification = frames.find(frame => frame.type === 1900);
  const purchase = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  assert.equal(Number(purchase.recharge_id), 140002);
  assert.deepEqual(flags(purchase), [5]);
  assert.equal(Number(codec.unpack('pb_monthly_card_info', Buffer.from(purchase.extra_ret_list[0].data, 'base64')).card_list[0].id), 2);
  assert.equal(game.wallet.snapshot().orders.length, 1);
  assert.equal(Number(monthlyCardInfo(game.store).card_list[0].start_day), rechargeDayIndex(Math.floor(Date.now() / 1000)));

  const acknowledged = await request(16003, 3, await encodeEtf(binary(purchase.order)));
  assert.equal(acknowledged.err, undefined);
  assert.equal(game.wallet.snapshot().orders[0].acknowledged, 1);

  const repeated = await request(16004, 4, await encodeEtf([140002, '', 701500]));
  assert.equal(repeated.err.err, 16016);
  assert.equal(game.wallet.snapshot().orders.length, 1);
});
