import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the client FreePrivilegeActTable rows from a LuaJIT bytecode dump.
//
// FreePrivilegeActTable.data.lua ships as LuaJIT bytecode (1,266 bytes in the
// v10 client bundle). The root prototype registers two row builders through
// LazyInit(name, builder): Version (proto 2) and Show (proto 5). Each builder is
// straight-line bytecode that pushes one literal row per record and stores it
// under its tid, so the same small interpreter used by
// tools/extract-diamond-bank-table.mjs recovers the rows. Row values are arrays
// indexed by the field ordinal of the leading field map constant.
// Usage:
//   node tools/extract-free-privilege-table.mjs <FreePrivilegeActTable.data.lua> <out.json.gz>
//     [--parser <luajit-bytecode-parse.mjs>]

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
const parserFlagIndex = args.indexOf('--parser');
const parserPath = parserFlagIndex === -1
  ? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')
  : args[parserFlagIndex + 1];
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-free-privilege-table.mjs <FreePrivilegeActTable.data.lua> <out.json.gz> [--parser <luajit-parse.mjs>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(parserPath).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

// Sub tables the local server needs, with the fields each builder must expose.
// A client build that renames or drops a field aborts the extraction instead of
// writing a half-filled table the server would later trust.
const BUILDERS = [
  { name: 'Version', fields: ['tid', 'privilege_day', 'is_month_card', 'month_card'] },
  { name: 'Show', fields: ['tid', 'prefab', 'title', 'desc', 'privilege_tips', 'txt_cards_tips'] }
];

// The value index tables (Version_List / Show_List) only
// group tids for O(1) lookup on the client; the server rebuilds those indexes
// from the rows themselves.
const root = parsed.prototypes[parsed.rootPrototype];
const constructors = new Map();
for (let n = 0; n < root.instructions.length - 1; n += 1) {
  const current = root.instructions[n], next = root.instructions[n + 1];
  if (current.name === 'KSTR' && next.name === 'FNEW') {
    constructors.set(root.constants[current.d].value, root.constants[next.d].prototype);
  }
}

function cloneValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (typeof value === 'object') {
    // GGET TableEmpty becomes a { global: 'TableEmpty' } placeholder in the
    // interpreter; the client reads it as an empty table, so emit [].
    if (Object.keys(value).length === 1 && value.global === 'TableEmpty') return [];
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
  if (value && typeof value === 'object' && !Array.isArray(value) && value.global === 'TableEmpty') return [];
  if (!Array.isArray(value)) return value;
  return value.slice(1).map((item) => normalizeList(item));
}

const result = { source: path.basename(inputPath), extractor: 'tools/extract-free-privilege-table.mjs', tables: {} };
for (const { name, fields: expectedFields } of BUILDERS) {
  const protoIndex = constructors.get(name);
  if (protoIndex === undefined) throw new Error('Missing FreePrivilegeActTable sub table: ' + name);
  const proto = parsed.prototypes[protoIndex];
  const fields = fieldMap(proto);
  if (!fields) throw new Error('builder for ' + name + ' has no field map');
  const missing = expectedFields.filter((field) => !fields.includes(field));
  if (missing.length) throw new Error(name + ' is missing fields: ' + missing.join(','));
  const list = execute(proto);
  if (!Array.isArray(list)) throw new Error('builder for ' + name + ' did not return a list');
  const rows = [];
  for (const key of Object.keys(list)) {
    const row = list[key];
    if (!Array.isArray(row)) continue;
    const tid = Number(row[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0) continue;
    const record = {};
    for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
      const value = row[ordinal + 1];
      if (value === undefined) continue;
      record[fields[ordinal]] = normalizeList(value);
    }
    rows.push(record);
  }
  rows.sort((left, right) => Number(left.tid) - Number(right.tid));
  result.tables[name] = { fields, rows };
}

const json = JSON.stringify(result);
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(json, 'utf8')));
for (const [name, value] of Object.entries(result.tables)) {
  console.log(name, value.rows.length + ' rows', 'fields=' + value.fields.join(','));
}
