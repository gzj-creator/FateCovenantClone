import assert from 'node:assert/strict';
import test from 'node:test';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createRegularGiftService, REGULAR_GIFT_HANDLE, REGULAR_GIFT_MODULE_ID } from '../game/regular-gift-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const FIXED_NOW = Math.floor(Date.parse('2026-11-10T12:00:00Z') / 1000);

function moduleInfo(store) {
  const raw = new Map(store.state().modules.value).get(REGULAR_GIFT_MODULE_ID);
  return codec.unpack('pb_regular_gift_info', rawBinary(raw));
}

function eventInfo(event) {
  const bytes = Buffer.isBuffer(event.data) ? event.data : Buffer.from(event.data, 'base64');
  return codec.unpack('pb_regular_gift_info', bytes);
}

function rowFor(info, type) {
  return info.gift_list.find(row => Number(row.type) === Number(type));
}

function buyNumFor(info, type, productId) {
  return Number(rowFor(info, type)?.buy_limit_info?.buy_num_list
    ?.find(row => Number(row.recharge_id) === Number(productId))?.buy_num ?? 0);
}

function etfNumbers(value) {
  return (value?.value ?? value).map(item => Number(item?.value ?? item));
}

function setupWallet(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-regular-gift-', now: () => FIXED_NOW });
  const pushes = [];
  const make = () => createWalletService({
    store: fixture.store,
    codec,
    tables,
    now: () => FIXED_NOW,
    publish: (type, data) => pushes.push({ type, data })
  });
  let wallet = make();
  return {
    get store() { return fixture.store; },
    get wallet() { return wallet; },
    pushes,
    reopen() {
      fixture.open();
      wallet = make();
    }
  };
}

test('all configured mall gift SKUs are mapped and every limited SKU reaches sold out in module 26', () => {
  const service = createRegularGiftService({ codec, tables });
  const configuredGroupIds = new Set([...tables.RegularGift.values()].flatMap(row => row.groups ?? []).map(Number));
  assert.equal(service.activeTypes.length, 17);
  assert.equal(service.configuredProductIds.length, 84);
  assert.equal(service.limitedProductIds.length, 83);
  assert.equal(new Set(service.configuredProductIds).size, 84);
  assert.equal(new Set(service.limitedProductIds).size, 83);

  for (const productId of service.configuredProductIds) {
    const type = service.typeForProduct(productId);
    const groupId = service.groupIdForProduct(productId);
    assert.equal(service.supportsProduct(productId), true, `unmapped RegularGift SKU ${productId}`);
    assert.ok(type > 0, `missing RegularGift type for ${productId}`);
    assert.ok(groupId > 0, `missing RegularGift group for ${productId}`);
    assert.equal(configuredGroupIds.has(groupId), true, `non-config group for ${productId}`);
  }

  const rows = service.limitedProductIds.flatMap(productId => {
    const limit = Number(tables.Recharge.get(productId).can_buy_times);
    return Array.from({ length: limit }, () => ({
      product_id: productId,
      created_at: new Date(FIXED_NOW * 1000).toISOString(),
      payload_json: '{}'
    }));
  });
  const info = service.buildInfo({ rows, at: FIXED_NOW });
  assert.equal(info.gift_list.length, 17);
  for (const productId of service.limitedProductIds) {
    assert.equal(
      buyNumFor(info, service.typeForProduct(productId), productId),
      Number(tables.Recharge.get(productId).can_buy_times),
      `missing sold-out state for ${productId}`
    );
  }

  const daily = rowFor(info, 1).buy_limit_info;
  const weekly = rowFor(info, 2).buy_limit_info;
  assert.ok(Number(daily.refresh_time) > FIXED_NOW);
  assert.ok(Number(weekly.refresh_time) > FIXED_NOW);
  assert.equal(Number(rowFor(info, 22).buy_limit_info.refresh_time), 0);
  assert.equal(Number(rowFor(info, 25).buy_limit_info.refresh_time), 0);
});
test('daily and weekly mall purchase counters roll over while lifetime counters remain', () => {
  const service = createRegularGiftService({ codec, tables });
  const oldAt = Math.floor(Date.parse('2026-11-01T12:00:00Z') / 1000);
  const rows = [
    { product_id: 111001, created_at: new Date(oldAt * 1000).toISOString(), payload_json: '{}' },
    { product_id: 112001, created_at: new Date(oldAt * 1000).toISOString(), payload_json: '{}' },
    { product_id: 520001, created_at: new Date((oldAt - 30 * 86400) * 1000).toISOString(), payload_json: '{}' }
  ];
  const before = service.buildInfo({ rows, at: oldAt });
  assert.deepEqual([
    buyNumFor(before, 1, 111001),
    buyNumFor(before, 2, 112001),
    buyNumFor(before, 22, 520001)
  ], [1, 1, 1]);

  const after = service.buildInfo({ rows, at: oldAt + 8 * 86400 + 9 * 3600 });
  assert.deepEqual([
    buyNumFor(after, 1, 111001),
    buyNumFor(after, 2, 112001),
    buyNumFor(after, 22, 520001)
  ], [0, 0, 1]);
});

test('resource and cash mall purchases immediately publish complete flag-7 state and survive restart', async t => {
  const env = setupWallet(t);
  env.store.transaction(model => grantResources(model, [[401500, 10000]], tables));

  for (const [index, productId] of [111001, 111014, 111011].entries()) {
    const buyNum = productId === 111001 ? 3 : 1;
    const result = env.wallet.purchaseGift({
      product_id: productId,
      request_id: 'regular-resource-' + index,
      buy_num: buyNum
    });
    const event = result.extra_ret_list.find(row => Number(row.flag) === REGULAR_GIFT_HANDLE);
    assert.ok(event, `missing flag 7 for ${productId}`);
    const info = eventInfo(event);
    assert.equal(rowFor(info, 1).buy_limit_info.buy_num_list.length, 19);
    assert.equal(buyNumFor(info, 1, productId), buyNum);
    if (productId === 111011) {
      assert.deepEqual([111001, 111014, 111011].map(id => buyNumFor(info, 1, id)), [3, 1, 1]);
    }
  }

  assert.throws(
    () => env.wallet.purchaseGift({ product_id: 111011, request_id: 'regular-resource-repeat' }),
    error => error.code === 307
  );
  assert.deepEqual(
    [111001, 111014, 111011].map(id => buyNumFor(moduleInfo(env.store), 1, id)),
    [3, 1, 1]
  );

  env.wallet.credit({ account_id: 'local-1', amount_cents: 600, request_id: 'regular-cash-fund' });
  const cash = env.wallet.buy({ product_id: 520001, request_id: 'regular-cash' });
  const notification = codec.unpack('res_recharge_success', Buffer.from(cash.notification, 'base64'));
  assert.deepEqual(notification.extra_ret_list.map(row => Number(row.flag)), [73, REGULAR_GIFT_HANDLE]);
  assert.deepEqual(
    etfNumbers(await decodeEtf(Buffer.from(notification.extra_params, 'base64'))),
    [22001001]
  );
  assert.equal(buyNumFor(eventInfo(notification.extra_ret_list.find(row => Number(row.flag) === REGULAR_GIFT_HANDLE)), 22, 520001), 1);
  assert.equal(buyNumFor(moduleInfo(env.store), 22, 520001), 1);
  assert.throws(
    () => env.wallet.buy({ product_id: 520001, request_id: 'regular-cash-repeat' }),
    error => error.code === 307
  );

  env.reopen();
  const restored = moduleInfo(env.store);
  assert.deepEqual(
    [111001, 111014, 111011].map(id => buyNumFor(restored, 1, id)),
    [3, 1, 1]
  );
  assert.equal(buyNumFor(restored, 22, 520001), 1);
});
