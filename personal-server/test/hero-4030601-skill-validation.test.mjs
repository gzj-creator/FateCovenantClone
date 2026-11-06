import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 4030601;

test('hero 4030601 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 灵珑');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('不屈 (343060171) registers on-round-start damage-reduction 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343060171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (343060172) registers max-hp-percent 0.05 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343060172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('闪光翼击 (343060173) registers status-hit and status-resist (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343060173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('status-hit'));
  assert.ok(statTypes.includes('status-resist'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('涅槃流转 (343060174) registers on-attack/on-skill-use damage-reduction 0.15 for 1 round', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343060174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'stat-modifier');
    assert.equal(t.effect.effect.statType, 'damage-reduction');
    assert.equal(t.effect.effect.magnitude, 0.15);
  }
});

test('焚金羽翼 (343060175) registers on-round-start damage-reduction 0.08 (max 3) and round-3 heal', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343060175');
  assert.equal(skill.implementation.triggers.length, 2);
  const t0 = skill.implementation.triggers.find(t => t.triggerType === 'on-round-start');
  const t1 = skill.implementation.triggers.find(t => t.triggerType === 'on-round-end');
  assert.ok(t0);
  assert.equal(t0.maxTriggers, 3);
  assert.equal(t0.effect.effect.statType, 'damage-reduction');
  assert.equal(t0.effect.effect.magnitude, 0.08);
  assert.ok(t1);
  assert.equal(t1.conditionKey, 'round-3');
  assert.equal(t1.effect.effect.type, 'heal');
  assert.equal(t1.effect.effect.healType, 'percent-max-hp');
  assert.equal(t1.effect.effect.multiplier, 0.05);
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

test('反弹 (120000032) registers on-being-hit rebound-rate 0.10 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000032');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-being-hit');
  assert.equal(trig.effect.effect.statType, 'rebound-rate');
  assert.equal(trig.effect.effect.magnitude, 0.10);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('铁甲 (120000034) registers anti-crit 0.20 on round start (hp-above-50)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000034');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'anti-crit');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('亢奋 (120000037) grants 100 energy on kill (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000037');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 100);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('暴怒 (120000042) registers on-skill-use crit-damage 0.30', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000042');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-skill-use');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('奋激 (120000044) registers on-ultimate-use damage-reduction 0.20 once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000044');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('穿刺一击 (120001009) registers on-ultimate-use ignore-defense 0.30 once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001009');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'ignore-defense');
  assert.equal(trig.effect.effect.magnitude, 0.30);
});

test('6910001048 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001048');
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
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 2, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 1890, maxHp: 1890, attack: 285, defense: 90, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});
const EXPECTED_SKILL_IDS = [
  'normal-profession-2', '343060171', '343060172', '343060173', '343060174', '343060175',
  '120001028', '120000032', '120000034', '120000037', '120000042', '120000044', '120001009', '6910001048'
];

test('complete skill id list loads in catalog order', () => {
  const db = loadSkillDatabase();
  assert.deepEqual(getHeroSkills(HERO_ID, db).map(skill => skill.id), EXPECTED_SKILL_IDS);
});

test('every skill declares effectType matching its first declared effect', () => {
  const db = loadSkillDatabase();
  for (const skill of getHeroSkills(HERO_ID, db)) {
    const impl = skill.implementation;
    assert.ok(impl.effectType, skill.id + ' missing effectType');
    assert.ok(Array.isArray(impl.effects) && impl.effects.length > 0, skill.id + ' missing effects');
    assert.equal(impl.effectType, impl.effects[0].effect.type, skill.id + ' effectType mismatch');
  }
});

test('涅槃流转 declares 15% damage reduction for 1 round in effects[]', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '343060174');
  const entry = skill.implementation.effects[0];
  assert.equal(skill.implementation.effectType, 'stat-modifier');
  assert.equal(entry.effect.type, 'stat-modifier');
  assert.equal(entry.effect.statType, 'damage-reduction');
  assert.equal(entry.effect.magnitude, 0.15);
  assert.equal(entry.duration.durationType, 'timed');
  assert.equal(entry.duration.rounds, 1);
});

test('焚金羽翼 declares 8% damage reduction in effects[]', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '343060175');
  const entry = skill.implementation.effects[0];
  assert.equal(skill.implementation.effectType, 'stat-modifier');
  assert.equal(entry.effect.type, 'stat-modifier');
  assert.equal(entry.effect.statType, 'damage-reduction');
  assert.equal(entry.effect.magnitude, 0.08);
});

