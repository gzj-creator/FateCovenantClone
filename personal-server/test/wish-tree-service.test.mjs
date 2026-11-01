import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createWishTreeService, WISH_TREE_MODULE } from '../game/wish-tree-service.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const fixedAt = Date.parse('2026-10-31T06:00:00.000Z');
const day = milliseconds => Math.floor((Math.floor(milliseconds / 1000) + 10800) / 86400);

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-wish-tree-'));
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
  const pushes = [];
  const make = () => {
    const wishTree = createWishTreeService({ store, codec, tables, now: () => fixedAt });
    const wallet = createWalletService({
      store, codec, tables, wishTree, now: () => Math.floor(fixedAt / 1000),
      publish: (type, data) => pushes.push({ type, data })
    });
    return { wishTree, wallet };
  };
  let api = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get wishTree() { return api.wishTree; },
    get wallet() { return api.wallet; },
    pushes,
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec, serverOpenedAt: 1792789200 });
      api = make();
    }
  };
}

const infoOf = store => codec.unpack('pb_wish_tree_new', rawBinary(new Map(store.state().modules.value).get(WISH_TREE_MODULE)));
const rowOf = (store, type) => infoOf(store).data_list.find(row => Number(row.type) === type);

function insertOrders(env) {
  env.store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,balance_cents) VALUES (?,?)').run('local-1', 10000);
    const rows = [
      ['order-1', 'req-1', 40009, '2026-10-29T06:00:00.000Z'],
      ['order-2', 'req-2', 46003, '2026-10-31T06:00:00.000Z'],
      ['order-3', 'req-3', 40010, '2026-10-28T06:00:00.000Z'],
      ['order-4', 'req-4', 40008, '2026-10-29T06:00:00.000Z'],
      ['order-5', 'req-5', 40010, '2026-10-31T06:00:00.000Z'],
      ['order-old', 'req-old', 40009, '2026-10-24T06:00:00.000Z'],
      ['order-future', 'req-future', 40010, '2026-11-20T06:00:00.000Z']
    ];
    for (const [order, request, product, createdAt] of rows) {
      db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)')
        .run(order, 'local-1', request, product, 100, '{}', createdAt);
    }
  });
}

test('login backfills distinct purchase days into module 165 without changing the draw order', t => {
  const env = setup(t);
  insertOrders(env);
  assert.equal(env.wishTree.ensureLoginState(), true);
  const type1 = rowOf(env.store, 1), type2 = rowOf(env.store, 2);
  assert.deepEqual(type1.buy_day_list, [String(day(Date.parse('2026-10-29T06:00:00Z'))), String(day(Date.parse('2026-10-31T06:00:00Z')))]);
  assert.deepEqual(type2.buy_day_list, [String(day(Date.parse('2026-10-28T06:00:00Z'))), String(day(Date.parse('2026-10-29T06:00:00Z'))), String(day(Date.parse('2026-10-31T06:00:00Z')))]);
  assert.equal(type1.can_wish_count, '2');
  assert.equal(type2.can_wish_count, '3');
  assert.equal(type2.accrue_day, '20751');
  assert.deepEqual(type2.normal_idx_list.slice(0, 3), [2003, 2009, 2006]);
  assert.equal(env.wishTree.ensureLoginState(), false);
  env.reopen();
  assert.equal(env.wishTree.ensureLoginState(), false);
  assert.equal(rowOf(env.store, 2).can_wish_count, '3');
});

test('purchase updates one day per type and is idempotent', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const first = env.wishTree.recordPurchase({ modules, productId: 40009, day: 20757, at: fixedAt });
    const second = env.wishTree.recordPurchase({ modules, productId: 46003, day: 20757, at: fixedAt });
    const third = env.wishTree.recordPurchase({ modules, productId: 40010, day: 20757, at: fixedAt });
    model.state.modules.value = [...modules];
    assert.equal(first.changed, true);
    assert.equal(second.changed, false);
    assert.equal(third.changed, true);
  });
  assert.deepEqual(rowOf(env.store, 1).buy_day_list, ['20757']);
  assert.equal(rowOf(env.store, 1).can_wish_count, '1');
  assert.deepEqual(rowOf(env.store, 2).buy_day_list, ['20757']);
  assert.equal(rowOf(env.store, 2).can_wish_count, '1');
  const changed = env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    return env.wishTree.recordPurchase({ modules, productId: 40010, day: 20757, at: fixedAt }).changed;
  });
  assert.equal(changed, false);
});

test('purchase outside the current rebate cycle is rejected without granting quota', t => {
  const env = setup(t);
  assert.throws(() => env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    env.wishTree.recordPurchase({ modules, productId: 40009, day: 20750, at: fixedAt });
  }), error => error.code === 310);
  assert.deepEqual(rowOf(env.store, 1).buy_day_list ?? [], []);
  assert.equal(rowOf(env.store, 1).can_wish_count ?? '0', '0');
});

test('draw consumes the quota, grants the next configured award and survives reopen', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    env.wishTree.recordPurchase({ modules, productId: 40010, day: 20757, at: fixedAt });
    model.state.modules.value = [...modules];
  });
  const result = env.wishTree.draw(2);
  assert.equal(result.value.award_tid, 2003);
  assert.equal(result.value.tree_data.can_wish_count, '0');
  assert.equal(result.value.tree_data.normal_times, '1');
  assert.equal(result.value.is_last_draw, false);
  assert.equal(result.value.res.changes.find(change => change.tid === '3002').diff_num, '5');
  assert.throws(() => env.wishTree.draw(2), error => error.code === 310);
  env.reopen();
  assert.equal(rowOf(env.store, 2).normal_times, '1');
  assert.equal(rowOf(env.store, 2).can_wish_count ?? '0', '0');
  assert.throws(() => env.wishTree.draw(2), error => error.code === 310);
});

test('draw encoding failure rolls back the reward and quota', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    env.wishTree.recordPurchase({ modules, productId: 40010, day: 20757, at: fixedAt });
    model.state.modules.value = [...modules];
  });
  const before = env.store.state().modules.value.find(([id]) => Number(id) === WISH_TREE_MODULE);
  const failingCodec = Object.create(codec);
  failingCodec.pack = (name, object) => {
    if (name === 'pb_wish_tree_draw_back') throw new Error('forced wish-tree encoding failure');
    return codec.pack(name, object);
  };
  const failing = createWishTreeService({ store: env.store, codec: failingCodec, tables, now: () => fixedAt });
  assert.throws(() => failing.draw(2), /forced wish-tree encoding failure/);
  const after = env.store.state().modules.value.find(([id]) => Number(id) === WISH_TREE_MODULE);
  assert.deepEqual(after, before);
  assert.equal(rowOf(env.store, 2).can_wish_count, '1');
  assert.equal(rowOf(env.store, 2).normal_times ?? '0', '0');
});

test('special award selections persist and reject an unknown choice', t => {
  const env = setup(t);
  const selected = env.wishTree.select({ type: 2, award_tid: 2001, select_tid: 2002 });
  assert.deepEqual(selected.value.select_info, { award_tid: '2001', select_tid: '2002' });
  assert.deepEqual(rowOf(env.store, 2).select_list, [{ award_tid: '2001', select_tid: '2002' }]);
  assert.throws(() => env.wishTree.select({ type: 2, award_tid: 2005, select_tid: 2002 }), error => error.code === 5 || error.code === 1);
  env.reopen();
  assert.deepEqual(rowOf(env.store, 2).select_list, [{ award_tid: '2001', select_tid: '2002' }]);
});

test('wallet records WishTree purchases on the server day, not a stale client day', async t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'wish-card-fund' });
  const serverDay = day(fixedAt);

  env.wallet.buy({ product_id: 40009, request_id: 'wish-type1-first', day_index: 20000 });
  assert.equal(rowOf(env.store, 1).can_wish_count, '1');

  env.wallet.buy({ product_id: 46002, request_id: 'wish-type1-second' });
  assert.deepEqual(rowOf(env.store, 1).buy_day_list, [String(serverDay)]);
  assert.equal(rowOf(env.store, 1).can_wish_count, '1');
  let push = codec.unpack('res_recharge_success', env.pushes.at(-1).data);
  let params = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.equal(params.value[0].value[2], serverDay);

  env.wallet.buy({ product_id: 40010, request_id: 'wish-type2-first', day_index: 20002 });
  env.wallet.buy({ product_id: 40008, request_id: 'wish-type2-second' });
  assert.deepEqual(rowOf(env.store, 2).buy_day_list, [String(serverDay)]);
  assert.equal(rowOf(env.store, 2).can_wish_count, '1');
  push = codec.unpack('res_recharge_success', env.pushes.at(-1).data);
  params = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.equal(params.value[0].value[2], serverDay);

  assert.equal(env.wishTree.ensureLoginState(), false);
  assert.equal(rowOf(env.store, 1).can_wish_count, '1');
  assert.equal(rowOf(env.store, 2).can_wish_count, '1');
  const drawn = env.wishTree.draw(1);
  assert.equal(drawn.value.award_tid, 1008);
  assert.equal(rowOf(env.store, 1).can_wish_count ?? '0', '0');
});

test('purchaseGift records WishTree purchases on the server day', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'wish-gift-fund' });
  env.wallet.purchaseGift({ product_id: 40010, request_id: 'wish-gift-40010', day_index: 20000 });
  assert.deepEqual(rowOf(env.store, 2).buy_day_list, [String(day(fixedAt))]);
  assert.equal(rowOf(env.store, 2).can_wish_count, '1');
});

test('ensureLoginState corrects can_wish_count when it exceeds the actual claimable quota', t => {
  const env = setup(t);
  insertOrders(env);
  env.wishTree.ensureLoginState();
  const type2 = rowOf(env.store, 2);
  assert.equal(type2.can_wish_count, '3');

  // Simulate a corrupted state where can_wish_count is artificially high
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_wish_tree_new', rawBinary(modules.get(WISH_TREE_MODULE)));
    info.data_list.find(row => Number(row.type) === 2).can_wish_count = '10';
    modules.set(WISH_TREE_MODULE, serializedBinary(codec.pack('pb_wish_tree_new', info)));
    model.state.modules.value = [...modules];
  });
  assert.equal(rowOf(env.store, 2).can_wish_count, '10');

  // ensureLoginState should correct the value back to the actual claimable quota
  env.wishTree.ensureLoginState();
  assert.equal(rowOf(env.store, 2).can_wish_count, '3');
});
