import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the MsgTable.ChannelType rows from a LuaJIT bytecode dump.
//
// MsgTable.data.lua ships as LuaJIT bytecode. ChatChannel/MsgChannel resolve a
// channel type through MsgTable.ChannelType (tid) and the table also carries the
// client rendering flags used by ChatMgr. The rows are built by straight-line
// bytecode, so the shared table interpreter recovers them without executing
// client Lua.
//
// Usage:
//   node tools/extract-msg-channel-table.mjs <MsgTable.data.lua> <out.json.gz>
//     [--parser <luajit-bytecode-parse.mjs>]

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];
const parserFlagIndex = args.indexOf('--parser');
const parserPath = parserFlagIndex === -1
  ? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs')
  : args[parserFlagIndex + 1];
if (!inputPath || !outputPath) {
  console.error('usage: node tools/extract-msg-channel-table.mjs <MsgTable.data.lua> <out.json.gz> [--parser <luajit-parse.mjs>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(parserPath).href);
const parsed = parseLuaJit(fs.readFileSync(inputPath));

// MsgTable.data.lua registers every sub table with LazyInit(name, factory). The
// ChannelType factory is the prototype that follows the "ChannelType" string.
function channelTypePrototype() {
  const root = parsed.prototypes[parsed.rootPrototype];
  for (let pc = 0; pc < root.instructions.length - 2; pc += 1) {
    const name = root.instructions[pc];
    const factory = root.instructions[pc + 1];
    if (name.name !== 'KSTR' || factory.name !== 'FNEW') continue;
    if (root.constants[name.d]?.value !== 'ChannelType') continue;
    return parsed.prototypes[root.constants[factory.d].prototype];
  }
  throw new Error('MsgTable.ChannelType factory is missing');
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
      case 'GGET': regs[ins.a] = { global: constantValue(proto.constants[ins.d]) }; break;
      case 'FNEW': regs[ins.a] = { closure: ins.d }; break;
      case 'KSTR': regs[ins.a] = constantValue(proto.constants[ins.d]); break;
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
  if (!Array.isArray(value)) return value;
  return value.slice(1).map((item) => normalizeList(item));
}

// Only the fields the personal server interprets are kept. lua_module names a
// client UI class, and the localisation columns (prefix_title/title/text_prop)
// address the client TextTable, so neither is needed here.
const SERVER_FIELDS = [
  'tid', 'forbid_msg_sync', 'default_in_channel', 'is_cross', 'need_log', 'is_chat', 'word_leagle_source'
];

const proto = channelTypePrototype();
const fields = fieldMap(proto);
if (!fields) throw new Error('ChannelType builder has no field map');
const list = execute(proto);
if (!Array.isArray(list)) throw new Error('ChannelType builder did not return a list');

const rows = [];
for (const entry of list) {
  if (!Array.isArray(entry)) continue;
  const record = {};
  for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
    const name = fields[ordinal];
    if (!SERVER_FIELDS.includes(name)) continue;
    const value = entry[ordinal + 1];
    if (value === undefined) continue;
    record[name] = normalizeList(value);
  }
  if (Number.isInteger(record.tid)) rows.push(record);
}
rows.sort((left, right) => left.tid - right.tid);

const result = {
  source: path.basename(inputPath),
  extractor: 'tools/extract-msg-channel-table.mjs',
  table: 'ChannelType',
  fields: SERVER_FIELDS,
  rows
};

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, zlib.gzipSync(Buffer.from(JSON.stringify(result, null, 1) + '\n', 'utf8')));
console.log(JSON.stringify({ output: outputPath, rows: rows.length, tids: rows.map((row) => row.tid) }));
