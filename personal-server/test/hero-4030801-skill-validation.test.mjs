import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySkillEffects,
  loadSkillDatabase,
  getHeroSkills,
  registerPassiveTriggers,
} from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 4030801;

test('hero 4030801 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 薇尔');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('不屈 (343080171) registers on-round-start damage-reduction 0.05', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343080171');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.type, 'stat-modifier');
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('健壮 (343080172) registers max-hp-percent 0.05 (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343080172');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('超群技艺 (343080173) registers status-hit and status-resist (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343080173');
  assert.equal(skill.implementation.triggers.length, 2);
  const statTypes = skill.implementation.triggers.map(t => t.effect.effect.statType);
  assert.ok(statTypes.includes('status-hit'));
  assert.ok(statTypes.includes('status-resist'));
  assert.equal(skill.implementation.requiresInvestigation, true);
});

test('回春妙手 (343080174) registers on-attack/on-skill-use heal 0.3 ATK', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343080174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'heal');
    assert.equal(t.effect.effect.healType, 'percent-attack');
    assert.equal(t.effect.effect.multiplier, 0.3);
    assert.equal(t.effect.target.targetType, 'lowest-hp-ally');
  }
});

test('勇气礼赞 (343080175) registers on-ultimate-use heal 0.05 max HP (requiresInvestigation)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '343080175');
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.type, 'heal');
  assert.equal(trig.effect.effect.healType, 'percent-max-hp');
  assert.equal(trig.effect.effect.multiplier, 0.05);
  assert.equal(skill.implementation.requiresInvestigation, true);
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

test('铁甲 (120000034) registers anti-crit 0.20 on round start', () => {
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

test('战斗续航 (120001005) registers on-round-start heal 0.3 ATK when HP < 30%', () => {
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

test('2403080113 公主驾到 heals and restores the same lowest-HP ally', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(!skills.some(skill => skill.id === '6910001050'));
  const skill = skills.find(s => s.id === '2403080113');
  assert.ok(skill);
  assert.equal(skill.name, '公主驾到');
  assert.deepEqual(skill.implementation.effects.map(effect => effect.effect.type), ['heal', 'energy']);
  assert.ok(skill.implementation.effects.every(effect =>
    effect.target.targetType === 'lowest-hp-ally'
    && effect.targetGroup === 'princess-arrives-target'));

  const vell = {
    id: 101, team: 1, role: HERO_ID, loc: 1, camp: 4,
    hp: 10000, maxHp: 10000, attack: 1000, defense: 100,
    critChance: 0, energy: 1000, shield: 0, alive: true,
    buffs: [], debuffs: [], triggers: []
  };
  const lowestAlly = {
    id: 102, team: 1, loc: 2, camp: 4,
    hp: 3000, maxHp: 6000, attack: 100, defense: 50,
    energy: 100, shield: 0, alive: true, buffs: [], debuffs: [], triggers: []
  };
  const otherAlly = {
    id: 103, team: 1, loc: 3, camp: 5,
    hp: 5000, maxHp: 5000, attack: 100, defense: 50,
    energy: 0, shield: 0, alive: true, buffs: [], debuffs: [], triggers: []
  };
  const enemy = {
    id: 201, team: 2, loc: 1, camp: 1,
    hp: 6000, maxHp: 6000, attack: 100, defense: 100,
    energy: 0, shield: 0, alive: true, buffs: [], debuffs: [], triggers: []
  };
  const events = [];
  applySkillEffects(skill, vell, [vell, lowestAlly, otherAlly, enemy], {
    skillDatabase: db, random: () => 0.5
  }, events);

  assert.deepEqual(events.map(event => event.type), ['heal', 'energy']);
  assert.ok(events.every(event => event.target === lowestAlly.id));
  const heal = events.find(event => event.type === 'heal');
  assert.equal(heal.value, 1800);
  assert.equal(heal.targetCampMultiplier, 1.5);
  assert.equal(heal.actorMaxHpCap, 9000);
  assert.equal(lowestAlly.hp, 4800);
  const energy = events.find(event => event.type === 'energy');
  assert.equal(energy.targetCampMultiplier, 1.5);
  assert.equal(lowestAlly.energy, 220);
  assert.equal(enemy.hp, enemy.maxHp, 'the ultimate must not damage an enemy');
});

test('公主驾到 caps healing at 90% of the caster maximum HP', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(value => value.id === '2403080113');
  const actor = {
    id: 101, team: 1, loc: 1, camp: 4,
    hp: 1000, maxHp: 1000, attack: 10000, defense: 0,
    energy: 1000, shield: 0, alive: true, buffs: [], debuffs: [], triggers: []
  };
  const target = {
    id: 102, team: 1, loc: 2, camp: 5,
    hp: 1, maxHp: 50000, attack: 1, defense: 0,
    energy: 0, shield: 0, alive: true, buffs: [], debuffs: [], triggers: []
  };
  const events = [];
  applySkillEffects(skill, actor, [actor, target], { skillDatabase: db, random: () => 0.5 }, events);
  const heal = events.find(event => event.type === 'heal');
  assert.equal(heal.value, 900);
  assert.equal(heal.actualHeal, 900);
  assert.equal(heal.actorMaxHpCap, 900);
});

test('normal attack has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === 'normal-profession-3');
  assert.ok(skill.implementation.effects.length > 0);
  assert.equal(skill.implementation.effects[0].effect.type, 'damage');
});

test('damage numbers are reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0.1 };
  const target = { id: 2, team: 2, loc: 1, hp: 300, maxHp: 300, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'damage', damageType: 'magical', multiplier: 2, canCrit: true };
  const result = executor.executeDamage(effect, actor, target);
  assert.ok(result.value > 0, 'damage should be > 0');
  assert.ok(result.value < 100000, 'damage should not be extreme');
});

test('energy gain number is reasonable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const unit = { id: HERO_ID, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], energy: 500, shield: 0 };
  const effect = { type: 'energy', energyType: 'gain', magnitude: 50 };
  const result = executor.executeEnergy(effect, unit, unit);
  assert.ok(result.newEnergy >= 0 && result.newEnergy <= 1000);
});

test('stat modifier effect is executable', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: HERO_ID, team: 1, loc: 1, hp: 630, maxHp: 630, attack: 95, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.05, isPercentage: true, duration: { durationType: 'permanent', rounds: 0 } };
  const result = executor.executeStatModifier(effect, actor, target);
  assert.ok(result, 'stat-modifier should execute');
  assert.equal(result.type, 'stat-modifier');
});
