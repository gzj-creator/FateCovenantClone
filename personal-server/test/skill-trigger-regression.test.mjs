import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import {
  getHeroSkills,
  loadSkillDatabase,
  processTriggers,
  registerPassiveTriggers,
  resetRoundTriggers,
} from '../game/effects/skill-integration.mjs';

function unit(id, role, profession, overrides = {}) {
  return {
    id,
    role,
    profession,
    loc: id,
    abilityId: role,
    activeAbilityId: role + 1000000000,
    maxHp: 8000,
    attack: 100,
    defense: 0,
    speed: 90,
    initialEnergy: 0,
    ...overrides,
  };
}

function skillBattle(role, rounds, seed) {
  return simulateBattle({
    attackers: [unit(101, role, 2, { loc: 1, speed: 120, attack: 1 })],
    defenders: [unit(201, 9002100, 2, { loc: 1, speed: 1, attack: 1, maxHp: 1000000 })],
    seed,
    maxRounds: rounds,
  });
}

test('on-buff-gain aura does not recursively retrigger itself', () => {
  const battle = skillBattle(2020601, 1, 31);
  const resistanceGains = battle.events.filter(event => event.type === 'stat-modifier'
    && event.actor === 101
    && event.target === 101
    && event.statType === 'crit-resistance');

  assert.equal(resistanceGains.length, 2,
    `on-buff-gain recursion produced ${resistanceGains.length} crit-resistance gains`);
});

test('conditional permanent crit-damage passive refreshes instead of stacking', () => {
  const battle = skillBattle(2010101, 3, 37);
  const critDamageGains = battle.events.filter(event => event.type === 'stat-modifier'
    && event.actor === 101
    && event.target === 101
    && event.statType === 'crit-damage'
    && String(event.trigger).startsWith('120000006_'));

  assert.equal(critDamageGains.length, 3);
  assert.ok(critDamageGains.every(event => event.stacks === 1));
});

test('debuff-conditional permanent reduction refreshes its single copy', () => {
  const skillDatabase = loadSkillDatabase();
  const hero = unit(101, 3020101, 2);
  hero.hp = hero.maxHp;
  hero.alive = true;
  hero.skills = getHeroSkills(hero.role, skillDatabase);
  hero.buffs = [];
  hero.debuffs = [{ type: 'poison', source: 201, durationType: 'permanent' }];
  const state = { skillDatabase, round: 1, allUnits: [hero] };
  registerPassiveTriggers(hero, skillDatabase, state);

  const trigger = hero.triggers.find(candidate => candidate.sourceSkill === '120000046');
  assert.ok(trigger);
  assert.equal(trigger.effect.unique, true);

  processTriggers(hero, 'on-round-start', [hero], state, []);
  resetRoundTriggers(hero);
  state.round = 2;
  processTriggers(hero, 'on-round-start', [hero], state, []);

  const reductions = hero.buffs.filter(status => status.statType === 'damage-reduction'
    && status.sourceSkill === '120000046');
  assert.equal(reductions.length, 1);
  assert.equal(reductions[0].stacks, 1);
});
