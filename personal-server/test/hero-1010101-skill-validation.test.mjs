import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1010101;

test('hero 1010101 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 吟游诗人');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('不屈 (311010171) registers battle-start damage-reduction 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '311010171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (311010172) registers battle-start max-hp-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '311010172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('超群技艺 (311010173) registers status-hit and status-resist triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '311010173');
  assert.equal(skill.implementation.triggers.length, 2);
  assert.ok(skill.implementation.triggers.some(t => t.effect.effect.statType === 'status-hit'));
  assert.ok(skill.implementation.triggers.some(t => t.effect.effect.statType === 'status-resist'));
});

test('凌迫威压 (311010174) registers on-attack/on-skill-use energy-loss 100 with 30% chance', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '311010174');
  assert.ok(skill.implementation.triggers.length >= 2);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'loss');
  assert.equal(trig.effect.effect.magnitude, 100);
  assert.equal(trig.effect.chance, 0.3);
});

test('护体音障 (311010175) registers on-ultimate-use damage-reduction 0.08 for 2 rounds', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '311010175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.08);
  assert.equal(trig.effect.duration.durationType, 'timed');
  assert.equal(trig.effect.duration.rounds, 2);
});

test('突破6 (120001028) registers on-attack/on-skill-use energy gain 50', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001028');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 50);
});

test('反弹 (120000032) registers on-being-hit rebound-rate 0.10', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000032');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-being-hit');
  assert.equal(trig.effect.effect.statType, 'rebound-rate');
  assert.equal(trig.effect.effect.magnitude, 0.1);
});

test('铁甲 (120000034) registers on-round-start anti-crit 0.20', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000034');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'anti-crit');
  assert.equal(trig.effect.effect.magnitude, 0.2);
});

test('亢奋 (120000037) registers on-kill energy gain 100', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000037');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-kill');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 100);
});

test('暴怒 (120000042) registers on-skill-use crit-damage 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000042');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-skill-use');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.3);
});

test('奋激 (120000044) registers on-ultimate-use damage-reduction 0.20 (once per battle)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000044');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.2);
});

test('战斗续航 (120001005) registers on-round-start heal 30% attack when HP<30%', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001005');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.conditionKey, 'hp-below-30');
  assert.equal(trig.effect.effect.type, 'heal');
  assert.equal(trig.effect.effect.healType, 'percent-attack');
  assert.equal(trig.effect.effect.multiplier, 0.3);
});

test('6910001014 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001014');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('energy loss number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: 1, attack: 95, defense: 60, hp: 630, maxHp: 630, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500 };
  const target = { id: 2, attack: 100, defense: 50, hp: 600, maxHp: 600, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'loss', magnitude: 100 };
  const result = executor.executeEnergy(effect, actor, target);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
  assert.equal(result.newEnergy, 400);
});

test('heal number is reasonable (not 0, not extreme)', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 100, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'heal', healType: 'percent-attack', multiplier: 0.3 };
  const result = executor.executeHeal(effect, unit, unit);
  assert.ok(result.value > 0, 'heal value should be > 0');
  assert.ok(result.value < 10000, 'heal value should not be extreme');
  assert.equal(result.value, 28);
});
