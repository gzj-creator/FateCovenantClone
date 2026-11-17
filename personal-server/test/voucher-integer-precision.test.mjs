import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createVoucherService } from '../game/voucher-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createAdminService } from '../admin/server.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { money, quantity } from '../admin/numeric-format.js';

const codec = createGameCodec(), tables = readGameTables();

test('voucher balances preserve quantity and cents independently across JSON, spending and reopening', async t => {
  const env = createGameFixture(t, codec);
  let voucher = createVoucherService({ store: env.store, tables });
  env.store.transaction(model => grantResources(model, [[701500, Number.MAX_SAFE_INTEGER]], tables, { codec }));
  assert.equal(voucher.balance().quantity, Number.MAX_SAFE_INTEGER);
  assert.equal(voucher.balance().amount_cents, '900719925474099100');
  env.store.transaction(model => grantResources(model, [[701500, 2]], tables, { codec }));
  const expected = { quantity: '9007199254740993', amount_cents: '900719925474099300' };
  assert.deepEqual(JSON.parse(JSON.stringify(voucher.snapshot())).balance, expected);
  const wallet = createWalletService({ store: env.store, codec, tables, voucher });
  const admin = createAdminService({ wallet, voucher, token: 'numeric-test' });
  t.after(() => admin.close());
  const address = await admin.listen(0);
  const response = await fetch(`http://127.0.0.1:${address.port}/api/vouchers`, { headers: { Authorization: 'Bearer numeric-test' } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).balance, expected);
  const script = await fetch(`http://127.0.0.1:${address.port}/numeric-format.js`);
  assert.equal(script.status, 200);
  assert.match(await script.text(), /export function money/);
  const order = wallet.buy({ product_id: 11, request_id: 'exact-voucher', voucher_count: 6 });
  assert.equal(order.voucher_amount_cents, 600);
  assert.equal(env.store.read().resources.get('701500').num, '9007199254740987');
  env.open();
  voucher = createVoucherService({ store: env.store, tables });
  assert.equal(voucher.balance().quantity, 9007199254740987);
  assert.equal(voucher.balance().amount_cents, '900719925474098700');
});

test('voucher redeemed total covers the full ledger while recent details remain limited to 100', t => {
  const { store } = createGameFixture(t, codec);
  const voucher = createVoucherService({ store, tables });
  createWalletService({ store, codec, tables, voucher });
  store.transaction((model, db) => {
    grantResources(model, [[701500, 200]], tables, { codec });
    const insert = db.prepare("INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?, 'local-1', ?, 11, 100, '{}', ?)");
    for (let i = 0; i < 101; i++) {
      const orderId = 'numeric-ledger-' + i;
      insert.run(orderId, orderId, new Date().toISOString());
      voucher.consume({ model, db, orderId, roleId: model.state.roleId, quantity: 1, amountCents: 100 });
    }
  });
  const snapshot = voucher.snapshot();
  assert.equal(snapshot.redemptions.length, 100);
  assert.equal(snapshot.totals.redeemed_amount_cents, 10100);
  assert.equal(snapshot.balance.quantity, 99);
});

test('admin formats exact integer cents and quantities through the int64 limit', () => {
  assert.equal(money('900719925474099301'), '¥ 9,007,199,254,740,993.01');
  assert.equal(money('-9223372036854775807'), '-¥ 92,233,720,368,547,758.07');
  assert.equal(quantity('9007199254740993'), '9,007,199,254,740,993');
  assert.equal(money(600), '¥ 6.00');
  assert.equal(money(-5), '-¥ 0.05');
});
