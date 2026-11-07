/**
 * CORE-BATTLE-B: description-backed proprietary mechanisms.
 *
 * Every entry in PROPRIETARY_SKILL_RULES is only active when the catalog skill
 * still contains the quoted description fragments. A regenerated catalog that
 * changes a description therefore disables the rule instead of silently
 * applying a stale number. Entries are keyed by catalog skill id because the
 * shipped descriptions are per skill, not per hero.
 *
 * The numbers in `config` are transcribed from the same description (they are
 * quoted in `evidence`). Nothing is inferred: where a description omits a
 * value, the mechanism is not implemented and the gap is recorded in
 * implementation.md.
 */

import {
  PROPRIETARY_HOOKS,
  addLayer,
  addSuperHp,
  destroyShield,
  drainTianji,
  gainTianji,
  layerValue,
  openDomain,
  registerHook,
  setLayer,
  summonGuard,
  tianjiValue,
} from './proprietary-state.mjs';

/** Replaceable for tests that want to exercise a rule against a fixture skill. */
export let PROPRIETARY_SKILL_RULES = [];

export function setProprietarySkillRules(rules) {
  PROPRIETARY_SKILL_RULES = rules;
}

export function skillDescription(skill) {
  return String(skill?.description ?? '');
}

export function matchesDescription(skill, fragments) {
  if (!Array.isArray(fragments) || !fragments.length) return true;
  const text = skillDescription(skill);
  return fragments.every(fragment => (fragment instanceof RegExp ? fragment.test(text) : text.includes(fragment)));
}

/**
 * FightTable.Ability rows for 天极技 carry type 2 with run_type 5; every
 * ordinary ultimate/active row in the same catalog uses run_type 1. The ten
 * rows whose description starts with "消耗3点天极值" are exactly this set, so
 * run_type 5 is the configuration evidence for the action kind.
 */
export function isDeitySkill(skill) {
  const ability = skill?.implementation?.ability;
  return Boolean(ability) && Number(ability.type) === 2 && Number(ability.run_type) === 5;
}

/** Described 天极值 price of a 天极技, or null when the row does not state one. */
export function tianjiCostFor(skill) {
  const match = skillDescription(skill).match(/消耗\s*(\d+)\s*点天极值/);
  if (!match) return null;
  const cost = Number(match[1]);
  return Number.isSafeInteger(cost) && cost > 0 ? cost : null;
}

export function proprietaryRulesFor(skills = []) {
  const active = [];
  for (const skill of skills) {
    const id = String(skill?.id);
    for (const rule of PROPRIETARY_SKILL_RULES) {
      if (String(rule.skillId) !== id) continue;
      if (!matchesDescription(skill, rule.requires)) continue;
      active.push({ rule, skill });
    }
  }
  return active;
}

const HANDLERS = Object.freeze({});

/**
 * Apply every declaration that begins at battle start (超凡生命, summons,
 * opening layers) and register the hooks the declaration needs.
 */
export function initProprietaryBattle(unit, state, events = null) {
  const active = proprietaryRulesFor(unit.skills ?? []);
  for (const entry of active) {
    const handler = HANDLERS[entry.rule.kind];
    if (!handler) {
      unit.proprietary.warnings.push('unhandled-proprietary-kind:' + entry.rule.kind);
      continue;
    }
    const declaration = handler({ unit, skill: entry.skill, rule: entry.rule, state, events });
    unit.proprietary.rules.push({
      skillId: String(entry.skill.id),
      kind: entry.rule.kind,
      ...(declaration ?? {}),
    });
  }
  return unit.proprietary.rules;
}

/** Effect-list patch point used by skill-integration for damage caps etc. */
export function proprietarySkillEffects(skill, definitions) {
  return definitions;
}

/** Runtime trigger filter used to retire superseded catalog approximations. */
export function proprietaryTriggerAllowed(skill, trigger) {
  return true;
}
