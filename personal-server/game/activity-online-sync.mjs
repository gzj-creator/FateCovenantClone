import { GameError } from './hero-progression.mjs';

const STAGE_BY_STATUS = Object.freeze({
  preview: 10,
  running: 50,
  claim: 60,
  show: 90
});

const STATUS_BY_STAGE = new Map(Object.entries(STAGE_BY_STATUS).map(([status, stage]) => [stage, status]));

export const ACTIVITY_PUSH_TYPES = Object.freeze({
  LEGACY_STATE_CHANGE: 3301,
  ACT_FRAME_STAGE_CHANGE: 3304
});

function integer(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(5, `${field} is invalid`);
  return number;
}

function validWindow(window) {
  const start = Number(window?.start);
  const end = Number(window?.end);
  return Number.isSafeInteger(start) && start > 0 && Number.isSafeInteger(end) && end > start
    ? { start, end }
    : null;
}

export function activityClientStageId(value) {
  const number = Number(value);
  if (Number.isSafeInteger(number) && STATUS_BY_STAGE.has(number)) return number;
  return STAGE_BY_STATUS[String(value)] ?? null;
}

export function activityStatusForStage(value) {
  return STATUS_BY_STAGE.get(Number(value)) ?? null;
}

export function runtimeStatesById(states) {
  if (!Array.isArray(states)) throw new GameError(5, 'Activity runtime states must be an array');
  const result = new Map();
  for (const state of states) {
    const actId = integer(state?.actId, 'activity id');
    if (result.has(actId)) throw new GameError(5, `Duplicate activity runtime state ${actId}`);
    result.set(actId, state);
  }
  return result;
}

function updateHistory(row, stageId, enterTime) {
  const history = Array.isArray(row.history_time)
    ? row.history_time.filter(entry => Number(entry?.state_id) > 0 && Number(entry?.enter_time) > 0)
    : [];
  const last = history.at(-1);
  if (Number(last?.state_id) !== stageId || Number(last?.enter_time) !== enterTime) {
    history.push({ state_id: stageId, enter_time: String(enterTime) });
  }
  row.history_time = history;
}

/**
 * Applies one login's authoritative lifecycle evaluation to the in-memory
 * module-92 view. Persisted login snapshots remain untouched.
 */
export function applyActivityRuntimeLoginView(activity, states) {
  if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login payload is invalid');
  const byId = runtimeStatesById(states);
  const hidden = new Set([...byId].filter(([, state]) => state.stage === 'closed').map(([actId]) => actId));
  const structured = new Set();
  let updated = 0;

  function applyState(state) {
    const actId = Number(state?.act_id);
    const runtime = byId.get(actId);
    if (!runtime) return true;
    structured.add(actId);
    // `closed` has no proven client stage id. Keep its snapshot row so the
    // surrounding activity container remains structurally complete and expose
    // the closure through act_pause_list instead of deleting protocol data.
    if (hidden.has(actId)) return true;
    const stageId = activityClientStageId(runtime.stateId ?? runtime.stage);
    if (stageId == null) return true;
    state.cur_state_id = stageId;
    updateHistory(state, stageId, Number(runtime.stateStart ?? runtime.window?.start));
    updated += 1;
    return true;
  }

  for (const entry of activity.act_list ?? []) applyState(entry?.state_data);
  for (const group of activity.act_parallel_list ?? []) {
    for (const state of group?.states_data ?? []) applyState(state);
  }
  const existingPause = new Set((activity.act_pause_list ?? []).map(Number));
  for (const custom of activity.act_custom_list ?? []) {
    const actId = Number(custom?.act_id);
    if (byId.has(actId)) structured.add(actId);
    if (hidden.has(actId)) continue;
    const runtimeWindow = validWindow(byId.get(actId)?.window);
    if (runtimeWindow) {
      custom.start_time = runtimeWindow.start;
      custom.end_time = runtimeWindow.end;
    }
  }
  const paused = [...hidden].filter(actId => structured.has(actId) || existingPause.has(actId));
  activity.act_pause_list = [...new Set([...existingPause, ...paused])].sort((a, b) => a - b);

  return {
    hidden: [...hidden].sort((a, b) => a - b),
    paused,
    updated,
    visible: [...byId.keys()].filter(actId => !hidden.has(actId)).sort((a, b) => a - b)
  };
}

/**
 * Builds the static, handler-proven push for an online stage transition.
 * A close has no client-side numeric stage in the recovered tables or proto,
 * so it deliberately fails closed rather than inventing stage 0.
 */
export function buildActivityStagePush({ codec, tables, instance, change, at }) {
  if (!codec?.pack) throw new GameError(5, 'Game codec is required for activity pushes');
  const actId = Number(change?.actId);
  if (!Number.isSafeInteger(actId) || actId <= 0 || change?.from === change?.to) {
    return { ok: false, reason: 'invalid_stage_change' };
  }
  const frameConfig = tables?.ActFrameAct?.get(actId) ?? null;
  const legacyConfig = tables?.Activity?.get(actId) ?? null;
  const config = frameConfig ?? legacyConfig;
  if (!config) return { ok: false, reason: 'missing_activity_config' };
  const enterStage = activityClientStageId(change.to);
  if (enterStage == null) return { ok: false, reason: 'closed_stage_not_mapped' };
  const start = Number(instance?.preview_at ?? instance?.previewAt ?? instance?.open_at ?? instance?.openAt);
  const end = Number(instance?.show_until ?? instance?.showUntil ?? instance?.close_at ?? instance?.closeAt);
  const window = validWindow({ start, end });
  if (!window) return { ok: false, reason: 'invalid_instance_window' };
  const enterTime = Number(at ?? change?.at);
  if (!Number.isSafeInteger(enterTime) || enterTime <= 0) return { ok: false, reason: 'invalid_enter_time' };

  if (frameConfig) {
    const row = {
      act_id: actId,
      type: Number(frameConfig.type ?? frameConfig.func) || 0,
      start_time: String(window.start),
      end_time: String(window.end),
      cur_stage_id: enterStage,
      is_pause: false,
      ignore_fix_time: false,
      loop_count: 0,
      stage_time_list: [{ stage_id: enterStage, start_time: String(enterTime), end_time: String(window.end) }]
    };
    return {
      ok: true,
      source: 'ActFrameAct',
      type: ACTIVITY_PUSH_TYPES.ACT_FRAME_STAGE_CHANGE,
      data: codec.pack('pb_act_frame_stage_push', { act_stage_list: [row] })
    };
  }

  const exitStage = activityClientStageId(change.from) ?? 0;
  const data = codec.pack('pb_act_state_change_back', {
    change_back_data: [{
      id: actId,
      exit_state: exitStage,
      enter_state: enterStage,
      enter_time: enterTime,
      // The structural state notification is proven. Family-specific module
      // payloads remain unavailable until their command evidence is recovered.
      module_exit_data: Buffer.alloc(0),
      module_enter_data: Buffer.alloc(0)
    }]
  });
  return { ok: true, source: 'Activity', type: ACTIVITY_PUSH_TYPES.LEGACY_STATE_CHANGE, data };
}

export function createActivityOnlineSync({ codec, store, activityStore, tables, now = Date.now, logger = () => {} }) {
  if (!store?.inspect || !activityStore?.instance) throw new TypeError('store and activityStore are required');
  const serverId = () => {
    try { return Number(store.read().state.serverId ?? 1); } catch {
      return Number(store.inspect(db => db.prepare('SELECT server_id FROM roles LIMIT 1').get()?.server_id) ?? 1);
    }
  };

  function projectStageChange(change) {
    const instance = activityStore.instance(serverId(), Number(change?.actId), Number(change?.periodNo));
    const result = buildActivityStagePush({ codec, tables, instance, change, at: Math.floor(Number(now()) / 1000) });
    if (!result.ok) {
      logger({ event: 'activity_stage_push_skipped', actId: Number(change?.actId), reason: result.reason });
      return null;
    }
    return result;
  }

  return { projectStageChange };
}
