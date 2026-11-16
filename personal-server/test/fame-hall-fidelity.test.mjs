import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createFeatureService, openFeatureIds } from '../game/feature-service.mjs';
import { evaluateFunOpen, loadFunOpenRules } from '../game/feature-rules.mjs';
import { readGuideTables } from '../config/guide-tables.mjs';
import { indexMethodScripts } from '../../tools/extract-fun-open-rules.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame, decodeEtf, encodeEtf } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const rules = loadFunOpenRules();
const FAME_HALL = 1218;
const CREATED_AT = 1794590000;

test('FameHall preserves both original level-32 and server-day-2 assertions', () => {
  const rule = rules.find(rule => rule.funId === FAME_HALL);
  assert.equal(rule.status, 'ready');
  assert.equal(rule.sysSwitch, 161);
  assert.deepEqual(rule.asserts, [955132601037, 983580210601]);
  assert.deepEqual(rule.conditions, [
    { type: 'role_level', operator: '>=', args: { level: 32 } },
    { type: 'server_day', operator: '>=', args: { day: 2 } }
  ]);
  for (const [level, serverDay, expected] of [
    [1, 1, false], [1, 30, false], [31, 2, false], [32, 1, false],
    [32, 2, true], [33, 2, true], [32, 3, true]
  ]) {
    assert.equal(evaluateFunOpen({ level }, [rule], { serverDay }).open.has(FAME_HALL), expected,
      `level ${level}, server day ${serverDay}`);
  }
});

test('fresh account has no inherited FameHall or guide progression and rejects an early FameHall acknowledgement', t => {
  const fixture = createGameFixture(t, codec, { seed: { freshAccount: true, createdAt: CREATED_AT } });
  const modules = new Map(fixture.store.state().modules.value);
  const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3)));
  assert.equal(openFeatureIds(login).has(FAME_HALL), false);
  assert.deepEqual(codec.unpack('pb_guide', rawBinary(modules.get(16))).process_list, []);
  const fame = codec.unpack('pb_fame_hall_role', rawBinary(modules.get(161)));
  assert.deepEqual(fame.heroes, []);
  assert.equal(Number(fame.stage ?? 0), 0);
  assert.equal(Number(fame.cur_difficult ?? 0), 0);
  assert.equal(Boolean(fame.client_show), false);

  const features = createFeatureService({ store: fixture.store, codec, rules, context: () => ({ serverDay: 2, createDay: 1 }) });
  features.reconcile();
  assert.equal(features.openIds().has(FAME_HALL), false);
  const response = codec.unpack('res_fun_open', features.execute(7000, [FAME_HALL, 1054]).data);
  assert.deepEqual(response.fail_id_list, [FAME_HALL]);
  assert.equal(features.openIds().has(FAME_HALL), false);
  assert.equal(features.openIds().has(1054), true, 'client-only conditions still acknowledge the required lobby feature');
  fixture.open();
  const persisted = codec.unpack('res_fun_open_login', rawBinary(new Map(fixture.store.state().modules.value).get(3)));
  assert.equal(openFeatureIds(persisted).has(FAME_HALL), false);
});

test('online FameHall unlock sends full ID 1218, which the client can apply without custom bitmap data', t => {
  const fixture = createGameFixture(t, codec, { seed: { freshAccount: true, createdAt: CREATED_AT } });
  let serverDay = 1;
  const features = createFeatureService({ store: fixture.store, codec, rules, context: () => ({ serverDay, createDay: 1 }) });
  fixture.store.transaction(model => {
    model.role.level = 32;
    const modules = new Map(model.state.modules.value);
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', { target_list: [] })));
    model.state.modules.value = [...modules];
  });
  assert.equal(features.reconcile().includes(FAME_HALL), false);
  const clientLogin = codec.unpack('res_fun_open_login', rawBinary(new Map(fixture.store.state().modules.value).get(3)));
  const clientOpen = openFeatureIds(clientLogin);
  serverDay = 2;
  const added = features.reconcile();
  assert.equal(added.includes(FAME_HALL), true);
  const pushes = features.onlineNotificationsForIds([...added, FAME_HALL]);
  assert.equal(pushes.length, new Set(added).size, 'one notification per newly opened function');
  for (const push of pushes) {
    const payload = codec.unpack('res_notify_fun_open', push.data);
    assert.equal(payload.target_tid, push.funId);
    assert.ok(payload.target_tid >= 1001, '7201 does not use bitmap target group 1');
    assert.deepEqual(payload.extra_ret_list, []);
    // Original FunOpenMgr.RevFunOpenNotify passes {target_tid} to
    // OpenFunAndNotify; it sets the bit for each full ID in this list.
    clientOpen.add(payload.target_tid);
  }
  assert.equal(clientOpen.has(FAME_HALL), true);
  assert.deepEqual([...clientOpen].sort((a, b) => a - b), [...features.openIds()].sort((a, b) => a - b));
  assert.deepEqual(features.reconcile(), []);
  assert.throws(() => features.onlineNotificationsForIds([1999]), /missing after reconciliation/);
});

test('reconciliation removes stale ready bits while preserving force-open, evidence-gap and unrelated bits', t => {
  const fixture = createGameFixture(t, codec, { seed: { freshAccount: true, createdAt: CREATED_AT } });
  fixture.store.transaction(model => {
    model.role.level = 1;
    const modules = new Map(model.state.modules.value);
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', { target_list: [{
      target_tid: 1,
      fun_open_state: (() => {
        const bytes = Buffer.alloc(256);
        for (const id of [1054, 1105, 1218, 1514]) bytes[Math.floor((id % 1000) / 8)] |= 128 >> (id % 8);
        return bytes.toString('base64');
      })()
    }] })));
    model.state.modules.value = [...modules];
  });
  const features = createFeatureService({
    store: fixture.store, codec, rules,
    overrides: () => [{ funId: 1514, mode: 'force_open' }],
    context: () => ({ serverDay: 2, createDay: 1 })
  });
  features.reconcile();
  const open = codec.unpack('res_fun_open_login', rawBinary(new Map(fixture.store.state().modules.value).get(3)));
  const ids = openFeatureIds(open);
  assert.equal(ids.has(FAME_HALL), false, 'ready FameHall false is authoritative and clears the stale bit');
  assert.equal(ids.has(1105), false, 'the legacy FameHall guide alias follows the same gate');
  assert.equal(ids.has(1054), true, 'evidence-gap bits stay untouched');
  assert.equal(ids.has(1514), true, 'force_open wins over a false computed rule');
  assert.equal(features.reconcile().length, 0);
});

test('current mission opens 1573 while stale FameHall and permanent Dream House stay closed', t => {
  const fixture = createGameFixture(t, codec, { seed: { freshAccount: true, createdAt: CREATED_AT } });
  fixture.store.transaction(model => {
    model.role.level = 11;
    const modules = new Map(model.state.modules.value);
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', { target_list: [{
      target_tid: 1,
      fun_open_state: (() => {
        const bytes = Buffer.alloc(256);
        for (const id of [1155, FAME_HALL]) bytes[Math.floor((id % 1000) / 8)] |= 128 >> (id % 8);
        return bytes.toString('base64');
      })()
    }] })));
    const missionModule = modules.get(8);
    const mission = codec.unpack('pb_mission', rawBinary(missionModule.value[0]));
    mission.mission_id = '30204';
    missionModule.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    model.state.modules.value = [...modules];
  });
  const features = createFeatureService({ store: fixture.store, codec, rules, context: () => ({ serverDay: 2, createDay: 1 }) });
  features.reconcile();
  const ids = features.openIds();
  assert.equal(ids.has(1573), true, 'mission 30204 satisfies the recovered 30203 Dream Trial gate');
  assert.equal(ids.has(FAME_HALL), false, 'level 11 cannot retain the stale level-32 FameHall bit');
  assert.equal(ids.has(1155), false, 'the permanent Dream House still requires level 60 or server day 24');
});

test('generated MethodScript index retains a function with an empty dynamic-argument list', () => {
  const root = {
    constants: [{ type: 'child', prototype: 1 }],
    numbers: [208478002224, 208478002225],
    instructions: Array.from({ length: 12 }, () => ({ name: 'MOV' }))
  };
  root.instructions[6] = { name: 'FNEW', d: 0 };
  root.instructions[9] = { name: 'TNEW', d: 0 };
  const index = indexMethodScripts({ rootPrototype: 0, prototypes: [root, {}] });
  assert.deepEqual(index.get(104239001112), { prototype: 1, dynamicArgs: [] });
});

test('real temporary TCP returns an early FameHall failure while acknowledging lobby 1054', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fame-wire-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'), statePath: path.join(directory, 'legacy.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    launchProfileId: 'fame-hall-boundary-test', serverOpenedAt: CREATED_AT - 2 * 86400,
    activityWindowAnchor: CREATED_AT - 3 * 86400, emptyRealm: true,
    resolveSession: () => ({ userId: 'fame-wire-test' }),
    logger: event => events.push(event),
    now: () => CREATED_AT * 1000
  });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => { for (const payload of decoder.push(chunk)) {
    if (waiters.length) waiters.shift()(payload); else queue.push(payload);
  } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('FameHall TCP response timeout: ' + JSON.stringify(events.filter(event => !event.denied)))), 10000);
    waiters.push(payload => { clearTimeout(timer); resolve(payload); });
  });
  const send = bytes => socket.write(encodeGameFrame(bytes));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV,
    { profile: LOCAL_AES_PROFILE }), challenge.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const loginResponse = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'fame-wire-test', verify_code: 'test-session', channel_extra: ''
  }));
  const login = await decodeEtf(Buffer.from(loginResponse.data, 'base64'));
  assert.equal(login[0], 1);
  const roleId = Number(login[2].value.find(([id]) => id === 1)[1][1]);
  assert.equal(game.store.read(roleId).role.level, 1);
  const response = await request(7000, 2, await encodeEtf([FAME_HALL, 1054]));
  assert.equal(response.err, undefined);
  const value = codec.unpack('res_fun_open', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.fail_id_list, [FAME_HALL]);
  const open = openFeatureIds({ target_list: value.target_list });
  assert.equal(open.has(FAME_HALL), false);
  assert.equal(open.has(1054), true);
});

test('current recovered Guide rows do not claim an unproven FameHall first-entry trigger', () => {
  const table = readGuideTables();
  assert.equal(table.Step.size, 718);
  assert.equal([...table.Step.values()].some(step => step.step_module?.reference === 'GuideFameHallFirstEnterStep'), false);
});
