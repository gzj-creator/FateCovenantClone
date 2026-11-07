import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

const defaultPath = tableAsset('HundredDrawActTable.data.lua.json.gz');
const defaultRolePath = tableAsset('RoleTable.data.lua.json.gz');
let defaultCache;
let defaultRoleCache;

const TABLES = [
  'ThemeType', 'GuaranteeWeight', 'StarTask', 'PoolAward', 'PoolShow',
  'PoolType', 'Pool', 'QualityShow', 'AwardType', 'Version', 'TargetShow',
  'Marquee', 'ProcessAward', 'StarShow'
];

// HundredDrawActTable ships as LuaJIT bytecode. The extractor stores the
// straight-line constructors so the same table interpreter used by the hero
// tables can recover their rows without executing client code.
export function readHundredDrawTables(file = defaultPath) {
  if (file === defaultPath) return defaultCache ??= readGeneratedDump(readJsonAsset(file), TABLES);
  return readGeneratedDump(readJsonAsset(file), TABLES);
}

// TID_HUNDRED_DRAW_ONTOLOGY_HEAD rewards point at a RoleTable.FigureHead row
// whose style is the target hero's style. Keep the small RoleTable loader here
// instead of widening the shared hero table cache for one reward family.
export function readHundredRoleTables(file = defaultRolePath) {
  if (file === defaultRolePath) return defaultRoleCache ??= readGeneratedDump(readJsonAsset(file), ['FigureHead']);
  return readGeneratedDump(readJsonAsset(file), ['FigureHead']);
}
