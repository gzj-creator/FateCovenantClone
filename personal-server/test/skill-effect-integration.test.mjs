import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySkillEffects,
  getHeroSkills,
  loadSkillDatabase,
  processBuffTicks,
  processTriggers,
  registerPassiveTriggers
} from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

function unit(id, team, loc, overrides = {}) {
  return {
    id,
    team,
    loc,
    hp: 1000,
    maxHp: 1000,
    attack: 100,
    defense: 20,
    critChance: 0,
    energy: 0,
    shield: 0,
    alive: true,
    buffs: [],
    debuffs: [],
    triggers: [],
    ...overrides
  };
}

function trigger(effect, overrides = {}) {
  return {
    id: 'test-trigger',
    triggerType: 'on-attack',
    sourceSkill: 'test-skill',
    chance: 1,
    cooldown: 0,
    maxTriggers: 0,
    oncePerBattle: false,
    oncePerRound: false,
    triggered: false,
    triggeredThisRound: false,
    triggersUsed: 0,
    conditionKey: null,
    effect: {
      target: { targetType: 'self' },
      effect,
      duration: { durationType: 'instant', rounds: 0 },
      chance: 1
    },
    ...overrides
  };
}

test('applies every configured skill effect instead of only the first', () => {
  const actor = unit(1, 1, 1, { hp: 500 });
  const ally = unit(2, 1, 2, { hp: 400 });
  const enemy = unit(3, 2, 1);
  const skill = {
    id: 'multi-effect',
    implementation: {
      effects: [
        {
          target: { targetType: 'all-enemies' },
          effect: { type: 'damage', damageType: 'true', magnitude: 50, canCrit: false },
          duration: { durationType: 'instant', rounds: 0 },
          chance: 1
        },
        {
          target: { targetType: 'all-allies' },
          effect: { type: 'heal', magnitude: 30 },
          duration: { durationType: 'instant', rounds: 0 },
          chance: 1
        },
        {
          target: { targetType: 'self' },
          effect: { type: 'stat-modifier', statType: 'attack-percent', magnitude: 0.1, isPercentage: true },
          duration: { durationType: 'timed', rounds: 2 },
          chance: 1
        }
      ]
    }
  };
  const state = { skillDatabase: { heroes: [] }, random: () => 0.5 };
  const events = [];

  applySkillEffects(skill, actor, [actor, ally, enemy], state, events);

  assert.equal(events.filter(event => event.type === 'damage').length, 1);
  assert.equal(events.filter(event => event.type === 'heal').length, 2);
  assert.equal(events.filter(event => event.type === 'stat-modifier').length, 1);
  assert.equal(actor.buffs.length, 1);
  assert.equal(actor.buffs[0].durationType, 'timed');
  assert.equal(actor.buffs[0].remainingRounds, 2);
});

test('trigger execution checks both outer and inner chance', () => {
  const source = unit(1, 1, 1);
  const energy = { type: 'energy', energyType: 'gain', magnitude: 100 };
  const failingOuter = trigger(energy, { chance: 0.3 });
  failingOuter.effect.chance = 1;
  source.triggers = [failingOuter];
  let events = [];
  processTriggers(source, 'on-attack', [source], { random: () => 0.99 }, events);
  assert.equal(events.length, 0);
  assert.equal(source.energy, 0);
  assert.equal(failingOuter.triggersUsed, 0);

  const failingInner = trigger(energy, { chance: 1 });
  failingInner.effect.chance = 0.3;
  source.triggers = [failingInner];
  events = [];
  processTriggers(source, 'on-attack', [source], { random: () => 0.99 }, events);
  assert.equal(events.length, 0);
  assert.equal(source.energy, 0);
  assert.equal(failingInner.triggersUsed, 0);

  failingInner.effect.chance = 1;
  processTriggers(source, 'on-attack', [source], { random: () => 0.99 }, events);
  assert.equal(events.length, 1);
  assert.equal(source.energy, 100);
  assert.equal(failingInner.triggersUsed, 1);
});

test('trigger wrapper duration reaches the executor and one-hit protection is consumed', () => {
  const owner = unit(1, 1, 1);
  owner.triggers = [trigger(
    { type: 'stat-modifier', statType: 'damage-reduction', magnitude: 0.15, isPercentage: true },
    {
      effect: {
        target: { targetType: 'self' },
        effect: { type: 'stat-modifier', statType: 'damage-reduction', magnitude: 0.15, isPercentage: true },
        duration: { durationType: 'trigger-count', rounds: 0, triggers: 1, trigger: 'damage-taken' },
        chance: 1
      }
    }
  )];
  const state = { random: () => 0.5 };
  const events = [];
  processTriggers(owner, 'on-attack', [owner], state, events);
  assert.equal(owner.buffs.length, 1);
  assert.equal(owner.buffs[0].durationType, 'trigger-count');
  assert.equal(owner.buffs[0].remainingTriggers, 1);

  const attacker = unit(2, 2, 1, { attack: 100 });
  const result = new EffectExecutor(state).executeDamage(
    { type: 'damage', damageType: 'true', magnitude: 100, canCrit: false, variance: 1 },
    attacker,
    owner
  );
  assert.equal(result.damageReduction, 0.15);
  assert.equal(result.consumedDurations.length, 1);
  assert.equal(owner.buffs.length, 0);
  assert.equal(result.value, 85);
});

test('steal moves energy from target to actor', () => {
  const actor = unit(1, 1, 1, { energy: 0 });
  const target = unit(2, 2, 1, { energy: 500 });
  const result = new EffectExecutor({ random: () => 0.5 }).executeEnergy(
    { type: 'energy', energyType: 'steal', magnitude: 150 },
    actor,
    target
  );
  assert.equal(actor.energy, 150);
  assert.equal(target.energy, 350);
  assert.equal(result.newEnergy, 350);
  assert.equal(result.actorEnergy, 150);
});

test('defensive and accuracy stat families are classified as buffs', () => {
  const stats = [
    'max-hp-percent', 'crit-resist', 'crit-damage-reduction', 'anti-crit', 'crit-resistance',
    'hit-rate', 'evasion', 'status-hit', 'status-resist', 'rebound-rate'
  ];
  for (const statType of stats) {
    const actor = unit(1, 1, 1);
    const target = unit(1, 1, 1);
    new EffectExecutor({ random: () => 0.5 }).executeStatModifier({
      type: 'stat-modifier', statType, magnitude: 0.2, isPercentage: true,
      duration: { durationType: 'permanent', rounds: 0 }
    }, actor, target);
    assert.equal(target.buffs.length, 1, statType + ' should be a buff');
    assert.equal(target.debuffs.length, 0, statType + ' should not be a debuff');
  }
});

test('conditional unique modifiers refresh and expire when their condition becomes false', () => {
  const db = loadSkillDatabase();
  const owner = unit(1010101, 1, 1, { hp: 750 });
  registerPassiveTriggers(owner, db, { random: () => 0.5 });
  const passive = owner.triggers.find(item => item.sourceSkill === '120000034');
  assert.ok(passive);
  const events = [];
  processTriggers(owner, 'on-round-start', [owner], { random: () => 0.5, round: 1 }, events);
  processTriggers(owner, 'on-round-start', [owner], { random: () => 0.5, round: 2 }, events);
  assert.equal(owner.buffs.filter(item => item.statType === 'anti-crit').length, 1);
  processBuffTicks(owner, { random: () => 0.5, round: 2 }, events);
  assert.equal(owner.buffs.some(item => item.statType === 'anti-crit'), true);

  owner.hp = 400;
  processBuffTicks(owner, { random: () => 0.5, round: 2 }, events);
  assert.equal(owner.buffs.some(item => item.statType === 'anti-crit'), false);
});

test('shared battle-window and one-hit configurations use corrected lifecycles', () => {
  const db = loadSkillDatabase();
  let battleWindowSkills = 0;
  let oneHitSkills = 0;
  for (const hero of db.heroes) {
    for (const skill of hero.skills) {
      if (skill.id === '120000059' && skill.implementation?.triggers?.length) {
        battleWindowSkills++;
        for (const item of skill.implementation.triggers) {
          assert.equal(item.oncePerBattle, true);
          assert.equal(item.maxTriggers, 1);
          assert.deepEqual(item.effect.duration, { durationType: 'timed', rounds: 2 });
          assert.equal(item.effect.unique, true);
          assert.equal(item.effect.refresh, true);
        }
      }
      if (skill.id === '332030174') {
        oneHitSkills++;
        for (const item of skill.implementation.triggers) {
          assert.deepEqual(item.effect.duration, {
            durationType: 'trigger-count', rounds: 0, triggers: 1, trigger: 'damage-taken'
          });
          assert.equal(item.effect.unique, true);
          assert.equal(item.effect.refresh, true);
        }
      }
      if (skill.id === '120000034' && skill.implementation?.triggers?.length) {
        for (const item of skill.implementation.triggers) {
          assert.equal(item.conditionKey, 'hp-above-50');
          assert.equal(item.effect.duration.durationType, 'conditional');
          assert.equal(item.effect.duration.conditionKey, 'hp-above-50');
          assert.equal(item.effect.unique, true);
          assert.equal(item.effect.refresh, true);
        }
      }
    }
  }
  assert.equal(battleWindowSkills, 16);
  assert.equal(oneHitSkills, 1);
});
