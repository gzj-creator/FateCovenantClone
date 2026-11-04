import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createTeamSuggestService, calculateTeamSuggestProgress } from '../game/team-suggest-service.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables(), tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const TEAM_TID = 100;
const TEAM_HEROES = heroTables.TeamSuggest.get(TEAM_TID).suggest_hero.map(row => Number(row[0]));

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30, nick_name: Buffer.from('Team Suggest Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-team-suggest-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  const make = () => createTeamSuggestService({ store, codec, tables, heroTables, now: () => Date.parse('2026-10-31T12:00:00Z') });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec });
    }
  };
}

function teamSuggestFromState(state) {
  const module = new Map(state.modules.value).get(10);
  return codec.unpack('pb_hero_team_suggest', rawBinary(module.value[7]));
}

function setTeamStars(env, star) {
  env.store.transaction(model => {
    for (const tid of TEAM_HEROES) {
      const existing = model.heroInfo.hero_list.find(hero => Number(hero.tid) === tid);
      if (existing) existing.star = star;
      else model.heroInfo.hero_list.push({
        tid: String(tid), uid: String(BigInt(tid) + 100000000n), level: 1, star,
        star_progress: 0, breakthrough_level: 0, quality: heroTables.Hero.get(tid)?.quality ?? 0
      });
    }
  });
}

test('login fills all twelve team suggestions and preserves selection and stages', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    module.value[7] = serializedBinary(codec.pack('pb_hero_team_suggest', {
      select: 2,
      stages: [{ camp: 1, stage: 3 }]
    }));
    model.state.modules.value = [...modules];
  });

  assert.deepEqual(env.make().ensureLoginState(), { collectCount: 12, claimedCount: 0, awardBlocks: 3 });
  const value = teamSuggestFromState(env.store.state());
  assert.equal(value.select, 2);
  assert.deepEqual(value.stages, [{ camp: 1, stage: 3 }]);
  assert.equal(value.collects.length, 12);
  assert.deepEqual(value.collects.map(row => row.type), [...heroTables.TeamSuggest.keys()].sort((a, b) => a - b));
  assert.equal(value.collect_award.length, 3);
  assert.ok(value.collect_award.every(bits => Buffer.from(bits, 'base64').length >= 2));

  const row = value.collects.find(entry => entry.type === TEAM_TID);
  const stars = new Map(env.store.read().heroInfo.hero_list.map(hero => [Number(hero.tid), Number(hero.star ?? 0)]));
  assert.deepEqual(row.progress, TEAM_HEROES.map(tid => Math.min(stars.get(tid) ?? 0, 3) + 1));
});

test('collection progress follows the client formula and caps each hero at its target star', () => {
  const stars = new Map(TEAM_HEROES.map(tid => [tid, 10]));
  assert.deepEqual(calculateTeamSuggestProgress(heroTables.TeamSuggest.get(TEAM_TID), stars), {
    current: 24, maximum: 24, percent: 100
  });
  assert.deepEqual(calculateTeamSuggestProgress(heroTables.TeamSuggest.get(TEAM_TID), new Map()), {
    current: 6, maximum: 24, percent: 25
  });
});

test('claiming 10 and 20 percent rewards grants configured items, advances the bit block and persists', t => {
  const env = setup(t);
  setTeamStars(env, 3);
  env.make().ensureLoginState();

  const first = env.make().claim([101, TEAM_TID]);
  assert.equal(first.value.percent, 100);
  assert.deepEqual(first.value.changes.map(change => [change.tid, change.diff_num]), [['31002', '2']]);
  const second = env.make().claim([102, TEAM_TID]);
  assert.deepEqual(second.value.changes.map(change => [change.tid, change.diff_num]), [['31002', '3']]);

  let value = teamSuggestFromState(env.store.state());
  const firstType = Buffer.from(value.collect_award[0], 'base64');
  assert.equal(hasBit(firstType, 1), true);
  assert.equal(hasBit(firstType, 2), true);
  assert.equal(hasBit(firstType, 3), false);
  assert.deepEqual(value.collect_award.slice(1), ['AAA=', 'AAA=']);
  assert.equal(env.store.read().resources.get('31002')?.num, '5');
  env.store.inspect(db => assert.equal(
    db.prepare('SELECT count(*) n FROM reward_claims WHERE claim_type=?').get('team_suggest').n, 2
  ));

  env.reopen();
  env.make().ensureLoginState();
  value = teamSuggestFromState(env.store.state());
  assert.equal(hasBit(Buffer.from(value.collect_award[0], 'base64'), 2), true);
  assert.equal(env.store.read().resources.get('31002')?.num, '5');
});

test('claims stay ordered, reject duplicates and require the displayed collection percentage', t => {
  const env = setup(t);
  env.make().ensureLoginState();
  env.make().claim([101, TEAM_TID]);
  env.make().claim([102, TEAM_TID]);
  assert.throws(() => env.make().claim([104, TEAM_TID]), /claimed in order/);
  assert.throws(() => env.make().claim([103, TEAM_TID]), /progress is insufficient/);
  assert.throws(() => env.make().claim([101, TEAM_TID]), /already claimed/);
});

test('the real gateway accepts 88801 and returns pb_res_to_client changes', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-team-suggest-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const game = createLocalGame({
    databasePath, statePath, capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const env = {
    get store() { return game.store; }
  };
  setTeamStars(env, 3);

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
  assert.equal(loginPayload[0], 1);
  const loginModules = new Map(loginPayload[2].value);
  const loginSuggest = codec.unpack('pb_hero_team_suggest', Buffer.from(loginModules.get(10).value[7].value));
  assert.equal(loginSuggest.collects.length, 12);

  const awarded = await request(88801, 2, await encodeEtf([101, TEAM_TID]));
  assert.equal(awarded.err, undefined);
  const result = codec.unpack('pb_res_to_client', Buffer.from(awarded.data, 'base64'));
  assert.deepEqual(result.changes.map(change => [change.tid, change.diff_num]), [['31002', '2']]);
  const repeated = await request(88801, 3, await encodeEtf([101, TEAM_TID]));
  assert.equal(repeated.err.err, 310);
});
