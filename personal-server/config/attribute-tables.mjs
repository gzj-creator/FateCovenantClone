import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

// HeroTable also owns the attribute growth families used by AttrMgr:
// BaseAttrNew (base + per-level grow by quality), StarAddAttr (star 0..5 by
// camp/quality), HighStarAddAttr (stars 6..10 per hero), BreakAddAttr,
// BattleAttr (per-hero fixed battle attributes) and AttrType (display attr ->
// fight attr key/value type). They were previously not loaded by the server,
// which is why every battle used a flat HP estimate instead of configured
// attributes. NpcAttrRatio/NpcFightCustom are kept here as well so NPC scaling
// can be applied from configuration rather than a player-level heuristic.
const defaultPath = tableAsset('HeroTable.data.lua.json');
const defaultNpcAttrPath = tableAsset('HeroTableNpcAttr.data.lua.json.gz');
let defaultCache;

export const ATTRIBUTE_TABLE_NAMES = [
  'BaseAttrNew', 'StarAddAttr', 'HighStarAddAttr', 'BreakAddAttr',
  'BattleAttr', 'AttrType', 'AttrTransform', 'AttrPlayWeaken',
  'NpcAttrRatio', 'NpcFightCustom'
];

export function readAttributeTables(file = defaultPath, npcAttrFile = defaultNpcAttrPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedTables(file, ATTRIBUTE_TABLE_NAMES);
  // NpcAttr is shipped in separate LuaJIT shards and extracted into its own
  // generated asset. Keeping it in the same table family lets the same
  // CalcValues implementation explain both player and NPC attributes.
  const npcTables = readGeneratedTables(npcAttrFile, ['NpcAttr']);
  const result = { ...tables, NpcAttr: npcTables.NpcAttr };
  if (file === defaultPath) defaultCache = result;
  return result;
}
