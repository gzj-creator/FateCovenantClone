import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('WorldBossTable.data.lua.json.gz');
let cached;

// WorldBossTable.data.lua rows. The gz asset stores the LuaJIT prototype dump
// so readGeneratedTables can recover the exact shipped rows without guesses.
export function readWorldBossTables(file = defaultPath) {
  if (file === defaultPath && cached) return cached;
  const raw = readGeneratedTables(file, [
    'Const', 'Kill', 'Damage', 'Rank', 'WorldBoss', 'Achievement', 'Skill', 'Stage'
  ]);
  const tables = {
    constants: raw.Const,
    kills: raw.Kill,
    damages: raw.Damage,
    ranks: raw.Rank,
    bosses: raw.WorldBoss,
    achievements: raw.Achievement,
    skills: raw.Skill,
    stages: raw.Stage
  };
  if (!tables.constants.size || !tables.bosses.size) throw new Error('WorldBoss table configuration is incomplete');
  if (file === defaultPath) cached = tables;
  return tables;
}
