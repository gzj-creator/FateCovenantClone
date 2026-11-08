import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { readTextAssets } from './unityfs-read.mjs';
import { buildPrototypeDump } from './dump-table-prototypes.mjs';

// Extract the G1 (exploration / home) activity tables from the shipped client
// Lua bundle. Row families are discovered from the LazyInit "<Name>_Count"
// constants rather than a hard-coded list, because these tables use different
// row families per activity version. The dump keeps the LuaJIT prototype shape
// readGeneratedTables() already interprets for every other table asset.
const TABLES = [
  'HomePuzzleActTable.data.lua', 'HomelandActTable.data.lua', 'CarnivalTable.data.lua',
  'ThemeTreasureTable.data.lua', 'MiniGameTable.data.lua', 'TreasureHuntTable.data.lua',
  'GrandTourerTable.data.lua', 'DreamTable.data.lua', 'MagicalJourneyTable.data.lua',
  'RadishFarmTable.data.lua', 'ExperienceActTable.data.lua', 'WeekendBonusTable.data.lua'
];
const bundlePath = process.argv[2] ?? 'analysis/tmp/lua-bundles/64_lua_project.bundle';
const assets = new Map(readTextAssets(fs.readFileSync(bundlePath)).map(a => [a.name, a]));
const outDir = 'personal-server/assets/tables';
const evidenceDir = 'analysis/tmp/exploration-tables';
fs.mkdirSync(evidenceDir, { recursive: true });
const report = [];
for (const name of TABLES) {
  const asset = assets.get(name);
  if (!asset) throw new Error('client bundle is missing ' + name);
  const dump = buildPrototypeDump(asset.bytes);
  const root = dump.prototypes?.[dump.rootPrototype];
  const rows = [];
  for (const constant of root?.constants ?? []) {
    const value = constant?.value;
    if (typeof value === 'string' && value.endsWith('_Count')) rows.push(value.slice(0, -6));
  }
  if (!rows.length) throw new Error('no LazyInit row families found in ' + name);
  const json = JSON.stringify(dump);
  fs.writeFileSync(path.join(evidenceDir, name + '.json'), json);
  fs.writeFileSync(path.join(outDir, name.replace('.data.lua', '.data.lua') + '.json.gz'), zlib.gzipSync(Buffer.from(json)));
  report.push({ name, bytes: asset.bytes.length, rows });
}
console.log(JSON.stringify(report, null, 1));
