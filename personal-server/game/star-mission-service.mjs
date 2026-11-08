import { encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import {
  starMissionActivity,
  starMissionActivityVersion,
  starMissionTier
} from '../config/star-mission-tables.mjs';

// StarMissionCmd 89601-89604 for the "SP new hero activity dungeon" family
// (ActivityTable rows with func 81).
//
// Evidence: pb_star_mission_chapter_award_req {activity_id, award_tid} ->
// pb_star_mission_chapter_award_rsp {chapter, res_change}; pb_star_mission_skill_req
// {activity_id, skill_tid} and pb_star_mission_skill_reset_req {activity_id} both
// answer pb_res_to_client (assets/protobuf/star_mission.net.proto.bin). Chapter
// progress is pb_star_mission_chapter {chapter, mission_star, chapter_star_award}
// whose star payloads are ETF-encoded BitBlocks (star_mission.db.proto.bin plus
// the shared client BitBlock indexing).
//
// The rows live in StarMissionTable and are keyed by "version", not by activity
// id: StarMissionMgr.GetVision(actTid) returns actData[actTid]:Version() and the
// chapter/skill/award indexes are built per version. All rewards, thresholds and
// skill costs below come from the shipped table; nothing is synthesised.
//
// Still unevidenced and therefore rejected:
// - 89601 req_star_mission_award has no response schema and no arguments.
// - Star gains arrive through the generic fight pipeline
//   (pb_star_mission_fight_req {chapter, mission, act_id}), which is not
//   implemented here, so mission_star bit blocks are only ever read, never
//   written by this service.
const AWARD_REFUSAL = 'Star mission award is rejected: request arguments and reward mapping are not evidenced';

export const STAR_MISSION_AWARD_REFUSAL = AWARD_REFUSAL;

// Bit blocks are stored as raw hex so every database transaction stays
// synchronous; the ETF wrapping happens at the protobuf boundary.

function countBits(bits) {
  let total = 0;
  for (const byte of bits) {
    let value = byte;
    while (value) { total += value & 1; value >>= 1; }
  }
  return total;
}

function emptyRes() {
  return { changes: [], is_overflow: false };
}

export function createStarMissionService({
  store, codec, tables, activityTables, gameTables, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };

  function versionOf(actId) {
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid star mission activity id');
    if (!tables?.available) throw new GameError(5, 'Star mission configuration is unavailable');
    const version = starMissionActivityVersion(activityTables, actId);
    if (version === null) throw new GameError(5, 'Star mission activity is missing: ' + actId);
    const activity = starMissionActivity(tables, version);
    if (!activity) throw new GameError(5, 'Star mission configuration is missing for version ' + version);
    return activity;
  }

  function loadChapter(db, roleId, activity, chapter) {
    const row = db.prepare('SELECT star_bits,award_bits FROM star_mission_chapter_state WHERE role_id=? AND version=? AND chapter=?')
      .get(roleId, activity.version, chapter);
    return {
      starBits: row ? Buffer.from(row.star_bits, 'hex') : Buffer.alloc(0),
      awardBits: row ? Buffer.from(row.award_bits, 'hex') : Buffer.alloc(0)
    };
  }

  function saveChapter(db, roleId, activity, chapter, state) {
    db.prepare(`INSERT INTO star_mission_chapter_state VALUES (?,?,?,?,?,?)
      ON CONFLICT(role_id,version,chapter) DO UPDATE SET
        star_bits=excluded.star_bits, award_bits=excluded.award_bits, updated_at=excluded.updated_at`)
      .run(
        roleId, activity.version, chapter,
        state.starBits.toString('hex'), state.awardBits.toString('hex'),
        new Date(now()).toISOString()
      );
  }

  function loadSkills(db, roleId, activity) {
    const row = db.prepare('SELECT skills_json FROM star_mission_skill_state WHERE role_id=? AND version=?')
      .get(roleId, activity.version);
    return row ? JSON.parse(row.skills_json) : {};
  }

  function saveSkills(db, roleId, activity, skills) {
    db.prepare(`INSERT INTO star_mission_skill_state VALUES (?,?,?,?)
      ON CONFLICT(role_id,version) DO UPDATE SET
        skills_json=excluded.skills_json, updated_at=excluded.updated_at`)
      .run(roleId, activity.version, JSON.stringify(skills), new Date(now()).toISOString());
  }

  async function chapterAward(request) {
    const actId = Number(request?.activity_id ?? 0);
    const activity = versionOf(actId);
    const awardTid = Number(request?.award_tid ?? 0);
    if (!Number.isSafeInteger(awardTid) || awardTid <= 0) throw new GameError(1, 'Invalid star mission award id');
    const tier = starMissionTier(activity, awardTid);
    if (!tier) throw new GameError(5, 'Star mission chapter award configuration is missing: ' + awardTid);
    // ChapterAward bits are indexed by the tier position inside the chapter
    // (9/15/24 stars -> bits 0/1/2), which is the index the client rebuilds from
    // the same ordered list before it asks for award_tid.
    const bit = tier.boxIndex - 1;
    const roleId = store.read().state.roleId;
    const snapshot = store.inspect(db => loadChapter(db, roleId, activity, tier.chapter));
    const stars = countBits(snapshot.starBits);
    if (stars < tier.star) {
      throw new GameError(5, `Star mission chapter award needs ${tier.star} stars, chapter has ${stars}`);
    }
    // Validate the reply schema before any write: BitBlock encoding is async, so
    // the real payload is assembled after the commit, and a schema failure here
    // must not leave a claimed reward behind.
    codec.pack('pb_star_mission_chapter_award_rsp', {
      chapter: { chapter: tier.chapter, mission_star: Buffer.alloc(0), chapter_star_award: Buffer.alloc(0) },
      res_change: emptyRes()
    });
    const committed = store.transaction((model, db) => {
      const state = loadChapter(db, model.state.roleId, activity, tier.chapter);
      if (hasBit(state.awardBits, bit)) return { claimed: false, changes: [], state };
      state.awardBits = setBit(state.awardBits, bit);
      const changes = tier.award.length
        ? grantResources(model, tier.award, gameTables, { codec }).changes
        : [];
      saveChapter(db, model.state.roleId, activity, tier.chapter, state);
      return { claimed: true, changes, state };
    });
    const value = {
      chapter: {
        chapter: tier.chapter,
        mission_star: await encodeBitBlock(committed.state.starBits),
        chapter_star_award: await encodeBitBlock(committed.state.awardBits)
      },
      res_change: { changes: committed.changes, is_overflow: false }
    };
    const data = codec.pack('pb_star_mission_chapter_award_rsp', value);
    log({
      event: 'star_mission_chapter_award_committed',
      actId, version: activity.version, awardTid, chapter: tier.chapter,
      star: tier.star, claimed: committed.claimed
    });
    return { value, data };
  }

  function skill(request) {
    const actId = Number(request?.activity_id ?? 0);
    const activity = versionOf(actId);
    const skillTid = Number(request?.skill_tid ?? 0);
    if (!Number.isSafeInteger(skillTid) || skillTid <= 0) throw new GameError(1, 'Invalid star mission skill id');
    const config = activity.skills.get(skillTid);
    if (!config) throw new GameError(5, 'Star mission skill configuration is missing: ' + skillTid);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const skills = loadSkills(db, roleId, activity);
      const level = Number(skills[String(skillTid)] ?? 0);
      if (level >= config.maxLevel) throw new GameError(5, 'Star mission skill is at max level');
      // StarMissionMgr.CheckSkillParentActive: every parent skill must reach its
      // own level cap before the child can be upgraded.
      for (const parentTid of config.parents) {
        const parent = activity.skills.get(parentTid);
        if (!parent) throw new GameError(5, 'Star mission skill configuration is missing: ' + parentTid);
        if (Number(skills[String(parentTid)] ?? 0) < parent.maxLevel) {
          throw new GameError(5, 'Star mission skill prerequisite is not active: ' + parentTid);
        }
      }
      const { changes } = consumeResources(model, [[config.costId, config.costNum]], 301, { codec });
      skills[String(skillTid)] = level + 1;
      saveSkills(db, roleId, activity, skills);
      const value = { changes, is_overflow: false };
      return {
        value,
        data: codec.pack('pb_res_to_client', value),
        level: level + 1
      };
    });
    log({
      event: 'star_mission_skill_committed',
      actId, version: activity.version, skillTid, level: result.level, costId: config.costId, costNum: config.costNum
    });
    return { value: result.value, data: result.data };
  }

  function skillReset(request) {
    const actId = Number(request?.activity_id ?? 0);
    const activity = versionOf(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const skills = loadSkills(db, roleId, activity);
      const refund = new Map();
      let levels = 0;
      for (const [skillTid, rawLevel] of Object.entries(skills)) {
        const config = activity.skills.get(Number(skillTid));
        const level = Number(rawLevel);
        if (!config || !Number.isSafeInteger(level) || level <= 0) continue;
        levels += level;
        const spent = level * config.costNum;
        refund.set(config.costId, (refund.get(config.costId) ?? 0) + spent);
      }
      const changes = [];
      const awards = [...refund].filter(([, amount]) => amount > 0);
      if (awards.length) changes.push(...grantResources(model, awards, gameTables, { codec }).changes);
      saveSkills(db, roleId, activity, {});
      const value = { changes, is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value), levels };
    });
    log({ event: 'star_mission_skill_reset', actId, version: activity.version, levels: result.levels });
    return { value: result.value, data: result.data };
  }

  return {
    supports: type => [89601, 89602, 89603, 89604].includes(type),
    execute(type, input) {
      if (type === 89601) throw new GameError(5, AWARD_REFUSAL);
      if (type === 89602) return chapterAward(input);
      if (type === 89603) return skill(input);
      if (type === 89604) return skillReset(input);
      throw new GameError(1, 'Unsupported star mission command');
    }
  };
}
