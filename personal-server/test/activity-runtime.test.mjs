import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createActivityStore } from '../game/activity-store.mjs';
import { createActivityRuntime } from '../game/activity-runtime.mjs';
import { applyActivityRuntimeLoginView, removeActivityLoginRows } from '../game/activity-online-sync.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { readGameTables } from '../config/game-tables.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const store = {
    inspect: action => action(db),
    read: () => ({ state: { serverId: 1 }, role: { level: 1 } })
  };
  const activityStore = createActivityStore({ store, now: () => 1_000_200_000 });
  const tables = { ActFrameAct: new Map([[1, { duration_day: 1, refer_day: 1, end_time: 0, state: [50], state_end_day: [1] }]]), Activity: new Map() };
  const window = { start: 1_000_100, end: 1_000_200 };
  const calendar = { serverOpenedAt: 1_000_000, activityReferenceOpenedAt: null, windowFor: () => window };
  return { db, store, activityStore, tables, calendar, window };
}

test('login records an instance and the tick settles it exactly once', t => {
  const { store, activityStore, tables, calendar } = fixture(t);
  const settled = [], changes = [];
  const runtime = createActivityRuntime({
    store, calendar, tables, activityStore,
    now: () => 1_000_150_000,
    onSettle: change => settled.push(change),
    onStageChanged: change => changes.push(change)
  });
  const login = runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  assert.equal(login.length, 1);
  assert.deepEqual(
    (({ actId, periodNo, stage, reason, visible, stateId }) => ({ actId, periodNo, stage, reason, visible, stateId }))(login[0]),
    { actId: 1, periodNo: 1, stage: 'running', reason: null, visible: true, stateId: 50 }
  );
  assert.equal(activityStore.instance(1, 1).stage, 'running');

  runtime.tick(1_000_250);
  assert.equal(activityStore.instance(1, 1).stage, 'closed');
  assert.equal(changes.length, 1);
  assert.equal(settled.length, 1);
  runtime.tick(1_000_260);
  assert.equal(settled.length, 1);
});

test('gate reads the persisted stage and rejects after the window', t => {
  const { store, activityStore, tables, calendar } = fixture(t);
  const runtime = createActivityRuntime({ store, calendar, tables, activityStore, now: () => 1_000_150_000 });
  runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  assert.equal(runtime.gate(1, 'operate', 1_000_150), true);
  assert.equal(runtime.gate(1, 'operate', 1_000_250), false);
});

test('role-level function locks pause login visibility without closing the server instance', t => {
  const { store, activityStore, calendar } = fixture(t);
  const tables = {
    ActFrameAct: new Map([[1, {
      duration_day: 1, refer_day: 1, end_time: 0, jump_func: 77,
      state: [50], state_end_day: [1]
    }]]),
    Activity: new Map()
  };
  const runtime = createActivityRuntime({
    store, calendar, tables, activityStore,
    featureService: { openIds: () => new Set() },
    now: () => 1_000_150_000
  });
  const login = runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  assert.equal(login[0].stage, 'closed');
  assert.equal(login[0].timelineStage, 'running');
  assert.equal(login[0].reason, 'function_locked');
  assert.equal(activityStore.instance(1, 1).stage, 'running');
  runtime.tick(1_000_160);
  assert.equal(activityStore.instance(1, 1).stage, 'running');
});

test('a client-incompatible hidden row can be removed from module 92 without affecting visible states', () => {
  const activity = {
    act_list: [
      { state_data: { act_id: 118003, cur_state_id: 50 }, module_login_data: 'rebate' },
      { state_data: { act_id: 20001, cur_state_id: 50 }, module_login_data: 'visible' }
    ],
    act_parallel_list: [],
    act_pause_list: [118003, 20001],
    act_custom_list: [{ act_id: 118003 }, { act_id: 20001 }]
  };
  const view = applyActivityRuntimeLoginView(activity, [
    { actId: 118003, stage: 'closed', stateId: null, window: null },
    { actId: 20001, stage: 'running', stateId: 50, window: { start: 100, end: 200 } }
  ]);
  assert.deepEqual(view.hidden, [118003]);
  assert.deepEqual(removeActivityLoginRows(activity, view.hidden), { removed: [118003], count: 1 });
  assert.deepEqual(activity.act_list.map(entry => Number(entry.state_data.act_id)), [20001]);
  assert.deepEqual(activity.act_pause_list, [20001]);
  assert.deepEqual(activity.act_custom_list.map(entry => Number(entry.act_id)), [20001]);
});

test('ActFrame stage windows persist at login and advance through show to closed', t => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const store = {
    inspect: action => action(db),
    read: () => ({ state: { serverId: 1 }, role: { level: 30 } })
  };
  const tables = readGameTables();
  const openedAt = 1794690000;
  const loginAt = Date.parse('2026-11-23T00:39:00+08:00') / 1000;
  const stage90At = Date.parse('2026-11-28T12:00:00+08:00') / 1000;
  const endAt = Date.parse('2026-11-29T00:00:00+08:00') / 1000;
  let clock = loginAt;
  const activityStore = createActivityStore({ store, now: () => clock * 1000 });
  const calendar = createActivityCalendar({ tables, serverOpenedAt: openedAt, now: () => clock * 1000 });
  const settled = [], changes = [];
  const runtime = createActivityRuntime({
    store, calendar, tables, activityStore,
    now: () => clock * 1000,
    onSettle: change => settled.push(change),
    onStageChanged: change => changes.push(change)
  });
  const activity = { act_list: [{ state_data: { act_id: 1085008 }, module_login_data: Buffer.alloc(0) }] };
  const login = runtime.synchronizeLogin(activity, loginAt);
  assert.equal(login.length, 1);
  assert.deepEqual(login[0].stages.map(stage => stage.stageId), [50, 90]);
  assert.equal(login[0].stateId, 50);

  const player = { data_list: [] }, server = { act_stage_list: [] };
  calendar.normalizeActFrameLogin(player, server, loginAt, {
    activityIds: [1085008], activity, runtimeStates: login
  });
  const serverRow = server.act_stage_list.find(row => Number(row.act_id) === 1085008);
  assert.deepEqual(serverRow.stage_time_list.map(row => Number(row.stage_id)), [50, 90]);
  assert.deepEqual(JSON.parse(activityStore.instance(1, 1085008, 8).stage_windows_json).map(row => row.stageId), [50, 90]);
  assert.equal(runtime.gate(1085008, 'operate', loginAt), true);

  clock = stage90At;
  runtime.tick(stage90At);
  assert.equal(activityStore.instance(1, 1085008, 8).stage, 'show');
  assert.equal(runtime.gate(1085008, 'operate', stage90At), false);
  assert.equal(settled.length, 1);
  assert.deepEqual(changes.map(change => [change.from, change.to]), [['running', 'show']]);

  clock = endAt;
  runtime.tick(endAt);
  assert.equal(activityStore.instance(1, 1085008, 8).stage, 'closed');
  assert.deepEqual(changes.map(change => [change.from, change.to]), [
    ['running', 'show'], ['show', 'closed']
  ]);
});
