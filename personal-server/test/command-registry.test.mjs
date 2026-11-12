import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRegistry, loadCommandCatalog, COMMAND_CATALOG_TOTAL } from '../game/command-registry.mjs';

test('loads the complete 1407-command catalog with access declarations', () => {
  const catalog = loadCommandCatalog();
  const registry = createCommandRegistry({ catalog, rules: [] });
  const coverage = registry.coverage();
  assert.equal(catalog.total, COMMAND_CATALOG_TOTAL);
  assert.equal(coverage.total, COMMAND_CATALOG_TOTAL);
  assert.equal(coverage.read + coverage.write, COMMAND_CATALOG_TOTAL);
  assert.equal(registry.command(7000).name, 'req_open_fun');
});

test('gate applies only to commands with an explicit requirement', () => {
  const registry = createCommandRegistry({
    rules: [{ type: 7000, requires: [1001], access: 'read' }]
  });
  assert.equal(registry.gate(7000, new Set([1001])).allowed, true);
  const denied = registry.gate(7000, new Set());
  assert.deepEqual(denied, { allowed: false, access: 'read', requires: [1001], missing: [1001] });
  assert.equal(registry.gate(7001, new Set()), null);
});

test('invalid gate rules fail startup', () => {
  assert.throws(() => createCommandRegistry({ rules: [{ type: 999999, requires: [1] }] }), /unknown type/);
  const catalog = loadCommandCatalog();
  const broken = { ...catalog, commands: catalog.commands.slice(0, 10), total: 10 };
  assert.throws(() => createCommandRegistry({ catalog: broken, rules: [] }), /exactly 1407/);
});
