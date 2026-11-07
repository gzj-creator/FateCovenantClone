import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readDiamondBankActTables } from '../config/diamond-bank-act-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { createDiamondBankActService } from '../game/diamond-bank-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const bankTables = readDiamondBankActTables();
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 1059001;
const VERSION = 1;
const ACT_ITEM = 820902;
const DIAMOND = 101500;
const TASK_TYPE = 110201;
const AWARD_TYPE = 110202;
const BUY_TYPE = 110203;
const actWindow = activityWindow(tables.ActFrameAct.get(ACT_ID), SERVER_OPENED_AT);
const DAY_ONE = actWindow.start + 3600;
const DAY_TWO = DAY_ONE + 86400;

const roleStatistics = [...tables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setStatistic(store, statisticType, id, total) {
  const index = roleStatistics.findIndex(row => Number(row.tid) === statisticType);
  assert.ok(index >= 0, `statistics slot ${statisticType} exists`);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value));
    module.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: String(id), total: String(total) }]
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function setup(t, { nowSeconds = DAY_ONE, serviceCodec = codec, running = () => true } = {}) {
  let clock = nowSeconds;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-diamond-bank-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => clock * 1000
  });
  const make = () => createDiamondBankActService({
    store: fixture.store,
    codec: serviceCodec,
    tables,
    diamondBankTables: bankTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open', isActivityRunning: running },
    now: () => clock * 1000,
    logger: () => {}
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return make(); },
    setTime(value) { clock = value; },
    reopen() { return fixture.open(); }
  };
}

function seedDiamonds(store, amount = 5000) {
  store.transaction(model => grantResources(model, [[DIAMOND, amount]], tables));
}

function activityOf(store) {
  const module = new Map(store.state().modules.value).get(92);
  return codec.unpack('pb_act_login', rawBinary(module));
}

function loginEntry(store, actId = ACT_ID) {
  return (activityOf(store).act_list ?? []).find(entry => Number(entry.state_data?.act_id) === actId);
}

function entryPayload(store, actId = ACT_ID) {
  const entry = loginEntry(store, actId);
  assert.ok(entry, 'diamond bank login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return codec.unpack('pb_diamond_bank_act_role_data', raw.subarray(6));
}

function open(service, actId = ACT_ID) {
  const result = service.execute(BUY_TYPE, null, actId);
  return { result, value: codec.unpack('pb_res_to_client', result.data) };
}

function award(service, actId = ACT_ID) {
  const result = service.execute(AWARD_TYPE, null, actId);
  return { result, value: codec.unpack('pb_res_to_client', result.data) };
}

function claimTasks(service, ids, actId = ACT_ID) {
  const data = codec.pack('pb_diamond_bank_act_base_req', { act_id: String(actId), value: ids.map(String) });
  const result = service.execute(TASK_TYPE, data);
  return { result, value: codec.unpack('pb_diamond_bank_act_task_rsp', result.data) };
}

test('DiamondBankActTable extraction exposes the shipped activity family', () => {
  assert.equal(bankTables.ver.size, 1);
  assert.equal(bankTables.liveTasks.size, 14);
  assert.equal(bankTables.verRecharges.size, 5);
  const ver = bankTables.ver.get(VERSION);
  assert.equal(ver.act_item, ACT_ITEM);
  assert.equal(ver.add_item, DIAMOND);
  assert.deepEqual(ver.open_use_item, [[DIAMOND, 1000]]);
  assert.equal(ver.max_limit, 10000);
  assert.equal(ver.rage, 10000);
  assert.deepEqual(bankTables.liveTasks.get(101), {
    tid: 101, ver: 1, type: 4701, keep_type: 0, target_count: 50,
    task_param: 0, award: [[ACT_ITEM, 50]], priority: 101, group: 1
  });
  assert.deepEqual(bankTables.liveTasks.get(110).award, [[ACT_ITEM, 3000]]);
  assert.equal(bankTables.liveTasks.get(110).keep_type, 1);
  assert.deepEqual(bankTables.discountGiftByVersion.get(VERSION).map(row => row.tid), [5]);
});

test('login sync publishes the diamond bank role data inside module 92', t => {
  const { store } = setup(t);
  const service = setup(t).service;
  const activity = activityOf(store);
  const synced = service.synchronizeLogin(activity, DAY_ONE);
  assert.equal(synced.actId, ACT_ID);
  assert.equal(synced.version, VERSION);
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === ACT_ID);
  assert.ok(entry);
  assert.equal(Number(entry.state_data.cur_state_id), 50);
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  const payload = codec.unpack('pb_diamond_bank_act_role_data', raw.subarray(6));
  assert.equal(Number(payload.act_tid), ACT_ID);
  assert.ok(!payload.is_buy);
  assert.ok(!payload.is_get);
  assert.deepEqual(payload.task_get, []);
});

test('DiamondBankActCmd 110203 charges open_use_item and records is_buy', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  assert.equal(Number(resource(harness.store, DIAMOND)), 5000);

  const { value } = open(service);
  assert.deepEqual(
    value.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[DIAMOND, -1000], [ACT_ITEM, 1000]]
  );
  assert.equal(Number(resource(harness.store, DIAMOND)), 4000);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);

  const stored = harness.store.read();
  assert.equal(entryPayload(harness.store).is_buy, true);

  // A repeated open is acknowledged without a second charge.
  const again = open(service);
  assert.deepEqual(again.value.changes, []);
  assert.equal(Number(resource(harness.store, DIAMOND)), 4000);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);
  assert.ok(stored);
});

test('DiamondBankActCmd 110203 fails closed without the configured cost', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store, 999);
  assert.throws(() => open(service), error => error.code === 301);
  assert.equal(Number(resource(harness.store, DIAMOND)), 999);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 0);
  assert.equal(harness.store.inspect(db => Number(
    db.prepare('SELECT COUNT(*) AS count FROM diamond_bank_role_state').get().count
  )), 0);
});

test('DiamondBankActCmd 110201 requires an opened bank before claiming tasks', t => {
  const harness = setup(t);
  const service = harness.service;
  setStatistic(harness.store, 29, '1', 5000);
  assert.throws(() => claimTasks(service, [101]), error => error.code === 311);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 0);
});

test('DiamondBankActCmd 110201 grants the configured award and records the claim', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  setStatistic(harness.store, 29, '1', 60);

  const { value } = claimTasks(service, [101]);
  assert.deepEqual(
    value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[ACT_ITEM, 50]]
  );
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1050);
  const claimed = (value.role_data.task_get ?? []).map(entry => Number(entry.tid));
  assert.deepEqual(claimed, [101]);
  assert.equal(Number(value.role_data.task_get[0].get_time), DAY_ONE);
  assert.equal(value.role_data.is_buy, true);
  assert.ok(!value.role_data.is_get);

  // Daily tasks reset with the flush day; a same-day repeat is acked empty.
  const repeat = claimTasks(service, [101]);
  assert.deepEqual(repeat.value.res.changes, []);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1050);

  harness.setTime(DAY_TWO);
  const nextDay = claimTasks(service, [101]);
  assert.deepEqual(
    nextDay.value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[ACT_ITEM, 50]]
  );
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1100);
});

test('DiamondBankActCmd 110201 rejects an unfinished task and an unknown task', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  setStatistic(harness.store, 29, '1', 10);

  assert.throws(() => claimTasks(service, [101]), error => error.code === 311);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);

  const unknown = codec.pack('pb_diamond_bank_act_base_req', { act_id: String(ACT_ID), value: ['999'] });
  assert.throws(() => service.execute(TASK_TYPE, unknown), error => error.code === 5);
});

test('DiamondBankActCmd 110201 keeps unevidenced progress tasks unavailable', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  assert.throws(
    () => claimTasks(service, [105]),
    error => error.code === 5 && /progress_fun 464/.test(error.message)
  );
  assert.throws(
    () => claimTasks(service, [107]),
    error => error.code === 5 && /progress_fun 463/.test(error.message)
  );
  assert.throws(
    () => claimTasks(service, [111]),
    error => error.code === 5 && /progress_fun 13/.test(error.message)
  );
  // Task 103 reads Core custom_login statistics slot 21, which the personal
  // server cannot rebuild from the module-21 block.
  assert.throws(
    () => claimTasks(service, [103]),
    error => error.code === 5 && /custom statistics slot 21/.test(error.message)
  );
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);
});

test('DiamondBankActCmd 110202 pays the deposit out once and consumes it', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  setStatistic(harness.store, 29, '1', 60);
  claimTasks(service, [101]);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1050);

  const { value } = award(service);
  assert.deepEqual(
    value.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[ACT_ITEM, -1050], [DIAMOND, 1050]]
  );
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 0);
  assert.equal(Number(resource(harness.store, DIAMOND)), 5050);
  assert.equal(entryPayload(harness.store).is_get, true);

  const again = award(service);
  assert.deepEqual(again.value.changes, []);
  assert.equal(Number(resource(harness.store, DIAMOND)), 5050);
});

test('DiamondBankActCmd 110202 fails closed without an opened bank or a deposit', t => {
  const harness = setup(t);
  const service = harness.service;
  assert.throws(() => award(service), error => error.code === 311);

  seedDiamonds(harness.store);
  harness.store.transaction(model => {
    model.resources.delete(String(ACT_ITEM));
  });
  open(service);
  harness.store.transaction(model => {
    model.resources.get(String(ACT_ITEM)).num = '0';
  });
  assert.throws(() => award(service), error => error.code === 311);
});

test('PB encoding failure rolls the claim back', t => {
  const failingCodec = {
    ...codec,
    pack: (name, value) => {
      if (name === 'pb_diamond_bank_act_task_rsp') throw new Error('encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  setStatistic(harness.store, 29, '1', 60);
  const failing = createDiamondBankActService({
    store: harness.store,
    codec: failingCodec,
    tables,
    diamondBankTables: bankTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open' },
    now: () => DAY_ONE * 1000,
    logger: () => {}
  });
  assert.throws(() => claimTasks(failing, [101]), /encode failure/);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);
  assert.equal(entryPayload(harness.store).task_get.length, 0);
});

test('SQLite write failure rolls the claim back', t => {
  const harness = setup(t);
  const service = harness.service;
  seedDiamonds(harness.store);
  open(service);
  setStatistic(harness.store, 29, '1', 60);
  harness.store.inspect(db => db.exec(
    "CREATE TRIGGER reject_diamond_bank_state BEFORE INSERT ON diamond_bank_role_state BEGIN SELECT RAISE(ABORT, 'Injected diamond bank storage failure'); END"
  ));
  assert.throws(() => claimTasks(service, [101]), /Injected diamond bank storage failure/);
  assert.equal(Number(resource(harness.store, ACT_ITEM)), 1000);
  assert.equal(entryPayload(harness.store).task_get.length, 0);
});

test('the configured activity window gates every command', t => {
  const harness = setup(t, { running: () => false });
  const service = harness.service;
  seedDiamonds(harness.store);
  assert.throws(() => open(service), error => error.code === 309);
  assert.throws(() => award(service), error => error.code === 309);
  const data = codec.pack('pb_diamond_bank_act_base_req', { act_id: String(ACT_ID), value: ['101'] });
  assert.throws(() => service.execute(TASK_TYPE, data), error => error.code === 309);
});

