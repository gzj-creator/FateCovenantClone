import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { properList } from './role-service.mjs';

// ActivityCmd/ActFrameCmd runtime. Activity login state (module 92) stays the
// single authority for which activities the role sees; migration v17 adds the
// per-role stage rows that record the transitions those activities performed.
const STATES = Object.freeze({ PENDING: 0, ENDED: 40, RUNNING: 50 });
const SUPPORTED = new Set([53001, 53002, 53003, 53004, 53005, 53006]);

function activityRows(activity) {
  const rows = [];
  for (const entry of activity.act_list ?? []) {
    if (entry?.state_data?.act_id) rows.push({ kind: 'list', entry, state: entry.state_data });
  }
  for (const group of activity.act_parallel_list ?? []) {
    for (const state of group.states_data ?? []) {
      if (state?.act_id) rows.push({ kind: 'parallel', group, entry: null, state });
    }
  }
  return rows;
}

export function createActFrameService({ store, codec, calendar, tables, now = Date.now, logger = () => {}, gmEnabled = () => false }) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(now() / 1000);
  const stamp = () => new Date(now()).toISOString();

  function readActivity(db, roleId) {
    const row = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=92').get(roleId);
    if (!row) return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    const module = JSON.parse(row.payload_json);
    const bytes = rawBinary(module);
    if (!bytes.length) return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    const activity = codec.unpack('pb_act_login', bytes);
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    activity.act_pause_list ??= [];
    activity.act_custom_list ??= [];
    return activity;
  }

  function writeActivity(db, roleId, activity) {
    db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=92')
      .run(JSON.stringify(serializedBinary(codec.pack('pb_act_login', activity))), roleId);
  }

  function stageRow(db, roleId, actId) {
    return db.prepare('SELECT * FROM role_activity_stages WHERE role_id=? AND act_id=?').get(roleId, actId) ?? null;
  }

  function writeStage(db, roleId, actId, patch) {
    const existing = stageRow(db, roleId, actId);
    const next = {
      stage_id: patch.stage_id ?? existing?.stage_id ?? 0,
      state_id: patch.state_id ?? existing?.state_id ?? STATES.RUNNING,
      enter_time: patch.enter_time ?? existing?.enter_time ?? currentSeconds(),
      loop_count: patch.loop_count ?? existing?.loop_count ?? 0,
      is_pause: patch.is_pause ?? existing?.is_pause ?? 0
    };
    db.prepare('INSERT OR REPLACE INTO role_activity_stages (role_id,act_id,stage_id,state_id,enter_time,loop_count,is_pause,updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(roleId, actId, next.stage_id, next.state_id, next.enter_time, next.loop_count, next.is_pause, stamp());
    return { ...next, created: !existing };
  }

  function desiredState(activity, state) {
    const actId = Number(state?.act_id);
    if (calendar.mode === 'all-open') return STATES.RUNNING;
    return calendar.isActivityRunning(actId, state, activity) ? STATES.RUNNING : STATES.ENDED;
  }

  function requestIds(input) {
    const list = properList(input);
    if (!list?.length) throw new GameError(1, 'Activity synchronization requires a non-empty ETF list');
    const ids = [];
    for (const value of list) {
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
        throw new GameError(1, 'Activity synchronization ids must be positive integers');
      }
      if (!ids.includes(value)) ids.push(value);
    }
    return ids;
  }

  function reconcile(model, db, requestedIds) {
    const roleId = model.state.roleId;
    const activity = readActivity(db, roleId);
    const changes = [];
    const requested = new Set(requestedIds);
    const known = new Set(activityRows(activity).map(row => Number(row.state.act_id)));
    // The client also sends state-change hints for configured activity instances
    // that are owned by families absent from module 92. Those hints need a valid
    // empty acknowledgement; rejecting them surfaces as a request-level
    // CONFIG_ERROR even though there is no state transition to perform.
    const configured = id => Boolean(tables?.ActFrameAct?.get?.(id) ?? tables?.Activity?.get?.(id));
    const unknown = requestedIds.filter(id => !known.has(id) && !configured(id));
    if (unknown.length) throw new GameError(1, `Unknown activity ids: ${unknown.join(',')}`);
    for (const row of activityRows(activity)) {
      const actId = Number(row.state.act_id);
      if (!requested.has(actId)) continue;
      const stored = stageRow(db, roleId, actId);
      const target = desiredState(activity, row.state);
      const previous = stored ? Number(stored.state_id) : target;
      if (stored && previous === target) continue;
      const enterTime = currentSeconds();
      writeStage(db, roleId, actId, { state_id: target, enter_time: enterTime, stage_id: target });
      changes.push({ act_id: actId, exit_state: previous, enter_state: target, enter_time: enterTime });
    }
    return { activity, changes };
  }

  function activityStateChange(input) {
    const ids = requestIds(input);
    return store.transaction((model, db) => {
      const { changes: filtered } = reconcile(model, db, ids);
      return {
        value: { changes: filtered.length, actIds: ids },
        data: codec.pack('pb_act_state_change_back', {
          change_back_data: filtered.map(change => ({
            id: change.act_id,
            exit_state: change.exit_state,
            enter_state: change.enter_state,
            enter_time: change.enter_time,
            module_exit_data: Buffer.alloc(0),
            module_enter_data: Buffer.alloc(0)
          }))
        })
      };
    });
  }

  function stageChange(input) {
    const ids = requestIds(input);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const { activity, changes } = reconcile(model, db, ids);
      const changeList = changes.map(change => {
        const row = activityRows(activity).find(entry => Number(entry.state.act_id) === change.act_id);
        const loginData = row?.entry?.module_login_data ? Buffer.from(String(row.entry.module_login_data), 'base64') : Buffer.alloc(0);
        const isLogin = change.exit_state !== STATES.RUNNING && change.enter_state === STATES.RUNNING;
        return {
          act_id: change.act_id,
          exit_stage: change.exit_state,
          enter_stage: change.enter_state,
          module_exit_data: Buffer.alloc(0),
          module_enter_data: Buffer.alloc(0),
          login_data: isLogin ? loginData : Buffer.alloc(0),
          is_login: isLogin,
          is_fail: false
        };
      });
      return { value: { changes: changeList.length, actIds: ids }, data: codec.pack('pb_act_role_stage_change_back', { change_list: changeList }) };
    });
  }

  function actListData(input) {
    const ids = requestIds(input);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const activity = readActivity(db, roleId);
      const pause = new Set((activity.act_pause_list ?? []).map(Number));
      const custom = new Map((activity.act_custom_list ?? []).map(row => [Number(row.act_id), row]));
      const rows = activityRows(activity);
      const known = new Set(rows.map(row => Number(row.state.act_id)));
      const unknown = ids.filter(actId => !known.has(actId));
      if (unknown.length) throw new GameError(1, `Unknown activity ids: ${unknown.join(',')}`);
      const rowsById = new Map(rows.map(row => [Number(row.state.act_id), row]));
      const actStageList = ids.map(actId => {
        const stored = stageRow(db, roleId, actId);
        const config = tables?.ActFrameAct?.get?.(actId) ?? tables?.Activity?.get?.(actId) ?? null;
        const window = activityWindow(
          config,
          calendar.serverOpenedAt,
          calendar.activityReferenceOpenedAt
        );
        const customRow = custom.get(actId);
        const start = Number(window?.start ?? customRow?.start_time ?? 0);
        const end = Number(window?.end ?? customRow?.end_time ?? 0);
        const current = stored ? Number(stored.stage_id) : STATES.RUNNING;
        return {
          act_id: actId,
          type: Number(config?.type ?? 0),
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: current,
          is_pause: pause.has(actId),
          ignore_fix_time: Boolean(customRow && !window),
          loop_count: Number(stored?.loop_count ?? 0),
          stage_time_list: [{ stage_id: current, start_time: String(start), end_time: String(end) }]
        };
      });
      return { value: { activities: actStageList.length }, data: codec.pack('pb_act_frame_stage_push', { act_stage_list: actStageList }) };
    });
  }

  function requireGm() {
    if (!gmEnabled()) throw new GameError(403, 'Activity GM commands are disabled');
  }

  function gmOpen(input) {
    requireGm();
    const list = Array.isArray(input?.value) ? input.value.map(Number) : [];
    const actId = list[0];
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'GM open requires an activity id');
    const duration = Number.isSafeInteger(list[1]) && list[1] > 0 ? list[1] : 86400;
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const activity = readActivity(db, roleId);
      const start = currentSeconds();
      const row = { act_id: actId, start_time: start, end_time: start + duration };
      activity.act_custom_list = [...(activity.act_custom_list ?? []).filter(entry => Number(entry.act_id) !== actId), row];
      writeActivity(db, roleId, activity);
      writeStage(db, roleId, actId, { state_id: STATES.RUNNING, stage_id: STATES.RUNNING, enter_time: start });
      db.prepare('INSERT INTO gm_audit_entries (role_id,command,detail_json,created_at) VALUES (?,?,?,?)')
        .run(roleId, 'act_frame_gm_open', JSON.stringify({ actId, duration }), stamp());
      return { value: { actId, start, end: start + duration }, data: null };
    });
  }

  function gmJumpStage(input) {
    requireGm();
    const list = Array.isArray(input?.value) ? input.value.map(Number) : [];
    const actId = list[0];
    const stage = list[1];
    if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(stage) || stage < 0) {
      throw new GameError(1, 'GM jump requires an activity id and stage');
    }
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      writeStage(db, roleId, actId, { stage_id: stage, state_id: stage, enter_time: currentSeconds() });
      db.prepare('INSERT INTO gm_audit_entries (role_id,command,detail_json,created_at) VALUES (?,?,?,?)')
        .run(roleId, 'act_frame_gm_jump', JSON.stringify({ actId, stage }), stamp());
      return { value: { actId, stage }, data: null };
    });
  }

  function gmClear(input) {
    requireGm();
    const list = Array.isArray(input?.value) ? input.value.map(Number) : [];
    const actId = list[0];
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'GM clear requires an activity id');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      db.prepare('DELETE FROM role_activity_stages WHERE role_id=? AND act_id=?').run(roleId, actId);
      const activity = readActivity(db, roleId);
      activity.act_list = (activity.act_list ?? []).filter(entry => Number(entry.state_data?.act_id) !== actId);
      activity.act_parallel_list = (activity.act_parallel_list ?? []).map(group => ({
        ...group,
        states_data: (group.states_data ?? []).filter(state => Number(state.act_id) !== actId)
      })).filter(group => (group.states_data ?? []).length);
      activity.act_custom_list = (activity.act_custom_list ?? []).filter(entry => Number(entry.act_id) !== actId);
      activity.act_pause_list = (activity.act_pause_list ?? []).filter(id => Number(id) !== actId);
      writeActivity(db, roleId, activity);
      db.prepare('INSERT INTO gm_audit_entries (role_id,command,detail_json,created_at) VALUES (?,?,?,?)')
        .run(roleId, 'act_frame_gm_clear', JSON.stringify({ actId }), stamp());
      return { value: { actId, cleared: true }, data: null };
    });
  }

  async function execute(type, context = {}) {
    switch (Number(type)) {
      case 53001: return activityStateChange(context.etf);
      case 53002: return stageChange(context.etf);
      case 53003: return gmOpen(context.etf);
      case 53004: return gmJumpStage(context.etf);
      case 53005: return gmClear(context.etf);
      case 53006: return actListData(context.etf);
      default: throw new GameError(1, 'Unsupported activity frame command');
    }
  }

  return { supports: type => SUPPORTED.has(Number(type)), execute };
}
