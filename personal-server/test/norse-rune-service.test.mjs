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
import { readNorseRuneTables } from '../config/norse-rune-tables.mjs';
import { createNorseRuneService } from '../game/norse-rune-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readNorseRuneTables();
const gameTables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const MODULE = 156;

function setup(t, randomValues = [0, 0]) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-norse-rune-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  fs.writeFileSync(legacyStatePath, JSON.stringify({
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  }));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let cursor = 0;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    service(customRandom = () => randomValues[cursor++ % randomValues.length]) {
      return createNorseRuneService({ store, codec, tables, random: customRandom });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); },
    addCurrency(amount = 1000) {
      store.transaction(model => grantResources(model, [[324002, amount]], gameTables));
    },
    setState(value) {
      store.transaction(model => {
        const current = new Map(model.state.modules.value);
        current.set(MODULE, serializedBinary(codec.pack('pb_norse_rune', value)));
        model.state.modules.value = [...current];
      });
    }
  };
}

const storedState = env => codec.unpack('pb_norse_rune', rawBinary(new Map(env.store.state().modules.value).get(MODULE)));
const moduleBytes = value => Buffer.from(value.value?.data ?? value.value);
const zeroTypes = () => [1, 2, 3, 4].map(type => ({ type }));
const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('configuration preserves the evidenced level costs, weight rows and five qualities', () => {
  assert.deepEqual([...tables.levels.values()].map(row => [row.needExp, row.cost, row.showWeight]), [
    [10000, 100, 6], [10000, 100, 12], [22500, 150, 18],
    [22500, 150, 24], [40000, 200, 30], [40000, 200, 36],
    [40000, 200, 36], [40000, 200, 36], [40000, 200, 36],
    [40000, 200, 36], [40000, 200, 36], [40000, 200, 36]
  ]);
  assert.equal(tables.qualityCount, 5);
  assert.deepEqual(tables.qualityWeights.get(6), [4400, 2800, 1600, 800, 400]);
  assert.deepEqual([...tables.tokens.values()].map(row => row.type), [
    1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4
  ]);
});

test('login initializes four zero-level rune types and is idempotent across reopen', t => {
  const env = setup(t), service = env.service();
  assert.deepEqual(service.ensureLoginState(), { level: 1, exp: 0, tokenCount: 0, typeCount: 4 });
  assert.deepEqual(storedState(env).type_list, zeroTypes());
  env.reopen();
  assert.deepEqual(env.service().ensureLoginState(), { level: 1, exp: 0, tokenCount: 0, typeCount: 4 });
});

test('draw spends the evidenced currency, grants inferred EXP and auto-fills an empty token slot', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.addCurrency(200);
  const result = service.draw();
  assert.deepEqual(result.value.add_token, { token: 1, level: 1, quality: 1 });
  assert.deepEqual(result.value.hit_token, { token: 1, level: 1, quality: 1 });
  assert.equal(result.value.draw_token, undefined);
  assert.equal(result.value.exp, 1000);
  assert.equal(result.value.res.changes[0].new_num, '100');
  assert.deepEqual(storedState(env).token_list, [{ token: 1, level: 1, quality: 1 }]);
  env.reopen();
  assert.equal(storedState(env).exp, 1000);
  assert.equal(env.store.read().resources.get('324002').num, '100');
});

test('level three uses its configured cost and quality-weight row', t => {
  const env = setup(t);
  env.addCurrency(200);
  env.setState({ token_list: [], type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 3, exp: 0 });
  const values = [0.8, 0.8];
  const result = env.service(() => values.shift()).draw();
  assert.deepEqual(result.value.hit_token, { token: 10, level: 3, quality: 3 });
  assert.equal(result.value.exp, 1500);
  assert.equal(result.value.res.changes[0].new_num, '50');
});

test('a duplicate token is pending until replace, then commits once and survives reopen', t => {
  const env = setup(t);
  env.addCurrency(200);
  env.setState({
    token_list: [{ token: 7, level: 1, quality: 1 }],
    type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })),
    level: 1,
    exp: 0
  });
  const service = env.service(() => 0.5);
  const result = service.draw();
  assert.equal(result.value.add_token, undefined);
  assert.deepEqual(result.value.draw_token, { token: 7, level: 1, quality: 2 });
  assert.deepEqual(storedState(env).draw_token, { token: 7, level: 1, quality: 2 });
  const replaced = service.replace();
  assert.deepEqual(replaced.value, { token: 7, level: 1, quality: 2 });
  assert.equal(storedState(env).draw_token, undefined);
  assert.deepEqual(storedState(env).token_list.find(token => token.token === 7), { token: 7, level: 1, quality: 2 });
  const before = env.store.state();
  rejected(() => service.replace(), 5);
  assert.deepEqual(env.store.state(), before);
  env.reopen();
  assert.deepEqual(storedState(env).token_list.find(token => token.token === 7), { token: 7, level: 1, quality: 2 });
});

test('a pending token rejects another draw without charging resources or changing module 156', t => {
  const env = setup(t);
  env.addCurrency(200);
  env.setState({
    token_list: [{ token: 7, level: 1, quality: 1 }],
    type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })),
    level: 1,
    exp: 0
  });
  const first = env.service(() => 0.5).draw();
  const pending = { token: 7, level: 1, quality: 2 };
  assert.deepEqual(first.value.draw_token, pending);

  const modules = new Map(env.store.state().modules.value);
  const beforeState = env.store.state();
  const beforeResource = env.store.read().resources.get('324002').num;
  const beforeModule = Buffer.from(rawBinary(modules.get(MODULE)));
  let randomCalls = 0;
  rejected(() => env.service(() => { randomCalls++; return 0; }).draw(), 5);
  assert.equal(randomCalls, 0);
  assert.deepEqual(env.store.state(), beforeState);
  assert.equal(env.store.read().resources.get('324002').num, beforeResource);
  assert.deepEqual(Buffer.from(rawBinary(new Map(env.store.state().modules.value).get(MODULE))), beforeModule);
  assert.deepEqual(storedState(env).draw_token, pending);
  assert.equal(storedState(env).exp, 1000);

  env.reopen();
  assert.deepEqual(storedState(env).draw_token, pending);
  const service = env.service();
  assert.deepEqual(service.replace().value, pending);
  assert.equal(storedState(env).draw_token, undefined);
  assert.deepEqual(storedState(env).token_list.find(token => token.token === 7), pending);
  const afterReplace = env.store.state();
  rejected(() => service.replace(), 5);
  assert.deepEqual(env.store.state(), afterReplace);
});

test('draw rejects insufficient currency and a full wish EXP bar without mutation', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  let before = env.store.state();
  rejected(() => service.draw(), 301);
  assert.deepEqual(env.store.state(), before);
  env.setState({ token_list: [], type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 1, exp: 10000 });
  env.addCurrency(100);
  before = env.store.state();
  rejected(() => service.draw(), 5);
  assert.deepEqual(env.store.state(), before);
});

test('wish upgrade consumes the current threshold and preserves excess EXP', t => {
  const env = setup(t);
  env.setState({ token_list: [], type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 1, exp: 10500 });
  const service = env.service();
  const result = service.wishLevelUp();
  assert.deepEqual(result.value, { level: 2, exp: 500, res: { changes: [], is_overflow: false } });
  assert.equal(storedState(env).level, 2);
  assert.equal(storedState(env).exp, 500);
  const before = env.store.state();
  rejected(() => service.wishLevelUp(), 5);
  assert.deepEqual(env.store.state(), before);
});

test('rune types require all three variants and the lowest token level above the current type level', t => {
  const env = setup(t);
  const base = { type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 3, exp: 0 };
  env.setState({ ...base, token_list: [{ token: 1, level: 3, quality: 1 }, { token: 2, level: 3, quality: 1 }] });
  let service = env.service();
  let before = env.store.state();
  rejected(() => service.runeLevelUp(1), 5);
  assert.deepEqual(env.store.state(), before);

  env.setState({ ...base, type_list: [{ type: 1, level: 2 }, ...base.type_list.slice(1)], token_list: [
    { token: 1, level: 3, quality: 1 }, { token: 2, level: 3, quality: 1 }, { token: 3, level: 2, quality: 1 }
  ] });
  before = env.store.state();
  rejected(() => service.runeLevelUp(1), 5);
  assert.deepEqual(env.store.state(), before);

  env.setState({ ...base, token_list: [
    { token: 1, level: 3, quality: 1 }, { token: 2, level: 3, quality: 1 }, { token: 3, level: 3, quality: 1 }
  ] });
  service = env.service();
  const result = service.runeLevelUp(1);
  assert.deepEqual(result.value, { type: 1, level: 1 });
  assert.equal(storedState(env).type_list.find(row => row.type === 1).level, 1);
});

test('all four rune type commands work and an invalid type leaves state unchanged', t => {
  const env = setup(t);
  const tokens = Array.from({ length: 12 }, (_, index) => ({ token: index + 1, level: 2, quality: 1 }));
  env.setState({ token_list: tokens, type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 2, exp: 0 });
  const service = env.service();
  for (let type = 1; type <= 4; type++) assert.deepEqual(service.runeLevelUp(type).value, { type, level: 1 });
  const before = env.store.state();
  rejected(() => service.runeLevelUp(5), 1);
  assert.deepEqual(env.store.state(), before);
});

test('ETF command decoding accepts empty and lenient rune-type shapes', async t => {
  const env = setup(t);
  env.addCurrency(100);
  env.setState({ token_list: [], type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 1, exp: 0 });
  const service = env.service();
  const draw = await service.execute(90201, await encodeEtf([]));
  assert.equal(draw.value.exp, 1000);
  const emptyType = await encodeEtf([]);
  const invalidType = await encodeEtf([{ type: 5 }]);
  await assert.rejects(() => service.execute(90204, emptyType), error => error.code === 1);
  await assert.rejects(() => service.execute(90204, invalidType), error => error.code === 1);
});

test('response encoding failure rolls back draw resource, token and EXP changes', t => {
  const env = setup(t);
  env.addCurrency(100);
  env.setState({ token_list: [], type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })), level: 1, exp: 0 });
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_norse_rune_draw_back') throw new Error('Injected Norse rune encoding failure');
      return codec.pack(name, value);
    }
  };
  const service = createNorseRuneService({ store: env.store, codec: brokenCodec, tables, random: () => 0 });
  assert.throws(() => service.draw(), /Injected Norse rune encoding failure/);
  assert.deepEqual(env.store.state(), before);
});

test('real TCP routes 90201-90204 and returns module 156 through login', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-norse-rune-gateway-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, verification) => uid === 'local-user' && verification === 'test-session',
    now: () => 1700000000000,
    random: () => 0
  };
  let game = createLocalGame(options), socket;
  t.after(async () => { socket?.destroy(); if (game) await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
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
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  const loginModules = new Map((await decodeEtf(Buffer.from(login.data, 'base64')))[2].value);
  assert.ok(loginModules.has(MODULE));
  assert.deepEqual(codec.unpack('pb_norse_rune', moduleBytes(loginModules.get(MODULE))).type_list, zeroTypes());

  game.store.transaction(model => {
    grantResources(model, [[324002, 200]], game.tables);
    const modules = new Map(model.state.modules.value);
    modules.set(MODULE, serializedBinary(codec.pack('pb_norse_rune', {
      token_list: [{ token: 1, level: 1, quality: 1 }, { token: 2, level: 1, quality: 1 }, { token: 3, level: 1, quality: 1 }],
      type_list: [1, 2, 3, 4].map(type => ({ type, level: 0 })),
      level: 1,
      exp: 0
    })));
    model.state.modules.value = [...modules];
  });
  let response = await request(90201, 2, Buffer.alloc(0));
  assert.equal(response.err, undefined);
  const pending = { token: 1, level: 1, quality: 1 };
  assert.deepEqual(codec.unpack('pb_norse_rune_draw_back', Buffer.from(response.data, 'base64')).draw_token, pending);
  const beforeDuplicate = {
    state: game.store.state(),
    resource: game.store.read().resources.get('324002').num,
    module: Buffer.from(rawBinary(new Map(game.store.state().modules.value).get(MODULE)))
  };
  response = await request(90201, 3, Buffer.alloc(0));
  assert.equal(response.err.err, 5);
  assert.deepEqual(game.store.state(), beforeDuplicate.state);
  assert.equal(game.store.read().resources.get('324002').num, beforeDuplicate.resource);
  assert.deepEqual(Buffer.from(rawBinary(new Map(game.store.state().modules.value).get(MODULE))), beforeDuplicate.module);
  assert.deepEqual(codec.unpack('pb_norse_rune', beforeDuplicate.module).draw_token, pending);
  response = await request(90202, 4, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_norse_rune_token', Buffer.from(response.data, 'base64')), { token: 1, level: 1, quality: 1 });
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const state = codec.unpack('pb_norse_rune', rawBinary(modules.get(MODULE)));
    state.exp = 10000;
    modules.set(MODULE, serializedBinary(codec.pack('pb_norse_rune', state)));
    model.state.modules.value = [...modules];
  });
  response = await request(90203, 5, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_norse_rune_wish_level_up_back', Buffer.from(response.data, 'base64')), { level: 2, res: { changes: [] } });
  response = await request(90204, 6, await encodeEtf([1]));
  assert.deepEqual(codec.unpack('pb_norse_rune_type', Buffer.from(response.data, 'base64')), { type: 1, level: 1 });

  socket.destroy(); socket = null;
  await game.close(); game = null;
  game = createLocalGame(options);
  const delivered = new Map((await decodeEtf(await game.loginPayload()))[2].value);
  const state = codec.unpack('pb_norse_rune', moduleBytes(delivered.get(MODULE)));
  assert.equal(state.level, 2);
  assert.equal(Number(state.exp ?? 0), 0);
  assert.equal(state.type_list.find(row => row.type === 1).level, 1);
});
