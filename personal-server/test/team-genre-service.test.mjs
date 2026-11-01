import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { binary, createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createTeamGenreService, calculateTeamGenreProgress } from '../game/team-genre-service.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables(), tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = Date.parse('2026-10-24T05:00:00Z') / 1000;
const NOW = Date.parse('2026-11-01T12:00:00Z');
const CURRENT_TEAM = 5402;
const CURRENT_TYPE = 54;
const TEAM_HEROES = heroTables.TeamGenre.get(CURRENT_TEAM).suggest_hero.map(Number);

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30, nick_name: Buffer.from('Team Genre Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setTeamHeroes(env, count) {
  env.store.transaction(model => {
    const selected = new Set(TEAM_HEROES);
    model.heroInfo.hero_list = model.heroInfo.hero_list.filter(hero => !selected.has(Number(hero.tid)));
    for (let index = 0; index < count; index++) {
      const tid = TEAM_HEROES[index];
      model.heroInfo.hero_list.push({
        tid: String(tid), uid: String(BigInt(tid) + 100000000n), level: 1, star: 0,
        star_progress: 0, breakthrough_level: 0, quality: heroTables.Hero.get(tid)?.quality ?? 0
      });
    }
  });
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-team-genre-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec, serverOpenedAt: SERVER_OPENED_AT });
  const make = () => createTeamGenreService({ store, codec, tables, heroTables, calendar: { serverOpenedAt: SERVER_OPENED_AT }, now: () => NOW });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec, serverOpenedAt: SERVER_OPENED_AT });
    }
  };
}

function roleFromState(state) {
  const module = new Map(state.modules.value).get(10);
  return codec.unpack('pb_team_genre_role', rawBinary(module.value[8]));
}

test('login initializes all open main genres and selects the newest unlocked cycle', t => {
  const env = setup(t);
  setTeamHeroes(env, 3);
  assert.deepEqual(env.make().ensureLoginState(), { genreCount: 9, claimedCount: 0 });
  const role = roleFromState(env.store.state());
  const current = role.genre_list.find(row => row.team_id === CURRENT_TEAM);
  assert.equal(current.cycle_id, CURRENT_TEAM);
  assert.ok(Buffer.from(current.receive_award, 'base64').every(value => value === 0));
  assert.equal(role.genre_list.length, 9);
});

test('collection progress counts owned configured heroes', () => {
  const team = heroTables.TeamGenre.get(CURRENT_TEAM);
  assert.equal(calculateTeamGenreProgress(team, new Set(TEAM_HEROES.slice(0, 3))), 3);
  assert.equal(calculateTeamGenreProgress(team, new Set()), 0);
});

test('quick claim grants every reached tier once and persists its bitmap', t => {
  const env = setup(t);
  setTeamHeroes(env, 3);
  env.make().ensureLoginState();
  const before = BigInt(env.store.read().resources.get('101500')?.num ?? 0);

  const claimed = env.make().quickClaim(CURRENT_TYPE);
  assert.deepEqual(claimed.value.awardIds, [1, 2, 3]);
  assert.deepEqual(claimed.value.changes.map(change => [change.tid, change.diff_num]), [['101500', '60']]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 60n);
  let role = roleFromState(env.store.state());
  let bits = Buffer.from(role.genre_list.find(row => row.team_id === CURRENT_TEAM).receive_award, 'base64');
  assert.equal(hasBit(bits, 1), true);
  assert.equal(hasBit(bits, 2), true);
  assert.equal(hasBit(bits, 3), true);
  assert.equal(hasBit(bits, 4), false);
  assert.throws(() => env.make().quickClaim(CURRENT_TYPE), /already claimed/);

  env.reopen();
  env.make().ensureLoginState();
  role = roleFromState(env.store.state());
  bits = Buffer.from(role.genre_list.find(row => row.team_id === CURRENT_TEAM).receive_award, 'base64');
  assert.equal(hasBit(bits, 3), true);
  env.store.inspect(db => assert.equal(
    db.prepare('SELECT count(*) n FROM reward_claims WHERE claim_type=?').get('team_genre').n, 3
  ));
});

test('manual award accepts the protobuf body and rejects duplicates', t => {
  const env = setup(t);
  setTeamHeroes(env, 4);
  env.make().ensureLoginState();
  const request = codec.pack('pb_team_genre_award_req', { team_id: CURRENT_TEAM, award_id: 4 });
  const result = env.make().manualClaim(request);
  assert.deepEqual(result.value.changes.map(change => [change.tid, change.diff_num]), [['101500', '20']]);
  assert.throws(() => env.make().manualClaim(request), /already claimed/);
});

test('the real gateway accepts 91402 and returns pb_team_genre_award_rsp', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-team-genre-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const game = createLocalGame({
    databasePath, statePath, capturePath, serverOpenedAt: SERVER_OPENED_AT,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  setTeamHeroes({ store: game.store }, 3);

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
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
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags, Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  const loginModules = new Map(loginPayload[2].value);
  const loginRole = codec.unpack('pb_team_genre_role', Buffer.from(loginModules.get(10).value[8].value));
  assert.equal(loginRole.genre_list.find(row => row.team_id === CURRENT_TEAM).cycle_id, CURRENT_TEAM);

  const awarded = await request(91402, 2, await encodeEtf(CURRENT_TYPE));
  assert.equal(awarded.err, undefined);
  const result = codec.unpack('pb_team_genre_award_rsp', Buffer.from(awarded.data, 'base64'));
  assert.equal(result.team.team_id, CURRENT_TEAM);
  assert.equal(result.team.cycle_id, CURRENT_TEAM);
  assert.deepEqual(result.award.changes.map(change => [change.tid, change.diff_num]), [['101500', '60']]);
  const repeated = await request(91402, 3, await encodeEtf(CURRENT_TYPE));
  assert.equal(repeated.err.err, 310);

  setTeamHeroes({ store: game.store }, 6);
  const manual = await request(91401, 4, await encodeEtf(binary(codec.pack('pb_team_genre_award_req', {
    team_id: CURRENT_TEAM, award_id: 6
  }))));
  assert.equal(manual.err, undefined);
  const manualResult = codec.unpack('pb_res_to_client', Buffer.from(manual.data, 'base64'));
  assert.deepEqual(manualResult.changes.map(change => [change.tid, change.diff_num]), [['101500', '20']]);

  const info = await request(91403, 5);
  assert.equal(info.err, undefined);
  const infoRole = codec.unpack('pb_team_genre_role', Buffer.from(info.data, 'base64'));
  const team = infoRole.genre_list.find(row => row.team_id === CURRENT_TEAM);
  const bits = Buffer.from(team.receive_award, 'base64');
  for (const bit of [1, 2, 3, 6]) assert.equal(hasBit(bits, bit), true);
});
