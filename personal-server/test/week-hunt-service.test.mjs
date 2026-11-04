import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createWeekHuntService } from '../game/week-hunt-service.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const startDay = 20745;
const atDay = day => day * 86400 - 10800 + 3600;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-week-hunt-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let seconds = atDay(startDay + 2), store, weekHunt, wallet;
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: atDay(startDay),
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  function open() {
    store = createGameStore({ databasePath, seed, codec });
    weekHunt = createWeekHuntService({ store, codec, tables, now: () => seconds * 1000 });
    wallet = createWalletService({ store, codec, tables, weekHunt, now: () => seconds });
  }
  open();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'fund' });
  return {
    get store() { return store; }, get wallet() { return wallet; }, get weekHunt() { return weekHunt; },
    week() { return codec.unpack('pb_week_hunt', rawBinary(new Map(store.state().modules.value).get(533))).week_period_info[0]; },
    advance(day) { seconds = atDay(day); },
    reopen() { store.close(); open(); weekHunt.ensureLoginState(); }
  };
}

async function purchaseParams(e, result) {
  const payload = e.store.inspect(db => JSON.parse(db.prepare('SELECT payload_json FROM recharge_orders WHERE order_id=?').get(result.order_id).payload_json));
  const notification = codec.unpack('res_recharge_success', Buffer.from(payload.notification, 'base64'));
  const params = await decodeEtf(Buffer.from(notification.extra_params, 'base64'));
  return { notification, tuple: params.value[0].value };
}

test('one-key daily purchase returns its retained period and records the day atomically', async t => {
  const e = setup(t), day = startDay + 2;
  const result = e.wallet.buy({ product_id: 46003, request_id: 'one-key' });
  const { notification, tuple } = await purchaseParams(e, result);
  assert.deepEqual(tuple, [false, 1, day]);
  assert.equal(notification.res.changes.find(row => String(row.tid) === '1581200').diff_num, '10');
  assert.equal(e.week().discount_buy_list.find(row => row.day_index === day).one_buy_id, 46003);
  const state = e.store.state(), count = e.wallet.snapshot().orders.length;
  for (const product_id of [40009, 46002, 46003]) {
    assert.throws(() => e.wallet.buy({ product_id, request_id: 'blocked-' + product_id }), error => error.code === 307);
  }
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, count);
  e.wallet.acknowledge(result.order_id);
  e.reopen();
  assert.equal(e.week().start_day, startDay);
  assert.equal(e.week().discount_buy_list.find(row => row.day_index === day).one_buy_id, 46003);
  assert.equal(e.wallet.snapshot().orders[0].acknowledged, 1);
});

test('split offers and both upgrade offers retain their distinct product and reward records', async t => {
  const e = setup(t), day = startDay + 2;
  e.wallet.buy({ product_id: 40009, request_id: 'split-one' });
  e.wallet.buy({ product_id: 46002, request_id: 'split-two' });
  assert.deepEqual(e.week().discount_buy_list.find(row => row.day_index === day).split_buy_ids, [40009, 46002]);
  assert.throws(() => e.wallet.buy({ product_id: 46003, request_id: 'blocked-one-key' }), error => error.code === 307);
  const elite = await purchaseParams(e, e.wallet.buy({ product_id: 40008, request_id: 'elite' }));
  assert.deepEqual(elite.tuple, [false, 1, day]);
  assert.equal(elite.notification.res.changes.find(row => String(row.tid) === '5971200').diff_num, '25');
  const upgrade = await purchaseParams(e, e.wallet.buy({ product_id: 40010, request_id: 'upgrade' }));
  assert.deepEqual(upgrade.tuple, [false, 1, day]);
  assert.equal(upgrade.notification.res.changes.find(row => String(row.tid) === '5971200').diff_num, '10');
  assert.deepEqual(e.week().upgrade_list.map(row => [row.day_index, row.recharge_id]), [[day, 40008], [day, 40010]]);
});

test('current-day purchases ignore stale client days and survive login reconstruction', async t => {
  const e = setup(t), currentDay = startDay + 12, staleDay = startDay + 6;
  e.advance(currentDay);

  const result = e.wallet.buy({ product_id: 40008, request_id: 'stale-client-day', period: 1, day_index: staleDay });
  assert.equal(result.week_hunt_day, currentDay);
  assert.deepEqual((await purchaseParams(e, result)).tuple, [false, 1, currentDay]);
  assert.deepEqual(e.week().upgrade_list.map(row => [row.day_index, row.recharge_id]), [[currentDay, 40008]]);
  assert.throws(
    () => e.wallet.buy({ product_id: 40008, request_id: 'stale-client-day-repeat', period: 1, day_index: staleDay }),
    error => error.code === 307
  );

  // Reproduce the old broken order state: the UI/date payload retained the
  // final offer day, while the activity module also only retained that day.
  e.store.transaction((model, db) => {
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_week_hunt', rawBinary(modules.get(533)));
    info.week_period_info[0].upgrade_list = [{ day_index: staleDay, recharge_id: 40008 }];
    modules.set(533, serializedBinary(codec.pack('pb_week_hunt', info)));
    model.state.modules.value = [...modules];
    const row = db.prepare('SELECT payload_json FROM recharge_orders WHERE order_id=?').get(result.order_id);
    const payload = JSON.parse(row.payload_json);
    payload.week_hunt_day = staleDay;
    payload.day_index = staleDay;
    payload.requested_extra_buy = false;
    db.prepare('UPDATE recharge_orders SET payload_json=? WHERE order_id=?').run(JSON.stringify(payload), result.order_id);
  });

  e.reopen();
  assert.deepEqual(
    e.week().upgrade_list.map(row => [row.day_index, row.recharge_id]),
    [[staleDay, 40008], [currentDay, 40008]]
  );
});

test('makeup validates the requested day and period before any order, debit or reward', async t => {
  const e = setup(t), day = startDay + 2;
  e.wallet.buy({ product_id: 40008, request_id: 'normal' });
  const result = e.wallet.buy({ product_id: 40008, request_id: 'makeup', extra_buy: true, period: 1, day_index: day - 1 });
  assert.deepEqual((await purchaseParams(e, result)).tuple, [true, 1, day - 1]);
  const state = e.store.state(), count = e.wallet.snapshot().orders.length, balance = e.wallet.snapshot().accounts[0].balance_cents;
  for (const [day_index, period, code] of [[day - 1, 1, 307], [day + 1, 1, 1], [startDay - 1, 1, 1], [day - 2, 2, 309]]) {
    assert.throws(() => e.wallet.buy({ product_id: 40008, request_id: 'bad-' + day_index + '-' + period, extra_buy: true, period, day_index }), error => error.code === code);
  }
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, count);
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, balance);
  const other = await purchaseParams(e, e.wallet.buy({ product_id: 40010, request_id: 'other-upgrade-same-day', period: 1, day_index: day }));
  assert.deepEqual(other.tuple, [false, 1, day]);
  assert.deepEqual(e.week().upgrade_list.map(row => [row.day_index, row.recharge_id]), [[day, 40008], [day - 1, 40008], [day, 40010]]);
});

test('order reconstruction preserves the original cycle and task progress, including legacy shared SKUs', async t => {
  const e = setup(t), day = startDay + 2, original = e.week();
  e.wallet.buy({ product_id: 40008, request_id: 'normal-upgrade' });
  e.wallet.buy({ product_id: 40008, request_id: 'past-upgrade', extra_buy: true, period: 1, day_index: day - 1 });
  const legacyNotification = codec.pack('res_recharge_success', {
    recharge_id: 40009, extra_ret_list: [{ flag: 40, data: codec.pack('pb_daily_discount_all', {}) }]
  }).toString('base64');
  e.store.transaction((model, db) => {
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_week_hunt', rawBinary(modules.get(533)));
    info.week_period_info[0].upgrade_list = [];
    modules.set(533, serializedBinary(codec.pack('pb_week_hunt', info)));
    model.state.modules.value = [...modules];
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('legacy', 'local-1', 'legacy', 40009, 600, JSON.stringify({ hero_activity_id: 104001, notification: legacyNotification }), new Date(atDay(day) * 1000).toISOString());
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('hero-only', 'local-1', 'hero-only', 46002, 600, JSON.stringify({ hero_activity_id: 104001 }), new Date(atDay(day) * 1000).toISOString());
  });
  e.advance(startDay + 9);
  e.reopen();
  assert.equal(e.week().start_day, original.start_day);
  assert.deepEqual(e.week().discount_task_list, original.discount_task_list);
  assert.deepEqual(e.week().upgrade_list.map(row => [row.day_index, row.recharge_id]), [[day, 40008], [day - 1, 40008]]);
  assert.deepEqual(e.week().discount_buy_list.find(row => row.day_index === day).split_buy_ids, [40009]);
  e.weekHunt.ensureLoginState();
  assert.equal(e.week().upgrade_list.length, 2);
  const normal = await purchaseParams(e, e.wallet.buy({ product_id: 46003, request_id: 'after-task-week' }));
  assert.deepEqual(normal.tuple, [false, 1, startDay + 9]);
  assert.equal(e.week().discount_buy_list.length, 2);
  assert.equal(e.week().discount_buy_list.find(row => row.day_index === startDay + 9).one_buy_id, 46003);
});

test('retained activity closes after fourteen 05:00 days without creating a replacement cycle', t => {
  const e = setup(t), original = e.week();
  e.advance(startDay + 14);
  assert.throws(() => e.wallet.buy({ product_id: 40008, request_id: 'expired', period: 1 }), error => error.code === 309);
  e.weekHunt.ensureLoginState();
  assert.deepEqual(e.week(), original);
});
