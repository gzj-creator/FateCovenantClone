import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createAdminService } from '../admin/server.mjs';
import { createActivityStore } from '../game/activity-store.mjs';
import { createFeatureOverrideStore } from '../game/feature-overrides.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const store = { inspect: action => action(db) };
  const activityStore = createActivityStore({ store });
  const featureOverrides = createFeatureOverrideStore({ store });
  const activityRuntime = {
    tick: () => [{ actId: 1, from: 'running', to: 'closed' }],
    evaluate: () => ({ status: 'running', visible: true, reason: null })
  };
  const admin = createAdminService({
    wallet: { snapshot: () => ({}) }, activityStore, featureOverrides, activityRuntime,
    token: 'ops-key'
  });
  return { db, admin, activityStore, featureOverrides };
}

async function call(base, path, data) {
  const response = await fetch(base + path, {
    method: data ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ops-key', ...(data ? { 'Content-Type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  return { status: response.status, body: await response.json() };
}

test('admin applies and revokes feature overrides with audit', async t => {
  const { admin, featureOverrides, db } = fixture(t);
  const address = await admin.listen(0);
  t.after(() => admin.close());
  const base = `http://127.0.0.1:${address.port}`;
  const created = await call(base, '/api/feature/override', { serverId: 1, funId: 1039, mode: 'force_open', reason: 'test' });
  assert.equal(created.status, 200);
  const listed = await call(base, '/api/feature/overrides?serverId=1');
  assert.equal(listed.body.overrides[0].fun_id, 1039);
  const revoked = await call(base, '/api/feature/override/revoke', { id: created.body.id, reason: 'done' });
  assert.equal(revoked.status, 200);
  assert.equal(featureOverrides.activeFor(1).length, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ops_audit').get().n, 2);
});

test('admin requires confirmation for destructive activity overrides', async t => {
  const { admin, activityStore } = fixture(t);
  const address = await admin.listen(0);
  t.after(() => admin.close());
  const base = `http://127.0.0.1:${address.port}`;
  const rejected = await call(base, '/api/activity/override', { serverId: 1, actId: 1102008, kind: 'close_early', reason: 'test' });
  assert.equal(rejected.status, 400);
  assert.match(rejected.body.error, /confirm/);
  const created = await call(base, '/api/activity/override', { serverId: 1, actId: 1102008, kind: 'close_early', reason: 'test', confirm: true });
  assert.equal(created.status, 200);
  assert.equal(activityStore.listOverrides(1).length, 1);
  const preview = await call(base, '/api/activity/preview', { serverId: 1, actId: 1102008, kind: 'force_open', startAt: 1, endAt: 2 });
  assert.equal(preview.status, 200);
  const tick = await call(base, '/api/activity/tick', {});
  assert.equal(tick.body.changes.length, 1);
  const snapshot = await call(base, '/api/activity?serverId=1');
  assert.equal(snapshot.body.overrides[0].kind, 'close_early');
});
