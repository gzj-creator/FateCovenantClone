import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
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
    id, role: 2010201, profession: 2, loc: 1, maxHp: 1000,
    attack: 100, defense: 0, speed: id === 101 ? 120 : 90,
    initialEnergy: 0, skills: [], ...overrides
  };
}

function eventsOf(battle, kind) {
  return battle.events.filter(event => event.kind === kind);
}

function damagesAgainst(battle, unitId) {
  return battle.events
    .filter(event => event.kind === 'damage')
    .flatMap(event => event.harms.filter(harm => harm.aimId === unitId).map(harm => ({ id: event.id, ...harm })));
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

test('超凡生命 starts at the described share of max HP and soaks damage before HP', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, { maxHp: 1000, attack: 10, skills: [catalogSkill('354040171')] })],
    defenders: [fighter(201, { maxHp: 100000, attack: 300, speed: 90 })],
    seed: 4, maxRounds: 2
  });
  const superHpEvents = eventsOf(battle, PROPRIETARY_EVENT_KINDS.SUPER_HP);
  assert.equal(superHpEvents[0]?.aimId, 101);
  assert.equal(superHpEvents[0]?.value, 1000, 'super life is 100% of max HP');
  const hits = damagesAgainst(battle, 101);
  assert.ok(hits.length >= 2, 'the defender must hit twice');
  assert.equal(hits[0].oldHp, 1000);
  assert.equal(hits[0].hp, 1000, 'HP is untouched while super life absorbs');
  assert.ok(hits[0].value > 0);
});

test('the guarded summon takes a fatal hit so its owner survives', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, { maxHp: 500, attack: 10, skills: [catalogSkill('354060171')] })],
    defenders: [fighter(201, { maxHp: 100000, attack: 5000, speed: 200 })],
    seed: 5, maxRounds: 2
  });
  const summons = eventsOf(battle, PROPRIETARY_EVENT_KINDS.SUMMON);
  assert.ok(summons.some(event => event.aimId === 101 && event.absorbed > 0), 'the summon absorbs the hit');
  const firstHit = damagesAgainst(battle, 101)[0];
  assert.equal(firstHit.hp, 500, 'the owner keeps its HP when the summon takes the hit');
  // The same hit is over 100% of the summon's life, so it leaves right after
  // absorbing; the described limit is cumulative, not per hit.
  assert.ok(summons.some(event => event.left === true));
});

test('a described shield-destruction clause removes its share before the damage', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      attack: 100, initialEnergy: 1000, activeAbilityId: 2404030123,
      skills: [catalogSkill('2404030123')]
    })],
    defenders: [fighter(201, {
      maxHp: 100000, attack: 10, speed: 90, initialEnergy: 0, skills: [openingShield(2000)]
    })],
    seed: 6, maxRounds: 1
  });
  const destroyed = eventsOf(battle, PROPRIETARY_EVENT_KINDS.SHIELD_DESTROYED)
    .filter(event => event.srcId === 101);
  assert.equal(destroyed.length, 1);
  assert.equal(destroyed[0].ratio, 0.5);
});

test('a pre-ultimate shield-destruction mastery removes the described share', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      attack: 50, initialEnergy: 1000, activeAbilityId: 2404030123,
      skills: [catalogSkill('2404030123'), catalogSkill('354010174')]
    })],
    defenders: [fighter(201, { maxHp: 100000, attack: 10, speed: 90, skills: [openingShield(2000)] })],
    seed: 7, maxRounds: 1
  });
  const ratios = eventsOf(battle, PROPRIETARY_EVENT_KINDS.SHIELD_DESTROYED).map(event => event.ratio);
  assert.ok(ratios.includes(0.15), 'the pre-ultimate mastery clause runs');
  assert.ok(ratios.includes(0.5), 'the skill clause runs');
});

test('a per-target damage ceiling caps the extra true damage at the described attack share', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      attack: 100, initialEnergy: 1000, activeAbilityId: 2504030123,
      skills: [catalogSkill('2504030123')], behavior: 'striker'
    })],
    defenders: [fighter(201, { maxHp: 1000000, attack: 10, defense: 0, speed: 90, skills: [] })],
    seed: 8, maxRounds: 1
  });
  const actions = battle.events.filter(event => event.kind === 'damage' && event.harms.some(harm => harm.srcId === 101));
  const second = actions[1];
  assert.ok(second, 'the ultimate has an extra hit');
  const capped = second.harms.find(harm => harm.srcId === 101);
  // 15% of a 1,000,000 HP target is far above 100% of the attacker's attack.
  assert.equal(capped.value, 100);
});
