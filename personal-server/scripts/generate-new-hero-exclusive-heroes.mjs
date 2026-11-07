import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { readGeneratedDump } from '../config/hero-tables.mjs';

const GROUP = 'newHeroExclusive';
const defaultOutput = fileURLToPath(new URL('../config/new-hero-exclusive-heroes.json', import.meta.url));

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJsonInput(file) {
  const raw = fs.readFileSync(file);
  const bytes = file.endsWith('.gz') ? zlib.gunzipSync(raw) : raw;
  return { bytes, parsed: JSON.parse(bytes.toString('utf8')) };
}

function usage() {
  console.error('Usage: node generate-new-hero-exclusive-heroes.mjs --table <NewHeroExclusiveTable.json[.gz]> --hero-table <HeroTable.json[.gz]> [--output <file>] [--check]');
  process.exitCode = 1;
}

const tablePath = readArgument('--table');
const heroTablePath = readArgument('--hero-table');
const outputPath = path.resolve(readArgument('--output') ?? defaultOutput);
const checkOnly = process.argv.includes('--check');

if (!tablePath || !heroTablePath) {
  usage();
} else {
  const tableInput = readJsonInput(path.resolve(tablePath));
  const heroInput = readJsonInput(path.resolve(heroTablePath));
  const exclusive = readGeneratedDump(tableInput.parsed, ['WishDrawHero']).WishDrawHero;
  const heroes = readGeneratedDump(heroInput.parsed, ['Hero']).Hero;
  const byTid = new Map();

  for (const row of exclusive.values()) {
    const tid = Number(row.hero);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new Error('WishDrawHero contains an invalid hero id');
    if (byTid.has(tid)) continue;
    const hero = heroes.get(tid);
    if (!hero) throw new Error(`HeroTable is missing new hero exclusive id ${tid}`);
    byTid.set(tid, Object.freeze({
      tid,
      quality: Number(hero.quality),
      getWay: Number(hero.get_way)
    }));
  }

  const manifest = {
    schemaVersion: 1,
    source: {
      table: 'NewHeroExclusiveTable.WishDrawHero',
      sourceSha256: crypto.createHash('sha256').update(tableInput.bytes).digest('hex')
    },
    groups: {
      [GROUP]: [...byTid.values()].sort((left, right) => left.tid - right.tid)
    }
  };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (checkOnly) {
    const current = fs.readFileSync(outputPath, 'utf8');
    if (current !== serialized) throw new Error(`${outputPath} is stale; regenerate it from the client tables`);
    console.log(`ok ${outputPath} (${byTid.size} heroes)`);
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, serialized);
    console.log(`wrote ${outputPath} (${byTid.size} heroes)`);
  }
}
