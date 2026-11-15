import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANUAL_REFRESH_CURRENCY,
  MANUAL_REFRESH_PRICE_TIERS,
  MAX_MANUAL_REFRESH,
  MYSTERY_REFRESH_COMMAND_TYPES,
  MYSTERY_REFRESH_DECISIONS,
  MYSTERY_REFRESH_MISSING_EVIDENCE,
  readMysteryShopRefreshEvidence
} from '../config/mystery-shop-refresh-evidence.mjs';
import { readMysteryShopTables } from '../config/mystery-shop-tables.mjs';
import { createMysteryShopService } from '../game/mystery-shop-service.mjs';
import { createR1FailClosedCommandService } from '../game/r1-fail-closed-command-service.mjs';

test('manual refresh ladder, limit and currency match the shipped MysteryShop rows', () => {
  const evidence = readMysteryShopRefreshEvidence();
  assert.deepEqual(evidence.priceTiers.map(tier => tier.price), [...MANUAL_REFRESH_PRICE_TIERS]);
  assert.deepEqual(evidence.priceTiers.map(tier => tier.tid), [1, 2, 3, 4, 5]);
  assert.ok(evidence.priceTiers.every(tier => tier.currency_type === MANUAL_REFRESH_CURRENCY));
  assert.equal(evidence.maxManualRefresh, MAX_MANUAL_REFRESH);
  // MysteryShopMgr.GetRefreshPriceCfg: last row whose tid <= count + 1, and
  // IsManualRefreshLimit blocks once count reaches max_manual_refresh.
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map(count => evidence.priceForRefreshCount(count)?.price ?? null),
    [100, 100, 120, 120, 150, null]
  );
});

test('discount weights are preserved per DiscountLibType without inventing a pool', () => {
  const tables = readMysteryShopTables();
  const evidence = readMysteryShopRefreshEvidence(tables);
  assert.equal(evidence.discountWeights.size, tables.rows.DiscountLibType.size);
  let rows = 0;
  for (const [type, weights] of evidence.discountWeights) {
    assert.ok(weights.length >= 1, 'type ' + type + ' must keep its discount rows');
    for (const row of weights) {
      assert.ok(row.discount >= 1 && row.discount <= 100);
      assert.equal(row.manual_refresh_cw.length, 4);
      assert.deepEqual(row.manual_refresh_cw.map(pair => pair[0]), [2, 4, 5, 20]);
      assert.ok(row.manual_refresh_cw.every(pair => pair[1] >= 0));
      assert.ok(row.auto_refresh_weight >= 0);
      rows += 1;
    }
  }
  assert.equal(rows, tables.rows.DiscountLib.size);
  assert.equal(evidence.facts.cellCount, tables.rows.Cell.size);
  assert.equal(evidence.facts.itemLibCount, tables.rows.ItemLib.size);
  assert.deepEqual([...evidence.facts.unsolvedStateFields], ['all_times_data', 'customize_auto_refresh_times']);
});

test('refresh evidence stays blocked and the buy path keeps exclusive ownership of 91503', () => {
  const evidence = readMysteryShopRefreshEvidence();
  assert.equal(evidence.gameplayReady, false);
  assert.equal(evidence.missingEvidence.length, MYSTERY_REFRESH_MISSING_EVIDENCE.length);
  assert.equal(MYSTERY_REFRESH_COMMAND_TYPES.autoRefresh, 91501);
  assert.equal(MYSTERY_REFRESH_COMMAND_TYPES.manualRefresh, 91502);
  assert.equal(MYSTERY_REFRESH_DECISIONS[91501], 'R1-ITEM-MYSTERYSHOP-AUTOREFRESH');
  assert.equal(MYSTERY_REFRESH_DECISIONS[91502], 'R1-ITEM-MYSTERYSHOP-MANUALREFRESH');

  const refusals = createR1FailClosedCommandService();
  for (const type of [91501, 91502]) {
    assert.equal(refusals.supports(type), true);
    assert.throws(() => refusals.execute(type, Buffer.alloc(0)), error => error.code === 5 && /ITEM-MYSTERYSHOP/.test(error.message));
  }
  // The implemented buy service must never advertise the refresh commands; they
  // cannot be routed through 91503's purchased-cell contract.
  const shop = createMysteryShopService({
    store: { transaction: () => {}, inspect: () => {} },
    codec: {},
    gameTables: { Item: new Map([['x', {}]]) },
    tables: readMysteryShopTables()
  });
  assert.equal(shop.supports(91501), false);
  assert.equal(shop.supports(91502), false);
});
