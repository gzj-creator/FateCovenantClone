import test from 'node:test';
import assert from 'node:assert/strict';
import { readGameTables } from '../config/game-tables.mjs';
import { createDailyDiscountPurchaseRules } from '../game/daily-discount-purchase.mjs';

const tables = readGameTables();

const rules = () => createDailyDiscountPurchaseRules({
  rows: [...tables.DailyDiscountRecharge.values()],
  rechargeTable: tables.Recharge
});

test('one-key daily discount consumes the free gift and grants its reward once', () => {
  const service = rules();
  const facts = service.resolve(tables.Recharge.get(46003));
  assert.deepEqual(facts, { affectedTids: [6, 2, 5, 1], oneKey: true, optionalTids: [1] });
  assert.deepEqual(service.rewards(tables.Recharge.get(46003)), [[1581200, 10], [101500, 30]]);
  assert.deepEqual(service.rewards(tables.Recharge.get(46003), false), [[1581200, 10]]);
});

test('standalone daily products keep their own purchase fact and reward boundary', () => {
  const service = rules();
  assert.deepEqual(service.resolve(tables.Recharge.get(40006)), { affectedTids: [1], oneKey: false, optionalTids: [] });
  assert.deepEqual(service.rewards(tables.Recharge.get(40006)), []);
  assert.deepEqual(service.resolve(tables.Recharge.get(46002)), { affectedTids: [5], oneKey: false, optionalTids: [] });
  assert.deepEqual(service.rewards(tables.Recharge.get(46002)), [[1581200, 10]]);
});

test('a missing one-key free gift makes the whole plan invalid', () => {
  const rows = [...tables.DailyDiscountRecharge.values()].filter(row => row.recharge_id !== 40006);
  const service = createDailyDiscountPurchaseRules({ rows, rechargeTable: tables.Recharge });
  assert.equal(service.resolve(tables.Recharge.get(46003)), null);
  assert.throws(() => service.rewards(tables.Recharge.get(46003)), /configuration/);
});
