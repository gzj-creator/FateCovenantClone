import { readGeneratedTables } from './hero-tables.mjs';
const base = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/', import.meta.url);
let cached;
export function readGameTables() {
  return cached ??= {
    ...readGeneratedTables(new URL('ItemTable.data.lua.json', base), ['Item', 'Type']),
    ...Object.fromEntries(Object.entries(readGeneratedTables(new URL('RechargeTable.data.lua.json', base), ['Recharge'])).map(([k,v]) => [k,v])),
    ...readGeneratedTables(new URL('OpenServerSprintTable.data.lua.json', base), ['SprintRankTask', 'SprintType']),
    TaskType: readGeneratedTables(new URL('TaskTable.data.lua.json', base), ['Type']).Type
  };
}
