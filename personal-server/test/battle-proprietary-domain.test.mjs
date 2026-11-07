import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { loadSkillDatabase } from '../game/effects/skill-integration.mjs';
import {
  PROPRIETARY_EVENT_KINDS, PROPRIETARY_HOOKS, addLayer, createProprietaryState,
  layerModifiers, layerValue, runHooks
} from '../game/effects/proprietary-state.mjs';
import { initProprietaryBattle } from '../game/effects/proprietary-rules.mjs';

const database = loadSkillDatabase();

function catalogSkill(id) {
  const skill = database.heroes.flatMap(hero => hero.skills).find(row => String(row.id) === String(id));
  assert.ok(skill, 'Missing production skill ' + id);
  return skill;
}

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: id, maxHp: 1000,
    attack: 100, defense: 0, speed: 90, initialEnergy: 0, skills: [], ...overrides
  };
}

function eventsOf(battle, kind, predicate = () => true) {
  return battle.events.filter(event => event.kind === kind && predicate(event));
}

test('魔能领域 opens after the 天极技 cast, heals the allies and raises their attack', () => {
  const battle = simulateBattle({
    attackers: [
      fighter(101, {
        role: 1040101, loc: 2, maxHp: 5000, attack: 100, speed: 150,
        initialTianji: 3, activeAbilityId: 2104010123, skills: [catalogSkill('2104010123')]
      }),
      fighter(102, { loc: 1, maxHp: 1000, attack: 10, speed: 10 })
    ],
    defenders: [fighter(201, { loc: 1, maxHp: 200000, attack: 400, speed: 200 })],
    seed: 61, maxRounds: 1
  });

  const domains = eventsOf(battle, PROPRIETARY_EVENT_KINDS.DOMAIN);
  assert.equal(domains.length, 1, 'the domain opens once for the cast');
  assert.equal(domains[0].name, '魔能领域');
  assert.equal(domains[0].rounds, 2, 'the described lifetime is two rounds');

  const heals = eventsOf(battle, 'effect', event => event.type === 'heal');
  const allyHeal = heals.find(event => event.target === 102);
  assert.ok(allyHeal, 'the damaged ally is healed when the domain opens');
  assert.equal(allyHeal.value, Math.min(100, 1000 - allyHeal.oldHp), 'the heal is 10% of max HP');

  const buffs = eventsOf(battle, 'effect', event => event.type === 'stat-modifier'
    && event.reason === 'domain-opening');
  const attackBuff = buffs.find(event => event.target === 101);
  assert.ok(attackBuff, 'the domain grants the described attack bonus');
  assert.equal(attackBuff.statType, 'attack-percent');
  assert.equal(attackBuff.magnitude, 0.1);
  assert.equal(attackBuff.remainingRounds, 2);
});

test('allies inside 魔能领域 gain a 魔能 layer each round start', () => {
  const battle = simulateBattle({
    attackers: [
      fighter(101, {
        role: 1040101, loc: 2, maxHp: 5000, attack: 100, speed: 150,
        initialTianji: 3, activeAbilityId: 2104010123, skills: [catalogSkill('2104010123')]
      }),
      fighter(102, { loc: 1, maxHp: 1000, attack: 10, speed: 10 })
    ],
    defenders: [fighter(201, { loc: 1, maxHp: 200000, attack: 1, speed: 200 })],
    seed: 62, maxRounds: 2
  });

  const roundStartLayers = eventsOf(battle, PROPRIETARY_EVENT_KINDS.LAYER,
    event => event.reason === 'domain-round-start');
  assert.ok(roundStartLayers.length >= 2, 'both allies gain the round-start layer');
  assert.ok(roundStartLayers.every(event => event.name === '魔能' && event.delta === 1));
  assert.deepEqual([...new Set(roundStartLayers.map(event => event.aimId))].sort(), [101, 102]);
});

test('【魂】 is gained once per fallen character and shields its owner', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      role: 1040301, maxHp: 4000, attack: 4000, speed: 120,
      skills: [catalogSkill('2104030123'), catalogSkill('314030171')]
    })],
    defenders: [
      fighter(201, { loc: 1, maxHp: 100, attack: 1, speed: 10 }),
      fighter(202, { loc: 2, maxHp: 100, attack: 1, speed: 10, reviveOnce: true })
    ],
    seed: 63, maxRounds: 4
  });

  const layers = eventsOf(battle, PROPRIETARY_EVENT_KINDS.LAYER, event => event.name === '魂');
  assert.equal(layers[0].reason, 'layer-opening');
  assert.equal(layers[0].value, 2, 'the mastery opens with the described two layers');
  const deathLayers = layers.filter(event => event.reason === 'layer-death');
  const deadCharacters = new Set(eventsOf(battle, 'death').map(event => event.aimId));
  assert.equal(deathLayers.length, deadCharacters.size,
    'each fallen character grants one layer, and a revived character only grants it once');
  assert.equal(layers.at(-1).value, 2 + deadCharacters.size);

  const shields = eventsOf(battle, 'shield', event => event.reason === 'layer-death');
  assert.ok(shields.length >= 1, 'the mastery shields its owner when the layer is gained');
  assert.ok(shields.every(event => event.shield >= 800), 'the shield is 20% of max HP');
});

test('【魂】 stops at the described eight-layer cap', () => {
  const unit = {
    id: 101, team: 1, loc: 1, maxHp: 4000, attack: 100,
    skills: [catalogSkill('2104030123'), catalogSkill('314030171'), catalogSkill('314030175')]
  };
  unit.proprietary = createProprietaryState(unit);
  const state = { round: 1, allUnits: [unit], events: [] };
  initProprietaryBattle(unit, state, state.events);
  assert.equal(layerValue(unit, '魂'), 2, 'the mastery opens with two layers');

  for (let index = 0; index < 9; index += 1) {
    runHooks(state, PROPRIETARY_HOOKS.UNIT_DEATH,
      { unit: { id: 900 + index, team: index % 2 === 0 ? 1 : 2 } }, state.events);
  }
  assert.equal(layerValue(unit, '魂'), 8, 'the described cap stops the stack at eight');
});

test('【月光】 carries the described cap and per-layer stats', () => {
  const unit = {
    id: 101, team: 1, loc: 1, maxHp: 4000, attack: 100,
    skills: [catalogSkill('2404030123')]
  };
  unit.proprietary = createProprietaryState(unit);
  const state = { round: 1, allUnits: [unit], events: [] };
  initProprietaryBattle(unit, state, state.events);

  const def = unit.proprietary.layerDefs.get('月光');
  assert.ok(def, 'the layer definition is registered from its description');
  assert.equal(def.cap, 100);
  const damageBonus = def.perLayer.find(entry => entry.statType === 'damage-bonus');
  const ignoreDefense = def.perLayer.find(entry => entry.statType === 'ignore-defense');
  assert.equal(damageBonus.magnitude, 0.005);
  assert.equal(ignoreDefense.magnitude, 0.005);

  addLayer(unit, '月光', 40, { max: def.cap, perLayer: def.perLayer });
  assert.equal(layerValue(unit, '月光'), 40);
  const modifiers = layerModifiers(unit);
  assert.equal(modifiers.length, 2, 'each layer feeds the two described stats');
  assert.ok(modifiers.every(entry => entry.stacks === 40));
});
