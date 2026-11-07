import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract ChatTable.Param and ChatTable.ReportConst from the shipped
// ChatTable.data.lua LuaJIT bytecode.
//
// ChatMgr reads both rows at module init:
//   * Param.send_time_interval / count_limit_in_cd / max_msg_count /
//     chat_word_count_limit / world_chat_level_limit / private_chat_lv_limit
//     drive the client-side send checks (ChatMgr SEND_TIME_INTERVAL etc.).
//   * ReportConst.day_times / report_msg_num / report_msg_valid_time are the
//     chat-report limits.
// Both tables are straight-line builders, so the shared table interpreter
// recovers the rows without executing client Lua.
//
// Usage:
//   node tools/extract-chat-table.mjs <ChatTable.data.lua> <out-param.json.gz> <out-report.json.gz>
//     [--parser <luajit-bytecode-parse.mjs>]

const args = process.argv.slice(2);
const inputPath = args[0];
const paramOutput = args[1];
const reportOutput = args[2];
const parserFlagIndex = args.indexOf('--parser');
const parserPath = parserFlagIndex === -1
  ? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')
  : args[parserFlagIndex + 1];
if (!inputPath || !paramOutput || !reportOutput) {
  console.error('usage: node tools/extract-chat-table.mjs <ChatTable.data.lua> <out-param.json.gz> <out-report.json.gz> [--parser <luajit-parse.mjs>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(parserPath).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

// The sub table name is the string constant of the prototype that directly
// follows its row builder in ChatTable.data.lua's LazyInit table.
const BUILDERS = [
  { name: 'Param', output: paramOutput },
  { name: 'ReportConst', output: reportOutput }
];

function builderPrototype(name) {
  const root = parsed.prototypes[parsed.rootPrototype];
  for (let pc = 0; pc < root.instructions.length - 1; pc += 1) {
    const label = root.instructions[pc];
    const factory = root.instructions[pc + 1];
    if (label.name !== 'KSTR' || factory.name !== 'FNEW') continue;
    const constant = root.constants[label.d ?? label.c];
    if (constant?.type !== 'string' || constant.value !== name) continue;
    return root.constants[factory.d]?.prototype;
  }
  throw new Error('ChatTable.' + name + ' factory is missing');
}

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

function constantIndex(instruction, proto) {
  // The two dump revisions in this repository store the constant index in
  // either d or c; both agree when the constant exists, so prefer the one that
  // resolves.
  if (proto.constants[instruction.d] !== undefined) return instruction.d;
  return instruction.c;
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
      case 'TDUP': regs[ins.a] = constantValue(proto.constants[constantIndex(ins, proto)]); break;
      case 'TNEW': regs[ins.a] = []; break;
      case 'MOV': regs[ins.a] = regs[ins.d]; break;
      case 'GGET': regs[ins.a] = { global: constantValue(proto.constants[constantIndex(ins, proto)]) }; break;
      case 'FNEW': regs[ins.a] = { closure: ins.d }; break;
      case 'KSTR': regs[ins.a] = constantValue(proto.constants[constantIndex(ins, proto)]); break;
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
      case 'TGETS': regs[ins.a] = (regs[ins.b] || {})[proto.constants[constantIndex(ins, proto)]?.value]; break;
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

function rowsOf(top) {
  // The Param / ReportConst factories build one row directly and return a
  // table whose [1] slot holds that row; the *_List factory wraps a list of
  // rows. Both shapes appear in ChatTable.data.lua.
  const candidate = Array.isArray(top?.[1]) ? top[1] : top;
  if (!Array.isArray(candidate)) throw new Error('ChatTable builder did not return a row');
  if (Array.isArray(candidate[1])) return candidate.slice(1);
  return candidate[1] === undefined ? [] : [candidate];
}

for (const { name, output } of BUILDERS) {
  const proto = parsed.prototypes[builderPrototype(name)];
  const fields = fieldMap(proto);
  if (!fields) throw new Error('builder for ChatTable.' + name + ' has no field map');
  const top = execute(proto);
  const rows = [];
  for (const row of rowsOf(top)) {
    if (!Array.isArray(row)) continue;
    const record = {};
    for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
      const value = row[ordinal + 1];
      if (value === undefined) continue;
      record[fields[ordinal]] = cloneValue(value);
    }
    if (Number.isInteger(record.tid)) rows.push(record);
  }
  rows.sort((left, right) => left.tid - right.tid);
  const result = {
    source: path.basename(inputPath),
    extractor: 'tools/extract-chat-table.mjs',
    table: name,
    fields,
    rows
  };
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, zlib.gzipSync(Buffer.from(JSON.stringify(result, null, 1) + '\n', 'utf8')));
  console.log(JSON.stringify({ output, table: name, rows: rows.length }));
}
