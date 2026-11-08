import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { readTextAssets } from './unityfs-read.mjs';
import { buildPrototypeDump } from './dump-table-prototypes.mjs';

// Rebuild the draw/lottery activity configuration dumps used by the F block.
// Source: the shipped LuaJIT table bytecode inside 64_lua_project.bundle.
// Output: personal-server/assets/tables/<Name>.data.lua.json.gz prototype dumps
// consumed by readActivityTables() in personal-server/config/draw-activities-tables.mjs.
export const DRAW_ACTIVITY_TABLES = [
  'MagicDrawTable', 'PyramidTable', 'ThreeAdmonitionTable', 'HundredBonusTable',
  'RaffleTicketTable', 'HeroBlazonDrawTable', 'LotteryActTable', 'MysteryWishTable',
  'LotteryTable', 'FlipCardTable', 'TicketDrawTable', 'FruitDrawActTable',
  'ElvesActTable', 'CapsuleToyTable', 'ChildPuzzleActTable', 'HoardWheelActTable',
  'ThousandDrawTable', 'PrayActTable', 'CashbackDrawTable', 'TurntableActTable',
  'FlopCardActTable', 'ChessTable', 'ChessRevertTable', 'WishTreeTable'
];

export function extractDrawActivityTables({ bundle, output, logger = () => {} }) {
  const list = readTextAssets(fs.readFileSync(bundle));
  const byName = new Map();
  for (const asset of list) if (!byName.has(asset.name)) byName.set(asset.name, asset);
  const written = [];
  for (const name of DRAW_ACTIVITY_TABLES) {
    const asset = byName.get(name + '.data.lua');
    if (!asset) throw new Error('Bundle is missing ' + name + '.data.lua');
    const dump = buildPrototypeDump(asset.bytes);
    const target = path.join(output, name + '.data.lua.json.gz');
    fs.writeFileSync(target, zlib.gzipSync(Buffer.from(JSON.stringify(dump))));
    written.push({ target, bytes: fs.statSync(target).size, prototypes: dump.prototypes.length });
    logger({ event: 'table_written', target, bytes: fs.statSync(target).size });
  }
  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  const bundle = flag('--bundle') ?? 'analysis/tmp/lua-bundles/64_lua_project.bundle';
  const output = flag('--output') ?? 'personal-server/assets/tables';
  const written = extractDrawActivityTables({ bundle, output, logger: event => console.log(JSON.stringify(event)) });
  console.log(JSON.stringify({ count: written.length }, null, 1));
}

