import { rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { setBit } from './bit-block.mjs';
import { readFunctionManualTables } from '../config/item-task-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { statisticTaskProgress } from './task-statistics.mjs';

// ModuleTable row 106 ("功能手册", project/function_manual) is the login slot
// FunctionManualMgr.LoginParse reads as pb_function_manual. The only command is
// FunctionManualCmd 82301 req_function_manual_award: FunctionManualCmd.lua sends
// the row tid with Codec.EncodeErl and the reply is pb_function_manual_award_rsp.
export const FUNCTION_MANUAL_MODULE_ID = 106;
export const FUNCTION_MANUAL_AWARD_COMMAND = 82301;

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_ALREADY_CLAIMED = 310;
const MISSION_MODULE = 8;
const PASSED_SECTION_PROGRESS = 2;
const PASSED_CHAPTER_PROGRESS = 10;

function fail(code, message) {
  throw new GameError(code, message);
}

function milliseconds(value) {
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) return Date.now();
  return Math.floor(number > 100_000_000_000 ? number : number * 1000);
}

function requestedTid(input) {
  let raw = input;
  if (raw && !Array.isArray(raw) && Array.isArray(raw.value)) raw = raw.value;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = raw.tid ?? raw.id ?? raw.value;
  if (Array.isArray(raw)) {
    if (raw.length !== 1) fail(CODE_INVALID, 'Function manual claim expects a single id');
    [raw] = raw;
  }
  const tid = Number(raw);
  if (!Number.isSafeInteger(tid) || tid <= 0) fail(CODE_INVALID, 'Invalid function manual id');
  return tid;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS function_manual_claims (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      manual_tid INTEGER NOT NULL CHECK(manual_tid>0),
      claimed_at TEXT NOT NULL,
      PRIMARY KEY(role_id,manual_tid)
    );
  `);
}

function claimedTids(db, roleId) {
  return db.prepare('SELECT manual_tid FROM function_manual_claims WHERE role_id=? ORDER BY manual_tid')
    .all(roleId).map(row => Number(row.manual_tid));
}

function trimBits(bits) {
  let length = bits.length;
  while (length > 0 && bits[length - 1] === 0) length -= 1;
  return bits.subarray(0, length);
}

// FunctionManualMgr keeps pb_function_manual.got_award as a BitBlock indexed by
// the row tid, the same convention the growth-road claim bits use.
function bitsFor(ids) {
  let bits = Buffer.alloc(0);
  for (const id of [...ids].sort((left, right) => left - right)) bits = setBit(bits, id);
  return trimBits(bits);
}

function journeyKey(row) {
  const chapter = Number(row?.belong_chapter);
  const index = Number(row?.index);
  if (!Number.isSafeInteger(chapter) || !Number.isSafeInteger(index)) return null;
  return chapter * 100 + index;
}

export function createFunctionManualService({
  store,
  codec,
  tables = readFunctionManualTables(),
  gameTables = readGameTables(),
  missionTables = readMissionTables(),
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Function manual store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  function missionCursor(model) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value) || !module.value[0]) fail(CODE_UNAVAILABLE, 'Mission login module is missing');
    let mission;
    try {
      mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    } catch {
      fail(CODE_UNAVAILABLE, 'Mission login module is invalid');
    }
    const missionId = Number(mission.mission_id ?? 0);
    if (!Number.isSafeInteger(missionId) || missionId < 0) fail(CODE_UNAVAILABLE, 'Mission login module is invalid');
    if (missionId === 0) return null;
    const row = missionTables.sections.get(missionId);
    if (!row) fail(CODE_UNAVAILABLE, 'Mission login module is invalid');
    return row;
  }

  // A chapter counts as passed once every node in it sits behind the cursor.
  function passedChapterCount(model) {
    const key = journeyKey(missionCursor(model));
    if (key == null) return 0;
    const maxByChapter = new Map();
    for (const row of missionTables.sections.values()) {
      const node = journeyKey(row);
      if (node == null) continue;
      const chapter = Number(row.belong_chapter);
      const current = maxByChapter.get(chapter);
      if (current === undefined || node > current) maxByChapter.set(chapter, node);
    }
    let passed = 0;
    for (const max of maxByChapter.values()) if (max < key) passed += 1;
    return passed;
  }

  // TaskMgr.GetCurTaskProgress(type, param) drives the handbook rows. Only the
  // progress sources this server owns are credited: the journey cursor (fun 2),
  // passed chapters (fun 10) and the module 21 statistics counters. Every other
  // progress_fun belongs to a feature without a server-side event here and
  // stays unavailable instead of being credited from the client's claim.
  function progressOf(model, entry, manualTid) {
    const typeConfig = gameTables.TaskType?.get(Number(entry.type));
    if (!typeConfig) fail(CODE_UNAVAILABLE, `Function manual task type ${entry.type} is not configured`);
    if (Number(typeConfig.progress_type) === 2) {
      return statisticTaskProgress({ model, typeConfig, codec, gameTables, label: 'Function manual statistics' });
    }
    if (Number(typeConfig.progress_type) === 1) {
      const progressFun = Number(typeConfig.progress_fun);
      if (progressFun === PASSED_SECTION_PROGRESS) {
        const key = journeyKey(missionCursor(model));
        return key == null ? 0 : key;
      }
      if (progressFun === PASSED_CHAPTER_PROGRESS) return passedChapterCount(model);
    }
    return fail(
      CODE_UNAVAILABLE,
      `Function manual ${manualTid} task type ${entry.type} progress_fun ${typeConfig.progress_fun ?? 0} is unavailable`
    );
  }

  function loginPayload() {
    const roleId = store.state().roleId;
    const claimed = store.inspect(db => {
      ensureTables(db);
      return claimedTids(db, roleId);
    });
    return codec.pack('pb_function_manual', { got_award: bitsFor(claimed) });
  }

  function execute(type, input) {
    if (Number(type) !== FUNCTION_MANUAL_AWARD_COMMAND) fail(CODE_INVALID, 'Unknown function manual command');
    const tid = requestedTid(input);
    const row = tables.tasks.get(tid);
    if (!row) fail(CODE_INVALID, `Unknown function manual ${tid}`);
    const at = milliseconds(now());
    const result = store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const claimed = new Set(claimedTids(db, roleId));
      if (claimed.has(tid)) fail(CODE_ALREADY_CLAIMED, `Function manual ${tid} was already claimed`);
      for (const entry of row.taskList) {
        const progress = progressOf(model, entry, tid);
        if (progress < entry.count) {
          fail(CODE_UNAVAILABLE, `Function manual ${tid} task ${entry.type} needs ${entry.count} (${progress})`);
        }
      }
      db.prepare('INSERT INTO function_manual_claims VALUES (?,?,?)').run(roleId, tid, new Date(at).toISOString());
      claimed.add(tid);
      const reward = row.award.length ? grantResources(model, row.award, gameTables, { codec }) : { changes: [] };
      const value = { got_award: bitsFor(claimed), res_change: reward };
      const data = codec.pack('pb_function_manual_award_rsp', value);
      log({ event: 'function_manual_claim_committed', roleId, tid, changes: reward.changes.length });
      return { data, value: { tid, changes: reward.changes.length } };
    });
    return result;
  }

  return {
    supports: type => Number(type) === FUNCTION_MANUAL_AWARD_COMMAND,
    execute,
    loginPayload,
    moduleId: FUNCTION_MANUAL_MODULE_ID
  };
}
