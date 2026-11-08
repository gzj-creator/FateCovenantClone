import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

// HeroTable.NpcAttr ships as separate LuaJIT data shards. Each shard contains
// one builder whose rows are {tid, attr_list, skill_lv, power}. Extract only
// data fields; executable Lua is never run.
//
// Usage:
//   node tools/extract-hero-npcattr.mjs <table-dump-directory> [--parser <luajit-bytecode-parse.mjs>] [--out <assets/tables>]

const args = process.argv.slice(2);
const inputDirectory = args[0];
const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const parserPath = flag('--parser') ?? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs');
const outDirectory = path.resolve(flag('--out') ?? path.join(import.meta.dirname, '..', 'personal-server', 'assets', 'tables'));
if (!inputDirectory) {
  console.error('usage: node tools/extract-hero-npcattr.mjs <table-dump-directory> [--parser <p>] [--out <dir>]');
  process.exit(2);
}

const { parseLuaJit } = await import(pathToFileURL(path.resolve(parserPath)).href);

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
      case 'TSETS':
      case 'TSETB': slot(ins.b)[ins.c] = regs[ins.a]; break;
      case 'TSETV': slot(ins.b)[regs[ins.c]] = regs[ins.a]; break;
      case 'TSETM': {
        const table = slot(ins.a - 1), start = proto.numbers[ins.d - 1];
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
      default: throw new Error('unsupported opcode ' + ins.name + ' at pc ' + pc);
    }
  }
  return undefined;
}

function fieldMap(proto) {
  for (const constant of proto.constants) {
    if (constant.type !== 'table' || constant.array.length !== 0 || constant.hash.length === 0) continue;
    if (!constant.hash.every(entry => typeof entry[0] === 'string' && Number.isInteger(entry[1]))) continue;
    const names = constant.hash.map(entry => entry[0]);
    if (names.includes('tid') && names.includes('attr_list') && names.includes('power')) {
      const fields = [];
      for (const [name, ordinal] of constant.hash) fields[ordinal - 1] = name;
      return fields;
    }
  }
  return null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  const items = value.slice(1).map(normalizeList);
  while (items.length && items.at(-1) === undefined) items.pop();
  return items.map(item => item === undefined ? null : item);
}

const shardPattern = /-HeroTable\.NpcAttr\.(\d+)\.data\.lua\.bin$/;
const shards = fs.readdirSync(inputDirectory)
  .filter(file => shardPattern.test(file))
  .map(file => ({ file, order: Number(file.match(shardPattern)[1]) }))
  .sort((left, right) => left.order - right.order);
if (!shards.length) throw new Error('No HeroTable.NpcAttr shard found in ' + inputDirectory);

const rows = new Map();
const fieldsSeen = new Set();
for (const shard of shards) {
  const parsed = parseLuaJit(fs.readFileSync(path.join(inputDirectory, shard.file)));
  const proto = parsed.prototypes.find(candidate => fieldMap(candidate));
  if (!proto) throw new Error('No NpcAttr builder found in ' + shard.file);
  const fields = fieldMap(proto);
  fieldsSeen.add(fields.join(','));
  const value = execute(proto);
  if (!Array.isArray(value)) throw new Error('NpcAttr shard did not build a table: ' + shard.file);
  for (let index = 1; index < value.length; index += 1) {
    const raw = value[index];
    if (!raw || !Array.isArray(raw)) continue;
    const row = {};
    for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
      const cell = raw[ordinal + 1];
      if (cell === undefined) continue;
      row[fields[ordinal]] = normalizeList(cell);
    }
    const tid = Number(row.tid);
    if (!Number.isSafeInteger(tid) || tid <= 0) continue;
    if (rows.has(tid)) throw new Error('Duplicate NpcAttr tid ' + tid + ' in ' + shard.file);
    rows.set(tid, row);
  }
}
if (fieldsSeen.size !== 1) throw new Error('NpcAttr shards disagree on the field map: ' + [...fieldsSeen].join(' | '));

const sorted = [...rows.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
const result = {
  source: shards.map(shard => shard.file),
  extractor: 'tools/extract-hero-npcattr.mjs',
  tables: { NpcAttr: { fields: [...fieldsSeen][0].split(','), rows: sorted } }
};
const output = path.join(outDirectory, 'HeroTableNpcAttr.data.lua.json.gz');
fs.mkdirSync(outDirectory, { recursive: true });
fs.writeFileSync(output, zlib.gzipSync(Buffer.from(JSON.stringify(result), 'utf8')));
console.log(JSON.stringify({ shards: shards.length, rows: sorted.length, bytes: fs.statSync(output).size, first: sorted[0].tid, last: sorted.at(-1).tid }));
