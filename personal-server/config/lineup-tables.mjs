import fs from 'node:fs';
import { extractGroups, parseLuaJit } from '../../tools/extract-battle-tables.mjs';

const defaultPath = new URL(
  '../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/8897179132838841000-LineupTable.data.lua.bin',
  import.meta.url
);
let defaultCache;

export function readLineupTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const groups = extractGroups(parseLuaJit(fs.readFileSync(file)));
  const rows = groups.find(group => group.rootName === 'Type')?.rows;
  if (!rows?.length) throw new Error('LineupTable.Type is missing or empty');
  const tables = { Type: new Map(rows.map(row => [Number(row.tid), row])) };
  if (file === defaultPath) defaultCache = tables;
  return tables;
}
