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

const claimCount = store => store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='linear_task'").get().n);

test('claims a completed main linear task into the backpack and persists its high-water mark', t => {
  const env = setup(t);
  setMission(env.store, 30204);
  const before = BigInt(env.store.read().resources.get('101500').num);

  const result = env.service.execute(9010, 10001);
  const response = codec.unpack('pb_linear_task_receive_back', result.data);
  assert.deepEqual(response.task, { type: 1, receive_tid: 10001, snapshot_val: '30204' });
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '101500', diff_num: '50' }
  ]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 50n);
  assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: 10001, snapshot_val: '30204' }]);
  assert.equal(claimCount(env.store), 1);

  env.reopen();
  assert.deepEqual(taskModule(env.store).task_list, [{ type: 1, receive_tid: 10001, snapshot_val: '30204' }]);
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
