import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_STATUS, activityGate, activityStateAt, evaluateActivity } from '../game/activity-lifecycle.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { readGameTables } from '../config/game-tables.mjs';

const DAY = 86400;
const OPENED_AT = 1792789200; // 2026-10-24 05:00 Asia/Shanghai
const config = {
  refer_day: 1,
  refer_start_time: 18000,
  duration_day: 5,
  end_time: 18000,
  time_type: 0,
  func: 0,
  state: [10, 50, 60, 90],
  state_end_day: [1, 2, 1, 1]
};
const window = activityWindow(config, OPENED_AT);

test('activity state advances preview, running, claim and show before closing', () => {
  assert.equal(activityStateAt(config, window, window.start).status, ACTIVITY_STATUS.PREVIEW);
  assert.equal(activityStateAt(config, window, window.start + DAY + 1).status, ACTIVITY_STATUS.RUNNING);
  assert.equal(activityStateAt(config, window, window.start + 3 * DAY + 1).status, ACTIVITY_STATUS.CLAIM);
  assert.equal(activityStateAt(config, window, window.start + 4 * DAY + 1).status, ACTIVITY_STATUS.SHOW);
  assert.equal(activityStateAt(config, window, window.end).status, ACTIVITY_STATUS.CLOSED);
});

test('ActFrame GetStageTime drives the day-8 Dream House generation through show', () => {
  const dreamHouse = readGameTables().ActFrameAct.get(1085008);
  const openedAt = 1794690000; // 2026-11-15 05:00 Asia/Shanghai
  const startAt = Date.parse('2026-11-22T05:00:00+08:00') / 1000;
  const stage90At = Date.parse('2026-11-28T12:00:00+08:00') / 1000;
  const endAt = Date.parse('2026-11-29T00:00:00+08:00') / 1000;

  const running = evaluateActivity({ config: dreamHouse, at: startAt, serverOpenedAt: openedAt });
  assert.equal(running.status, ACTIVITY_STATUS.RUNNING);
  assert.equal(running.stateId, 50);
  assert.deepEqual(running.stages, [
    { stageId: 50, start: startAt, end: stage90At },
    { stageId: 90, start: stage90At, end: endAt }
  ]);

  assert.equal(evaluateActivity({ config: dreamHouse, at: stage90At - 1, serverOpenedAt: openedAt }).stateId, 50);
  const showing = evaluateActivity({ config: dreamHouse, at: stage90At, serverOpenedAt: openedAt });
  assert.equal(showing.status, ACTIVITY_STATUS.SHOW);
  assert.equal(showing.stateId, 90);
  assert.equal(evaluateActivity({ config: dreamHouse, at: endAt, serverOpenedAt: openedAt }).status, ACTIVITY_STATUS.CLOSED);
});

test('old-server Dream House keeps every ActFrame running stage before show', () => {
  const dreamHouse = readGameTables().ActFrameAct.get(1085003);
  const openedAt = Number(dreamHouse.world_time) - 29 * DAY;
  const expectations = [
    [0, 50, ACTIVITY_STATUS.RUNNING],
    [5, 51, ACTIVITY_STATUS.RUNNING],
    [10, 52, ACTIVITY_STATUS.RUNNING],
    [15, 53, ACTIVITY_STATUS.RUNNING],
    [20, 54, ACTIVITY_STATUS.RUNNING],
    [25, 90, ACTIVITY_STATUS.SHOW]
  ];
  for (const [offsetDays, stateId, status] of expectations) {
    const result = evaluateActivity({
      config: dreamHouse,
      at: Number(dreamHouse.world_time) + offsetDays * DAY,
      serverOpenedAt: openedAt
    });
    assert.equal(result.stateId, stateId);
    assert.equal(result.status, status);
  }
  assert.equal(evaluateActivity({
    config: dreamHouse,
    at: Number(dreamHouse.world_time) + 26 * DAY,
    serverOpenedAt: openedAt
  }).status, ACTIVITY_STATUS.CLOSED);
});

test('incomplete ActFrame stage arrays fail closed without inventing a stage', () => {
  const incomplete = {
    ...config,
    type: 1085,
    stage: [50, 90],
    stage_duration_day: [6],
    stage_end_time: [43200, 0]
  };
  const result = evaluateActivity({ config: incomplete, at: window.start, serverOpenedAt: OPENED_AT });
  assert.equal(result.visible, false);
  assert.equal(result.reason, 'invalid_stage_config');
});

test('gate permits read/operate/claim by state', () => {
  assert.equal(activityGate(ACTIVITY_STATUS.PREVIEW, 'read'), true);
  assert.equal(activityGate(ACTIVITY_STATUS.PREVIEW, 'operate'), false);
  assert.equal(activityGate(ACTIVITY_STATUS.RUNNING, 'operate'), true);
  assert.equal(activityGate(ACTIVITY_STATUS.RUNNING, 'claim'), true);
  assert.equal(activityGate(ACTIVITY_STATUS.CLAIM, 'operate'), false);
  assert.equal(activityGate(ACTIVITY_STATUS.CLAIM, 'claim'), true);
  assert.equal(activityGate(ACTIVITY_STATUS.SHOW, 'claim'), false);
  assert.equal(activityGate(ACTIVITY_STATUS.SHOW, 'read'), true);
});

test('pause and force-close hide the activity, force-open replaces the window', () => {
  const paused = evaluateActivity({ config, at: window.start + 2 * DAY, serverOpenedAt: OPENED_AT, override: { kind: 'pause' } });
  assert.equal(paused.visible, false);
  const forced = evaluateActivity({
    config,
    at: window.start + 20 * DAY,
    serverOpenedAt: OPENED_AT,
    override: { kind: 'force_open', startAt: window.start + 19 * DAY, endAt: window.start + 21 * DAY }
  });
  assert.equal(forced.visible, true);
  assert.equal(forced.status, ACTIVITY_STATUS.RUNNING);
});

test('unknown time types and unresolved server limits fail closed', () => {
  assert.equal(evaluateActivity({ config: { ...config, time_type: 3 }, at: window.start, serverOpenedAt: OPENED_AT }).visible, false);
  assert.equal(evaluateActivity({ config: { ...config, server_limited_type: 1 }, at: window.start, serverOpenedAt: OPENED_AT }).visible, false);
  assert.equal(evaluateActivity({ config: { ...config, world_limit_state: 3 }, at: window.start, serverOpenedAt: OPENED_AT }).visible, false);
});

test('function locks and invisible parents hide child activities', () => {
  const locked = evaluateActivity({ config: { ...config, func: 1039 }, at: window.start + 2 * DAY, serverOpenedAt: OPENED_AT, funOpen: new Set() });
  assert.equal(locked.visible, false);
  const unlocked = evaluateActivity({ config: { ...config, func: 1039 }, at: window.start + 2 * DAY, serverOpenedAt: OPENED_AT, funOpen: new Set([1039]) });
  assert.equal(unlocked.visible, true);
  const child = evaluateActivity({ config, at: window.start + 2 * DAY, serverOpenedAt: OPENED_AT, parent: { visible: false } });
  assert.equal(child.visible, false);
});

