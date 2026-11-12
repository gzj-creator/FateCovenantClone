import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Measure each test file in a fresh process, the same way the serial runner
// executes it, and rewrite slow-files.json when --write is present.
//
//   node scripts/measure-slow-files.mjs                 # report only
//   node scripts/measure-slow-files.mjs --write         # update the manifest
//   node scripts/measure-slow-files.mjs --threshold 750
//   node scripts/measure-slow-files.mjs --file a.test.mjs --file b.test.mjs

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = path.join(serverRoot, 'test');
const manifestPath = path.join(testRoot, 'slow-files.json');
const options = { write: false, threshold: 1000, files: [], json: false };
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === '--write') { options.write = true; continue; }
  if (argument === '--json') { options.json = true; continue; }
  if (argument === '--threshold') {
    options.threshold = Number(process.argv[++index]);
    if (!Number.isFinite(options.threshold) || options.threshold < 0) throw new Error('--threshold must be a non-negative number');
    continue;
  }
  if (argument === '--file') { options.files.push(process.argv[++index]); continue; }
  throw new Error(`Unknown argument: ${argument}`);
}

const allFiles = fs.readdirSync(testRoot).filter(name => name.endsWith('.test.mjs')).sort();
const selected = options.files.length ? options.files : allFiles;
for (const name of selected) {
  if (!allFiles.includes(name)) throw new Error(`Test file does not exist: ${name}`);
}

const measured = [];
const failures = [];
for (const name of selected) {
  const started = process.hrtime.bigint();
  const result = spawnSync(process.execPath, ['--test', path.join(testRoot, name)], {
    cwd: serverRoot, stdio: 'pipe', encoding: 'utf8', timeout: 10 * 60 * 1000
  });
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  if (result.error) throw result.error;
  measured.push({ file: name, durationMs: Math.round(durationMs), status: result.status ?? 1 });
  if (result.status !== 0) failures.push({ file: name, status: result.status, stderr: result.stderr?.slice(-2000) });
  if (!options.json) process.stdout.write(`${String(Math.round(durationMs)).padStart(7)} ms  ${name}${result.status === 0 ? '' : '  FAILED'}\n`);
}

const slow = measured.filter(entry => entry.durationMs >= options.threshold).sort((left, right) => left.file.localeCompare(right.file));
if (options.json) process.stdout.write(JSON.stringify({ thresholdMs: options.threshold, measured, slow: slow.map(entry => entry.file), failures }, null, 2) + '\n');

if (options.write) {
  const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = options.files.length
    ? (() => {
        const byName = new Set(existing.files);
        for (const entry of measured) {
          if (entry.durationMs >= options.threshold) byName.add(entry.file);
          else byName.delete(entry.file);
        }
        return [...byName].sort();
      })()
    : slow.map(entry => entry.file);
  const next = {
    description: existing.description,
    thresholdMs: options.threshold,
    generatedAt: new Date().toISOString(),
    files
  };
  fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2) + '\n');
  process.stdout.write(`Updated ${path.relative(serverRoot, manifestPath)}: ${next.files.length} slow files\n`);
}

if (failures.length) {
  process.stderr.write(`${failures.length} test file(s) failed while measuring\n`);
  process.exit(1);
}
