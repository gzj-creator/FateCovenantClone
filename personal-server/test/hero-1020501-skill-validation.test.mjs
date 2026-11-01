import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1020501;

test('hero 1020501 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 影盾骑士');
});

test('hero 1020501 shield mastery (铁骨铮铮) registers an on-ultimate-use trigger', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '312050175');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.ok(trig.effect && trig.effect.effect && trig.effect.effect.type === 'shield', 'effect should be shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
});

test('hero 1020501 life shield (生命护盾) registers an on-hp-threshold trigger with 80% defense shield', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 400, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '120001003');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-hp-threshold');
  assert.ok(trig.effect.effect.type === 'shield');
  assert.equal(trig.effect.effect.shieldType, 'percent-defense');
  assert.equal(trig.effect.effect.multiplier, 0.8);
});

test('shield numbers are reasonable (not 0, not extreme)', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 400, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-defense', multiplier: 0.8 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0, 'shield value should be > 0');
  assert.ok(result.value < 10000, 'shield value should not be extreme');
  assert.equal(result.value, 48);
});

test('damage reduction stat modifier is a buff with non-negative magnitude', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312050171');
  assert.ok(skill.implementation.triggers.length > 0);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.ok(trig.effect.effect.magnitude > 0 && trig.effect.effect.magnitude <= 1);
});

test('energy gain on being hit (突破5) magnitude is 150', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001027');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 150);
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('ultimate skill (6910001013) has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001013');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});