import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import {
  createUpStarGiftService, unwrapEtfBinary, wrapEtfBinary
} from '../game/up-star-gift-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
// 2026-11-01 与正式二服开服同为第 1 天：func 25 中 25042/25051/25053/25056/25072/
// 25073/25074/25075/25111 九个版本在窗口内，25063 等历史版本已结束。
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');
const RUNNING_VERSIONS = [40, 49, 52, 56, 72, 73, 74, 75, 111];
const EXPIRED_VERSION = 63;

function calendarAt(now = BASE_MS) {
  return createActivityCalendar({
    tables,
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    activityReferenceOpenedAt: null,
    mode: 'schedule',
    currentFishingActivityId: 1074011,
    now: () => now
  });
}

function seedActivity() {
  const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
  const template = capture.privateFlows.find(item => item.messageId === 'game:tcp-69:s2c:103').decoded;
  const modules = new Map(template[2].value);
  return codec.unpack('pb_act_login', rawBinary(modules.get(92)));
}

function upStarGroup(activity) {
  return activity.act_parallel_list.find(group =>
    group.states_data.some(state => Number(tables.Activity.get(Number(state.act_id))?.func) === 25));
}

function decodeMaster(group) {
  return codec.unpack('pb_up_star_gift_master', unwrapEtfBinary(group.module_login_data));
}

function createStubStore(modules) {
  let current = modules.map(([id, value]) => [id, value]);
  return {
    state: () => ({ roleId: 1, modules: { value: current, improper: false } }),
    transaction(run) {
      const working = current.map(([id, value]) => [id, JSON.parse(JSON.stringify(value))]);
      const model = { state: { roleId: 1, modules: { value: working, improper: false } } };
      const result = run(model, {});
      current = model.state.modules.value;
      return result;
    },
    modules: () => current
  };
}

function serviceFor(store, { codec: override, now = BASE_MS } = {}) {
  return createUpStarGiftService({
    store,
    codec: override ?? codec,
    tables,
    calendar: calendarAt(now),
    now: () => now,
    logger: () => {}
  });
}

function stubStoreFrom(activity) {
  return createStubStore([[92, serializedBinary(codec.pack('pb_act_login', activity))]]);
}

test('login sync adds the missing running version and selects a live version', () => {
  const activity = seedActivity();
  const service = serviceFor(stubStoreFrom(activity));
  const result = service.synchronizeLogin(activity, Math.floor(BASE_MS / 1000));

  assert.deepEqual(result.versions, RUNNING_VERSIONS);
  assert.ok(result.addedInfo.includes(25111), '25111 is open by schedule but absent from the captured payload');
  assert.ok(result.addedStates.includes(25111));

  const master = decodeMaster(upStarGroup(activity));
  const ids = master.info_list.map(entry => Number(entry.act_id));
  for (const version of result.versions) {
    const entry = master.info_list.find(row => Number(row.version) === version);
    assert.ok(entry, 'version ' + version + ' must have login data');
    assert.equal(Number(entry.act_id) > 0, true);
  }
  assert.equal(ids.includes(25111), true);
  assert.ok(RUNNING_VERSIONS.includes(Number(master.cur_choose_version)));
  // 参考快照里 66 条历史版本是服务端资产，不是当前开放集合，不能删除。
  assert.equal(master.info_list.length >= 66, true);
});

test('login sync keeps an already valid selection and repairs an expired one', () => {
  const activity = seedActivity();
  const group = upStarGroup(activity);
  const master = decodeMaster(group);
  master.cur_choose_version = 72;
  group.module_login_data = wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
    cur_choose_version: master.cur_choose_version,
    info_list: master.info_list.map(entry => ({
      version: Number(entry.version),
      act_id: Number(entry.act_id),
      award_bin: Buffer.from(entry.award_bin || '', 'base64')
    }))
  }));
  serviceFor(stubStoreFrom(activity)).synchronizeLogin(activity, Math.floor(BASE_MS / 1000));
  assert.equal(Number(decodeMaster(upStarGroup(activity)).cur_choose_version), 72);

  const expired = seedActivity();
  const expiredGroup = upStarGroup(expired);
  const expiredMaster = decodeMaster(expiredGroup);
  expiredMaster.cur_choose_version = EXPIRED_VERSION;
  expiredGroup.module_login_data = wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
    cur_choose_version: EXPIRED_VERSION,
    info_list: expiredMaster.info_list.map(entry => ({
      version: Number(entry.version),
      act_id: Number(entry.act_id),
      award_bin: Buffer.from(entry.award_bin || '', 'base64')
    }))
  }));
  serviceFor(stubStoreFrom(expired)).synchronizeLogin(expired, Math.floor(BASE_MS / 1000));
  const repaired = Number(decodeMaster(upStarGroup(expired)).cur_choose_version);
  assert.ok(RUNNING_VERSIONS.includes(repaired));
  assert.notEqual(repaired, EXPIRED_VERSION);
});

test('31053 selects a running version, is idempotent and survives relogin', () => {
  const activity = seedActivity();
  const store = stubStoreFrom(activity);
  const service = serviceFor(store);

  const first = service.execute(31053, 72);
  assert.deepEqual({ changed: first.value.changed, version: first.value.version }, { changed: true, version: 72 });

  const stored = codec.unpack('pb_act_login', rawBinary(new Map(store.modules()).get(92)));
  assert.equal(Number(decodeMaster(upStarGroup(stored)).cur_choose_version), 72);

  const again = service.execute(31053, 72);
  assert.equal(again.value.changed, false);

  // 重登：从数据库载荷重新解析后再对齐，选择必须保留。
  const relogin = codec.unpack('pb_act_login', rawBinary(new Map(store.modules()).get(92)));
  service.synchronizeLogin(relogin, Math.floor(BASE_MS / 1000));
  assert.equal(Number(decodeMaster(upStarGroup(relogin)).cur_choose_version), 72);
});

test('31053 rejects unknown and expired versions without writing', () => {
  const activity = seedActivity();
  const store = stubStoreFrom(activity);
  const service = serviceFor(store);
  const before = JSON.stringify(new Map(store.modules()).get(92));

  assert.throws(() => service.execute(31053, EXPIRED_VERSION), error => error.code === 309);
  assert.throws(() => service.execute(31053, 9999), error => error.code === 309);
  assert.throws(() => service.execute(31053, 0), error => error.code === 1);
  assert.throws(() => service.execute(31053, 'x'), error => error.code === 1);
  assert.equal(JSON.stringify(new Map(store.modules()).get(92)), before);
});

test('31052 validates the protobuf request and fails closed on the missing UpStarGiftTable', () => {
  const activity = seedActivity();
  const store = stubStoreFrom(activity);
  const service = serviceFor(store);
  const before = JSON.stringify(new Map(store.modules()).get(92));

  assert.throws(() => service.execute(31052, { ids: [1101011] }), error => {
    assert.equal(error.code, 5);
    assert.match(error.message, /UpStarGiftTable/);
    return true;
  });
  assert.throws(() => service.execute(31052, { ids: [] }), error => error.code === 1);
  assert.throws(() => service.execute(31052, { ids: [1, 1] }), error => error.code === 1);
  assert.throws(() => service.execute(31052, { ids: [0] }), error => error.code === 1);
  assert.throws(() => service.execute(31052, {}), error => error.code === 1);
  assert.equal(JSON.stringify(new Map(store.modules()).get(92)), before, 'a refused claim must not write claim bits');
});

test('31053 rolls the transaction back when the module cannot be serialized', () => {
  const activity = seedActivity();
  const store = stubStoreFrom(activity);
  let fail = false;
  const flaky = {
    ...codec,
    pack(name, value) {
      if (fail && name === 'pb_act_login') throw new Error('serialization failed');
      return codec.pack(name, value);
    }
  };
  const service = serviceFor(store, { codec: flaky });
  const before = JSON.stringify(new Map(store.modules()).get(92));

  fail = true;
  assert.throws(() => service.execute(31053, 72), /serialization failed/);
  assert.equal(JSON.stringify(new Map(store.modules()).get(92)), before);

  fail = false;
  assert.equal(service.execute(31053, 72).value.changed, true);
});

function game(directory, { now }) {
  return createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    now
  });
}

async function connect(t, instance) {
  const address = await instance.listen(0);
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
  t.after(async () => { socket.destroy(); });
  await once(socket, 'connect');
  socket.write(encodeGameFrame(Buffer.from('verify')));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  socket.write(encodeGameFrame(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ])));
  let seq = 0;
  const request = async (type, data) => {
    socket.write(encodeGameFrame(codec.pack('pb_c2s', { type, seq: ++seq, data })));
    return codec.unpack('pb_s2c', await next());
  };
  const login = await request(909103, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const decoded = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.equal(decoded[0], 1);
  return { request, socket, loginModules: new Map(decoded[2].value) };
}

test('gateway decodes 31052 as protobuf and 31053 as ETF version', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-up-star-gift-gateway-'));
  const instance = game(directory, { now: () => BASE_MS });
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const { request, loginModules } = await connect(t, instance);

  const loginModule = loginModules.get(92);
  // login 是 ETF 响应：二进制字段解码成 { value: <byte array>, bits: 8 }。
  const loginActivity = codec.unpack('pb_act_login', Buffer.from(loginModule?.value?.data ?? loginModule?.value ?? []));
  const loginMaster = decodeMaster(upStarGroup(loginActivity));
  assert.ok(loginMaster.info_list.some(entry => Number(entry.act_id) === 25111), 'login must expose the running 25111 version');
  assert.ok(RUNNING_VERSIONS.includes(Number(loginMaster.cur_choose_version)), 'login must preselect a running version');

  const claim = await request(31052, codec.pack('pb_up_star_gift_req', { ids: [1101011] }));
  assert.equal(claim.err.err, 5, 'valid pb_up_star_gift_req must reach the missing-table refusal');

  const malformed = await request(31052, Buffer.from([0xff, 0xff]));
  assert.equal(malformed.err.err, 1);

  const chosen = await request(31053, await encodeEtf([72]));
  assert.equal(chosen.err, undefined);

  const expired = await request(31053, await encodeEtf([EXPIRED_VERSION]));
  assert.equal(expired.err.err, 309);

  const stored = codec.unpack('pb_act_login', rawBinary(new Map(instance.store.state().modules.value).get(92)));
  assert.equal(Number(decodeMaster(upStarGroup(stored)).cur_choose_version), 72);
});

