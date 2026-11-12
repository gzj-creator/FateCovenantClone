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

