import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('FameHallTable.data.lua.json.gz');
let cached;

// FameHallTable.data.lua rows used by the command subset. Each name mirrors the
// client table exactly; rows that are only used by UI are intentionally absent.
export function readFameHallTables(file = defaultPath) {
  if (file === defaultPath && cached) return cached;
  const raw = readGeneratedTables(file, [
    'Fight', 'DevType', 'DevBadge', 'DevBadgeType', 'DevDropArtifact', 'DevDropType',
    'DevDropChangeHero', 'DevDropHero', 'Hero', 'ResetType', 'Const', 'EndPassAward', 'Difficulty'
  ]);
  const tables = {
    fights: raw.Fight,
    devTypes: raw.DevType,
    devBadges: raw.DevBadge,
    devBadgeTypes: raw.DevBadgeType,
    dropArtifacts: raw.DevDropArtifact,
    dropTypes: raw.DevDropType,
    dropChangeHeroes: raw.DevDropChangeHero,
    dropHeroes: raw.DevDropHero,
    heroes: raw.Hero,
    resetTypes: raw.ResetType,
    constants: raw.Const,
    endPassAwards: raw.EndPassAward,
    difficulties: raw.Difficulty
  };
  if (!tables.constants.size || !tables.difficulties.size) throw new Error('FameHall table configuration is incomplete');
  if (file === defaultPath) cached = tables;
  return tables;
}
