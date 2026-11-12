import { GameError } from './hero-progression.mjs';

export function ensureSchedulerSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS scheduler_job (
    key TEXT PRIMARY KEY,
    due_at INTEGER NOT NULL,
    done_at INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TEXT NOT NULL
  )`);
}

export function createScheduler({ store, now = Date.now, logger = () => {} }) {
  if (!store?.inspect) throw new TypeError('store.inspect is required');
  store.inspect(ensureSchedulerSchema);
  const clock = () => Math.floor(Number(now()) / 1000);
  const stamp = () => new Date(Number(now())).toISOString();
  let timer = null;

  function schedule(key, dueAt) {
    const name = String(key ?? '').trim();
    const due = Number(dueAt);
    if (!name || name.length > 200) throw new GameError(1, 'Scheduler job key is invalid');
    if (!Number.isSafeInteger(due) || due <= 0) throw new GameError(1, 'Scheduler due time is invalid');
    store.inspect(db => db.prepare(`INSERT INTO scheduler_job (key,due_at,done_at,attempts,last_error,updated_at)
      VALUES (?,?,NULL,0,NULL,?)
      ON CONFLICT(key) DO UPDATE SET due_at=excluded.due_at, done_at=NULL, last_error=NULL, updated_at=excluded.updated_at`)
      .run(name, due, stamp()));
  }

  function due(at = clock()) {
    return store.inspect(db => db.prepare('SELECT key,due_at,attempts FROM scheduler_job WHERE done_at IS NULL AND due_at<=? ORDER BY due_at,key').all(at));
  }

  function runDue(handler, at = clock()) {
    if (typeof handler !== 'function') throw new TypeError('Scheduler handler is required');
    const jobs = due(at);
    const processed = [];
    for (const job of jobs) {
      try {
        const result = handler(job);
        if (result && typeof result.then === 'function') throw new Error('Scheduler handlers must be synchronous');
        store.inspect(db => db.prepare('UPDATE scheduler_job SET done_at=?, attempts=attempts+1, last_error=NULL, updated_at=? WHERE key=? AND done_at IS NULL')
          .run(clock(), stamp(), job.key));
        processed.push({ key: job.key, ok: true });
      } catch (error) {
        store.inspect(db => db.prepare('UPDATE scheduler_job SET attempts=attempts+1, last_error=?, updated_at=? WHERE key=? AND done_at IS NULL')
          .run(String(error?.message ?? error).slice(0, 500), stamp(), job.key));
        try { logger({ event: 'scheduler_job_failed', key: job.key, error: String(error?.message ?? error) }); } catch {}
        processed.push({ key: job.key, ok: false, error: String(error?.message ?? error) });
      }
    }
    return processed;
  }

  return {
    schedule,
    due,
    runDue,
    start(handler, intervalMs = 60000) {
      if (timer) return;
      if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000) throw new GameError(1, 'Scheduler interval is invalid');
      timer = setInterval(() => { try { runDue(handler); } catch (error) { try { logger({ event: 'scheduler_tick_failed', error: String(error?.message ?? error) }); } catch {} } }, intervalMs);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
}

