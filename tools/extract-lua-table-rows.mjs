import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { buildPrototypeDump } from './dump-table-prototypes.mjs';

// Extract every sub table of a generated client table file (LuaJIT bytecode)
// into plain rows. The generated files are straight-line constructors:
//
//   <builder prototype>  -- builds the row list, rows are literal TDUP arrays
//   <accessor prototype> -- UGET/TGETS/RET1, names the field it exposes
//
// Each builder is followed by its accessor, so the pair gives us the table name
// and the rows. Field names come from the field-map constant of the builder
// (a table with an empty array part and a hash of field -> ordinal).
//
// Usage:
//   node tools/extract-lua-table-rows.mjs <XxxTable.data.lua.bin> <out.json.gz> [--only A,B]

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
const onlyIndex = args.indexOf('--only');
const only = onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(','));
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-lua-table-rows.mjs <XxxTable.data.lua.bin> <out.json.gz> [--only A,B]');
  process.exit(2);
}

function cloneValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(item => cloneValue(item));
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

// Straight-line interpreter for the emitted constructor opcodes. Global calls are the
// client's setmetatable/list helpers, which return the table they were handed.
function execute(proto) {
  const regs = [];
  const slot = index => {
    if (regs[index] === undefined || regs[index] === null) regs[index] = [];
    return regs[index];
  };
  const instructions = proto.instructions;
  for (let pc = 0; pc < instructions.length; pc += 1) {
    const ins = instructions[pc];
    switch (ins.name) {
      case 'TDUP': regs[ins.a] = constantValue(proto.constants[ins.d ?? ins.c]); break;
      case 'TNEW': regs[ins.a] = []; break;
      case 'MOV': regs[ins.a] = regs[ins.d]; break;
      case 'GGET': regs[ins.a] = { global: constantValue(proto.constants[ins.c ?? ins.d]) }; break;
      case 'FNEW': regs[ins.a] = { closure: ins.d }; break;
      case 'KSTR': regs[ins.a] = constantValue(proto.constants[ins.c ?? ins.d]); break;
      case 'KSHORT': regs[ins.a] = (ins.d << 16) >> 16; break;
      case 'KNUM': regs[ins.a] = proto.numbers[ins.d]; break;
      case 'KPRI': regs[ins.a] = [null, false, true][ins.d]; break;
      case 'KNIL': for (let index = ins.a; index < ins.d; index += 1) regs[index] = null; break;
      case 'TSETS':
      case 'TSETB': slot(ins.b)[ins.c] = regs[ins.a]; break;
      case 'TSETV': slot(ins.b)[regs[ins.c]] = regs[ins.a]; break;
      case 'TSETM': {
        const table = slot(ins.a - 1);
        const start = proto.numbers[ins.d - 1] ?? 1;
        for (let n = 0; regs[ins.a + n] !== undefined; n += 1) table[start + n] = regs[ins.a + n];
        break;
      }
      case 'TGETB': regs[ins.a] = (regs[ins.b] || [])[ins.c]; break;
      case 'TGETS': regs[ins.a] = (regs[ins.b] || {})[proto.constants[ins.c ?? ins.d]?.value]; break;
      case 'TGETV': regs[ins.a] = (regs[ins.b] || [])[regs[ins.c]]; break;
      case 'CALL':
      case 'CALLM': {
        const callArgs = [];
        for (let n = 1; n < ins.c; n += 1) callArgs.push(regs[ins.a + n]);
        const table = callArgs.find(value => Array.isArray(value))
          || callArgs.find(value => value && typeof value === 'object' && value.global === undefined && value.closure === undefined);
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
  const map = proto.constants.find(constant => constant.type === 'table' && constant.array.length === 0
    && constant.hash.length > 0 && constant.hash.every(entry => typeof entry[0] === 'string' && Number.isInteger(entry[1])));
  if (!map) return null;
  const fields = [];
  for (const [name, ordinal] of map.hash) fields[ordinal - 1] = name;
  return fields;
}

function accessorName(proto) {
  const ins = proto?.instructions ?? [];
  const constantName = instruction => {
    const constant = proto.constants[instruction?.c ?? instruction?.d];
    return constant?.type === 'string' ? constant.value : null;
  };
  if (ins.length === 3 && ins[0].name === 'UGET' && ins[1].name === 'TGETS' && ins[2].name === 'RET1') {
    return constantName(ins[1]);
  }
  // makeList accessor used by the larger tables: UGET, UGET, TGETS name, TDUP, CALLT.
  if (ins.length === 5 && ins[0].name === 'UGET' && ins[1].name === 'UGET' && ins[2].name === 'TGETS') {
    return constantName(ins[2]);
  }
  return null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  return value.slice(1).map(item => normalizeList(item));
}

const parsed = buildPrototypeDump(fs.readFileSync(inputPath));
const result = { source: path.basename(inputPath), extractor: 'tools/extract-lua-table-rows.mjs', tables: {} };
const root = parsed.prototypes[parsed.rootPrototype];

// Two generated layouts exist. Every builder that owns a field map is followed by the
// accessor that names the field it exposes, so the accessor supplies the table name.
// Files that instead register "<Name>_List" closures fall back to that suffix.
const rootNames = [];
for (let n = 0; n < root.instructions.length - 1; n += 1) {
  const current = root.instructions[n];
  const next = root.instructions[n + 1];
  if (current.name !== 'KSTR' || next.name !== 'FNEW') continue;
  const name = root.constants[current.d ?? current.c]?.value;
  const prototype = root.constants[next.d ?? next.c]?.prototype;
  if (typeof name === 'string' && Number.isInteger(prototype)) rootNames.push({ name, prototype });
}
const accessorBuilders = parsed.prototypes
  .map(proto => ({ name: accessorName(parsed.prototypes[proto.index + 1]), prototype: proto.index }))
  .filter(entry => entry.name);
const builders = accessorBuilders.length
  ? accessorBuilders
  : rootNames.filter(entry => entry.name.endsWith('_List'))
    .map(entry => ({ name: entry.name.slice(0, -5), prototype: entry.prototype }));

for (const entry of builders) {
  if (only && !only.has(entry.name)) continue;
  const proto = parsed.prototypes[entry.prototype];
  const fields = fieldMap(proto);
  if (!fields) continue;
  const list = execute(proto);
  if (!Array.isArray(list)) continue;
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
  result.tables[entry.name] = rows;
}

const json = JSON.stringify(result);
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(json, 'utf8')));
console.log(JSON.stringify({
  output: outputPath,
  bytes: fs.statSync(outputPath).size,
  tables: Object.fromEntries(Object.entries(result.tables).map(([name, rows]) => [name, rows.length]))
}, null, 1));
