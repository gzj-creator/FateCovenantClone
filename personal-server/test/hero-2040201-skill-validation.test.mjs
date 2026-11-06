import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 2040201;

test('hero 2040201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 15, 'expected 15 skills for 幽艳瑞贝卡');
  assert.deepEqual(skills.map(skill => skill.id), [
    'normal-profession-2',
    '2204020123',
    '324020171',
    '324020172',
    '324020173',
    '324020174',
    '324020175',
    '120001026',
    '120000001',
    '120000006',
    '120000009',
    '120000014',
    '120000015',
    '120001004',
    '6910001100',
  ]);
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('捣蛋到底 (2204020123) has damage effect and requires investigation', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '2204020123');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  assert.equal(skill.implementation.effects[0].effect.damageType, 'magical');
  assert.equal(skill.implementation.effects[0].effect.multiplier, 1.3);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('糖果礼花 (324020171) registers percent-max-hp damage and energy gain', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324020171');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-ultimate-use'));
  assert.ok(types.includes('on-attack'));
  const dmgTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-ultimate-use');
  assert.equal(dmgTrig.effect.effect.type, 'damage');
  assert.equal(dmgTrig.effect.effect.damageType, 'percent-max-hp');
  assert.equal(dmgTrig.effect.effect.magnitude, 0.04);
  const energyTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-attack');
  assert.equal(energyTrig.effect.effect.type, 'energy');
  assert.equal(energyTrig.effect.effect.magnitude, 400);
});

test('活力全开 (324020172) registers ultimate-use triggers with energy loss and damage-bonus', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324020172');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.every(t => t === 'on-ultimate-use'));
  const energyTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'energy');
  assert.equal(energyTrig.effect.effect.energyType, 'loss');
  assert.equal(energyTrig.oncePerRound, true);
  assert.equal(energyTrig.maxTriggers, 1);
  const dmgTrig = skill.implementation.triggers.find(t => t.effect.effect.type === 'stat-modifier');
  assert.equal(dmgTrig.effect.effect.statType, 'damage-bonus');
  assert.equal(dmgTrig.effect.effect.magnitude, 0.10);
});

test('送别礼物 (324020173) executes extra ultimate damage and shield dispel at turn end', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324020173');
  assert.ok(skill);
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(skill.implementation.effectType, 'damage');
  assert.equal(skill.implementation.targetType, 'all-enemies');
  assert.equal(skill.implementation.effects.length, 2);
  const damage = skill.implementation.effects[0];
  assert.equal(damage.effect.type, 'damage');
  assert.equal(damage.effect.damageType, 'magical');
  assert.equal(damage.effect.multiplier, 1.3);
  assert.equal(damage.target.targetType, 'all-enemies');
  const shieldBreak = skill.implementation.effects[1];
  assert.equal(shieldBreak.effect.type, 'dispel');
  assert.equal(shieldBreak.effect.removeType, 'buff');
  assert.equal(shieldBreak.effect.count, 1);
  const triggers = skill.implementation.triggers;
  assert.equal(triggers.length, 2);
  for (const trig of triggers) {
    assert.equal(trig.triggerType, 'on-turn-end');
  }
  const dispelTrig = triggers.find(t => t.effect.effect.type === 'dispel');
  const damageTrig = triggers.find(t => t.effect.effect.type === 'damage');
  assert.ok(dispelTrig && damageTrig);
  assert.ok(dispelTrig.priority < damageTrig.priority, 'shield destroy should resolve before the extra ultimate');
});

test('闪亮登场 (324020174) registers energy gain on attack/skill and damage-reduction on ultimate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324020174');
  const types = skill.implementation.triggers.map(t => t.triggerType);
  assert.ok(types.includes('on-attack'));
  assert.ok(types.includes('on-skill-use'));
  assert.ok(types.includes('on-ultimate-use'));
  const energyTrigs = skill.implementation.triggers.filter(t => t.effect.effect.type === 'energy');
  assert.equal(energyTrigs.length, 2);
  for (const t of energyTrigs) {
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 100);
  }
  const debuffTrig = skill.implementation.triggers.find(t => t.triggerType === 'on-ultimate-use');
  assert.equal(debuffTrig.effect.effect.type, 'stat-modifier');
  assert.equal(debuffTrig.effect.effect.statType, 'damage-reduction');
  assert.equal(debuffTrig.effect.effect.magnitude, -0.15);
});

test('完美恶作剧 (324020175) registers once-per-round crit and ignore-defense on ultimate', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '324020175');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-ultimate-use');
    assert.equal(t.oncePerRound, true);
    assert.equal(t.maxTriggers, 1);
  }
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('crit-rate'));
  assert.ok(statTypes.includes('ignore-defense'));
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.magnitude, 0.60);
  }
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

test('狂怒 (120000001) registers on-ultimate-use crit-rate 0.15', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000001');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.15);
});

test('勃发 (120000006) registers hp-above-50 condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000006');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'hp-above-50');
  assert.equal(trig.effect.effect.statType, 'crit-damage');
  assert.equal(trig.effect.effect.magnitude, 0.20);
});

test('鼓舞 (120000009) grants 25 energy on attack/skill (requiresInvestigation for ally condition)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000009');
  assert.equal(skill.implementation.triggers.length, 2);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'energy');
    assert.equal(t.effect.effect.energyType, 'gain');
    assert.equal(t.effect.effect.magnitude, 25);
  }
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('格挡 (120000014) registers damage-reduction 0.20 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000014');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.20);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('标记 (120000015) registers target-has-debuff condition', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120000015');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.conditionKey, 'target-has-debuff');
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 0.25);
});

test('爆裂一击 (120001004) registers on-ultimate-use crit-rate +1.0 once per battle', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '120001004');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.maxTriggers, 1);
  assert.equal(trig.effect.effect.statType, 'crit-rate');
  assert.equal(trig.effect.effect.magnitude, 1.0);
});

test('6910001100 ultimate has a damage effect (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001100');
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
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 3000, maxHp: 3000, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 1.3, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 400 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.10, isPercentage: true, duration: 0 };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});

test('shield destroy of 送别礼物 removes one dispellable enemy buff', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 6600, maxHp: 6600, attack: 900, defense: 300, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = {
    id: 2, team: 2, loc: 1, hp: 5000, maxHp: 5000, alive: true, shield: 500,
    buffs: [{ type: 'strengthened', dispellable: true }, { type: 'hasted', dispellable: false }],
    debuffs: [], triggers: [],
  };
  const effect = { type: 'dispel', removeType: 'buff', count: 1 };
  const result = executor.executeDispel(effect, actor, target);
  assert.equal(result.removeType, 'buff');
  assert.equal(result.count, 1);
  assert.equal(target.buffs.length, 1);
  assert.equal(target.buffs[0].type, 'hasted');
});
