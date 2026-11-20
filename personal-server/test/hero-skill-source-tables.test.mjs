import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { extractGroups } from '../../tools/extract-battle-tables.mjs';
import { addReference } from '../../tools/build-character-skill-catalog.mjs';

test('the offline extractor retains every ordered original Hero and NPC ability array', () => {
  const parsed = readJsonAsset(tableAsset('HeroTable.data.lua.json'));
  const groups = extractGroups(parsed, 'HeroTable');
  const tables = readHeroTables();
  for (const [name, count] of [['Ability', 77], ['Npc_Ability', 333]]) {
    const actual = groups.find(group => group.rootName === name).rows;
    assert.equal(actual.length, count);
    for (const { tid, ability } of actual) {
      assert.ok(Array.isArray(ability) && ability.length > 0, `${name}:${tid}`);
      assert.deepEqual(ability, tables[name].get(tid).ability, `${name}:${tid}`);
    }
  }
});

test('catalog references preserve individual IDs, order, and deduplicated source labels', () => {
  const refs = new Map();
  addReference(refs, [1403080101, 2403080113, 3403080111, 0], 'hero.ability');
  addReference(refs, [2403080113], 'npc.ability');
  addReference(refs, 2403080113, 'npc.ability');
  assert.deepEqual([...refs.keys()], ['1403080101', '2403080113', '3403080111']);
  assert.deepEqual(refs.get('2403080113').source, ['hero.ability', 'npc.ability']);
});

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const fightShards = path.join(projectRoot, 'analysis/scratchpad/time-temple-20261108/project');
const originalLanguage = path.join(projectRoot, 'analysis/scratchpad/defeat-power-20261114/sub-first-language.bin');

test('single-target normal definitions reproduce from original same-ID descriptions', {
  skip: !fs.existsSync(fightShards) || !fs.existsSync(originalLanguage),
}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fate-hero-normals-'));
  const output = path.join(directory, 'normals.json');
  try {
    execFileSync(process.execPath, [path.join(projectRoot, 'tools/extract-hero-normal-skills.mjs'), fightShards, originalLanguage, output]);
    const reconstructed = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.deepEqual(reconstructed, readJsonAsset(tableAsset('HeroNormalSkills.data.json')));
    assert.equal(reconstructed.rows.length, 75);
    assert.deepEqual(reconstructed.unresolved.map(row => row.id), [1404030101, 1404040101]);
  } finally {
    if (fs.existsSync(output)) fs.unlinkSync(output);
    fs.rmdirSync(directory);
  }
});

test('source-backed audit joins original rows by ID instead of trusting duplicated catalog text keys', {
  skip: !fs.existsSync(fightShards) || !fs.existsSync(originalLanguage),
}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fate-skill-audit-'));
  const output = path.join(directory, 'audit.json');
  try {
    execFileSync(process.execPath, [path.join(projectRoot, 'tools/audit-skill-descriptions.mjs'),
      '--fight-shards', fightShards, '--language', originalLanguage, '--output', output]);
    const audit = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(audit.inputs.originalAbilityDescriptions.rows, 5655);
    assert.ok(audit.inputs.originalAbilityDescriptions.files.every(file => /^[0-9a-f]{64}$/.test(file.sha256)));
    const matrix = new Map(audit.skillMatrix.map(skill => [skill.skillId, skill]));
    const poison = matrix.get('312030174');
    assert.equal(poison.abilityDes.text, 604400044);
    assert.match(poison.descriptions[0], /30%概率.*中毒/);
    assert.deepEqual(poison.descriptionSources, ['original.AbilityDes.text']);
    for (const [id, perHit] of [['2302050112', 57], ['2302050113', 63]]) {
      assert.ok(matrix.get(id).descriptions[0].includes(`2段${perHit}%`));
      assert.ok(!audit.issues.some(issue => issue.skillId === id && issue.code === 'DAMAGE_MULTIPLIER_MISMATCH'));
    }
    assert.ok(audit.issues.some(issue => issue.code === 'DAMAGE_DESCRIPTION_WITHOUT_DAMAGE'));
    assert.ok(!audit.nameSourceMismatches.some(({ skillId }) => /^31307017[1-5]$/.test(skillId)));
    const fallback = audit.skillMatrix.find(skill => skill.skillId.startsWith('normal-'));
    assert.deepEqual(fallback.descriptionSources, ['unresolved-original']);
    assert.equal(fallback.abilityDes, null);
    const production = audit.productionSlots;
    assert.equal(production.summary.heroes, 77);
    assert.equal(production.summary.normal['same-id-definition'], 75);
    const evan = production.players.find(player => player.tid === 2010101);
    assert.equal(evan.ordinary.status, 'same-id-definition');
    assert.equal(evan.ordinary.original.textId, 601501042);
    const radiance = production.players.find(player => player.tid === 4020101).ordinary.original;
    assert.match(radiance.text, /\{0\}/);
    assert.deepEqual(radiance.features, [{ featureId: 19, name: '脆弱', textId: 609000019,
      text: '造成的伤害降低15%，持续2回合' }]);
    assert.equal(audit.inputs.originalAbilityBuffDescriptions.rows, 221);
    assert.equal(production.players.find(player => player.tid === 1030601).ordinary.status, 'no-original-action');
    assert.equal(production.npc.rows.length, 333);
    assert.ok(production.npc.rows.every(row => row.unknownTypes.length === 0));
    assert.equal(production.npc.withoutNormal, 61);
    const { journey, guide } = production.npc.encounters;
    assert.equal(journey.sections, 3491);
    assert.deepEqual(journey.noFight, [10206, 50211, 70211, 80211, 90211, 100211, 120211, 140211]);
    assert.equal(journey.multiTeam.length, 2641);
    assert.deepEqual(journey.unresolved, []);
    assert.equal(journey.singleTeam.sections + journey.multiTeam.length + journey.noFight.length, journey.sections);
    assert.equal(journey.singleTeam.slots, 4992);
    assert.deepEqual(journey.singleTeam.gaps, []);
    assert.equal(journey.singleTeam.slotsWithoutNormal, 0);
    assert.equal(journey.singleTeam.slotsWithoutOrdinary, 0);
    assert.deepEqual(guide.map(item => item.fightTid), [90024, 90025, 90029, 90030]);
    const actors = guide.find(item => item.fightTid === 90029).attackers.teams[0].slots;
    assert.equal(actors.find(actor => actor.npcTid === 9005700).ordinary, 6202060113);
    assert.ok(guide.every(item => item.attackers.teams.length === 1 && item.defenders.teams.length === 1));
    assert.equal(production.triMatch.players.length, 78);
    assert.equal(production.triMatch.npcs.length, 78);
    assert.equal(production.triMatch.actions.length, 52);
    assert.ok(production.triMatch.actions.every(row => row.description));
  } finally {
    if (fs.existsSync(output)) fs.unlinkSync(output);
    fs.rmdirSync(directory);
  }
});

test('no source-backed catalog AbilityDes row keeps cloned IDs, keys, icons or names', {
  skip: !fs.existsSync(fightShards) || !fs.existsSync(originalLanguage),
}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fate-skill-metadata-'));
  const output = path.join(directory, 'audit.json');
  try {
    execFileSync(process.execPath, [path.join(projectRoot, 'tools/audit-skill-descriptions.mjs'),
      '--fight-shards', fightShards, '--language', originalLanguage, '--output', output]);
    const audit = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.deepEqual(audit.catalogMetadataDifferences.map(({ skillId }) => skillId), []);
    assert.deepEqual(audit.nameSourceMismatches.map(({ skillId }) => skillId), []);
  } finally {
    if (fs.existsSync(output)) fs.unlinkSync(output);
    fs.rmdirSync(directory);
  }
});
