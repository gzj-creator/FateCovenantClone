import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createCampTowerService } from '../game/camp-tower-service.mjs';
import { createDestinyPveService } from '../game/destiny-pve-service.mjs';
import { readCampTowerTables, readDestinyPveTables } from '../config/dungeon-activity-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const campTables = readCampTowerTables();
const destinyTables = readDestinyPveTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;
const firstRow = campTables.firstPass.values().next().value;

function unit(id, team, overrides = {}) {
  return {
    id, role: 1010101, profession: 1, loc: 1, abilityId: 1, activeAbilityId: 1,
    maxHp: 1000, attack: 100, defense: 10, speed: 100, initialEnergy: 500, ...overrides
  };
}

function simulation() {
  return simulateBattle({
    attackers: [unit(101, 1, { maxHp: 6000, attack: 4000, speed: 220 })],
    defenders: [unit(201, 2, { maxHp: 1, attack: 1, defense: 0, speed: 1, loc: 2 })],
    seed: 7
  });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-campdestiny-' });
  let camp = createCampTowerService({ store: fixture.store, codec, tables: campTables, gameTables, now: () => FIXED_NOW });
  let destiny = createDestinyPveService({ store: fixture.store, codec, tables: destinyTables, now: () => FIXED_NOW });
  return {
    get store() { return fixture.store; },
    get camp() { return camp; },
    get destiny() { return destiny; },
    reopen() {
      const store = fixture.open();
      camp = createCampTowerService({ store, codec, tables: campTables, gameTables, now: () => FIXED_NOW });
      destiny = createDestinyPveService({ store, codec, tables: destinyTables, now: () => FIXED_NOW });
      return { store, camp, destiny };
    }
  };
}

test('93602 pays the personal first award once and survives a reopen', async t => {
  const { camp, reopen } = setup(t);
  await assert.rejects(camp.firstAward({ first_tid: firstRow.tid }), /not reached/);
  await camp.recordPass({ firstTid: firstRow.tid, level: firstRow.level, simulation: simulation() });
  const result = await camp.firstAward({ first_tid: firstRow.tid });
  const packet = codec.unpack('pb_camp_tower_first_award_rsp', result.data);
  assert.ok(packet.res_change.changes.length > 0);
  assert.ok(packet.camp_tower_data.first_award.length > 0);
  await assert.rejects(camp.firstAward({ first_tid: firstRow.tid }), /already received/);
  const { camp: reopened } = reopen();
  await assert.rejects(reopened.firstAward({ first_tid: firstRow.tid }), /already received/);
  await assert.rejects(reopened.firstAward({ first_tid: 999999 }), /configuration/);
});

test('93601 pays the cross award and 93603 lists authoritative passes', async t => {
  const { camp } = setup(t);
  await camp.recordPass({ firstTid: firstRow.tid, level: firstRow.level, simulation: simulation() });
  const cross = await camp.crossAward({ first_tid: firstRow.tid });
  assert.ok(codec.unpack('pb_camp_tower_cross_award_rsp', cross.data).res_change.changes.length > 0);
  await assert.rejects(camp.crossAward({ first_tid: firstRow.tid }), /already received/);
  const list = await camp.firstPassList();
  const packet = codec.unpack('pb_camp_tower_get_first_pass_list_rsp', list.data);
  assert.equal(packet.pb_camp_tower_pass_list.length, 1);
  assert.equal(packet.pb_camp_tower_pass_list[0].id, firstRow.tid);
  assert.equal(packet.pb_camp_tower_pass_list[0].total_level, firstRow.level);
});

test('recordPass only advances on a real winning simulation', async t => {
  const { camp } = setup(t);
  const lost = await camp.recordPass({ firstTid: firstRow.tid, level: firstRow.level, simulation: simulateBattle({
    attackers: [unit(101, 1, { maxHp: 50, attack: 1, defense: 0, speed: 1 })],
    defenders: [unit(201, 2, { maxHp: 50000, attack: 4000, defense: 100, speed: 220, loc: 2 })],
    seed: 7
  }) });
  assert.equal(lost.value.won, false);
  assert.equal(camp.state(100001).passes[String(firstRow.tid)], undefined);
  await assert.rejects(camp.recordPass({ firstTid: firstRow.tid, level: firstRow.level }), /battle engine simulation/);
});

test('104702 reports authoritative layer info and 104701 fails closed', async t => {
  const { destiny } = setup(t);
  const layer = Math.min(...destinyTables.layers.keys());
  await assert.rejects(destiny.fight(), /not recovered/);
  await assert.rejects(destiny.layerInfo({ layer_list: [] }), /empty/);
  const empty = await destiny.layerInfo({ layer_list: [layer] });
  const emptyPacket = codec.unpack('pb_destiny_pve_layer_info_rsq', empty.data);
  // proto3 omits a zero default count on the wire.
  assert.equal(Number(emptyPacket.layer_info_list[0].count ?? 0), 0);
  await destiny.recordPass({ layer, simulation: simulation(), power: 12345 });
  const passed = codec.unpack('pb_destiny_pve_layer_info_rsq', (await destiny.layerInfo({ layer_list: [layer] })).data);
  assert.equal(Number(passed.layer_info_list[0].count), 1);
  assert.equal(Number(passed.layer_info_list[0].power), 12345);
});

test('a SQLite failure rolls back the camp tower award and an encoding failure the state', async t => {
  const { store, camp } = setup(t);
  camp.state(100001);
  await camp.recordPass({ firstTid: firstRow.tid, level: firstRow.level, simulation: simulation() });
  const rewardTid = firstRow.first_pass_award[0][0];
  const before = BigInt(store.read().resources.get(String(rewardTid))?.num ?? 0);
  store.inspect(db => db.exec("CREATE TRIGGER camp_first_boom BEFORE INSERT ON dungeon_activity_claims WHEN NEW.claim_type='camp_tower_first_award' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(camp.firstAward({ first_tid: firstRow.tid }), /boom/);
  assert.equal(BigInt(store.read().resources.get(String(rewardTid))?.num ?? 0), before);
  store.inspect(db => db.exec('DROP TRIGGER camp_first_boom'));
  const failingCodec = {
    pack(schema, value) { if (schema === 'pb_camp_tower_first_award_rsp') throw new Error('encode failed'); return codec.pack(schema, value); },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const failing = createCampTowerService({ store, codec: failingCodec, tables: campTables, gameTables, now: () => FIXED_NOW });
  await assert.rejects(failing.firstAward({ first_tid: firstRow.tid }), /encode failed/);
  assert.equal(BigInt(store.read().resources.get(String(rewardTid))?.num ?? 0), before);
  assert.ok((await camp.firstAward({ first_tid: firstRow.tid })).value.changes.length > 0);
});

test('gateway routes 93602, 93603, 104702 and rejects 104701 on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-campdestiny-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    random: () => 0
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const seeder = createCampTowerService({ store: game.store, codec, tables: campTables, gameTables, now: () => FIXED_NOW });
  await seeder.recordPass({ firstTid: firstRow.tid, level: firstRow.level, simulation: simulation() });
  const layer = Math.min(...destinyTables.layers.keys());

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

  const awarded = await request(93602, 2, codec.pack('pb_camp_tower_first_award_req', { first_tid: firstRow.tid }));
  assert.equal(awarded.err, undefined);
  assert.ok(codec.unpack('pb_camp_tower_first_award_rsp', Buffer.from(awarded.data, 'base64')).res_change.changes.length > 0);
  const list = await request(93603, 3, Buffer.alloc(0));
  assert.equal(codec.unpack('pb_camp_tower_get_first_pass_list_rsp', Buffer.from(list.data, 'base64')).pb_camp_tower_pass_list.length, 1);
  const info = await request(104702, 4, codec.pack('pb_destiny_pve_layer_info_req', { layer_list: [layer] }));
  assert.equal(info.err, undefined);
  assert.equal(codec.unpack('pb_destiny_pve_layer_info_rsq', Buffer.from(info.data, 'base64')).layer_info_list[0].layer, String(layer));
  const fight = await request(104701, 5, codec.pack('pb_destiny_pve_fight_req', { activity_id: 1 }));
  assert.equal(fight.err.err, 5);
});
