import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1030101;

test('hero 1030101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 露奈尔');
});

test('不屈 (313010171) registers an on-round-start damage-reduction trigger', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1320, maxHp: 1320, attack: 180, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '313010171');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.ok(trig.effect && trig.effect.effect && trig.effect.effect.type === 'stat-modifier', 'effect should be stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (313010172) registers max-hp-percent stat modifier', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313010172');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('泰然自若 (313010173) registers crit-resist and crit-damage-reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313010173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-resist'), 'should include crit-resist');
  assert.ok(statTypes.includes('crit-damage-reduction'), 'should include crit-damage-reduction');
});

test('盘石之固 (313010174) registers on-attack and on-skill-use triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313010174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'), 'should include on-attack');
  assert.ok(types.includes('on-skill-use'), 'should include on-skill-use');
});

test('赤红攻势 (313010175) has damage-reduction with maxTriggers 3 and round-3 heal', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313010175');
  assert.equal(skill.implementation.triggers.length, 2);
  const first = skill.implementation.triggers[0];
  assert.equal(first.maxTriggers, 3);
  assert.equal(first.effect.effect.type, 'stat-modifier');
  assert.equal(first.effect.effect.statType, 'damage-reduction');
  assert.equal(first.effect.effect.magnitude, 0.08);
  const second = skill.implementation.triggers[1];
  assert.equal(second.triggerType, 'on-round-end');
  assert.equal(second.conditionKey, 'round-3');
  assert.equal(second.effect.effect.type, 'heal');
  assert.equal(second.effect.effect.healType, 'percent-max-hp');
  assert.equal(second.effect.effect.multiplier, 0.05);
});

test('突破5 (120001027) grants 150 energy when hit', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001027');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 150);
});

test('蛰伏 (120000051) registers hp-below-50 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000051');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-50');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
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
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('祝福 (120000059) registers heal-bonus with maxTriggers 2', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.maxTriggers, 2);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'heal-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.20);
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

test('防护加持 (120001019) registers on-ultimate-use damage-reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001019');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('rare shield skill (6103010109) registers on-round-end shield to all allies 5% max HP', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6103010109');
  assert.ok(skill.implementation.triggers.length > 0, 'should have triggers');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-end');
  assert.ok(trig.effect && trig.effect.effect && trig.effect.effect.type === 'shield', 'effect should be shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
  assert.equal(trig.effect.target.targetType, 'all-allies');
  assert.equal(trig.effect.duration.durationType, 'timed');
  assert.equal(trig.effect.duration.rounds, 1);
  assert.equal(trig.polarNightDouble, true);
});

test('rare shield value is reasonable (5% of max HP)', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const ally = { id: 2, team: 1, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const lunaer = { id: HERO_ID, team: 1, loc: 2, hp: 1320, maxHp: 1320, attack: 180, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.05 };
  const result = executor.executeShield(effect, lunaer, ally);
  assert.ok(result.value > 0, 'shield value should be > 0');
  assert.ok(result.value < 10000, 'shield value should not be extreme');
  assert.equal(result.value, 50);
});

test('6910001003 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001003');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1320, maxHp: 1320, attack: 180, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1320, maxHp: 1320, attack: 180, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});
