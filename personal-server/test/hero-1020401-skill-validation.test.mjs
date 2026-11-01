import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1020401;

test('hero 1020401 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 通灵女巫');
});

test('不屈 (312040171) registers damage-reduction 0.05 on battle start', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '312040171');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (312040172) registers max-hp-percent 0.05 on battle start', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '312040172');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('泰然自若 (312040173) registers crit-resist and crit-damage-reduction', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312040173');
  assert.equal(trigs.length, 2, 'expected 2 triggers');
  const statTypes = trigs.map(t => t.effect.effect.statType).sort();
  assert.deepEqual(statTypes, ['crit-damage-reduction', 'crit-resist']);
});

test('迎头痛击 (312040174) registers dispel triggers on attack and skill use', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312040174');
  assert.equal(trigs.length, 2, 'expected 2 dispel triggers');
  const types = trigs.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of trigs) {
    assert.equal(t.effect.effect.type, 'dispel');
    assert.equal(t.effect.effect.count, 1);
  }
});

test('傀儡咒术 (312040175) registers damage-reduction 0.08 (max 3) and round-3 heal', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312040175');
  assert.equal(trigs.length, 2, 'expected 2 triggers');
  const dr = trigs.find(t => t.effect.effect.type === 'stat-modifier');
  assert.ok(dr, 'damage-reduction trigger present');
  assert.equal(dr.effect.effect.statType, 'damage-reduction');
  assert.equal(dr.effect.effect.magnitude, 0.08);
  assert.equal(dr.maxTriggers, 3);
  const heal = trigs.find(t => t.effect.effect.type === 'heal');
  assert.ok(heal, 'round-3 heal trigger present');
  assert.equal(heal.effect.effect.healType, 'percent-max-hp');
  assert.equal(heal.effect.effect.multiplier, 0.05);
  assert.equal(heal.conditionKey, 'round-3');
  assert.equal(heal.oncePerBattle, true);
});

test('突破5 (120001027) grants 150 energy when hit', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001027');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 150);
  assert.equal(trig.triggerType, 'on-being-hit');
});

test('自保 (120000046) grants 10% damage reduction when debuffed', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000046');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.10);
  assert.equal(trig.conditionKey, 'has-debuff');
});

test('蛰伏 (120000051) grants 15% damage reduction when HP<50%', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000051');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.15);
  assert.equal(trig.conditionKey, 'hp-below-50');
  assert.equal(trig.oncePerBattle, true);
});

test('鼓舞 (120000054) grants 25 energy to all allies on attack', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000054');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
  assert.equal(trig.effect.target.targetType, 'all-allies');
});

test('反杀 (120000055) grants 30% crit when attacking higher-HP target', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000055');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.30);
  assert.equal(trig.conditionKey, 'target-hp-above-self');
});

test('祝福 (120000059) grants 20% heal bonus for first 2 rounds', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000059');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'heal-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(trig.maxTriggers, 2);
  assert.equal(trig.effect.duration.rounds, 2);
});

test('战斗续航 (120001005) heals 30% attack when HP<30%', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001005');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'heal');
  assert.equal(trig.effect.effect.healType, 'percent-attack');
  assert.equal(trig.effect.effect.multiplier, 0.3);
  assert.equal(trig.conditionKey, 'hp-below-30');
});

test('ultimate (6910001012) has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001012');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('dispel mechanic removes dispellable buffs from target', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const target = { id: 2, team: 2, hp: 100, maxHp: 100, alive: true, buffs: [
    { id: 'b1', type: 'strengthened', dispellable: true },
    { id: 'b2', type: 'hasted', dispellable: false },
  ], debuffs: [] };
  const actor = { id: HERO_ID, team: 1, hp: 660, maxHp: 660, alive: true };
  const effect = { type: 'dispel', count: 1, removeType: 'buff' };
  const result = executor.executeDispel(effect, actor, target);
  assert.ok(result, 'dispel result should exist');
  assert.equal(result.count, 1, 'should remove 1 buff');
  assert.equal(target.buffs.length, 1, 'one buff should remain');
  assert.equal(target.buffs[0].id, 'b2', 'non-dispellable buff should remain');
});

test('passive triggers count is at least 12', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 12, 'expected >=12 triggers, got ' + unit.triggers.length);
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