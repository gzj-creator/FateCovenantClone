import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// HeroTable families the rent/share commands need. They are kept out of
// config/hero-tables.mjs so this task does not widen the shared table set.
const names = ['Rent', 'RentRule', 'Cell', 'Develop', 'DevelopInfoShare'];
let cache;

export function readHeroRentTables() {
  if (cache) return cache;
  cache = readGeneratedDump(readJsonAsset(tableAsset('HeroTable.data.lua.json')), names);
  return cache;
}
