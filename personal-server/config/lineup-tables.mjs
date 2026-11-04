import { readAssetBytes } from '../assets.mjs';
import { tableAsset } from '../assets.mjs';
import { extractGroups, parseLuaJit } from '../protocol/lua-jit-dump.mjs';

const defaultPath = tableAsset('8897179132838841000-LineupTable.data.lua.bin');
let defaultCache;

export function readLineupTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const groups = extractGroups(parseLuaJit(readAssetBytes(file)));
  const rows = groups.find(group => group.rootName === 'Type')?.rows;
  if (!rows?.length) throw new Error('LineupTable.Type is missing or empty');
  const tables = { Type: new Map(rows.map(row => [Number(row.tid), row])) };
  if (file === defaultPath) defaultCache = tables;
  return tables;
}
