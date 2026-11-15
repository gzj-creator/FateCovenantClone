import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { setBit } from '../game/bit-block.mjs';
import { previewGuideAwardRepair, applyGuideAwardRepair, guideRepairDatabaseFingerprint } from '../game/guide-award-repair.mjs';
import { runGuideAwardRepair } from '../scripts/repair-guide-awards.mjs';

const codec = createGameCodec(), tables = readGameTables();

function setup(t) {
  const closers = [];
  const fixture = createGameFixture({ after(action) {
    t.after(async () => { for (const close of closers) close(); await action(); });
  } }, codec, { prefix: 'fc-guide-repair-', seed: { freshAccount: true } });
  return { ...fixture, direct() {
    const db = new DatabaseSync(fixture.databasePath); db.exec('PRAGMA foreign_keys=ON');
    closers.push(() => db.close()); return db;
  } };
}

function setMission(store, missionId, roleId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(missionId);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    modules.set(8, module); model.state.modules.value = [...modules];
  }, roleId);
}

function direct(fixture) {
  return fixture.direct();
}

function rowValues(db, table, exclude = () => false) {
  return db.prepare('SELECT * FROM "' + table + '"').all().filter(row => !exclude(row));
}

test('preview validates real Section order and never grants the second hero before 20201', t => {
  const fixture = setup(t), db = direct(fixture);
  for (const [missionId, statuses] of [
    [0, ['not_yet_eligible', 'not_yet_eligible']],
    [10201, ['review_invalid_mission', 'review_invalid_mission']],
    [10202, ['eligible', 'not_yet_eligible']],
    [10206, ['eligible', 'not_yet_eligible']],
    [20201, ['eligible', 'eligible']],
    [9999999, ['review_invalid_mission', 'review_invalid_mission']]
  ]) {
    setMission(fixture.store, missionId);
    const before = guideRepairDatabaseFingerprint(db);
    const plan = previewGuideAwardRepair(db, { codec });
    assert.deepEqual(plan.roles[0].awards.map(award => award.status), statuses);
    assert.equal(guideRepairDatabaseFingerprint(db), before, 'preview must not change rows');
    assert.equal(JSON.stringify(plan).includes('Local Test'), false, 'preview omits player name and account data');
  }
});

test('repair grants only absent eligible heroes and preserves all existing progression, lineups and unrelated rows', t => {
  const fixture = setup(t);
  setMission(fixture.store, 10206);
  fixture.store.transaction(model => {
    const hero = model.heroInfo.hero_list[0]; hero.level = 7; hero.star_progress = 2; hero.breakthrough_level = 3;
    model.heroInfo.cell_list[0].level = 7;
    model.state.guides = { 106004: 104 };
  });
  const db = direct(fixture);
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name);
  const allowed = new Set(['heroes', 'login_modules', 'reward_claims']);
  const unrelated = new Map(names.filter(name => !allowed.has(name)).map(name => [name, rowValues(db, name)]));
  const originalHeroes = rowValues(db, 'heroes');
  const originalModules = rowValues(db, 'login_modules', row => [10, 16].includes(Number(row.module_id)));
  const originalModule10 = JSON.parse(db.prepare('SELECT payload_json FROM login_modules WHERE module_id=10').get().payload_json);
  const originalHeroBytes = rawBinary(originalModule10.value[0]);
  const plan = previewGuideAwardRepair(db, { codec });
  const result = applyGuideAwardRepair(db, { codec, tables, plan, now: 1700000000000 });
  assert.equal(result.applied, 1);
  assert.deepEqual(result.repairs.map(row => [row.awardTid, row.heroTid]), [[1, 1020601]]);
  assert.equal(db.prepare("SELECT count(*) AS n FROM heroes WHERE tid='2020601'").get().n, 0);
  for (const [name, rows] of unrelated) assert.deepEqual(rowValues(db, name), rows, name + ' remains identical');
  assert.deepEqual(rowValues(db, 'heroes', row => row.tid === '1020601'), originalHeroes);
  assert.deepEqual(rowValues(db, 'login_modules', row => [10, 16].includes(Number(row.module_id))), originalModules);
  const afterModule10 = JSON.parse(db.prepare('SELECT payload_json FROM login_modules WHERE module_id=10').get().payload_json);
  assert.deepEqual(rawBinary(afterModule10.value[0]).subarray(0, originalHeroBytes.length), originalHeroBytes, 'existing protobuf hero bytes are preserved');
  const after = previewGuideAwardRepair(db, { codec });
  assert.deepEqual(after.roles[0].awards.map(row => row.status), ['already_claimed', 'not_yet_eligible']);
  const fingerprint = guideRepairDatabaseFingerprint(db);
  assert.equal(applyGuideAwardRepair(db, { codec, tables, plan: after }).applied, 0);
  assert.equal(guideRepairDatabaseFingerprint(db), fingerprint, 'a reviewed second repair is a no-op');
  assert.throws(() => applyGuideAwardRepair(db, { codec, tables, plan }), /changed after preview/);
});

test('existing original reward heroes without proof are flagged for review and never regranted', t => {
  const fixture = setup(t);
  setMission(fixture.store, 20201);
  fixture.store.transaction(model => grantResources(model, [[1020601, 1]], tables, { codec }));
  const db = direct(fixture);
  const plan = previewGuideAwardRepair(db, { codec });
  assert.deepEqual(plan.roles[0].awards.map(row => row.status), ['review_existing_hero', 'eligible']);
  const originalHero = db.prepare("SELECT * FROM heroes WHERE tid='1020601'").get();
  assert.equal(applyGuideAwardRepair(db, { codec, tables, plan }).applied, 1);
  assert.deepEqual(db.prepare("SELECT * FROM heroes WHERE tid='1020601'").get(), originalHero);
});

test('raw award bits and alternate legacy ledger keys independently block duplicate grants', t => {
  const fixture = setup(t);
  setMission(fixture.store, 20201);
  fixture.store.transaction((model, db) => {
    const modules = new Map(model.state.modules.value), login = codec.unpack('pb_guide', rawBinary(modules.get(16)));
    login.award = setBit(Buffer.alloc(0), 1).toString('base64');
    modules.set(16, serializedBinary(codec.pack('pb_guide', login))); model.state.modules.value = [...modules];
    db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'guide_award', '114:110004:2', '2026-11-14T00:00:00Z');
  });
  const db = direct(fixture);
  const plan = previewGuideAwardRepair(db, { codec });
  assert.deepEqual(plan.roles[0].awards.map(row => row.status), ['already_claimed', 'already_claimed']);
  assert.equal(applyGuideAwardRepair(db, { codec, tables, plan }).applied, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM heroes WHERE tid IN ('1020601','2020601')").get().n, 0);
});

test('repair rejects a changed preview and rolls all changes back when a login module write fails', t => {
  const fixture = setup(t); setMission(fixture.store, 20201);
  const db = direct(fixture);
  const stale = previewGuideAwardRepair(db, { codec });
  db.exec("CREATE TRIGGER reject_repair_guide BEFORE UPDATE ON login_modules WHEN NEW.module_id=16 BEGIN SELECT RAISE(ABORT,'guide repair blocked'); END;");
  // Fingerprint includes schema and rows, so adding a trigger must be visible.
  const plan = previewGuideAwardRepair(db, { codec });
  const before = guideRepairDatabaseFingerprint(db);
  assert.throws(() => applyGuideAwardRepair(db, { codec, tables, plan }), /guide repair blocked/);
  assert.equal(guideRepairDatabaseFingerprint(db), before);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='guide_award_repairs'").get().n, 0);
  db.exec('DROP TRIGGER reject_repair_guide');
  const matchingPlan = previewGuideAwardRepair(db, { codec });
  const beforeMismatch = guideRepairDatabaseFingerprint(db);
  assert.throws(() => applyGuideAwardRepair(db, { codec, tables, plan: matchingPlan, expectedAfterFingerprint: 'invalid-rehearsal-hash' }), /rolled back/);
  assert.equal(guideRepairDatabaseFingerprint(db), beforeMismatch, 'a rehearsal mismatch is rejected before committing');
  db.prepare("UPDATE roles SET profile_json=profile_json||' ' WHERE role_id=?").run(plan.roleIds[0]);
  assert.throws(() => applyGuideAwardRepair(db, { codec, tables, plan: stale }), /changed after preview/);
});

test('CLI defaults to preview and applies only with a reviewed plan, SQLite backup and successful rehearsal', async t => {
  const fixture = setup(t); setMission(fixture.store, 20201);
  assert.ok(fs.statSync(fixture.databasePath + '-wal').size > 0, 'fixture keeps committed writes in WAL during SQLite backup');
  const planFile = path.join(fixture.directory, 'repair-plan.json');
  const before = fixture.store.inspect(guideRepairDatabaseFingerprint);
  const preview = await runGuideAwardRepair(['--database', fixture.databasePath, '--output', planFile]);
  assert.equal(preview.mode, 'preview');
  assert.equal(preview.counts.eligible, 2);
  assert.equal(fixture.store.inspect(guideRepairDatabaseFingerprint), before);
  await assert.rejects(() => runGuideAwardRepair(['--database', fixture.databasePath, '--apply']), /requires/);
  const result = await runGuideAwardRepair(['--database', fixture.databasePath, '--apply', '--plan', planFile,
    '--backup-dir', path.join(fixture.directory, 'backups'), '--confirm-offline']);
  assert.equal(result.applied, 2);
  assert.equal(result.rehearsalVerified, true);
  assert.equal(result.verification.integrity, 'ok');
  const backupDb = new DatabaseSync(path.join(result.backup.directory, 'before.sqlite'), { readOnly: true });
  try { assert.equal(guideRepairDatabaseFingerprint(backupDb), before); }
  finally { backupDb.close(); }
  assert.ok(fs.existsSync(path.join(result.backup.directory, 'rehearsal.sqlite')));
  assert.ok(fs.existsSync(path.join(result.backup.directory, 'result.json')));
  assert.equal((await runGuideAwardRepair(['--database', fixture.databasePath])).counts.already_claimed, 2);
  const secondPlan = path.join(fixture.directory, 'second-plan.json');
  await runGuideAwardRepair(['--database', fixture.databasePath, '--output', secondPlan]);
  const after = fixture.store.inspect(guideRepairDatabaseFingerprint);
  const second = await runGuideAwardRepair(['--database', fixture.databasePath, '--apply', '--plan', secondPlan,
    '--backup-dir', path.join(fixture.directory, 'backups'), '--confirm-offline']);
  assert.equal(second.applied, 0);
  assert.equal(fixture.store.inspect(guideRepairDatabaseFingerprint), after);
});

test('a role-filtered repair leaves other accounts and their saved state intact', t => {
  const fixture = setup(t);
  const roleA = fixture.store.currentRoleId();
  const roleB = fixture.store.resolveAccount('repair-test-second').roleId;
  setMission(fixture.store, 20201, roleA); setMission(fixture.store, 20201, roleB);
  const beforeOther = fixture.store.read(roleB);
  const db = direct(fixture);
  const plan = previewGuideAwardRepair(db, { codec, roleIds: [roleA] });
  assert.deepEqual(plan.roleIds, [roleA]);
  assert.equal(applyGuideAwardRepair(db, { codec, tables, plan }).applied, 2);
  assert.deepEqual(fixture.store.read(roleB), beforeOther);
  assert.deepEqual(previewGuideAwardRepair(db, { codec, roleIds: [roleB] }).roles[0].awards.map(row => row.status), ['eligible', 'eligible']);
});

test('CLI refuses the selected database before opening it when an adjacent recorded server PID is alive', async t => {
  const fixture = setup(t);
  fs.writeFileSync(path.join(fixture.directory, 'server.local-only.json'), JSON.stringify({ pid: process.pid }));
  await assert.rejects(() => runGuideAwardRepair(['--database', fixture.databasePath]), /still active; no database was opened/);
});
