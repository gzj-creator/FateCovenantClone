import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createRedCliffService } from '../game/red-cliff-service.mjs';
import { readRedCliffTables } from '../config/dungeon-activity-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readRedCliffTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;
const minLevel = Math.min(...tables.levels.keys());

function unit(id, team, overrides = {}) {
  return {
    id, role: 1010101, profession: 1, loc: 1, abilityId: 1, activeAbilityId: 1,
    maxHp: 1000, attack: 100, defense: 10, speed: 100, initialEnergy: 500, ...overrides
  };
}

function winSimulation() {
  return simulateBattle({
    attackers: [unit(101, 1, { maxHp: 6000, attack: 4000, speed: 220 })],
    defenders: [unit(201, 2, { maxHp: 1, attack: 1, defense: 0, speed: 1, loc: 2 })],
    seed: 7
  });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-redcliff-' });
  let service = createRedCliffService({ store: fixture.store, codec, tables, gameTables, now: () => FIXED_NOW, random: () => 0 });
  return {
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createRedCliffService({ store, codec, tables, gameTables, now: () => FIXED_NOW, random: () => 0 });
      return { store, service };
    }
  };
}

async function clearLevels(service, count) {
  for (let index = 0; index < count; index += 1) {
    const state = service.state(100001);
    assert.equal(await service.clearLevel({ level: (state.curLevel || minLevel - 1) + 1, simulation: winSimulation() }).then(r => r.value.won), true);
  }
}

function resourceCount(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('55001 grants the shipped box reward once and keeps the claim after reopen', async t => {
  const { store, service, reopen } = setup(t);
  await assert.rejects(service.box(), /not cleared/);
  await clearLevels(service, 1);
  const before = resourceCount(store, 201500);
  const result = await service.box();
  assert.equal(result.value.level, minLevel);
  const packet = codec.unpack('pb_red_cliff_box_result', result.data);
  assert.equal(packet.data_to_client.red_cliff_data.cur_level, minLevel);
  assert.ok(packet.res_change.changes.length > 0);
  assert.ok(resourceCount(store, 201500) > before);
  await assert.rejects(service.box(), /already received/);
  const { service: reopened } = reopen();
  await assert.rejects(reopened.box(), /already received/);
  await assert.rejects(reopened.box(minLevel + 1), /not cleared/);
});

test('55004 refresh obeys Const.refresh_fight and 55002 only accepts listed buffs', async t => {
  const { service } = setup(t);
  await assert.rejects(service.refresh(), /requires a cleared level/);
  await clearLevels(service, 1);
  const limit = Number(tables.const.refresh_fight);
  let last;
  for (let index = 0; index < limit; index += 1) last = await service.refresh();
  assert.equal(last.value.refreshCount, limit);
  await assert.rejects(service.refresh(), /insufficient/);
  const selected = last.value.selected[0];
  const result = await service.buff(selected);
  assert.equal(result.value.tid, selected);
  const packet = codec.unpack('pb_red_cliff_data_to_client', result.data);
  assert.deepEqual(packet.red_cliff_data.assemble_buff_list, [selected]);
  await assert.rejects(service.buff(selected), /already selected|not in the current selection/);
  await assert.rejects(service.buff(999999), /configuration/);
});

test('55003 reset fails closed until the run is completed', async t => {
  const { service } = setup(t);
  await assert.rejects(service.reset(), /completed run/);
  await clearLevels(service, 2);
  await assert.rejects(service.reset(), /completed run/);
});

test('clearLevel only accepts a real winning simulation', async t => {
  const { service } = setup(t);
  await assert.rejects(service.clearLevel({ level: minLevel }), /battle engine simulation/);
  await assert.rejects(service.clearLevel({ level: minLevel + 1, simulation: winSimulation() }), /next challenge level/);
  const lost = await service.clearLevel({
    level: minLevel,
    simulation: simulateBattle({
      attackers: [unit(101, 1, { maxHp: 50, attack: 1, defense: 0, speed: 1 })],
      defenders: [unit(201, 2, { maxHp: 50000, attack: 4000, defense: 100, speed: 220, loc: 2 })],
      seed: 7
    })
  });
  assert.equal(lost.value.won, false);
  assert.equal(service.state(100001).curLevel, 0);
});

test('a SQLite failure rolls back the box reward', async t => {
  const { store, service } = setup(t);
  await clearLevels(service, 1);
  const before = resourceCount(store, 201500);
  store.inspect(db => db.exec("CREATE TRIGGER red_cliff_box_boom BEFORE INSERT ON dungeon_activity_claims WHEN NEW.claim_type='red_cliff_box' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(service.box(), /boom/);
  assert.equal(resourceCount(store, 201500), before);
  store.inspect(db => db.exec('DROP TRIGGER red_cliff_box_boom'));
  assert.ok((await service.box()).value.changes.length > 0);
});

test('an encoding failure rolls back the box reward and its claim', async t => {
  const { store, service } = setup(t);
  await clearLevels(service, 1);
  const before = resourceCount(store, 201500);
  const failingCodec = {
    pack(schema, value) { if (schema === 'pb_red_cliff_box_result') throw new Error('encode failed'); return codec.pack(schema, value); },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const failing = createRedCliffService({ store, codec: failingCodec, tables, gameTables, now: () => FIXED_NOW, random: () => 0 });
  await assert.rejects(failing.box(), /encode failed/);
  assert.equal(resourceCount(store, 201500), before);
  const claims = store.inspect(db => db.prepare("SELECT COUNT(*) AS count FROM dungeon_activity_claims WHERE claim_type='red_cliff_box'").get());
  assert.equal(Number(claims.count), 0);
  assert.ok((await service.box()).value.changes.length > 0);
});

test('gateway routes 55001 and 55004 over a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-redcliff-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    random: () => 0
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  game.store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS dungeon_activity_state (
      role_id INTEGER NOT NULL, activity TEXT NOT NULL, state_json TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id, activity))`);
    db.prepare('INSERT OR REPLACE INTO dungeon_activity_state VALUES (?,?,?,?)').run(100001, 'red_cliff', JSON.stringify({ curLevel: minLevel, stars: 0, resetTimes: 0, lastResetSecond: 0, refreshCount: 0, refreshDay: '2026-11-06', assembled: [], selected: [], challengePoints: 0, lastChallengePoints: 0 }), '2026-11-06T00:00:00.000Z');
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

  const boxed = await request(55001, 2, Buffer.alloc(0));
  assert.equal(boxed.err, undefined);
  const boxPacket = codec.unpack('pb_red_cliff_box_result', Buffer.from(boxed.data, 'base64'));
  assert.ok(boxPacket.res_change.changes.length > 0);
  const repeat = await request(55001, 3, Buffer.alloc(0));
  assert.equal(repeat.err.err, 3);
  const refreshed = await request(55004, 4, Buffer.alloc(0));
  assert.equal(refreshed.err, undefined);
  const refreshPacket = codec.unpack('pb_red_cliff_data_to_client', Buffer.from(refreshed.data, 'base64'));
  assert.equal(refreshPacket.red_cliff_data.refresh_count, 1);
});
