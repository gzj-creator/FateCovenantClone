import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 5040101;

test('hero 5040101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 13, 'expected 13 skills for 夜璃');
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

test('噬世之宴 (2504010123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2504010123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('潜能蕴养 (354010172) registers energy loss and team damage-bonus triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354010172');
  assert.equal(skill.implementation.triggers.length, 2);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig, 'should have energy loss trigger');
  assert.equal(energyTrig.effect.effect.energyType, 'loss');
  const dmgTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'damage-bonus');
  assert.equal(dmgTrig.effect.effect.magnitude, 0.10);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('核心突破 (354010173) registers damage-reduction and hit-rate triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354010173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('damage-reduction'));
  assert.ok(statTypes.includes('hit-rate'));
  const drTrig = skill.implementation.triggers.find(t => t.effect.effect.statType === 'damage-reduction');
  assert.equal(drTrig.effect.effect.magnitude, 0.60);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('极意自现 (354010174) registers energy gain and shield triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354010174');
  assert.equal(skill.implementation.triggers.length, 3);
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.ok(energyTrig);
  assert.equal(energyTrig.effect.effect.magnitude, 100);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('真我超越 (354010175) registers energy gain trigger', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354010175');
  assert.equal(skill.implementation.triggers.length, 1);
  const energyTrig = skill.implementation.triggers[0];
  assert.equal(energyTrig.effect.effect.type, 'energy');
  assert.equal(energyTrig.effect.effect.energyType, 'gain');
  assert.equal(energyTrig.effect.effect.magnitude, 1000);
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

test('收割 (120000017) registers damage-bonus 0.10 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000017');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.10);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('洞察 (120000020) registers crit-rate 0.20 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000020');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('激怒 (120000023) grants 100 energy on attack/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000023');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'energy');
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 100);
  }
});

test('刺杀 (120000026) registers damage-bonus 0.20 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000026');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(skill.implementation.requiresInvestigation, true);
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

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-2');
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
  const unit = { id: HERO_ID, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], energy: 0, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 600 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
  assert.equal(result.newEnergy, 600);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.10, isPercentage: true };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('heal/shield numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 4000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], energy: 0, shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.10, isPercentage: true };
  const result = executor.executeStatModifier(effect, unit, unit);
  assert.ok(result, 'stat modifier should apply');
});
