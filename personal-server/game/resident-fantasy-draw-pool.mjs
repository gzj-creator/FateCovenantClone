import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { consumeResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';
import {
  assertFantasyDrawSync,
  equipmentRewardChanges,
  fantasyDrawFail,
  fantasyDrawInteger,
  fantasyDrawRecruitInfo,
  normalizeFantasyDrawRequest,
  readFantasyDrawPoolState,
  recordFantasyDraw,
  rollFantasyGroupReward,
  rollFantasyWeightedGroup
} from './fantasy-shared-draw-service.mjs';

const POOL_NAME = 'resident_fantasy';
const DRAW_LIB = 226;
const MODULE_ID = 518;
const DAY_SECONDS = 86400;

const dayIndex = seconds => gameDayIndex(seconds);

function positiveConfig(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
    fantasyDrawFail(5, `Invalid resident fantasy draw configuration: ${field}`);
  }
  return number;
}

function uint64(value, field) {
  const text = String(value ?? 0);
  if (!/^\d+$/.test(text)) fantasyDrawFail(5, `Invalid resident fantasy draw ${field}`);
  const number = BigInt(text);
  if (number > 18446744073709551615n) fantasyDrawFail(5, `Resident fantasy draw ${field} is too large`);
  return number;
}

function groupIds(weightConfig) {
  return [...new Set([
    ...(weightConfig?.weight_group ?? []).map(entry => Number(entry?.[1])),
    ...(weightConfig?.guaranteed_group ?? []).map(Number)
  ].filter(Number.isSafeInteger))];
}

function gateIsOpen(result) {
  if (result === false) return false;
  if (result && typeof result === 'object') {
    return result.open !== false && result.allowed !== false && result.closed !== true;
  }
  return true;
}

/**
 * Standard draw type 601 for the resident fantasy pool (HeroTable.Draw 226).
 * DrawGroup rows are empty in the recovered static tables, so callers must
 * inject a verified reward mapping. This pool never synthesizes equal odds.
 */
export function createResidentFantasyDrawPool({
  tables,
  heroTables,
  inventory,
  codec,
  random = Math.random,
  resolveGroup = null,
  pickWish = null,
  assertOpen = null
} = {}) {
  if (!(tables?.FantasyDrawNormal instanceof Map) || !(tables?.FantasyDrawNormalWish instanceof Map) || !(tables?.FantasyDrawUnlock instanceof Map) || !(tables?.DrawLibWeight instanceof Map) || !(tables?.DrawGroup instanceof Map)) {
    throw new Error('Resident fantasy draw tables are missing');
  }
  if (!(heroTables?.Draw instanceof Map) || !(heroTables?.Guaranteed instanceof Map)) {
    throw new Error('Resident fantasy hero draw tables are missing');
  }
  if (!inventory || typeof inventory.read !== 'function' || typeof inventory.save !== 'function' || !codec || typeof codec.pack !== 'function' || typeof codec.unpack !== 'function') {
    throw new Error('Resident fantasy draw equipment dependencies are missing');
  }

  const config = tables.FantasyDrawNormal.get(1);
  const drawConfig = heroTables.Draw.get(DRAW_LIB);
  const guaranteeConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
  const weightConfig = tables.DrawLibWeight.get(Number(drawConfig?.group_weight));
  const guaranteeThreshold = positiveConfig(guaranteeConfig?.guaranteed_num, 'guarantee threshold');
  const dailyLimit = positiveConfig(config?.buy_daily_max_num, 'daily ticket purchase limit');
  const maxLimit = positiveConfig(config?.buy_max_num, 'maximum ticket purchase limit');
  if (!config || !drawConfig || !weightConfig || maxLimit < dailyLimit) {
    throw new Error('Resident fantasy draw configuration is missing');
  }

  const wishSlots = [...tables.FantasyDrawNormalWish.values()].map(row => ({
    tid: positiveConfig(row?.tid, 'wish slot tid'),
    draw_times: uint64(row?.draw_times, 'wish slot unlock count')
  }));
  const unlockRows = new Map();
  for (const row of tables.FantasyDrawUnlock.values()) {
    const tid = positiveConfig(row?.tid, 'unlock equipment tid');
    unlockRows.set(tid, { tid, draw_times: uint64(row?.draw_times, 'equipment unlock count') });
  }
  if (!unlockRows.size) throw new Error('Resident fantasy unlock configuration is empty');

  const wishRatios = Array.isArray(config.wish_ratio) ? config.wish_ratio.map((value, index) => {
    const ratio = Number(value);
    if (!Number.isSafeInteger(ratio) || ratio < 0 || ratio > 10000) {
      fantasyDrawFail(5, `Invalid resident fantasy wish ratio at index ${index}`);
    }
    return ratio;
  }) : [];

  const groupResolver = groupId => typeof resolveGroup === 'function'
    ? resolveGroup(groupId)
    : tables.DrawGroup.get(groupId);

  function readDrawState(model, seconds) {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(MODULE_ID);
    if (!module) module = { value: [], improper: false };
    if (!Array.isArray(module.value)) fantasyDrawFail(5, 'Fantasy equipment login module is invalid');
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    let draw;
    try {
      const bytes = rawBinary(module.value[2]);
      draw = bytes.length ? codec.unpack('pb_fantasy_draw', bytes) : null;
    } catch {
      fantasyDrawFail(5, 'Fantasy draw login data is invalid');
    }
    if (!draw) {
      draw = { wish_list: [], total_draw_times: '0', wish_fail_times: '0', refresh_stamp: seconds, left_buy_times: dailyLimit };
    }
    if (!Array.isArray(draw.wish_list)) fantasyDrawFail(5, 'Fantasy wish list is invalid');
    const previous = Number(draw.refresh_stamp ?? 0);
    const remaining = Number(draw.left_buy_times ?? 0);
    if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(remaining) || remaining < 0 || remaining > maxLimit) {
      fantasyDrawFail(5, 'Fantasy draw purchase state is invalid');
    }
    uint64(draw.total_draw_times, 'total draw count');
    uint64(draw.wish_fail_times, 'wish failure count');
    if (previous > 0 && dayIndex(seconds) > dayIndex(previous)) {
      draw.left_buy_times = Math.min(maxLimit, remaining + dailyLimit * (dayIndex(seconds) - dayIndex(previous)));
      draw.refresh_stamp = seconds;
    }
    modules.set(MODULE_ID, module);
    return { modules, module, draw };
  }

  function writeDrawState(model, current) {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(MODULE_ID);
    if (!module) module = { value: [], improper: false };
    if (!Array.isArray(module.value)) fantasyDrawFail(5, 'Fantasy equipment login module is invalid');
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', current.draw));
    modules.set(MODULE_ID, module);
    model.state.modules.value = [...modules];
  }

  function validateWishTid(value, totalDraws) {
    const tid = Number(value);
    const unlock = unlockRows.get(tid);
    if (!unlock || totalDraws < unlock.draw_times) fantasyDrawFail(305, 'Resident fantasy wish is locked or unknown');
    return tid;
  }

  function selectWish(model, draw, totalDraws, seconds) {
    const unique = new Set();
    for (const value of draw.wish_list) {
      const tid = validateWishTid(value, totalDraws);
      if (unique.has(tid)) fantasyDrawFail(1, 'Resident fantasy wish list contains duplicates');
      unique.add(tid);
    }
    const availableSlots = wishSlots.filter(row => totalDraws >= row.draw_times).length;
    if (unique.size > availableSlots) fantasyDrawFail(305, 'Resident fantasy wish slots are not unlocked');

    const unlockedCandidates = [...unlockRows.values()]
      .filter(row => totalDraws >= row.draw_times)
      .map(row => row.tid);
    let selected = null;
    if (unique.size === 1) {
      selected = [...unique][0];
    } else if (unique.size > 1) {
      if (typeof pickWish !== 'function') fantasyDrawFail(5, 'Resident fantasy wish selection is ambiguous');
      selected = assertFantasyDrawSync(pickWish({
        model,
        seconds,
        wishList: [...unique],
        candidates: unlockedCandidates
      }), 'Resident fantasy wish selector');
    } else if (unlockedCandidates.length === 1) {
      selected = unlockedCandidates[0];
    } else if (typeof pickWish === 'function') {
      selected = assertFantasyDrawSync(pickWish({
        model,
        seconds,
        wishList: [],
        candidates: unlockedCandidates
      }), 'Resident fantasy wish selector');
    }
    return selected === null || selected === undefined || Number(selected) === 0
      ? null
      : validateWishTid(selected, totalDraws);
  }

  function assertGroups() {
    for (const groupId of groupIds(weightConfig)) {
      const row = groupResolver(groupId);
      const rewards = Array.isArray(row) ? row : row?.lib_range;
      if (!Array.isArray(rewards) || !rewards.length) {
        fantasyDrawFail(5, `Resident fantasy draw group ${groupId} has no configured rewards`);
      }
    }
  }

  function validateRewardEquipment(tid, totalDraws) {
    const unlock = unlockRows.get(tid);
    if (!unlock) fantasyDrawFail(5, `Resident fantasy reward ${tid} is not in FantasyDrawUnlock`);
    if (totalDraws < unlock.draw_times) fantasyDrawFail(5, `Resident fantasy reward ${tid} is still locked at ${totalDraws} draws`);
  }

  function supports(drawLibValue) {
    return Number(drawLibValue) === DRAW_LIB;
  }

  function execute(model, request, { seconds, maxDrawCount }) {
    if (Number(request?.draw_lib) !== DRAW_LIB) fantasyDrawFail(5, 'Resident fantasy draw library is not registered');
    if (typeof assertOpen === 'function') {
      const gate = assertFantasyDrawSync(assertOpen({ model, drawConfig, drawLib: DRAW_LIB, seconds }), 'Resident fantasy draw activity gate');
      if (!gateIsOpen(gate)) fantasyDrawFail(305, 'Resident fantasy draw is not open');
    }
    const normalized = normalizeFantasyDrawRequest(request, drawConfig, { maxDrawCount });
    assertGroups();

    const current = readDrawState(model, seconds);
    const poolKey = `resident:${DRAW_LIB}`;
    const { state } = readFantasyDrawPoolState(model, poolKey, { drawLib: DRAW_LIB, seconds });
    const moduleTotal = uint64(current.draw.total_draw_times, 'total draw count');
    const poolTotal = uint64(state.total_draw_count, 'total draw count');
    const startingTotal = moduleTotal > poolTotal ? moduleTotal : poolTotal;
    if (startingTotal > poolTotal) state.total_draw_count = startingTotal.toString();
    if (startingTotal > BigInt(state.draw_count)) state.draw_count = startingTotal.toString();
    const moduleWishFailures = uint64(current.draw.wish_fail_times, 'wish failure count');
    const stateWishFailures = uint64(state.wish_fail_times, 'wish failure count');
    if (moduleWishFailures > stateWishFailures) state.wish_fail_times = moduleWishFailures.toString();

    const wishTid = selectWish(model, current.draw, startingTotal, seconds);
    const cost = consumeResources(model, normalized.costs, 301);
    const awards = [], selectedGroups = [];
    let runningTotal = startingTotal;
    let wishFailures = uint64(state.wish_fail_times, 'wish failure count');
    let wishHits = 0;

    for (let index = 0; index < normalized.count; index++) {
      runningTotal += 1n;
      const nextGuarantee = Number(state.guaranteed_count) + 1;
      const forced = nextGuarantee >= guaranteeThreshold;
      const group = rollFantasyWeightedGroup({
        weightConfig,
        guaranteed: forced,
        resolveGroup: groupResolver,
        random
      });
      let reward = rollFantasyGroupReward(group, random);
      validateRewardEquipment(reward.tid, runningTotal);

      if (wishTid !== null && wishRatios.length) {
        const ratioIndex = Math.min(Number(wishFailures), wishRatios.length - 1);
        const ratio = wishRatios[ratioIndex];
        const sample = Number(random());
        if (!(sample >= 0 && sample < 1)) fantasyDrawFail(5, 'Resident fantasy draw random source returned an invalid value');
        if (sample * 10000 < ratio) {
          reward = { tid: wishTid, num: 1 };
          wishFailures = 0n;
          wishHits++;
        } else {
          wishFailures += 1n;
        }
      }

      awards.push(reward);
      selectedGroups.push(group.groupId);
      state.guaranteed_count = group.resetGuarantee ? '0' : String(nextGuarantee);
    }

    state.wish_fail_times = wishFailures.toString();
    recordFantasyDraw(state, { count: normalized.count, groups: selectedGroups, seconds });
    const inventoryCurrent = inventory.read(model);
    const equipmentChanges = equipmentRewardChanges({ inventory, current: inventoryCurrent, awards, codec, maxInstances: maxDrawCount });
    inventory.save(model, inventoryCurrent);

    const drawState = readDrawState(model, seconds);
    drawState.draw.total_draw_times = state.total_draw_count;
    drawState.draw.wish_fail_times = state.wish_fail_times;
    writeDrawState(model, drawState);

    const recruitInfo = fantasyDrawRecruitInfo(state, seconds);
    const value = {
      res: { changes: [...cost.changes, ...equipmentChanges], is_overflow: false },
      recruit_info: recruitInfo,
      decompose_args: [],
      pre_args: []
    };
    const drawData = codec.pack('pb_fantasy_draw', drawState.draw);

    return {
      value,
      count: normalized.count,
      poolState: state,
      event: {
        kind: 'fantasy_draw',
        pool: POOL_NAME,
        drawLib: DRAW_LIB,
        count: normalized.count,
        groups: selectedGroups,
        awards,
        wishTid,
        wishHits,
        totalDrawCount: state.total_draw_count
      },
      valueForLog: {
        pool: POOL_NAME,
        draw_lib: DRAW_LIB,
        draw_count: normalized.count,
        group_ids: selectedGroups,
        awards,
        wish_tid: wishTid,
        wish_hits: wishHits,
        total_draw_times: drawState.draw.total_draw_times,
        wish_fail_times: drawState.draw.wish_fail_times
      },
      pushEvents: [{
        kind: 'fantasy_draw_normal_update',
        pushType: 10101,
        schema: 'pb_fantasy_draw',
        value: drawState.draw,
        data: drawData
      }]
    };
  }

  return { name: POOL_NAME, drawLibs: [DRAW_LIB], supports, execute };
}
