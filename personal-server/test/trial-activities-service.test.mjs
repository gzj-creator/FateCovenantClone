import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createSoulTrialService } from '../game/soul-trial-service.mjs';
import { createScarletTrialService, damageFromSimulation } from '../game/scarlet-trial-service.mjs';
import { readSoulTrialTables, readScarletTrialTables } from '../config/dungeon-activity-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const soulTables = readSoulTrialTables();
const scarletTables = readScarletTrialTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;
const soulConfig = soulTables.drawCards.get(1);

function unit(id, team, overrides = {}) {
  return {
    id, role: 1010101, profession: 1, loc: 1, abilityId: 1, activeAbilityId: 1,
    maxHp: 1000, attack: 100, defense: 10, speed: 100, initialEnergy: 500, ...overrides
  };
}

function simulation() {
  return simulateBattle({
    attackers: [unit(101, 1, { maxHp: 6000, attack: 400, speed: 220 })],
    defenders: [unit(201, 2, { maxHp: 3000, attack: 50, defense: 10, speed: 50, loc: 2 })],
    seed: 7
  });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-trials-' });
  let soul = createSoulTrialService({ store: fixture.store, codec, tables: soulTables, gameTables, now: () => FIXED_NOW });
  let scarlet = createScarletTrialService({ store: fixture.store, codec, tables: scarletTables, gameTables, now: () => FIXED_NOW });
  return {
    get store() { return fixture.store; },
    get soul() { return soul; },
    get scarlet() { return scarlet; },
    reopen() {
      const store = fixture.open();
      soul = createSoulTrialService({ store, codec, tables: soulTables, gameTables, now: () => FIXED_NOW });
      scarlet = createScarletTrialService({ store, codec, tables: scarletTables, gameTables, now: () => FIXED_NOW });
      return { store, soul, scarlet };
    }
  };
}

test('87104 reveals each location once and only for the configured free draws', async t => {
  const { soul } = setup(t);
  const first = await soul.drawAward(1);
  assert.equal(first.value.loc, 1);
  const packet = codec.unpack('pb_soul_trial_draw_back', first.data);
  assert.equal(packet.look.item_tid, String(soulConfig.award_item));
  await assert.rejects(soul.drawAward(1), /already revealed/);
  await assert.rejects(soul.drawAward(0), /Invalid/);
  const free = Number(soulConfig.poker_day_free_times);
  for (let loc = 2; loc <= free; loc += 1) await soul.drawAward(loc);
  await assert.rejects(soul.drawAward(free + 1), /paid draw cost semantics/);
});

test('87105 grants revealed cards once and survives a reopen', async t => {
  const { soul, reopen } = setup(t);
  await assert.rejects(soul.revDrawAward(), /not claimable/);
  await soul.drawAward(1);
  await soul.drawAward(2);
  const result = await soul.revDrawAward();
  const packet = codec.unpack('pb_soul_trial_rev_draw_back', result.data);
  assert.equal(packet.rev_day, 1);
  assert.deepEqual(packet.rev_loc_list, [1, 2]);
  assert.ok(packet.res_changes.changes.length > 0);
  await assert.rejects(soul.revDrawAward(), /not claimable/);
  const { soul: reopened } = reopen();
  await assert.rejects(reopened.revDrawAward(), /not claimable/);
});

test('89101 gates tasks on simulation-derived damage and pays once', async t => {
  const { scarlet } = setup(t);
  const gated = [...scarletTables.tasks.values()].find(row => Number(row.damage) > 0 && Number(row.damage) < 1000000);
  if (gated) await assert.rejects(scarlet.taskAward(gated.tid), /damage requirement/);
  const settled = await scarlet.settleFight({ simulation: simulation() });
  assert.ok(settled.value.damage > 0);
  assert.equal(settled.value.damage, damageFromSimulation(simulation()));
  await assert.rejects(scarlet.settleFight({}), /battle engine simulation/);
  const task = gated ?? [...scarletTables.tasks.values()].find(row => Number(row.damage) === 0);
  const result = await scarlet.taskAward(task.tid);
  const packet = codec.unpack('pb_scarlet_trial_award_back', result.data);
  assert.ok(packet.res_change.changes.length > 0);
  assert.ok(packet.scarlet_trial_data.received_tasks.includes(task.tid));
  await assert.rejects(scarlet.taskAward(task.tid), /already received/);
  await assert.rejects(scarlet.taskAward(999999), /configuration/);
});

test('89102 stores the configured source stone without a reply frame', async t => {
  const { scarlet, reopen } = setup(t);
  const stoneTid = Number(scarletTables.const.source_stone);
  const result = await scarlet.selectStone({ pos: 3, tid: stoneTid });
  assert.equal(result.noReply, true);
  assert.equal(scarlet.state(100001).stones[0].pos, 3);
  await assert.rejects(scarlet.selectStone({ pos: 3, tid: stoneTid + 1 }), /configuration/);
  await assert.rejects(scarlet.selectStone({ pos: 0, tid: stoneTid }), /Invalid/);
  const { scarlet: reopened } = reopen();
  assert.equal(reopened.state(100001).stones[0].tid, stoneTid);
});

test('a SQLite failure rolls back the scarlet task reward', async t => {
  const { store, scarlet } = setup(t);
  scarlet.state(100001);
  const task = [...scarletTables.tasks.values()].find(row => Number(row.damage) === 0);
  const reward = task.award[0];
  const before = BigInt(store.read().resources.get(String(reward))?.num ?? 0);
  store.inspect(db => db.exec("CREATE TRIGGER scarlet_task_boom BEFORE INSERT ON dungeon_activity_claims WHEN NEW.claim_type='scarlet_trial_task' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(scarlet.taskAward(task.tid), /boom/);
  assert.equal(BigInt(store.read().resources.get(String(reward))?.num ?? 0), before);
  store.inspect(db => db.exec('DROP TRIGGER scarlet_task_boom'));
  assert.ok((await scarlet.taskAward(task.tid)).value.changes.length > 0);
});

test('an encoding failure rolls back the soul trial draw claim', async t => {
  const { store, soul } = setup(t);
  soul.state(100001);
  const failingCodec = {
    pack(schema, value) { if (schema === 'pb_soul_trial_draw_back') throw new Error('encode failed'); return codec.pack(schema, value); },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const failing = createSoulTrialService({ store, codec: failingCodec, tables: soulTables, gameTables, now: () => FIXED_NOW });
  await assert.rejects(failing.drawAward(1), /encode failed/);
  const claims = store.inspect(db => db.prepare("SELECT COUNT(*) AS count FROM dungeon_activity_claims WHERE claim_type='soul_trial_draw'").get());
  assert.equal(Number(claims.count), 0);
  assert.equal((await soul.drawAward(1)).value.loc, 1);
});

test('gateway routes 87104/87105 and 89101/89102 on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-trials-gateway-'));
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

  game.store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS dungeon_activity_state (
      role_id INTEGER NOT NULL, activity TEXT NOT NULL, state_json TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id, activity))`);
    db.prepare('INSERT OR REPLACE INTO dungeon_activity_state VALUES (?,?,?,?)').run(100001, 'scarlet_trial', JSON.stringify({ totalDamage: 10000000, dayMaxDamage: 10000000, receivedTasks: [], stones: [] }), '2026-11-06T00:00:00.000Z');
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

  const drawn = await request(87104, 2, await encodeEtf(2));
  assert.equal(drawn.err, undefined);
  assert.equal(codec.unpack('pb_soul_trial_draw_back', Buffer.from(drawn.data, 'base64')).look.loc, 2);
  const revealed = await request(87105, 3, Buffer.alloc(0));
  assert.ok(codec.unpack('pb_soul_trial_rev_draw_back', Buffer.from(revealed.data, 'base64')).res_changes.changes.length > 0);
  const taskTid = [...scarletTables.tasks.values()].find(row => Number(row.damage) <= 10000000).tid;
  const awarded = await request(89101, 4, await encodeEtf(taskTid));
  assert.equal(awarded.err, undefined);
  const stoneTid = Number(scarletTables.const.source_stone);
  send(codec.pack('pb_c2s', { type: 89102, seq: 5, data: await encodeEtf([2, stoneTid]) }));
  const afterStone = await request(87104, 6, await encodeEtf(3));
  assert.equal(afterStone.err, undefined);
  const stonePacket = codec.unpack('pb_soul_trial_draw_back', Buffer.from(afterStone.data, 'base64'));
  assert.equal(stonePacket.look.loc, 3);
});
