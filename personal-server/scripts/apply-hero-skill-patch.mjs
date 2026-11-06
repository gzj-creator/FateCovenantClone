import fs from 'node:fs';
import path from 'node:path';
import { applyHeroPatch } from './skill-db-tools.mjs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/apply-hero-skill-patch.mjs <patch.json | directory>');
  process.exit(2);
}

const resolved = path.resolve(file);
const files = fs.statSync(resolved).isDirectory()
  ? fs.readdirSync(resolved).filter(name => name.endsWith('.json')).sort().map(name => path.join(resolved, name))
  : [resolved];

for (const patchFile of files) {
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  const result = applyHeroPatch(patch);
  console.log(`applied ${result.heroId} ${result.name}: ${result.changed.join(', ')}`);
}
