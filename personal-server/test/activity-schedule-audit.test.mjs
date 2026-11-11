import assert from 'node:assert/strict';
import test from 'node:test';
import { readGameTables } from '../config/game-tables.mjs';
import { auditActivitySchedule } from '../scripts/audit-activity-schedule.mjs';

const SERVER_OPENED_AT = 1794326400;
const ACTIVITY_REFERENCE_OPENED_AT = 1790784000;
const tables = readGameTables();
const report = auditActivitySchedule({
  tables,
  serverOpenedAt: SERVER_OPENED_AT,
  activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT
});

test('audits every activity row without invalid windows or duration totals', () => {
  assert.equal(report.counters.totalRows, 1993);
  assert.equal(report.counters.sourceRows.ActFrameAct, 884);
  assert.equal(report.counters.sourceRows.Activity, 1109);
  assert.equal(report.counters.resolvedWindows, 1989);
  assert.equal(report.counters.stagedActivities, 73);
  assert.equal(report.counters.explicitZeroDurationActivities, 5);
  assert.equal(report.counters.oneMinuteWindows, 4);
  assert.deepEqual(report.errors, []);
});

test('reports every table row that cannot be reproduced from static relative time', () => {
  assert.deepEqual(report.unresolved, [
    {
      source: 'ActFrameAct',
      actId: 1037001,
      refName: '梦境试炼活动_通服',
      timeFun: 461,
      reason: 'dynamic-time-function'
    },
    {
      source: 'ActFrameAct',
      actId: 1037002,
      refName: '梦境试炼活动_通服_2期',
      timeFun: 461,
      reason: 'dynamic-time-function'
    },
    {
      source: 'ActFrameAct',
      actId: 1036008,
      refName: '龙息之地活动8期',
      timeFun: 461,
      reason: 'dynamic-time-function'
    },
    {
      source: 'ActFrameAct',
      actId: 175001,
      refName: '直购皮肤活动_夏日皮肤',
      timeFun: 0,
      reason: 'missing-static-time-config'
    }
  ]);
});

test('records the one cross-table activity ID collision instead of silently duplicating it', () => {
  assert.deepEqual(report.collisions, [{
    actId: 190001,
    sources: ['ActFrameAct', 'Activity'],
    selectedSource: 'ActFrameAct'
  }]);
});
