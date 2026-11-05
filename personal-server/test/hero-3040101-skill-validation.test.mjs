import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 3040101;

test('hero 3040101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 伊娃');
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

test('源初 (334010171) registers crit-damage and damage-bonus triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '334010171');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-damage'));
  assert.ok(statTypes.includes('damage-bonus'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('禁果 (334010172) registers attack-percent and energy loss', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '334010172');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType).filter(Boolean);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig, 'should have energy loss trigger');
  assert.equal(energyTrig.effect.effect.energyType, 'loss');
  const atkTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'attack-percent');
  assert.equal(atkTrig.effect.effect.magnitude, 0.05);
});

test('狮袭 (334010173) registers crit-rate and crit-damage triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '334010173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('crit-damage'));
});

test('创世 (334010174) registers 4 triggers including energy gain and damage-reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '334010174');
  assert.equal(skill.implementation.triggers.length, 4);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig);
  assert.equal(energyTrig.effect.effect.magnitude, 100);
  const drTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'damage-reduction');
  assert.ok(drTrig);
  assert.equal(drTrig.effect.effect.magnitude, 0.15);
});

test('终末 (334010175) registers damage-reduction and heal triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '334010175');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.effect.effect.type);
  assert.ok(types.includes('stat-modifier'));
  assert.ok(types.includes('heal'));
  const drTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'damage-reduction');
  assert.equal(drTrig.effect.effect.magnitude, 0.08);
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

test('戒备 (120000025) registers crit-resistance', () => {
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

test('激昂一击 (120001007) registers on-kill damage-bonus 0.25 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001007');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-kill');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.25);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('终末之章 (2304010123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2304010123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('6910001060 metadata ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001060');
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
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.8, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 100 };
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
