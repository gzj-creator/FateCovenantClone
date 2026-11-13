import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'config');
export const COMMAND_CATALOG_TOTAL = 1407;

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadCommandCatalog(file = path.join(configRoot, 'command-catalog.json')) {
  const parsed = readJson(file, null);
  if (!parsed || !Array.isArray(parsed.commands)) throw new Error(`Command catalog is missing: ${file}`);
  return parsed;
}

export function loadCommandGateRules(file = path.join(configRoot, 'command-gate-rules.json')) {
  const parsed = readJson(file, { rules: [] });
  const rules = Array.isArray(parsed) ? parsed : parsed.rules;
  if (!Array.isArray(rules)) throw new Error(`Command gate rules are invalid: ${file}`);
  return rules;
}

export function loadCommandDispatchAudit(file = path.join(configRoot, 'command-dispatch-audit.json')) {
  const parsed = readJson(file, null);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.commands)) {
    throw new Error(`Command dispatch audit is missing or invalid: ${file}`);
  }
  return parsed;
}

function validateCatalog(catalog) {
  if (catalog.total !== COMMAND_CATALOG_TOTAL || catalog.commands.length !== COMMAND_CATALOG_TOTAL) {
    throw new Error(`Command catalog must contain exactly ${COMMAND_CATALOG_TOTAL} entries`);
  }
  const types = new Set(), names = new Set();
  for (const command of catalog.commands) {
    const type = Number(command.type);
    if (!Number.isSafeInteger(type) || type < 0) throw new Error(`Invalid command type: ${command.type}`);
    if (!command.name || !['read', 'write'].includes(command.access)) {
      throw new Error(`Command ${type} has no access declaration`);
    }
    if (types.has(type)) throw new Error(`Duplicate command type: ${type}`);
    if (names.has(command.name)) throw new Error(`Duplicate command name: ${command.name}`);
    types.add(type); names.add(command.name);
  }
}

const DISPATCH_STATUSES = new Set(['service_route', 'gateway_route', 'multi_owner', 'unrouted']);
const DISPATCH_SUMMARY_FIELDS = Object.freeze([
  'total', 'serviceRoute', 'gatewayRoute', 'multiOwner', 'unrouted',
  'requestEncodingMismatch', 'requestEncodingUnverified', 'responseRuntimeUnverified',
  'responseSchemaMissing'
]);

function dispatchCounts(rows) {
  const count = status => rows.filter(row => row.status === status).length;
  return {
    total: rows.length,
    serviceRoute: count('service_route'),
    gatewayRoute: count('gateway_route'),
    multiOwner: count('multi_owner'),
    unrouted: count('unrouted'),
    requestEncodingMismatch: rows.filter(row => row.requestEncodingDifference === true).length,
    requestEncodingUnverified: rows.filter(row => Array.isArray(row.evidenceGaps)
      && row.evidenceGaps.includes('request_encoding_unverified')).length,
    responseRuntimeUnverified: rows.filter(row => row.responseRuntimeVerification === 'unverified').length,
    responseSchemaMissing: rows.filter(row => Array.isArray(row.evidenceGaps)
      && row.evidenceGaps.includes('response_schema_missing')).length
  };
}

export function validateCommandDispatchAudit(audit, catalog) {
  if (audit?.schemaVersion !== 1 || !Array.isArray(audit.commands)) {
    throw new Error('Command dispatch audit schemaVersion 1 is required');
  }
  if (audit.commands.length !== COMMAND_CATALOG_TOTAL) {
    throw new Error(`Command dispatch audit must contain exactly ${COMMAND_CATALOG_TOTAL} entries`);
  }
  const catalogByType = new Map(catalog.commands.map(command => [Number(command.type), command]));
  const auditedTypes = new Set();
  for (const row of audit.commands) {
    const type = Number(row.type);
    if (!Number.isSafeInteger(type) || auditedTypes.has(type)) {
      throw new Error(`Command dispatch audit has an invalid or duplicate type: ${row.type}`);
    }
    const command = catalogByType.get(type);
    if (!command) throw new Error(`Command dispatch audit references unknown type: ${type}`);
    if (row.name !== command.name || row.access !== command.access) {
      throw new Error(`Command dispatch audit metadata differs for type ${type}`);
    }
    if (!DISPATCH_STATUSES.has(row.status) || !Array.isArray(row.owners)
      || !Array.isArray(row.shadowedOwners) || !Array.isArray(row.evidenceGaps)) {
      throw new Error(`Command dispatch audit row is malformed for type ${type}`);
    }
    if (row.status === 'unrouted' ? row.owners.length !== 0 : row.owners.length === 0) {
      throw new Error(`Command dispatch audit owner coverage differs for type ${type}`);
    }
    auditedTypes.add(type);
  }
  if (auditedTypes.size !== catalogByType.size) {
    throw new Error('Command dispatch audit does not cover the complete command catalog');
  }
  const expected = dispatchCounts(audit.commands);
  for (const field of DISPATCH_SUMMARY_FIELDS) {
    if (audit.summary?.[field] !== expected[field]) {
      throw new Error(`Command dispatch audit summary is stale for ${field}`);
    }
  }
  for (const field of ['ownerWithoutSupports', 'ownerWithoutCatalogTypes', 'supportedOutsideCatalog']) {
    if (!Array.isArray(audit[field])) throw new Error(`Command dispatch audit ${field} must be an array`);
  }
  return Object.freeze({ ...expected });
}

export function createCommandRegistry({
  catalog = loadCommandCatalog(),
  rules = loadCommandGateRules(),
  dispatchAudit = loadCommandDispatchAudit(),
  logger = () => {}
} = {}) {
  validateCatalog(catalog);
  const dispatchCoverage = validateCommandDispatchAudit(dispatchAudit, catalog);
  const commands = new Map(catalog.commands.map(command => [Number(command.type), {
    ...command,
    requires: [...new Set((command.requires ?? []).map(Number))]
  }]));
  for (const rule of rules) {
    const command = commands.get(Number(rule.type));
    if (!command) throw new Error(`Command gate rule references an unknown type: ${rule.type}`);
    if (rule.access != null && !['read', 'write'].includes(rule.access)) throw new Error(`Invalid access for command ${rule.type}`);
    if (rule.access != null) command.access = rule.access;
    if (rule.requires != null) command.requires = [...new Set(rule.requires.map(Number))].filter(Number.isSafeInteger);
    command.declared = true;
  }
  let lastCoverage = null;
  function coverage() {
    const result = { total: commands.size, read: 0, write: 0, requires: 0, declared: 0 };
    for (const command of commands.values()) {
      result[command.access] += 1;
      if (command.requires.length) result.requires += 1;
      if (command.declared) result.declared += 1;
    }
    lastCoverage = result;
    return result;
  }
  coverage();
  try { logger({ event: 'command_catalog_loaded', ...lastCoverage }); } catch {}
  try {
    logger({
      event: 'command_dispatch_audit_loaded',
      ...dispatchCoverage,
      ownerWithoutSupports: dispatchAudit.ownerWithoutSupports.length,
      ownerWithoutCatalogTypes: dispatchAudit.ownerWithoutCatalogTypes.length,
      supportedOutsideCatalog: dispatchAudit.supportedOutsideCatalog.length
    });
  } catch {}
  return {
    total: commands.size,
    command: type => commands.get(Number(type)) ?? null,
    coverage,
    dispatchCoverage: () => ({ ...dispatchCoverage }),
    gate(type, openFunIds = new Set()) {
      const command = commands.get(Number(type));
      if (!command || !command.requires.length) return null;
      const open = openFunIds instanceof Set ? openFunIds : new Set(openFunIds);
      const missing = command.requires.filter(id => !open.has(id));
      return { allowed: missing.length === 0, access: command.access, requires: command.requires, missing };
    }
  };
}
