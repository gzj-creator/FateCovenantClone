import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NEW_HERO_EXCLUSIVE_BLOCKERS,
  STORY_DELTA,
  TYPE_STORY_DELTA,
  readNewHeroExclusiveTables
} from '../config/new-hero-exclusive-tables.mjs';

const tables = readNewHeroExclusiveTables();

test('NewHeroExclusiveTable keeps all thirteen original families', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(tables.rows).map(([name, rows]) => [name, rows.size])),
    {
      HeroLegendStyle: 22,
      HeroExclusiveEntry: 390,
      PopCustom: 6,
      Decorate: 75,
      WishDrawShowBubble: 6,
      GiftRecommend: 54,
      Gift: 9,
      GiftRelease: 140,
      HeroExclusiveShopVersion: 63,
      Version: 75,
      StoryAward: 197,
      WishDrawHero: 42,
      WishDraw: 69
    }
  );
  assert.equal(tables.source.sha256, 'F384FCD255E1E382485B7FB46E6594C43A3081DA3D71E335798828410EACDC30');
});

test('88963 candidate set derives from Version to WishDraw to WishDrawHero', () => {
  assert.deepEqual(tables.drawCandidates(1).map(row => [row.tid, row.hero]), [[1, 4030601]]);
  assert.deepEqual(tables.drawCandidates(26).map(row => row.tid), [10, 9]);
  assert.deepEqual(tables.drawCandidates(26).map(row => row.hero), [1030601, tables.rows.WishDrawHero.get(9).hero]);
  assert.equal(tables.drawCandidates(24), null);
  assert.equal(tables.drawCandidates(999), null);
});

test('88964 story award group and bit index follow the original constants', () => {
  assert.equal(STORY_DELTA, 1000);
  assert.equal(TYPE_STORY_DELTA, 100);
  const group1 = tables.storyAwardGroup(1);
  assert.equal(group1.length, 7);
  assert.deepEqual(group1.map(row => row.tid), [1001, 1002, 1003, 1004, 1005, 1006, 1007]);
  assert.deepEqual(group1[0].award, [[101500, 200]]);
  assert.equal(tables.storyAwardBitIndex(1001), 1);
  assert.equal(tables.storyAwardBitIndex(1007), 7);
  // Group 26 ships two waves; the 1000-wide delta keeps their bit indices apart.
  assert.equal(tables.storyAwardBitIndex(26001), 1);
  assert.equal(tables.storyAwardBitIndex(26101), 101);
  assert.equal(tables.storyAwardBitIndex(26105), 105);
});

test('88967 has no lineup award family in the shipped table', () => {
  assert.equal(Object.hasOwn(tables.rows, 'LineupAward'), false);
  assert.deepEqual(Object.keys(tables.rows).filter(name => /lineup/i.test(name)), []);
});

test('NewHeroExclusive config stays explicitly unsafe for gameplay completion', () => {
  assert.equal(tables.gameplayReady, false);
  assert.equal(tables.gameplayBlockers, NEW_HERO_EXCLUSIVE_BLOCKERS);
  assert.equal(tables.gameplayBlockers.length, 5);
  assert.match(tables.gameplayBlockers[0], /ETF without a declared request schema/);
  assert.match(tables.gameplayBlockers[1], /no LineupAward table family/);
  assert.match(tables.gameplayBlockers[2], /194 of 197/);
});

test('NewHeroExclusive version and story lookups stay unknown for missing ids', () => {
  assert.equal(tables.version(24), null);
  assert.equal(tables.version(999), null);
  assert.equal(tables.storyAwardGroup(24), null);
  assert.deepEqual(tables.storyAwardGroup(2), []);
});
