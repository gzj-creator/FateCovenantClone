import assert from 'node:assert/strict';
import test from 'node:test';
import { readHookTables } from '../config/hook-tables.mjs';

const tables = readHookTables();

test('HookTable exposes the six original families with exact row counts', () => {
  assert.equal(tables.rows.Type.size, 12);
  assert.equal(tables.rows.Stage.size, 5593);
  assert.equal(tables.rows.RandomAward.size, 60);
  assert.equal(tables.rows.FastItem.size, 61);
  assert.equal(tables.rows.FastHookType.size, 3);
  assert.equal(tables.rows.StyleStatus.size, 2);
  assert.deepEqual([...tables.rows.Type.keys()].sort((a, b) => a - b),
    [10, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28]);
});

test('HookTable type rows keep the original production clocks', () => {
  const peak = tables.typeForTid(10);
  assert.equal(peak.produce_period, 300);
  assert.equal(peak.max_fixed_period, 86400);
  assert.equal(peak.fast_gather_type, 2);
  assert.equal(peak.erl_module, 'peak_tower_hook');
  assert.deepEqual(peak.init_award, [[157002, 50], [17002, 20]]);
  const magical = tables.typeForTid(22);
  assert.equal(magical.long_random_period, 86400);
  assert.equal(magical.max_fixed_period, 172800);
  assert.deepEqual(magical.init_award, [[180002, 8000], [181002, 8000]]);
});

test('HookTable stage rows are keyed by stage tid and belong to a configured type', () => {
  const stage = tables.stageForTid(600101);
  assert.ok(stage);
  assert.deepEqual(stage.fixed_award, [[201500, 216000], [101800, 144000]]);
  assert.ok(tables.stageTidsForType(stage.belong_hook_type).includes(600101));
  const typed = [...tables.rows.Stage.values()].find(row => row.belong_hook_type !== 0);
  assert.ok(tables.rows.Type.has(typed.belong_hook_type));
});

test('HookTable fast rows reference the original fast hook groups', () => {
  const fast = tables.fastHookTypeForTid(2);
  assert.deepEqual(fast.hook_type, [10]);
  assert.equal(fast.fast_gather_time, 7200);
  assert.deepEqual(fast.fast_gather_price, [50, 100, 150]);
  assert.deepEqual(fast.fast_gather_n, [0, 3]);
  assert.equal(fast.fast_gather_cost_item, 101500);
  const item = tables.fastItemForTid(263002);
  assert.equal(item.hook_type, 4);
  assert.equal(item.sec, 900);
  assert.equal(item.max_speed, 2200300);
  assert.deepEqual(item.item, [180002]);
  assert.equal(tables.fastHookTypeForTid(4).fast_gather_time, 0);
  assert.equal(tables.fastHookTypeForTid(5).fast_gather_time, 0);
});

test('HookTable random award rows keep the original rates', () => {
  assert.deepEqual({ ...tables.randomAwardForTid(1) }, { tid: 1, random_produce: 0, short_period_rate: 250 });
  for (const row of tables.rows.RandomAward.values()) {
    assert.ok(Number.isSafeInteger(row.short_period_rate) && row.short_period_rate >= 0);
  }
});

test('HookTable rejects unknown lookups instead of inventing rows', () => {
  assert.equal(tables.typeForTid(999999), null);
  assert.equal(tables.stageForTid(1), null);
  assert.equal(tables.fastItemForTid(1), null);
  assert.equal(tables.randomAwardForTid(999), null);
});
