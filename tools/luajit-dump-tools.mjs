import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from './extract-battle-tables.mjs';

const opcodes = new Map(
  ('ISLT ISGE ISLE ISGT ISEQV ISNEV ISEQS ISNES ISEQN ISNEN ISEQP ISNEP ISTC ISFC IST ISF ISTYPE ISNUM MOV NOT UNM LEN ADDVN SUBVN MULVN DIVVN MODVN ADDNV SUBNV MULNV DIVNV MODNV ADDVV SUBVV MULVV DIVVV MODVV POW CAT KSTR KCDATA KSHORT KNUM KPRI KNIL UGET USETV USETS USETN USETP UCLO FNEW TNEW TDUP GGET GSET TGETV TGETS TGETB TGETR TSETV TSETS TSETB TSETM TSETR CALLM CALL CALLMT CALLT ITERC ITERN VARG ISNEXT RETM RET RET0 RET1 FORI JFORI FORL IFORL JFORL ITERL IITERL JITERL LOOP ILOOP JLOOP JMP FUNCF IFUNCF JFUNCF FUNCV IFUNCV JFUNCV FUNCC FUNCCW')
    .split(' ')
    .map((name, index) => [name, index]),
);

const abcOpcodes = new Set(
  ('ADDVN SUBVN MULVN DIVVN MODVN ADDNV SUBNV MULNV DIVNV MODNV ADDVV SUBVV MULVV DIVVV MODVV POW CAT TGETV TGETS TGETB TGETR TSETV TSETS TSETB TSETR CALLM CALL ITERC ITERN VARG')
    .split(' '),
);

function uleb(value) {
  let remaining = BigInt(value);
  if (remaining < 0n) throw new Error('ULEB128 cannot encode a negative value');
  const bytes = [];
  do {
    let byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    if (remaining) byte |= 0x80;
    bytes.push(byte);
  } while (remaining);
  return bytes;
}

function uleb33(value) {
  return uleb(BigInt.asUintN(64, BigInt(value)));
}

function doubleParts(value) {
  const bytes = Buffer.alloc(8);
  bytes.writeDoubleLE(value, 0);
  return [bytes.readUInt32LE(0), bytes.readUInt32LE(4)];
}

function encodeTableScalar(value) {
  if (value == null) return [0];
  if (value === false) return [1];
  if (value === true) return [2];
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) return [3, ...uleb(value < 0 ? BigInt.asUintN(32, BigInt(value)) : value)];
    const [low, high] = doubleParts(value);
    return [4, ...uleb(low), ...uleb(high)];
  }
  if (typeof value === 'string') return [...uleb(Buffer.byteLength(value) + 5), ...Buffer.from(value, 'utf8')];
  throw new Error(`Unsupported table scalar: ${String(value)}`);
}

function encodeConstant(value) {
  if (value.type === 'string') return [...uleb(Buffer.byteLength(value.value) + 5), ...Buffer.from(value.value, 'utf8')];
  if (value.type === 'child') return [0];
  if (value.type === 'table') {
    const output = [1, ...uleb(value.array.length), ...uleb(value.hash.length)];
    for (const item of value.array) output.push(...encodeTableScalar(item));
    for (const [key, item] of value.hash) output.push(...encodeTableScalar(key), ...encodeTableScalar(item));
    return output;
  }
  if (value.type === 'i64' || value.type === 'u64') return [value.type === 'i64' ? 2 : 3, ...uleb(value.low), ...uleb(value.high)];
  if (value.type === 'complex') {
    const [realLow, realHigh] = doubleParts(value.real);
    const [imaginaryLow, imaginaryHigh] = doubleParts(value.imaginary);
    return [4, ...uleb(realLow), ...uleb(realHigh), ...uleb(imaginaryLow), ...uleb(imaginaryHigh)];
  }
  throw new Error(`Unsupported GC constant: ${value.type}`);
}

function encodeInstruction(instruction) {
  const opcode = opcodes.get(instruction.name);
  if (opcode == null) throw new Error(`Unknown opcode: ${instruction.name}`);
  const output = [opcode, instruction.a];
  if (abcOpcodes.has(instruction.name)) output.push(instruction.c, instruction.b);
  else output.push(instruction.d & 0xff, (instruction.d >>> 8) & 0xff);
  return output;
}

export function serializeLuaJit(parsed, { stripDebug = true } = {}) {
  const output = [27, 76, 74, 2, stripDebug ? (parsed.flags | 2) : parsed.flags];
  if (!stripDebug) throw new Error('Serialization currently supports stripped dumps only');

  for (const prototype of parsed.prototypes) {
    const body = [prototype.flags, prototype.parameters, prototype.frameSize, prototype.upvalueCount,
      ...uleb(prototype.constants.length), ...uleb(prototype.numbers.length), ...uleb(prototype.instructions.length)];
    for (const instruction of prototype.instructions) body.push(...encodeInstruction(instruction));
    body.push(...new Array(prototype.upvalueCount * 2).fill(0));
    for (const constant of [...prototype.constants].reverse()) body.push(...encodeConstant(constant));
    for (const number of prototype.numbers) {
      if (Number.isInteger(number) && number >= -2147483648 && number <= 2147483647) {
        body.push(...uleb33(BigInt.asUintN(32, BigInt(number)) << 1n));
      } else {
        const [low, high] = doubleParts(number);
        body.push(...uleb33((BigInt(low) << 1n) | 1n), ...uleb(high));
      }
    }
    output.push(...uleb(body.length), ...body);
  }
  output.push(0);
  return Buffer.from(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output, mode = 'strip'] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node luajit-dump-tools.mjs <input.lua.bin> <output.lua.bin> [strip]');
  if (mode !== 'strip') throw new Error(`Unsupported mode: ${mode}`);
  const parsed = parseLuaJit(fs.readFileSync(input));
  const serialized = serializeLuaJit(parsed, { stripDebug: true });
  fs.writeFileSync(output, serialized);
  console.log(JSON.stringify({ input, output, prototypes: parsed.prototypes.length, bytes: serialized.length }));
}
