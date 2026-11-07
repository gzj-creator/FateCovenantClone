import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readTextAssets } from './unityfs-read.mjs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

// Recover the shipped client command registry from the core bundle's Cmd.lua
// bytecode. Cmd.lua builds exactly one table (global `Cmd`) that holds the
// name-to-wire-type maps used by the network layer:
//
//   c2s_index   request name -> numeric pb_c2s.type
//   c2s_back    request name -> response protobuf schema name
//   c2s_switch  request name -> numeric switch default
//   s2c_index   push name    -> numeric pb_s2c.type
//   s2c         push name    -> protobuf schema name
//
// Connection:Send resolves a request through `Cmd.c2s_index[cmd]` and aborts
// with "send msg type error" when the name is missing, so this table is the
// only place a client-issued request type can come from. Bytecode only: no
// client Lua is executed and no network traffic is produced.
//
// Usage:
//   node tools/extract-cmd-registry.mjs
//   node tools/extract-cmd-registry.mjs --bundle assets/Android/script/lua/64_lua_core.bundle
//   node tools/extract-cmd-registry.mjs --cmd <extracted Cmd.lua.bin>
//        [--lookup name1,name2] [--range 7700-7900] [--out registry.json]

const SLOT_NAMES = ['c2s_index', 'c2s_back', 'c2s_switch', 's2c_index', 's2c'];
const DEFAULT_BUNDLE = path.join(import.meta.dirname, '..', 'assets', 'Android', 'script', 'lua', '64_lua_core.bundle');

function parseArguments(argv) {
  const options = { bundle: null, cmd: null, lookups: [], ranges: [], out: null, full: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === '--bundle') { options.bundle = path.resolve(value); index += 1; continue; }
    if (argument === '--cmd') { options.cmd = path.resolve(value); index += 1; continue; }
    if (argument === '--out') { options.out = path.resolve(value); index += 1; continue; }
    if (argument === '--full') { options.full = true; continue; }
    if (argument === '--lookup') {
      options.lookups.push(...String(value).split(',').map(name => name.trim()).filter(Boolean));
      index += 1;
      continue;
    }
    if (argument === '--range') {
      const match = /^(\d+)-(\d+)$/.exec(String(value ?? ''));
      if (!match) throw new Error('--range expects <from>-<to>');
      options.ranges.push({ from: Number(match[1]), to: Number(match[2]) });
      index += 1;
      continue;
    }
    throw new Error('Unknown argument: ' + argument);
  }
  return options;
}

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function readCommandBytes(options) {
  if (options.cmd) {
    const bytes = fs.readFileSync(options.cmd);
    return { bytes, source: { kind: 'textasset', path: options.cmd, bytes: bytes.length, sha256: sha256(bytes) } };
  }
  const bundlePath = options.bundle ?? DEFAULT_BUNDLE;
  if (!fs.existsSync(bundlePath)) throw new Error('Core bundle not found: ' + bundlePath);
  const bundleBytes = fs.readFileSync(bundlePath);
  const asset = readTextAssets(bundleBytes).find(candidate => candidate.name === 'Cmd.lua');
  if (!asset) throw new Error('Cmd.lua TextAsset is missing from ' + bundlePath);
  return {
    bytes: asset.bytes,
    source: {
      kind: 'bundle',
      bundlePath,
      bundleBytes: bundleBytes.length,
      bundleSha256: sha256(bundleBytes),
      textAsset: asset.pathId + '-' + asset.name,
      textAssetBytes: asset.bytes.length,
      textAssetSha256: sha256(asset.bytes)
    }
  };
}

function registryPrototype(parsed) {
  return parsed.prototypes.find(prototype => {
    const strings = new Set(prototype.constants.filter(constant => constant.type === 'string').map(constant => constant.value));
    if (!SLOT_NAMES.every(name => strings.has(name))) return false;
    return prototype.instructions.some(instruction => instruction.name === 'GGET'
      && prototype.constants[instruction.d]?.type === 'string'
      && prototype.constants[instruction.d].value === 'Codec');
  });
}

// The registry is assembled with straight-line bytecode: `TDUP A <constant>`
// loads a slot table, then `TSETS <table> <registry> <key>` stores it under a
// constant key. Tracking the last constant assigned to each register recovers
// the slot -> constant mapping without executing anything.
function extractSlots(parsed) {
  const prototype = registryPrototype(parsed);
  if (!prototype) throw new Error('Cmd registry prototype is missing');
  const assigned = new Map();
  const slots = new Map();
  let registryRegister = null;
  for (const instruction of prototype.instructions) {
    if (instruction.name === 'TDUP') { assigned.set(instruction.a, instruction.d); continue; }
    if (instruction.name === 'TNEW' || instruction.name === 'KSTR' || instruction.name === 'GGET'
      || instruction.name === 'FNEW' || instruction.name === 'KPRI' || instruction.name === 'KNIL') {
      assigned.set(instruction.a, null);
      continue;
    }
    if (instruction.name === 'MOV') { assigned.set(instruction.a, assigned.get(instruction.d) ?? null); continue; }
    if (instruction.name !== 'TSETS') continue;
    const key = prototype.constants[instruction.c];
    if (key?.type !== 'string' || !SLOT_NAMES.includes(key.value)) continue;
    const constantIndex = assigned.get(instruction.a);
    const constant = prototype.constants[constantIndex];
    if (!constant || constant.type !== 'table') {
      throw new Error('Slot ' + key.value + ' does not resolve to a table constant');
    }
    registryRegister = registryRegister ?? instruction.b;
    if (instruction.b !== registryRegister) throw new Error('Slot ' + key.value + ' belongs to a second table');
    slots.set(key.value, { constantIndex, entries: constant.hash });
  }
  return { prototype, slots };
}

function toObject(entries) {
  const object = {};
  for (const [key, value] of entries) object[key] = value;
  return object;
}

const options = parseArguments(process.argv.slice(2));
const { bytes, source } = readCommandBytes(options);
const parsed = parseLuaJit(bytes);
const { prototype, slots } = extractSlots(parsed);

const summary = {
  extractor: 'tools/extract-cmd-registry.mjs',
  source,
  prototype: { index: prototype.index, firstLine: prototype.firstLine ?? null, instructions: prototype.instructions.length },
  slots: Object.fromEntries([...slots].map(([name, slot]) => [name, { constantIndex: slot.constantIndex, entries: slot.entries.length }]))
};

if (options.lookups.length) {
  summary.lookups = Object.fromEntries(options.lookups.map(name => [name, Object.fromEntries(
    [...slots].map(([slotName, slot]) => {
      const hit = slot.entries.find(([key]) => key === name);
      return [slotName, hit ? hit[1] : null];
    })
  )]));
}

if (options.ranges.length) {
  const c2s = slots.get('c2s_index').entries;
  summary.ranges = options.ranges.map(({ from, to }) => {
    const hits = c2s.filter(([, value]) => typeof value === 'number' && value >= from && value <= to);
    return { from, to, count: hits.length, sample: hits.slice(0, 20).map(([name, value]) => ({ name, type: value })) };
  });
  const numbers = c2s.map(([, value]) => value).filter(value => typeof value === 'number');
  summary.numericCensus = {
    entries: numbers.length,
    uniqueTypes: new Set(numbers).size,
    min: Math.min(...numbers),
    max: Math.max(...numbers)
  };
}

if (options.out) {
  const output = options.full
    ? { ...summary, registry: Object.fromEntries([...slots].map(([name, slot]) => [name, toObject(slot.entries)])) }
    : summary;
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, JSON.stringify(output, null, 2) + '\n');
}

console.log(JSON.stringify(summary, null, 2));
