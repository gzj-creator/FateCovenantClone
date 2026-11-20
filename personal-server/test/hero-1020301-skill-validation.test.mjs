import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers, processTriggers, processBuffTicks } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';
import { FIGHT_ENERGY_MAX, simulateBattle } from '../game/battle-engine.mjs';

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

test('恶性疗法 (312030174) registers a poison proc after normal attack or ordinary special', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 600, maxHp: 600, attack: 110, defense: 55, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  const trigs = unit.triggers.filter(t => t.sourceSkill === '312030174');
  assert.equal(trigs.length, 2, 'expected normal and skill triggers');
  const types = trigs.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-ultimate-use']);
  for (const t of trigs) {
    assert.equal(t.effect.effect.type, 'status');
    assert.equal(t.effect.effect.statusType, 'poison');
    assert.equal(t.effect.duration.rounds, 2);
  }
});

test('恶性疗法 gives only its actual action target one poison layer at the 30% chance boundary', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(entry => entry.id === '312030174');
  const actor = { id: HERO_ID, team: 1, loc: 1, alive: true, buffs: [], debuffs: [], skills: [skill] };
  const decoy = { id: 1, loc: 1, team: 2, alive: true, debuffs: [] };
  const target = { id: 2, loc: 5, team: 2, alive: true, debuffs: [] };
  const units = [actor, decoy, target];
  const state = { round: 1, random: () => 0.3, actionContext: { actorId: actor.id, targetIds: [target.id] } };
  registerPassiveTriggers(actor, db, state);
  const events = [];
  processTriggers(actor, 'on-attack', units, state, events);
  assert.deepEqual(events, []);
  const rolls = [0.299, 0.9];
  state.random = () => rolls.shift();
  processTriggers(actor, 'on-tianji-use', units, state, events);
  assert.deepEqual(events, []);
  processTriggers(actor, 'on-attack', units, state, events);
  assert.deepEqual(events.map(({ statusType, target, stacks }) => ({ statusType, target, stacks })),
    [{ statusType: 'poison', target: 2, stacks: 1 }]);
  assert.deepEqual(rolls, [0.9], 'roll the 30% chance only once per proc');
  assert.deepEqual(actor.buffs, []);
  assert.deepEqual(decoy.debuffs, []);
  assert.equal(target.debuffs[0].remainingRounds, 2);
  state.random = () => 0.1;
  processTriggers(actor, 'on-ultimate-use', units, state, events);
  processTriggers(actor, 'on-ultimate-use', units, state, events);
  assert.deepEqual(events.map(event => event.stacksDelta), [1, 1, 0]);
  assert.deepEqual(target.debuffs.map(status => status.stacks), [2]);
  processBuffTicks(target, { round: 2 }, []);
  assert.equal(target.debuffs[0].remainingRounds, 1);
  processBuffTicks(target, { round: 3 }, []);
  assert.deepEqual(target.debuffs, []);
});

test('恶性疗法 publishes one verified poison overlay on normal and ordinary skill actions', () => {
  const skill = getHeroSkills(HERO_ID, loadSkillDatabase()).find(entry => entry.id === '312030174');
  for (const [initialEnergy, expectedAbility] of [[0, 1102030101], [FIGHT_ENERGY_MAX, 2102030113]]) {
    const battle = simulateBattle({
      attackers: [{ id: 101, role: HERO_ID, maxHp: 10000, attack: 100, speed: 100, skills: [skill],
        initialEnergy, abilityId: 1102030101, activeAbilityId: 2102030113 }],
      defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 900000, attack: 1, skills: [] })),
      seed: 2, maxRounds: 1,
    });
    const action = battle.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(action.abilityId, expectedAbility);
    const changes = battle.events.filter(event => event.kind === 'buff-change' && event.id === action.id)
      .flatMap(event => event.buffs).map(({ aimId, tid, overlay }) => ({ aimId, tid, overlay }));
    assert.deepEqual(changes, [{ aimId: action.aimList[0], tid: 11003, overlay: 1 }]);
  }
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

test('恶意蔓延 (312030175) amplifies only the current ordinary ultimate', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(entry => entry.id === '312030175');
  assert.equal(skill.name, '恶意蔓延');
  assert.equal(skill.implementation.abilityDes.text, 604400045);
  const triggers = skill.implementation.triggers;
  assert.equal(triggers.length, 2);
  assert.ok(triggers.every(trigger => trigger.triggerType === 'before-ultimate-use'
    && trigger.effect.effect.actionType === 'ultimate' && trigger.effect.duration.triggers === 1));
  assert.deepEqual(Object.fromEntries(triggers.map(({ effect }) => [effect.effect.statType, effect.effect.magnitude])),
    { 'crit-rate': 0.1, 'crit-damage': 0.15 });
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

test('恶性疗法 has the same-ID original language keys', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '312030174');
  assert.equal(skill.name, '恶性疗法');
  assert.equal(skill.implementation.abilityDes.show_name, 6503144);
  assert.equal(skill.implementation.abilityDes.text, 604400044);
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

test('恶性疗法 (312030174) describes one poison layer on actual action targets', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312030174');
  const eff = skill.implementation.effects[0];
  assert.equal(eff.target.targetType, 'action-enemies');
  assert.equal(eff.effect.type, 'status');
  assert.equal(eff.effect.statusType, 'poison');
  assert.equal(eff.duration.rounds, 2);
  assert.equal(eff.chance, 0.3);
  assert.deepEqual(skill.implementation.triggers.map(t => t.triggerType), ['on-attack', 'on-ultimate-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.chance, 0.3);
    assert.equal(t.effect.effect.statusType, 'poison');
  }
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
    ['before-ultimate-use', 'on-attack', 'on-round-start', 'on-ultimate-use']
  );
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
