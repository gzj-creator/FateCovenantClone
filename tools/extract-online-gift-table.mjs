import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the shipped OnlineGiftTable LuaJIT bytecode without guessing rows.
// The data file uses straight-line table constructors and contains exactly the
// OnlineGift, Period, and PeriodMax sub-tables.
//
// Usage:
//   node tools/extract-online-gift-table.mjs <OnlineGiftTable.data.lua> <out.json.gz>

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-online-gift-table.mjs <OnlineGiftTable.data.lua> <out.json.gz>');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

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

function execute(proto) {
  const regs = [];
  const slot = index => {
    if (regs[index] === undefined || regs[index] === null) regs[index] = [];
    return regs[index];
  };
  for (let pc = 0; pc < proto.instructions.length; pc += 1) {
    const ins = proto.instructions[pc];
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
      case 'TSETS': case 'TSETB': slot(ins.b)[ins.c] = regs[ins.a]; break;
      case 'TSETV': slot(ins.b)[regs[ins.c]] = regs[ins.a]; break;
      case 'TSETM': {
        const table = slot(ins.a - 1), start = proto.numbers[ins.d - 1];
        for (let index = 0; regs[ins.a + index] !== undefined; index += 1) table[start + index] = regs[ins.a + index];
        break;
      }
      case 'TGETB': regs[ins.a] = (regs[ins.b] || [])[ins.c]; break;
      case 'TGETS': regs[ins.a] = (regs[ins.b] || {})[ins.c]; break;
      case 'TGETV': regs[ins.a] = (regs[ins.b] || [])[regs[ins.c]]; break;
      case 'CALL': case 'CALLM': {
        const args = [];
        for (let index = 1; index < ins.c; index += 1) args.push(regs[ins.a + index]);
        const table = args.find(value => Array.isArray(value))
          || args.find(value => value && typeof value === 'object' && value.global === undefined && value.closure === undefined);
        regs[ins.a] = table === undefined ? regs[ins.a] : table;
        break;
      }
      case 'UCLO': case 'LOOP': case 'ILOOP': case 'JLOOP': case 'JFORI':
      case 'FORI': case 'ITERL': case 'IITERL': case 'JITERL': break;
      case 'JMP': pc += ins.d - 1; break;
      case 'RET': return regs[ins.a];
      case 'RET0': return null;
      case 'RET1': return regs[ins.a];
      default: throw new Error(`unsupported opcode ${ins.name} at pc ${pc} of prototype ${proto.index}`);
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

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  const items = value.slice(1).map(normalizeList);
  while (items.length && items.at(-1) === undefined) items.pop();
  return items.map(item => item === undefined ? null : item);
}

function tableNameAfter(protoIndex) {
  const next = parsed.prototypes[protoIndex + 1];
  return next?.constants.find(constant => constant.type === 'string')?.value ?? null;
}

const builders = [];
for (const proto of parsed.prototypes) {
  const fields = fieldMap(proto);
  if (!fields) continue;
  let value;
  try { value = execute(proto); } catch { continue; }
  if (!Array.isArray(value)) continue;
  const name = tableNameAfter(proto.index);
  if (['OnlineGift', 'Period', 'PeriodMax'].includes(name)) builders.push({ name, proto: proto.index, fields });
}

const result = { source: path.basename(inputPath), extractor: 'tools/extract-online-gift-table.mjs', tables: {} };
for (const { name, proto: protoIndex, fields } of builders) {
  const list = execute(parsed.prototypes[protoIndex]);
  const rows = [];
  for (let index = 1; index < list.length; index += 1) {
    const raw = list[index];
    if (!raw) continue;
    const row = {};
    for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
      const value = Array.isArray(raw) ? raw[ordinal + 1] : raw[fields[ordinal]];
      if (value !== undefined) row[fields[ordinal]] = normalizeList(value);
    }
    rows.push(row);
  }
  result.tables[name] = { fields, rows };
}

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(JSON.stringify(result), 'utf8')));
for (const [name, value] of Object.entries(result.tables)) {
  console.log(name, value.rows.length + ' rows', 'fields=' + value.fields.join(','));
}
