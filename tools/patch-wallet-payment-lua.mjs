import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPECTED_SOURCE_SHA256 = '5ec9f6c2aaaf83ade362f40596fea4e8875631efdc08d5f05a9b646a6a271ada';
const TARGET_PROTOTYPE = 12;
const TARGET_INSTRUCTION_COUNT = 46;
const EXPECTED_GC_CONSTANTS = 20;
const ABC_INSTRUCTIONS = new Set([
  'ADDVN', 'SUBVN', 'MULVN', 'DIVVN', 'MODVN', 'ADDNV', 'SUBNV', 'MULNV', 'DIVNV', 'MODNV',
  'ADDVV', 'SUBVV', 'MULVV', 'DIVVV', 'MODVV', 'POW', 'CAT', 'TGETV', 'TGETS', 'TGETB', 'TGETR',
  'TSETV', 'TSETS', 'TSETB', 'TSETR', 'CALLM', 'CALL', 'ITERC', 'ITERN', 'VARG'
]);

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function loadParser() {
  const sourcePath = path.resolve('analysis/tools/inspect-lua-bytecode.mjs');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const parserSource = source
    .slice(source.indexOf('const names ='), source.indexOf('const selected ='))
    .replace(
      'if (supported.length !== 1) throw new Error(`Constant boundary candidates: ${attempts.length}, supported: ${supported.length}, required UVs: ${requiredUv}`);',
      'if (supported.length !== 1) throw new Error(`Prototype ${prototypes.length}: constant boundary candidates ${attempts.length}, supported ${supported.length}, required UVs ${requiredUv}`);'
    );
  return new Function(parserSource + ';return parse;')();
}

function uleb(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid ULEB128 value');
  const bytes = [];
  do {
    let byte = value & 0x7f;
    value = Math.floor(value / 128);
    if (value) byte |= 0x80;
    bytes.push(byte);
  } while (value);
  return Buffer.from(bytes);
}

function constant(value) {
  if (value.type === 'child') return uleb(0);
  if (value.type === 'string') return Buffer.concat([uleb(Buffer.byteLength(value.value) + 5), Buffer.from(value.value)]);
  if (value.type === 'table') {
    if (!Array.isArray(value.array) || !Array.isArray(value.hash)) throw new Error('Invalid Lua table constant.');
    const tableScalar = item => {
      if (item === null) return uleb(0);
      if (item === false) return uleb(1);
      if (item === true) return uleb(2);
      if (Number.isInteger(item)) return Buffer.concat([uleb(3), uleb(item)]);
      if (typeof item === 'string') return Buffer.concat([uleb(Buffer.byteLength(item) + 5), Buffer.from(item)]);
      throw new Error(`Unsupported patched table scalar: ${String(item)}`);
    };
    return Buffer.concat([
      uleb(1),
      uleb(value.array.length),
      uleb(value.hash.length),
      ...value.array.map(tableScalar),
      ...value.hash.flatMap(([key, item]) => [tableScalar(key), tableScalar(item)])
    ]);
  }
  throw new Error(`Unsupported patched constant type: ${value.type}`);
}

function encodeConstants(constants) {
  // LuaJIT stores GC constants in reverse order.
  return Buffer.concat([...constants].reverse().map(constant));
}

function encodeInstructions(prototype) {
  const bytes = Buffer.alloc(prototype.instructions.length * 4);
  for (let index = 0; index < prototype.instructions.length; index++) {
    const instruction = prototype.instructions[index];
    bytes.writeUInt32LE(
      (instruction.op | (instruction.a << 8) | (instruction.c << 16) | (instruction.b << 24)) >>> 0,
      index * 4
    );
  }
  return bytes;
}

function makeReplacementConstants(originalConstantsBytes) {
  const named = [
    { type: 'string', value: 'RechargeMgr' },
    { type: 'string', value: 'RechargeOrBuyGift' },
    { type: 'string', value: 'DailyDiscountMgr' },
    { type: 'string', value: 'IS_EXTRA_BUY' },
    { type: 'table', array: [null, null, 0, 0], hash: [] }
  ];
  // The prototype length includes its debug metadata. Keep the original GC
  // count and use unreachable string constants as length-preserving padding.
  // Twelve names are twelve bytes and three are thirteen bytes. Together they
  // keep the full constant stream at 267 bytes without moving debug data or
  // any following prototype.
  const padding = Array.from({ length: 12 }, (_, index) => ({
    type: 'string',
    value: `PadNode${String(index).padStart(4, '0')}X`
  }));
  for (let index = 12; index < 15; index++) {
    padding.push({ type: 'string', value: `PadNode${String(index).padStart(5, '0')}X` });
  }
  const result = [...named, ...padding];
  if (result.length !== EXPECTED_GC_CONSTANTS) throw new Error('Replacement GC constant count changed.');
  if (encodeConstants(result).length !== originalConstantsBytes.length) {
    throw new Error('Replacement constants do not preserve the original byte length.');
  }
  return result;
}

export function patchWalletPaymentLua(sourcePath, outputPath) {
  const source = fs.readFileSync(sourcePath);
  const sourceHash = sha256(source);
  if (sourceHash !== EXPECTED_SOURCE_SHA256) throw new Error(`Unexpected RechargeSuperGiftBannerNode dump SHA256: ${sourceHash}`);
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite.');

  const parsed = loadParser()(source);
  if (parsed.flags & 2) throw new Error('Expected a dump with intact debug metadata.');
  const prototype = parsed.prototypes.find(value => value.index === TARGET_PROTOTYPE);
  if (!prototype) throw new Error('Target prototype is absent.');
  if (prototype.instructions.length !== TARGET_INSTRUCTION_COUNT) throw new Error('Unexpected target instruction count.');
  const expectedStrings = [
    'DailyDiscountTable', 'Recharge', 'TID_DAILY_DISCOUNT_ONE_KEY', 'WeekHuntDataMgr', 'IsTodayGiftCanBuy',
    'recharge_id', 'RechargeTable', 'UIKit', 'ShowMsg', 'LocalizeTable', 'DAILY_SELECTION_HAS_BUY',
    'period', 'GetCurPeriod', 'day', 'FlushTime', 'GetDayIndex', 'isExtraBuy', 'DailyDiscountMgr',
    'IS_EXTRA_BUY', 'RechargeGift'
  ];
  const actualStrings = prototype.constants.map(value => value.value);
  if (JSON.stringify(actualStrings) !== JSON.stringify(expectedStrings)) throw new Error('Unexpected target constants.');

  const opcodes = new Map();
  for (const item of parsed.prototypes) for (const instruction of item.instructions) opcodes.set(instruction.name, instruction.op);
  const instruction = (pc, name, fields = {}) => {
    const d = fields.d ?? 0;
    const abc = ABC_INSTRUCTIONS.has(name);
    return {
      pc,
      op: opcodes.get(name),
      name,
      a: fields.a ?? 0,
      b: abc ? (fields.b ?? 0) : ((d >>> 8) & 0xff),
      c: abc ? (fields.c ?? 0) : (d & 0xff),
      d
    };
  };

  // This mirrors the normal priced-gift callback in prototype 7. The tid is
  // assembled numerically because the target prototype has no real upvalues.
  // RechargeOrBuyGift opens payment confirmation first; the network request is
  // sent only after the player confirms.
  const targetInstructions = [
    instruction(1, 'GGET', { a: 0, d: 0 }),
    instruction(2, 'TGETS', { a: 0, b: 0, c: 1 }),
    instruction(3, 'KSHORT', { a: 2, d: 30000 }),
    instruction(4, 'KSHORT', { a: 4, d: 16003 }),
    instruction(5, 'ADDVV', { a: 2, b: 2, c: 4 }),
    instruction(6, 'TDUP', { a: 3, d: 4 }),
    instruction(7, 'GGET', { a: 4, d: 2 }),
    instruction(8, 'TGETS', { a: 4, b: 4, c: 3 }),
    instruction(9, 'NOT', { a: 4, d: 4 }),
    instruction(10, 'TSETB', { a: 4, b: 3, c: 1 }),
    instruction(11, 'CALL', { a: 0, b: 1, c: 3 }),
    instruction(12, 'RET0', { a: 0, d: 1 })
  ];
  while (targetInstructions.length < TARGET_INSTRUCTION_COUNT) {
    targetInstructions.push(instruction(targetInstructions.length + 1, 'MOV', { a: 0, d: 0 }));
  }
  if (opcodes.get('MOV') == null || opcodes.get('RET0') == null) throw new Error('Required LuaJIT opcode is absent.');

  const instructionsStart = prototype.instructions[0].offset;
  const lastInstruction = prototype.instructions.at(-1);
  const instructionsEnd = lastInstruction.offset + 4;
  if (instructionsEnd - instructionsStart !== TARGET_INSTRUCTION_COUNT * 4) throw new Error('Unexpected target instruction span.');

  const originalConstantsBytes = encodeConstants(prototype.constants);
  const sourceConstants = source.subarray(instructionsEnd, instructionsEnd + originalConstantsBytes.length);
  if (!sourceConstants.equals(originalConstantsBytes)) throw new Error('Original constant bytes did not round-trip at the target offset.');
  const debugStart = instructionsEnd + originalConstantsBytes.length;
  const prototypeEnd = prototype.offset + prototype.length;
  const debugTail = source.subarray(debugStart, prototypeEnd);
  if (debugTail.length === 0) throw new Error('Target prototype has no debug tail.');

  const replacementConstants = makeReplacementConstants(originalConstantsBytes);
  const replacementInstructions = encodeInstructions({ instructions: targetInstructions });
  const replacementConstantsBytes = encodeConstants(replacementConstants);
  if (replacementInstructions.length + replacementConstantsBytes.length !== originalConstantsBytes.length + TARGET_INSTRUCTION_COUNT * 4) {
    throw new Error('Replacement instruction/constant region changed length.');
  }
  const output = Buffer.concat([
    source.subarray(0, instructionsStart),
    replacementInstructions,
    replacementConstantsBytes,
    debugTail,
    source.subarray(prototypeEnd)
  ]);
  if (output.length !== source.length) throw new Error('Patched dump length changed.');
  if (!output.subarray(debugStart, prototypeEnd).equals(debugTail)) throw new Error('Debug metadata changed during patch construction.');

  const reparsed = loadParser()(output);
  const verified = reparsed.prototypes.find(value => value.index === TARGET_PROTOTYPE);
  if (!verified) throw new Error('Patched target prototype is absent.');
  const stableFields = ['offset', 'length', 'flags', 'parameters', 'frameSize', 'rawHeaderUpvalueCount', 'firstLine', 'lineCount'];
  for (const field of stableFields) {
    if (verified[field] !== prototype[field]) throw new Error(`Target prototype field changed: ${field}`);
  }
  if (verified.instructions.length !== TARGET_INSTRUCTION_COUNT) throw new Error('Patched instruction count changed.');
  if (verified.constants.length !== EXPECTED_GC_CONSTANTS || verified.numbers.length !== 0 || verified.upvalueCount !== 0) {
    throw new Error('Patched target constants or upvalues changed unexpectedly.');
  }
  if (!encodeInstructions(verified).equals(replacementInstructions)) throw new Error('Patched Lua bytecode did not survive reparse.');
  if (!encodeConstants(verified.constants).equals(replacementConstantsBytes)) throw new Error('Patched Lua constants did not survive reparse.');
  if (JSON.stringify(verified.instructions.map(value => value.line)) !== JSON.stringify(prototype.instructions.map(value => value.line))) {
    throw new Error('Target debug line table changed.');
  }
  if (!reparsed.prototypes.every(value => value.offset === parsed.prototypes[value.index].offset
    && value.length === parsed.prototypes[value.index].length)) {
    throw new Error('Prototype offsets changed.');
  }
  for (let index = 0; index < parsed.prototypes.length; index++) {
    if (index === TARGET_PROTOTYPE) continue;
    const before = parsed.prototypes[index];
    const after = reparsed.prototypes[index];
    if (!output.subarray(after.offset, after.offset + after.length).equals(source.subarray(before.offset, before.offset + before.length))) {
      throw new Error(`Prototype ${index} bytes changed during in-place patch.`);
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, output);
  return {
    source: path.resolve(sourcePath),
    sourceSha256: sourceHash,
    output: path.resolve(outputPath),
    sourceBytes: source.length,
    outputBytes: output.length,
    outputSha256: sha256(output),
    prototype: TARGET_PROTOTYPE,
    sourcePrototypeOffset: prototype.offset,
    prototypeBytes: prototype.length,
    instructionCount: targetInstructions.length,
    constantCount: replacementConstants.length,
    debugMetadata: 'preserved-byte-for-byte',
    debugBytes: debugTail.length,
    firstLine: verified.firstLine,
    lineCount: verified.lineCount,
    rechargeTid: 46003,
    rechargeMethodConstant: verified.constants[1].value
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [sourcePath, outputPath] = process.argv.slice(2);
  if (!sourcePath || !outputPath) throw new Error('Usage: node patch-wallet-payment-lua.mjs <source.lua.bin> <output.lua.bin>');
  console.log(JSON.stringify(patchWalletPaymentLua(sourcePath, outputPath), null, 2));
}
