import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 4040201;

test('hero 4040201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 命运三姝');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('命运滚石 (344020171) registers on-round-start damage-bonus 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '344020171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.05);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('幸运利剪 (344020172) registers on-round-start attack-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '344020172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('三人成虎 (344020173) registers crit-rate and crit-damage on round start', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '344020173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('crit-damage'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('进化魔方 (344020174) registers on-attack/on-skill-use damage-bonus 0.15 timed 1 round', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '344020174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.statType, 'damage-bonus');
    assert.equal(t.effect.effect.magnitude, 0.15);
    assert.equal(t.effect.duration.rounds, 1);
  }
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('一锤定音 (344020175) registers on-ultimate-use crit-rate and crit-damage', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '344020175');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('crit-damage'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('格挡 (120000014) requiresInvestigation and damage-reduction 0.20', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000014');
  assert.equal(skill.implementation.requiresInvestigation, true);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('命运无章 (2404020123) has damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2404020123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('6910001049 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001049');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-1');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'physical', multiplier: 1.3, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('shield effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.15 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0);
});

test('heal effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'heal', healType: 'percent-attack', multiplier: 0.3, overheal: false };
  const result = executor.executeHeal(effect, actor, target);
  assert.ok(result, 'heal should execute');
});

test('dispel effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: 2, team: 1, loc: 2, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [{ type: 'poison', dispellable: true }], triggers: [], shield: 0 };
  const effect = { type: 'dispel', count: 1, removeType: 'debuff' };
  const result = executor.executeDispel(effect, actor, target);
  assert.ok(result, 'dispel should execute');
  assert.equal(result.type, 'dispel');
});
