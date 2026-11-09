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
import { readGroupBuyActTables } from '../config/group-buy-act-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createGroupBuyActService } from '../game/group-buy-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const groupBuyTables = readGroupBuyActTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));

// 135007 (version 7) is the newest func=135 activity whose shipped window has
// already started, so the local all-open calendar can replay its HeadCompensate
// timeline from the same start time the client computes.
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 135007;
const GIFTS = [1070601, 1070602, 1070603, 1070604];
const ACT_START = 1748293200;
const NOW = 1794028800;
const awardsOf = giftId => groupBuyTables.awardsByGift.get(giftId);
const awardTid = (giftId, tier) => awardsOf(giftId)[tier].tid;

function seedState() {
  return () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
}

function setup(t, {
  nowSeconds = NOW,
  mode = 'all-open',
  activeGroupBuyTables = groupBuyTables,
  running = () => true
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-group-buy-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = seedState();
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
  let currentSeconds = nowSeconds;
  const wallet = () => createWalletService({ store, codec, tables, now: () => currentSeconds });
  const make = () => {
    const calendar = {
      serverOpenedAt: SERVER_OPENED_AT,
      mode,
      isActivityRunning: running
    };
    return createGroupBuyActService({
      store, codec, tables, groupBuyTables: activeGroupBuyTables, calendar,
      now: () => currentSeconds * 1000
    });
  };
  let api = { wallet: wallet(), service: make() };
  const logs = [];
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    get store() { return store; },
    get wallet() { return api.wallet; },
    get service() { return api.service; },
    get logs() { return logs; },
    setTime(value) {
      currentSeconds = value;
      api = { wallet: wallet(), service: make() };
    },
    buy(productId, seq = 1, buyNum = 1) {
      return api.wallet.purchaseGift({
        product_id: productId, request_id: 'group-buy:' + seq, buy_num: buyNum
      });
    },
    addPaidOrder(accountId, productId, createdAtSeconds = currentSeconds) {
      store.transaction((model, db) => {
        // local_wallets keeps one account per role, so a simulated second buyer
        // needs its own role row exactly as a real second player would.
        const existing = db.prepare('SELECT role_id FROM local_wallets WHERE account_id=?').get(accountId);
        if (!existing) {
          const peerRole = Number(db.prepare('SELECT coalesce(max(role_id),100001) n FROM roles').get().n) + 1;
          db.prepare('INSERT INTO roles(role_id,server_id,created_at,profile_json,metadata_json) VALUES (?,?,?,?,?)')
            .run(peerRole, 1, createdAtSeconds, JSON.stringify({ level: 1 }),
              JSON.stringify({ serverOpenedAt: SERVER_OPENED_AT }));
          db.prepare('INSERT INTO local_wallets(account_id,role_id,balance_cents) VALUES (?,?,0)')
            .run(accountId, peerRole);
        }
        db.prepare(`INSERT INTO recharge_orders
          (order_id,account_id,request_id,product_id,price_cents,payload_json,created_at)
          VALUES (?,?,?,?,?,?,?)`).run(
          accountId + ':' + productId, accountId, accountId + ':' + productId, productId, 0,
          JSON.stringify({ product_id: productId, buy_num: 1 }),
          new Date(createdAtSeconds * 1000).toISOString()
        );
      });
    },
    grantDragonCrystal(amount = 12000) {
      store.transaction(model => grantResources(model, [[401500, amount]], tables));
    },
    loginActivity() {
      return codec.unpack('pb_act_login', rawBinary(new Map(store.state().modules.value).get(92)));
    },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
      api = { wallet: wallet(), service: make() };
    }
  };
}

const claim = (service, tid = awardTid(1070601, 0), actId = ACT_ID) => service.claim(
  codec.pack('pb_group_buy_act_group_award_req', { act_id: actId, award_tid: tid })
);

const claimChanges = (service, tid, actId) => codec.unpack('pb_res_to_client', claim(service, tid, actId).data).changes;

test('group-buy server data and login buy record come from paid orders', t => {
  const e = setup(t);
  e.grantDragonCrystal();
  let data = e.service.serverData().value;
  assert.equal(data.act_id, ACT_ID);
  assert.deepEqual(data.record_list.map(row => [row.gift_tid, row.buy_cnt]), GIFTS.map(gift => [gift, 0]));
  assert.ok(data.record_list.every(row => row.last_refresh_sec === ACT_START));

  e.buy(GIFTS[0], 1);
  data = e.service.serverData().value;
  assert.equal(data.record_list.find(row => row.gift_tid === GIFTS[0]).buy_cnt, 1);
  assert.equal(data.record_list.find(row => row.gift_tid === GIFTS[1]).buy_cnt, 0);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), 1);

  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const synced = e.service.synchronizeLogin(activity, NOW);
  assert.equal(synced.actId, ACT_ID);
  const entry = activity.act_list.find(row => Number(row.state_data.act_id) === ACT_ID);
  assert.equal(entry.state_data.cur_state_id, 50);
  assert.equal(entry.state_data.history_time[0].enter_time, ACT_START);
  const wrapped = Buffer.from(entry.module_login_data, 'base64');
  assert.deepEqual([...wrapped.subarray(0, 2)], [0x83, 0x6d]);
  assert.equal(wrapped.readUInt32BE(2), wrapped.length - 6);
  const role = codec.unpack('pb_group_buy_act_role', wrapped.subarray(6));
  assert.equal(role.act_id, ACT_ID);
  assert.deepEqual(role.record.buy_num_list.map(row => [row.recharge_id, row.buy_num]), [[GIFTS[0], 1]]);
  assert.equal(role.award_record.length, GIFTS.length);
  assert.ok(role.award_record.every(row => Buffer.from(row.award_state, 'base64').every(byte => byte === 0)));
});

test('group award grants its configured reward once and survives a reopen', t => {
  const e = setup(t);
  e.grantDragonCrystal();
  e.buy(GIFTS[0], 1);
  const tier = awardsOf(GIFTS[0])[0];
  assert.deepEqual([tier.head_cnt, tier.item_tid, tier.item_num], [5, 401500, 600]);

  let changes = claimChanges(e.service);
  assert.deepEqual(changes.map(row => [row.tid, row.diff_num]), [['401500', '600']]);
  assert.deepEqual(claimChanges(e.service), []);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 1);

  let bits = Buffer.from(e.loginActivity().act_list
    .find(row => Number(row.state_data.act_id) === ACT_ID).module_login_data, 'base64')
    .subarray(6);
  let role = codec.unpack('pb_group_buy_act_role', bits);
  let state = Buffer.from(role.award_record.find(row => Number(row.recharge_tid) === GIFTS[0]).award_state, 'base64');
  assert.equal(hasBit(state, tier.tid % 100), true);
  assert.equal(hasBit(state, awardsOf(GIFTS[0])[1].tid % 100), false);

  e.reopen();
  assert.deepEqual(claimChanges(e.service), []);
  role = codec.unpack('pb_group_buy_act_role', Buffer.from(e.loginActivity().act_list
    .find(row => Number(row.state_data.act_id) === ACT_ID).module_login_data, 'base64').subarray(6));
  state = Buffer.from(role.award_record.find(row => Number(row.recharge_tid) === GIFTS[0]).award_state, 'base64');
  assert.equal(hasBit(state, tier.tid % 100), true);
  assert.equal(e.store.read().resources.get('401500').num, '6600');
});

test('group award requires the player to have bought the gift', t => {
  const e = setup(t);
  e.addPaidOrder('peer-a', GIFTS[0]);
  assert.throws(() => claim(e.service), error => error.code === 311);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 0);
});

test('head count needs elapsed compensations and real buyers instead of a fixed full group', t => {
  const e = setup(t, { nowSeconds: ACT_START + 600 });
  e.grantDragonCrystal();
  e.buy(GIFTS[0], 1);
  // 10 minutes after the start no HeadCompensate row has elapsed, so the real
  // purchase alone leaves every head-count tier locked.
  assert.throws(() => claim(e.service), error => error.code === 311);

  e.setTime(NOW);
  const changes = claimChanges(e.service, awardTid(GIFTS[0], 2));
  assert.deepEqual(changes.map(row => [row.tid, row.diff_num]), [['401500', '600']]);
  // One buyer plus the 15 configured compensations still cannot satisfy the
  // 20-head tier; it only unlocks once four more players hold a paid order.
  assert.throws(() => claim(e.service, awardTid(GIFTS[0], 3)), error => error.code === 311);
  for (const peer of ['peer-a', 'peer-b', 'peer-c', 'peer-d']) e.addPaidOrder(peer, GIFTS[0]);
  assert.deepEqual(claimChanges(e.service, awardTid(GIFTS[0], 3)).map(row => row.tid), ['401500']);
  const data = e.service.serverData().value;
  assert.equal(data.record_list.find(row => row.gift_tid === GIFTS[0]).buy_cnt, 5);
});

test('group award rejects another version and missing activity state', t => {
  const e = setup(t);
  e.grantDragonCrystal();
  e.buy(GIFTS[0], 1);
  assert.throws(
    () => claim(e.service, awardTid(1070001, 0), ACT_ID),
    error => error.code === 1
  );
  assert.throws(
    () => claim(e.service, awardTid(GIFTS[0], 0), 135001),
    error => error.code === 309
  );
  const idle = setup(t, { mode: 'schedule', running: () => false });
  assert.throws(() => idle.service.serverData(), error => error.code === 309);
});

test('an unsupported configured reward rolls back the claim and pending rows', t => {
  const brokenAwards = new Map(groupBuyTables.awards);
  const brokenTid = awardTid(GIFTS[0], 0);
  brokenAwards.set(brokenTid, { ...brokenAwards.get(brokenTid), item_tid: 999999999 });
  const e = setup(t, { activeGroupBuyTables: { ...groupBuyTables, awards: brokenAwards } });
  e.grantDragonCrystal();
  e.buy(GIFTS[0], 1);
  assert.throws(() => claim(e.service), error => error.code === 5);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 0);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM pending_rewards').get().n), 0);
  assert.equal(e.store.read().resources.get('401500').num, '6000');
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), 1);
});

test('real gateway routes 100601/100602 and appends the group-buy purchase handle', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-group-buy-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    localWallet: true,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => NOW * 1000,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  game.store.transaction(model => grantResources(model, [[401500, 12000]], tables));
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
      if (waiters.length) waiters.shift()(data); else queue.push(data);
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
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const empty = await request(100601, 2, Buffer.alloc(0));
  assert.equal(empty.err, undefined);
  const serverData = codec.unpack('pb_group_buy_act_server', Buffer.from(empty.data, 'base64'));
  assert.equal(serverData.act_id, ACT_ID);
  assert.equal(serverData.record_list.find(row => row.gift_tid === GIFTS[0]).buy_cnt ?? 0, 0);

  const purchase = await request(16005, 3, codec.pack('pb_recharge_buy_or_rev_req', {
    recharge_id: GIFTS[0], buy_num: 1, extra_param: String(ACT_ID)
  }));
  assert.equal(purchase.err, undefined);
  const reply = codec.unpack('res_buy_or_Rev_gift', Buffer.from(purchase.data, 'base64'));
  const groupBuyExtra = reply.extra_ret_list.find(entry => Number(entry.flag) === 93);
  assert.ok(groupBuyExtra, 'group-buy handle 93 must accompany the gift purchase');
  const limit = codec.unpack('pb_recharge_limit_info', Buffer.from(groupBuyExtra.data, 'base64'));
  assert.deepEqual(limit.buy_num_list.map(row => [row.recharge_id, row.buy_num]), [[GIFTS[0], 1]]);

  const refreshed = codec.unpack('pb_group_buy_act_server', Buffer.from(
    (await request(100601, 4, Buffer.alloc(0))).data, 'base64'
  ));
  assert.equal(refreshed.record_list.find(row => row.gift_tid === GIFTS[0]).buy_cnt, 1);

  const claimed = await request(100602, 5, codec.pack('pb_group_buy_act_group_award_req', {
    act_id: ACT_ID, award_tid: awardTid(GIFTS[0], 0)
  }));
  assert.equal(claimed.err, undefined);
  const res = codec.unpack('pb_res_to_client', Buffer.from(claimed.data, 'base64'));
  assert.deepEqual(res.changes.map(row => [row.tid, row.diff_num]), [['401500', '600']]);
  assert.equal(game.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 1);
});
