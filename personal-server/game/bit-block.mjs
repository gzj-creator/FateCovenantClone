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
  const index = Math.floor(bit / 8);
  bits[index] |= 0x80 >> (bit % 8);
}

export function hasBit(bits, bit) {
  const index = Math.floor(bit / 8);
  return index < bits.length && (bits[index] & (0x80 >> (bit % 8))) !== 0;
}
