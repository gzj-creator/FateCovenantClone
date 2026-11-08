import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

// Rebuild the SlotGameActTable data dump used by the local server.
//
// SlotGameActTable.data.lua ships only as LuaJIT bytecode in the client bundle
// (4,165 bytes for the v10 build). Its root prototype registers five row
// builders through LazyInit(name, builder): Version (proto 18), AwardMapLib
// (proto 10), AwardLib (proto 14), MultiplierLib (proto 6) and
// MultiplierLibDraw (proto 2). The builders are straight-line tables, so the
// same interpreter personal-server/config/hero-tables.mjs uses for the other
// generated table dumps recovers the rows without executing client code.
//
// Usage:
//   node tools/extract-slot-game-act-table.mjs <SlotGameActTable.data.lua> <out.json.gz>

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-slot-game-act-table.mjs <SlotGameActTable.data.lua> <out.json.gz>');
  process.exit(2);
}

// The shipped build must expose every row family the server rules rely on. A
// client update that renames or drops one aborts the extraction instead of
// writing a half-filled table the server would later trust.
const EXPECTED_COUNTS = Object.freeze({
  MultiplierLibDraw: 19,
  MultiplierLib: 3,
  AwardMapLib: 1,
  AwardLib: 3,
  Version: 1
});

const parsed = parseLuaJit(fs.readFileSync(inputPath));
const root = parsed.prototypes[parsed.rootPrototype];

// LazyInit("Name", builder) compiles to KSTR "Name"; FNEW builder. The row
// count is stored as KSHORT n; TSETS table, "Name_Count".
const builders = new Set();
const declaredCounts = new Map();
for (let pc = 0; pc < root.instructions.length; pc += 1) {
  const instruction = root.instructions[pc];
  const next = root.instructions[pc + 1];
  if (instruction.name === 'KSTR' && next?.name === 'FNEW') {
    const name = root.constants[instruction.d]?.value;
    if (EXPECTED_COUNTS[name] !== undefined) builders.add(name);
  }
  if (instruction.name === 'KSHORT' && next?.name === 'TSETS') {
    const name = root.constants[next.c]?.value;
    if (typeof name === 'string' && name.endsWith('_Count')) {
      declaredCounts.set(name.slice(0, -'_Count'.length), instruction.d);
    }
  }
}

for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
  if (!builders.has(name)) throw new Error('Missing SlotGameActTable row builder: ' + name);
  const declared = declaredCounts.get(name);
  if (declared !== expected) throw new Error(`SlotGameActTable ${name}_Count is ${declared}, expected ${expected}`);
}

const dump = {
  flags: parsed.flags,
  chunk: parsed.chunk,
  rootPrototype: parsed.rootPrototype,
  prototypes: parsed.prototypes
};
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(JSON.stringify(dump), 'utf8')));

// Re-read through the server's interpreter when the module is available so the
// extractor fails on rows the server could not decode either.
if (process.env.FC_SLOT_SKIP_INTERPRETER !== '1') {
  const interpreterUrl = new URL('../personal-server/config/hero-tables.mjs', import.meta.url);
  const { readGeneratedDump } = await import(pathToFileURL(fileURLToPath(interpreterUrl)).href);
  const tables = readGeneratedDump(dump, Object.keys(EXPECTED_COUNTS));
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    const size = tables[name]?.size ?? 0;
    if (size !== expected) throw new Error(`Decoded SlotGameActTable ${name} has ${size} rows, expected ${expected}`);
  }
}

console.log(JSON.stringify({
  output: outputPath,
  bytes: fs.statSync(outputPath).size,
  prototypes: parsed.prototypes.length,
  rows: EXPECTED_COUNTS
}));
