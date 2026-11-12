import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLuaJit } from '../../tools/luajit-bytecode-parse.mjs';
import { serializeLuaJit } from '../../tools/luajit-dump-tools.mjs';

function uleb(value) {
  const bytes = [];
  let remaining = Number(value);
  do {
    let byte = remaining & 0x7f;
    remaining = Math.floor(remaining / 0x80);
    if (remaining) byte |= 0x80;
    bytes.push(byte);
  } while (remaining);
  return bytes;
}

function uleb33(low, discriminator = 0) {
  const bytes = [((low & 0x3f) << 1) | discriminator];
  let remaining = low >>> 6;
  if (remaining === 0) return bytes;
  bytes[0] |= 0x80;
  while (remaining) {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining) byte |= 0x80;
    bytes.push(byte);
  }
  return bytes;
}

function encodedDouble(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeDoubleLE(value, 0);
  return [...uleb33(buffer.readUInt32LE(0), 1), ...uleb(buffer.readUInt32LE(4))];
}

function minimalDump(numbers, upvalues = []) {
  const upvalueBytes = upvalues.flatMap(value => [value & 0xff, value >>> 8]);
  const content = [
    0, 0, 0, upvalues.length,
    ...uleb(0),
    ...uleb(numbers.length),
    ...uleb(0),
    ...upvalueBytes,
    ...numbers.flatMap(encodedDouble)
  ];
  return Buffer.from([
    27, 76, 74, 2,
    ...uleb(2),
    ...uleb(content.length),
    ...content,
    0
  ]);
}

test('decodes integer-valued doubles above 32 bits', () => {
  const expected = [1910265202002, 955132601002];
  const parsed = parseLuaJit(minimalDump(expected));
  assert.equal(parsed.prototypes.length, 1);
  assert.deepEqual(parsed.prototypes[parsed.rootPrototype].numbers, expected);
});

test('uses the exact header upvalue count when choosing the constant boundary', () => {
  const parsed = parseLuaJit(minimalDump([1910265202002], [0xc000, 0xc002]));
  const root = parsed.prototypes[parsed.rootPrototype];
  assert.equal(root.headerUpvalueCount, 2);
  assert.equal(root.upvalueCount, 2);
  assert.deepEqual(root.upvalues, [0xc000, 0xc002]);
  assert.deepEqual(root.numbers, [1910265202002]);
});

test('round-trips 33-bit integer fields at the six-bit continuation boundary', () => {
  const expected = [0, 63, 64, 127, 128, 4095];
  const parsed = parseLuaJit(minimalDump(expected));
  const rewritten = parseLuaJit(serializeLuaJit(parsed));
  assert.deepEqual(rewritten.prototypes[rewritten.rootPrototype].numbers, expected);
});
