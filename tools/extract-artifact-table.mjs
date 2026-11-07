import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { readTextAssets } from './unityfs-read.mjs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { readGeneratedDump } from '../personal-server/config/hero-tables.mjs';

// Rebuild the generated ArtifactTable dumps used by the personal server.
//
// Input is the client Lua project bundle (assets/Android/script/lua/64_lua_project.bundle)
// that ships the ArtifactTable families as LuaJIT bytecode. The artifact table
// itself is a straight-line constructor dump consumed by readGeneratedDump();
// the per-quality level tables (ArtifactTable.LevelUp.<quality>.data.lua) are
// row tables wrapped in setmetatable and are flattened here so the server does
// not need to interpret LuaJIT bytecode at runtime.
const QUALITIES = [30, 40, 50, 60, 70];
const [input, outputDirectory = 'personal-server/assets/tables'] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node tools/extract-artifact-table.mjs <64_lua_project.bundle> [output-directory]');
  process.exit(2);
}

function dumpOf(bytes) {
  const parsed = parseLuaJit(bytes);
  return { flags: parsed.flags, chunk: parsed.chunk, rootPrototype: parsed.rootPrototype, prototypes: parsed.prototypes };
}

function writeGzipJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(Buffer.from(JSON.stringify(value))));
}

const assets = readTextAssets(fs.readFileSync(input));
const byName = new Map(assets.map(asset => [asset.name, asset.bytes]));

const mainName = 'ArtifactTable.data.lua';
const mainBytes = byName.get(mainName);
if (!mainBytes) throw new Error('Bundle is missing ' + mainName);
const mainDump = dumpOf(mainBytes);
writeGzipJson(path.join(outputDirectory, 'ArtifactTable.data.lua.json.gz'), mainDump);

const rows = [];
const sources = {};
for (const quality of QUALITIES) {
  const name = 'ArtifactTable.LevelUp.' + quality + '.data.lua';
  const bytes = byName.get(name);
  if (!bytes) throw new Error('Bundle is missing ' + name);
  const dump = dumpOf(bytes);
  const table = readGeneratedDump(dump, ['$root']).$root;
  if (!(table instanceof Map) || table.size === 0) throw new Error(name + ' produced no level rows');
  const levels = [...table].map(([key, row]) => ({ key: Number(key), row })).sort((left, right) => left.key - right.key);
  let previousCost = -1;
  for (let level = 0; level < levels.length; level++) {
    const { key, row } = levels[level];
    if (key !== quality * 10000 + level) {
      throw new Error(name + ' row ' + level + ' has unexpected tid ' + key);
    }
    const costType = Number(row.cost_type);
    const costNum = Number(row.cost_num);
    if (!Number.isSafeInteger(costType) || !Number.isSafeInteger(costNum) || costNum < 0) {
      throw new Error(name + ' row ' + key + ' has an invalid cost');
    }
    if (costNum < previousCost) throw new Error(name + ' cost is not monotonic at ' + key);
    if (costType !== 0 && costType !== 391002) throw new Error(name + ' row ' + key + ' has unexpected cost type ' + costType);
    previousCost = costNum;
    rows.push({
      quality,
      level,
      tid: key,
      cost_type: costType,
      cost_num: costNum,
      attr: Array.isArray(row.attr) ? row.attr.map(entry => Array.isArray(entry) ? [Number(entry[0]), Number(entry[1])] : entry) : []
    });
  }
  sources[quality] = { asset: name, rows: levels.length };
}

writeGzipJson(path.join(outputDirectory, 'ArtifactLevelUp.data.json.gz'), {
  source: { bundle: path.basename(input), qualities: QUALITIES },
  sources,
  rows
});

console.log(JSON.stringify({
  artifactTablePrototypes: mainDump.prototypes.length,
  levelRows: rows.length,
  sources
}, null, 2));