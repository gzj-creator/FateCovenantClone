import { GameError } from './hero-progression.mjs';

export const FANTASY_DRAW_MODULE_ID = 518;
export const FANTASY_DRAW_STATE_VERSION = 1;
export const FANTASY_DRAW_STATE_KEY = 'fantasyDrawPools';

const INT32_MAX = 2147483647;
const DAY_SECONDS = 86400;
const RESET_OFFSET_SECONDS = 10800;
const DEFAULT_MAX_DRAW_COUNT = 1000;
const DEFAULT_RECENT_GROUPS = 10;

export const fantasyDrawFail = (code, message) => { throw new GameError(code, message); };

export function fantasyDrawInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    fantasyDrawFail(1, `Invalid fantasy draw ${field}`);
  }
  return number;
}

function configInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    fantasyDrawFail(5, `Invalid fantasy draw configuration: ${field}`);
  }
  return number;
}

function isPromiseLike(value) {
  return Boolean(value && typeof value.then === 'function');
}

function assertSynchronous(value, message) {
  if (isPromiseLike(value)) fantasyDrawFail(5, message);
  return value;
}

function unsignedCount(value, field) {
  const text = String(value ?? 0);
  if (!/^\d+$/.test(text)) fantasyDrawFail(5, `Invalid persisted fantasy draw ${field}`);
  const number = BigInt(text);
  if (number > 18446744073709551615n) fantasyDrawFail(5, `Fantasy draw ${field} is too large`);
  return number;
}

function addUnsignedCount(value, amount, field) {
  const current = unsignedCount(value, field), increment = BigInt(amount);
  if (increment < 0n) fantasyDrawFail(5, `Invalid fantasy draw ${field} increment`);
  const result = current + increment;
  if (result > 18446744073709551615n) fantasyDrawFail(5, `Fantasy draw ${field} overflow`);
  return result.toString();
}

function dayIndex(seconds) {
  return Math.floor((seconds + RESET_OFFSET_SECONDS) / DAY_SECONDS);
}

function dayStart(seconds) {
  return Math.max(0, dayIndex(seconds) * DAY_SECONDS - RESET_OFFSET_SECONDS);
}

function emptyPoolState(drawLib, version, seconds) {
  return {
    draw_lib: String(drawLib),
    version: version === null || version === undefined ? null : String(version),
    draw_count: '0',
    total_draw_count: '0',
    guaranteed_count: '0',
    daily_draw_count: '0',
    daily_flush_time: dayStart(seconds),
    data_version: 0,
    latest_more_draw_list: [],
    wish_fail_times: '0'
  };
}

/**
 * Reads persistent draw counters from the role metadata held in SQLite. This
 * intentionally does not use process memory, because the game server can be
 * restarted between two draws.
 */
export function readFantasyDrawPoolState(model, key, { drawLib, version = null, seconds }) {
  model.state[FANTASY_DRAW_STATE_KEY] ??= { version: FANTASY_DRAW_STATE_VERSION, pools: {} };
  const container = model.state[FANTASY_DRAW_STATE_KEY];
  if (!container || typeof container !== 'object' || Array.isArray(container)) {
    fantasyDrawFail(5, 'Fantasy draw persistent state is invalid');
  }
  if (container.version !== FANTASY_DRAW_STATE_VERSION) {
    fantasyDrawFail(5, 'Fantasy draw persistent state version is unsupported');
  }
  container.pools ??= {};
  if (!container.pools || typeof container.pools !== 'object' || Array.isArray(container.pools)) {
    fantasyDrawFail(5, 'Fantasy draw pool registry is invalid');
  }
  const state = container.pools[key] ?? emptyPoolState(drawLib, version, seconds);
  if (String(state.draw_lib) !== String(drawLib)) fantasyDrawFail(5, 'Fantasy draw pool identity is invalid');
  if (version !== null && version !== undefined && String(state.version) !== String(version)) {
    fantasyDrawFail(5, 'Fantasy draw pool version is invalid');
  }
  unsignedCount(state.draw_count, 'draw count');
  unsignedCount(state.total_draw_count, 'total draw count');
  unsignedCount(state.guaranteed_count, 'guarantee count');
  unsignedCount(state.daily_draw_count, 'daily draw count');
  unsignedCount(state.wish_fail_times, 'wish failure count');
  if (!Number.isSafeInteger(Number(state.daily_flush_time)) || Number(state.daily_flush_time) < 0) {
    fantasyDrawFail(5, 'Fantasy draw daily refresh is invalid');
  }
  if (!Number.isSafeInteger(Number(state.data_version)) || Number(state.data_version) < 0) {
    fantasyDrawFail(5, 'Fantasy draw data version is invalid');
  }
  if (!Array.isArray(state.latest_more_draw_list)) fantasyDrawFail(5, 'Fantasy draw recent groups are invalid');
  if (dayIndex(seconds) > dayIndex(Number(state.daily_flush_time))) {
    state.daily_draw_count = '0';
    state.daily_flush_time = dayStart(seconds);
  }
  container.pools[key] = state;
  return { container, state };
}

export function normalizeFantasyDrawRequest(request, drawConfig, { maxDrawCount = DEFAULT_MAX_DRAW_COUNT } = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    fantasyDrawFail(1, 'Invalid fantasy draw request');
  }
  const limit = configInteger(maxDrawCount, 'maximum requested draw count', { min: 1, max: INT32_MAX });
  const drawLib = fantasyDrawInteger(request.draw_lib, 'draw library', { min: 1, max: INT32_MAX });
  const drawType = fantasyDrawInteger(request.draw_type ?? 0, 'draw type', { min: 0, max: INT32_MAX });
  const requested = fantasyDrawInteger(request.point_draw_num ?? 0, 'requested draw count', { min: 0, max: INT32_MAX });
  const mostDrawCount = configInteger(drawConfig?.most_draw_count, 'most draw count', { min: 1, max: INT32_MAX });
  const count = requested || (drawType === 1 ? mostDrawCount : 1);
  if (count > limit) fantasyDrawFail(1, 'Fantasy draw count exceeds the server limit');

  const configuredTids = Array.isArray(drawConfig.cost_item) ? drawConfig.cost_item.map(value => configInteger(value, 'cost item', { min: 1, max: INT32_MAX })) : [];
  const configuredCounts = Array.isArray(drawConfig.cost_item_count) ? drawConfig.cost_item_count : [];
  if (!configuredTids.length || configuredTids.length !== configuredCounts.length) {
    fantasyDrawFail(5, 'Fantasy draw cost configuration is invalid');
  }
  const specifiedRaw = request.specify_item_tid ?? 0;
  const specified = specifiedRaw === 0 || specifiedRaw === '0' ? 0 : fantasyDrawInteger(specifiedRaw, 'specified cost item', { min: 1 });
  const index = specified ? configuredTids.indexOf(specified) : 0;
  if (index < 0) fantasyDrawFail(1, 'The selected fantasy draw cost item is not configured');
  const unitCost = configInteger(configuredCounts[index], 'cost quantity', { min: 1, max: INT32_MAX });
  const totalCost = unitCost * count;
  if (!Number.isSafeInteger(totalCost)) fantasyDrawFail(5, 'Fantasy draw cost overflow');

  return {
    drawLib,
    drawType,
    count,
    specifiedItemTid: specified,
    costs: [[configuredTids[index], totalCost]],
    extraParam: request.extra_param ?? ''
  };
}

export function fantasyDrawRecruitInfo(state, seconds) {
  return {
    tid: Number(state.draw_lib),
    draw_lib: String(state.draw_lib),
    free_count: 0,
    daily_flush_time: Number(state.daily_flush_time),
    draw_count: Number(state.draw_count),
    guaranteed_count: Number(state.guaranteed_count),
    high_guaranteed_count: 0,
    wish_hero_list: [],
    next_progress_award_index: 0,
    last_award_count: 0,
    daily_draw_count: Number(state.daily_draw_count),
    wish_must_count: [],
    is_guaranteed_wish_hero: false,
    draw_num_kv_list: [],
    custom_choose_index: 0,
    daily_ssr_draw_num: 0,
    guaranteed_num_when_is_custom: 0,
    draw_num_index: 0,
    random_box_tid: 0,
    random_box_day: 0,
    random_box_draw_list: [],
    latest_more_draw_list: state.latest_more_draw_list.map(Number),
    last_double_count: 0,
    is_quick: false,
    daily_guarantee_double_num: 0,
    extra_wish_list: [],
    hero_transfer_num: [],
    daily_can_draw_num: 0,
    daily_ssr_base_draw_num: 0,
    data_version: Number(state.data_version)
  };
}

export function recordFantasyDraw(state, { count, groups = [], resetGuarantee = false, seconds, recentLimit = DEFAULT_RECENT_GROUPS }) {
  state.draw_count = addUnsignedCount(state.draw_count, count, 'draw count');
  state.total_draw_count = addUnsignedCount(state.total_draw_count, count, 'total draw count');
  state.daily_draw_count = addUnsignedCount(state.daily_draw_count, count, 'daily draw count');
  state.daily_flush_time = dayStart(seconds);
  state.data_version = fantasyDrawInteger(Number(state.data_version) + 1, 'data version', { min: 1, max: INT32_MAX });
  for (const group of groups) state.latest_more_draw_list.push(String(group));
  const retain = Math.max(1, Number(recentLimit) || DEFAULT_RECENT_GROUPS);
  if (state.latest_more_draw_list.length > retain) state.latest_more_draw_list.splice(0, state.latest_more_draw_list.length - retain);
  if (resetGuarantee) state.guaranteed_count = '0';
  return state;
}

export function incrementFantasyGuarantee(state, count) {
  state.guaranteed_count = addUnsignedCount(state.guaranteed_count, count, 'guarantee count');
  return Number(state.guaranteed_count);
}

export function pickFantasyWeighted(entries, random, weightOf = entry => entry?.[0]) {
  if (!Array.isArray(entries) || !entries.length) fantasyDrawFail(5, 'Fantasy draw probability table is empty');
  let total = 0;
  const prepared = entries.map(entry => {
    const weight = configInteger(weightOf(entry), 'reward weight', { min: 0, max: INT32_MAX });
    total += weight;
    if (!Number.isSafeInteger(total)) fantasyDrawFail(5, 'Fantasy draw probability weight overflow');
    return { entry, weight };
  });
  if (!(total > 0)) fantasyDrawFail(5, 'Fantasy draw probability table has no positive weight');
  const sample = Number(random());
  if (!(sample >= 0 && sample < 1)) fantasyDrawFail(5, 'Fantasy draw random source returned an invalid value');
  let cursor = sample * total;
  for (const row of prepared) {
    cursor -= row.weight;
    if (cursor < 0) return row.entry;
  }
  return prepared[prepared.length - 1].entry;
}

function normalizeGroupRows(groupId, row) {
  const entries = Array.isArray(row) ? row : row?.lib_range;
  if (!Array.isArray(entries) || !entries.length) {
    fantasyDrawFail(5, `Fantasy draw group ${groupId} has no configured rewards`);
  }
  return entries.map(entry => {
    if (!Array.isArray(entry) || entry.length < 3) fantasyDrawFail(5, `Fantasy draw group ${groupId} has an invalid reward`);
    return [
      configInteger(entry[0], 'group reward weight', { min: 0, max: INT32_MAX }),
      configInteger(entry[1], 'group reward tid', { min: 1, max: INT32_MAX }),
      configInteger(entry[2], 'group reward quantity', { min: 1, max: INT32_MAX })
    ];
  });
}

export function rollFantasyWeightedGroup({ weightConfig, guaranteed, resolveGroup, random, fallbackGroups = null }) {
  if (!weightConfig || typeof weightConfig !== 'object') fantasyDrawFail(5, 'Fantasy draw weight configuration is missing');
  const groups = fallbackGroups ?? (guaranteed ? weightConfig.guaranteed_group : weightConfig.weight_group);
  const weights = guaranteed ? weightConfig.guaranteed_weight : null;
  if (!Array.isArray(groups) || !groups.length) fantasyDrawFail(5, 'Fantasy draw group weights are missing');

  let entries;
  if (guaranteed && Array.isArray(weights)) {
    if (weights.length !== groups.length) fantasyDrawFail(5, 'Fantasy draw guaranteed group weights do not match their groups');
    entries = groups.map((groupId, index) => [weights[index], groupId]);
  } else if (fallbackGroups) {
    entries = fallbackGroups;
  } else {
    entries = groups;
  }
  const selected = pickFantasyWeighted(entries, random);
  const pair = Array.isArray(selected) ? selected : null;
  if (!pair || pair.length < 2) fantasyDrawFail(5, 'Fantasy draw group selection is invalid');
  const groupId = configInteger(pair[1], 'group id', { min: 1, max: INT32_MAX });
  const row = typeof resolveGroup === 'function' ? resolveGroup(groupId) : null;
  const rewards = normalizeGroupRows(groupId, row);
  const guaranteedGroups = new Set((weightConfig.guaranteed_group ?? []).map(value => String(value)));
  return {
    groupId,
    rewards,
    guaranteed: Boolean(guaranteed),
    resetGuarantee: Boolean(guaranteed) || guaranteedGroups.has(String(groupId))
  };
}

export function rollFantasyGroupReward(group, random) {
  const reward = pickFantasyWeighted(group.rewards, random);
  return { tid: Number(reward[1]), num: Number(reward[2]) };
}

export function equipmentRewardChanges({ inventory, current, awards, codec, maxInstances = DEFAULT_MAX_DRAW_COUNT }) {
  const limit = configInteger(maxInstances, 'maximum equipment reward instances', { min: 1, max: INT32_MAX });
  const groups = new Map();
  let created = 0;
  for (const award of awards) {
    const tid = configInteger(award?.tid, 'equipment reward tid', { min: 1, max: INT32_MAX });
    const quantity = configInteger(award?.num, 'equipment reward quantity', { min: 1, max: INT32_MAX });
    created += quantity;
    if (created > limit) fantasyDrawFail(5, 'Fantasy draw equipment reward count exceeds the server limit');
    for (let index = 0; index < quantity; index++) {
      const equip = inventory.create(current, tid);
      const extra = codec.pack('pb_fantasy_equip', equip);
      const key = `${tid}:${extra.toString('base64')}`;
      const existing = groups.get(key);
      if (existing) existing.count += 1;
      else groups.set(key, { tid, count: 1, extra });
    }
  }
  return [...groups.values()].map(group => ({
    tid: String(group.tid),
    new_num: String(group.count),
    diff_num: String(group.count),
    extra: group.extra
  }));
}

export function createFantasyDrawResponse(value, data = Buffer.alloc(0)) {
  return { value, data };
}

export function assertFantasyDrawSync(value, description) {
  return assertSynchronous(value, `${description} must be synchronous`);
}

export function createFantasySharedDrawService({
  store,
  codec,
  pools = [],
  now = () => Math.floor(Date.now() / 1000),
  onDraw = null,
  maxDrawCount = DEFAULT_MAX_DRAW_COUNT,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!store || typeof store.transaction !== 'function') throw new Error('Fantasy draw store is required');
  if (!codec || typeof codec.pack !== 'function' || typeof codec.unpack !== 'function') throw new Error('Fantasy draw codec is required');
  if (!Array.isArray(pools)) throw new Error('Fantasy draw pools must be an array');
  const routes = new Map();
  for (const pool of pools) {
    if (!pool || typeof pool.execute !== 'function' || !Array.isArray(pool.drawLibs)) {
      throw new Error('Fantasy draw pool interface is invalid');
    }
    for (const rawLib of pool.drawLibs) {
      const drawLib = Number(rawLib);
      if (!Number.isSafeInteger(drawLib) || drawLib < 1 || drawLib > INT32_MAX) throw new Error('Fantasy draw pool library is invalid');
      if (routes.has(drawLib)) throw new Error(`Duplicate fantasy draw library registration: ${drawLib}`);
      routes.set(drawLib, pool);
    }
  }
  const requestedLimit = configInteger(maxDrawCount, 'maximum requested draw count', { min: 1, max: INT32_MAX });

  function supports601(drawLibValue) {
    const drawLib = Number(drawLibValue);
    return Number.isSafeInteger(drawLib) && drawLib > 0 && routes.has(drawLib);
  }

  function execute601(request) {
    log({
      event: 'fantasy_shared_draw_execute601_entry', request,
      requestHex: Buffer.isBuffer(request) || request instanceof Uint8Array ? Buffer.from(request).toString('base64') : undefined
    });
    const drawLib = fantasyDrawInteger(request?.draw_lib, 'draw library', { min: 1, max: INT32_MAX });
    const pool = routes.get(drawLib);
    if (!pool) fantasyDrawFail(5, 'Fantasy draw library is not registered');
    return store.transaction(model => {
      const seconds = fantasyDrawInteger(now(), 'server time', { min: 0, max: INT32_MAX });
      const result = assertFantasyDrawSync(pool.execute(model, request, {
        seconds,
        maxDrawCount: requestedLimit,
        tables: pool.tables ?? null
      }), 'Fantasy draw pool execution');
      if (!result || typeof result !== 'object') fantasyDrawFail(5, 'Fantasy draw pool returned no response');
      result.value ??= {};
      result.value.res ??= { changes: [], is_overflow: false };
      result.value.res.changes ??= [];
      result.value.res.is_overflow ??= false;
      result.value.decompose_args ??= [];
      result.value.pre_args ??= [];

      let activity = null;
      if (typeof onDraw === 'function') {
        activity = assertFantasyDrawSync(onDraw(model, {
          pool: pool.name,
          drawLib,
          count: result.count,
          seconds,
          response: result,
          poolState: result.poolState,
          event: result.event ?? null
        }), 'Fantasy draw activity callback');
      }
      if (activity?.changes?.length) result.value.res.changes.push(...activity.changes);
      const data = codec.pack('hero_draw_back', result.value);
      const pushEvents = [
        ...(Array.isArray(result.pushEvents) ? result.pushEvents : []),
        ...(Array.isArray(activity?.pushEvents) ? activity.pushEvents : [])
      ];
      return {
        schema: 'hero_draw_back',
        value: result.value,
        data,
        pushEvents,
        pool: pool.name,
        valueForLog: {
          ...(result.valueForLog ?? {}),
          ...(activity?.valueForLog ?? {})
        }
      };
    });
  }

  return { moduleId: FANTASY_DRAW_MODULE_ID, supports601, execute601 };
}
