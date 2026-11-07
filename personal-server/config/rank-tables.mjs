import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('RankTable.data.lua.json');
let cached;

// RankTable.lua assigns these public constants before installing the generated
// RankTable.data.lua rows. Keeping the names here prevents protocol rank IDs
// from being scattered as unexplained numbers through the rank service.
export const RANK_IDS = Object.freeze({
  ARENA: 1,
  PEAK_TOWER: 2,
  POWER: 3,
  ROLE_LEVEL: 10,
  RELIC_POWER: 14,
  TIME_TEMPLE_STAR: 16,
  ELITE_MISSION: 18,
  TREASURE_HUNT: 19,
  MISSION: 31,
  HERO_STAR_COUNT: 44,
  EQUIP: 45,
  RELIC: 46,
  ARTIFACT_STAR: 47,
  SWAP_ARENA: 53,
  HERO_DEV: 97,
  CROSS_PEAK_TOWER: 108,
  PET_SCORE: 115,
  TREASURE_SCORE: 119
});

export function readRankTables(file = defaultPath) {
  if (file === defaultPath && cached) return cached;
  const raw = readGeneratedTables(file, ['Bubble', 'Group', 'TypeConfig', 'Config', 'MainTag']);
  const tables = {
    bubbles: raw.Bubble,
    groups: raw.Group,
    typeConfigs: raw.TypeConfig,
    configs: raw.Config,
    mainTags: raw.MainTag,
    counts: Object.freeze({
      bubbles: raw.Bubble.size,
      groups: raw.Group.size,
      typeConfigs: raw.TypeConfig.size,
      configs: raw.Config.size,
      mainTags: raw.MainTag.size
    }),
    ids: RANK_IDS
  };
  // These counts come from the shipped RankTable.data.lua dump. Truncated or
  // mismatched configuration must fail startup instead of silently serving a
  // partial leaderboard catalogue.
  if (tables.counts.bubbles !== 1 || tables.counts.groups !== 9
      || tables.counts.typeConfigs !== 284 || tables.counts.configs !== 312
      || tables.counts.mainTags !== 97) {
    throw new Error('RankTable row counts do not match the captured client configuration');
  }
  for (const value of Object.values(RANK_IDS)) {
    if (!tables.configs.has(value)) throw new Error(`RankTable Config is missing rank ${value}`);
  }
  if (file === defaultPath) cached = tables;
  return tables;
}
