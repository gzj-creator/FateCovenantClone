import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  previewGuideAwardRepair, applyGuideAwardRepair, guideRepairDatabaseFingerprint, verifyGuideRepairDatabase
} from '../game/guide-award-repair.mjs';

const HELP = `Usage:
  node scripts/repair-guide-awards.mjs --database <offline.sqlite> --output <plan.json> [--role <id>]
  node scripts/repair-guide-awards.mjs --database <offline.sqlite> --apply --plan <plan.json> --backup-dir <dir> --confirm-offline

Defaults to a sanitized preview. It uses SQLite backup (including committed WAL)
and never raw-copies DB/WAL files. Apply requires a matching reviewed plan, a
separate backup, an identical successful rehearsal on a temporary database, and
an explicitly offline source. Active adjacent server.local-only.json PIDs block
both preview and apply. No server process is stopped or restarted.
`;

function fileHash(file) { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function exists(file) { try { return fs.statSync(file).isFile(); } catch { return false; } }

function assertNoRecordedServer(database) {
  const state = path.join(path.dirname(database), 'server.local-only.json');
  if (!exists(state)) return;
  const pid = Number(JSON.parse(fs.readFileSync(state, 'utf8')).pid);
  if (!Number.isSafeInteger(pid) || pid <= 0) return;
  try { process.kill(pid, 0); }
  catch (error) { if (error.code === 'ESRCH') return; throw new Error('Cannot verify the recorded server is stopped; no database was opened'); }
  throw new Error('Recorded server is still active; no database was opened');
}

async function consistentSnapshot(source, destination) {
  if (fs.existsSync(destination)) throw new Error('Refusing to overwrite an existing SQLite snapshot');
  const db = new DatabaseSync(source, { readOnly: true });
  try { await backup(db, destination); }
  finally { db.close(); }
  const snapshot = new DatabaseSync(destination, { readOnly: true });
  try { return { ...verifyGuideRepairDatabase(snapshot), fingerprint: guideRepairDatabaseFingerprint(snapshot), sha256: fileHash(destination), bytes: fs.statSync(destination).size }; }
  finally { snapshot.close(); }
}

function writeJson(file, value) {
  if (fs.existsSync(file)) throw new Error('Refusing to overwrite an existing repair artifact');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
}

export async function runGuideAwardRepair(argv) {
  const { values } = parseArgs({ args: argv, options: {
    database: { type: 'string' }, output: { type: 'string' }, role: { type: 'string', multiple: true },
    apply: { type: 'boolean', default: false }, plan: { type: 'string' },
    'backup-dir': { type: 'string' }, 'confirm-offline': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  } });
  if (values.help) return { help: HELP };
  if (!values.database) throw new Error('--database must select an offline database explicitly');
  const source = path.resolve(values.database);
  if (!exists(source)) throw new Error('Selected database does not exist');
  assertNoRecordedServer(source);
  const roleIds = values.role?.map(value => {
    if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('Invalid --role');
    return Number(value);
  });
  if (values.apply && (!values.plan || !values['backup-dir'] || !values['confirm-offline'])) {
    throw new Error('--apply requires --plan, --backup-dir and --confirm-offline');
  }
  const codec = createGameCodec();
  const work = values.apply
    ? path.join(path.resolve(values['backup-dir']), 'guide-awards-' + new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID().slice(0, 8))
    : fs.mkdtempSync(path.join(os.tmpdir(), 'fc-guide-repair-preview-'));
  fs.mkdirSync(work, { recursive: true });
  const before = path.join(work, 'before.sqlite');
  try {
    const backupInfo = await consistentSnapshot(source, before);
    const baseline = new DatabaseSync(before, { readOnly: true });
    let preview;
    try { preview = previewGuideAwardRepair(baseline, { codec, roleIds }); }
    finally { baseline.close(); }
    if (!values.apply) {
      if (values.output) writeJson(path.resolve(values.output), preview);
      return { mode: 'preview', ...preview };
    }
    const reviewed = JSON.parse(fs.readFileSync(path.resolve(values.plan), 'utf8'));
    // The selected roles are taken from the reviewed plan unless --role was
    // repeated explicitly. Plan hashes bind every committed table and row.
    const selected = roleIds ?? reviewed.roleIds;
    const reviewedSnapshot = new DatabaseSync(before, { readOnly: true });
    try { preview = previewGuideAwardRepair(reviewedSnapshot, { codec, roleIds: selected }); }
    finally { reviewedSnapshot.close(); }
    if (preview.planHash !== reviewed.planHash) throw new Error('Reviewed plan no longer matches the selected database');
    writeJson(path.join(work, 'reviewed-plan.json'), preview);
    writeJson(path.join(work, 'backup.json'), backupInfo);
    const rehearsal = path.join(work, 'rehearsal.sqlite');
    await consistentSnapshot(before, rehearsal);
    const rehearsalDb = new DatabaseSync(rehearsal);
    let rehearsed, expectedFingerprint;
    const tables = readGameTables();
    const repairedAt = Date.now();
    try {
      rehearsed = applyGuideAwardRepair(rehearsalDb, { codec, tables, plan: preview, now: repairedAt });
      expectedFingerprint = guideRepairDatabaseFingerprint(rehearsalDb);
    } finally { rehearsalDb.close(); }
    writeJson(path.join(work, 'rehearsal.json'), { ...rehearsed, afterFingerprint: expectedFingerprint });
    // Check again immediately before opening writable. apply's BEGIN IMMEDIATE
    // and source fingerprint also reject any concurrent/stale source change.
    assertNoRecordedServer(source);
    const target = new DatabaseSync(source);
    let applied, actualFingerprint;
    try {
      applied = applyGuideAwardRepair(target, { codec, tables, plan: preview, now: repairedAt, expectedAfterFingerprint: expectedFingerprint });
      actualFingerprint = guideRepairDatabaseFingerprint(target);
      if (actualFingerprint !== expectedFingerprint) throw new Error('Rehearsal and source results differ; retain backup and inspect before reopening the server');
    } finally { target.close(); }
    const result = { mode: 'apply', ...applied, afterFingerprint: actualFingerprint,
      backup: { directory: work, ...backupInfo }, rehearsalVerified: true };
    writeJson(path.join(work, 'result.json'), result);
    return result;
  } finally {
    if (!values.apply) fs.rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await runGuideAwardRepair(process.argv.slice(2));
    process.stdout.write(result.help ?? JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write('Guide repair failed: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
