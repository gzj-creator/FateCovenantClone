import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { gameDayIndex, gameWeek } from './time.mjs';
import { hasBit, setBit } from './bit-block.mjs';

export const FAVOUR_INTIMACY_COMMANDS = Object.freeze([667, 670, 671]);
export const FAVOUR_INTIMACY_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes Lua login[12] as pb_hero_favour_intimacy.
// This is zero-based slot 11 in the twelve-slot module 10 capture.
export const FAVOUR_INTIMACY_SLOT = 11;

const MAX_UINT32 = 0xffffffff;
const fail = message => { throw new GameError(5, message); };

function uint32(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > MAX_UINT32) {
    fail(`Hero intimacy ${field} is invalid`);
  }
  return number;
}

function heroTid(value) {
  const tid = Number(value);
  if (!Number.isSafeInteger(tid) || tid <= 0 || tid > MAX_UINT32) {
    fail('Hero intimacy request has an invalid hero_tid');
  }
  return tid;
}

function pageId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > MAX_UINT32) {
    fail('Hero intimacy request has an invalid page_id');
  }
  return id;
}

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) fail('Hero intimacy clock is invalid');
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function bytes(value) {
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('base64');
  return typeof value === 'string' ? value : '';
}

function storyBits(encoded) {
  if (!encoded) return Buffer.alloc(0);
  const bits = Buffer.from(encoded, 'base64');
  if (bits.toString('base64') !== encoded) fail('Hero intimacy story bitmap is malformed');
  return bits;
}

function sorted(table, name) {
  if (!table?.size) throw new Error(`Hero intimacy ${name} configuration is missing`);
  return [...table.values()].sort((left, right) => Number(left.level ?? left.tid) - Number(right.level ?? right.tid));
}

function awardPairs(value) {
  if (!Array.isArray(value)) return [];
  return value.map(pair => {
    const tid = Number(pair?.[0]), count = Number(pair?.[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      fail('Hero intimacy award configuration is invalid');
    }
    return [tid, count];
  });
}

export function createHeroIntimacyService({
  store,
  codec,
  heroTables,
  tables,
  intimacyTables,
  now = () => Date.now(),
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const levels = sorted(intimacyTables.FavourIntimacyLevel, 'level');
  const charms = sorted(intimacyTables.FavourIntimacyCharm, 'charm');
  const constant = intimacyTables.FavourIntimacyConst?.get(1);
  if (!constant) throw new Error('Hero intimacy constant configuration is missing');
  if (Number(constant.user_date_cycle) !== 2 || Number(constant.hero_date_cycle) !== 1) {
    throw new Error('Hero intimacy cycle configuration changed without a version migration');
  }
  if (!intimacyTables.FavourIntimacyCycle?.get(1) || !intimacyTables.FavourIntimacyCycle?.get(2)) {
    throw new Error('Hero intimacy cycle rows are missing');
  }
  const maxLevel = Number(levels.at(-1)?.level ?? 0);

  function currentSeconds() {
    return seconds(now());
  }

  function levelConfig(level, field = 'intimacy_level') {
    const row = intimacyTables.FavourIntimacyLevel?.get(level);
    if (!row) fail(`Hero intimacy ${field} ${level} is not configured`);
    return row;
  }

  function normalizeHero(value) {
    const tid = heroTid(value?.hero_tid);
    const level = uint32(value?.intimacy_level || 1, 'intimacy_level');
    if (level < 1 || level > maxLevel) fail('Hero intimacy level is outside the configured range');
    const row = {
      hero_tid: tid,
      intimacy_value: uint32(value?.intimacy_value, 'intimacy_value'),
      intimacy_level: level,
      story_got_bin: bytes(value?.story_got_bin),
      cycle_date_times: uint32(value?.cycle_date_times, 'cycle_date_times'),
      total_date_times: uint32(value?.total_date_times, 'total_date_times'),
      last_date_time: uint32(value?.last_date_time, 'last_date_time')
    };
    const nextNeed = uint32(levelConfig(level).need_intimacy, 'need_intimacy');
    if (level < maxLevel && nextNeed > 0 && row.intimacy_value >= nextNeed) {
      fail('Hero intimacy state has progress beyond its recorded level');
    }
    return row;
  }

  function heroTotal(row) {
    let total = row.intimacy_value;
    for (let level = 1; level < row.intimacy_level; level++) {
      total += uint32(levelConfig(level).need_intimacy, 'need_intimacy');
    }
    return total;
  }

  function charmLevelFor(total) {
    let level = 1;
    for (const row of charms) {
      const need = uint32(row.need_intimacy, 'charm need_intimacy');
      if (need > total) break;
      level = Number(row.level ?? row.tid);
    }
    return level;
  }

  function normalizeState(value, at) {
    const rows = Array.isArray(value?.hero_list) ? value.hero_list : [];
    const lastDateTime = uint32(value?.last_date_time, 'last_date_time');
    const sameWeek = lastDateTime !== 0 && gameWeek(lastDateTime) === gameWeek(at);
    const heroList = rows.map(row => {
      const normalized = normalizeHero(row);
      if (!normalized.last_date_time || gameDayIndex(normalized.last_date_time) !== gameDayIndex(at)) {
        normalized.cycle_date_times = 0;
      }
      return normalized;
    }).sort((left, right) => left.hero_tid - right.hero_tid);
    if (new Set(heroList.map(row => row.hero_tid)).size !== heroList.length) {
      fail('Hero intimacy state has duplicate hero rows');
    }
    let total = 0;
    for (const row of heroList) {
      total += heroTotal(row);
      if (!Number.isSafeInteger(total) || total > MAX_UINT32) fail('Hero intimacy total exceeds uint32');
    }
    return {
      charm_level: charmLevelFor(total),
      total_intimacy: total,
      charm_got_bin: bytes(value?.charm_got_bin),
      hero_list: heroList,
      cycle_date_times: sameWeek ? uint32(value?.cycle_date_times, 'cycle_date_times') : 0,
      last_date_time: lastDateTime
    };
  }

  function readState(model, at) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(FAVOUR_INTIMACY_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail('Hero login module is missing');
    const target = module.value[FAVOUR_INTIMACY_SLOT];
    const packed = target ? rawBinary(target) : Buffer.alloc(0);
    const previous = packed.length ? codec.unpack('pb_hero_favour_intimacy', packed) : {};
    return { modules, module, state: normalizeState(previous, at) };
  }

  function writeState(model, modules, module, state) {
    while (module.value.length <= FAVOUR_INTIMACY_SLOT) {
      module.value.push(serializedBinary(Buffer.alloc(0)));
    }
    module.value[FAVOUR_INTIMACY_SLOT] = serializedBinary(codec.pack('pb_hero_favour_intimacy', state));
    model.state.modules.value = [...modules];
  }

  function recompute(state) {
    let total = 0;
    for (const row of state.hero_list) {
      total += heroTotal(row);
      if (!Number.isSafeInteger(total) || total > MAX_UINT32) fail('Hero intimacy total exceeds uint32');
    }
    state.total_intimacy = total;
    state.charm_level = charmLevelFor(total);
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readState(model, at);
      writeState(model, modules, module, state);
      return {
        heroCount: state.hero_list.length,
        totalIntimacy: state.total_intimacy,
        charmLevel: state.charm_level,
        weekDateTimes: state.cycle_date_times
      };
    });
  }

  function ownedBaseHero(model, tid) {
    const base = intimacyTables.FavourIntimacyBase?.get(tid);
    if (!base) fail('Hero intimacy base configuration is missing');
    const config = heroTables.Hero?.get(tid);
    if (!config) fail('Hero intimacy hero configuration is missing');
    const owned = (model.heroInfo.hero_list ?? []).find(hero => Number(hero.tid) === tid);
    if (!owned) fail('Hero is not owned');
    const openedAt = uint32(base.show_entry_time, 'show_entry_time');
    if (openedAt === 0 || currentSeconds() < openedAt) fail('Hero intimacy entry is not open');
    return { base, config, owned };
  }

  function findOrCreateHero(state, tid) {
    let row = state.hero_list.find(entry => entry.hero_tid === tid);
    if (!row) {
      row = {
        hero_tid: tid,
        intimacy_value: 0,
        intimacy_level: 1,
        story_got_bin: '',
        cycle_date_times: 0,
        total_date_times: 0,
        last_date_time: 0
      };
      state.hero_list.push(row);
      state.hero_list.sort((left, right) => left.hero_tid - right.hero_tid);
    }
    return row;
  }

  function chipAward(hero, row, amount, label) {
    const count = uint32(amount, label);
    if (count === 0) return null;
    const chip = Number(hero?.chip ?? 0);
    if (!Number.isSafeInteger(chip) || chip <= 0) fail('Hero chip reward configuration is missing');
    return [chip, count];
  }

  function addIntimacy(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readState(model, at);
      const tid = heroTid(input?.hero_tid);
      const { config: heroConfig } = ownedBaseHero(model, tid);
      const row = findOrCreateHero(state, tid);
      const requested = Array.isArray(input?.items) ? input.items : [];
      if (!requested.length || requested.length > 64) fail('Hero intimacy items are empty or too numerous');

      const costs = new Map();
      let added = 0;
      for (const item of requested) {
        const itemTid = Number(item?.tid);
        const count = Number(item?.num);
        const config = intimacyTables.FavourIntimacyItem?.get(itemTid);
        if (!config || !Number.isSafeInteger(count) || count <= 0) {
          fail('Hero intimacy item is not configured');
        }
        const value = Number(config.add_intimacy);
        if (!Number.isSafeInteger(value) || value <= 0) fail('Hero intimacy item value is invalid');
        costs.set(itemTid, (costs.get(itemTid) ?? 0) + count);
        added += value * count;
        if (!Number.isSafeInteger(added) || added > MAX_UINT32) fail('Hero intimacy increase exceeds uint32');
      }

      const awards = [];
      let level = row.intimacy_level;
      let value = row.intimacy_value + added;
      if (!Number.isSafeInteger(value) || value > MAX_UINT32) fail('Hero intimacy value exceeds uint32');
      while (level < maxLevel) {
        const need = uint32(levelConfig(level).need_intimacy, 'need_intimacy');
        if (need === 0 || value < need) break;
        value -= need;
        level++;
        const config = levelConfig(level);
        awards.push(...awardPairs(config.award));
        const chip = chipAward(heroConfig, config, config.chip_num, 'chip_num');
        if (chip) awards.push(chip);
      }

      const consumed = consumeResources(model, [...costs.entries()], 301);
      const granted = awards.length ? grantResources(model, awards, tables, { codec }) : { changes: [] };
      row.intimacy_level = level;
      row.intimacy_value = value;
      recompute(state);
      writeState(model, modules, module, state);
      const award = { changes: [...consumed.changes, ...granted.changes], is_overflow: false };
      const response = { hero_data: row, all_data: state, res_change: award };
      const data = codec.pack('pb_hero_intimacy_add_rsp', response);
      log({ event: 'hero_intimacy_add_committed', heroTid: tid, added, level, awards: awards.length });
      return {
        schema: 'pb_hero_intimacy_add_rsp',
        value: response,
        data,
        valueForLog: { heroTid: tid, added, level, awardChanges: award.changes.length }
      };
    });
  }

  function dateHero(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readState(model, at);
      const tid = heroTid(input?.hero_tid);
      const { config: heroConfig } = ownedBaseHero(model, tid);
      const row = findOrCreateHero(state, tid);
      const config = levelConfig(row.intimacy_level);
      const userLimit = uint32(constant.user_date_times_limit, 'user_date_times_limit');
      const heroLimit = uint32(config.date_times, 'date_times');
      if (!userLimit || !heroLimit) fail('Hero intimacy date limit is missing');
      if (state.cycle_date_times >= userLimit) fail('Hero intimacy weekly date limit reached');
      if (row.cycle_date_times >= heroLimit) fail('Hero intimacy daily date limit reached');

      const awards = [...awardPairs(config.date_award)];
      const chip = chipAward(heroConfig, config, config.date_chip_num, 'date_chip_num');
      if (chip) awards.push(chip);
      if (!awards.length) fail('Hero intimacy date award configuration is missing');
      const granted = grantResources(model, awards, tables, { codec });
      row.cycle_date_times = uint32(row.cycle_date_times + 1, 'cycle_date_times');
      row.total_date_times = uint32(row.total_date_times + 1, 'total_date_times');
      row.last_date_time = at;
      state.cycle_date_times = uint32(state.cycle_date_times + 1, 'cycle_date_times');
      state.last_date_time = at;
      recompute(state);
      writeState(model, modules, module, state);
      const response = { all_data: state, award: { changes: granted.changes, is_overflow: false } };
      const data = codec.pack('pb_hero_intimacy_date_rsp', response);
      log({ event: 'hero_intimacy_date_committed', heroTid: tid, level: row.intimacy_level, awards: awards.length });
      return {
        schema: 'pb_hero_intimacy_date_rsp',
        value: response,
        data,
        valueForLog: { heroTid: tid, dateTimes: row.cycle_date_times, awardChanges: granted.changes.length }
      };
    });
  }

  function storyAward(input) {
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readState(model, at);
      const tid = heroTid(input?.hero_tid);
      const requestedPage = pageId(input?.page_id);
      const { base, config: heroConfig } = ownedBaseHero(model, tid);
      const story = Number(base.hero_story);
      const chapter = intimacyTables.pageStory.get(requestedPage);
      const page = intimacyTables.StoryChapterPage.get(requestedPage);
      const choice = page ? intimacyTables.StoryChapterChoice.get(Number(page.chapter)) : null;
      if (chapter !== story || !choice || Number(choice.story) !== story || !page || Number(page.chapter) !== Number(choice.tid)) {
        fail('Hero intimacy story page does not belong to this hero');
      }
      if (!Number.isSafeInteger(Number(page.endingType)) || Number(page.endingType) <= 0) {
        fail('Hero intimacy story page is not an ending page');
      }
      const row = findOrCreateHero(state, tid);
      if (row.intimacy_level < uint32(choice.intimacy_level, 'story intimacy_level')) {
        fail('Hero intimacy story chapter is still locked');
      }
      const bits = storyBits(row.story_got_bin);
      if (hasBit(bits, requestedPage)) fail('Hero intimacy story award has already been claimed');

      const awards = awardPairs(page.award);
      if (!awards.length) fail('Hero intimacy story award configuration is missing');
      const granted = grantResources(model, awards, tables, { codec });
      const nextBits = setBit(bits, requestedPage);
      row.story_got_bin = nextBits.toString('base64');
      recompute(state);
      writeState(model, modules, module, state);
      const response = {
        hero_tid: tid,
        award: { changes: granted.changes, is_overflow: false },
        hero_data: row
      };
      const data = codec.pack('pb_hero_intimacy_story_rsp', response);
      log({
        event: 'hero_intimacy_story_committed',
        heroTid: tid,
        pageId: requestedPage,
        story,
        chapterIndex: Number(choice.index),
        intimacyLevel: row.intimacy_level,
        awardChanges: granted.changes.length,
        heroChipConfigured: Number(heroConfig?.chip ?? 0) > 0
      });
      return {
        schema: 'pb_hero_intimacy_story_rsp',
        value: response,
        data,
        valueForLog: { heroTid: tid, pageId: requestedPage, story, chapterIndex: Number(choice.index) }
      };
    });
  }

  function decode(type, data) {
    if (type === 667) return codec.unpack('pb_hero_intimacy_add_req', data);
    if (type === 670) return codec.unpack('pb_hero_intimacy_date_req', data);
    if (type === 671) return codec.unpack('pb_hero_intimacy_story_req', data);
    fail('Hero intimacy command is not implemented');
  }

  function execute(type, input) {
    if (type === 667) return addIntimacy(input);
    if (type === 670) return dateHero(input);
    if (type === 671) return storyAward(input);
    fail('Hero intimacy command is not implemented');
  }

  return {
    ensureLoginState,
    supports: type => FAVOUR_INTIMACY_COMMANDS.includes(type),
    requestSchema: type => ({
      667: 'pb_hero_intimacy_add_req',
      670: 'pb_hero_intimacy_date_req',
      671: 'pb_hero_intimacy_story_req'
    })[Number(type)] ?? null,
    responseSchema: type => ({
      667: 'pb_hero_intimacy_add_rsp',
      670: 'pb_hero_intimacy_date_rsp',
      671: 'pb_hero_intimacy_story_rsp'
    })[Number(type)] ?? null,
    decode,
    execute
  };
}
