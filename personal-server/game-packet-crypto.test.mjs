import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { encryptOutgoingPacket, decryptIncomingPacket, decodeClientPacket } from './game-packet-crypto.mjs';

const record = JSON.parse(readFileSync(new URL('../analysis/experiments/private-server-20261025/p2/packet-crypto/fixtures.json', import.meta.url)));

test('packet crypto matches independent C# TransformBlock fixtures including aligned and empty inputs', () => {
  assert.equal(record.fixtures.length, 18);
  assert.equal(record.fixtures.filter(f => !f.ok).length, 1);
  for (const f of record.fixtures) {
    const input = Buffer.from(f.plaintextHex, 'hex');
    const options = { iv: Buffer.from(f.ivHex, 'hex'), signature: f.signature };
    if (!f.ok) {
      assert.equal(f.exceptionType, 'System.ArgumentOutOfRangeException');
      assert.throws(() => encryptOutgoingPacket(input, options), RangeError);
      continue;
    }
    const packet = encryptOutgoingPacket(input, options);
    assert.equal(packet.toString('hex'), f.packetHex);
    assert.equal(packet.length, f.returnedBytes);
    assert.equal(decryptIncomingPacket(packet, options).toString('hex'), f.receivedHex);
    assert.deepEqual(decodeClientPacket(packet, options), input);
    assert.equal(f.convenienceAllocationBytes - packet.length, input.length % 16 === 0 ? 16 : 0);
  }
});

test('client receive retains MD5 prefix while server decoder verifies it before stripping', () => {
  const iv = Buffer.alloc(16, 4);
  const input = Buffer.from('local packet payload');
  const packet = encryptOutgoingPacket(input, { iv, signature: true });
  const raw = decryptIncomingPacket(packet, { iv });
  assert.deepEqual(raw, Buffer.concat([createHash('md5').update(input).digest(), input]));
  assert.deepEqual(decodeClientPacket(packet, { iv, signature: true }), input);
  packet[1] ^= 1;
  assert.throws(() => decodeClientPacket(packet, { iv, signature: true }), /signature mismatch/);
  const unsigned = encryptOutgoingPacket(Buffer.from('short'), { iv, signature: false });
  assert.throws(() => decodeClientPacket(unsigned, { iv, signature: true }), /signature missing/);
});

test('packet IV resets per call and clear padding count preserves payload trailing zeros', () => {
  const iv = Buffer.alloc(16, 7);
  const input = Buffer.from([1, 2, 3, 0, 0, 0]);
  const first = encryptOutgoingPacket(input, { iv, signature: false });
  assert.deepEqual(encryptOutgoingPacket(input, { iv, signature: false }), first);
  assert.deepEqual(decodeClientPacket(first, { iv, signature: false }), input);
  assert.notDeepEqual(encryptOutgoingPacket(input, { iv: Buffer.alloc(16, 8), signature: false }), first);
});

test('packet crypto rejects missing modes, IVs, malformed blocks, and scratch-buffer overflow', () => {
  const iv = Buffer.alloc(16);
  assert.throws(() => encryptOutgoingPacket(Buffer.from('a'), { iv }), TypeError);
  assert.throws(() => encryptOutgoingPacket(Buffer.from('a'), { signature: false, iv: Buffer.alloc(15) }), RangeError);
  assert.throws(() => encryptOutgoingPacket(Buffer.alloc(2 * 1024 * 1024), { iv, signature: true }), RangeError);
  for (const packet of [Buffer.alloc(0), Buffer.from([0]), Buffer.alloc(16), Buffer.from([16, ...Buffer.alloc(16)]), Buffer.from([255, ...Buffer.alloc(16)])]) {
    assert.throws(() => decryptIncomingPacket(packet, { iv }), RangeError);
  }
  assert.throws(() => decodeClientPacket(Buffer.alloc(17), { iv }), TypeError);
});
