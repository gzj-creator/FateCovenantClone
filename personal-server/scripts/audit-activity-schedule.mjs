import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readGameTables } from '../config/game-tables.mjs';
import { loadActivityCalendarConfig } from '../config/activity-calendar-config.mjs';
import { activityDurationDays, activityWindow, dayZero, serverDayNumber } from '../game/activity-calendar.mjs';

const DAY_SECONDS = 86400;

function integer(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function sourceRows(tables, source) {
  return [...tables[source]].map(([key, config]) => ({ key: Number(key), config, source }));
}

function pushError(errors, row, code, message) {
  errors.push({ source: row.source, actId: row.key, code, message });
}

function validateStageDuration(row, errors, counters) {
  const { config } = row;
  const stages = config.stage_duration_day ?? [];
  const totalDuration = integer(config.duration_day);
  if (!stages.length) return;
  counters.stagedActivities++;
  if ((config.stage ?? []).length !== stages.length) {
    pushError(errors, row, 'stage_duration_length', 'stage and stage_duration_day lengths differ');
  }
  let sum = 0;
  for (const value of stages) {
    const days = integer(value);
    if (days == null || days < 0) {
      pushError(errors, row, 'invalid_stage_duration', `invalid stage duration ${JSON.stringify(value)}`);
      return;
    }
    sum += days;
  }
  if (totalDuration != null && sum !== totalDuration) {
    pushError(errors, row, 'stage_duration_sum', `stage durations total ${sum}, duration_day is ${totalDuration}`);
  }
}

function validateActivityState(row, errors) {
  if (row.source !== 'Activity') return;
  const states = row.config.state ?? [];
  const endDays = row.config.state_end_day ?? [];
  const endTimes = row.config.state_end_time ?? [];
  if (!states.length && !endDays.length && !endTimes.length) return;
  if (states.length !== endDays.length || states.length !== endTimes.length) {
    pushError(errors, row, 'state_duration_length', 'state, state_end_day and state_end_time lengths differ');
  }
}

export function auditActivitySchedule({ tables, serverOpenedAt, activityReferenceOpenedAt }) {
  const targetOpenedAt = integer(serverOpenedAt);
  const referenceOpenedAt = integer(activityReferenceOpenedAt);
  if (!(targetOpenedAt > 0)) throw new Error('serverOpenedAt must be a positive integer timestamp');
  if (!(referenceOpenedAt > 0)) throw new Error('activityReferenceOpenedAt must be a positive integer timestamp');

  const errors = [];
  const unresolved = [];
  const collisions = [];
  const windows = [];
  const counters = {
    sourceRows: {},
    resolvedWindows: 0,
    unresolvedWindows: 0,
    stagedActivities: 0,
    explicitZeroDurationActivities: 0,
    oneMinuteWindows: 0,
    startsBeforeOpening: 0,
    runningAtOpening: 0
  };
  const kindCounts = {};
  const all = [];

  for (const source of ['ActFrameAct', 'Activity']) {
    if (!(tables[source] instanceof Map)) throw new Error(`Missing ${source} table`);
    const rows = sourceRows(tables, source);
    counters.sourceRows[source] = rows.length;
    for (const row of rows) {
      all.push(row);
      const configId = integer(row.config.tid);
      if (configId !== row.key) {
        pushError(errors, row, 'id_mismatch', `map key ${row.key} does not match tid ${String(row.config.tid)}`);
      }

      const duration = integer(row.config.duration_day);
      if (row.config.duration_day != null && row.config.duration_day !== '') {
        if (duration == null || duration < 0) {
          pushError(errors, row, 'invalid_duration', `invalid duration_day ${JSON.stringify(row.config.duration_day)}`);
        } else if (duration === 0) {
          counters.explicitZeroDurationActivities++;
        }
      }

      validateStageDuration(row, errors, counters);
      validateActivityState(row, errors);

      const window = activityWindow(row.config, targetOpenedAt, referenceOpenedAt);
      if (!window) {
        counters.unresolvedWindows++;
        unresolved.push({
          source,
          actId: row.key,
          refName: row.config.ref_name ?? '',
          timeFun: Number(row.config.time_fun) || 0,
          reason: Number(row.config.time_fun) > 0 ? 'dynamic-time-function' : 'missing-static-time-config'
        });
        continue;
      }

      counters.resolvedWindows++;
      kindCounts[window.kind] = (kindCounts[window.kind] ?? 0) + 1;
      if (!Number.isSafeInteger(window.start) || !Number.isSafeInteger(window.end) || window.end <= window.start) {
        pushError(errors, row, 'invalid_window', `window ${window.start}..${window.end} is not increasing`);
        continue;
      }

      const worldTime = integer(row.config.world_time);
      if (window.kind === 'server-relative-world') {
        const expectedStart = targetOpenedAt + worldTime - referenceOpenedAt;
        const expectedEnd = dayZero(dayZero(worldTime) + activityDurationDays(row.config) * DAY_SECONDS)
          + (Number(row.config.end_time) || 0) + targetOpenedAt - referenceOpenedAt;
        if (window.start !== expectedStart) {
          pushError(errors, row, 'world_time_rebase', `expected rebased start ${expectedStart}, got ${window.start}`);
        }
        if (window.end !== expectedEnd) {
          pushError(errors, row, 'world_time_end', `expected rebased end ${expectedEnd}, got ${window.end}`);
        }
      } else {
        const relativeDay = integer(row.config.refer_day ?? row.config.server_day) ?? 0;
        const relativeStart = integer(row.config.refer_start_time ?? row.config.server_start_time) ?? 0;
        const firstDay = relativeDay > 0
          ? dayZero(targetOpenedAt) + (relativeDay - 1) * DAY_SECONDS
          : dayZero(targetOpenedAt);
        const expectedStart = firstDay + relativeStart;
        const expectedEnd = dayZero(firstDay + activityDurationDays(row.config) * DAY_SECONDS)
          + (Number(row.config.end_time) || 0);
        if (window.start !== expectedStart) {
          pushError(errors, row, 'server_day_start', `expected server-day start ${expectedStart}, got ${window.start}`);
        }
        if (window.end !== expectedEnd) {
          pushError(errors, row, 'server_day_end', `expected server-day end ${expectedEnd}, got ${window.end}`);
        }
      }

      const durationSeconds = window.end - window.start;
      if (duration === 0 && durationSeconds === 60) counters.oneMinuteWindows++;
      if (window.start < targetOpenedAt) counters.startsBeforeOpening++;
      if (window.start <= targetOpenedAt && targetOpenedAt < window.end) counters.runningAtOpening++;
      windows.push({
        source,
        actId: row.key,
        refName: row.config.ref_name ?? '',
        start: window.start,
        end: window.end,
        startDay: serverDayNumber(targetOpenedAt, window.start),
        endDay: serverDayNumber(targetOpenedAt, window.end),
        durationSeconds,
        kind: window.kind
      });
    }
  }

  const ids = new Map();
  for (const row of all) {
    const sources = ids.get(row.key) ?? [];
    sources.push(row.source);
    ids.set(row.key, sources);
  }
  for (const [actId, sources] of ids) {
    if (sources.length > 1) collisions.push({ actId, sources, selectedSource: 'ActFrameAct' });
  }

  windows.sort((left, right) => left.start - right.start || left.actId - right.actId || left.source.localeCompare(right.source));
  return {
    serverOpenedAt: targetOpenedAt,
    activityReferenceOpenedAt: referenceOpenedAt,
    counters: {
      ...counters,
      totalRows: all.length,
      uniqueIds: ids.size,
      duplicateIds: collisions.length
    },
    kinds: kindCounts,
    errors,
    unresolved,
    collisions,
    windows
  };
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(timestamp * 1000));
}

function printReport(report) {
  const c = report.counters;
  console.log('Activity schedule audit');
  console.log(`openedAt=${formatDate(report.serverOpenedAt)} (${report.serverOpenedAt})`);
  console.log(`referenceOpenedAt=${formatDate(report.activityReferenceOpenedAt)} (${report.activityReferenceOpenedAt})`);
  console.log(`rows=${c.totalRows} unique=${c.uniqueIds} resolved=${c.resolvedWindows} unresolved=${c.unresolvedWindows}`);
  console.log(`ActFrameAct=${c.sourceRows.ActFrameAct} Activity=${c.sourceRows.Activity}`);
  console.log(`stagedActivities=${c.stagedActivities} explicitZeroDay=${c.explicitZeroDurationActivities} oneMinuteWindows=${c.oneMinuteWindows}`);
  console.log(`startsBeforeOpening=${c.startsBeforeOpening} runningAtOpening=${c.runningAtOpening}`);
  console.log(`windowKinds=${JSON.stringify(report.kinds)}`);
  if (report.unresolved.length) {
    console.log('Known dynamic or untimed rows:');
    for (const row of report.unresolved) {
      console.log(`  ${row.source}:${row.actId} ${row.refName} (${row.reason}, time_fun=${row.timeFun})`);
    }
  }
  if (report.collisions.length) {
    console.log('Cross-table ID collisions:');
    for (const collision of report.collisions) {
      console.log(`  ${collision.actId}: ${collision.sources.join(', ')}; selected=${collision.selectedSource}`);
    }
  }
  if (report.errors.length) {
    console.log(`Errors: ${report.errors.length}`);
    for (const error of report.errors) {
      console.log(`  ${error.source}:${error.actId} ${error.code}: ${error.message}`);
    }
  } else {
    console.log('Errors: 0');
  }
  console.log(`Result: ${report.errors.length ? 'FAIL' : 'PASS'}`);
}

function main() {
  const config = loadActivityCalendarConfig();
  const args = process.argv.slice(2);
  const report = auditActivitySchedule({
    tables: readGameTables(),
    serverOpenedAt: config.serverOpenedAt,
    activityReferenceOpenedAt: config.activityReferenceOpenedAt
  });
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  if (report.errors.length) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) main();
