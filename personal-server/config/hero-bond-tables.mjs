import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// HERO-HERO bond cluster (602/654/661/672) configuration.
//
// The shared reader in config/hero-tables.mjs only loads the families the older
// hero services needed. Fetter, Diff and the pendant/school lookups ship in the
// same HeroTable dump but are owned by this cluster, so they are parsed through
// the shared LuaJIT interpreter without touching the shared table list.
//
// Evidence: node "$env:TEMP\fchb_tool.mjs" tbl Fetter Diff StarPendant Pendant
// SchoolChoose SchoolChooseConst (HeroTable.data.lua.json.gz, 2026-11-07).
const defaultPath = tableAsset('HeroTable.data.lua.json');
let defaultCache;

const BOND_TABLES = [
  // Normal (gather) fetters: Fetter owns gather_args/gather_condition plus the
  // special lineup/dragon columns, FetterEffectCondition maps a condition code to
  // the client check function and FetterEffectNormal holds the per-quality bonus.
  'Fetter', 'FetterEffectNormal', 'FetterEffectCondition',
  // Hero diff ("变异"): one row per hero with diff_item/diff_num/skill/attrs.
  'Diff',
  // Star pendants: StarPendant maps hero+star to the selectable pendant parts,
  // Pendant owns unlock_star/part_type and PendantPartType the legal part ids
  // carried in pb_hero_pendant_select.index.
  'Pendant', 'StarPendant', 'PendantPartType',
  // New-player school choice: SchoolChoose rows are keyed by the index the
  // client sends (1..4), SchoolChooseConst.hit gates the draw count.
  'SchoolChoose', 'SchoolChooseConst'
];

export function readHeroBondTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedDump(readJsonAsset(file), BOND_TABLES);
  if (file === defaultPath) defaultCache = tables;
  return tables;
}

export const heroBondTableNames = Object.freeze([...BOND_TABLES]);
