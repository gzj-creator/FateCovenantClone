import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, serializedBinary } from '../protocol/game-codec.mjs';
import { createEliteMissionService } from '../game/elite-mission-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();

function setEliteMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(140, serializedBinary(codec.pack('pb_elite_mission', { mission_id: String(missionId) })));
    model.state.modules.value = [...modules];
  });
}

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-elite-' });
  let service = createEliteMissionService({ store: fixture.store, codec, tables, now: () => 1700000000000 });
  return {
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createEliteMissionService({ store, codec, tables, now: () => 1700000000000 });
      return { store, service };
    }
  };
}

test('87001 selects configured elite missions without skipping progression', async t => {
  const { service } = setup(t);
  const first = await service.custom(101);
  assert.equal(first.value.mission.mission_id, '101');
  assert.ok(first.data.length > 0);

  const second = await service.custom(102);
  assert.equal(second.value.mission.mission_id, '102');
  const replay = await service.custom(101);
  assert.equal(replay.value.mission.mission_id, '101');
  assert.throws(() => service.custom(201), /not unlocked/);
  assert.throws(() => service.custom(999999), /configuration/);
});

test('87001 rejects malformed input without changing the selected mission', async t => {
  const { service } = setup(t);
  await service.custom(101);
  assert.throws(() => service.custom('abc'), /Invalid/);
  assert.throws(() => service.custom(0), /Invalid/);
});

test('87002 grants configured elite box rewards once and persists claim bits', async t => {
  const { store, service, reopen } = setup(t);
  setEliteMission(store, 105);
  const diamonds = BigInt(store.read().resources.get('101500')?.num ?? 0);
  const first = await service.boxAward({ box_id_list: [1], common_task_id_list: [] });
  assert.deepEqual(first.value.newlyGranted, [1]);
  assert.equal(first.value.res.changes.find(change => change.tid === '101500').diff_num, '30');
  assert.equal(BigInt(store.read().resources.get('101500').num), diamonds + 30n);
  assert.ok(first.value.mission.box_award_bin.length > 0);

  const second = await service.boxAward({ box_id_list: [1], common_task_id_list: [] });
  assert.deepEqual(second.value.newlyGranted, []);
  assert.deepEqual(second.value.res.changes, []);

  const { service: reopened } = reopen();
  const third = await reopened.boxAward({ box_id_list: [1], common_task_id_list: [] });
  assert.deepEqual(third.value.newlyGranted, []);
});

test('87002 rejects unknown, locked and unsupported common-task claims atomically', async t => {
  const { store, service } = setup(t);
  setEliteMission(store, 105);
  const before = store.read();
  await assert.rejects(service.boxAward({ box_id_list: [999999], common_task_id_list: [] }), /configuration/);
  await assert.rejects(service.boxAward({ box_id_list: [2], common_task_id_list: [] }), /not unlocked/);
  await assert.rejects(service.boxAward({ box_id_list: [1], common_task_id_list: [3] }), /common-task/);
  assert.deepEqual(store.read().resources, before.resources);
  assert.equal(store.inspect(db => db.prepare("SELECT COUNT(*) AS count FROM reward_claims WHERE claim_type='elite_mission_box'").get().count), 0);
});

test('87003 records a completed configured chapter and returns an encoded tuple', async t => {
  const { store, service } = setup(t);
  setEliteMission(store, 105);
  const first = await service.chapterPass(1);
  assert.equal(first.value.alreadyClaimed, false);
  assert.deepEqual(await decodeEtf(first.data), [1, 0]);
  const second = await service.chapterPass(1);
  assert.equal(second.value.alreadyClaimed, true);
  assert.deepEqual(await decodeEtf(second.data), [1, 1]);
});

test('87003 rejects incomplete and unknown chapters', async t => {
  const { store, service } = setup(t);
  setEliteMission(store, 101);
  assert.throws(() => service.chapterPass(1), /not complete/);
  assert.throws(() => service.chapterPass(999999), /configuration/);
  assert.throws(() => service.chapterPass(0), /Invalid/);
});

test('supports elite mission command family', async t => {
  const { service } = setup(t);
  assert.equal(service.supports(87001), true);
  assert.equal(service.supports(87002), true);
  assert.equal(service.supports(87003), true);
  assert.equal(service.supports(999), false);
});
