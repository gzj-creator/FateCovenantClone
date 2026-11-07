import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { effectiveAttack, effectiveDamageBonus } from '../game/effects/effect-executor.mjs';
import { STAT_TYPES } from '../game/effects/effect-types.mjs';
import {
  PROPRIETARY_EVENT_KINDS,
  PROPRIETARY_HOOKS,
  absorbDamage,
  activeSummon,
  addLayer,
  addSuperHp,
  capDamage,
  createProprietaryState,
  destroyShield,
  drainTianji,
  gainTianji,
  layerValue,
  registerHook,
  runHooks,
  spendTianji,
  summonGuard,
  superHpValue,
  tianjiValue,
} from '../game/effects/proprietary-state.mjs';

function unit(overrides = {}) {
  return {
    id: 1, team: 1, hp: 1000, maxHp: 1000, shield: 0, energy: 0, alive: true,
    attack: 100, defense: 0, speed: 100, buffs: [], debuffs: [], ...overrides
  };
}

function stateWith(units) {
  return { round: 1, allUnits: units, random: () => 0.5 };
}

test('天极值 is a separate resource with described spend and gain rules', () => {
  const hero = unit();
  assert.equal(tianjiValue(hero), 0);
  const events = [];
  assert.equal(gainTianji(hero, 3, { events }), 3);
  assert.equal(tianjiValue(hero), 3);
  assert.equal(spendTianji(hero, 3, { events }), true);
  assert.equal(tianjiValue(hero), 0);
  assert.equal(spendTianji(hero, 3), false, 'a short unit cannot go negative');
  gainTianji(hero, 2);
  assert.equal(drainTianji(hero, 1), 1);
  assert.equal(tianjiValue(hero), 1);
  // 天极值 never touches energy.
  assert.equal(hero.energy, 0);
  assert.deepEqual(events.map(event => [event.kind, event.delta]), [
    [PROPRIETARY_EVENT_KINDS.TIANJI, 3],
    [PROPRIETARY_EVENT_KINDS.TIANJI, -3],
  ]);
});

test('天极值 cap applies only when a caller configures one', () => {
  const capped = unit({ initialTianji: 2, tianjiMax: 3 });
  gainTianji(capped, 5);
  assert.equal(tianjiValue(capped), 3);
  const uncapped = unit();
  gainTianji(uncapped, 9);
  assert.equal(tianjiValue(uncapped), 9, 'no description states a maximum');
});

test('damage is taken by shield, then 超凡生命, then HP', () => {
  const target = unit({ hp: 500, maxHp: 1000, shield: 200 });
  const events = [];
  addSuperHp(target, 300, { events });
  assert.equal(superHpValue(target), 300);
  const first = absorbDamage(target, 400, { events, sourceId: 9 });
  assert.equal(first.absorbed, 200);
  assert.equal(first.superAbsorbed, 200);
  assert.equal(target.hp, 500, 'HP is untouched while 超凡生命 remains');
  assert.equal(superHpValue(target), 100);
  const second = absorbDamage(target, 300, { events });
  assert.equal(second.superAbsorbed, 100);
  assert.equal(second.newHp, 300);
  assert.equal(target.alive, true);
  const third = absorbDamage(target, 500, { events });
  assert.equal(third.newHp, 0);
  assert.equal(target.alive, false);
});

test('a guarded summon absorbs the fatal hit and leaves at its described limit', () => {
  const owner = unit({ hp: 400, maxHp: 1000 });
  const events = [];
  // 迪迪 inherits 100% of the owner's HP and leaves after absorbing 100% of it.
  const summon = summonGuard(owner, { id: 9001, hpRatio: 1, absorbLimitRatio: 1, rounds: 3 });
  assert.equal(summon.maxHp, 1000);
  const fatal = absorbDamage(owner, 900, { events });
  assert.equal(fatal.summonAbsorbed, 900);
  assert.equal(owner.hp, 400, 'the owner does not lose HP to absorbed fatal damage');
  assert.equal(owner.alive, true);
  assert.equal(activeSummon(owner)?.absorbed, 900);
  const second = absorbDamage(owner, 900, { events });
  assert.equal(second.summonAbsorbed, 900);
  assert.equal(activeSummon(owner), null, 'the summon leaves after exceeding its life');
  const third = absorbDamage(owner, 900, { events });
  assert.equal(third.summonAbsorbed, 0);
  assert.equal(owner.alive, false);
  assert.ok(events.some(event => event.kind === PROPRIETARY_EVENT_KINDS.SUMMON && event.left === true));
});

test('named layers contribute stats and respect their cap', () => {
  const hero = unit();
  addLayer(hero, '魔能', 2, {
    perLayer: [{ statType: STAT_TYPES.IGNORE_DEFENSE, magnitude: 0.2 }]
  });
  addLayer(hero, '魂', 12, { max: 8, perLayer: [{ statType: STAT_TYPES.DAMAGE_BONUS, magnitude: 0.1 }] });
  assert.equal(layerValue(hero, '魔能'), 2);
  assert.equal(layerValue(hero, '魂'), 8);
  assert.equal(Math.round(effectiveDamageBonus(hero) * 100) / 100, 0.8);
  assert.equal(effectiveAttack(hero), 100, 'layers without attack contributions leave attack alone');
});

test('hooks honour once-per-round, per-round caps and once-per-battle limits', () => {
  const hero = unit();
  const state = stateWith([hero]);
  let calls = 0;
  registerHook(hero, PROPRIETARY_HOOKS.ACTION_END, () => { calls++; return { kind: 'extra-action', action: 'attack' }; }, { oncePerRound: true });
  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {});
  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {});
  assert.equal(calls, 1);
  state.round = 2;
  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {});
  assert.equal(calls, 2);

  const second = unit({ id: 2 });
  const capped = stateWith([second]);
  let cappedCalls = 0;
  registerHook(second, PROPRIETARY_HOOKS.ROUND_START, () => { cappedCalls++; }, { maxPerRound: 2, maxPerBattle: 3 });
  for (let index = 0; index < 5; index++) runHooks(capped, PROPRIETARY_HOOKS.ROUND_START, {});
  assert.equal(cappedCalls, 2);
  capped.round = 2;
  for (let index = 0; index < 5; index++) runHooks(capped, PROPRIETARY_HOOKS.ROUND_START, {});
  assert.equal(cappedCalls, 3, 'the battle-wide cap still applies');
});

test('hooks stop recursing instead of re-entering themselves forever', () => {
  const hero = unit();
  const state = stateWith([hero]);
  let depth = 0;
  let maxDepth = 0;
  registerHook(hero, PROPRIETARY_HOOKS.ACTION_END, () => {
    depth++; maxDepth = Math.max(maxDepth, depth);
    runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {});
    depth--;
  });
  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {});
  assert.ok(maxDepth >= 1 && maxDepth <= 5, 'depth guard bounds the recursion, saw ' + maxDepth);
});

test('damage ceilings and proportional shield destruction follow their inputs', () => {
  assert.equal(capDamage(5000, { basis: 'attack', ratio: 1.8 }, { attack: 1000 }), 1800);
  assert.equal(capDamage(120, { basis: 'attack', ratio: 1.8 }, { attack: 1000 }), 120);
  assert.equal(capDamage(5000, { basis: 'max-hp', ratio: 0.5 }, { maxHp: 4000 }), 2000);
  const target = unit({ shield: 300 });
  const events = [];
  assert.equal(destroyShield(target, 0.5, { events }), 150);
  assert.equal(target.shield, 150);
  assert.equal(destroyShield(target, 1), 150);
  assert.equal(target.shield, 0);
  assert.equal(events.length, 1);
});

test('a battle without proprietary declarations keeps its own event stream', () => {
  const battle = simulateBattle({
    attackers: [{ id: 101, role: 2010201, profession: 2, loc: 1, maxHp: 4000, attack: 200, defense: 40, speed: 120, initialEnergy: 0, skills: [] }],
    defenders: [{ id: 201, role: 2010101, profession: 1, loc: 1, maxHp: 4000, attack: 120, defense: 60, speed: 90, initialEnergy: 0, skills: [] }],
    seed: 3, maxRounds: 3
  });
  const proprietary = battle.events.filter(event => String(event.kind).startsWith('proprietary'));
  assert.equal(proprietary.length, 0);
  assert.ok(battle.events.some(event => event.kind === 'battle-end'));
});

test('createProprietaryState keeps configured 天极值 and starts empty otherwise', () => {
  const empty = createProprietaryState({});
  assert.equal(empty.tianji.value, 0);
  assert.equal(empty.tianji.max, null);
  const configured = createProprietaryState({ initialTianji: 4, tianjiMax: 6 });
  assert.deepEqual(configured.tianji, { value: 4, max: 6 });
  const clamped = createProprietaryState({ initialTianji: 9, tianjiMax: 6 });
  assert.equal(clamped.tianji.value, 6);
});
