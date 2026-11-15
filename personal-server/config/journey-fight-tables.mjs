import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

let cached;
export function readJourneyFightTables() {
  return cached ??= readGeneratedTables(tableAsset('JourneyFightTable.data.json.gz'), ['Fight', 'Team', 'Fighter', 'AttrAbility']);
}
