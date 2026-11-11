import test from 'node:test';
import assert from 'node:assert/strict';
import { readGameTables } from '../config/game-tables.mjs';
import { activityDurationDays, activityWindow, createActivityCalendar, dayZero, serverDayNumber } from '../game/activity-calendar.mjs';

const SERVER_OPENED_AT = 1792789200;
const ACTIVITY_REFERENCE_OPENED_AT = 1790784000;
const PUBLIC_SERVER_OPENED_AT = 1794326400;
const DAY = 86400;
const tables = readGameTables();

function calendarAt(seconds) {
  return createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => seconds * 1000
  });
}

test('maps the local opening epoch to activity days and 05:00 boundaries', () => {
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT - 1), 0);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT), 1);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + DAY - 1), 1);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + DAY), 2);
  assert.equal(serverDayNumber(SERVER_OPENED_AT, SERVER_OPENED_AT + 7 * DAY), 8);
});

test('rebases world-time activities from the reference server open to the target server open', () => {
  const whiteRibbon = tables.ActFrameAct.get(1102010);
  const window = activityWindow(whiteRibbon, PUBLIC_SERVER_OPENED_AT, ACTIVITY_REFERENCE_OPENED_AT);
  assert.deepEqual(window, {
    start: 1795640400,
    end: 1796072400,
    kind: 'server-relative-world'
  });

  const at = seconds => createActivityCalendar({
    tables,
    serverOpenedAt: PUBLIC_SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => seconds * 1000
  });
  assert.equal(at(window.start - 1).isActivityRunning(1102010, null), false);
  assert.equal(at(window.start).isActivityRunning(1102010, null), true);
  assert.equal(at(window.end - 1).isActivityRunning(1102010, null), true);
  assert.equal(at(window.end).isActivityRunning(1102010, null), false);
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, window.start), 16);
});

test('prefers an explicit world time over redundant server-day defaults', () => {
  const config = tables.ActFrameAct.get(182001);
  const window = activityWindow(config, PUBLIC_SERVER_OPENED_AT, ACTIVITY_REFERENCE_OPENED_AT);
  assert.equal(config.refer_day, 1);
  assert.equal(window.kind, 'server-relative-world');
  assert.equal(window.start, Number(config.world_time) + PUBLIC_SERVER_OPENED_AT - ACTIVITY_REFERENCE_OPENED_AT);
  assert.notEqual(window.start, PUBLIC_SERVER_OPENED_AT + 5 * 3600);
});

test('keeps the table-defined duration sequence and non-default end times', () => {
  const expectedHundredDraws = [
    [1102008, 1, 6, 5],
    [1102009, 6, 11, 5],
    [1102002, 8, 15, 7],
    [1102005, 10, 15, 5],
    [1102003, 15, 22, 7],
    [1102010, 16, 21, 5],
    [1102004, 22, 29, 7],
    [1102006, 24, 29, 5]
  ].map(([actId, startDay, endDay, durationDays]) => ({
    actId,
    startDay,
    endDay,
    start: PUBLIC_SERVER_OPENED_AT + (startDay - 1) * DAY + 18000,
    end: PUBLIC_SERVER_OPENED_AT + (endDay - 1) * DAY + 18000,
    durationDays
  }));

  for (const expected of expectedHundredDraws) {
    const window = activityWindow(
      tables.ActFrameAct.get(expected.actId),
      PUBLIC_SERVER_OPENED_AT,
      ACTIVITY_REFERENCE_OPENED_AT
    );
    assert.equal(window.start, expected.start, `activity ${expected.actId} start`);
    assert.equal(window.end, expected.end, `activity ${expected.actId} end`);
    assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, window.start), expected.startDay);
    assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, window.end), expected.endDay);
    assert.equal((window.end - window.start) / DAY, expected.durationDays);
  }

  const sprint = activityWindow(
    tables.Activity.get(12014),
    PUBLIC_SERVER_OPENED_AT,
    ACTIVITY_REFERENCE_OPENED_AT
  );
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, sprint.start), 1);
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, sprint.end), 8);
  assert.equal(sprint.end - sprint.start, 7 * DAY + 18 * 3600);

  const fishing = activityWindow(
    tables.ActFrameAct.get(1074011),
    PUBLIC_SERVER_OPENED_AT,
    ACTIVITY_REFERENCE_OPENED_AT
  );
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, fishing.start), 6);
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, fishing.end), 10);
  assert.equal(fishing.end - fishing.start, 4 * DAY + 18 * 3600 + 59 * 60);
});

test('preserves explicit zero-day windows as one-minute activities', () => {
  for (const [source, actId] of [
    ['ActFrameAct', 93021],
    ['Activity', 76006],
    ['Activity', 77024],
    ['Activity', 81005]
  ]) {
    const config = tables[source].get(actId);
    const window = activityWindow(config, PUBLIC_SERVER_OPENED_AT, ACTIVITY_REFERENCE_OPENED_AT);
    assert.ok(window, `${source} activity ${actId} has a window`);
    assert.equal(window.end - window.start, 60, `${source} activity ${actId} lasts one minute`);
  }
  assert.equal(activityDurationDays({ duration_day: 0 }, 7), 0);
  assert.equal(activityDurationDays({}, 7), 7);
  assert.equal(activityDurationDays({ duration_day: 'invalid' }, 7), 7);
});

test('opens only the fishing generation assigned to the current server day', () => {
  const at = seconds => calendarAt(seconds);
  assert.deepEqual(at(SERVER_OPENED_AT - 1).activeFishingActivityIds(), []);
  assert.deepEqual(at(SERVER_OPENED_AT).activeFishingActivityIds(), [1074003]);
  assert.equal(at(SERVER_OPENED_AT).activeFishingActivityId(), 1074003);

  assert.deepEqual(at(SERVER_OPENED_AT + 5 * DAY - 1).activeFishingActivityIds(), [1074003]);
  assert.deepEqual(at(SERVER_OPENED_AT + 5 * DAY).activeFishingActivityIds(), []);
  assert.deepEqual(at(SERVER_OPENED_AT + 7 * DAY).activeFishingActivityIds(), [1074011]);

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
  assert.deepEqual(result.fishingActivityIds, [1074011]);
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
  assert.equal(activity.act_list[0].state_data.history_time[0].enter_time, String(SERVER_OPENED_AT));
  assert.deepEqual(activity.act_parallel_list[0].states_data, [{
    act_id: 83028,
    cur_state_id: 50,
    history_time: [{ state_id: 50, enter_time: String(at) }]
  }]);
  assert.deepEqual(activity.act_custom_list, [{
    act_id: 83028,
    start_time: at,
    end_time: at + 5 * DAY
  }]);
  assert.deepEqual(activity.act_pause_list, []);
  assert.equal(calendar.isActivityRunning(83028, null, activity, at), true);
  assert.equal(calendar.activeFishingActivityId(at, activity), 1074011);

  calendar.applyLoginSchedule(activity, at + 3600);
  assert.deepEqual(activity.act_custom_list, [{
    act_id: 83028,
    start_time: at,
    end_time: at + 5 * DAY
  }]);
});

test('all-open realigns the sprint period so module 92 accepts the current login', () => {
  const at = 1794150019;
  const actId = 12014;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const activity = {
    act_list: [1101001, 1101002].map(id => ({
      state_data: { act_id: id, cur_state_id: 90 },
      module_login_data: Buffer.alloc(0)
    })),
    act_parallel_list: [{
      module_login_data: 'current-sprint-batch',
      states_data: [{ act_id: actId, cur_state_id: 90 }]
    }],
    act_pause_list: [],
    act_custom_list: [{
      act_id: actId,
      fun_id: 12,
      start_time: 1793545200,
      end_time: 1794214800
    }]
  };

  calendar.applyLoginSchedule(activity, at);

  const custom = activity.act_custom_list.find(row => Number(row.act_id) === actId);
  const config = tables.Activity.get(actId);
  const template = activityWindow(config, SERVER_OPENED_AT);
  assert.ok(custom);
  assert.equal(custom.start_time - dayZero(custom.start_time), template.start - dayZero(template.start));
  assert.ok(custom.start_time <= at && at < custom.end_time);
  assert.equal(custom.end_time - custom.start_time, template.end - template.start);

  let endDayBegin = dayZero(custom.start_time);
  for (const dayOffset of config.state_end_day) endDayBegin += Number(dayOffset) * DAY;
  const computedStateEnd = dayZero(endDayBegin) + Number(config.state_end_time.at(-1));
  // The captured 23:00 start put this end at 1794150000; the reported login
  // happened 19 seconds later while the custom window still looked active.
  assert.ok(at < computedStateEnd);
  assert.equal(custom.end_time, computedStateEnd);

  assert.deepEqual(activity.act_parallel_list[0].states_data.map(state => Number(state.act_id)), [actId]);
  assert.ok([1101001, 1101002].every(id => activity.act_list.some(entry => Number(entry.state_data.act_id) === id)));
});

test('schedule mode still closes an expired custom activity window', () => {
  const at = SERVER_OPENED_AT + 20 * DAY;
  const calendar = calendarAt(at);
  const activity = {
    act_list: [{ state_data: { act_id: 117001, cur_state_id: 50 }, module_login_data: Buffer.alloc(0) }],
    act_parallel_list: [],
    act_pause_list: [],
    act_custom_list: [{ act_id: 117001, fun_id: 117, start_time: 1792875600, end_time: 1793307600 }]
  };

  const result = calendar.applyLoginSchedule(activity, at);
  assert.equal(activity.act_list.some(entry => Number(entry.state_data?.act_id) === 117001), false);
  assert.deepEqual(activity.act_custom_list, []);
});

test('schedule mode materializes legacy hundred-draw gift and shop rows with the running parent window', () => {
  const at = SERVER_OPENED_AT + 7 * DAY;
  const calendar = calendarAt(at);
  const parentId = 20001;
  const companionIds = [182810, 1841001];
  const player = { data_list: [] };
  const server = { act_stage_list: [] };

  const result = calendar.normalizeActFrameLogin(player, server, at, {
    activityGroups: [{ actId: parentId, companionIds }]
  });
  assert.deepEqual(result.activityIds, [parentId, ...companionIds].sort((left, right) => left - right));
  const parentWindow = activityWindow(tables.Activity.get(parentId), SERVER_OPENED_AT);
  assert.ok(parentWindow);
  for (const id of [parentId, ...companionIds]) {
    const config = tables.Activity?.get(id) ?? tables.ActFrameAct?.get(id);
    const serverRow = server.act_stage_list.find(row => Number(row.act_id) === id);
    const playerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === id);
    assert.ok(serverRow);
    assert.ok(playerRow);
    assert.equal(Number(serverRow.type), Number(config.type ?? config.func));
    assert.equal(Number(serverRow.start_time), parentWindow.start);
    assert.equal(Number(serverRow.end_time), parentWindow.end);
    assert.equal(serverRow.cur_stage_id, 50);
    assert.equal(playerRow.act_stage.cur_stage_id, 50);
  }

  calendar.normalizeActFrameLogin(player, server, at + 60, {
    activityGroups: [{ actId: parentId, companionIds }]
  });
  for (const id of [parentId, ...companionIds]) {
    assert.equal(server.act_stage_list.filter(row => Number(row.act_id) === id).length, 1);
    assert.equal(player.data_list.filter(row => Number(row.act_stage?.act_id) === id).length, 1);
  }
});

test('schedule mode prefers the custom parent window when it opens before the static table window', () => {
  const at = Date.parse('2026-11-10T16:08:19Z') / 1000;
  const openedAt = Date.parse('2026-11-11T00:00:00+08:00') / 1000;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: openedAt,
    mode: 'schedule',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const parentId = 20001;
  const companionIds = [182810, 1841001];
  const startTime = openedAt;
  const endTime = openedAt + 9998 * DAY;
  const player = { data_list: [] };
  const server = { act_stage_list: [] };

  const result = calendar.normalizeActFrameLogin(player, server, at, {
    activityGroups: [{ actId: parentId, startTime, endTime, companionIds }]
  });

  assert.deepEqual(result.activityIds, [parentId, ...companionIds].sort((left, right) => left - right));
  for (const id of [parentId, ...companionIds]) {
    const serverRow = server.act_stage_list.find(row => Number(row.act_id) === id);
    const playerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === id);
    assert.equal(Number(serverRow.start_time), startTime);
    assert.equal(Number(serverRow.end_time), endTime);
    assert.equal(Number(playerRow.act_stage.start_time), startTime);
    assert.equal(Number(playerRow.act_stage.end_time), endTime);
  }
});

test('all-open mode makes every ActFrame server row active for the current login', () => {
  const at = SERVER_OPENED_AT + 14 * DAY;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const player = {
    data_list: [
      { act_stage: {
        act_id: 1074011,
        start_time: String(at - 40 * DAY),
        end_time: String(at - DAY),
        cur_stage_id: 90,
        loop_count: 2,
        history_time: [{ stage_id: 90, enter_time: '1' }]
      }, module_login_data: Buffer.alloc(0) },
      { act_stage: {
        act_id: 83028,
        start_time: '0',
        end_time: '0',
        cur_stage_id: 99,
        history_time: []
      }, module_login_data: Buffer.alloc(0) }
    ]
  };
  const server = {
    act_stage_list: [
      { act_id: 1074011, type: 1074, start_time: String(at - 40 * DAY), end_time: String(at - DAY), cur_stage_id: 90 },
      { act_id: 83028, type: 83, start_time: '0', end_time: '0', cur_stage_id: 99 }
    ]
  };

  const result = calendar.normalizeActFrameLogin(player, server, at);
  assert.deepEqual(result.activityIds, [1074011, 83028]);
  for (const row of server.act_stage_list) {
    assert.equal(row.cur_stage_id, 50);
    assert.equal(row.is_pause, false);
    assert.equal(row.loop_count, 0);
    assert.ok(Number(row.start_time) <= at);
    assert.ok(Number(row.end_time) > at);
    assert.deepEqual(row.stage_time_list, [{
      stage_id: 50,
      start_time: row.start_time,
      end_time: row.end_time
    }]);
  }
  for (const row of player.data_list) {
    assert.equal(row.act_stage.cur_stage_id, 50);
    assert.equal(row.act_stage.loop_count, 0);
    assert.ok(Number(row.act_stage.start_time) <= at);
    assert.ok(Number(row.act_stage.end_time) > at);
    assert.equal(row.act_stage.history_time[0].stage_id, 50);
  }

  const scheduled = calendarAt(at);
  const scheduledResult = scheduled.normalizeActFrameLogin(player, server, at);
  assert.equal(scheduledResult.adjusted, 0);
  assert.deepEqual(server.act_stage_list, []);
  assert.deepEqual(player.data_list, []);
});

test('schedule mode rewrites the client custom window from the relative server day', () => {
  const at = PUBLIC_SERVER_OPENED_AT + 17 * DAY + 6 * 3600;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: PUBLIC_SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => at * 1000
  });
  const activity = {
    act_list: [
      { state_data: { act_id: 1102003, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: '1794326400' }] }, module_login_data: Buffer.alloc(0) },
      { state_data: { act_id: 1102010, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: '1794326400' }] }, module_login_data: Buffer.alloc(0) }
    ],
    act_parallel_list: [],
    act_pause_list: [],
    act_custom_list: [
      { act_id: 1102003, fun_id: 1102, start_time: PUBLIC_SERVER_OPENED_AT, end_time: PUBLIC_SERVER_OPENED_AT + 7 * DAY },
      { act_id: 1102010, fun_id: 1102, start_time: PUBLIC_SERVER_OPENED_AT, end_time: PUBLIC_SERVER_OPENED_AT + 5 * DAY }
    ]
  };

  calendar.applyLoginSchedule(activity, at);

  assert.deepEqual(activity.act_list.map(entry => Number(entry.state_data.act_id)).sort((a, b) => a - b), [1102003, 1102010]);
  const qianqianWindow = activityWindow(tables.ActFrameAct.get(1102003), PUBLIC_SERVER_OPENED_AT, ACTIVITY_REFERENCE_OPENED_AT);
  const qianqianCustom = activity.act_custom_list.find(row => Number(row.act_id) === 1102003);
  assert.equal(qianqianCustom.start_time, qianqianWindow.start);
  assert.equal(qianqianCustom.end_time, qianqianWindow.end);
  const whiteWindow = activityWindow(tables.ActFrameAct.get(1102010), PUBLIC_SERVER_OPENED_AT, ACTIVITY_REFERENCE_OPENED_AT);
  const whiteCustom = activity.act_custom_list.find(row => Number(row.act_id) === 1102010);
  assert.equal(whiteCustom.start_time, whiteWindow.start);
  assert.equal(whiteCustom.end_time, whiteWindow.end);
});

test('dynamic activities fall back to a login custom window and fail closed without one', () => {
  const actId = 900009;
  const dynamicTables = {
    Activity: new Map(),
    ActFrameAct: new Map([[actId, {
      tid: actId,
      type: 1038,
      time_fun: 461,
      time_fun_args: [29, 1, 0],
      world_time: 0,
      refer_day: 0,
      refer_start_time: 0,
      duration_day: 4,
      end_time: 18000
    }]])
  };
  const at = PUBLIC_SERVER_OPENED_AT;
  const calendar = createActivityCalendar({
    tables: dynamicTables,
    serverOpenedAt: PUBLIC_SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    activityWindowAnchor: SERVER_OPENED_AT,
    now: () => at * 1000
  });
  const activity = {
    act_list: [{
      state_data: { act_id: actId, cur_state_id: 50, history_time: [] },
      module_login_data: Buffer.alloc(0)
    }],
    act_parallel_list: [],
    act_pause_list: [],
    act_custom_list: [{ act_id: actId, fun_id: 1038, start_time: SERVER_OPENED_AT, end_time: SERVER_OPENED_AT + 4 * DAY }]
  };

  calendar.applyLoginSchedule(activity, at);
  const custom = activity.act_custom_list.find(row => Number(row.act_id) === actId);
  assert.deepEqual([custom.start_time, custom.end_time], [PUBLIC_SERVER_OPENED_AT, PUBLIC_SERVER_OPENED_AT + 4 * DAY]);
  assert.equal(activity.act_list[0].state_data.history_time[0].enter_time, String(PUBLIC_SERVER_OPENED_AT));
  assert.equal(calendar.isActivityRunning(actId, activity.act_list[0].state_data, activity, at), true);

  const player = { data_list: [] };
  const server = { act_stage_list: [] };
  calendar.normalizeActFrameLogin(player, server, at, { activityIds: [actId], activity });
  assert.equal(Number(server.act_stage_list[0].start_time), PUBLIC_SERVER_OPENED_AT);
  assert.equal(Number(server.act_stage_list[0].end_time), PUBLIC_SERVER_OPENED_AT + 4 * DAY);

  const withoutWindow = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  assert.equal(calendar.isActivityRunning(actId, { act_id: actId, cur_state_id: 50 }, withoutWindow, at), false);
});

test('schedule mode materializes relative module-183 windows and matching draw shops', () => {
  const at = PUBLIC_SERVER_OPENED_AT + 16 * DAY + 6 * 3600;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: PUBLIC_SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => at * 1000
  });
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const player = { data_list: [] };
  const server = { act_stage_list: [] };

  const result = calendar.normalizeActFrameLogin(player, server, at, {
    activityIds: [1102010],
    activity
  });
  const ids = new Set(result.activityIds);
  for (const id of [1102010, 182819, 1841010]) assert.equal(ids.has(id), true);
  for (const row of server.act_stage_list) {
    assert.equal(row.start_time, '1795640400');
    assert.equal(row.end_time, '1796072400');
  }
  assert.equal(player.data_list.length, server.act_stage_list.length);
});

test('all-open materializes module-92 activities missing from act-frame login rows', () => {
  const at = SERVER_OPENED_AT + 14 * DAY;
  const actId = 1096001;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const player = { data_list: [] };
  const server = { act_stage_list: [] };

  const result = calendar.normalizeActFrameLogin(player, server, at, { activityIds: [actId, actId] });
  assert.ok(result.activityIds.includes(actId));
  const serverRow = server.act_stage_list.find(row => Number(row.act_id) === actId);
  const playerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === actId);
  assert.ok(serverRow);
  assert.ok(playerRow);
  assert.equal(Number(serverRow.type), Number(tables.ActFrameAct.get(actId).type));
  assert.ok(Number(serverRow.start_time) <= at);
  assert.ok(Number(serverRow.end_time) > at);
  assert.equal(serverRow.cur_stage_id, 50);
  assert.equal(serverRow.is_pause, false);
  assert.deepEqual(serverRow.stage_time_list, [{
    stage_id: 50,
    start_time: serverRow.start_time,
    end_time: serverRow.end_time
  }]);
  assert.equal(playerRow.act_stage.cur_stage_id, 50);
  assert.ok(Number(playerRow.act_stage.start_time) <= at);
  assert.ok(Number(playerRow.act_stage.end_time) > at);
  assert.deepEqual(playerRow.act_stage.history_time, [{
    stage_id: 50,
    enter_time: playerRow.act_stage.start_time
  }]);

  calendar.normalizeActFrameLogin(player, server, at + 60, { activityIds: [actId] });
  assert.equal(server.act_stage_list.filter(row => Number(row.act_id) === actId).length, 1);
  assert.equal(player.data_list.filter(row => Number(row.act_stage?.act_id) === actId).length, 1);
});

test('all-open materializes the white-ribbon draw paid and exchange shops from their parent batch', () => {
  const at = SERVER_OPENED_AT + 14 * DAY;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => at * 1000
  });
  const parent = 1102010;
  const player = {
    data_list: [{
      act_stage: {
        act_id: parent,
        start_time: '1792098000',
        end_time: '1792530000',
        cur_stage_id: 50,
        loop_count: 0,
        history_time: [{ stage_id: 50, enter_time: '1792098000' }]
      },
      module_login_data: Buffer.alloc(0)
    }]
  };
  const server = {
    act_stage_list: [{
      act_id: parent,
      type: 1102,
      start_time: '1792098000',
      end_time: '1792530000',
      cur_stage_id: 50,
      loop_count: 0,
      stage_time_list: [{ stage_id: 50, start_time: '1792098000', end_time: '1792530000' }]
    }]
  };

  const result = calendar.normalizeActFrameLogin(player, server, at);
  const returned = new Set(result.activityIds);
  for (const [actId, type] of [[182819, 182], [1841010, 184]]) {
    assert.equal(returned.has(actId), true);
    const serverRow = server.act_stage_list.find(row => Number(row.act_id) === actId);
    assert.ok(serverRow);
    assert.equal(Number(serverRow.type), type);
    assert.ok(Number(serverRow.start_time) <= at);
    assert.ok(Number(serverRow.end_time) > at);
    assert.equal(serverRow.cur_stage_id, 50);
    assert.deepEqual(serverRow.stage_time_list, [{
      stage_id: 50,
      start_time: serverRow.start_time,
      end_time: serverRow.end_time
    }]);
    const playerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === actId);
    assert.ok(playerRow);
    assert.equal(playerRow.act_stage.cur_stage_id, 50);
    assert.equal(playerRow.act_stage.history_time[0].stage_id, 50);
  }

  calendar.normalizeActFrameLogin(player, server, at + 60);
  assert.equal(server.act_stage_list.filter(row => Number(row.act_id) === 1841010).length, 1);
  assert.equal(player.data_list.filter(row => Number(row.act_stage?.act_id) === 1841010).length, 1);
});
