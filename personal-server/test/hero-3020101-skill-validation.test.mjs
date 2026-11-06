import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 3020101;

test('hero 3020101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 热力厨娘');
  assert.deepEqual(skills.map(skill => skill.id), [
    'normal-profession-4',
    '332010171',
    '332010172',
    '332010173',
    '332010174',
    '332010175',
    '120001027',
    '120000046',
    '120000051',
    '120000054',
    '120000055',
    '120000059',
    '120001003',
    '6910001035',
  ]);
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('不屈 (332010171) registers on-round-start damage-reduction 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '332010171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (332010172) registers battle-start max-hp-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '332010172');
  assert.equal(skill.implementation.effectType, 'stat-modifier');
  assert.equal(skill.implementation.effects.length, 1);
  const effect = skill.implementation.effects[0];
  assert.equal(effect.effect.type, 'stat-modifier');
  assert.equal(effect.effect.statType, 'max-hp-percent');
  assert.equal(effect.effect.magnitude, 0.05);
  assert.equal(effect.duration.durationType, 'permanent');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.deepEqual(trig.effect.effect, effect.effect);
});

test('泰然自若 (332010173) registers crit-resist 0.05 and crit-damage-reduction 0.10', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '332010173');
  assert.equal(skill.implementation.effects.length, 2);
  assert.equal(skill.implementation.triggers.length, 2);
  const byStat = new Map(skill.implementation.effects.map(entry => [entry.effect.statType, entry.effect]));
  assert.equal(byStat.get('crit-resist').magnitude, 0.05);
  assert.equal(byStat.get('crit-damage-reduction').magnitude, 0.1);
  for (const entry of skill.implementation.effects) {
    assert.equal(entry.effect.type, 'stat-modifier');
    assert.equal(entry.effect.isPercentage, true);
  }
  for (const trig of skill.implementation.triggers) {
    assert.equal(trig.triggerType, 'on-round-start');
    assert.equal(trig.oncePerBattle, true);
  }
});

test('盘石之固 (332010174) registers on-attack/on-skill-use damage-reduction 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '332010174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.statType, 'damage-reduction');
    assert.equal(t.effect.effect.magnitude, 0.15);
  }
});

test('火力全开 (332010175) registers on-ultimate-use shield 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '332010175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.type, 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
});

test('突破5 (120001027) grants 150 energy on being hit', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001027');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-being-hit');
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 150);
});

test('自保 (120000046) registers has-debuff condition damage-reduction 0.10', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000046');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'has-debuff');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.10);
});

test('蛰伏 (120000051) registers hp-below-50 condition damage-reduction 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000051');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-below-50');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('鼓舞 (120000054) grants 25 energy on attack', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000054');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
});

test('反杀 (120000055) registers target-hp-above-self condition crit-rate 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000055');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'target-hp-above-self');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('祝福 (120000059) applies heal-bonus 0.20 for 2 rounds once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.duration.durationType, 'timed');
  assert.equal(trig.effect.duration.rounds, 2);
  assert.equal(trig.effect.effect.statType, 'heal-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('生命护盾 (120001003) registers hp-below-70 shield 0.8 DEF for 2 rounds', () => {
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

test('6910001035 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001035');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-4');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-reduction', magnitude: 0.05, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('shield effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.05 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0);
});
