import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';

const ELITE_MISSION_MODULE = 140;
const BOX_CLAIM_TYPE = 'elite_mission_box';
const CHAPTER_CLAIM_TYPE = 'elite_mission_chapter';

function fail(code, message) { throw new GameError(code, message); }
function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, message);
  return number;
}

function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS reward_claims (
    role_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, claim_type, claim_key)
  )`);
}

function readModule(model, codec) {
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

function writeModule(model, codec, info) {
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

export function createEliteMissionService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function supports(type) { return type === 87001 || type === 87002 || type === 87003; }

  function custom(input) {
    log({ event: 'elite_mission_custom_entry', input, inputHex: input?.toString('base64') });
    const missionIdRaw = Array.isArray(input) ? input[0] : input;
    const missionId = (missionIdRaw === undefined || missionIdRaw === null || missionIdRaw === '') ? null : Number(missionIdRaw);
    return store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      if (missionId !== null) {
        if (!Number.isSafeInteger(missionId) || missionId <= 0) fail(1, 'Invalid elite mission id');
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

  function boxAward(request) {
    log({ event: 'elite_mission_boxAward_entry', request });
    const boxIds = Array.isArray(request && request.box_id_list) ? request.box_id_list.map(Number) : [];
    const taskIds = Array.isArray(request && request.common_task_id_list) ? request.common_task_id_list.map(Number) : [];
    if (boxIds.some(id => !Number.isSafeInteger(id) || id < 0)) fail(1, 'Invalid elite box id list');
    if (taskIds.some(id => !Number.isSafeInteger(id) || id < 0)) fail(1, 'Invalid elite task id list');
    return store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      const created = new Date(Math.floor(now() / 1000) * 1000).toISOString();
      const newlyGranted = [];
      for (const boxId of boxIds) {
        const key = String(boxId);
        const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
          .get(model.state.roleId, BOX_CLAIM_TYPE, key);
        if (!exists) {
          db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, BOX_CLAIM_TYPE, key, created);
          newlyGranted.push(boxId);
        }
      }
      for (const taskId of taskIds) {
        const key = String(taskId);
        const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
          .get(model.state.roleId, BOX_CLAIM_TYPE, 'task:' + key);
        if (!exists) {
          db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, BOX_CLAIM_TYPE, 'task:' + key, created);
        }
      }
      writeModule(model, codec, info);
      const res = { changes: [], is_overflow: false };
      const back = {
        res_change: res,
        mission_info: {
          mission_id: String(info.mission_id ?? '0'),
          boss_bin: info.boss_bin ?? Buffer.alloc(0),
          box_award_bin: info.box_award_bin ?? Buffer.alloc(0),
          difficulty: info.difficulty ?? undefined
        },
        common_task: { receive_list: [] }
      };
      log({ event: 'elite_mission_box_award_committed', boxIds, taskIds, newlyGranted });
      return { value: { res, mission: info, boxIds, taskIds, newlyGranted }, data: codec.pack('pb_elite_mission_box_award_back', back) };
    });
  }

  function chapterPass(input) {
    log({ event: 'elite_mission_chapterPass_entry', input });
    const chapterId = integer(Array.isArray(input) ? input[0] : input, 1, Number.MAX_SAFE_INTEGER, 'Invalid elite chapter id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      const key = String(chapterId);
      const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(model.state.roleId, CHAPTER_CLAIM_TYPE, key);
      const created = new Date(Math.floor(now() / 1000) * 1000).toISOString();
      let alreadyClaimed = !!exists;
      if (!exists) {
        db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, CHAPTER_CLAIM_TYPE, key, created);
      }
      writeModule(model, codec, info);
      log({ event: 'elite_mission_chapter_pass_committed', chapterId, alreadyClaimed });
      const data = encodeEtf([chapterId, alreadyClaimed ? 1 : 0]);
      return { value: { chapterId, alreadyClaimed, mission: info }, data };
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
