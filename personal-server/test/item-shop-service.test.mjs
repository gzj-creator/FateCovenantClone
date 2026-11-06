import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createShopService } from '../game/shop-service.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = readGameTables();
const SERVER_OPENED_AT = 1792789200;
const NOW = (SERVER_OPENED_AT + 3600) * 1000;
const TODAY = Math.floor((SERVER_OPENED_AT + 3600) / 86400) * 86400;
const DIAMOND = 101500;

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-shop-' });
  let store = fixture.store;
  let service;
  const make = () => createShopService({
    store, codec, tables,
    now: options.now ?? (() => NOW),
    fallbackShopInfo: options.fallbackShopInfo,
    refreshRules: options.refreshRules
  });
  service = make();
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store = fixture.open();
      service = make();
    }
  };
}

function setResource(env, tid, num, group = 1) {
  env.store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const existing = model.resources.get(String(tid));
    if (existing) { existing.num = String(num); return; }
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
  });
}

const resourceNum = (env, tid) => String(env.store.read().resources.get(String(tid))?.num ?? '0');
const isGameError = code => error => error instanceof GameError && error.code === code;

test('ordinary mall purchase deducts the configured price and grants the configured item', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  const before = env.service.shopInfo(204);
  assert.equal(before.items_groups[0].item_list[0].tid, 2040101001);
  assert.equal(before.items_groups[0].item_list[0].buy_count, 0);
  assert.equal(Number(before.version), 1673852400);

  const result = env.service.execute(1203, 2040101001, { connection: 'c1', seq: 7 });
  const changes = codec.unpack('pb_res_to_client', result.data).changes;
  assert.equal(changes.find(change => change.tid === String(DIAMOND)).diff_num, '-100');
  assert.equal(changes.find(change => change.tid === String(DIAMOND)).new_num, '900');
  assert.equal(changes.find(change => change.tid === '21400104').diff_num, '1');
  assert.equal(resourceNum(env, DIAMOND), '900');
  assert.equal(resourceNum(env, '21400104'), '1');
  assert.equal(env.service.shopInfo(204).items_groups[0].item_list[0].buy_count, 1);
});

test('a purchase with insufficient currency is rejected without granting anything', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 10);
  assert.throws(() => env.service.execute(1203, 2040101001, { connection: 'c1', seq: 1 }), isGameError(301));
  assert.equal(resourceNum(env, DIAMOND), '10');
  assert.equal(resourceNum(env, '21400104'), '0');
  assert.equal(env.service.shopInfo(204).items_groups[0].item_list[0].buy_count, 0);
});

test('unknown, foreign and malformed shop items are rejected', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 10000);
  assert.throws(() => env.service.execute(1203, 9990101001, { connection: 'c1', seq: 1 }), isGameError(1));
  assert.throws(() => env.service.execute(1203, { shopId: 401, shopItemId: 2040101001, count: 1 }, { connection: 'c1', seq: 2 }), isGameError(1));
  assert.throws(() => env.service.execute(1203, { shopItemId: 2040101001, count: 0 }, { connection: 'c1', seq: 3 }), isGameError(1));
  assert.throws(() => env.service.execute(1203, true, { connection: 'c1', seq: 4 }), isGameError(1));
  assert.equal(resourceNum(env, DIAMOND), '10000');
});

test('per-item purchase limits stop extra buys while a retransmitted request only charges once', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 10000);
  const context = { connection: 'c1', seq: 11 };
  const first = env.service.execute(1203, 2050101001, context);
  assert.equal(first.duplicate, false);
  assert.equal(resourceNum(env, DIAMOND), '9600');
  const retry = env.service.execute(1203, 2050101001, context);
  assert.equal(retry.duplicate, true);
  assert.equal(resourceNum(env, DIAMOND), '9600');
  assert.throws(() => env.service.execute(1203, 2050101001, { connection: 'c1', seq: 12 }), isGameError(307));
  assert.equal(env.service.shopInfo(205).items_groups[0].item_list[0].buy_count, 1);
});

test('easy buy purchases every requested cell in one transaction', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  const result = env.service.execute(1207, [
    { shopItemId: 2050101001 },
    { shopItemId: 2050101002, count: 1 }
  ], { connection: 'c1', seq: 21 });
  const changes = codec.unpack('pb_res_to_client', result.data).changes;
  assert.equal(changes.find(change => change.tid === String(DIAMOND)).diff_num, '-800');
  assert.equal(changes.find(change => change.tid === '200114').diff_num, '5');
  assert.equal(changes.find(change => change.tid === '200214').diff_num, '5');
  assert.equal(resourceNum(env, DIAMOND), '200');
  const shelf = env.service.shopInfo(205).items_groups[0].item_list;
  assert.equal(shelf.find(item => item.tid === 2050101001).buy_count, 1);
  assert.equal(shelf.find(item => item.tid === 2050101002).buy_count, 1);
  assert.throws(() => env.service.execute(1207, [{ shopItemId: 2050101001 }, { shopItemId: 2050201001, count: 2 }], { connection: 'c1', seq: 22 }), isGameError(307));
  assert.equal(resourceNum(env, DIAMOND), '200', 'a partially invalid batch must not charge anything');
});

test('refresh records its counters and charges an injected cost inside the same transaction', t => {
  const env = setup(t, {
    refreshRules: { costFor: () => [{ tid: DIAMOND, amount: 50 }] }
  });
  setResource(env, DIAMOND, 60);
  const first = env.service.execute(1208, 204, { connection: 'c1', seq: 1 });
  assert.equal(first.value.res.changes.find(change => change.tid === String(DIAMOND)).diff_num, '-50');
  assert.equal(resourceNum(env, DIAMOND), '10');
  const counters = () => env.store.inspect(db => db.prepare('SELECT * FROM shop_refresh_state WHERE shop_id=204').get());
  assert.equal(counters().all_refresh_count, 1);
  assert.equal(counters().pay_refresh_count, 1);
  assert.throws(() => env.service.execute(1208, 204, { connection: 'c1', seq: 2 }), isGameError(301));
  assert.equal(counters().all_refresh_count, 1, 'a rejected refresh must not advance the counter');
  assert.equal(resourceNum(env, DIAMOND), '10');
});

test('settlement returns each purchased period once and survives reopening', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  env.service.execute(1203, 2040101001, { connection: 'c1', seq: 1 });
  const settled = env.service.execute(1204, 204);
  assert.equal(settled.value.settle_list.length, 1);
  assert.equal(settled.value.settle_list[0].period, Math.floor(TODAY / 86400));
  assert.equal(settled.value.shop.id, 204);
  const again = env.service.execute(1204, 204);
  assert.equal(again.value.settle_list.length, 0, 'settle is idempotent for already settled purchases');
  env.reopen();
  assert.equal(env.service.execute(1204, 204).value.settle_list.length, 0);
  assert.equal(env.store.inspect(db => db.prepare('SELECT count(*) AS n FROM shop_settlements').get().n), 1);
});

test('buy-back history goods use the configured day window and record the historical day', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  const historical = TODAY - 86400;
  const result = env.service.execute(1206, { shop_id: 207, shop_item_id: 2070101001, count: 1, day: historical }, { connection: 'c1', seq: 1 });
  const decoded = codec.unpack('pb_rev_buy_history_item', result.data);
  assert.equal(decoded.shop_id, 207);
  assert.deepEqual(decoded.items_history_bought.map(entry => [Number(entry.day), Number(entry.buy_count)]), [[historical, 1]]);
  assert.throws(() => env.service.execute(1206, { shop_id: 207, shop_item_id: 2070101001, count: 1, day: TODAY }, { connection: 'c1', seq: 2 }), isGameError(309));
  assert.throws(() => env.service.execute(1206, { shop_id: 207, shop_item_id: 2070101001, count: 1, day: TODAY - 20 * 86400 }, { connection: 'c1', seq: 3 }), isGameError(309));
  assert.throws(() => env.service.execute(1206, { shop_id: 204, shop_item_id: 2040101001, count: 1, day: historical }, { connection: 'c1', seq: 4 }), isGameError(5));
});

test('wipe buff removes exhausted cells and keeps the remaining shelf', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  env.service.execute(1203, 2050101001, { connection: 'c1', seq: 1 });
  assert.equal(env.service.shopInfo(205).items_groups[0].item_list.some(item => item.tid === 2050101001), true);
  const wiped = env.service.execute(1205, 205);
  assert.equal(codec.unpack('pb_shop_info', wiped.data).id, 205);
  assert.equal(wiped.value.items_groups[0].item_list.some(item => item.tid === 2050101001), false);
  assert.equal(env.service.shopInfo(205).items_groups[0].item_list.some(item => item.tid === 2050101001), false);
});

test('wipe buff keeps an emptied shelf empty instead of restoring the configuration', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 5000);
  for (let index = 0; index < 20; index++) {
    env.service.execute(1203, 2040101001, { requestId: 'shop-wipe-' + index });
  }
  assert.equal(env.service.shopInfo(204).items_groups[0].item_list[0].buy_count, 20);
  const wiped = env.service.execute(1205, 204);
  assert.deepEqual(wiped.value.items_groups[0].item_list, []);
  assert.deepEqual(env.service.shopInfo(204).items_groups[0].item_list, []);
  assert.throws(() => env.service.execute(1203, 2040101001, { connection: 'c1', seq: 99 }), isGameError(307));
});

test('a SQLite write failure rolls back the resources and the purchase record', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  env.store.inspect(db => db.exec('DROP TABLE shop_buy_totals'));
  assert.throws(() => env.service.execute(1203, 2040101001, { connection: 'c1', seq: 1 }));
  assert.equal(resourceNum(env, DIAMOND), '1000');
  assert.equal(resourceNum(env, '21400104'), '0');
  assert.equal(env.store.inspect(db => db.prepare('SELECT count(*) AS n FROM shop_purchases').get().n), 0);
});

test('a response encoding failure rolls back the whole purchase', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-shop-encode-' });
  setResource({ store: fixture.store }, DIAMOND, 1000);
  const failing = { ...codec, pack: (name, value) => { if (name === 'pb_res_to_client') throw new Error('encode failed'); return codec.pack(name, value); } };
  const service = createShopService({ store: fixture.store, codec: failing, tables, now: () => NOW });
  assert.throws(() => service.execute(1203, 2040101001, { connection: 'c1', seq: 1 }), /encode failed/);
  assert.equal(String(fixture.store.read().resources.get(String(DIAMOND)).num), '1000');
  assert.equal(String(fixture.store.read().resources.get('21400104')?.num ?? '0'), '0');
  assert.equal(fixture.store.inspect(db => db.prepare('SELECT count(*) AS n FROM shop_purchases').get().n), 0);
});

test('purchase state and request de-duplication survive reopening the database', t => {
  const env = setup(t);
  setResource(env, DIAMOND, 1000);
  env.service.execute(1203, 2040101001, { requestId: 'shop-retry-1' });
  assert.equal(resourceNum(env, DIAMOND), '900');
  env.reopen();
  assert.equal(env.service.shopInfo(204).items_groups[0].item_list[0].buy_count, 1);
  const retry = env.service.execute(1203, 2040101001, { requestId: 'shop-retry-1' });
  assert.equal(retry.duplicate, true);
  assert.equal(resourceNum(env, DIAMOND), '900');
  assert.equal(resourceNum(env, '21400104'), '1');
});

test('shop info queries fill ordinary shops and delegate unknown ids to the pet shop fallback', t => {
  const env = setup(t, { fallbackShopInfo: id => ({ id: Number(id), version: 0, items_groups: [], pet: true }) });
  const shops = env.service.execute(1202, [204, 5070005]).value.shops;
  assert.equal(shops[0].id, 204);
  assert.equal(String(shops[0].items_groups[0].item_list[0].tid), '2040101001');
  assert.equal(shops[1].id, 5070005);
  assert.equal(shops[1].pet, true);
  assert.equal(env.service.execute(1202, [5070005]), null, 'pet-only requests stay on the legacy handler');
});

test('gateway serves shop info and purchases over the real TCP handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-shop-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => NOW
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  setResource({ store: game.store }, DIAMOND, 500);
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  let response = await request(1202, 2, await encodeEtf([204]));
  assert.equal(response.err, undefined);
  const shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data, 'base64')).shops;
  assert.equal(shops.length, 1);
  assert.equal(shops[0].id, 204);
  assert.equal(String(shops[0].items_groups[0].item_list[0].tid), '2040101001');
  assert.equal(Number(shops[0].items_groups[0].item_list[0].buy_count ?? 0), 0);

  response = await request(1203, 3, await encodeEtf(2040101001));
  assert.equal(response.seq, 3);
  assert.equal(response.err, undefined);
  const changes = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(changes.find(change => change.tid === String(DIAMOND)).diff_num, '-100');
  assert.equal(String(game.store.read().resources.get(String(DIAMOND)).num), '400');

  response = await request(1202, 4, await encodeEtf([204]));
  const again = codec.unpack('pb_query_shops_back', Buffer.from(response.data, 'base64')).shops;
  assert.equal(again[0].items_groups[0].item_list[0].buy_count, 1, 'TCP shop reads share the authoritative purchase state');
});
