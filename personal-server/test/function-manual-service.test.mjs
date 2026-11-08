import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import {
  createFunctionManualService,
  FUNCTION_MANUAL_AWARD_COMMAND,
  FUNCTION_MANUAL_MODULE_ID
} from '../game/function-manual-service.mjs';
import { readFunctionManualTables } from '../config/item-task-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readFunctionManualTables();
const gameTables = readGameTables();
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-function-manual-', now: () => fixedNow });
  let service = createFunctionManualService({
    store: fixture.store,
    codec,
    tables,
    gameTables,
    now: () => fixedNow
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createFunctionManualService({ store, codec, tables, gameTables, now: () => fixedNow });
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

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function claimCount(store) {
  return store.inspect(db => Number(db.prepare('SELECT COUNT(*) AS count FROM function_manual_claims').get().count));
}

function claimedBits(service) {
  const manual = codec.unpack('pb_function_manual', service.loginPayload());
  return Buffer.from(manual.got_award ?? '', 'base64');
}

test('FunctionManualTable extraction keeps the shipped rows', () => {
  assert.equal(FUNCTION_MANUAL_MODULE_ID, 106);
  assert.equal(FUNCTION_MANUAL_AWARD_COMMAND, 82301);
  assert.equal(tables.tasks.size, 28);
  assert.deepEqual(tables.tasks.get(3).award, [[201500, 10000], [31002, 1]]);
  assert.equal(tables.tasks.get(3).taskList.at(-1).count, 20);
  assert.equal(tables.tasks.get(2).taskList[0].type, 1201);
  // Task types without a server-side progress source stay configured but
  // unclaimable, so the configuration must keep them.
  assert.ok(tables.tasks.get(1).taskList.some(entry => entry.type === 5902));
});

test('82301 claims a completed statistics handbook row and survives reopening', t => {
  const harness = setup(t);
  const { store } = harness;
  setStatistic(store, 1, 2, 20);
  const gemBefore = resource(store, 201500), itemBefore = resource(store, 31002);
  const result = harness.service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3]);
  assert.equal(result.value.tid, 3);
  assert.equal(resource(store, 201500), gemBefore + 10000n);
  assert.equal(resource(store, 31002), itemBefore + 1n);
  const response = codec.unpack('pb_function_manual_award_rsp', result.data);
  assert.ok(Buffer.from(response.got_award ?? '', 'base64').length > 0);
  assert.equal(response.res_change.changes.find(row => row.tid === '201500').diff_num, '10000');
  assert.ok(Buffer.from(claimedBits(harness.service)).length > 0);
  assert.throws(() => harness.service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3]), error => error.code === 310);

  harness.reopen();
  assert.ok(Buffer.from(claimedBits(harness.service)).length > 0);
  assert.throws(() => harness.service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3]), error => error.code === 310);
});

test('82301 rejects an unfinished row and leaves the claim table empty', t => {
  const { store, service } = setup(t);
  setStatistic(store, 1, 2, 5);
  const gemBefore = resource(store, 201500);
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3]), error => error.code === 5 && /needs 1/.test(error.message));
  assert.equal(resource(store, 201500), gemBefore);
  assert.equal(claimCount(store), 0);
});

test('82301 fails closed for task types without a server progress source', t => {
  const { store, service } = setup(t);
  setStatistic(store, 1, 2, 20);
  // Row 1 mixes progress_fun 182/180 with a statistics row; row 2 needs the
  // journey cursor. Neither can be credited from this server, so both must
  // answer with the unavailable code instead of a fixed pass.
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [1]), error => error.code === 5 && /unavailable/.test(error.message));
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [2]), error => error.code === 5);
  assert.equal(claimCount(store), 0);
});

test('82301 rejects unknown ids and multi-id requests', t => {
  const { service } = setup(t);
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [999]), error => error.code === 1);
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3, 4]), error => error.code === 1);
  assert.throws(() => service.execute(FUNCTION_MANUAL_AWARD_COMMAND, []), error => error.code === 1);
});

test('82301 rolls back the claim when the response cannot be encoded', t => {
  const harness = setup(t);
  setStatistic(harness.store, 1, 2, 20);
  const gemBefore = resource(harness.store, 201500);
  const broken = {
    pack() { throw new Error('encode failure'); },
    unpack: codec.unpack.bind(codec)
  };
  const brokenService = createFunctionManualService({
    store: harness.store, codec: broken, tables, gameTables, now: () => fixedNow
  });
  assert.throws(() => brokenService.execute(FUNCTION_MANUAL_AWARD_COMMAND, [3]), /encode failure/);
  assert.equal(resource(harness.store, 201500), gemBefore);
  assert.equal(claimCount(harness.store), 0);
});
