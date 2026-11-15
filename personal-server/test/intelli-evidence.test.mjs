import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INTELLI_PRESENT_COLUMNS,
  INTELLI_REQUIRED_GAMEPLAY_COLUMNS,
  readIntelliTables
} from '../config/intelli-tables.mjs';

const tables = readIntelliTables();

test('IntelliTable keeps the seven original families and exact row counts', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(tables.rows).map(([name, rows]) => [name, rows.size])), {
    Type: 8,
    Refresh: 41,
    Quality: 4,
    Award: 164,
    AwardType: 4,
    Const: 1,
    Intelli: 24
  });
});

test('IntelliTable preserves the original unlock and refresh index', () => {
  for (let tid = 1; tid <= 8; tid += 1) {
    assert.equal(tables.typeForTid(tid).unlock, 389242300000 + tid);
    assert.deepEqual(tables.typeForTid(tid).unlock_params, [3]);
  }
  assert.equal(tables.refreshForStarLimit(0).quality, 20);
  assert.equal(tables.refreshForStarLimit(11).quality, 30);
  assert.equal(tables.refreshForStarLimit(31).quality, 50);
  assert.equal(tables.refreshForStarLimit(40).quality, 50);
  assert.equal(tables.refreshForStarLimit(99), null);
});

test('IntelliTable preserves the two-hour quality timer and award index', () => {
  for (const tid of [20, 30, 40, 50]) {
    assert.equal(tables.qualityForTid(tid).finish_time, 7200);
  }
  assert.deepEqual(tables.rows.Const.get(1).fixed_award, [[1, 1], [2, 1], [4, 1]]);
  assert.deepEqual(Object.fromEntries([...tables.rows.AwardType].map(([tid, row]) => [tid, [row.award, row.weight]])), {
    1: [31002, 25],
    2: [32002, 15],
    3: [33002, 10],
    4: [201500, 25]
  });
});

test('Intelli rows expose only the four original data columns', () => {
  for (const row of tables.rows.Intelli.values()) {
    assert.deepEqual(Object.keys(row).sort(), [...INTELLI_PRESENT_COLUMNS].sort());
    for (const missing of INTELLI_REQUIRED_GAMEPLAY_COLUMNS) assert.equal(Object.hasOwn(row, missing), false);
  }
  assert.deepEqual([...INTELLI_REQUIRED_GAMEPLAY_COLUMNS], [
    'award', 'award_n', 'hero_star', 'hero_quality', 'conditions'
  ]);
});

test('Intelli evidence remains explicitly unsafe for gameplay completion', () => {
  assert.equal(tables.gameplayReady, false);
  assert.equal(tables.gameplayBlockers.length, 4);
  assert.match(tables.gameplayBlockers[0], /omit award, award_n, hero_star, hero_quality and conditions/);
  assert.match(tables.gameplayBlockers[1], /MethodScript is empty/);
});

test('Intelli unknown lookups stay unknown', () => {
  assert.equal(tables.typeForTid(9), null);
  assert.equal(tables.qualityForTid(60), null);
  assert.equal(tables.intelliForTid(25), null);
});
