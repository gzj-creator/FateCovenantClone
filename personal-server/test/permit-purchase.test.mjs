import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createVoucherService } from '../game/voucher-service.mjs';
import { createMailService } from '../game/mail-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const PERMIT_PRODUCT = 191201;
const PERMIT_ID = 6701;

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

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-permit-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  const pushes = [];
  const make = () => {
    const voucher = createVoucherService({ store, tables });
    const wallet = createWalletService({ store, codec, tables, voucher, publish: (type, data) => pushes.push({ type, data }) });
    const mail = createMailService({ store, codec, tables, voucher, publish: (type, data) => pushes.push({ type, data }) });
    return { voucher, wallet, mail };
  };
  let services = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    pushes,
    get store() { return store; },
    get voucher() { return services.voucher; },
    get wallet() { return services.wallet; },
    get mail() { return services.mail; },
    reopen() { store.close(); store = createGameStore({ databasePath, seed, codec }); services = make(); }
  };
}

function permitLogin(store) {
  const moduleValue = new Map(store.state().modules.value).get(38);
  return moduleValue.value.map(element => codec.unpack('pb_permit_data', rawBinary(element)));
}

test('permit 191201 is purchasable, marks module 38 paid and persists across restart', t => {
  const e = setup(t);
  assert.ok(e.wallet.snapshot().products.some(product => product.id === PERMIT_PRODUCT));
  e.wallet.credit({ account_id: 'local-1', amount_cents: 20000, request_id: 'permit-fund' });
  const issued = e.mail.issueVoucher({
    account_id: 'local-1',
    request_id: 'permit-voucher',
    amount_cents: 400,
    title: 'Permit voucher',
    expire_at: Math.floor(Date.now() / 1000) + 3600
  });
  e.mail.claim(issued.mail_id);
  const before = permitLogin(e.store);
  assert.equal(before.length, 4);
  assert.equal(before[1].permit_list.find(row => Number(row.id) === PERMIT_ID).is_pay, undefined);

  const result = e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-buy', voucher_count: 4 });
  assert.equal(result.price_cents, 19800);
  assert.equal(result.voucher_quantity, 4);
  assert.equal(result.voucher_amount_cents, 400);
  assert.equal(result.balance_paid_cents, 19400);
  assert.equal(result.balance_cents, 600);
  assert.equal(e.voucher.balance().quantity, 0);
  const notification = codec.unpack('res_recharge_success', e.pushes.find(push => push.type === 1900).data);
  assert.equal(Boolean(notification.get_token), false);
  assert.equal(notification.is_use_token, true);
  assert.equal(Number(notification.use_item_tid), 701500);
  assert.ok(notification.extra_ret_list.some(entry => Number(entry.flag) === 9));

  const after = permitLogin(e.store);
  assert.equal(after.length, 4);
  assert.equal(after[1].permit_list.find(row => Number(row.id) === PERMIT_ID).is_pay, true);
  assert.equal(after[1].permit_list.find(row => Number(row.id) === PERMIT_ID).open_day, before[1].permit_list.find(row => Number(row.id) === PERMIT_ID).open_day);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 1);
  assert.equal(e.wallet.snapshot().orders.length, 1);
  assert.equal(e.wallet.snapshot().totals.voucher_order_count, 1);

  e.reopen();
  assert.equal(permitLogin(e.store)[1].permit_list.find(row => Number(row.id) === PERMIT_ID).is_pay, true);
  assert.equal(e.wallet.snapshot().orders.length, 1);
  assert.equal(e.voucher.balance().quantity, 0);
});

test('repeated permit purchase returns 307 without charging or changing login data', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 40000, request_id: 'permit-repeat-fund' });
  e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-first' });
  const state = e.store.state();
  const orders = e.wallet.snapshot().orders.length;
  const balance = e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents;
  const pushes = e.pushes.filter(push => push.type === 1900).length;

  assert.throws(
    () => e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-second' }),
    error => error.code === 307
  );
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, orders);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, balance);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, pushes);
});
