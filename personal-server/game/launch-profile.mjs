import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { mergeRelicLoginContainer, RELIC_ACTIVITY_LOGIN_MODULE_ID } from './relic-divine-login.mjs';

export const ACTIVITY_LOGIN_MODULE_ID = 92;

function timestamp(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${label} must be a nonnegative integer timestamp`);
  return number;
}

function shiftTimestamp(value, offsetSeconds, label) {
  if (value == null) return value;
  const current = timestamp(value, label);
  const shifted = current > 0 ? current + offsetSeconds : current;
  timestamp(shifted, label);
  return typeof value === 'string' ? String(shifted) : shifted;
}

function shiftFields(row, fields, offsetSeconds, label) {
  if (!row || typeof row !== 'object') return;
  for (const field of fields) {
    if (row[field] != null) row[field] = shiftTimestamp(row[field], offsetSeconds, `${label}.${field}`);
  }
}

function shiftActivityLogin(entry, codec, offsetSeconds) {
  let activity;
  try {
    activity = codec.unpack('pb_act_login', rawBinary(entry));
  } catch (error) {
    throw new Error(`Launch activity login module cannot be decoded: ${error.message}`);
  }
  activity.act_list ??= [];
  activity.act_parallel_list ??= [];
  activity.act_custom_list ??= [];

  let customWindows = 0;
  for (const custom of activity.act_custom_list) {
    shiftFields(custom, ['start_time', 'end_time'], offsetSeconds, `activity ${custom.act_id} custom window`);
    customWindows++;
  }

  let stateWindows = 0;
  const states = [
    ...activity.act_list.map(row => row?.state_data).filter(Boolean),
    ...activity.act_parallel_list.flatMap(group => group?.states_data ?? [])
  ];
  for (const state of states) {
    for (const history of state.history_time ?? []) {
      shiftFields(history, ['enter_time'], offsetSeconds, `activity ${state.act_id} state history`);
      stateWindows++;
    }
  }
  return { activity, customWindows, stateWindows };
}

function shiftActFrameLogin(entry, codec, offsetSeconds) {
  if (!entry) throw new Error('Launch act-frame login module is missing');
  let merged;
  try {
    merged = mergeRelicLoginContainer({ codec, entry });
  } catch (error) {
    throw new Error(`Launch act-frame login module cannot be decoded: ${error.message}`);
  }

  let playerRows = 0, playerHistory = 0, serverRows = 0, stageWindows = 0;
  for (const row of merged.player.data_list ?? []) {
    const stage = row?.act_stage;
    shiftFields(stage, ['start_time', 'end_time'], offsetSeconds, `activity ${stage?.act_id} player stage`);
    for (const history of stage?.history_time ?? []) {
      shiftFields(history, ['enter_time'], offsetSeconds, `activity ${stage.act_id} player stage history`);
      playerHistory++;
    }
    playerRows++;
  }
  for (const row of merged.server.act_stage_list ?? []) {
    shiftFields(row, ['start_time', 'end_time'], offsetSeconds, `activity ${row.act_id} server stage`);
    for (const stage of row.stage_time_list ?? []) {
      shiftFields(stage, ['start_time', 'end_time'], offsetSeconds, `activity ${row.act_id} stage window`);
      stageWindows++;
    }
    serverRows++;
  }

  const values = [...merged.values];
  values[0] = serializedBinary(codec.pack('pb_act_role_login', merged.player));
  values[1] = serializedBinary(codec.pack('pb_act_server_data', merged.server));
  return { values, playerRows, playerHistory, serverRows, stageWindows };
}

/**
 * Rebases only the absolute activity timestamps captured in the login
 * template. Relative table schedules already derive from serverOpenedAt.
 */
export function relocateLaunchActivityWindows({ modules, codec, activityWindowAnchor, serverOpenedAt }) {
  const anchor = timestamp(activityWindowAnchor, 'activityWindowAnchor');
  const openedAt = timestamp(serverOpenedAt, 'serverOpenedAt');
  if (!(anchor > 0 && openedAt > 0)) throw new Error('Launch activity timestamps must be positive');
  if (anchor > openedAt) throw new Error('activityWindowAnchor must not be later than serverOpenedAt');
  if (!(modules instanceof Map) || typeof codec?.pack !== 'function' || typeof codec?.unpack !== 'function') {
    throw new Error('Launch profile relocation requires login modules and a game codec');
  }

  const offsetSeconds = openedAt - anchor;
  const shifted = new Map(modules);
  const activity = shiftActivityLogin(shifted.get(ACTIVITY_LOGIN_MODULE_ID), codec, offsetSeconds);
  shifted.set(ACTIVITY_LOGIN_MODULE_ID, serializedBinary(codec.pack('pb_act_login', activity.activity)));

  const actFrame = shiftActFrameLogin(shifted.get(RELIC_ACTIVITY_LOGIN_MODULE_ID), codec, offsetSeconds);
  shifted.set(RELIC_ACTIVITY_LOGIN_MODULE_ID, { value: actFrame.values, improper: false });

  return {
    modules: shifted,
    activityWindowAnchor: anchor,
    serverOpenedAt: openedAt,
    offsetSeconds,
    counts: {
      customWindows: activity.customWindows,
      activityStates: activity.stateWindows,
      playerRows: actFrame.playerRows,
      playerHistory: actFrame.playerHistory,
      serverRows: actFrame.serverRows,
      stageWindows: actFrame.stageWindows
    }
  };
}
