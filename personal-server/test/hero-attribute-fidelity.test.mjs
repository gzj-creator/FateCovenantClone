import test from 'node:test';
import assert from 'node:assert/strict';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import {
  assembleHeroAttributes, createLineupAttributeCache, FIGHT_ATTR
} from '../game/attribute-service.mjs';
import { buildHeroSkillLoadout } from '../game/hero-skill-loadout.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';

const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const vell = changes => ({
  uid: '4030801', tid: 4030801, level: 1, quality: 50, star: 0,
  star_progress: 0, breakthrough_level: 0, ...changes
});
const assemble = (changes, tables = heroTables) => assembleHeroAttributes({
  hero: vell(changes), heroTables: tables, attributeTables
});

// Independent numeric expectations from HeroAttrCollect._HandleAttrValue and
// HeroDevelopMgr.GetHeroStarAddAttrTid. See fixes/vell-basic-attack-attributes-20261116.md.
test('initial Vell has 245 attack rather than the unrelated camp-4 star tier', () => {
  const result = assemble();
  assert.deepEqual(result.stats, {
    hp: 1530, attack: 245, physicalDefense: 105, magicDefense: 105,
    critRate: 500, critHarm: 15000, speed: 113
  });
  assert.equal(result.power, 408);
});

test('changing only a hero camp cannot change its level/star base attributes', () => {
  const expected = assemble().fightAttrs;
  for (const camp of [1, 2, 3, 4]) {
    const heroes = new Map(heroTables.Hero);
    heroes.set(4030801, { ...heroes.get(4030801), camp });
    assert.deepEqual(assemble({}, { ...heroTables, Hero: heroes }).fightAttrs, expected,
      `camp ${camp} must not select a different StarAddAttr row`);
  }
});

test('star progress selects one cumulative flat row, without its per-step increment twice', () => {
  const first = assemble({ star_progress: 1 });
  assert.equal(first.stats.hp, 3930, '5001 adds 2400 HP once');
  assert.equal(first.stats.attack, 245);
  const second = assemble({ star_progress: 2 });
  assert.equal(second.stats.hp, 3930);
  assert.equal(second.stats.attack, 645, '5002 adds the cumulative 400 attack once');
  const oneStar = assemble({ star: 1 });
  assert.equal(oneStar.stats.hp, 6330, '15000 adds 4800 flat HP');
  assert.equal(oneStar.stats.attack, 1045, '15000 adds 800 flat attack');
  assert.equal(oneStar.stats.physicalDefense, 585);
});

test('hero growth divides by 100 and floors before percentage attributes', () => {
  assert.deepEqual(assemble({ level: 2 }).stats, {
    hp: 1908, attack: 301, physicalDefense: 145, magicDefense: 145,
    critRate: 500, critHarm: 15000, speed: 113
  });
  const tables = {
    ...attributeTables,
    BaseAttrNew: new Map([[403080150, {
      ...attributeTables.BaseAttrNew.get(403080150),
      attack_grow: 199
    }]]),
    HighStarAddAttr: new Map([[403080106, {
      tid: 403080106, hp: 0, attack: 2000, physical_def: 0, magic_def: 0
    }]])
  };
  const fractional = assembleHeroAttributes({
    hero: vell({ level: 2, star: 6 }), heroTables, attributeTables: tables
  });
  // floor((floor(95 + 1.99) + 12800 + 150) * 1.2) = 15655.
  assert.equal(fractional.stats.attack, 15655);
});

test('high-star values enter percentage channels after the single low-star total', () => {
  const result = assemble({ star: 8 });
  assert.equal(result.stats.hp, 120628); // floor((630+76800+900) * 1.54)
  assert.equal(result.stats.attack, 20089); // floor((95+12800+150) * 1.54)
  assert.equal(result.stats.physicalDefense, 10587); // floor((60+7680+45) * 1.36)
  assert.equal(result.stats.magicDefense, 10587);
  const high = result.sources.filter(source => source.play === 'high-star:8');
  assert.equal(high.length, 4);
  assert.ok(high.every(source => source.kind === 'rate'));
});

test('1316 cache reassembles attributes after a star-progress-only change', () => {
  const owned = vell();
  const model = {
    state: { roleId: 1 }, role: { level: 1 },
    heroInfo: { hero_list: [owned] },
    playLineups: [{ type: 1, team_list: [{ team_id: 1, fighter_list: [
      { hero_id: owned.uid, loc: 1 }
    ] }] }]
  };
  const cache = createLineupAttributeCache();
  const options = { model, heroTables, attributeTables };
  const attack = result => Number(result.lineup_attr.attr_list[0].fight_attr_list
    .find(attr => attr.key === FIGHT_ATTR.ATTACK).value);
  assert.equal(attack(cache.get(options)), 245);
  owned.star_progress = 2;
  assert.equal(attack(cache.get(options)), 645);
  assert.equal(cache.stats().computed, 2);
});

test('an initial Vell basic attack stays on the hundreds scale in the real simulator', () => {
  const result = assemble();
  const skills = buildHeroSkillLoadout({ hero: vell(), heroTables }).skills;
  const battle = simulateBattle({
    attackers: [{
      id: 101, role: 4030801, profession: result.profession, camp: result.camp,
      loc: 1, maxHp: result.stats.hp, attack: result.stats.attack,
      defense: result.stats.physicalDefense, speed: result.stats.speed,
      initialEnergy: 0, skills
    }],
    defenders: [{
      id: 201, role: 9002100, profession: 1, loc: 1, maxHp: 100000,
      attack: 1, defense: 0, speed: 1, initialEnergy: 0, skills: []
    }],
    seed: 17, maxRounds: 1
  });
  const damage = battle.events.filter(event => event.kind === 'damage')
    .flatMap(event => event.harms).filter(harm => harm.srcId === 101);
  assert.ok(damage.length > 0);
  assert.ok(damage.every(harm => harm.value >= 100 && harm.value < 500),
    `initial basic-attack damage must not reach 3k: ${JSON.stringify(damage)}`);
});
