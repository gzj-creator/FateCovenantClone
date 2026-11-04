import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1030501;

test('hero 1030501 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 灾祸双子');
});

test('不屈 (313050171) registers on-round-start damage-reduction trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313050171');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
  assert.equal(trig.oncePerBattle, true);
});

test('健壮 (313050172) registers max-hp-percent stat modifier', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313050172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('泰然自若 (313050173) registers crit-resist and crit-damage-reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313050173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-resist'));
  assert.ok(statTypes.includes('crit-damage-reduction'));
});

test('影佑誓言 (313050174) registers 30% chance self shield 5% max HP on attack/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313050174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'));
  assert.ok(types.includes('on-skill-use'));
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
  assert.equal(trig.chance, 0.3);
});
test('重重诡影 (313050175) registers shield-synergy damage-reduction with has-shield condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313050175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'has-shield');
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.08);
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

test('自保 (120000046) registers has-debuff condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000046');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'has-debuff');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.10);
});

test('蛰伏 (120000051) registers hp-below-50 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000051');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-50');
  assert.equal(trig.oncePerBattle, true);
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

test('祝福 (120000059) registers one battle-window heal bonus', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.oncePerBattle, true);
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

test('rare shield skill (6103030103) registers on-being-hit shield to all allies 10% max HP with round3Double', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6103030103');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-being-hit');
  assert.ok(trig.effect && trig.effect.effect && trig.effect.effect.type === 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.10);
  assert.equal(trig.effect.target.targetType, 'all-allies');
  assert.equal(trig.effect.duration.durationType, 'timed');
  assert.equal(trig.effect.duration.rounds, 2);
  assert.equal(trig.round3Double, true);
  assert.equal(trig.maxTriggersPerRound, 3);
});

test('6910001007 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001007');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});
test('shield numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 400, maxHp: 1320, attack: 180, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const e1 = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.05 };
  const r1 = executor.executeShield(e1, unit, unit);
  assert.ok(r1.value > 0);
  assert.ok(r1.value < 10000);
  assert.equal(r1.value, 66);
  const e2 = { type: 'shield', shieldType: 'percent-defense', multiplier: 0.8 };
  const r2 = executor.executeShield(e2, unit, unit);
  assert.equal(r2.value, 48);
  const ally = { id: 2, team: 1, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const r3 = executor.executeShield({ type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.10 }, unit, ally);
  assert.equal(r3.value, 100);
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
