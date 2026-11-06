import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1020201;

test('hero 1020201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 猎魔人');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('6910001010 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001010');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

// ---------------------------------------------------------------------------
// 特色技能（Mastery）实现细节
// 期望值全部取自 personal-server/config/skill-database.json 当前数据
// ---------------------------------------------------------------------------

test('重击/无畏/直击要害 (312020171-173) register on-round-start stat modifiers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const expected = [
    ['312020171', 'damage-bonus', 0.05],
    ['312020172', 'attack-percent', 0.05],
    ['312020173', 'crit-rate', 0.05],
  ];
  for (const [id, statType, magnitude] of expected) {
    const skill = skills.find(s => s.id === id);
    const eff = skill.implementation.effects[0];
    const trig = skill.implementation.triggers[0];
    assert.equal(eff.target.targetType, 'self');
    assert.equal(eff.effect.type, 'stat-modifier');
    assert.equal(eff.effect.statType, statType);
    assert.equal(eff.effect.magnitude, magnitude);
    assert.equal(trig.triggerType, 'on-round-start');
    assert.equal(trig.oncePerBattle, true);
  }
  const crit = skills.find(s => s.id === '312020173');
  assert.equal(crit.implementation.effects.length, 2);
  assert.equal(crit.implementation.effects[1].effect.statType, 'crit-damage');
  assert.equal(crit.implementation.effects[1].effect.magnitude, 0.1);
});

test('伺机待发 (312020174) registers on-attack/on-skill-use damage-bonus 0.15 for 1 round', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312020174');
  assert.deepEqual(skill.implementation.triggers.map(t => t.triggerType), ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.target.targetType, 'self');
    assert.equal(t.effect.effect.type, 'stat-modifier');
    assert.equal(t.effect.effect.statType, 'damage-bonus');
    assert.equal(t.effect.effect.magnitude, 0.15);
    assert.equal(t.effect.duration.durationType, 'timed');
    assert.equal(t.effect.duration.rounds, 1);
  }
});

test('蚀骨之痛 (312020175) registers on-ultimate-use percent-max-hp damage 0.03', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312020175');
  const eff = skill.implementation.effects[0];
  const trig = skill.implementation.triggers[0];
  assert.equal(eff.target.targetType, 'single');
  assert.equal(eff.effect.type, 'damage');
  assert.equal(eff.effect.damageType, 'percent-max-hp');
  assert.equal(eff.effect.magnitude, 0.03);
  assert.equal(eff.effect.canCrit, false);
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.type, 'damage');
});

test('mastery skills contribute 7 of the 16 registered triggers for hero 1020201', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 16);
  const mastery = unit.triggers.filter(t => t.sourceSkill.startsWith('312'));
  assert.equal(mastery.length, 7);
  assert.deepEqual(
    [...new Set(mastery.map(t => t.sourceSkill))].sort(),
    ['312020171', '312020172', '312020173', '312020174', '312020175']
  );
});

test('蚀骨之痛 extra damage equals 3% of target max HP', () => {
  const db = loadSkillDatabase();
  const effect = getHeroSkills(HERO_ID, db).find(s => s.id === '312020175').implementation.effects[0].effect;
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9101, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 400, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(effect, actor, target);
  assert.equal(result.crit, false);
  assert.equal(result.value, 30, '3% of 1000 max HP with defense bypassed');
  assert.equal(result.newHp, 970);
});

test('伺机待发 damage-bonus is applied as a self buff by EffectExecutor', () => {
  const db = loadSkillDatabase();
  const trig = getHeroSkills(HERO_ID, db).find(s => s.id === '312020174').implementation.triggers[0];
  const executor = new EffectExecutor({ random: () => 0.5 });
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const result = executor.executeStatModifier(trig.effect.effect, unit, unit);
  assert.equal(result.type, 'stat-modifier');
  assert.equal(unit.buffs.length, 1);
  assert.equal(unit.buffs[0].statType, 'damage-bonus');
  assert.equal(unit.buffs[0].magnitude, 0.15);
  assert.equal(unit.debuffs.length, 0);
});

test('ultimate 6910001010 deals 2x attack damage and is marked requiresInvestigation', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '6910001010');
  const effect = skill.implementation.effects[0].effect;
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(effect.multiplier, 2);
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 200, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9102, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 100, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(effect, actor, target);
  assert.equal(result.crit, false);
  assert.equal(result.value, 355, 'attack 200 * 2 minus defense 100 * 0.45 at neutral variance');
  assert.equal(result.newHp, 645);
});
