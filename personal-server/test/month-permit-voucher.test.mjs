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

function assertRechargeExtra(extraParams, extraBuy = false) {
  assert.equal(extraParams.value.length, 1);
  const tuple = extraParams.value[0];
  assert.ok(tuple && Array.isArray(tuple.value));
  assert.equal(tuple.value.length, 3);
  assert.equal(tuple.value[0], extraBuy);
  assert.equal(tuple.value[1], 0);
  assert.ok(Number.isSafeInteger(tuple.value[2]) && tuple.value[2] > 0);
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
  assert.equal(result.voucher_quantity, 68);
  assert.equal(result.voucher_amount_cents, 6800);
  assert.equal(result.balance_paid_cents, 0);
  assert.equal(e.voucher.balance().quantity, 32);
  assert.equal(rechargeTotal(e.store), before + 6800);

  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(Boolean(push.get_token), false);
  assert.equal(push.is_use_token, true);
  assert.equal(Number(push.use_item_tid), 701500);
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assertRechargeExtra(extraParams);
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

test('wallet uses all available vouchers and charges the remainder for a partially covered order', async t => {
  const e = setup(t);
  const issued = e.mail.issueVoucher(voucherRequest({ request_id: 'partial-voucher-mail', amount_cents: 400, content: 'partial voucher' }));
  e.mail.claim(issued.mail_id);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 200, request_id: 'partial-balance' });
  const product = tables.Recharge.get(40009);
  assert.equal(product.price, 600);
  const result = e.wallet.buy({ product_id: 40009, request_id: 'partial-voucher-order', voucher_count: 4 });
  assert.equal(result.price_cents, 600);
  assert.equal(result.voucher_quantity, 4);
  assert.equal(result.voucher_amount_cents, 400);
  assert.equal(result.balance_paid_cents, 200);
  assert.equal(result.balance_cents, 0);
  assert.equal(e.voucher.balance().quantity, 0);
  assert.equal(e.wallet.snapshot().orders[0].voucher_quantity, 4);
  assert.equal(e.wallet.snapshot().orders[0].balance_paid_cents, 200);
});

test('month permit purchase with balance also records pay_list and returns the activity handoff', async t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'permit-fund' });
  const before = rechargeTotal(e.store);
  const result = e.wallet.buy({ product_id: PERMIT_PRODUCT, request_id: 'permit-balance-buy' });
  assert.equal(result.balance_cents, 3200);
  assert.equal(rechargeTotal(e.store), before + 6800);
  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(Boolean(push.get_token), false);
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assertRechargeExtra(extraParams);
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
  assert.equal(e.voucher.balance().quantity, 32);
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
  assert.equal(Boolean(push.get_token), false);
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assertRechargeExtra(extraParams);
});

test('voucher payment of a month-card product grants mixed rewards and counts full price as cumulative recharge', async t => {
  const e = setup(t);
  const issued = e.mail.issueVoucher(voucherRequest({ amount_cents: 10000 }));
  e.mail.claim(issued.mail_id);
  assert.ok(e.wallet.snapshot().products.some(product => product.id === 140001));
  const before = rechargeTotal(e.store);

  const result = e.wallet.buy({ product_id: 140001, request_id: 'month-card-voucher', voucher_item_tid: 701500 });
  assert.equal(result.voucher_quantity, 30);
  assert.equal(result.voucher_amount_cents, 3000);
  assert.equal(result.balance_paid_cents, 0);
  assert.equal(e.voucher.balance().quantity, 70);
  assert.equal(rechargeTotal(e.store), before + 3000);
  assert.equal(e.store.read().resources.get('101500').num, '1000');
  assert.equal(e.store.read().resources.get('2002').num, '10');

  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(Number(push.recharge_id), 140001);
  assert.equal(Boolean(push.get_token), false);
  assert.deepEqual(push.res.changes.find(change => Number(change.tid) === 701500)?.diff_num, '-30');
  assert.deepEqual(push.res.changes.find(change => Number(change.tid) === 101500)?.diff_num, '1000');
  assert.deepEqual(push.res.changes.find(change => Number(change.tid) === 2002)?.diff_num, '10');
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assertRechargeExtra(extraParams);
});

test('voucher payment of a type-46 diamond recharge grants rewards and counts full price as cumulative recharge', async t => {
  const e = setup(t);
  const issued = e.mail.issueVoucher(voucherRequest({ amount_cents: 10000 }));
  e.mail.claim(issued.mail_id);
  assert.ok(e.wallet.snapshot().products.some(product => product.id === 40008));
  const before = rechargeTotal(e.store);

  const result = e.wallet.buy({ product_id: 40008, request_id: 'type46-voucher', voucher_item_tid: 701500 });
  assert.equal(result.voucher_quantity, 30);
  assert.equal(result.voucher_amount_cents, 3000);
  assert.equal(result.balance_paid_cents, 0);
  assert.equal(e.voucher.balance().quantity, 70);
  assert.equal(rechargeTotal(e.store), before + 3000);
  assert.equal(e.store.read().resources.get('101500').num, '300');

  const push = codec.unpack('res_recharge_success', e.pushes.find(item => item.type === 1900).data);
  assert.equal(Number(push.recharge_id), 40008);
  assert.equal(Boolean(push.get_token), false);
  assert.deepEqual(push.res.changes.find(change => Number(change.tid) === 701500)?.diff_num, '-30');
  assert.deepEqual(push.res.changes.find(change => Number(change.tid) === 101500)?.diff_num, '300');
  const extraParams = await decodeEtf(Buffer.from(push.extra_params, 'base64'));
  assertRechargeExtra(extraParams);
  const giftRecord = push.extra_ret_list.find(entry => entry.flag === 73);
  assert.ok(giftRecord);
  const giftRecordValue = codec.unpack('pb_buy_gift_record', Buffer.from(giftRecord.data, 'base64'));
  assert.equal(Number(giftRecordValue.recharge_tid), 40008);
  assert.ok(Number(giftRecordValue.buy_time) > 0);
  const loginAfterPurchase = codec.unpack('res_recharge_login', rawBinary(new Map(e.store.state().modules.value).get(19)));
  const recordList = codec.unpack('pb_buy_gift_record_list', Buffer.from(loginAfterPurchase.buy_gift_record, 'base64')).record_list;
  assert.deepEqual(recordList.map(record => Number(record.recharge_tid)), [40008]);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'type46-limit-fund' });
  const additional = e.wallet.buy({ product_id: 40008, request_id: 'type46-second', voucher_item_tid: 701500, extra_buy: true });
  assert.equal(additional.daily_discount_additional, true);
  assert.equal(e.voucher.balance().quantity, 40);
});
