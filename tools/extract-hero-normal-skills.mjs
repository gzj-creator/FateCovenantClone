import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readHeroTables } from '../personal-server/config/hero-tables.mjs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { readFightShard } from './read-fight-shard.mjs';

const [source, languageFile, output] = process.argv.slice(2);
if (!source || !languageFile || !output) throw new Error('Usage: node tools/extract-hero-normal-skills.mjs <fight-shards> <language> <output>');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const heroTables = readHeroTables();
assert.ok([...heroTables.AbilityLevel.values()].every(row => row.level[0] === 1));
const normalIds = new Set([...heroTables.Ability.values()].map(row => row.ability[0]));
assert.equal(normalIds.size, 77);

const languageBytes = fs.readFileSync(languageFile);
const language = new Map();
for (const line of languageBytes.toString('utf8').replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
  const separator = line.indexOf('=');
  if (separator <= 0) continue;
  const key = Number(line.slice(0, separator));
  if (!Number.isSafeInteger(key)) continue;
  const text = line.slice(separator + 1).replace(/<[^>]*>/g, '').trim();
  if (language.has(key)) assert.equal(language.get(key), text, `conflicting language key ${key}`);
  language.set(key, text);
}

const byId = new Map();
const files = [];
for (const name of fs.readdirSync(source).filter(name => /-FightTable\.AbilityDes\.1\d{4}\.data\.lua\.bin$/.test(name)).sort()) {
  const bytes = fs.readFileSync(path.join(source, name));
  let matched = 0;
  for (const [id, entry] of readFightShard(parseLuaJit(bytes))) {
    if (!normalIds.has(id)) continue;
    assert.ok(!byId.has(id), `duplicate normal ID ${id}`);
    assert.ok(language.has(entry.show_name) && language.has(entry.text), `unlocalized normal ID ${id}`);
    byId.set(id, entry);
    matched++;
  }
  if (matched) files.push({ name, sha256: hash(bytes), matched });
}
assert.equal(byId.size, normalIds.size);
const rows = [];
const unresolved = [];
for (const id of [...normalIds].sort((left, right) => left - right)) {
  const entry = byId.get(id);
  const name = language.get(entry.show_name);
  const text = language.get(entry.text);
  const match = /^对敌方单体造成(100|110)%的(物理|魔法)伤害(，并获取1点天极值)?$/.exec(text);
  if (!match) {
    unresolved.push({ id, textKey: entry.text, text });
    continue;
  }
  const [, percent, damageType, tianji] = match;
  assert.equal(Boolean(tianji), percent === '110', `unexpected Tianji clause in normal ${id}`);
  rows.push([id, name, entry.text, damageType === '物理' ? 'physical' : 'magical', Number(percent) / 100, tianji ? 1 : 0]);
}
assert.deepEqual(unresolved.map(entry => entry.id), [1404030101, 1404040101]);
const data = { languageSha256: hash(languageBytes), files, fields: ['id', 'name', 'textKey', 'damageType', 'multiplier', 'tianjiGain'], rows, unresolved };
fs.writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({ output, rows: rows.length, unresolved: unresolved.length }));
