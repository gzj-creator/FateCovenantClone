import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { parseLuaJit } from './extract-battle-tables.mjs';

// Rebuild the generated BonusDrawTable dump used by the local server.
// Input is the LuaJIT bytecode asset shipped with the client; output is the
// straight-line constructor dump consumed by readGeneratedDump().
//
// Usage:
//   node tools/extract-bonus-draw-table.mjs <BonusDrawTable.data.lua> <output.json.gz>
//
// The shipped chunk also declares Pool_List/Lib_List/BonusDraw_List constructors
// that only read an upvalue (they are engine-maintained index lists). Those three
// names are not extracted: readGeneratedDump() rejects the UGET-only shape and the
// local server never needs them.
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node tools/extract-bonus-draw-table.mjs <BonusDrawTable.data.lua> <output.json.gz>');
  process.exit(2);
}

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(input);
const parsed = parseLuaJit(source);
const dump = {
  flags: parsed.flags,
  chunk: parsed.chunk,
  rootPrototype: parsed.rootPrototype,
  prototypes: parsed.prototypes
};
const bytes = zlib.gzipSync(Buffer.from(JSON.stringify(dump)));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, bytes);
console.log(JSON.stringify({
  input,
  inputBytes: source.length,
  inputSha256: sha256(source),
  output,
  outputBytes: bytes.length,
  outputSha256: sha256(bytes),
  prototypes: parsed.prototypes.length
}, null, 2));

