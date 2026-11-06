/**
 * Read-only audit: compare implementations of the same skill id across heroes.
 * Prints groups whose implementations diverge, plus metadata (tid) divergences.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/skill-database.json'), 'utf8'));
const EXCLUDED = new Set(['1020401','1020501','1030101','1030301','1030501','1030601','2020501','2020601','3020101','3020301','3020401','2030201','2040201','3020201','3030201','5040301','5040601','5040701','4030101','4030601']);

const groups = new Map();
for (const hero of db.heroes) {
  for (const skill of hero.skills) {
    if (!groups.has(skill.id)) groups.set(skill.id, []);
    groups.get(skill.id).push({ heroId: String(hero.id), hero: hero.name, skill });
  }
}

const strip = impl => {
  if (!impl) return 'null';
  const { ability, abilityDes, notes, ...rest } = impl;
  return JSON.stringify(rest);
};

let diverge = 0;
for (const [id, entries] of groups) {
  if (entries.length < 2) continue;
  const variants = new Map();
  for (const e of entries) {
    const key = strip(e.skill.implementation);
    if (!variants.has(key)) variants.set(key, []);
    variants.get(key).push(e.heroId);
  }
  const descs = new Set(entries.map(e => (e.skill.description || '').trim()));
  if (variants.size === 1 && descs.size === 1) continue;
  diverge++;
  const scoped = entries.filter(e => !EXCLUDED.has(e.heroId)).map(e => e.heroId);
  const excluded = entries.filter(e => EXCLUDED.has(e.heroId)).map(e => e.heroId);
  console.log('\n### ' + id + ' ' + entries[0].skill.name + '  heroes=' + entries.length + ' descVariants=' + descs.size + ' implVariants=' + variants.size + (scoped.length ? '  [in-scope:' + scoped.join(',') + ']' : '') + (excluded.length ? ' [excluded:' + excluded.join(',') + ']' : ''));
  if (descs.size > 1) {
    for (const d of descs) console.log('   desc: ' + d);
  }
  if (variants.size > 1) {
    let i = 0;
    for (const [, heroes] of variants) {
      console.log('   variant' + (i++) + ' (' + heroes.join(',') + ')');
    }
  }
}
console.log('\ntotal shared-id groups with divergence: ' + diverge);
