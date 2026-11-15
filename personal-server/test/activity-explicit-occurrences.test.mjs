import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readGameTables } from '../config/game-tables.mjs';
import {
  r1FirstBusinessDayAtOrAfter,
  r1GroupOpeningDay,
  resolveR1ActivityOccurrences
} from '../config/activity-explicit-occurrences.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { activityStateAt } from '../game/activity-lifecycle.mjs';
import { createActivityRuntime } from '../game/activity-runtime.mjs';
import { createActivityStore } from '../game/activity-store.mjs';

const OPENED_AT = 1794477600; // 2026-11-12 18:00 Asia/Shanghai, the R1 example.
const DAY = 86400;
const tables = readGameTables();
const occurrences = resolveR1ActivityOccurrences({ tables, serverId: 3, serverOpenedAt: OPENED_AT });
const byId = new Map(occurrences.map(occurrence => [occurrence.actId, occurrence]));

test('R1 explicit first occurrences resolve to the documented integer windows', () => {
  assert.deepEqual(
    occurrences.map(occurrence => ({
      actId: occurrence.actId,
      start: occurrence.start,
      end: occurrence.end,
      occurrenceId: occurrence.occurrenceId,
      instanceKey: occurrence.instanceKey
    })),
    [
      {
        actId: 175001, start: 1750971600, end: 1756587600,
        occurrenceId: 'R1-DYN-175001/first',
        instanceKey: 'R1-20261115/server/3/175001/1/first/1750971600'
      },
      {
        actId: 1036008, start: 1801170000, end: 1802379000,
        occurrenceId: 'R1-DYN-1036008/first',
        instanceKey: 'R1-20261115/cross-group/r1-local-singleton%3A3/1036008/3/first/1801170000'
      },
      {
        actId: 1037001, start: 1796850000, end: 1797195600,
        occurrenceId: 'R1-DYN-1037001/first',
        instanceKey: 'R1-20261115/cross-group/r1-local-singleton%3A3/1037001/10/first/1796850000'
      },
      {
        actId: 1037002, start: 1802120400, end: 1802466000,
        occurrenceId: 'R1-DYN-1037002/first',
        instanceKey: 'R1-20261115/cross-group/r1-local-singleton%3A3/1037002/11/first/1802120400'
      }
    ]
  );
  assert.equal(byId.get(1037001).scope, 'cross-group');
  assert.equal(byId.get(1037001).group.masterServerId, 3);
  assert.deepEqual(byId.get(1037001).group.memberServerIds, [3]);
  assert.equal(byId.get(175001).scopeId, '3');
  assert.equal(byId.get(175001).parentActId, 174001);
  assert.equal(byId.get(175001).stages.length, 1);
  assert.equal(byId.get(175001).stages[0].stageId, 50);
});

test('R1 group day uses its own 05:00 boundary and dream deferral lands on the next 05:00', () => {
  const midnightOpening = Date.parse('2026-11-12T00:00:00+08:00') / 1000;
  assert.equal(r1GroupOpeningDay(midnightOpening - 1, midnightOpening), 0);
  assert.equal(r1GroupOpeningDay(midnightOpening, midnightOpening), 1);
  assert.equal(
    r1GroupOpeningDay(Date.parse('2026-11-12T04:59:59+08:00') / 1000, midnightOpening),
    1
  );
  assert.equal(
    r1GroupOpeningDay(Date.parse('2026-11-12T05:00:00+08:00') / 1000, midnightOpening),
    2
  );
  const exactFive = Date.parse('2026-12-14T05:00:00+08:00') / 1000;
  const twentyTwo = Date.parse('2026-12-13T22:00:00+08:00') / 1000;
  assert.equal(r1FirstBusinessDayAtOrAfter(exactFive), exactFive);
  assert.equal(
    r1FirstBusinessDayAtOrAfter(twentyTwo),
    Date.parse('2026-12-14T05:00:00+08:00') / 1000
  );
});

test('explicit occurrences do not recur after their finite first period', () => {
  const occurrence = byId.get(1036008);
  const at = occurrence.end + DAY;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: OPENED_AT,
    explicitOccurrences: occurrences,
    now: () => at * 1000
  });
  assert.equal(calendar.isActivityRunning(1036008, null, null, occurrence.end - 1), true);
  assert.equal(calendar.isActivityRunning(1036008, null, null, occurrence.end), false);
  assert.equal(calendar.isActivityRunning(1036008, null, null, at), false);
  assert.equal(calendar.windowFor(1036008, null, at).start, occurrence.start);
});

test('explicit dream stages drive module 92, module 183 and persisted lifecycle state', t => {
  const occurrence = byId.get(1037001);
  const stage50 = occurrence.stages[0];
  const stage90 = occurrence.stages[1];
  assert.equal(activityStateAt(tables.ActFrameAct.get(1037001), occurrence, stage50.end - 1).stateId, 50);
  assert.equal(activityStateAt(tables.ActFrameAct.get(1037001), occurrence, stage50.end).stateId, 90);

  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const store = {
    inspect: action => action(db),
    read: () => ({ state: { serverId: 3 }, role: { level: 1, createDay: 1 } })
  };
  const activityStore = createActivityStore({ store, now: () => (stage50.end + 30) * 1000 });
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: OPENED_AT,
    explicitOccurrences: occurrences,
    now: () => (stage50.end + 30) * 1000
  });
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const schedule = calendar.applyLoginSchedule(activity, stage50.end + 30);
  assert.deepEqual(schedule.explicitActivityIds, [1037001]);
  assert.equal(activity.act_list.some(row => Number(row.state_data.act_id) === 1037001), true);
  assert.equal(activity.act_custom_list.find(row => Number(row.act_id) === 1037001).start_time, occurrence.start);

  const runtime = createActivityRuntime({ store, calendar, tables, activityStore, now: () => (stage50.end + 30) * 1000 });
  const states = runtime.synchronizeLogin(activity, stage50.end + 30);
  const state = states.find(row => row.actId === 1037001);
  assert.equal(state.stage, 'show');
  assert.equal(state.periodNo, 1);
  assert.deepEqual(state.stages.map(stage => [stage.stageId, stage.start, stage.end]), [
    [50, stage50.start, stage50.end],
    [90, stage90.start, stage90.end]
  ]);

  const stored = activityStore.instance(3, 1037001, 1);
  assert.equal(stored.instance_key, occurrence.instanceKey);
  assert.equal(stored.baseline, 'R1-20261115');
  assert.equal(stored.scope, 'cross-group');
  assert.equal(stored.scope_id, 'r1-local-singleton:3');
  assert.equal(stored.act_version, 10);
  assert.equal(stored.occurrence_id, 'R1-DYN-1037001/first');
  assert.equal(stored.group_master_server_id, 3);
  assert.equal(stored.group_master_opened_at, OPENED_AT);

  const player = { data_list: [] };
  const server = { act_stage_list: [] };
  const normalized = calendar.normalizeActFrameLogin(player, server, stage50.end + 30, {
    activityIds: [1037001], activity, runtimeStates: states
  });
  assert.deepEqual(normalized.activityIds, [1037001]);
  assert.deepEqual(server.act_stage_list[0].stage_time_list, [
    { stage_id: 50, start_time: String(stage50.start), end_time: String(stage50.end) },
    { stage_id: 90, start_time: String(stage90.start), end_time: String(stage90.end) }
  ]);
  assert.equal(server.act_stage_list[0].cur_stage_id, 90);
  assert.equal(player.data_list[0].act_stage.cur_stage_id, 90);
  runtime.tick(stage50.end + 31);
  assert.equal(activityStore.instance(3, 1037001, 1).stage, 'show');
  assert.equal(runtime.gate(1037001, 'operate', stage50.end + 1), false);
  assert.equal(runtime.gate(1037001, 'read', stage50.end + 1), true);
});

test('unregistered time function 461 remains fail-closed', () => {
  const actId = 900009;
  const calendar = createActivityCalendar({
    tables: {
      Activity: new Map(),
      ActFrameAct: new Map([[actId, {
        tid: actId, type: 1038, time_type: 5, time_fun: 461, time_fun_args: [29, 1, 0],
        world_time: 0, refer_day: 0, duration_day: 4, end_time: 18000
      }]])
    },
    serverOpenedAt: OPENED_AT,
    now: () => OPENED_AT * 1000
  });
  assert.equal(calendar.isActivityRunning(actId, null, null, OPENED_AT), false);
});
