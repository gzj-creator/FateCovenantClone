import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { EffectExecutor, consumeTriggerCount } from '../game/effects/effect-executor.mjs';
import { loadSkillDatabase } from '../game/effects/skill-integration.mjs';

const database = loadSkillDatabase();
function catalogSkill(id) {
  const skill = database.heroes.flatMap(hero => hero.skills).find(row => String(row.id) === String(id));
  assert.ok(skill, 'Missing production skill ' + id);
  return skill;
}

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: 1, maxHp: 1000000,
    attack: 100, defense: 0, speed: id === 101 ? 120 : 90,
    initialEnergy: 0, skills: [], ...overrides
  };
}

function openingShield(amount) {
  return {
    id: 'fixture-opening-shield', type: 'Passive', implementation: {
      triggers: [{
        triggerType: 'on-round-start', oncePerBattle: true,
        effect: {
          target: { targetType: 'self' },
          effect: { type: 'shield', magnitude: amount },
          duration: { durationType: 'instant' }, chance: 1
        }
      }]
    }
  };
}

function attacks(battle, actorId = 101) {
  const result = [];
  for (const event of battle.events) {
    if (event.kind === 'action-start' && event.srcId === actorId) result.push({ ...event, harms: [] });
    if (event.kind === 'damage') {
      for (const harm of event.harms) {
        if (harm.srcId === actorId && result.at(-1)?.id === event.id) result.at(-1).harms.push(harm);
      }
    }
  }
  return result;
}

test('damage conversion excludes absorbed damage and HP overkill', () => {
  for (const [hp, shield, damage, hpLoss, absorbed] of [
    [50, 100, 80, 0, 80], [50, 20, 100, 50, 20],
    [20, 0, 100, 20, 0], [100, 0, 40, 40, 0]
  ]) {
    const actor = { id: 1, hp: 100, maxHp: 1000, attack: 100, alive: true };
    const target = { id: 2, hp, maxHp: hp, shield, alive: true };
    const state = { random: () => 0.5, actionContext: { actionType: 'ultimate', damage: new Map() } };
    const executor = new EffectExecutor(state);
    const hit = executor.executeDamage({ damageType: 'true', magnitude: damage, variance: 1 }, actor, target);
    assert.equal(hit.hpDamage, hpLoss);
    assert.equal(hit.absorbed, absorbed);
    const heal = executor.executeHeal({ healType: 'percent-damage-dealt', multiplier: 0.1 }, actor, actor);
    assert.equal(heal.actualHeal, Math.floor(hpLoss * 0.1));
    assert.equal(actor.damageDealt, hpLoss);
    assert.equal(target.damageTaken, hpLoss);
    assert.equal(target.alive, hpLoss < hp);
  }
});

test('the real life-steal passive heals from total ultimate HP damage in battle', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      attack: 1000, maxHp: 5000, speed: 100, initialEnergy: 1000,
      behavior: 'elementalist', skills: [catalogSkill('120001002')]
    })],
    defenders: [1, 2, 3].map(loc => fighter(200 + loc, {
      loc, maxHp: 100, attack: 100, speed: 150, skills: [openingShield(50)]
    })),
    seed: 9, maxRounds: 1
  });
  const hpDamage = attacks(battle).flatMap(action => action.harms)
    .reduce((sum, harm) => sum + harm.oldHp - harm.hp, 0);
  assert.equal(hpDamage, 300);
  const heals = battle.events.filter(event => event.type === 'heal' && event.actor === 101);
  assert.equal(heals.length, 1);
  assert.equal(heals[0].value, 30);
  assert.equal(heals[0].actualHeal, 30);
  assert.equal(battle.attackers[0].hp, heals[0].newHp);
});

test('a fully absorbed ultimate never grants the production life-steal heal', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, { attack: 1000, maxHp: 5000, speed: 100, initialEnergy: 1000,
      skills: [catalogSkill('120001002')] })],
    defenders: [fighter(201, { speed: 150, skills: [openingShield(100000)] })],
    seed: 11, maxRounds: 1
  });
  const heal = battle.events.find(event => event.type === 'heal' && event.actor === 101);
  assert.ok(heal);
  assert.equal(heal.value, 0);
  assert.equal(heal.newHp, heal.oldHp);
});

test('ultimate life-steal excludes damage produced by a separate triggered passive', () => {
  const extraDamage = {
    id: 'fixture-extra-damage', type: 'Passive', implementation: {
      triggers: [{ triggerType: 'on-skill-use', effect: {
        target: { targetType: 'single' },
        effect: { type: 'damage', damageType: 'true', magnitude: 200, variance: 1 },
        duration: { durationType: 'instant' }, chance: 1
      } }]
    }
  };
  const battle = simulateBattle({
    attackers: [fighter(101, { speed: 100, initialEnergy: 1000,
      skills: [extraDamage, catalogSkill('120001002')] })],
    defenders: [fighter(201, { speed: 150 })], seed: 11, maxRounds: 1
  });
  const outgoing = battle.events.filter(event => event.kind === 'damage')
    .flatMap(event => event.harms).filter(harm => harm.srcId === 101);
  assert.equal(outgoing.length, 2);
  assert.equal(outgoing[1].value, 200);
  const heal = battle.events.find(event => event.type === 'heal' && event.actor === 101);
  assert.equal(heal.value, Math.floor((outgoing[0].oldHp - outgoing[0].hp) * 0.1));
});

test('2504050123 converts only its actual HP damage to a shield and remains seeded', () => {
  const input = {
    attackers: [fighter(101, { role: 5040501, attack: 1000, initialEnergy: 1000,
      activeAbilityId: 2504050123, skills: [catalogSkill('2504050123')] })],
    defenders: [1, 2].map(loc => fighter(200 + loc, {
      loc, maxHp: 100, speed: 50, skills: [openingShield(50)]
    })),
    seed: 15, maxRounds: 1
  };
  const battle = simulateBattle(input);
  assert.deepEqual(simulateBattle(input), battle);
  assert.equal(battle.attackers[0].shield, 200);
  assert.ok(battle.events.some(event => event.kind === 'shield' && event.aimId === 101 && event.shield === 200));
});

test('next attack damage is consumed once and never leaks into an intervening ultimate', () => {
  const refill = {
    id: 'fixture-one-time-refill', type: 'Passive', implementation: {
      triggers: [{ triggerType: 'on-ultimate-use', oncePerBattle: true, effect: {
        target: { targetType: 'self' }, effect: { type: 'energy', energyType: 'gain', magnitude: 1000 },
        duration: { durationType: 'instant' }, chance: 1
      } }]
    }
  };
  const battle = enabled => simulateBattle({
    attackers: [fighter(101, { initialEnergy: 1000,
      skills: [refill, ...(enabled ? [catalogSkill('120001006')] : [])] })],
    defenders: [fighter(201)], seed: 21, maxRounds: 4
  });
  const baseline = attacks(battle(false));
  const boosted = attacks(battle(true));
  assert.deepEqual(boosted.map(action => action.actionType), [2, 2, 1, 1]);
  assert.equal(boosted[1].harms[0].value, baseline[1].harms[0].value);
  assert.ok(boosted[2].harms[0].value >= Math.floor(baseline[2].harms[0].value * 1.5));
  assert.ok(boosted[2].harms[0].value <= Math.floor(baseline[2].harms[0].value * 1.5) + 1);
  assert.equal(boosted[3].harms[0].value, baseline[3].harms[0].value);
});

test('the next ultimate kill bonus persists until the actual ultimate and skips normal attacks', () => {
  const battle = enabled => simulateBattle({
    attackers: [fighter(101, { skills: enabled ? [catalogSkill('120001007')] : [] })],
    defenders: [fighter(201, { maxHp: 1 }), fighter(202, { loc: 2 })],
    seed: 23, maxRounds: 6
  });
  const baseline = attacks(battle(false));
  const boosted = attacks(battle(true));
  const ultimateIndex = boosted.findIndex(action => action.actionType === 2);
  assert.ok(ultimateIndex >= 3);
  for (let index = 0; index < ultimateIndex; index++) {
    assert.equal(boosted[index].harms[0].value, baseline[index].harms[0].value);
  }
  assert.ok(boosted[ultimateIndex].harms[0].value >= Math.floor(baseline[ultimateIndex].harms[0].value * 1.25));
  assert.equal(boosted[ultimateIndex + 1].harms[0].value, baseline[ultimateIndex + 1].harms[0].value);
});

test('one-hit mastery protection is consumed on the fallback damage path and refreshes without stacking', () => {
  const battle = enabled => simulateBattle({
    attackers: [fighter(101, { skills: enabled ? [catalogSkill('332030174')] : [] })],
    defenders: [fighter(201), fighter(202, { loc: 2 })],
    seed: 29, maxRounds: 3
  });
  const baseline = battle(false).events.filter(event => event.kind === 'damage')
    .flatMap(event => event.harms).filter(harm => harm.aimId === 101);
  const actual = battle(true).events.filter(event => event.kind === 'damage')
    .flatMap(event => event.harms).filter(harm => harm.aimId === 101);
  assert.equal(actual.length, 6);
  for (let index = 0; index < actual.length; index++) {
    assert.equal(actual[index].value, index % 2 === 0
      ? Math.floor(baseline[index].value * 0.85)
      : baseline[index].value);
  }
});

test('first-ultimate critical boost affects that action and leaves later actions unchanged', () => {
  const battle = enabled => simulateBattle({
    attackers: [fighter(101, { initialEnergy: 1000, skills: enabled ? [catalogSkill('120001004')] : [] })],
    defenders: [fighter(201)], seed: 1, maxRounds: 8
  });
  const baseline = attacks(battle(false));
  const actual = attacks(battle(true));
  assert.equal(baseline[0].harms[0].critical, false);
  assert.equal(actual[0].harms[0].critical, true);
  const damageRolls = actions => actions.slice(1)
    .map(action => action.harms.map(harm => ({ value: harm.value, critical: harm.critical })));
  assert.deepEqual(damageRolls(actual), damageRolls(baseline));
});

test('refreshing a next-action effect during that action preserves the new use', () => {
  const unit = { id: 1, hp: 100, maxHp: 100, alive: true, buffs: [], debuffs: [] };
  const executor = new EffectExecutor({});
  const effect = { type: 'stat-modifier', statType: 'damage-bonus', magnitude: 0.25,
    unique: true, sourceSkill: '120001007', actionType: 'ultimate',
    duration: { durationType: 'trigger-count', trigger: 'ultimate', triggers: 1 } };
  executor.executeStatModifier(effect, unit, unit);
  const snapshot = new Map(unit.buffs.map(entry => [entry, entry.applicationId]));
  executor.executeStatModifier(effect, unit, unit);
  assert.equal(consumeTriggerCount(unit, 'ultimate', snapshot).length, 0);
  assert.equal(unit.buffs.length, 1);
  assert.equal(unit.buffs[0].remainingTriggers, 1);
});
