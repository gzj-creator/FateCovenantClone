import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseLuaJit } from './extract-battle-tables.mjs';

// Extract every sub table of an arena family client table file (LuaJIT
// bytecode) into plain rows. These files are straight-line constructors:
//
//   <builder prototype>  -- field map constant + rows in literal TDUP arrays
//   <accessor prototype> -- TGETS <name> on the table it was attached to
//
// The accessor that immediately follows a builder names the table; builders
// without an accessor are reported by prototype index so a broken rule is
// visible instead of silently dropped.
//
// Usage:
//   node tools/extract-arena-tables.mjs <XxxTable.data.lua.bin> <out.json.gz>

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-arena-tables.mjs <XxxTable.data.lua.bin> <out.json.gz>');
  process.exit(2);
}

function cloneValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = cloneValue(item);
    return out;
  }
  return value;
}

function constantValue(constant) {
  if (!constant) return null;
  if (constant.type === 'string') return constant.value;
  if (constant.type === 'table') {
    if (constant.hash.length > 0) {
      const object = {};
      for (const [key, value] of constant.hash) object[key] = cloneValue(value);
      return object;
    }
    return cloneValue(constant.array);
  }
  return null;
}

// Straight-line interpreter over the constructor opcodes. Global calls are the
// client setmetatable/MakeList helpers, which return the table they were handed.
function execute(proto) {
  const regs = [];
  const slot = (index) => {
    if (regs[index] === undefined || regs[index] === null) regs[index] = [];
    return regs[index];
  };
  const instructions = proto.instructions;
  for (let pc = 0; pc < instructions.length; pc += 1) {
    const ins = instructions[pc];
    switch (ins.name) {
      case 'TDUP': regs[ins.a] = constantValue(proto.constants[ins.d]); break;
      case 'TNEW': regs[ins.a] = []; break;
      case 'MOV': regs[ins.a] = regs[ins.d]; break;
      case 'GGET': regs[ins.a] = { global: constantValue(proto.constants[ins.c]) }; break;
      case 'FNEW': regs[ins.a] = { closure: ins.d }; break;
      case 'KSTR': regs[ins.a] = constantValue(proto.constants[ins.c]); break;
      case 'KSHORT': regs[ins.a] = (ins.d << 16) >> 16; break;
      case 'KNUM': regs[ins.a] = proto.numbers[ins.d]; break;
      case 'KPRI': regs[ins.a] = [null, false, true][ins.d]; break;
      case 'KNIL': for (let index = ins.a; index < ins.d; index += 1) regs[index] = null; break;
      case 'TSETS':
      case 'TSETB': slot(ins.b)[ins.c] = regs[ins.a]; break;
      case 'TSETV': slot(ins.b)[regs[ins.c]] = regs[ins.a]; break;
      case 'TSETM': {
        const table = slot(ins.a - 1);
        const start = proto.numbers[ins.d - 1];
        for (let n = 0; regs[ins.a + n] !== undefined; n += 1) table[start + n] = regs[ins.a + n];
        break;
      }
      case 'TGETB': regs[ins.a] = (regs[ins.b] || [])[ins.c]; break;
      case 'TGETS': regs[ins.a] = (regs[ins.b] || {})[ins.c]; break;
      case 'TGETV': regs[ins.a] = (regs[ins.b] || [])[regs[ins.c]]; break;
      case 'CALL':
      case 'CALLM':
      case 'CALLT': {
        const callArgs = [];
        for (let n = 1; n < ins.c; n += 1) callArgs.push(regs[ins.a + n]);
        const table = callArgs.find((value) => Array.isArray(value))
          || callArgs.find((value) => value && typeof value === 'object' && value.global === undefined && value.closure === undefined);
        regs[ins.a] = table === undefined ? regs[ins.a] : table;
        break;
      }
      case 'UCLO': case 'LOOP': case 'ILOOP': case 'JLOOP': case 'JFORI': case 'FORI':
      case 'ITERL': case 'IITERL': case 'JITERL': break;
      case 'JMP': pc += ins.d - 1; break;
      case 'RET': return regs[ins.a];
      case 'RET0': return null;
      case 'RET1': return regs[ins.a];
      default: throw new Error('unsupported opcode ' + ins.name + ' at pc ' + pc + ' of prototype ' + proto.index);
    }
  }
  return undefined;
}

function fieldMap(proto) {
  const map = proto.constants.find((constant) => constant.type === 'table' && constant.array.length === 0
    && constant.hash.length > 0 && constant.hash.every((entry) => typeof entry[0] === 'string' && Number.isInteger(entry[1])));
  if (!map) return null;
  const fields = [];
  for (const [name, ordinal] of map.hash) fields[ordinal - 1] = name;
  return fields;
}

// The generated files name a table through the accessor method that exposes it.
function accessorName(proto) {
  const instructions = proto?.instructions ?? [];
  const nameOf = (instruction) => {
    const constant = proto.constants[instruction?.c ?? instruction?.d];
    return constant?.type === 'string' ? constant.value : null;
  };
  if (instructions.length === 3 && instructions[0].name === 'UGET' && instructions[1].name === 'TGETS' && instructions[2].name === 'RET1') {
    return nameOf(instructions[1]);
  }
  if (instructions.length >= 3 && instructions[0].name === 'UGET' && instructions[1].name === 'UGET' && instructions[2].name === 'TGETS') {
    return nameOf(instructions[2]);
  }
  return null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  return value.slice(1).map((item) => normalizeList(item));
}

const parsed = parseLuaJit(fs.readFileSync(inputPath));
const result = {
  source: path.basename(inputPath),
  extractor: 'tools/extract-arena-tables.mjs',
  tables: {},
  unnamed: []
};
for (const proto of parsed.prototypes) {
  const fields = fieldMap(proto);
  if (!fields) continue;
  const next = parsed.prototypes[proto.index + 1];
  const name = accessorName(next) ?? ('Proto' + proto.index);
  const list = execute(proto);
  if (!Array.isArray(list)) {
    result.unnamed.push({ prototype: proto.index, reason: 'builder did not return a list' });
    continue;
  }
  const rows = [];
  for (let index = 1; index < list.length; index += 1) {
    const row = list[index];
    if (!row) continue;
    const record = {};
    for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
      const value = Array.isArray(row) ? row[ordinal + 1] : row[fields[ordinal]];
      if (value === undefined) continue;
      record[fields[ordinal]] = normalizeList(value);
    }
    rows.push(record);
  }
  if (result.tables[name]) {
    result.unnamed.push({ prototype: proto.index, reason: 'duplicate table name ' + name });
    continue;
  }
  result.tables[name] = { fields, rows };
}

const json = JSON.stringify(result);
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(json, 'utf8')));
console.log(JSON.stringify({
  output: outputPath,
  bytes: fs.statSync(outputPath).size,
  tables: Object.fromEntries(Object.entries(result.tables).map(([name, table]) => [name, table.rows.length])),
  unnamed: result.unnamed
}, null, 1));

