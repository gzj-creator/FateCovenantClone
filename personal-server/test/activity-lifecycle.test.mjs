import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_STATUS, activityGate, activityStateAt, evaluateActivity } from '../game/activity-lifecycle.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';

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

