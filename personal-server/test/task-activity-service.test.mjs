import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { createTaskActivityService, TASK_ACTIVITY_COMMANDS } from '../game/task-activity-service.mjs';
import { readTaskActivityTables } from '../config/item-task-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readTaskActivityTables();
const gameTables = readGameTables();
const serverOpenedAt = '2026-10-24T05:00:00+08:00';
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const runningActId = 1003001;
const closedActId = 1003002;
const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-task-activity-', serverOpenedAt, now: () => fixedNow });
  let service = createTaskActivityService({
    store: fixture.store, codec, tables, gameTables, serverOpenedAt, now: () => fixedNow
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createTaskActivityService({ store, codec, tables, gameTables, serverOpenedAt, now: () => fixedNow });
      return store;
    }
  };
}

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

function finishRequest(activityId, tids) {
  return codec.pack('pb_task_activity_finish_req', { activity_id: activityId, task_id_list: tids });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('TaskActivityTable keeps the shipped versions and ActFrame windows', () => {
  assert.equal(tables.versions.size, 6);
  assert.equal([...tables.versions.values()].reduce((sum, rows) => sum + rows.size, 0), 138);
  assert.equal(tables.tags.size, 12);
  assert.deepEqual(tables.versions.get(1).get(1).award, [[101500, 100], [201500, 10000]]);
  assert.equal(tables.versions.get(1).get(2).targetCount, 100);
});

test('the server-day activity is open on the test server and the world-time one is not', t => {
  const { service } = setup(t);
  const running = service.runningActivityIds(Math.floor(fixedNow / 1000));
  assert.ok(running.includes(runningActId), `running ids: ${running.join(',')}`);
  assert.ok(!running.includes(closedActId));
});

test('105701 finishes a task activity task, grants its award and survives reopening', t => {
  const harness = setup(t);
  setStatistic(harness.store, 29, 2, 50);
  const gemBefore = resource(harness.store, 101500), expBefore = resource(harness.store, 201500);
  const result = harness.service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1]));
  assert.deepEqual(result.value.tids, [1]);
  assert.equal(resource(harness.store, 101500), gemBefore + 100n);
  assert.equal(resource(harness.store, 201500), expBefore + 10000n);
  const response = codec.unpack('pb_task_activity_finish_rsp', result.data);
  assert.equal(Number(response.act_info.version), 1);
  assert.deepEqual(response.act_info.finish_task_list.map(Number), [1]);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '100');

  assert.throws(
    () => harness.service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1])),
    error => error.code === 310
  );
  harness.reopen();
  assert.throws(
    () => harness.service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1])),
    error => error.code === 310
  );
});

test('105701 rejects unfinished tasks, unknown tasks and closed activities', t => {
  const { store, service } = setup(t);
  setStatistic(store, 29, 2, 60);
  // Task 2 needs 100 points, task 1 already passes at 60.
  assert.throws(
    () => service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [2])),
    error => error.code === 5 && /needs 100/.test(error.message)
  );
  assert.throws(
    () => service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [99999])),
    error => error.code === 1
  );
  assert.throws(
    () => service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(closedActId, [1])),
    error => error.code === 309
  );
  assert.throws(
    () => service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(777777, [1])),
    error => error.code === 1
  );
  assert.throws(
    () => service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1, 1])),
    error => error.code === 1
  );
});

test('105702 stays unavailable because no server vitality producer exists', t => {
  const { service } = setup(t);
  assert.throws(() => service.execute(TASK_ACTIVITY_COMMANDS.data, Buffer.alloc(0)), error => error.code === 5);
});

test('login sync writes the ETF wrapped pb_task_activity_role_info for running versions', t => {
  const harness = setup(t);
  setStatistic(harness.store, 29, 2, 50);
  harness.service.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1]));
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const applied = harness.service.synchronizeLogin(activity);
  assert.ok(applied.includes(runningActId));
  const entry = activity.act_list.find(candidate => Number(candidate.state_data.act_id) === runningActId);
  assert.ok(entry, 'login entry written');
  assert.equal(entry.state_data.cur_state_id, 50);
  const wrapped = Buffer.from(entry.module_login_data, 'base64');
  assert.equal(wrapped[0], 0x83);
  assert.equal(wrapped[1], 0x6d);
  const payload = wrapped.subarray(6);
  assert.equal(wrapped.readUInt32BE(2), payload.length);
  const roleData = codec.unpack('pb_task_activity_role_info', payload);
  assert.equal(roleData.act_list.length, 1);
  assert.equal(Number(roleData.act_list[0].version), 1);
  assert.deepEqual(roleData.act_list[0].finish_task_list.map(Number), [1]);
});

test('105701 rolls back the state when the response cannot be encoded', t => {
  const harness = setup(t);
  setStatistic(harness.store, 29, 2, 50);
  const gemBefore = resource(harness.store, 101500);
  const broken = {
    pack() { throw new Error('encode failure'); },
    unpack: codec.unpack.bind(codec)
  };
  const brokenService = createTaskActivityService({
    store: harness.store, codec: broken, tables, gameTables, serverOpenedAt, now: () => fixedNow
  });
  assert.throws(() => brokenService.execute(TASK_ACTIVITY_COMMANDS.finish, finishRequest(runningActId, [1])), /encode failure/);
  assert.equal(resource(harness.store, 101500), gemBefore);
  const rows = harness.store.inspect(db => Number(db.prepare('SELECT COUNT(*) AS count FROM task_activity_state').get().count));
  assert.equal(rows, 0);
});
