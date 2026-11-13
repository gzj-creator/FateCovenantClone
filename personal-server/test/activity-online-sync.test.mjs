import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createActivityStore } from '../game/activity-store.mjs';
import {
  ACTIVITY_PUSH_TYPES,
  activityClientStageId,
  activityStatusForStage,
  applyActivityRuntimeLoginView,
  buildActivityStagePush,
  createActivityOnlineSync
} from '../game/activity-online-sync.mjs';

const codec = createGameCodec();

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const store = {
    inspect: action => action(db),
    read: () => ({ state: { serverId: 1 } })
  };
  return { db, store, activityStore: createActivityStore({ store, now: () => 1_500_000 }) };
}

function instance(activityStore, { actId = 101 } = {}) {
  return activityStore.upsertInstance({
    serverId: 1,
    actId,
    periodNo: 1,
    family: 'fixture',
    previewAt: 1_000,
    openAt: 1_000,
    closeAt: 2_000,
    claimUntil: 2_100,
    showUntil: 2_200,
    stage: 'running'
  });
}

test('maps the four proven client stage ids and refuses an unknown close id', () => {
  assert.deepEqual(
    ['preview', 'running', 'claim', 'show'].map(status => [status, activityClientStageId(status)]),
    [['preview', 10], ['running', 50], ['claim', 60], ['show', 90]]
  );
  assert.equal(activityStatusForStage(60), 'claim');
  assert.equal(activityClientStageId('closed'), null);
  assert.equal(activityClientStageId(0), null);
});

test('ActFrame online changes use 3304 with a real activity stage row', t => {
  const { activityStore } = fixture(t);
  const row = instance(activityStore);
  const tables = { ActFrameAct: new Map([[101, { type: 1102 }]]), Activity: new Map() };
  const result = buildActivityStagePush({
    codec,
    tables,
    instance: row,
    change: { actId: 101, periodNo: 1, from: 'running', to: 'claim' },
    at: 1_500
  });
  assert.equal(result.ok, true);
  assert.equal(result.type, ACTIVITY_PUSH_TYPES.ACT_FRAME_STAGE_CHANGE);
  const decoded = codec.unpack('pb_act_frame_stage_push', result.data);
  assert.deepEqual(decoded.act_stage_list.map(value => ({
    act_id: Number(value.act_id),
    type: Number(value.type),
    start_time: Number(value.start_time),
    end_time: Number(value.end_time),
    cur_stage_id: Number(value.cur_stage_id),
    is_pause: value.is_pause === true,
    ignore_fix_time: value.ignore_fix_time === true,
    loop_count: Number(value.loop_count ?? 0),
    stage_time_list: value.stage_time_list.map(stage => ({
      stage_id: Number(stage.stage_id),
      start_time: Number(stage.start_time),
      end_time: Number(stage.end_time)
    }))
  })), [{
    act_id: 101,
    type: 1102,
    start_time: 1_000,
    end_time: 2_200,
    cur_stage_id: 60,
    is_pause: false,
    ignore_fix_time: false,
    loop_count: 0,
    stage_time_list: [{ stage_id: 60, start_time: 1_500, end_time: 2_200 }]
  }]);
});

test('legacy ActivityTable changes use 3301 without fabricating family module bytes', t => {
  const { activityStore } = fixture(t);
  const row = instance(activityStore);
  const tables = { ActFrameAct: new Map(), Activity: new Map([[101, { func: 20 }]]) };
  const result = buildActivityStagePush({
    codec,
    tables,
    instance: row,
    change: { actId: 101, periodNo: 1, from: 'preview', to: 'running' },
    at: 1_500
  });
  assert.equal(result.ok, true);
  assert.equal(result.type, ACTIVITY_PUSH_TYPES.LEGACY_STATE_CHANGE);
  const decoded = codec.unpack('pb_act_state_change_back', result.data);
  assert.equal(decoded.change_back_data.length, 1);
  const change = decoded.change_back_data[0];
  assert.equal(Number(change.id), 101);
  assert.equal(Number(change.exit_state), 10);
  assert.equal(Number(change.enter_state), 50);
  assert.equal(Number(change.enter_time), 1_500);
  assert.equal(Buffer.from(change.module_exit_data ?? []).length, 0);
  assert.equal(Buffer.from(change.module_enter_data ?? []).length, 0);
});

test('online sync fails closed for closed stages, missing config and missing instances', t => {
  const { store, activityStore } = fixture(t);
  const row = instance(activityStore);
  const frame = buildActivityStagePush({
    codec,
    tables: { ActFrameAct: new Map([[101, { type: 1102 }]]), Activity: new Map() },
    instance: row,
    change: { actId: 101, from: 'show', to: 'closed' },
    at: 1_500
  });
  assert.deepEqual(frame, { ok: false, reason: 'closed_stage_not_mapped' });
  assert.equal(buildActivityStagePush({
    codec, tables: { ActFrameAct: new Map(), Activity: new Map() }, instance: row,
    change: { actId: 999, from: 'running', to: 'claim' }, at: 1_500
  }).reason, 'missing_activity_config');

  const logs = [];
  const service = createActivityOnlineSync({
    codec, store, activityStore,
    tables: { ActFrameAct: new Map([[101, { type: 1102 }]]), Activity: new Map() },
    now: () => 1_500_000,
    logger: event => logs.push(event)
  });
  assert.equal(service.projectStageChange({ actId: 101, periodNo: 2, from: 'running', to: 'claim' }), null);
  assert.deepEqual(logs.map(event => [event.event, event.reason]), [['activity_stage_push_skipped', 'invalid_instance_window']]);
});

test('runtime login view preserves closed protocol rows and pauses their activity ids', () => {
  const activity = {
    act_list: [
      { state_data: { act_id: 1, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: '1000' }] }, module_login_data: Buffer.from('one') },
      { state_data: { act_id: 2, cur_state_id: 50, history_time: [] }, module_login_data: Buffer.from('two') }
    ],
    act_parallel_list: [{
      states_data: [
        { act_id: 3, cur_state_id: 50, history_time: [] },
        { act_id: 4, cur_state_id: 50, history_time: [] }
      ],
      module_login_data: Buffer.from('parallel')
    }],
    act_pause_list: [2, 3],
    act_custom_list: [
      { act_id: 1, start_time: 1, end_time: 2 },
      { act_id: 2, start_time: 1, end_time: 2 },
      { act_id: 3, start_time: 1, end_time: 2 }
    ]
  };
  const states = [
    { actId: 1, stage: 'running', stateId: 50, stateStart: 1_000, window: { start: 1_000, end: 2_000 } },
    { actId: 2, stage: 'closed', visible: false },
    { actId: 3, stage: 'claim', stateId: 60, stateStart: 1_400, window: { start: 1_000, end: 2_100 } },
    { actId: 4, stage: 'closed', visible: false }
  ];
  const view = applyActivityRuntimeLoginView(activity, states);
  assert.deepEqual(view.hidden, [2, 4]);
  assert.deepEqual(view.paused, [2, 4]);
  assert.deepEqual(activity.act_list.map(row => [Number(row.state_data.act_id), Number(row.state_data.cur_state_id)]), [[1, 50], [2, 50]]);
  assert.deepEqual(activity.act_parallel_list.flatMap(group => group.states_data.map(row => [Number(row.act_id), Number(row.cur_state_id)])), [[3, 60], [4, 50]]);
  assert.equal(Number(activity.act_parallel_list[0].states_data[0].history_time.at(-1).enter_time), 1_400);
  assert.deepEqual(activity.act_pause_list, [2, 3, 4]);
  assert.deepEqual(activity.act_custom_list.map(row => [Number(row.act_id), Number(row.start_time), Number(row.end_time)]), [
    [1, 1_000, 2_000], [2, 1, 2], [3, 1_000, 2_100]
  ]);
});
