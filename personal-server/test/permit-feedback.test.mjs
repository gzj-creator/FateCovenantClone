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
import { createPermitService } from '../game/permit-service.mjs';
import { createMonthPermitService } from '../game/month-permit-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const STANDARD_PERMITS = [
  { productId: 191201, permitId: 6701, price: 19800 },
  { productId: 191202, permitId: 6801, price: 19800 },
  { productId: 191203, permitId: 6901, price: 19800 },
  { productId: 191204, permitId: 7001, price: 16800 },
  { productId: 191205, permitId: 7101, price: 16800 }
];
const MONTH_PERMITS = [
  { productId: 1300071, price: 6800 },
  { productId: 1300072, price: 9800 },
  { productId: 1300073, price: 19800 },
  { productId: 1300074, price: 32800 }
];
const MONTH_PERMIT_ACT = 1004012;

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

function setup(t, { permitService } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-permit-feedback-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  const pushes = [];
  const make = () => {
    const voucher = createVoucherService({ store, tables });
    const wallet = createWalletService({
      store, codec, tables, voucher, permitService,
      publish: (type, data) => pushes.push({ type, data })
    });
    const mail = createMailService({
      store, codec, tables, voucher,
      publish: (type, data) => pushes.push({ type, data })
    });
    return { voucher, wallet, mail };
  };
  let services = make();
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    pushes,
    get store() { return store; },
    get wallet() { return services.wallet; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      services = make();
    }
  };
}

function permitRows(store) {
  const moduleValue = new Map(store.state().modules.value).get(38);
  return moduleValue.value.flatMap(element => codec.unpack('pb_permit_data', rawBinary(element)).permit_list ?? []);
}

function monthPermitInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  for (const element of moduleValue.value) {
    const login = codec.unpack('pb_act_role_login', rawBinary(element));
    for (const entry of login.data_list ?? []) {
      if (typeof entry.module_login_data !== 'string') continue;
      const wrapped = Buffer.from(entry.module_login_data, 'base64');
      if (wrapped.length < 6 || wrapped[0] !== 0x83 || wrapped[1] !== 0x6d) continue;
      const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
      const info = message.month_permit_data?.month_permit_list?.find(row => Number(row.id) === MONTH_PERMIT_ACT);
      if (info) return info;
    }
  }
  throw new Error('Active month permit fixture not found');
}

function lastRechargePush(pushes) {
  const rows = pushes.filter(push => push.type === 1900);
  assert.ok(rows.length > 0);
  return codec.unpack('res_recharge_success', rows.at(-1).data);
}

test('all standard permits return a non-empty flag-9 handoff, persist and reject repeats', t => {
  const e = setup(t);
  const permitService = createPermitService({ codec, tables });
  const productIds = new Set(e.wallet.snapshot().products.map(product => Number(product.id)));
  for (const permit of STANDARD_PERMITS) {
    assert.ok(productIds.has(permit.productId));
    assert.equal(permitService.supports(tables.Recharge.get(permit.productId)), true);
  }
  e.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'permit-feedback-fund' });

  for (const permit of STANDARD_PERMITS) {
    const result = e.wallet.buy({ product_id: permit.productId, request_id: 'permit-' + permit.productId });
    assert.equal(result.price_cents, permit.price);
    const push = lastRechargePush(e.pushes);
    assert.ok(push.extra_ret_list.length > 0);
    const entry = push.extra_ret_list.find(row => row.flag === 9);
    assert.ok(entry);
    const info = codec.unpack('pb_permit_info', Buffer.from(entry.data, 'base64'));
    assert.equal(Number(info.id), permit.permitId);
    assert.equal(info.is_pay, true);
    assert.equal(permitRows(e.store).find(row => Number(row.id) === permit.permitId).is_pay, true);
  }

  assert.equal(e.wallet.snapshot().orders.length, STANDARD_PERMITS.length);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, 7000);
  e.reopen();
  for (const permit of STANDARD_PERMITS) {
    assert.equal(permitRows(e.store).find(row => Number(row.id) === permit.permitId).is_pay, true);
  }
  assert.equal(e.wallet.snapshot().orders.length, STANDARD_PERMITS.length);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 20000, request_id: 'permit-duplicate-fund' });

  const state = e.store.state();
  const orders = e.wallet.snapshot().orders.length;
  const balance = e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents;
  const pushes = e.pushes.length;
  assert.throws(
    () => e.wallet.buy({ product_id: STANDARD_PERMITS[0].productId, request_id: 'permit-duplicate' }),
    error => error.code === 307
  );
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, orders);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, balance);
  assert.equal(e.pushes.length, pushes);
});

test('all active month permits return flag 116, accumulate pay_list and persist', t => {
  const e = setup(t);
  const monthService = createMonthPermitService({ codec, tables });
  const productIds = new Set(e.wallet.snapshot().products.map(product => Number(product.id)));
  for (const permit of MONTH_PERMITS) {
    assert.ok(productIds.has(permit.productId));
    assert.equal(monthService.supports(tables.Recharge.get(permit.productId)), true);
  }
  e.wallet.credit({ account_id: 'local-1', amount_cents: 70000, request_id: 'month-permit-feedback-fund' });

  const expectedPayList = [];
  for (const permit of MONTH_PERMITS) {
    const result = e.wallet.buy({ product_id: permit.productId, request_id: 'month-permit-' + permit.productId });
    assert.equal(result.price_cents, permit.price);
    expectedPayList.push(permit.productId);
    const push = lastRechargePush(e.pushes);
    assert.ok(push.extra_ret_list.length > 0);
    const entry = push.extra_ret_list.find(row => row.flag === 116);
    assert.ok(entry);
    const info = codec.unpack('pb_month_permit_info', Buffer.from(entry.data, 'base64'));
    assert.equal(Number(info.id), MONTH_PERMIT_ACT);
    assert.deepEqual(info.pay_list.map(Number), expectedPayList);
    assert.deepEqual(monthPermitInfo(e.store).pay_list.map(Number), expectedPayList);
  }

  assert.equal(e.wallet.snapshot().orders.length, MONTH_PERMITS.length);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, 800);
  e.reopen();
  assert.deepEqual(monthPermitInfo(e.store).pay_list.map(Number), expectedPayList);
  assert.equal(e.wallet.snapshot().orders.length, MONTH_PERMITS.length);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'month-permit-duplicate-fund' });

  const state = e.store.state();
  const orders = e.wallet.snapshot().orders.length;
  const balance = e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents;
  const pushes = e.pushes.length;
  assert.throws(
    () => e.wallet.buy({ product_id: MONTH_PERMITS[1].productId, request_id: 'month-permit-duplicate' }),
    error => error.code === 307
  );
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, orders);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, balance);
  assert.equal(e.pushes.length, pushes);
});

test('a permit handoff packing failure rolls back order, balance and permit state', t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_permit_info') throw new Error('injected permit handoff failure');
      return codec.pack(name, value);
    }
  };
  const permitService = createPermitService({ codec: failingCodec, tables });
  const e = setup(t, { permitService });
  e.wallet.credit({ account_id: 'local-1', amount_cents: 20000, request_id: 'permit-rollback-fund' });
  const state = e.store.state();
  const orders = e.wallet.snapshot().orders.length;
  const balance = e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents;
  const pushes = e.pushes.length;

  assert.throws(
    () => e.wallet.buy({ product_id: 191201, request_id: 'permit-rollback' }),
    /injected permit handoff failure/
  );
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.wallet.snapshot().orders.length, orders);
  assert.equal(e.wallet.snapshot().accounts.find(row => row.account_id === 'local-1').balance_cents, balance);
  assert.equal(e.pushes.length, pushes);
  assert.equal(permitRows(e.store).find(row => Number(row.id) === 6701).is_pay, undefined);
});
