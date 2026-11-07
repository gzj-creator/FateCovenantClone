import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { createGrowthRoadService, GROWTH_ROAD_COMMANDS, GROWTH_ROAD_MODULE_ID } from '../game/growth-road-service.mjs';
import { readGrowthRoadTables } from '../config/growth-road-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGrowthRoadTables();
const gameTables = readGameTables();
const serverOpenedAt = '2026-10-24T05:00:00+08:00';
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-growth-road-',
    serverOpenedAt,
    now: () => fixedNow
  });
  let now = options.now ?? fixedNow;
  let service = createGrowthRoadService({
    store: fixture.store,
    codec: options.codec ?? codec,
    tables,
    gameTables,
    serverOpenedAt,
    now: () => now,
    progressForTask: options.progressForTask
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    setNow(value) { now = value; },
    reopen(nextOptions = {}) {
      const store = fixture.open();
      service = createGrowthRoadService({
        store,
        codec: nextOptions.codec ?? options.codec ?? codec,
        tables,
        gameTables,
        serverOpenedAt,
        now: () => nextOptions.now ?? now,
        progressForTask: nextOptions.progressForTask ?? options.progressForTask
      });
      return store;
    }
  };
}

const roleStatistics = [...gameTables.CountStatistics.values()]
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

function claimCount(store) {
  return store.inspect(db => Number(db.prepare('SELECT COUNT(*) AS count FROM growth_road_claims').get().count));
}

function infoOf(service) {
  const master = codec.unpack('pb_growth_road_master', service.loginPayload());
  assert.equal(master.data_list.length, 1);
  return master.data_list[0];
}

test('GrowthRoadTable extraction exposes the shipped config family', () => {
  assert.equal(tables.version, 1);
  assert.equal(tables.tasks.size, 318);
  assert.equal(tables.progress.size, 12);
  assert.equal(tables.tags.size, 4);
  assert.equal(tables.progressList.at(-1).need_count, 8000);
  assert.deepEqual(tables.tasks.get(1001).award_list, [[701900, 20], [101500, 100]]);
  assert.equal(tables.tasks.get(1001).growth_value, 20);
  assert.equal(tables.progress.get(101).award_new, 101500);
  assert.equal(GROWTH_ROAD_MODULE_ID, 53696);
});

test('69002 claims a completed statistics task, grants its reward and survives reopening', t => {
  const harness = setup(t);
  const { store } = harness;
  setStatistic(store, 2, 23005, 1);
  const chipBefore = resource(store, 101500), expBefore = resource(store, 701900);
  const result = harness.service.execute(GROWTH_ROAD_COMMANDS.task, [1001]);
  assert.equal(result.value.tid, 1001);
  assert.equal(result.value.progressValue, 20);
  assert.equal(resource(store, 701900), expBefore + 20n);
  assert.equal(resource(store, 101500), chipBefore + 100n);
  assert.equal(infoOf(harness.service).progress_value, 20);
  assert.ok(Buffer.from(infoOf(harness.service).task_award, 'base64').length > 0);
  assert.throws(() => harness.service.execute(GROWTH_ROAD_COMMANDS.task, [1001]), error => error.code === 310);

  harness.reopen();
  assert.equal(infoOf(harness.service).progress_value, 20);
  assert.throws(() => harness.service.execute(GROWTH_ROAD_COMMANDS.task, [1001]), error => error.code === 310);
});

test('69002 rejects unfinished statistics and leaves resources untouched', t => {
  const { store, service } = setup(t);
  setStatistic(store, 2, 23005, 0);
  const chipBefore = resource(store, 101500);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, [1001]), error => error.code === 5 && /not complete/.test(error.message));
  assert.equal(resource(store, 101500), chipBefore);
  assert.equal(claimCount(store), 0);
});

test('69001 requires the configured milestone and grants the new-version reward', t => {
  const { store, service } = setup(t);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.progress, [101]), error => error.code === 5 && /needs 200/.test(error.message));
  setStatistic(store, 2, 23005, 10);
  for (let tid = 1001; tid <= 1010; tid += 1) service.execute(GROWTH_ROAD_COMMANDS.task, [tid]);
  assert.equal(infoOf(service).progress_value, 200);
  const chipBefore = resource(store, 101500);
  const claimed = service.execute(GROWTH_ROAD_COMMANDS.progress, [101]);
  assert.equal(claimed.value.tid, 101);
  assert.equal(resource(store, 101500), chipBefore + 2500n);
  assert.ok(Buffer.from(infoOf(service).progress_award, 'base64').length > 0);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.progress, [101]), error => error.code === 310);
});

test('invalid ids and multi-id ETF payloads are rejected', t => {
  const { service } = setup(t);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, [999999]), error => error.code === 1);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.progress, [999999]), error => error.code === 1);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, [1001, 1002]), error => error.code === 1);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, []), error => error.code === 1);
});

test('progress_type=1 callbacks stay explicitly unavailable', t => {
  const { service } = setup(t);
  const task = [...tables.tasks.values()].find(row => Number(row.type) === 1111);
  assert.ok(task);
  assert.throws(
    () => service.execute(GROWTH_ROAD_COMMANDS.task, [task.tid]),
    error => error.code === 5 && /progress_fun 203/.test(error.message)
  );
});

test('PB encoding failure rolls back the claim and resource changes', t => {
  const failingCodec = { ...codec, pack: (name, value) => {
    if (name === 'pb_growth_road_back') throw new Error('encode failure');
    return codec.pack(name, value);
  } };
  const { store, service } = setup(t, { codec: failingCodec });
  setStatistic(store, 2, 23005, 1);
  const chipBefore = resource(store, 101500);
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, [1001]), /encode failure/);
  assert.equal(resource(store, 101500), chipBefore);
  assert.equal(claimCount(store), 0);
});

test('the activity window gates task claims', t => {
  const { service, setNow } = setup(t);
  setNow(Date.UTC(2060, 0, 1));
  assert.throws(() => service.execute(GROWTH_ROAD_COMMANDS.task, [1001]), error => error.code === 5);
});
