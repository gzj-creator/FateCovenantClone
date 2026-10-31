import test from 'node:test';
import assert from 'node:assert/strict';
import {
  etfIntegerList,
  rechargeClaimKey,
  rechargeDayIndex,
  rechargeDayStart,
  requireCentAmount,
  requireRechargeRequestTuple,
  roleLoginDayCount
} from '../game/recharge-rules.mjs';

test('recharge days roll over at 05:00 Asia/Shanghai and login days start at one', () => {
  const beforeReset = Date.parse('2026-10-31T20:59:59Z') / 1000;
  const atReset = Date.parse('2026-10-31T21:00:00Z') / 1000;
  assert.equal(rechargeDayIndex(atReset), rechargeDayIndex(beforeReset) + 1);
  assert.equal(rechargeDayStart(atReset), atReset);

  const created = Date.parse('2026-10-30T21:30:00Z') / 1000;
  assert.equal(roleLoginDayCount(created, beforeReset), 1);
  assert.equal(roleLoginDayCount(created, atReset), 2);
  assert.equal(roleLoginDayCount(0, atReset), 1);
});

test('cent amounts remain exact integers and malformed recharge amounts fail', () => {
  assert.equal(requireCentAmount(600), 600);
  assert.equal(requireCentAmount(0, 'total', { allowZero: true }), 0);
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, '6.00']) {
    assert.throws(() => requireCentAmount(value), /exact integer number of cents/);
  }
});

test('ETF number lists and claim keys normalize without accepting implicit extra values', () => {
  assert.deepEqual(etfIntegerList([31, 3101]), [31, 3101]);
  assert.deepEqual(etfIntegerList({ value: [31, 3101] }), [31, 3101]);
  assert.deepEqual(requireRechargeRequestTuple('31', 1, 'request'), [31]);
  assert.throws(() => requireRechargeRequestTuple([31, 3101], 1, 'request'), /must contain 1/);
  assert.equal(rechargeClaimKey('first_recharge', 1, 2), 'first_recharge:1:2');
});
