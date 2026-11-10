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

function recurringAllOpenWindow(startValue, endValue, at) {
  const start = seconds(startValue);
  const end = seconds(endValue);
  if (!(start > 0 && end > start) || !Number.isSafeInteger(at)) return null;
  const duration = end - start;
  const cycle = Math.floor((at - start) / duration);
  const cycleStart = start + cycle * duration;
  return { start: cycleStart, end: cycleStart + duration };
}

function alignedAllOpenWindow(configuredWindow, at) {
  if (!configuredWindow) return null;
  const start = seconds(configuredWindow.start);
  const end = seconds(configuredWindow.end);
  if (!(start > 0 && end > start) || !Number.isSafeInteger(at)) return null;

  // ActivityTimeUtil derives the table state end from the start day, while the
  // custom period separately decides whether the activity is open. Repeating
  // an arbitrary captured start can put that derived end before the custom end;
  // once login passes it, module 92 aborts with "Time Config Error". Keep the
  // table-defined time-of-day phase and move the full period to the current day.
  const phase = start - dayZero(start);
  let currentStart = dayZero(at) + phase;
  if (currentStart > at) currentStart -= DAY_SECONDS;
  const window = { start: currentStart, end: currentStart + end - start };
  return at >= window.start && at < window.end ? window : null;
}

function sameAllOpenActivityBatch(left, right) {
  if (!left || !right) return false;
  const worldTime = seconds(left.world_time);
  return worldTime > 0
    && seconds(right.world_time) === worldTime
    && Math.max(1, Number(left.duration_day) || 1) === Math.max(1, Number(right.duration_day) || 1)
    && (Number(left.end_time) || 0) === (Number(right.end_time) || 0)
    && (Number(left.server_day_limit) || 0) === (Number(right.server_day_limit) || 0);
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
      const customStartTimes = new Map();
      for (const custom of activity.act_custom_list) {
        const config = activityConfig(tables, Number(custom.act_id));
        const configuredWindow = activityWindow(config, openedAt);
        const window = alignedAllOpenWindow(configuredWindow, at)
          ?? recurringAllOpenWindow(custom.start_time, custom.end_time, at)
          ?? recurringAllOpenWindow(configuredWindow?.start, configuredWindow?.end, at)
          ?? (() => {
            const elapsed = Math.max(0, at - openedAt);
            const cycle = Math.floor(elapsed / ALL_OPEN_LOGIN_WINDOW_SECONDS);
            const start = openedAt + cycle * ALL_OPEN_LOGIN_WINDOW_SECONDS;
            return { start, end: start + ALL_OPEN_LOGIN_WINDOW_SECONDS };
          })();
        // ActivityTimeUtil.GetInitEndBeginDayCfgTime applies act_custom_list
        // before the ActivityTable schedule even for ACT_TYPE_TABLE_CONFIG.
        // Zero is a concrete epoch, so 0/0 makes the client treat an all-open
        // activity as ended. Configuration-backed periods must keep their
        // day-relative start phase so the client's computed state end remains
        // inside the custom window.
        custom.start_time = window.start;
        custom.end_time = window.end;
        customStartTimes.set(Number(custom.act_id), window.start);
      }
      for (const entry of activity.act_list) {
        if (entry.state_data) {
          entry.state_data.cur_state_id = 50;
          entry.state_data.history_time = [{
            state_id: 50,
            enter_time: String(customStartTimes.get(Number(entry.state_data.act_id)) ?? openedAt)
          }];
        }
      }
      for (const group of activity.act_parallel_list) {
        for (const state of group.states_data ?? []) {
          state.cur_state_id = 50;
          state.history_time = [{
            state_id: 50,
            enter_time: String(customStartTimes.get(Number(state.act_id)) ?? openedAt)
          }];
        }
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

  function normalizeActFrameLogin(player, server, at = currentSeconds(), options = {}) {
    const current = seconds(at);
    const result = { mode, adjusted: 0, activityIds: [] };
    if (!player || !server || !Number.isSafeInteger(current) || current <= 0) return result;
    player.data_list ??= [];
    server.act_stage_list ??= [];
    const playerByTid = new Map(player.data_list
      .map(row => [Number(row?.act_stage?.act_id), row])
      .filter(([id]) => Number.isSafeInteger(id) && id > 0));
    const serverByTid = new Map(server.act_stage_list
      .map(row => [Number(row?.act_id), row])
      .filter(([id]) => Number.isSafeInteger(id) && id > 0));

    function upsertLoginRow(id, config, start, end) {
      if (!config) return false;
      const type = Number(config.type ?? config.func) || 0;
      let serverRow = serverByTid.get(id);
      if (!serverRow) {
        serverRow = {
          act_id: id,
          type,
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: 50,
          is_pause: false,
          loop_count: 0,
          stage_time_list: [{ stage_id: 50, start_time: String(start), end_time: String(end) }]
        };
        server.act_stage_list.push(serverRow);
        serverByTid.set(id, serverRow);
      } else {
        Object.assign(serverRow, {
          act_id: id,
          type,
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: 50,
          is_pause: false,
          loop_count: 0,
          stage_time_list: [{ stage_id: 50, start_time: String(start), end_time: String(end) }]
        });
      }
      let playerRow = playerByTid.get(id);
      if (!playerRow) {
        playerRow = {
          act_stage: {
            act_id: id,
            start_time: String(start),
            end_time: String(end),
            cur_stage_id: 50,
            loop_count: 0,
            history_time: [{ stage_id: 50, enter_time: String(start) }]
          },
          module_login_data: Buffer.alloc(0)
        };
        player.data_list.push(playerRow);
        playerByTid.set(id, playerRow);
      } else {
        playerRow.act_stage ??= {};
        Object.assign(playerRow.act_stage, {
          act_id: id,
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: 50,
          loop_count: 0,
          history_time: [{ stage_id: 50, enter_time: String(start) }]
        });
      }
      return true;
    }

    // A parent draw activity can own a paid-gift and exchange-shop row whose
    // captured absolute window has already expired. The HundredDraw version
    // table supplies the authoritative parent/child mapping, so materialize
    // those exact rows with the running parent's window in schedule mode too.
    const explicitGroups = (options.activityGroups ?? [])
      .map(group => ({
        actId: Number(group?.actId),
        startTime: Number(group?.startTime),
        endTime: Number(group?.endTime),
        companionIds: [...new Set((group?.companionIds ?? []).map(Number))]
          .filter(id => Number.isSafeInteger(id) && id > 0)
      }))
      .filter(group => Number.isSafeInteger(group.actId) && group.actId > 0);
    if (mode === 'schedule') {
      const explicitIds = new Set();
      for (const group of explicitGroups) {
        const parentConfig = activityConfig(tables, group.actId);
        const configuredWindow = activityWindow(parentConfig, openedAt);
        const window = Number.isSafeInteger(group.startTime) && group.startTime > 0
          && Number.isSafeInteger(group.endTime) && group.endTime > group.startTime
          ? { start: group.startTime, end: group.endTime }
          : configuredWindow;
        if (!parentConfig || !window || current < window.start || current >= window.end) continue;
        for (const id of [group.actId, ...group.companionIds]) {
          const config = activityConfig(tables, id);
          if (upsertLoginRow(id, config, window.start, window.end)) explicitIds.add(id);
        }
      }
      result.activityIds = [...explicitIds].sort((left, right) => left - right);
      result.adjusted = result.activityIds.length;
      return result;
    }

    // Some activity families publish their state in module 92 while the
    // reference act-frame snapshot has no matching module-183 stage row. In
    // all-open mode materialize those rows as well; otherwise the client can
    // list the activity but Activity:IsValid() rejects it before opening.
    const materializeIds = new Set((options.activityIds ?? [])
      .map(Number)
      .filter(id => Number.isSafeInteger(id) && id > 0));
    for (const id of materializeIds) {
      if (serverByTid.has(id) && playerByTid.has(id)) continue;
      const config = activityConfig(tables, id);
      const type = Number(config?.type) || 0;
      if (!config || type <= 0) continue;
      const window = activityWindow(config, openedAt);
      const start = Math.min(window?.start ?? openedAt, current);
      const end = Math.max(window?.end ?? current + ALL_OPEN_LOGIN_WINDOW_SECONDS, current + ALL_OPEN_LOGIN_WINDOW_SECONDS);
      if (!serverByTid.has(id)) {
        const serverRow = {
          act_id: id,
          type,
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: 50,
          is_pause: false,
          loop_count: 0,
          stage_time_list: [{ stage_id: 50, start_time: String(start), end_time: String(end) }]
        };
        server.act_stage_list.push(serverRow);
        serverByTid.set(id, serverRow);
      }
      if (!playerByTid.has(id)) {
        const playerRow = {
          act_stage: {
            act_id: id,
            start_time: String(start),
            end_time: String(end),
            cur_stage_id: 50,
            loop_count: 0,
            history_time: [{ stage_id: 50, enter_time: String(start) }]
          },
          module_login_data: Buffer.alloc(0)
        };
        player.data_list.push(playerRow);
        playerByTid.set(id, playerRow);
      }
    }

    for (const group of explicitGroups) {
      const parentConfig = activityConfig(tables, group.actId);
      const parentWindow = activityWindow(parentConfig, openedAt);
      const start = Math.min(parentWindow?.start ?? openedAt, current);
      const end = Math.max(parentWindow?.end ?? current + ALL_OPEN_LOGIN_WINDOW_SECONDS, current + ALL_OPEN_LOGIN_WINDOW_SECONDS);
      for (const id of [group.actId, ...group.companionIds]) {
        const config = activityConfig(tables, id);
        if (!config) continue;
        upsertLoginRow(id, config, start, end);
        if (!result.activityIds.includes(id)) result.activityIds.push(id);
      }
    }

    // The login snapshot only contains the activities the reference account
    // happened to have. Paid-shop and exchange-shop activities are separate
    // ActFrame rows from their parent event, so a parent can be present while
    // its 182/184 children are missing. The client then falls back to the
    // shipped table schedule and reports the event as ended. In all-open mode
    // materialize the missing 182/184 rows from the same event batch, using the
    // same extended login window as every other stored activity.
    const batchConfigs = [...serverByTid.keys()]
      .map(id => activityConfig(tables, id))
      .filter(config => config && seconds(config.world_time) > 0);
    const companionIds = new Set();
    for (const parent of batchConfigs) {
      for (const [actId, candidate] of tables?.ActFrameAct ?? []) {
        if (![182, 184].includes(Number(candidate?.type))) continue;
        if (sameAllOpenActivityBatch(parent, candidate)) companionIds.add(Number(actId));
      }
    }
    for (const id of companionIds) {
      if (serverByTid.has(id)) continue;
      const config = activityConfig(tables, id);
      const window = activityWindow(config, openedAt);
      const start = Math.min(window?.start ?? openedAt, current);
      const end = Math.max(window?.end ?? current + ALL_OPEN_LOGIN_WINDOW_SECONDS, current + ALL_OPEN_LOGIN_WINDOW_SECONDS);
      const serverRow = {
        act_id: id,
        type: Number(config?.type) || 0,
        start_time: String(start),
        end_time: String(end),
        cur_stage_id: 50,
        is_pause: false,
        loop_count: 0,
        stage_time_list: [{ stage_id: 50, start_time: String(start), end_time: String(end) }]
      };
      const playerRow = {
        act_stage: {
          act_id: id,
          start_time: String(start),
          end_time: String(end),
          cur_stage_id: 50,
          loop_count: 0,
          history_time: [{ stage_id: 50, enter_time: String(start) }]
        },
        module_login_data: Buffer.alloc(0)
      };
      server.act_stage_list.push(serverRow);
      serverByTid.set(id, serverRow);
      player.data_list.push(playerRow);
      playerByTid.set(id, playerRow);
    }

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
