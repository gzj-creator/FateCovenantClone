import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createQuickSdkIdentityResolver } from '../quick-sdk-accounts.mjs';

const primaryAccount = Object.freeze({
  userId: 'local-1',
  loginCode: 'localtest',
  nickname: '命运旅者'
});
const phoneIdentity = phone => Object.freeze({
  userId: 'local-phone-' + phone,
  loginCode: 'phone-' + phone,
  nickname: '命运旅者'
});
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function temporaryMapping(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-quick-identities-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return path.join(directory, 'quick-sdk-identities.local-only.json');
}

test('external QuickSDK identities map to separate stable server accounts', t => {
  const mappingPath = temporaryMapping(t);
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity, mappingPath });
  const primaryUid = '9768a7c5ad00';
  const secondaryUid = 'a1b2c3d4e5f6';
  const primary = resolve({ uid: primaryUid, token: '97170cea8a25' });
  const secondary = resolve({ uid: secondaryUid, token: 'abcdef123456' });

  assert.deepEqual(primary, primaryAccount);
  assert.equal(secondary.userId, 'local-quick-' + digest(secondaryUid));
  assert.equal(secondary.loginCode, 'quick-' + digest(secondaryUid));
  assert.notEqual(secondary.userId, primary.userId);
  assert.deepEqual(resolve({ uid: secondaryUid, token: 'abcdef123456' }), secondary);

  const reopened = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity, mappingPath });
  assert.deepEqual(reopened({ uid: primaryUid, token: '111111111111' }), primaryAccount);
  assert.deepEqual(reopened({ uid: secondaryUid, token: '222222222222' }), secondary);
});

test('identity persistence stores only UID hashes with owner-only permissions', t => {
  const mappingPath = temporaryMapping(t);
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity, mappingPath });
  const uid = '1234567890ab';
  const token = 'fedcba098765';
  resolve({ uid, token });
  const stored = fs.readFileSync(mappingPath, 'utf8');
  const parsed = JSON.parse(stored);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.primaryUidHash, digest(uid));
  assert.equal(parsed.identities[0].uidHash, digest(uid));
  assert.equal(stored.includes(uid), false);
  assert.equal(stored.includes(token), false);
  assert.equal(fs.statSync(mappingPath).mode & 0o777, 0o600);
});

test('corrupt identity persistence fails closed instead of reusing the primary account', t => {
  const mappingPath = temporaryMapping(t);
  fs.writeFileSync(mappingPath, '{not-json', { mode: 0o600 });
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity, mappingPath });
  assert.throws(() => resolve({ uid: '1234567890ab', token: 'fedcba098765' }), /mapping is unreadable/);
});

test('server-issued local and phone identities stay isolated from QuickSDK mappings', t => {
  const mappingPath = temporaryMapping(t);
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity, mappingPath });
  assert.deepEqual(resolve({ uid: 'local-1', token: 'server-token' }), primaryAccount);
  assert.deepEqual(resolve({ uid: 'local-phone-17607270093', token: 'server-token' }), {
    userId: 'local-phone-17607270093',
    loginCode: 'phone-17607270093',
    nickname: '命运旅者'
  });
  assert.equal(fs.existsSync(mappingPath), false);
  assert.throws(() => resolve({ uid: 'unknown', token: 'server-token' }), /Unknown local account identity/);
  assert.throws(() => resolve({ uid: '123456789012', token: 'short' }), /Unknown local account identity/);
});
