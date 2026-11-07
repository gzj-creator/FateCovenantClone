import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// HERO-HERO develop cluster (637/641/656/666) configuration.
//
// The shared reader in config/hero-tables.mjs owns the upgrade/star/quality
// families. Two tables that only this cluster reads ship in the same
// HeroTable dump, so they are parsed here through the shared LuaJIT
// interpreter without touching the shared table list:
//
// - Cell: the six 养成 cells. Rows 1-3 carry no condition, rows 4-6 carry a
//   MethodScript `assert` (377309400004 / 955132601046) that only the client
//   can evaluate, so the local server treats gated cells as "not auto opened".
// - TrialTask: 180 rows keyed by hero_tid * 100 + quality (quality 30/40/50)
//   whose `task` is [[6702, target]] with target 3/4/5.
//
// Evidence: node "$env:TEMP\fc_tbl2.mjs" Cell TrialTask (2026-11-07).
const defaultPath = tableAsset('HeroTable.data.lua.json');
let defaultCache;

const DEVELOP_TABLES = ['Cell', 'TrialTask'];

export function readHeroDevelopTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedDump(readJsonAsset(file), DEVELOP_TABLES);
  if (file === defaultPath) defaultCache = tables;
  return tables;
}

export const heroDevelopTableNames = Object.freeze([...DEVELOP_TABLES]);
