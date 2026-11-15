import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFunOpen } from '../game/feature-rules.mjs';

test('evaluates level, mission, server-day and guide conditions', () => {
  const rules = [
    { funId: 1001, conditions: [{ type: 'role_level', args: { level: 3 } }] },
    { funId: 1002, conditions: [{ type: 'mission', args: { missionId: 1002 } }] },
    { funId: 2001, conditions: [{ type: 'server_day', args: { day: 2 } }] },
    { funId: 3001, conditions: [{ type: 'guide', args: { step: 7 } }] }
  ];
  const result = evaluateFunOpen({ level: 3, missionId: 1002, guides: { 7: 1 } }, rules, { serverDay: 2 });
  assert.deepEqual([...result.open], [1001, 1002, 2001, 3001]);
  assert.deepEqual(result.denied, []);
});

test('resolves fun_open dependencies after their prerequisite', () => {
  const rules = [
    { funId: 1002, conditions: [{ type: 'fun_open', args: { funId: 1001 } }] },
    { funId: 1001, conditions: [{ type: 'role_level', args: { level: 1 } }] }
  ];
  const result = evaluateFunOpen({ level: 1 }, rules);
  assert.deepEqual([...result.open].sort((a, b) => a - b), [1001, 1002]);
});

test('unknown condition types fail closed and are reported', () => {
  const result = evaluateFunOpen({ level: 1 }, [
    { funId: 1001, conditions: [{ type: 'unknown_rule', args: {} }] }
  ]);
  assert.deepEqual([...result.open], []);
  assert.deepEqual(result.denied, [{ funId: 1001, type: 'unknown_rule', reason: 'unknown_condition' }]);
});

test('supports the explicit comparators emitted by the FunOpen extractor', () => {
  const result = evaluateFunOpen({ level: 20 }, [
    { funId: 1001, status: 'ready', conditions: [{ type: 'role_level', operator: '>=', args: { level: 20 } }] },
    { funId: 1002, status: 'ready', conditions: [{ type: 'role_level', operator: '>', args: { level: 20 } }] }
  ]);
  assert.deepEqual([...result.open], [1001]);
});

test('evaluates recovered AND/OR groups and server-open-time boundaries', () => {
  const rules = [
    {
      funId: 1006,
      status: 'ready',
      conditions: [{ type: 'all', conditions: [
        { type: 'mission', operator: '>=', args: { missionId: 30203 } },
        { type: 'server_open_time', operator: '<=', args: { openTime: 1744318799 } }
      ] }]
    },
    {
      funId: 1155,
      status: 'ready',
      conditions: [{ type: 'any', conditions: [
        { type: 'all', conditions: [
          { type: 'role_level', operator: '>=', args: { level: 60 } },
          { type: 'server_open_time', operator: '<=', args: { openTime: 107266 } }
        ] },
        { type: 'all', conditions: [
          { type: 'server_day', operator: '>=', args: { day: 24 } },
          { type: 'server_open_time', operator: '>=', args: { openTime: 1757451600 } }
        ] }
      ] }]
    }
  ];

  const legacy = evaluateFunOpen(
    { level: 60, missionId: 30204 },
    rules,
    { serverDay: 1, serverOpenTime: 1744318799 }
  );
  assert.deepEqual([...legacy.open], [1006]);

  const current = evaluateFunOpen(
    { level: 1, missionId: 0 },
    rules,
    { serverDay: 24, serverOpenTime: 1757451600 }
  );
  assert.deepEqual([...current.open], [1155]);

  const beforeBoundary = evaluateFunOpen(
    { level: 1, missionId: 0 },
    rules,
    { serverDay: 24, serverOpenTime: 1757451599 }
  );
  assert.deepEqual([...beforeBoundary.open], []);
});

test('malformed nested groups and unknown leaves fail closed', () => {
  const result = evaluateFunOpen({ level: 1 }, [
    { funId: 1001, status: 'ready', conditions: [{ type: 'all', conditions: [] }] },
    { funId: 1002, status: 'ready', conditions: [{ type: 'any', conditions: [{ type: 'unknown', args: {} }] }] }
  ]);
  assert.deepEqual([...result.open], []);
  assert.deepEqual(result.denied, [
    { funId: 1001, type: 'all', reason: 'unknown_condition' },
    { funId: 1002, type: 'any', reason: 'unknown_condition' }
  ]);
});

test('evidence gaps never become unconditional opens', () => {
  const result = evaluateFunOpen({ level: 1 }, [
    { funId: 1001, status: 'evidence_gap', conditions: [], evidenceGap: [{ reason: 'multiple_assert_combination_unproven' }] },
    { funId: 1002, status: 'ready', conditions: [{ type: 'role_level', operator: 'unknown', args: { level: 1 } }] },
    { funId: 1003, status: 'ready', conditions: [] }
  ]);
  assert.deepEqual([...result.open], []);
  assert.deepEqual(result.denied, [
    { funId: 1001, type: 'rule_status', reason: 'evidence_gap' },
    { funId: 1002, type: 'role_level', reason: 'unknown_condition' },
    { funId: 1003, type: 'conditions', reason: 'empty_conditions' }
  ]);
});

