import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary, encodeEtfIntegerTuple } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { decodeBitBlock, encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';

const ELITE_MISSION_MODULE = 140;
const BOX_CLAIM_TYPE = 'elite_mission_box';
const CHAPTER_CLAIM_TYPE = 'elite_mission_chapter';

function fail(code, message) { throw new GameError(code, message); }
function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, message);
  return number;
}

export function configuredAwards(row, label) {
  const awards = Array.isArray(row?.award) ? row.award : [];
  return awards.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, `${label} reward configuration is invalid`);
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, `${label} reward configuration is invalid`);
    }
    return [tid, count];
  });
}

// The battle settlement path (elite-mission-battle.mjs) shares the same claim
// table and the same login-module encoding, so keep one implementation.
export function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS reward_claims (
    role_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, claim_type, claim_key)
  )`);
}

export function readModule(model, codec) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(ELITE_MISSION_MODULE);
  if (!module) fail(5, 'Elite mission login module is missing');
  const bytes = (Array.isArray(module.value) && module.value.length)
    ? rawBinary(module.value[0])
    : (module.value && module.value.data ? Buffer.from(module.value.data) : Buffer.alloc(0));
  let info = { mission_id: '0', boss_bin: Buffer.alloc(0), box_award_bin: Buffer.alloc(0), difficulty: null };
  if (bytes.length) {
    try { info = codec.unpack('pb_elite_mission', bytes); } catch { }
  }
  return { modules, module, info, bytes };
}

export function writeModule(model, codec, info) {
  const modules = new Map(model.state.modules.value);
  const bytes = serializedBinary(codec.pack('pb_elite_mission', {
    mission_id: String(info.mission_id ?? '0'),
    boss_bin: info.boss_bin ?? Buffer.alloc(0),
    box_award_bin: info.box_award_bin ?? Buffer.alloc(0),
    difficulty: info.difficulty ?? undefined
  }));
  const existing = modules.get(ELITE_MISSION_MODULE);
  const next = Array.isArray(existing && existing.value)
    ? { ...existing, value: [bytes] }
    : { value: [bytes], improper: false };
  modules.set(ELITE_MISSION_MODULE, next);
  model.state.modules.value = [...modules];
  return info;
}

export function createEliteMissionService({ store, codec, tables = readGameTables(), now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  const missionTable = () => {
    if (!(tables?.EliteMission instanceof Map)) throw new GameError(5, 'Elite mission configuration is unavailable');
    return tables.EliteMission;
  };
  const missionConfig = id => missionTable().get(Number(id));
  const progressIndex = info => Number(missionConfig(info.mission_id)?.index ?? 0);

  function supports(type) { return type === 87001 || type === 87002 || type === 87003; }

  function custom(input) {
    const missionIdRaw = Array.isArray(input) ? input[0] : input;
    const missionId = (missionIdRaw === undefined || missionIdRaw === null || missionIdRaw === '') ? null : Number(missionIdRaw);
    return store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      if (missionId !== null) {
        if (!Number.isSafeInteger(missionId) || missionId <= 0) fail(1, 'Invalid elite mission id');
        const target = missionConfig(missionId);
        if (!target) fail(5, 'Elite mission configuration is missing');
        if (!tables.Chapter?.get(Number(target.belong_chapter))) fail(5, 'Elite mission chapter configuration is missing');
        const current = missionConfig(info.mission_id);
        const targetIndex = Number(target.index);
        const currentIndex = Number(current?.index ?? 0);
        if (!Number.isSafeInteger(targetIndex) || targetIndex <= 0) fail(5, 'Elite mission progression configuration is invalid');
        if (currentIndex > 0 && targetIndex > currentIndex + 1) fail(5, 'Elite mission is not unlocked');
        if (currentIndex <= 0) {
          const firstIndex = Math.min(...[...missionTable().values()].map(row => Number(row.index)).filter(Number.isSafeInteger));
          if (targetIndex !== firstIndex) fail(5, 'Elite mission is not unlocked');
        }
        info.mission_id = String(missionId);
      }
      writeModule(model, codec, info);
      const res = { changes: [], is_overflow: false };
      const back = {
        mission_info: {
          mission_id: String(info.mission_id ?? '0'),
          boss_bin: info.boss_bin ?? Buffer.alloc(0),
          box_award_bin: info.box_award_bin ?? Buffer.alloc(0),
          difficulty: info.difficulty ?? undefined
        },
        res,
        is_boss: false,
        boss_tid: 0
      };
      log({ event: 'elite_mission_custom_committed', missionId: info.mission_id });
      return { value: { mission: info, res, isBoss: false, bossTid: 0 }, data: codec.pack('pb_elite_mission_back', back) };
    });
  }

  async function boxAward(request) {
    const boxIds = Array.isArray(request && request.box_id_list) ? request.box_id_list.map(Number) : [];
    const taskIds = Array.isArray(request && request.common_task_id_list) ? request.common_task_id_list.map(Number) : [];
    if (boxIds.some(id => !Number.isSafeInteger(id) || id <= 0)) fail(1, 'Invalid elite box id list');
    if (taskIds.some(id => !Number.isSafeInteger(id) || id <= 0)) fail(1, 'Invalid elite task id list');
    if (taskIds.length) fail(5, 'Elite common-task rewards are not configured');

    const snapshot = store.read();
    const { module, info } = readModule(snapshot, codec);
    const expectedModule = JSON.stringify(module);
    const currentIndex = progressIndex(info);
    const boxes = [...new Set(boxIds)].map(id => {
      const box = tables.Box?.get(id);
      if (!box) fail(5, 'Elite box configuration is missing');
      const openMission = missionConfig(box.open_mission_id);
      if (!openMission) fail(5, 'Elite box unlock configuration is missing');
      if (currentIndex < Number(openMission.index)) fail(5, 'Elite box is not unlocked');
      configuredAwards(box, 'Elite box');
      return box;
    });
    const bits = await decodeBitBlock(Buffer.from(info.box_award_bin ?? '', 'base64'));
    const plannedClaims = store.inspect(db => boxes.map(box => Boolean(
      db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(store.state().roleId, BOX_CLAIM_TYPE, String(box.tid))
    )));
    let nextBits = Buffer.from(bits);
    const newlyGranted = [], awards = [];
    for (let index = 0; index < boxes.length; index++) {
      const box = boxes[index], boxId = Number(box.tid);
      if (!plannedClaims[index] && !hasBit(bits, boxId)) {
        newlyGranted.push(boxId);
        awards.push(...configuredAwards(box, 'Elite box'));
      }
      nextBits = setBit(nextBits, boxId);
    }
    const nextBoxAwardBin = await encodeBitBlock(nextBits);

    return store.transaction((model, db) => {
      ensureTables(db);
      const fresh = readModule(model, codec);
      if (JSON.stringify(fresh.module) !== expectedModule) fail(1, 'Elite mission data changed; retry box claim');
      const freshInfo = fresh.info;
      const created = new Date(Math.floor(now() / 1000) * 1000).toISOString();
      for (let index = 0; index < boxes.length; index++) {
        const box = boxes[index], boxId = Number(box.tid), key = String(boxId);
        const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
          .get(model.state.roleId, BOX_CLAIM_TYPE, key);
        if (Boolean(exists) !== plannedClaims[index]) fail(1, 'Elite box claims changed; retry');
        if (!exists && hasBit(bits, boxId) === false && newlyGranted.includes(boxId)) {
          db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, BOX_CLAIM_TYPE, key, created);
        }
      }
      const reward = grantResources(model, awards, tables);
      freshInfo.box_award_bin = nextBoxAwardBin;
      writeModule(model, codec, freshInfo);
      const res = { changes: reward.changes, is_overflow: false };
      const back = {
        res_change: res,
        mission_info: {
          mission_id: String(freshInfo.mission_id ?? '0'),
          boss_bin: freshInfo.boss_bin ?? Buffer.alloc(0),
          box_award_bin: freshInfo.box_award_bin ?? Buffer.alloc(0),
          difficulty: freshInfo.difficulty ?? undefined
        },
        common_task: { receive_list: [] }
      };
      log({ event: 'elite_mission_box_award_committed', boxIds, taskIds, newlyGranted });
      return { value: { res, mission: freshInfo, boxIds, taskIds, newlyGranted }, data: codec.pack('pb_elite_mission_box_award_back', back) };
    });
  }

  function chapterPass(input) {
    const chapterId = integer(Array.isArray(input) ? input[0] : input, 1, Number.MAX_SAFE_INTEGER, 'Invalid elite chapter id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      const chapter = tables.Chapter?.get(chapterId);
      if (!chapter) fail(5, 'Elite chapter configuration is missing');
      const key = String(chapterId);
      const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(model.state.roleId, CHAPTER_CLAIM_TYPE, key);
      const created = new Date(Math.floor(now() / 1000) * 1000).toISOString();
      let alreadyClaimed = !!exists;
      let changes = [];
      if (!exists) {
        const chapterMissions = [...missionTable().values()].filter(row => Number(row.belong_chapter) === chapterId);
        const lastIndex = Math.max(...chapterMissions.map(row => Number(row.index)).filter(Number.isSafeInteger));
        if (!Number.isSafeInteger(lastIndex) || progressIndex(info) < lastIndex) fail(5, 'Elite chapter is not complete');
        db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, CHAPTER_CLAIM_TYPE, key, created);
        changes = grantResources(model, configuredAwards(chapter, 'Elite chapter'), tables).changes;
      }
      writeModule(model, codec, info);
      log({ event: 'elite_mission_chapter_pass_committed', chapterId, alreadyClaimed });
      const data = encodeEtfIntegerTuple([chapterId, alreadyClaimed ? 1 : 0]);
      return { value: { chapterId, alreadyClaimed, mission: info, changes }, data };
    });
  }

  function execute(type, input) {
    if (type === 87001) return custom(input);
    if (type === 87002) return boxAward(input);
    if (type === 87003) return chapterPass(input);
    fail(1, 'Unsupported elite mission command');
  }

  return { supports, execute, custom, boxAward, chapterPass };
}
