import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// HeroTable families the draw-support cluster needs. They stay out of
// config/hero-tables.mjs so this task does not widen the shared table set.
//
// DrawProgAward ships with zero rows in this client build, so the reward shape
// of the progress-award command (635) cannot be read from configuration.
const names = ['DrawProgAward', 'DrawExchangeLineup', 'NormalDrawExchangeLineup'];
let cache;

export function readHeroSupportTables() {
  if (cache) return cache;
  cache = readGeneratedDump(readJsonAsset(tableAsset('HeroTable.data.lua.json')), names);
  return cache;
}
