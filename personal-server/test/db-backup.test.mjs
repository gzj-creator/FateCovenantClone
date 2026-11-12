import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { backupSqlite } from '../game/db-backup.mjs';

test('VACUUM INTO creates a readable snapshot', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-backup-'));
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO t(value) VALUES (\'ok\')');
  t.after(() => { db.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const file = backupSqlite({ inspect: action => action(db) }, { directory, prefix: 'activity-1-1', now: () => 1_700_000_000_000 });
  assert.ok(fs.existsSync(file));
  const copy = new DatabaseSync(file);
  assert.equal(copy.prepare('SELECT value FROM t').get().value, 'ok');
  copy.close();
});
