import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseLuaJit } from './extract-battle-tables.mjs';

// Rebuild the generated RelicTable dump consumed by the local server.
// Input is the LuaJIT bytecode asset shipped with the client; output is the
// straight-line constructor dump consumed by readGeneratedDump().
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node tools/extract-relic-table.mjs <RelicTable.data.lua> <output.json.gz>');
  process.exit(2);
}

const parsed = parseLuaJit(fs.readFileSync(input));
const dump = {
  flags: parsed.flags,
  chunk: parsed.chunk,
  rootPrototype: parsed.rootPrototype,
  prototypes: parsed.prototypes
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, zlib.gzipSync(Buffer.from(JSON.stringify(dump))));
console.log(output + ' ' + fs.statSync(output).size + ' bytes, ' + parsed.prototypes.length + ' prototypes');
