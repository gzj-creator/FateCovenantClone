import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

const defaultPath = tableAsset('BonusDrawTable.data.lua.json.gz');
let defaultCache;

// BonusDrawTable ships as LuaJIT bytecode (BonusDrawAct-style straight-line
// constructors). Rebuild the dump with:
//   node tools/extract-bonus-draw-table.mjs \
//     personal-server/assets/tables/BonusDrawTable.data.lua.bin \
//     personal-server/assets/tables/BonusDrawTable.data.lua.json.gz
//
// BonusDraw     福利抽奖表头  cost_item/pool[]/max_cnt/can_choose/convert_*
// Pool          福利抽奖卡池  lib[]/probability
// Lib           福利抽奖库    award[[tid,num]]/cnt/type (0=SMALL 1=MID 2=BIG)
//
// Pool_List / Lib_List / BonusDraw_List are not extracted: their constructors
// only read an upvalue (engine-maintained index lists) and the local server
// derives row order from the row tids instead.
const TABLES = ['BonusDraw', 'Pool', 'Lib'];

export function readBonusDrawTables(file = defaultPath) {
  if (file === defaultPath) return defaultCache ??= readGeneratedDump(readJsonAsset(file), TABLES);
  return readGeneratedDump(readJsonAsset(file), TABLES);
}
