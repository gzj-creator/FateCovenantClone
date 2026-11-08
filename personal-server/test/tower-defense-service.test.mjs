import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createTowerDefenseService } from '../game/tower-defense-service.mjs';
import { readTowerDefenseTables } from '../config/dungeon-activity-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readTowerDefenseTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;
const towerTid = Math.min(...tables.types.keys());
const firstTurn = [...tables.turns.keys()].sort((a, b) => a - b)[0];
const firstMonster = tables.turns.get(firstTurn).monster_type[0];
const rewardTid = tables.monsters.get(firstMonster).award_item;
const rewardPerWave = tables.monsters.get(firstMonster).award_num * tables.turns.get(firstTurn).monster_num[0];

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-towerdefense-' });
  let service = createTowerDefenseService({ store: fixture.store, codec, tables, gameTables, now: () => FIXED_NOW });
  return {
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createTowerDefenseService({ store, codec, tables, gameTables, now: () => FIXED_NOW });
      return { store, service };
    }
  };
}

const garrison = () => ({ tid: towerTid, garrison_list: [{ garrison_tid: 100120, index: 0 }, { garrison_tid: 100121, index: 1 }] });

function resourceCount(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('97601 stores the garrison and survives a database reopen', async t => {
  const { service, reopen } = setup(t);
  await assert.rejects(service.garrison({ tid: towerTid, garrison_list: [] }), /empty/);
  await assert.rejects(service.garrison({ tid: 999, garrison_list: [{ garrison_tid: 1, index: 0 }] }), /configuration/);
  const result = await service.garrison(garrison());
  assert.equal(codec.unpack('pb_tower_defense', result.data).defense_obj.length, 2);
  const { service: reopened } = reopen();
  const state = reopened.state(100001);
  assert.equal(state.towers[String(towerTid)].defense.length, 2);
});

test('97602/97605/97603 settle a real wave reward once', async t => {
  const { store, service } = setup(t);
  await assert.rejects(service.turnOver(towerTid), /garrison is not configured/);
  await service.garrison(garrison());
  const turned = await service.turnOver(towerTid);
  assert.equal(turned.value.turns, firstTurn);
  assert.equal(codec.unpack('pb_tower_defense', turned.data).wait_turns, 1);
  const preview = await service.lookAward(towerTid);
  const look = codec.unpack('pb_tower_defense_look_rsp', preview.data);
  assert.equal(look.wait_award_turns.length, 1);
  assert.equal(look.wait_award_turns[0].awards[0].tid, String(rewardTid));
  const before = resourceCount(store, rewardTid);
  const claimedResult = await service.award(towerTid);
  assert.ok(codec.unpack('pb_tower_defense_award_rsp', claimedResult.data).res_changes.changes.length > 0);
  assert.equal(resourceCount(store, rewardTid), before + BigInt(rewardPerWave));
  await assert.rejects(service.award(towerTid), /already received/);
  assert.equal(service.state(100001).towers[String(towerTid)].accTurnsNum, 1);
});

test('97604 claims the cumulative wave task from Task rows once', async t => {
  const { store, service, reopen } = setup(t);
  await service.garrison(garrison());
  for (let index = 0; index < 5; index += 1) {
    await service.turnOver(towerTid);
    await service.award(towerTid);
  }
  const task = [...tables.tasks.values()].find(row => Number(row.belong_type) === towerTid && Number(row.target_count) === 5);
  const rewardTid2 = task.award_list[0][0];
  const before = resourceCount(store, rewardTid2);
  const result = await service.turnsAward(towerTid);
  assert.equal(result.value.tasks[0], task.tid);
  assert.ok(resourceCount(store, rewardTid2) > before);
  await assert.rejects(service.turnsAward(towerTid), /not claimable/);
  const { service: reopened } = reopen();
  await assert.rejects(reopened.turnsAward(towerTid), /not claimable/);
});

test('a SQLite failure rolls back a wave award', async t => {
  const { store, service } = setup(t);
  await service.garrison(garrison());
  await service.turnOver(towerTid);
  const before = resourceCount(store, rewardTid);
  store.inspect(db => db.exec("CREATE TRIGGER tower_defense_award_boom BEFORE INSERT ON dungeon_activity_claims WHEN NEW.claim_type='tower_defense_award' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(service.award(towerTid), /boom/);
  assert.equal(resourceCount(store, rewardTid), before);
  store.inspect(db => db.exec('DROP TRIGGER tower_defense_award_boom'));
  assert.ok((await service.award(towerTid)).value.changes.length > 0);
});

test('an encoding failure rolls back the wave award', async t => {
  const { store, service } = setup(t);
  await service.garrison(garrison());
  await service.turnOver(towerTid);
  const before = resourceCount(store, rewardTid);
  const failingCodec = {
    pack(schema, value) { if (schema === 'pb_tower_defense_award_rsp') throw new Error('encode failed'); return codec.pack(schema, value); },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const failing = createTowerDefenseService({ store, codec: failingCodec, tables, gameTables, now: () => FIXED_NOW });
  await assert.rejects(failing.award(towerTid), /encode failed/);
  assert.equal(resourceCount(store, rewardTid), before);
  assert.equal(service.state(100001).towers[String(towerTid)].waitAwards.length, 1);
});

test('gateway routes all five tower defense commands on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-towerdefense-gateway-'));
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

  const stationed = await request(97601, 2, codec.pack('pb_tower_defense_garrison_req', garrison()));
  assert.equal(stationed.err, undefined);
  assert.equal(codec.unpack('pb_tower_defense', Buffer.from(stationed.data, 'base64')).defense_obj.length, 2);
  const turned = await request(97602, 3, Buffer.alloc(0));
  assert.equal(codec.unpack('pb_tower_defense', Buffer.from(turned.data, 'base64')).wait_turns, 1);
  const looked = await request(97605, 4, Buffer.alloc(0));
  assert.equal(codec.unpack('pb_tower_defense_look_rsp', Buffer.from(looked.data, 'base64')).wait_award_turns.length, 1);
  const awarded = await request(97603, 5, Buffer.alloc(0));
  assert.ok(codec.unpack('pb_tower_defense_award_rsp', Buffer.from(awarded.data, 'base64')).res_changes.changes.length > 0);
  const repeat = await request(97603, 6, Buffer.alloc(0));
  assert.equal(repeat.err.err, 3);
  const turns = await request(97604, 7, Buffer.alloc(0));
  assert.equal(turns.err.err, 3);
});
