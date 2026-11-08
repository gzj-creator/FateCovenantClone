import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Generic extraction of a client Lua table data bundle (LuaJIT bytecode) into
// JSON rows.
//
// Every sub table in a *.data.lua bundle is built by one prototype that emits
// the row list (straight line TDUP/TNEW/TSET*), and the prototype that
// immediately follows it holds a single string constant with the sub table
// name. Rows are arrays indexed by the ordinal declared in the builder's
// leading field map constant.
//
// Usage:
//   node tools/extract-lua-table.mjs <Table.data.lua.bin> <out.json.gz> [--parser <mjs>]

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
const parserFlagIndex = args.indexOf('--parser');
const parserPath = parserFlagIndex === -1
  ? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')
  : args[parserFlagIndex + 1];
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-lua-table.mjs <Table.data.lua.bin> <out.json.gz> [--parser <mjs>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(parserPath).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

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

function slotOf(regs, index) {
  if (regs[index] === undefined || regs[index] === null) regs[index] = [];
  return regs[index];
}

function execute(proto) {
  const regs = [];
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
      case 'TSETB': slotOf(regs, ins.b)[ins.c] = regs[ins.a]; break;
      case 'TSETV': slotOf(regs, ins.b)[regs[ins.c]] = regs[ins.a]; break;
      case 'TSETM': {
        const table = slotOf(regs, ins.a - 1);
        const start = proto.numbers[ins.d - 1];
        for (let n = 0; regs[ins.a + n] !== undefined; n += 1) table[start + n] = regs[ins.a + n];
        break;
      }
      case 'TGETB': regs[ins.a] = (regs[ins.b] || [])[ins.c]; break;
      case 'TGETS': regs[ins.a] = (regs[ins.b] || {})[ins.c]; break;
      case 'TGETV': regs[ins.a] = (regs[ins.b] || [])[regs[ins.c]]; break;
      case 'CALL':
      case 'CALLM': {
        // Builders only call the client MakeList/setmetatable helpers, which return the
        // first table argument (the row or list that was just built).
        const callArgs = [];
        for (let n = 1; n < ins.c; n += 1) callArgs.push(regs[ins.a + n]);
        const table = callArgs.find((value) => Array.isArray(value))
          || callArgs.find((value) => value && typeof value === 'object' && value.global === undefined && value.closure === undefined);
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
  return value.slice(1).map((item) => normalizeList(item));
}

// A builder prototype is followed by a prototype holding a single string constant:
// the sub table name.
const BUILDERS = [];
for (let index = 0; index < parsed.prototypes.length - 1; index += 1) {
  const proto = parsed.prototypes[index];
  const next = parsed.prototypes[index + 1];
  const fields = fieldMap(proto);
  if (!fields || !fields.length) continue;
  const nextStrings = (next.constants ?? []).filter((constant) => constant.type === 'string');
  if (nextStrings.length !== 1) continue;
  if (fieldMap(next)) continue;
  BUILDERS.push({ name: nextStrings[0].value, proto: index, fields });
}

const result = { source: path.basename(inputPath), extractor: 'tools/extract-lua-table.mjs', tables: {} };
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
