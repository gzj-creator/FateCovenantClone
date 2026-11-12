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

export function createCommandRegistry({ catalog = loadCommandCatalog(), rules = loadCommandGateRules(), logger = () => {} } = {}) {
  validateCatalog(catalog);
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
  return {
    total: commands.size,
    command: type => commands.get(Number(type)) ?? null,
    coverage,
    gate(type, openFunIds = new Set()) {
      const command = commands.get(Number(type));
      if (!command || !command.requires.length) return null;
      const open = openFunIds instanceof Set ? openFunIds : new Set(openFunIds);
      const missing = command.requires.filter(id => !open.has(id));
      return { allowed: missing.length === 0, access: command.access, requires: command.requires, missing };
    }
  };
}
