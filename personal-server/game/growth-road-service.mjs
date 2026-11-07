import { activityWindow } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { setBit } from './bit-block.mjs';
import { readGrowthRoadTables } from '../config/growth-road-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';

// ModuleTable row 92009 ("活动_成长之路", project/activity/growth_road) points
// its login container at 53696. GrowthRoadMgr.LoginParse decodes
// pb_growth_road_master out of that module and ParseData decodes each
// pb_growth_road entry.
export const GROWTH_ROAD_MODULE_ID = 53696;
export const GROWTH_ROAD_COMMANDS = Object.freeze({ progress: 69001, task: 69002 });
export const GROWTH_ROAD_ACTIVITY_FUNC = 17;
export const GROWTH_ROAD_ACTIVITY_ID = 17001;

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_ALREADY_CLAIMED = 310;
const STATISTICS_MODULE = 21;
const ROLE_STATISTICS_TYPE = 0;

function fail(code, message) {
  throw new GameError(code, message);
}

function milliseconds(value) {
  if (value == null) fail(CODE_UNAVAILABLE, 'Growth road clock is invalid');
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_UNAVAILABLE, 'Growth road clock is invalid');
  return Math.floor(number > 100_000_000_000 ? number : number * 1000);
}

function requestedId(input) {
  let raw = input;
  if (raw && !Array.isArray(raw) && Array.isArray(raw.value)) raw = raw.value;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = raw.tid ?? raw.id ?? raw.value;
  if (Array.isArray(raw)) {
    if (raw.length !== 1) fail(CODE_INVALID, 'Growth road claim expects a single id');
    [raw] = raw;
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) fail(CODE_INVALID, 'Invalid growth road id');
  return id;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS growth_road_state (
      role_id INTEGER PRIMARY KEY REFERENCES roles(role_id),
      road_version INTEGER NOT NULL CHECK(road_version>0),
      progress_value INTEGER NOT NULL DEFAULT 0 CHECK(progress_value>=0),
      rev_overdue INTEGER NOT NULL DEFAULT 0 CHECK(rev_overdue IN (0,1)),
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS growth_road_claims (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      road_version INTEGER NOT NULL CHECK(road_version>0),
      kind TEXT NOT NULL CHECK(kind IN ('progress','task')),
      item_id INTEGER NOT NULL CHECK(item_id>0),
      claimed_at TEXT NOT NULL,
      PRIMARY KEY(role_id,road_version,kind,item_id)
    );
    CREATE INDEX IF NOT EXISTS growth_road_claims_lookup_idx
      ON growth_road_claims(role_id,road_version,kind);
  `);
}

function claimedIds(db, roleId, version, kind) {
  return db.prepare(
    'SELECT item_id FROM growth_road_claims WHERE role_id=? AND road_version=? AND kind=? ORDER BY item_id'
  ).all(roleId, version, kind).map(row => Number(row.item_id));
}

function stateRow(db, roleId, version) {
  return db.prepare(
    'SELECT progress_value,rev_overdue FROM growth_road_state WHERE role_id=? AND road_version=?'
  ).get(roleId, version);
}

function trimBits(bits) {
  let length = bits.length;
  while (length > 0 && bits[length - 1] === 0) length -= 1;
  return bits.subarray(0, length);
}

function bitsFor(ids) {
  let bits = Buffer.alloc(0);
  for (const id of [...ids].sort((left, right) => left - right)) bits = setBit(bits, id);
  return trimBits(bits);
}

function activityFor({ gameTables, serverOpenedAt, at }) {
  const openedAt = milliseconds(serverOpenedAt);
  const nowSeconds = Math.floor(milliseconds(at) / 1000);
  const rows = [...(gameTables.Activity?.values() ?? [])].filter(row => Number(row.func) === GROWTH_ROAD_ACTIVITY_FUNC);
  if (!rows.length) fail(CODE_UNAVAILABLE, 'Growth road activity is not configured');
  rows.sort((left, right) => Number(left.tid) - Number(right.tid));
  const row = rows.find(candidate => Number(candidate.tid) === GROWTH_ROAD_ACTIVITY_ID) ?? rows[0];
  const window = activityWindow(row, openedAt);
  if (!window) fail(CODE_UNAVAILABLE, 'Growth road activity window is invalid');
  return {
    activityId: Number(row.tid),
    version: Number(row.version),
    window,
    nowSeconds,
    open: nowSeconds >= window.start && nowSeconds < window.end,
    expired: nowSeconds >= window.end
  };
}

// TaskTable.TaskType rows 1102..1110 use progress_type=2 and therefore read the
// same module-21 statistics slot as the existing task service. Types 1111..1113
// rely on client progress_fun callbacks (203 and 82) that the personal server
// has no authoritative producer for, so they stay unavailable instead of being
// credited from guessed values.
function statisticProgress(model, task, codec, gameTables) {
  const typeConfig = gameTables.TaskType?.get(Number(task.type));
  if (!typeConfig) fail(CODE_UNAVAILABLE, 'Growth road task type is not configured');
  if (Number(typeConfig.progress_type) !== 2 || !Array.isArray(typeConfig.stat_expand)) {
    fail(CODE_UNAVAILABLE, `Growth road task progress_fun ${typeConfig.progress_fun ?? 0} is unavailable`);
  }
  const statisticsType = Number(typeConfig.data);
  const roleStatistics = [...(gameTables.CountStatistics?.values() ?? [])]
    .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
  const index = roleStatistics.findIndex(row => Number(row.tid) === statisticsType);
  if (index < 0) fail(CODE_UNAVAILABLE, 'Growth road statistics slot is not configured');
  const module = new Map(model.state.modules.value).get(STATISTICS_MODULE);
  if (!module || !Array.isArray(module.value)) fail(CODE_UNAVAILABLE, 'Statistics login module is missing');
  const payload = module.value[index + 1];
  if (payload == null) return 0;
  let data;
  try {
    data = codec.unpack('pb_count_statics_data', rawBinary(payload));
  } catch {
    fail(CODE_UNAVAILABLE, 'Growth road statistics payload is invalid');
  }
  const ids = new Set(typeConfig.stat_expand.map(String));
  let total = 0n;
  for (const row of data.list ?? []) {
    if (!ids.has(String(row.id))) continue;
    const value = BigInt(row.total ?? 0);
    if (value < 0n) fail(CODE_UNAVAILABLE, 'Growth road statistics payload is invalid');
    total += value;
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) fail(CODE_UNAVAILABLE, 'Growth road statistics overflow');
  return Number(total);
}

function rawBinary(payload) {
  if (Buffer.isBuffer(payload)) return payload;
  if (payload?.value?.type === 'Buffer' && Array.isArray(payload.value.data)) return Buffer.from(payload.value.data);
  if (payload?.value?.type === 'Buffer' && Buffer.isBuffer(payload.value?.data)) return payload.value.data;
  if (typeof payload?.value === 'string') return Buffer.from(payload.value, 'base64');
  if (typeof payload === 'string') return Buffer.from(payload, 'base64');
  throw new Error('Unsupported binary payload');
}

export function createGrowthRoadService({
  store,
  codec,
  tables = readGrowthRoadTables(),
  gameTables = readGameTables(),
  serverOpenedAt,
  now = Date.now,
  progressForTask,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Growth road store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  function activeAt(at) {
    return activityFor({ gameTables, serverOpenedAt: openedAt, at });
  }

  function infoState(db, roleId, version) {
    const row = stateRow(db, roleId, version);
    return {
      version,
      progress_value: Number(row?.progress_value ?? 0),
      progress_award: bitsFor(claimedIds(db, roleId, version, 'progress')),
      task_award: bitsFor(claimedIds(db, roleId, version, 'task')),
      rev_overdue: Boolean(row?.rev_overdue)
    };
  }

  function progressOf(model, task) {
    try {
      const value = progressForTask
        ? progressForTask({ model, task, codec, gameTables })
        : statisticProgress(model, task, codec, gameTables);
      const progress = Number(value);
      if (!Number.isSafeInteger(progress) || progress < 0) fail(CODE_UNAVAILABLE, 'Growth road task progress is invalid');
      return progress;
    } catch (error) {
      if (error instanceof GameError) throw error;
      fail(CODE_UNAVAILABLE, `Growth road task progress is unavailable: ${error.message}`);
    }
  }

  function awardsOf(row, useNew, overdue) {
    if (overdue && Number(row.overdue_award) > 0) {
      return [[Number(row.overdue_award), Number(row.overdue_award_n)]];
    }
    if (useNew && Number(row.award_new) > 0) return [[Number(row.award_new), Number(row.award_new_n)]];
    if (Number(row.award) > 0) return [[Number(row.award), Number(row.award_n)]];
    fail(CODE_UNAVAILABLE, `Growth road progress reward ${row.tid} is not configured`);
  }

  function highestReached(reached) {
    const reachedRows = tables.progressList.filter(row => reached.has(Number(row.tid)));
    return reachedRows.length ? reachedRows[reachedRows.length - 1] : null;
  }

  function execute(type, input) {
    if (!Object.values(GROWTH_ROAD_COMMANDS).includes(type)) fail(CODE_INVALID, 'Unknown growth road command');
    const at = milliseconds(now());
    const active = activeAt(at);
    if (active.expired && type === GROWTH_ROAD_COMMANDS.task) fail(CODE_UNAVAILABLE, 'Growth road activity is over');
    if (!active.open && !active.expired) fail(CODE_UNAVAILABLE, 'Growth road activity is not open');
    const version = tables.version;
    const tid = requestedId(input);
    const kind = type === GROWTH_ROAD_COMMANDS.progress ? 'progress' : 'task';
    const task = kind === 'task' ? tables.tasks.get(tid) : null;
    const milestone = kind === 'progress' ? tables.progress.get(tid) : null;
    if (kind === 'task' && !task) fail(CODE_INVALID, `Unknown growth road task ${tid}`);
    if (kind === 'progress' && !milestone) fail(CODE_INVALID, `Unknown growth road progress ${tid}`);

    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      const claimed = new Set(claimedIds(db, roleId, version, kind));
      if (claimed.has(tid)) fail(CODE_ALREADY_CLAIMED, `Growth road ${kind} ${tid} was already claimed`);
      const infoBefore = infoState(db, roleId, version);
      let progressValue = infoBefore.progress_value;
      let rewards;
      if (kind === 'task') {
        const progress = progressOf(model, task);
        if (progress < Number(task.target_count)) {
          fail(CODE_UNAVAILABLE, `Growth road task ${tid} is not complete (${progress}/${task.target_count})`);
        }
        rewards = task.award_list.map(([id, count]) => [id, count]);
        progressValue += Number(task.growth_value);
      } else {
        const need = Number(milestone.need_count);
        if (progressValue < need) fail(CODE_UNAVAILABLE, `Growth road progress ${tid} needs ${need} points`);
        const reached = new Set(tables.progressList
          .filter(row => progressValue >= Number(row.need_count))
          .map(row => Number(row.tid)));
        const highest = highestReached(reached);
        if (active.expired && (!highest || Number(highest.tid) !== tid)) {
          fail(CODE_UNAVAILABLE, 'Growth road activity is over; only the highest reached milestone is claimable');
        }
        const useNew = active.nowSeconds >= Number(tables.versionRow.cutting_time ?? 0);
        rewards = awardsOf(milestone, useNew, active.expired);
      }
      db.prepare('INSERT INTO growth_road_claims VALUES (?,?,?,?,?)')
        .run(roleId, version, kind, tid, new Date(at).toISOString());
      db.prepare(`
        INSERT INTO growth_road_state (role_id,road_version,progress_value,rev_overdue,updated_at)
        VALUES (?,?,?,?,?)
        ON CONFLICT(role_id) DO UPDATE SET
          road_version=excluded.road_version,
          progress_value=excluded.progress_value,
          rev_overdue=excluded.rev_overdue,
          updated_at=excluded.updated_at
      `).run(roleId, version, progressValue, active.expired ? 1 : (infoBefore.rev_overdue ? 1 : 0), new Date(at).toISOString());
      const reward = rewards.length ? grantResources(model, rewards, gameTables, { codec }) : { changes: [] };
      const info = infoState(db, roleId, version);
      const data = codec.pack('pb_growth_road_back', { info, res: reward });
      log({ event: 'growth_road_claimed', roleId, activityId: active.activityId, kind, tid, version, progressValue, changes: reward.changes.length });
      return { data, value: { activityId: active.activityId, version, kind, tid, progressValue, expired: active.expired, changes: reward.changes.length } };
    });
  }

  return {
    supports: type => type === GROWTH_ROAD_COMMANDS.progress || type === GROWTH_ROAD_COMMANDS.task,
    execute,
    ensureLoginState(at = now()) {
      let active;
      try { active = activeAt(at); } catch { return { open: false, version: tables.version }; }
      if (!active.open && !active.expired) return { open: false, version: tables.version };
      store.inspect(db => {
        ensureTables(db);
        const roleId = store.read().state.roleId;
        db.prepare('INSERT OR IGNORE INTO growth_road_state VALUES (?,?,?,?,?)')
          .run(roleId, tables.version, 0, 0, new Date(milliseconds(at)).toISOString());
      });
      return { open: true, version: tables.version, expired: active.expired };
    },
    loginPayload(at = now()) {
      let active;
      try { active = activeAt(at); } catch { return codec.pack('pb_growth_road_master', { data_list: [] }); }
      if (!active.open && !active.expired) return codec.pack('pb_growth_road_master', { data_list: [] });
      const roleId = store.read().state.roleId;
      const info = store.inspect(db => {
        ensureTables(db);
        const existing = stateRow(db, roleId, tables.version);
        if (!existing) {
          db.prepare('INSERT OR IGNORE INTO growth_road_state VALUES (?,?,?,?,?)')
            .run(roleId, tables.version, 0, 0, new Date(milliseconds(at)).toISOString());
        }
        return infoState(db, roleId, tables.version);
      });
      return codec.pack('pb_growth_road_master', { data_list: [info] });
    },
    moduleId: GROWTH_ROAD_MODULE_ID
  };
}
