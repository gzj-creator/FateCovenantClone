import { readGeneratedTables } from './hero-tables.mjs';
const base = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/', import.meta.url);
let cached;
export function readGameTables() {
  return cached ??= {
    // Item box rules: the client picks the use command from ItemTable.Type.obj_class.
    ...readGeneratedTables(new URL('ItemTable.data.lua.json', base), ['Item', 'Type', 'Random_Box', 'Designated_Box', 'OptionalBox', 'BoxRepeat', 'Pay_Box']),
    // Draw library used by Random_Box.draw_lib: LibWeight picks a group, Group.lib_range picks the award.
    ...pick(readGeneratedTables(new URL('DrawTable.data.lua.json', base), ['LibWeight', 'Item', 'Group']), { LibWeight: 'DrawLibWeight', Item: 'DrawItem', Group: 'DrawGroup' }),
    ...Object.fromEntries(Object.entries(readGeneratedTables(new URL('RechargeTable.data.lua.json', base), ['Recharge', 'Param'])).map(([k,v]) => [k === 'Param' ? 'RechargeParam' : k,v])),
    ...readGeneratedTables(new URL('OpenServerSprintTable.data.lua.json', base), ['SprintRankTask', 'SprintType']),
    TaskType: readGeneratedTables(new URL('TaskTable.data.lua.json', base), ['Type']).Type
  };
}
function pick(tables, names) { return Object.fromEntries(Object.entries(names).map(([from, to]) => [to, tables[from]])); }
