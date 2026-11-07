import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createPeakTowerService } from '../game/peak-tower-service.mjs';
import { readPeakTowerTables } from '../config/peak-tower-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { simulateBattle, BATTLE_RESULT } from '../game/battle-engine.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const peakTables = readPeakTowerTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;

function unit(id, team, overrides = {}) {
  return {
    id, role: 1010101, profession: 1, loc: 1, abilityId: 1, activeAbilityId: 1,
    maxHp: 1000, attack: 100, defense: 10, speed: 100, initialEnergy: 500, ...overrides
  };
}

// Real battle engine simulations: the service only accepts the engine result, so a win test
// runs an actual battle and a loss test runs one where the attackers cannot win.
function simulationFor(side) {
  const attackers = side === 'win'
    ? [unit(101, 1, { maxHp: 6000, attack: 4000, speed: 220 })]
    : [unit(101, 1, { maxHp: 50, attack: 1, defense: 0, speed: 1 })];
  const defenders = side === 'win'
    ? [unit(201, 2, { maxHp: 1, attack: 1, defense: 0, speed: 1, loc: 2 })]
    : [unit(201, 2, { maxHp: 50000, attack: 4000, defense: 100, speed: 220, loc: 2 })];
  return simulateBattle({ attackers, defenders, seed: 7 });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-peaktower-' });
  let service = createPeakTowerService({ store: fixture.store, codec, tables: peakTables, gameTables, now: () => FIXED_NOW });
  return {
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createPeakTowerService({ store, codec, tables: peakTables, gameTables, now: () => FIXED_NOW });
      return { store, service };
    }
  };
}

async function clearLayers(service, count) {
  const state = service.state(100001);
  for (let layer = state.layer + 1; layer <= state.layer + count; layer += 1) {
    await service.challenge({ layer, simulation: simulationFor('win') });
  }
}

function addCurrency(store, tid, num) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= 1) groups.push({ value: [], improper: false });
    const entry = groups[1].value.length;
    groups[1].value.push({ value: Buffer.alloc(0).toJSON(), bits: 8 });
    model.resources.set(String(tid), { tid, num: String(num), location: [6, 1, entry] });
  });
}

function currencyOf(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('1103 sweeps cleared layers for their configured rewards', async t => {
  const { store, service } = setup(t);
  await clearLayers(service, 3);
  const before = currencyOf(store, 101800);
  const result = await service.sweeps({ sweeps_layer: 2 });
  assert.deepEqual(result.value.layers, [2, 2]);
  assert.ok(result.data.length > 0);
  const back = codec.unpack('peak_tower_sweep_back', result.data);
  assert.equal(back.peak_tower_back.peak_tower_data.layer, 3);
  assert.equal(back.peak_tower_back.peak_tower_data.count_limit.count, peakTables.global.rapid_fighting - 1);
  assert.ok(back.peak_tower_back.res.changes.length > 0);
  assert.ok(currencyOf(store, 101800) > before);
});

test('1103 rejects invalid, unopened and duplicated sweeps', async t => {
  const { service } = setup(t);
  await assert.rejects(service.sweeps({ sweeps_layer: 1 }), /not unlocked/);
  await clearLayers(service, 3);
  await assert.rejects(service.sweeps({ sweeps_layer: 0 }), /Invalid/);
  await assert.rejects(service.sweeps({ sweeps_layer: 4 }), /not unlocked/);
  await clearLayers(service, peakTables.global.fast_harvest_layer + 1);
  await assert.rejects(service.sweeps({ sweeps_layer: peakTables.global.fast_harvest_layer + 1 }), /exceeds/);
  await service.sweeps({ sweeps_layer: 1 });
  await assert.rejects(service.sweeps({ sweeps_layer: 1 }), /already settled/);
  await service.sweeps({ sweeps_layer: 3 });
  await assert.rejects(service.sweeps({ sweeps_layer: 3 }), /already settled/);
});

test('1103 enforces the daily sweep count from the configuration', async t => {
  const { service } = setup(t);
  const limit = Number(peakTables.global.rapid_fighting);
  await clearLayers(service, limit + 1);
  for (let index = 0; index < limit; index += 1) {
    await service.sweeps({ sweeps_layer: index + 1 });
  }
  await assert.rejects(service.sweeps({ sweeps_layer: 1 }), /insufficient/);
});

test('1104 grants every cleared layer reward once and survives a reopen', async t => {
  const { store, service, reopen } = setup(t);
  await assert.rejects(service.everyAward(), /not unlocked/);
  await clearLayers(service, 2);
  const first = await service.everyAward();
  assert.deepEqual(first.value.layers, [1, 2]);
  assert.ok(first.value.changes.some(change => change.tid === '101800'));
  const diamonds = currencyOf(store, 101500);
  await assert.rejects(service.everyAward(), /already claimed/);
  assert.equal(currencyOf(store, 101500), diamonds);
  const { service: reopened, store: reopenedStore } = reopen();
  await assert.rejects(reopened.everyAward(), /already claimed/);
  assert.equal(currencyOf(reopenedStore, 101500), diamonds);
  const next = await reopened.sweeps({ sweeps_layer: 1 });
  assert.ok(next.data.length > 0);
});

test('challenge only advances on a real winning simulation', async t => {
  const { service } = setup(t);
  const lost = await service.challenge({ layer: 1, simulation: simulationFor('loss') });
  assert.equal(lost.value.won, false);
  assert.equal(service.state(100001).layer, 0);
  await service.challenge({ layer: 1, simulation: simulationFor('win') });
  await assert.rejects(service.challenge({ layer: 3, simulation: simulationFor('win') }), /next challenge layer/);
  await assert.rejects(service.challenge({ layer: 1, simulation: simulationFor('win') }), /next challenge layer/);
  await assert.rejects(service.challenge({ layer: 9001, simulation: simulationFor('win') }), /Invalid/);
  await assert.rejects(service.challenge({ layer: 2 }), /battle engine simulation/);
});

test('1110 grants a reached tower achievement once', async t => {
  const { service } = setup(t);
  await clearLayers(service, 5);
  await assert.rejects(service.receiveAchievement(1), /not reached/);
  await clearLayers(service, 55);
  const result = await service.receiveAchievement(1);
  assert.equal(result.value.achievementTid, 1);
  assert.ok(result.value.changes.length > 0);
  const packet = codec.unpack('pb_res_to_client', result.data);
  assert.ok(packet.changes.length > 0);
  await assert.rejects(service.receiveAchievement(1), /already received/);
  await assert.rejects(service.receiveAchievement(9999), /configuration/);
});

test('1111 grants the configured tower award once and keeps the tower_award bit block', async t => {
  const { service, reopen } = setup(t);
  await clearLayers(service, 60);
  const result = await service.revTowerAward(1);
  assert.deepEqual(result.value.towers, [1]);
  assert.ok(codec.unpack('pb_res_to_client', result.data).changes.length > 0);
  await assert.rejects(service.revTowerAward(1), /already received/);
  const { service: reopened, store: reopenedStore } = reopen();
  await assert.rejects(reopened.revTowerAward(1), /already received/);
  const bits = reopenedStore.inspect(db => db.prepare('SELECT tower_award FROM peak_tower_state').get());
  assert.ok(String(bits.tower_award).length > 0);
  await assert.rejects(reopened.revTowerAward(2), /not reached/);
});

test('1109 buys configured goods once, consuming the configured price', async t => {
  const { store, service } = setup(t);
  await clearLayers(service, 30);
  addCurrency(store, 101500, 5000);
  const result = await service.buyGoods([1]);
  assert.equal(result.value.goodsTid, 1);
  assert.equal(result.value.price, 588);
  // The configured goods row pays one unit of the price currency back as the product.
  assert.equal(currencyOf(store, 101500), 5000n - 588n + 1n);
  await assert.rejects(service.buyGoods([1]), /already bought/);
  await assert.rejects(service.buyGoods([14]), /not unlocked/);
  addCurrency(store, 101500, 100);
  await assert.rejects(service.buyGoods([2]), /err|301|insufficient|资源/i);
});

test('1112 reports the aggregated average layer instead of a fixed value', async t => {
  const { store, service } = setup(t);
  await clearLayers(service, 4);
  const single = await service.avgLayer();
  assert.equal(single.value.average, 4);
  assert.equal(single.value.players, 1);
  store.inspect(db => db.prepare(`INSERT INTO peak_tower_state
    (role_id, layer, max_layer, max_layer_time, award_time, buy_goods, sweep_day, sweep_used, tower_award, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(200002, 9, 9, '2026-11-06T00:00:00.000Z', '2026-11-06T00:00:00.000Z', '[]', '2026-11-06', 0, '', '2026-11-06T00:00:00.000Z'));
  const shared = await service.avgLayer();
  assert.equal(shared.value.players, 2);
  assert.equal(shared.value.average, 7);
  assert.deepEqual(await decodeEtf(shared.data), [7]);
});

test('a SQLite failure rolls back the whole reward transaction', async t => {
  const { store, service } = setup(t);
  await clearLayers(service, 2);
  const before = currencyOf(store, 101500);
  store.inspect(db => db.exec("CREATE TRIGGER peak_tower_claim_boom BEFORE INSERT ON peak_tower_claims WHEN NEW.claim_type='peak_tower_layer' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(service.everyAward(), /boom/);
  assert.equal(currencyOf(store, 101500), before);
  store.inspect(db => db.exec('DROP TRIGGER peak_tower_claim_boom'));
  const recovered = await service.everyAward();
  assert.deepEqual(recovered.value.layers, [1, 2]);
});

test('an encoding failure rolls back the sweep transaction', async t => {
  const { store, service } = setup(t);
  await clearLayers(service, 2);
  const before = currencyOf(store, 101500);
  const failingCodec = {
    pack(schema, value) {
      if (schema === 'peak_tower_sweep_back') throw new Error('encode failed');
      return codec.pack(schema, value);
    },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const failing = createPeakTowerService({ store, codec: failingCodec, tables: peakTables, gameTables, now: () => FIXED_NOW });
  await assert.rejects(failing.sweeps({ sweeps_layer: 2 }), /encode failed/);
  assert.equal(currencyOf(store, 101500), before);
  const claims = store.inspect(db => db.prepare("SELECT COUNT(*) AS count FROM peak_tower_claims WHERE claim_type='peak_tower_sweep'").get());
  assert.equal(Number(claims.count), 0);
  const recovered = await service.sweeps({ sweeps_layer: 2 });
  assert.deepEqual(recovered.value.layers, [2, 2]);
});

test('gateway routes the peak tower commands with real state on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-peaktower-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  // Prior tower progress is authoritative server state, written directly in this deployment
  // database before the client reconnects.
  game.store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS peak_tower_state (
      role_id INTEGER PRIMARY KEY, layer INTEGER NOT NULL, max_layer INTEGER NOT NULL,
      max_layer_time TEXT NOT NULL, award_time TEXT NOT NULL, buy_goods TEXT NOT NULL,
      sweep_day TEXT NOT NULL, sweep_used INTEGER NOT NULL, tower_award TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    db.prepare('INSERT OR REPLACE INTO peak_tower_state VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(100001, 5, 5, '2026-11-06T00:00:00.000Z', '2026-11-06T00:00:00.000Z', '[]', '2026-11-06', 0, '', '2026-11-06T00:00:00.000Z');
  });

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
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const sweepsResponse = await request(1103, 2, codec.pack('peak_tower_sweeps_req', { sweeps_layer: 2 }));
  assert.equal(sweepsResponse.err, undefined);
  const sweepBack = codec.unpack('peak_tower_sweep_back', Buffer.from(sweepsResponse.data, 'base64'));
  assert.equal(sweepBack.peak_tower_back.peak_tower_data.layer, 5);
  assert.ok(sweepBack.peak_tower_back.res.changes.length > 0);

  const repeat = await request(1103, 3, codec.pack('peak_tower_sweeps_req', { sweeps_layer: 2 }));
  assert.equal(repeat.err.err, 3);

  const average = await request(1112, 4, Buffer.alloc(0));
  assert.equal(average.err, undefined);
  assert.deepEqual(await decodeEtf(Buffer.from(average.data, 'base64')), [5]);

  const malformed = await request(1103, 5, Buffer.from([0xff, 0xff, 0xff]));
  assert.equal(malformed.err.err, 2);
});



