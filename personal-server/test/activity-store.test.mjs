import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createActivityStore } from '../game/activity-store.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  let now = 1_700_000_000;
  const store = { inspect: action => action(db) };
  return { db, store, activity: createActivityStore({ store, now: () => now * 1000 }), setNow: value => { now = value; } };
}

test('upserts activity instances and keeps the latest period queryable', t => {
  const { activity } = fixture(t);
  activity.upsertInstance({ serverId: 3, actId: 1102008, periodNo: 1, family: 'hundred-draw', openAt: 100, closeAt: 200, stage: 'running' });
  activity.upsertInstance({ serverId: 3, actId: 1102008, periodNo: 2, family: 'hundred-draw', openAt: 300, closeAt: 400, stage: 'preview' });
  assert.equal(activity.instance(3, 1102008).period_no, 2);
  assert.equal(activity.instance(3, 1102008, 1).stage, 'running');
  activity.setStage(3, 1102008, 1, 'closed', 250);
  assert.equal(activity.instance(3, 1102008, 1).settled_at, 250);
});

test('override is active until revoked and is audited', t => {
  const { activity, db, setNow } = fixture(t);
  const id = activity.recordOverride({ serverId: 3, actId: 1102008, kind: 'extend', endAt: 1_700_100_000, reason: 'test', operator: 'ops' });
  assert.equal(activity.activeOverride(3, 1102008).id, id);
  setNow(1_700_000_100);
  activity.recordOverride({ serverId: 3, actId: 1102008, kind: 'pause', reason: 'incident', operator: 'ops' });
  assert.equal(activity.activeOverride(3, 1102008).kind, 'pause');
  activity.revokeOverride(id, 'ops', 'resume');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ops_audit').get().n, 3);
});

test('settlement steps are idempotent per role and period', t => {
  const { activity } = fixture(t);
  assert.equal(activity.markSettlement(3, 1102008, 1, 10001, 'rank_snapshot'), true);
  assert.equal(activity.markSettlement(3, 1102008, 1, 10001, 'rank_snapshot'), false);
  assert.equal(activity.markSettlement(3, 1102008, 1, 10001, 'mail'), true);
  assert.equal(activity.settlementDone(3, 1102008, 1, 10001, 'rank_snapshot'), true);
  assert.equal(activity.settlementDone(3, 1102008, 2, 10001, 'rank_snapshot'), false);
});

test('force_open requires a bounded window', t => {
  const { activity } = fixture(t);
  assert.throws(() => activity.recordOverride({ serverId: 3, actId: 1, kind: 'force_open' }), error => error.code === 1);
});

