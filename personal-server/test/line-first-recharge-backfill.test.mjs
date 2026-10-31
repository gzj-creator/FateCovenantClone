import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createLineFirstRechargeService } from '../game/line-first-recharge-service.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const NOW = Date.parse('2026-10-31T10:30:00Z');
const CREATED_AT = Date.parse('2026-10-29T21:30:00Z') / 1000;

test('login backfills a previously committed linear first-recharge order into module 547', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-line-first-backfill-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: CREATED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Backfill Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
  const make = () => createLineFirstRechargeService({ store, codec, tables, now: () => NOW });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  store.transaction((model, db) => {
    db.prepare('INSERT INTO local_wallets(account_id,role_id) VALUES (?,?)').run('local-1', model.state.roleId);
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)')
      .run('historical-line-first', 'local-1', 'historical-request', 600078, 600, '{}', '2026-10-30T10:30:00.000Z', 1);
  });

  service.ensureLoginState();
  let info = codec.unpack('pb_line_first_recharge', rawBinary(new Map(store.state().modules.value).get(547)));
  assert.equal(String(info.tid), '32');
  assert.equal(String(info.choose_tid), '3102');
  assert.deepEqual(info.buy_list.map(entry => [String(entry.tid), String(entry.choose_tid)]), [['31', '3101']]);

  store.close();
  store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
  service = make();
  service.ensureLoginState();
  info = codec.unpack('pb_line_first_recharge', rawBinary(new Map(store.state().modules.value).get(547)));
  assert.equal(info.buy_list.length, 1);
});
