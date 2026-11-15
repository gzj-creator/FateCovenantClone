import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

// The mission result override calculates power from NpcAttr.power, which is 0
// for the first 47 original rows. The common result form already consumes the
// final battle's def_power. Use that same report field only when the mission
// table has no positive display value; never alter combat tables or rewards.
const ACCEPTED_SOURCE = new Map([
  ['f99aae429a312db11d3fda4ecafce6f987088820b51f414a428adeb24299ca1a', '64'],
  ['730b4c201bc5a50ee2e2a441002001cf44d963b9aa5b0a806b48ba2f64310b59', '32']
]);
const OPCODES = ('ISLT ISGE ISLE ISGT ISEQV ISNEV ISEQS ISNES ISEQN ISNEN ISEQP ISNEP ISTC ISFC IST ISF ISTYPE ISNUM MOV NOT UNM LEN ADDVN SUBVN MULVN DIVVN MODVN ADDNV SUBNV MULNV DIVNV MODNV ADDVV SUBVV MULVV DIVVV MODVV POW CAT KSTR KCDATA KSHORT KNUM KPRI KNIL UGET USETV USETS USETN USETP UCLO FNEW TNEW TDUP GGET GSET TGETV TGETS TGETB TGETR TSETV TSETS TSETB TSETM TSETR CALLM CALL CALLMT CALLT ITERC ITERN VARG ISNEXT RETM RET RET0 RET1 FORI JFORI FORL IFORL JFORL ITERL IITERL JITERL LOOP ILOOP JLOOP JMP FUNCF IFUNCF JFUNCF FUNCV IFUNCV JFUNCV FUNCC FUNCCW').split(' ');
const ABC = new Set(['TGETS', 'TGETV']);
const EXPECTED_CONSTANTS = ['_ndPower', 'LuaModule', '_resultObj', 'fightReport', 'battle_list', 'CombatPowerCalculator', 'GetDefTeamPower', 'tid', 'MissionInterfaceMgr', 'GetMissionIF', 'CountMulPower', 'atk_power', 'FightResultUIMgr', 'ShowPowerWithCustom', 'SetTeamIndex'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function uleb(value) {
  const bytes = [];
  do { const next = value >>> 7; bytes.push((value & 127) | (next ? 128 : 0)); value = next; } while (value);
  return Buffer.from(bytes);
}
function stringConstant(value) {
  return Buffer.concat([uleb(Buffer.byteLength(value) + 5), Buffer.from(value)]);
}
function encodeInstruction(instruction) {
  const out = Buffer.alloc(4);
  const op = OPCODES.indexOf(instruction.name);
  if (op < 0) throw new Error('Unknown opcode ' + instruction.name);
  const d = instruction.d ?? 0;
  out.writeUInt32LE((op | (instruction.a << 8) | ((ABC.has(instruction.name) ? instruction.c : d & 255) << 16)
    | ((ABC.has(instruction.name) ? instruction.b : d >>> 8) << 24)) >>> 0);
  return out;
}

export function patchDefeatPowerLua(source) {
  const sourceHash = hash(source);
  const architecture = ACCEPTED_SOURCE.get(sourceHash);
  if (!architecture) throw new Error('Unexpected FightResultMissionForm source SHA256: ' + sourceHash);
  const parsed = parseLuaJit(source);
  const target = parsed.prototypes[16];
  if (target.firstLine !== 287 || target.instructions.length !== 37 || target.numbers.length !== 0
      || target.upvalueCount !== 0 || target.debugSize !== 105
      || JSON.stringify(target.constants.map(value => value.value)) !== JSON.stringify(EXPECTED_CONSTANTS)) {
    throw new Error('Unexpected _ShowPowerCompare prototype');
  }
  const instructions = target.instructions.slice(0, 13).map(value => ({ ...value }));
  const labels = new Map();
  const jumps = [];
  const emit = (name, fields) => instructions.push({ name, ...fields });
  const jump = label => { jumps.push([instructions.length, label]); emit('JMP', { a: 4, d: 0 }); };
  // Original static power is a number. Keep its positive path, including the
  // original CountMulPower call, byte-for-byte unchanged.
  emit('KSHORT', { a: 4, d: 0 });
  emit('ISLT', { a: 4, d: 3 });
  jump('positiveStatic');
  emit('TGETS', { a: 4, b: 0, c: 2 });
  emit('TGETS', { a: 4, b: 4, c: 3 });
  emit('TGETS', { a: 4, b: 4, c: 4 });
  emit('TGETV', { a: 4, b: 4, c: 2 });
  emit('TGETS', { a: 4, b: 4, c: 15 });
  emit('ISF', { a: 0, d: 4 });
  jump('show');
  emit('KSHORT', { a: 5, d: 0 });
  emit('ISGE', { a: 5, d: 4 });
  jump('show');
  emit('MOV', { a: 3, d: 4 });
  // Report power describes the battle already simulated by the server. Do
  // not multiply it by the mission difficulty a second time.
  jump('show');
  labels.set('positiveStatic', instructions.length);
  instructions.push(...target.instructions.slice(13, 21).map(value => ({ ...value })));
  labels.set('show', instructions.length);
  instructions.push(...target.instructions.slice(21).map(value => ({ ...value })));
  for (const [pc, label] of jumps) instructions[pc].d = 32768 + labels.get(label) - pc - 1;

  const constants = [...EXPECTED_CONSTANTS, 'def_power'];
  const header = Buffer.concat([
    // These clients use modified LuaJIT headers. Preserve their four original
    // bytes rather than rewriting them with stock LuaJIT frame assumptions.
    source.subarray(target.start, target.start + 4),
    uleb(constants.length + 1), uleb(0), uleb(instructions.length), uleb(0)
  ]);
  const bytecode = Buffer.concat(instructions.map(instruction => {
    // Existing instructions are copied directly, preserving the 32/64 call ABI.
    if (instruction.raw !== undefined) {
      const raw = Buffer.alloc(4); raw.writeUInt32LE(instruction.raw); return raw;
    }
    return encodeInstruction(instruction);
  }));
  const namedConstants = Buffer.concat([...constants].reverse().map(stringConstant));
  const paddingBytes = target.end - target.start - header.length - bytecode.length - namedConstants.length;
  if (paddingBytes < 1 || paddingBytes > 122) throw new Error('Unexpected target padding budget');
  const padding = stringConstant('X'.repeat(paddingBytes - 1));
  if (padding.length !== paddingBytes) throw new Error('Unexpected padding encoding');
  const replacement = Buffer.concat([header, bytecode, padding, namedConstants]);
  if (replacement.length !== target.end - target.start) throw new Error('Prototype size changed');
  const output = Buffer.from(source);
  replacement.copy(output, target.start);
  const verified = parseLuaJit(output);
  if (verified.prototypes.length !== parsed.prototypes.length || verified.prototypes[16].instructions.length !== instructions.length
      || verified.prototypes[16].constants[15].value !== 'def_power' || verified.prototypes[16].debugSize !== 0) {
    throw new Error('Patched prototype did not round-trip');
  }
  if (!output.subarray(0, target.start).equals(source.subarray(0, target.start))
      || !output.subarray(target.end).equals(source.subarray(target.end))) throw new Error('Unrelated script bytes changed');
  return {
    bytes: output,
    report: { architecture, sourceSha256: sourceHash, outputSha256: hash(output), bytes: output.length,
      targetPrototype: 16, originalInstructions: target.instructions.length, patchedInstructions: instructions.length,
      changedRange: [target.start, target.end], unrelatedBytesPreserved: true, deviceValidated: false }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: patch-defeat-power-lua.mjs <source.lua.bin> <new-output.lua.bin>');
  if (fs.existsSync(output)) throw new Error('Refusing to overwrite output');
  const result = patchDefeatPowerLua(fs.readFileSync(input));
  fs.writeFileSync(output, result.bytes);
  console.log(JSON.stringify(result.report, null, 2));
}
