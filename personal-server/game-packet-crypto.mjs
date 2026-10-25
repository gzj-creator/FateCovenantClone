import { createCipheriv, createDecipheriv, createHash, timingSafeEqual } from 'node:crypto';

const KEY = Buffer.from('I4ifhpBoR5U2SasD', 'utf8');
const MAX_BYTES = 2 * 1024 * 1024;

function bytes(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be bytes`);
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}

function vector(value) {
  const iv = bytes(value, 'iv');
  if (iv.length !== 16) throw new RangeError('Handshake packet IV must contain 16 bytes');
  return iv;
}

function requireSignature(value) {
  if (typeof value !== 'boolean') throw new TypeError('Signature mode must be explicit');
}

// Mirrors NetCrypto's worker-used destination-buffer overload and returned count.
export function encryptOutgoingPacket(payload, { iv, signature } = {}) {
  requireSignature(signature);
  const input = bytes(payload, 'payload');
  const padding = (16 - input.length % 16) % 16;
  const prefix = signature ? 16 : 0;
  if (input.length === 0 && !signature) throw new RangeError('Empty TransformBlock input is unsupported by the measured provider');
  if (input.length + prefix + padding > MAX_BYTES) throw new RangeError('Packet exceeds inspected scratch-buffer size');
  const plaintext = Buffer.alloc(prefix + input.length + padding);
  if (signature) createHash('md5').update(input).digest().copy(plaintext);
  input.copy(plaintext, prefix);
  const cipher = createCipheriv('aes-128-cbc', KEY, vector(iv));
  cipher.setAutoPadding(false);
  return Buffer.concat([Buffer.from([padding]), cipher.update(plaintext), cipher.final()]);
}

// The inspected client receive path removes padding only, retaining any MD5 prefix.
export function decryptIncomingPacket(packet, { iv } = {}) {
  const input = bytes(packet, 'packet');
  if (input.length < 17 || (input.length - 1) % 16 !== 0 || input.length - 1 > MAX_BYTES) throw new RangeError('Invalid encrypted packet length');
  const padding = input[0];
  if (padding > 15 || padding > input.length - 1) throw new RangeError('Invalid packet padding count');
  const decipher = createDecipheriv('aes-128-cbc', KEY, vector(iv));
  decipher.setAutoPadding(false);
  const plaintext = Buffer.concat([decipher.update(input.subarray(1)), decipher.final()]);
  return Buffer.from(plaintext.subarray(0, plaintext.length - padding));
}

// Local server verification is separate from the client's receive behavior.
export function decodeClientPacket(packet, { iv, signature } = {}) {
  requireSignature(signature);
  const plaintext = decryptIncomingPacket(packet, { iv });
  if (!signature) return plaintext;
  if (plaintext.length < 16) throw new Error('Packet signature missing');
  const payload = plaintext.subarray(16);
  const expected = createHash('md5').update(payload).digest();
  if (!timingSafeEqual(plaintext.subarray(0, 16), expected)) throw new Error('Packet signature mismatch');
  return Buffer.from(payload);
}
