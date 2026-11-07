import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

// HelpUpActTable.data.lua ships as a LuaJIT data chunk inside
// 64_lua_project.bundle and is dumped with tools/dump-table-prototypes.mjs.
// The table exposes Task/Show/Version/FakeChannel/FakeShow/Stage/Award; the
// activity itself is ActFrameTable.Act 1096001 (type 1096).
const TABLE_NAMES = ['Task', 'Show', 'Version', 'FakeChannel', 'FakeShow', 'Stage', 'Award'];
const defaultPath = tableAsset('HelpUpActTable.data.lua.json');
let defaultCache;

export function readHelpUpActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedTables(file, TABLE_NAMES);
  if (file === defaultPath) defaultCache = tables;
  return tables;
}
