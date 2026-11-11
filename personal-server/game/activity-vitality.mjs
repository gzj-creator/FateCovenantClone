import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

// The generic task activity (ActFrameTable ActType 1003) ships two task groups
// per version. TaskTable.Type 14301 rows are the personal rows and read
// CountStatistics (login module 21) slot 29, dimension 2. TaskTable.Type
// 100701 rows are the server rows: progress_fun 460 is "server active value",
// i.e. the same dimension summed over every role on the realm. TaskActivity
// only asks for that number through 105702, whose request carries no fields.
//
// The personal rows' targets (50..2000) line up with the 200/day daily-task
// vitality ceiling over the ten-day activity window, and the server rows'
// targets (30000..300000) with the same value summed over a realm, so the
// dimension is the accumulated daily-task vitality (pb_daily_task.vitality,
// the client's 活跃值) for the 31-day statistics period.
export const SERVER_VITALITY_PROGRESS_FUN = 460;
export const STATISTICS_MODULE = 21;
export const STATISTICS_DAY_OFFSET_SECONDS = 3 * 3600;

const ROLE_STATISTICS_TYPE = 0;

function fail(message) {
  throw new GameError(5, message);
}

export function roleStatisticsRows(gameTables) {
  return [...(gameTables?.CountStatistics?.values?.() ?? [])]
    .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
}

export function statisticsSlotIndex(gameTables, slot) {
  const wanted = Number(slot);
  if (!Number.isSafeInteger(wanted) || wanted <= 0) fail('Activity vitality statistics slot is not configured');
  return roleStatisticsRows(gameTables).findIndex(row => Number(row.tid) === wanted);
}

// Derives the statistics dimension the task activity family measures. Every
// version must agree; a split configuration would make one global number
// meaningless, so it is reported instead of silently mixing dimensions.
export function activityVitalityStatistic({ tables, gameTables }) {
  let source = null;
  for (const rows of tables?.versions?.values?.() ?? []) {
    for (const task of rows.values()) {
      const typeConfig = gameTables?.TaskType?.get?.(Number(task.type));
      if (!typeConfig) fail(`Task activity task type ${task.type} is not configured`);
      if (Number(typeConfig.progress_type) !== 2) continue;
      const slot = Number(typeConfig.data);
      const ids = (typeConfig.stat_expand ?? []).map(String);
      if (!Number.isSafeInteger(slot) || slot <= 0 || !ids.length) {
        fail(`Task activity task type ${task.type} has no statistics dimension`);
      }
      if (!source) {
        source = { slot, ids };
      } else if (source.slot !== slot || source.ids.length !== ids.length || source.ids.some((id, index) => id !== ids[index])) {
        fail('Task activity versions use different vitality statistics');
      }
    }
  }
  return source;
}

function moduleSlots(payload, roleId) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  fail(`Activity vitality statistics for role ${roleId} are unreadable`);
}

function slotTotal(codec, payload, ids, roleId) {
  if (payload == null) return 0n;
  let bytes;
  try {
    bytes = rawBinary(payload);
  } catch {
    fail(`Activity vitality statistics for role ${roleId} are unreadable`);
  }
  if (!bytes.length) return 0n;
  let data;
  try {
    data = codec.unpack('pb_count_statics_data', bytes);
  } catch {
    fail(`Activity vitality statistics for role ${roleId} are invalid`);
  }
  let total = 0n;
  for (const row of data.list ?? []) {
    if (!ids.has(String(row.id))) continue;
    let value;
    try {
      value = BigInt(row.total ?? 0);
    } catch {
      fail(`Activity vitality statistics for role ${roleId} are invalid`);
    }
    if (value < 0n) fail(`Activity vitality statistics for role ${roleId} are invalid`);
    total += value;
  }
  return total;
}

// Sums the activity vitality dimension over every stored role. A role that has
// never earned activity vitality has no payload and contributes zero, which is
// a normal state rather than a configuration error.
export function readServerVitality({ store, codec, gameTables, statistic }) {
  if (!store?.inspect) throw new Error('Game store is unavailable');
  if (!statistic) return { total: 0, roles: 0, contributors: 0 };
  const index = statisticsSlotIndex(gameTables, statistic.slot);
  if (index < 0) fail(`Activity vitality statistics slot ${statistic.slot} is not configured`);
  const ids = new Set(statistic.ids);
  const rows = store.inspect(db => db.prepare(
    'SELECT role_id,payload_json FROM login_modules WHERE module_id=? ORDER BY role_id'
  ).all(STATISTICS_MODULE));
  let total = 0n;
  let contributors = 0;
  for (const row of rows) {
    let payload;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      fail(`Activity vitality statistics for role ${row.role_id} are unreadable`);
    }
    const roleTotal = slotTotal(codec, moduleSlots(payload, row.role_id)[index + 1], ids, row.role_id);
    if (roleTotal > 0n) contributors += 1;
    total += roleTotal;
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) fail('Activity vitality statistics overflow');
  return { total: Number(total), roles: rows.length, contributors };
}

function addCountList(row, amount, day) {
  const previousDay = Number(row.mod_day ?? 0);
  const list = Array.isArray(row.count_list) ? row.count_list.map(value => String(value)) : [];
  if (previousDay === day && list.length) list[0] = String(BigInt(list[0] ?? 0) + BigInt(amount));
  else if (!list.length) list.push(String(amount));
  else if (day > previousDay + 1) list.unshift(String(amount), ...Array(day - previousDay - 1).fill('0'));
  else list.unshift(String(amount));
  row.count_list = list;
  row.mod_day = String(day);
}

// Records newly earned activity vitality (daily task claims) in the same
// module-21 dimension the activity reads back, mirroring how the recruitment
// service maintains its draw statistics.
export function addActivityVitality({ model, codec, gameTables, statistic, amount, seconds }) {
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  if (!statistic) return null;
  if (statistic.ids.length !== 1) fail('Activity vitality statistics are not configured');
  const index = statisticsSlotIndex(gameTables, statistic.slot);
  if (index < 0) fail(`Activity vitality statistics slot ${statistic.slot} is not configured`);
  const modules = new Map(model.state.modules.value);
  const module = modules.get(STATISTICS_MODULE);
  if (!module || !Array.isArray(module.value)) fail('Activity vitality statistics module is missing');
  const slot = index + 1;
  while (module.value.length <= slot) module.value.push(serializedBinary(Buffer.alloc(0)));
  const current = module.value[slot];
  const bytes = current?.value?.data?.length ? Buffer.from(current.value.data) : Buffer.alloc(0);
  let data;
  try {
    data = bytes.length ? codec.unpack('pb_count_statics_data', bytes) : { list: [] };
  } catch {
    fail('Activity vitality statistics are invalid');
  }
  data.list ??= [];
  const id = statistic.ids[0];
  let row = data.list.find(entry => String(entry.id) === id);
  if (!row) {
    row = { id, total: '0', mod_day: '0', count_list: [], snapshot_list: [] };
    data.list.push(row);
  }
  let previous;
  try {
    previous = BigInt(row.total ?? 0);
  } catch {
    fail('Activity vitality statistics are invalid');
  }
  if (previous < 0n) fail('Activity vitality statistics are invalid');
  const total = previous + BigInt(value);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) fail('Activity vitality statistics overflow');
  const day = Math.floor((Number(seconds) + STATISTICS_DAY_OFFSET_SECONDS) / 86400);
  row.total = String(total);
  addCountList(row, value, day);
  module.value[slot] = serializedBinary(codec.pack('pb_count_statics_data', data));
  modules.set(STATISTICS_MODULE, module);
  model.state.modules.value = [...modules];
  return { data, slot, id, total: Number(total), roleId: Number(model.state.roleId) };
}
