import { encodeEtfInteger, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message = 'Invalid recruitment value') => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(1, message);
  return value;
};
const n = value => Number(value ?? 0);
const DAY_SECONDS = 86400;
const supportedLibs = new Set([1, 2, 3, 10]);
// The shipped Group rows are empty, so this deterministic local distribution replaces unavailable original odds.
const qualityWeights = [[30, 5000], [40, 3000], [50, 1500], [60, 450], [70, 50]];

function startOfUtcDay(seconds) {
  return Math.floor(seconds / DAY_SECONDS) * DAY_SECONDS;
}

function dayKey(seconds) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function nonNegativeInteger(value) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function recruitDefaults(lib) {
  return {
    tid: lib,
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

function normalizeRecruit(info, lib) {
  const defaults = recruitDefaults(lib);
  for (const key of ['wish_hero_list', 'wish_must_count', 'draw_num_kv_list', 'random_box_draw_list', 'latest_more_draw_list', 'extra_wish_list', 'hero_transfer_num']) {
    if (!Array.isArray(info[key])) info[key] = [];
  }
  for (const [key, value] of Object.entries(defaults)) if (info[key] === undefined || info[key] === null) info[key] = value;
  info.tid = lib;
  info.draw_lib = String(lib);
  return info;
}

function weightedQuality(random) {
  const roll = Math.max(0, Math.min(0.999999999999, Number(random())));
  let point = roll * 10000;
  for (const [quality, weight] of qualityWeights) {
    point -= weight;
    if (point < 0) return quality;
  }
  return qualityWeights.at(-1)[0];
}

function weightedGuaranteedQuality(random) {
  const choices = qualityWeights.filter(([quality]) => quality >= 50);
  const total = choices.reduce((sum, [, weight]) => sum + weight, 0);
  let point = Math.max(0, Math.min(0.999999999999, Number(random()))) * total;
  for (const [quality, weight] of choices) {
    point -= weight;
    if (point < 0) return quality;
  }
  return 50;
}

function module10(model) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(10);
  if (!module || !Array.isArray(module.value)) fail(5, 'Hero module is missing');
  return { modules, module };
}

export function createRecruitService({ store, codec, tables, heroTables, random = Math.random, now = () => Math.floor(Date.now() / 1000), onDraw = null }) {
  const byQuality = new Map(qualityWeights.map(([quality]) => [quality, []]));
  for (const [tid, hero] of [...heroTables.Hero.entries()].sort(([a], [b]) => a - b)) {
    const quality = Number(hero.quality);
    if (Number(hero.chip) > 0 && byQuality.has(quality)) byQuality.get(quality).push({ tid: Number(tid), chip: Number(hero.chip), quality });
  }
  const pool = [...byQuality.values()].flat();
  if (!pool.length) throw new Error('Recruitment hero pool is empty');

  function readState(model) {
    const { modules, module } = module10(model);
    const drawInfo = codec.unpack('pb_hero_draw_info', Buffer.from(module.value[2]?.value?.data ?? []));
    drawInfo.recruit_list ??= [];
    drawInfo.achieve_list ??= [];
    const byLib = new Map();
    for (const info of drawInfo.recruit_list) {
      const lib = n(info.draw_lib) || Number(info.tid);
      if (supportedLibs.has(lib)) byLib.set(lib, normalizeRecruit(info, lib));
    }
    for (const lib of supportedLibs) {
      if (!byLib.has(lib)) {
        const info = recruitDefaults(lib);
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
    const lib = magic ? 2 : 1;
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

  function drawOne(model, state, lib, drawConfig) {
    const guaranteedConfig = heroTables.Guaranteed.get(Number(drawConfig.guaranteed));
    const threshold = Number(guaranteedConfig?.guaranteed_num ?? 0);
    const nextCount = Number(state.guaranteed_count ?? 0) + 1;
    const guaranteed = threshold > 0 && nextCount >= threshold;
    const quality = guaranteed ? weightedGuaranteedQuality(random) : weightedQuality(random);
    const heroes = byQuality.get(quality);
    if (!heroes?.length) fail(5, 'Recruitment quality pool is empty');
    const hero = heroes[Math.min(heroes.length - 1, Math.floor(Math.max(0, Math.min(0.999999999999, Number(random()))) * heroes.length))];
    if (quality >= 50) {
      state.guaranteed_count = 0;
      state.high_guaranteed_count = 0;
      state.daily_ssr_draw_num = (state.daily_ssr_draw_num ?? 0) + 1;
    } else {
      state.guaranteed_count = nextCount;
      state.high_guaranteed_count = nextCount;
    }
    state.latest_more_draw_list.push(quality);
    if (state.latest_more_draw_list.length > 10) state.latest_more_draw_list.shift();
    return { ...hero, guaranteed, lib };
  }

  function draw(model, request, seconds) {
    const lib = integer(n(request.draw_lib), 1, 1000000, 'Invalid draw library');
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
    if (heroTables.DrawNumLimit.has(lib) && Number(info.daily_can_draw_num ?? 0) < count) fail(305, 'Daily draw limit reached');
    const spent = consumeResources(model, costs.map(cost => [cost.tid, cost.amount]), 301);
    const changes = [...spent.changes];
    const newHeroes = [];
    const results = [];
    for (let index = 0; index < count; index++) {
      const result = drawOne(model, info, lib, config);
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
        change.extra = encodeEtfInteger(result.tid);
        // HeroDataMgr caches heroes by hero.uid but resolves them by hero.tid.
        // The shipped client requires these identifiers to be identical.
        const tid = String(result.tid);
        const hero = { tid, uid: tid, level: 1, star: 0, star_progress: 0, breakthrough_level: 0, quality: result.quality, source: lib };
        model.heroInfo.hero_list.push(hero);
        newHeroes.push(hero);
      }
      changes.push(change);
    }
    info.draw_count = (info.draw_count ?? 0) + count;
    info.daily_draw_count = (info.daily_draw_count ?? 0) + count;
    if (heroTables.DrawNumLimit.has(lib)) info.daily_can_draw_num = Number(info.daily_can_draw_num ?? 0) - count;
    const drawTypeKey = n(request.draw_type);
    const kv = info.draw_num_kv_list.find(row => n(row.key) === drawTypeKey);
    if (kv) kv.value = String(BigInt(kv.value ?? 0) + BigInt(count));
    else info.draw_num_kv_list.push({ key: drawTypeKey, value: String(count) });
    info.data_version = (info.data_version ?? 0) + 1;
    writeDrawInfo(model, state);
    // Activity progress belongs to the same SQLite transaction as the draw. A
    // callback failure therefore rolls back both the recruitment and activity.
    const activityProgress = onDraw?.(model, { lib, count, seconds }) ?? null;
    return {
      schema: 'hero_draw_back',
      value: {
        res: { changes },
        recruit_info: info,
        // The shipped 601 response carries only res/recruit_info; the chip bundle
        // in res.changes already produces the result card on the client.
        decompose_args: [],
        pre_args: []
      },
      valueForLog: { lib, count, newHeroes: newHeroes.map(hero => hero.tid), activityProgress, results: results.map(result => ({ tid: result.tid, quality: result.quality, guaranteed: result.guaranteed })) }
    };
  }

  function chooseWish(model, request, extra, seconds) {
    const lib = integer(n(request.draw_lib), 1, 1000000, 'Invalid wish library');
    if (!supportedLibs.has(lib)) fail(5, 'Wish library is not available on the local server');
    const state = readState(model);
    const info = state.byLib.get(lib);
    const field = extra ? 'extra_wish_list' : 'wish_hero_list';
    const previous = new Map((info[field] ?? []).map(item => [Number(item.tid), item]));
    const seen = new Set();
    const list = [];
    for (const item of request.choose_item_list ?? []) {
      const index = integer(n(item.index), 0, 9999, 'Invalid wish slot');
      const tid = integer(n(item.hero_tid), 1, 999999999, 'Invalid wish hero');
      if (seen.has(tid) || !pool.some(hero => hero.tid === tid)) fail(5, 'Wish hero is not in the local pool');
      seen.add(tid);
      list.push({ tid: String(tid), index, draw_num: previous.get(tid)?.draw_num ?? 0, weight: previous.get(tid)?.weight ?? 0 });
    }
    info[field] = list;
    writeDrawInfo(model, state);
    return { schema: 'pb_hero_recruit', value: info };
  }

  function takeoffWish(model, input, extra) {
    const raw = input?.value ?? input;
    let lib = 1, index, tid;
    if (Array.isArray(raw)) {
      if (supportedLibs.has(n(raw[0])) && raw.length > 1) { lib = n(raw[0]); index = n(raw[1]); }
      else if (raw.length) { const value = n(raw[0]); if (value >= 100000) tid = value; else index = value; }
    } else if (raw && typeof raw === 'object') {
      lib = n(raw.draw_lib ?? raw.lib ?? 1); if (!supportedLibs.has(lib)) lib = 1;
      index = raw.index === undefined ? undefined : n(raw.index);
      tid = raw.hero_tid === undefined && raw.tid === undefined ? undefined : n(raw.hero_tid ?? raw.tid);
    } else {
      const value = n(raw); if (value >= 100000) tid = value; else index = value;
    }
    const state = readState(model);
    const info = state.byLib.get(lib);
    const field = extra ? 'extra_wish_list' : 'wish_hero_list';
    info[field] = (info[field] ?? []).filter(item => index !== undefined ? Number(item.index ?? 0) !== index : tid !== undefined ? Number(item.tid) !== tid : false);
    writeDrawInfo(model, state);
    return { schema: 'pb_hero_recruit', value: info };
  }

  return {
    supports: type => [599, 600, 601, 642, 643, 651, 652, 657, 658, 673].includes(type),
    ensureLoginState() {
      const seconds = now();
      store.transaction(model => {
        const state = ensureState(model, seconds);
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
      return store.transaction(model => {
        const seconds = now();
        let response;
        if (type === 599 || type === 600) response = purchase(model, type, input, seconds);
        else if (type === 601) response = draw(model, input ?? {}, seconds);
        else if (type === 642 || type === 657) response = chooseWish(model, input ?? {}, type === 657, seconds);
        else if (type === 643 || type === 658) response = takeoffWish(model, input, type === 658);
        else fail(1, 'Invalid recruitment command');
        return { ...response, data: codec.pack(response.schema, response.value) };
      });
    }
  };
}
