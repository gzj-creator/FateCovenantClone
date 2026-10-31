import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const HERO_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes zero-based slot 4 (Lua login[5]) as
// pb_role_hero_favour. The preceding slots are hero info, draw state,
// handbook and currency data.
const FAVOR_SLOT = 4;
const DAY_SECONDS = 86400;
// The client's FlushTime day cycle is 05:00 Asia/Shanghai for the local
// server. A UTC epoch shifted by three hours therefore uses the conventional
// day boundary.
const RESET_OFFSET_SECONDS = 10800;
const MAX_UINT32 = 0xffffffff;

const fail = (code, message) => { throw new GameError(code, message); };

function uint32(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > MAX_UINT32) {
    fail(5, `Invalid hero favour ${field}`);
  }
  return number;
}

function positiveTid(value) {
  const tid = Number(value);
  if (!Number.isSafeInteger(tid) || tid <= 0 || tid > MAX_UINT32) fail(1, 'Invalid hero tid');
  return tid;
}

function dayIndex(seconds) {
  return Math.floor((seconds + RESET_OFFSET_SECONDS) / DAY_SECONDS);
}

function bytesField(value) {
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (Array.isArray(value)) return Buffer.from(value).toString('base64');
  return typeof value === 'string' ? value : '';
}

function sortedConfigs(table) {
  if (!table?.size) throw new Error('Hero favour configuration is missing');
  return [...table.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
}

function levelFor(value, levels) {
  let level = 1;
  for (const config of levels) {
    if (Number(config.need_favor ?? 0) > value) break;
    level = Number(config.tid);
  }
  return level;
}

export function createHeroFavorService({ store, codec, heroTables, tables, now = () => Date.now() }) {
  const heroLevels = sortedConfigs(heroTables.FavourLevel);
  const totalLevels = sortedConfigs(heroTables.AllFavourLevel);
  const constant = heroTables.FavourConst?.get(1);
  if (!constant) throw new Error('Hero favour constant is missing');

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(5, 'Hero favour clock is invalid');
    return value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  function normalizeHero(row, hero) {
    const tid = uint32(row?.hero_tid, 'hero_tid');
    if (tid === 0) fail(5, 'Hero favour hero_tid is invalid');
    return {
      hero_tid: tid,
      favour: uint32(row?.favour, 'favour'),
      all_play_times: uint32(row?.all_play_times, 'all_play_times'),
      all_gift_times: uint32(row?.all_gift_times, 'all_gift_times'),
      got_level_award: bytesField(row?.got_level_award),
      day_play_times: uint32(row?.day_play_times, 'day_play_times'),
      // Hero breakthrough state is authoritative in the hero roster. Syncing
      // it here repairs saves made before a breakthrough updated this slot.
      break_level: uint32(hero?.breakthrough_level ?? hero?.break_level ?? row?.break_level, 'break_level')
    };
  }

  function normalizeState(value, heroInfo, at) {
    const previousLastRefresh = uint32(value?.last_refresh_time, 'last_refresh_time');
    const sameDay = previousLastRefresh !== 0 && dayIndex(previousLastRefresh) === dayIndex(at);
    const rows = Array.isArray(value?.favours) ? value.favours : [];
    const favours = rows.map(row => {
      const tid = uint32(row?.hero_tid, 'hero_tid');
      const hero = (heroInfo.hero_list ?? []).find(candidate => Number(candidate.tid) === tid);
      const normalized = normalizeHero(row, hero);
      if (!sameDay) normalized.day_play_times = 0;
      return normalized;
    }).sort((left, right) => left.hero_tid - right.hero_tid);

    if (new Set(favours.map(row => row.hero_tid)).size !== favours.length) {
      fail(5, 'Duplicate hero favour state');
    }
    const allFavour = favours.reduce((sum, row) => sum + row.favour, 0);
    if (allFavour > MAX_UINT32) fail(5, 'Hero favour total exceeds uint32');
    return {
      favours,
      all_favour: allFavour,
      last_refresh_time: sameDay ? previousLastRefresh : at,
      play_times: sameDay ? uint32(value?.play_times, 'play_times') : 0,
      favour_level: levelFor(allFavour, totalLevels)
    };
  }

  function readState(model, at = currentSeconds()) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(5, 'Hero login module is missing');
    const target = module.value[FAVOR_SLOT];
    const bytes = target ? rawBinary(target) : Buffer.alloc(0);
    const previous = bytes.length ? codec.unpack('pb_role_hero_favour', bytes) : {};
    return { modules, module, state: normalizeState(previous, model.heroInfo, at) };
  }

  function writeState(model, state) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(5, 'Hero login module is missing');
    while (module.value.length <= FAVOR_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[FAVOR_SLOT] = serializedBinary(codec.pack('pb_role_hero_favour', state));
    model.state.modules.value = [...modules];
  }

  function ownedHero(model, tid) {
    const hero = (model.heroInfo.hero_list ?? []).find(candidate => Number(candidate.tid) === tid);
    if (!hero) fail(5, 'Hero is not owned');
    return hero;
  }

  function favourRow(state, hero) {
    const tid = Number(hero.tid);
    let row = state.favours.find(candidate => candidate.hero_tid === tid);
    if (!row) {
      row = {
        hero_tid: tid,
        favour: 0,
        all_play_times: 0,
        all_gift_times: 0,
        got_level_award: '',
        day_play_times: 0,
        break_level: uint32(hero.breakthrough_level ?? hero.break_level, 'break_level')
      };
      state.favours.push(row);
      state.favours.sort((left, right) => left.hero_tid - right.hero_tid);
    }
    row.break_level = uint32(hero.breakthrough_level ?? hero.break_level, 'break_level');
    return row;
  }

  function recomputeTotals(state) {
    state.all_favour = state.favours.reduce((sum, row) => sum + row.favour, 0);
    if (state.all_favour > MAX_UINT32) fail(5, 'Hero favour total exceeds uint32');
    state.favour_level = levelFor(state.all_favour, totalLevels);
  }

  function assertBelowBreakCap(row, favour) {
    const cap = heroTables.FavourBreak?.get(row.break_level);
    if (!cap) fail(5, 'Hero favour break configuration is missing');
    const max = uint32(cap.max_favor_level, 'max_favor_level');
    if (max !== 0 && levelFor(favour, heroLevels) > max) fail(309, 'Hero favour reached its break-level cap');
  }

  function response(state, row, resChange, schema) {
    return {
      schema,
      value: { favour: row, res_change: resChange, all_favour: state.all_favour, favour_level: state.favour_level }
    };
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const at = currentSeconds();
      const { state } = readState(model, at);
      writeState(model, state);
      return {
        heroCount: state.favours.length,
        allFavour: state.all_favour,
        playTimes: state.play_times,
        level: state.favour_level
      };
    });
  }

  function sendGifts(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { state } = readState(model, at);
      const tid = positiveTid(input?.hero_tid);
      const hero = ownedHero(model, tid);
      const row = favourRow(state, hero);
      const requested = Array.isArray(input?.gifts) ? input.gifts : [];
      if (!requested.length || requested.length > 64) fail(1, 'Invalid hero favour gifts');

      const totals = new Map();
      for (const gift of requested) {
        const giftTid = positiveTid(gift?.tid);
        const config = heroTables.FavourGift?.get(giftTid);
        const count = Number(gift?.num);
        if (!config || !Number.isSafeInteger(count) || count <= 0) fail(1, 'Invalid hero favour gift');
        totals.set(giftTid, (totals.get(giftTid) ?? 0) + count);
      }

      let added = 0, giftCount = 0;
      for (const [giftTid, count] of totals) {
        const config = heroTables.FavourGift.get(giftTid);
        const value = Number(config.favour);
        if (!Number.isSafeInteger(value) || value <= 0) fail(5, 'Hero favour gift configuration is invalid');
        added += value * count;
        giftCount += count;
      }
      const nextFavour = row.favour + added;
      if (!Number.isSafeInteger(nextFavour) || nextFavour > MAX_UINT32) fail(5, 'Hero favour exceeds uint32');
      assertBelowBreakCap(row, nextFavour);
      const resChange = consumeResources(model, [...totals.entries()]);

      row.favour = nextFavour;
      row.all_gift_times = uint32(row.all_gift_times + giftCount, 'all_gift_times');
      state.last_refresh_time = at;
      recomputeTotals(state);
      writeState(model, state);
      const result = response(state, row, resChange, 'pb_hero_favour_gift_rsp');
      return {
        ...result,
        data: codec.pack(result.schema, result.value),
        valueForLog: { heroTid: tid, added, gifts: giftCount }
      };
    });
  }

  function playFavour(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { state } = readState(model, at);
      const args = Array.isArray(input) ? input : input?.value;
      if (!Array.isArray(args) || args.length < 1 || args.length > 2) fail(1, 'Invalid hero favour play request');
      if (args.length === 2 && typeof args[1] !== 'boolean') fail(1, 'Invalid hero favour play request');
      const tid = positiveTid(args[0]);
      const hero = ownedHero(model, tid);
      const row = favourRow(state, hero);

      const playground = heroTables.PlaygroundUnlock?.get(tid);
      if (!playground) fail(5, 'Hero playground configuration is missing');
      if (levelFor(row.favour, heroLevels) < Number(playground.unlock_favour_level ?? 0)) {
        fail(309, 'Hero playground is not unlocked');
      }

      const roleLimit = uint32(constant.day_play_times, 'day_play_times');
      const heroLimit = uint32(constant.hero_day_play_times, 'hero_day_play_times');
      if (state.play_times >= roleLimit) fail(308, 'Daily hero play limit reached');
      if (row.day_play_times >= heroLimit) fail(308, 'Hero daily play limit reached');

      const cost = Array.isArray(constant.day_play_item) ? constant.day_play_item : [];
      if (!cost.length) fail(5, 'Hero play cost configuration is missing');
      const resChange = consumeResources(model, cost.map(pair => [positiveTid(pair?.[0]), Number(pair?.[1])]));
      state.play_times = uint32(state.play_times + 1, 'play_times');
      row.day_play_times = uint32(row.day_play_times + 1, 'day_play_times');
      row.all_play_times = uint32(row.all_play_times + 1, 'all_play_times');
      state.last_refresh_time = at;
      recomputeTotals(state);
      writeState(model, state);
      const result = response(state, row, resChange, 'pb_hero_favour_play_rsp');
      return {
        ...result,
        data: codec.pack(result.schema, result.value),
        valueForLog: { heroTid: tid, playTimes: state.play_times }
      };
    });
  }

  function claimLevelAwards(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { state } = readState(model, at);
      const tid = positiveTid(input?.hero_tid);
      const hero = ownedHero(model, tid);
      const row = favourRow(state, hero);
      const requested = Array.isArray(input?.tid_list) ? input.tid_list.map(Number) : [];
      if (!requested.length || requested.length > 64 || new Set(requested).size !== requested.length) {
        fail(1, 'Invalid hero favour level award request');
      }

      let bits = Buffer.from(row.got_level_award ?? '', 'base64');
      const awards = [];
      for (const awardTid of requested) {
        const config = heroTables.FavourLevel.get(awardTid);
        if (!config || Number(config.tid) === 1) fail(5, 'Hero favour level award configuration is missing');
        if (Number(config.need_favor) > row.favour) fail(311, 'Hero favour level award is not unlocked');
        if (hasBit(bits, awardTid)) fail(310, 'Hero favour level award was already claimed');
        for (const pair of config.level_up_award ?? []) awards.push([Number(pair[0]), Number(pair[1])]);
      }

      const resChange = grantResources(model, awards, tables, { codec });
      for (const awardTid of requested) bits = setBit(bits, awardTid);
      row.got_level_award = bits.toString('base64');
      state.last_refresh_time = at;
      recomputeTotals(state);
      writeState(model, state);
      return {
        schema: 'pb_hero_favour_level_award_rsp',
        value: { got_level_award: bits, res_change: resChange },
        data: codec.pack('pb_hero_favour_level_award_rsp', { got_level_award: bits, res_change: resChange }),
        valueForLog: { heroTid: tid, awardTids: requested, changes: resChange.changes.length }
      };
    });
  }

  function execute(type, input) {
    if (type === 646) return sendGifts(input);
    if (type === 649) return playFavour(input);
    if (type === 653) return claimLevelAwards(input);
    fail(1, 'Invalid hero favour command');
  }

  return {
    ensureLoginState,
    supports: type => type === 646 || type === 649 || type === 653,
    execute
  };
}
