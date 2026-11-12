import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readActShopTables } from '../config/act-shop-tables.mjs';
import { createActShopService } from '../game/act-shop-service.mjs';
import { wrapEtfBinary } from '../game/etf-binary.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const actShopTables = readActShopTables();
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');

function emptyActivity() {
  return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
}

function stubStore(activity, modules = null) {
  let current = modules ?? new Map([[92, serializedBinary(codec.pack('pb_act_login', activity))]]);
  return {
    state: () => ({ modules: { value: structuredClone(current), improper: false } }),
    transaction(run) {
      const model = { state: { modules: { value: structuredClone(current), improper: false } } };
      const result = run(model, {});
      current = model.state.modules.value;
      return result;
    },
    modules: () => current
  };
}

function frameTables(extraFrames = []) {
  const selected = new Map();
  for (const actId of [182007, 182001, ...extraFrames]) {
    selected.set(actId, gameTables.ActFrameAct.get(actId));
  }
  const types = new Map([
    [182, gameTables.ActFrameType.get(182)],
    [187, gameTables.ActFrameType.get(187)],
    [189, gameTables.ActFrameType.get(189)]
  ]);
  return { ...gameTables, ActFrameAct: selected, ActFrameType: types };
}

function serviceFor(store, {
  tables = frameTables(),
  giftTables = actShopTables,
  running = new Set([182007])
} = {}) {
  return createActShopService({
    store,
    codec,
    tables,
    actShopTables: giftTables,
    calendar: {
      isActivityRunning: actId => running.has(Number(actId))
    },
    now: () => BASE_MS,
    logger: () => {}
  });
}

function decodedEntry(entry) {
  const wrapped = Buffer.from(entry.module_login_data, 'base64');
  return codec.unpack('pb_act_shop_db_info', wrapped.subarray(6));
}

test('ActShop assets preserve the verified frame/version and reward rows', () => {
  assert.equal(actShopTables.Goods.size, 1588);
  assert.equal(actShopTables.MultiLevel.size, 152);
  assert.equal(actShopTables.ActShop.size, 84);
  assert.equal(actShopTables.shopsByVersion.get(7).buyItem, 818602);
  assert.ok(actShopTables.goodsByVersion.get(7).length > 0);
  assert.equal(actShopTables.goodsByVersion.get(7)[0].version, 7);
  assert.equal(Number(gameTables.ActFrameType.get(182).big_type), 6);
  assert.equal(gameTables.ActFrameType.get(182).lua_module.reference, 'ActShopMgr');
  assert.equal(gameTables.ActFrameType.get(182).lua_entity.reference, 'ActShopData');
});

test('login sync creates ETF/protobuf state and preserves existing shop progress', () => {
  const version1Goods = actShopTables.goodsByVersion.get(1)[0];
  const version1Level = actShopTables.multiLevelByVersion.get(1).find(row => row.award.length > 0);
  const activity = emptyActivity();
  const existing = {
    act_tid: '182001',
    goods_list: [{ goods_id: String(version1Goods.tid), goods_tid: String(version1Goods.goodsTid), count: String(version1Goods.count), times: '2' }],
    history_tid: String(version1Level.tid),
    claimed_tid_list: [String(version1Level.tid)]
  };
  activity.act_list.push({ state_data: { act_id: 182001 }, module_login_data: wrapEtfBinary(codec.pack('pb_act_shop_db_info', existing)).toString('base64') });
  const store = stubStore(activity);
  const service = serviceFor(store, { running: new Set([182001, 182007]) });

  const synced = service.synchronizeLogin(activity, Math.floor(BASE_MS / 1000));
  assert.deepEqual(synced.activityIds, [182001, 182007]);
  assert.deepEqual(synced.created, [182007]);
  assert.deepEqual(synced.missingConfiguration, []);
  const entries = activity.act_list;
  assert.equal(entries.length, 2);
  assert.ok(entries.every(entry => Buffer.from(entry.module_login_data, 'base64').subarray(0, 2).equals(Buffer.from([0x83, 0x6d]))));
  assert.deepEqual(decodedEntry(entries.find(entry => Number(entry.state_data.act_id) === 182001)), existing);
  const emptyState = decodedEntry(entries.find(entry => Number(entry.state_data.act_id) === 182007));
  assert.equal(Number(emptyState.act_tid), 182007);
  assert.deepEqual(emptyState.goods_list, []);
  assert.equal(Number(emptyState.history_tid ?? 0), 0);
  assert.deepEqual(emptyState.claimed_tid_list, []);
});

test('104801 returns every active frame for the requested version and no inactive rows', () => {
  const tables = frameTables();
  tables.ActFrameAct.set(182999, { ...gameTables.ActFrameAct.get(182007), tid: 182999, version: 7 });
  const store = stubStore(emptyActivity());
  const service = serviceFor(store, { tables, running: new Set([182007, 182999]) });
  const result = service.execute(104801, { version: '7' });
  const response = codec.unpack('pb_act_shop_info_rsp', result.data);
  assert.equal(response.is_act_open, true);
  assert.deepEqual(response.shop_list.map(row => Number(row.act_tid)), [182007, 182999]);
  assert.ok(response.shop_list.every(row => row.goods_list.length === 0));
  assert.deepEqual(result.value.activityIds, [182007, 182999]);

  const inactive = serviceFor(store, { tables, running: new Set() }).execute(104801, { version: 7 });
  const inactiveResponse = codec.unpack('pb_act_shop_info_rsp', inactive.data);
  assert.deepEqual(inactiveResponse.shop_list, []);
  assert.equal(Boolean(inactiveResponse.is_act_open), false);
});

test('104801 rejects malformed or out-of-version configuration without inventing a shop', () => {
  const invalidVersionStore = stubStore(emptyActivity());
  const invalidVersion = serviceFor(invalidVersionStore);
  assert.throws(() => invalidVersion.execute(104801, { version: 0 }), error => error?.code === 1);

  const shopsByVersion = new Map([...actShopTables.shopsByVersion].filter(([version]) => version !== 7));
  const goodsByVersion = new Map([...actShopTables.goodsByVersion].filter(([version]) => version !== 7));
  const missingTable = serviceFor(stubStore(emptyActivity()), {
    giftTables: { ...actShopTables, shopsByVersion, goodsByVersion }
  });
  assert.throws(() => missingTable.execute(104801, { version: 7 }), error => error?.code === 5 && /configuration/.test(error.message));

  const corruptActivity = emptyActivity();
  corruptActivity.act_list.push({ state_data: { act_id: 182007 }, module_login_data: wrapEtfBinary(Buffer.from([0xff, 0xff])).toString('base64') });
  const corrupt = serviceFor(stubStore(corruptActivity));
  assert.throws(() => corrupt.execute(104801, { version: 7 }), error => error?.code === 5 && /login data is invalid/.test(error.message));

  const noPlayerData = serviceFor(stubStore(emptyActivity(), new Map()));
  assert.throws(() => noPlayerData.execute(104801, { version: 7 }), error => error?.code === 5 && /unavailable/.test(error.message));
});

function game(directory, logger) {
  return createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    activityMode: 'all-open',
    now: () => BASE_MS,
    logger
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
  t.after(() => socket.destroy());
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
  return { request, modules: new Map(decoded[2].value) };
}

test('gateway routes 104801 before benefit-commerce and keeps 104802/104803 fail-closed', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-act-shop-gateway-'));
  const events = [];
  const instance = game(directory, event => events.push(event));
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const { request, modules } = await connect(t, instance);

  const module = modules.get(92);
  const loginActivity = codec.unpack('pb_act_login', Buffer.from(module?.value?.data ?? module?.value ?? []));
  assert.ok(loginActivity.act_list.some(entry => Number(entry.state_data?.act_id) === 182007));
  assert.ok(events.some(event => event.event === 'act_shop_login_synced' && event.activityIds.includes(182007)));

  const read = await request(104801, codec.pack('pb_act_shop_info_req', { version: 7 }));
  assert.equal(read.err, undefined);
  const response = codec.unpack('pb_act_shop_info_rsp', Buffer.from(read.data, 'base64'));
  assert.equal(response.is_act_open, true);
  assert.ok(response.shop_list.some(row => Number(row.act_tid) === 182007));
  assert.equal(events.some(event => event.type === 104801 && String(event.event).startsWith('benefit_')), false);
  assert.ok(events.some(event => event.event === 'act_shop_committed' && event.type === 104801));

  const buy = await request(104802, codec.pack('pb_act_buy_goods_req', { act_tid: 182007, goods_tid: 102, count: 1 }));
  assert.equal(buy.err.err, 5);
  const claim = await request(104803, codec.pack('pb_act_shop_level_rewards_req', { act_tid: 182007, shop_level_tid: 1 }));
  assert.equal(claim.err.err, 5);
  assert.equal(events.filter(event => event.event === 'benefit_command_refused' && [104802, 104803].includes(event.type)).length, 2);

  const malformed = await request(104801, Buffer.from([0xff]));
  assert.equal(malformed.err.err, 1);
});
