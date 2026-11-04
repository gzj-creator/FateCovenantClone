import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readMagicCircleTables } from '../config/magic-circle-tables.mjs';
import { createMagicCircleService, MAGIC_CIRCLE_COMMANDS, MAGIC_CIRCLE_MODULE } from '../game/magic-circle-service.mjs';
import { createLocalGame } from '../local-game.mjs';

const codec = createGameCodec();
const tables = readMagicCircleTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const fixtureModules = () => structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);

function addResource(store, tid, num) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const groups = modules.get(6).value;
    if (!groups[0]) groups[0] = { value: [], improper: false };
    const entry = groups[0].value.length;
    groups[0].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, 0, entry] });
    model.state.modules.value = [...modules];
  });
}

function setup(t, initialNow = 1700000000000) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-magic-circle-test-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  let store = createGameStore({
    databasePath,
    seed: () => ({
      version: 1,
      roleId: 100001,
      serverId: 1,
      createdAt: 1700000000,
      modules: fixtureModules(),
      rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Magic Circle Test') }).toString('base64'),
      guides: {},
      lineups: null
    }),
    codec
  });
  let now = initialNow;
  const service = (useCodec = codec) => createMagicCircleService({ store, codec: useCodec, tables, now: () => now });
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    get store() { return store; },
    get now() { return now; },
    set now(value) { now = value; },
    service,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec });
    },
    addResource: (tid, num) => addResource(store, tid, num),
    setCircle(circle, id = 1) {
      store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        const existing = readRoleFromModules(modules).magic_circle ?? [];
        const rows = tables.circleIds.map(tid => tid === id
          ? { id, level: 0, star: 0, break_level: 0, points: [], last_reset_time: 0, ...circle }
          : existing.find(row => Number(row.id) === tid) ?? { id: tid, level: 0, star: 0, break_level: 0, points: [], last_reset_time: 0 });
        modules.set(MAGIC_CIRCLE_MODULE, { value: [serializedBinary(codec.pack('pb_magic_circle_role', { magic_circle: rows }))], improper: false });
        model.state.modules.value = [...modules];
      });
    }
  };
}

function readRoleFromModules(modules) {
  const module = modules.get(MAGIC_CIRCLE_MODULE);
  if (!module) return { magic_circle: [] };
  const target = Array.isArray(module.value) ? module.value[0] : module;
  const bytes = rawBinary(target);
  return bytes.length ? codec.unpack('pb_magic_circle_role', bytes) : { magic_circle: [] };
}

const readRole = env => readRoleFromModules(new Map(env.store.state().modules.value));
const response = result => codec.unpack('pb_magic_circle_rsp', result.data);
const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('login creates the five captured magic circles in a one-slot module envelope', t => {
  const env = setup(t), service = env.service();
  assert.equal(new Map(env.store.state().modules.value).has(MAGIC_CIRCLE_MODULE), true);
  assert.deepEqual(service.ensureLoginState(), { created: true, circleCount: 5 });
  const role = readRole(env);
  assert.deepEqual(role.magic_circle.map(row => Number(row.id)), [1, 2, 3, 4, 5]);
  for (const row of role.magic_circle) {
    assert.equal(Number(row.level ?? 0), 0);
    assert.equal(Number(row.star ?? 0), 0);
    assert.equal(Number(row.break_level ?? 0), 0);
    assert.deepEqual(row.points ?? [], []);
    assert.equal(Number(row.last_reset_time ?? 0), 0);
  }
  const module = new Map(env.store.state().modules.value).get(MAGIC_CIRCLE_MODULE);
  assert.equal(Array.isArray(module.value), true);
  assert.equal(module.value.length, 1);
  assert.ok(rawBinary(module.value[0]).length > 0);
  assert.deepEqual(service.ensureLoginState(), { created: false, circleCount: 5 });
});

test('malformed login data fails without overwriting the saved module', t => {
  const env = setup(t), service = env.service();
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MAGIC_CIRCLE_MODULE, { value: [serializedBinary(Buffer.from([0xff]))], improper: false });
    model.state.modules.value = [...modules];
  });
  const before = env.store.state();
  rejected(() => service.ensureLoginState(), 5);
  assert.deepEqual(env.store.state(), before);
});

test('level up consumes the configured item, rejects the break gate and persists through reopen', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.addResource(332002, 1000);
  let reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 }));
  assert.equal(reply.magic_circles[0].level, 1);
  assert.deepEqual(reply.res_change.changes, [{ tid: '332002', new_num: '970', diff_num: '-30' }]);
  assert.equal(env.store.read().resources.get('332002').num, '970');

  reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 }));
  assert.equal(reply.magic_circles[0].level, 2);
  assert.equal(env.store.read().resources.get('332002').num, '940');
  env.reopen();
  const reopened = env.service();
  reopened.ensureLoginState();
  assert.equal(readRole(env).magic_circle[0].level, 2);
  assert.equal(env.store.read().resources.get('332002').num, '940');

  const before = env.store.state();
  rejected(() => reopened.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 2 }), 1);
  assert.deepEqual(env.store.state(), before);
  env.setCircle({ level: 10 });
  rejected(() => reopened.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 }), 5);
  env.setCircle({ level: 80, break_level: 8 });
  rejected(() => reopened.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 }), 5);
});

test('breakthrough uses the table cost, enforces the level gate, maximum and resources', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.setCircle({ level: 10 });
  env.addResource(332002, 1000);
  let reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.BREAK_UP, 1));
  assert.equal(reply.magic_circles[0].break_level, 1);
  assert.deepEqual(reply.res_change.changes, [{ tid: '332002', new_num: '970', diff_num: '-30' }]);
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.BREAK_UP, 1), 5);
  env.setCircle({ level: 20, break_level: 1 });
  reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.BREAK_UP, 1));
  assert.equal(reply.magic_circles[0].break_level, 2);
  assert.equal(env.store.read().resources.get('332002').num, '870');
  env.setCircle({ level: 80, break_level: 8 });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.BREAK_UP, 1), 5);
  env.setCircle({ level: 10 });
  env.store.transaction(model => { model.resources.get('332002').num = '0'; });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.BREAK_UP, 1), 301);
});

test('star up consumes the configured star item and enforces maximum and resources', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.addResource(333002, 100);
  let reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.STAR_UP, 1));
  assert.equal(reply.magic_circles[0].star, 1);
  assert.deepEqual(reply.res_change.changes, [{ tid: '333002', new_num: '99', diff_num: '-1' }]);
  reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.STAR_UP, 1));
  assert.equal(reply.magic_circles[0].star, 2);
  assert.equal(env.store.read().resources.get('333002').num, '97');
  env.setCircle({ star: 8 });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.STAR_UP, 1), 5);
  env.setCircle({ star: 5 });
  env.store.transaction(model => { model.resources.get('333002').num = '0'; });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.STAR_UP, 1), 301);
});

test('point activation uses the current level point tier, is atomic and rejects replayed points', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.addResource(331002, 1000);
  let reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [1, 2] }));
  assert.deepEqual(reply.magic_circles[0].points, [1, 2]);
  assert.deepEqual(reply.res_change.changes, [{ tid: '331002', new_num: '900', diff_num: '-100' }]);
  const before = env.store.state();
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [1, 2] }), 310);
  assert.deepEqual(env.store.state(), before);
  for (const points of [[], [0], [5], [3, 3]]) {
    rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points }), 1);
  }

  env.setCircle({ level: 11, break_level: 1, points: [1, 2] });
  reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [3] }));
  assert.deepEqual(reply.magic_circles[0].points, [1, 2, 3]);
  assert.deepEqual(reply.res_change.changes, [{ tid: '331002', new_num: '800', diff_num: '-100' }]);
  env.store.transaction(model => { model.resources.get('331002').num = '0'; });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [4] }), 301);
  assert.deepEqual(readRole(env).magic_circle[0].points, [1, 2, 3]);
});

test('reset clears points and enforces the cooldown without inventing a refund', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  env.addResource(331002, 1000);
  service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [1] });
  let reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.RESET, 1));
  assert.deepEqual(reply.magic_circles[0].points, []);
  assert.equal(Number(reply.magic_circles[0].last_reset_time), 1700000000);
  assert.deepEqual(reply.res_change.changes, []);
  assert.equal(env.store.read().resources.get('331002').num, '950');
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.RESET, 1), 1);

  service.execute(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, { id: 1, points: [2] });
  rejected(() => service.execute(MAGIC_CIRCLE_COMMANDS.RESET, 1), 311);
  env.now += 259200000;
  reply = response(service.execute(MAGIC_CIRCLE_COMMANDS.RESET, 1));
  assert.deepEqual(reply.magic_circles[0].points, []);
  assert.equal(Number(reply.magic_circles[0].last_reset_time), 1700259200);
  assert.deepEqual(reply.res_change.changes, []);
  assert.equal(env.store.read().resources.get('331002').num, '900');
});

test('response encoding failure rolls back state and material changes', t => {
  const env = setup(t), normal = env.service();
  normal.ensureLoginState();
  env.addResource(332002, 1000);
  const before = env.store.state();
  const broken = { ...codec, pack(name, value) { if (name === 'pb_magic_circle_rsp') throw new Error('Injected encoding failure'); return codec.pack(name, value); } };
  assert.throws(() => env.service(broken).execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 }), /Injected encoding failure/);
  assert.deepEqual(env.store.state(), before);
});

test('real login ETF carries module 157 and SQLite reopen restores its state', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-magic-circle-login-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'legacy.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: () => true,
    now: () => 1700000000000
  };
  let game = createLocalGame(options);
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  let login = await decodeEtf(await game.loginPayload());
  let module = new Map(login[2].value).get(MAGIC_CIRCLE_MODULE);
  assert.equal(Array.isArray(module.value), true);
  assert.equal(module.value.length, 1);
  assert.deepEqual(codec.unpack('pb_magic_circle_role', Buffer.from(module.value[0].value)).magic_circle.map(row => Number(row.id)), [1, 2, 3, 4, 5]);

  addResource(game.store, 332002, 1000);
  game.magicCircle.execute(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, { id: 1, target_level: 1 });
  await game.close();
  game = createLocalGame(options);
  login = await decodeEtf(await game.loginPayload());
  module = new Map(login[2].value).get(MAGIC_CIRCLE_MODULE);
  const role = codec.unpack('pb_magic_circle_role', Buffer.from(module.value[0].value));
  assert.equal(role.magic_circle[0].level, 1);
  assert.equal(game.store.read().resources.get('332002').num, '970');
});
