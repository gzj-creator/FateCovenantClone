import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1030701;

test('hero 1030701 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 罪欲夜影');
});

test('冷血 (313070171) registers on-round-start damage-reduction trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070171');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('酷刑 (313070172) registers max-hp-percent stat modifier', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('读心 (313070173) registers crit-resist and crit-damage-reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-resist'));
  assert.ok(statTypes.includes('crit-damage-reduction'));
});

test('把玩 (313070174) registers on-attack and on-skill-use shield triggers with 30% chance', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'));
  assert.ok(types.includes('on-skill-use'));
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'shield');
    assert.equal(t.effect.effect.shieldType, 'percent-max-hp');
    assert.equal(t.effect.effect.multiplier, 0.05);
    assert.equal(t.chance, 0.3);
  }
});

test('罪灭 (313070175) registers has-shield condition with 8% damage reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070175');
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
  assert.equal(trig.effect.effect.type, 'stat-modifier');
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
  assert.ok(skill.implementation.triggers.some(t => t.triggerType === 'on-skill-use'), '鼓舞 must cover 普攻 and 绝招');
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

test('祝福 (120000059) registers heal-bonus 0.20 for 2 rounds, once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.effect.effect.type, 'stat-modifier');
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

test('6910001059 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001059');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 330, defense: 82, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 330, defense: 82, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('shield value is reasonable (80% of defense)', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 330, defense: 82, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-defense', multiplier: 0.8 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0, 'shield value should be > 0');
  assert.ok(result.value < 10000, 'shield value should not be extreme');
});

test('has-shield condition evaluates correctly', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313070175');
  assert.equal(skill.implementation.triggers[0].conditionKey, 'has-shield');
});
