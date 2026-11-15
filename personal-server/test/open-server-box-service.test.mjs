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
import { readGameTables } from '../config/game-tables.mjs';
import { readOpenServerBoxTables } from '../config/open-server-box-tables.mjs';
import { activityWindow, dayZero } from '../game/activity-calendar.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createOpenServerBoxService } from '../game/open-server-box-service.mjs';
import { decodeModuleLoginBlocks } from '../game/relic-divine-login.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createGameFixture, createSeed } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const boxTables = readOpenServerBoxTables();
const DAY_SECONDS = 86400;
const SERVER_OPENED_AT = 1_767_225_600;
const activityConfig = tables.Activity.get(20001);
const initialWindow = activityWindow(activityConfig, SERVER_OPENED_AT, null);
assert.ok(initialWindow?.start > 0);
const DAY_SEVEN = initialWindow.start + DAY_SECONDS * 6 + 60;

function setMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(8);
    assert.ok(Array.isArray(module?.value));
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(missionId);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
}

function itemAmount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function setup(t, { missionId = 60205, at = DAY_SEVEN, encodingCodec = codec } = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-open-server-box-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => at * 1000
  });
  setMission(fixture.store, missionId);
  const createService = () => createOpenServerBoxService({
    store: fixture.store,
    codec: encodingCodec,
    tables: boxTables,
    gameTables: tables,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => at * 1000
  });
  return { fixture, service: createService(), createService };
}

function createWallet(store, accountId = 'open-box-test') {
  store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id,balance_cents) VALUES(?,?,0)')
      .run(accountId, model.state.roleId);
  });
  return accountId;
}

function addRechargeOrder(store, accountId, productId = 630070) {
  store.transaction((model, db) => {
    db.prepare(`INSERT INTO recharge_orders(
      order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged
    ) VALUES(?,?,?,?,?,?,?,0)`).run(
      `order-${productId}`, accountId, `request-${productId}`, productId, 600, '{}',
      new Date(DAY_SEVEN * 1000).toISOString()
    );
  });
}

function loginState(activityLogin) {
  const entry = (activityLogin.act_list ?? []).find(row => Number(row?.state_data?.act_id) === 20001);
  assert.ok(entry);
  const blocks = decodeModuleLoginBlocks(entry.module_login_data);
  assert.ok(blocks.length >= 1);
  return codec.unpack('pb_open_server_box', blocks.at(-1));
}

test('OpenServerBox table keeps the four 30-day versions, five progress rows and v0 paid SKU', () => {
  assert.deepEqual(boxTables.counts, {
    OpenServerBox: 120,
    OpenServerProgress: 20,
    Version: 4,
    Icon: 4,
    Const: 1
  });
  assert.equal(boxTables.source.sha256, '76b425229956d285a62726a9d2dc8888e205d2b142c54b614c0e75c57f0172e0');
  for (let version = 0; version <= 3; version += 1) {
    assert.equal(boxTables.boxesFor(version).size, 30);
    assert.deepEqual([...boxTables.progressFor(version).values()].map(row => row.need_progress), [7, 13, 19, 25, 30]);
  }
  assert.equal(boxTables.versionConfig(0).recharge, 630070);
  assert.equal(boxTables.versionConfig(0).get_cond, 60205);
});

test('OpenServerBox rejects the pre-60205 gate before any award or persisted state', t => {
  const env = setup(t, { missionId: 60204 });
  const before = boxTables.boxesFor(0).get(1).award.map(([tid]) => itemAmount(env.fixture.store, tid));
  assert.throws(() => env.service.execute(69301, 0),
    error => error instanceof GameError && error.code === 5 && /60205/.test(error.message));
  assert.deepEqual(boxTables.boxesFor(0).get(1).award.map(([tid]) => itemAmount(env.fixture.store, tid)), before);
  assert.equal(env.fixture.store.inspect(db => db.prepare(
    'SELECT count(*) AS n FROM develop_module_state WHERE module=?'
  ).get('r1_open_server_box').n), 0);
});

test('69301 awards exactly one eligible day and advances the receive cursor', t => {
  const env = setup(t);
  const row = boxTables.boxesFor(0).get(1);
  const before = itemAmount(env.fixture.store, row.award[0][0]);
  const result = env.service.execute(69301, 0);
  assert.equal(result.schema, 'pb_open_server_box_back');
  const body = codec.unpack('pb_open_server_box_back', result.data);
  assert.equal(Number(body.data.version ?? 0), 0);
  assert.equal(body.data.rev_days, '1');
  assert.equal(body.res.changes.length, 1);
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), before + row.award[0][1]);
  assert.equal(env.service.state().rev_days, 1);
});

test('69302 uses pb_res_to_client, checks the day threshold, claims once and survives SQLite reopen', t => {
  const env = setup(t);
  const row = boxTables.progressFor(0).get(0);
  const before = itemAmount(env.fixture.store, row.award[0][0]);
  const result = env.service.execute(69302, { tid: 1, version: 0 });
  assert.equal(result.schema, 'pb_res_to_client');
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.length, 1);
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), before + row.award[0][1]);
  assert.throws(() => env.service.execute(69302, { tid: 1, version: 0 }),
    error => error.code === 5 && /already claimed/.test(error.message));
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), before + row.award[0][1]);

  env.fixture.open();
  setMission(env.fixture.store, 60205);
  const reopened = env.createService();
  const persisted = reopened.state();
  assert.deepEqual(Buffer.from(persisted.rev_progress, 'base64').toString('hex'), '80');
});

test('progress thresholds, stale versions and unknown tids reject before resources change', t => {
  const env = setup(t, { at: initialWindow.start + 60 });
  const row = boxTables.progressFor(0).get(0);
  const before = itemAmount(env.fixture.store, row.award[0][0]);
  assert.throws(() => env.service.execute(69302, { tid: 1, version: 0 }),
    error => error.code === 5 && /needs 7 days/.test(error.message));
  assert.throws(() => env.service.execute(69302, { tid: 1, version: 1 }),
    error => error.code === 5 && /stale/.test(error.message));
  assert.throws(() => env.service.execute(69302, { tid: 999, version: 0 }),
    error => error.code === 5 && /not configured/.test(error.message));
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), before);
});

test('backend balance is not a paid flag; a real 630070 order selects the v0 recharge award', t => {
  const env = setup(t);
  const accountId = createWallet(env.fixture.store);
  env.fixture.store.inspect(db => db.prepare(
    'UPDATE local_wallets SET balance_cents=100000 WHERE account_id=?'
  ).run(accountId));
  const activityLogin = { act_list: [], act_parallel_list: [] };
  env.service.synchronizeLogin(activityLogin);
  assert.equal(Boolean(loginState(activityLogin).recharge_flag), false);

  addRechargeOrder(env.fixture.store, accountId);
  env.service.synchronizeLogin(activityLogin);
  assert.equal(loginState(activityLogin).recharge_flag, true);
  const row = boxTables.boxesFor(0).get(1);
  const paidBefore = itemAmount(env.fixture.store, row.recharge_award[0][0]);
  const freeBefore = itemAmount(env.fixture.store, row.award[0][0]);
  env.service.execute(69301, 0);
  assert.equal(itemAmount(env.fixture.store, row.recharge_award[0][0]), paidBefore + row.recharge_award[0][1]);
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), freeBefore);
});

test('response encoding and malformed persisted state failures roll back every mutation', t => {
  let failResponse = false;
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (failResponse && name === 'pb_open_server_box_back') throw new Error('forced response failure');
      return codec.pack(name, value);
    }
  };
  const env = setup(t, { encodingCodec: brokenCodec });
  const row = boxTables.boxesFor(0).get(1);
  const before = itemAmount(env.fixture.store, row.award[0][0]);
  failResponse = true;
  assert.throws(() => env.service.execute(69301, 0), /forced response failure/);
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), before);
  assert.equal(env.fixture.store.inspect(db => db.prepare(
    'SELECT count(*) AS n FROM develop_module_state WHERE module=?'
  ).get('r1_open_server_box').n), 0);

  failResponse = false;
  env.service.execute(69301, 0);
  env.fixture.store.inspect(db => db.prepare(
    'UPDATE develop_module_state SET payload=? WHERE module=?'
  ).run('{broken', 'r1_open_server_box'));
  const afterFirst = itemAmount(env.fixture.store, row.award[0][0]);
  assert.throws(() => env.service.execute(69301, 0),
    error => error.code === 5 && /persisted state/.test(error.message));
  assert.equal(itemAmount(env.fixture.store, row.award[0][0]), afterFirst);
});

test('login projection and real temporary TCP expose 69301/69302 with persisted state', { timeout: 20000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-open-server-box-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: SERVER_OPENED_AT,
    roleName: 'Open Box Gateway'
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT, now: () => DAY_SEVEN * 1000 });
  setMission(store, 60205);
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('open-box-gateway', roleId, 'open-box-gateway', '', new Date(DAY_SEVEN * 1000).toISOString(), new Date(DAY_SEVEN * 1000).toISOString());
  });
  store.close();
  store = null;

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => DAY_SEVEN * 1000,
    resolveSession: (uid, token) => token === 'open-box-session' && uid === 'open-box-gateway'
      ? { userId: uid, loginCode: uid }
      : null
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
    channel_uid: 'open-box-gateway',
    verify_code: 'open-box-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  const loginModules = new Map(loginValue[2].value.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  const activityModule = loginModules.get(92);
  assert.ok(activityModule);
  const activity = codec.unpack('pb_act_login', Array.from(activityModule.value));
  const projected = (activity.act_list ?? []).find(row => Number(row?.state_data?.act_id) === 20001);
  assert.ok(projected?.module_login_data);
  assert.equal(Number(loginState(activity).version ?? 0), 0);

  let response = await request(69301, 2, await encodeEtf([0]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_open_server_box_back', Buffer.from(response.data, 'base64')).data.rev_days, '1');
  response = await request(69302, 3, await encodeEtf([{ tid: 1, version: 0 }]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes.length, 1);
  response = await request(69302, 4, await encodeEtf([{ tid: 1, version: 0 }]));
  assert.equal(Number(response.err?.err ?? response.err), 5);
  const openBox = game.commandSupportOwners().itemCommandServices.find(service => service.supports(69302));
  assert.ok(openBox);
  assert.equal(openBox.state().rev_days, 1);
  assert.equal(Buffer.from(openBox.state().rev_progress, 'base64').toString('hex'), '80');
});
