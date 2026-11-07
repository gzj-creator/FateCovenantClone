const DAY_SECONDS = 86400;
const RESET_OFFSET_SECONDS = 8 * 3600;
const FISHING_ACT_FIRST = 1074001;
const FISHING_ACT_LAST = 1074011;
const ALL_OPEN_LOGIN_WINDOW_SECONDS = 365 * DAY_SECONDS;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

export function dayZero(value) {
  const timestamp = seconds(value);
  return Math.floor((timestamp + RESET_OFFSET_SECONDS) / DAY_SECONDS) * DAY_SECONDS - RESET_OFFSET_SECONDS;
}

export function serverDayNumber(serverOpenedAt, at) {
  const opened = seconds(serverOpenedAt);
  if (!opened) return 0;
  return Math.floor((seconds(at) - opened) / DAY_SECONDS) + 1;
}

function activityConfig(tables, actId) {
  return tables?.ActFrameAct?.get(actId) ?? tables?.Activity?.get(actId) ?? null;
}

function serverEligibility(config, serverOpenedAt, at) {
  if (!config) return true;
  const minimumDay = Math.max(
    0,
    Number(config.join_server_day) || 0,
    Number(config.server_day_limit) || 0
  );
  if (minimumDay > 0 && serverDayNumber(serverOpenedAt, at) < minimumDay) return false;

  const openedAt = seconds(serverOpenedAt);
  const minimumOpenTime = seconds(config.server_mini_open_limited);
  const maximumOpenTime = seconds(config.server_max_open_limited);
  if (minimumOpenTime > 0 && openedAt < minimumOpenTime) return false;
  if (maximumOpenTime > 0 && openedAt > maximumOpenTime) return false;
  return true;
}

function customActivity(activity, actId) {
  return (activity?.act_custom_list ?? []).find(row => Number(row.act_id) === actId) ?? null;
}

function isCustomRunning(custom, at) {
  if (!custom) return null;
  const start = Number(custom.start_time) || 0;
  const end = Number(custom.end_time) || 0;
  if (start > 0 && at < start) return false;
  if (end > 0 && at >= end) return false;
  return true;
}

export function activityWindow(config, serverOpenedAt) {
  if (!config) return null;
  const durationDays = Math.max(1, Number(config.duration_day) || 1);
  const endTime = Number(config.end_time) || 0;
  const worldTime = seconds(config.world_time);
  const relativeDay = Number(config.refer_day ?? config.server_day ?? 0);
  const relativeStart = Number(config.refer_start_time ?? config.server_start_time ?? 0);

  if (relativeDay > 0) {
    if (!seconds(serverOpenedAt)) return null;
    const firstDay = dayZero(serverOpenedAt) + (relativeDay - 1) * DAY_SECONDS;
    return {
      start: firstDay + relativeStart,
      end: dayZero(firstDay + durationDays * DAY_SECONDS) + endTime,
      kind: 'server-day'
    };
  }

  if (worldTime > 0) {
    return {
      start: worldTime,
      end: dayZero(dayZero(worldTime) + durationDays * DAY_SECONDS) + endTime,
      kind: 'world-time'
    };
  }

  if (relativeStart > 0 && seconds(serverOpenedAt)) {
    const firstDay = dayZero(serverOpenedAt);
    return {
      start: firstDay + relativeStart,
      end: dayZero(firstDay + durationDays * DAY_SECONDS) + endTime,
      kind: 'server-time'
    };
  }

  return null;
}

export function createActivityCalendar({ tables, serverOpenedAt, mode = 'schedule', currentFishingActivityId, now = Date.now }) {
  const openedAt = seconds(serverOpenedAt);
  if (!openedAt) throw new Error('A valid server opening time is required');
  if (!['schedule', 'all-open'].includes(mode)) throw new Error(`Unsupported activity calendar mode: ${mode}`);
  const currentSeconds = () => seconds(now());
  const configuredFishingIds = () => {
    const result = [];
    for (let actId = FISHING_ACT_FIRST; actId <= FISHING_ACT_LAST; actId++) {
      if (activityConfig(tables, actId)) result.push(actId);
    }
    return result;
  };
  const allOpenFishingActivityId = mode === 'all-open'
    ? Number(currentFishingActivityId ?? configuredFishingIds().at(-1))
    : null;
  if (mode === 'all-open') {
    if (!Number.isSafeInteger(allOpenFishingActivityId) || allOpenFishingActivityId < FISHING_ACT_FIRST || allOpenFishingActivityId > FISHING_ACT_LAST) {
      throw new Error('An all-open activity calendar requires a supported currentFishingActivityId');
    }
    if (!activityConfig(tables, allOpenFishingActivityId)) throw new Error(`Fishing activity ${allOpenFishingActivityId} is not configured`);
  }

  function isScheduledActivity(actId, stateData, activity, at) {
    const id = Number(actId);
    if (!Number.isSafeInteger(id) || id <= 0) return false;
    if (stateData && Number(stateData.cur_state_id ?? 50) !== 50) return false;

    const custom = customActivity(activity, id);
    if (custom) return isCustomRunning(custom, at);

    const config = activityConfig(tables, id);
    if (!serverEligibility(config, openedAt, at)) return false;
    const window = activityWindow(config, openedAt);
    if (window) return at >= window.start && at < window.end;
    return Number(stateData?.cur_state_id ?? 50) === 50;
  }

  function isActivityRunning(actId, stateData, activity, at = currentSeconds()) {
    const id = Number(actId);
    if (mode === 'all-open') return Number.isSafeInteger(id) && id > 0;
    if ((activity?.act_pause_list ?? []).map(Number).includes(id)) return false;
    return isScheduledActivity(id, stateData, activity, at);
  }

  function filterLoginActivity(activity, at = currentSeconds()) {
    const retained = new Set();
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    activity.act_pause_list ??= [];
    activity.act_custom_list ??= [];
    if (mode === 'all-open') {
      for (const entry of activity.act_list) {
        if (entry.state_data) {
          entry.state_data.cur_state_id = 50;
          entry.state_data.history_time = [{ state_id: 50, enter_time: String(openedAt) }];
        }
      }
      for (const group of activity.act_parallel_list) {
        for (const state of group.states_data ?? []) {
          state.cur_state_id = 50;
          state.history_time = [{ state_id: 50, enter_time: String(openedAt) }];
        }
      }
      for (const custom of activity.act_custom_list) {
        custom.start_time = 0;
        custom.end_time = 0;
      }
      activity.act_pause_list = [];
      return activity;
    }
    activity.act_list = (activity.act_list ?? []).filter(entry => {
      const actId = Number(entry.state_data?.act_id);
      const running = isActivityRunning(actId, entry.state_data, activity, at);
      if (running) retained.add(actId);
      return running;
    });
    activity.act_parallel_list = (activity.act_parallel_list ?? []).flatMap(group => {
      const states = (group.states_data ?? []).filter(state => {
        const actId = Number(state.act_id);
        const running = isActivityRunning(actId, state, activity, at);
        if (running) retained.add(actId);
        return running;
      });
      return states.length ? [{ ...group, states_data: states }] : [];
    });
    activity.act_pause_list = (activity.act_pause_list ?? []).filter(actId => (
      isScheduledActivity(Number(actId), null, activity, at)
    ));
    activity.act_custom_list = (activity.act_custom_list ?? []).filter(custom => (
      retained.has(Number(custom.act_id)) && isCustomRunning(custom, at) === true
    ));
    return activity;
  }

  function activeFishingActivities(at = currentSeconds(), activity = null) {
    if (mode === 'all-open') {
      const config = activityConfig(tables, allOpenFishingActivityId);
      return [{ actId: allOpenFishingActivityId, config, window: activityWindow(config, openedAt) }];
    }
    const result = [];
    for (let actId = FISHING_ACT_FIRST; actId <= FISHING_ACT_LAST; actId++) {
      if (!isActivityRunning(actId, null, activity, at)) continue;
      const config = activityConfig(tables, actId);
      result.push({ actId, config, window: activityWindow(config, openedAt) });
    }
    return result;
  }

  function hasLoginState(activity, actId) {
    return (activity.act_list ?? []).some(entry => Number(entry.state_data?.act_id) === actId)
      || (activity.act_parallel_list ?? []).some(group => (group.states_data ?? []).some(state => Number(state.act_id) === actId));
  }

  function applyLoginSchedule(activity, at = currentSeconds()) {
    const pausedIds = new Set(mode === 'all-open' ? [] : (activity.act_pause_list ?? []).map(Number));
    filterLoginActivity(activity, at);
    const active = activeFishingActivities(at, activity);
    for (const { actId, window } of active) {
      if (pausedIds.has(actId)) continue;
      if (hasLoginState(activity, actId)) continue;
      activity.act_list.push({
        state_data: {
          act_id: actId,
          cur_state_id: 50,
          history_time: [{ state_id: 50, enter_time: Number(window?.start ?? openedAt) }]
        },
        module_login_data: Buffer.alloc(0)
      });
    }
    // Keep administrative pauses so a later login cannot silently re-enable an activity.
    activity.act_pause_list = mode === 'all-open'
      ? []
      : [...new Set([...activity.act_pause_list.map(Number), ...pausedIds])]
        .filter(id => isScheduledActivity(id, null, activity, at));
    return {
      mode,
      fishingActivityIds: active.filter(entry => !pausedIds.has(entry.actId)).map(entry => entry.actId)
    };
  }

  function normalizeActFrameLogin(player, server, at = currentSeconds()) {
    const current = seconds(at);
    const result = { mode, adjusted: 0, activityIds: [] };
    if (mode !== 'all-open' || !player || !server || !Number.isSafeInteger(current) || current <= 0) return result;
    player.data_list ??= [];
    server.act_stage_list ??= [];
    const playerByTid = new Map(player.data_list
      .map(row => [Number(row?.act_stage?.act_id), row])
      .filter(([id]) => Number.isSafeInteger(id) && id > 0));
    const serverByTid = new Map(server.act_stage_list
      .map(row => [Number(row?.act_id), row])
      .filter(([id]) => Number.isSafeInteger(id) && id > 0));

    for (const [id, serverRow] of serverByTid) {
      const playerRow = playerByTid.get(id);
      const existingStart = Math.min(
        seconds(serverRow.start_time) || Number.MAX_SAFE_INTEGER,
        seconds(playerRow?.act_stage?.start_time) || Number.MAX_SAFE_INTEGER
      );
      const start = Math.min(existingStart === Number.MAX_SAFE_INTEGER ? openedAt : existingStart, current);
      const existingEnd = Math.max(seconds(serverRow.end_time), seconds(playerRow?.act_stage?.end_time));
      const end = Math.max(current + ALL_OPEN_LOGIN_WINDOW_SECONDS, existingEnd, current + 1);
      const stage = { stage_id: 50, start_time: String(start), end_time: String(end) };
      serverRow.act_id = id;
      serverRow.start_time = String(start);
      serverRow.end_time = String(end);
      serverRow.cur_stage_id = 50;
      serverRow.is_pause = false;
      serverRow.loop_count = 0;
      serverRow.stage_time_list = [stage];
      if (playerRow) {
        playerRow.act_stage ??= {};
        playerRow.act_stage.act_id = id;
        playerRow.act_stage.start_time = String(start);
        playerRow.act_stage.end_time = String(end);
        playerRow.act_stage.cur_stage_id = 50;
        playerRow.act_stage.loop_count = 0;
        playerRow.act_stage.history_time = [{ stage_id: 50, enter_time: String(start) }];
      }
      result.activityIds.push(id);
    }
    result.adjusted = result.activityIds.length;
    return result;
  }

  return {
    serverOpenedAt: openedAt,
    mode,
    currentSeconds,
    isServerEligible: (actId, at = currentSeconds()) => serverEligibility(activityConfig(tables, Number(actId)), openedAt, at),
    isActivityRunning,
    filterLoginActivity,
    applyLoginSchedule,
    normalizeActFrameLogin,
    activeFishingActivities,
    activeFishingActivityIds(at = currentSeconds(), activity = null) {
      return activeFishingActivities(at, activity).map(entry => entry.actId);
    },
    activeFishingActivityId(at = currentSeconds(), activity = null) {
      return activeFishingActivities(at, activity).at(-1)?.actId ?? null;
    }
  };
}
