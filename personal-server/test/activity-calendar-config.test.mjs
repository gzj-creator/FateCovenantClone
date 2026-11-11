import test from 'node:test';
import assert from 'node:assert/strict';
import { loadActivityCalendarConfig, parseActivityCalendarConfig } from '../config/activity-calendar-config.mjs';

test('the checked-in config selects the public realm launch schedule', () => {
  const config = loadActivityCalendarConfig();
  assert.deepEqual(config, {
    mode: 'schedule',
    serverOpenedAt: 1794326400,
    activityReferenceOpenedAt: 1790784000,
    activityWindowAnchor: 1792789200,
    currentFishingActivityId: 1074011
  });
});

test('calendar config validates schedule and all-open modes', () => {
  assert.deepEqual(parseActivityCalendarConfig({
    mode: 'schedule',
    serverOpenedAt: '2026-10-24T05:00:00+08:00'
  }), {
    mode: 'schedule', serverOpenedAt: 1792789200,
    activityReferenceOpenedAt: null, activityWindowAnchor: null, currentFishingActivityId: null
  });
  assert.throws(() => parseActivityCalendarConfig({ mode: 'always' }), /Unsupported activity calendar mode/);
  assert.throws(() => parseActivityCalendarConfig({ mode: 'all-open', serverOpenedAt: 1792789200, currentFishingActivityId: 0 }), /positive integer/);
  assert.throws(() => parseActivityCalendarConfig({
    mode: 'schedule',
    serverOpenedAt: 1792789200,
    activityWindowAnchor: 1792789201
  }), /must not be later/);
  assert.throws(() => parseActivityCalendarConfig({
    mode: 'schedule',
    serverOpenedAt: 1792789200,
    activityReferenceOpenedAt: 1792789201
  }), /must not be later/);
});
