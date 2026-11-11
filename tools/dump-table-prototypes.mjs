import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from './extract-battle-tables.mjs';

// Write a LuaJIT prototype dump in the same shape as the generated table dumps
// already used by personal-server/config (flags/chunk/rootPrototype/prototypes).
// readGeneratedDump in personal-server/config/hero-tables.mjs interprets that
// shape, so a table that only ships as Lua bytecode can be loaded without
// hand-transcribing rows.
export function buildPrototypeDump(buffer) {
  const parsed = parseLuaJit(buffer, { allowMultipleRoots: true });
  return {
    flags: parsed.flags,
    chunk: parsed.chunk,
    rootPrototype: parsed.rootPrototype,
    rootPrototypes: parsed.rootPrototypes,
    prototypes: parsed.prototypes
  };
}

export function dumpTableFile(input, output) {
  const dump = buildPrototypeDump(fs.readFileSync(input));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(dump));
  return dump;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node dump-table-prototypes.mjs <input.lua.bin> <output.json>');
  const dump = dumpTableFile(input, output);
  console.log(JSON.stringify({
    output,
    rootPrototype: dump.rootPrototype,
    rootPrototypes: dump.rootPrototypes,
    prototypes: dump.prototypes.length
  }));
}
