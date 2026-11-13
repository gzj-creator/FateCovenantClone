import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createActivityStore } from '../game/activity-store.mjs';
import { createActivityRuntime } from '../game/activity-runtime.mjs';

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
