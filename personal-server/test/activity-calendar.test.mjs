import test from 'node:test';
import assert from 'node:assert/strict';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar, serverDayNumber } from '../game/activity-calendar.mjs';

const SERVER_OPENED_AT = 1792789200;
const DAY = 86400;
const tables = readGameTables();

function calendarAt(seconds) {
  return createActivityCalendar({ tables, serverOpenedAt: SERVER_OPENED_AT, now: () => seconds * 1000 });
}

test('maps the local opening epoch to activity days and 05:00 boundaries', () => {
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT - 1), 0);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT), 1);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + DAY - 1), 1);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + DAY), 2);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + 7 * DAY), 8);
});

test('opens only the fishing generation assigned to the current server day', () => {
  const at = seconds => calendarAt(seconds);
  assert.deepEqual(at(SERVER_OPENED_AT - 1).activeFishingActivityIds(), []);
  assert.deepEqual(at(SERVER_OPENED_AT).activeFishingActivityIds(), [1074003]);
  assert.equal(at(SERVER_OPENED_AT).activeFishingActivityId(), 1074003);

  assert.deepEqual(at(SERVER_OPENED_AT + 5 * DAY - 1).activeFishingActivityIds(), [1074003]);
  assert.deepEqual(at(SERVER_OPENED_AT + 5 * DAY).activeFishingActivityIds(), []);
  assert.deepEqual(at(SERVER_OPENED_AT + 7 * DAY).activeFishingActivityIds(), []);

  assert.deepEqual(at(SERVER_OPENED_AT + 10 * DAY).activeFishingActivityIds(), [1074005]);
  assert.deepEqual(at(SERVER_OPENED_AT + 20 * DAY).activeFishingActivityIds(), [1074007]);
  assert.deepEqual(at(SERVER_OPENED_AT + 21 * DAY).activeFishingActivityIds(), [1074007, 1074010]);
  assert.equal(at(SERVER_OPENED_AT + 21 * DAY).activeFishingActivityId(), 1074010);
});

test('filters expired custom activities while preserving a live parallel group payload', () => {
  const at = SERVER_OPENED_AT + 7 * DAY;
  const activity = {
    act_list: [],
    act_parallel_list: [
      {
        module_login_data: 'expired-sixth',
        states_data: [{ act_id: 83028, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: '1792927601' }] }]
      },
      {
        module_login_data: 'live-sprint',
        states_data: [{ act_id: 12014, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: '1792875600' }] }]
      }
    ],
    act_pause_list: [],
    act_custom_list: [
      { act_id: 83028, fun_id: 83, start_time: 1792530000, end_time: 1792962000 },
      { act_id: 12014, fun_id: 12, start_time: 1792875600, end_time: 1793545200 }
    ]
  };

  const result = calendarAt(at).applyLoginSchedule(activity, at);
  assert.deepEqual(result.fishingActivityIds, []);
  assert.deepEqual(activity.act_parallel_list.map(group => ({
    ids: group.states_data.map(state => Number(state.act_id)),
    payload: group.module_login_data
  })), [{ ids: [12014], payload: 'live-sprint' }]);
  assert.deepEqual(activity.act_custom_list.map(row => Number(row.act_id)), [12014]);
  assert.equal(activity.act_list.some(entry => Number(entry.state_data?.act_id) === 83028), false);
});

test('applies join-day and server-opening limits before an activity window opens', () => {
  const joinDayTables = {
    Activity: new Map([[900001, {
      tid: 900001,
      server_day: 1,
      server_start_time: 18000,
      duration_day: 5,
      end_time: 18000,
      join_server_day: 3,
      server_mini_open_limited: 0,
      server_max_open_limited: 0
    }]]),
    ActFrameAct: new Map()
  };
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const onDay = day => createActivityCalendar({
    tables: joinDayTables,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => (SERVER_OPENED_AT + day * DAY) * 1000
  });
  assert.equal(onDay(0).isActivityRunning(900001, { act_id: 900001, cur_state_id: 50 }, activity), false);
  assert.equal(onDay(1).isActivityRunning(900001, { act_id: 900001, cur_state_id: 50 }, activity), false);
  assert.equal(onDay(2).isActivityRunning(900001, { act_id: 900001, cur_state_id: 50 }, activity), true);

  const limitedTables = {
    Activity: new Map(),
    ActFrameAct: new Map([[900002, {
      tid: 900002,
      refer_day: 1,
      server_start_time: 18000,
      duration_day: 5,
      end_time: 18000,
      server_day_limit: 0,
      server_mini_open_limited: SERVER_OPENED_AT + DAY,
      server_max_open_limited: SERVER_OPENED_AT + 2 * DAY
    }]])
  };
  const early = createActivityCalendar({
    tables: limitedTables,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => SERVER_OPENED_AT * 1000
  });
  const eligible = createActivityCalendar({
    tables: limitedTables,
    serverOpenedAt: SERVER_OPENED_AT + DAY,
    now: () => (SERVER_OPENED_AT + DAY) * 1000
  });
  const late = createActivityCalendar({
    tables: limitedTables,
    serverOpenedAt: SERVER_OPENED_AT + 3 * DAY,
    now: () => (SERVER_OPENED_AT + 3 * DAY) * 1000
  });
  assert.equal(early.isActivityRunning(900002, { act_id: 900002, cur_state_id: 50 }, activity), false);
  assert.equal(eligible.isActivityRunning(900002, { act_id: 900002, cur_state_id: 50 }, activity), true);
  assert.equal(late.isActivityRunning(900002, { act_id: 900002, cur_state_id: 50 }, activity), false);
});

test('adds the current fishing activity once and does not override a server pause', () => {
  const calendar = calendarAt(SERVER_OPENED_AT + 3600);
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const result = calendar.applyLoginSchedule(activity, SERVER_OPENED_AT + 3600);
  assert.deepEqual(result.fishingActivityIds, [1074003]);
  assert.equal(activity.act_list.filter(entry => Number(entry.state_data?.act_id) === 1074003).length, 1);
  assert.equal(activity.act_list[0].state_data.cur_state_id, 50);
  assert.equal(activity.act_list[0].state_data.history_time[0].enter_time, SERVER_OPENED_AT);

  const paused = { act_list: [], act_parallel_list: [], act_pause_list: [1074003], act_custom_list: [] };
  const pausedResult = calendar.applyLoginSchedule(paused, SERVER_OPENED_AT + 3600);
  assert.deepEqual(pausedResult.fishingActivityIds, []);
  assert.deepEqual(paused.act_pause_list, [1074003]);
  assert.equal(paused.act_list.some(entry => Number(entry.state_data?.act_id) === 1074003), false);
  assert.equal(calendar.isActivityRunning(1074003, null, paused, SERVER_OPENED_AT + 3600), false);

  const again = calendar.applyLoginSchedule(activity, SERVER_OPENED_AT + 3601);
  assert.deepEqual(again.fishingActivityIds, [1074003]);
  assert.equal(activity.act_list.filter(entry => Number(entry.state_data?.act_id) === 1074003).length, 1);
});

test('all-open mode retains every stored activity, clears pauses and selects the test fishing version', () => {
  const at = SERVER_OPENED_AT + 7 * DAY;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const activity = {
    act_list: [
      { state_data: { act_id: 1074003, cur_state_id: 90 }, module_login_data: 'closed-fishing' }
    ],
    act_parallel_list: [
      { module_login_data: 'expired-contract', states_data: [{ act_id: 83028, cur_state_id: 90 }] }
    ],
    act_pause_list: [1074003],
    act_custom_list: [
      { act_id: 83028, start_time: 1792530000, end_time: 1792962000 }
    ]
  };

  const result = calendar.applyLoginSchedule(activity, at);
  assert.deepEqual(result.fishingActivityIds, [1074011]);
  assert.deepEqual(activity.act_list.map(entry => Number(entry.state_data.act_id)), [1074003, 1074011]);
  assert.ok(activity.act_list.every(entry => Number(entry.state_data.cur_state_id) === 50));
  assert.deepEqual(activity.act_parallel_list[0].states_data, [{ act_id: 83028, cur_state_id: 50 }]);
  assert.deepEqual(activity.act_custom_list, [{ act_id: 83028, start_time: 0, end_time: 0 }]);
  assert.deepEqual(activity.act_pause_list, []);
  assert.equal(calendar.isActivityRunning(83028, null, activity, at), true);
  assert.equal(calendar.activeFishingActivityId(at, activity), 1074011);
});
