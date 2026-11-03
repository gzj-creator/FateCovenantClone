/**
 * Skill integration layer - loads skill definitions and applies effects
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EffectExecutor } from './effect-executor.mjs';
import { TargetSelector } from './target-selector.mjs';
import { TARGET_TYPES, DURATION_TYPES, TRIGGER_TYPES } from './effect-types.mjs';

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

  const hero = skillDatabase.heroes.find(h => h.id === heroId);
  return hero ? hero.skills : [];
}

/**
 * Convert catalog skill to effect definition
 * This is a placeholder - will be enhanced with FightTable data
 */
export function skillToEffect(skill, skillDatabase) {
  if (!skill) return null;
  // Prefer stored explicit single effect
  if (skill.implementation && Array.isArray(skill.implementation.effects) && skill.implementation.effects.length === 1) {
    return { ...skill.implementation.effects[0] };
  }
  if (skill.implementation && Array.isArray(skill.implementation.effects) && skill.implementation.effects.length > 1) {
    // Return first as representative; callers needing all should use skillToEffects
    return { ...skill.implementation.effects[0] };
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
        variance: 0.92 + Math.random() * 0.16,
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
    return skill.implementation.effects.map(e => ({ ...e }));
  }

  // Fallback to single heuristic
  const single = skillToEffect(skill, skillDatabase);
  return single ? [single] : [];
}
export function applySkillEffects(skill, actor, allUnits, state, events) {
  if (!skill) return;

  const executor = new EffectExecutor(state);
  const selector = new TargetSelector();

  // Load skill database if not in state
  const skillDatabase = state.skillDatabase || loadSkillDatabase();
  if (!skillDatabase) {
    console.warn('Skill database not available');
    return;
  }

  // Convert skill to effect definition
  const effectDef = skillToEffect(skill, skillDatabase);
  if (!effectDef) {
    console.warn(`No effect definition for skill ${skill.id}`);
    return;
  }

  // Select targets
  const targets = selector.selectTargets(effectDef.target, actor, allUnits, state);

  // Apply effect to each target
  for (const target of targets) {
    // Check condition if present
    if (effectDef.condition && !effectDef.condition(actor, target, state)) {
      continue;
    }

    // Check chance
    if (effectDef.chance && Math.random() > effectDef.chance) {
      continue;
    }

    // Execute effect
    const result = executor.executeEffect(effectDef.effect, actor, target);

    if (result) {
      events.push(result);
    }
  }
}

/**
 * Register passive triggers for a unit
 */
export function registerPassiveTriggers(unit, skillDatabase, state) {
  if (!skillDatabase) return;

  const skills = getHeroSkills(unit.id, skillDatabase);
  const triggers = [];

  for (const skill of skills) {
    if (skill.type !== 'Passive' && skill.type !== 'Mastery') continue;

    // Prefer stored triggers from implementation
    const storedTriggers = skill.implementation && Array.isArray(skill.implementation.triggers)
      ? skill.implementation.triggers : null;

    if (Array.isArray(storedTriggers)) {
      for (const t of storedTriggers) {
        triggers.push({
          id: `${skill.id}_${unit.id}_${triggers.length}`,
          triggerType: t.triggerType,
          sourceSkill: skill.id,
          condition: null,
          conditionKey: t.conditionKey || null,
          cooldown: t.cooldown || 0,
          maxTriggers: t.maxTriggers || 0,
          oncePerBattle: !!t.oncePerBattle,
          oncePerRound: !!t.oncePerRound,
          effect: t.effect ? { ...t.effect } : skillToEffect(skill, skillDatabase),
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
  const selector = new TargetSelector();

  for (const trigger of unit.triggers) {
    if (trigger.triggerType !== triggerType) continue;

    // Check cooldown
    if (trigger.cooldown > 0) {
      trigger.cooldown--;
      continue;
    }

    // Check condition
    if (trigger.condition && !trigger.condition(unit, null, state)) {
      continue;
    }
    // Evaluate conditionKey if present
    if (trigger.conditionKey && !evaluateConditionKey(trigger.conditionKey, unit, allUnits, state)) {
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

    // Apply trigger effect
    if (trigger.effect) {
      const targets = selector.selectTargets(trigger.effect.target, unit, allUnits, state);

      for (const target of targets) {
        const result = executor.executeEffect(trigger.effect.effect, unit, target);
        if (result) {
          events.push({
            ...result,
            trigger: trigger.id,
            triggerType,
          });
        }
      }
    }

    // Update trigger state
    trigger.triggered = true;
    trigger.triggeredThisRound = true;
    trigger.triggersUsed = (trigger.triggersUsed || 0) + 1;
  }
}

/**
 * Evaluate a condition key string against current state.
 */
function evaluateConditionKey(key, unit, allUnits, state) {
  switch (key) {
    case 'hp-above-50':
      return unit.hp / unit.maxHp >= 0.5;
    case 'hp-above-70':
      return unit.hp / unit.maxHp >= 0.7;
    case 'target-has-debuff':
      // approximated true; precise per-target filtering requires further investigation
      return true;
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
      // evaluated at trigger fire; default true here, refined per-target later
      return true;
    case 'round-3':
      return (state && (state.round === 3 || state.round === undefined));
    case 'round-1':
      return (state && (state.round === 1 || state.round === undefined));
    default:
      return true;
  }
}
export function processBuffTicks(unit, state, events) {
  if (!unit.buffs && !unit.debuffs) return;

  const allStatus = [...(unit.buffs || []), ...(unit.debuffs || [])];

  for (const status of allStatus) {
    if (status.duration > 0) {
      status.duration--;
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

    // Remove expired status
    if (status.duration === 0) {
      const collection = unit.buffs.includes(status) ? unit.buffs : unit.debuffs;
      const index = collection.indexOf(status);
      if (index >= 0) {
        collection.splice(index, 1);
        events.push({
          type: 'status-expire',
          target: unit.id,
          statusType: status.type,
          statusId: status.id,
        });
      }
    }
  }
}
