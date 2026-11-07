import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLE_RESULT,
  FIGHT_ATTR,
  FIGHT_ENERGY_GAIN,
  FIGHT_ENERGY_MAX,
  FIGHT_INITIAL_ENERGY,
  battleBehaviorFor,
  simulateBattle
} from '../game/battle-engine.mjs';

function unit(id, role, profession, overrides = {}) {
  return {
    id,
    role,
    profession,
    loc: id,
    abilityId: role,
    activeAbilityId: role + 1000000000,
    maxHp: 2400,
    attack: 180,
    defense: 45,
    speed: 90,
    initialEnergy: 0,
    ...overrides
  };
}

test('the shipped starting heroes select four distinct combat behaviors', () => {
  assert.equal(battleBehaviorFor(unit(1, 2010101, 1)), 'guardian');
  assert.equal(battleBehaviorFor(unit(2, 2010201, 1)), 'breaker');
  assert.equal(battleBehaviorFor(unit(3, 1020601, 4)), 'hunter');
  assert.equal(battleBehaviorFor(unit(4, 2020601, 2)), 'shadow-calamus');
});

test('charging a full skill produces archetype-specific targets and effects', () => {
  const attackers = [
    unit(1, 2010101, 1, { speed: 90, initialEnergy: FIGHT_ENERGY_MAX }),
    unit(2, 2010201, 1, { speed: 95, initialEnergy: FIGHT_ENERGY_MAX }),
    unit(3, 1020601, 4, { speed: 80, initialEnergy: FIGHT_ENERGY_MAX }),
    unit(4, 2020601, 2, { speed: 85, initialEnergy: FIGHT_ENERGY_MAX })
  ];
  const defenders = [
    unit(201, 9002100, 2, { loc: 1, attack: 1, maxHp: 8000 }),
    unit(202, 9002600, 4, { loc: 2, attack: 1, maxHp: 8000 })
  ];
  const battle = simulateBattle({ attackers, defenders, seed: 7, maxRounds: 1 });
  const starts = battle.events.filter(event => event.kind === 'action-start');
  // 120001001 (双重攻击) repeats the round-one action as a real extra action, so
  // the shape checks below read each actor's first action of the battle.
  const firstStarts = starts.filter((event, index) => starts
    .findIndex(candidate => candidate.srcId === event.srcId) === index);
  const byActor = new Map(firstStarts.map(event => [event.srcId, event]));
  const attackerStarts = firstStarts.filter(event => attackers.some(actor => actor.id === event.srcId));

  assert.deepEqual(byActor.get(1).aimList.slice(0, 1), [201]);
  assert.deepEqual(byActor.get(2).aimList, [201]);
  assert.deepEqual([...byActor.get(3).aimList], [201, 202]);
  assert.deepEqual([...byActor.get(4).aimList], [201]);
  assert.ok(attackerStarts.every(event => event.actionType === 2));
  assert.equal(byActor.get(1).abilityId, 2010101 + 1000000000);
  assert.equal(byActor.get(2).abilityId, 2010201 + 1000000000);
  assert.deepEqual([...byActor.get(1).assistIds], [2]);
  assert.deepEqual([...byActor.get(2).assistIds], [1]);
  assert.deepEqual([...byActor.get(3).assistIds], []);
  assert.deepEqual([...byActor.get(4).assistIds], []);
  const repeats = starts.filter(event => event.srcId === 1);
  assert.equal(repeats.length, 2, '双重攻击 repeats the first-round action of role 2010101');
  assert.equal(repeats[1].actionType, repeats[0].actionType);
  const angerSyncs = battle.events.filter(event => event.kind === 'anger-sync');
  assert.equal(angerSyncs.length, starts.length);
  for (const start of attackerStarts) {
    const syncIndex = battle.events.findIndex(event => event.kind === 'anger-sync' && event.id === start.id);
    const endIndex = battle.events.findIndex(event => event.kind === 'action-end' && event.id === start.id);
    assert.ok(syncIndex > battle.events.indexOf(start));
    assert.ok(syncIndex < endIndex);
    const sync = battle.events[syncIndex];
    // The active skill consumes the full meter first. Role 2010101's passive
    // then grants 200 energy (with another 25-energy passive also equipped).
    assert.ok(sync.attrList.some(attr => attr.aimId === start.srcId
      && attr.attrType === FIGHT_ATTR.ANGER
      && (start.srcId !== 1 || attr.attrValue === 225)));
    assert.ok(sync.attrList.every(attr => attr.attrType === FIGHT_ATTR.ANGER && attr.attrValue >= 0 && attr.attrValue <= FIGHT_ENERGY_MAX));
  }
  const guardianAction = byActor.get(1).id;
  assert.ok(battle.events.some(event => event.kind === 'shield' && event.id === guardianAction));
  assert.equal(battle.result, BATTLE_RESULT.DRAW);
});

test('Grace\'s active skill hits the whole enemy front row and skips the back row', () => {
  const attackers = [
    unit(3, 1020601, 4, { speed: 120, initialEnergy: FIGHT_ENERGY_MAX, attack: 100 })
  ];
  const defenders = [
    unit(201, 9002100, 2, { loc: 1, speed: 1, attack: 1, maxHp: 8000 }),
    unit(202, 9002200, 2, { loc: 2, speed: 1, attack: 1, maxHp: 8000 }),
    unit(203, 9002300, 2, { loc: 3, speed: 1, attack: 1, maxHp: 8000 }),
    unit(204, 9002400, 2, { loc: 4, speed: 1, attack: 1, maxHp: 8000 }),
    unit(205, 9002500, 2, { loc: 5, speed: 1, attack: 1, maxHp: 8000 })
  ];
  const battle = simulateBattle({ attackers, defenders, seed: 17, maxRounds: 1 });
  const grace = battle.events.find(event => event.kind === 'action-start' && event.srcId === 3);
  const damage = battle.events.find(event => event.kind === 'damage' && event.id === grace.id);

  assert.deepEqual(grace.aimList, [201, 202, 203]);
  assert.deepEqual(damage.harms.map(harm => harm.aimId), [201, 202, 203]);
  assert.ok(damage.harms.every(harm => harm.hp < harm.oldHp));
  assert.deepEqual(battle.defenders.filter(unit => unit.id >= 204).map(unit => unit.hp), [8000, 8000]);
});

test('Calamus\' active skill is single-target and continues after each kill', () => {
  const attackers = [
    unit(4, 2020601, 2, { speed: 120, initialEnergy: FIGHT_ENERGY_MAX, attack: 4000 })
  ];
  const defenders = [
    unit(201, 9002100, 2, { loc: 1, speed: 1, attack: 1, maxHp: 500 }),
    unit(202, 9002200, 2, { loc: 2, speed: 1, attack: 1, maxHp: 500 }),
    unit(203, 9002300, 2, { loc: 3, speed: 1, attack: 1, maxHp: 500 })
  ];
  const battle = simulateBattle({ attackers, defenders, seed: 23, maxRounds: 1 });
  const starts = battle.events.filter(event => event.kind === 'action-start' && event.srcId === 4);
  const damages = battle.events.filter(event => event.kind === 'damage' && starts.some(start => start.id === event.id));

  assert.deepEqual(starts.map(event => event.aimList), [[201], [202], [203]]);
  assert.deepEqual(damages.map(event => event.harms.map(harm => harm.aimId)), [[201], [202], [203]]);
  assert.equal(new Set(starts.map(event => event.id)).size, 3);
  assert.equal(starts.every(event => event.actionType === 2), true);
  assert.equal(battle.result, BATTLE_RESULT.WIN);
});

test('Calamus\' active skill stops after a non-lethal single hit', () => {
  const attackers = [
    unit(4, 2020601, 2, { speed: 120, initialEnergy: FIGHT_ENERGY_MAX, attack: 180 })
  ];
  const defenders = [
    unit(201, 9002100, 2, { loc: 1, speed: 1, attack: 1, maxHp: 8000 }),
    unit(202, 9002200, 2, { loc: 2, speed: 1, attack: 1, maxHp: 8000 })
  ];
  const battle = simulateBattle({ attackers, defenders, seed: 29, maxRounds: 1 });
  const starts = battle.events.filter(event => event.kind === 'action-start' && event.srcId === 4);
  const damages = battle.events.filter(event => event.kind === 'damage' && event.id === starts[0].id);

  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].aimList, [201]);
  assert.deepEqual(damages[0].harms.map(harm => harm.aimId), [201]);
  assert.equal(battle.result, BATTLE_RESULT.DRAW);
});

test('the shipped 500 initial anger reaches 1000 after basic and passive energy gains', () => {
  const attackers = [unit(1, 2010101, 1, { speed: 120, maxHp: 10000, attack: 1, initialEnergy: FIGHT_INITIAL_ENERGY })];
  const defenders = [unit(201, 9002100, 1, { speed: 1, maxHp: 100000, attack: 1, defense: 0 })];
  const battle = simulateBattle({ attackers, defenders, seed: 11, maxRounds: 3 });
  const starts = battle.events.filter(event => event.kind === 'action-start' && event.srcId === 1);

  // Round one repeats the normal attack through the 双重攻击 extra action, so
  // the meter stays empty for one more action before the ultimate lands.
  assert.deepEqual(starts.map(event => event.actionType), [1, 1, 2, 1]);
  const angerAtEnd = battle.events
    .filter(event => event.kind === 'anger-sync' && event.id === starts[0].id)
    .flatMap(event => event.attrList)
    .filter(attr => attr.aimId === 1);
  assert.equal(angerAtEnd[0].attrValue,
    FIGHT_INITIAL_ENERGY + FIGHT_ENERGY_GAIN + 200 + 25);
});

test('a dead defender with revive is not considered defeated until the revive is consumed', () => {
  const attackers = [unit(1, 1, 3, { maxHp: 10000, attack: 4000, speed: 120 })];
  const defenders = [unit(201, 9002100, 1, { maxHp: 500, attack: 1, reviveOnce: true, reviveHpRatio: 0.2 })];
  const battle = simulateBattle({ attackers, defenders, seed: 3, maxRounds: 3 });

  const deaths = battle.events.filter(event => event.kind === 'death' && event.aimId === 201);
  const revives = battle.events.filter(event => event.kind === 'revive' && event.aimId === 201);
  assert.equal(deaths.length, 2);
  assert.equal(revives.length, 1);
  assert.ok(deaths[0].id <= revives[0].id);
  assert.ok(revives[0].id < deaths[1].id);
  const reviveIndex = battle.events.indexOf(revives[0]);
  const actionEndIndex = battle.events.findIndex(event => event.kind === 'action-end' && event.id === revives[0].id);
  assert.ok(reviveIndex < actionEndIndex);
  assert.equal(battle.result, BATTLE_RESULT.WIN);
  assert.deepEqual(battle.pendingRevives, []);
  assert.equal(battle.events.at(-1).kind, 'battle-end');
  assert.equal(battle.events.at(-1).result, BATTLE_RESULT.WIN);
});

test('simulation is deterministic and cannot end while defenders remain alive', () => {
  const attackers = [unit(1, 2010101, 1), unit(2, 2020601, 2, { speed: 100 })];
  const defenders = [unit(201, 9002100, 1, { attack: 1, maxHp: 20000 })];
  const one = simulateBattle({ attackers, defenders, seed: 99, maxRounds: 2 });
  const two = simulateBattle({ attackers, defenders, seed: 99, maxRounds: 2 });

  assert.deepEqual(one, two);
  assert.equal(one.result, BATTLE_RESULT.DRAW);
  assert.ok(one.defenders[0].alive);
  assert.equal(one.events.at(-1).kind, 'battle-end');
  assert.equal(one.events.at(-1).result, BATTLE_RESULT.DRAW);
});
