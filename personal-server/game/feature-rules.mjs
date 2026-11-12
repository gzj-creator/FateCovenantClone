import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'config');

function conditionArgs(condition) {
  const args = condition?.args;
  if (Array.isArray(args)) return { value: args[0] };
  return args && typeof args === 'object' ? args : {};
}

function roleNumber(role, key, fallback = 0) {
  const value = Number(role?.[key] ?? fallback);
  return Number.isSafeInteger(value) ? value : fallback;
}

function compareNumbers(actual, expected, operator) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return null;
  switch (operator) {
    case '>=': return actual >= expected;
    case '>': return actual > expected;
    case '<=': return actual <= expected;
    case '<': return actual < expected;
    case '==': return actual === expected;
    case '!=': return actual !== expected;
    default: return null;
  }
}

function numericCondition(actual, args, condition) {
  const expected = Number(args.level ?? args.day ?? args.missionId ?? args.value);
  return compareNumbers(Number(actual), expected, condition?.operator ?? '>=');
}

function evaluateCondition(condition, role, context, open) {
  const type = String(condition?.type ?? '');
  const args = conditionArgs(condition);
  switch (type) {
    case 'role_level':
      return numericCondition(roleNumber(role, 'level', 1), args, condition);
    case 'mission':
      return numericCondition(roleNumber(role, 'missionId', roleNumber(role, 'mission_id', 0)), args, condition);
    case 'server_day':
      return numericCondition(context?.serverDay, args, condition);
    case 'guide':
      return Number(role?.guides?.[args.step ?? args.value] ?? 0) >= Number(args.count ?? 1);
    case 'fun_open':
      return open.has(Number(args.funId ?? args.value));
    case 'create_day':
      return numericCondition(context?.createDay, args, condition);
    case 'hero': {
      const heroes = Array.isArray(role?.heroes) ? role.heroes : Array.isArray(role?.heroInfo?.hero_list) ? role.heroInfo.hero_list : [];
      const tid = Number(args.tid ?? args.heroId ?? args.value ?? 0);
      const matches = heroes.filter(hero => Number(hero?.tid ?? hero) === tid);
      if (args.star != null) return matches.some(hero => Number(hero?.star ?? 0) >= Number(args.star));
      if (args.count != null) return (args.tid == null ? heroes.length : matches.length) >= Number(args.count);
      return matches.length > 0;
    }
    default:
      return null;
  }
}

export function evaluateFunOpen(role, rules = [], context = {}) {
  const open = new Set();
  const denied = [];
  const deniedKeys = new Set();
  const deny = (funId, type, reason) => {
    const key = `${funId}:${type}:${reason}`;
    if (deniedKeys.has(key)) return;
    deniedKeys.add(key);
    denied.push({ funId, type, reason });
  };
  const list = Array.isArray(rules) ? rules : [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of list) {
      const id = Number(rule?.funId);
      if (!Number.isSafeInteger(id) || id <= 0 || open.has(id)) continue;
      if ((rule?.status != null && rule.status !== 'ready') || (Array.isArray(rule?.evidenceGap) && rule.evidenceGap.length > 0)) {
        deny(id, 'rule_status', 'evidence_gap');
        continue;
      }
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      if (!Array.isArray(rule.conditions)) {
        deny(id, 'conditions', 'invalid_rule');
        continue;
      }
      if (conditions.length === 0) {
        deny(id, 'conditions', 'empty_conditions');
        continue;
      }
      let allowed = true;
      for (const condition of conditions) {
        const result = evaluateCondition(condition, role, context, open);
        if (result === null) {
          deny(id, condition?.type, 'unknown_condition');
          allowed = false;
          break;
        }
        if (!result) { allowed = false; break; }
      }
      if (allowed) { open.add(id); changed = true; }
    }
  }
  return { open, denied };
}

export function loadFunOpenRules(file = path.join(configRoot, 'fun-open-rules.json')) {
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.rules) ? parsed.rules : [];
}

