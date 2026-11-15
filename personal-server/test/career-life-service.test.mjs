import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import {
  createGameCodec,
  decodeEtf,
  encodeEtf,
  rawBinary,
  serializedBinary
} from '../protocol/game-codec.mjs';
import {
  CAREER_LIFE_EXPECTED_COUNTS,
  CAREER_LIFE_TABLE_SOURCE_SHA256,
  readCareerLifeTables
} from '../config/career-life-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createCareerLifeService, CAREER_LIFE_MODULE_ID } from '../game/career-life-service.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createLocalGame } from '../local-game.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createSeed } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readCareerLifeTables();
const missionTables = readMissionTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-career-life-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Career Life Test' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  let service = createCareerLifeService({ store, codec, tables, missionTables });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
      service = createCareerLifeService({ store, codec, tables, missionTables });
      return service;
    }
  };
}

function careerState(store) {
  const module = new Map(store.read().state.modules.value).get(CAREER_LIFE_MODULE_ID);
  if (!module) return {};
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_career_life', bytes) : {};
}

function storyBits(store) {
  return Buffer.from(careerState(store).story_bin ?? '', 'base64');
}

function binaryBytes(entry) {
  if (Buffer.isBuffer(entry)) return Buffer.from(entry);
  if (Buffer.isBuffer(entry?.value)) return Buffer.from(entry.value);
  if (Buffer.isBuffer(entry?.value?.data)) return Buffer.from(entry.value.data);
  throw new TypeError('Malformed login binary');
}

function setMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(8);
    assert.ok(module && Array.isArray(module.value));
    const current = codec.unpack('pb_mission', rawBinary(module.value[0]));
    module.value[0] = serializedBinary(codec.pack('pb_mission', { ...current, mission_id: String(missionId) }));
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
}

test('CareerLife rows are frozen and all chapter award columns are zero', () => {
  assert.deepEqual(tables.counts, CAREER_LIFE_EXPECTED_COUNTS);
  assert.equal(tables.source.sha256, CAREER_LIFE_TABLE_SOURCE_SHA256);
  assert.equal(tables.chapters.size, 18);
  assert.equal(tables.stories.size, 99);
  for (const chapter of tables.chapters.values()) {
    assert.equal(chapter.res, 0);
    assert.equal(chapter.res_count, 0);
    assert.ok(tables.storiesByChapter.get(chapter.tid).length > 0);
  }
  assert.equal(tables.stories.get(1).chapter, 1);
  assert.equal(tables.stories.get(1).open_mission, 10201);
  assert.equal(tables.stories.get(4).open_mission, 10205);
  assert.equal(tables.stories.get(7).open_mission, 20201);
});

test('85804 uses the authoritative mission cursor, persists the chapter bit and survives SQLite reopen', t => {
  const env = setup(t);
  setMission(env.store, 20205);
  const before = careerState(env.store);
  const result = env.service.execute(85804, 1);
  assert.equal(result.schema, 'pb_career_life_back');
  const response = codec.unpack('pb_career_life_back', result.data);
  assert.deepEqual(response.res.changes, []);
  assert.equal(Boolean(response.res.is_overflow), false);
  assert.equal(hasBit(Buffer.from(response.career_life_info.story_bin, 'base64'), 1), true);
  assert.equal(hasBit(storyBits(env.store), 1), true);
  assert.equal(careerState(env.store).boss_bin ?? '', before.boss_bin ?? '');

  const service = env.reopen();
  assert.equal(hasBit(storyBits(env.store), 1), true);
  assert.throws(
    () => service.execute(85804, 1),
    error => error.code === 5 && error.message.includes('R1-CAREERLIFE-CLAIMED')
  );
});

test('85804 rejects unknown, duplicate and not-yet-passed chapters before state changes', t => {
  const env = setup(t);
  setMission(env.store, 20205);
  env.service.execute(85804, 2);
  const before = structuredClone(env.store.state());
  for (const [chapter, pattern] of [
    [2, /R1-CAREERLIFE-CLAIMED/],
    [3, /R1-CAREERLIFE-GATE/],
    [19, /R1-CAREERLIFE-CHAPTER/],
    [0, /R1-CAREERLIFE-CHAPTER/]
  ]) {
    assert.throws(() => env.service.execute(85804, chapter), error => error.code === 5 && pattern.test(error.message));
    assert.deepEqual(env.store.state(), before);
  }
});

test('85804 rejects malformed login and mission state without canonicalizing it', t => {
  const env = setup(t);
  const before = structuredClone(env.store.state());
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(CAREER_LIFE_MODULE_ID, serializedBinary(Buffer.from([0xff])));
    model.state.modules.value = [...modules];
  });
  const malformed = structuredClone(env.store.state());
  assert.throws(() => env.service.execute(85804, 1), error => error.code === 5 && /malformed/.test(error.message));
  assert.deepEqual(env.store.state(), malformed);

  env.store.transaction(model => { model.state.modules.value = before.modules.value; });
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const missionModule = modules.get(8);
    assert.ok(missionModule && Array.isArray(missionModule.value));
    missionModule.value[0] = serializedBinary(Buffer.from([0xff]));
    modules.set(8, missionModule);
    model.state.modules.value = [...modules];
  });
  const missingMission = structuredClone(env.store.state());
  assert.throws(() => env.service.execute(85804, 1), error => error.code === 5 && /mission module is malformed/.test(error.message));
  assert.deepEqual(env.store.state(), missingMission);
});

test('85804 request decoding accepts the client ETF wrapper and rejects invalid shapes', async t => {
  const env = setup(t);
  const decode = data => env.service.decode(85804, data, { etf: decodeEtf });
  assert.equal(await decode(await encodeEtf([1])), 1);
  for (const value of [[], [1, 2], ['x'], [0]]) {
    await assert.rejects(decode(await encodeEtf(value)), error => error.code === 1);
  }
});

test('85804 rolls the story bit back if response encoding fails', t => {
  const env = setup(t);
  setMission(env.store, 20205);
  const before = structuredClone(env.store.state());
  const pack = codec.pack;
  codec.pack = (name, value) => {
    if (name === 'pb_career_life_back') throw new Error('forced CareerLife encoder failure');
    return pack(name, value);
  };
  try {
    assert.throws(() => env.service.execute(85804, 1), /forced CareerLife encoder failure/);
  } finally {
    codec.pack = pack;
  }
  assert.deepEqual(env.store.state(), before);
});

test('85804 is routed over real temporary TCP, projected in login module 153 and survives reopen', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-career-life-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Career Life Gateway' });
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  // FunOpenTable.TID_CAREER_LIFE (1129) uses the recovered level-15 gate. The
  // captured fixture role is level 9, so move only the test role to the
  // required level before login command-gate evaluation.
  game.store.transaction(model => { model.role.level = 15; });
  let socket;
  let gameClosed = false;
  const closeGame = async () => {
    if (gameClosed) return;
    gameClosed = true;
    await game.close();
  };
  t.after(async () => {
    socket?.destroy();
    await closeGame();
    fs.rmSync(directory, { recursive: true, force: true });
  });

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
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
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
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginFlow = await decodeEtf(Buffer.from(login.data, 'base64'));
  const moduleEntries = loginFlow[2].value;
  const loginModule = moduleEntries.find(([id]) => Number(id) === CAREER_LIFE_MODULE_ID)?.[1];
  assert.ok(loginModule, 'CareerLife login module is present');
  const loginState = codec.unpack('pb_career_life', binaryBytes(loginModule));
  assert.equal(hasBit(Buffer.from(loginState.story_bin ?? '', 'base64'), 1), false);

  const claimed = await request(85804, 2, await encodeEtf([1]));
  assert.equal(claimed.err, undefined);
  const claimedBody = codec.unpack('pb_career_life_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(hasBit(Buffer.from(claimedBody.career_life_info.story_bin, 'base64'), 1), true);
  assert.deepEqual(claimedBody.res.changes, []);
  const duplicate = await request(85804, 3, await encodeEtf([1]));
  assert.equal(duplicate.err?.err, 5);

  const socketClosed = once(socket, 'close');
  socket.destroy();
  await socketClosed;
  socket = undefined;
  await closeGame();
  const reopened = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  try {
    assert.equal(hasBit(storyBits(reopened), 1), true);
  } finally {
    reopened.close();
  }
});
