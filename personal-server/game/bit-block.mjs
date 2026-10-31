import { binary, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';

export async function decodeBitBlock(raw) {
  if (!raw?.length) return Buffer.alloc(0);
  const value = await decodeEtf(Buffer.from(raw));
  if (!Buffer.isBuffer(value?.value)) throw new Error('Unsupported bit block payload');
  return Buffer.from(value.value);
}

export function encodeBitBlock(bits) {
  return encodeEtf(binary(bits));
}

// Client BitBlock indexes are zero-based and MSB-first within each byte.
export function setBit(bits, bit) {
  if (!Number.isSafeInteger(bit) || bit < 0) throw new RangeError('BitBlock index must be a non-negative integer');
  const index = Math.floor(bit / 8);
  let next = Buffer.isBuffer(bits) ? bits : Buffer.from(bits ?? []);
  if (index >= next.length) {
    const capacity = Math.max(index + 1, Math.max(1, next.length) * 2);
    const expanded = Buffer.alloc(capacity);
    next.copy(expanded);
    next = expanded;
  }
  next[index] |= 0x80 >> (bit % 8);
  return next;
}

export function hasBit(bits, bit) {
  if (!Number.isSafeInteger(bit) || bit < 0) return false;
  const index = Math.floor(bit / 8);
  return index < bits.length && (bits[index] & (0x80 >> (bit % 8))) !== 0;
}
