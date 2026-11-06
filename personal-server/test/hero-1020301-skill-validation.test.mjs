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

test('恶性疗法 (312030174) registers poison status triggers on attack and skill use', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312030174');
  assert.equal(trigs.length, 2, 'expected 2 poison triggers');
  const types = trigs.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of trigs) {
    assert.equal(t.effect.effect.type, 'status');
    assert.equal(t.effect.effect.statusType, 'poison');
    assert.equal(t.effect.effect.duration, 2);
    assert.equal(t.effect.effect.tickInterval, 1);
    assert.equal(t.effect.chance, 0.3);
  }
});

test('poison DoT tickEffect is percent-max-hp damage', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030174');
  const trig = skill.implementation.triggers[0];
  const tick = trig.effect.effect.tickEffect;
  assert.ok(tick, 'tickEffect should be present');
  assert.equal(tick.type, 'damage');
  assert.equal(tick.damageType, 'percent-max-hp');
  assert.equal(tick.magnitude, 0.2);
  assert.equal(tick.canCrit, false);
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

test('恶意蔓延 (312030175) registers crit-rate and crit-damage on ultimate use', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030175');
  const trigs = skill.implementation.triggers;
  assert.equal(trigs.length, 2);
  const types = trigs.map(t => t.triggerType);
  assert.ok(types.every(t => t === 'on-ultimate-use'));
  const statTypes = trigs.map(t => t.effect.effect.statType).sort();
  assert.deepEqual(statTypes, ['crit-damage', 'crit-rate']);
  const cr = trigs.find(t => t.effect.effect.statType === 'crit-rate');
  assert.equal(cr.effect.effect.magnitude, 0.10);
  assert.equal(cr.effect.duration.rounds, 2);
  const cd = trigs.find(t => t.effect.effect.statType === 'crit-damage');
  assert.equal(cd.effect.effect.magnitude, 0.15);
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

test('poison DoT magnitude is reasonable (non-zero, not extreme)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030174');
  const trig = skill.implementation.triggers[0];
  const tick = trig.effect.effect.tickEffect;
  assert.ok(tick.magnitude > 0 && tick.magnitude <= 1, 'poison magnitude out of range');
  assert.ok(trig.effect.duration.rounds > 0 && trig.effect.duration.rounds <= 5, 'poison duration out of range');
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

test('恶性疗法 (312030174) applies poison for 2 rounds with 30% chance after normal/skill', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030174');
  const eff = skill.implementation.effects[0];
  assert.equal(eff.target.targetType, 'single');
  assert.equal(eff.effect.type, 'status');
  assert.equal(eff.effect.statusType, 'poison');
  assert.equal(eff.effect.duration, 2);
  assert.equal(eff.effect.tickInterval, 1);
  assert.equal(eff.chance, 0.3);
  assert.deepEqual(skill.implementation.triggers.map(t => t.triggerType), ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.chance, 0.3);
    assert.equal(t.effect.effect.statusType, 'poison');
  }
});

test('恶意蔓延 (312030175) registers on-ultimate-use crit-rate 0.10 / crit-damage 0.15 for 2 rounds', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030175');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-ultimate-use');
    assert.equal(t.effect.target.targetType, 'self');
    assert.equal(t.effect.duration.durationType, 'timed');
    assert.equal(t.effect.duration.rounds, 2);
  }
  const byStat = {};
  for (const t of skill.implementation.triggers) {
    byStat[t.effect.effect.statType] = t.effect.effect.magnitude;
  }
  assert.deepEqual(byStat, { 'crit-rate': 0.1, 'crit-damage': 0.15 });
});

test('mastery skills contribute 8 of the 17 registered triggers for hero 1020301', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 17);
  const mastery = unit.triggers.filter(t => t.sourceSkill.startsWith('312'));
  assert.equal(mastery.length, 8);
  assert.deepEqual(
    [...new Set(mastery.map(t => t.sourceSkill))].sort(),
    ['312030171', '312030172', '312030173', '312030174', '312030175']
  );
  assert.deepEqual(
    [...new Set(mastery.map(t => t.triggerType))].sort(),
    ['on-attack', 'on-round-start', 'on-skill-use', 'on-ultimate-use']
  );
});

test('poison tick from 恶性疗法 deals 20% of target max HP and ignores defense', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030174');
  const tick = skill.implementation.effects[0].effect.tickEffect;
  assert.equal(tick.type, 'damage');
  assert.equal(tick.damageType, 'percent-max-hp');
  assert.equal(tick.magnitude, 0.2);
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9001, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 500, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(tick, actor, target);
  assert.equal(result.value, 200, '20% of 1000 max HP with defense bypassed');
  assert.equal(result.newHp, 800);
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
  assert.equal(result.value, 355, 'attack 200 * 2 minus defense 100 * 0.45 at neutral variance');
  assert.equal(result.newHp, 645);
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
