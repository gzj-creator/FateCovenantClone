import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = path.join(serverRoot, 'test');
const manifestPath = path.join(testRoot, 'slow-files.json');
const suite = process.argv[2] ?? 'fast';

if (!['fast', 'slow', 'all'].includes(suite)) {
  console.error(`Unknown test suite: ${suite}`);
  process.exit(2);
}

const allFiles = fs.readdirSync(testRoot)
  .filter(name => name.endsWith('.test.mjs'))
  .sort();
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const slowFiles = manifest.files;
const slowSet = new Set(slowFiles);

if (slowSet.size !== slowFiles.length) {
  throw new Error('slow-files.json contains duplicate entries');
}
for (const name of slowFiles) {
  if (!allFiles.includes(name)) throw new Error(`Slow test file does not exist: ${name}`);
}

const selected = suite === 'slow'
  ? slowFiles
  : suite === 'all'
    ? allFiles
    : allFiles.filter(name => !slowSet.has(name));

console.log(`${suite} suite: ${selected.length} test files`);
const result = spawnSync(process.execPath, [
  '--test',
  '--test-concurrency=1',
  ...process.argv.slice(3).map(argument => argument.replaceAll('{suite}', suite)),
  ...selected.map(name => path.join(testRoot, name))
], { cwd: serverRoot, stdio: 'inherit' });

if (result.error) throw result.error;
process.exit(result.status ?? 1);
