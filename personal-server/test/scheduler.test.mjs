import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createScheduler } from '../game/scheduler.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  return { store: { inspect: action => action(db) }, db };
}

test('scheduler runs due jobs once and records completion', t => {
  const { store } = fixture(t);
  const scheduler = createScheduler({ store, now: () => 1_700_000_000_000 });
  scheduler.schedule('activity:tick', 1_700_000_000);
  scheduler.schedule('future', 1_700_000_100);
  const calls = [];
  const first = scheduler.runDue(job => calls.push(job.key));
  assert.deepEqual(first, [{ key: 'activity:tick', ok: true }]);
  assert.deepEqual(calls, ['activity:tick']);
  assert.deepEqual(scheduler.runDue(job => calls.push(job.key)), []);
});

test('failed jobs stay pending with attempts and error text', t => {
  const { store } = fixture(t);
  const scheduler = createScheduler({ store, now: () => 1_700_000_000_000 });
  scheduler.schedule('boom', 1_700_000_000);
  assert.deepEqual(scheduler.runDue(() => { throw new Error('expected failure'); }), [
    { key: 'boom', ok: false, error: 'expected failure' }
  ]);
  const row = store.inspect(db => db.prepare('SELECT attempts,last_error,done_at FROM scheduler_job WHERE key=?').get('boom'));
  assert.equal(row.attempts, 1);
  assert.equal(row.last_error, 'expected failure');
  assert.equal(row.done_at, null);
  assert.equal(scheduler.due(1_700_000_001).length, 1);
});

test('rescheduling clears completion and can run again', t => {
  const { store } = fixture(t);
  let now = 1_700_000_000;
  const scheduler = createScheduler({ store, now: () => now * 1000 });
  scheduler.schedule('repeat', now);
  assert.equal(scheduler.runDue(() => {}).length, 1);
  now += 60;
  scheduler.schedule('repeat', now);
  assert.equal(scheduler.runDue(() => {}).length, 1);
});

test('a recurring handler queues its next run after completion', t => {
  const { store } = fixture(t);
  let now = 1000;
  const scheduler = createScheduler({ store, now: () => now * 1000 });
  scheduler.schedule('activity.tick', now);
  const first = scheduler.runDue(() => ({ nextDueAt: 1060 }));
  assert.deepEqual(first, [{ key: 'activity.tick', ok: true }]);
  assert.deepEqual(scheduler.due(1059), []);
  assert.equal(scheduler.due(1060)[0].key, 'activity.tick');
});

