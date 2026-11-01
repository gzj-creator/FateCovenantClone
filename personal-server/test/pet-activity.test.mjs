import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { binary, createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createPetActivityService } from '../game/pet-activity-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = 1792789200;
const PET_ACT_ID = 83028;
const PET_SHOP_ID = 5070005;
const PET_CURRENCY = 6861900;
const fixedNow = (SERVER_OPENED_AT + 7 * 86400) * 1000;

function seed() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Pet Activity Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

async function gatewayFixture(t, activityMode) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-pet-activity-'));
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

test('all-open pet activity synchronizes login data, shop, free/resource gifts and wallet gifts', async t => {
  const env = await gatewayFixture(t, 'all-open');
  const modules = new Map(env.login[2].value);
  const activity = codec.unpack('pb_act_login', Buffer.from(modules.get(92).value));
  const petGroup = activity.act_parallel_list.find(group =>
    group.states_data.some(state => Number(state.act_id) === PET_ACT_ID));
  assert.ok(petGroup);
  assert.ok(modules.has(83));

  const playerTuple = await decodeEtf(Buffer.from(petGroup.module_login_data, 'base64'));
  const playerList = codec.unpack('pb_pet_act_player_list', Buffer.from(playerTuple.value));
  assert.equal(playerList.act_data_list[0].act_tid, PET_ACT_ID);
  assert.equal(playerList.act_data_list[0].selected_pet_tid, 500313);
  assert.deepEqual(playerList.act_data_list[0].wounds.map(wound => wound.wound_tid), [98, 99, 100, 97]);
  const standalonePlayerList = codec.unpack('pb_pet_act_player_list', Buffer.from(modules.get(83).value));
  assert.deepEqual(standalonePlayerList, playerList);

  grant(env.game.store, PET_CURRENCY, 100000);
  grant(env.game.store, 101500, 100000);
  env.game.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'pet-activity-test-credit' });

  let response = await env.request(1202, 10, await encodeEtf([PET_SHOP_ID, 207]));
  assert.equal(response.err, undefined);
  let shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data, 'base64')).shops;
  assert.deepEqual(shops.map(shop => shop.id), [PET_SHOP_ID, 207]);
  assert.equal(shops[0].items_groups[0].item_list.length, 11);
  assert.equal(shops[1].items_groups.length, 1);

  const buyGift = (rechargeId, seq) => env.request(
    16005,
    seq,
    codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: rechargeId, buy_num: 1 })
  );
  response = await buyGift(730400, 20);
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64')).res.changes.find(change => change.tid === '847002').diff_num, '3');
  response = await buyGift(730400, 20);
  assert.equal(response.err, undefined, 'a retried gift response must survive JSON Buffer revival');
  assert.equal(env.game.store.read().resources.get('847002').num, '3');

  response = await buyGift(730401, 21);
  assert.equal(response.err, undefined);
  const resourceGift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.equal(resourceGift.res.changes.find(change => change.tid === '101500').diff_num, '-5000');
  assert.equal(resourceGift.extra_ret_list[0].flag, 65);
  response = await buyGift(730401, 21);
  assert.equal(response.err, undefined);

  env.send(codec.pack('pb_c2s', {
    type: 16004,
    seq: 22,
    data: await encodeEtf([730402, binary(Buffer.from('[]')), 0])
  }));
  const walletFrames = [codec.unpack('pb_s2c', await env.next()), codec.unpack('pb_s2c', await env.next())];
  const charged = walletFrames.find(frame => frame.seq === 22);
  assert.ok(charged);
  assert.equal(charged.err, undefined);
  const walletPush = codec.unpack('res_recharge_success', Buffer.from(charged.data, 'base64'));
  const limitInfo = walletPush.extra_ret_list.find(extra => extra.flag === 65);
  assert.ok(limitInfo);
  assert.equal(codec.unpack('pb_recharge_limit_info', Buffer.from(limitInfo.data, 'base64')).buy_num_list.find(row => row.recharge_id === 730402).buy_num, 1);
  assert.equal(env.game.wallet.snapshot().accounts[0].balance_cents, 7000);
  const notification = walletFrames.find(frame => frame.type === 1900);
  assert.ok(notification);

  response = await env.request(1201, 23, codec.pack('pb_req_buy_shop_item', {
    shop_id: PET_SHOP_ID,
    shop_item_id: 5070144001,
    cell_index: 3,
    count: 1
  }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes.find(change => Number(change.tid) === PET_CURRENCY).diff_num, '-1500');
  response = await env.request(1201, 23, codec.pack('pb_req_buy_shop_item', {
    shop_id: PET_SHOP_ID,
    shop_item_id: 5070144001,
    cell_index: 3,
    count: 1
  }));
  assert.equal(response.err, undefined);
  assert.equal(env.game.store.read().resources.get(String(PET_CURRENCY)).num, '98500');

  response = await env.request(1202, 24, await encodeEtf([PET_SHOP_ID]));
  shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data, 'base64')).shops;
  assert.equal(shops[0].items_groups[0].item_list.find(item => Number(item.tid) === 5070144001).buy_count, 1);

  response = await env.request(85901, 25, codec.pack('pb_recommend_gift_active_req', {
    actives: [{ act_tid: PET_ACT_ID, gift_id: [730400, 730401, 730402, 730999] }]
  }));
  assert.equal(response.err, undefined);
  const recommended = codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data, 'base64')).gift_list;
  assert.equal(recommended.length, 1);
  assert.deepEqual(recommended[0].buy_list.map(row => [row.recharge_tid, row.buy_times]), [[730400, 1], [730401, 1], [730402, 1]]);

  response = await buyGift(730400, 26);
  assert.equal(response.err.err, 16016);
  const counts = env.game.store.inspect(db => db.prepare(`SELECT kind,count(*) AS n,sum(buy_num) AS bought
    FROM activity_purchases WHERE activity_id=? GROUP BY kind ORDER BY kind`).all(PET_ACT_ID));
  assert.deepEqual(counts.map(row => [row.kind, row.n, row.bought]), [['gift', 3, 3], ['shop', 1, 1]]);
});

test('scheduled pet activity removes login, shop, gift purchase and recommendation data together', async t => {
  const env = await gatewayFixture(t, 'schedule');
  const modules = new Map(env.login[2].value);
  const activity = codec.unpack('pb_act_login', Buffer.from(modules.get(92).value));
  const activityIds = [
    ...activity.act_list.map(entry => Number(entry.state_data.act_id)),
    ...activity.act_parallel_list.flatMap(group => group.states_data.map(state => Number(state.act_id)))
  ];
  assert.equal(activityIds.includes(PET_ACT_ID), false);
  assert.equal(modules.has(83), false);

  let response = await env.request(1202, 10, await encodeEtf([PET_SHOP_ID]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_query_shops_back', Buffer.from(response.data, 'base64')).shops[0].items_groups.length, 0);

  response = await env.request(16005, 11, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 730400, buy_num: 1 }));
  assert.equal(response.err.err, 309);

  env.send(codec.pack('pb_c2s', {
    type: 16004,
    seq: 12,
    data: await encodeEtf([730402, binary(Buffer.from('[]')), 0])
  }));
  response = codec.unpack('pb_s2c', await env.next());
  assert.equal(response.seq, 12);
  assert.equal(response.err.err, 5);

  response = await env.request(85901, 13, codec.pack('pb_recommend_gift_active_req', {
    actives: [{ act_tid: PET_ACT_ID, gift_id: [730400, 730401, 730402] }]
  }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data ?? '', 'base64')).gift_list, []);
  assert.equal(env.game.store.inspect(db => db.prepare('SELECT count(*) AS n FROM activity_purchases').get().n), 0);
});

test('pet activity gift and shop purchase counts survive a SQLite reopen', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-pet-activity-persist-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let store = createGameStore({ databasePath, seed, codec });
  let calendar, petActivity, wallet;
  const make = () => {
    calendar = createActivityCalendar({
      tables,
      serverOpenedAt: SERVER_OPENED_AT,
      mode: 'all-open',
      currentFishingActivityId: 1074011,
      now: () => fixedNow
    });
    petActivity = createPetActivityService({ store, codec, tables, calendar, now: () => fixedNow });
    wallet = createWalletService({ store, codec, tables, petActivity, now: () => fixedNow / 1000 });
  };
  make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  grant(store, PET_CURRENCY, 10000);
  wallet.purchaseGift({ product_id: 730400, request_id: 'gift:persist:1', buy_num: 1 });
  petActivity.purchaseShop({
    shop_id: PET_SHOP_ID,
    shop_item_id: 5070144001,
    cell_index: 3,
    count: 2
  }, { connection: 'persist', seq: 2 });

  store.close();
  store = createGameStore({ databasePath, seed, codec });
  make();
  assert.equal(petActivity.giftPurchaseCount(730400), 1);
  const shop = petActivity.queryShops([PET_SHOP_ID])[0];
  assert.equal(shop.items_groups[0].item_list.find(item => item.tid === 5070144001).buy_count, 2);
});
