import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createTaskService } from '../game/task-service.mjs';

const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec(), tables = readGameTables();
const fixedNow = 1793300000000;

function setMission(store, missionId) {
  store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(missionId);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-task-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  let service = createTaskService({ store, codec, tables, now: () => fixedNow });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, codec });
      service = createTaskService({ store, codec, tables, now: () => fixedNow });
    }
  };
}

function taskModule(store) {
  const raw = new Map(store.state().modules.value).get(90).value[0];
  return codec.unpack('pb_linear_task_data', rawBinary(raw));
}

function setLinearTask(store, task) {
  store.transaction(model => {
    const module = new Map(model.state.modules.value).get(90);
    const value = codec.unpack('pb_linear_task_data', rawBinary(module.value[0]));
    value.task_list = [task];
    module.value[0] = serializedBinary(codec.pack('pb_linear_task_data', value));
    const modules = new Map(model.state.modules.value);
    modules.set(90, module);
    model.state.modules.value = [...modules];
  });
}

function setDestiny(store, value, moduleId = 107) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(moduleId, serializedBinary(codec.pack('pb_destiny_data', value)));
    model.state.modules.value = [...modules];
  });
}

function setDestinyBytes(store, bytes, moduleId = 107) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(moduleId, serializedBinary(bytes));
    model.state.modules.value = [...modules];
  });
}

function removeModule(store, moduleId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.delete(moduleId);
    model.state.modules.value = [...modules];
  });
}

const destinyModule = store => codec.unpack('pb_destiny_data', rawBinary(new Map(store.state().modules.value).get(107)));

const claimCount = store => store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='linear_task'").get().n);

const destinyTasks = [
  [10004, 2, 201500, 2000],
  [10020, 3, 2002, 2],
  [10030, 4, 101500, 20],
  [10041, 5, 201500, 1000],
  [10055, 6, 101500, 20],
  [10069, 7, 157002, 100]
];

for (const [taskId, targetStage, rewardTid, rewardCount] of destinyTasks) {
  test(`claims linear task ${taskId} at destiny stage ${targetStage}`, t => {
    const env = setup(t), config = tables.LinearTask.get(taskId);
    const typeConfig = tables.TaskType.get(config.task_type);
    assert.equal(typeConfig.progress_type, 1);
    assert.equal(typeConfig.progress_fun, 155);
    assert.equal(config.target_count, targetStage);
    assert.deepEqual(config.award, [[rewardTid, rewardCount]]);

    setDestiny(env.store, { cur_stage: targetStage - 1, slot_state: Buffer.alloc(13) });
    const before = env.store.state();
    assert.throws(
      () => env.service.execute(9010, taskId),
      error => error.code === 5 && error.message === 'Linear task is not complete'
    );
    assert.deepEqual(env.store.state(), before);
    assert.equal(claimCount(env.store), 0);

    setDestiny(env.store, { cur_stage: targetStage, slot_state: Buffer.alloc(13) });
    const resourceBefore = BigInt(env.store.read().resources.get(String(rewardTid))?.num ?? 0);
    const result = env.service.execute(9010, taskId);
    const response = codec.unpack('pb_linear_task_receive_back', result.data);
    assert.deepEqual(response.task, { type: 1, receive_tid: taskId });
    assert.deepEqual(
      response.res_change.changes.map(change => [change.tid, change.diff_num]),
      [[String(rewardTid), String(rewardCount)]]
    );
    assert.equal(BigInt(env.store.read().resources.get(String(rewardTid)).num), resourceBefore + BigInt(rewardCount));
    assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: taskId }]);
    assert.equal(destinyModule(env.store).cur_stage, targetStage);
    assert.equal(claimCount(env.store), 1);
  });
}

test('reads the authoritative destiny stage from module 107 instead of legacy module 100', t => {
  const current = setup(t);
  setDestiny(current.store, { cur_stage: 7, slot_state: Buffer.alloc(13) }, 100);
  setDestiny(current.store, { cur_stage: 2, slot_state: Buffer.alloc(13) });
  current.service.execute(9010, 10004);
  assert.equal(claimCount(current.store), 1);

  const stale = setup(t);
  setDestiny(stale.store, { cur_stage: 7, slot_state: Buffer.alloc(13) }, 100);
  setDestiny(stale.store, { cur_stage: 1, slot_state: Buffer.alloc(13) });
  const before = stale.store.state();
  assert.throws(() => stale.service.execute(9010, 10069), error => error.code === 5);
  assert.deepEqual(stale.store.state(), before);
  assert.equal(claimCount(stale.store), 0);
});

test('rejects missing, corrupt or invalid destiny stage state without changing the claim', t => {
  const env = setup(t);
  removeModule(env.store, 107);
  let before = env.store.state();
  assert.throws(
    () => env.service.execute(9010, 10004),
    error => error.code === 5 && error.message === 'Destiny login module is missing'
  );
  assert.deepEqual(env.store.state(), before);

  setDestinyBytes(env.store, Buffer.from([0xff]));
  before = env.store.state();
  assert.throws(
    () => env.service.execute(9010, 10004),
    error => error.code === 5 && error.message === 'Destiny login module is invalid'
  );
  assert.deepEqual(env.store.state(), before);

  setDestiny(env.store, { slot_state: Buffer.alloc(13) });
  before = env.store.state();
  assert.throws(
    () => env.service.execute(9010, 10004),
    error => error.code === 5 && error.message === 'Destiny login module is invalid'
  );
  assert.deepEqual(env.store.state(), before);

  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(107, { malformed: true });
    model.state.modules.value = [...modules];
  });
  before = env.store.state();
  assert.throws(
    () => env.service.execute(9010, 10004),
    error => error.code === 5 && error.message === 'Destiny login module is invalid'
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('keeps unsupported direct progress functions explicitly rejected', t => {
  const env = setup(t), customTables = {
    ...tables,
    TaskType: new Map(tables.TaskType),
    LinearTask: new Map(tables.LinearTask)
  };
  customTables.TaskType.set(5902, { ...tables.TaskType.get(5901), tid: 5902, progress_fun: 999 });
  customTables.LinearTask.set(109999, { ...tables.LinearTask.get(10004), tid: 109999, task_type: 5902 });
  const custom = createTaskService({ store: env.store, codec, tables: customTables, now: () => fixedNow });
  setDestiny(env.store, { cur_stage: 7, slot_state: Buffer.alloc(13) });
  const before = env.store.state();
  assert.throws(
    () => custom.execute(9010, 109999),
    error => error.code === 5 && error.message === 'Linear task progress is not implemented'
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('rolls back destiny task claims on encoding or SQLite failure', t => {
  const env = setup(t);
  setDestiny(env.store, { cur_stage: 2, slot_state: Buffer.alloc(13) });
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_linear_task_receive_back') throw new Error('encode fail');
      return codec.pack(name, value);
    }
  };
  const broken = createTaskService({ store: env.store, codec: brokenCodec, tables, now: () => fixedNow });
  assert.throws(() => broken.execute(9010, 10004), /encode fail/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);

  env.store.inspect(db => db.exec("CREATE TRIGGER reject_destiny_task BEFORE INSERT ON reward_claims WHEN NEW.claim_type='linear_task' BEGIN SELECT RAISE(ABORT, 'deny destiny task'); END"));
  assert.throws(() => env.service.execute(9010, 10004), /deny destiny task/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('claims a completed main linear task into the backpack and persists its high-water mark', t => {
  const env = setup(t);
  setMission(env.store, 30204);
  const before = BigInt(env.store.read().resources.get('101500').num);

  const result = env.service.execute(9010, 10001);
  const response = codec.unpack('pb_linear_task_receive_back', result.data);
  assert.deepEqual(response.task, { type: 1, receive_tid: 10001 });
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '101500', diff_num: '50' }
  ]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 50n);
  assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: 10001 }]);
  assert.equal(claimCount(env.store), 1);

  env.reopen();
  assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: 10001 }]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 50n);
  assert.throws(() => env.service.execute(9010, 10001), error => error.code === 310);
  assert.equal(claimCount(env.store), 1);
});

test('rejects unfinished or unknown linear tasks without changing career state', t => {
  const env = setup(t);
  setMission(env.store, 30203);
  const before = env.store.state();
  assert.throws(() => env.service.execute(9010, 10001), error => error.code === 5);
  assert.throws(() => env.service.execute(9010, 999999), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('rejects a task already marked received in legacy login data without rewarding it again', t => {
  const env = setup(t);
  setMission(env.store, 30204);
  setLinearTask(env.store, { type: 1, receive_tid: 10001, snapshot_val: '30204' });
  const before = env.store.state();

  assert.throws(() => env.service.execute(9010, 10001), error => error.code === 310);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('claiming a mission task leaves no baseline for the stamina task', t => {
  const env = setup(t);
  setMission(env.store, 40210);
  env.service.execute(9010, 10001);

  const stamina = tables.LinearTask.get(10183);
  assert.equal(stamina.task_type, 1002);
  assert.equal(stamina.need_active, true);
  assert.equal(stamina.target_count, 10);

  const task = taskModule(env.store).task_list.find(row => Number(row.type) === Number(stamina.type));
  assert.equal(Number(task.snapshot_val ?? 0), 0);

  const stat = new Map(env.store.state().modules.value).get(21).value
    .map(slot => rawBinary(slot))
    .filter(bytes => bytes.length)
    .map(bytes => codec.unpack('pb_count_statics_data', bytes).list)
    .flat()
    .find(row => row.id === '10001290000');
  assert.equal(stat.total, '40');
  assert.equal(Number(stat.total) - Number(task.snapshot_val ?? 0), 40);
});

test('claims a completed stamina task from its configured statistic group', t => {
  const env = setup(t);
  const stamina = tables.LinearTask.get(10002);
  assert.equal(stamina.task_type, 8301);
  assert.equal(stamina.target_count, 10);

  const before = BigInt(env.store.read().resources.get('101800').num);
  const result = env.service.execute(9010, 10002);
  const response = codec.unpack('pb_linear_task_receive_back', result.data);
  assert.equal(response.task.type, 1);
  assert.equal(response.task.receive_tid, 10002);
  assert.equal(response.res_change.changes.find(change => change.tid === '101800').diff_num, '1000');
  assert.equal(BigInt(env.store.read().resources.get('101800').num), before + 1000n);
  assert.equal(taskModule(env.store).task_list.find(task => task.type === 1).receive_tid, 10002);
  assert.equal(claimCount(env.store), 1);
  assert.throws(() => env.service.execute(9010, 10002), error => error.code === 310);
});

test('reports insufficient progress for another role statistic task', t => {
  const env = setup(t);
  const otherStaminaTask = tables.LinearTask.get(10183);
  assert.equal(otherStaminaTask.task_type, 1002);
  assert.equal(otherStaminaTask.target_count, 10);

  assert.throws(
    () => env.service.execute(9010, 10183),
    error => error.code === 5 && error.message === 'Linear task is not complete'
  );
  assert.equal(claimCount(env.store), 0);
});

test('v5 migration clears stale linear-task progress baselines', t => {
  const env = setup(t);
  setLinearTask(env.store, { type: 1, receive_tid: 10001, snapshot_val: '40210' });
  env.store.inspect(db => {
    db.exec("DELETE FROM migrations WHERE name='linear-task-snapshot-v5'; PRAGMA user_version=4;");
  });

  env.reopen();

  assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: 10001 }]);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 10);
});

test('rolls back the claim marker and reward on encoding or SQLite failure', t => {
  const env = setup(t);
  setMission(env.store, 30204);
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_linear_task_receive_back') throw new Error('encode fail');
      return codec.pack(name, value);
    }
  };
  const broken = createTaskService({ store: env.store, codec: brokenCodec, tables, now: () => fixedNow });
  assert.throws(() => broken.execute(9010, 10001), /encode fail/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);

  env.store.inspect(db => db.exec("CREATE TRIGGER reject_linear_task BEFORE INSERT ON reward_claims WHEN NEW.claim_type='linear_task' BEGIN SELECT RAISE(ABORT, 'deny linear task'); END"));
  assert.throws(() => env.service.execute(9010, 10001), /deny linear task/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});
