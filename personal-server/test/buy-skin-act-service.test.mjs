import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { resolveR1ActivityOccurrences } from '../config/activity-explicit-occurrences.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createBuySkinActService } from '../game/buy-skin-act-service.mjs';
import { createFeatureService } from '../game/feature-service.mjs';
import { loadFunOpenRules } from '../game/feature-rules.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const rules = loadFunOpenRules();
const ACT_ID = 175001;
const ACT_START = 1750971600;
const ACT_END = 1756587600;
const DAY = 86400;

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

function activityEntry(activity) {
  for (const entry of activity.act_list ?? []) {
    if (Number(entry?.state_data?.act_id) === ACT_ID) return entry;
  }
  for (const group of activity.act_parallel_list ?? []) {
    const entry = (group?.states_data ?? []).find(state => Number(state?.act_id) === ACT_ID);
    if (entry) return entry;
  }
  return null;
}

function unwrapActivityPayload(value) {
  const bytes = Buffer.from(value, 'base64');
  assert.equal(bytes[0], 0x83);
  assert.equal(bytes[1], 0x6d);
  const length = bytes.readUInt32BE(2);
  assert.equal(bytes.length, length + 6);
  return bytes.subarray(6);
}

function setup(t, { missionId = 30203 } = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-buy-skin-',
    serverOpenedAt: ACT_START
  });
  let at = ACT_START;
  setMission(fixture.store, missionId);
  const features = createFeatureService({
    store: fixture.store,
    codec,
    rules,
    context: () => ({ serverDay: 1, createDay: 1 })
  });
  features.reconcile();
  const occurrences = resolveR1ActivityOccurrences({
    tables,
    serverId: 1,
    serverOpenedAt: ACT_START
  });
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: ACT_START,
    mode: 'schedule',
    explicitOccurrences: occurrences,
    now: () => at * 1000
  });
  const buySkin = createBuySkinActService({
    store: fixture.store,
    codec,
    tables,
    calendar,
    now: () => at * 1000
  });
  const wallet = createWalletService({
    store: fixture.store,
    codec,
    tables,
    buySkinActivity: buySkin,
    now: () => at
  });
  fixture.store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id) VALUES (?,?)')
      .run('local-1', model.state.roleId);
  });
  wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'buy-skin-credit' });
  return {
    fixture,
    wallet,
    buySkin,
    calendar,
    features,
    get at() { return at; },
    setAt(value) { at = value; }
  };
}

function servicesFor(fixture, clock) {
  const occurrences = resolveR1ActivityOccurrences({
    tables,
    serverId: 1,
    serverOpenedAt: ACT_START
  });
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: ACT_START,
    mode: 'schedule',
    explicitOccurrences: occurrences,
    now: () => clock() * 1000
  });
  const buySkin = createBuySkinActService({
    store: fixture.store,
    codec,
    tables,
    calendar,
    now: () => clock() * 1000
  });
  const wallet = createWalletService({
    store: fixture.store,
    codec,
    tables,
    buySkinActivity: buySkin,
    now: clock
  });
  return { buySkin, wallet, calendar };
}

test('BuySkin free awards enforce the activity, feature, item day window and per-item daily key', t => {
  const env = setup(t);
  let response = env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 });
  let res = codec.unpack('pb_res_to_client', response.data);
  assert.equal(Number(res.changes[0].tid), 101500);
  assert.equal(res.changes[0].diff_num, '50');
  assert.throws(
    () => env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 }),
    error => error instanceof GameError && error.code === 311
  );
  assert.throws(
    () => env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 2 }),
    error => error instanceof GameError && error.code === 309
  );

  env.setAt(ACT_START + 2 * DAY + 60);
  for (const itemId of [1, 2]) {
    response = env.buySkin.execute(104001, { act_id: ACT_ID, item_id: itemId });
    assert.equal(codec.unpack('pb_res_to_client', response.data).changes[0].diff_num, '50');
  }

  env.setAt(ACT_START + 3 * DAY + 60);
  assert.throws(
    () => env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 }),
    error => error instanceof GameError && error.code === 309
  );
  response = env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 2 });
  assert.equal(codec.unpack('pb_res_to_client', response.data).changes[0].diff_num, '50');

  env.setAt(ACT_START + 15 * DAY + 60);
  assert.throws(
    () => env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 3 }),
    error => error instanceof GameError && error.code === 309
  );
  for (const [dayOffset, itemId] of [[16, 3], [30, 4], [44, 5]]) {
    env.setAt(ACT_START + dayOffset * DAY + 60);
    response = env.buySkin.execute(104001, { act_id: ACT_ID, item_id: itemId });
    assert.equal(codec.unpack('pb_res_to_client', response.data).changes[0].diff_num, '50');
  }

  const modules = new Map(env.fixture.store.read().state.modules.value);
  const activity = codec.unpack('pb_act_login', rawBinary(modules.get(92)));
  const entry = activityEntry(activity);
  assert.ok(entry);
  const person = codec.unpack('pb_buy_skin_person', unwrapActivityPayload(entry.module_login_data));
  assert.deepEqual(person.free_award.map(row => row.item_id), [1, 2, 3, 4, 5]);
  assert.equal(new Set(person.free_award.map(row => row.item_id)).size, person.free_award.length);
});

test('BuySkin free awards reject the exact end and a missing 1514 feature bit', t => {
  const closed = setup(t);
  closed.setAt(ACT_END);
  assert.throws(
    () => closed.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 }),
    error => error instanceof GameError && error.code === 309
  );
  assert.throws(
    () => closed.wallet.buy({
      account_id: 'local-1', product_id: 1180001, request_id: 'closed-skin-product',
      activity_id: ACT_ID, buy_skin_tid: 1
    }),
    error => error instanceof GameError && error.code === 309
  );

  const gated = setup(t);
  gated.fixture.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', { target_list: [] })));
    model.state.modules.value = [...modules];
  });
  assert.throws(
    () => gated.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 }),
    error => error instanceof GameError && error.code === 5
  );
});

test('feature 1514 opens exactly at the recovered passed-section threshold', t => {
  const before = setup(t, { missionId: 30202 });
  assert.equal(before.features.openIds().has(1514), false);

  const atThreshold = setup(t, { missionId: 30203 });
  assert.equal(atThreshold.features.openIds().has(1514), true);

  const after = setup(t, { missionId: 30204 });
  assert.equal(after.features.openIds().has(1514), true);
});

test('BuySkin paid purchase is atomic across wallet, rewards, ownership and module 92', t => {
  const env = setup(t);
  const request = {
    account_id: 'local-1', product_id: 1180001, request_id: 'buy-skin-one',
    activity_id: ACT_ID, buy_skin_tid: 1
  };
  const purchase = env.wallet.buy(request);
  const push = codec.unpack('res_recharge_success', Buffer.from(purchase.notification, 'base64'));
  assert.equal(push.extra_params.length > 0, true);
  const params = decodeEtf(Buffer.from(push.extra_params, 'base64')).then(value => value);
  return params.then(decoded => {
    const raw = decoded.value ?? decoded;
    assert.equal(Number(raw[0]?.value ?? raw[0]), ACT_ID);
    const extra = push.extra_ret_list.find(row => Number(row.flag) === 106);
    assert.ok(extra);
    const record = codec.unpack('pb_recharge_limit_info', Buffer.from(extra.data, 'base64'));
    assert.equal(record.buy_num_list.find(row => Number(row.recharge_id) === 1180001).buy_num, 1);
    assert.equal(env.wallet.snapshot().accounts[0].balance_cents, 100000 - 32800);

    const model = env.fixture.store.read();
    const modules = new Map(model.state.modules.value);
    const skins = codec.unpack('pb_skin_info', rawBinary(modules.get(65).value[0])).skin_list;
    assert.equal(skins.find(row => Number(row.id) === 156912).num, 1);
    const roleSkin = env.fixture.store.inspect(db => db.prepare(
      'SELECT num,source FROM role_skins WHERE role_id=? AND skin_tid=156912'
    ).get(model.state.roleId));
    assert.deepEqual({ ...roleSkin }, { num: 1, source: 'buy_skin_act:175001' });
    const activity = codec.unpack('pb_act_login', rawBinary(modules.get(92)));
    const person = codec.unpack('pb_buy_skin_person', unwrapActivityPayload(activityEntry(activity).module_login_data));
    assert.equal(person.record.buy_num_list.find(row => row.recharge_id === 1180001).buy_num, 1);

    const replay = env.wallet.buy(request);
    assert.equal(replay.duplicate, true);
    assert.equal(env.wallet.snapshot().accounts[0].balance_cents, 100000 - 32800);
    const resourceSnapshot = [...env.fixture.store.read().resources.values()]
      .map(row => [String(row.tid), String(row.num)]);
    assert.equal(env.fixture.store.inspect(db => db.prepare(
      'SELECT count(*) AS n FROM activity_purchases WHERE role_id=? AND product_id=1180001'
    ).get(model.state.roleId).n), 1);
    assert.throws(
      () => env.wallet.buy({ ...request, request_id: 'buy-skin-one-again' }),
      error => error instanceof GameError && [5, 307].includes(error.code)
    );
    const replayResourceSnapshot = [...env.fixture.store.read().resources.values()]
      .map(row => [String(row.tid), String(row.num)]);
    assert.deepEqual(replayResourceSnapshot, resourceSnapshot);
  });
});

test('BuySkin products unlock by activity day and allow one purchase per SKU per period', t => {
  const env = setup(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'buy-skin-extra-credit' });
  assert.throws(
    () => env.wallet.buy({
      account_id: 'local-1', product_id: 1180002, request_id: 'locked-later-skin',
      activity_id: ACT_ID, buy_skin_tid: 2
    }),
    error => error instanceof GameError && error.code === 309
  );
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180001, request_id: 'day-one-skin',
    activity_id: ACT_ID, buy_skin_tid: 1
  });
  env.setAt(ACT_START + 2 * DAY + 60);
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180002, request_id: 'day-three-skin',
    activity_id: ACT_ID, buy_skin_tid: 2
  });
  env.setAt(ACT_START + 15 * DAY + 60);
  assert.throws(
    () => env.wallet.buy({
      account_id: 'local-1', product_id: 1180003, request_id: 'locked-day-17-skin',
      activity_id: ACT_ID, buy_skin_tid: 3
    }),
    error => error instanceof GameError && error.code === 309
  );
  env.setAt(ACT_START + 16 * DAY + 60);
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180003, request_id: 'day-seventeen-skin',
    activity_id: ACT_ID, buy_skin_tid: 3
  });
  env.setAt(ACT_START + 29 * DAY + 60);
  assert.throws(
    () => env.wallet.buy({
      account_id: 'local-1', product_id: 1180004, request_id: 'locked-day-31-skin',
      activity_id: ACT_ID, buy_skin_tid: 4
    }),
    error => error instanceof GameError && error.code === 309
  );
  env.setAt(ACT_START + 30 * DAY + 60);
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180004, request_id: 'day-thirty-one-skin',
    activity_id: ACT_ID, buy_skin_tid: 4
  });
  env.setAt(ACT_START + 43 * DAY + 60);
  assert.throws(
    () => env.wallet.buy({
      account_id: 'local-1', product_id: 1180005, request_id: 'locked-day-45-skin',
      activity_id: ACT_ID, buy_skin_tid: 5
    }),
    error => error instanceof GameError && error.code === 309
  );
  env.setAt(ACT_START + 44 * DAY + 60);
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180005, request_id: 'day-forty-five-skin',
    activity_id: ACT_ID, buy_skin_tid: 5
  });
  assert.deepEqual([1, 2, 3, 4, 5].map(tid => env.buySkin.purchaseCount(1180000 + tid)), [1, 1, 1, 1, 1]);
  assert.equal(env.buySkin.purchaseCount(1180002), 1);
  // Remove the ownership presentation to prove the durable one-per-period
  // purchase ledger still blocks the same SKU.
  env.fixture.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const skins = codec.unpack('pb_skin_info', rawBinary(modules.get(65).value[0]));
    skins.skin_list = skins.skin_list.filter(row => Number(row.id) !== 157012);
    modules.get(65).value[0] = serializedBinary(codec.pack('pb_skin_info', skins));
    model.state.modules.value = [...modules];
  });
  env.fixture.store.inspect(db => db.prepare('DELETE FROM role_skins WHERE skin_tid=157012').run());
  assert.throws(
    () => env.wallet.buy({
      account_id: 'local-1', product_id: 1180002, request_id: 'day-three-sku-limit',
      activity_id: ACT_ID, buy_skin_tid: 2
    }),
    error => error instanceof GameError && error.code === 307
  );
});

test('BuySkin free, paid, ownership and module 92 state survive a SQLite reopen', t => {
  const env = setup(t);
  env.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 });
  env.wallet.buy({
    account_id: 'local-1', product_id: 1180001, request_id: 'persisted-buy-skin',
    activity_id: ACT_ID, buy_skin_tid: 1
  });
  const roleId = env.fixture.store.state().roleId;

  env.fixture.open();
  const reopened = servicesFor(env.fixture, () => env.at);
  assert.equal(reopened.wallet.snapshot().accounts[0].balance_cents, 100000 - 32800);
  assert.equal(reopened.buySkin.purchaseCount(1180001), 1);
  assert.equal(env.fixture.store.inspect(db => db.prepare(
    'SELECT count(*) AS n FROM buy_skin_free_claims WHERE role_id=? AND act_id=? AND item_id=1'
  ).get(roleId, ACT_ID).n), 1);
  assert.equal(env.fixture.store.inspect(db => db.prepare(
    'SELECT count(*) AS n FROM role_skins WHERE role_id=? AND skin_tid=156912 AND num=1'
  ).get(roleId).n), 1);

  const modules = new Map(env.fixture.store.read().state.modules.value);
  const skins = codec.unpack('pb_skin_info', rawBinary(modules.get(65).value[0])).skin_list;
  assert.equal(skins.find(row => Number(row.id) === 156912).num, 1);
  const activity = codec.unpack('pb_act_login', rawBinary(modules.get(92)));
  const person = codec.unpack(
    'pb_buy_skin_person',
    unwrapActivityPayload(activityEntry(activity).module_login_data)
  );
  assert.deepEqual(person.free_award.map(row => Number(row.item_id)), [1]);
  assert.equal(person.record.buy_num_list.find(row => Number(row.recharge_id) === 1180001).buy_num, 1);

  assert.throws(
    () => reopened.buySkin.execute(104001, { act_id: ACT_ID, item_id: 1 }),
    error => error instanceof GameError && error.code === 311
  );
});

test('BuySkin purchase rolls back the order, currency, skin and activity row when login packing fails', t => {
  const env = setup(t);
  const broken = createWalletService({
    store: env.fixture.store,
    codec: {
      ...codec,
      pack(name, value) {
        if (name === 'pb_buy_skin_person') throw new Error('forced buy-skin login failure');
        return codec.pack(name, value);
      }
    },
    tables,
    buySkinActivity: createBuySkinActService({
      store: env.fixture.store,
      codec: {
        ...codec,
        pack(name, value) {
          if (name === 'pb_buy_skin_person') throw new Error('forced buy-skin login failure');
          return codec.pack(name, value);
        }
      },
      tables,
      calendar: env.calendar,
      now: () => env.at * 1000
    }),
    now: () => env.at
  });
  assert.throws(() => broken.buy({
    account_id: 'local-1', product_id: 1180001, request_id: 'rollback-buy-skin',
    activity_id: ACT_ID, buy_skin_tid: 1
  }), /forced buy-skin login failure/);
  const state = env.fixture.store.read();
  assert.equal(env.fixture.store.inspect(db => db.prepare('SELECT count(*) AS n FROM recharge_orders').get().n), 0);
  assert.equal(env.fixture.store.inspect(db => db.prepare('SELECT count(*) AS n FROM activity_purchases').get().n), 0);
  assert.equal(env.fixture.store.inspect(db => db.prepare('SELECT count(*) AS n FROM role_skins').get().n), 0);
  assert.equal(state.resources.get('1054000'), undefined);
  assert.equal(env.wallet.snapshot().accounts[0].balance_cents, 100000);
});

test('BuySkin free claim, ETF tuple purchase and 16003 acknowledgement work over temporary TCP',
  { timeout: 15000 }, async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-buy-skin-gateway-'));
    let at = ACT_START * 1000 + 120000;
    const game = createLocalGame({
      databasePath: path.join(directory, 'game.sqlite'),
      statePath: path.join(directory, 'absent.json'),
      capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
      localWallet: true,
      serverOpenedAt: ACT_START,
      activityMode: 'schedule',
      currentFishingActivityId: 1074011,
      now: () => at,
      verifySession: (uid, code) => uid === 'buy-skin-user' && code === 'buy-skin-session'
    });
    setMission(game.store, 30203);
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
    const challenge = parseServerChallenge(await next());
    const key = 'ClientKey1234567';
    send(Buffer.concat([
      Buffer.from(key),
      localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
      challenge.rawFlags,
      Buffer.from('1.55.090365')
    ]));
    const request = async (type, seq, data) => {
      send(codec.pack('pb_c2s', { type, seq, data }));
      for (;;) {
        const frame = codec.unpack('pb_s2c', await next());
        if (Number(frame.seq) === Number(seq)) return frame;
      }
    };

    const login = await request(909103, 1, codec.pack('login', {
      server_id: 1, channel_uid: 'buy-skin-user', verify_code: 'buy-skin-session', channel_extra: ''
    }));
    const loginFlow = await decodeEtf(Buffer.from(login.data, 'base64'));
    assert.equal(Number(loginFlow[0]), 1);
    const loginModules = new Map(loginFlow[2].value.map(([id, entry]) => [Number(id), entry]));
    const featureEntry = loginModules.get(3);
    assert.ok(featureEntry, `login module IDs: ${[...loginModules.keys()].join(',')}`);
    const featureBytes = featureEntry.value ?? featureEntry;
    const featureLogin = codec.unpack(
      'res_fun_open_login',
      Buffer.isBuffer(featureBytes) ? Buffer.from(featureBytes) : Buffer.from(featureBytes.value ?? featureBytes)
    );
    const opened = new Set();
    for (const target of featureLogin.target_list ?? []) {
      const bytes = Buffer.from(target.fun_open_state ?? '', 'base64');
      for (let index = 0; index < bytes.length * 8; index++) {
        if (bytes[Math.floor(index / 8)] & (128 >> (index % 8))) {
          opened.add(Number(target.target_tid) * 1000 + index);
        }
      }
    }
    assert.equal(opened.has(1514), true);

    const accountId = game.wallet.accountId;
    game.wallet.credit({ account_id: accountId, amount_cents: 100000, request_id: 'tcp-buy-skin-credit' });

    const free = await request(104001, 2, codec.pack('pb_buy_skin_free_req', {
      act_id: ACT_ID, item_id: 1
    }));
    assert.equal(free.err, undefined);
    const freeResult = codec.unpack('pb_res_to_client', Buffer.from(free.data, 'base64'));
    assert.equal(Number(freeResult.changes[0].tid), 101500);
    assert.equal(freeResult.changes[0].diff_num, '50');

    const charged = await request(16004, 3, await encodeEtf([1180001, [ACT_ID, 1], 0]));
    assert.equal(charged.err, undefined);
    const success = codec.unpack('res_recharge_success', Buffer.from(charged.data, 'base64'));
    assert.equal(Number(success.recharge_id), 1180001);
    assert.ok(success.order);
    assert.equal(success.extra_ret_list.some(row => Number(row.flag) === 106), true);

    const acknowledged = await request(16003, 4, await encodeEtf(success.order));
    assert.equal(acknowledged.err, undefined);
    assert.equal(game.store.inspect(db => db.prepare(
      'SELECT acknowledged FROM recharge_orders WHERE order_id=?'
    ).get(success.order).acknowledged), 1);
    assert.equal(game.store.inspect(db => db.prepare(
      'SELECT count(*) AS n FROM activity_purchases WHERE product_id=1180001'
    ).get().n), 1);
    assert.equal(game.wallet.snapshot().accounts[0].balance_cents, 100000 - 32800);
  });
