import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readOnlineGiftTables } from '../config/online-gift-tables.mjs';
import { createOnlineGiftService, ONLINE_GIFT_CANT_RECEIVE, ONLINE_GIFT_RECEIVED_ALL } from '../game/online-gift-service.mjs';

const codec = createGameCodec();
const gameTables = readGameTables(), onlineTables = readOnlineGiftTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const CREATED_AT = Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000);

function setup(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-online-gift-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: CREATED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Online Gift Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let now = CREATED_AT * 1000;
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
  const make = serviceCodec => createOnlineGiftService({
    store, codec: serviceCodec ?? codec, tables: onlineTables, gameTables,
    serverOpenedAt: CREATED_AT, now: () => now
  });
  let service = make(options.codec);
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get service() { return service; },
    setNow(value) { now = value; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
      service = make(options.codec);
    }
  };
}

function claim(service) {
  return codec.unpack('pb_online_gift_back', service.execute(37010, undefined).data);
}

function itemAmount(store, tid = '2002') {
  return Number(store.inspect(db => db.prepare('SELECT amount FROM resources WHERE role_id=100001 AND tid=?').get(tid)?.amount ?? 0));
}

test('37010 grants catalog rewards at 180/360/540 seconds, persists, and rejects exhaustion', t => {
  const fixture = setup(t);
  fixture.service.beginSession();
  assert.throws(() => fixture.service.execute(37010), error => error.code === ONLINE_GIFT_CANT_RECEIVE);

  fixture.setNow((CREATED_AT + 180) * 1000);
  let response = claim(fixture.service);
  assert.equal(response.online_gift.last_receive_id, 1);
  assert.equal(Number(response.online_gift.acc_sec), 180);
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '1');
  response = claim(fixture.service);
  assert.equal(response.online_gift.last_receive_id, 2);

  fixture.setNow((CREATED_AT + 360) * 1000);
  for (let expected = 3; expected <= 6; expected++) {
    response = claim(fixture.service);
    assert.equal(response.online_gift.last_receive_id, expected);
  }
  fixture.setNow((CREATED_AT + 540) * 1000);
  for (let expected = 7; expected <= 9; expected++) {
    response = claim(fixture.service);
    assert.equal(response.online_gift.last_receive_id, expected);
  }
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '2');
  assert.throws(() => fixture.service.execute(37010), error => error.code === ONLINE_GIFT_RECEIVED_ALL);

  const module = new Map(fixture.store.state().modules.value).get(134);
  const info = codec.unpack('pb_online_gift_info', rawBinary(module));
  assert.equal(info.open, true);
  assert.equal(Number(info.last_receive_id), 9);
  assert.equal(Number(info.receive_time), CREATED_AT + 540);
  assert.equal(Number(info.acc_sec), 540);
  assert.equal(Number(info.period), 1);
  assert.equal(Number(info.open_day_index), 1);
  fixture.reopen();
  fixture.service.beginSession();
  assert.throws(() => fixture.service.execute(37010), error => error.code === ONLINE_GIFT_RECEIVED_ALL);
});

test('online time resets at the 05:00 Shanghai boundary and rejects malformed arguments', t => {
  const fixture = setup(t);
  fixture.service.beginSession();
  fixture.setNow((CREATED_AT + 180) * 1000);
  claim(fixture.service);
  assert.throws(() => fixture.service.execute(37010, [123]), error => error.code === 1);

  // 2026-11-01 21:00Z is 2026-11-02 05:00 Asia/Shanghai.
  fixture.setNow(Date.parse('2026-11-01T21:00:00Z'));
  assert.throws(() => fixture.service.execute(37010), error => error.code === ONLINE_GIFT_CANT_RECEIVE);
  fixture.setNow(Date.parse('2026-11-01T21:03:00Z'));
  const nextDay = claim(fixture.service);
  assert.equal(Number(nextDay.online_gift.last_receive_id), 10);
  assert.equal(Number(nextDay.online_gift.acc_sec), 180);
  const row = fixture.store.inspect(db => db.prepare('SELECT * FROM online_gift_state WHERE role_id=100001').get());
  assert.equal(row.acc_sec, 180);
  assert.equal(row.last_receive_id, 10);
});

test('response encoding failure rolls back both reward and claim state', t => {
  const failingCodec = {
    ...codec,
    pack(schema, ...args) {
      if (schema === 'pb_online_gift_back') throw new Error('forced response encoding failure');
      return codec.pack(schema, ...args);
    }
  };
  const fixture = setup(t, { codec: failingCodec });
  fixture.service.beginSession();
  fixture.setNow((CREATED_AT + 180) * 1000);
  const before = fixture.store.state();
  const beforeAmount = itemAmount(fixture.store);
  const beforeItem = before.modules.value.find(([id]) => id === 6);
  assert.throws(() => fixture.service.execute(37010), /forced response encoding failure/);
  const after = fixture.store.state();
  const row = fixture.store.inspect(db => db.prepare('SELECT * FROM online_gift_state WHERE role_id=100001').get());
  assert.equal(row.last_receive_id, 0);
  assert.equal(itemAmount(fixture.store), beforeAmount);
  assert.deepEqual(after.modules.value.find(([id]) => id === 6), beforeItem);
});

test('a SQLite write failure rolls back reward and claim state', t => {
  const fixture = setup(t);
  fixture.service.beginSession();
  fixture.setNow((CREATED_AT + 180) * 1000);
  const before = fixture.store.state();
  const beforeAmount = itemAmount(fixture.store);
  fixture.store.inspect(db => db.exec(`CREATE TRIGGER fail_online_gift_module
    BEFORE INSERT ON login_modules WHEN NEW.module_id=134
    BEGIN SELECT RAISE(ABORT, 'forced online gift module write failure'); END`));
  assert.throws(() => fixture.service.execute(37010), /forced online gift module write failure/);
  const after = fixture.store.state();
  const row = fixture.store.inspect(db => db.prepare('SELECT * FROM online_gift_state WHERE role_id=100001').get());
  assert.equal(row.last_receive_id, 0);
  assert.equal(itemAmount(fixture.store), beforeAmount);
});
