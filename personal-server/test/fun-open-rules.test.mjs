import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(serverRoot, 'config', 'fun-open-rules.json'), 'utf8'));
const byId = new Map(config.rules.map(rule => [rule.funId, rule]));

test('the exported FunOpen table covers all client rows with source hashes', () => {
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.sources.funOpenTable.sha256, 'A7DBC28812F761A573837F62758EA210D378EDF51D7B9DF1C0329A0AF12B9A99');
  assert.equal(config.sources.funOpenTable.rows, 523);
  assert.equal(config.rules.length, 523);
  assert.equal(new Set(config.rules.map(rule => rule.funId)).size, 523);
  assert.deepEqual(config.summary, {
    rules: 523,
    ready: 181,
    evidenceGap: 342,
    uniqueAsserts: 271,
    mappedAsserts: 271,
    readyAsserts: 94,
    dynamicArgs: {
      1: 'GetRoleLv',
      2: 'GetPassedSection',
      3: 'GetCreateRoleDays',
      4: 'GetServerOpenDay'
    }
  });
});

test('bytecode-proven row conditions retain their exact comparator and threshold', () => {
  assert.deepEqual(byId.get(1001).conditions, [
    { type: 'role_level', operator: '>=', args: { level: 20 } }
  ]);
  assert.deepEqual(byId.get(1003).conditions, [
    { type: 'create_day', operator: '>=', args: { day: 1 } }
  ]);
  const serverDays = config.rules.filter(rule => rule.status === 'ready'
    && rule.conditions[0]?.type === 'server_day');
  assert.ok(serverDays.length > 0);
  assert.ok(serverDays.every(rule => rule.conditions[0].operator === '>='));
  assert.deepEqual(byId.get(1514).conditions, [
    { type: 'mission', operator: '>=', args: { missionId: 30203 } }
  ]);
  assert.deepEqual(byId.get(1413).conditions, [
    { type: 'mission', operator: '>=', args: { missionId: 30203 } }
  ]);
  assert.deepEqual(byId.get(1006).conditions, [{
    type: 'all',
    conditions: [
      { type: 'mission', operator: '>=', args: { missionId: 30203 } },
      { type: 'server_open_time', operator: '<=', args: { openTime: 1744318799 } }
    ]
  }]);
  assert.deepEqual(byId.get(1017).conditions, [
    { type: 'mission', operator: '>=', args: { missionId: 80208 } }
  ]);
  assert.deepEqual(byId.get(1155).conditions, [{
    type: 'any',
    conditions: [
      { type: 'all', conditions: [
        { type: 'role_level', operator: '>=', args: { level: 60 } },
        { type: 'server_open_time', operator: '<=', args: { openTime: 107266 } }
      ] },
      { type: 'all', conditions: [
        { type: 'server_day', operator: '>=', args: { day: 24 } },
        { type: 'server_open_time', operator: '>=', args: { openTime: 1757451600 } }
      ] }
    ]
  }]);
});

test('unproven expressions, dynamic Show lists, empty asserts and non-client targets stay evidence gaps', () => {
  assert.equal(byId.get(1005).status, 'evidence_gap');
  assert.equal(byId.get(1005).evidenceGap[0].reason,
    'assert_condition_mapping_not_enabled_for_business_rule');
  assert.equal(byId.get(1215).status, 'evidence_gap');
  assert.equal(byId.get(1215).evidenceGap[0].reason, 'assert_list_missing_or_table_empty');
  for (const id of [1105, 1263, 1286, 1299, 1319, 1321, 1322, 1447]) {
    assert.equal(byId.get(id).status, 'evidence_gap');
    assert.ok(byId.get(id).evidenceGap.some(gap => gap.reason === 'dynamic_show_asserts_unproven'));
  }
  for (const rule of config.rules.filter(rule => rule.target !== 1)) {
    assert.equal(rule.status, 'evidence_gap');
    assert.ok(rule.evidenceGap.some(gap => gap.reason.endsWith('_not_client_requested')));
  }
});

test('only proven numeric condition families and comparators are executable', () => {
  const allowedTypes = new Set(['all', 'any', 'role_level', 'create_day', 'server_day', 'server_open_time', 'mission']);
  const allowedOperators = new Set(['>=', '>', '<=', '<', '==', '!=']);
  const assertLeaf = condition => {
    assert.ok(allowedTypes.has(condition.type));
    if (condition.type === 'all' || condition.type === 'any') {
      assert.ok(condition.conditions.length > 0);
      for (const child of condition.conditions) assertLeaf(child);
    } else {
      assert.ok(allowedOperators.has(condition.operator));
    }
  };
  for (const rule of config.rules) {
    assert.ok(['ready', 'evidence_gap'].includes(rule.status));
    if (rule.status === 'evidence_gap') {
      assert.deepEqual(rule.conditions, []);
      assert.ok(rule.evidenceGap.length > 0);
    } else {
      assert.ok(rule.asserts.length >= 1);
      assert.equal(rule.conditions.length, rule.asserts.length);
      for (const condition of rule.conditions) assertLeaf(condition);
    }
  }
});
