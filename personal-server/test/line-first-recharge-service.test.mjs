import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createLineFirstRechargeService } from '../game/line-first-recharge-service.mjs';
import { createRechargeBonusService } from '../game/recharge-bonus-service.mjs';
import { createRechargeExtraAwardService } from '../game/recharge-extra-award-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const CREATED_AT = Date.parse('2026-09-12T00:00:00Z') / 1000;
const OPENED_AT = Date.parse('2026-09-12T00:00:00Z') / 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-line-first-recharge-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let now = Date.parse('2026-10-25T20:59:59Z');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: CREATED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Linear First Recharge Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT });
  let lineFirstRecharge, rechargeBonus, wallet, walletPushes;
  const make = () => {
    lineFirstRecharge = createLineFirstRechargeService({ store, codec, tables, now: () => now });
    rechargeBonus = createRechargeBonusService({
      store, codec, tables, now: () => now,
      calendar: createActivityCalendar({ tables, serverOpenedAt: OPENED_AT, mode: 'schedule', now: () => now })
    });
    walletPushes = [];
    wallet = createWalletService({
      store, codec, tables, lineFirstRecharge, rechargeBonus,
      rechargeExtraAward: createRechargeExtraAwardService({ codec, tables }),
      now: () => Math.floor(now / 1000),
      publish: (type, data) => walletPushes.push({ type, data })
    });
  };
  make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get lineFirstRecharge() { return lineFirstRecharge; },
    get wallet() { return wallet; }, get walletPushes() { return walletPushes; },
    setNow(value) { now = value; },
    module() { return codec.unpack('pb_line_first_recharge', rawBinary(new Map(store.state().modules.value).get(547))); },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT });
      make();
    }
  };
}

test('linear first-recharge selects, buys, advances, claims by 05:00 day and survives SQLite reopen', t => {
  const e = setup(t);
  assert.throws(() => e.lineFirstRecharge.execute(102101, [3102]), error => error.code === 5);
  let selected = codec.unpack('pb_line_first_recharge', e.lineFirstRecharge.execute(102101, [3101]).data);
  assert.equal(selected.tid, '31'); assert.equal(selected.choose_tid, '3101');

  e.wallet.credit({ account_id: 'local-1', amount_cents: 1000, request_id: 'line-credit-1' });
  const purchased = e.wallet.buy({ product_id: 600078, request_id: 'line-buy-1' });
  assert.equal(purchased.balance_paid_cents, 600);
  let info = e.module();
  assert.equal(info.buy_list.length, 1);
  assert.equal(Number(info.buy_list[0].tid), 31);
  assert.equal(Number(info.buy_list[0].choose_tid), 3101);
  assert.equal(Number(info.tid), 32); assert.equal(Number(info.choose_tid), 3102);
  const push = codec.unpack('res_recharge_success', e.walletPushes.find(item => item.type === 1900).data);
  const linePush = push.extra_ret_list.find(entry => entry.flag === 99);
  assert.ok(linePush);
  assert.equal(codec.unpack('pb_line_first_recharge', Buffer.from(linePush.data, 'base64')).buy_list.length, 1);

  assert.throws(() => e.lineFirstRecharge.execute(102102, [31, 1]), error => error.code === 1);
  e.setNow(Date.parse('2026-10-25T21:00:00Z'));
  let response = codec.unpack('pb_line_first_recharge_rev_back', e.lineFirstRecharge.execute(102102, [31, 1]).data);
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '10');
  assert.equal(hasBit(Buffer.from(response.buy_info.rev_bin, 'base64'), 1), true);

  e.reopen();
  assert.throws(() => e.lineFirstRecharge.execute(102102, [31, 1]), error => error.code === 310);
});

test('linear first-recharge failure after rewards rolls back order, balance, total and all modules', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 1000, request_id: 'line-rollback-credit' });
  const before = {
    wallet: e.wallet.snapshot().accounts[0].balance_cents,
    module19: rawBinary(new Map(e.store.state().modules.value).get(19)).toString('base64'),
    module547: rawBinary(new Map(e.store.state().modules.value).get(547)).toString('base64')
  };
  e.store.inspect(db => db.exec("CREATE TRIGGER fail_line_wallet_ledger BEFORE INSERT ON wallet_ledger BEGIN SELECT RAISE(ABORT, 'injected wallet failure'); END"));
  assert.throws(() => e.wallet.buy({ product_id: 600078, request_id: 'line-buy-rollback' }), /injected wallet failure/);
  const modules = new Map(e.store.state().modules.value);
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, before.wallet);
  assert.equal(rawBinary(modules.get(19)).toString('base64'), before.module19);
  assert.equal(rawBinary(modules.get(547)).toString('base64'), before.module547);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), 0);
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM reward_claims WHERE claim_type='line_first_recharge'").get().n), 0);
});
