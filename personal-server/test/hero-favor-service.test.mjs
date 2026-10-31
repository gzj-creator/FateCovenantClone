import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHeroFavorService } from '../game/hero-favor-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;
const GIFT_TID = 33002;
const PLAY_COST_TID = 597002;
const AWARD_TID = 101500;
const ownedHeroes = [2010101, 2010201, 1020601, 2020601, 4030801];

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hero Favor Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-favor-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let now = GAME_AT;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    databasePath,
    legacyStatePath,
    get store() { return store; },
    get now() { return now; },
    setNow(value) { now = value; },
    service(useCodec = codec) {
      return createHeroFavorService({ store, codec: useCodec, heroTables, tables, now: () => now });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function storedFavour(env) {
  return codec.unpack('pb_role_hero_favour', rawBinary(new Map(env.store.state().modules.value).get(10).value[4]));
}

function setFavourState(env, rows, { at = env.now, playTimes = 0 } = {}) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    while (module.value.length <= 4) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[4] = serializedBinary(codec.pack('pb_role_hero_favour', {
      favours: rows,
      all_favour: rows.reduce((sum, row) => sum + Number(row.favour ?? 0), 0),
      last_refresh_time: at,
      play_times: playTimes,
      favour_level: 1
    }));
    model.state.modules.value = [...modules];
  });
}

function grant(store, awards) {
  store.transaction(model => grantResources(model, awards, tables));
}

function row(tid, favour = 300, dayPlayTimes = 0) {
  return {
    hero_tid: tid,
    favour,
    all_play_times: 0,
    all_gift_times: 0,
    got_level_award: '',
    day_play_times: dayPlayTimes,
    break_level: 0
  };
}

const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('initializes module 10 slot 4, normalizes totals and survives SQLite reopen', t => {
  const env = setup(t);
  assert.deepEqual(env.service().ensureLoginState(), {
    heroCount: 0,
    allFavour: 0,
    playTimes: 0,
    level: 1
  });
  assert.deepEqual(storedFavour(env), {
    favours: [],
    last_refresh_time: GAME_AT,
    favour_level: 1
  });
  env.reopen();
  assert.deepEqual(env.service().ensureLoginState(), {
    heroCount: 0,
    allFavour: 0,
    playTimes: 0,
    level: 1
  });
  assert.equal(storedFavour(env).last_refresh_time, GAME_AT);
});

test('gifts consume inventory, aggregate favor and persist the client response shape', t => {
  const env = setup(t), service = env.service();
  grant(env.store, [[GIFT_TID, 8]]);
  const result = service.execute(646, {
    hero_tid: 2020601,
    gifts: [{ tid: GIFT_TID, num: 3 }, { tid: GIFT_TID, num: 3 }]
  });
  const response = codec.unpack('pb_hero_favour_gift_rsp', result.data);
  assert.equal(response.favour.hero_tid, 2020601);
  assert.equal(response.favour.favour, 300);
  assert.equal(response.favour.all_gift_times, 6);
  assert.equal(response.favour.all_play_times ?? 0, 0);
  assert.equal(response.all_favour, 300);
  assert.equal(response.favour_level, 6);
  assert.deepEqual(response.res_change.changes, [{
    tid: String(GIFT_TID),
    new_num: '2',
    diff_num: '-6'
  }]);
  assert.equal(env.store.read().resources.get(String(GIFT_TID)).num, '2');
  env.reopen();
  const persisted = env.service().ensureLoginState();
  assert.deepEqual(persisted, { heroCount: 1, allFavour: 300, playTimes: 0, level: 6 });
  assert.deepEqual(storedFavour(env).favours, [response.favour]);
});

test('play enforces unlock, resource cost, per-hero and role-wide daily limits', t => {
  const env = setup(t), service = env.service();
  setFavourState(env, ownedHeroes.map(tid => row(tid)));
  grant(env.store, [[PLAY_COST_TID, 5]]);

  let reply = codec.unpack('pb_hero_favour_play_rsp', service.execute(649, [ownedHeroes[0], true]).data);
  assert.equal(reply.favour.day_play_times, 1);
  assert.equal(reply.favour.all_play_times, 1);
  assert.deepEqual(reply.res_change.changes.map(change => [change.tid, change.diff_num]), [[String(PLAY_COST_TID), '-1']]);
  rejected(() => service.execute(649, [ownedHeroes[0], true]), 308);

  for (const tid of ownedHeroes.slice(1, 4)) {
    reply = codec.unpack('pb_hero_favour_play_rsp', service.execute(649, [tid, true]).data);
    assert.equal(reply.favour.day_play_times, 1);
  }
  assert.equal(storedFavour(env).play_times, 4);
  rejected(() => service.execute(649, [ownedHeroes[4], true]), 308);
  assert.equal(env.store.read().resources.get(String(PLAY_COST_TID)).num, '1');

  setFavourState(env, [row(2020601, 299)], { playTimes: 0 });
  rejected(() => service.execute(649, [2020601, true]), 309);
  assert.equal(storedFavour(env).favours[0].day_play_times ?? 0, 0);
});

test('daily counters reset at 05:00 Asia/Shanghai and retain data before the boundary', t => {
  const env = setup(t), service = env.service();
  const before = Date.UTC(2026, 0, 1, 20, 59) / 1000;
  const boundary = Date.UTC(2026, 0, 1, 21, 0) / 1000;
  setFavourState(env, [row(2020601, 300, 1)], { at: before, playTimes: 4 });
  env.setNow(before + 30);
  assert.equal(service.ensureLoginState().playTimes, 4);
  assert.equal(storedFavour(env).favours[0].day_play_times, 1);

  env.setNow(boundary);
  assert.deepEqual(service.ensureLoginState(), { heroCount: 1, allFavour: 300, playTimes: 0, level: 6 });
  assert.equal(storedFavour(env).favours[0].day_play_times ?? 0, 0);
  assert.equal(storedFavour(env).last_refresh_time, boundary);
});

test('level awards are atomic, bitmap-backed and reject repeats or locked rows', t => {
  const env = setup(t), service = env.service();
  setFavourState(env, [row(2020601, 300)]);
  let response = codec.unpack(
    'pb_hero_favour_level_award_rsp',
    service.execute(653, { hero_tid: 2020601, tid_list: [2, 3] }).data
  );
  assert.deepEqual(Buffer.from(response.got_level_award, 'base64'), Buffer.from([0x30, 0]));
  assert.deepEqual(response.res_change.changes.map(change => [change.tid, change.diff_num]), [[String(AWARD_TID), '20']]);
  assert.equal(env.store.read().resources.get(String(AWARD_TID)).num, '20');

  const before = env.store.state();
  rejected(() => service.execute(653, { hero_tid: 2020601, tid_list: [2] }), 310);
  rejected(() => service.execute(653, { hero_tid: 2020601, tid_list: [4] }), 311);
  rejected(() => service.execute(653, { hero_tid: 2020601, tid_list: [99] }), 5);
  rejected(() => service.execute(653, { hero_tid: 2020601, tid_list: [4, 4] }), 1);
  assert.deepEqual(env.store.state(), before);

  setFavourState(env, [row(2020601, 750)]);
  env.reopen();
  response = codec.unpack(
    'pb_hero_favour_level_award_rsp',
    env.service().execute(653, { hero_tid: 2020601, tid_list: [4] }).data
  );
  assert.deepEqual(Buffer.from(response.got_level_award, 'base64'), Buffer.from([0x08, 0]));
});

test('rejects unknown heroes and gifts, missing inventory and gifts above the break cap', t => {
  const env = setup(t), service = env.service();
  env.store.transaction(model => {
    model.heroInfo.hero_list.find(hero => Number(hero.tid) === 2020601).breakthrough_level = 0;
  });
  const before = env.store.state();
  rejected(() => service.execute(646, { hero_tid: 999999999, gifts: [{ tid: GIFT_TID, num: 1 }] }), 5);
  rejected(() => service.execute(646, { hero_tid: 2020601, gifts: [{ tid: 999999, num: 1 }] }), 1);
  rejected(() => service.execute(646, { hero_tid: 2020601, gifts: [{ tid: GIFT_TID, num: 1 }] }), 301);
  assert.deepEqual(env.store.state(), before);

  grant(env.store, [[GIFT_TID, 40]]);
  const funded = env.store.state();
  rejected(() => service.execute(646, { hero_tid: 2020601, gifts: [{ tid: GIFT_TID, num: 40 }] }), 309);
  assert.deepEqual(env.store.state(), funded);
});

test('state and response encoding run inside the transaction and roll back on failure', t => {
  const env = setup(t);
  grant(env.store, [[GIFT_TID, 6]]);
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_role_hero_favour') throw new Error('Injected hero favour encoding failure');
      return codec.pack(name, value);
    }
  };
  assert.throws(
    () => env.service(brokenCodec).execute(646, { hero_tid: 2020601, gifts: [{ tid: GIFT_TID, num: 6 }] }),
    /Injected hero favour encoding failure/
  );
  assert.deepEqual(env.store.state(), before);
});

test('login payload carries normalized module 10 slot 4 data', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-favor-login-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_AT * 1000
  });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const login = await decodeEtf(await game.loginPayload());
  const modules = new Map(login[2].value);
  const favour = codec.unpack('pb_role_hero_favour', Buffer.from(modules.get(10).value[4].value));
  assert.deepEqual(favour, {
    favours: [],
    last_refresh_time: GAME_AT,
    favour_level: 1
  });
});

async function gatewayFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-favor-gateway-'));
  const logs = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_AT * 1000,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    logger: event => logs.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
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
  const loginResponse = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(loginResponse.data, 'base64')))[0], 1);
  grant(game.store, [[GIFT_TID, 6], [PLAY_COST_TID, 1]]);
  return { game, request, logs };
}

test('gateway serves gift, play and level-award commands over real TCP framing', async t => {
  const env = await gatewayFixture(t);
  let response = await env.request(646, 10, codec.pack('pb_hero_favour_gift_req', {
    hero_tid: 2020601,
    gifts: [{ tid: GIFT_TID, num: 6 }]
  }));
  assert.equal(response.seq, 10);
  assert.equal(response.err, undefined, JSON.stringify(env.logs.filter(event => event.event === 'hero_favour_rejected')));
  assert.equal(codec.unpack('pb_hero_favour_gift_rsp', Buffer.from(response.data, 'base64')).favour.favour, 300);

  response = await env.request(649, 11, await encodeEtf([2020601, true]));
  assert.equal(response.seq, 11);
  assert.equal(response.err, undefined, JSON.stringify(env.logs.filter(event => event.event === 'hero_favour_rejected')));
  assert.equal(codec.unpack('pb_hero_favour_play_rsp', Buffer.from(response.data, 'base64')).favour.day_play_times, 1);

  response = await env.request(653, 12, codec.pack('pb_hero_favour_level_award_req', {
    hero_tid: 2020601,
    tid_list: [2, 3]
  }));
  assert.equal(response.seq, 12);
  assert.equal(response.err, undefined);
  const awarded = codec.unpack('pb_hero_favour_level_award_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(Buffer.from(awarded.got_level_award, 'base64'), Buffer.from([0x30, 0]));
  assert.equal(awarded.res_change.changes.find(change => change.tid === String(AWARD_TID)).diff_num, '20');

  response = await env.request(649, 13, await encodeEtf([2020601, true]));
  assert.equal(response.seq, 13);
  assert.equal(response.err.err, 308);

  const login = await decodeEtf(await env.game.loginPayload());
  const stored = codec.unpack(
    'pb_role_hero_favour',
    Buffer.from(new Map(login[2].value).get(10).value[4].value)
  );
  assert.equal(stored.favours[0].favour, 300);
  assert.equal(stored.favours[0].day_play_times, 1);
  assert.deepEqual(Buffer.from(stored.favours[0].got_level_award, 'base64'), Buffer.from([0x30, 0]));
});
