/**
 * Effect executor - applies effects to battle state
 */

import { DAMAGE_TYPES, HEAL_TYPES, SHIELD_TYPES, STAT_TYPES, ENERGY_TYPES, STATUS_TYPES } from './effect-types.mjs';

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
    if (effect.multiplier) {
      baseDamage = actor.attack * effect.multiplier;
    }

    // Apply conditional bonus
    if (effect.conditionalDamage) {
      baseDamage += effect.conditionalDamage(actor, target, this.state);
    }

    // Apply variance (default 0.92-1.08)
    const variance = effect.variance !== undefined ? effect.variance : (0.92 + this.random() * 0.16);
    baseDamage *= variance;

    // Check crit
    const canCrit = effect.canCrit !== false;
    const critChance = actor.critChance + (actor.buffs?.critRate || 0);
    const isCrit = canCrit && this.random() < critChance;
    const critMultiplier = isCrit ? (effect.critMultiplier || 1.5) : 1.0;

    // Calculate defense reduction
    let defense = target.defense || 0;
    if (effect.ignoreDefense) {
      defense *= (1 - effect.ignoreDefense);
    }

    // Final damage calculation
    const defenseReduction = defense * 0.45;
    const finalDamage = Math.max(1, Math.floor((baseDamage - defenseReduction) * critMultiplier));

    // Apply to target
    const oldHp = target.hp;
    const absorbed = Math.min(target.shield || 0, finalDamage);
    target.shield = (target.shield || 0) - absorbed;
    target.hp = Math.max(0, target.hp - (finalDamage - absorbed));

    // Check for death
    if (target.hp === 0) {
      target.alive = false;
    }

    // Grant energy to target on being hit
    target.energy = Math.min(1000, (target.energy || 0) + 80);

    return {
      type: 'damage',
      actor: actor.id,
      target: target.id,
      value: finalDamage,
      absorbed,
      crit: isCrit,
      oldHp,
      newHp: target.hp,
      oldShield: target.shield + absorbed,
      newShield: target.shield,
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
      baseHeal = actor.attack * (effect.multiplier || 1);
    } else if (effect.healType === HEAL_TYPES.PERCENT_MAX_HP) {
      baseHeal = target.maxHp * (effect.multiplier || 1);
    } else if (effect.healType === HEAL_TYPES.PERCENT_MISSING_HP) {
      baseHeal = (target.maxHp - target.hp) * (effect.multiplier || 1);
    }

    // Apply conditional bonus
    if (effect.conditionalHeal) {
      baseHeal += effect.conditionalHeal(actor, target, this.state);
    }

    const healAmount = Math.floor(baseHeal);

    // Apply to target
    const oldHp = target.hp;
    if (!effect.overheal) {
      target.hp = Math.min(target.maxHp, target.hp + healAmount);
    } else {
      target.hp += healAmount;
    }

    return {
      type: 'heal',
      actor: actor.id,
      target: target.id,
      value: healAmount,
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
      baseShield = actor.defense * (effect.multiplier || 1);
    } else if (effect.shieldType === SHIELD_TYPES.PERCENT_MAX_HP) {
      baseShield = target.maxHp * (effect.multiplier || 1);
    } else if (effect.shieldType === SHIELD_TYPES.PERCENT_ATTACK) {
      baseShield = actor.attack * (effect.multiplier || 1);
    }

    // Apply conditional bonus
    if (effect.conditionalShield) {
      baseShield += effect.conditionalShield(actor, target, this.state);
    }

    const shieldAmount = Math.floor(baseShield);

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

    // Create stat modifier object
    const modifier = {
      statType: effect.statType,
      magnitude: effect.magnitude,
      isPercentage: effect.isPercentage || false,
      duration: effect.duration || 0,
      maxStacks: effect.maxStacks || 0,
      stacksAdditive: effect.stacksAdditive !== false,
      source: actor.id,
      sourceSkill: effect.sourceSkill,
    };

    // Apply to target's buffs/debuffs
    if (!target.buffs) target.buffs = [];
    if (!target.debuffs) target.debuffs = [];

    // Determine if it's a buff or debuff based on stat type and magnitude
    const isBuff = this.isStatModifierBuff(effect.statType, effect.magnitude);
    const collection = isBuff ? target.buffs : target.debuffs;

    // Check for stacking
    if (effect.maxStacks > 0) {
      const existing = collection.find(b => b.statType === effect.statType && b.source === actor.id);
      if (existing) {
        if (existing.stacks < effect.maxStacks) {
          existing.stacks++;
          existing.duration = effect.duration; // Refresh duration
        }
      } else {
        collection.push({ ...modifier, stacks: 1 });
      }
    } else {
      collection.push({ ...modifier, stacks: 1 });
    }

    return {
      type: 'stat-modifier',
      actor: actor.id,
      target: target.id,
      statType: effect.statType,
      magnitude: effect.magnitude,
      isPercentage: effect.isPercentage,
      duration: effect.duration,
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
        newEnergy = Math.min(1000, oldEnergy + effect.magnitude);
        break;
      case ENERGY_TYPES.LOSS:
        newEnergy = Math.max(0, oldEnergy - effect.magnitude);
        break;
      case ENERGY_TYPES.STEAL:
        // Take from target and give to actor
        const stolen = Math.min(oldEnergy, effect.magnitude);
        target.energy = oldEnergy - stolen;
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
    };
  }

  /**
   * Execute status effect (buff/debuff)
   */
  executeStatus(effect, actor, target) {
    if (!target.alive) return null;

    // Create status object
    const status = {
      id: `${effect.statusType}_${actor.id}_${Date.now()}`,
      type: effect.statusType,
      source: actor.id,
      sourceSkill: effect.sourceSkill,
      stacks: 1,
      maxStacks: effect.maxStacks || 0,
      duration: effect.duration || 0,
      tickInterval: effect.tickInterval || 0,
      nextTick: 0,
      dispellable: effect.dispellable !== false,
      unique: effect.unique || false,
      data: effect.data || {},
    };

    // Apply to target
    if (!target.buffs) target.buffs = [];
    if (!target.debuffs) target.debuffs = [];

    const isBuff = this.isStatusBuff(effect.statusType);
    const collection = isBuff ? target.buffs : target.debuffs;

    // Check for unique status
    if (effect.unique) {
      const existingIndex = collection.findIndex(s => s.type === effect.statusType);
      if (existingIndex >= 0) {
        // Replace existing
        collection[existingIndex] = status;
      } else {
        collection.push(status);
      }
    } else {
      collection.push(status);
    }

    return {
      type: 'status',
      actor: actor.id,
      target: target.id,
      statusType: effect.statusType,
      duration: effect.duration,
      unique: effect.unique,
    };
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
    // Positive values are generally buffs, negative are debuffs
    // But some stats are inverse (e.g., damage reduction)
    const buffStats = [
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
      STAT_TYPES.HEAL_BONUS,
      STAT_TYPES.SHIELD_BONUS,
      STAT_TYPES.ENERGY_BONUS,
    ];

    if (!buffStats.includes(statType)) return false;
    return magnitude >= 0;
  }

  /**
   * Helper: determine if status is a buff
   */
  isStatusBuff(statusType) {
    const buffStatuses = [
      STATUS_TYPES.PROTECTION,
      STATUS_TYPES.INVULNERABLE,
      STATUS_TYPES.STRENGTHENED,
      STATUS_TYPES.HASTED,
      STATUS_TYPES.ENERGIZED,
    ];

    return buffStatuses.includes(statusType);
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
