import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, serializedBinary, encodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  MYSTERY_SHOP_EXPECTED_COUNTS,
  MYSTERY_SHOP_SOURCE_SHA256,
  readMysteryShopTables
} from '../config/mystery-shop-tables.mjs';
import {
  createMysteryShopService,
  MYSTERY_SHOP_COMMANDS,
  MYSTERY_SHOP_MODULE_ID
} from '../game/mystery-shop-service.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const shopTables = readMysteryShopTables();
const FIXED_NOW = 1_792_789_200_000;

const BASE_STATE = Object.freeze({
  next_auto_refresh_time: '0',
  last_manual_refresh_time: '0',
  manual_refresh_count: 0,
  discount_items: [],
  all_times_data: [],
  customize_auto_refresh_times: 0,
  buy_times: '7'
});

function setup(t, offer = {
  cell_id: 1,
  discount_item_tid: '10101001',
  discount_price_index: '7',
  is_bought: false
}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-mystery-shop-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_NOW / 1000, roleName: 'Mystery Shop' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  store.transaction(model => {
    grantResources(model, [[101500, 100_000], [201500, 100_000]], gameTables, { codec });
    const modules = new Map(model.state.modules.value);
    modules.set(MYSTERY_SHOP_MODULE_ID, serializedBinary(codec.pack('pb_mystery_shop', {
      ...BASE_STATE,
      discount_items: [offer]
    })));
    model.state.modules.value = [...modules];
  });
  const service = createMysteryShopService({ store, codec, tables: shopTables, gameTables, now: () => FIXED_NOW });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    service,
    get store() { return store; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
      return createMysteryShopService({ store, codec, tables: shopTables, gameTables, now: () => FIXED_NOW });
    }
  };
}

function amount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function loginState(service) {
  const payload = service.loginPayload();
  assert.equal(payload.present, true);
  return codec.unpack('pb_mystery_shop', payload.data);
}

test('MysteryShop table evidence preserves all original families and client relations', () => {
  assert.equal(shopTables.sourceSha256, MYSTERY_SHOP_SOURCE_SHA256);
  assert.deepEqual(shopTables.counts, MYSTERY_SHOP_EXPECTED_COUNTS);
  assert.equal(shopTables.cell(1).cell_lib_type, 1);
  assert.equal(shopTables.cell(6).cell_lib_type, 2);
  assert.equal(shopTables.item(10101001).item, 21300104);
  assert.equal(shopTables.discount(7).discount, 100);
  assert.deepEqual(shopTables.discountByType.get(2).map(row => row.tid), [8, 9, 10, 11, 12, 13, 14]);
  assert.equal(shopTables.manualRefresh(5).price, 150);
  assert.equal(shopTables.rows.ItemLib.size, 418);
});

test('91503 buys the exact persisted offer, marks the cell, increments buy_times and survives reopen', async t => {
  const env = setup(t);
  const beforeCurrency = amount(env.store, 101500);
  const beforeItem = amount(env.store, 21300104);
  const request = await env.service.decode(MYSTERY_SHOP_COMMANDS.buy, await encodeEtf(1), { etf: decodeEtf });
  const result = env.service.execute(MYSTERY_SHOP_COMMANDS.buy, request, { requestId: 'buy-cell-1' });
  assert.equal(result.schema, 'pb_res_to_client');
  assert.equal(result.duplicate, false);
  assert.equal(amount(env.store, 101500), beforeCurrency - 570);
  assert.equal(amount(env.store, 21300104), beforeItem + 5);
  const state = loginState(env.service);
  assert.equal(state.discount_items[0].is_bought, true);
  assert.equal(state.buy_times, '8');

  const reopened = env.reopen();
  const persisted = loginState(reopened);
  assert.equal(persisted.discount_items[0].is_bought, true);
  assert.equal(persisted.buy_times, '8');
});

test('91503 request id is idempotent and a later request cannot rebuy the same cell', t => {
  const env = setup(t);
  const before = [amount(env.store, 101500), amount(env.store, 21300104)];
  const first = env.service.execute(91503, 1, { requestId: 'same-request' });
  const duplicate = env.service.execute(91503, 1, { requestId: 'same-request' });
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual([amount(env.store, 101500), amount(env.store, 21300104)], [before[0] - 570, before[1] + 5]);
  assert.throws(
    () => env.service.execute(91503, 1, { requestId: 'new-request' }),
    error => error.code === 5 && /already bought/.test(error.message) && /R1-ITEM-MYSTERYSHOP/.test(error.message)
  );
  assert.deepEqual([amount(env.store, 101500), amount(env.store, 21300104)], [before[0] - 570, before[1] + 5]);
  assert.equal(loginState(env.service).buy_times, '8');
});

test('91503 rejects unknown, missing, bought and non-integral-price offers before mutation', t => {
  const unknown = setup(t);
  assert.throws(() => unknown.service.execute(91503, 2, { requestId: 'unknown-cell' }), error => error.code === 5 && /not present/.test(error.message));

  const fractional = setup(t, {
    cell_id: 1,
    discount_item_tid: '10201001',
    discount_price_index: '2',
    is_bought: false
  });
  const before = amount(fractional.store, 101500);
  assert.throws(
    () => fractional.service.execute(91503, 1, { requestId: 'fractional-price' }),
    error => error.code === 5 && /rounding/.test(error.message)
  );
  assert.equal(amount(fractional.store, 101500), before);
  assert.equal(Boolean(loginState(fractional.service).discount_items[0].is_bought), false);

  const bought = setup(t, {
    cell_id: 1,
    discount_item_tid: '10101001',
    discount_price_index: '7',
    is_bought: true
  });
  assert.throws(() => bought.service.execute(91503, 1, { requestId: 'bought' }), error => error.code === 5 && /already bought/.test(error.message));
});

test('91503 malformed ETF and invalid cell parameters use the R1 error-5 boundary', async t => {
  const env = setup(t);
  await assert.rejects(
    env.service.decode(91503, Buffer.from([0xff]), { etf: decodeEtf }),
    error => error.code === 5 && /not valid ETF/.test(error.message) && /R1-ITEM-MYSTERYSHOP/.test(error.message)
  );
  assert.throws(
    () => env.service.execute(91503, 0, { requestId: 'invalid-cell' }),
    error => error.code === 5 && /Invalid mystery shop cell id/.test(error.message)
  );
  assert.equal(amount(env.store, 101500), 100_000);
  assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
});

test('91503 unresolved cell or item pre_condition fails before payment', t => {
  for (const offer of [
    { cell_id: 1, discount_item_tid: '10301043', discount_price_index: '7', is_bought: false },
    { cell_id: 8, discount_item_tid: '10301001', discount_price_index: '15', is_bought: false }
  ]) {
    const env = setup(t, offer);
    const before = amount(env.store, 101500);
    assert.throws(
      () => env.service.execute(91503, offer.cell_id, { requestId: `precondition-${offer.cell_id}` }),
      error => error.code === 5 && /pre_condition/.test(error.message) && /R1-ITEM-MYSTERYSHOP/.test(error.message)
    );
    assert.equal(amount(env.store, 101500), before);
    assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
  }
});

test('91503 insufficient currency uses the R1 boundary and changes neither state nor ledger', t => {
  const env = setup(t);
  env.store.transaction(model => { model.resources.get('101500').num = '100'; });
  assert.throws(() => env.service.execute(91503, 1, { requestId: 'insufficient' }), error => error.code === 5 && /Insufficient/.test(error.message));
  assert.equal(amount(env.store, 101500), 100);
  assert.equal(amount(env.store, 21300104), 0);
  assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
  const count = env.store.inspect(db => db.prepare('SELECT count(*) AS n FROM mystery_shop_purchases').get().n);
  assert.equal(count, 0);
});

test('91501 and 91502 fail closed with field-level recovered gaps instead of falling into generic success', t => {
  const env = setup(t);
  assert.equal(env.service.supports(91501), false);
  assert.equal(env.service.supports(91502), false);
  assert.throws(
    () => env.service.execute(91501, undefined, { requestId: 'auto' }),
    error => error.code === 5 && /ItemLib/.test(error.message) && /all_times_data/.test(error.message)
  );
  assert.throws(
    () => env.service.execute(91502, undefined, { requestId: 'manual' }),
    error => error.code === 5 && /manual_refresh_cw/.test(error.message) && /state replacement/.test(error.message)
  );
  assert.equal(amount(env.store, 101500), 100_000);
  assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
});

test('91503 response encoding failure rolls back resources, purchase ledger and module state', t => {
  const env = setup(t);
  const before = [amount(env.store, 101500), amount(env.store, 21300104)];
  const originalPack = codec.pack;
  codec.pack = (name, value) => {
    if (name === 'pb_res_to_client') throw new Error('forced mystery shop encode failure');
    return originalPack(name, value);
  };
  try {
    assert.throws(() => env.service.execute(91503, 1, { requestId: 'encode-failure' }), /forced mystery shop encode failure/);
  } finally {
    codec.pack = originalPack;
  }
  assert.deepEqual([amount(env.store, 101500), amount(env.store, 21300104)], before);
  assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
  const count = env.store.inspect(db => db.prepare('SELECT count(*) AS n FROM mystery_shop_purchases').get().n);
  assert.equal(count, 0);
});

test('91503 SQLite ledger failure rolls back every purchase mutation', t => {
  const env = setup(t);
  env.store.inspect(db => db.exec(`
    CREATE TRIGGER fail_mystery_shop_purchase BEFORE INSERT ON mystery_shop_purchases
    BEGIN SELECT RAISE(ABORT, 'forced mystery shop SQLite failure'); END;
  `));
  const before = [amount(env.store, 101500), amount(env.store, 21300104)];
  assert.throws(() => env.service.execute(91503, 1, { requestId: 'sqlite-failure' }), /forced mystery shop SQLite failure/);
  assert.deepEqual([amount(env.store, 101500), amount(env.store, 21300104)], before);
  assert.equal(Boolean(loginState(env.service).discount_items[0].is_bought), false);
});
