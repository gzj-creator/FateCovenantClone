import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createAccRechargeService } from '../game/acc-recharge-service.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const WINDOW = activityWindow(tables.ActFrameAct.get(106036), SERVER_OPENED_AT);
const dayIndex = timestampSeconds => Math.floor((timestampSeconds + 10800) / 86400);
const startDay = dayIndex(WINDOW.start);
const endDay = dayIndex(WINDOW.end);

function setRechargeRecords(store, records, total = records.reduce((sum, row) => sum + row.amount, 0)) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const raw = modules.get(19) ? rawBinary(modules.get(19)) : Buffer.alloc(0);
    const login = raw.length ? codec.unpack('res_recharge_login', raw) : {};
    login.total_amount = total;
    login.recharge_record = { recent_record: records, total_day: records.length };
    modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
    model.state.modules.value = [...modules];
  });
}

function setAwardState(store, actId, bytes) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = codec.unpack('pb_acc_recharge_list', rawBinary(modules.get(106)));
    let row = data.list.find(entry => Number(entry.act_id) === actId);
    if (!row) {
      row = { act_id: actId, award_state: '' };
      data.list.push(row);
    }
    row.award_state = bytes.toString('base64');
    modules.set(106, serializedBinary(codec.pack('pb_acc_recharge_list', data)));
    model.state.modules.value = [...modules];
  });
}

function loginActivity(store) {
  return codec.unpack('pb_act_login', rawBinary(new Map(store.state().modules.value).get(92)));
}

function unwrapActivityLoginData(value) {
  const bytes = Buffer.from(String(value ?? ''), 'base64');
  assert.equal(bytes[0], 0x83);
  assert.equal(bytes[1], 0x6d);
  assert.equal(bytes.length, bytes.readUInt32BE(2) + 6);
  return bytes.subarray(6);
}

function setup(t, initialTables = tables, calendarMode = null) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-acc-recharge-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
  const calendar = { serverOpenedAt: SERVER_OPENED_AT, ...(calendarMode ? { mode: calendarMode } : {}) };
  let activeTables = initialTables;
  const logs = [];
  const make = () => createAccRechargeService({ store, codec, tables: activeTables, calendar, logger: event => logs.push(event) });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    get logs() { return logs; },
    setRechargeRecords: (records, total) => setRechargeRecords(store, records, total),
    reopen(nextTables = activeTables) {
      store.close();
      activeTables = nextTables;
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
      service = make();
    }
  };
}

function unsupportedFeatureTables() {
  const items = new Map(tables.Item);
  const types = new Map(tables.Type);
  types.set(999001, { ...tables.Type.get(191), tid: 999001, obj_class: { reference: 'UnsupportedElves' } });
  types.set(999002, { ...tables.Type.get(244), tid: 999002, obj_class: { reference: 'UnsupportedSpiritCourtyard' } });
  for (const id of [400420, 10014100]) {
    items.set(id, { ...items.get(id), type: id === 400420 ? 999001 : 999002 });
  }
  return { ...tables, Item: items, Type: types };
}

const claim = (service, awardTid = 36001101, actId = 106036) => service.execute(
  codec.pack('pb_acc_recharge_award_req', { act_id: actId, award_tid: awardTid })
);

test('cumulative recharge claims persist award slots and grant configured rewards', t => {
  const e = setup(t);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  let result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '10');
  result = claim(e.service, 36001101);
  assert.deepEqual(codec.unpack('pb_res_to_client', result.data).changes, []);
  result = claim(e.service, 36001102);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '10');
  result = claim(e.service, 36001103);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '15');
  assert.throws(() => claim(e.service, 36001104), x => x.code === 311);

  let module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  let row = module.list.find(x => Number(x.act_id) === 106036);
  let state = Buffer.from(row.award_state, 'base64');
  assert.deepEqual([...state.subarray(0, 4)], [0x70, 0, 0, 0]);
  assert.equal(hasBit(state, 1), true);
  assert.equal(hasBit(state, 2), true);
  assert.equal(hasBit(state, 3), true);
  assert.equal(hasBit(state, 4), false);
  assert.equal(state.length, 100);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 3);

  e.reopen();
  result = claim(e.service, 36001101);
  assert.deepEqual(codec.unpack('pb_res_to_client', result.data).changes, []);
  module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  row = module.list.find(x => Number(x.act_id) === 106036);
  assert.equal(hasBit(Buffer.from(row.award_state, 'base64'), 3), true);
});

test('cumulative recharge compares cent thresholds without a second conversion', t => {
  const e = setup(t);
  assert.equal(tables.AccRechargeAward.get(36001101).acc_cnt, 6800);

  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 6799 }]);
  assert.throws(() => claim(e.service, 36001101), error => error.code === 311);

  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 6800 }]);
  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('every configured award tier in the active cumulative-recharge version uses cents', t => {
  // Replace reward payloads so this test isolates threshold calculation from
  // resource families whose dedicated inventory handlers are not implemented.
  const thresholdTables = {
    ...tables,
    AccRechargeAward: new Map([...tables.AccRechargeAward].map(([awardTid, award]) => [
      awardTid,
      { ...award, award: [[807002, 1]] }
    ]))
  };
  const e = setup(t, thresholdTables);
  const awards = [...tables.AccRechargeAward.values()]
    .filter(award => Number(award.version) === 36)
    .sort((a, b) => Number(a.tid) - Number(b.tid));
  const maximum = Math.max(...awards.map(award => Number(award.acc_cnt)));
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: maximum }]);

  for (const award of awards) claim(e.service, award.tid);

  const module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const state = Buffer.from(module.list.find(row => Number(row.act_id) === 106036).award_state, 'base64');
  assert.equal(state.length, 100);
  for (const award of awards) assert.equal(hasBit(state, Number(award.tid) % 100), true);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), awards.length);
});

test('cumulative recharge uses inclusive activity-window records instead of lifetime total', t => {
  const e = setup(t);
  e.setRechargeRecords([
    { day_index: startDay - 1, recharge_ids: [11], amount: 20000 },
    { day_index: startDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay, recharge_ids: [11], amount: 3399 },
    { day_index: endDay + 1, recharge_ids: [11], amount: 20000 }
  ], 50000);
  assert.throws(() => claim(e.service, 36001101), error => error.code === 311);

  e.setRechargeRecords([
    { day_index: startDay - 1, recharge_ids: [11], amount: 20000 },
    { day_index: startDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay + 1, recharge_ids: [11], amount: 20000 }
  ], 50000);
  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('all-open cumulative recharge uses account-wide records for a future-scheduled activity', t => {
  const e = setup(t, tables, 'all-open');
  const award = tables.AccRechargeAward.get(37001105);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: Number(award.acc_cnt) }]);
  const result = claim(e.service, 37001105, 106037);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '494002').diff_num, '10');
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM activity_claims WHERE act_id=106037 AND task_id=37001105 AND period='v37'").get().n), 1);
});

test('all-open login exposes a populated date range for cumulative recharge progress', async t => {
  const e = setup(t, tables, 'all-open');
  setAwardState(e.store, 106036, Buffer.alloc(100));
  setAwardState(e.store, 106037, Buffer.alloc(100));
  const activity = loginActivity(e.store);
  activity.act_list = activity.act_list.filter(entry => ![106036, 106037].includes(Number(entry.state_data?.act_id)));
  activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
    const states_data = (group.states_data ?? []).filter(state => ![106036, 106037].includes(Number(state.act_id)));
    return states_data.length ? [{ ...group, states_data }] : [];
  });
  const at = WINDOW.start + 3600;
  const record = { day_index: dayIndex(SERVER_OPENED_AT), recharge_ids: [11], amount: 6800 };
  e.setRechargeRecords([record]);

  await e.service.synchronizeLogin(activity, at);
  const entries = activity.act_list.filter(entry => [106036, 106037].includes(Number(entry.state_data?.act_id)));
  assert.equal(entries.length, 2);
  for (const entry of entries) {
    const rangeStartDay = dayIndex(Number(entry.state_data.history_time[0].enter_time));
    const rangeEndDay = dayIndex(at);
    assert.equal(rangeStartDay, dayIndex(SERVER_OPENED_AT));
    assert.equal(rangeStartDay <= record.day_index && record.day_index <= rangeEndDay, true);
  }

  // A payload persisted before this fix may already contain the future
  // scheduled start. Login synchronization must repair that stale value too.
  for (const entry of entries) entry.state_data.history_time[0].enter_time = WINDOW.start;
  await e.service.synchronizeLogin(activity, at);
  for (const id of [106036, 106037]) {
    const entry = activity.act_list.find(candidate => Number(candidate.state_data?.act_id) === id);
    assert.equal(Number(entry.state_data.history_time[0].enter_time), SERVER_OPENED_AT);
  }
});

test('wallet purchases accumulate in the 98620 activity day range', t => {
  const e = setup(t);
  const wallet = createWalletService({ store: e.store, codec, tables, now: () => WINDOW.start });
  wallet.credit({ account_id: 'local-1', amount_cents: 6800, request_id: 'acc-range-fund' });
  const purchase = wallet.buy({ account_id: 'local-1', product_id: 113, request_id: 'acc-range-buy' });
  assert.equal(purchase.price_cents, 6800);

  const login = codec.unpack('res_recharge_login', rawBinary(new Map(e.store.state().modules.value).get(19)));
  assert.equal(login.total_amount, 6800);
  assert.deepEqual(login.recharge_record.recent_record, [{ recharge_ids: [113], day_index: startDay, amount: 6800 }]);

  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('repairs legacy byte-index award states from persisted claims', t => {
  const e = setup(t);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  claim(e.service, 36001101);
  claim(e.service, 36001102);
  claim(e.service, 36001103);

  const legacy = Buffer.alloc(100);
  legacy[0] = 1;
  legacy[1] = 1;
  legacy[2] = 1;
  setAwardState(e.store, 106036, legacy);

  e.reopen();
  const module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const row = module.list.find(x => Number(x.act_id) === 106036);
  const state = Buffer.from(row.award_state, 'base64');
  assert.deepEqual([...state.subarray(0, 4)], [0x70, 0, 0, 0]);
  assert.equal(hasBit(state, 1), true);
  assert.equal(hasBit(state, 2), true);
  assert.equal(hasBit(state, 3), true);
  const duplicate = claim(e.service, 36001101);
  assert.deepEqual(codec.unpack('pb_res_to_client', duplicate.data).changes, []);
});

test('login synchronizes cumulative recharge award bits into activity module 92', async t => {
  const e = setup(t);
  setAwardState(e.store, 106036, Buffer.from([0x70, 0, 0, 0]));
  setAwardState(e.store, 106037, Buffer.from([0x78, 0, 0, 0]));
  const activity = loginActivity(e.store);
  activity.act_list = activity.act_list.filter(entry => ![106036, 106037].includes(Number(entry.state_data?.act_id)));
  activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
    const states_data = (group.states_data ?? []).filter(state => ![106036, 106037].includes(Number(state.act_id)));
    return states_data.length ? [{ ...group, states_data }] : [];
  });

  const result = await e.service.synchronizeLogin(activity, SERVER_OPENED_AT);
  assert.deepEqual(result.activityIds, [106036, 106037]);
  assert.equal(activity.act_list.filter(entry => Number(entry.state_data?.act_id) === 106036).length, 1);
  assert.equal(activity.act_list.filter(entry => Number(entry.state_data?.act_id) === 106037).length, 1);
  const first = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 106036);
  const second = activity.act_list.find(entry => Number(entry.state_data?.act_id) === 106037);
  assert.equal(Number(first.state_data.cur_state_id), 50);
  assert.equal(Number(first.state_data.history_time[0].state_id), 50);
  assert.equal(Number(second.state_data.cur_state_id), 50);
  assert.deepEqual(
    [...Buffer.from(codec.unpack('pb_acc_recharge', unwrapActivityLoginData(first.module_login_data)).award_state, 'base64').subarray(0, 4)],
    [0x70, 0, 0, 0]
  );
  assert.deepEqual(
    [...Buffer.from(codec.unpack('pb_acc_recharge', unwrapActivityLoginData(second.module_login_data)).award_state, 'base64').subarray(0, 4)],
    [0x78, 0, 0, 0]
  );

  const roundTrip = codec.unpack('pb_act_login', codec.pack('pb_act_login', activity));
  assert.equal(roundTrip.act_list.filter(entry => [106036, 106037].includes(Number(entry.state_data?.act_id))).length, 2);

  await e.service.synchronizeLogin(activity, SERVER_OPENED_AT);
  assert.equal(activity.act_list.filter(entry => [106036, 106037].includes(Number(entry.state_data?.act_id))).length, 2);
});

test('648 tier grants supported inventory and retains feature-domain rewards', t => {
  const e = setup(t, unsupportedFeatureTables());
  const award = tables.AccRechargeAward.get(37001105);
  assert.deepEqual(award.award, [[400420, 1], [494002, 10], [10014100, 1]]);
  const activity = tables.ActFrameAct.get(106037);
  const range = activityWindow(activity, SERVER_OPENED_AT);
  e.setRechargeRecords([{ day_index: dayIndex(range.start), recharge_ids: [11], amount: Number(award.acc_cnt) }]);
  const before = BigInt(e.store.inspect(db => db.prepare("SELECT amount FROM resources WHERE tid='494002'").get()?.amount ?? '0'));

  let result = claim(e.service, 37001105, 106037);
  let changes = codec.unpack('pb_res_to_client', result.data).changes;
  assert.deepEqual(
    changes.map(change => ({ tid: change.tid, new_num: change.new_num, diff_num: change.diff_num })),
    [{ tid: '494002', new_num: String(before + 10n), diff_num: '10' }]
  );
  const after = BigInt(e.store.inspect(db => db.prepare("SELECT amount FROM resources WHERE tid='494002'").get().amount));
  assert.equal(after, before + 10n);
  assert.deepEqual(e.store.inspect(db => db.prepare(
    'SELECT item_tid,quantity,res_type,status FROM pending_rewards ORDER BY item_tid'
  ).all().map(row => ({ ...row }))), [
    { item_tid: 400420, quantity: 1, res_type: 20, status: 'pending' },
    { item_tid: 10014100, quantity: 1, res_type: 4100, status: 'pending' }
  ]);
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM resources WHERE tid IN ('400420','10014100')").get().n), 0);
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM activity_claims WHERE act_id=106037 AND task_id=37001105 AND period='v37'").get().n), 1);
  let module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const state = Buffer.from(module.list.find(row => Number(row.act_id) === 106037).award_state, 'base64');
  assert.equal(hasBit(state, 5), true);

  result = claim(e.service, 37001105, 106037);
  assert.deepEqual(codec.unpack('pb_res_to_client', result.data).changes, []);
  assert.equal(BigInt(e.store.inspect(db => db.prepare("SELECT amount FROM resources WHERE tid='494002'").get().amount)), after);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM pending_rewards').get().n), 2);

  e.reopen();
  assert.equal(e.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 15);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM pending_rewards').get().n), 2);
  result = claim(e.service, 37001105, 106037);
  assert.deepEqual(codec.unpack('pb_res_to_client', result.data).changes, []);
});

test('pending feature-domain rewards move to inventory once their handler is supported', t => {
  const e = setup(t, unsupportedFeatureTables());
  const award = tables.AccRechargeAward.get(37001105);
  const range = activityWindow(tables.ActFrameAct.get(106037), SERVER_OPENED_AT);
  e.setRechargeRecords([{ day_index: dayIndex(range.start), recharge_ids: [11], amount: Number(award.acc_cnt) }]);
  claim(e.service, 37001105, 106037);

  e.reopen(tables);
  assert.equal(e.logs.some(event => event.event === 'acc_recharge_pending_rewards_released'), true);
  assert.deepEqual(e.store.inspect(db => db.prepare(
    'SELECT item_tid,status FROM pending_rewards ORDER BY item_tid'
  ).all().map(row => ({ ...row }))), [
    { item_tid: 400420, status: 'released' },
    { item_tid: 10014100, status: 'released' }
  ]);
  const duplicate = claim(e.service, 37001105, 106037);
  assert.deepEqual(codec.unpack('pb_res_to_client', duplicate.data).changes, []);
});

test('invalid configured reward rolls back claim, module, resources, and pending rows', t => {
  const brokenTables = {
    ...tables,
    AccRechargeAward: new Map([...tables.AccRechargeAward].map(([awardTid, award]) => [
      awardTid,
      Number(awardTid) === 36001101 ? { ...award, award: [[999999999, 1]] } : award
    ]))
  };
  const e = setup(t, brokenTables);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  assert.throws(() => claim(e.service, 36001101), error => error.code === 5);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 0);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM pending_rewards').get().n), 0);
  const module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const row = module.list.find(row => Number(row.act_id) === 106036);
  assert.equal(row ? hasBit(Buffer.from(row.award_state, 'base64'), 1) : false, false);
});

test('real gateway routes 98620 instead of returning LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-acc-recharge-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    localWallet: true,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => (WINDOW.start + 3600) * 1000,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  setRechargeRecords(game.store, [{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const response = await request(98620, 2, codec.pack('pb_acc_recharge_award_req', { act_id: 106036, award_tid: 36001101 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes.find(x => x.tid === '807002').diff_num, '10');
});
