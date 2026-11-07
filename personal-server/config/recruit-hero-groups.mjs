import fs from 'node:fs';

const defaultPath = new URL('./new-hero-exclusive-heroes.json', import.meta.url);
let defaultCache;

function positiveInteger(value, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(message);
  return number;
}

// This compact artifact is generated from NewHeroExclusiveTable.WishDrawHero.
// Keeping it separate from recruit-pool-rules lets future exclusive groups,
// such as collaboration heroes, be added as data without changing draw logic.
export function readRecruitHeroExclusionGroups(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (parsed?.schemaVersion !== 1) throw new Error('Recruit hero exclusion schema version is unsupported');
  if (parsed?.source?.table !== 'NewHeroExclusiveTable.WishDrawHero') {
    throw new Error('Recruit hero exclusion source is invalid');
  }
  if (!/^[0-9a-f]{64}$/.test(String(parsed.source.sourceSha256 ?? ''))) {
    throw new Error('Recruit hero exclusion source hash is invalid');
  }
  if (!parsed.groups || typeof parsed.groups !== 'object' || Array.isArray(parsed.groups)) {
    throw new Error('Recruit hero exclusion groups are invalid');
  }

  const groups = new Map();
  for (const [name, rows] of Object.entries(parsed.groups)) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(name) || !Array.isArray(rows) || rows.length === 0) {
      throw new Error('Recruit hero exclusion group is invalid: ' + name);
    }
    const tids = new Set();
    for (const row of rows) {
      const tid = positiveInteger(row?.tid, `Recruit hero exclusion ${name} contains an invalid hero id`);
      if (tids.has(tid)) throw new Error(`Recruit hero exclusion ${name} contains duplicate hero ${tid}`);
      if (row.quality !== undefined) positiveInteger(row.quality, `Recruit hero exclusion ${name} contains an invalid quality`);
      if (row.getWay !== undefined && !Number.isSafeInteger(Number(row.getWay))) {
        throw new Error(`Recruit hero exclusion ${name} contains an invalid acquisition route`);
      }
      tids.add(tid);
    }
    groups.set(name, tids);
  }

  const result = Object.freeze({
    source: Object.freeze({
      table: parsed.source.table,
      sourceSha256: parsed.source.sourceSha256
    }),
    groups
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
