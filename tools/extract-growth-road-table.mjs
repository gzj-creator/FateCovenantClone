import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the client GrowthRoadTable rows from a LuaJIT bytecode dump.
//
// The client ships table data as LuaJIT bytecode (GrowthRoadTable.data.lua). Rows are plain
// Lua tables built by straight-line bytecode, so a small interpreter over the emitted opcodes
// recovers the exact rows without guessing: table rows are arrays indexed by the field ordinal
// declared in the leading field map constant of the same prototype. GrowthRoadTable carries
// Task, Version, Progress and Tag. Their builders are prototypes 2, 5, 8 and 11; the table-name
// prototype follows each builder.
//
// Usage:
//   node tools/extract-growth-road-table.mjs <GrowthRoadTable.data.lua> <out.json.gz>
//     [--parser <luajit-bytecode-parse.mjs>]

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
const parserFlagIndex = args.indexOf('--parser');
const parserPath = parserFlagIndex === -1
  ? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')
  : args[parserFlagIndex + 1];
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-growth-road-table.mjs <GrowthRoadTable.data.lua> <out.json.gz> [--parser <luajit-parse.mjs>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(parserPath).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

// Prototype index of the row list builder for every sub table. The table name is the string
// constant of the prototype that immediately follows the builder (verified for all entries).
const BUILDERS = [
  { name: 'Task', proto: 2 },
  { name: 'Version', proto: 5 },
  { name: 'Progress', proto: 8 },
  { name: 'Tag', proto: 11 }
];

function cloneValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
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
      case 'CALLM': {
        // The builders only call the client MakeList/setmetatable helpers, which return the
        // first table argument (the row or list that was just built).
        const args = [];
        for (let n = 1; n < ins.c; n += 1) args.push(regs[ins.a + n]);
        const table = args.find((value) => Array.isArray(value))
          || args.find((value) => value && typeof value === 'object' && value.global === undefined && value.closure === undefined);
        regs[ins.a] = table === undefined ? regs[ins.a] : table;
        break;
      }
      case 'UCLO': case 'LOOP': case 'ILOOP': case 'JLOOP': case 'JFORI':
      case 'FORI': case 'ITERL': case 'IITERL': case 'JITERL': break;
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

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  // The dump emits table slots starting at slot 0, while Lua data uses slots from 1.
  const items = value.slice(1).map((item) => normalizeList(item));
  return items;
}

const result = { source: path.basename(inputPath), extractor: 'tools/extract-growth-road-table.mjs', tables: {} };
for (const { name, proto: protoIndex } of BUILDERS) {
  const proto = parsed.prototypes[protoIndex];
  const fields = fieldMap(proto);
  const list = execute(proto);
  if (!Array.isArray(list)) throw new Error('builder for ' + name + ' did not return a list');
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
  result.tables[name] = { fields, rows };
}

const json = JSON.stringify(result);
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(json, 'utf8')));
for (const [name, value] of Object.entries(result.tables)) {
  console.log(name, value.rows.length + ' rows', 'fields=' + value.fields.join(','));
}
