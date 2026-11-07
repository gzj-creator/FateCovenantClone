import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createRankAchieveService } from '../game/rank-achieve-service.mjs';
import { readRankAchieveTables } from '../config/rank-achieve-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readRankAchieveTables();
const resourceTables = readGameTables();
const FIXED_NOW = 1794301200000;

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-rank-achieve-' });
  let activeCodec = options.codec ?? codec;
  let service = createRankAchieveService({
    store: fixture.store, codec: activeCodec, tables, resourceTables, now: () => FIXED_NOW
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    reopen(nextCodec = codec) {
      const store = fixture.open();
      activeCodec = nextCodec;
      service = createRankAchieveService({
        store, codec: activeCodec, tables, resourceTables, now: () => FIXED_NOW
      });
      return { store, service };
    }
  };
}

function setPeakLayer(store, maxLayer) {
  store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS peak_tower_state (
      role_id INTEGER PRIMARY KEY, layer INTEGER NOT NULL, max_layer INTEGER NOT NULL,
      max_layer_time TEXT NOT NULL, award_time TEXT NOT NULL, buy_goods TEXT NOT NULL,
      sweep_day TEXT NOT NULL, sweep_used INTEGER NOT NULL, tower_award TEXT NOT NULL,
      updated_at TEXT NOT NULL)`);
    db.prepare('INSERT OR REPLACE INTO peak_tower_state VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(100001, maxLayer, maxLayer, '2026-11-07T00:00:00.000Z', '2026-11-07T00:00:00.000Z',
        '[]', '2026-11-07', 0, '', '2026-11-07T00:00:00.000Z');
  });
}

function addConfiguredHero(store) {
  store.transaction(model => {
    model.heroInfo.hero_list.push({
      uid: '3030501', tid: 3030501, level: 1, star: 0, star_progress: 0,
      breakthrough_level: 0, nick_name: 521604011
    });
  });
}

function currency(store, tid = 101500) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function counts(store) {
  return store.inspect(db => ({
    finishes: Number(db.prepare('SELECT COUNT(*) AS count FROM rank_achieve_finish').get().count),
    claims: Number(db.prepare('SELECT COUNT(*) AS count FROM rank_achieve_claims').get().count)
  }));
}

function loginBinary(value) {
  return Buffer.from(value?.value ?? value);
}

test('43101 grants the configured award once and persists completion and claim state', t => {
  const { store, service } = setup(t);
  setPeakLayer(store, 500);
  const before = currency(store);
  const result = service.execute({ tid_list: ['1003'] });
  assert.equal(result.pushes.length, 1);
  assert.equal(result.pushes[0].type, 8601);
  const packet = codec.unpack('pb_rank_achieve_award_rsp', result.data);
  assert.equal(packet.res_change.changes[0].tid, '101500');
  assert.equal(packet.res_change.changes[0].diff_num, '50');
  assert.equal(packet.new_achieve.got_award.length, 1);
  assert.deepEqual(Buffer.from(packet.new_achieve.got_award[0].got_award, 'base64'), Buffer.from([0x10]));
  assert.equal(currency(store), before + 50n);
  assert.deepEqual(counts(store), { finishes: 1, claims: 1 });
  assert.throws(() => service.execute({ tid_list: ['1003'] }), error => error.code === 310);
  assert.equal(currency(store), before + 50n);
});

test('unfinished, invalid and duplicate ids reject atomically', t => {
  const { store, service } = setup(t);
  const before = currency(store);
  assert.throws(() => service.execute({ tid_list: ['1004'] }), error => error.code === 5);
  assert.throws(() => service.execute({ tid_list: [] }), error => error.code === 1);
  assert.throws(() => service.execute({ tid_list: ['9999'] }), error => error.code === 1);
  assert.throws(() => service.execute({ tid_list: ['1003', '1003'] }), error => error.code === 1);
  setPeakLayer(store, 1000);
  assert.throws(() => service.execute({ tid_list: ['1003', '1004', '2001'] }), error => error.code === 5);
  assert.deepEqual(counts(store), { finishes: 0, claims: 0 });
  assert.equal(currency(store), before);
});

test('a multi-id claim is one transaction and groups bits by tid section', t => {
  const { store, service } = setup(t);
  setPeakLayer(store, 1000);
  addConfiguredHero(store);
  const before = currency(store);
  const result = service.execute({ tid_list: ['1003', '1004', '2001'] });
  assert.equal(result.value.tids.length, 3);
  assert.equal(currency(store), before + 150n);
  const packet = codec.unpack('pb_rank_achieve_award_rsp', result.data);
  const groups = new Map(packet.new_achieve.got_award.map(row => [Number(row.type), Buffer.from(row.got_award, 'base64')]));
  assert.deepEqual([...groups.keys()], [1, 2]);
  assert.deepEqual(groups.get(1), Buffer.from([0x18]));
  assert.deepEqual(groups.get(2), Buffer.from([0x40]));
  assert.equal(result.pushes.length, 3);
  assert.deepEqual(result.pushes.map(push => codec.unpack('pb_rank_achieve_rev', push.data).tid), ['1003', '1004', '2001']);
});

test('completion and duplicate protection survive closing and reopening SQLite', t => {
  const testState = setup(t);
  setPeakLayer(testState.store, 500);
  testState.service.execute({ tid_list: ['1003'] });
  const awarded = currency(testState.store);
  const { store, service } = testState.reopen();
  assert.deepEqual(counts(store), { finishes: 1, claims: 1 });
  assert.throws(() => service.execute({ tid_list: ['1003'] }), error => error.code === 310);
  assert.equal(currency(store), awarded);
});

test('an encoding failure rolls back finish, claim and award writes', t => {
  let failResponse = true;
  const failingCodec = {
    pack(schema, value) {
      if (failResponse && schema === 'pb_rank_achieve_award_rsp') throw new Error('rank achieve encode failed');
      return codec.pack(schema, value);
    },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const { store, service } = setup(t, { codec: failingCodec });
  setPeakLayer(store, 500);
  const before = currency(store);
  assert.throws(() => service.execute({ tid_list: ['1003'] }), /encode failed/);
  assert.deepEqual(counts(store), { finishes: 0, claims: 0 });
  assert.equal(currency(store), before);
  failResponse = false;
  const recovered = service.execute({ tid_list: ['1003'] });
  assert.equal(currency(store), before + 50n);
  assert.equal(recovered.pushes.length, 1);
});

test('a SQLite claim failure rolls back the finish and resource mutation', t => {
  const { store, service } = setup(t);
  setPeakLayer(store, 500);
  const before = currency(store);
  store.inspect(db => db.exec(`CREATE TRIGGER rank_achieve_claim_boom
    BEFORE INSERT ON rank_achieve_claims BEGIN SELECT RAISE(ABORT, 'claim boom'); END`));
  assert.throws(() => service.execute({ tid_list: ['1003'] }), /claim boom/);
  assert.deepEqual(counts(store), { finishes: 0, claims: 0 });
  assert.equal(currency(store), before);
  store.inspect(db => db.exec('DROP TRIGGER rank_achieve_claim_boom'));
  service.execute({ tid_list: ['1003'] });
  assert.equal(currency(store), before + 50n);
});

test('gateway decodes 43101, commits the award and sends 8601 finish push on temporary TCP', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-rank-achieve-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1794214800,
    now: () => FIXED_NOW,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags, Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.equal(loginValue[0], 1);
  const loginModules = new Map(loginValue[2].value);
  const rankAchieveModule = loginModules.get(170);
  const rankAchieveSlots = rankAchieveModule.value ?? rankAchieveModule;
  assert.equal(rankAchieveSlots.length, 4);
  assert.deepEqual(codec.unpack('pb_rank_achieve_role', loginBinary(rankAchieveSlots[0])).got_award, []);
  assert.deepEqual(codec.unpack('pb_rank_achieve_server', loginBinary(rankAchieveSlots[1])).finish_info, []);

  setPeakLayer(game.store, 500);

  const response = await request(43101, 2, codec.pack('pb_rank_achieve_award_req', { tid_list: ['1003'] }));
  assert.equal(response.err, undefined);
  const packet = codec.unpack('pb_rank_achieve_award_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(packet.res_change.changes[0].tid, '101500');
  assert.deepEqual(Buffer.from(packet.new_achieve.got_award[0].got_award, 'base64'), Buffer.from([0x10]));

  const pushed = codec.unpack('pb_s2c', await next());
  assert.equal(Number(pushed.type), 8601);
  const finish = codec.unpack('pb_rank_achieve_rev', Buffer.from(pushed.data, 'base64'));
  assert.equal(finish.tid, '1003');
  assert.equal(finish.finish_id, '100001');

  const reloginModules = new Map((await decodeEtf(await game.loginPayload()))[2].value);
  const persisted = reloginModules.get(170);
  const persistedSlots = persisted.value ?? persisted;
  const person = codec.unpack('pb_rank_achieve_role', loginBinary(persistedSlots[0]));
  const server = codec.unpack('pb_rank_achieve_server', loginBinary(persistedSlots[1]));
  assert.deepEqual(Buffer.from(person.got_award[0].got_award, 'base64'), Buffer.from([0x10]));
  assert.equal(server.finish_info.find(row => Number(row.tid) === 1003).unit_id, '100001');

  const repeated = await request(43101, 3, codec.pack('pb_rank_achieve_award_req', { tid_list: ['1003'] }));
  assert.equal(repeated.err.err, 310);
});
