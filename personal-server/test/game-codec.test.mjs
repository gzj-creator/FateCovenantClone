import assert from 'node:assert/strict';
import test from 'node:test';
import { E, binary, encodeEtf, encodeEtfBinaryAndSmallIntegerTuple, decodeEtf } from '../protocol/game-codec.mjs';

test('ETF preserves current Unix milliseconds and signed numeric boundaries', async () => {
  for (const value of [0, 255, 256, -2147483648, 2147483647, 2147483648, -2147483649, 4294967296, Date.now(), -Date.now(), Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0.1, -12.75]) {
    assert.equal(await decodeEtf(await encodeEtf(value)), value);
  }
});

test('ETF NEW_FLOAT_EXT matches big-endian golden bytes', async () => {
  assert.equal((await encodeEtf(1.5)).toString('hex'), '83463ff8000000000000');
  assert.equal((await encodeEtf(-2.5)).toString('hex'), '8346c004000000000000');
});

test('statistics push ETF tuple wraps protobuf bytes before a small integer', async () => {
  const payload = Buffer.from([0x0a, 0x01, 0x2a]);
  const encoded = encodeEtfBinaryAndSmallIntegerTuple(payload);
  assert.equal(encoded.toString('hex'), '8368026d000000030a012a6100');
  const decoded = await decodeEtf(encoded);
  assert.equal(decoded.length, 2);
  assert.deepEqual(Buffer.from(decoded[0].value), payload);
  assert.equal(decoded[1], 0);
  assert.throws(() => encodeEtfBinaryAndSmallIntegerTuple(payload, 256), RangeError);
});

test('ETF login-shaped nested tuples and lists retain milliseconds and opaque module bytes', async () => {
  const now = Date.now(), bytes = Buffer.from([0, 128, 255]);
  const value = [1, [now, 28800, 1], new E.OtpErlangList([[92, binary(bytes)], [93, new E.OtpErlangList([now, -4294967296], false)]], false), false];
  const decoded = await decodeEtf(await encodeEtf(value));
  assert.equal(decoded[1][0], now);
  assert.deepEqual(Buffer.from(decoded[2].value[0][1].value), bytes);
  assert.deepEqual(decoded[2].value[1][1].value, [now, -4294967296]);
  assert.equal(decoded[3], false);
});

test('ETF rejects non-finite and unsafe numbers instead of emitting corrupt time', async () => {
  for (const value of [NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1]) {
    await assert.rejects(encodeEtf([1, new E.OtpErlangList([value], false)]), RangeError);
  }
});
