import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { assembleHeroAttributes } from '../game/attribute-service.mjs';

// Broad invariant audit complements the independent original-value fixtures.
// It is NOT an oracle for missing attributes or the original damage formula.
const heroTables = readHeroTables(), attributeTables = readAttributeTables();
const failures = [], sourceGaps = new Map(), examples = [], nonPlayerTemplates = [];
let cases = 0, masteryCases = 0, campCases = 0;
function check(hero, tables = heroTables) {
  cases++;
  try {
    const result = assembleHeroAttributes({ hero, heroTables: tables, attributeTables });
    for (const [key, value] of Object.entries({ ...result.stats, power: result.power })) {
      if (!Number.isSafeInteger(value) || value < 0) failures.push({ tid: hero.tid, hero, field: key, value });
    }
    for (const note of result.notes) sourceGaps.set(note, (sourceGaps.get(note) ?? 0) + 1);
    return result;
  } catch (error) {
    failures.push({ tid: hero.tid, hero, error: error.message });
    return null;
  }
}
for (const [tid, config] of heroTables.Hero) {
  // HeroTable.Hero also contains 260 monster/appearance templates. Their
  // chip=0 rows use NPC attributes, not player BaseAttrNew. Retain them in the
  // inventory without inventing player stats for them.
  if (Number(config.chip ?? 0) === 0) {
    nonPlayerTemplates.push({ tid, npcRowPresent: heroTables.Npc.has(tid), reason: 'no playable hero chip; NPC/appearance template' });
    continue;
  }
  const initial = { uid: String(tid), tid, quality: config.quality, level: 1,
    star: Number(config.star ?? 0), star_progress: 0, breakthrough_level: 0 };
  const base = check(initial);
  if (!base) continue;
  examples.push({ tid, quality: config.quality, stats: base.stats, power: base.power, notes: base.notes });
  for (const level of [1, 2, 60, 300]) {
    for (let star = initial.star; star <= Math.min(10, Number(config.max_star ?? 10)); star++) {
      check({ ...initial, level, star });
      check({ ...initial, level, star, breakthrough_level: 2 });
    }
  }
  if (initial.star < 5) {
    for (let progress = 1; progress <= 5; progress++) check({ ...initial, star_progress: progress });
  }
  for (const camp of [1, 2, 3, 4]) {
    const heroes = new Map(heroTables.Hero);
    heroes.set(tid, { ...config, camp });
    const changed = check(initial, { ...heroTables, Hero: heroes });
    campCases++;
    if (changed && JSON.stringify(changed.stats) !== JSON.stringify(base.stats)) {
      failures.push({ tid, field: 'camp_independence', camp });
    }
  }
  const group = heroTables.MasteryGroup.get(Number(heroTables.Mastery.get(tid)?.mastery_group));
  if (group) {
    for (let mastery_level = 1; mastery_level <= group.level_range.length; mastery_level++) {
      check({ ...initial, star: 10, mastery_level });
      masteryCases++;
    }
    for (let mastery_break = 1; mastery_break <= group.break_range.length; mastery_break++) {
      check({ ...initial, star: 10, mastery_break });
      masteryCases++;
    }
  }
}
const summary = { heroRows: heroTables.Hero.size, playableHeroes: examples.length,
  nonPlayerTemplates: nonPlayerTemplates.length, cases, campCases, masteryCases,
  failures: failures.length, distinctSourceNotes: sourceGaps.size };
const result = {
  schemaVersion: 1,
  method: 'All shipped heroes with a playable chip; levels 1/2/60/300, configured initial star..10, breakthrough 0/2, legal small star steps, every mastery level/break, and camp independence. NPC/appearance rows listed separately.',
  limitations: 'Invariant/mapping coverage only. Finiteness and monotonic input coverage do not establish original numerical fidelity or missing global/battle channels.',
  tableSha256: crypto.createHash('sha256').update(fs.readFileSync(new URL('../assets/tables/HeroTable.data.lua.json.gz', import.meta.url))).digest('hex'),
  summary, failures, sourceNotes: Object.fromEntries([...sourceGaps].sort()), initialHeroes: examples, nonPlayerTemplates
};
if (process.argv[2]) {
  const destination = path.resolve(process.argv[2]);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify(summary));
if (failures.length) process.exitCode = 1;
