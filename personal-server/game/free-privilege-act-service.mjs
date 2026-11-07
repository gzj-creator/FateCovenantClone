import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readFreePrivilegeActTables, freePrivilegeVersionFor } from '../config/free-privilege-act-tables.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';

const ACTIVITY_LOGIN_MODULE = 92;
const RUNNING_STATE_ID = 50;
const DAY_SECONDS = 86400;
const PERMANENT_CARD_MODULE = 62;
const MONTHLY_CARD_MODULE = 20;
const ACTIVATE_TYPE = 110601;
const ACTIVATE_MONTH_TYPE = 110602;
// ActFrameTable pairs the activity with the manager that owns its data through
// ActFrameType.lua_module. The shipped table only has type 1072
// (big_type TID_BIG_FREE_PRIVILEGE) and acts 1060003 (version 1) / 1060013
// (version 2) are the two configured instances.
const ACTIVITY_MANAGER = 'FreePrivilegeActMgr';

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function toInteger(value) {
  if (value == null) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : Number.NaN;
}

// FreePrivilegeActData._ParseDataImpl decodes module_login_data as an ETF
// binary before Codec.DecodePB('pb_free_privilege_act_act_role_data'), exactly
// like the other activity managers, so the protobuf is ETF-wrapped here.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Free privilege activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

export function createFreePrivilegeActService({
  store,
  codec,
  tables,
  freePrivilegeTables = readFreePrivilegeActTables(),
  calendar,
  monthlyCard = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const nowIso = () => new Date(currentSeconds() * 1000).toISOString();

  const activityTypes = new Set([...(tables?.ActFrameType?.values?.() ?? [])]
    .filter(row => String(row?.lua_module?.reference ?? '') === ACTIVITY_MANAGER)
    .map(row => Number(row.tid))
    .filter(type => Number.isSafeInteger(type)));

  function configFor(act) {
    const config = freePrivilegeVersionFor(freePrivilegeTables, act.version);
    if (!config) throw new GameError(5, 'Free privilege activity version is not configured');
    return config;
  }

  function actConfig(actId) {
    const row = tables?.ActFrameAct?.get(Number(actId));
    if (!row || !activityTypes.has(Number(row.type))) return null;
    const version = Number(row.version);
    if (!Number.isSafeInteger(version) || !freePrivilegeVersionFor(freePrivilegeTables, version)) return null;
    return { actId: Number(actId), config: row, version };
  }

  function withWindow(act) {
    return { ...act, window: activityWindow(act.config, serverOpenedAt) };
  }

  function started(act, at) {
    const start = Number(act.window?.start);
    return Number.isSafeInteger(start) && start <= at;
  }

  // FreePrivilegeActMgr.GetRunningActData walks the configured acts of the big
  // type and returns the first running one; prefer the newest instance whose
  // configured window already started so a later activity version wins.
  function selectActivity(activity = null, at = currentSeconds()) {
    const candidates = [...(tables?.ActFrameAct?.values?.() ?? [])]
      .map(row => actConfig(row.tid))
      .filter(Boolean)
      .map(withWindow);
    if (!candidates.length) return null;
    if (calendar?.mode === 'all-open') {
      const startedActs = candidates
        .filter(act => started(act, at))
        .sort((left, right) => right.actId - left.actId);
      const pick = startedActs[0] ?? candidates.sort((left, right) => right.actId - left.actId)[0];
      return { ...pick, start: Number(pick.window?.start ?? serverOpenedAt) };
    }
    if (!calendar?.isActivityRunning) throw new GameError(5, 'Free privilege activity calendar is unavailable');
    const running = candidates
      .filter(act => calendar.isActivityRunning(act.actId, null, activity, at))
      .sort((left, right) => right.actId - left.actId);
    if (!running.length) return null;
    return { ...running[0], start: Number(running[0].window?.start ?? serverOpenedAt) };
  }

  function requestActivity(actId, at = currentSeconds()) {
    const act = actConfig(actId);
    if (!act) throw new GameError(1, 'Unknown free privilege activity');
    const resolved = withWindow(act);
    if (calendar?.isActivityRunning && !calendar.isActivityRunning(resolved.actId, null, null, at)) {
      throw new GameError(309, 'Free privilege activity is not running');
    }
    return { ...resolved, start: Number(resolved.window?.start ?? serverOpenedAt) };
  }

  function loadActivity() {
    const module = new Map(store.state().modules.value).get(ACTIVITY_LOGIN_MODULE);
    if (!module) return null;
    const bytes = rawBinary(module);
    if (!bytes.length) return null;
    try {
      return codec.unpack('pb_act_login', bytes);
    } catch {
      throw new GameError(5, 'Activity login data is invalid');
    }
  }

  // FreePrivilegeActData only carries the two activation timestamps; the module
  // 92 entry is the login slot that feeds both client getters.
  function ensureFreePrivilegeTables(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS free_privilege_role_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      active_time INTEGER NOT NULL DEFAULT 0,
      monthly_card_active_time INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id)
    )`);
  }

  if (store?.inspect) store.inspect(ensureFreePrivilegeTables);

  function roleState(db, roleId, act) {
    const row = db.prepare('SELECT * FROM free_privilege_role_state WHERE role_id=? AND act_id=?').get(roleId, act.actId);
    if (row) {
      return {
        ...row,
        active_time: toInteger(row.active_time) || 0,
        monthly_card_active_time: toInteger(row.monthly_card_active_time) || 0
      };
    }
    const timestamp = nowIso();
    return {
      role_id: Number(roleId), act_id: act.actId, version: act.version,
      active_time: 0, monthly_card_active_time: 0,
      created_at: timestamp, updated_at: timestamp
    };
  }

  function saveRoleState(db, state) {
    state.updated_at = nowIso();
    db.prepare(`INSERT INTO free_privilege_role_state (
      role_id, act_id, version, active_time, monthly_card_active_time, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      version=excluded.version,
      active_time=excluded.active_time,
      monthly_card_active_time=excluded.monthly_card_active_time,
      updated_at=excluded.updated_at`).run(
      state.role_id, state.act_id, state.version,
      state.active_time ?? 0, state.monthly_card_active_time ?? 0,
      state.created_at, state.updated_at
    );
  }

  function rolePayloadOf(act, state) {
    return {
      act_id: String(act.actId),
      active_time: String(toInteger(state.active_time) || 0),
      monthly_card_active_time: String(toInteger(state.monthly_card_active_time) || 0)
    };
  }

  function applyLoginEntry(activity, act, rolePb) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    activity.act_list = activity.act_list.filter(entry => Number(entry?.state_data?.act_id) !== act.actId);
    activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
      const states = (group.states_data ?? []).filter(state => Number(state?.act_id) !== act.actId);
      return states.length ? [{ ...group, states_data: states }] : [];
    });
    const entry = { state_data: { act_id: act.actId }, module_login_data: '' };
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = [{ state_id: RUNNING_STATE_ID, enter_time: Number(act.start ?? currentSeconds()) }];
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_free_privilege_act_act_role_data', rolePb)).toString('base64');
    activity.act_list.push(entry);
    return entry;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    const act = selectActivity(activity, at);
    if (!act) return { actId: null, version: null, start: null };
    const roleId = store.state().roleId;
    const state = store.inspect(db => roleState(db, roleId, act));
    applyLoginEntry(activity, act, rolePayloadOf(act, state));
    log({ event: 'free_privilege_login_synchronized', actId: act.actId, version: act.version, start: act.start });
    return { actId: act.actId, version: act.version, start: act.start };
  }

  function refreshStoredLogin(model, db, act, roleId) {
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(ACTIVITY_LOGIN_MODULE);
    if (!stored) return;
    const bytes = rawBinary(stored);
    if (!bytes.length) return;
    try {
      const activity = codec.unpack('pb_act_login', bytes);
      applyLoginEntry(activity, act, rolePayloadOf(act, roleState(db, roleId, act)));
      modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      model.state.modules.value = [...modules];
    } catch (error) {
      log({ event: 'free_privilege_login_refresh_skipped', actId: act.actId, error: error?.message ?? String(error) });
    }
  }

  // pb_permanent_card.free_endtime is the trial end time that
  // PermanentCardMgr.SetFreeEndTime receives; the free privilege window does not
  // add a permanent card ownership row because no evidence shows that.
  function readPermanentCard(modules) {
    const moduleValue = modules.get(PERMANENT_CARD_MODULE);
    if (!moduleValue) return { element_list: [], record_list: [], free_endtime: '0' };
    try {
      const info = codec.unpack('pb_permanent_card', rawBinary(moduleValue));
      info.element_list ??= [];
      info.record_list ??= [];
      return info;
    } catch {
      throw new GameError(5, 'Permanent card login data is invalid');
    }
  }

  function readMonthlyCardInfo(model) {
    const modules = new Map(model.state.modules.value);
    const moduleValue = modules.get(MONTHLY_CARD_MODULE);
    if (!moduleValue) throw new GameError(5, 'Monthly card login data is unavailable');
    try {
      const info = codec.unpack('pb_monthly_card_info', rawBinary(moduleValue));
      info.card_list ??= [];
      return info;
    } catch {
      throw new GameError(5, 'Monthly card login data is invalid');
    }
  }

  function activatePermanent(actId) {
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const versionConfig = configFor(act);
    const privilegeDay = Number(versionConfig.privilege_day);
    if (!Number.isSafeInteger(privilegeDay) || privilegeDay <= 0) {
      throw new GameError(5, 'Free privilege trial length is not configured');
    }
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      const alreadyActive = toInteger(state.active_time) > 0;
      let info = readPermanentCard(new Map(model.state.modules.value));
      if (alreadyActive) {
        // A repeated activation must not restart the trial window.
        log({ event: 'free_privilege_activation_acknowledged', actId, activeTime: toInteger(state.active_time) });
      } else {
        state.active_time = at;
        saveRoleState(db, state);
        const freeEndTime = at + privilegeDay * DAY_SECONDS;
        info = { ...info, free_endtime: String(freeEndTime) };
        const modules = new Map(model.state.modules.value);
        modules.set(PERMANENT_CARD_MODULE, serializedBinary(codec.pack('pb_permanent_card', info)));
        model.state.modules.value = [...modules];
        refreshStoredLogin(model, db, act, roleId);
        log({ event: 'free_privilege_activated', actId, activeTime: at, freeEndTime, privilegeDay });
      }
      const value = {
        act_data: rolePayloadOf(act, state),
        permanent_card: info
      };
      // Encoding stays inside the transaction so a serialization failure rolls
      // the activation marker and module 62 back together.
      return { value, data: codec.pack('pb_free_privilege_act_activate_back', value) };
    });
    return { value: result.value, data: result.data, actId, type: ACTIVATE_TYPE };
  }

  function activateMonth(actId) {
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const versionConfig = configFor(act);
    if (!versionConfig.is_month_card) throw new GameError(5, 'Free month-card privilege is not configured');
    const cardId = Number(versionConfig.month_card);
    if (!Number.isSafeInteger(cardId) || cardId <= 0) {
      throw new GameError(5, 'Free month-card id is not configured');
    }
    if (!monthlyCard?.activateFreeCard) throw new GameError(5, 'Monthly card service is unavailable');
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      const alreadyActive = toInteger(state.monthly_card_active_time) > 0;
      let info;
      if (alreadyActive) {
        // Matches the permanent-card branch: no second month is handed out.
        info = readMonthlyCardInfo(model);
        log({ event: 'free_month_card_activation_acknowledged', actId, activeTime: toInteger(state.monthly_card_active_time) });
      } else {
        const activation = monthlyCard.activateFreeCard({ model, cardId, at });
        info = activation.info;
        state.monthly_card_active_time = at;
        saveRoleState(db, state);
        refreshStoredLogin(model, db, act, roleId);
        log({
          event: 'free_month_card_activated', actId, cardId,
          startDay: activation.startDay, activeTime: at
        });
      }
      const value = {
        act_data: rolePayloadOf(act, state),
        monthly_card: info,
        // No activation reward is defined by any recovered table or client
        // call site; the real state change is the month card itself.
        res: { changes: [] }
      };
      return { value, data: codec.pack('pb_free_privilege_act_activate_month_back', value) };
    });
    return { value: result.value, data: result.data, actId, type: ACTIVATE_MONTH_TYPE };
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    supports: type => [ACTIVATE_TYPE, ACTIVATE_MONTH_TYPE].includes(Number(type)),
    currentActivity: (at = currentSeconds()) => selectActivity(loadActivity(), at),
    synchronizeLogin,
    execute(type, data = null, argument = null) {
      switch (Number(type)) {
        case ACTIVATE_TYPE: {
          const actId = toInteger(argument);
          if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid free privilege activity id');
          return activatePermanent(actId);
        }
        case ACTIVATE_MONTH_TYPE: {
          const actId = toInteger(argument);
          if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid free privilege activity id');
          return activateMonth(actId);
        }
        default: throw new GameError(5, 'Free privilege command is not implemented');
      }
    }
  };
}

