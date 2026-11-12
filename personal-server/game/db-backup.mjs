import fs from 'node:fs';
import path from 'node:path';

// VACUUM INTO produces a consistent single-file snapshot while the live store
// keeps running. The target name includes the activity/period so a retry never
// overwrites the backup taken before an earlier failed settlement.
export function backupSqlite(store, { directory, prefix = 'backup', now = Date.now } = {}) {
  if (!store?.inspect) throw new TypeError('store.inspect is required');
  if (!directory) throw new TypeError('directory is required');
  fs.mkdirSync(directory, { recursive: true });
  const stamp = new Date(Number(now())).toISOString().replaceAll(':', '').replaceAll('.', '');
  const file = path.join(directory, `${prefix}-${stamp}.sqlite`);
  const literal = file.replaceAll("'", "''");
  store.inspect(db => db.exec(`VACUUM INTO '${literal}'`));
  return file;
}
