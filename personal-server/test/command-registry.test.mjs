import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCommandRegistry, loadCommandCatalog, loadCommandDispatchAudit,
  validateCommandDispatchAudit, COMMAND_CATALOG_TOTAL
} from '../game/command-registry.mjs';

test('loads the complete 1407-command catalog with access declarations', () => {
  const catalog = loadCommandCatalog();
  const registry = createCommandRegistry({ catalog, rules: [] });
  const coverage = registry.coverage();
  assert.equal(catalog.total, COMMAND_CATALOG_TOTAL);
  assert.equal(coverage.total, COMMAND_CATALOG_TOTAL);
  assert.equal(coverage.read + coverage.write, COMMAND_CATALOG_TOTAL);
  assert.equal(registry.command(7000).name, 'req_open_fun');
  assert.deepEqual(registry.dispatchCoverage(), {
    total: 1407,
    serviceRoute: 1316,
    gatewayRoute: 18,
    multiOwner: 6,
    unrouted: 67,
    requestEncodingMismatch: 172,
    requestEncodingUnverified: 986,
    responseRuntimeUnverified: 1407,
    responseSchemaMissing: 223
  });
});

test('dispatch audit covers every catalog type exactly once', () => {
  const catalog = loadCommandCatalog();
  const audit = loadCommandDispatchAudit();
  const commands = new Set(catalog.commands.map(command => Number(command.type)));
  const audited = new Set(audit.commands.map(command => Number(command.type)));
  assert.equal(audit.commands.length, COMMAND_CATALOG_TOTAL);
  assert.equal(audited.size, COMMAND_CATALOG_TOTAL);
  assert.deepEqual(audited, commands);
  assert.equal(audit.ownerWithoutSupports.length, 0);
  assert.equal(audit.supportedOutsideCatalog.length, 0);
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

test('stale or incomplete dispatch audits fail startup', () => {
  const catalog = loadCommandCatalog();
  const audit = loadCommandDispatchAudit();
  const duplicate = structuredClone(audit);
  duplicate.commands[1].type = duplicate.commands[0].type;
  assert.throws(() => validateCommandDispatchAudit(duplicate, catalog), /invalid or duplicate type/);

  const incomplete = structuredClone(audit);
  incomplete.commands.pop();
  assert.throws(() => validateCommandDispatchAudit(incomplete, catalog), /exactly 1407/);

  const stale = structuredClone(audit);
  stale.summary.unrouted += 1;
  assert.throws(() => validateCommandDispatchAudit(stale, catalog), /summary is stale for unrouted/);
});
