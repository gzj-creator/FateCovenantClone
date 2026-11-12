import test from 'node:test';
import assert from 'node:assert/strict';
import { readGameTables } from '../config/game-tables.mjs';
import { addRoleExp } from '../game/role-level.mjs';

const tables = readGameTables();

test('one experience award can cross three levels and reports each level once', () => {
  const role = { level: 1, exp: 0 };
  const seen = [];
  const result = addRoleExp(role, 5 + 10 + 15 + 1, {
    tables,
    source: 'test',
    onLevelUp: event => seen.push(event)
  });
  assert.equal(result.level, 4);
  assert.equal(result.exp, 1);
  assert.deepEqual(result.gainedLevels, [2, 3, 4]);
  assert.deepEqual(seen.map(event => [event.from, event.to]), [[1, 4]]);
  assert.equal(role.level, 4);
  assert.equal(role.exp, 1);
});

test('max-level experience is capped and never creates level 301', () => {
  const maxLevel = Number(tables.RoleLevelSetting.get(1).max_level);
  const cap = Number(tables.RoleLevel.get(maxLevel).reach_exp);
  const role = { level: maxLevel, exp: 0 };
  const result = addRoleExp(role, 9_999_999_999, { tables, source: 'test' });
  assert.equal(result.level, maxLevel);
  assert.equal(result.exp, cap);
  assert.deepEqual(result.gainedLevels, []);
});

test('invalid experience amounts are rejected before mutating the role', () => {
  const role = { level: 1, exp: 0 };
  assert.throws(() => addRoleExp(role, -1, { tables }), error => error.code === 1);
  assert.throws(() => addRoleExp(role, 1.5, { tables }), error => error.code === 1);
  assert.deepEqual(role, { level: 1, exp: 0 });
});

