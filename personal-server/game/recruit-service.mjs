import { encodeEtfBinaryList, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readRecruitHeroExclusionGroups } from '../config/recruit-hero-groups.mjs';
import { GameError } from './hero-progression.mjs';
import {
  RECRUIT_RULE_VERSION,
  SUPPORTED_RECRUIT_LIBS,
  buildRecruitPoolCatalog,
  choosePoolHero,
  completedDrawCounts,
  isPoolUnlocked,
  isWishUnlocked,
  pickQuality
} from './recruit-pool-rules.mjs';
import { consumeResources, grantResources } from './resources.mjs';

const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message = 'Invalid recruitment value') => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(1, message);
  return value;
};
const n = value => Number(value ?? 0);
const DAY_SECONDS = 86400;
const STATISTICS_MODULE = 21;
const TID_COUNT_DRAW = 1;
const TID_COUNT_DRAW_ACHIEVE = 75;
const ACHIEVEMENT_AWARD_TID = 2;
const ACHIEVEMENT_AWARD_INTERVAL = 1000;
const DEMIGOD_DRAW_NORMAL_TID = 1;
const DEMIGOD_DRAW_HERO_TID = 226;
const DEMIGOD_MODULE_ID = 518;
const DEMIGOD_FORMATION_INDEX = 1;
const DEMIGOD_DRAW_INDEX = 2;
const LEADER_EQUIP_MODULE_ID = 175;
const LEADER_EQUIP_DRAW_TYPE = 1031;
const supportedLibs = new Set(SUPPORTED_RECRUIT_LIBS);

function startOfUtcDay(seconds) {
  return Math.floor(seconds / DAY_SECONDS) * DAY_SECONDS;
}

function dayKey(seconds) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function statisticsDay(seconds) {
  return Math.floor((seconds + 10800) / DAY_SECONDS);
}

function nonNegativeInteger(value) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function randomUnit(random) {
  const value = Number(random());
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999999, value)) : 0;
}

function pickRandom(entries, random) {
  if (!entries.length) throw new Error('Demigod draw pool is empty');
  const total = entries.reduce((sum, entry) => sum + Number(entry.weight ?? 1), 0);
  let point = randomUnit(random) * total;
  for (const entry of entries) {
    point -= Number(entry.weight ?? 1);
    if (point < 0) return entry;
  }
  return entries.at(-1);
}

function mergeResourceChanges(changes, model, codec) {
  const byTid = new Map();
  for (const change of changes) {
    const tid = String(change.tid);
    const previous = byTid.get(tid);
    if (previous) {
      byTid.set(tid, {
        ...previous,
        ...change,
        tid,
        diff_num: String(BigInt(previous.diff_num ?? 0) + BigInt(change.diff_num ?? 0))
      });
    } else {
      byTid.set(tid, { ...change, tid, diff_num: String(change.diff_num ?? 0) });
    }
  }
  return [...byTid.values()].flatMap(change => {
    const newNum = model.resources.get(change.tid)?.num ?? change.new_num;
    const merged = { ...change, new_num: newNum };
    if (change.new_bin !== undefined) {
      // A buy-and-draw request can net to zero. Keep this change so the client
      // creates the inventory object, but advertise the transaction's final
      // balance instead of the intermediate balance from the grant step.
      merged.new_bin = codec.pack('pb_res_obj', { tid: change.tid, num: String(newNum) });
    }
    return BigInt(change.diff_num) === 0n && change.new_bin === undefined ? [] : [merged];
  });
}

function achievementAwardIndex(awardLib) {
  return awardLib % ACHIEVEMENT_AWARD_INTERVAL;
}

function hasAchievementAward(awardState, awardLib) {
  const index = achievementAwardIndex(awardLib);
  if (index < 1) return false;
  const bytes = Buffer.from(awardState ?? '', 'base64');
  const byte = Math.floor((index - 1) / 8);
  return byte < bytes.length && (bytes[byte] & (0x80 >> ((index - 1) % 8))) !== 0;
}

function setAchievementAward(awardState, awardLib) {
  const index = achievementAwardIndex(awardLib);
  if (index < 1) throw new Error('Invalid draw achievement award index');
  const current = Buffer.from(awardState ?? '', 'base64');
  const byte = Math.floor((index - 1) / 8);
  let bytes = current;
  if (current.length <= byte) {
    bytes = Buffer.alloc(byte + 1);
    current.copy(bytes);
  }
  bytes[byte] |= 0x80 >> ((index - 1) % 8);
  return bytes;
}

function recruitDefaults(lib, recordTid = lib) {
  return {
    tid: recordTid,
    draw_lib: String(lib),
    free_count: 0,
    daily_flush_time: 0,
    draw_count: 0,
    guaranteed_count: 0,
    high_guaranteed_count: 0,
    wish_hero_list: [],
    next_progress_award_index: 0,
    last_award_count: 0,
    daily_draw_count: 0,
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
    latest_more_draw_list: [],
    last_double_count: 0,
    is_quick: false,
    daily_guarantee_double_num: 0,
    extra_wish_list: [],
    hero_transfer_num: [],
    daily_can_draw_num: 0,
    daily_ssr_base_draw_num: 0,
    data_version: 0
  };
}

function normalizeRecruit(info, lib, recordTid) {
  const defaults = recruitDefaults(lib, recordTid);
  for (const key of ['wish_hero_list', 'wish_must_count', 'draw_num_kv_list', 'random_box_draw_list', 'latest_more_draw_list', 'extra_wish_list', 'hero_transfer_num']) {
    if (!Array.isArray(info[key])) info[key] = [];
  }
  for (const [key, value] of Object.entries(defaults)) if (info[key] === undefined || info[key] === null) info[key] = value;
  info.draw_num_kv_list = info.draw_num_kv_list.map(row => row.key === undefined || row.key === null ? { ...row, key: 0 } : row);
  info.tid = recordTid;
  info.draw_lib = String(lib);
  return info;
}

function module10(model) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(10);
  if (!module || !Array.isArray(module.value)) fail(5, 'Hero module is missing');
  return { modules, module };
}

export function createRecruitService({
  store,
  codec,
  tables,
  heroTables,
  fantasyEquipTables,
  leaderEquipTables,
  recruitHeroExclusionGroups = null,
  random = Math.random,
  now = () => Math.floor(Date.now() / 1000),
  onDraw = null
}) {
  const heroExclusionGroups = recruitHeroExclusionGroups ?? readRecruitHeroExclusionGroups().groups;
  const pools = buildRecruitPoolCatalog(heroTables, { excludedHeroGroups: heroExclusionGroups });
  const drawConfigs = new Map();
  for (const [lib, pool] of pools) {
    const drawConfig = heroTables.Draw.get(lib);
    const guaranteedConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
    if (!drawConfig || !guaranteedConfig || !(Number(guaranteedConfig.guaranteed_num) > 0)) {
      throw new Error(`Recruitment configuration is missing for draw library ${lib}`);
    }
    if (Number(guaranteedConfig.guaranteed_special ?? 0) !== Number(pool.rule.guaranteeSpecial)) {
      throw new Error(`Recruitment guarantee mapping does not match draw library ${lib}`);
    }
    drawConfigs.set(lib, { drawConfig, guaranteedConfig });
  }
  const roleStatistics = [...tables.CountStatistics.values()]
    .filter(row => !row.custom_login && Number(row.type) === 0);
  const drawStatisticsSlot = roleStatistics.findIndex(row => Number(row.tid) === TID_COUNT_DRAW) + 1;
  if (drawStatisticsSlot <= 0) throw new Error('Recruitment statistics configuration is missing');
  const customStatistics = [...tables.CountStatistics.values()].filter(row => row.custom_login);
  const achievementAward = heroTables.DrawAchievementAward.get(ACHIEVEMENT_AWARD_TID);
  if (!achievementAward || !Array.isArray(achievementAward.award_lib)) {
    throw new Error('Recruitment achievement configuration is missing');
  }
  const achievementAwardLibs = new Set(achievementAward.award_lib.map(Number));
  for (const awardLib of achievementAwardLibs) {
    if (!heroTables.DrawAchievementLib.has(awardLib)) throw new Error(`Recruitment achievement tier ${awardLib} is missing`);
  }
  const demigodBuyConfig = fantasyEquipTables?.DrawNormal?.get(DEMIGOD_DRAW_NORMAL_TID);
  const leaderDraws = new Map();
  if (leaderEquipTables) {
    const items = [...leaderEquipTables.LeaderEquip.values()];
    for (const grade of leaderEquipTables.Grade.values()) {
      const lib = Number(grade.draw_lib);
      const drawConfig = heroTables.Draw.get(lib);
      const gradeItems = items.filter(item => Number(item.grade) === Number(grade.tid));
      if (!drawConfig || Number(drawConfig.draw_type) !== LEADER_EQUIP_DRAW_TYPE || gradeItems.length === 0) {
        throw new Error(`Leader-equipment draw configuration is missing for grade ${grade.tid}`);
      }
      leaderDraws.set(lib, { grade, drawConfig, items: gradeItems });
    }
  }
  function requireDemigodConfig() {
    if (!fantasyEquipTables || !demigodBuyConfig) fail(5, 'Demigod resident draw purchase configuration is missing');
  }

  function recruitRecordTid(lib) {
    const draw = heroTables.Draw.get(lib);
    return draw?.is_record_by_type ? Number(draw.draw_type) : lib;
  }

  function readState(model) {
    const { modules, module } = module10(model);
    const drawInfo = codec.unpack('pb_hero_draw_info', Buffer.from(module.value[2]?.value?.data ?? []));
    drawInfo.recruit_list ??= [];
    drawInfo.achieve_list ??= [];
    const byLib = new Map();
    for (const info of drawInfo.recruit_list) {
      const lib = n(info.draw_lib) || Number(info.tid);
      if (supportedLibs.has(lib)) byLib.set(lib, normalizeRecruit(info, lib, recruitRecordTid(lib)));
    }
    for (const lib of supportedLibs) {
      if (!byLib.has(lib)) {
        const info = recruitDefaults(lib, recruitRecordTid(lib));
        drawInfo.recruit_list.push(info);
        byLib.set(lib, info);
      }
    }
    return { modules, module, drawInfo, byLib };
  }

  function writeDrawInfo(model, state) {
    state.module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', state.drawInfo));
    model.state.modules.value = [...state.modules];
  }

  function upsertDrawRecord(model, {
    lib,
    recordTid = recruitRecordTid(lib),
    drawCount,
    guaranteedCount,
    dailyDrawCount = null,
    dailyCanDrawNum = null
  }) {
    const { modules, module } = module10(model);
    const drawInfo = codec.unpack('pb_hero_draw_info', Buffer.from(module.value[2]?.value?.data ?? []));
    drawInfo.recruit_list ??= [];
    const existing = drawInfo.recruit_list.find(info =>
      Number(info.tid) === Number(recordTid) || Number(info.draw_lib) === Number(lib)
    );
    const info = normalizeRecruit(existing ?? recruitDefaults(lib, recordTid), lib, recordTid);
    info.draw_count = nonNegativeInteger(drawCount);
    info.guaranteed_count = nonNegativeInteger(guaranteedCount);
    info.high_guaranteed_count = info.guaranteed_count;
    if (dailyDrawCount !== null) info.daily_draw_count = nonNegativeInteger(dailyDrawCount);
    if (dailyCanDrawNum !== null) info.daily_can_draw_num = nonNegativeInteger(dailyCanDrawNum);
    info.data_version = 1;
    drawInfo.recruit_list = drawInfo.recruit_list.filter(candidate =>
      Number(candidate.tid) !== Number(recordTid) && Number(candidate.draw_lib) !== Number(lib)
    );
    drawInfo.recruit_list.push(info);
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', drawInfo));
    model.state.modules.value = [...modules];
    return info;
  }

  function drawRecord(model, lib) {
    const { module } = module10(model);
    const drawInfo = codec.unpack('pb_hero_draw_info', Buffer.from(module.value[2]?.value?.data ?? []));
    const recordTid = recruitRecordTid(lib);
    return drawInfo.recruit_list?.find(info =>
      Number(info.tid) === Number(recordTid) || Number(info.draw_lib) === Number(lib)
    );
  }

  function readLeaderEquipState(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(LEADER_EQUIP_MODULE_ID);
    if (!module || !module.value?.data?.length) fail(5, 'Leader-equipment module is missing');
    const data = codec.unpack('pb_leader_equips_data', rawBinary(module));
    data.slots ??= [];
    data.equip_list ??= [];
    data.max_uid = String(data.max_uid ?? 0);
    data.draw_info ??= { lv: 1 };
    data.dismiss ??= '';
    return { modules, module, data };
  }

  function writeLeaderEquipState(model, state) {
    state.modules.set(LEADER_EQUIP_MODULE_ID, serializedBinary(codec.pack('pb_leader_equips_data', state.data)));
    model.state.modules.value = [...state.modules];
  }

  function updateDrawStatistics(model, modules, lib, count, seconds, minimum = null) {
    const statisticsModule = modules.get(STATISTICS_MODULE);
    if (!statisticsModule || !Array.isArray(statisticsModule.value)) fail(5, 'Statistics module is missing');
    while (statisticsModule.value.length <= drawStatisticsSlot) statisticsModule.value.push(serializedBinary(Buffer.alloc(0)));
    const current = statisticsModule.value[drawStatisticsSlot];
    const data = current?.value?.data?.length
      ? codec.unpack('pb_count_statics_data', Buffer.from(current.value.data))
      : { list: [] };
    data.list ??= [];
    let row = data.list.find(item => Number(item.id) === lib);
    if (!row) {
      row = { id: String(lib), total: '0', mod_day: '0', count_list: [], snapshot_list: [] };
      data.list.push(row);
    }
    const previousTotal = nonNegativeInteger(row.total);
    const amount = minimum === null ? count : Math.max(0, minimum - previousTotal);
    if (amount === 0) return { data, row, slot: drawStatisticsSlot, changed: false };
    const day = statisticsDay(seconds);
    const previousDay = Number(row.mod_day ?? 0);
    row.count_list ??= [];
    if (previousDay === day && row.count_list.length > 0) {
      row.count_list[0] = String(n(row.count_list[0]) + amount);
    } else if (!row.count_list.length) {
      row.count_list = [String(amount)];
    } else if (day > previousDay + 1) {
      row.count_list = [String(amount), ...Array(day - previousDay - 1).fill('0'), ...row.count_list];
    } else {
      row.count_list = [String(amount), ...row.count_list];
    }
    row.total = String(previousTotal + amount);
    row.mod_day = String(day);
    statisticsModule.value[drawStatisticsSlot] = serializedBinary(codec.pack('pb_count_statics_data', data));
    modules.set(STATISTICS_MODULE, statisticsModule);
    model.state.modules.value = [...modules];
    return { data, row, slot: drawStatisticsSlot, changed: true };
  }

  function drawStatisticsPush(statistics, lib) {
    const value = {
      data_list: [{
        data: statistics.data,
        expand_id_list: [lib],
        stat_tid: TID_COUNT_DRAW
      }]
    };
    return { type: 2000, data: codec.pack('pb_count_statics_send_list', value) };
  }

  function drawAchievementData(state, seconds) {
    const total = [...state.byLib.values()].reduce((sum, info) => sum + nonNegativeInteger(info.draw_count), 0);
    return {
      list: total > 0 ? [{
        id: '0',
        total: String(total),
        mod_day: String(statisticsDay(seconds)),
        count_list: [String(total)],
        snapshot_list: []
      }] : []
    };
  }

  function drawAchievementPush(data) {
    return {
      type: 2000,
      data: codec.pack('pb_count_statics_send_list', {
        data_list: [{ data, expand_id_list: [0], stat_tid: TID_COUNT_DRAW_ACHIEVE }]
      })
    };
  }

  function customStatisticsResponse(model) {
    const state = readState(model);
    const seconds = now();
    return encodeEtfBinaryList(customStatistics.map(row => codec.pack(
      'pb_count_statics_data',
      Number(row.tid) === TID_COUNT_DRAW_ACHIEVE ? drawAchievementData(state, seconds) : { list: [] }
    )));
  }

  function claimAchievementAward(model, input) {
    const raw = input?.value ?? input;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const awardLib = integer(n(value), 1, 999999999, 'Invalid recruitment achievement award');
    if (!achievementAwardLibs.has(awardLib)) fail(5, 'Recruitment achievement award is not configured');
    const state = readState(model);
    const tier = heroTables.DrawAchievementLib.get(awardLib);
    const total = [...state.byLib.values()].reduce((sum, info) => sum + nonNegativeInteger(info.draw_count), 0);
    if (total < Number(tier.draw_num)) fail(305, 'Recruitment achievement is not complete');
    let achievement = state.drawInfo.achieve_list.find(row => Number(row.tid) === ACHIEVEMENT_AWARD_TID);
    if (!achievement) {
      achievement = { tid: ACHIEVEMENT_AWARD_TID, award_state: '' };
      state.drawInfo.achieve_list.push(achievement);
    }
    if (hasAchievementAward(achievement.award_state, awardLib)) fail(305, 'Recruitment achievement award already claimed');
    achievement.award_state = setAchievementAward(achievement.award_state, awardLib);
    writeDrawInfo(model, state);
    const awarded = grantResources(model, (tier.draw_award ?? []).map(([tid, count]) => [Number(tid), Number(count)]), tables);
    return { schema: 'pb_res_to_client', value: awarded };
  }

  function purchaseState(model, kind, seconds) {
    model.state.recruitPurchases ??= {};
    const key = dayKey(seconds);
    const existing = model.state.recruitPurchases[kind] ?? { day: key, daily: 0, total: 0, flush_time: seconds };
    if (existing.day !== key) {
      existing.day = key;
      existing.daily = 0;
      existing.total = Number(existing.total ?? 0);
    }
    existing.daily = Number(existing.daily ?? 0);
    existing.total = Number(existing.total ?? 0);
    model.state.recruitPurchases[kind] = existing;
    return existing;
  }

  function buyInfoFor(model, kind, seconds, config) {
    const state = purchaseState(model, kind, seconds);
    const dailyMax = Number(config.daily_max);
    const absoluteMax = Number(config.absolute_max);
    return {
      flush_time: startOfUtcDay(seconds),
      buy_max_num: Math.max(0, Math.min(dailyMax - state.daily, absoluteMax - state.total)),
      remaining: Math.max(0, Math.min(dailyMax - state.daily, absoluteMax - state.total))
    };
  }

  function writeBuyInfo(model, index, value) {
    const { modules, module } = module10(model);
    while (module.value.length <= index) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[index] = serializedBinary(codec.pack('pb_draw_normal_buy_info', { flush_time: value.flush_time, buy_max_num: value.buy_max_num }));
    model.state.modules.value = [...modules];
  }

  function demigodModule(model) {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(DEMIGOD_MODULE_ID);
    if (!module || !Array.isArray(module.value)) {
      module = { value: [], improper: false };
    }
    while (module.value.length <= DEMIGOD_DRAW_INDEX) module.value.push(serializedBinary(Buffer.alloc(0)));
    return { modules, module };
  }

  function normalizeDemigodDraw(value) {
    const draw = value && typeof value === 'object' ? value : {};
    return {
      ...draw,
      wish_list: Array.isArray(draw.wish_list) ? draw.wish_list.map(Number).filter(Number.isSafeInteger) : [],
      total_draw_times: nonNegativeInteger(draw.total_draw_times),
      wish_fail_times: nonNegativeInteger(draw.wish_fail_times),
      refresh_stamp: nonNegativeInteger(draw.refresh_stamp),
      left_buy_times: nonNegativeInteger(draw.left_buy_times)
    };
  }

  function demigodDrawState(model, seconds) {
    requireDemigodConfig();
    const { modules, module } = demigodModule(model);
    const drawBytes = Buffer.from(module.value[DEMIGOD_DRAW_INDEX]?.value?.data ?? []);
    // The shipped FantasyEquipMgr.LoginParse turns value[2] into
    // pb_fantasy_draw. Older local saves kept the same object only in role
    // metadata, so migrate it once while preserving formation data in value[1].
    const stored = drawBytes.length
      ? codec.unpack('pb_fantasy_draw', drawBytes)
      : model.state.demigodDraw;
    const draw = normalizeDemigodDraw(stored);
    model.state.demigodDrawPurchases ??= { day: '', daily: 0, total: 0 };
    const purchases = model.state.demigodDrawPurchases;
    const key = dayKey(seconds);
    if (purchases.day !== key) {
      purchases.day = key;
      purchases.daily = 0;
    }
    purchases.daily = nonNegativeInteger(purchases.daily);
    purchases.total = nonNegativeInteger(purchases.total);

    const currentDay = startOfUtcDay(seconds);
    const dailyMax = nonNegativeInteger(demigodBuyConfig.buy_daily_max_num);
    if (draw.refresh_stamp < currentDay) {
      draw.refresh_stamp = currentDay;
      draw.left_buy_times = dailyMax;
    } else {
      const dailyRemaining = Math.max(0, dailyMax - purchases.daily);
      draw.left_buy_times = Math.min(draw.left_buy_times, dailyRemaining, dailyMax);
    }
    return { draw, purchases, modules, module };
  }

  function writeDemigodDrawState(model, state) {
    state.module.value[DEMIGOD_DRAW_INDEX] = serializedBinary(codec.pack('pb_fantasy_draw', state.draw));
    state.modules.set(DEMIGOD_MODULE_ID, state.module);
    model.state.modules.value = [...state.modules];
    // Keep the metadata mirror for older local tools; module 518 remains the
    // authoritative value sent to the client at login.
    model.state.demigodDraw = state.draw;
  }

  function demigodRequest(input) {
    const raw = input?.value ?? input;
    if (Array.isArray(raw)) return demigodRequest(raw[0] ?? {});
    if (raw && typeof raw === 'object') {
      return { buyCount: n(raw.buy_count ?? raw.buyCount ?? raw.count ?? raw.num ?? 0) };
    }
    return { buyCount: n(raw) };
  }

  function demigodWishSlots(totalDrawTimes) {
    requireDemigodConfig();
    return [...fantasyEquipTables.DrawNormalWish.values()]
      .filter(row => totalDrawTimes >= Number(row.draw_times)).length;
  }

  function demigodUnlockedEquips(totalDrawTimes) {
    requireDemigodConfig();
    return [...fantasyEquipTables.DrawUnlock.values()]
      .filter(row => totalDrawTimes >= Number(row.draw_times))
      .map(row => ({ tid: Number(row.tid), weight: Math.max(1, Number(fantasyEquipTables.FantasyEquip.get(Number(row.tid))?.lucky_value ?? 1)) }))
      .filter(row => fantasyEquipTables.FantasyEquip.has(row.tid));
  }

  function buyDemigodDraw(model, input, seconds) {
    requireDemigodConfig();
    if (input === undefined || input === null) fail(1, 'Invalid demigod draw request');
    const request = demigodRequest(input);
    const buyCount = integer(request.buyCount, 1, 5, 'Invalid demigod ticket purchase quantity');
    const ticketTid = Number(demigodBuyConfig.buy_award);
    const costTid = Number(demigodBuyConfig.buy_cost_item);
    const unitPrice = Number(demigodBuyConfig.buy_price);
    const dailyMax = Number(demigodBuyConfig.buy_daily_max_num);
    const totalMax = Number(demigodBuyConfig.buy_max_num);
    if (!ticketTid || !costTid || !(unitPrice > 0) || !(dailyMax > 0) || !(totalMax > 0)) {
      fail(5, 'Demigod draw configuration is missing');
    }

    const state = demigodDrawState(model, seconds);
    const remainingDaily = Math.min(n(state.draw.left_buy_times), Math.max(0, dailyMax - state.purchases.daily));
    const remainingTotal = Math.max(0, totalMax - state.purchases.total);
    if (remainingDaily < buyCount || remainingTotal < buyCount) fail(305, 'Demigod ticket purchase limit reached');

    const purchaseChanges = [];
    purchaseChanges.push(...consumeResources(model, [[costTid, unitPrice * buyCount]], 301).changes);
    purchaseChanges.push(...grantResources(model, [[ticketTid, buyCount]], tables).changes);
    state.purchases.daily += buyCount;
    state.purchases.total += buyCount;
    state.draw.left_buy_times = remainingDaily - buyCount;
    state.draw.refresh_stamp = startOfUtcDay(seconds);
    writeDemigodDrawState(model, state);
    return {
      schema: 'pb_fantasy_equip_draw_buy_rsp',
      value: { res: { changes: mergeResourceChanges(purchaseChanges, model, codec), is_overflow: false }, draw: state.draw },
      valueForLog: {
        buyCount,
        ticketTid,
        costTid,
        unitPrice,
        leftBuyTimes: state.draw.left_buy_times,
        totalDrawTimes: state.draw.total_draw_times,
        wishFailTimes: state.draw.wish_fail_times
      }
    };
  }

  function chooseDemigodWish(model, input, seconds) {
    const requested = input?.wish_list ?? [];
    if (!Array.isArray(requested)) fail(1, 'Invalid demigod wish list');
    const state = demigodDrawState(model, seconds);
    const totalDrawTimes = state.draw.total_draw_times;
    const allowedTids = new Set(demigodUnlockedEquips(totalDrawTimes).map(row => row.tid));
    const unlockedSlots = demigodWishSlots(totalDrawTimes);
    if (requested.length > unlockedSlots) fail(305, 'Demigod wish slots are still locked');
    const seen = new Set();
    state.draw.wish_list = requested.map(value => {
      const tid = integer(n(value), 1, 999999999, 'Invalid demigod wish item');
      if (!allowedTids.has(tid) || seen.has(tid)) fail(5, 'Demigod wish item is invalid or duplicated');
      seen.add(tid);
      return tid;
    });
    writeDemigodDrawState(model, state);
    const demigodThreshold = Number(heroTables.Guaranteed.get(Number(heroTables.Draw.get(DEMIGOD_DRAW_HERO_TID)?.guaranteed))?.guaranteed_num ?? 0);
    upsertDrawRecord(model, {
      lib: DEMIGOD_DRAW_HERO_TID,
      drawCount: state.draw.total_draw_times,
      guaranteedCount: demigodThreshold > 0 ? state.draw.total_draw_times % demigodThreshold : 0
    });
    return { schema: 'pb_fantasy_draw', value: state.draw };
  }

  function ensureState(model, seconds) {
    const state = readState(model);
    for (const [lib, info] of state.byLib) {
      refreshDailyState(info, lib, seconds);
      const draw = heroTables.Draw.get(lib);
      if (draw?.daily_free_count !== undefined) info.free_count = Math.min(info.free_count ?? 0, draw.daily_free_count);
    }
    writeDrawInfo(model, state);
    const normal = buyInfoFor(model, 'normal', seconds, { daily_max: tablesHeroDrawConst().normal_buy_daily_max_num, absolute_max: tablesHeroDrawConst().normal_buy_max_num });
    const magic = buyInfoFor(model, 'magic', seconds, { daily_max: tablesHeroDrawConst().magic_buy_daily_max_num, absolute_max: tablesHeroDrawConst().magic_buy_max_num });
    writeBuyInfo(model, 9, normal);
    writeBuyInfo(model, 10, magic);
    if (fantasyEquipTables && demigodBuyConfig) {
      const demigod = demigodDrawState(model, seconds);
      writeDemigodDrawState(model, demigod);
      const demigodThreshold = Number(heroTables.Guaranteed.get(Number(heroTables.Draw.get(DEMIGOD_DRAW_HERO_TID)?.guaranteed))?.guaranteed_num ?? 0);
      upsertDrawRecord(model, {
        lib: DEMIGOD_DRAW_HERO_TID,
        drawCount: demigod.draw.total_draw_times,
        guaranteedCount: demigodThreshold > 0 ? demigod.draw.total_draw_times % demigodThreshold : 0
      });
    }
    return { draw: readState(model), normal, magic };
  }

  function refreshDailyState(info, lib, seconds) {
    const previousFlush = Number(info.daily_flush_time ?? 0);
    const currentDay = startOfUtcDay(seconds);
    if (dayKey(previousFlush) !== dayKey(seconds)) {
      info.daily_draw_count = 0;
      info.daily_ssr_draw_num = 0;
      info.daily_ssr_base_draw_num = 0;
      info.daily_flush_time = currentDay;
    }

    const limitConfig = heroTables.DrawNumLimit.get(lib);
    if (!limitConfig) return;
    const dailyLimit = nonNegativeInteger(limitConfig.daily_limit_draw_num);
    const maxOverlay = nonNegativeInteger(limitConfig.max_overlay_num);
    const remaining = nonNegativeInteger(info.daily_can_draw_num);
    if (previousFlush === 0) {
      info.daily_can_draw_num = dailyLimit;
    } else if (previousFlush < currentDay) {
      const elapsedDays = Math.max(1, Math.floor((currentDay - startOfUtcDay(previousFlush)) / DAY_SECONDS));
      info.daily_can_draw_num = maxOverlay > 0
        ? Math.min(maxOverlay, remaining + dailyLimit * elapsedDays)
        : dailyLimit;
    }
  }

  function tablesHeroDrawConst() {
    const value = heroTables.DrawConst.get(1);
    if (!value) throw new Error('Hero draw constants are missing');
    return value;
  }

  function purchase(model, type, quantity, seconds) {
    const magic = type === 599;
    // req_draw_buy_magic_scroll is the special recruitment shop. Its ticket
    // must come from the special draw library (10), not the elite pool (2).
    const lib = magic ? 10 : 1;
    const count = integer(quantity, 1, 8000, 'Invalid ticket purchase quantity');
    const draw = heroTables.Draw.get(lib);
    const ticketTid = Number(draw?.cost_item?.[0]);
    const costTid = Number(tablesHeroDrawConst()[magic ? 'magic_buy_cost_item' : 'normal_buy_cost_item']);
    const unitPrice = Number(tablesHeroDrawConst()[magic ? 'magic_buy_price' : 'normal_buy_price']);
    if (!ticketTid || !costTid || !unitPrice) fail(5, 'Ticket purchase configuration is missing');
    const kind = magic ? 'magic' : 'normal';
    const purchaseInfo = buyInfoFor(model, kind, seconds, {
      daily_max: tablesHeroDrawConst()[magic ? 'magic_buy_daily_max_num' : 'normal_buy_daily_max_num'],
      absolute_max: tablesHeroDrawConst()[magic ? 'magic_buy_max_num' : 'normal_buy_max_num']
    });
    if (purchaseInfo.remaining < count) fail(305, 'Ticket purchase limit reached');
    const spent = consumeResources(model, [[costTid, unitPrice * count]], 301);
    const granted = grantResources(model, [[ticketTid, count]], tables);
    const state = purchaseState(model, kind, seconds);
    state.daily += count;
    state.total += count;
    state.flush_time = startOfUtcDay(seconds);
    const info = buyInfoFor(model, kind, seconds, {
      daily_max: tablesHeroDrawConst()[magic ? 'magic_buy_daily_max_num' : 'normal_buy_daily_max_num'],
      absolute_max: tablesHeroDrawConst()[magic ? 'magic_buy_max_num' : 'normal_buy_max_num']
    });
    writeBuyInfo(model, magic ? 10 : 9, info);
    return {
      schema: 'pb_draw_normal_buy_ret',
      value: { res: { changes: [...spent.changes, ...granted.changes] }, buy_info: { flush_time: info.flush_time, buy_max_num: info.buy_max_num } }
    };
  }

  function drawOne(state, lib, progress) {
    const pool = pools.get(lib);
    const { guaranteedConfig } = drawConfigs.get(lib);
    const threshold = Number(guaranteedConfig.guaranteed_num);
    const nextCount = Number(state.guaranteed_count ?? 0) + 1;
    const guaranteed = threshold > 0 && nextCount >= threshold;
    const quality = pickQuality(pool.rule, progress, guaranteed, random);
    let wishHero = false;
    let candidates = null;
    if (isWishUnlocked(pool.rule, progress) && (quality === 50 || quality === 60)) {
      candidates = [];
      for (const item of state.wish_hero_list ?? []) {
        const hero = pool.byTid.get(Number(item.tid));
        if (!hero || hero.quality !== quality) continue;
        candidates.push({ ...hero, weight: Number(item.weight) > 0 ? Number(item.weight) : 1 });
      }
      wishHero = candidates.length > 0;
    }
    const hero = choosePoolHero(pool, quality, random, wishHero ? candidates : null);
    // A targeted pool advances its pity only when the selected adventurer is
    // actually drawn. Other pools keep their normal quality-based pity reset.
    const resetsPity = pool.rule.wish ? wishHero : quality >= 50;
    if (quality >= 50) state.daily_ssr_draw_num = (state.daily_ssr_draw_num ?? 0) + 1;
    if (resetsPity) {
      state.guaranteed_count = 0;
      state.high_guaranteed_count = 0;
    } else {
      state.guaranteed_count = nextCount;
      state.high_guaranteed_count = nextCount;
    }
    state.latest_more_draw_list.push(quality);
    if (state.latest_more_draw_list.length > 10) state.latest_more_draw_list.shift();
    state.is_guaranteed_wish_hero = wishHero;
    state.draw_count = Number(state.draw_count ?? 0) + 1;
    return { ...hero, guaranteed, wishHero, lib };
  }

  function drawLeaderEquip(model, request, seconds, lib, leaderDraw) {
    const config = leaderDraw.drawConfig;
    const pointCount = n(request.point_draw_num);
    const count = pointCount > 0 ? pointCount : n(request.draw_type) === 1 ? Number(config.most_draw_count) : 1;
    integer(count, 1, Math.max(1, Number(config.most_draw_count)), 'Invalid leader-equipment draw count');
    const specified = n(request.specify_item_tid);
    const configuredCosts = (config.cost_item ?? []).map((tid, index) => ({
      tid: Number(tid),
      amount: Number(config.cost_item_count?.[index] ?? 1) * count
    }));
    if (specified && !configuredCosts.some(cost => cost.tid === specified)) fail(1, 'The selected draw item is not configured');
    const costs = specified ? configuredCosts.filter(cost => cost.tid === specified) : configuredCosts;
    if (!costs.length || costs.some(cost => !cost.tid || !Number.isSafeInteger(cost.amount))) {
      fail(5, 'Leader-equipment draw cost configuration is missing');
    }

    const state = readLeaderEquipState(model);
    const guaranteeThreshold = Number(heroTables.Guaranteed.get(Number(config.guaranteed))?.guaranteed_num ?? 0);
    let guaranteeCount = nonNegativeInteger(drawRecord(model, lib)?.guaranteed_count) % Math.max(1, guaranteeThreshold);
    const spent = consumeResources(model, costs.map(cost => [cost.tid, cost.amount]), 301);
    const changes = [...spent.changes];
    let nextUid = BigInt(state.data.max_uid);
    for (const equip of state.data.equip_list) nextUid = nextUid > BigInt(equip.uid ?? 0) ? nextUid : BigInt(equip.uid ?? 0);
    const results = [];
    for (let index = 0; index < count; index++) {
      guaranteeCount += 1;
      const guaranteed = guaranteeThreshold > 0 && guaranteeCount >= guaranteeThreshold;
      const bestScore = Math.max(...leaderDraw.items.map(item => Number(item.score ?? 0)));
      const candidates = guaranteed
        ? leaderDraw.items.filter(item => Number(item.score ?? 0) === bestScore).sort((left, right) => Number(left.tid) - Number(right.tid))
        : leaderDraw.items;
      const configItem = candidates[0] && guaranteed
        ? candidates[0]
        : pickRandom(candidates.map(item => ({ ...item, weight: 1 })), random);
      if (guaranteed) guaranteeCount = 0;
      nextUid += 1n;
      const equip = {
        tid: String(configItem.tid),
        uid: nextUid.toString(),
        star: 0,
        level: 1,
        intensify_info: { intensify_level: 0, intensify_times: 0 }
      };
      const encoded = codec.pack('pb_leader_equip', equip);
      changes.push({
        tid: equip.tid,
        new_num: '1',
        diff_num: '1',
        // LeaderEquipRes.ResChange decodes new_bin, inserts the object into its
        // backpack, then copies the same payload to extra for the result card.
        new_bin: encoded.toString('base64'),
        extra: encoded.toString('base64')
      });
      state.data.equip_list.push(equip);
      results.push({ tid: Number(equip.tid), uid: equip.uid, grade: Number(configItem.grade), drawLib: lib, guaranteed });
    }
    state.data.max_uid = nextUid.toString();
    writeLeaderEquipState(model, state);
    const previous = drawRecord(model, lib);
    const recruitInfo = upsertDrawRecord(model, {
      lib,
      drawCount: nonNegativeInteger(previous?.draw_count) + count,
      guaranteedCount: guaranteeCount,
      dailyDrawCount: nonNegativeInteger(previous?.daily_draw_count) + count,
      dailyCanDrawNum: 1000000
    });
    recruitInfo.daily_can_draw_num = 1000000;
    return {
      schema: 'hero_draw_back',
      value: {
        res: { changes },
        recruit_info: recruitInfo,
        decompose_args: [],
        pre_args: []
      },
      pushes: [],
      valueForLog: {
        lib,
        count,
        leaderEquip: true,
        seconds: seconds,
        results
      }
    };
  }

  function draw(model, request, seconds) {
    const lib = integer(n(request.draw_lib), 1, 1000000, 'Invalid draw library');
    if (leaderDraws.has(lib)) return drawLeaderEquip(model, request, seconds, lib, leaderDraws.get(lib));
    if (!supportedLibs.has(lib)) fail(5, 'Draw library is not available on the local server');
    const config = heroTables.Draw.get(lib);
    if (!config) fail(5, 'Draw library configuration is missing');
    const pointCount = n(request.point_draw_num);
    const count = pointCount > 0 ? pointCount : n(request.draw_type) === 1 ? Number(config.most_draw_count) : 1;
    integer(count, 1, Math.max(1, Number(config.most_draw_count)), 'Invalid draw count');
    const specified = n(request.specify_item_tid);
    const configuredCosts = (config.cost_item ?? []).map((tid, index) => ({ tid: Number(tid), amount: Number(config.cost_item_count?.[index] ?? 1) * count }));
    if (specified && !configuredCosts.some(cost => cost.tid === specified)) fail(1, 'The selected draw item is not configured');
    const costs = specified ? configuredCosts.filter(cost => cost.tid === specified) : configuredCosts;
    if (!costs.length || costs.some(cost => !cost.tid || !Number.isSafeInteger(cost.amount))) fail(5, 'Draw cost configuration is missing');
    const state = readState(model);
    const info = state.byLib.get(lib);
    refreshDailyState(info, lib, seconds);
    const progress = completedDrawCounts(state.byLib);
    if (!isPoolUnlocked(pools.get(lib).rule, info, progress)) fail(305, 'Draw library is not unlocked');
    if (heroTables.DrawNumLimit.has(lib) && Number(info.daily_can_draw_num ?? 0) < count) fail(305, 'Daily draw limit reached');
    const spent = consumeResources(model, costs.map(cost => [cost.tid, cost.amount]), 301);
    const changes = [...spent.changes];
    const newHeroes = [];
    const results = [];
    for (let index = 0; index < count; index++) {
      const result = drawOne(info, lib, completedDrawCounts(state.byLib));
      results.push(result);
      const owned = model.heroInfo.hero_list.some(hero => Number(hero.tid) === result.tid);
      // The client's HeroDrawUILogic.FilterAwards splits one chip award into
      // floor(num / Quality.convert_piece_new) result cards. Every drawn hero,
      // including a newly unlocked one, must therefore arrive as one full
      // convert_piece_new chip bundle; a single chip renders zero cards and
      // makes HeroDrawResultShowForm.Repeat fail with executeCount = 0.
      const amount = Number(heroTables.Quality.get(result.quality)?.convert_piece_new ?? 0);
      if (amount <= 0) fail(5, 'Hero conversion configuration is missing');
      const granted = grantResources(model, [[result.chip, amount]], tables);
      const change = granted.changes[0];
      if (!owned) {
        // HeroDataMgr caches heroes by hero.uid but resolves them by hero.tid.
        // The shipped client requires these identifiers to be identical.
        const tid = String(result.tid);
        const hero = { tid, uid: tid, level: 1, star: 0, star_progress: 0, breakthrough_level: 0, quality: result.quality, source: lib };
        // HeroRes.ResChange decodes change.extra as an ETF list of binary hero PB messages.
        // A bare integer is ignored, leaving the hero absent until the next login.
        change.extra = encodeEtfBinaryList([codec.pack('hero', hero)]);
        model.heroInfo.hero_list.push(hero);
        newHeroes.push(hero);
      }
      changes.push(change);
    }
    info.daily_draw_count = (info.daily_draw_count ?? 0) + count;
    if (heroTables.DrawNumLimit.has(lib)) info.daily_can_draw_num = Number(info.daily_can_draw_num ?? 0) - count;
    const drawTypeKey = request.draw_type === undefined ? 0 : n(request.draw_type);
    const kv = info.draw_num_kv_list.find(row => n(row.key) === drawTypeKey);
    if (kv) kv.value = String(BigInt(kv.value ?? 0) + BigInt(count));
    else info.draw_num_kv_list.push({ key: drawTypeKey, value: String(count) });
    info.data_version = (info.data_version ?? 0) + 1;
    writeDrawInfo(model, state);
    const statistics = updateDrawStatistics(model, state.modules, lib, count, seconds);
    const pushes = statistics.changed ? [drawStatisticsPush(statistics, lib)] : [];
    const achievementData = drawAchievementData(state, seconds);
    if (achievementData.list.length) pushes.push(drawAchievementPush(achievementData));
    // Activity progress belongs to the same SQLite transaction as the draw. A
    // callback failure therefore rolls back both the recruitment and activity.
    const activityProgress = onDraw?.(model, { lib, count, seconds }) ?? null;
    return {
      schema: 'hero_draw_back',
      value: {
        res: { changes },
        recruit_info: info,
        // New heroes already have one full-chip resource change plus an ETF
        // hero in change.extra. HeroDrawUILogic turns that resource change into
        // a result card, so adding a decompose argument here creates a second
        // card for the same pull and can overrun the client's ten-child grid.
        decompose_args: [],
        pre_args: []
      },
      pushes,
      valueForLog: {
        lib,
        count,
        ruleVersion: RECRUIT_RULE_VERSION,
        newHeroes: newHeroes.map(hero => hero.tid),
        activityProgress,
        results: results.map(result => ({ tid: result.tid, quality: result.quality, guaranteed: result.guaranteed, wishHero: result.wishHero }))
      }
    };
  }

  function chooseWish(model, request, extra, seconds) {
    const lib = integer(n(request.draw_lib), 1, 1000000, 'Invalid wish library');
    if (!supportedLibs.has(lib)) fail(5, 'Wish library is not available on the local server');
    const pool = pools.get(lib);
    const field = extra ? 'extra_wish_list' : 'wish_hero_list';
    if (!pool.rule.wish || !pool.rule.wish.fields.includes(field)) fail(5, 'Wish selection is not supported by this draw library');
    const state = readState(model);
    const info = state.byLib.get(lib);
    refreshDailyState(info, lib, seconds);
    const progress = completedDrawCounts(state.byLib);
    if (!isWishUnlocked(pool.rule, progress)) fail(305, 'Wish list is not unlocked');
    const previous = new Map((info[field] ?? []).map(item => [Number(item.tid), item]));
    const seen = new Set();
    const seenIndexes = new Set();
    const qualityCounts = new Map();
    const list = [];
    const requested = request.choose_item_list ?? [];
    if (!Array.isArray(requested)) fail(1, 'Invalid wish selection');
    if (requested.length > [...pool.rule.wish.maxByQuality].reduce((sum, [, limit]) => sum + limit, 0)) {
      fail(5, 'Too many wish heroes');
    }
    for (const item of requested) {
      const index = integer(n(item.index), 0, 9999, 'Invalid wish slot');
      const tid = integer(n(item.hero_tid), 1, 999999999, 'Invalid wish hero');
      const hero = pool.byTid.get(tid);
      if (seen.has(tid) || seenIndexes.has(index)) fail(5, 'Wish hero or slot is duplicated');
      if (!hero || !pool.rule.wish.maxByQuality.some(([quality]) => quality === hero.quality)) {
        fail(5, 'Wish hero is not eligible for this draw library');
      }
      const count = (qualityCounts.get(hero.quality) ?? 0) + 1;
      const max = Number(pool.rule.wish.maxByQuality.find(([quality]) => quality === hero.quality)?.[1] ?? 0);
      if (count > max) fail(5, 'Wish hero quality limit reached');
      qualityCounts.set(hero.quality, count);
      seen.add(tid);
      seenIndexes.add(index);
      list.push({ tid: String(tid), index, draw_num: previous.get(tid)?.draw_num ?? 0, weight: previous.get(tid)?.weight ?? 0 });
    }
    info[field] = list;
    writeDrawInfo(model, state);
    return { schema: 'pb_hero_recruit', value: info };
  }

  function takeoffWish(model, input, extra) {
    const raw = input?.value ?? input;
    let lib = 2, index, tid;
    if (Array.isArray(raw)) {
      if (supportedLibs.has(n(raw[0])) && raw.length > 1) { lib = n(raw[0]); index = n(raw[1]); }
      else if (raw.length) { const value = n(raw[0]); if (value >= 100000) tid = value; else index = value; }
    } else if (raw && typeof raw === 'object') {
      lib = n(raw.draw_lib ?? raw.lib ?? 2); if (!supportedLibs.has(lib)) lib = 2;
      index = raw.index === undefined ? undefined : n(raw.index);
      tid = raw.hero_tid === undefined && raw.tid === undefined ? undefined : n(raw.hero_tid ?? raw.tid);
    } else {
      const value = n(raw); if (value >= 100000) tid = value; else index = value;
    }
    const state = readState(model);
    const info = state.byLib.get(lib);
    const field = extra ? 'extra_wish_list' : 'wish_hero_list';
    if (!pools.get(lib).rule.wish || !pools.get(lib).rule.wish.fields.includes(field)) fail(5, 'Wish removal is not supported by this draw library');
    info[field] = (info[field] ?? []).filter(item => index !== undefined ? Number(item.index ?? 0) !== index : tid !== undefined ? Number(item.tid) !== tid : false);
    writeDrawInfo(model, state);
    return { schema: 'pb_hero_recruit', value: info };
  }

  return {
    supports: type => [599, 600, 601, 642, 643, 651, 652, 657, 658, 662, 673, 77901, 87617, 87618].includes(type),
    ensureLoginState() {
      const seconds = now();
      store.transaction(model => {
        const state = ensureState(model, seconds);
        const modules = new Map(model.state.modules.value);
        for (const [lib, info] of state.draw.byLib) {
          updateDrawStatistics(model, modules, lib, 0, seconds, Number(info.draw_count ?? 0));
        }
        codec.pack('pb_hero_draw_info', state.draw.drawInfo);
      });
    },
    execute(type, input) {
      if (type === 651 || type === 652) {
        const response = { schema: 'pb_draw_support_back', value: { role_support: { support_list: [] }, server_support: { support_list: [] } } };
        return { ...response, data: codec.pack(response.schema, response.value) };
      }
      if (type === 673) {
        const response = { schema: 'pb_draw_marquee_rsp', value: { data: Buffer.alloc(0) } };
        return { ...response, data: codec.pack(response.schema, response.value) };
      }
      if (type === 77901) {
        return { schema: 'etf-fallback', value: null, data: store.transaction(model => customStatisticsResponse(model)) };
      }
      return store.transaction(model => {
        const seconds = now();
        let response;
        if (type === 599 || type === 600) response = purchase(model, type, input, seconds);
        else if (type === 601) response = draw(model, input ?? {}, seconds);
        else if (type === 87617) response = chooseDemigodWish(model, input ?? {}, seconds);
        else if (type === 87618) response = buyDemigodDraw(model, input, seconds);
        else if (type === 662) response = claimAchievementAward(model, input);
        else if (type === 642 || type === 657) response = chooseWish(model, input ?? {}, type === 657, seconds);
        else if (type === 643 || type === 658) response = takeoffWish(model, input, type === 658);
        else fail(1, 'Invalid recruitment command');
        return { ...response, data: codec.pack(response.schema, response.value) };
      });
    }
  };
}
