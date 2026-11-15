import test from 'node:test';
import assert from 'node:assert/strict';
import {
  E,
  binary,
  createGameCodec,
  decodeEtf,
  encodeEtf,
  serializedBinary
} from '../protocol/game-codec.mjs';
import {
  createGrowthTargetService,
  GROWTH_TARGET_ACTIVITY_FUNC,
  GROWTH_TARGET_COMMANDS,
  GROWTH_TARGET_DECISION_ID
} from '../game/growth-target-service.mjs';
import { readGrowthTargetTables } from '../config/growth-target-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { isGrantableResource } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGrowthTargetTables();
const gameTables = readGameTables();
const serverOpenedAt = '2026-01-01T05:00:00+08:00';
const fixedNow = Date.parse('2026-01-02T10:00:00+08:00');
const activeActivityId = 18001;
const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-growth-target-',
    serverOpenedAt,
    now: () => fixedNow
  });
  let now = options.now ?? fixedNow;
  let service = createGrowthTargetService({
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
      service = createGrowthTargetService({
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

function completeTask(store, tid) {
  const task = tables.tasks.get(tid);
  assert.ok(task, `task ${tid} exists`);
  const typeConfig = gameTables.TaskType.get(Number(task.type));
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

function stateRow(store, actId = activeActivityId) {
  return store.inspect(db => db.prepare(`SELECT act_version,data_version,phase_award_json,task_award_json,finish_task_json
    FROM growth_target_state WHERE role_id=? AND act_id=?`).get(store.read().state.roleId, actId));
}

function response(type, result) {
  const schema = type === GROWTH_TARGET_COMMANDS.phaseAward
    ? 'pb_growth_target_phase_award_rsp'
    : 'pb_growth_target_task_award_rsp';
  return codec.unpack(schema, result.data);
}

function runtimeActivity(enterTime = 1700000000) {
  return {
    act_list: [{
      state_data: {
        act_id: activeActivityId,
        cur_state_id: 50,
        history_time: [{ state_id: 50, enter_time: enterTime }]
      },
      module_login_data: ''
    }],
    act_parallel_list: [],
    act_pause_list: [],
    act_custom_list: []
  };
}

test('GrowthTargetTable exposes three complete versions and independent rewards', () => {
  assert.deepEqual(tables.versionTids, [1, 2, 3]);
  assert.equal(tables.tasks.size, 666);
  assert.equal(tables.phases.size, 111);
  assert.equal(tables.constants.size, 3);
  for (const version of tables.versionTids) {
    const phases = tables.phasesByVersion.get(version);
    assert.equal(phases.size, 37);
    for (const phase of phases.values()) assert.equal(tables.tasksByPhase.get(phase.tid).length, 6);
  }

  let daily = 0;
  let producible = 0;
  for (const task of tables.tasks.values()) {
    if (Number(task.period) === 1) daily += 1;
    const type = gameTables.TaskType.get(Number(task.type));
    if (Number(task.period) === 2
        && (Number(type?.progress_type) === 2
        || (Number(type?.progress_type) === 1 && Number(type?.progress_fun) === 2))) producible += 1;
    for (const [id] of task.award_list) assert.equal(isGrantableResource(id, gameTables), true, `task reward ${id}`);
  }
  assert.equal(daily, 81);
  assert.equal(producible, 27);
  for (const phase of tables.phases.values()) {
    for (const [id] of phase.award_list) assert.equal(isGrantableResource(id, gameTables), true, `phase reward ${id}`);
  }
  assert.deepEqual(
    [...new Set([...gameTables.Activity.values()].filter(row => Number(row.func) === GROWTH_TARGET_ACTIVITY_FUNC).map(row => row.tid))].sort(),
    [18001, 18002, 18003]
  );
});

test('69007 claims a completed task, keeps finish and award states separate and survives reopening', async t => {
  const harness = setup(t);
  completeTask(harness.store, 100106);
  const itemBefore = resource(harness.store, 1581200);
  const currencyBefore = resource(harness.store, 201500);
  const result = harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, {
    act_tid: activeActivityId,
    task_tid_list: [100106]
  });
  assert.ok(Buffer.isBuffer(result.data));
  assert.equal(resource(harness.store, 1581200), itemBefore + 15n);
  assert.equal(resource(harness.store, 201500), currencyBefore + 2000n);
  const body = response(GROWTH_TARGET_COMMANDS.taskAward, result);
  assert.deepEqual(body.act_data.task_award_list.map(Number), [100106]);
  assert.deepEqual(body.act_data.finish_task_list.map(Number), [100106]);
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100106] }),
    error => error.code === 310 && error.message.includes(`decisionId=${GROWTH_TARGET_DECISION_ID}`)
  );

  harness.reopen();
  const activity = runtimeActivity();
  assert.deepEqual(harness.service.synchronizeLogin(activity), [activeActivityId]);
  const decoded = await decodeEtf(Buffer.from(activity.act_list[0].module_login_data, 'base64'));
  const role = codec.unpack('pb_growth_target_role', decoded.value);
  assert.deepEqual(role.act_data_list[0].task_award_list.map(Number), [100106]);
  assert.deepEqual(role.act_data_list[0].finish_task_list.map(Number), [100106]);
});

test('incomplete, daily, unavailable and cross-version tasks fail before state or rewards change', t => {
  const { store, service } = setup(t);
  const currencyBefore = resource(store, 201500);
  assert.throws(
    () => service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100106] }),
    error => error.code === 5 && /not complete/.test(error.message) && error.message.includes('decisionId=')
  );
  assert.throws(
    () => service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100206] }),
    error => error.code === 5 && /day-scoped producer/.test(error.message)
  );
  assert.throws(
    () => service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100101] }),
    error => error.code === 5 && /progress_fun/.test(error.message)
  );
  assert.throws(
    () => service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [200106] }),
    error => error.code === 1 && /does not belong/.test(error.message)
  );
  assert.equal(resource(store, 201500), currencyBefore);
  assert.equal(stateRow(store), undefined);
});

test('69006 uses finish_task_list independently from task_award_list', async t => {
  const harness = setup(t, {
    progressForTask: ({ task }) => Number(task.target_count)
  });
  const phaseTid = 1001;
  const result = harness.service.execute(GROWTH_TARGET_COMMANDS.phaseAward, {
    act_tid: activeActivityId,
    phase_tid: phaseTid
  });
  const body = response(GROWTH_TARGET_COMMANDS.phaseAward, result);
  assert.deepEqual(body.act_data.phase_award_list.map(Number), [phaseTid]);
  assert.deepEqual(body.act_data.task_award_list, []);
  assert.deepEqual(
    body.act_data.finish_task_list.map(Number),
    tables.tasksByPhase.get(phaseTid).map(task => task.tid)
  );
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.phaseAward, { act_tid: activeActivityId, phase_tid: phaseTid }),
    error => error.code === 310 && error.message.includes('decisionId=')
  );

  harness.reopen({ progressForTask: () => 0 });
  const activity = runtimeActivity(1711111111);
  harness.service.synchronizeLogin(activity);
  const decoded = await decodeEtf(Buffer.from(activity.act_list[0].module_login_data, 'base64'));
  const role = codec.unpack('pb_growth_target_role', decoded.value);
  assert.deepEqual(role.act_data_list[0].phase_award_list.map(Number), [phaseTid]);
  assert.equal(activity.act_list[0].state_data.history_time[0].enter_time, 1711111111);
});

test('69006 fails closed when any phase task lacks a proven completion producer', t => {
  const { store, service } = setup(t);
  assert.throws(
    () => service.execute(GROWTH_TARGET_COMMANDS.phaseAward, { act_tid: activeActivityId, phase_tid: 1001 }),
    error => error.code === 5 && error.message.includes('decisionId=')
  );
  assert.equal(stateRow(store), undefined);
});

test('activity selection, pre-open and unknown activity fail before writes', t => {
  const harness = setup(t, { now: Date.parse('2026-01-01T04:59:00+08:00') });
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100106] }),
    error => error.code === 309 && /not running/.test(error.message)
  );
  harness.setNow(fixedNow);
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: 18002, task_tid_list: [200106] }),
    error => error.code === 309 && /not running/.test(error.message)
  );
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: 999999, task_tid_list: [100106] }),
    error => error.code === 1 && /Unknown growth target activity/.test(error.message)
  );
  assert.equal(stateRow(harness.store), undefined);
});

test('login synchronization derives and persists supported finish_task rows without claiming awards', async t => {
  const harness = setup(t);
  completeTask(harness.store, 100106);
  const activity = runtimeActivity();
  assert.deepEqual(harness.service.synchronizeLogin(activity), [activeActivityId]);
  const decoded = await decodeEtf(Buffer.from(activity.act_list[0].module_login_data, 'base64'));
  const role = codec.unpack('pb_growth_target_role', decoded.value);
  assert.deepEqual(role.act_data_list[0].task_award_list, []);
  assert.deepEqual(role.act_data_list[0].finish_task_list.map(Number), [100106]);
  const row = stateRow(harness.store);
  assert.equal(JSON.parse(row.finish_task_json).includes(100106), true);
  assert.deepEqual(JSON.parse(row.task_award_json), []);
});

test('ETF-enveloped and bare protobuf requests decode to the same command payload', async t => {
  const { service } = setup(t);
  const payload = codec.pack('pb_growth_target_task_award_req', {
    act_tid: activeActivityId,
    task_tid_list: [100106]
  });
  const bare = await service.decode(GROWTH_TARGET_COMMANDS.taskAward, payload, {
    unpack: codec.unpack.bind(codec)
  });
  assert.equal(Number(bare.act_tid), activeActivityId);
  assert.deepEqual(bare.task_tid_list.map(Number), [100106]);

  const encoded = await encodeEtf([
    new E.OtpErlangAtom('req_growth_target_task_award'),
    binary(payload)
  ]);
  const enveloped = await service.decode(GROWTH_TARGET_COMMANDS.taskAward, encoded, {
    unpack: codec.unpack.bind(codec),
    etf: decodeEtf
  });
  assert.equal(Number(enveloped.act_tid), activeActivityId);
  assert.deepEqual(enveloped.task_tid_list.map(Number), [100106]);

  const wrong = await encodeEtf([
    new E.OtpErlangAtom('req_growth_target_phase_award'),
    binary(payload)
  ]);
  await assert.rejects(
    () => service.decode(GROWTH_TARGET_COMMANDS.taskAward, wrong, { unpack: codec.unpack.bind(codec), etf: decodeEtf }),
    error => error.code === 1 && /does not match/.test(error.message)
  );
});

test('response encoding failure rolls back task award and resources', t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_growth_target_task_award_rsp') throw new Error('growth target encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { codec: failingCodec });
  completeTask(harness.store, 100106);
  const itemBefore = resource(harness.store, 1581200);
  const currencyBefore = resource(harness.store, 201500);
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100106] }),
    /growth target encode failure/
  );
  assert.equal(resource(harness.store, 1581200), itemBefore);
  assert.equal(resource(harness.store, 201500), currencyBefore);
  assert.equal(stateRow(harness.store), undefined);
});

test('SQLite state failure rolls back task award and resources', t => {
  const harness = setup(t);
  completeTask(harness.store, 100106);
  const itemBefore = resource(harness.store, 1581200);
  harness.store.inspect(db => db.exec(`
    CREATE TRIGGER reject_growth_target_state
    BEFORE INSERT ON growth_target_state
    BEGIN SELECT RAISE(ABORT, 'Injected growth target storage failure'); END;
  `));
  assert.throws(
    () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, { act_tid: activeActivityId, task_tid_list: [100106] }),
    /Injected growth target storage failure/
  );
  assert.equal(resource(harness.store, 1581200), itemBefore);
  assert.equal(stateRow(harness.store), undefined);
});

test('malformed persisted id lists reject as corrupt instead of collapsing to empty state', t => {
  const harness = setup(t);
  completeTask(harness.store, 100106);
  const currencyBefore = resource(harness.store, 201500);
  harness.store.inspect(db => db.prepare(`INSERT INTO growth_target_state
    (role_id,act_id,act_version,data_version,phase_award_json,task_award_json,finish_task_json,updated_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    harness.store.read().state.roleId,
    activeActivityId,
    1,
    0,
    '[]',
    '[]',
    '[]',
    new Date(fixedNow).toISOString()
  ));
  for (const [column, malformed] of [
    ['phase_award_json', '[1001,0]'],
    ['task_award_json', '[100106,"100107"]'],
    ['finish_task_json', '[100106,1.5]']
  ]) {
    harness.store.inspect(db => db.prepare(`UPDATE growth_target_state SET ${column}=? WHERE role_id=? AND act_id=?`)
      .run(malformed, harness.store.read().state.roleId, activeActivityId));
    const persistedBefore = JSON.stringify(stateRow(harness.store));
    assert.throws(
      () => harness.service.execute(GROWTH_TARGET_COMMANDS.taskAward, {
        act_tid: activeActivityId,
        task_tid_list: [100106]
      }),
      error => error.code === 5 && /state is corrupt/.test(error.message)
        && error.message.includes(`decisionId=${GROWTH_TARGET_DECISION_ID}`)
    );
    assert.equal(resource(harness.store, 201500), currencyBefore);
    assert.equal(JSON.stringify(stateRow(harness.store)), persistedBefore);
  }
});
