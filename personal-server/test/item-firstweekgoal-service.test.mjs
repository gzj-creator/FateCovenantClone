import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { serializedBinary } from '../protocol/game-codec.mjs';
import { createFirstWeekGoalService } from '../game/first-week-goal-service.mjs';
import { readFirstWeekGoalTables } from '../config/first-week-goal-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readFirstWeekGoalTables();
const gameTables = readGameTables();
const serverOpenedAt = '2026-10-24T05:00:00+08:00';
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-first-week-goal-',
    serverOpenedAt,
    now: () => fixedNow
  });
  let service = createFirstWeekGoalService({
    store: fixture.store,
    codec: options.codec ?? codec,
    tables,
    gameTables,
    serverOpenedAt,
    now: () => options.now ?? fixedNow,
    progressForTask: options.progressForTask
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    reopen(nextOptions = {}) {
      const store = fixture.open();
      service = createFirstWeekGoalService({
        store,
        codec: nextOptions.codec ?? codec,
        tables,
        gameTables,
        serverOpenedAt,
        now: () => nextOptions.now ?? options.now ?? fixedNow,
        progressForTask: nextOptions.progressForTask ?? options.progressForTask
      });
      return store;
    }
  };
}

function setStatistic(store, total) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value));
    module.value[1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: '1', total: String(total) }]
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function claimCount(store) {
  return store.inspect(db => Number(db.prepare('SELECT COUNT(*) AS count FROM first_week_goal_claims').get().count));
}

function decodedInfo(data) {
  return codec.unpack('pb_first_week_goal_back', data).info;
}

test('67005 uses authoritative statistics, grants the configured reward and survives reopening', t => {
  const { store, service, fixture } = setup(t);
  setStatistic(store, 20);
  const itemBefore = resource(store, 101800), chipBefore = resource(store, 101900), scoreBefore = resource(store, 1901900);
  const result = service.execute(67005, [1103, 1106]);
  assert.deepEqual(result.value.ids, [1103, 1106]);
  assert.equal(result.value.score, 10);
  assert.equal(resource(store, 101800), itemBefore + 18000n);
  assert.equal(resource(store, 101900), chipBefore + 300n);
  assert.equal(resource(store, 1901900), scoreBefore + 10n);
  const info = decodedInfo(result.data);
  assert.ok(Buffer.from(info.task_award, 'base64').length > 0);
  const login = codec.unpack('pb_first_week_goal', service.loginPayload());
  assert.equal(Buffer.from(login.task_award ?? '', 'base64').toString('base64'), Buffer.from(info.task_award ?? '', 'base64').toString('base64'));
  assert.throws(() => service.execute(67005, [1103]), error => error.code === 310);
  assert.throws(() => service.execute(67005, [1109]), error => error.code === 5);
  assert.throws(() => service.execute(67005, [999999]), error => error.code === 1);
  assert.equal(claimCount(store), 2);

  fixture.open();
  const reopened = createFirstWeekGoalService({
    store: fixture.store, codec, tables, gameTables, serverOpenedAt, now: () => fixedNow
  });
  assert.throws(() => reopened.execute(67005, [1103]), error => error.code === 310);
  assert.equal(claimCount(fixture.store), 2);
});

test('67004 claims score-gated progress once and 67005 claims all currently eligible tasks', t => {
  const { store, service } = setup(t, { progressForTask: () => 999 });
  service.execute(67005, [1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108]);
  const targetBefore = resource(store, 23300504);
  const progress = service.execute(67004, [501]);
  assert.equal(progress.value.score, 40);
  assert.equal(resource(store, 23300504), targetBefore + 60n);
  assert.throws(() => service.execute(67004, [501]), error => error.code === 310);

  const allTasks = service.execute(67005, undefined);
  assert.ok(allTasks.value.ids.length > 0);
  assert.equal(allTasks.value.ids.includes(1101), false);
});

test('explicit multi-id rejection is atomic', t => {
  const { store, service } = setup(t, { progressForTask: () => 999 });
  service.execute(67005, [1101]);
  const before = resource(store, 201500);
  assert.throws(() => service.execute(67005, [1102, 1101]), error => error.code === 310);
  assert.equal(resource(store, 201500), before);
  assert.equal(claimCount(store), 1);
});

test('an inactive period rejects without granting rewards', t => {
  const { store, service } = setup(t, { progressForTask: () => 999, now: Date.UTC(2026, 10, 10) });
  const before = resource(store, 201500);
  assert.throws(() => service.execute(67005, [1101]), error => error.code === 5);
  assert.equal(resource(store, 201500), before);
  const inactive = codec.unpack('pb_first_week_goal', service.loginPayload());
  assert.equal(Buffer.from(inactive.task_award ?? '', 'base64').length, 0);
  assert.equal(claimCount(store), 0);
});

test('response encoding and SQLite failures roll back reward and claim writes', t => {
  let failEncoding = true;
  const badCodec = {
    ...codec,
    pack(name, value) {
      if (failEncoding && name === 'pb_first_week_goal_back') throw new Error('forced encoding failure');
      return codec.pack(name, value);
    }
  };
  const first = setup(t, { codec: badCodec, progressForTask: () => 999 });
  const before = resource(first.store, 201500);
  assert.throws(() => first.service.execute(67005, [1101]), /forced encoding failure/);
  assert.equal(resource(first.store, 201500), before);
  assert.equal(claimCount(first.store), 0);
  failEncoding = false;

  first.store.inspect(db => db.exec(`CREATE TRIGGER fail_first_week_claim BEFORE INSERT ON first_week_goal_claims
    BEGIN SELECT RAISE(ABORT, 'forced sqlite failure'); END;`));
  assert.throws(() => first.service.execute(67005, [1101]), /forced sqlite failure/);
  assert.equal(resource(first.store, 201500), before);
  assert.equal(claimCount(first.store), 0);
});

test('unrecovered task progress is a business rejection rather than a fixed success', t => {
  const { store, service } = setup(t);
  setStatistic(store, 999);
  assert.throws(() => service.execute(67005, [1101]), error => error.code === 5 && /progress is unavailable/.test(error.message));
  assert.equal(claimCount(store), 0);
});
