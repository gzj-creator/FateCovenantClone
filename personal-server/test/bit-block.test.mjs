import test from 'node:test';
import assert from 'node:assert/strict';
import { hasBit, setBit } from '../game/bit-block.mjs';

test('BitBlock expands for dedicated reward indexes and stays MSB-first', () => {
  let bits = Buffer.alloc(0);
  bits = setBit(bits, 557);
  bits = setBit(bits, 1001);
  assert.equal(hasBit(bits, 557), true);
  assert.equal(hasBit(bits, 1001), true);
  assert.equal(hasBit(bits, 556), false);
  assert.equal(bits[69], 0x04);
  assert.equal(bits[125], 0x40);
});
