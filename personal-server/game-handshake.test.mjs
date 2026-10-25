import assert from 'node:assert/strict';
import { createDecipheriv } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { parseServerChallenge } from './game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, createServerHandshakeChallenge, localAesBeforeFinal, localAesFinalized } from './game-handshake.mjs';

const fixtures = JSON.parse(fs.readFileSync(new URL('../analysis/reports/private-client-16448/handshake-aes-harness/fixtures.json', import.meta.url), 'utf8'));
const profile = LOCAL_AES_PROFILE;
const flags = { encryptC2S: false, encryptS2C: false, signature: false };
const expectedApplicationVersion = '1.55.090365';
const newChallenge = () => createServerHandshakeChallenge({ profile, flags, expectedApplicationVersion });

test('explicit local AES profile reproduces every independently compiled C# fixture', () => {
  assert.equal(fixtures.profile, profile);
  assert.equal(fixtures.runtime.rijndaelType, 'System.Security.Cryptography.RijndaelManaged');
  for (const fixture of fixtures.fixtures) {
    const plaintext = Buffer.from(fixture.plaintextHex, 'hex');
    assert.equal(localAesBeforeFinal(plaintext, fixtures.testKey, fixtures.fixedVector, { profile }).toString('hex'), fixture.beforeFinalHex, fixture.name + ' early');
    assert.equal(localAesFinalized(plaintext, fixtures.testKey, fixtures.fixedVector, { profile }).toString('hex'), fixture.afterFinalHex, fixture.name + ' final');
  }
  const length16 = fixtures.fixtures.find(fixture => fixture.plaintextBytes === 16);
  assert.equal(length16.beforeFinalBytes, 16);
  assert.equal(length16.afterFinalBytes, 32);
});

test('server challenge is exactly 99 bytes and its 32-byte cipher fully decrypts to the advertised value', () => {
  const challenge = newChallenge();
  assert.equal(challenge.profileEvidence.targetRuntimeMatchEstablished, false);
  assert.equal(challenge.payload.length, 99);
  const parsed = parseServerChallenge(challenge.payload);
  const decipher = createDecipheriv('aes-128-cbc', parsed.serverKey, Buffer.from(HANDSHAKE_FIXED_IV));
  assert.deepEqual(Buffer.concat([decipher.update(parsed.encryptedServerVerify), decipher.final()]), parsed.serverVerify);
  assert.deepEqual(parsed.flags, flags);
});

function clientReply(challenge, { key = 'ClientKey1234567', finalized = false } = {}) {
  const parsed = parseServerChallenge(challenge.payload);
  const encrypt = finalized ? localAesFinalized : localAesBeforeFinal;
  return Buffer.concat([
    Buffer.from(key), encrypt(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile }),
    parsed.rawFlags, Buffer.from(expectedApplicationVersion)
  ]);
}

test('reply authentication accepts the early cipher and exact version then rejects finalized ciphertext', () => {
  const challenge = newChallenge();
  assert.deepEqual(challenge.verifyReply(clientReply(challenge)), { ok: true, profile, targetRuntimeMatchEstablished: false });
  assert.deepEqual(challenge.verifyReply(clientReply(challenge, { finalized: true })), { ok: false, reason: 'reply_length' });
});

test('reply authentication rejects wrong verify, flags, version, key alphabet and every short length', () => {
  const challenge = newChallenge();
  const reply = clientReply(challenge);
  for (let length = 0; length < reply.length; length++) assert.equal(challenge.verifyReply(reply.subarray(0, length)).ok, false);
  for (const [index, reason] of [[0, 'client_key'], [16, 'client_verify'], [32, 'flags'], [35, 'application_version']]) {
    const changed = Buffer.from(reply);
    changed[index] = index === 0 ? 95 : changed[index] ^ 1;
    assert.deepEqual(challenge.verifyReply(changed), { ok: false, reason });
  }
  assert.equal(challenge.verifyReply(clientReply(newChallenge())).ok, false);
});

test('local profile, application identity and all flags must be explicitly supplied', () => {
  assert.throws(() => createServerHandshakeChallenge({ flags, expectedApplicationVersion }), TypeError);
  assert.throws(() => createServerHandshakeChallenge({ profile, expectedApplicationVersion }), TypeError);
  assert.throws(() => createServerHandshakeChallenge({ profile, flags, expectedApplicationVersion: '' }), TypeError);
  assert.throws(() => localAesBeforeFinal(Buffer.alloc(16), fixtures.testKey, fixtures.fixedVector), TypeError);
  assert.throws(() => localAesFinalized(Buffer.alloc(16), 'x'.repeat(17), fixtures.fixedVector, { profile }), RangeError);
});
