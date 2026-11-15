import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  createTaskAwardService,
  TASK_AWARD_ACTIVITY_FUNC,
  TASK_AWARD_ACTIVITY_ID,
  TASK_AWARD_COMMANDS
} from '../game/task-award-service.mjs';
import { readTaskAwardTables, TASK_AWARD_TABLE_SOURCE_SHA256 } from '../config/task-award-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { isGrantableResource } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readTaskAwardTables();
const gameTables = readGameTables();
const serverOpenedAt = '2026-10-24T05:00:00+08:00';
const activity = gameTables.Activity.get(TASK_AWARD_ACTIVITY_ID);
const startSeconds = Math.floor(Date.parse('2026-11-25T05:00:00+08:00') / 1000);
const fixedNow = (startSeconds + 3600) * 1000;
const activityEnd = (startSeconds + 9998 * 86400) * 1000;

const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-task-award-',
    serverOpenedAt,
    now: () => fixedNow
  });
  let now = options.now ?? fixedNow;
  let service = createTaskAwardService({
    store: fixture.store,
    codec: options.codec ?? codec,
    tables,
    gameTables,
    serverOpenedAt,
    now: () => now
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    setNow(value) { now = value; },
    reopen(nextOptions = {}) {
      const store = fixture.open();
      service = createTaskAwardService({
        store,
        codec: nextOptions.codec ?? options.codec ?? codec,
        tables,
        gameTables,
        serverOpenedAt,
        now: () => nextOptions.now ?? now
      });
      return store;
    }
  };
}

function completeTask(store, tid) {
  const task = tables.tasks.get(tid);
  assert.ok(task);
  const typeConfig = gameTables.TaskType.get(task.type);
  assert.equal(typeConfig.progress_type, 2);
  const slot = roleStatistics.findIndex(row => Number(row.tid) === Number(typeConfig.data));
  assert.ok(slot >= 0, `statistics slot ${typeConfig.data} exists`);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value));
    module.value[slot + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: typeConfig.stat_expand.map(id => ({ id: String(id), total: String(task.target_count) }))
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function claimCount(store) {
  return store.inspect(db => Number(db.prepare('SELECT COUNT(*) AS count FROM task_award_claims').get().count));
}

function treasureChipCount(store, tid) {
  const modules = new Map(store.read().state.modules.value);
  const module = modules.get(534);
  assert.ok(module?.value?.[0], 'treasure module exists');
  const data = codec.unpack('pb_treasure_data', rawBinary(module.value[0]));
  return Number(data.treasure_list?.find(card => Number(card.tid) === tid)?.chip_num ?? 0);
}

function masterOf(service) {
  return codec.unpack('pb_task_award_master', service.loginPayload());
}

test('TaskAwardTable exposes the shipped activity family and awards', () => {
  assert.equal(TASK_AWARD_TABLE_SOURCE_SHA256, 'fb8e1788151b97eae71afda545ec266009f1c95795a6c6f0f64b7ea64896a21f');
  assert.equal(TASK_AWARD_ACTIVITY_FUNC, 19);
  assert.equal(TASK_AWARD_ACTIVITY_ID, 19001);
  assert.equal(activity.func, 19);
  assert.equal(activity.version, 1);
  assert.equal(activity.server_day, 33);
  assert.equal(activity.duration_day, 9998);
  assert.equal(tables.version, 1);
  assert.equal(tables.tasks.size, 263);
  assert.equal(tables.progress.size, 6);
  assert.deepEqual(tables.tasks.get(1001).award_list, [[701900, 10], [101500, 30]]);
  assert.equal(tables.tasks.get(1001).growth_value, 10);
  assert.deepEqual(tables.progress.get(101), {
    tid: 101,
    stage: 1,
    need_count: 600,
    award: 132417,
    award_n: 1,
    overdue_award: 0,
    overdue_award_n: 0
  });
  assert.deepEqual(
    [...new Set([...tables.tasks.values()].map(row => Number(row.type)))].sort((left, right) => left - right),
    [13802, 13803, 13804, 13805, 13806, 13807, 13808, 13809, 13810, 13811, 13812, 13814, 13815, 13816]
  );
  for (const task of tables.tasks.values()) {
    const type = gameTables.TaskType.get(Number(task.type));
    assert.ok(type, `task type ${task.type} exists`);
    assert.equal(type.progress_type, 2);
    assert.ok(Array.isArray(type.stat_expand));
    for (const [id] of task.award_list) assert.equal(isGrantableResource(id, gameTables), true, `task reward ${id} is grantable`);
  }
  for (const row of tables.progress.values()) {
    assert.equal(isGrantableResource(row.award, gameTables), true);
    assert.equal(row.overdue_award, 0);
    assert.equal(row.overdue_award_n, 0);
  }
});

test('login state starts empty, appears in the real activity window and survives reopening', t => {
  const harness = setup(t, { now: (startSeconds - 1) * 1000 });
  assert.deepEqual(masterOf(harness.service).data_list, []);
  harness.setNow(fixedNow);
  const before = masterOf(harness.service);
  assert.equal(before.data_list.length, 1);
  assert.equal(before.data_list[0].version, 1);
  assert.equal(Number(before.data_list[0].progress_value ?? 0), 0);
  assert.equal(Boolean(before.data_list[0].rev_overdue), false);
  harness.reopen();
  assert.equal(masterOf(harness.service).data_list[0].version, 1);
});

test('69102 claims a completed statistics task, adds its growth value and persists both bitmaps', t => {
  const harness = setup(t);
  const { store } = harness;
  completeTask(store, 1001);
  const expBefore = resource(store, 701900);
  const diamondBefore = resource(store, 101500);
  const result = harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]);
  assert.equal(result.value.tid, 1001);
  assert.equal(result.value.progressValue, 10);
  assert.equal(resource(store, 701900), expBefore + 10n);
  assert.equal(resource(store, 101500), diamondBefore + 30n);
  let info = masterOf(harness.service).data_list[0];
  assert.equal(info.progress_value, 10);
  assert.deepEqual(Buffer.from(info.task_award ?? '', 'base64'), Buffer.from([0x40]));
  assert.throws(
    () => harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]),
    error => error.code === 310 && /decisionId=R1-ITEM-TASKAWARD/.test(error.message)
  );

  const reopened = harness.reopen();
  info = masterOf(harness.service).data_list[0];
  assert.equal(info.progress_value, 10);
  assert.ok(Buffer.from(info.task_award ?? '', 'base64').length > 0);
  assert.equal(claimCount(reopened), 1);
});

test('69102 rejects unfinished statistics before resources or claim state change', t => {
  const { store, service } = setup(t);
  const expBefore = resource(store, 701900);
  const diamondBefore = resource(store, 101500);
  assert.throws(
    () => service.execute(TASK_AWARD_COMMANDS.task, [1001]),
    error => error.code === 5 && /not complete/.test(error.message) && /decisionId=R1-ITEM-TASKAWARD/.test(error.message)
  );
  assert.equal(resource(store, 701900), expBefore);
  assert.equal(resource(store, 101500), diamondBefore);
  assert.equal(claimCount(store), 0);
});

test('69101 requires claimed task growth and grants the configured progress reward once', t => {
  const harness = setup(t);
  const { store, service } = harness;
  assert.throws(
    () => service.execute(TASK_AWARD_COMMANDS.progress, [101]),
    error => error.code === 5 && /needs 600/.test(error.message)
  );
  for (let tid = 1001; tid <= 1056; tid += 1) {
    completeTask(store, tid);
    service.execute(TASK_AWARD_COMMANDS.task, [tid]);
  }
  const beforeProgress = masterOf(service).data_list[0];
  assert.equal(beforeProgress.progress_value, 750);
  const treasureBefore = treasureChipCount(store, 132417);
  const result = service.execute(TASK_AWARD_COMMANDS.progress, [101]);
  assert.equal(result.value.progressValue, 750);
  assert.equal(treasureChipCount(store, 132417), treasureBefore + 1);
  const after = masterOf(service).data_list[0];
  assert.ok(Buffer.from(after.progress_award ?? '', 'base64').length > 0);
  assert.throws(() => service.execute(TASK_AWARD_COMMANDS.progress, [101]), error => error.code === 310);
});

test('expired activity keeps historical login data but rejects every new mutation before writes', t => {
  const harness = setup(t);
  completeTask(harness.store, 1001);
  harness.setNow(activityEnd + 1);
  const resourcesBefore = JSON.stringify([...harness.store.read().resources].map(([id, value]) => [id, value.num]));
  const claimsBefore = claimCount(harness.store);
  assert.equal(masterOf(harness.service).data_list.length, 1);
  assert.throws(
    () => harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]),
    error => error.code === 5 && /activity is over/.test(error.message)
  );
  assert.equal(JSON.stringify([...harness.store.read().resources].map(([id, value]) => [id, value.num])), resourcesBefore);
  assert.equal(claimCount(harness.store), claimsBefore);
});

test('invalid ids and multi-id ETF payloads fail without granting rewards', t => {
  const { store, service } = setup(t);
  const diamondBefore = resource(store, 101500);
  assert.throws(() => service.execute(TASK_AWARD_COMMANDS.task, [999999]), error => error.code === 1);
  assert.throws(() => service.execute(TASK_AWARD_COMMANDS.progress, [999999]), error => error.code === 1);
  assert.throws(() => service.execute(TASK_AWARD_COMMANDS.task, [1001, 1002]), error => error.code === 1);
  assert.throws(() => service.execute(TASK_AWARD_COMMANDS.task, []), error => error.code === 1);
  assert.equal(resource(store, 101500), diamondBefore);
});

test('module 92 activity login carries the ETF-wrapped task-award master after a claim', async t => {
  const harness = setup(t);
  completeTask(harness.store, 1001);
  harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]);
  const runtimeActivity = {
    act_list: [{
      state_data: { act_id: TASK_AWARD_ACTIVITY_ID, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: startSeconds }] },
      module_login_data: ''
    }],
    act_parallel_list: [],
    act_pause_list: [],
    act_custom_list: []
  };
  assert.deepEqual(harness.service.synchronizeLogin(runtimeActivity, fixedNow), [TASK_AWARD_ACTIVITY_ID]);
  const wrapped = Buffer.from(runtimeActivity.act_list[0].module_login_data, 'base64');
  const decoded = await decodeEtf(wrapped);
  assert.ok(Buffer.isBuffer(decoded?.value));
  const master = codec.unpack('pb_task_award_master', decoded.value);
  assert.equal(master.data_list.length, 1);
  assert.equal(master.data_list[0].progress_value, 10);
  assert.ok(Buffer.from(master.data_list[0].task_award ?? '', 'base64').length > 0);
});

test('login synchronization creates the missing module 92 entry inside the configured window', async t => {
  const harness = setup(t);
  const runtimeActivity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  assert.deepEqual(harness.service.synchronizeLogin(runtimeActivity, fixedNow), [TASK_AWARD_ACTIVITY_ID]);
  assert.equal(runtimeActivity.act_list.length, 1);
  assert.equal(Number(runtimeActivity.act_list[0].state_data.act_id), TASK_AWARD_ACTIVITY_ID);
  assert.deepEqual(runtimeActivity.act_list[0].state_data.history_time, [
    { state_id: 50, enter_time: startSeconds }
  ]);
  const decoded = await decodeEtf(Buffer.from(runtimeActivity.act_list[0].module_login_data, 'base64'));
  const master = codec.unpack('pb_task_award_master', decoded.value);
  assert.equal(master.data_list.length, 1);
});

test('ETF decoder accepts exactly one positive id and rejects malformed envelopes', async t => {
  const { service } = setup(t);
  const task = await service.decode(TASK_AWARD_COMMANDS.task, await encodeEtf([1001]), { etf: decodeEtf });
  assert.deepEqual(task, [1001]);
  const progress = await service.decode(TASK_AWARD_COMMANDS.progress, await encodeEtf([101]), { etf: decodeEtf });
  assert.deepEqual(progress, [101]);
  const multiple = await encodeEtf([1001, 1002]);
  await assert.rejects(
    () => service.decode(TASK_AWARD_COMMANDS.task, multiple, { etf: decodeEtf }),
    error => error.code === 1 && /one id/.test(error.message) && /decisionId=R1-ITEM-TASKAWARD/.test(error.message)
  );
  const zero = await encodeEtf([0]);
  await assert.rejects(
    () => service.decode(TASK_AWARD_COMMANDS.task, zero, { etf: decodeEtf }),
    error => error.code === 1 && /Invalid task award id/.test(error.message)
  );
  await assert.rejects(
    () => service.decode(TASK_AWARD_COMMANDS.task, Buffer.alloc(0), { etf: decodeEtf }),
    error => error.code === 1 && /empty/.test(error.message)
  );
});

test('response encoding failure rolls back the claim, progress and resources', t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_task_award_back') throw new Error('encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { codec: failingCodec });
  completeTask(harness.store, 1001);
  const diamondBefore = resource(harness.store, 101500);
  assert.throws(() => harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]), /encode failure/);
  assert.equal(resource(harness.store, 101500), diamondBefore);
  assert.equal(claimCount(harness.store), 0);
  assert.equal(Number(masterOf(harness.service).data_list[0].progress_value ?? 0), 0);
});

test('SQLite claim insertion failure rolls back resources and progress', t => {
  const harness = setup(t);
  completeTask(harness.store, 1001);
  const diamondBefore = resource(harness.store, 101500);
  harness.store.inspect(db => db.exec(`
    CREATE TRIGGER reject_task_award_claim
    BEFORE INSERT ON task_award_claims
    BEGIN SELECT RAISE(ABORT, 'Injected task award storage failure'); END;
  `));
  assert.throws(() => harness.service.execute(TASK_AWARD_COMMANDS.task, [1001]), /Injected task award storage failure/);
  assert.equal(resource(harness.store, 101500), diamondBefore);
  assert.equal(claimCount(harness.store), 0);
  assert.equal(Number(masterOf(harness.service).data_list[0].progress_value ?? 0), 0);
});
