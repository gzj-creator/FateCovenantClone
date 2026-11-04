import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

// EquipTable only ships as LuaJIT bytecode in the client bundle. The dump is
// generated from textassets/4378987152432345000-EquipTable.data.lua.bin with
// tools/dump-table-prototypes.mjs; no row is transcribed by hand.
const defaultPath = tableAsset('EquipTable.data.lua.json');

export const EQUIP_TABLE_NAMES = [
  // Equip rows are the template rows behind pb_equip.tid: type, quality, cost,
  // exp, lv_max, per_level_attrs, refine/inscription caps and the unlock chain.
  'Equip',
  // Type has four rows (1..4); Level rows are keyed <type * 10000 + level> and
  // carry the per-level cost and level_exp used by req_equip_level_up.
  'Type', 'Level',
  // Forge = 打造, Quality = 升品/升星展示, Master = 大师属性, Talent = 天赋,
  // Refine = 精炼, Inscription = 铭刻, ResExchange = 熔炼兑换, DevelopType = 养成页签,
  // Const = 全局常量 (cell_count, one_key_*, strength/refine rate).
  'EQ_Forge', 'EQ_Quality', 'EQ_Master_Quality',
  'EQ_Refine_Show', 'EQ_Inscription_Stage', 'Master', 'Talent', 'Const',
  'ResExchange', 'Refine', 'Inscription', 'DevelopType'
];

let cached;

export function readEquipTables(file = defaultPath) {
  if (file === defaultPath && cached) return cached;
  const tables = readGeneratedTables(file, EQUIP_TABLE_NAMES);
  if (file === defaultPath) cached = tables;
  return tables;
}

// Level rows are keyed by <equip_type * 10000 + level>, which is why the cost of
// level 1 for type 1 lives at 10001 and type 4 starts at 40001.
export function equipLevelRow(tables, equipType, level) {
  const type = Number(equipType), lv = Number(level);
  if (!Number.isSafeInteger(type) || !Number.isSafeInteger(lv) || lv <= 0) return null;
  return tables.Level.get(type * 10000 + lv) ?? null;
}

