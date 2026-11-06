import assert from 'node:assert/strict';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';
import { TARGET_TYPES, DURATION_TYPES } from '../game/effects/effect-types.mjs';

export const TARGETS = new Set(Object.values(TARGET_TYPES));
export const DURATIONS = new Set(Object.values(DURATION_TYPES));

/** Deterministic executor: random() === 0.5 avoids crits and fixes variance. */
export const createExecutor = () => new EffectExecutor({ seed: 7, random: () => 0.5 });

export function skillFinder(skills) {
  return (id) => {
    const skill = skills.find((candidate) => candidate.id === id);
    assert.ok(skill, `missing skill ${id}`);
    return skill;
  };
}

export function makeUnit(over = {}) {
  return {
    id: 1, team: 1, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 50,
    critChance: 0, energy: 0, shield: 0, alive: true, buffs: [], debuffs: [], triggers: [], ...over,
  };
}

export function assertAllSkillsExecutable(skills) {
  for (const skill of skills) {
    const impl = skill.implementation;
    assert.ok(impl && impl.effectType, `${skill.id} missing effectType`);
    assert.ok(Array.isArray(impl.effects) && impl.effects.length > 0, `${skill.id} missing effects`);
    impl.effects.forEach((wrapper, index) => {
      if (index === 0) {
        assert.equal(wrapper.effect.type, impl.effectType, `${skill.id} effectType must match the primary effect`);
      }
      assert.ok(TARGETS.has(wrapper.target.targetType), `${skill.id} invalid target ${wrapper.target.targetType}`);
      assert.ok(DURATIONS.has(wrapper.duration.durationType), `${skill.id} invalid duration`);
    });
    for (const trigger of impl.triggers || []) {
      assert.ok(trigger.effect && trigger.effect.effect && trigger.effect.effect.type, `${skill.id} trigger without effect`);
      assert.ok(TARGETS.has(trigger.effect.target.targetType), `${skill.id} trigger invalid target`);
    }
  }
}

export function effectOf(skill, index = 0) {
  const wrapper = skill.implementation.effects[index];
  assert.ok(wrapper, `${skill.id} has no effect at index ${index}`);
  return wrapper.effect;
}

