import assert from 'node:assert/strict';
import test from 'node:test';
import { readRecruitHeroExclusionGroups } from '../config/recruit-hero-groups.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import {
  NEW_HERO_EXCLUSIVE_GROUP,
  availableQualityWeights,
  buildRecruitPoolCatalog,
  completedDrawCounts
} from '../game/recruit-pool-rules.mjs';

function heroTables(extraHeroes = []) {
  const heroes = [
    { tid: 1010001, quality: 30, get_way: 32, chip: 21000101 },
    { tid: 1010002, quality: 40, get_way: 33, chip: 21000102 },
    { tid: 1030101, quality: 50, get_way: 32, chip: 21100101 },
    { tid: 1030601, quality: 50, get_way: 32, chip: 21100601 },
    { tid: 1030701, quality: 50, get_way: 32, chip: 21100701 },
    { tid: 1040101, quality: 60, get_way: 32, chip: 21400104 },
    { tid: 4040101, quality: 60, get_way: 32, chip: 24400104 },
    ...extraHeroes
  ];
  return {
    Hero: new Map(heroes.map(hero => [hero.tid, hero])),
    DrawExchangeHero: new Map([
      [1030101, { tid: 1030101, slot_type: 1 }],
      [1040101, { tid: 1040101, slot_type: 2 }]
    ])
  };
}

test('new hero exclusive groups are loaded from the generated client-table manifest', () => {
  const restrictions = readRecruitHeroExclusionGroups();
  const group = restrictions.groups.get(NEW_HERO_EXCLUSIVE_GROUP);
  assert.equal(group.size, 21);
  for (const tid of [1030601, 1030701, 1040101, 4040101, 5040501]) assert.ok(group.has(tid));
  assert.equal(restrictions.source.table, 'NewHeroExclusiveTable.WishDrawHero');
  assert.match(restrictions.source.sourceSha256, /^[0-9a-f]{64}$/);
});

test('standard pools exclude new hero exclusives while the limited library retains them', () => {
  const restrictions = readRecruitHeroExclusionGroups();
  const catalog = buildRecruitPoolCatalog(heroTables(), { excludedHeroGroups: restrictions.groups });
  const exclusiveTids = restrictions.groups.get(NEW_HERO_EXCLUSIVE_GROUP);

  for (const lib of [1, 2, 3]) {
    const pool = catalog.get(lib);
    for (const tid of exclusiveTids) assert.equal(pool.byTid.has(tid), false);
    assert.equal(pool.rule.qualityWeights.some(([quality]) => quality === 60), false);
  }

  const limited = catalog.get(10);
  assert.equal(limited.rule.name, 'new-hero-limit');
  for (const tid of [1030601, 1030701, 1040101, 4040101]) assert.equal(limited.byTid.has(tid), true);
  assert.equal(limited.rule.qualityWeights.some(([quality]) => quality === 60), true);
});

test('wish catalogs retain every client-listed candidate without changing random pools', () => {
  const restrictions = readRecruitHeroExclusionGroups();
  const tables = readHeroTables();
  const catalog = buildRecruitPoolCatalog(tables, { excludedHeroGroups: restrictions.groups });

  const adventure = catalog.get(1);
  for (const tid of [1030601, 3030501, 4030601]) {
    assert.equal(adventure.byTid.has(tid), false);
    assert.equal(adventure.wishByTid.has(tid), true);
  }

  const elite = catalog.get(2);
  assert.equal(elite.byTid.has(2030601), false);
  assert.equal(elite.wishByTid.has(2030601), true);
  assert.equal(elite.wishByTid.has(2040201), true);
  assert.equal(elite.wishByTid.get(2040201).quality, 60);
});

test('a future non-exclusive quality-60 hero automatically restores the declared standard-pool weight', () => {
  const restrictions = readRecruitHeroExclusionGroups();
  const generalUr = { tid: 1099991, quality: 60, get_way: 32, chip: 21999904 };
  const catalog = buildRecruitPoolCatalog(heroTables([generalUr]), { excludedHeroGroups: restrictions.groups });
  const at99 = completedDrawCounts(new Map([[1, { draw_count: 99 }]]));
  const at100 = completedDrawCounts(new Map([[1, { draw_count: 100 }]]));

  for (const lib of [1, 2]) {
    const pool = catalog.get(lib);
    assert.equal(pool.byTid.has(generalUr.tid), true);
    assert.equal(availableQualityWeights(pool.rule, at99).some(([quality]) => quality === 60), false);
    assert.equal(availableQualityWeights(pool.rule, at100).some(([quality]) => quality === 60), true);
  }
});

test('a pool that excludes a hero group fails closed when the group data is absent', () => {
  assert.throws(
    () => buildRecruitPoolCatalog(heroTables()),
    /Recruitment exclusion group is missing or empty: newHeroExclusive/
  );
});
