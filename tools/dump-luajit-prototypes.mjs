import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from './extract-battle-tables.mjs';

function constantAt(prototype, index) {
  const value = prototype.constants[index];
  if (!value) return null;
  if (value.type === 'string') return value.value;
  if (value.type === 'child') return { childPrototype: value.prototype };
  if (value.type === 'table') return { table: value.array, hash: value.hash };
  return value;
}

function describeInstruction(prototype, instruction) {
  const result = { ...instruction };
  if (instruction.name === 'KSTR' || instruction.name === 'GGET') result.resolved = constantAt(prototype, instruction.d);
  if (instruction.name === 'KNUM') result.resolved = prototype.numbers[instruction.d] ?? null;
  if (instruction.name === 'TGETS' || instruction.name === 'TSETS') result.resolved = constantAt(prototype, instruction.c);
  if (instruction.name === 'FNEW') result.resolved = constantAt(prototype, instruction.d);
  return result;
}

export function describePrototypes(parsed) {
  return parsed.prototypes.map(prototype => ({
    index: prototype.index,
    firstLine: prototype.firstLine ?? null,
    lineCount: prototype.lineCount ?? null,
    parameters: prototype.parameters,
    frameSize: prototype.frameSize,
    strings: prototype.constants.filter(value => value.type === 'string').map(value => value.value),
    numbers: prototype.numbers,
    instructions: prototype.instructions.map(instruction => describeInstruction(prototype, instruction))
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node dump-luajit-prototypes.mjs <input.lua.bin> [text-filter]');
  const filter = process.argv[3] ?? '';
  const parsed = parseLuaJit(fs.readFileSync(input));
  const prototypes = describePrototypes(parsed);
  for (const prototype of prototypes) {
    const haystack = JSON.stringify(prototype);
    if (filter && !haystack.includes(filter)) continue;
    console.log(JSON.stringify(prototype));
  }
}
