import { activityWindow, dayZero } from './activity-calendar.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { readOpenServerBoxTables } from '../config/open-server-box-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { ensureStateTable, writeState } from './develop-support.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';
import { GameError } from './hero-progression.mjs';
import { missionPosition } from './mission-progress.mjs';
import { grantResources } from './resources.mjs';

export const OPEN_SERVER_BOX_COMMANDS = Object.freeze({
  day_award: 69301,
  progress_award: 69302
});
export const OPEN_SERVER_BOX_ACTIVITY_ID = 20001;

const STATE_MODULE = 'r1_open_server_box';
const RUNNING_STATE_ID = 50;
const CODE_INVALID = 1;
const CODE_STATE = 5;
const DAY_SECONDS = 86400;

const fail = (code, message) => { throw new GameError(code, message); };

function seconds(value) {
  const number = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value);
  if (!Number.isFinite(number) || number < 0) fail(CODE_STATE, 'OpenServerBox clock is invalid');
  return Math.floor(number > 100_000_000_000 ? number / 1000 : number);
}

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function absoluteDayIndex(at) {
  return Math.floor(dayZero(seconds(at)) / DAY_SECONDS);
}

function emptyProgress() {
  return Buffer.alloc(1).toString('base64');
}

function normalize(raw, tables) {
  if (!raw || typeof raw !== 'object') fail(CODE_STATE, 'OpenServerBox state is invalid');
  const version = integer(raw.version, 'OpenServerBox version', { min: 0, max: 3 });
  if (!tables.versionConfig(version)) fail(CODE_STATE, `OpenServerBox version ${version} is not configured`);
  const joinDay = integer(raw.join_day, 'OpenServerBox join day', { min: 1 });
  const revDays = integer(raw.rev_days, 'OpenServerBox received days', { min: 0, max: 30 });
  let progress;
  const encoded = raw.rev_progress || emptyProgress();
  try { progress = Buffer.from(encoded, 'base64'); }
  catch { fail(CODE_STATE, 'OpenServerBox progress bitmap is invalid'); }
  if (!progress.length || progress.length > 4 || progress.toString('base64') !== encoded) {
    fail(CODE_STATE, 'OpenServerBox progress bitmap is invalid');
  }
  return {
    version,
    join_day: joinDay,
    rev_days: revDays,
    rev_progress: progress.toString('base64'),
    recharge_flag: Boolean(raw.recharge_flag)
  };
}

function protobufState(state) {
  return {
    join_day: String(state.join_day),
    rev_days: String(state.rev_days),
    rev_progress: state.rev_progress,
    version: String(state.version),
    recharge_flag: Boolean(state.recharge_flag)
  };
}

export function createOpenServerBoxService({
  store,
  codec,
  tables = readOpenServerBoxTables(),
  gameTables,
  missionTables = readMissionTables(),
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  now = Date.now,
  logger = () => {}
} = {}) {
  if (!store?.transaction || !store?.inspect) throw new Error('OpenServerBox store is unavailable');
  if (!gameTables?.Item?.size) throw new Error('OpenServerBox reward resource tables are unavailable');
  const openedAt = seconds(serverOpenedAt ?? store.serverOpenedAt);
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureStateTable(db));

  const activity = gameTables.Activity?.get(OPEN_SERVER_BOX_ACTIVITY_ID);
  if (!activity) throw new Error('OpenServerBox activity 20001 is unavailable');
  const targetSection = Number(tables.versionConfig(0)?.get_cond ?? 0);
  if (!missionTables.sections?.has(targetSection)) throw new Error(`OpenServerBox gate section ${targetSection} is unavailable`);

  for (const version of tables.rows.Version.values()) {
    const recharge = Number(version.recharge ?? 0);
    if (recharge && !gameTables.Recharge?.has(recharge)) throw new Error(`OpenServerBox recharge ${recharge} is unavailable`);
  }
  for (const boxes of tables.boxesByVersion.values()) {
    for (const box of boxes.values()) {
      for (const [tid] of [...box.award, ...box.recharge_award]) {
        if (!gameTables.Item.has(tid)) throw new Error(`OpenServerBox reward item ${tid} is unavailable`);
      }
    }
  }
  for (const progressRows of tables.progressByVersion.values()) {
    for (const progress of progressRows.values()) {
      for (const [tid] of progress.award) {
        if (!gameTables.Item.has(tid)) throw new Error(`OpenServerBox reward item ${tid} is unavailable`);
      }
    }
  }

  function running(at = now()) {
    const current = seconds(at);
    const window = activityWindow(activity, openedAt, activityReferenceOpenedAt);
    return Boolean(window && current >= window.start && current < window.end)
      ? { current, window }
      : null;
  }

  function initialState(window) {
    return {
      version: 0,
      join_day: Math.floor(dayZero(window.start) / DAY_SECONDS),
      rev_days: 0,
      rev_progress: emptyProgress(),
      recharge_flag: false
    };
  }

  function loadState(db, roleId, window) {
    const row = db.prepare(
      'SELECT payload FROM develop_module_state WHERE role_id=? AND module=?'
    ).get(String(roleId), STATE_MODULE);
    if (!row) return normalize(initialState(window), tables);
    let raw;
    try { raw = JSON.parse(row.payload); }
    catch { fail(CODE_STATE, 'OpenServerBox persisted state is invalid'); }
    return normalize(raw, tables);
  }

  function saveState(db, roleId, state, at) {
    writeState(db, roleId, STATE_MODULE, state, at);
  }

  function missionGatePassed(model) {
    const module = new Map(model.state.modules.value).get(8);
    if (!module || !Array.isArray(module.value) || !module.value[0]) fail(CODE_STATE, 'OpenServerBox mission cursor is missing');
    let mission;
    try { mission = codec.unpack('pb_mission', rawBinary(module.value[0])); }
    catch { fail(CODE_STATE, 'OpenServerBox mission cursor is invalid'); }
    const current = Number(mission.mission_id ?? mission.section_tid ?? 0);
    if (!Number.isSafeInteger(current) || current < 0) fail(CODE_STATE, 'OpenServerBox mission cursor is invalid');
    if (current === 0) return false;
    const currentPosition = missionPosition(missionTables.sections, current);
    const requiredPosition = missionPosition(missionTables.sections, targetSection);
    if (currentPosition < 0 || requiredPosition < 0) fail(CODE_STATE, 'OpenServerBox mission gate is not configured');
    return currentPosition >= requiredPosition;
  }

  function paidForVersion(db, model, version) {
    const productId = Number(tables.versionConfig(version)?.recharge ?? 0);
    if (!productId) return false;
    return Boolean(db.prepare(`
      SELECT 1 AS hit
      FROM recharge_orders o
      JOIN local_wallets w ON w.account_id=o.account_id
      WHERE w.role_id=? AND o.product_id=?
      LIMIT 1
    `).get(model.state.roleId, productId));
  }

  function elapsedDays(state, current) {
    const version = tables.versionConfig(state.version);
    if (!version) fail(CODE_STATE, `OpenServerBox version ${state.version} is not configured`);
    const raw = absoluteDayIndex(current) - state.join_day - Number(version.join_day) + 2;
    return Math.max(0, Math.min(30, raw));
  }

  function allProgressClaimed(state, version = state.version) {
    const bits = Buffer.from(state.rev_progress, 'base64');
    return [...tables.progressFor(version).values()].every(row => hasBit(bits, row.index));
  }

  function advanceCompletedVersions(state) {
    while (state.version < 3 && state.rev_days >= 30 && allProgressClaimed(state)) {
      state.version += 1;
      state.rev_days = 0;
      state.rev_progress = emptyProgress();
      state.recharge_flag = false;
    }
    return state;
  }

  function refreshPaidFlag(db, model, state) {
    state.recharge_flag = paidForVersion(db, model, state.version);
    return state;
  }

  function applyLoginEntry(activityLogin, state, window) {
    activityLogin.act_list ??= [];
    activityLogin.act_parallel_list ??= [];
    let entry = activityLogin.act_list.find(candidate => Number(candidate?.state_data?.act_id) === OPEN_SERVER_BOX_ACTIVITY_ID);
    if (!entry) {
      entry = { state_data: { act_id: OPEN_SERVER_BOX_ACTIVITY_ID }, module_login_data: '' };
      activityLogin.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = OPEN_SERVER_BOX_ACTIVITY_ID;
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const runningHistory = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (runningHistory) runningHistory.enter_time = window.start;
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: window.start });
    const packed = wrapEtfBinary(codec.pack('pb_open_server_box', protobufState(state)));
    // Legacy activity 20001 is shared by HundredDrawMgr and OpenServerBoxMgr.
    // module_login_data is a concatenated ETF binary stream, so preserve the
    // HundredDraw record and append the independently decoded box record.
    // HundredDraw synchronization runs before this service and replaces its own
    // record, preventing duplicate box records on relogin.
    const existing = entry.module_login_data
      ? Buffer.from(entry.module_login_data, 'base64')
      : Buffer.alloc(0);
    entry.module_login_data = Buffer.concat([existing, packed]).toString('base64');
    return state;
  }

  function synchronizeLogin(activityLogin, at = now()) {
    const active = running(at);
    if (!active || !activityLogin || typeof activityLogin !== 'object') return null;
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = loadState(db, roleId, active.window);
      refreshPaidFlag(db, model, state);
      advanceCompletedVersions(state);
      saveState(db, roleId, state, active.current * 1000);
      applyLoginEntry(activityLogin, state, active.window);
      log({ event: 'open_server_box_login_synchronized', roleId, version: state.version, revDays: state.rev_days });
      return protobufState(state);
    });
  }

  function claimDay(requestVersion) {
    const version = integer(requestVersion, 'OpenServerBox request version', { min: 0, max: 3 });
    const active = running();
    if (!active) fail(CODE_STATE, 'OpenServerBox activity is not running');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = loadState(db, roleId, active.window);
      if (version !== state.version) fail(CODE_STATE, `OpenServerBox version ${version} is stale; current ${state.version}`);
      if (!missionGatePassed(model)) fail(CODE_STATE, `OpenServerBox gate requires passed section ${targetSection}`);
      refreshPaidFlag(db, model, state);
      const day = state.rev_days + 1;
      const eligibleDays = elapsedDays(state, active.current);
      if (day > eligibleDays) fail(CODE_STATE, `OpenServerBox day ${day} is not reached; eligible ${eligibleDays}`);
      const box = tables.boxesFor(state.version).get(day);
      if (!box) fail(CODE_STATE, `OpenServerBox day ${day} is not configured for version ${state.version}`);
      const rewards = state.recharge_flag ? box.recharge_award : box.award;
      if (!rewards?.length) fail(CODE_STATE, `OpenServerBox day ${day} has no selectable reward`);
      const granted = grantResources(model, rewards, gameTables, { codec });
      state.rev_days = day;
      advanceCompletedVersions(state);
      saveState(db, roleId, state, active.current * 1000);
      const value = { data: protobufState(state), res: { changes: granted.changes, is_overflow: false } };
      const data = codec.pack('pb_open_server_box_back', value);
      log({ event: 'open_server_box_day_committed', roleId, version: state.version, day, rewardKind: box.recharge_award?.length && state.recharge_flag ? 'recharge' : 'normal' });
      return { schema: 'pb_open_server_box_back', value, data, valueForLog: { version: state.version, day } };
    });
  }

  function claimProgress(request) {
    const version = integer(request?.version, 'OpenServerBox request version', { min: 0, max: 3 });
    const tid = integer(request?.tid, 'OpenServerBox progress tid', { min: 1 });
    const active = running();
    if (!active) fail(CODE_STATE, 'OpenServerBox activity is not running');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = loadState(db, roleId, active.window);
      if (version !== state.version) fail(CODE_STATE, `OpenServerBox version ${version} is stale; current ${state.version}`);
      const row = [...tables.progressFor(state.version).values()].find(entry => entry.tid === tid);
      if (!row) fail(CODE_STATE, `OpenServerBox progress ${tid} is not configured for version ${state.version}`);
      if (!missionGatePassed(model)) fail(CODE_STATE, `OpenServerBox gate requires passed section ${targetSection}`);
      refreshPaidFlag(db, model, state);
      const bits = Buffer.from(state.rev_progress, 'base64');
      if (hasBit(bits, row.index)) fail(CODE_STATE, `OpenServerBox progress ${tid} is already claimed`);
      const eligibleDays = elapsedDays(state, active.current);
      if (eligibleDays < row.need_progress) fail(CODE_STATE, `OpenServerBox progress ${tid} needs ${row.need_progress} days; eligible ${eligibleDays}`);
      const granted = grantResources(model, row.award, gameTables, { codec });
      state.rev_progress = setBit(bits, row.index).toString('base64');
      advanceCompletedVersions(state);
      saveState(db, roleId, state, active.current * 1000);
      // OpenServerBoxCmd.c2s_back declares 69302 as pb_res_to_client. The
      // client already advances its local receiveProgress bitmap only after a
      // successful acknowledgement, so this response contains no second data
      // block that could overwrite it with stale state.
      const value = { changes: granted.changes, is_overflow: false };
      const data = codec.pack('pb_res_to_client', value);
      log({ event: 'open_server_box_progress_committed', roleId, version: state.version, tid });
      return { schema: 'pb_res_to_client', value, data, valueForLog: { version: state.version, tid } };
    });
  }

  async function decode(type, data, { unpack, etf } = {}) {
    const command = Number(type);
    if (command === OPEN_SERVER_BOX_COMMANDS.day_award) {
      if (typeof etf !== 'function') fail(CODE_STATE, 'OpenServerBox ETF decoder is unavailable');
      let value;
      try { value = await etf(Buffer.from(data ?? Buffer.alloc(0))); }
      catch { fail(CODE_INVALID, 'OpenServerBox request is not valid ETF'); }
      const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
      return integer(candidate, 'OpenServerBox request version', { min: 0, max: 3 });
    }
    if (command === OPEN_SERVER_BOX_COMMANDS.progress_award) {
      if (typeof etf !== 'function') fail(CODE_STATE, 'OpenServerBox ETF decoder is unavailable');
      let value;
      try { value = await etf(Buffer.from(data ?? Buffer.alloc(0))); }
      catch { fail(CODE_INVALID, 'OpenServerBox progress request is invalid ETF'); }
      const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
      const map = candidate?.value instanceof Map ? candidate.value
        : candidate instanceof Map ? candidate : null;
      if (!map) fail(CODE_INVALID, 'OpenServerBox progress request is invalid');
      return { tid: map.get('tid'), version: map.get('version') };
    }
    fail(CODE_INVALID, 'Unsupported OpenServerBox command');
  }

  function execute(type, input) {
    const command = Number(type);
    if (command === OPEN_SERVER_BOX_COMMANDS.day_award) return claimDay(input);
    if (command === OPEN_SERVER_BOX_COMMANDS.progress_award) return claimProgress(input);
    fail(CODE_INVALID, 'Unsupported OpenServerBox command');
  }

  return {
    supports: type => Object.values(OPEN_SERVER_BOX_COMMANDS).includes(Number(type)),
    isEtfRequest: type => Object.values(OPEN_SERVER_BOX_COMMANDS).includes(Number(type)),
    requestSchema: () => null,
    responseSchema: type => Number(type) === OPEN_SERVER_BOX_COMMANDS.day_award
      ? 'pb_open_server_box_back' : 'pb_res_to_client',
    decode,
    execute,
    ensureLoginState: () => ({ changed: false }),
    synchronizeLogin,
    state: () => store.inspect(db => {
      const window = running()?.window ?? activityWindow(activity, openedAt, activityReferenceOpenedAt);
      if (!window) fail(CODE_STATE, 'OpenServerBox activity window is unavailable');
      return loadState(db, store.state().roleId, window);
    })
  };
}
