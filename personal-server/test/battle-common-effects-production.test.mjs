import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

// CORE-BATTLE-A production path: the shared damage rules must be visible in the
// real 201/207 mission fight the gateway serves, not only in engine helpers.
const codec = createGameCodec();
const LINEUP = [
  { hero_id: '2010101', loc: 6 },
  { hero_id: '2010201', loc: 4 },
  { hero_id: '1020601', loc: 2 },
  { hero_id: '2020601', loc: 5 }
];
// Fighter 102 is hero 2010201, whose catalog passive 120001002 converts 10% of
// its ultimate's actual HP damage into self healing.
const LIFESTEAL_FIGHTER = 102;
const SETTLEMENT = codec.pack('pb_fight_settlement_request', { fight_type: 1 });
const SCHEMAS = {
  101: 'pb_fat_action_before', 102: 'pb_fat_action_after', 104: 'pb_fat_battle_over',
  105: 'pb_fat_fighter_die', 106: 'pb_fat_harm', 107: 'pb_fat_round_ready',
  109: 'pb_fat_shield', 112: 'pb_fat_round_over', 114: 'pb_fat_fighter_relive',
  116: 'pb_fat_attr_sync'
};

function fightRequest(mission) {
  return codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: mission }),
    loc: [{ team_id: 1, loc: LINEUP }]
  });
}

function decodeActions(report) {
  return report.action_list.map(bytes => {
    const generic = codec.unpack('pb_generic', Buffer.from(bytes, 'base64'));
    return { proto: generic.proto, value: codec.unpack(SCHEMAS[generic.proto], Buffer.from(generic.bin, 'base64')) };
  });
}

/**
 * Rebuild one fighter's HP path from the action stream alone. Protobuf omits
 * zero values, so a killed fighter's hp reads as null.
 */
function hpPath(actions, fighterId) {
  const hits = [];
  for (const action of actions) {
    if (action.proto !== 106) continue;
    for (const harm of action.value.harm_list) {
      if (harm.aim_id !== fighterId) continue;
      // A recovery packet (TID_PROMPT_HEAL) carries its own old_hp/hp pair and
      // is asserted separately; mixing it into the damage path would double
      // count the same HP rise.
      if (Number(harm.type) === 107) continue;
      hits.push({ id: action.value.id, oldHp: Number(harm.old_hp ?? 0), hp: Number(harm.hp ?? 0) });
    }
  }
  return hits;
}

/** Recovery packets the server now projects as pb_fat_harm with type 107. */
function healPackets(actions, fighterId) {
  const heals = [];
  for (const action of actions) {
    if (action.proto !== 106) continue;
    for (const harm of action.value.harm_list) {
      if (harm.aim_id !== fighterId || Number(harm.type) !== 107) continue;
      heals.push({
        id: action.value.id,
        value: Number(harm.value ?? 0),
        oldHp: Number(harm.old_hp ?? 0),
        hp: Number(harm.hp ?? 0)
      });
    }
  }
  return heals;
}

function ultimateDamageOf(actions, actorId) {
  const ultimateActions = new Set(actions
    .filter(action => action.proto === 101 && action.value.src_id === actorId && action.value.type === 2)
    .map(action => action.value.id));
  let total = 0;
  for (const action of actions) {
    if (action.proto !== 106 || !ultimateActions.has(action.value.id)) continue;
    for (const harm of action.value.harm_list) {
      if (harm.src_id !== actorId) continue;
      // The life-steal recovery is a 107 prompt inside the same action; its
      // old_hp/hp pair would otherwise subtract from the damaging total.
      if (Number(harm.type) === 107) continue;
      total += Number(harm.old_hp ?? 0) - Number(harm.hp ?? 0);
    }
  }
  return total;
}

function assertLifestealFromReport(report) {
  const actions = decodeActions(report);
  assert.equal(actions[0].proto, 107);
  assert.ok(actions.some(action => action.proto === 106), 'the report must carry damage');
  const ultimateDamage = ultimateDamageOf(actions, LIFESTEAL_FIGHTER);
  assert.ok(ultimateDamage > 0, 'hero 2010201 must land an ultimate that deals HP damage');
  const hits = hpPath(actions, LIFESTEAL_FIGHTER);
  assert.ok(hits.length >= 2);
  const recoveries = [];
  for (let index = 1; index < hits.length; index++) {
    const gap = hits[index].oldHp - hits[index - 1].hp;
    if (gap > 0) recoveries.push({ gap, afterAction: hits[index - 1].id });
  }
  assert.equal(recoveries.length, 1, 'only the ultimate life-steal may raise this fighter HP');
  assert.equal(recoveries[0].gap, Math.floor(ultimateDamage * 0.1));
  const heals = healPackets(actions, LIFESTEAL_FIGHTER);
  assert.equal(heals.length, 1, 'the life-steal is reported as one TID_PROMPT_HEAL packet');
  assert.equal(heals[0].value, Math.floor(ultimateDamage * 0.1));
  assert.equal(heals[0].hp - heals[0].oldHp, heals[0].value);
  return actions;
}

const STAMINA_TID = '100012900';
const stamina = store => store.read().resources.get(STAMINA_TID).num;
const missionId = store => codec.unpack('pb_mission',
  rawBinary(new Map(store.state().modules.value).get(8).value[0])).mission_id;

function setupService(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-battle-a-', now: () => 1700000000 * 1000 });
  promoteActionCoverageHeroes(fixture.store);
  let store = fixture.store;
  let service = createMissionFightService({ store, codec, playbackEnabled: true, now: () => 1700000000 * 1000 });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store = fixture.open();
      service = createMissionFightService({ store, codec, playbackEnabled: true, now: () => 1700000000 * 1000 });
    }
  };
}

function promoteActionCoverageHeroes(store) {
  store.transaction(model => {
    for (const hero of model.heroInfo.hero_list) {
      if ([2010101, 2010201].includes(Number(hero.tid))) hero.star = 6;
    }
  });
}

test('the mission fight service applies the shared damage rules and commits once', t => {
  const env = setupService(t);
  assert.equal(missionId(env.store), '20205');
  assert.equal(stamina(env.store), '120');

  const started = env.service.execute(201, fightRequest(30201));
  const report = codec.unpack('pb_fight_response', Buffer.from(started.data, 'base64')).report.battle_list[0];
  assertLifestealFromReport(report);
  // 201 previews only: nothing may be written before 207.
  assert.equal(missionId(env.store), '20205');
  assert.equal(stamina(env.store), '120');

  env.service.execute(207, SETTLEMENT);
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');

  env.reopen();
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');
  assert.equal(env.store.inspect(db => db.prepare(
    "SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'"
  ).get().n), 1);
});

test('a rejected settlement write rolls back the battle result and stays retryable', t => {
  const env = setupService(t);
  env.service.execute(201, fightRequest(30201));
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER fc_fail_settlement BEFORE INSERT ON reward_claims BEGIN SELECT RAISE(ABORT, 'settlement rollback'); END"
  ));
  assert.throws(() => env.service.execute(207, SETTLEMENT), /settlement rollback/);
  assert.equal(missionId(env.store), '20205');
  assert.equal(stamina(env.store), '120');
  assert.equal(env.store.inspect(db => db.prepare(
    "SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'"
  ).get().n), 0);

  env.store.inspect(db => db.exec('DROP TRIGGER fc_fail_settlement'));
  env.service.execute(207, SETTLEMENT);
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');
  env.reopen();
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');
});

const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);

async function openGateway(databasePath, directory) {
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    missionFightPlayback: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW,
    random: () => 0.5
  });
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const close = async () => {
    socket.destroy();
    await game.close();
  };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);
  return { game, request, close };
}

test('the gateway serves the same rule-driven battle over a temporary TCP port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-battle-a-tcp-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const databasePath = path.join(directory, 'game.sqlite');
  let session = await openGateway(databasePath, directory);
  promoteActionCoverageHeroes(session.game.store);
  try {
    assert.equal(missionId(session.game.store), '20205');
    let response = await session.request(201, 2, fightRequest(30201));
    assert.equal(response.err, undefined);
    const fight = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'));
    assert.equal(fight.report.type, 1);
    const report = fight.report.battle_list[0];
    const firstActions = assertLifestealFromReport(report);

    response = await session.request(207, 3, SETTLEMENT);
    assert.equal(response.err, undefined);
    const settled = codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64'));
    assert.equal(settled.stm.result, 1);
    assert.equal(missionId(session.game.store), '30201');
    assert.equal(stamina(session.game.store), '115');
    await session.close();

    // Reopen the same temporary SQLite file: the committed fight survives and
    // the seeded simulation still reproduces the identical action stream.
    session = await openGateway(databasePath, directory);
    assert.equal(missionId(session.game.store), '30201');
    assert.equal(stamina(session.game.store), '115');
    response = await session.request(201, 4, fightRequest(30201));
    assert.equal(response.err, undefined);
    const replay = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'))
      .report.battle_list[0];
    assert.deepEqual(decodeActions(replay), firstActions);
  } finally {
    await session.close();
  }
});
