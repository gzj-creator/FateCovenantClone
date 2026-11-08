import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createPitLordService } from '../game/pit-lord-service.mjs';
import { createWorldBossService } from '../game/world-boss-service.mjs';
import { createFameHallService } from '../game/fame-hall-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const NOW = 1794000000000;
const tables = readGameTables();
const claimCount = (store, type) => store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type=?').get(type).n);
const resource = (store, tid) => BigInt(store.read().resources.get(String(tid))?.num ?? 0);

function failingCodec(schema) {
  return {
    pack(name, value) { if (name === schema) throw new Error('encode failed'); return codec.pack(name, value); },
    unpack: (name, bytes) => codec.unpack(name, bytes)
  };
}

test('PitLord damage, history, rank award and free award are authoritative and idempotent', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-pitlord-' });
  let service = createPitLordService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  service.recordDamage(fixture.store.state().roleId, 5000, { dayIndex: 1 });
  const history = await service.execute(92802);
  const rows = codec.unpack('pb_pit_lord_history_rank_list', history.data);
  assert.equal(rows.history_rank_list.length, 0, 'history is empty until a day snapshot exists');
  service.snapshot(1);
  const snapshot = codec.unpack('pb_pit_lord_history_rank_list', (await service.execute(92802)).data);
  assert.equal(snapshot.history_rank_list.length, 1);
  const before = resource(fixture.store, 6501900);
  const award = await service.execute(92801);
  assert.equal(award.data.length > 0, true);
  assert.equal(resource(fixture.store, 6501900), before + 500n);
  assert.equal(claimCount(fixture.store, 'pit_lord_rank_award'), 1);
  await assert.rejects(service.execute(92801), error => error.code === 5);
  await assert.rejects(service.execute(92803), error => error.code === 5);
  const free = await service.execute(92804);
  const freeRes = codec.unpack('pb_res_to_client', free.data);
  assert.equal(freeRes.changes.length > 0, true);
  await assert.rejects(service.execute(92804), error => error.code === 5);
  fixture.open();
  service = createPitLordService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  assert.equal(claimCount(fixture.store, 'pit_lord_rank_award'), 1);
  await assert.rejects(service.execute(92801), error => error.code === 5);
});

test('PitLord missing board fails closed and encoding/write failures roll back', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-pitlord-rollback-' });
  const service = createPitLordService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  await assert.rejects(service.execute(92801), error => error.code === 5);
  service.recordDamage(fixture.store.state().roleId, 1000, { dayIndex: 1 });
  service.snapshot(1);
  const before = resource(fixture.store, 6501900);
  const broken = createPitLordService({ store: fixture.store, codec: failingCodec('pb_pit_lord_rank_award_rsp'), gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  await assert.rejects(broken.execute(92801), /encode failed/);
  assert.equal(resource(fixture.store, 6501900), before);
  assert.equal(claimCount(fixture.store, 'pit_lord_rank_award'), 0);
  fixture.store.inspect(db => db.exec("CREATE TRIGGER pit_claim_boom BEFORE INSERT ON reward_claims WHEN NEW.claim_type='pit_lord_rank_award' BEGIN SELECT RAISE(ABORT,'boom'); END"));
  await assert.rejects(service.execute(92801), /boom/);
  assert.equal(resource(fixture.store, 6501900), before);
  assert.equal(claimCount(fixture.store, 'pit_lord_rank_award'), 0);
});

test('WorldBoss enter, damage history, kill receive and achievement use real records', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-worldboss-' });
  let service = createWorldBossService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, bossTid: 1 });
  const entered = await service.execute(91801);
  const map = codec.unpack('pb_world_boss_server', entered.data);
  assert.equal(map.cur_boss.tid, 1);
  const left = await service.execute(91802);
  assert.equal(left.noReply, true);
  service.recordDamage(fixture.store.state().roleId, 3600000000, { dayIndex: 1 });
  const history = codec.unpack('pb_world_boss_history_rank', (await service.execute(91804)).data);
  assert.equal(history.rank_list.length > 0, true);
  const diamonds = resource(fixture.store, 101500);
  const kill = await service.execute(91803);
  assert.equal(codec.unpack('pb_world_boss_receive_kill_back', kill.data).person.receive_boss_tid, 1);
  assert.equal(resource(fixture.store, 101500), diamonds + 300n);
  await assert.rejects(service.execute(91803), error => error.code === 5);
  const achievement = await service.execute(91805, { tid_list: [1] });
  assert.equal(codec.unpack('pb_res_to_client', achievement.data).changes.length, 1);
  await assert.rejects(service.execute(91805, { tid_list: [1] }), error => error.code === 5);
  fixture.open();
  service = createWorldBossService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, bossTid: 1 });
  await assert.rejects(service.execute(91803), error => error.code === 5);
  await assert.rejects(service.execute(91805, { tid_list: [1] }), error => error.code === 5);
});

test('WorldBoss schedule and kill records fail closed without evidence; encode failure rolls back', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-worldboss-closed-' });
  const unresolved = createWorldBossService({ store: fixture.store, codec, gameTables: tables, now: () => NOW });
  await assert.rejects(unresolved.execute(91801), error => error.code === 5);
  const service = createWorldBossService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, bossTid: 1 });
  await assert.rejects(service.execute(91803), error => error.code === 5);
  service.recordDamage(fixture.store.state().roleId, 3600000000, { dayIndex: 1 });
  const before = resource(fixture.store, 101500);
  const broken = createWorldBossService({ store: fixture.store, codec: failingCodec('pb_world_boss_receive_kill_back'), gameTables: tables, now: () => NOW, bossTid: 1 });
  await assert.rejects(broken.execute(91803), /encode failed/);
  assert.equal(resource(fixture.store, 101500), before);
  assert.equal(claimCount(fixture.store, 'world_boss_kill'), 0);
});

test('FameHall data/enter/drop/award/artifact/sweep persist and fail closed', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-famehall-' });
  let service = createFameHallService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  assert.equal(codec.unpack('pb_fame_hall_role', (await service.execute(91109)).data).data_version, 1);
  assert.equal((await service.execute(91110)).noReply, true);
  assert.equal(codec.unpack('pb_fame_hall_enter_difficult_rsp', (await service.execute(91101, { hero_id: '1', difficult: 1 })).data).fame_hall_data.cur_difficult, 1);
  await assert.rejects(service.execute(91102, { target_tid: '1', drop_tid: '1', is_give_up: false }), error => error.code === 5);
  assert.equal((await service.execute(91106)).data.length > 0, true);
  assert.equal((await service.execute(91107)).data.length > 0, true);
  fixture.store.transaction((model, db) => {
    const state = JSON.parse(db.prepare('SELECT state_json FROM fame_hall_state WHERE role_id=?').get(model.state.roleId).state_json);
    state.maxStage = 108;
    db.prepare('UPDATE fame_hall_state SET state_json=? WHERE role_id=?').run(JSON.stringify(state), model.state.roleId);
  });
  const award = await service.execute(91103, { tid_list: ['101'] });
  assert.equal(codec.unpack('pb_fame_hall_reward_rsp', award.data).res.changes.length, 1);
  await assert.rejects(service.execute(91103, { tid_list: ['101'] }), error => error.code === 5);
  await assert.rejects(service.execute(91104, { artifact_id: '1001', team_index: 1 }), error => error.code === 5);
  fixture.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(50, { value: [{ value: codec.pack('pb_artifact_info', { artifact_list: [{ tid: '1001', num: 1, star: 0, quality: 0 }] }).toJSON(), bits: 8 }], bits: 8 });
    model.state.modules.value = [...modules];
  });
  const artifact = codec.unpack('pb_fame_hall_line_artifact', (await service.execute(91104, { artifact_id: '1001', team_index: 1 })).data);
  assert.deepEqual(artifact.lineup_artifact, ['1001']);
  const sweep = await service.execute(91108);
  assert.equal(codec.unpack('pb_fame_hall_sweep_rsp', sweep.data).res.changes.length, 3);
  await assert.rejects(service.execute(91108), error => error.code === 5);
  fixture.open();
  service = createFameHallService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  assert.equal(codec.unpack('pb_fame_hall_role', (await service.execute(91109)).data).max_stage, '108');
});

test('FameHall encoding and SQLite write failures roll back the whole award', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-famehall-rollback-' });
  let service = createFameHallService({ store: fixture.store, codec, gameTables: tables, now: () => NOW, serverOpenedAt: NOW / 1000 - 86400 });
  fixture.store.transaction((model, db) => {
    db.prepare('INSERT INTO fame_hall_state(role_id,state_json,updated_at) VALUES(?,?,?)').run(model.state.roleId, JSON.stringify({ maxStage: 108, curDifficult: 1 }), new Date(NOW).toISOString());
  });
  const before = resource(fixture.store, 3002);
  const broken = createFameHallService({ store: fixture.store, codec: failingCodec('pb_fame_hall_reward_rsp'), gameTables: tables, now: () => NOW });
  await assert.rejects(broken.execute(91103, { tid_list: ['101'] }), /encode failed/);
  assert.equal(resource(fixture.store, 3002), before);
  assert.equal(claimCount(fixture.store, 'fame_hall_stage'), 0);
  fixture.store.inspect(db => db.exec("CREATE TRIGGER fame_claim_boom BEFORE INSERT ON reward_claims WHEN NEW.claim_type='fame_hall_stage' BEGIN SELECT RAISE(ABORT,'boom'); END"));
  await assert.rejects(service.execute(91103, { tid_list: ['101'] }), /boom/);
  assert.equal(resource(fixture.store, 3002), before);
  assert.equal(claimCount(fixture.store, 'fame_hall_stage'), 0);
});

test('gateway dispatches PitLord history and free award over temporary loopback TCP', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-boss-tcp-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200, now: () => NOW, random: () => 0.5
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
  const history = await request(92802, 2, Buffer.alloc(0));
  assert.equal(history.err, undefined);
  // An empty history message legitimately encodes to zero bytes, which the
  // gateway omits from pb_s2c; decoding the empty payload yields empty lists.
  assert.deepEqual(Object.keys(codec.unpack('pb_pit_lord_history_rank_list', Buffer.from(history.data ?? '', 'base64'))).includes('history_rank_list'), true);
  const free = await request(92804, 3, Buffer.alloc(0));
  assert.equal(free.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(free.data, 'base64')).changes.length > 0, true);
});
