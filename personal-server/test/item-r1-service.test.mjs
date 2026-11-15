import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import test from 'node:test';
import {
  createGameCodec,
  decodeEtf,
  encodeEtf,
  rawBinary,
  serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  LINEAR_LEVEL_EXPECTED_COUNTS,
  LINEAR_LEVEL_SOURCE_SHA256,
  readLinearLevelTables
} from '../config/linear-level-tables.mjs';
import {
  createLinearLevelService,
  LINEAR_LEVEL_MODULE_ID
} from '../game/linear-level-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const linearTables = readLinearLevelTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-item-r1-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Item R1 Test' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const linearLevel = createLinearLevelService({ store, codec, gameTables, tables: linearTables });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    linearLevel,
    get store() { return store; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
      return createLinearLevelService({ store, codec, gameTables, tables: linearTables });
    }
  };
}

function writeLinearState(store, levels) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(LINEAR_LEVEL_MODULE_ID, serializedBinary(codec.pack('pb_linear_level_role', { linear_levels: levels })));
    model.state.modules.value = [...modules];
  });
}

function readLinearState(store) {
  const module = new Map(store.read().state.modules.value).get(LINEAR_LEVEL_MODULE_ID);
  if (!module) return { linear_levels: [] };
  const bytes = rawBinary(module);
  return bytes.length ? codec.unpack('pb_linear_level_role', bytes) : { linear_levels: [] };
}

function itemAmount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function addRewardStock(store, awards) {
  store.transaction(model => { grantResources(model, awards, gameTables, { codec }); });
}

test('LinearLevel table families, source fingerprint and client indexes are frozen', () => {
  assert.deepEqual(linearTables.counts, LINEAR_LEVEL_EXPECTED_COUNTS);
  assert.deepEqual(linearTables.counts, { Box: 80, Fight: 1600, Type: 4 });
  assert.equal(linearTables.source.sha256, LINEAR_LEVEL_SOURCE_SHA256);
  assert.deepEqual([...linearTables.boxesByType.keys()], [1, 2, 3, 4]);
  for (const type of [1, 2, 3, 4]) {
    assert.deepEqual([...linearTables.boxesByType.get(type).keys()].slice(0, 4), [10, 25, 50, 75]);
    assert.equal(linearTables.boxFor(type, 10).tid, type * 100000 + 10);
    assert.equal(linearTables.boxFor(type, 400).pass_fight, type * 100000 + 400);
  }
});

test('93501 grants only configured reached boxes once and persists the original bitmap', t => {
  const env = setup(t);
  writeLinearState(env.store, [{ type: 4, level: 400050, box_award: '' }]);
  const before101500 = itemAmount(env.store, 101500);
  const before652 = itemAmount(env.store, 651002);
  const result = env.linearLevel.execute(93501, { type: 4, indexes: [10, 25, 50] });
  assert.equal(result.schema, 'pb_linear_level_box_award_rsp');
  assert.equal(result.value.linear_level.type, 4);
  assert.equal(result.value.linear_level.level, 400050);
  assert.equal(itemAmount(env.store, 101500), before101500 + 1500);
  assert.equal(itemAmount(env.store, 651002), before652 + 2);
  const expectedBits = Buffer.from('ACAAQAAAIAA=', 'base64');
  assert.equal(readLinearState(env.store).linear_levels[0].box_award, expectedBits.toString('base64'));

  const reopen = env.reopen();
  assert.throws(() => reopen.execute(93501, { type: 4, indexes: [25] }), error => error.code === 5 && /already claimed/.test(error.message));
  assert.equal(itemAmount(env.store, 651002), before652 + 2);
});

test('93501 validates type, indexes, gate and duplicates before changing resources or state', t => {
  const env = setup(t);
  writeLinearState(env.store, [{ type: 4, level: 400009, box_award: '' }]);
  const before = env.store.read().resources.get('101500')?.num ?? '0';
  for (const [input, pattern] of [
    [{ type: 9, indexes: [10] }, /not configured/],
    [{ type: 4, indexes: [11] }, /box 11 is not configured/],
    [{ type: 4, indexes: [] }, /at least one/],
    [{ type: 4, indexes: [10, 10] }, /repeated/],
    [{ type: 4, indexes: [10] }, /requires fight 400010/]
  ]) {
    assert.throws(() => env.linearLevel.execute(93501, input), error => error.code === 5 || (error.code === 1 && /at least one|repeated/.test(error.message)));
    assert.equal(env.store.read().resources.get('101500')?.num ?? '0', before);
    assert.deepEqual(readLinearState(env.store).linear_levels, [{ type: 4, level: 400009 }]);
  }
});

test('93501 rolls back resources and bitmap when response encoding fails', t => {
  const env = setup(t);
  writeLinearState(env.store, [{ type: 1, level: 100010, box_award: '' }]);
  const before = env.store.read().resources.get('101500')?.num ?? '0';
  const pack = codec.pack;
  codec.pack = (name, value) => {
    if (name === 'pb_linear_level_box_award_rsp') throw new Error('forced encoder failure');
    return pack(name, value);
  };
  try {
    assert.throws(() => env.linearLevel.execute(93501, { type: 1, indexes: [10] }), /forced encoder failure/);
  } finally {
    codec.pack = pack;
  }
  assert.equal(env.store.read().resources.get('101500')?.num ?? '0', before);
  assert.equal(readLinearState(env.store).linear_levels[0].box_award, undefined);
});

test('93501 real temporary TCP returns the protobuf response and survives SQLite reopen', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-linear-level-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Linear Level Gateway' });
  const store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  writeLinearState(store, [{ type: 2, level: 200025, box_award: '' }]);
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('linear-gateway', roleId, 'linear-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'linear-session' && uid === 'linear-gateway'
      ? { userId: uid, loginCode: uid } : null
  });
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
    server_id: 1, channel_uid: 'linear-gateway', verify_code: 'linear-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const response = await request(93501, 2, codec.pack('pb_linear_level_box_award_req', { type: 2, indexes: [10, 25] }));
  assert.equal(response.err, undefined);
  const decoded = codec.unpack('pb_linear_level_box_award_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(decoded.linear_level.type, 2);
  assert.equal(decoded.linear_level.level, 200025);
  const responseBits = Buffer.from(decoded.linear_level.box_award, 'base64');
  assert.equal(responseBits[1], 0x20);
  assert.equal(responseBits[3], 0x40);
  assert.equal(itemAmount(game.store, 653002), 1);
  const socketClosed = once(socket, 'close');
  socket.destroy();
  await socketClosed;
  socket = undefined;
  await closeGame();
  const reopened = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  try { assert.equal(readLinearState(reopened).linear_levels[0].box_award, 'ACAAQA=='); }
  finally { reopened.close(); }
});
