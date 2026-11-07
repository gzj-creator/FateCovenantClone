import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createEliteMissionBattle } from '../game/elite-mission-battle.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const missionTables = readMissionTables();
const attributeTables = readAttributeTables();
const FIXED_NOW = 1794000000000;
// Real HeroTable.Npc ids. The shared attribute service scales combat NPCs from
// the strongest player fighter, so 9000100 is beatable and the elite 5-star NPC
// 5040201 wins against the fixture line-up; both results come from the real
// simulateBattle run rather than an injected result.
const WINNING_ENEMIES = () => [9000100];
const LOSING_ENEMIES = () => [5040201];
const STAMINA = '100012900';

const heroes = [
  { hero_id: '2010101', loc: 6 },
  { hero_id: '2010201', loc: 4 },
  { hero_id: '1020601', loc: 2 },
  { hero_id: '2020601', loc: 5 }
];

function eliteRequest(payload, extra = {}) {
  return codec.unpack('pb_fight_request', codec.pack('pb_fight_request', {
    fight_tid: extra.fight_tid ?? 0,
    stm_type: 1,
    req: codec.pack('pb_elite_mission_req', payload),
    loc: [{ team_id: 1, loc: heroes }]
  }));
}

function stage(id, extra) { return eliteRequest({ mission_id: id }, extra); }
function boss(id, extra) { return eliteRequest({ boss_id: id }, extra); }

function setEliteMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(140, serializedBinary(codec.pack('pb_elite_mission', { mission_id: String(missionId) })));
    model.state.modules.value = [...modules];
  });
}

function eliteModule(store) {
  const entry = new Map(store.read().state.modules.value).get(140);
  const bytes = Array.isArray(entry?.value) ? rawBinary(entry.value[0]) : Buffer.from(entry?.value?.data ?? []);
  if (!bytes.length) return { mission_id: '0', boss_bin: '', box_award_bin: '' };
  return codec.unpack('pb_elite_mission', bytes);
}
const staminaOf = store => BigInt(store.read().resources.get(STAMINA)?.num ?? 0);
const claimsOf = (store, claimType) => store.inspect(db => db.prepare('SELECT claim_key FROM reward_claims WHERE claim_type=? ORDER BY claim_key').all(claimType).map(row => row.claim_key));

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-elite-battle-' });
  const events = [];
  function build(store) {
    let battleCodec = options.codec ?? codec;
    const battle = createEliteMissionBattle({
      store, codec: battleCodec, tables, missionTables, attributeTables,
      now: () => FIXED_NOW, logger: event => events.push(event),
      enemyProvider: options.enemyProvider === undefined ? WINNING_ENEMIES : options.enemyProvider
    });
    const fight = createMissionFightService({ store, codec, playbackEnabled: true, now: () => FIXED_NOW, eliteBattle: battle });
    return { battle, fight };
  }
  let services = build(fixture.store);
  return {
    events,
    fixture,
    get store() { return fixture.store; },
    get battle() { return services.battle; },
    get fight() { return services.fight; },
    rebuild(next = {}) {
      services = build(fixture.store, next);
      return services;
    },
    reopen() {
      services = build(fixture.open());
      return services;
    }
  };
}

async function startAndSettle(env, request) {
  const started = await env.fight.execute(201, codec.pack('pb_fight_request', request));
  const settled = await env.fight.execute(207, Buffer.alloc(0));
  return { report: codec.unpack('pb_fight_response', started.data).report, settled };
}

test('elite battle claims only pb_elite_mission_req payloads', async t => {
  const env = setup(t);
  assert.equal(env.battle.matches(stage(101)), true);
  assert.equal(env.battle.matches(boss(1)), true);
  // Ordinary journey payloads name their mission in field 3, which the elite
  // schema cannot see, so they must stay on the journey path.
  const journey = codec.unpack('pb_fight_request', codec.pack('pb_fight_request', {
    req: codec.pack('mission_fight_req', { mission_id: 20201 }), loc: [{ team_id: 1, loc: heroes }]
  }));
  assert.equal(env.battle.matches(journey), false);
  assert.equal(env.battle.matches(codec.unpack('pb_fight_request', codec.pack('pb_fight_request', { req: Buffer.alloc(0) }))), false);
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', { req: codec.pack('pb_elite_mission_req', {}) })), /Only ordinary mission fights/);
});

test('elite stage 201 replays a real battle and 207 commits progress, stamina and reward', async t => {
  const env = setup(t);
  const before = { stamina: staminaOf(env.store), diamonds: BigInt(env.store.read().resources.get('101500')?.num ?? 0) };
  const started = env.fight.execute(201, codec.pack('pb_fight_request', stage(101)));
  const report = codec.unpack('pb_fight_response', started.data).report;
  assert.equal(report.type, 6);
  assert.equal(report.tid, '15000101');
  assert.ok(!report.finish, 'settlement is requested only for unfinished reports');
  assert.equal(report.final_result, 1);
  assert.ok(report.battle_list[0].action_list.length > 0);
  assert.equal(Number(report.battle_list[0].def_brief_lineup.team_list[0].fighter_list[0].tid), 9000100);

  const settled = await env.fight.execute(207, Buffer.alloc(0));
  const stm = codec.unpack('pb_fight_settlement_response', settled.data).stm;
  const back = codec.unpack('pb_elite_mission_back', Buffer.from(stm.stm_data, 'base64'));
  assert.equal(stm.result, 1);
  assert.equal(back.mission_info.mission_id, '101');
  assert.ok(!back.is_boss);
  assert.equal(Number(back.boss_tid ?? 0), 0);
  assert.equal(eliteModule(env.store).mission_id, '101');
  assert.equal(staminaOf(env.store), before.stamina - 5n);
  // EliteMission 101 ships award [[125202,1],[201500,400],[101800,300]].
  assert.equal(BigInt(env.store.read().resources.get('101800')?.num ?? 0) >= 300n, true);
  assert.deepEqual(claimsOf(env.store, 'elite_mission_clear'), ['101']);

  // A repeated 207 for the same report must replay the cached answer without
  // charging stamina or granting again.
  const replay = await env.fight.execute(207, Buffer.alloc(0));
  assert.deepEqual(replay.data, settled.data);
  assert.equal(staminaOf(env.store), before.stamina - 5n);
});

test('replaying a cleared elite stage never grants the first-clear reward twice', async t => {
  const env = setup(t);
  await startAndSettle(env, stage(101));
  const afterFirst = staminaOf(env.store);
  const reward = BigInt(env.store.read().resources.get('101800').num);
  const second = await startAndSettle(env, stage(101));
  assert.equal(codec.unpack('pb_elite_mission_back', Buffer.from(second.settled.value.stm.stm_data, 'base64')).mission_info.mission_id, '101');
  assert.equal(staminaOf(env.store), afterFirst - 5n);
  assert.equal(BigInt(env.store.read().resources.get('101800').num), reward);
  assert.deepEqual(claimsOf(env.store, 'elite_mission_clear'), ['101']);
});

test('a lost elite stage consumes stamina without progress or rewards', async t => {
  const env = setup(t, { enemyProvider: LOSING_ENEMIES });
  const before = staminaOf(env.store);
  const { report, settled } = await startAndSettle(env, stage(101));
  assert.equal(report.final_result, 2);
  const back = codec.unpack('pb_elite_mission_back', Buffer.from(settled.value.stm.stm_data, 'base64'));
  assert.equal(String(back.mission_info.mission_id ?? '0'), '0');
  assert.equal(eliteModule(env.store).mission_id, '0');
  assert.equal(staminaOf(env.store), before - 5n);
  assert.deepEqual(claimsOf(env.store, 'elite_mission_clear'), []);
});

test('elite boss clear sets boss_bin and grants the Boss reward once', async t => {
  const env = setup(t);
  setEliteMission(env.store, 105);
  const before = staminaOf(env.store);
  const { report, settled } = await startAndSettle(env, boss(1));
  assert.equal(report.type, 114);
  assert.equal(report.tid, '15900001');
  const back = codec.unpack('pb_elite_mission_back', Buffer.from(settled.value.stm.stm_data, 'base64'));
  assert.equal(back.is_boss, true);
  assert.equal(back.boss_tid, '1');
  assert.equal(back.mission_info.mission_id, '105');
  const bits = await decodeEtf(Buffer.from(back.mission_info.boss_bin, 'base64'));
  const bitBytes = bits?.value?.data ? Buffer.from(bits.value.data) : Buffer.from(bits?.value ?? bits);
  assert.equal(bitBytes[0] & 0x40, 0x40, 'boss tid 1 sets BitBlock index 1 (MSB-first)');
  assert.deepEqual(claimsOf(env.store, 'elite_mission_boss'), ['1']);
  // Boss.award row 1 is [[2002,5],[25002,2],[101500,200]].
  const diamonds = BigInt(env.store.read().resources.get('101500')?.num ?? 0);
  // A second kill keeps the bitmap and the claim but still costs stamina.
  await startAndSettle(env, boss(1));
  assert.equal(BigInt(env.store.read().resources.get('101500')?.num ?? 0), diamonds);
  assert.deepEqual(claimsOf(env.store, 'elite_mission_boss'), ['1']);
  assert.equal(staminaOf(env.store), before - 10n);
});

test('elite battle rejects unknown, locked, closed and unaffordable challenges', async t => {
  const env = setup(t);
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', stage(999999))), /configuration/);
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', stage(103))), /not unlocked/);
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', boss(2))), /not open/);
  await startAndSettle(env, stage(101));
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', stage(103))), /not unlocked/);
  assert.equal((await env.fight.execute(201, codec.pack('pb_fight_request', stage(102)))).data.length > 0, true);
  await env.fight.execute(202, codec.pack('pb_fight_exit', { is_force: true }));

  env.store.transaction(model => {
    model.resources.get(STAMINA).num = '0';
    model.resources.get(STAMINA).produce_time = Math.floor(FIXED_NOW / 1000);
  });
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', stage(102))), /Insufficient/);
});

test('a deployment without elite enemy data gets an explicit configuration error', async t => {
  const env = setup(t, { enemyProvider: null });
  assert.throws(() => env.fight.execute(201, codec.pack('pb_fight_request', stage(101))), error => error.code === 5 && /enemy configuration is missing/.test(error.message));
  assert.equal(staminaOf(env.store), 120n);
  assert.equal(eliteModule(env.store).mission_id, '0');
});

test('a SQLite failure rolls back the whole elite settlement', async t => {
  const env = setup(t);
  const before = staminaOf(env.store);
  await env.fight.execute(201, codec.pack('pb_fight_request', stage(101)));
  env.store.inspect(db => db.exec("CREATE TRIGGER elite_claim_boom BEFORE INSERT ON reward_claims WHEN NEW.claim_type='elite_mission_clear' BEGIN SELECT RAISE(ABORT, 'boom'); END"));
  await assert.rejects(env.fight.execute(207, Buffer.alloc(0)), /boom/);
  assert.equal(staminaOf(env.store), before);
  assert.equal(eliteModule(env.store).mission_id, '0');
  assert.deepEqual(claimsOf(env.store, 'elite_mission_clear'), []);
  env.store.inspect(db => db.exec('DROP TRIGGER elite_claim_boom'));
  const recovered = await env.fight.execute(207, Buffer.alloc(0));
  assert.equal(codec.unpack('pb_elite_mission_back', Buffer.from(recovered.value.stm.stm_data, 'base64')).mission_info.mission_id, '101');
  assert.equal(staminaOf(env.store), before - 5n);
});

test('an encoding failure rolls back the elite settlement', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-elite-encode-' });
  let backPacks = 0;
  const failingCodec = {
    pack(schema, value) {
      if (schema === 'pb_elite_mission_back' && ++backPacks > 1) throw new Error('encode failed');
      return codec.pack(schema, value);
    },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const battle = createEliteMissionBattle({
    store: fixture.store, codec: failingCodec, tables, missionTables, attributeTables,
    now: () => FIXED_NOW, enemyProvider: WINNING_ENEMIES
  });
  const fight = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true, now: () => FIXED_NOW, eliteBattle: battle });
  const before = staminaOf(fixture.store);
  await fight.execute(201, codec.pack('pb_fight_request', stage(101)));
  await assert.rejects(fight.execute(207, Buffer.alloc(0)), /encode failed/);
  assert.equal(staminaOf(fixture.store), before);
  assert.equal(eliteModule(fixture.store).mission_id, '0');
  assert.deepEqual(claimsOf(fixture.store, 'elite_mission_clear'), []);
});

test('elite progress and claims survive a database reopen', async t => {
  const env = setup(t);
  await startAndSettle(env, stage(101));
  const stamina = staminaOf(env.store);
  env.reopen();
  assert.equal(eliteModule(env.store).mission_id, '101');
  assert.deepEqual(claimsOf(env.store, 'elite_mission_clear'), ['101']);
  assert.equal(staminaOf(env.store), stamina);
  const replay = await startAndSettle(env, stage(101));
  assert.equal(codec.unpack('pb_elite_mission_back', Buffer.from(replay.settled.value.stm.stm_data, 'base64')).mission_info.mission_id, '101');
  assert.equal(staminaOf(env.store), stamina - 5n);
});

test('gateway drives the elite 87001 -> 201 -> 207 chain on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-elite-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    random: () => 0.5,
    missionFightPlayback: true,
    eliteEnemies: WINNING_ENEMIES
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

  const select = await request(87001, 2, encodeEtf([101]));
  assert.equal(select.err, undefined);
  assert.ok(select.data.length > 0);

  const start = await request(201, 3, codec.pack('pb_fight_request', {
    stm_type: 1, req: codec.pack('pb_elite_mission_req', { mission_id: 101 }), loc: [{ team_id: 1, loc: heroes }]
  }));
  assert.equal(start.err, undefined);
  const report = codec.unpack('pb_fight_response', Buffer.from(start.data, 'base64')).report;
  assert.equal(report.type, 6);
  assert.ok(!report.finish);

  const settle = await request(207, 4, Buffer.alloc(0));
  assert.equal(settle.err, undefined);
  const stm = codec.unpack('pb_fight_settlement_response', Buffer.from(settle.data, 'base64')).stm;
  const back = codec.unpack('pb_elite_mission_back', Buffer.from(stm.stm_data, 'base64'));
  assert.equal(back.mission_info.mission_id, '101');

  const nextStage = await request(87001, 5, encodeEtf([102]));
  assert.equal(nextStage.err, undefined);
  const second = await request(201, 6, codec.pack('pb_fight_request', {
    stm_type: 1, req: codec.pack('pb_elite_mission_req', { mission_id: 102 }), loc: [{ team_id: 1, loc: heroes }]
  }));
  assert.equal(second.err, undefined);
  const secondReport = codec.unpack('pb_fight_response', Buffer.from(second.data, 'base64')).report;
  assert.equal(secondReport.tid, '15000102');
  const secondSettle = await request(207, 7, Buffer.alloc(0));
  assert.equal(secondSettle.err, undefined);
  const secondStm = codec.unpack('pb_fight_settlement_response', Buffer.from(secondSettle.data, 'base64')).stm;
  assert.equal(codec.unpack('pb_elite_mission_back', Buffer.from(secondStm.stm_data, 'base64')).mission_info.mission_id, '102');
  assert.equal(eliteModule(game.store).mission_id, '102');

  const locked = await request(201, 8, codec.pack('pb_fight_request', {
    stm_type: 1, req: codec.pack('pb_elite_mission_req', { mission_id: 105 }), loc: [{ team_id: 1, loc: heroes }]
  }));
  assert.equal(locked.err.err, 5);
});

