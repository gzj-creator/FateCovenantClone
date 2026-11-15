import { createHash } from 'node:crypto';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGuideAwards } from '../config/guide-awards.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { missionPosition } from './mission-progress.mjs';
import { grantResources } from './resources.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const REPAIR_VERSION = 'guide-awards-20261114-v1';
const EARLY_AWARDS = [{ awardTid: 1, minMission: 10202, heroTid: 1020601 }, { awardTid: 2, minMission: 20201, heroTid: 2020601 }];
const REQUIRED_TABLES = ['roles', 'heroes', 'hero_cells', 'login_modules', 'reward_claims'];
const canonical = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item);
const digest = value => createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
const quote = name => '"' + name.replaceAll('"', '""') + '"';

function tableNames(db) {
  return db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
}

function assertSchema(db) {
  const existing = new Set(tableNames(db).map(row => row.name));
  for (const name of REQUIRED_TABLES) if (!existing.has(name)) throw new Error('Repair source is missing table ' + name);
}

// Logical hashes cover committed rows, including WAL-backed content. They do
// not expose account identities, balances, payloads or other private values.
export function guideRepairDatabaseFingerprint(db) {
  const entries = tableNames(db).map(row => {
    const values = db.prepare('SELECT * FROM ' + quote(row.name)).all().map(canonical).sort();
    return [row.name, row.sql, digest(values)];
  });
  const schema = db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').all();
  return digest({ schema, entries });
}

export function verifyGuideRepairDatabase(db) {
  const integrity = db.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || Object.values(integrity[0])[0] !== 'ok') throw new Error('SQLite integrity_check failed');
  const violations = db.prepare('PRAGMA foreign_key_check').all();
  if (violations.length) throw new Error('SQLite foreign_key_check failed: ' + violations.length + ' rows');
  return { integrity: 'ok', foreignKeyViolations: 0 };
}

function unpackModule(db, roleId, moduleId) {
  const row = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=?').get(roleId, moduleId);
  if (!row) return null;
  return JSON.parse(row.payload_json);
}

function collectPlan(db, { codec, roleIds, sections }) {
  assertSchema(db);
  const selected = roleIds == null ? null : new Set(roleIds.map(Number));
  if (selected && [...selected].some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid repair role ID');
  const roles = db.prepare('SELECT role_id,server_id FROM roles ORDER BY role_id').all().filter(row => !selected || selected.has(row.role_id));
  if (selected && roles.length !== selected.size) throw new Error('One or more selected roles do not exist');
  const rows = [];
  for (const role of roles) {
    const roleId = Number(role.role_id);
    const missionModule = unpackModule(db, roleId, 8);
    const guideModule = unpackModule(db, roleId, 16);
    const heroModule = unpackModule(db, roleId, 10);
    const missionId = missionModule?.value?.[0]
      ? Number(codec.unpack('pb_mission', rawBinary(missionModule.value[0])).mission_id ?? 0) : null;
    const login = guideModule == null ? null : codec.unpack('pb_guide', rawBinary(guideModule));
    const heroSnapshot = heroModule?.value?.[0] ? codec.unpack('pb_hero_info', rawBinary(heroModule.value[0])) : null;
    const bits = Buffer.from(login?.award ?? '', 'base64');
    const claims = db.prepare("SELECT claim_key FROM reward_claims WHERE role_id=? AND claim_type='guide_award'").all(roleId);
    const owned = db.prepare('SELECT tid FROM heroes WHERE role_id=?').all(roleId);
    const position = missionId == null || missionId === 0 ? -1 : missionPosition(sections, missionId);
    const awards = EARLY_AWARDS.map(rule => {
      const requiredPosition = missionPosition(sections, rule.minMission);
      if (requiredPosition < 0) throw new Error('Original guide mission gate is absent from Section');
      const evidence = {
        awardBit: hasBit(bits, rule.awardTid),
        claimRecorded: claims.some(claim => Number(claim.claim_key.split(':').at(-1)) === rule.awardTid),
        heroInAuthority: owned.some(hero => Number(hero.tid) === rule.heroTid),
        heroInLoginSnapshot: (heroSnapshot?.hero_list ?? []).some(hero => Number(hero.tid) === rule.heroTid)
      };
      let status;
      if (evidence.awardBit || evidence.claimRecorded) status = 'already_claimed';
      else if (login == null || heroSnapshot == null || missionId == null) status = 'review_missing_module';
      else if (missionId !== 0 && position < 0) status = 'review_invalid_mission';
      else if (position < requiredPosition) status = 'not_yet_eligible';
      else if (evidence.heroInAuthority || evidence.heroInLoginSnapshot) status = 'review_existing_hero';
      else status = 'eligible';
      return { ...rule, quantity: 1, status, evidence };
    });
    rows.push({ roleId, serverId: Number(role.server_id), missionId, awards });
  }
  const plan = {
    version: REPAIR_VERSION, databaseFingerprint: guideRepairDatabaseFingerprint(db),
    roleIds: roles.map(row => Number(row.role_id)), roles: rows,
    counts: rows.flatMap(row => row.awards).reduce((counts, award) => {
      counts[award.status] = (counts[award.status] ?? 0) + 1; return counts;
    }, {})
  };
  return { ...plan, planHash: digest(plan) };
}

export function previewGuideAwardRepair(db, { codec, roleIds = null, sections = readMissionTables().sections } = {}) {
  db.exec('BEGIN');
  try {
    verifyGuideRepairDatabase(db);
    const plan = collectPlan(db, { codec, roleIds, sections });
    db.exec('ROLLBACK');
    return plan;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

function insertHero(db, roleId, hero) {
  db.prepare('INSERT INTO heroes (role_id,uid,tid,level,star,star_progress,break_level,payload_json) VALUES (?,?,?,?,?,?,?,?)')
    .run(roleId, String(hero.uid), String(hero.tid), hero.level ?? 1, hero.star ?? 0,
      hero.star_progress ?? 0, hero.breakthrough_level ?? 0, canonical(hero));
}

// This narrow offline repair never opens createGameStore or runs migrations.
// It inserts missing heroes, appends their protobuf records, and marks exactly
// the two original entitlements. Existing hero payloads/levels, cells, lineups,
// resource balances and all other login slots are left byte-for-byte intact.
export function applyGuideAwardRepair(db, { codec, tables, plan, now = Date.now, sections = readMissionTables().sections, expectedAfterFingerprint = null } = {}) {
  if (!plan?.planHash || plan.version !== REPAIR_VERSION) throw new Error('A reviewed repair plan is required');
  const productionAwards = readGuideAwards();
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
  try {
    const current = collectPlan(db, { codec, roleIds: plan.roleIds, sections });
    if (current.planHash !== plan.planHash) throw new Error('Repair source changed after preview; generate a new plan');
    const eligible = current.roles.flatMap(role => role.awards.filter(award => award.status === 'eligible').map(award => ({ ...award, roleId: role.roleId })));
    if (!eligible.length) { db.exec('ROLLBACK'); return { applied: 0, planHash: plan.planHash, repairs: [], verification: verifyGuideRepairDatabase(db) }; }
    const timestamp = new Date(typeof now === 'function' ? now() : now).toISOString();
    db.exec(`CREATE TABLE IF NOT EXISTS guide_award_repairs (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), award_tid INTEGER NOT NULL,
      repair_version TEXT NOT NULL, plan_hash TEXT NOT NULL, evidence_json TEXT NOT NULL,
      repaired_at TEXT NOT NULL, PRIMARY KEY(role_id,award_tid));`);
    const repairs = [];
    for (const award of eligible) {
      const row = productionAwards.get(award.awardTid);
      if (canonical(row?.items) !== canonical([[award.heroTid, 1]])) throw new Error('Original guide reward changed; repair definition must be reviewed');
      const model = { state: { modules: { value: [] } }, heroInfo: { hero_list: [] } };
      grantResources(model, row.items, tables, { codec });
      const newHero = model.heroInfo.hero_list[0];
      if (!newHero || Number(newHero.tid) !== award.heroTid) throw new Error('Guide repair did not construct the original hero');
      insertHero(db, award.roleId, newHero);
      const heroModule = unpackModule(db, award.roleId, 10);
      const originalHeroBytes = rawBinary(heroModule.value[0]);
      const addedHeroBytes = codec.pack('pb_hero_info', { hero_list: [newHero] });
      heroModule.value[0] = serializedBinary(Buffer.concat([originalHeroBytes, addedHeroBytes]));
      db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=10').run(canonical(heroModule), award.roleId);
      const guideModule = unpackModule(db, award.roleId, 16);
      const guide = codec.unpack('pb_guide', rawBinary(guideModule));
      guide.award = setBit(Buffer.from(guide.award ?? '', 'base64'), award.awardTid).toString('base64');
      // A final scalar field overrides the old protobuf field while retaining
      // the original process rows and any unknown fields in their raw bytes.
      const guideBytes = Buffer.concat([rawBinary(guideModule), codec.pack('pb_guide', { award: guide.award })]);
      db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=16')
        .run(canonical(serializedBinary(guideBytes)), award.roleId);
      const claimKey = row.processId + ':' + row.keyId + ':' + award.awardTid;
      db.prepare('INSERT INTO reward_claims (role_id,claim_type,claim_key,created_at) VALUES (?,?,?,?)')
        .run(award.roleId, 'guide_award', claimKey, timestamp);
      db.prepare('INSERT INTO guide_award_repairs VALUES (?,?,?,?,?,?)')
        .run(award.roleId, award.awardTid, REPAIR_VERSION, plan.planHash, canonical({ missionId: current.roles.find(role => role.roleId === award.roleId).missionId, ...award.evidence }), timestamp);
      repairs.push({ roleId: award.roleId, awardTid: award.awardTid, heroTid: award.heroTid, quantity: 1 });
    }
    const verification = verifyGuideRepairDatabase(db);
    if (expectedAfterFingerprint != null && guideRepairDatabaseFingerprint(db) !== expectedAfterFingerprint) {
      throw new Error('Rehearsal and source results differ; repair was rolled back');
    }
    db.exec('COMMIT');
    return { applied: repairs.length, planHash: plan.planHash, repairs, verification };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
