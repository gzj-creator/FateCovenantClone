import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1020301;

test('hero 1020301 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 狂暴玛丽');
});

test('重击 (312030171) registers damage-bonus 0.05 on battle start', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '312030171');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('无畏 (312030172) registers attack-percent 0.05 on battle start', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trig = unit.triggers.find(t => t.sourceSkill === '312030172');
  assert.ok(trig, 'trigger should be registered');
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('直击要害 (312030173) registers crit-rate and crit-damage on battle start', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312030173');
  assert.equal(trigs.length, 2, 'expected 2 triggers');
  const statTypes = trigs.map(t => t.effect.effect.statType).sort();
  assert.deepEqual(statTypes, ['crit-damage', 'crit-rate']);
});

test('伺机待发 (312030174) registers next-ultimate damage bonus after normal/skill', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312030174');
  assert.equal(trigs.length, 2, 'expected normal and skill triggers');
  const types = trigs.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of trigs) {
    assert.equal(t.effect.effect.type, 'stat-modifier');
    assert.equal(t.effect.effect.statType, 'damage-bonus');
    assert.equal(t.effect.effect.magnitude, 0.15);
    assert.equal(t.effect.duration.rounds, 1);
  }
});

test('伺机待发 (312030174) exposes the same damage bonus in effects[]', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030174');
  const effect = skill.implementation.effects[0];
  assert.equal(effect.target.targetType, 'self');
  assert.equal(effect.effect.type, 'stat-modifier');
  assert.equal(effect.effect.statType, 'damage-bonus');
  assert.equal(effect.effect.magnitude, 0.15);
  assert.equal(effect.duration.rounds, 1);
});

test('poison status applies to target debuffs via EffectExecutor', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: 2, team: 2, loc: 1, hp: 600, maxHp: 600, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = {
    type: 'status', statusType: 'poison', duration: 2, tickInterval: 1,
    tickEffect: { type: 'damage', damageType: 'percent-max-hp', magnitude: 0.2, canCrit: false },
    dispellable: true, unique: false, maxStacks: 0
  };
  const result = executor.executeStatus(effect, actor, target);
  assert.equal(result.type, 'status');
  assert.equal(target.debuffs.length, 1);
  assert.equal(target.debuffs[0].type, 'poison');
  assert.equal(target.debuffs[0].duration, 2);
  assert.equal(target.debuffs[0].tickInterval, 1);
});

test('poison DoT tick deals percent-max-hp damage to target', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: 2, team: 2, hp: 500, maxHp: 500, defense: 50, shield: 0, alive: true, buffs: [], debuffs: [] };
  const tick = { type: 'damage', damageType: 'percent-max-hp', magnitude: 0.2, canCrit: false };
  const result = executor.executeDamage(tick, unit, unit);
  assert.ok(result, 'tick should produce damage result');
  assert.ok(result.value > 0, 'DoT damage should be > 0');
  // 20% of 500 = 100
  assert.equal(result.value, 100);
});

test('蚀骨之痛 (312030175) registers 3% target-max-HP damage on ultimate use', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030175');
  const trigs = skill.implementation.triggers;
  assert.equal(trigs.length, 1);
  assert.equal(trigs[0].triggerType, 'on-ultimate-use');
  assert.equal(trigs[0].effect.effect.type, 'damage');
  assert.equal(trigs[0].effect.effect.damageType, 'percent-max-hp');
  assert.equal(trigs[0].effect.effect.magnitude, 0.03);
  assert.equal(trigs[0].effect.effect.canCrit, false);
});

test('突破9 (120001031) grants 200 energy on normal/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001031');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 200);
});

test('狂怒 (120000001) grants +15% crit rate on ultimate use', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000001');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
  assert.equal(trig.triggerType, 'on-ultimate-use');
});

test('勃发 (120000006) grants +20% crit damage when HP > 50%', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000006');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(trig.conditionKey, 'hp-above-50');
});

test('鼓舞 (120000009) grants 25 energy', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000009');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
});

test('格挡 (120000014) grants 20% damage reduction', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000014');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(trig.oncePerBattle, true);
});

test('标记 (120000015) grants +25% crit rate vs debuffed targets', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000015');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.25);
  assert.equal(trig.conditionKey, 'target-has-debuff');
});

test('专注一击 (120001006) grants +50% damage bonus after ultimate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001006');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.50);
  assert.equal(trig.triggerType, 'on-ultimate-use');
});

test('ultimate skill (6910001011) has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001011');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('passive triggers count is at least 12', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 12, 'expected >=12 triggers, got ' + unit.triggers.length);
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

test('伺机待发 damage bonus is bounded and lasts one round', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030174');
  const trig = skill.implementation.triggers[0];
  assert.ok(trig.effect.effect.magnitude > 0 && trig.effect.effect.magnitude <= 1);
  assert.equal(trig.effect.duration.rounds, 1);
});

// ---------------------------------------------------------------------------
// 特色技能（Mastery）实现细节
// 期望值全部取自 personal-server/config/skill-database.json 当前数据
// ---------------------------------------------------------------------------

test('重击 (312030171) registers on-round-start damage-bonus 0.05', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030171');
  const eff = skill.implementation.effects[0];
  const trig = skill.implementation.triggers[0];
  assert.equal(eff.target.targetType, 'self');
  assert.equal(eff.effect.type, 'stat-modifier');
  assert.equal(eff.effect.statType, 'damage-bonus');
  assert.equal(eff.effect.magnitude, 0.05);
  assert.equal(eff.duration.durationType, 'permanent');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-bonus');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('无畏 (312030172) registers on-round-start attack-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030172');
  const trig = skill.implementation.triggers[0];
  assert.equal(skill.implementation.effects[0].target.targetType, 'self');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('直击要害 (312030173) registers crit-rate 0.05 and crit-damage 0.10', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030173');
  assert.equal(skill.implementation.effects.length, 2);
  assert.equal(skill.implementation.triggers.length, 2);
  assert.deepEqual(skill.implementation.effects.map(e => e.effect.statType), ['crit-rate', 'crit-damage']);
  assert.deepEqual(skill.implementation.effects.map(e => e.effect.magnitude), [0.05, 0.1]);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-round-start');
    assert.equal(t.oncePerBattle, true);
  }
});

test('伺机待发 (312030174) grants 15% damage bonus after normal/skill', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030174');
  const eff = skill.implementation.effects[0];
  assert.equal(eff.target.targetType, 'self');
  assert.equal(eff.effect.type, 'stat-modifier');
  assert.equal(eff.effect.statType, 'damage-bonus');
  assert.equal(eff.effect.magnitude, 0.15);
  assert.equal(eff.duration.rounds, 1);
  assert.equal(eff.chance, 1);
  assert.deepEqual(skill.implementation.triggers.map(t => t.triggerType), ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.chance, 1);
    assert.equal(t.effect.effect.statType, 'damage-bonus');
  }
});

test('蚀骨之痛 (312030175) registers on-ultimate-use target-max-HP damage 0.03', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030175');
  assert.equal(skill.implementation.triggers.length, 1);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-ultimate-use');
    assert.equal(t.effect.target.targetType, 'single');
    assert.equal(t.effect.duration.durationType, 'instant');
    assert.equal(t.effect.effect.damageType, 'percent-max-hp');
    assert.equal(t.effect.effect.magnitude, 0.03);
  }
});

test('mastery skills contribute 7 of the 16 registered triggers for hero 1020301', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 16);
  const mastery = unit.triggers.filter(t => t.sourceSkill.startsWith('312'));
  assert.equal(mastery.length, 7);
  assert.deepEqual(
    [...new Set(mastery.map(t => t.sourceSkill))].sort(),
    ['312030171', '312030172', '312030173', '312030174', '312030175']
  );
  assert.deepEqual(
    [...new Set(mastery.map(t => t.triggerType))].sort(),
    ['on-attack', 'on-round-start', 'on-skill-use', 'on-ultimate-use']
  );
});

test('extra 蚀骨之痛 hit deals 3% of target max HP and ignores defense', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030175');
  const hit = skill.implementation.effects[0].effect;
  assert.equal(hit.type, 'damage');
  assert.equal(hit.damageType, 'percent-max-hp');
  assert.equal(hit.magnitude, 0.03);
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9001, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 500, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(hit, actor, target);
  assert.equal(result.value, 30, '3% of 1000 max HP with defense bypassed');
  assert.equal(result.newHp, 970);
});

test('ultimate 6910001011 deals 2x attack damage through EffectExecutor', () => {
  const db = loadSkillDatabase();
  const effect = getHeroSkills(HERO_ID, db).find(s => s.id === '6910001011').implementation.effects[0].effect;
  assert.equal(effect.multiplier, 2);
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 200, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9002, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 100, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(effect, actor, target);
  assert.equal(result.crit, false);
  assert.equal(result.value, 326, 'attack 200 * 2 is mitigated by the shared defense-ratio formula');
  assert.equal(result.newHp, 674);
});

test('重击 damage-bonus is applied as a self buff by EffectExecutor', () => {
  const db = loadSkillDatabase();
  const effect = getHeroSkills(HERO_ID, db).find(s => s.id === '312030171').implementation.effects[0].effect;
  const executor = new EffectExecutor({ random: () => 0.5 });
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const result = executor.executeStatModifier(effect, unit, unit);
  assert.equal(result.type, 'stat-modifier');
  assert.equal(result.statType, 'damage-bonus');
  assert.equal(unit.buffs.length, 1);
  assert.equal(unit.buffs[0].statType, 'damage-bonus');
  assert.equal(unit.buffs[0].magnitude, 0.05);
  assert.equal(unit.debuffs.length, 0);
});
