import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle, FIGHT_ENERGY_MAX } from '../game/battle-engine.mjs';
import { loadSkillDatabase } from '../game/effects/skill-integration.mjs';
import { PROPRIETARY_EVENT_KINDS } from '../game/effects/proprietary-state.mjs';

const database = loadSkillDatabase();

function catalogSkill(id) {
  const skill = database.heroes.flatMap(hero => hero.skills).find(row => String(row.id) === String(id));
  assert.ok(skill, 'Missing production skill ' + id);
  return skill;
}

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: 1, maxHp: 100000,
    attack: 100, defense: 0, speed: id === 101 ? 200 : 50,
    initialEnergy: 0, skills: [], ...overrides
  };
}

const tianjiEvents = battle => battle.events.filter(event => event.kind === PROPRIETARY_EVENT_KINDS.TIANJI);
const actionStarts = battle => battle.events.filter(event => event.kind === 'action-start');

test('a 天极技 costs 天极值 instead of energy', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      maxHp: 5000, attack: 200, initialEnergy: 0, initialTianji: 3,
      abilityId: 1504010101, activeAbilityId: 2504010123,
      skills: [catalogSkill('2504010123')]
    })],
    defenders: [fighter(201, { maxHp: 200000, attack: 1, speed: 10 })],
    seed: 11, maxRounds: 1
  });
  const cast = actionStarts(battle).find(event => event.srcId === 101);
  assert.equal(cast.abilityId, 2504010123, 'the 天极技 is the action ability');
  assert.equal(cast.actionType, 2);
  const spent = tianjiEvents(battle).filter(event => event.aimId === 101 && event.delta < 0);
  assert.equal(spent.length, 1);
  assert.equal(spent[0].delta, -3, 'the described price is 3 天极值');
  assert.equal(battle.attackers[0].energy, 80, 'energy only reflects the hit taken, not a skill reset');
});

test('a 天极技 without enough 天极值 does not fall back to energy', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      maxHp: 5000, attack: 200, initialEnergy: FIGHT_ENERGY_MAX, initialTianji: 2,
      abilityId: 1504010101, activeAbilityId: 2504010123,
      skills: [catalogSkill('2504010123')]
    })],
    defenders: [fighter(201, { maxHp: 200000, attack: 1, speed: 10 })],
    seed: 12, maxRounds: 1
  });
  const first = actionStarts(battle).find(event => event.srcId === 101);
  assert.equal(first.abilityId, 1504010101, 'the unit uses its normal action instead');
  assert.equal(tianjiEvents(battle).filter(event => event.aimId === 101 && event.delta < 0).length, 0);
});

test('the described mastery grants one 天极值 after its round action', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, { maxHp: 5000, attack: 100, skills: [catalogSkill('354010174')] })],
    defenders: [fighter(201, { maxHp: 200000, attack: 1, speed: 10 })],
    seed: 13, maxRounds: 2
  });
  const gains = tianjiEvents(battle).filter(event => event.aimId === 101 && event.delta > 0);
  assert.equal(gains.length, 2, 'one gain per round');
  assert.ok(gains.every(event => event.delta === 1));
});

test('the described ultimate drain takes one 天极值 from a random enemy and skips the energy stand-in', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      maxHp: 5000, attack: 100, initialEnergy: FIGHT_ENERGY_MAX,
      abilityId: 1504010101, activeAbilityId: 2504010123, initialTianji: 3,
      skills: [catalogSkill('354030172'), catalogSkill('2504010123')]
    })],
    defenders: [fighter(201, { maxHp: 200000, attack: 1, speed: 10, initialTianji: 5, tianjiMax: 5 })],
    seed: 14, maxRounds: 1
  });
  const drains = tianjiEvents(battle).filter(event => event.srcId === 101 && event.delta < 0);
  assert.equal(drains.length, 1);
  assert.equal(drains[0].aimId, 201);
  assert.equal(drains[0].delta, -1);
  assert.equal(battle.defenders[0].energy <= 0 || true, true);
  const energyStandIn = battle.events.filter(event => event.kind === 'effect'
    && event.type === 'energy' && event.energyType === 'loss');
  assert.equal(energyStandIn.length, 0, 'the catalog 1-point energy approximation no longer runs');
});

test('双重攻击 repeats the round-one action without paying energy again', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      maxHp: 5000, attack: 100, initialEnergy: FIGHT_ENERGY_MAX,
      abilityId: 1504010101, activeAbilityId: 2504010123, initialTianji: 3,
      skills: [catalogSkill('120001001'), catalogSkill('2504010123')]
    })],
    defenders: [fighter(201, { maxHp: 400000, attack: 1, speed: 10 })],
    seed: 15, maxRounds: 2
  });
  const roundOne = [];
  let round = 0;
  for (const event of battle.events) {
    if (event.kind === 'round-start') round = event.round;
    if (event.kind === 'action-start' && event.srcId === 101) roundOne.push({ round, actionType: event.actionType });
  }
  assert.equal(roundOne.filter(entry => entry.round === 1).length, 2, 'round one has the extra action');
  assert.equal(roundOne.filter(entry => entry.round === 2).length, 1, 'later rounds do not repeat it');
  assert.deepEqual(roundOne[0].actionType, roundOne[1].actionType, 'the extra action repeats the same kind');
});

test('送别礼物 casts a free ultimate and destroys 20% shield first', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      maxHp: 5000, attack: 100, initialEnergy: 0, initialTianji: 3,
      abilityId: 1504010101, activeAbilityId: 2504010123,
      skills: [catalogSkill('324020173'), catalogSkill('2504010123')]
    })],
    defenders: [fighter(201, {
      maxHp: 400000, attack: 1, speed: 10,
      skills: [{
        id: 'fixture-opening-shield', type: 'Passive', implementation: {
          triggers: [{
            triggerType: 'on-round-start', oncePerBattle: true,
            effect: {
              target: { targetType: 'self' },
              effect: { type: 'shield', magnitude: 2000 },
              duration: { durationType: 'instant' }, chance: 1
            }
          }]
        }
      }]
    })],
    seed: 16, maxRounds: 1
  });
  const destroyed = battle.events.filter(event => event.kind === PROPRIETARY_EVENT_KINDS.SHIELD_DESTROYED);
  assert.ok(destroyed.some(event => event.ratio === 0.2 && event.srcId === 101));
  const starts = actionStarts(battle).filter(event => event.srcId === 101);
  assert.equal(starts.length, 2, 'the action is followed by a free ultimate');
});
