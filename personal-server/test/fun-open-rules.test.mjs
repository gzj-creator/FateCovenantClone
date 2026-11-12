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
    ready: 164,
    evidenceGap: 359,
    uniqueAsserts: 271,
    mappedAsserts: 262,
    readyAsserts: 85,
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
});

test('unproven expressions, empty assert lists and non-client targets stay evidence gaps', () => {
  assert.equal(byId.get(1005).status, 'evidence_gap');
  assert.match(byId.get(1005).evidenceGap[0].reason, /^unmapped_dynamic_arg_/);
  assert.equal(byId.get(1006).status, 'evidence_gap');
  assert.equal(byId.get(1006).evidenceGap[0].reason, 'expression_not_supported');
  assert.equal(byId.get(1215).status, 'evidence_gap');
  assert.equal(byId.get(1215).evidenceGap[0].reason, 'assert_list_missing_or_table_empty');
  for (const rule of config.rules.filter(rule => rule.target !== 1)) {
    assert.equal(rule.status, 'evidence_gap');
    assert.ok(rule.evidenceGap.some(gap => gap.reason.endsWith('_not_client_requested')));
  }
});

test('only proven numeric condition families and comparators are executable', () => {
  const allowedTypes = new Set(['role_level', 'create_day', 'server_day']);
  const allowedOperators = new Set(['>=', '>', '<=', '<', '==', '!=']);
  for (const rule of config.rules) {
    assert.ok(['ready', 'evidence_gap'].includes(rule.status));
    if (rule.status === 'evidence_gap') {
      assert.deepEqual(rule.conditions, []);
      assert.ok(rule.evidenceGap.length > 0);
    } else {
      assert.equal(rule.asserts.length, 1);
      assert.equal(rule.conditions.length, 1);
      assert.ok(allowedTypes.has(rule.conditions[0].type));
      assert.ok(allowedOperators.has(rule.conditions[0].operator));
    }
  }
});
