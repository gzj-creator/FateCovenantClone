import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// RelicTable ships as LuaJIT bytecode. tools/extract-relic-table.mjs stores the
// straight-line constructors so the shared table interpreter can recover every
// row without executing client code.
const defaultPath = tableAsset('RelicTable.data.lua.json.gz');
let defaultCache;

const TABLES = [
  'SpRefineAttr', 'SpHero', 'SpSkill', 'SpRefine', 'Sp', 'Param', 'Quality',
  'AttrQuality', 'VariationAddition', 'Recommend', 'Suit', 'ForgeConst',
  'WishWeight', 'ForgeDisplay', 'RecastSkillProb', 'RecastAttrValue',
  'RecastAttrType', 'RecastLib', 'RecastSkill', 'RecastTimes', 'DevelopType',
  'ResolveDisplay', 'StageAttr', 'MainAttr', 'Type', 'Relic'
];

export function readRelicTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedDump(readJsonAsset(file), TABLES);
  if (file === defaultPath) defaultCache = tables;
  return tables;
}

// Relic chips are the only relic-family item shipped by the client: type 1,
// quality 50, icon icon_yw_zm.png, get_way 530. Quality rows carry the chip
// amounts (resolve_chip / cost_chip) without naming the item, so the item id is
// resolved once here and every consumer reuses it.
export const RELIC_CHIP_ITEM_TID = 813002;

// Relic tids are 7 digits: the leading digit repeats the quality tier (2..5),
// so 2001109 is quality 20 and 5001109 is quality 50. RelicTable rows carry the
// slot type but not the quality, and Quality rows index ability/recast data.
export function relicQualityOf(tid) {
  const value = Number(tid);
  if (!Number.isSafeInteger(value) || value < 1000000 || value > 9999999) return null;
  return Math.floor(value / 1000000) * 10;
}

export function readRelicParam(tables = readRelicTables()) {
  return tables.Param?.get(1) ?? null;
}

