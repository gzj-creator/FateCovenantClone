import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1040201;

test('hero 1040201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 爱蜜莉');
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

test('迷情掌控 (2104020123) has damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2104020123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('猫诱 (314020171) registers on-round-start triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '314020171');
  assert.ok(skill.implementation.triggers.length >= 2);
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-round-start'));
});

test('舔舐 (314020172) registers ultimate-use, being-hit and round-start triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '314020172');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-ultimate-use'));
  assert.ok(types.includes('on-being-hit'));
  assert.ok(types.includes('on-round-start'));
  const beingHit = skill.implementation.triggers.filter(t => t.triggerType === 'on-being-hit');
  assert.ok(beingHit.every(t => t.maxTriggers === 10));
});

test('魅惑 (314020173) registers on-round-start triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '314020173');
  assert.ok(skill.implementation.triggers.length >= 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-round-start');
    assert.equal(t.effect.effect.type, 'stat-modifier');
  }
});

test('偷心 (314020174) registers on-attack, on-skill-use and on-being-hit triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '314020174');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'));
  assert.ok(types.includes('on-skill-use'));
  assert.ok(types.includes('on-being-hit'));
  const shieldTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-being-hit');
  assert.equal(shieldTrig.maxTriggers, 5);
});

test('迷情 (314020175) registers on-round-start, on-ultimate-use and round-end triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '314020175');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-round-start'));
  assert.ok(types.includes('on-ultimate-use'));
  assert.ok(types.includes('on-round-end'));
  const dmgTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-ultimate-use');
  assert.equal(dmgTrig.effect.effect.type, 'damage');
  assert.equal(dmgTrig.effect.effect.damageType, 'true');
});

test('突破6 (120001028) grants 50 energy', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001028');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 50);
});

test('蛰伏 (120000051) registers hp-below-50 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000051');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-50');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('鼓舞 (120000054) grants 25 energy', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000054');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
});

test('反杀 (120000055) registers target-hp-above-self condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000055');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'target-hp-above-self');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('祝福 (120000059) registers heal-bonus 0.20 for 2 rounds, once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.effect.effect.statType, 'heal-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(trig.effect.duration.durationType, 'timed');
  assert.equal(trig.effect.duration.rounds, 2);
});

test('生命护盾 (120001003) registers hp-below-70 condition with percent-defense shield', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001003');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-70');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-defense');
  assert.equal(trig.effect.effect.multiplier, 0.8);
});

test('防护加持 (120001019) registers on-ultimate-use damage-reduction once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001019');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('6910001063 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001063');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.3, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('shield numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-defense', multiplier: 0.8 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0);
  assert.ok(result.value < 10000);
  assert.equal(result.value, 240);
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 100 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('heal value is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 3000, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 0, shield: 0 };
  const effect = { type: 'heal', healType: 'percent-max-hp', multiplier: 0.05 };
  const result = executor.executeHeal(effect, unit, unit);
  assert.ok(result.value > 0, 'heal value should be > 0');
  assert.ok(result.value < 10000, 'heal value should not be extreme');
});
