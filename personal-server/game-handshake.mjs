import { createCipheriv, randomBytes, timingSafeEqual } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { encodeServerChallenge } from './game-framing.mjs';

// Explicitly opt into locally reproduced behavior; this profile is not APK validation.
export const LOCAL_AES_PROFILE = 'dotnet-framework-rijndael-write-before-final';
export const HANDSHAKE_FIXED_IV = 'Egl63xPQYEcIY0RJ';
export const HANDSHAKE_PROFILE_EVIDENCE = Object.freeze({
  profile: LOCAL_AES_PROFILE,
  runtime: 'CLR 4.0.30319.42000; RijndaelManaged; CBC; PKCS7',
  targetRuntimeMatchEstablished: false,
  fixtures: 'analysis/reports/private-client-16448/handshake-aes-harness/fixtures.json'
});

function requireProfile(profile) {
  if (profile !== LOCAL_AES_PROFILE) throw new TypeError('Explicit local AES profile required; APK runtime parity is unverified');
}

function bytes(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(name + ' must be bytes');
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}

function aesParameters(key, vector) {
  if (typeof key !== 'string' || typeof vector !== 'string') throw new TypeError('Key and IV must be strings');
  const keyBytes = Buffer.from(key.padEnd(16, ' '), 'utf8');
  const ivBytes = Buffer.from(vector.padEnd(16, ' '), 'utf8');
  if (![16, 24, 32].includes(keyBytes.length) || ivBytes.length !== 16) throw new RangeError('Invalid padded AES key or IV byte length');
  return [keyBytes, ivBytes];
}

function cipherFor(key, vector) {
  const [keyBytes, ivBytes] = aesParameters(key, vector);
  return createCipheriv('aes-' + keyBytes.length * 8 + '-cbc', keyBytes, ivBytes);
}

export function localAesBeforeFinal(plaintext, key, vector, { profile } = {}) {
  requireProfile(profile);
  // Only the update output is returned, matching the inspected ToArray-before-dispose.
  const cipher = cipherFor(key, vector);
  const early = cipher.update(bytes(plaintext, 'plaintext'));
  cipher.final();
  return early;
}

export function localAesFinalized(plaintext, key, vector, { profile } = {}) {
  requireProfile(profile);
  const cipher = cipherFor(key, vector);
  return Buffer.concat([cipher.update(bytes(plaintext, 'plaintext')), cipher.final()]);
}

function exactFlags(value) {
  const names = ['encryptC2S', 'encryptS2C', 'signature'];
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== names.length || names.some(name => typeof value[name] !== 'boolean')) {
    throw new TypeError('All three handshake flags must be explicitly configured booleans');
  }
  return Buffer.from(names.map(name => value[name] ? 1 : 0));
}

function versionBytes(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128 || !/^[\x21-\x7e]+$/.test(value)) {
    throw new TypeError('Expected application version must be a nonempty printable ASCII string');
  }
  return Buffer.from(value, 'utf8');
}

export function createServerHandshakeChallenge({ profile, flags, expectedApplicationVersion } = {}) {
  requireProfile(profile);
  const flagBytes = exactFlags(flags);
  const appVersion = versionBytes(expectedApplicationVersion);
  const serverKey = randomBytes(8).toString('hex');
  const serverVerify = randomBytes(8).toString('hex');
  const clientVerify = randomBytes(8).toString('hex');
  const packetIv = randomBytes(16);
  const payload = encodeServerChallenge({
    serverKey: Buffer.from(serverKey, 'ascii'),
    // TryParse consumes exactly 32 encrypted bytes and fully reads its decrypt stream.
    encryptedServerVerify: localAesFinalized(Buffer.from(serverVerify, 'ascii'), serverKey, HANDSHAKE_FIXED_IV, { profile }),
    serverVerify: Buffer.from(serverVerify, 'ascii'),
    clientVerify: Buffer.from(clientVerify, 'ascii'),
    packetIv,
    flags
  });
  return Object.freeze({
    profileEvidence: HANDSHAKE_PROFILE_EVIDENCE,
    payload,
    verifyReply(reply) {
      const input = bytes(reply, 'reply');
      // This length follows the reproduced 16-byte early AES output, not a finalized block.
      if (input.length !== 16 + 16 + 3 + appVersion.length) return Object.freeze({ ok: false, reason: 'reply_length' });
      let clientKey;
      try { clientKey = new TextDecoder('utf-8', { fatal: true }).decode(input.subarray(0, 16)); }
      catch { return Object.freeze({ ok: false, reason: 'client_key' }); }
      // Random.Next's exclusive upper bound excludes the final underscore in the CIL alphabet.
      if (!/^[a-zA-Z0-9-]{16}$/.test(clientKey)) return Object.freeze({ ok: false, reason: 'client_key' });
      const expectedCipher = localAesBeforeFinal(Buffer.from(clientVerify, 'ascii'), clientKey, HANDSHAKE_FIXED_IV, { profile });
      if (!timingSafeEqual(input.subarray(16, 32), expectedCipher)) return Object.freeze({ ok: false, reason: 'client_verify' });
      if (!timingSafeEqual(input.subarray(32, 35), flagBytes)) return Object.freeze({ ok: false, reason: 'flags' });
      if (!timingSafeEqual(input.subarray(35), appVersion)) return Object.freeze({ ok: false, reason: 'application_version' });
      return Object.freeze({ ok: true, profile, targetRuntimeMatchEstablished: false });
    }
  });
}
