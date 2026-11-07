/**
 * Skill integration layer - loads skill definitions and applies effects
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EffectExecutor } from './effect-executor.mjs';
import { TargetSelector } from './target-selector.mjs';
import { TARGET_TYPES, DURATION_TYPES, TRIGGER_TYPES } from './effect-types.mjs';
import { commonSkillEffect, commonSkillEffects, commonSkillTriggerType } from './common-skill-rules.mjs';
import { proprietarySkillEffects } from './proprietary-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load skill database
 */
export function loadSkillDatabase() {
  try {
    const file = path.join(__dirname, '../../config/skill-database.json');
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load skill database:', error);
    return null;
  }
}

/**
 * Get skill definition by ID
 */
export function getSkillById(skillId, skillDatabase) {
  if (!skillDatabase) return null;

  for (const hero of skillDatabase.heroes) {
    const skill = hero.skills.find(s => s.id === skillId);
    if (skill) return skill;
  }

  return null;
}

/**
 * Get skill definition for a hero
 */
export function getHeroSkills(heroId, skillDatabase) {
  if (!skillDatabase) return [];

  const key = String(heroId);
  const hero = skillDatabase.heroes.find(h => String(h.id) === key);
  return hero ? hero.skills : [];
}

/**
 * Resolve the catalog skill used by one battle action.
 *
 * The shipped HeroTable ability ids and the catalog skill ids use different
 * numbering. An exact id match is therefore preferred, but the catalog still
 * exposes the hero's normal and ultimate definitions. Metadata-only 2.0x
 * ultimate fallbacks are deliberately ignored so the existing profession
 * behavior remains the compatibility path until those rows are investigated.
 */
export function resolveActionSkill(unit, useSkill, skillDatabase) {
  if (!skillDatabase || !unit) return null;
  const skills = Array.isArray(unit.skills) ? unit.skills : getHeroSkills(unit.role ?? unit.id, skillDatabase);
  const actionId = String(useSkill ? (unit.activeAbilityId ?? unit.abilityId ?? '') : (unit.abilityId ?? ''));
  const exact = skills.find(skill => String(skill.id) === actionId);
  if (exact) return exact;
  if (!useSkill) return skills.find(skill => skill.type === 'Normal') ?? null;
  const ultimates = skills.filter(skill => skill.type === 'Ultimate');
  return ultimates.find(skill => {
    const implementation = skill.implementation;
    if (!implementation) return false;
    const metadataFallback = skill.category === 'metadata fallback'
      || implementation.category === 'metadata fallback'
      || (implementation.requiresInvestigation === true
        && implementation.resolvedDescription === false
        && implementation.catalogTypeMatch !== true);
    return !metadataFallback && (implementation.category === 'description-inferred'
      || implementation.resolvedDescription === true
      || implementation.catalogTypeMatch === true);
  })
    ?? null;
}

/**
 * Convert catalog skill to effect definition
 * This is a placeholder - will be enhanced with FightTable data
 */
export function skillToEffect(skill, skillDatabase) {
  if (!skill) return null;
  // Prefer stored explicit single effect
  if (skill.implementation && Array.isArray(skill.implementation.effects) && skill.implementation.effects.length === 1) {
    return commonSkillEffect(skill, { ...skill.implementation.effects[0] });
  }
  if (skill.implementation && Array.isArray(skill.implementation.effects) && skill.implementation.effects.length > 1) {
    // Return first as representative; callers needing all should use skillToEffects
    return commonSkillEffect(skill, { ...skill.implementation.effects[0] });
  }
  if (!skill.implementation) {
    return null;
  }
  const impl = skill.implementation;
  if (impl.ability) {
    const ability = impl.ability;
    const abilityDes = impl.abilityDes;

    // Determine effect type based on ability.type and dmg_type
    // This is a simplified mapping - will be refined with FightTable.Effect data
    let effectType = 'damage';
    let targetType = TARGET_TYPES.SINGLE;

    // Simple heuristic based on catalog description
    if (skill.description) {
      const desc = skill.description.toLowerCase();
      if (desc.includes('治疗') || desc.includes('恢复') || desc.includes('回复')) {
        effectType = 'heal';
      } else if (desc.includes('护盾') || desc.includes('获得护盾')) {
        effectType = 'shield';
      } else if (desc.includes('全体') || desc.includes('全员') || desc.includes('all')) {
        targetType = TARGET_TYPES.ALL_ENEMIES;
      } else if (desc.includes('前排') || desc.includes('front row')) {
        targetType = TARGET_TYPES.FRONT_ROW;
      } else if (desc.includes('后排') || desc.includes('back row')) {
        targetType = TARGET_TYPES.BACK_ROW;
      } else if (desc.includes('生命最低') || desc.includes('lowest hp')) {
        targetType = TARGET_TYPES.LOWEST_HP;
      }
    }

    // Build effect definition
    const effect = {
      type: effectType,
      target: {
        targetType,
      },
      effect: {},
      duration: {
        durationType: DURATION_TYPES.INSTANT,
      },
      chance: 1.0,
    };

    // Add effect-specific parameters
    if (effectType === 'damage') {
      effect.effect = {
        damageType: 'physical',
        multiplier: 2.0, // Default multiplier, will be refined with FightTable data
        canCrit: true,
      };
    } else if (effectType === 'heal') {
      effect.effect = {
        healType: 'percent-attack',
        multiplier: 0.5, // Default multiplier, will be refined
        overheal: false,
      };
    } else if (effectType === 'shield') {
      effect.effect = {
        shieldType: 'percent-max-hp',
        multiplier: 0.1, // Default multiplier, will be refined
      };
    }

    return effect;
  }

  return null;
}

/**
 * Convert catalog skill to effect definitions (array)
 * Prefers stored implementation.effects if present; falls back to heuristic single.
 */
export function skillToEffects(skill, skillDatabase) {
  if (!skill) return [];

  // Stored explicit effects
  if (skill.implementation && Array.isArray(skill.implementation.effects) && skill.implementation.effects.length) {
    return proprietarySkillEffects(skill, commonSkillEffects(skill, skill.implementation.effects.map(e => ({ ...e }))));
  }

  // Fallback to single heuristic
  const single = skillToEffect(skill, skillDatabase);
  return single ? proprietarySkillEffects(skill, [single]) : [];
}

function passesChance(chance, executor) {
  if (chance === undefined || chance === null) return true;
  const value = Number(chance);
  if (!Number.isFinite(value)) return false;
  if (value >= 1) return true;
  if (value <= 0) return false;
  return executor.random() < value;
}

function executorEffect(effectDefinition, sourceSkill) {
  const effect = { ...(effectDefinition.effect || {}) };
  for (const key of ['duration', 'unique', 'refresh', 'trigger', 'triggers', 'maxStacks', 'conditionKey']) {
    if (effectDefinition[key] !== undefined) effect[key] = effectDefinition[key];
  }
  effect.sourceSkill ??= sourceSkill;
  return effect;
}

export function applySkillEffects(skill, actor, allUnits, state, events) {
  if (!skill) return { targets: [], results: [] };

  const executor = new EffectExecutor(state);
  const selector = new TargetSelector();

  // Load skill database if not in state
  const skillDatabase = state.skillDatabase || loadSkillDatabase();
  if (!skillDatabase) {
    console.warn('Skill database not available');
    return { targets: [], results: [] };
  }

  // Convert skill to every executable effect definition.
  const effectDefinitions = skillToEffects(skill, skillDatabase);
  if (!effectDefinitions.length) {
    console.warn(`No effect definition for skill ${skill.id}`);
    return { targets: [], results: [] };
  }

  const affectedTargets = new Map();
  const results = [];

  for (const effectDefinition of effectDefinitions) {
    if (!effectDefinition?.effect) continue;
    const targets = selector.selectTargets(effectDefinition.target, actor, allUnits, state);

    for (const target of targets) {
      affectedTargets.set(target.id, target);
      if (typeof effectDefinition.condition === 'function'
        && !effectDefinition.condition(actor, target, state)) continue;
      if (effectDefinition.conditionKey
        && !evaluateConditionKey(effectDefinition.conditionKey, actor, allUnits, state, target)) continue;
      if (!passesChance(effectDefinition.chance, executor)) continue;

      const result = executor.executeEffect(
        executorEffect(effectDefinition, skill.id),
        actor,
        target
      );
      if (result) {
        events.push(result);
        results.push(result);
      }
    }
  }
  return { targets: [...affectedTargets.values()].sort((left, right) =>
    Number(left.loc) - Number(right.loc) || Number(left.id) - Number(right.id)), results };
}

export function collectSkillTargets(skill, actor, allUnits, state) {
  if (!skill) return [];
  const selector = new TargetSelector(state);
  const targets = new Map();
  for (const effectDefinition of skillToEffects(skill, state.skillDatabase)) {
    if (!effectDefinition?.effect) continue;
    for (const target of selector.selectTargets(effectDefinition.target, actor, allUnits, state)) {
      targets.set(target.id, target);
    }
  }
  return [...targets.values()].sort((left, right) =>
    Number(left.loc) - Number(right.loc) || Number(left.id) - Number(right.id));
}

/**
 * Register passive triggers for a unit
 */
export function registerPassiveTriggers(unit, skillDatabase, state) {
  if (!skillDatabase) return;

  const skills = Array.isArray(unit.skills)
    ? unit.skills
    : getHeroSkills(unit.role ?? unit.id, skillDatabase);
  const triggers = [];

  for (const skill of skills) {
    if (skill.type !== 'Passive' && skill.type !== 'Mastery') continue;

    // Prefer stored triggers from implementation
    const storedTriggers = skill.implementation && Array.isArray(skill.implementation.triggers)
      ? skill.implementation.triggers : null;

    if (Array.isArray(storedTriggers)) {
      for (const t of storedTriggers) {
        const rawEffect = t.effect ? commonSkillEffect(skill, { ...t.effect }) : skillToEffect(skill, skillDatabase);
        // CORE-BATTLE-B: per-skill damage ceilings apply to triggered effects too.
        const effect = rawEffect ? (proprietarySkillEffects(skill, [rawEffect])[0] ?? rawEffect) : rawEffect;
        const triggerType = commonSkillTriggerType(skill, t.triggerType);
        const permanentStatModifier = effect?.effect?.type === 'stat-modifier'
          && effect.duration?.durationType === 'permanent';
        // Conditional passives describe a state while their condition holds.
        // Reapplying that state every round must refresh it rather than append
        // another permanent copy. The same applies to on-buff-gain auras, whose
        // own stat gain would otherwise feed back into the trigger.
        if (permanentStatModifier
          && (t.conditionKey || t.triggerType === 'on-buff-gain')
          && effect.unique === undefined
          && !(Number(effect.maxStacks) > 0)) {
          effect.unique = true;
        }
        triggers.push({
          id: `${skill.id}_${unit.id}_${triggers.length}`,
          triggerType,
          sourceSkill: skill.id,
          condition: null,
          conditionKey: t.conditionKey || null,
          cooldown: t.cooldown || 0,
          cooldownMax: t.cooldown || 0,
          cooldownRound: null,
          chance: t.chance ?? null,
          maxTriggers: t.maxTriggers || 0,
          oncePerBattle: !!t.oncePerBattle,
          oncePerRound: !!t.oncePerRound
            || (permanentStatModifier && t.triggerType === 'on-buff-gain'),
          effect,
          priority: t.priority || 0,
          triggered: false,
          triggeredThisRound: false,
          triggersUsed: 0,
        });
      }
      continue;
    }

    // Fallback: infer trigger type from description
    const desc = skill.description || '';
    const triggerType = inferTriggerType(desc);
    if (triggerType) {
      triggers.push({
        id: `${skill.id}_${unit.id}`,
        triggerType,
        sourceSkill: skill.id,
        condition: null,
        conditionKey: null,
        cooldown: 0,
        maxTriggers: 0,
        oncePerBattle: false,
        oncePerRound: false,
        effect: skillToEffect(skill, skillDatabase),
        priority: 0,
        triggered: false,
        triggeredThisRound: false,
        triggersUsed: 0,
      });
    }
  }

  unit.triggers = triggers;
}

/**
 * Infer trigger type from description
 */
function inferTriggerType(description) {
  const desc = description.toLowerCase();

  if (desc.includes('普攻') || desc.includes('normal attack')) {
    return TRIGGER_TYPES.ON_ATTACK;
  } else if (desc.includes('绝招') || desc.includes('ultimate') || desc.includes('skill')) {
    return TRIGGER_TYPES.ON_SKILL_USE;
  } else if (desc.includes('被击') || desc.includes('being hit')) {
    return TRIGGER_TYPES.ON_BEING_HIT;
  } else if (desc.includes('击杀') || desc.includes('kill')) {
    return TRIGGER_TYPES.ON_KILL;
  } else if (desc.includes('死亡') || desc.includes('death')) {
    return TRIGGER_TYPES.ON_DEATH;
  } else if (desc.includes('回合开始') || desc.includes('round start')) {
    return TRIGGER_TYPES.ON_ROUND_START;
  } else if (desc.includes('回合结束') || desc.includes('round end')) {
    return TRIGGER_TYPES.ON_ROUND_END;
  } else if (desc.includes('生命低于') || desc.includes('hp threshold')) {
    return TRIGGER_TYPES.ON_HP_THRESHOLD;
  }

  return null;
}

/**
 * Process triggers for a unit
 */
export function processTriggers(unit, triggerType, allUnits, state, events) {
  if (!unit.triggers || !unit.triggers.length) return;

  const executor = new EffectExecutor(state);
  const selector = new TargetSelector(state);

  const ordered = [...unit.triggers].sort((left, right) =>
    Number(left.priority || 0) - Number(right.priority || 0));
  for (const trigger of ordered) {
    if (trigger.triggerType !== triggerType) continue;

    // Cooldowns advance once per battle round, even if a unit sees several
    // matching events in that round.
    if (Number(trigger.cooldown) > 0) {
      const round = Number(state?.round);
      if (Number.isSafeInteger(round) && Number.isSafeInteger(trigger.cooldownRound)) {
        const elapsed = round - trigger.cooldownRound;
        if (elapsed > 0) {
          trigger.cooldown = Math.max(0, Number(trigger.cooldown) - elapsed);
          trigger.cooldownRound = round;
        }
      } else {
        trigger.cooldown--;
      }
      if (Number(trigger.cooldown) > 0) continue;
    }

    // Check condition
    if (trigger.condition && !trigger.condition(unit, null, state)) {
      continue;
    }
    // Evaluate conditionKey if present
    const effectConditionKey = trigger.effect?.conditionKey;
    if (trigger.conditionKey
      && !isTargetCondition(trigger.conditionKey)
      && !evaluateConditionKey(trigger.conditionKey, unit, allUnits, state)) {
      continue;
    }

    // Check once-per-battle
    if (trigger.oncePerBattle && trigger.triggered) {
      continue;
    }

    // Check once-per-round
    if (trigger.oncePerRound && trigger.triggeredThisRound) {
      continue;
    }

    // Check max triggers
    if (trigger.maxTriggers > 0 && trigger.triggersUsed >= trigger.maxTriggers) {
      continue;
    }

    if (!passesChance(trigger.chance, executor)) continue;

    // Apply trigger effect
    if (trigger.effect) {
      if (typeof trigger.effect.condition === 'function'
        && !trigger.effect.condition(unit, null, state)) continue;
      if (!passesChance(trigger.effect.chance, executor)) continue;
      // Lock trigger accounting before executing the effect. A triggered stat
      // or status can synchronously wake another trigger, and once-per-round/
      // battle limits must already be visible during that re-entrant call.
      lockTrigger(trigger, state);
      const targets = selector.selectTargets(trigger.effect.target, unit, allUnits, state);

      for (const target of targets) {
        if (trigger.conditionKey
          && !evaluateConditionKey(trigger.conditionKey, unit, allUnits, state, target)) continue;
        if (effectConditionKey
          && effectConditionKey !== trigger.conditionKey
          && !evaluateConditionKey(effectConditionKey, unit, allUnits, state, target)) continue;
        const result = executor.executeEffect(
          executorEffect(trigger.effect, trigger.sourceSkill),
          unit,
          target
        );
        if (result) {
          events.push({
            ...result,
            trigger: trigger.id,
            triggerType,
          });
        }
      }
    } else {
      lockTrigger(trigger, state);
    }

  }
}

function lockTrigger(trigger, state) {
  trigger.triggered = true;
  trigger.triggeredThisRound = true;
  trigger.triggersUsed = (trigger.triggersUsed || 0) + 1;
  if (Number(trigger.cooldownMax) > 0) {
    trigger.cooldown = Number(trigger.cooldownMax);
    trigger.cooldownRound = Number.isSafeInteger(Number(state?.round)) ? Number(state.round) : null;
  }
}

function isTargetCondition(key) {
  return key === 'target-has-debuff' || key === 'target-hp-above-self';
}

export function resetRoundTriggers(unit) {
  for (const trigger of unit?.triggers || []) trigger.triggeredThisRound = false;
}

/**
 * Evaluate a condition key string against current state.
 */
function evaluateConditionKey(key, unit, allUnits, state, target = null) {
  switch (key) {
    case 'hp-above-50':
      return unit.hp / unit.maxHp >= 0.5;
    case 'hp-above-70':
      return unit.hp / unit.maxHp >= 0.7;
    case 'hp-above-80':
      return unit.hp / unit.maxHp >= 0.8;
    case 'target-has-debuff':
      return Boolean(target && (target.debuffs || []).length > 0);
    case 'hp-below-30':
      return unit.hp / unit.maxHp < 0.3;
    case 'hp-below-40':
      return unit.hp / unit.maxHp < 0.4;
    case 'hp-below-50':
      return unit.hp / unit.maxHp < 0.5;
    case 'hp-below-70':
      return unit.hp / unit.maxHp < 0.7;
    case 'has-debuff':
      return (unit.debuffs || []).length > 0;
    case 'has-shield':
      return (unit.shield || 0) > 0;
    case 'target-hp-above-self':
      return Boolean(target && target.hp / target.maxHp > unit.hp / unit.maxHp);
    case 'round-3':
      return Boolean(state && state.round === 3);
    case 'round-1':
      return Boolean(state && state.round === 1);
    default:
      return false;
  }
}
export function processBuffTicks(unit, state, events) {
  if (!unit.buffs && !unit.debuffs) return;

  const allStatus = [...(unit.buffs || []), ...(unit.debuffs || [])];

  for (const status of allStatus) {
    const durationType = status.durationType
      || ((Number(status.remainingRounds ?? status.duration ?? 0) > 0) ? 'timed' : 'permanent');
    // A timed status created during this round gets its full advertised lifetime.
    // Conditional statuses still need to react to condition changes immediately.
    if (durationType === 'timed'
      && Number.isSafeInteger(status.appliedRound)
      && status.appliedRound === state?.round) continue;
    let expired = false;
    if (durationType === 'timed') {
      const remaining = Math.max(0, Number(status.remainingRounds ?? status.duration ?? 0) - 1);
      status.remainingRounds = remaining;
      status.duration = remaining;
      expired = remaining === 0;
    } else if (durationType === 'conditional') {
      const conditionActive = typeof status.condition === 'function'
        ? status.condition(unit, null, state)
        : (!status.conditionKey || evaluateConditionKey(status.conditionKey, unit, null, state));
      expired = !conditionActive;
    }

    // Process tick effects (DoT, HoT)
    if (status.tickInterval > 0 && status.nextTick <= 0) {
      if (status.tickEffect) {
        const executor = new EffectExecutor(state);
        const result = executor.executeEffect(status.tickEffect, unit, unit);
        if (result) {
          events.push({
            ...result,
            status: status.id,
            tick: true,
          });
        }
      }
      status.nextTick = status.tickInterval;
    } else if (status.tickInterval > 0) {
      status.nextTick--;
    }

    // Trigger-count durations are consumed by the effect they protect against,
    // while permanent statuses remain until explicitly dispelled.
    if (expired) {
      const collection = unit.buffs.includes(status) ? unit.buffs : unit.debuffs;
      const index = collection.indexOf(status);
      if (index >= 0) {
        collection.splice(index, 1);
        events.push({
          type: 'status-expire',
          target: unit.id,
          statusType: status.type,
          statusId: status.id,
          durationType,
        });
      }
    }
  }
}
