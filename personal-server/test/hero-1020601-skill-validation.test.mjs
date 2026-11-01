import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1020601;

test('hero 1020601 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 女仆格蕾丝');
});

test('升格防御 (6102060102) registers a battle-start trigger granting shield to front-row allies', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '6102060102');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.ok(trig.effect && trig.effect.effect && trig.effect.effect.type === 'shield', 'effect should be shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
  assert.equal(trig.effect.target.targetType, 'front-row-allies');
});

test('升格防御 shield magnitude is 5% max HP (reasonable)', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const ally = { id: 2, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const grace = { id: HERO_ID, team: 1, loc: 2, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.05 };
  const result = executor.executeShield(effect, grace, ally);
  assert.ok(result.value > 0, 'shield value should be > 0');
  assert.ok(result.value < 10000, 'shield value should not be extreme');
  assert.equal(result.value, 33);
});

test('生命护盾 (120001003) registers an on-hp-threshold trigger with 80% defense shield', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001003');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-hp-threshold');
  assert.ok(trig.effect.effect.type === 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-defense');
  assert.equal(trig.effect.effect.multiplier, 0.8);
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

test('鼓舞 (120000054) grants 25 energy', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000054');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
});

test('所有 trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('不屈 (312060171) damage-reduction stat modifier magnitude is 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312060171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.ok(trig.effect.effect.magnitude > 0 && trig.effect.effect.magnitude <= 1);
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('sheng ge fang yu is registered at battle start (on-round-start, oncePerBattle)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6102060102');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
});
