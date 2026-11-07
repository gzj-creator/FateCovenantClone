import test from 'node:test';
import assert from 'node:assert/strict';
import { GameError } from '../game/hero-progression.mjs';
import {
  abilityLevelRow,
  breakthroughPassiveIds,
  buildHeroSkillLoadout
} from '../game/hero-skill-loadout.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { loadSkillDatabase, registerPassiveTriggers, resolveActionSkill } from '../game/effects/skill-integration.mjs';

const heroTables = readHeroTables();

function hero(tid, overrides = {}) {
  return {
    uid: String(tid),
    tid,
    level: 1,
    star: 1,
    star_progress: 0,
    breakthrough_level: 0,
    mastery_level: 0,
    mastery_break: 0,
    rare: false,
    ...overrides
  };
}

test('ability level uses persisted quality and star instead of catalog literals', () => {
  assert.deepEqual(abilityLevelRow(hero(2010101), heroTables), {
    key: 3001, quality: 30, star: 1,
    levels: heroTables.AbilityLevel.get(3001).level
  });
  assert.equal(abilityLevelRow(hero(2020601), heroTables).levels[1], 2);
  assert.equal(abilityLevelRow(hero(2020601), heroTables).key, 4001);
});

test('breakthrough passives are selected only through the reached milestone', () => {
  const locked = breakthroughPassiveIds(hero(2010101), heroTables);
  const opened = breakthroughPassiveIds(hero(2010101, { breakthrough_level: 5 }), heroTables);
  assert.deepEqual(locked, []);
  assert.ok(opened.includes(120001001));
  assert.ok(opened.includes(120000001));
  assert.ok(opened.includes(120000009));
  assert.ok(!opened.includes(120000006));
});

test('same hero exposes different raw slots as growth advances without losing catalog passives', () => {
  const early = buildHeroSkillLoadout({
    hero: hero(2010101), heroTables
  });
  const developed = buildHeroSkillLoadout({
    hero: hero(2010101, { star: 6, breakthrough_level: 5 }),
    heroTables
  });
  assert.deepEqual(early.abilityIds, [1201010101, 2201010111, 3201010111]);
  assert.ok(developed.abilityIds.length > early.abilityIds.length);
  assert.ok(early.catalogSkillIds.includes('120001001'));
  assert.ok(developed.catalogSkillIds.includes('120001001'));
  assert.ok(developed.catalogSkillIds.includes('120000009'));
});

test('mastery uses only the configured ability id and reports its star unlock separately', () => {
  const locked = buildHeroSkillLoadout({ hero: hero(2010101, { star: 9 }), heroTables });
  const unlocked = buildHeroSkillLoadout({
    hero: hero(2010101, { star: 10, mastery_level: 7, mastery_break: 1 }),
    heroTables
  });
  assert.ok(!locked.catalogSkillIds.includes('321010171'));
  assert.equal(locked.mastery.unlocked, false);
  assert.ok(!locked.abilityIds.includes(321010171));
  const selected = unlocked.skills.find(skill => skill.id === '321010171');
  assert.ok(selected, 'mastery_ability 321010171 must be selected');
  assert.equal(selected.skillSource, 'mastery-selection');
  assert.equal(selected.level, 7);
  assert.equal(unlocked.catalogSkillIds.filter(id => String(id).startsWith('32101017')).length, 1,
    'only the configured mastery must be active, not all five catalog candidates');
});

test('rare soul ability replaces the ordinary active definition without duplication', () => {
  const ordinary = buildHeroSkillLoadout({
    hero: hero(1040301, { star: 5, quality: 60 }), heroTables
  });
  const rare = buildHeroSkillLoadout({
    hero: hero(1040301, { star: 5, quality: 60, rare: true }), heroTables
  });
  assert.ok(!ordinary.catalogSkillIds.includes('2104030123'));
  assert.ok(rare.catalogSkillIds.includes('2104030123'));
  assert.equal(rare.skills.filter(skill => skill.type === 'Ultimate').length, 1);
  assert.deepEqual(rare.replacement, { to: 2104030123 });
  assert.equal(rare.abilityIds[1], 2104030123);
});

test('battle simulation honors a caller-supplied filtered skill list', () => {
  const full = buildHeroSkillLoadout({ hero: hero(2010101), heroTables });
  const withoutDoubleAttack = {
    ...full,
    skills: full.skills.filter(skill => skill.id !== '120001001')
  };
  const battle = loadout => simulateBattle({
    attackers: [{
      id: 101, role: 2010101, profession: 1, loc: 1, abilityId: 1201010101,
      activeAbilityId: 2201010111, maxHp: 8000, attack: 100, defense: 0,
      speed: 120, initialEnergy: 0, skills: loadout.skills
    }],
    defenders: [{
      id: 201, role: 9002100, profession: 2, loc: 1, abilityId: 1,
      activeAbilityId: 1, maxHp: 100000, attack: 1, defense: 0,
      speed: 1, initialEnergy: 0
    }],
    seed: 77,
    maxRounds: 1
  });
  const withoutDoubleAttackBattle = battle(withoutDoubleAttack);
  const withDoubleAttackBattle = battle(full);
  assert.ok(!withoutDoubleAttackBattle.events.some(event => event.triggerType === 'on-attack'
    && String(event.trigger).startsWith('120001001_')));
  assert.ok(withDoubleAttackBattle.events.some(event => event.triggerType === 'on-attack'
    && String(event.trigger).startsWith('120001001_')));
});

test('missing authoritative skill configuration is a business error', () => {
  assert.throws(() => buildHeroSkillLoadout({
    hero: hero(9000100), heroTables
  }), error => error instanceof GameError && error.code === 5);
  assert.throws(() => buildHeroSkillLoadout({
    hero: hero(2010101, { quality: 99 }), heroTables
  }), error => error instanceof GameError && error.code === 5);
});

test('an empty authoritative skill list disables catalog actions and passive registration', () => {
  const skillDatabase = loadSkillDatabase();
  for (const role of [2010101, 1040301]) {
    const unit = { id: 101, role, skills: [] };
    registerPassiveTriggers(unit, skillDatabase, {});
    assert.deepEqual(unit.triggers, []);
    assert.equal(resolveActionSkill(unit, false, skillDatabase), null);
    assert.equal(resolveActionSkill(unit, true, skillDatabase), null);

    const legacy = { id: 101, role };
    registerPassiveTriggers(legacy, skillDatabase, {});
    assert.ok(legacy.triggers.length > 0);
    assert.ok(resolveActionSkill(legacy, false, skillDatabase));
  }
});

test('an empty authoritative skill list never reactivates mastery in the battle simulation', () => {
  const result = simulateBattle({
    attackers: [{
      id: 101, role: 2010101, profession: 1, loc: 1, maxHp: 8000,
      attack: 100, defense: 0, speed: 120, initialEnergy: 0, skills: []
    }],
    defenders: [{
      id: 201, role: 9002100, profession: 2, loc: 1, maxHp: 100000,
      attack: 1, defense: 0, speed: 1, initialEnergy: 0
    }],
    seed: 77,
    maxRounds: 1
  });
  assert.ok(!result.events.some(event => event.trigger));
});
