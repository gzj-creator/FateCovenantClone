import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 5040601;

test('hero 5040601 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 13, 'expected 13 skills for 奈奈子');
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

test('元素倾泻 (2504060123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2504060123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('本源感知 (354060171) registers heal trigger (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354060171');
  assert.ok(skill);
  assert.ok(skill.implementation.triggers.length > 0);
  assert.equal(skill.implementation.triggers[0].effect.effect.type, 'heal');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('核心突破 (354060173) registers heal trigger (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354060173');
  assert.ok(skill);
  assert.ok(skill.implementation.triggers.length > 0);
  assert.equal(skill.implementation.triggers[0].effect.effect.type, 'heal');
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('极意自现 (354060174) registers energy gain and stat-modifier triggers (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354060174');
  assert.ok(skill);
  assert.equal(skill.implementation.triggers.length, 3);
  const energyTrigs = skill.implementation.triggers.filter(t => t.effect.effect.type === 'energy');
  assert.equal(energyTrigs.length, 2);
  const statTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'stat-modifier');
  assert.ok(statTrig);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('真我超越 (354060175) registers stat-modifier attack boost (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '354060175');
  assert.ok(skill);
  assert.equal(skill.implementation.triggers.length, 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'attack-percent');
  assert.equal(trig.effect.effect.magnitude, 0.30);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('突破6 (120001028) grants 50 energy on normal/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001028');
  assert.equal(skill.implementation.triggers.length, 2);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 50);
});

test('狂怒 (120000001) registers on-ultimate-use crit-rate 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000001');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('勃发 (120000006) registers hp-above-50 condition crit-damage 0.20', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000006');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('鼓舞 (120000009) grants 25 energy on normal/skill', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000009');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.type, 'energy');
  assert.equal(trig.effect.effect.energyType, 'gain');
  assert.equal(trig.effect.effect.magnitude, 25);
});

test('格挡 (120000014) requiresInvestigation and damage-reduction 0.20', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000014');
  assert.equal(skill.implementation.requiresInvestigation, true);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('标记 (120000015) registers target-has-debuff condition crit-rate 0.25', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000015');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'target-has-debuff');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.25);
});

test('爆裂一击 (120001004) grants +100% crit rate on first ultimate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001004');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 1.0);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-1');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.38, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.10, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});
const EXPECTED_SKILL_IDS = [
  'normal-profession-1', '2504060123', '354060171', '354060173', '354060174', '354060175',
  '120001028', '120000001', '120000006', '120000009', '120000014', '120000015', '120001004'
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

test('元素倾泻 deals 138% magic to all enemies and may stun them', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '2504060123');
  const [main, stun] = skill.implementation.effects;
  assert.equal(skill.implementation.targetType, 'all-enemies');
  assert.equal(main.target.targetType, 'all-enemies');
  assert.equal(main.effect.damageType, 'magical');
  assert.equal(main.effect.multiplier, 1.38);
  assert.equal(stun.effect.type, 'status');
  assert.equal(stun.effect.statusType, 'stun');
  assert.equal(stun.chance, 0.5);
  assert.equal(stun.duration.rounds, 1);
});

test('本源感知 and 核心突破 expose their heal effect in effects[]', () => {
  const db = loadSkillDatabase();
  for (const id of ['354060171', '354060173']) {
    const skill = getHeroSkills(HERO_ID, db).find(s => s.id === id);
    assert.ok(skill.implementation.effects.length > 0, id + ' effects missing');
    assert.equal(skill.implementation.effects[0].effect.type, 'heal', id + ' should heal');
    assert.equal(skill.implementation.effects[0].effect.healType, 'percent-max-hp');
  }
});


test('shield effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'shield', shieldType: 'percent-max-hp', multiplier: 0.35 };
  const result = executor.executeShield(effect, unit, unit);
  assert.ok(result.value > 0);
});

test('heal effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 8000, maxHp: 8000, attack: 1080, defense: 360, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'heal', healType: 'percent-max-hp', multiplier: 1.0, overheal: false };
  const result = executor.executeHeal(effect, actor, target);
  assert.ok(result, 'heal should execute');
});
