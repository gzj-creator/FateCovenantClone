import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 2040101;

test('hero 2040101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 赤霄');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('罪业尽销 (2204010123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2204010123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('龙行 (324010171) registers on-round-start and on-ultimate-use triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324010171');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-round-start'));
  assert.ok(types.includes('on-ultimate-use'));
  const ultTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-ultimate-use');
  assert.equal(ultTrig.maxTriggers, 2);
  assert.equal(ultTrig.effect.effect.statType, 'damage-bonus');
  assert.equal(ultTrig.effect.effect.magnitude, 0.60);
});

test('神罚 (324010172) registers round-start attack-percent, ultimate-use energy loss and burn status', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324010172');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-round-start'));
  assert.ok(types.includes('on-ultimate-use'));
  const burnTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'status');
  assert.ok(burnTrig, 'should have burn status trigger');
  assert.equal(burnTrig.effect.effect.statusType, 'burn');
  const atkTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'attack-percent');
  assert.equal(atkTrig.effect.effect.magnitude, 0.05);
});

test('罪伞 (324010173) registers crit-rate and crit-damage and ultimate damage-bonus', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324010173');
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('crit-damage'));
  assert.ok(statTypes.includes('damage-bonus'));
  const roundTrigs = skill.implementation.triggers.filter(t => t.triggerType === 'on-round-start');
  assert.ok(roundTrigs.length >= 2);
});

test('神降 (324010174) registers energy gain and team damage-bonus', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324010174');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'));
  assert.ok(types.includes('on-skill-use'));
  assert.ok(types.includes('on-round-start'));
  const teamTrig = skill.implementation.triggers.find(t => t.effect.effect.targetType === 'all-allies' || (t.effect.target && t.effect.target.targetType === 'all-allies'));
  // team damage bonus magnitude 0.40
  const dmgTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'damage-bonus' && t.effect.effect.magnitude === 0.40);
  assert.ok(dmgTrig, 'team ultimate damage +40% should exist');
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.equal(energyTrig.effect.effect.magnitude, 100);
});

test('业火 (324010175) registers on-ultimate-use crit-rate and crit-damage', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324010175');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-ultimate-use');
  }
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('crit-damage'));
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

test('破盾 (120000018) registers damage-bonus 0.15 once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000018');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.15);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('锋刃 (120000019) registers damage-bonus 0.30 once per battle', () => {
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
    assert.equal(t.effect.effect.magnitude, 100);
  }
});

test('戒备 (120000025) registers crit-resistance 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000025');
  assert.ok(skill.implementation.triggers.length >= 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'crit-resistance');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('鹰眼 (120000028) registers hp-above-50 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000028');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'hit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('穿刺一击 (120001009) registers on-ultimate-use ignore-defense 0.30 once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001009');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'ignore-defense');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('6910001062 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001062');
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
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.3, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 100 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: 0 };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('status effect (burn) is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6000, maxHp: 6000, attack: 1000, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'status', statusType: 'burn', duration: 2, maxStacks: 20 };
  const result = executor.executeStatus(effect, actor, target);
  assert.ok(result, 'status should execute');
  assert.equal(result.statusType, 'burn');
});
