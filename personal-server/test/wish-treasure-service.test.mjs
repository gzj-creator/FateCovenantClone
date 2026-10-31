import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createWishTreasureService, WISH_TREASURE_MODULE } from '../game/wish-treasure-service.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const fixedAt = Date.parse('2026-10-31T04:00:00.000Z');

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-wish-treasure-'));
  const file = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec, serverOpenedAt: 1792789200 });
  const make = () => {
    const wishTreasure = createWishTreasureService({ store, codec, tables, calendar: { serverOpenedAt: 1792789200 }, now: () => fixedAt });
    const wallet = createWalletService({ store, codec, tables, wishTreasure, now: () => Math.floor(fixedAt / 1000) });
    return { wishTreasure, wallet };
  };
  let api = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get wishTreasure() { return api.wishTreasure; },
    get wallet() { return api.wallet; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec, serverOpenedAt: 1792789200 });
      api = make();
    }
  };
}

const infoOf = store => codec.unpack('pb_wish_treasure', rawBinary(new Map(store.state().modules.value).get(WISH_TREASURE_MODULE)));

test('wish-treasure claims grant the phase reward once and persist module 172 and module 534', t => {
  const env = setup(t);
  const first = env.wishTreasure.claim(1013);
  assert.equal(first.value.res.changes.find(change => change.tid === '134817').diff_num, '1');
  const treasure = codec.unpack('pb_treasure_data', rawBinary(new Map(env.store.state().modules.value).get(534).value[0]));
  assert.ok(treasure.treasure_list.some(card => Number(card.tid) === 134817));
  assert.throws(() => env.wishTreasure.claim(1013), error => error.code === 310);
  assert.throws(() => env.wishTreasure.claim(1014), error => error.code === 311);
  assert.throws(() => env.wishTreasure.claim(991), error => error.code === 1);
  assert.deepEqual(infoOf(env.store).data_list.find(row => Number(row.type) === 1).rev_list, ['1013']);

  const second = env.wishTreasure.claim(2013);
  assert.equal(second.value.res.changes.find(change => change.tid === '134917').diff_num, '1');
  env.reopen();
  assert.throws(() => env.wishTreasure.claim(1013), error => error.code === 310);
  assert.throws(() => env.wishTreasure.claim(2013), error => error.code === 310);
});

test('daily-discount purchases publish wish treasure before recharge and batch additional buys reserve every component', t => {
  const env = setup(t);
  const pushes = [];
  const wallet = createWalletService({
    store: env.store,
    codec,
    tables,
    wishTreasure: env.wishTreasure,
    now: () => Math.floor(fixedAt / 1000),
    publish: (type, data) => pushes.push({ type, data })
  });
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_daily_discount_all', rawBinary(modules.get(108)));
    for (const tid of [6, 2, 5]) {
      const row = info.daily_discount_list.find(entry => Number(entry.recharge_tid) === tid);
      row.buy_times = 0;
      row.buy_additionally = 1;
    }
    modules.set(108, { value: codec.pack('pb_daily_discount_all', info).toJSON(), bits: 8 });
    model.state.modules.value = [...modules];
  });
  wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'wish-credit' });

  wallet.buy({ product_id: 46003, request_id: 'wish-regular' });
  assert.deepEqual(pushes.map(push => push.type), [9132, 1900]);
  const wishPush = codec.unpack('pb_wish_treasure_push', pushes[0].data);
  assert.deepEqual(wishPush.item_list, [{ type: '1', add_day: '20757' }]);

  wallet.buy({ product_id: 46003, request_id: 'wish-additional', extra_buy: true });
  let daily = codec.unpack('pb_daily_discount_all', rawBinary(new Map(env.store.state().modules.value).get(108)));
  assert.equal(daily.daily_discount_list.find(row => Number(row.recharge_tid) === 6).buy_additionally, 1);
  assert.equal(daily.daily_discount_list.find(row => Number(row.recharge_tid) === 2).buy_additionally ?? 0, 0);
  assert.equal(daily.daily_discount_list.find(row => Number(row.recharge_tid) === 5).buy_additionally ?? 0, 0);
  const ordersBefore = wallet.snapshot().orders.length;
  assert.throws(() => wallet.buy({ product_id: 46003, request_id: 'wish-additional-exhausted', extra_buy: true }), error => error.code === 307);
  assert.equal(env.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), ordersBefore);
  daily = codec.unpack('pb_daily_discount_all', rawBinary(new Map(env.store.state().modules.value).get(108)));
  assert.equal(daily.daily_discount_list.find(row => Number(row.recharge_tid) === 2).buy_additionally ?? 0, 0);
  assert.equal(daily.daily_discount_list.find(row => Number(row.recharge_tid) === 5).buy_additionally ?? 0, 0);

  const wish = infoOf(env.store).data_list.find(row => Number(row.type) === 1);
  assert.ok(wish.buy_day_list.includes('20757'));
  assert.equal(env.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders WHERE product_id=46003').get().n), 2);
});
