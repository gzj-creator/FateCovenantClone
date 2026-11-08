import { encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { starMissionActivity } from '../config/star-mission-tables.mjs';

// StarMissionCmd 89601-89604.
//
// Evidence: pb_star_mission_chapter_award_req {activity_id, award_tid} ->
// pb_star_mission_chapter_award_rsp {chapter, res_change}; pb_star_mission_skill_req
// {activity_id, skill_tid} and pb_star_mission_skill_reset_req {activity_id} both
// reply pb_res_to_client (star_mission.net.proto.bin). Chapter progress is
// pb_star_mission_chapter {chapter, mission_star, chapter_star_award} where both
// payloads are ETF-encoded BitBlocks (star_mission.db.proto.bin + client BitBlock
// indexing shared with the mission box claims).
//
// 89601 req_star_mission_award has neither a response schema nor evidenced
// arguments, so it is rejected instead of guessed.
const AWARD_REFUSAL = 'Star mission award is rejected: request arguments and reward mapping are not evidenced';
// Bit blocks are persisted as raw hex so every database transaction stays
// synchronous; the ETF wrapping happens at the protobuf boundary.

function countBits(bits) {
  let total = 0;
  for (const byte of bits) {
    let value = byte;
    while (value) { total += value & 1; value >>= 1; }
  }
  return total;
}

function spentPoints(activity, skills) {
  let total = 0;
  for (const [skillTid, level] of Object.entries(skills)) {
    const row = activity.skills.get(Number(skillTid));
    if (!row) continue;
    total += Number(level) * row.cost;
  }
  return total;
}

export function createStarMissionService({ store, codec, tables, gameTables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function activityRow(actId) {
    const activity = starMissionActivity(tables, actId);
    if (!activity) throw new GameError(5, 'Star mission configuration missing: ' + actId);
    return activity;
  }

  function loadState(db, roleId, actId) {
    const row = db.prepare('SELECT * FROM star_mission_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (!row) return { star_bits: Buffer.alloc(0), award_bits: Buffer.alloc(0), skills: {} };
    return {
      star_bits: Buffer.from(row.star_bits, 'hex'),
      award_bits: Buffer.from(row.award_bits, 'hex'),
      skills: JSON.parse(row.skills_json ?? '{}')
    };
  }

  function saveState(db, roleId, actId, state) {
    db.prepare('INSERT INTO star_mission_state VALUES (?,?,?,?,?,?) ON CONFLICT(role_id,act_id) DO UPDATE SET star_bits=excluded.star_bits, award_bits=excluded.award_bits, skills_json=excluded.skills_json, updated_at=excluded.updated_at')
      .run(
        roleId, actId,
        state.star_bits.toString('hex'),
        state.award_bits.toString('hex'),
        JSON.stringify(state.skills), new Date(now()).toISOString()
      );
  }

  async function chapterValue(chapter, state) {
    return { chapter, mission_star: await encodeBitBlock(state.star_bits), chapter_star_award: await encodeBitBlock(state.award_bits) };
  }

  async function chapterAward(request) {
    const actId = Number(request?.activity_id ?? 0);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid star mission activity id');
    const awardTid = Number(request?.award_tid ?? 0);
    if (!Number.isSafeInteger(awardTid) || awardTid <= 0) throw new GameError(1, 'Invalid star mission award id');
    const activity = activityRow(actId);
    const chapter = activity.chapters.find(row => row.awardTid === awardTid);
    if (!chapter) throw new GameError(5, 'Star mission chapter award configuration missing');
    const roleId = store.read().state.roleId;
    const snapshot = store.inspect(db => loadState(db, roleId, actId));
    if (countBits(snapshot.star_bits) < chapter.needStar) throw new GameError(5, 'Star mission chapter is not unlocked');
    const alreadyClaimed = hasBit(snapshot.award_bits, chapter.chapter);
    const nextAwardBits = alreadyClaimed ? snapshot.award_bits : setBit(snapshot.award_bits, chapter.chapter);
    // Encode and pack before the transaction so a protobuf failure cannot leave
    // a claimed reward behind.
    const value = {
      chapter: await chapterValue(chapter.chapter, { star_bits: snapshot.star_bits, award_bits: nextAwardBits }),
      res_change: { changes: [], is_overflow: false }
    };
    const data = codec.pack('pb_star_mission_chapter_award_rsp', value);
    store.transaction((model, db) => {
      const state = loadState(db, model.state.roleId, actId);
      if (hasBit(state.award_bits, chapter.chapter)) return;
      state.award_bits = setBit(state.award_bits, chapter.chapter);
      if (chapter.award.length) grantResources(model, chapter.award, gameTables);
      saveState(db, model.state.roleId, actId, state);
    });
    log({ event: 'star_mission_chapter_award_committed', actId, awardTid, chapter: chapter.chapter, alreadyClaimed });
    return { value, data };
  }

  async function skill(request) {
    const actId = Number(request?.activity_id ?? 0);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid star mission activity id');
    const skillTid = Number(request?.skill_tid ?? 0);
    if (!Number.isSafeInteger(skillTid) || skillTid <= 0) throw new GameError(1, 'Invalid star mission skill id');
    const activity = activityRow(actId);
    const row = activity.skills.get(skillTid);
    if (!row) throw new GameError(5, 'Star mission skill configuration missing');
    const roleId = store.read().state.roleId;
    const snapshot = store.inspect(db => loadState(db, roleId, actId));
    const level = Number(snapshot.skills[String(skillTid)] ?? 0);
    if (row.maxLevel > 0 && level >= row.maxLevel) throw new GameError(5, 'Star mission skill is at max level');
    if (countBits(snapshot.star_bits) - spentPoints(activity, snapshot.skills) < row.cost) {
      throw new GameError(301, 'Insufficient star mission skill points');
    }
    const value = { changes: [], is_overflow: false };
    // Pack before the write so an encoding failure leaves no point spent.
    const data = codec.pack('pb_res_to_client', value);
    const committed = store.transaction((model, db) => {
      const state = loadState(db, model.state.roleId, actId);
      const current = Number(state.skills[String(skillTid)] ?? 0);
      if (row.maxLevel > 0 && current >= row.maxLevel) throw new GameError(5, 'Star mission skill is at max level');
      if (countBits(state.star_bits) - spentPoints(activity, state.skills) < row.cost) {
        throw new GameError(301, 'Insufficient star mission skill points');
      }
      state.skills[String(skillTid)] = current + 1;
      saveState(db, model.state.roleId, actId, state);
      return { level: current + 1 };
    });
    log({ event: 'star_mission_skill_committed', actId, skillTid, level: committed.level });
    return { value: { ...value, actId, skillTid, level: committed.level }, data };
  }

  async function skillReset(request) {
    const actId = Number(request?.activity_id ?? 0);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid star mission activity id');
    const activity = activityRow(actId);
    const roleId = store.read().state.roleId;
    const value = { changes: [], is_overflow: false };
    const data = codec.pack('pb_res_to_client', value);
    const committed = store.transaction((model, db) => {
      const state = loadState(db, model.state.roleId, actId);
      const reset = Object.keys(state.skills).length;
      state.skills = {};
      saveState(db, model.state.roleId, actId, state);
      return { reset };
    });
    log({ event: 'star_mission_skill_reset', actId, reset: committed.reset });
    return { value: { ...value, actId, activity: activity.tid, reset: committed.reset }, data };
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

export const STAR_MISSION_AWARD_REFUSAL = AWARD_REFUSAL;
