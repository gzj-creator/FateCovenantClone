import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  HERO_LEGEND_BLESS_SLOTS,
  HERO_LEGEND_INITIAL_STAR,
  HERO_LEGEND_LEVELS_PER_STAGE,
  HERO_LEGEND_MAX_LEVEL,
  HERO_LEGEND_MAX_STAGE,
  HERO_LEGEND_MAX_STAR,
  readHeroLegendTables
} from '../config/hero-legend-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';

export const HERO_LEGEND_COMMANDS = Object.freeze([89801, 89802, 89803, 89804]);
export const HERO_LEGEND_MODULE_ID = 154;

const CODE_INVALID = 1;
const CODE_STATE = 5;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function stateInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_STATE, `Invalid ${label}`);
  return number;
}

function emptyState() {
  return { active_list: [] };
}

function scalarBytes(module, label) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail(CODE_STATE, `${label} login module is not a scalar binary payload`);
  }
  try { return rawBinary(module); }
  catch { fail(CODE_STATE, `${label} login module is malformed`); }
}

function activeSnapshot(row) {
  return {
    tid: String(row.tid),
    star: row.star,
    level: row.level,
    stage: row.stage,
    bless_hero_list: row.bless_hero_list.map(Number)
  };
}

export function createHeroLegendService({
  store,
  codec,
  tables = readHeroLegendTables(),
  heroTables,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!heroTables?.Hero?.size) throw new Error('HeroLegend hero table is unavailable');

  function normalizeActive(raw, seenTids) {
    const tid = stateInteger(raw?.tid, 'hero legend book tid', { min: 1 });
    const config = tables.bookForHeroTid(tid);
    if (!config) fail(CODE_STATE, `Hero legend book ${tid} is not configured`);
    if (seenTids.has(tid)) fail(CODE_STATE, `Hero legend book ${tid} is duplicated`);
    seenTids.add(tid);

    const star = stateInteger(raw?.star, `hero legend book ${tid} star`, {
      min: HERO_LEGEND_INITIAL_STAR, max: HERO_LEGEND_MAX_STAR
    });
    const level = stateInteger(raw?.level ?? 0, `hero legend book ${tid} level`, { min: 0, max: HERO_LEGEND_MAX_LEVEL });
    const stage = stateInteger(raw?.stage ?? 0, `hero legend book ${tid} stage`, { min: 0, max: HERO_LEGEND_MAX_STAGE });
    if (stage > 0 && star !== HERO_LEGEND_MAX_STAR) {
      fail(CODE_STATE, `Hero legend book ${tid} has a stage below ten stars`);
    }
    if (star === HERO_LEGEND_MAX_STAR && level > stage * HERO_LEGEND_LEVELS_PER_STAGE) {
      fail(CODE_STATE, `Hero legend book ${tid} level exceeds its stage cap`);
    }

    const rawBlessings = raw?.bless_hero_list ?? [];
    if (!Array.isArray(rawBlessings) || rawBlessings.length > HERO_LEGEND_BLESS_SLOTS) {
      fail(CODE_STATE, `Hero legend book ${tid} blessing list is invalid`);
    }
    const allowedHeroes = new Set(config.bless_hero.map(Number));
    const blessings = [];
    for (const rawTid of rawBlessings) {
      const heroTid = stateInteger(rawTid, `hero legend book ${tid} blessing hero`, { min: 1 });
      if (!allowedHeroes.has(heroTid)) fail(CODE_STATE, `Hero legend book ${tid} blessing hero ${heroTid} is not configured`);
      if (blessings.includes(heroTid)) fail(CODE_STATE, `Hero legend book ${tid} blessing hero ${heroTid} is duplicated`);
      blessings.push(heroTid);
    }
    return { tid, star, level, stage, bless_hero_list: blessings };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object') fail(CODE_STATE, 'Hero legend login data is invalid');
    if (!Array.isArray(raw.active_list)) fail(CODE_STATE, 'Hero legend active list is invalid');
    const seen = new Set();
    const activeList = raw.active_list.map(row => normalizeActive(row, seen));
    activeList.sort((left, right) => left.tid - right.tid);
    return { ...raw, active_list: activeList };
  }

  function readState(model, { writeEmpty = false } = {}) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_LEGEND_MODULE_ID);
    const bytes = scalarBytes(module, 'Hero legend');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_hero_legend_book', bytes); }
      catch { fail(CODE_STATE, 'Hero legend login data is invalid'); }
    } else {
      state = emptyState();
    }
    state = normalizeState(state);
    return { modules, module, state, needsCanonicalWrite: writeEmpty && !bytes.length };
  }

  function writeState(model, modules, state) {
    modules.set(HERO_LEGEND_MODULE_ID, serializedBinary(codec.pack('pb_hero_legend_book', state)));
    model.state.modules.value = [...modules];
  }

  function ownedHero(model, tid, label = 'Hero') {
    const matches = (model.heroInfo?.hero_list ?? []).filter(hero => Number(hero?.tid) === Number(tid));
    if (matches.length !== 1) {
      fail(CODE_STATE, matches.length ? `${label} ownership is ambiguous` : `${label} is not owned`);
    }
    if (!heroTables.Hero.has(Number(tid))) fail(CODE_STATE, `${label} configuration is missing`);
    return matches[0];
  }

  function findActive(state, tid) {
    return state.active_list.find(row => row.tid === tid) ?? null;
  }

  function activeResponse(active) {
    return activeSnapshot(active);
  }

  function handleStar(tidInput) {
    const tid = positiveInteger(tidInput, 'hero legend book tid');
    const config = tables.bookForHeroTid(tid);
    if (!config) fail(CODE_STATE, `Hero legend book ${tid} is not configured`);
    return store.transaction(model => {
      const { modules, state } = readState(model);
      const hero = ownedHero(model, tid);
      let active = findActive(state, tid);
      let action;
      if (!active) {
        active = {
          tid,
          star: HERO_LEGEND_INITIAL_STAR,
          level: 0,
          stage: 0,
          bless_hero_list: []
        };
        state.active_list.push(active);
        state.active_list.sort((left, right) => left.tid - right.tid);
        action = 'activate';
      } else {
        if (active.star >= HERO_LEGEND_MAX_STAR) fail(CODE_STATE, 'Hero legend book is already at maximum star');
        if (Number(hero.star) < active.star) {
          fail(CODE_STATE, `Hero legend book requires hero star ${active.star}`);
        }
        active.star += 1;
        action = 'star_up';
      }
      writeState(model, modules, state);
      const value = activeResponse(active);
      log({ event: 'hero_legend_committed', command: 89801, action, tid, star: active.star });
      return {
        schema: 'pb_hero_legend_book_active',
        value,
        data: codec.pack('pb_hero_legend_book_active', value),
        valueForLog: { command: 89801, action, tid, star: active.star }
      };
    });
  }

  function handleBless([tidInput, slotInput] = []) {
    const tid = positiveInteger(tidInput, 'hero legend book tid');
    const slot = positiveInteger(slotInput, 'hero legend blessing slot');
    const config = tables.bookForHeroTid(tid);
    if (!config) fail(CODE_STATE, `Hero legend book ${tid} is not configured`);
    const open = tables.blessOpenForSlot(slot);
    if (!open) fail(CODE_STATE, `Hero legend blessing slot ${slot} is not configured`);
    const blessHeroTid = tables.blessHeroForSlot(config, slot);
    if (!blessHeroTid) fail(CODE_STATE, `Hero legend book ${tid} blessing slot ${slot} is not configured`);

    return store.transaction(model => {
      const { modules, state } = readState(model);
      const active = findActive(state, tid);
      if (!active) fail(CODE_STATE, 'Hero legend book is not active');
      if (active.star < Number(open.need_star)) {
        fail(CODE_STATE, `Hero legend blessing slot ${slot} requires ${open.need_star} stars`);
      }
      if (active.bless_hero_list.includes(blessHeroTid)) fail(CODE_STATE, 'Hero legend blessing is already active');
      ownedHero(model, blessHeroTid, 'Blessing hero');
      active.bless_hero_list.push(blessHeroTid);
      writeState(model, modules, state);
      const value = activeResponse(active);
      log({ event: 'hero_legend_committed', command: 89802, tid, slot, blessHeroTid, star: active.star });
      return {
        schema: 'pb_hero_legend_book_active',
        value,
        data: codec.pack('pb_hero_legend_book_active', value),
        valueForLog: { command: 89802, tid, slot, blessHeroTid, star: active.star }
      };
    });
  }

  function handleLevel(tidInput) {
    const tid = positiveInteger(tidInput, 'hero legend book tid');
    const config = tables.bookForHeroTid(tid);
    if (!config) fail(CODE_STATE, `Hero legend book ${tid} is not configured`);
    const heroConfig = heroTables.Hero.get(tid);
    if (!heroConfig) fail(CODE_STATE, `Hero legend hero ${tid} configuration is missing`);
    const chipTid = positiveInteger(heroConfig.chip, 'hero legend chip tid');

    return store.transaction(model => {
      const { modules, state } = readState(model);
      const active = findActive(state, tid);
      if (!active) fail(CODE_STATE, 'Hero legend book is not active');
      ownedHero(model, tid);
      if (active.level >= HERO_LEGEND_MAX_LEVEL) fail(CODE_STATE, 'Hero legend book is already at maximum level');
      const levelCap = active.star === HERO_LEGEND_MAX_STAR
        ? active.stage * HERO_LEGEND_LEVELS_PER_STAGE
        : HERO_LEGEND_MAX_LEVEL;
      if (active.level >= levelCap) fail(CODE_STATE, 'Hero legend book level cap requires the next stage');
      const levelRow = tables.levelConfig(active.level + 1);
      if (!levelRow) fail(CODE_STATE, 'Hero legend next level is not configured');
      const cost = stateInteger(levelRow.need_piece, `hero legend level ${levelRow.tid} need_piece`, { min: 1 });
      const consumed = consumeResources(model, [[chipTid, cost]], 301, { codec });
      active.level += 1;
      writeState(model, modules, state);
      const value = {
        elem: activeResponse(active),
        res: { changes: consumed.changes, is_overflow: false }
      };
      log({
        event: 'hero_legend_committed', command: 89803, tid, level: active.level,
        chipTid, cost, changes: consumed.changes.length
      });
      return {
        schema: 'pb_hero_legend_book_active_back',
        value,
        data: codec.pack('pb_hero_legend_book_active_back', value),
        valueForLog: { command: 89803, tid, level: active.level, chipTid, cost }
      };
    });
  }

  function handleStage(tidInput) {
    const tid = positiveInteger(tidInput, 'hero legend book tid');
    if (!tables.bookForHeroTid(tid)) fail(CODE_STATE, `Hero legend book ${tid} is not configured`);
    return store.transaction(model => {
      const { modules, state } = readState(model);
      const active = findActive(state, tid);
      if (!active) fail(CODE_STATE, 'Hero legend book is not active');
      ownedHero(model, tid);
      const stageRow = tables.stageConfig(active.stage + 1);
      if (!stageRow) fail(CODE_STATE, 'Hero legend book is already at maximum stage');
      if (active.star !== Number(stageRow.need_star)) {
        fail(CODE_STATE, `Hero legend stage requires ${stageRow.need_star} stars`);
      }
      if (active.level !== Number(stageRow.need_level)) {
        fail(CODE_STATE, `Hero legend stage requires level ${stageRow.need_level}`);
      }
      active.stage += 1;
      writeState(model, modules, state);
      const value = activeResponse(active);
      log({ event: 'hero_legend_committed', command: 89804, tid, stage: active.stage, level: active.level });
      return {
        schema: 'pb_hero_legend_book_active',
        value,
        data: codec.pack('pb_hero_legend_book_active', value),
        valueForLog: { command: 89804, tid, stage: active.stage, level: active.level }
      };
    });
  }

  async function decode(type, data, { etf } = {}) {
    const command = Number(type);
    if (!HERO_LEGEND_COMMANDS.includes(command)) fail(CODE_INVALID, 'Unsupported HeroLegend command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'Hero legend ETF decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Hero legend request is empty');
    let decoded;
    try { decoded = await etf(input); }
    catch { fail(CODE_INVALID, 'Hero legend request is not valid ETF'); }
    const args = Array.isArray(decoded) ? decoded : [decoded];
    if (command === 89802) {
      if (args.length !== 2) fail(CODE_INVALID, 'Hero legend blessing request must contain book tid and slot');
      return [positiveInteger(args[0], 'hero legend book tid'), positiveInteger(args[1], 'hero legend blessing slot')];
    }
    if (args.length !== 1) fail(CODE_INVALID, 'Hero legend request must contain one book tid');
    return positiveInteger(args[0], 'hero legend book tid');
  }

  function execute(type, input) {
    switch (Number(type)) {
      case 89801: return handleStar(input);
      case 89802: return handleBless(input);
      case 89803: return handleLevel(input);
      case 89804: return handleStage(input);
      default: fail(CODE_INVALID, 'Unsupported HeroLegend command');
    }
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const { modules, state } = readState(model, { writeEmpty: true });
      writeState(model, modules, state);
      return {
        activeCount: state.active_list.length,
        activeBooks: state.active_list.map(activeSnapshot)
      };
    });
  }

  return {
    supports: type => HERO_LEGEND_COMMANDS.includes(Number(type)),
    isEtfRequest: type => HERO_LEGEND_COMMANDS.includes(Number(type)),
    requestSchema: () => null,
    responseSchema: type => Number(type) === 89803
      ? 'pb_hero_legend_book_active_back' : 'pb_hero_legend_book_active',
    ensureLoginState,
    decode,
    execute
  };
}
