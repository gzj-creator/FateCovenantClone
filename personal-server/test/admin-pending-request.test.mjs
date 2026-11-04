import test from 'node:test';
import assert from 'node:assert/strict';
import { createPendingRequest } from '../admin/pending-request.js';

test('voucher retry freezes expiry and request id until a business value changes', () => {
  const options = {
    ignoredKeys: ['expire_at'],
    requestId: () => 'request-1'
  };
  const first = createPendingRequest({
    account_id: 'local-1',
    amount_cents: 100,
    expire_at: 1000,
    title: 'Compensation'
  }, null, {
    ...options,
    signatureData: { account_id: 'local-1', amount_cents: 100, days: 30, title: 'Compensation' }
  });

  const retry = createPendingRequest({
    account_id: 'local-1',
    amount_cents: 100,
    expire_at: 2000,
    title: 'Compensation'
  }, first, {
    ignoredKeys: ['expire_at'],
    signatureData: { account_id: 'local-1', amount_cents: 100, days: 30, title: 'Compensation' },
    requestId: () => 'request-2'
  });
  assert.equal(retry, first);
  assert.equal(retry.payload.request_id, 'request-1');
  assert.equal(retry.payload.expire_at, 1000);

  const changed = createPendingRequest({
    account_id: 'local-1',
    amount_cents: 100,
    expire_at: 3000,
    title: 'Compensation'
  }, retry, {
    ignoredKeys: ['expire_at'],
    signatureData: { account_id: 'local-1', amount_cents: 100, days: 60, title: 'Compensation' },
    requestId: () => 'request-2'
  });
  assert.notEqual(changed, retry);
  assert.equal(changed.payload.request_id, 'request-2');
  assert.equal(changed.payload.expire_at, 3000);
});

test('non-voucher requests keep the exact payload in their retry signature', () => {
  const first = createPendingRequest(
    { account_id: 'local-1', amount_cents: 100 },
    null,
    { requestId: () => 'credit-1' }
  );
  const changed = createPendingRequest(
    { account_id: 'local-1', amount_cents: 101 },
    first,
    { requestId: () => 'credit-2' }
  );
  assert.notEqual(changed, first);
  assert.equal(changed.payload.request_id, 'credit-2');
});
