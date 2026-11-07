/**
 * Effect executor - applies effects to battle state
 */

import { DAMAGE_TYPES, HEAL_TYPES, SHIELD_TYPES, STAT_TYPES, ENERGY_TYPES, STATUS_TYPES } from './effect-types.mjs';

const BUFF_STAT_TYPES = new Set([
  STAT_TYPES.ATTACK_FLAT,
  STAT_TYPES.ATTACK_PERCENT,
  STAT_TYPES.DEFENSE_FLAT,
  STAT_TYPES.DEFENSE_PERCENT,
  STAT_TYPES.SPEED_FLAT,
  STAT_TYPES.SPEED_PERCENT,
  STAT_TYPES.CRIT_RATE,
  STAT_TYPES.CRIT_DAMAGE,
  STAT_TYPES.IGNORE_DEFENSE,
  STAT_TYPES.DAMAGE_BONUS,
  STAT_TYPES.DAMAGE_REDUCTION,
  STAT_TYPES.CRIT_DAMAGE_REDUCTION,
  STAT_TYPES.CRIT_RESIST,
  STAT_TYPES.CRIT_RESISTANCE,
  STAT_TYPES.ANTI_CRIT,
  STAT_TYPES.HIT_RATE,
  STAT_TYPES.EVASION,
  STAT_TYPES.STATUS_HIT,
  STAT_TYPES.STATUS_RESIST,
  STAT_TYPES.REBOUND_RATE,
  STAT_TYPES.MAX_HP_PERCENT,
  STAT_TYPES.HEAL_BONUS,
  STAT_TYPES.SHIELD_BONUS,
  STAT_TYPES.ENERGY_BONUS,
]);

const MIN_EFFECT_BONUS = -0.9;

const BUFF_STATUS_TYPES = new Set([
  STATUS_TYPES.PROTECTION,
  STATUS_TYPES.INVULNERABLE,
  STATUS_TYPES.STRENGTHENED,
  STATUS_TYPES.HASTED,
  STATUS_TYPES.ENERGIZED,
]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function modifierStacks(modifier) {
  return Math.max(1, Math.floor(finiteNumber(modifier?.stacks, 1)));
}

function modifierCollections(source) {
  if (Array.isArray(source)) return [source];
  return [source?.buffs, source?.debuffs].filter(Array.isArray);
}

/**
 * Sum one stat family from any unit-like object or modifier array.
 * Additive modifiers scale linearly with stacks. Non-additive modifiers are
 * compounded as (1 + magnitude) ** stacks - 1.
 */
export function statTotal(source, statType, actionType = null) {
  let total = 0;
  for (const collection of modifierCollections(source)) {
    for (const modifier of collection) {
      if (modifier?.statType !== statType) continue;
      if (modifier.actionType && modifier.actionType !== actionType) continue;
      const magnitude = finiteNumber(modifier.magnitude);
      const stacks = modifierStacks(modifier);
      total += modifier.stacksAdditive === false
        ? Math.pow(Math.max(0, 1 + magnitude), stacks) - 1
        : magnitude * stacks;
    }
  }
  return total;
}

export function effectiveAttack(unit) {
  const flat = statTotal(unit, STAT_TYPES.ATTACK_FLAT);
  const percent = Math.max(-1, statTotal(unit, STAT_TYPES.ATTACK_PERCENT));
  return Math.max(0, (finiteNumber(unit?.attack) + flat) * (1 + percent));
}

export function effectiveDefense(unit) {
  const flat = statTotal(unit, STAT_TYPES.DEFENSE_FLAT);
  const percent = Math.max(-1, statTotal(unit, STAT_TYPES.DEFENSE_PERCENT));
  return Math.max(0, (finiteNumber(unit?.defense) + flat) * (1 + percent));
}

export function effectiveSpeed(unit) {
  const flat = statTotal(unit, STAT_TYPES.SPEED_FLAT);
  const percent = Math.max(-1, statTotal(unit, STAT_TYPES.SPEED_PERCENT));
  return Math.max(0, (finiteNumber(unit?.speed) + flat) * (1 + percent));
}

export function effectiveMaxHp(unit) {
  const percent = Math.max(-1, statTotal(unit, STAT_TYPES.MAX_HP_PERCENT));
  return Math.max(1, finiteNumber(unit?.maxHp, 1) * (1 + percent));
}

export function effectiveCritChance(attacker, defender = null, actionType = null) {
  const resistance = defender
    ? statTotal(defender, STAT_TYPES.ANTI_CRIT)
      + statTotal(defender, STAT_TYPES.CRIT_RESIST)
      + statTotal(defender, STAT_TYPES.CRIT_RESISTANCE)
    : 0;
  const chance = finiteNumber(attacker?.critChance) + statTotal(attacker, STAT_TYPES.CRIT_RATE, actionType) - resistance;
  return Math.max(0, Math.min(1, chance));
}

export function effectiveCritMultiplier(attacker, defender = null) {
  const reduction = defender ? statTotal(defender, STAT_TYPES.CRIT_DAMAGE_REDUCTION) : 0;
  return Math.max(1, 1.5 + statTotal(attacker, STAT_TYPES.CRIT_DAMAGE) - reduction);
}

export function effectiveDamageBonus(unit, actionType = null) {
  return Math.max(MIN_EFFECT_BONUS, statTotal(unit, STAT_TYPES.DAMAGE_BONUS, actionType));
}

export function effectiveDamageReduction(unit) {
  return Math.max(-0.9, Math.min(0.9, statTotal(unit, STAT_TYPES.DAMAGE_REDUCTION)));
}

export function effectiveIgnoreDefense(unit) {
  return Math.max(0, Math.min(1, statTotal(unit, STAT_TYPES.IGNORE_DEFENSE)));
}

export function effectiveHealBonus(unit) {
  return Math.max(MIN_EFFECT_BONUS, statTotal(unit, STAT_TYPES.HEAL_BONUS));
}

export function effectiveShieldBonus(unit) {
  return Math.max(MIN_EFFECT_BONUS, statTotal(unit, STAT_TYPES.SHIELD_BONUS));
}

export function effectiveEnergyBonus(unit) {
  return Math.max(MIN_EFFECT_BONUS, statTotal(unit, STAT_TYPES.ENERGY_BONUS));
}

/** Return the current battle round without turning unknown state into round 0. */
export function currentRound(state) {
  const round = Number(state?.round);
  return Number.isFinite(round) && round >= 0 ? Math.floor(round) : null;
}

/** Whether a status/modifier was applied in the current round. */
export function appliedThisRound(entry, state) {
  const round = currentRound(state);
  return round !== null && entry?.appliedRound === round;
}

function normalizeDuration(effect) {
  const raw = effect.duration;
  if (raw && typeof raw === 'object') {
    const rounds = Math.max(0, Number(raw.rounds ?? 0) || 0);
    return {
      durationType: raw.durationType || (rounds > 0 ? 'timed' : 'permanent'),
      remainingRounds: rounds,
      remainingTriggers: Math.max(1, Number(raw.triggers ?? 1) || 1),
      conditionKey: raw.conditionKey ?? effect.conditionKey ?? null,
      trigger: raw.trigger ?? effect.trigger ?? null
    };
  }
  const rounds = Math.max(0, Number(raw ?? effect.rounds ?? 0) || 0);
  return {
    durationType: rounds > 0 ? 'timed' : 'permanent',
    remainingRounds: rounds,
    remainingTriggers: Math.max(1, Number(effect.triggers ?? 1) || 1),
    conditionKey: effect.conditionKey ?? null,
    trigger: effect.trigger ?? null
  };
}

export function recordActionDamage(actor, target, oldHp, newHp, absorbed, state) {
  const hpDamage = Math.max(0, oldHp - newHp);
  actor.damageDealt = (actor.damageDealt || 0) + hpDamage;
  target.damageTaken = (target.damageTaken || 0) + hpDamage;
  const totals = state?.actionContext?.damage;
  if (totals instanceof Map && (!state.actionContext.phase || state.actionContext.phase === 'action')) {
    const previous = totals.get(actor.id) ?? { hpDamage: 0, absorbed: 0 };
    totals.set(actor.id, { hpDamage: previous.hpDamage + hpDamage, absorbed: previous.absorbed + absorbed });
  }
  return hpDamage;
}

export function consumeTriggerCount(target, trigger, snapshot = null) {
  const consumed = [];
  for (const collection of [target.buffs || [], target.debuffs || []]) {
    for (let index = collection.length - 1; index >= 0; index--) {
      const status = collection[index];
      if (status.durationType !== 'trigger-count') continue;
      if (status.trigger ? status.trigger !== trigger : trigger !== 'damage-taken') continue;
      if (snapshot && (!snapshot.has(status) || snapshot.get(status) !== status.applicationId)) continue;
      status.remainingTriggers = Math.max(0, Number(status.remainingTriggers ?? 1) - 1);
      consumed.push(status.id || status.statType || status.type);
      if (status.remainingTriggers === 0) collection.splice(index, 1);
    }
  }
  return consumed;
}

export class EffectExecutor {
  constructor(state) {
    this.state = state;
  }

  /**
   * Execute an effect on a target
   * @param {Object} effect - Effect definition
   * @param {Object} actor - The unit applying the effect
   * @param {Object} target - The target unit
   * @returns {Object} Result event
   */
  executeEffect(effect, actor, target) {
    switch (effect.type) {
      case 'damage':
        return this.executeDamage(effect, actor, target);
      case 'heal':
        return this.executeHeal(effect, actor, target);
      case 'shield':
        return this.executeShield(effect, actor, target);
      case 'stat-modifier':
        return this.executeStatModifier(effect, actor, target);
      case 'energy':
        return this.executeEnergy(effect, actor, target);
      case 'status':
        return this.executeStatus(effect, actor, target);
      case 'dispel':
        return this.executeDispel(effect, actor, target);
      default:
        throw new Error(`Unknown effect type: ${effect.type}`);
    }
  }

  /**
   * Execute damage effect
   */
  executeDamage(effect, actor, target) {
    if (!target.alive) return null;

    // Calculate base damage
    let baseDamage = effect.magnitude || 0;
    if (effect.damageType === 'percent-max-hp') {
      baseDamage = effectiveMaxHp(target) * (effect.magnitude || 0);
    } else if (effect.damageType === 'percent-current-hp') {
      baseDamage = (target.hp || 0) * (effect.magnitude || 0);
    } else if (effect.multiplier) {
      baseDamage = effectiveAttack(actor) * effect.multiplier;
    }

    // Apply conditional bonus
    if (effect.conditionalDamage) {
      baseDamage += effect.conditionalDamage(actor, target, this.state);
    }

    // Apply variance (default 0.92-1.08)
    const variance = effect.variance !== undefined ? effect.variance : (0.92 + this.random() * 0.16);
    baseDamage *= variance;

    // Check crit
    const isTrueDamage = effect.damageType === DAMAGE_TYPES.TRUE;
    const canCrit = effect.canCrit !== false && !isTrueDamage;
    const critChance = effectiveCritChance(actor, target, this.state.actionContext?.actionType);
    const isCrit = canCrit && this.random() < critChance;
    const critMultiplier = isCrit ? (effect.critMultiplier || effectiveCritMultiplier(actor, target)) : 1.0;

    // Calculate defense reduction
    let defense = effectiveDefense(target);
    const ignoreDefense = Math.max(0, Math.min(1,
      finiteNumber(effect.ignoreDefense) + effectiveIgnoreDefense(actor)
    ));
    defense *= (1 - ignoreDefense);
    const isPercentHp = effect.damageType === 'percent-max-hp' || effect.damageType === 'percent-current-hp';
    const defenseReduction = isPercentHp || isTrueDamage ? 0 : defense * 0.45;
    let finalDamage = Math.max(1, Math.floor(
      (baseDamage - defenseReduction)
      * (1 + effectiveDamageBonus(actor, this.state.actionContext?.actionType))
      * critMultiplier
    ));
    const damageReduction = effectiveDamageReduction(target);
    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - damageReduction)));

    // Apply to target
    const oldHp = target.hp;
    const absorbed = Math.min(target.shield || 0, finalDamage);
    target.shield = (target.shield || 0) - absorbed;
    target.hp = Math.max(0, target.hp - (finalDamage - absorbed));

    // Check for death
    if (target.hp === 0) {
      target.alive = false;
    }

    const hpDamage = recordActionDamage(actor, target, oldHp, target.hp, absorbed, this.state);
    const consumedDurations = this.consumeTriggerCount(target, 'damage-taken');

    // Grant energy to target on being hit
    target.energy = Math.min(1000, (target.energy || 0) + 80 * (1 + effectiveEnergyBonus(target)));

    return {
      type: 'damage',
      actor: actor.id,
      target: target.id,
      value: finalDamage,
      hpDamage,
      absorbed,
      crit: isCrit,
      oldHp,
      newHp: target.hp,
      oldShield: target.shield + absorbed,
      newShield: target.shield,
      damageReduction,
      consumedDurations,
    };
  }

  /**
   * Execute heal effect
   */
  executeHeal(effect, actor, target) {
    if (!target.alive) return null;

    // Calculate base heal
    let baseHeal = effect.magnitude || 0;
    if (effect.healType === HEAL_TYPES.PERCENT_ATTACK) {
      baseHeal = effectiveAttack(actor) * (effect.multiplier || 1);
    } else if (effect.healType === HEAL_TYPES.PERCENT_MAX_HP) {
      baseHeal = effectiveMaxHp(target) * (effect.multiplier || 1);
    } else if (effect.healType === HEAL_TYPES.PERCENT_MISSING_HP) {
      baseHeal = (target.maxHp - target.hp) * (effect.multiplier || 1);
    } else if (effect.healType === HEAL_TYPES.PERCENT_DAMAGE_DEALT) {
      baseHeal = (this.state.actionContext?.damage?.get(actor.id)?.hpDamage ?? 0) * (effect.multiplier ?? 1);
    }

    // Apply conditional bonus
    if (effect.conditionalHeal) {
      baseHeal += effect.conditionalHeal(actor, target, this.state);
    }

    const healAmount = Math.floor(baseHeal * (1 + effectiveHealBonus(actor)));

    // Apply to target
    const oldHp = target.hp;
    if (!effect.overheal) {
      target.hp = Math.min(target.maxHp, target.hp + healAmount);
    } else {
      target.hp += healAmount;
    }
    const actualHeal = target.hp - oldHp;
    target.healsReceived = (target.healsReceived || 0) + actualHeal;

    return {
      type: 'heal',
      actor: actor.id,
      target: target.id,
      value: healAmount,
      actualHeal,
      oldHp,
      newHp: target.hp,
      overheal: effect.overheal && target.hp > target.maxHp,
    };
  }

  /**
   * Execute shield effect
   */
  executeShield(effect, actor, target) {
    if (!target.alive) return null;

    // Calculate base shield
    let baseShield = effect.magnitude || 0;
    if (effect.shieldType === SHIELD_TYPES.PERCENT_DEFENSE) {
      baseShield = effectiveDefense(actor) * (effect.multiplier || 1);
    } else if (effect.shieldType === SHIELD_TYPES.PERCENT_MAX_HP) {
      baseShield = effectiveMaxHp(target) * (effect.multiplier || 1);
    } else if (effect.shieldType === SHIELD_TYPES.PERCENT_ATTACK) {
      baseShield = effectiveAttack(actor) * (effect.multiplier || 1);
    } else if (effect.shieldType === SHIELD_TYPES.PERCENT_DAMAGE_DEALT) {
      baseShield = (this.state.actionContext?.damage?.get(actor.id)?.hpDamage ?? 0) * (effect.multiplier ?? 1);
    }

    // Apply conditional bonus
    if (effect.conditionalShield) {
      baseShield += effect.conditionalShield(actor, target, this.state);
    }

    const shieldAmount = Math.floor(baseShield * (1 + effectiveShieldBonus(actor)));

    // Apply to target
    const oldShield = target.shield || 0;
    target.shield = oldShield + shieldAmount;

    return {
      type: 'shield',
      actor: actor.id,
      target: target.id,
      value: shieldAmount,
      oldShield,
      newShield: target.shield,
      duration: effect.duration,
    };
  }

  /**
   * Execute stat modifier effect
   */
  executeStatModifier(effect, actor, target) {
    if (!target.alive) return null;

    const duration = normalizeDuration(effect);

    // Create stat modifier object
    const modifier = {
      statType: effect.statType,
      magnitude: effect.magnitude,
      isPercentage: effect.isPercentage || false,
      duration: duration.remainingRounds,
      durationType: duration.durationType,
      remainingRounds: duration.remainingRounds,
      remainingTriggers: duration.remainingTriggers,
      conditionKey: duration.conditionKey,
      trigger: duration.trigger,
      actionType: effect.actionType ?? null,
      applicationId: this.nextApplicationId(),
      maxStacks: effect.maxStacks || 0,
      stacksAdditive: effect.stacksAdditive !== false,
      appliedRound: currentRound(this.state),
      source: actor.id,
      sourceSkill: effect.sourceSkill,
      unique: effect.unique === true,
      refresh: effect.refresh !== false,
    };

    // Apply to target's buffs/debuffs
    if (!target.buffs) target.buffs = [];
    if (!target.debuffs) target.debuffs = [];

    // Determine if it's a buff or debuff based on stat type and magnitude
    const isBuff = this.isStatModifierBuff(effect.statType, effect.magnitude);
    const collection = isBuff ? target.buffs : target.debuffs;

    const existing = collection.find(b => b.statType === effect.statType
      && b.source === actor.id
      && (!effect.sourceSkill || !b.sourceSkill || b.sourceSkill === effect.sourceSkill));

    const requestedStacks = Math.max(1, Math.floor(finiteNumber(effect.stacks, 1)));
    const stackLimit = Math.max(1, Math.floor(finiteNumber(effect.maxStacks, 0)) || requestedStacks);
    const managesExisting = effect.unique === true || effect.maxStacks > 0;
    if (managesExisting) {
      if (existing && effect.refresh !== false) {
        const stacks = effect.maxStacks > 0
          ? Math.min(stackLimit, modifierStacks(existing) + requestedStacks)
          : 1;
        Object.assign(existing, modifier, { stacks });
      } else if (!existing) {
        collection.push({ ...modifier, stacks: Math.min(stackLimit, requestedStacks) });
      }
    } else {
      collection.push({ ...modifier, stacks: requestedStacks });
    }

    return {
      type: 'stat-modifier',
      actor: actor.id,
      target: target.id,
      statType: effect.statType,
      magnitude: effect.magnitude,
      isPercentage: effect.isPercentage,
      duration: effect.duration,
      durationType: duration.durationType,
      unique: effect.unique === true,
      stacks: collection.find(item => item.statType === effect.statType
        && item.source === actor.id
        && (!effect.sourceSkill || !item.sourceSkill || item.sourceSkill === effect.sourceSkill))?.stacks,
      appliedRound: currentRound(this.state),
    };
  }

  /**
   * Execute energy effect
   */
  executeEnergy(effect, actor, target) {
    if (!target.alive) return null;

    const oldEnergy = target.energy || 0;
    let newEnergy = oldEnergy;

    switch (effect.energyType) {
      case ENERGY_TYPES.GAIN:
        newEnergy = Math.min(1000,
          oldEnergy + Math.max(0, finiteNumber(effect.magnitude)) * (1 + effectiveEnergyBonus(target)));
        break;
      case ENERGY_TYPES.LOSS:
        newEnergy = Math.max(0, oldEnergy - effect.magnitude);
        break;
      case ENERGY_TYPES.STEAL:
        // Take from target and give to actor
        const stolen = Math.min(oldEnergy, effect.magnitude);
        newEnergy = oldEnergy - stolen;
        actor.energy = Math.min(1000, (actor.energy || 0) + stolen);
        break;
      case ENERGY_TYPES.SET:
        newEnergy = effect.magnitude;
        break;
    }

    target.energy = newEnergy;

    return {
      type: 'energy',
      actor: actor.id,
      target: target.id,
      energyType: effect.energyType,
      magnitude: effect.magnitude,
      oldEnergy,
      newEnergy,
      actorEnergy: actor.energy || 0,
    };
  }

  /**
   * Execute status effect (buff/debuff)
   */
  executeStatus(effect, actor, target) {
    if (!target.alive) return null;

    const duration = normalizeDuration(effect);

    // Create status object
    const status = {
      id: this.nextStatusId(effect, actor),
      type: effect.statusType,
      source: actor.id,
      sourceSkill: effect.sourceSkill,
      stacks: 1,
      maxStacks: effect.maxStacks || 0,
      duration: duration.remainingRounds,
      durationType: duration.durationType,
      remainingRounds: duration.remainingRounds,
      remainingTriggers: duration.remainingTriggers,
      conditionKey: duration.conditionKey,
      trigger: duration.trigger,
      applicationId: this.nextApplicationId(),
      tickInterval: effect.tickInterval || 0,
      tickEffect: effect.tickEffect || null,
      nextTick: 0,
      dispellable: effect.dispellable !== false,
      unique: effect.unique || false,
      refresh: effect.refresh !== false,
      stacksAdditive: effect.stacksAdditive !== false,
      appliedRound: currentRound(this.state),
      data: effect.data || {},
    };

    // Apply to target
    if (!target.buffs) target.buffs = [];
    if (!target.debuffs) target.debuffs = [];

    const isBuff = this.isStatusBuff(effect.statusType);
    const collection = isBuff ? target.buffs : target.debuffs;

    const existingIndex = collection.findIndex(item => item.type === effect.statusType
      && item.source === actor.id
      && (!effect.sourceSkill || !item.sourceSkill || item.sourceSkill === effect.sourceSkill));
    const requestedStacks = Math.max(1, Math.floor(finiteNumber(effect.stacks, 1)));
    const stackLimit = Math.max(1, Math.floor(finiteNumber(effect.maxStacks, 0)) || requestedStacks);
    const managesExisting = effect.unique || effect.maxStacks > 0;
    if (managesExisting && existingIndex >= 0) {
      const existing = collection[existingIndex];
      if (effect.refresh !== false) {
        const stacks = effect.maxStacks > 0
          ? Math.min(stackLimit, modifierStacks(existing) + requestedStacks)
          : 1;
        Object.assign(existing, status, { id: existing.id, stacks });
      }
    } else if (managesExisting) {
      collection.push({ ...status, stacks: Math.min(stackLimit, requestedStacks) });
    } else {
      collection.push({ ...status, stacks: requestedStacks });
    }

    return {
      type: 'status',
      actor: actor.id,
      target: target.id,
      statusType: effect.statusType,
      duration: effect.duration,
      unique: effect.unique,
      stacks: managesExisting && existingIndex >= 0
        ? collection[existingIndex].stacks
        : Math.min(stackLimit, requestedStacks),
      appliedRound: currentRound(this.state),
    };
  }

  nextStatusId(effect, actor) {
    if (!this.state) this.state = {};
    this.state.nextStatusId = (Number(this.state.nextStatusId) || 0) + 1;
    return `${effect.statusType}_${actor.id}_${this.state.nextStatusId}`;
  }

  consumeTriggerCount(target, trigger) {
    return consumeTriggerCount(target, trigger);
  }

  nextApplicationId() {
    this.state.nextEffectApplicationId = (this.state.nextEffectApplicationId || 0) + 1;
    return this.state.nextEffectApplicationId;
  }

  /**
   * Execute dispel effect - remove buffs (dispel) or debuffs (cleanse) from target
   */
  executeDispel(effect, actor, target) {
    if (!target.alive) return null;
    const count = effect.count || 1;
    const removeType = effect.removeType || 'buff'; // 'buff' removes enemy buffs, 'debuff' removes ally debuffs
    const isBuff = removeType === 'buff';
    const collection = isBuff ? (target.buffs || []) : (target.debuffs || []);
    const removed = [];
    // Remove up to count dispellable entries
    let removedCount = 0;
    for (let i = collection.length - 1; i >= 0 && removedCount < count; i--) {
      const status = collection[i];
      if (status.dispellable !== false) {
        removed.push(status);
        collection.splice(i, 1);
        removedCount++;
      }
    }
    return {
      type: 'dispel',
      actor: actor.id,
      target: target.id,
      removed: removed.map(s => s.type || s.id),
      count: removed.length,
      removeType,
    };
  }

  /**
   * Helper: determine if stat modifier is a buff
   */
  isStatModifierBuff(statType, magnitude) {
    if (!BUFF_STAT_TYPES.has(statType)) return false;
    return magnitude >= 0;
  }

  /**
   * Helper: determine if status is a buff
   */
  isStatusBuff(statusType) {
    return BUFF_STATUS_TYPES.has(statusType);
  }

  /**
   * Get random number (0-1)
   */
  random() {
    if (this.state.random) {
      return this.state.random();
    }
    // Fallback to simple random
    this.state.seed = (this.state.seed || 1) * 1103515245 + 12345 & 0x7fffffff;
    return (this.state.seed & 0xffff) / 0x10000;
  }
}
