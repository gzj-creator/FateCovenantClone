import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createVoucherService } from '../game/voucher-service.mjs';
import { createMailService } from '../game/mail-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const PERMIT_PRODUCT = 1300071;
const PERMIT_ACT = 1004012;

function fixture() {
  return {
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-'));
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

function permitInfoFromLogin(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  const login = codec.unpack('pb_act_role_login', rawBinary(moduleValue.value[0]));
  const entry = login.data_list.find(row => Number(row.act_stage?.act_id) === PERMIT_ACT);
  assert.ok(entry);
  const wrapped = Buffer.from(entry.module_login_data, 'base64');
  assert.deepEqual([...wrapped.subarray(0, 2)], [0x83, 0x6d]);
  const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
  return message.month_permit_data.month_permit_list.find(row => Number(row.id) === PERMIT_ACT);
}

function rechargeTotal(store) {
  return codec.unpack('res_recharge_login', rawBinary(new Map(store.state().modules.value).get(19))).total_amount ?? 0;
}

const voucherRequest = (overrides = {}) => ({
  account_id: 'local-1',
  request_id: 'permit-voucher-1',
  amount_cents: 10000,
  title: '活动补偿',
  content: '测试代金券',
  expire_at: Math.floor(Date.now() / 1000) + 3600,
  ...overrides
});

test('month permit purchase with vouchers stores pay_list, returns flag 116 and counts full price as cumulative recharge', async t => {
  const e = setup(t);
  const issued = e.mail.issueVoucher(voucherRequest());
  e.mail.claim(issued.mail_id);
  const before = rechargeTotal(e.store);

  const result = e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-voucher-buy', voucher_item_tid: 701500 });
  assert.equal(result.voucher_quantity, 6800);
  assert.equal(result.voucher_amount_cents, 6800);
  assert.equal(result.balance_paid_cents, 0);
  assert.equal(e.voucher.balance().quantity, 3200);
  assert.equal(rechargeTotal(e.store), before + 6800);

  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(push.get_token, true);
  assert.equal(push.is_use_token, true);
  assert.equal(Number(push.use_item_tid), 701500);
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.deepEqual(extraParams.value, [6800]);
  assert.equal(push.extra_ret_list.length, 1);
  assert.equal(push.extra_ret_list[0].flag, 116);
  const info = codec.unpack('pb_month_permit_info', Buffer.from(push.extra_ret_list[0].data, 'base64'));
  assert.equal(Number(info.id), PERMIT_ACT);
  assert.deepEqual(info.pay_list.map(Number), [PERMIT_PRODUCT]);

  assert.deepEqual(permitInfoFromLogin(e.store).pay_list.map(Number), [PERMIT_PRODUCT]);
  e.reopen();
  assert.deepEqual(permitInfoFromLogin(e.store).pay_list.map(Number), [PERMIT_PRODUCT]);
  assert.equal(rechargeTotal(e.store), before + 6800);
});

test('month permit purchase with balance also records pay_list and returns the activity handoff', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'permit-fund' });
  const before = rechargeTotal(e.store);
  const result = e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-balance-buy' });
  assert.equal(result.balance_cents, 3200);
  assert.equal(rechargeTotal(e.store), before + 6800);
  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(Boolean(push.get_token), false);
  assert.equal(Buffer.from(push.extra_params ?? Buffer.alloc(0), 'base64').length, 0);
  assert.equal(push.extra_ret_list.length, 1);
  assert.equal(push.extra_ret_list[0].flag, 116);
  assert.deepEqual(permitInfoFromLogin(e.store).pay_list.map(Number), [PERMIT_PRODUCT]);
});

test('repeated month permit purchase is rejected and leaves voucher, orders and login data untouched', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'permit-repeat-fund' });
  const issued = e.mail.issueVoucher(voucherRequest());
  e.mail.claim(issued.mail_id);
  e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-first', voucher_item_tid: 701500 });
  const state = e.store.state();
  const pushes = e.pushes.length;
  assert.throws(() => e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-second' }), x => x.code === 307);
  assert.deepEqual(e.store.state(), state);
  assert.equal(e.voucher.balance().quantity, 3200);
  assert.equal(e.wallet.snapshot().orders.length, 1);
  assert.equal(e.pushes.length, pushes);
});

test('voucher payment of an ordinary product still counts the full product price as cumulative recharge', async t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 1000, request_id: 'ordinary-fund' });
  const issued = e.mail.issueVoucher(voucherRequest({ amount_cents: 1000 }));
  e.mail.claim(issued.mail_id);
  const before = rechargeTotal(e.store);
  const result = e.wallet.buy({ product_id: 11, request_id: 'ordinary-partial', voucher_amount_cents: 200 });
  assert.equal(result.voucher_amount_cents, 200);
  assert.equal(result.balance_paid_cents, 400);
  assert.equal(rechargeTotal(e.store), before + 600);
  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(push.get_token, true);
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assert.deepEqual(extraParams.value, [600]);
});
