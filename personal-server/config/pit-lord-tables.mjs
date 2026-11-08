import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('PitLordTable.data.lua.json.gz');
let cached;

// PitLordTable is the shipped client table (PitLordTable.data.lua); the JSON
// asset is a prototype dump produced by tools/dump-table-prototypes.mjs.
export function readPitLordTables(file = defaultPath) {
  if (file === defaultPath && cached) return cached;
  const raw = readGeneratedTables(file, ['Const', 'Period', 'RankGroup', 'Rank', 'PitLord', 'Level', 'ProgressAward']);
  const tables = {
    constants: raw.Const,
    periods: raw.Period,
    rankGroups: raw.RankGroup,
    ranks: raw.Rank,
    lords: raw.PitLord,
    levels: raw.Level,
    progressAwards: raw.ProgressAward
  };
  if (!tables.constants.size || !tables.levels.size || !tables.ranks.size) {
    throw new Error('PitLord table configuration is incomplete');
  }
  if (file === defaultPath) cached = tables;
  return tables;
}
