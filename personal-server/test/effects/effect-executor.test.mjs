/**
 * Unit tests for effect executor
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EffectExecutor } from '../../game/effects/effect-executor.mjs';
import { DAMAGE_TYPES, HEAL_TYPES, SHIELD_TYPES, STAT_TYPES, ENERGY_TYPES, STATUS_TYPES } from '../../game/effects/effect-types.mjs';

describe('EffectExecutor', () => {
  describe('executeDamage', () => {
    it('should calculate physical damage with defense reduction', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100, critChance: 0.1 };
      const target = { id: 2, hp: 100, maxHp: 100, defense: 20, shield: 0, alive: true };

      const effect = {
        type: 'damage',
        damageType: DAMAGE_TYPES.PHYSICAL,
        multiplier: 2.0,
        variance: 1.0, // No variance for consistent test
        canCrit: false,
      };

      const result = executor.executeDamage(effect, actor, target);

      assert.strictEqual(result.type, 'damage');
      assert.strictEqual(result.actor, 1);
      assert.strictEqual(result.target, 2);
      // Expected: 200 * 100 / (100 + 20 * 0.45) = 183.49 -> 183
      assert.strictEqual(result.value, 183);
      assert.strictEqual(result.crit, false);
    });

    it('should apply shield absorption', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100, critChance: 0.1 };
      const target = { id: 2, hp: 100, maxHp: 100, defense: 20, shield: 50, alive: true };

      const effect = {
        type: 'damage',
        damageType: DAMAGE_TYPES.PHYSICAL,
        multiplier: 2.0,
        variance: 1.0,
        canCrit: false,
      };

      const result = executor.executeDamage(effect, actor, target);

      assert.strictEqual(result.absorbed, 50);
      assert.strictEqual(result.newShield, 0);
      assert.strictEqual(result.newHp, 0); // 183 damage, 50 shield points, then a lethal HP hit.
    });

    it('should calculate crit damage', () => {
      const executor = new EffectExecutor({ seed: 1, random: () => 0.01 }); // Force crit
      const actor = { id: 1, attack: 100, critChance: 0.5 };
      const target = { id: 2, hp: 100, maxHp: 100, defense: 20, shield: 0, alive: true };

      const effect = {
        type: 'damage',
        damageType: DAMAGE_TYPES.PHYSICAL,
        multiplier: 2.0,
        variance: 1.0,
        canCrit: true,
        critMultiplier: 1.5,
      };

      const result = executor.executeDamage(effect, actor, target);

      assert.strictEqual(result.crit, true);
      // Expected: 183.49 * 1.5 = 275.23 -> 275
      assert.strictEqual(result.value, 275);
    });

    it('keeps high-defense hits above the final 1-point clamp', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100, critChance: 0 };
      const target = { id: 2, hp: 1000, maxHp: 1000, defense: 1000, shield: 0, alive: true };
      const result = executor.executeDamage({
        type: 'damage',
        damageType: DAMAGE_TYPES.PHYSICAL,
        multiplier: 1,
        variance: 1,
        canCrit: false,
      }, actor, target);
      assert.equal(result.value, 18, '100 / (100 + 1000 * 0.45) remains 18 damage');
    });

    it('should not damage dead targets', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100, critChance: 0.1 };
      const target = { id: 2, hp: 0, maxHp: 100, defense: 20, shield: 0, alive: false };

      const effect = {
        type: 'damage',
        damageType: DAMAGE_TYPES.PHYSICAL,
        multiplier: 2.0,
        variance: 1.0,
        canCrit: false,
      };

      const result = executor.executeDamage(effect, actor, target);

      assert.strictEqual(result, null);
    });
  });

  describe('executeHeal', () => {
    it('should heal by flat amount', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 50, maxHp: 100, alive: true };

      const effect = {
        type: 'heal',
        healType: HEAL_TYPES.FLAT,
        magnitude: 30,
      };

      const result = executor.executeHeal(effect, actor, target);

      assert.strictEqual(result.type, 'heal');
      assert.strictEqual(result.value, 30);
      assert.strictEqual(result.oldHp, 50);
      assert.strictEqual(result.newHp, 80);
    });

    it('should heal by percentage of attack', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 50, maxHp: 100, alive: true };

      const effect = {
        type: 'heal',
        healType: HEAL_TYPES.PERCENT_ATTACK,
        multiplier: 0.5,
      };

      const result = executor.executeHeal(effect, actor, target);

      assert.strictEqual(result.value, 50); // 100 * 0.5
      assert.strictEqual(result.newHp, 100);
    });

    it('should cap heal at max HP', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 90, maxHp: 100, alive: true };

      const effect = {
        type: 'heal',
        healType: HEAL_TYPES.FLAT,
        magnitude: 30,
        overheal: false,
      };

      const result = executor.executeHeal(effect, actor, target);

      assert.strictEqual(result.value, 30);
      assert.strictEqual(result.newHp, 100);
      assert.strictEqual(result.overheal, false);
    });

    it('should allow overheal when enabled', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 90, maxHp: 100, alive: true };

      const effect = {
        type: 'heal',
        healType: HEAL_TYPES.FLAT,
        magnitude: 30,
        overheal: true,
      };

      const result = executor.executeHeal(effect, actor, target);

      assert.strictEqual(result.value, 30);
      assert.strictEqual(result.newHp, 120);
      assert.strictEqual(result.overheal, true);
    });
  });

  describe('executeShield', () => {
    it('should add flat shield', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 100, maxHp: 100, shield: 0, alive: true };

      const effect = {
        type: 'shield',
        shieldType: SHIELD_TYPES.FLAT,
        magnitude: 50,
      };

      const result = executor.executeShield(effect, actor, target);

      assert.strictEqual(result.type, 'shield');
      assert.strictEqual(result.value, 50);
      assert.strictEqual(result.oldShield, 0);
      assert.strictEqual(result.newShield, 50);
    });

    it('should add shield by percentage of defense', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, defense: 50 };
      const target = { id: 2, hp: 100, maxHp: 100, shield: 0, alive: true };

      const effect = {
        type: 'shield',
        shieldType: SHIELD_TYPES.PERCENT_DEFENSE,
        multiplier: 1.0,
      };

      const result = executor.executeShield(effect, actor, target);

      assert.strictEqual(result.value, 50); // 50 * 1.0
      assert.strictEqual(result.newShield, 50);
    });

    it('should stack with existing shield', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1, attack: 100 };
      const target = { id: 2, hp: 100, maxHp: 100, shield: 30, alive: true };

      const effect = {
        type: 'shield',
        shieldType: SHIELD_TYPES.FLAT,
        magnitude: 50,
      };

      const result = executor.executeShield(effect, actor, target);

      assert.strictEqual(result.oldShield, 30);
      assert.strictEqual(result.newShield, 80);
    });
  });

  describe('executeEnergy', () => {
    it('should gain energy', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, energy: 500, alive: true };

      const effect = {
        type: 'energy',
        energyType: ENERGY_TYPES.GAIN,
        magnitude: 200,
      };

      const result = executor.executeEnergy(effect, actor, target);

      assert.strictEqual(result.type, 'energy');
      assert.strictEqual(result.oldEnergy, 500);
      assert.strictEqual(result.newEnergy, 700);
    });

    it('should cap energy at 1000', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, energy: 900, alive: true };

      const effect = {
        type: 'energy',
        energyType: ENERGY_TYPES.GAIN,
        magnitude: 200,
      };

      const result = executor.executeEnergy(effect, actor, target);

      assert.strictEqual(result.newEnergy, 1000);
    });

    it('should lose energy', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, energy: 500, alive: true };

      const effect = {
        type: 'energy',
        energyType: ENERGY_TYPES.LOSS,
        magnitude: 200,
      };

      const result = executor.executeEnergy(effect, actor, target);

      assert.strictEqual(result.oldEnergy, 500);
      assert.strictEqual(result.newEnergy, 300);
    });

    it('should floor energy at 0', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, energy: 100, alive: true };

      const effect = {
        type: 'energy',
        energyType: ENERGY_TYPES.LOSS,
        magnitude: 200,
      };

      const result = executor.executeEnergy(effect, actor, target);

      assert.strictEqual(result.newEnergy, 0);
    });
  });

  describe('executeStatModifier', () => {
    it('should add stat modifier as buff', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };

      const effect = {
        type: 'stat-modifier',
        statType: STAT_TYPES.ATTACK_PERCENT,
        magnitude: 0.2,
        isPercentage: true,
        duration: 2,
        sourceSkill: 'test-skill',
      };

      const result = executor.executeStatModifier(effect, actor, target);

      assert.strictEqual(result.type, 'stat-modifier');
      assert.strictEqual(target.buffs.length, 1);
      assert.strictEqual(target.buffs[0].statType, STAT_TYPES.ATTACK_PERCENT);
      assert.strictEqual(target.buffs[0].magnitude, 0.2);
    });

    it('should add stat modifier as debuff', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };

      const effect = {
        type: 'stat-modifier',
        statType: STAT_TYPES.ATTACK_PERCENT,
        magnitude: -0.2,
        isPercentage: true,
        duration: 2,
        sourceSkill: 'test-skill',
      };

      const result = executor.executeStatModifier(effect, actor, target);

      assert.strictEqual(target.debuffs.length, 1);
      assert.strictEqual(target.debuffs[0].magnitude, -0.2);
    });
  });

  describe('executeStatus', () => {
    it('should add buff status', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };

      const effect = {
        type: 'status',
        statusType: STATUS_TYPES.STRENGTHENED,
        duration: 2,
        sourceSkill: 'test-skill',
      };

      const result = executor.executeStatus(effect, actor, target);

      assert.strictEqual(result.type, 'status');
      assert.strictEqual(target.buffs.length, 1);
      assert.strictEqual(target.buffs[0].type, STATUS_TYPES.STRENGTHENED);
    });

    it('should add debuff status', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };

      const effect = {
        type: 'status',
        statusType: STATUS_TYPES.WEAKENED,
        duration: 2,
        sourceSkill: 'test-skill',
      };

      const result = executor.executeStatus(effect, actor, target);

      assert.strictEqual(target.debuffs.length, 1);
      assert.strictEqual(target.debuffs[0].type, STATUS_TYPES.WEAKENED);
    });

    it('should replace unique status', () => {
      const executor = new EffectExecutor({ seed: 1 });
      const actor = { id: 1 };
      const target = { id: 2, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };

      // Add first instance
      executor.executeStatus({
        type: 'status',
        statusType: STATUS_TYPES.STRENGTHENED,
        duration: 2,
        unique: true,
        sourceSkill: 'test-skill',
      }, actor, target);

      assert.strictEqual(target.buffs.length, 1);

      // Add second instance (should replace)
      executor.executeStatus({
        type: 'status',
        statusType: STATUS_TYPES.STRENGTHENED,
        duration: 5,
        unique: true,
        sourceSkill: 'test-skill',
      }, actor, target);

      assert.strictEqual(target.buffs.length, 1);
      assert.strictEqual(target.buffs[0].duration, 5);
    });
  });
});
