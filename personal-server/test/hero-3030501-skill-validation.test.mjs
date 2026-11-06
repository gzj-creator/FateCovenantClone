import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 3030501;

test('hero 3030501 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 16, 'expected 16 skills for 蜜雪儿');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('重击 (333050171) registers on-round-start damage-bonus 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '333050171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('无畏 (333050172) registers attack-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '333050172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('弱点洞悉 (333050173) registers ignore-defense and hit-rate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '333050173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('ignore-defense'));
  assert.ok(statTypes.includes('hit-rate'));
});

test('切骨之寒 (333050174) registers on-attack/on-skill-use damage-reduction -0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '333050174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.statType, 'damage-reduction');
    assert.equal(t.effect.effect.magnitude, -0.05);
  }
});

test('嘎嘣脆 (333050175) registers on-attack crit-damage 0.20 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '333050175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-attack');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('突破4 (120001026) grants 600 energy once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001026');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 600);
});

test('勃发 (120000006) registers hp-above-50 condition crit-damage 0.20', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000006');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('锋刃 (120000019) registers damage-bonus 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000019');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('戒备 (120000025) registers crit-resistance 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000025');
  assert.ok(skill.implementation.triggers.length > 0);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-resistance'));
});

test('鹰眼 (120000028) registers hp-above-50 condition hit-rate 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000028');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'hit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('亢奋 (120000037) grants 100 energy on kill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000037');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 100);
});

test('奋力一击 (120001008) registers on-ultimate-use damage-bonus 0.30 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001008');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.30);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('6401030108 rare ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6401030108');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('6910000104 metadata ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910000104');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('6910001032 metadata ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001032');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-2');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});
