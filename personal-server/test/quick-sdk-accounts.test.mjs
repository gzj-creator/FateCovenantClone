import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuickSdkIdentityResolver } from '../quick-sdk-accounts.mjs';

const primaryAccount = Object.freeze({
  userId: 'local-1',
  loginCode: 'localtest',
  nickname: '命运旅者'
});
const phoneIdentity = phone => ({
  userId: 'local-phone-' + phone,
  loginCode: 'phone-' + phone,
  nickname: '命运旅者'
});

test('cached 12-character QuickSDK identities restore the primary local account', () => {
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity });
  assert.equal(resolve({ uid: '9768a7c5ad00', token: '97170cea8a25' }), primaryAccount);
});

test('server-issued local identities retain account isolation', () => {
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity });
  assert.equal(resolve({ uid: 'local-1', token: 'server-token' }), primaryAccount);
  assert.deepEqual(resolve({ uid: 'local-phone-17607270093', token: 'server-token' }), {
    userId: 'local-phone-17607270093',
    loginCode: 'phone-17607270093',
    nickname: '命运旅者'
  });
});

test('QuickSDK identities outside the supported shapes remain rejected', () => {
  const resolve = createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity });
  assert.throws(() => resolve({ uid: 'unknown', token: 'server-token' }), /Unknown local account identity/);
  assert.throws(() => resolve({ uid: '123456789012', token: 'short' }), /Unknown local account identity/);
});
