import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, skillToEffects, registerPassiveTriggers, processTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';
import { TargetSelector } from '../game/effects/target-selector.mjs';
import { TARGET_TYPES, TRIGGER_TYPES } from '../game/effects/effect-types.mjs';

const HERO_ID = 1020101;

test('hero 1020101 has 14 catalog skills', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.equal(skills.length, 14);
});

test('all 1020101 skills have implementation with effects or triggers', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  for (const s of skills) {
    assert.ok(s.implementation, `missing implementation: ${s.id}`);
    const hasEffects = Array.isArray(s.implementation.effects) && s.implementation.effects.length > 0;
    const hasTriggers = Array.isArray(s.implementation.triggers) && s.implementation.triggers.length > 0;
    assert.ok(hasEffects || hasTriggers, `no effects/triggers: ${s.id}`);
  }
});

test('回春妙手 heals lowest-HP ally for 30% ATK', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010174');
  const effects = skillToEffects(skill, db);
  assert.equal(effects.length, 1);
  const e = effects[0];
  assert.equal(e.target.targetType, TARGET_TYPES.LOWEST_HP_ALLY);
  assert.equal(e.effect.type, 'heal');
  assert.equal(e.effect.healType, 'percent-attack');
  assert.equal(e.effect.multiplier, 0.3);

  const state = { seed: 1 };
  const executor = new EffectExecutor(state);
  const actor = { id: 1, attack: 100, critChance: 0 };
  const ally = { id: 2, hp: 50, maxHp: 200, alive: true };
  const result = executor.executeEffect(e.effect, actor, ally);
  assert.equal(result.type, 'heal');
  assert.equal(result.value, 30);
  assert.equal(ally.hp, 80);
});

test('兰芷蕙心 heals for 5% max HP on ultimate', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010175');
  const effects = skillToEffects(skill, db);
  assert.equal(effects.length, 1);
  const e = effects[0];
  assert.equal(e.effect.type, 'heal');
  assert.equal(e.effect.healType, 'percent-max-hp');
  assert.equal(e.effect.multiplier, 0.05);

  const state = { seed: 1 };
  const executor = new EffectExecutor(state);
  const actor = { id: 1, attack: 95, critChance: 0 };
  const ally = { id: 2, hp: 100, maxHp: 200, alive: true };
  const result = executor.executeEffect(e.effect, actor, ally);
  assert.equal(result.type, 'heal');
  assert.equal(result.value, 10);
  assert.equal(ally.hp, 110);
});

test('生命护盾 grants 80% DEF shield for 2 rounds when HP < 70%', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '120001003');
  const effects = skillToEffects(skill, db);
  assert.equal(effects.length, 1);
  const e = effects[0];
  assert.equal(e.effect.type, 'shield');
  assert.equal(e.effect.shieldType, 'percent-defense');
  assert.equal(e.effect.multiplier, 0.8);

  const state = { seed: 1 };
  const executor = new EffectExecutor(state);
  const actor = { id: 1, defense: 60, critChance: 0 };
  const self = { id: 1, hp: 100, maxHp: 200, alive: true, shield: 0 };
  const result = executor.executeEffect(e.effect, actor, self);
  assert.equal(result.type, 'shield');
  assert.equal(result.value, 48);
  assert.equal(self.shield, 48);
});

test('突破6 grants 50 energy', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '120001028');
  const effects = skillToEffects(skill, db);
  assert.equal(effects.length, 1);
  const e = effects[0];
  assert.equal(e.effect.type, 'energy');
  assert.equal(e.effect.energyType, 'gain');
  assert.equal(e.effect.magnitude, 50);

  const state = { seed: 1 };
  const executor = new EffectExecutor(state);
  const actor = { id: 1, critChance: 0 };
  const self = { id: 1, energy: 200, alive: true };
  const result = executor.executeEffect(e.effect, actor, self);
  assert.equal(result.type, 'energy');
  assert.equal(self.energy, 250);
});

test('兰芷蕙心 trigger is on-ultimate-use', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010175');
  const triggers = skill.implementation.triggers;
  assert.ok(Array.isArray(triggers) && triggers.length >= 1);
  assert.equal(triggers[0].triggerType, TRIGGER_TYPES.ON_ULTIMATE_USE);
});

test('生命护盾 trigger is on-hp-threshold once per battle', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '120001003');
  const triggers = skill.implementation.triggers;
  assert.ok(Array.isArray(triggers) && triggers.length >= 1);
  assert.equal(triggers[0].triggerType, TRIGGER_TYPES.ON_HP_THRESHOLD);
  assert.equal(triggers[0].oncePerBattle, true);
  assert.equal(triggers[0].maxTriggers, 1);
});

test('passive triggers register for hero 1020101 unit', () => {
  const db = loadSkillDatabase();
  const state = { seed: 1, skillDatabase: db };
  const unit = { id: HERO_ID, team: 1, maxHp: 630, attack: 95, defense: 60, speed: 106, critChance: 0.05, initialEnergy: 500, buffs: [], debuffs: [], triggers: [], cooldowns: new Map() };
  registerPassiveTriggers(unit, db, state);
  assert.ok(Array.isArray(unit.triggers));
  assert.ok(unit.triggers.length > 0, 'no triggers registered');
  assert.ok(unit.triggers.some(t => t.sourceSkill === '120001003' && t.triggerType === TRIGGER_TYPES.ON_HP_THRESHOLD));
  assert.ok(unit.triggers.some(t => t.sourceSkill === '312010174'));
});

test('processTriggers fires life-shield when HP below 70%', () => {
  const db = loadSkillDatabase();
  const state = { seed: 1, skillDatabase: db, random: () => 0.5 };
  const unit = { id: HERO_ID, team: 1, maxHp: 630, attack: 95, defense: 60, speed: 106, critChance: 0.05, hp: 400, shield: 0, alive: true, buffs: [], debuffs: [], triggers: [], cooldowns: new Map() };
  registerPassiveTriggers(unit, db, state);
  const allUnits = [unit];
  const events = [];
  processTriggers(unit, TRIGGER_TYPES.ON_HP_THRESHOLD, allUnits, state, events);
  assert.ok(events.length >= 1, 'no trigger fired');
  assert.ok(unit.shield > 0, 'shield not applied');
  assert.equal(unit.shield, 48);
});

test('heal/shield/energy magnitudes are reasonable (non-zero, not extreme)', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  for (const s of skills) {
    const effects = skillToEffects(s, db);
    for (const e of effects) {
      if (e.effect.type === 'heal' && e.effect.multiplier != null) {
        assert.ok(e.effect.multiplier > 0 && e.effect.multiplier <= 1, `heal multiplier out of range: ${s.id}`);
      }
      if (e.effect.type === 'shield' && e.effect.multiplier != null) {
        assert.ok(e.effect.multiplier > 0 && e.effect.multiplier <= 1, `shield multiplier out of range: ${s.id}`);
      }
      if (e.effect.type === 'energy') {
        assert.ok(e.effect.magnitude > 0 && e.effect.magnitude <= 200, `energy magnitude out of range: ${s.id}`);
      }
      if (e.effect.type === 'damage' && e.effect.multiplier != null) {
        assert.ok(e.effect.multiplier > 0 && e.effect.multiplier <= 5, `damage multiplier out of range: ${s.id}`);
      }
    }
  }
});

test('target selection: 回春妙手 uses lowest-hp-ally', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010174');
  const effects = skillToEffects(skill, db);
  const sel = new TargetSelector();
  const actor = { id: 1, team: 1, loc: 1, alive: true, hp: 95, maxHp: 100 };
  const allyLow = { id: 2, team: 1, loc: 2, hp: 30, maxHp: 100, alive: true };
  const allyHigh = { id: 3, team: 1, loc: 3, hp: 90, maxHp: 100, alive: true };
  const enemy = { id: 4, team: 2, loc: 1, hp: 50, maxHp: 100, alive: true };
  const all = [actor, allyLow, allyHigh, enemy];
  const targets = sel.selectTargets(effects[0].target, actor, all);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].id, 2);
});

test('不屈 mastery registers damage-reduction stat modifier', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010171');
  const effects = skillToEffects(skill, db);
  assert.equal(effects.length, 1);
  assert.equal(effects[0].effect.type, 'stat-modifier');
  assert.equal(effects[0].effect.statType, 'damage-reduction');
  assert.equal(effects[0].effect.magnitude, 0.05);
  assert.equal(effects[0].target.targetType, TARGET_TYPES.SELF);
});

test('健壮 exposes its 5% max-HP mastery modifier', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010172');
  const effects = skillToEffects(skill, db);
  assert.deepEqual(effects.map(entry => ({
    type: entry.effect.type, statType: entry.effect.statType, magnitude: entry.effect.magnitude,
  })), [{ type: 'stat-modifier', statType: 'max-hp-percent', magnitude: 0.05 }]);
});

test('超群技艺 exposes both 10% status hit and status resistance modifiers', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '312010173');
  const effects = skillToEffects(skill, db);
  assert.deepEqual(effects.map(entry => [entry.effect.statType, entry.effect.magnitude]), [
    ['status-hit', 0.1],
    ['status-resist', 0.1],
  ]);
});

test('6910001009 remains an explicit metadata fallback with executable damage', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '6910001009');
  assert.equal(skill.category, 'metadata fallback');
  assert.equal(skillToEffects(skill, db)[0].effect.type, 'damage');
  assert.equal(skillToEffects(skill, db)[0].effect.multiplier, 2);
});
