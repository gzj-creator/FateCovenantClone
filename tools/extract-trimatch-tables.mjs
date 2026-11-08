import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the triple-match / overall PVP tables from the shipped LuaJIT table
// bytecode into personal-server/assets/tables.
//
// The interpreter is the same straight-line table construction subset that
// tools/extract-general-dungeon-table.mjs uses: only the opcodes emitted by the
// client table builders are supported, and anything else fails extraction
// instead of producing guessed rows.
//
// Usage:
//   node tools/extract-trimatch-tables.mjs <table-dump-directory> [--parser <luajit-bytecode-parse.mjs>] [--out <assets/tables>]
//
// <table-dump-directory> is a directory holding the decoded client assets named
// <hash>-<TableName>.data.lua.bin (the analysis scratchpad layout).

const TABLES = [
  'TripleMatchTable',
  'TripleMatchFightTable',
  'BattleTriMatchHeroTable',
  'BattleTriMatchEquipTable',
  'BattleTriMatchLineupTable',
  'TriMatchPvpTable',
  'TriMatchTowerTable',
  'OverallPvpTable'
];

const args = process.argv.slice(2);
const inputDirectory = args[0];
const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const parserPath = flag('--parser') ?? path.join(import.meta.dirname, 'luajit-bytecode-parse.mjs');
const outDirectory = path.resolve(flag('--out') ?? path.join(import.meta.dirname, '..', 'personal-server', 'assets', 'tables'));
if (!inputDirectory) {
  console.error('usage: node tools/extract-trimatch-tables.mjs <table-dump-directory> [--parser <p>] [--out <dir>]');
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

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  const items = value.slice(1).map(normalizeList);
  while (items.length && items.at(-1) === undefined) items.pop();
  return items.map(item => item === undefined ? null : item);
}

function findTableFile(directory, name) {
  const matches = fs.readdirSync(directory).filter(file => file === name + '.data.lua.bin'
    || file.endsWith('-' + name + '.data.lua.bin'));
  if (matches.length !== 1) throw new Error('Expected one dump for ' + name + ', found ' + matches.length);
  return path.join(directory, matches[0]);
}

let extracted = 0;
for (const name of TABLES) {
  const input = findTableFile(inputDirectory, name);
  const parsed = parseLuaJit(fs.readFileSync(input));
  const tableNameAfter = protoIndex => {
    const next = parsed.prototypes[protoIndex + 1];
    const candidates = (next?.constants ?? []).filter(constant => constant.type === 'string').map(constant => constant.value);
    return candidates[0] ?? null;
  };
  const result = { source: path.basename(input), extractor: 'tools/extract-trimatch-tables.mjs', tables: {} };
  for (const proto of parsed.prototypes) {
    const fields = fieldMap(proto);
    if (!fields) continue;
    let value;
    try { value = execute(proto); } catch { continue; }
    if (!Array.isArray(value)) continue;
    const tableName = tableNameAfter(proto.index);
    if (!tableName || !/^[A-Z][A-Za-z0-9_]*$/.test(tableName)) continue;
    const rows = [];
    for (let index = 1; index < value.length; index += 1) {
      const raw = value[index];
      if (!raw) continue;
      const row = {};
      for (let ordinal = 0; ordinal < fields.length; ordinal += 1) {
        const cell = Array.isArray(raw) ? raw[ordinal + 1] : raw[fields[ordinal]];
        if (cell === undefined) continue;
        row[fields[ordinal]] = normalizeList(cell);
      }
      rows.push(row);
    }
    if (!rows.length) continue;
    result.tables[tableName] = { fields, rows };
  }
  if (!Object.keys(result.tables).length) throw new Error('No tables extracted from ' + name);
  const output = path.join(outDirectory, name + '.data.lua.json.gz');
  fs.mkdirSync(outDirectory, { recursive: true });
  fs.writeFileSync(output, zlib.gzipSync(Buffer.from(JSON.stringify(result), 'utf8')));
  extracted += 1;
  console.log(name, Object.keys(result.tables).length + ' tables', fs.statSync(output).size + ' bytes');
}
console.log(JSON.stringify({ extracted }));
