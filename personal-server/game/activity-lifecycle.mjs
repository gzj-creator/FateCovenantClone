import { activityDurationDays, activityWindow, serverDayNumber } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';

const DAY_SECONDS = 86400;

export const ACTIVITY_STATUS = Object.freeze({
  CLOSED: 'closed',
  PREVIEW: 'preview',
  RUNNING: 'running',
  CLAIM: 'claim',
  SHOW: 'show'
});

const STATE_STATUS = new Map([
  [10, ACTIVITY_STATUS.PREVIEW],
  [50, ACTIVITY_STATUS.RUNNING],
  [60, ACTIVITY_STATUS.CLAIM],
  [90, ACTIVITY_STATUS.SHOW]
]);

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function closed(reason) {
  return { status: ACTIVITY_STATUS.CLOSED, visible: false, reason };
}

export function activityStateAt(config, window, at) {
  const now = seconds(at);
  const start = seconds(window?.start);
  const end = seconds(window?.end);
  if (!(start > 0) || !(end > start) || now < start || now >= end) return closed('outside_window');

  const states = Array.isArray(config?.state) ? config.state.map(Number) : [];
  const durations = Array.isArray(config?.state_end_day) ? config.state_end_day.map(Number) : [];
  if (!states.length) {
    return { status: ACTIVITY_STATUS.RUNNING, visible: true, stateId: 50, start, end, index: 0 };
  }
  let offset = 0;
  for (let index = 0; index < states.length; index += 1) {
    const days = Number.isFinite(durations[index]) && durations[index] >= 0 ? durations[index] : 0;
    const stateEnd = start + (offset + days) * DAY_SECONDS;
    if (days > 0 && now < stateEnd) {
      const status = STATE_STATUS.get(states[index]);
      if (!status) return closed(`unknown_state_${states[index]}`);
      return { status, visible: true, stateId: states[index], start: start + offset * DAY_SECONDS, end: stateEnd, index };
    }
    offset += days;
  }
  // An operational extend keeps the activity's final declared stage alive
  // through the overridden end. Without this, state_end_day would still close
  // a running activity at the original relative-day boundary.
  if (window?.kind === 'override-extend' && now < end && states.length) {
    const status = STATE_STATUS.get(states.at(-1));
    if (status) return { status, visible: true, stateId: states.at(-1), start: start + offset * DAY_SECONDS, end, index: states.length - 1 };
  }
  return closed('after_last_state');
}

export function activityGate(status, need) {
  switch (need) {
    case 'read': return [ACTIVITY_STATUS.PREVIEW, ACTIVITY_STATUS.RUNNING, ACTIVITY_STATUS.CLAIM, ACTIVITY_STATUS.SHOW].includes(status);
    case 'operate': return status === ACTIVITY_STATUS.RUNNING;
    case 'claim': return status === ACTIVITY_STATUS.RUNNING || status === ACTIVITY_STATUS.CLAIM;
    default: throw new GameError(1, 'Unknown activity gate requirement');
  }
}

export function applyOverride(baseWindow, override, at) {
  if (!override) return { window: baseWindow, forcedOpen: false };
  if (override.kind === 'pause' || override.kind === 'force_close') return { closed: true };
  if (override.kind === 'force_open') {
    const start = seconds(override.startAt);
    const end = seconds(override.endAt);
    if (!(start > 0 && end > start)) return { closed: true };
    return { window: { start, end, kind: 'override' }, forcedOpen: true };
  }
  if (override.kind === 'shift') {
    const delta = seconds(override.startAt) - seconds(baseWindow?.start);
    return { window: baseWindow && Number.isFinite(delta)
      ? { start: baseWindow.start + delta, end: baseWindow.end + delta, kind: 'override-shift' }
      : null };
  }
  if (override.kind === 'extend') {
    const end = seconds(override.endAt);
    return { window: baseWindow && end > baseWindow.start
      ? { ...baseWindow, end, kind: 'override-extend' }
      : baseWindow };
  }
  if (override.kind === 'close_early') {
    const cutoff = seconds(override.at);
    const end = baseWindow ? Math.min(seconds(baseWindow.end), cutoff) : 0;
    return { window: baseWindow && end > baseWindow.start ? { ...baseWindow, end, kind: 'override-close' } : null };
  }
  return { window: baseWindow };
}

function playerCondition(asserts, role) {
  if (asserts == null || (Array.isArray(asserts) && asserts.length === 0)) return true;
  if (!Array.isArray(asserts)) return false;
  return asserts.every(condition => {
    const type = condition?.type;
    const args = condition?.args ?? {};
    if (type === 'role_level') return Number(role?.level ?? 0) >= Number(args.level ?? 0);
    if (type === 'create_day') return Number(role?.createDay ?? 0) >= Number(args.day ?? 0);
    return false;
  });
}

export function evaluateActivity({
  config,
  at,
  serverOpenedAt,
  activityReferenceOpenedAt = null,
  override = null,
  funOpen = null,
  role = null,
  parent = null,
  windowOverride = null,
  ignorePlayerAccess = false
} = {}) {
  if (!config) return closed('missing_config');
  if (parent && !parent.visible) return closed('parent_hidden');

  if (override?.kind === 'pause' || override?.kind === 'force_close') return closed('override_closed');
  if (Number(config.discard_time) > 0 && seconds(at) >= seconds(config.discard_time)) return closed('discarded');

  // E10-2: these flags need client-time evidence. Until then the affected rows
  // stay closed instead of guessing a window.
  if (Number(config.server_limited_type) === 1 || Number(config.world_limit_state) === 3) return closed('unresolved_server_limit');
  const timeType = Number(config.time_type);
  if ([3, 4, 5].includes(timeType) || Number(config.time_fun) === 461) return closed('unresolved_time_type');

  const minimumDay = Math.max(0, Number(config.join_server_day) || 0);
  const maximumDay = Math.max(0, Number(config.server_day_limit) || 0);
  if (minimumDay > 0 && serverDayNumber(serverOpenedAt, at) < minimumDay) return closed('before_join_day');
  if (maximumDay > 0 && serverDayNumber(serverOpenedAt, at) > maximumDay) return closed('after_server_limit');
  const opened = seconds(serverOpenedAt);
  const minimumOpen = seconds(config.server_mini_open_limited);
  const maximumOpen = seconds(config.server_max_open_limited);
  if (minimumOpen > 0 && opened < minimumOpen) return closed('before_open_limit');
  if (maximumOpen > 0 && opened > maximumOpen) return closed('after_open_limit');

  const baseWindow = windowOverride ?? activityWindow(config, serverOpenedAt, activityReferenceOpenedAt);
  const overrideResult = applyOverride(baseWindow, override, at);
  if (overrideResult.closed) return closed('override_closed');
  const window = overrideResult.window;
  if (!window) return closed('no_window');

  const state = activityStateAt(config, window, at);
  if (!state.visible) return state;

  if (!ignorePlayerAccess) {
    const funId = Number(config.jump_func ?? config.func ?? 0);
    if (!overrideResult.forcedOpen && funId > 0 && funOpen && !funOpen.has(funId)) return closed('function_locked');
    if (!playerCondition(config.asserts, role)) return closed('player_condition');
    if (override?.conditions && !playerCondition(override.conditions, role)) return closed('override_condition');
  }
  return { ...state, window };
}

export function createActivityLifecycle({ calendar, tables, now = Date.now }) {
  const at = () => Math.floor(Number(now()) / 1000);
  const configFor = id => tables?.ActFrameAct?.get(Number(id)) ?? tables?.Activity?.get(Number(id)) ?? null;
  return {
    evaluate(actId, options = {}) {
      return evaluateActivity({
        config: configFor(actId),
        at: options.at ?? at(),
        serverOpenedAt: calendar?.serverOpenedAt ?? options.serverOpenedAt,
        activityReferenceOpenedAt: calendar?.activityReferenceOpenedAt ?? options.activityReferenceOpenedAt,
        ...options
      });
    },
    gate(actId, need, options = {}) {
      const result = this.evaluate(actId, options);
      if (!activityGate(result.status, need)) throw new GameError(309, 'Activity is not open');
      return result;
    }
  };
}

