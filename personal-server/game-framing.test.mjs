import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_MAX_PAYLOAD_BYTES, GAME_HEADER_BYTES, GameFrameDecoder, GameFramingError, encodeGameFrame, encodeServerChallenge, isInitialVerifyPayload, parseServerChallenge } from './game-framing.mjs';

const fixtureToken = Buffer.from('verify', 'utf8');
const frame = value => encodeGameFrame(Buffer.from(value));
const errorCode = code => error => error instanceof GameFramingError && error.code === code;
const challengeFixture = () => ({
  serverKey: Buffer.alloc(16, 0x11), encryptedServerVerify: Buffer.alloc(32, 0x22),
  serverVerify: Buffer.alloc(16, 0x33), clientVerify: Buffer.alloc(16, 0x44), packetIv: Buffer.alloc(16, 0x55)
});

test('header is four-byte big endian and excludes its own bytes', () => {
  const encoded = encodeGameFrame(Buffer.alloc(258, 0xab));
  assert.equal(GAME_HEADER_BYTES, 4);
  assert.deepEqual(encoded.subarray(0, 4), Buffer.from([0, 0, 1, 2]));
  assert.equal(encoded.length, 262);
  assert.equal(encoded.readUInt32BE(0), encoded.length - 4);
});

test('initial verification fixture matches the observed framed bytes exactly', () => {
  assert.equal(encodeGameFrame(fixtureToken).toString('hex'), '00000006766572696679');
  assert(isInitialVerifyPayload(fixtureToken, fixtureToken));
  for (const value of [Buffer.alloc(0), Buffer.from('VERIFY'), Buffer.from('verify\0'), encodeGameFrame(fixtureToken)]) {
    assert.equal(isInitialVerifyPayload(value, fixtureToken), false);
  }
  assert(isInitialVerifyPayload(Buffer.from([9]), Buffer.from([9])));
  assert.throws(() => isInitialVerifyPayload(fixtureToken), TypeError);
});

test('incremental decoder accepts every two-part split across header and payload', () => {
  const encoded = frame([0, 1, 2, 255, 4]);
  for (let split = 0; split <= encoded.length; split++) {
    const decoder = new GameFrameDecoder();
    const output = [...decoder.push(encoded.subarray(0, split)), ...decoder.push(encoded.subarray(split))];
    assert.deepEqual(output, [Buffer.from([0, 1, 2, 255, 4])], `split ${split}`);
    assert.equal(decoder.bufferedBytes, 0);
    decoder.finish();
  }
});

test('one-byte fragments and coalesced frames preserve binary payload order', () => {
  const expected = [Buffer.from([255, 0, 7]), Buffer.alloc(0), fixtureToken, Buffer.from([4])];
  const encoded = Buffer.concat(expected.map(value => encodeGameFrame(value)));
  const tiny = new GameFrameDecoder();
  const output = [];
  for (const value of encoded) output.push(...tiny.push(Buffer.from([value])));
  assert.deepEqual(output, expected);
  tiny.finish();
  const coalesced = new GameFrameDecoder();
  assert.deepEqual(coalesced.push(encoded), expected);
  coalesced.finish();
});

test('coalesced complete frame plus incomplete next header remains buffered', () => {
  const decoder = new GameFrameDecoder();
  const next = frame([2, 3]);
  assert.deepEqual(decoder.push(Buffer.concat([frame([1]), next.subarray(0, 3)])), [Buffer.from([1])]);
  assert.equal(decoder.bufferedBytes, 3);
  assert.deepEqual(decoder.push(next.subarray(3)), [Buffer.from([2, 3])]);
  decoder.finish();
});

test('zero-length frames consume headers and allow following frames', () => {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 0 });
  assert.deepEqual(encodeGameFrame(Buffer.alloc(0), { maxPayloadBytes: 0 }), Buffer.alloc(4));
  assert.deepEqual(decoder.push(Buffer.alloc(12)), [Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0)]);
  assert.deepEqual(decoder.push(Buffer.alloc(0)), []);
  decoder.finish();
});

test('maximum local payload boundary is inclusive for encoder and decoder', () => {
  assert.equal(DEFAULT_MAX_PAYLOAD_BYTES, 65536);
  for (const limit of [0, 1, 255, 256, DEFAULT_MAX_PAYLOAD_BYTES]) {
    const payload = Buffer.alloc(limit, 0x61);
    const decoder = new GameFrameDecoder({ maxPayloadBytes: limit });
    assert.deepEqual(decoder.push(encodeGameFrame(payload, { maxPayloadBytes: limit })), [payload]);
    assert.throws(() => encodeGameFrame(Buffer.alloc(limit + 1), { maxPayloadBytes: limit }), errorCode('FRAME_TOO_LARGE'));
    decoder.finish();
  }
});

test('oversize declarations fail on the completed header without needing a body', () => {
  for (const declared of [9, 0x7fffffff, 0x80000000, 0xffffffff]) {
    const header = Buffer.alloc(4);
    header.writeUInt32BE(declared);
    const decoder = new GameFrameDecoder({ maxPayloadBytes: 8 });
    assert.deepEqual(decoder.push(header.subarray(0, 3)), []);
    assert.throws(() => decoder.push(header.subarray(3)), errorCode('FRAME_TOO_LARGE'));
    assert.throws(() => decoder.push(Buffer.alloc(0)), errorCode('FRAME_TOO_LARGE'));
    assert.throws(() => decoder.finish(), errorCode('FRAME_TOO_LARGE'));
  }
});

test('unsigned high-bit and maximum wire headers are handled as positive lengths', () => {
  for (const limit of [0x80000000, 0xffffffff]) {
    const decoder = new GameFrameDecoder({ maxPayloadBytes: limit });
    assert.deepEqual(decoder.push(Buffer.alloc(4)), [Buffer.alloc(0)]);
    decoder.finish();
  }
  for (const invalid of [-1, 0x100000000, 1.5, NaN, Infinity, '8', null]) {
    assert.throws(() => new GameFrameDecoder({ maxPayloadBytes: invalid }), RangeError);
    assert.throws(() => encodeGameFrame(Buffer.alloc(0), { maxPayloadBytes: invalid }), RangeError);
  }
});

test('finish rejects each incomplete header and incomplete body', () => {
  const encoded = frame([5, 6, 7]);
  for (let length = 1; length < encoded.length; length++) {
    const decoder = new GameFrameDecoder();
    assert.deepEqual(decoder.push(encoded.subarray(0, length)), []);
    assert.equal(decoder.bufferedBytes, length);
    assert.throws(() => decoder.finish(), errorCode('TRUNCATED_FRAME'));
    assert.throws(() => decoder.push(encoded.subarray(length)), errorCode('TRUNCATED_FRAME'));
  }
  new GameFrameDecoder().finish();
});

test('decoder copies input fragments and returned payloads do not alias input', () => {
  const encoded = frame([1, 2, 3]);
  const decoder = new GameFrameDecoder();
  const first = Buffer.from(encoded.subarray(0, 5));
  decoder.push(first);
  first.fill(0xff);
  const last = Buffer.from(encoded.subarray(5));
  const [payload] = decoder.push(last);
  last.fill(0);
  assert.deepEqual(payload, Buffer.from([1, 2, 3]));
  decoder.finish();
});

test('Uint8Array views respect offsets and input types are explicit', () => {
  const view = Uint8Array.from([9, 1, 2, 9]).subarray(1, 3);
  const encoded = encodeGameFrame(view);
  assert.deepEqual(encoded.subarray(4), Buffer.from([1, 2]));
  assert.deepEqual(new GameFrameDecoder().push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.length)), [Buffer.from([1, 2])]);
  for (const value of ['text', [1, 2], null, new DataView(new ArrayBuffer(4))]) {
    assert.throws(() => encodeGameFrame(value), TypeError);
    assert.throws(() => new GameFrameDecoder().push(value), TypeError);
  }
});

test('server challenge assembler uses all five exact slices and zero default flags', () => {
  const fixture = challengeFixture();
  const payload = encodeServerChallenge(fixture);
  assert.equal(payload.length, 99);
  assert.deepEqual(payload, Buffer.concat([...Object.values(fixture), Buffer.alloc(3)]));
  const parsed = parseServerChallenge(payload);
  for (const [key, value] of Object.entries(fixture)) assert.deepEqual(parsed[key], value);
  assert.deepEqual(parsed.flags, { encryptC2S: false, encryptS2C: false, signature: false });
  assert.deepEqual(parsed.rawFlags, Buffer.alloc(3));
  assert.deepEqual(parsed.trailingBytes, Buffer.alloc(0));
  assert.equal(encodeGameFrame(payload).readUInt32BE(0), 99);
});

test('all eight generated flag combinations occupy offsets 96 through 98', () => {
  for (let bits = 0; bits < 8; bits++) {
    const flags = { encryptC2S: !!(bits & 1), encryptS2C: !!(bits & 2), signature: !!(bits & 4) };
    const payload = encodeServerChallenge({ ...challengeFixture(), flags });
    assert.deepEqual(payload.subarray(96), Buffer.from(Object.values(flags).map(Number)));
    assert.deepEqual(parseServerChallenge(payload).flags, flags);
  }
});

test('challenge parser matches literal equality for all 256 possible flag bytes', () => {
  const payload = encodeServerChallenge(challengeFixture());
  for (let value = 0; value < 256; value++) {
    payload.fill(value, 96, 99);
    const parsed = parseServerChallenge(payload);
    assert.deepEqual(Object.values(parsed.flags), [value === 1, value === 1, value === 1]);
    assert.deepEqual(parsed.rawFlags, Buffer.alloc(3, value));
  }
});

test('challenge parser rejects every short length and preserves trailing evidence', () => {
  for (let length = 0; length < 99; length++) assert.throws(() => parseServerChallenge(Buffer.alloc(length)), RangeError);
  const payload = Buffer.concat([encodeServerChallenge(challengeFixture()), Buffer.from([9, 8])]);
  const parsed = parseServerChallenge(payload);
  assert.deepEqual(parsed.trailingBytes, Buffer.from([9, 8]));
  payload.fill(0);
  assert.deepEqual(parsed.serverKey, Buffer.alloc(16, 0x11));
  assert.deepEqual(parsed.trailingBytes, Buffer.from([9, 8]));
});

test('challenge assembly enforces field lengths and explicit boolean flags', () => {
  for (const [key, value] of Object.entries(challengeFixture())) {
    for (const length of [0, value.length - 1, value.length + 1]) {
      assert.throws(() => encodeServerChallenge({ ...challengeFixture(), [key]: Buffer.alloc(length) }), RangeError);
    }
  }
  for (const key of ['encryptC2S', 'encryptS2C', 'signature']) {
    for (const value of [0, 1, 2, 'true', null]) {
      assert.throws(() => encodeServerChallenge({ ...challengeFixture(), flags: { [key]: value } }), TypeError);
    }
  }
  for (const flags of [null, [], false, 'flags']) assert.throws(() => encodeServerChallenge({ ...challengeFixture(), flags }), TypeError);
});
