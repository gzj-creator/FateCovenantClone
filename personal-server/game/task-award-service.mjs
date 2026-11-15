import { activityWindow } from './activity-calendar.mjs';
import { setBit } from './bit-block.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { statisticTaskProgress } from './task-statistics.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readTaskAwardTables } from '../config/task-award-tables.mjs';

export const TASK_AWARD_COMMANDS = Object.freeze({ progress: 69101, task: 69102 });
export const TASK_AWARD_ACTIVITY_FUNC = 19;
export const TASK_AWARD_ACTIVITY_ID = 19001;
export const TASK_AWARD_ACTIVITY_LOGIN_MODULE_ID = 92;
export const TASK_AWARD_DECISION_ID = 'R1-ITEM-TASKAWARD';

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_ALREADY_CLAIMED = 310;

function fail(code, message) {
  throw new GameError(code, `${message} decisionId=${TASK_AWARD_DECISION_ID}`);
}

function milliseconds(value) {
  if (value == null) fail(CODE_UNAVAILABLE, 'Task award clock is invalid');
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_UNAVAILABLE, 'Task award clock is invalid');
  return Math.floor(number > 100_000_000_000 ? number : number * 1000);
}

function requestedId(input) {
  let raw = input;
  if (raw && !Array.isArray(raw) && Array.isArray(raw.value)) raw = raw.value;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = raw.tid ?? raw.id ?? raw.value;
  if (Array.isArray(raw)) {
    if (raw.length !== 1) fail(CODE_INVALID, 'Task award claim expects one id');
    [raw] = raw;
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) fail(CODE_INVALID, 'Invalid task award id');
  return id;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_award_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      version INTEGER NOT NULL CHECK(version>0),
      progress_value INTEGER NOT NULL DEFAULT 0 CHECK(progress_value>=0),
      rev_overdue INTEGER NOT NULL DEFAULT 0 CHECK(rev_overdue IN (0,1)),
      started_at INTEGER NOT NULL CHECK(started_at>0),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,version)
    );
    CREATE TABLE IF NOT EXISTS task_award_claims (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      version INTEGER NOT NULL CHECK(version>0),
      kind TEXT NOT NULL CHECK(kind IN ('progress','task')),
      item_id INTEGER NOT NULL CHECK(item_id>0),
      claimed_at TEXT NOT NULL,
      PRIMARY KEY(role_id,version,kind,item_id)
    );
    CREATE INDEX IF NOT EXISTS task_award_claims_lookup_idx
      ON task_award_claims(role_id,version,kind);
  `);
}

function stateRow(db, roleId, version) {
  return db.prepare(
    'SELECT progress_value,rev_overdue,started_at FROM task_award_state WHERE role_id=? AND version=?'
  ).get(roleId, version);
}

function claimedIds(db, roleId, version, kind) {
  return db.prepare(
    'SELECT item_id FROM task_award_claims WHERE role_id=? AND version=? AND kind=? ORDER BY item_id'
  ).all(roleId, version, kind).map(row => Number(row.item_id));
}

function trimBits(bits) {
  let length = bits.length;
  while (length > 0 && bits[length - 1] === 0) length -= 1;
  return bits.subarray(0, length);
}

function bitsFor(ids) {
  let bits = Buffer.alloc(0);
  for (const id of [...ids].sort((left, right) => left - right)) bits = setBit(bits, id % 1000);
  return trimBits(bits);
}

function activityConfig(gameTables) {
  const row = gameTables.Activity?.get?.(TASK_AWARD_ACTIVITY_ID);
  if (!row
      || Number(row.tid) !== TASK_AWARD_ACTIVITY_ID
      || Number(row.func) !== TASK_AWARD_ACTIVITY_FUNC
      || Number(row.version) !== 1) {
    fail(CODE_UNAVAILABLE, 'Task award activity configuration is unavailable');
  }
  return row;
}

function activityFor({ gameTables, serverOpenedAt, activityReferenceOpenedAt, at }) {
  const openedAt = milliseconds(serverOpenedAt);
  const nowSeconds = Math.floor(milliseconds(at) / 1000);
  const row = activityConfig(gameTables);
  const window = activityWindow(row, openedAt, activityReferenceOpenedAt);
  if (!window) fail(CODE_UNAVAILABLE, 'Task award activity window is invalid');
  return {
    activityId: TASK_AWARD_ACTIVITY_ID,
    version: Number(row.version),
    window,
    nowSeconds,
    started: nowSeconds >= Number(window.start),
    open: nowSeconds >= Number(window.start) && nowSeconds < Number(window.end),
    expired: nowSeconds >= Number(window.end)
  };
}

function progressOf(model, task, codec, gameTables) {
  const typeConfig = gameTables.TaskType?.get?.(Number(task.type));
  if (!typeConfig) fail(CODE_UNAVAILABLE, `Task award task type ${task.type} is not configured`);
  if (Number(typeConfig.progress_type) !== 2 || !Array.isArray(typeConfig.stat_expand)) {
    fail(CODE_UNAVAILABLE, `Task award task type ${task.type} has no authoritative statistics producer`);
  }
  try {
    const value = statisticTaskProgress({
      model,
      typeConfig,
      codec,
      gameTables,
      label: `ITEM-TASKAWARD task ${task.tid}`
    });
    if (!Number.isSafeInteger(value) || value < 0) fail(CODE_UNAVAILABLE, 'Task award task progress is invalid');
    return value;
  } catch (error) {
    if (error instanceof GameError) {
      throw new GameError(error.code, `${error.message} decisionId=${TASK_AWARD_DECISION_ID}`);
    }
    fail(CODE_UNAVAILABLE, `Task award task progress is unavailable: ${error.message}`);
  }
}

function progressRewards(row, expired) {
  if (expired) {
    if (Number(row.overdue_award) <= 0 || Number(row.overdue_award_n) <= 0) {
      fail(CODE_UNAVAILABLE, `Task award progress ${row.tid} has no configured overdue reward`);
    }
    return { awards: [[Number(row.overdue_award), Number(row.overdue_award_n)]], overdue: true };
  }
  if (Number(row.award) <= 0 || Number(row.award_n) <= 0) {
    fail(CODE_UNAVAILABLE, `Task award progress ${row.tid} reward is not configured`);
  }
  return { awards: [[Number(row.award), Number(row.award_n)]], overdue: false };
}

export function createTaskAwardService({
  store,
  codec,
  tables = readTaskAwardTables(),
  gameTables = readGameTables(),
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Task award store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  function activeAt(at) {
    return activityFor({ gameTables, serverOpenedAt: openedAt, activityReferenceOpenedAt, at });
  }

  function infoState(db, roleId, version, startedAt) {
    const row = stateRow(db, roleId, version);
    return {
      version,
      progress_value: Number(row?.progress_value ?? 0),
      progress_award: bitsFor(claimedIds(db, roleId, version, 'progress')),
      task_award: bitsFor(claimedIds(db, roleId, version, 'task')),
      rev_overdue: Boolean(row?.rev_overdue),
      startedAt: Number(row?.started_at ?? startedAt)
    };
  }

  function ensureState(db, roleId, active, at) {
    const existing = stateRow(db, roleId, active.version);
    if (existing || !active.started) return existing;
    const startedAt = Math.max(1, Number(active.window.start));
    db.prepare('INSERT OR IGNORE INTO task_award_state VALUES (?,?,?,?,?,?)')
      .run(roleId, active.version, 0, 0, startedAt, new Date(at).toISOString());
    return stateRow(db, roleId, active.version);
  }

  function execute(type, input) {
    if (!Object.values(TASK_AWARD_COMMANDS).includes(type)) fail(CODE_INVALID, 'Unknown task award command');
    const at = milliseconds(now());
    const active = activeAt(at);
    if (active.expired) fail(CODE_UNAVAILABLE, 'Task award activity is over');
    if (!active.open) fail(CODE_UNAVAILABLE, 'Task award activity is not open');

    const kind = type === TASK_AWARD_COMMANDS.progress ? 'progress' : 'task';
    const tid = requestedId(input);
    const task = kind === 'task' ? tables.tasks.get(tid) : null;
    const milestone = kind === 'progress' ? tables.progress.get(tid) : null;
    if (kind === 'task' && !task) fail(CODE_INVALID, `Unknown task award task ${tid}`);
    if (kind === 'progress' && !milestone) fail(CODE_INVALID, `Unknown task award progress ${tid}`);

    return store.transaction((model, db) => {
      ensureTables(db);
      const roleId = model.state.roleId;
      ensureState(db, roleId, active, at);
      if (claimedIds(db, roleId, active.version, kind).includes(tid)) {
        fail(CODE_ALREADY_CLAIMED, `Task award ${kind} ${tid} was already claimed`);
      }

      const before = infoState(db, roleId, active.version, active.window.start);
      let progressValue = before.progress_value;
      let revOverdue = before.rev_overdue;
      let awards;
      if (kind === 'task') {
        const progress = progressOf(model, task, codec, gameTables);
        if (progress < Number(task.target_count)) {
          fail(CODE_UNAVAILABLE, `Task award task ${tid} is not complete (${progress}/${task.target_count})`);
        }
        awards = task.award_list.map(([id, count]) => [id, count]);
        progressValue += Number(task.growth_value);
        if (!Number.isSafeInteger(progressValue)) fail(CODE_UNAVAILABLE, 'Task award progress overflow');
      } else {
        const need = Number(milestone.need_count);
        if (progressValue < need) fail(CODE_UNAVAILABLE, `Task award progress ${tid} needs ${need} points`);
        const reward = progressRewards(milestone, active.expired);
        awards = reward.awards;
        if (reward.overdue) revOverdue = true;
      }

      const claimedAt = new Date(at).toISOString();
      db.prepare('INSERT INTO task_award_claims VALUES (?,?,?,?,?)')
        .run(roleId, active.version, kind, tid, claimedAt);
      db.prepare(`
        UPDATE task_award_state
        SET progress_value=?,rev_overdue=?,updated_at=?
        WHERE role_id=? AND version=?
      `).run(progressValue, revOverdue ? 1 : 0, claimedAt, roleId, active.version);

      const reward = awards.length ? grantResources(model, awards, gameTables, { codec }) : { changes: [] };
      const info = infoState(db, roleId, active.version, active.window.start);
      const data = codec.pack('pb_task_award_back', { info, res: reward });
      log({
        event: 'task_award_claimed',
        roleId,
        activityId: active.activityId,
        version: active.version,
        kind,
        tid,
        progressValue,
        changes: reward.changes.length
      });
      return {
        data,
        value: {
          activityId: active.activityId,
          version: active.version,
          kind,
          tid,
          progressValue,
          revOverdue,
          changes: reward.changes.length
        }
      };
    });
  }

  function loginPayload(at = now()) {
    const stamp = milliseconds(at);
    let active;
    try { active = activeAt(stamp); } catch { return codec.pack('pb_task_award_master', { data_list: [] }); }
    const roleId = store.read().state.roleId;
    const info = store.inspect(db => {
      ensureTables(db);
      const existing = ensureState(db, roleId, active, stamp);
      if (!existing) return null;
      return infoState(db, roleId, active.version, active.window.start);
    });
    return codec.pack('pb_task_award_master', { data_list: info ? [info] : [] });
  }

  function synchronizeLogin(activity, at = now()) {
    if (!activity || typeof activity !== 'object') return [];
    activity.act_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === TASK_AWARD_ACTIVITY_ID);
    if (!entry) {
      const active = activeAt(at);
      entry = {
        state_data: {
          act_id: TASK_AWARD_ACTIVITY_ID,
          cur_state_id: 50,
          history_time: [{ state_id: 50, enter_time: Number(active.window.start) }]
        },
        module_login_data: ''
      };
      activity.act_list.push(entry);
    }
    const payload = loginPayload(at);
    const master = codec.unpack('pb_task_award_master', payload);
    if (!master.data_list?.length) return [];
    entry.state_data ??= {};
    entry.state_data.act_id = TASK_AWARD_ACTIVITY_ID;
    entry.state_data.cur_state_id = 50;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time)
      ? entry.state_data.history_time : [];
    if (!entry.state_data.history_time.some(item => Number(item?.state_id) === 50)) {
      const active = activeAt(at);
      entry.state_data.history_time.push({ state_id: 50, enter_time: Number(active.window.start) });
    }
    entry.module_login_data = wrapEtfBinary(payload).toString('base64');
    return [TASK_AWARD_ACTIVITY_ID];
  }

  async function decode(type, data, { etf } = {}) {
    const commandType = Number(type);
    if (commandType !== TASK_AWARD_COMMANDS.progress && commandType !== TASK_AWARD_COMMANDS.task) {
      fail(CODE_INVALID, 'Unsupported task award command');
    }
    if (typeof etf !== 'function') fail(CODE_UNAVAILABLE, 'Task award ETF decoder is unavailable');
    const bytes = Buffer.from(data ?? Buffer.alloc(0));
    if (!bytes.length) fail(CODE_INVALID, 'Task award request is empty');
    let decoded;
    try {
      decoded = await etf(bytes);
    } catch {
      fail(CODE_INVALID, 'Task award request is not valid ETF');
    }
    const term = decoded?.value ?? decoded;
    const values = Array.isArray(term) ? term : [term];
    if (values.length !== 1) fail(CODE_INVALID, 'Task award claim expects one id');
    return [requestedId(values)];
  }

  return {
    supports: type => type === TASK_AWARD_COMMANDS.progress || type === TASK_AWARD_COMMANDS.task,
    isEtfRequest: type => type === TASK_AWARD_COMMANDS.progress || type === TASK_AWARD_COMMANDS.task,
    responseSchema: () => 'pb_task_award_back',
    decode,
    execute,
    loginPayload,
    synchronizeLogin,
    activityId: TASK_AWARD_ACTIVITY_ID,
    version: tables.version
  };
}
