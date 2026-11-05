import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 5040401;

test('hero 5040401 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 零');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('湮灭力场 (2504040123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2504040123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('本源感知 (354040171) registers heal/energy/dispel triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354040171');
  assert.equal(skill.implementation.triggers.length, 3);
  const types = skill.implementation.triggers.map(t => t.effect.effect.type).sort();
  assert.ok(types.includes('heal'));
  assert.ok(types.includes('energy'));
  assert.ok(types.includes('dispel'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('潜能蕴养 (354040172) registers shield and energy loss triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354040172');
  assert.equal(skill.implementation.triggers.length, 2);
  const shieldTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'shield');
  assert.ok(shieldTrig);
  assert.equal(shieldTrig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(shieldTrig.effect.effect.multiplier, 0.35);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig);
  assert.equal(energyTrig.effect.effect.energyType, 'loss');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('核心突破 (354040173) registers protection and dispel triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354040173');
  assert.equal(skill.implementation.triggers.length, 2);
  const protTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'status');
  assert.ok(protTrig);
  assert.equal(protTrig.effect.effect.statusType, 'protection');
  const dispelTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'dispel');
  assert.ok(dispelTrig);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('极意自现 (354040174) registers energy gain and heal triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354040174');
  assert.equal(skill.implementation.triggers.length, 3);
  const energyTrigs = skill.implementation.triggers.filter(t => t.effect.effect.type === 'energy');
  assert.equal(energyTrigs.length, 2);
  const healTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'heal');
  assert.ok(healTrig);
  assert.equal(healTrig.triggerType, 'on-round-end');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('真我超越 (354040175) registers energy gain and dispel triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354040175');
  assert.equal(skill.implementation.triggers.length, 2);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig);
  assert.equal(energyTrig.effect.effect.energyType, 'gain');
  assert.equal(energyTrig.effect.effect.magnitude, 1000);
  const dispelTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'dispel');
  assert.ok(dispelTrig);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('突破6 (120001028) grants 50 energy on attack/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001028');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'energy');
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 50);
  }
});

test('镇定 (120000031) registers damage-reduction trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000031');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.10);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('急救 (120000036) registers heal-bonus trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000036');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'heal-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.15);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('激怒 (120000039) grants 75 energy on being hit', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000039');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 75);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('抵抗 (120000040) registers damage-reduction trigger with hp-below-70 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000040');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-70');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('坚毅 (120000045) registers damage-reduction trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000045');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.35);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('生命护盾 (120001003) registers shield on hp threshold', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001003');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-defense');
  assert.equal(trig.effect.effect.multiplier, 0.8);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-3');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.3, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.10, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('shield effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.35 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0);
});

test('heal effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'heal', healType: 'percent-max-hp', multiplier: 1.0, overheal: false };
  const result = executor.executeHeal(effect, actor, target);
  assert.ok(result, 'heal should execute');
});
