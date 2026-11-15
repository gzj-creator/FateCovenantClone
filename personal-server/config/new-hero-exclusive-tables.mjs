import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('NewHeroExclusiveTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze([
  'HeroLegendStyle', 'HeroExclusiveEntry', 'PopCustom', 'Decorate', 'WishDrawShowBubble',
  'GiftRecommend', 'Gift', 'GiftRelease', 'HeroExclusiveShopVersion', 'Version',
  'StoryAward', 'WishDrawHero', 'WishDraw'
]);

const EXPECTED_COUNTS = Object.freeze({
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
});

// CONST_STORY_DELTA = 1000 and CONST_TYPE_STORY_DELTA = 100 are defined in the
// NewHeroExclusiveMgr root chunk (prototype 101). The story claim state is a
// BitBlock over (story_award_tid % CONST_STORY_DELTA); the client request sends
// (tid % CONST_TYPE_STORY_DELTA, tid, floor(tid / CONST_TYPE_STORY_DELTA) % 10).
export const STORY_DELTA = 1000;
export const TYPE_STORY_DELTA = 100;

export const NEW_HERO_EXCLUSIVE_BLOCKERS = Object.freeze([
  'The three commands are ETF without a declared request schema; field names are not recovered',
  '88967 has no LineupAward table family and no client consumer, so its award rows are unknown',
  'Story award day/fight unlock producer is not recovered; StoryAward.fight is 0 on 194 of 197 rows',
  'Login module slots for pb_new_hero_exclusive_{story,draw,gift}_all are not mapped',
  'Activity instance (act id, version, occurrence) binding for each exclusive version is not mapped'
]);

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid NewHeroExclusive ${label}: ${value}`);
  }
  return number;
}

function freezeFamily(table, name) {
  if (!(table instanceof Map)) throw new Error(`NewHeroExclusive ${name} is missing`);
  if (table.size !== EXPECTED_COUNTS[name]) {
    throw new Error(`NewHeroExclusive ${name} has ${table.size} rows; expected ${EXPECTED_COUNTS[name]}`);
  }
  const rows = new Map();
  for (const [key, value] of table) {
    const tid = integer(value?.tid ?? key, `${name}.tid`, { min: 1 });
    if (rows.has(tid)) throw new Error(`NewHeroExclusive ${name} has duplicate tid ${tid}`);
    rows.set(tid, Object.freeze({ ...value, tid }));
  }
  return rows;
}

export function readNewHeroExclusiveTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const raw = readGeneratedTables(file, FAMILIES);
  const rows = {};
  for (const name of FAMILIES) rows[name] = freezeFamily(raw[name], name);

  for (const row of rows.Version.values()) {
    const wishDrawVersion = integer(row.wish_draw_version, `Version.${row.tid}.wish_draw_version`, { min: 1 });
    if (!rows.WishDraw.has(wishDrawVersion)) {
      throw new Error(`Version.${row.tid} references unknown WishDraw ${wishDrawVersion}`);
    }
    integer(row.shop_version, `Version.${row.tid}.shop_version`, { min: 0 });
    integer(row.gift_version, `Version.${row.tid}.gift_version`, { min: 0 });
    integer(row.decorate_version, `Version.${row.tid}.decorate_version`, { min: 0 });
    if (typeof row.is_mass !== 'boolean' || typeof row.is_sp !== 'boolean') {
      throw new Error(`Version.${row.tid} lost its is_mass/is_sp booleans`);
    }
  }

  for (const row of rows.WishDraw.values()) {
    if (!Array.isArray(row.hero)) throw new Error(`WishDraw.${row.tid}.hero is not a list`);
    for (const heroTid of row.hero) {
      if (!rows.WishDrawHero.has(integer(heroTid, `WishDraw.${row.tid}.hero`, { min: 1 }))) {
        throw new Error(`WishDraw.${row.tid} references unknown WishDrawHero ${heroTid}`);
      }
    }
  }

  for (const row of rows.WishDrawHero.values()) {
    integer(row.hero, `WishDrawHero.${row.tid}.hero`, { min: 1 });
  }

  const storyBits = new Map();
  for (const row of rows.StoryAward.values()) {
    const group = integer(row.group_version, `StoryAward.${row.tid}.group_version`, { min: 1 });
    const bit = row.tid % STORY_DELTA;
    if (!Number.isSafeInteger(bit) || bit < 1) {
      throw new Error(`StoryAward.${row.tid} has no usable bit index`);
    }
    const seen = storyBits.get(group) ?? new Set();
    if (seen.has(bit)) throw new Error(`StoryAward group ${group} reuses bit index ${bit}`);
    seen.add(bit);
    storyBits.set(group, seen);
    if (!Array.isArray(row.award)) throw new Error(`StoryAward.${row.tid}.award is not a list`);
    for (const entry of row.award) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new Error(`StoryAward.${row.tid}.award entries must be [item, count]`);
      }
      integer(entry[0], `StoryAward.${row.tid}.award.item`, { min: 1 });
      integer(entry[1], `StoryAward.${row.tid}.award.count`, { min: 1 });
    }
    integer(row.fight, `StoryAward.${row.tid}.fight`, { min: 0 });
  }

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '2745016975394251000-NewHeroExclusiveTable.data.lua.bin',
      sha256: 'F384FCD255E1E382485B7FB46E6594C43A3081DA3D71E335798828410EACDC30'
    }),
    counts: EXPECTED_COUNTS,
    rows,
    gameplayReady: false,
    gameplayBlockers: NEW_HERO_EXCLUSIVE_BLOCKERS,
    version(tid) { return rows.Version.get(Number(tid)) ?? null; },
    // 88963 candidate set: Version[v].wish_draw_version -> WishDraw.hero[] -> WishDrawHero.
    drawCandidates(versionTid) {
      const version = rows.Version.get(Number(versionTid));
      if (!version) return null;
      const wishDraw = rows.WishDraw.get(version.wish_draw_version);
      if (!wishDraw) return null;
      return Object.freeze(wishDraw.hero.map(tid => rows.WishDrawHero.get(tid)).filter(Boolean));
    },
    // 88964 story award group for a version.
    storyAwardGroup(versionTid) {
      const version = rows.Version.get(Number(versionTid));
      if (!version) return null;
      return [...rows.StoryAward.values()].filter(row => row.group_version === version.wish_draw_version);
    },
    storyAwardBitIndex(tid) { return Number(tid) % STORY_DELTA; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export { EXPECTED_COUNTS, FAMILIES };
