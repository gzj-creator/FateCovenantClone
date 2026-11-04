import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createRechargeExtraAwardService } from '../game/recharge-extra-award-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const CREATED_AT = Date.parse('2026-10-29T21:30:00Z') / 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recharge-extra-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let now = Date.parse('2026-10-31T00:00:00Z');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: CREATED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Recharge Extra Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  const store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
  const extra = createRechargeExtraAwardService({ codec, tables });
  const pushes = [];
  const wallet = createWalletService({
    store, codec, tables, rechargeExtraAward: extra,
    now: () => Math.floor(now / 1000),
    publish: (type, data) => pushes.push({ type, data })
  });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    store, wallet, extra, pushes,
    setNow(value) { now = value; },
    loginInfo() {
      const modules = new Map(store.state().modules.value);
      return codec.unpack('res_recharge_login', rawBinary(modules.get(19)));
    },
    extraInfo() {
      const login = this.loginInfo();
      const bytes = Buffer.from(login.recharge_extra_award_info ?? '', 'base64');
      return bytes.length ? codec.unpack('pb_recharge_extra_award_info', bytes) : { flush_day: '0', buy_num_list: [] };
    },
    push() { return codec.unpack('res_recharge_success', this.pushes.at(-1).data); }
  };
}

test('diamond recharge grants indexed extra rewards, publishes flag 1 and resets after 60 recharge days', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'extra-credit' });
  e.wallet.buy({ product_id: 11, request_id: 'extra-buy-1' });
  let push = e.push();
  let extra = codec.unpack('pb_recharge_extra_award_info', Buffer.from(push.extra_ret_list.find(row => row.flag === 1).data, 'base64'));
  assert.equal(Number(extra.buy_num_list.find(row => Number(row.key) === 11).value), 1);
  assert.equal(push.res.changes.filter(row => row.tid === '101500').reduce((sum, row) => sum + Number(row.diff_num), 0), 180);

  e.wallet.buy({ product_id: 11, request_id: 'extra-buy-2' });
  push = e.push();
  extra = codec.unpack('pb_recharge_extra_award_info', Buffer.from(push.extra_ret_list.find(row => row.flag === 1).data, 'base64'));
  assert.equal(Number(extra.buy_num_list.find(row => Number(row.key) === 11).value), 2);
  assert.equal(push.res.changes.filter(row => row.tid === '101500').reduce((sum, row) => sum + Number(row.diff_num), 0), 150);

  e.setNow(Date.parse('2026-12-31T00:00:00Z'));
  e.wallet.buy({ product_id: 11, request_id: 'extra-buy-after-reset' });
  push = e.push();
  extra = codec.unpack('pb_recharge_extra_award_info', Buffer.from(push.extra_ret_list.find(row => row.flag === 1).data, 'base64'));
  assert.equal(Number(extra.buy_num_list.find(row => Number(row.key) === 11).value), 1);
  assert.equal(push.res.changes.filter(row => row.tid === '101500').reduce((sum, row) => sum + Number(row.diff_num), 0), 180);
});

test('16005 gift purchases do not consume diamond extra-award state', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'extra-gift-credit' });
  e.store.transaction(model => grantResources(model, [[401500, 100000]], tables, { codec }));
  const before = e.loginInfo().recharge_extra_award_info ?? '';
  e.wallet.purchaseGift({ product_id: 110001, request_id: 'extra-gift-purchase', buy_num: 1 });
  assert.equal(e.loginInfo().recharge_extra_award_info ?? '', before);
});

test('extra-award failure after base rewards rolls back the paid order and module 19', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'extra-rollback-credit' });
  const beforeBalance = e.wallet.snapshot().accounts[0].balance_cents;
  const beforeModule = rawBinary(new Map(e.store.state().modules.value).get(19)).toString('base64');
  e.store.inspect(db => db.exec("CREATE TRIGGER fail_extra_ledger BEFORE INSERT ON wallet_ledger BEGIN SELECT RAISE(ABORT, 'extra rollback'); END"));
  assert.throws(() => e.wallet.buy({ product_id: 11, request_id: 'extra-rollback-buy' }), /extra rollback/);
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, beforeBalance);
  assert.equal(rawBinary(new Map(e.store.state().modules.value).get(19)).toString('base64'), beforeModule);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), 0);
});
