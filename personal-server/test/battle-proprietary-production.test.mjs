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

// CORE-BATTLE-B production path: the 双重攻击 repeat has to survive the real
// 201 battle report and the 207 settlement, not only the engine tests. Hero
// 2010101 is the only shipped roster member that carries the described repeat.
const codec = createGameCodec();
const HERO_ROLE = 2010101;
const LINEUP = [
  { hero_id: '2010101', loc: 6 },
  { hero_id: '2010201', loc: 4 }
];
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

/** The 双重攻击 repeat must appear as its own action with its own damage. */
function assertRepeatAction(report) {
  const hero = report.fighter_list.find(candidate => candidate.team === 1
    && Number(candidate.role) === HERO_ROLE);
  assert.ok(hero, 'the task battle must include role 2010101');
  const actions = decodeActions(report);
  assert.equal(actions[0].proto, 107);
  const ownActions = actions.filter(action => action.proto === 101
    && Number(action.value.src_id) === Number(hero.id));
  assert.equal(ownActions[0].value.type, 1, 'the first action of this hero is its normal attack');
  assert.equal(ownActions[1].value.type, 1, 'the repeat keeps the action type');
  assert.notEqual(Number(ownActions[0].value.id), Number(ownActions[1].value.id),
    'the repeat is encoded as a distinct action');
  const indexOfFirst = actions.indexOf(ownActions[0]);
  const indexOfRepeat = actions.indexOf(ownActions[1]);
  const between = actions.slice(indexOfFirst + 1, indexOfRepeat).filter(entry => entry.proto === 101);
  assert.equal(between.length, 0, 'no other action starts between the attack and its repeat');
  for (const action of [ownActions[0], ownActions[1]]) {
    const harms = actions.filter(entry => entry.proto === 106
      && Number(entry.value.id) === Number(action.value.id));
    assert.ok(harms.length >= 1, 'each action carries its own damage');
  }
  return actions;
}

const STAMINA_TID = '100012900';
const stamina = store => store.read().resources.get(STAMINA_TID).num;
const missionId = store => codec.unpack('pb_mission',
  rawBinary(new Map(store.state().modules.value).get(8).value[0])).mission_id;

function setupService(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-battle-b-', now: () => 1700000000 * 1000 });
  promoteRepeatHero(fixture.store);
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

function promoteRepeatHero(store) {
  store.transaction(model => {
    const lineupHeroes = new Set(LINEUP.map(entry => Number(entry.hero_id)));
    for (const hero of model.heroInfo.hero_list) {
      if (lineupHeroes.has(Number(hero.tid))) hero.star = 10;
    }
  });
}

test('the served battle report carries the 双重攻击 repeat action', t => {
  const env = setupService(t);
  assert.equal(missionId(env.store), '20205');
  const started = env.service.execute(201, fightRequest(30201));
  const report = codec.unpack('pb_fight_response', Buffer.from(started.data, 'base64')).report.battle_list[0];
  assertRepeatAction(report);
  // 201 previews only: nothing may be written before 207.
  assert.equal(missionId(env.store), '20205');

  env.service.execute(207, SETTLEMENT);
  assert.equal(missionId(env.store), '30201');
  env.reopen();
  assert.equal(missionId(env.store), '30201');
});

test('a rejected settlement rolls the repeat battle back and stays retryable', t => {
  const env = setupService(t);
  env.service.execute(201, fightRequest(30201));
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER fc_fail_battle_b BEFORE INSERT ON reward_claims BEGIN SELECT RAISE(ABORT, 'battle-b rollback'); END"
  ));
  assert.throws(() => env.service.execute(207, SETTLEMENT), /battle-b rollback/);
  assert.equal(missionId(env.store), '20205');
  assert.equal(stamina(env.store), '120');

  env.store.inspect(db => db.exec('DROP TRIGGER fc_fail_battle_b'));
  env.service.execute(207, SETTLEMENT);
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

test('the gateway serves the repeat action over a temporary TCP port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-battle-b-tcp-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const databasePath = path.join(directory, 'game.sqlite');
  let session = await openGateway(databasePath, directory);
  promoteRepeatHero(session.game.store);
  try {
    let response = await session.request(201, 2, fightRequest(30201));
    assert.equal(response.err, undefined);
    const fight = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'));
    const firstActions = assertRepeatAction(fight.report.battle_list[0]);

    response = await session.request(207, 3, SETTLEMENT);
    assert.equal(response.err, undefined);
    const settled = codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64'));
    assert.equal(settled.stm.result, 1);
    assert.equal(missionId(session.game.store), '30201');
    assert.equal(stamina(session.game.store), '115');
    await session.close();

    session = await openGateway(databasePath, directory);
    assert.equal(missionId(session.game.store), '30201');
    response = await session.request(201, 4, fightRequest(30201));
    assert.equal(response.err, undefined);
    const replay = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'))
      .report.battle_list[0];
    assert.deepEqual(decodeActions(replay), firstActions);
  } finally {
    await session.close();
  }
});
