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

function evaluateCondition(condition, role, context, open) {
  const type = String(condition?.type ?? '');
  const args = conditionArgs(condition);
  switch (type) {
    case 'role_level':
      return roleNumber(role, 'level', 1) >= Number(args.level ?? args.value ?? 1);
    case 'mission':
      return roleNumber(role, 'missionId', roleNumber(role, 'mission_id', 0)) >= Number(args.missionId ?? args.value ?? 0);
    case 'server_day':
      return Number(context?.serverDay ?? 0) >= Number(args.day ?? args.value ?? 1);
    case 'guide':
      return Number(role?.guides?.[args.step ?? args.value] ?? 0) >= Number(args.count ?? 1);
    case 'fun_open':
      return open.has(Number(args.funId ?? args.value));
    case 'create_day':
      return Number(context?.createDay ?? 0) >= Number(args.day ?? args.value ?? 1);
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
  const list = Array.isArray(rules) ? rules : [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of list) {
      const id = Number(rule?.funId);
      if (!Number.isSafeInteger(id) || id <= 0 || open.has(id)) continue;
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      let allowed = true;
      for (const condition of conditions) {
        const result = evaluateCondition(condition, role, context, open);
        if (result === null) {
          denied.push({ funId: id, type: condition?.type, reason: 'unknown_condition' });
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

