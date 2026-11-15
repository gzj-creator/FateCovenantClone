// Pure documentation calculations recovered from the saved client bytecode.
// This file is not imported by the game server. Evidence and prototype/PC
// references: docs/gameplay-operations/activity-rulebooks/time-and-stages.md.
export const DAY_SECONDS = 86400;
export const STATE_END_END_TIME = 4294967295;
export const STAGE_NAMES = {
  0: '未开放', 10: '预热', 50: '进行', 51: '进行1', 52: '进行2',
  53: '进行3', 54: '进行4', 55: '进行5', 60: '通知/领奖', 90: '公示', 99: '结束'
};

const defaults = { timezoneOffsetSeconds: 28800, flushOffsetSeconds: 18000 };
function options(value = {}) {
  const result = { ...defaults, ...value };
  if (!Number.isSafeInteger(result.timezoneOffsetSeconds) || !Number.isSafeInteger(result.flushOffsetSeconds)) {
    throw new Error('Documentation time assumptions must be integer seconds');
  }
  return result;
}
function dayIndex(at, value) {
  const { timezoneOffsetSeconds, flushOffsetSeconds } = options(value);
  return Math.max(0, Math.floor((at + timezoneOffsetSeconds - flushOffsetSeconds) / DAY_SECONDS));
}
export function clientDayBegin(at, value) {
  const { timezoneOffsetSeconds, flushOffsetSeconds } = options(value);
  return dayIndex(at, value) * DAY_SECONDS - timezoneOffsetSeconds + flushOffsetSeconds;
}
export function clientDayZero(at, value) {
  return dayIndex(at, value) * DAY_SECONDS - options(value).timezoneOffsetSeconds;
}
function integers(array) {
  return Array.isArray(array) && array.every(Number.isSafeInteger);
}
function phase(stageId, start, end, source) {
  return { stageId, stageName: STAGE_NAMES[stageId] ?? '未恢复名称', start, end, source };
}

// Activity.lua GetStageTime, prototype 25. A supplied stage_time_list entry
// takes priority. No server object returns (0, 0), with no fabricated window.
export function clientActFrameStage(row, server, stageId, value) {
  if (!server) return { ...phase(stageId, 0, 0, 'no-server'), status: 'no-server-instance' };
  const override = server.stage_time_list?.find(entry => Number(entry.stage_id) === stageId);
  if (override) {
    if (![override.start_time, override.end_time].every(Number.isSafeInteger)) {
      return { stageId, status: 'incomplete-server-stage-override' };
    }
    return { ...phase(stageId, override.start_time, override.end_time, 'server-stage-time-list'), status: 'server-override' };
  }
  if (!Number.isSafeInteger(server.start_time)) return { stageId, status: 'missing-server-start-time' };
  if (!Array.isArray(row.stage) || !row.stage.includes(stageId)) {
    return { stageId, status: 'stage-not-configured' };
  }
  const days = row.stage_duration_day, ends = row.stage_end_time;
  if (!integers(days) || !integers(ends) || days.length !== row.stage.length || ends.length !== row.stage.length) {
    return { stageId, status: 'incomplete-stage-arrays' };
  }
  let previousDays = 0, currentDays = 0, previousEnd = 0, currentEnd = 0;
  for (let i = 0; i < row.stage.length; i++) {
    const configured = row.stage[i];
    if (stageId < configured) break;
    if (configured < stageId) {
      previousDays += days[i];
      previousEnd = ends[i];
    } else if (configured === stageId) {
      currentDays = days[i];
      currentEnd = ends[i];
    }
  }
  let start = server.start_time + previousDays * DAY_SECONDS;
  if (previousEnd > 0) start = clientDayZero(start, value) + previousEnd;
  const end = clientDayZero(start + currentDays * DAY_SECONDS, value) + currentEnd;
  return { ...phase(stageId, start, end, 'client-fallback'), status: 'client-fallback' };
}

export function projectActFrameFallback(row, exampleWindow, value) {
  if (!Array.isArray(row.stage) || !row.stage.length) {
    return { status: 'server-stage-list-required', phases: [],
      reason: 'Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied.' };
  }
  const candidates = row.stage.map(id => clientActFrameStage(row, exampleWindow
    ? { start_time: exampleWindow.start, end_time: exampleWindow.end } : null, id, value));
  const blocked = candidates.find(entry => entry.status !== 'client-fallback');
  if (blocked) return { status: blocked.status, phases: [], configuredStageIds: row.stage };
  const warnings = [];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].end < candidates[i].start) warnings.push({ kind: 'end-before-start', stageId: candidates[i].stageId });
    if (i > 0 && candidates[i].start !== candidates[i - 1].end) warnings.push({ kind: 'noncontiguous-stage-boundary', stageId: candidates[i].stageId });
  }
  if (exampleWindow && candidates.at(-1).end !== exampleWindow.end) warnings.push({ kind: 'last-stage-differs-from-example-instance-end' });
  return { status: 'client-fallback-with-example-instance', phases: candidates, warnings,
    exampleInstance: exampleWindow, authoritativeStageTimeListObserved: false };
}

// ActivityTimeUtil: SERVER_TIME=0 and WORLD_TIME=1 are recovered here.
// Divine realm/stage windows require their own authoritative runtime inputs.
export function clientLegacyWindow(row, serverOpenedAt, value) {
  let base, start;
  if (Number(row.time_type) === 0) {
    if (![serverOpenedAt, row.server_day, row.server_start_time, row.duration_day, row.end_time].every(Number.isSafeInteger)) {
      return { status: 'missing-server-window-fields' };
    }
    base = clientDayBegin(serverOpenedAt, value) + (row.server_day - 1) * DAY_SECONDS;
    start = clientDayZero(base, value) + row.server_start_time;
  } else if (Number(row.time_type) === 1) {
    if (![row.world_time, row.duration_day, row.end_time].every(Number.isSafeInteger)) {
      return { status: 'missing-world-window-fields' };
    }
    start = row.world_time;
    base = clientDayBegin(start, value);
  } else return { status: 'divine-or-unknown-time-input-required', timeType: row.time_type };
  const end = clientDayZero(base + row.duration_day * DAY_SECONDS, value) + row.end_time;
  return { status: 'client-table-window', start, end, cursorDayBase: base,
    originalTimeKind: Number(row.time_type) === 0 ? 'server-day' : 'absolute-world-time',
    serverCustomWindowObserved: false };
}

// ActivityTimeUtil prototypes 19/25. An empty state array *does* default to
// RUNNING here; this is deliberately different from ActFrame's empty stage.
export function projectLegacyTableStates(row, window, value) {
  if (window?.status !== 'client-table-window') return { status: window?.status ?? 'window-unavailable', phases: [] };
  const { start, end } = window;
  if (end <= start) return { status: 'empty-invalid-window', phases: [], window };
  if (!Array.isArray(row.state)) return { status: 'missing-state-array', phases: [], window };
  const before = phase(0, 0, start, 'table-envelope');
  const after = phase(99, end, STATE_END_END_TIME, 'table-envelope');
  if (!row.state.length) return { status: 'client-table-default-running', window,
    phases: [before, phase(50, start, end, 'empty-state-default'), after], warnings: [] };
  const days = row.state_end_day, times = row.state_end_time;
  if (!integers(days) || !integers(times) || days.length !== row.state.length || times.length !== row.state.length) {
    return { status: 'incomplete-state-arrays', phases: [], window };
  }
  let cursorDay = window.cursorDayBase, cursorTime = start, hasRunning = false;
  const candidates = [], warnings = [];
  for (let i = 0; i < row.state.length; i++) {
    const stageId = row.state[i];
    hasRunning ||= stageId === 50;
    const nextDay = cursorDay + days[i] * DAY_SECONDS;
    const nextTime = clientDayZero(nextDay, value) + times[i];
    candidates.push(phase(stageId, cursorTime, nextTime, 'client-table-state'));
    if (nextTime < cursorTime) warnings.push({ kind: 'end-before-start', stageId });
    if (nextTime === cursorTime) warnings.push({ kind: 'zero-second-state', stageId });
    cursorDay = nextDay;
    cursorTime = nextTime;
  }
  const invalid = [];
  if (cursorTime > end) invalid.push('last-state-after-activity-end');
  if (hasRunning && cursorTime !== end) invalid.push('running-present-but-final-end-mismatch');
  if (!hasRunning && (row.state.at(-1) > 50 || cursorTime === end)) invalid.push('no-running-and-no-valid-running-tail');
  if (invalid.length) return { status: 'client-rejects-configuration', phases: [], window,
    candidatePhases: candidates, validationIssues: invalid, warnings };
  if (!hasRunning) candidates.push(phase(50, cursorTime, end, 'no-running-configured-tail'));
  return { status: 'client-table-states', window, phases: [before, ...candidates, after], warnings };
}
