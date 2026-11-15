import { gameDay, naturalDay as dayZero } from '../game/time.mjs';

export const R1_ACTIVITY_BASELINE = 'R1-20261115';
const DAY_SECONDS = 86400;

const SPECIFICATIONS = Object.freeze([
  {
    actId: 175001,
    version: 1,
    scope: 'server',
    occurrenceId: 'R1-DYN-175001/first',
    parentActId: 174001,
    periodNo: 1
  },
  {
    actId: 1036008,
    version: 3,
    scope: 'cross-group',
    occurrenceId: 'R1-DYN-1036008/first',
    openingDay: 79,
    periodNo: 1
  },
  {
    actId: 1037001,
    version: 10,
    scope: 'cross-group',
    occurrenceId: 'R1-DYN-1037001/first',
    openingDay: 29,
    maximumNewInstanceOpeningDay: 90,
    dreamTrialFamily: 'dream-trial-war-zone',
    periodNo: 1
  },
  {
    actId: 1037002,
    version: 11,
    scope: 'cross-group',
    occurrenceId: 'R1-DYN-1037002/first',
    openingDay: 90,
    dreamTrialFamily: 'dream-trial-war-zone',
    periodNo: 1
  }
]);

function integer(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`${field} must be a positive integer`);
  return number;
}

function nonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${field} must be a non-negative integer`);
  return number;
}

function rowFor(tables, actId) {
  const row = tables?.ActFrameAct?.get(Number(actId)) ?? tables?.Activity?.get(Number(actId));
  if (!row) throw new Error(`Explicit activity occurrence ${actId} is missing from the shipped tables`);
  return row;
}

function configuredEnd(row, start) {
  const durationDays = nonNegativeInteger(row.duration_day, `activity ${row.tid ?? ''} duration_day`);
  const endTime = nonNegativeInteger(row.end_time, `activity ${row.tid ?? ''} end_time`);
  return dayZero(start + durationDays * DAY_SECONDS) + endTime;
}

export function explicitStageWindows(row, start, end) {
  if (!Array.isArray(row?.stage) || row.stage.length === 0) {
    return [{ stageId: 50, start, end, source: 'r1-explicit-whole-window' }];
  }
  const days = row.stage_duration_day;
  const endTimes = row.stage_end_time;
  if (![days, endTimes].every(list => Array.isArray(list)
    && list.length === row.stage.length && list.every(value => Number.isSafeInteger(Number(value))))) {
    throw new Error(`Activity ${row.tid ?? ''} has incomplete explicit stage arrays`);
  }
  return row.stage.map((stageId, index) => {
    let previousDays = 0;
    let previousEnd = 0;
    for (let prior = 0; prior < index; prior += 1) {
      previousDays += Number(days[prior]);
      previousEnd = Number(endTimes[prior]);
    }
    let stageStart = start + previousDays * DAY_SECONDS;
    if (previousEnd > 0) stageStart = dayZero(stageStart) + previousEnd;
    const stageEnd = dayZero(stageStart + Number(days[index]) * DAY_SECONDS) + Number(endTimes[index]);
    if (!(stageEnd > stageStart)) throw new Error(`Activity ${row.tid ?? ''} stage ${stageId} has an invalid window`);
    return { stageId: Number(stageId), start: stageStart, end: stageEnd, source: 'client-fallback' };
  });
}

function firstBusinessDayAtOrAfter(value) {
  const begin = gameDay(value);
  return begin < value ? begin + DAY_SECONDS : begin;
}

export function r1FirstBusinessDayAtOrAfter(value) {
  const timestamp = integer(value, 'value');
  return firstBusinessDayAtOrAfter(timestamp);
}

export function r1GroupOpeningDay(now, masterOpenedAt) {
  const current = integer(now, 'now');
  const opened = integer(masterOpenedAt, 'masterOpenedAt');
  if (current < opened) return 0;
  return Math.floor((gameDay(current) - gameDay(opened)) / DAY_SECONDS) + 1;
}

function deferredStart(candidate, prior) {
  if (!prior || prior.end <= candidate) return candidate;
  return firstBusinessDayAtOrAfter(prior.end);
}

export function resolveR1ActivityOccurrences({
  tables,
  serverId,
  serverOpenedAt,
  realmId = String(serverId),
  groupId = `r1-local-singleton:${serverId}`
}) {
  const localServerId = integer(serverId, 'serverId');
  const masterOpenedAt = integer(serverOpenedAt, 'serverOpenedAt');
  const normalizedRealmId = String(realmId ?? '').trim();
  const normalizedGroupId = String(groupId ?? '').trim();
  if (!normalizedRealmId) throw new Error('realmId is required');
  if (!normalizedGroupId) throw new Error('groupId is required');
  const group = Object.freeze({
    groupId: normalizedGroupId,
    realmId: normalizedRealmId,
    kind: 'r1-local-singleton',
    masterServerId: localServerId,
    masterOpenedAt,
    memberServerIds: Object.freeze([localServerId])
  });
  const priorDream = new Map();

  return SPECIFICATIONS.map(specification => {
    const row = rowFor(tables, specification.actId);
    const version = integer(row.version, `activity ${specification.actId} version`);
    if (version !== specification.version) {
      throw new Error(`Activity ${specification.actId} version ${version} does not match R1 version ${specification.version}`);
    }

    let start;
    let end;
    let parentActId = null;
    if (specification.parentActId) {
      const parent = rowFor(tables, specification.parentActId);
      const parentStart = integer(parent.world_time, `activity ${specification.parentActId} world_time`);
      start = parentStart;
      end = configuredEnd({ ...parent, tid: specification.parentActId }, parentStart);
      parentActId = specification.parentActId;
    } else {
      const configuredDay = Number(row.time_fun_args?.[0]);
      if (configuredDay !== specification.openingDay) {
        throw new Error(`Activity ${specification.actId} opening day ${configuredDay} does not match R1 day ${specification.openingDay}`);
      }
      start = gameDay(masterOpenedAt) + (specification.openingDay - 1) * DAY_SECONDS;
      if (specification.dreamTrialFamily) {
        start = deferredStart(start, priorDream.get(specification.dreamTrialFamily));
      }
      end = configuredEnd({ ...row, tid: specification.actId }, start);
    }
    const stages = specification.parentActId
      ? [{ stageId: 50, start, end, source: 'r1-explicit-server-stage-override' }]
      : explicitStageWindows(row, start, end);
    if (stages.at(-1)?.end !== end) throw new Error(`Activity ${specification.actId} stages do not close on its overall end`);
    if (specification.dreamTrialFamily) {
      priorDream.set(specification.dreamTrialFamily, { start, end });
    }
    const scopeId = specification.scope === 'server' ? String(localServerId) : normalizedGroupId;
    const openingGroupDay = specification.parentActId ? 1 : r1GroupOpeningDay(start, masterOpenedAt);
    const instanceKey = `${R1_ACTIVITY_BASELINE}/${specification.scope}/${encodeURIComponent(scopeId)}`
      + `/${specification.actId}/${version}/${specification.occurrenceId.split('/').at(-1)}/${start}`;
    return Object.freeze({
      baseline: R1_ACTIVITY_BASELINE,
      actId: specification.actId,
      version,
      scope: specification.scope,
      scopeId,
      occurrenceId: specification.occurrenceId,
      instanceKey,
      periodNo: specification.periodNo,
      parentActId,
      automatedRecurrence: false,
      explicitOccurrence: true,
      openingGroupDay,
      maximumNewInstanceOpeningDay: specification.maximumNewInstanceOpeningDay ?? null,
      group,
      start,
      end,
      kind: 'explicit-occurrence',
      stages: Object.freeze(stages.map(stage => Object.freeze(stage)))
    });
  });
}
