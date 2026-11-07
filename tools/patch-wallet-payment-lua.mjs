import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from '../personal-server/protocol/lua-jit-dump.mjs';

const EXPECTED_SOURCE_SHA256 = '721e98f2880b4ab6079e876f54707400db5508511ec354001743188d28a6ace3';
const PRICE_PROTOTYPE = 11;
const PRICE_INSTRUCTION_COUNT = 24;
const PRICE_GC_CONSTANTS = 13;
const ONE_KEY_PROTOTYPE = 12;
const ONE_KEY_INSTRUCTION_COUNT = 46;
const ONE_KEY_GC_CONSTANTS = 20;
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

function makeReplacementConstants(named, targetCount, targetBytes) {
  const paddingCount = targetCount - named.length;
  if (paddingCount <= 0) throw new Error('Replacement constants leave no padding slots.');
  const nameBytes = encodeConstants(named).length;
  let remaining = targetBytes - nameBytes - paddingCount * 6; // five-byte string plus ULEB length
  if (remaining < 0) throw new Error('Replacement constants exceed the original byte length.');

  // The prototype length includes its debug metadata. Keep the original GC
  // count and use unreachable, distinct string constants as length-preserving
  // padding so debug data and all following prototypes stay byte-stable.
  const padding = Array.from({ length: paddingCount }, (_, index) => {
    const extra = index === paddingCount - 1 ? remaining : Math.min(remaining, index % 3);
    remaining -= extra;
    const length = 5 + extra;
    const prefix = `Pad${String(index).padStart(3, '0')}`;
    return { type: 'string', value: prefix.padEnd(length, 'X').slice(0, length) };
  });
  if (remaining !== 0) throw new Error('Replacement constant padding could not be balanced.');

  const result = [...named, ...padding];
  if (result.length !== targetCount) throw new Error('Replacement GC constant count changed.');
  if (encodeConstants(result).length !== targetBytes) {
    throw new Error('Replacement constants do not preserve the original byte length.');
  }
  return result;
}

function patchPrototype(source, prototype, targetInstructions, replacementConstants) {
  if (prototype.instructions.length !== targetInstructions.length) throw new Error('Replacement instruction count changed.');
  const instructionsStart = prototype.instructions[0].offset;
  const lastInstruction = prototype.instructions.at(-1);
  const instructionsEnd = lastInstruction.offset + 4;
  if (instructionsEnd - instructionsStart !== targetInstructions.length * 4) throw new Error('Unexpected target instruction span.');

  const originalConstantsBytes = encodeConstants(prototype.constants);
  const constantsStart = instructionsEnd + (prototype.upvalueCount ?? 0) * 2;
  const sourceConstants = source.subarray(constantsStart, constantsStart + originalConstantsBytes.length);
  if (!sourceConstants.equals(originalConstantsBytes)) throw new Error('Original constant bytes did not round-trip at the target offset.');
  const replacementInstructions = encodeInstructions({ instructions: targetInstructions });
  const replacementConstantsBytes = encodeConstants(replacementConstants);
  if (replacementInstructions.length !== encodeInstructions(prototype).length
    || replacementConstantsBytes.length !== originalConstantsBytes.length) {
    throw new Error('Replacement instruction/constant region changed length.');
  }

  const output = Buffer.from(source);
  replacementInstructions.copy(output, instructionsStart);
  replacementConstantsBytes.copy(output, constantsStart);
  return { output, replacementInstructions, replacementConstantsBytes, debugBytes: prototype.length - targetInstructions.length * 4 - originalConstantsBytes.length };
}

export function patchWalletPaymentLua(sourcePath, outputPath) {
  const source = fs.readFileSync(sourcePath);
  const sourceHash = sha256(source);
  if (sourceHash !== EXPECTED_SOURCE_SHA256) throw new Error(`Unexpected RechargeSuperGiftBannerNode dump SHA256: ${sourceHash}`);
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite.');

  const parsed = loadParser()(source);
  if (parsed.flags & 2) throw new Error('Expected a dump with intact debug metadata.');
  const pricePrototype = parsed.prototypes.find(value => value.index === PRICE_PROTOTYPE);
  const oneKeyPrototype = parsed.prototypes.find(value => value.index === ONE_KEY_PROTOTYPE);
  if (!pricePrototype || !oneKeyPrototype) throw new Error('Target prototype is absent.');
  if (pricePrototype.instructions.length !== PRICE_INSTRUCTION_COUNT) throw new Error('Unexpected price prototype instruction count.');
  if (oneKeyPrototype.instructions.length !== ONE_KEY_INSTRUCTION_COUNT) throw new Error('Unexpected one-key prototype instruction count.');
  const expectedPriceStrings = [
    'DailyDiscountTable', 'RechargeValueIndex', 'recharge_id', 'Recharge', 'rechargeTid', 'buyFunc', null,
    'remindTime', 'isShowNumSelect', 'resTidL', 'resNumL', 'CommerceBuyPopupForm', 'Open'
  ];
  const expectedOneKeyStrings = [
    'DailyDiscountTable', 'Recharge', 'TID_DAILY_DISCOUNT_ONE_KEY', 'WeekHuntDataMgr', 'IsTodayGiftCanBuy',
    'recharge_id', 'RechargeTable', 'UIKit', 'ShowMsg', 'LocalizeTable', 'DAILY_SELECTION_HAS_BUY',
    'period', 'GetCurPeriod', 'day', 'FlushTime', 'GetDayIndex', 'isExtraBuy', 'DailyDiscountMgr',
    'IS_EXTRA_BUY', 'RechargeGift'
  ];
  const valuesOf = prototype => prototype.constants.map(value => value.type === 'child' ? null : value.value);
  if (JSON.stringify(valuesOf(pricePrototype)) !== JSON.stringify(expectedPriceStrings)) throw new Error('Unexpected price constants.');
  if (JSON.stringify(valuesOf(oneKeyPrototype)) !== JSON.stringify(expectedOneKeyStrings)) throw new Error('Unexpected one-key constants.');

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

  const priceConstants = makeReplacementConstants([
    { type: 'string', value: 'RechargeMgr' },
    { type: 'string', value: 'RechargeOrBuyGift' },
    { type: 'string', value: 'DailyDiscountMgr' },
    { type: 'string', value: 'IS_EXTRA_BUY' },
    { type: 'table', array: [null, null, 0, 0], hash: [] },
    // This unreachable child entry preserves the prototype nesting encoded by
    // the original constant stream; removing it disconnects prototype 10.
    { type: 'child' }
  ], PRICE_GC_CONSTANTS, encodeConstants(pricePrototype.constants).length);
  const priceInstructions = [
    instruction(1, 'GGET', { a: 0, d: 0 }),
    instruction(2, 'TGETS', { a: 0, b: 0, c: 1 }),
    instruction(3, 'MOV', { a: 2, d: 1 }),
    instruction(4, 'TDUP', { a: 3, d: 4 }),
    instruction(5, 'GGET', { a: 4, d: 2 }),
    instruction(6, 'TGETS', { a: 4, b: 4, c: 3 }),
    instruction(7, 'NOT', { a: 4, d: 4 }),
    instruction(8, 'TSETB', { a: 4, b: 3, c: 1 }),
    instruction(9, 'CALL', { a: 0, b: 1, c: 3 }),
    instruction(10, 'RET0', { a: 0, d: 1 })
  ];
  while (priceInstructions.length < PRICE_INSTRUCTION_COUNT) {
    priceInstructions.push(instruction(priceInstructions.length + 1, 'MOV', { a: 0, d: 0 }));
  }

  // Preserve the original daily-limit guard, then route the actual payment
  // through RechargeOrBuyGift so voucher confirmation appears before 16004.
  const oneKeyInstructions = oneKeyPrototype.instructions.slice(0, 27).map(value => ({ ...value }));
  oneKeyInstructions.push(
    instruction(28, 'TDUP', { a: 3, d: 15 }),
    instruction(29, 'GGET', { a: 0, d: 11 }),
    instruction(30, 'TGETS', { a: 0, b: 0, c: 12 }),
    instruction(31, 'KSHORT', { a: 2, d: 30000 }),
    instruction(32, 'KSHORT', { a: 4, d: 16003 }),
    instruction(33, 'ADDVV', { a: 2, b: 2, c: 4 }),
    instruction(34, 'GGET', { a: 4, d: 13 }),
    instruction(35, 'TGETS', { a: 4, b: 4, c: 14 }),
    instruction(36, 'NOT', { a: 4, d: 4 }),
    instruction(37, 'TSETB', { a: 4, b: 3, c: 1 }),
    instruction(38, 'CALL', { a: 0, b: 1, c: 3 }),
    instruction(39, 'RET0', { a: 0, d: 1 })
  );
  while (oneKeyInstructions.length < ONE_KEY_INSTRUCTION_COUNT) {
    oneKeyInstructions.push(instruction(oneKeyInstructions.length + 1, 'MOV', { a: 0, d: 0 }));
  }
  const oneKeyConstants = makeReplacementConstants([
    ...oneKeyPrototype.constants.slice(0, 11),
    { type: 'string', value: 'RechargeMgr' },
    { type: 'string', value: 'RechargeOrBuyGift' },
    { type: 'string', value: 'DailyDiscountMgr' },
    { type: 'string', value: 'IS_EXTRA_BUY' },
    { type: 'table', array: [null, null, 0, 0], hash: [] }
  ], ONE_KEY_GC_CONSTANTS, encodeConstants(oneKeyPrototype.constants).length);

  if (opcodes.get('MOV') == null || opcodes.get('RET0') == null) throw new Error('Required LuaJIT opcode is absent.');

  const pricePatch = patchPrototype(source, pricePrototype, priceInstructions, priceConstants);
  const oneKeyPatch = patchPrototype(pricePatch.output, oneKeyPrototype, oneKeyInstructions, oneKeyConstants);
  const output = oneKeyPatch.output;
  if (output.length !== source.length) throw new Error('Patched dump length changed.');
  if (process.env.FC_WALLET_PATCH_DEBUG_DIR) {
    fs.mkdirSync(process.env.FC_WALLET_PATCH_DEBUG_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.FC_WALLET_PATCH_DEBUG_DIR, 'after-price.lua.bin'), pricePatch.output);
    fs.writeFileSync(path.join(process.env.FC_WALLET_PATCH_DEBUG_DIR, 'after-one-key.lua.bin'), output);
  }

  const reparsed = loadParser()(output);
  const verifiedPrice = reparsed.prototypes.find(value => value.index === PRICE_PROTOTYPE);
  const verifiedOneKey = reparsed.prototypes.find(value => value.index === ONE_KEY_PROTOTYPE);
  if (!verifiedPrice || !verifiedOneKey) throw new Error('Patched target prototype is absent.');
  const stableFields = ['offset', 'length', 'flags', 'parameters', 'frameSize', 'rawHeaderUpvalueCount', 'firstLine', 'lineCount'];
  for (const [verified, prototype] of [[verifiedPrice, pricePrototype], [verifiedOneKey, oneKeyPrototype]]) {
    for (const field of stableFields) {
      if (verified[field] !== prototype[field]) throw new Error(`Target prototype field changed: ${field}`);
    }
  }
  if (verifiedPrice.instructions.length !== PRICE_INSTRUCTION_COUNT || verifiedPrice.constants.length !== PRICE_GC_CONSTANTS) {
    throw new Error('Patched price prototype structure changed.');
  }
  if (verifiedOneKey.instructions.length !== ONE_KEY_INSTRUCTION_COUNT || verifiedOneKey.constants.length !== ONE_KEY_GC_CONSTANTS) {
    throw new Error('Patched target constants or upvalues changed unexpectedly.');
  }
  if (verifiedPrice.numbers.length !== 0 || verifiedPrice.upvalueCount !== 0 || verifiedOneKey.numbers.length !== 0 || verifiedOneKey.upvalueCount !== 0) {
    throw new Error('Patched target constants or upvalues changed unexpectedly.');
  }
  if (!encodeInstructions(verifiedPrice).equals(pricePatch.replacementInstructions)
    || !encodeConstants(verifiedPrice.constants).equals(pricePatch.replacementConstantsBytes)
    || !encodeInstructions(verifiedOneKey).equals(oneKeyPatch.replacementInstructions)
    || !encodeConstants(verifiedOneKey.constants).equals(oneKeyPatch.replacementConstantsBytes)) {
    throw new Error('Patched Lua bytecode did not survive reparse.');
  }
  if (JSON.stringify(verifiedPrice.instructions.map(value => value.line)) !== JSON.stringify(pricePrototype.instructions.map(value => value.line))
    || JSON.stringify(verifiedOneKey.instructions.map(value => value.line)) !== JSON.stringify(oneKeyPrototype.instructions.map(value => value.line))) {
    throw new Error('Target debug line table changed.');
  }
  if (!reparsed.prototypes.every(value => value.offset === parsed.prototypes[value.index].offset
    && value.length === parsed.prototypes[value.index].length)) {
    throw new Error('Prototype offsets changed.');
  }
  for (let index = 0; index < parsed.prototypes.length; index++) {
    if (index === PRICE_PROTOTYPE || index === ONE_KEY_PROTOTYPE) continue;
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
    pricePrototype: PRICE_PROTOTYPE,
    priceInstructionCount: priceInstructions.length,
    priceConstantCount: priceConstants.length,
    oneKeyPrototype: ONE_KEY_PROTOTYPE,
    oneKeyInstructionCount: oneKeyInstructions.length,
    oneKeyConstantCount: oneKeyConstants.length,
    sourcePrototypeOffsets: { price: pricePrototype.offset, oneKey: oneKeyPrototype.offset },
    prototypeBytes: { price: pricePrototype.length, oneKey: oneKeyPrototype.length },
    debugMetadata: 'preserved-byte-for-byte',
    debugBytes: { price: pricePatch.debugBytes, oneKey: oneKeyPatch.debugBytes },
    firstLine: { price: verifiedPrice.firstLine, oneKey: verifiedOneKey.firstLine },
    lineCount: { price: verifiedPrice.lineCount, oneKey: verifiedOneKey.lineCount },
    rechargeTid: 46003,
    rechargeMethodConstant: verifiedPrice.constants[1].value
  };
}

function instructionFactory(parsed) {
  const opcodes = new Map(parsed.prototypes.flatMap(prototype => prototype.instructions.map(item => [item.name, item.op ?? (item.raw & 255)])));
  return (name, a = 0, d = 0, b = 0, c = 0) => {
    if (!opcodes.has(name)) throw new Error(`Missing LuaJIT opcode ${name}`);
    return { name, op: opcodes.get(name), a, b: ABC_INSTRUCTIONS.has(name) ? b : d >>> 8,
      c: ABC_INSTRUCTIONS.has(name) ? c : d & 255 };
  };
}

// These are the exact TextAssets shipped in the accepted v9 snapshot. Keep
// instruction spans, upvalues, debug metadata and every other prototype intact.
export function patchDailyDiscountLua(source) {
  if (sha256(source) !== '55be2127ed10cbc12666dbed091d938b6ac44e7ebd27fcd485d2ed94007280de') {
    throw new Error('Unexpected v9 RechargeSuperGiftBannerNode identity');
  }
  const parsed = parseLuaJit(source), ins = instructionFactory(parsed);
  const abc = (name, a, b, c) => ins(name, a, 0, b, c);
  const staticNode = parsed.prototypes[0], giftNode = parsed.prototypes[9], payment = parsed.prototypes[10];
  const constants = values => values.map(value => ({ type: 'string', value }));
  const staticConstants = makeReplacementConstants(constants([
    'DailyDiscountMgr', 'IsSelloutToday', 'DailyDiscountTable', 'Recharge', 'ipairs', 'batch_update', 'recharge_id'
  ]), staticNode.constants.length, encodeConstants(staticNode.constants).length);
  const staticInstructions = [
    ins('GGET', 1, 2), abc('TGETS', 1, 1, 3), ins('MOV', 3, 0), abc('CALL', 1, 2, 2),
    ins('GGET', 2, 0), abc('TGETS', 2, 2, 1), abc('TGETS', 4, 1, 6), abc('CALL', 2, 2, 2),
    ins('ISF', 0, 2), ins('JMP', 3, 32770), ins('KPRI', 3, 2), ins('RET', 2, 3),
    ins('GGET', 2, 4), abc('TGETS', 4, 1, 5), abc('CALL', 2, 4, 2), ins('JMP', 5, 32781),
    ins('GGET', 7, 2), abc('TGETS', 7, 7, 3), ins('MOV', 9, 6), abc('CALL', 7, 2, 2),
    ins('GGET', 8, 0), abc('TGETS', 8, 8, 1), abc('TGETS', 10, 7, 6), abc('CALL', 8, 2, 2),
    ins('ISF', 0, 8), ins('JMP', 8, 32771), ins('KPRI', 8, 1), ins('KPRI', 9, 1), ins('RET', 8, 3),
    abc('ITERC', 5, 3, 3), ins('ITERL', 5, 32753), ins('KPRI', 2, 2), ins('KPRI', 3, 1), ins('RET', 2, 3)
  ];
  let output = patchPrototype(source, staticNode, staticInstructions, staticConstants).output;

  const giftConstants = structuredClone(giftNode.constants);
  giftConstants[3].value = 'IsSelloutToday';
  // The old manager string becomes unreachable padding; its bytes balance the
  // shorter function name without moving the debug table or child closures.
  giftConstants[2].value = 'Pad'.padEnd(giftNode.constants[2].value.length
    + giftNode.constants[3].value.length - giftConstants[3].value.length, 'X');
  const giftInstructions = giftNode.instructions.map(item => ({ ...item, op: item.raw & 255 }));
  giftInstructions[3] = ins('GGET', 5, 23); // Existing DailyDiscountMgr constant.
  giftInstructions[7] = ins('IST', 0, 5);
  output = patchPrototype(output, giftNode, giftInstructions, giftConstants).output;

  const paymentConstants = makeReplacementConstants([
    ...constants(['RechargeMgr', 'RechargeOrBuyGift', 'DailyDiscountMgr', 'IS_EXTRA_BUY']),
    { type: 'table', array: [null, null, 0, 0], hash: [] }
  ], payment.constants.length, encodeConstants(payment.constants).length);
  const paymentInstructions = [
    ins('GGET', 0, 0), abc('TGETS', 0, 0, 1), ins('UGET', 2, 1), ins('TDUP', 3, 4),
    ins('GGET', 4, 2), abc('TGETS', 4, 4, 3), ins('NOT', 4, 4), abc('TSETB', 4, 3, 1),
    abc('CALL', 0, 1, 3), ins('RET0', 0, 1)
  ];
  while (paymentInstructions.length < payment.instructions.length) paymentInstructions.push(ins('MOV'));
  output = patchPrototype(output, payment, paymentInstructions, paymentConstants).output;
  // Preserve the purchase popup and its custom award lists. Only correct the
  // bad index key before the callback above routes the confirmed payment.
  const popup = parsed.prototypes[11], popupConstants = structuredClone(popup.constants);
  popupConstants[2].value = 'recharge_id';
  output = patchPrototype(output, popup, popup.instructions.map(item => ({ ...item, op: item.raw & 255 })), popupConstants).output;
  parseLuaJit(output);
  return output;
}

export function patchCouponRechargeLua(source) {
  if (sha256(source) !== '82fb6360ca429bd16f05ca61d22ada780930143daae2b85819b5168d7d6a09f6') {
    throw new Error('Unexpected v9 RechargeMgr identity');
  }
  const parsed = parseLuaJit(source), prototype = parsed.prototypes[54], ins = instructionFactory(parsed);
  const output = Buffer.from(source);
  // Successful voucher purchases count at full product price, matching the
  // server ledger. get_token compensation still follows the original branch.
  encodeInstructions({ instructions: [ins('KPRI', 8, 2), ins('JMP', 9, 32780)] })
    .copy(output, prototype.instructions[27].offset);
  parseLuaJit(output);
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv[2] === '--daily-discount' || process.argv[2] === '--coupon-recharge') {
    const [mode, sourcePath, outputPath] = process.argv.slice(2);
    if (!sourcePath || !outputPath || fs.existsSync(outputPath)) throw new Error('Expected source and a new output path');
    const output = (mode === '--daily-discount' ? patchDailyDiscountLua : patchCouponRechargeLua)(fs.readFileSync(sourcePath));
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.log(JSON.stringify({ sourcePath, outputPath, bytes: output.length, sha256: sha256(output) }));
    process.exit(0);
  }
  const [sourcePath, outputPath] = process.argv.slice(2);
  if (!sourcePath || !outputPath) throw new Error('Usage: node patch-wallet-payment-lua.mjs <source.lua.bin> <output.lua.bin>');
  console.log(JSON.stringify(patchWalletPaymentLua(sourcePath, outputPath), null, 2));
}
