import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readCampHaloTables } from '../config/camp-halo-tables.mjs';
import { GameError } from './hero-progression.mjs';

const COMMAND_LEVEL_UP = 103101;
const SUPPORTED = Object.freeze([COMMAND_LEVEL_UP]);

const CAMP_HALO_MODULE_ID = 182;
const HERO_BLAZON_MODULE_ID = 152;
const MAX_LEVEL = 3;

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

function scalarBytes(module, label) {
  if (!module) return Buffer.alloc(0);
  try {
    if (!module || Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
      fail(CODE_STATE, `${label} login module is not a scalar binary payload`);
    }
    return rawBinary(module);
  } catch (error) {
    if (error instanceof GameError) throw error;
    fail(CODE_STATE, `${label} login module is malformed`);
  }
}

function emptyBlazonState() {
  return {
    chapter_list: [],
    skill_list: [],
    talent_list: [],
    bond_list: [],
    reset_times: 0,
    reset_timestamp: 0,
    max_chart: '0'
  };
}

export function createCampHaloService({
  store, codec, tables = readCampHaloTables(), logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };

  function readCampHalo(model) {
    const module = new Map(model.state.modules.value).get(CAMP_HALO_MODULE_ID);
    const bytes = scalarBytes(module, 'Camp halo');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_camp_halo_role', bytes); }
      catch { fail(CODE_STATE, 'Camp halo login data is invalid'); }
    } else {
      state = { halos: [], select_camp: 0 };
    }
    if (!state || typeof state !== 'object') fail(CODE_STATE, 'Camp halo login data is invalid');
    if (!Array.isArray(state.halos)) fail(CODE_STATE, 'Camp halo list is invalid');
    const selectCamp = stateInteger(state.select_camp ?? 0, 'camp halo selection');
    if (selectCamp !== 0 && !tables.campRows.has(selectCamp)) {
      fail(CODE_STATE, 'Camp halo selection is not configured');
    }

    const levels = new Map();
    for (const halo of state.halos) {
      const camp = stateInteger(halo?.camp_tid, 'camp halo camp', { min: 1 });
      if (!tables.campRows.has(camp)) fail(CODE_STATE, 'Camp halo state contains an unsupported camp');
      const level = stateInteger(halo?.level, `camp halo ${camp} level`, { min: 0, max: MAX_LEVEL });
      if (levels.has(camp)) fail(CODE_STATE, 'Camp halo state contains duplicate camps');
      levels.set(camp, level);
    }
    return { state, levels, selectCamp };
  }

  function readBlazon(model) {
    const module = new Map(model.state.modules.value).get(HERO_BLAZON_MODULE_ID);
    const bytes = scalarBytes(module, 'Hero blazon');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_hero_blazon', bytes); }
      catch { fail(CODE_STATE, 'Hero blazon login data is invalid'); }
    } else {
      state = emptyBlazonState();
    }
    if (!state || typeof state !== 'object' || !Array.isArray(state.bond_list)) {
      fail(CODE_STATE, 'Hero blazon bond list is invalid');
    }
    return state;
  }

  function chartValues(model) {
    const blazon = readBlazon(model);
    const activeByGroup = new Map();
    for (const chapter of blazon.bond_list) {
      const chapterId = stateInteger(chapter?.chapter_id, 'hero blazon chapter', { min: 1, max: 4 });
      if (!Array.isArray(chapter.bond_list)) {
        fail(CODE_STATE, `Hero blazon chapter ${chapterId} bond list is invalid`);
      }
      for (const rawTid of chapter.bond_list) {
        const tid = stateInteger(rawTid, `hero blazon chapter ${chapterId} bond tid`, { min: 1 });
        const attr = tables.bondForTid(tid);
        const group = tables.groupForBondTid(tid);
        if (!attr || !group) fail(CODE_STATE, `Hero blazon bond ${tid} is not configured`);
        const previous = activeByGroup.get(group.tid);
        if (previous && previous.tid !== tid) {
          fail(CODE_STATE, `Hero blazon bond group ${group.tid} contains multiple active bonds`);
        }
        activeByGroup.set(group.tid, { tid, attr, group });
      }
    }

    const values = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const { attr, group } of activeByGroup.values()) {
      values[group.campus] += Number(attr.chart_value);
    }
    return values;
  }

  function writeCampHalo(model, state) {
    const modules = new Map(model.state.modules.value);
    modules.set(CAMP_HALO_MODULE_ID, serializedBinary(codec.pack('pb_camp_halo_role', state)));
    model.state.modules.value = [...modules];
  }

  function responseState(levels, selectCamp) {
    const halos = [];
    for (const camp of tables.campOrder) {
      if (levels.has(camp)) halos.push({ camp_tid: camp, level: levels.get(camp) });
    }
    return { halos, select_camp: selectCamp };
  }

  function ensureLoginState() {
    const model = store.read();
    const halo = readCampHalo(model);
    const values = chartValues(model);
    return {
      levels: Object.fromEntries([...halo.levels].map(([camp, level]) => [camp, level])),
      selectCamp: halo.selectCamp,
      chartValues: values
    };
  }

  function levelUp(campInput) {
    const camp = positiveInteger(campInput, 'camp halo camp');
    if (!tables.campRows.has(camp)) fail(CODE_STATE, 'Camp halo camp is not configured');
    return store.transaction(model => {
      const halo = readCampHalo(model);
      const currentLevel = halo.levels.get(camp) ?? 0;
      if (currentLevel >= MAX_LEVEL) fail(CODE_STATE, 'Camp halo is already at maximum level');
      const nextLevel = currentLevel + 1;
      const entry = tables.entryFor(camp, nextLevel);
      if (!entry) fail(CODE_STATE, 'Camp halo next level is not configured');

      const values = chartValues(model);
      const requiredCampuses = tables.requiredCampuses(camp);
      const insufficient = requiredCampuses.filter(campus => values[campus] < entry.threshold);
      if (insufficient.length) {
        fail(CODE_STATE, `Camp halo chart value is below level ${nextLevel} threshold`);
      }

      halo.levels.set(camp, nextLevel);
      const state = responseState(halo.levels, halo.selectCamp);
      writeCampHalo(model, state);
      const data = codec.pack('pb_camp_halo_role', state);
      log({
        event: 'camp_halo_level_up_committed',
        camp,
        from: currentLevel,
        to: nextLevel,
        threshold: entry.threshold,
        unlockScript: entry.unlockScript,
        chartValues: { ...values },
        selectCamp: halo.selectCamp
      });
      return {
        schema: 'pb_camp_halo_role',
        value: state,
        data,
        valueForLog: {
          camp,
          from: currentLevel,
          to: nextLevel,
          threshold: entry.threshold,
          chartValues: { ...values }
        }
      };
    });
  }

  async function decode(type, data, { etf } = {}) {
    if (Number(type) !== COMMAND_LEVEL_UP) fail(CODE_INVALID, 'Unsupported camp halo command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'Camp halo ETF decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Camp halo request is empty');
    let value;
    try { value = await etf(input); }
    catch { fail(CODE_INVALID, 'Camp halo request is not valid ETF'); }
    const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
    return positiveInteger(candidate, 'camp halo camp');
  }

  function execute(type, camp) {
    if (Number(type) !== COMMAND_LEVEL_UP) fail(CODE_INVALID, 'Unsupported camp halo command');
    return levelUp(camp);
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    requestSchema: () => null,
    ensureLoginState,
    decode,
    execute,
    chartValues
  };
}

export const CAMP_HALO_COMMANDS = SUPPORTED;
