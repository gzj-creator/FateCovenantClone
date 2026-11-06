import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 2030201;

test('hero 2030201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 龙之澜');
  assert.deepEqual(skills.map(skill => skill.id), [
    'normal-profession-2',
    '323020171',
    '323020172',
    '323020173',
    '323020174',
    '323020175',
    '120001026',
    '120000018',
    '120000019',
    '120000023',
    '120000025',
    '120000028',
    '120001009',
    '6203020109',
    '6910001017',
  ]);
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

test('重击 (323020171) registers on-round-start damage-bonus 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '323020171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('无畏 (323020172) registers attack-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '323020172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('弱点洞悉 (323020173) registers ignore-defense 0.05 and hit-rate 0.10', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '323020173');
  assert.equal(skill.implementation.effects.length, 2);
  assert.equal(skill.implementation.triggers.length, 2);
  const ignoreDefense = skill.implementation.effects.find(e => e.effect.statType === 'ignore-defense');
  assert.equal(ignoreDefense.effect.type, 'stat-modifier');
  assert.equal(ignoreDefense.effect.magnitude, 0.05);
  const hitRate = skill.implementation.effects.find(e => e.effect.statType === 'hit-rate');
  assert.equal(hitRate.effect.type, 'stat-modifier');
  assert.equal(hitRate.effect.magnitude, 0.1);
});

test('鼓舞人心 (323020174) registers on-attack/on-skill-use energy gain 100 (chance 0.30)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '323020174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'energy');
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 100);
    assert.equal(t.chance, 0.3);
  }
});

test('滔天巨浪 (323020175) registers on-ultimate-use damage-reduction -0.05 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '323020175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, -0.05);
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

test('破盾 (120000018) registers damage-bonus 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000018');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('锋刃 (120000019) registers damage-bonus 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000019');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('激怒 (120000023) grants 100 energy on attack/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000023');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'energy');
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 100);
  }
});

test('戒备 (120000025) registers crit-resistance 0.30 while buffed', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000025');
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(skill.implementation.effects.length, 1);
  assert.equal(skill.implementation.effects[0].effect.statType, 'crit-resistance');
  assert.equal(skill.implementation.effects[0].effect.magnitude, 0.3);
  assert.ok(skill.implementation.triggers.length >= 2);
  const triggerTypes = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(triggerTypes.includes('on-buff-gain'));
  for (const trig of skill.implementation.triggers) {
    assert.equal(trig.effect.effect.statType, 'crit-resistance');
    assert.equal(trig.effect.effect.magnitude, 0.3);
  }
});

test('鹰眼 (120000028) registers hp-above-50 hit-rate 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000028');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'hit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('穿刺一击 (120001009) registers on-ultimate-use ignore-defense 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001009');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.statType, 'ignore-defense');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('澜_稀有_总挂载 (6203020109) applies ally buff on battle start/enemy death and crit damage on ultimate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6203020109');
  assert.ok(skill, 'skill should exist');
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(skill.implementation.effectType, 'stat-modifier');
  assert.equal(skill.implementation.targetType, 'all-allies');
  assert.equal(skill.implementation.effects.length, 2);
  const allyBuff = skill.implementation.effects[0];
  assert.equal(allyBuff.target.targetType, 'all-allies');
  assert.equal(allyBuff.effect.type, 'stat-modifier');
  assert.equal(allyBuff.effect.statType, 'damage-reduction');
  assert.equal(allyBuff.effect.magnitude, 0.05);
  assert.equal(allyBuff.duration.durationType, 'timed');
  assert.equal(allyBuff.duration.rounds, 1);
  const critBonus = skill.implementation.effects[1];
  assert.equal(critBonus.effect.statType, 'crit-damage');
  assert.equal(critBonus.effect.magnitude, 0.05);
  assert.equal(critBonus.effect.maxStacks, 3);
  const triggerTypes = skill.implementation.triggers.map(t => t.triggerType);
  assert.deepEqual(triggerTypes, ['on-round-start', 'on-kill', 'on-ultimate-use']);
  assert.equal(skill.implementation.triggers[0].oncePerBattle, true);
  assert.equal(skill.implementation.triggers[2].effect.effect.statType, 'crit-damage');
});

test('6910001017 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001017');
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

test('heal/shield numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 900, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], energy: 0, shield: 0 };
  const effect = { type: 'heal', healType: 'percent-max-hp', multiplier: 0.08 };
  const result = executor.executeHeal(effect, unit, unit);
  assert.ok(result.value > 0, 'heal value should be > 0');
  assert.ok(result.value < 10000, 'heal value should not be extreme');
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 1800, maxHp: 1800, attack: 300, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: 0 };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});
