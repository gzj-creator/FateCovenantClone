import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readCommonTaskTables } from '../config/common-task-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { createTaskService } from '../game/task-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = readGameTables(), commonTasks = readCommonTaskTables();
const fixedNow = 1793300000000;
const sections = readMissionTables().sections;

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

function setElite(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(140, { value: [serializedBinary(codec.pack('pb_elite_mission', {
      mission_id: String(missionId),
      boss_bin: Buffer.alloc(0),
      box_award_bin: Buffer.alloc(0)
    }))], improper: false });
    model.state.modules.value = [...modules];
  });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-commontask-' });
  let store = fixture.store;
  let service = createTaskService({ store, codec, tables, commonTasks, now: () => fixedNow });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store = fixture.open();
      service = createTaskService({ store, codec, tables, commonTasks, now: () => fixedNow });
    }
  };
}

const slotData = (store, slot) => codec.unpack('pb_common_task', rawBinary(new Map(store.state().modules.value).get(90).value[slot]));
const bitAt = (list, bit) => (Buffer.from(list ?? '', 'base64')[Math.floor(bit / 8)] ?? 0) & (0x80 >> (bit % 8));
const firstMissionOf = chapter => [...sections.values()]
  .filter(row => Number(row.belong_chapter) === chapter)
  .sort((left, right) => Number(left.tid) - Number(right.tid))[0]?.tid;
const claimCount = store => store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='common_task'").get().n);
const missionIdFor = (chapter, index) => [...sections.values()].find(row => Number(row.belong_chapter) === chapter && Number(row.index) === index)?.tid;

test('common task groups expose the shipped rows and login slots', () => {
  assert.deepEqual([...commonTasks.groups.keys()], [1201, 1202, 1602, 9001]);
  assert.equal(commonTasks.groups.get(1201).size, 565);
  assert.equal(commonTasks.groups.get(1202).size, 179);
  assert.equal(commonTasks.groups.get(1602).size, 1800);
  assert.equal(commonTasks.groups.get(9001).size, 230);
  assert.deepEqual([...commonTasks.slots], [[1201, 0], [1602, 1], [1202, 2], [9001, 3]]);
  const first = commonTasks.groups.get(1201).get(12010001);
  assert.equal(first.target_count, 106);
  assert.equal(first.award, null);
  assert.equal(commonTasks.groups.get(1201).get(12010001).type, 1201);
});

test('claims a passed-section common task and reports the receive bit', t => {
  const env = setup(t);
  // Journey progress is chapter*100 + index - 1 for the mission the cursor sits on.
  const cursorTid = firstMissionOf(2);
  const cursor = sections.get(cursorTid);
  const progress = Number(cursor.belong_chapter) * 100 + Number(cursor.index) - 1;
  const rows = [...commonTasks.groups.get(1201).values()];
  const claimable = rows.filter(row => row.target_count <= progress).pop();
  const pending = rows.find(row => row.target_count > progress);
  assert.ok(claimable && pending);
  setMission(env.store, cursorTid);
  const before = env.store.state();
  assert.throws(
    () => env.service.execute(9005, pending.tid),
    error => error.code === 5 && error.message === 'Common task is not complete'
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);

  const bit = claimable.tid % 10000;
  const result = env.service.execute(9005, claimable.tid);
  const response = codec.unpack('common_receive_back', result.data);
  assert.equal(bitAt(response.common_task.receive_list, bit), 0x80 >> (bit % 8));
  assert.equal(response.res.changes.length, 0);
  assert.ok(!response.res.is_overflow);
  assert.equal(bitAt(slotData(env.store, 0).receive_list, bit), 0x80 >> (bit % 8));
  assert.equal(claimCount(env.store), 1);

  assert.throws(
    () => env.service.execute(9005, claimable.tid),
    error => error.code === 310
  );
  env.reopen();
  assert.throws(
    () => env.service.execute(9005, claimable.tid),
    error => error.code === 310
  );
  assert.equal(bitAt(slotData(env.store, 0).receive_list, bit), 0x80 >> (bit % 8));
});

test('counts passed chapters for the chapter group', t => {
  const env = setup(t);
  setMission(env.store, firstMissionOf(5));
  const progressTask = [...commonTasks.groups.get(1202).values()].find(row => row.target_count === 4);
  const result = env.service.execute(9005, progressTask.tid);
  assert.equal(bitAt(codec.unpack('common_receive_back', result.data).common_task.receive_list, 1), 0x40);
  assert.equal(claimCount(env.store), 1);
});

test('counts passed elite chapters from the elite login module', t => {
  const env = setup(t);
  const elite = tables.EliteMission;
  const chapter2Max = Math.max(...[...elite.values()].filter(row => Number(row.belong_chapter) === 2).map(row => Number(row.index)));
  const row = [...elite.values()]
    .filter(item => Number(item.belong_chapter) === 3)
    .sort((left, right) => Number(left.tid) - Number(right.tid))[0];
  setElite(env.store, row.tid);
  const task = commonTasks.groups.get(9001).get(90010001);
  assert.equal(task.target_count, 2);
  const result = env.service.execute(9005, 90010001);
  assert.equal(bitAt(codec.unpack('common_receive_back', result.data).common_task.receive_list, 1), 0x40);
  assert.equal(claimCount(env.store), 1);
  assert.ok(chapter2Max > 0);
});

test('rejects unknown ids, mixed groups and unimplemented progress', t => {
  const env = setup(t);
  assert.throws(() => env.service.execute(9005, 12019999), error => error.code === 1);
  assert.throws(() => env.service.execute(9005, [12010001, 12020001]), error => error.code === 1);
  assert.throws(() => env.service.execute(9005, 0), error => error.code === 1);
  assert.throws(
    () => env.service.execute(9005, 16020001),
    error => error.code === 5 && error.message === 'Common task progress is not implemented'
  );
  assert.equal(claimCount(env.store), 0);
});

test('claims an id list in one transaction', t => {
  const env = setup(t);
  setMission(env.store, firstMissionOf(3));
  const first = commonTasks.groups.get(1201).get(12010001);
  assert.equal(first.target_count, 106);
  const result = env.service.execute(9005, [12010001, 12010002]);
  const response = codec.unpack('common_receive_back', result.data);
  assert.equal(bitAt(response.common_task.receive_list, 1), 0x40);
  assert.equal(bitAt(response.common_task.receive_list, 2), 0x20);
  assert.equal(claimCount(env.store), 2);
  assert.equal(bitAt(slotData(env.store, 0).receive_list, 1), 0x40);
  assert.equal(bitAt(slotData(env.store, 0).receive_list, 2), 0x20);
});

test('rolls the module write back when SQLite rejects the claim', t => {
  const env = setup(t);
  setMission(env.store, missionIdFor(1, 7));
  const before = env.store.state();
  env.store.inspect(db => db.exec("CREATE TRIGGER reject_common_claim BEFORE INSERT ON reward_claims BEGIN SELECT RAISE(ABORT, 'rejected'); END"));
  assert.throws(() => env.service.execute(9005, 12010001));
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});
