import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readHeroBlazonTables } from '../config/hero-blazon-tables.mjs';
import { consumeResources } from './resources.mjs';
import { GameError } from './hero-progression.mjs';

// Closed HERO-HEROBLAZON paths in the bundled client prototypes:
// - 88955 uses the Skill row's active_item and active_chart_value, plus the
//   preceding star in the same source family.
// - 88957 sends a BondGroup source id. HeroBlazonBondMgr advances the current
//   group row by one star after requiring all five BondItemNeed special items;
//   the server returns the submitted resource changes and the complete current
//   talent allocation, which the client installs with UpdateAllTalentData.
// Chapter-cell construction, talent reallocation and skill reset remain
// fail-closed because their server-side cost/limit/result chains are unproven.
const COMMAND_SKILL_UP = 88955;
const COMMAND_BOND_UP = 88957;
const SUPPORTED = Object.freeze([COMMAND_SKILL_UP, COMMAND_BOND_UP]);

const HERO_BLAZON_MODULE_ID = 152;

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

function scalarBytes(module, label) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail(CODE_STATE, `${label} login module is not a scalar binary payload`);
  }
  try { return rawBinary(module); }
  catch { fail(CODE_STATE, `${label} login module is malformed`); }
}

export function createHeroBlazonService({ store, codec, tables = readHeroBlazonTables(), logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function readState(model) {
    const module = new Map(model.state.modules.value).get(HERO_BLAZON_MODULE_ID);
    const bytes = scalarBytes(module, 'Hero blazon');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_hero_blazon', bytes); }
      catch { fail(CODE_STATE, 'Hero blazon login data is invalid'); }
    } else {
      state = emptyBlazonState();
    }
    if (!state || typeof state !== 'object') fail(CODE_STATE, 'Hero blazon login data is invalid');
    for (const field of ['chapter_list', 'skill_list', 'talent_list', 'bond_list']) {
      if (!Array.isArray(state[field])) fail(CODE_STATE, `Hero blazon ${field} is invalid`);
    }
    const skills = new Set();
    for (const rawTid of state.skill_list) {
      const tid = stateInteger(rawTid, 'hero blazon skill tid', { min: 1 });
      if (!tables.skillForTid(tid)) fail(CODE_STATE, `Hero blazon skill ${tid} is not configured`);
      if (skills.has(tid)) fail(CODE_STATE, `Hero blazon skill ${tid} is duplicated`);
      skills.add(tid);
    }
    const bonds = [];
    for (const chapter of state.bond_list) {
      const chapterId = stateInteger(chapter?.chapter_id, 'hero blazon bond chapter', { min: 1, max: 4 });
      if (!Array.isArray(chapter.bond_list)) {
        fail(CODE_STATE, `Hero blazon chapter ${chapterId} bond list is invalid`);
      }
      for (const rawTid of chapter.bond_list) {
        const tid = stateInteger(rawTid, `hero blazon chapter ${chapterId} bond tid`, { min: 1 });
        bonds.push(tid);
      }
    }
    let chartValues;
    try { chartValues = tables.chartValuesFromBonds(bonds); }
    catch (error) { fail(CODE_STATE, error.message); }
    return { state, skills, bonds, chartValues };
  }

  function writeState(model, state) {
    const modules = new Map(model.state.modules.value);
    modules.set(HERO_BLAZON_MODULE_ID, serializedBinary(codec.pack('pb_hero_blazon', state)));
    model.state.modules.value = [...modules];
  }

  function skillUp(skillInput) {
    const skillTid = positiveInteger(skillInput, 'hero blazon skill tid');
    const row = tables.skillForTid(skillTid);
    if (!row) fail(CODE_STATE, `Hero blazon skill ${skillTid} is not configured`);
    const star = tables.skillStar(skillTid);
    const source = tables.skillSource(skillTid);
    const costPair = Array.isArray(row.active_item?.[0]) ? row.active_item[0] : row.active_item;
    const [costItem, costCount] = costPair ?? [];
    if (!Number.isSafeInteger(Number(costItem)) || Number(costItem) <= 0 || !Number.isSafeInteger(Number(costCount)) || Number(costCount) < 0) {
      fail(CODE_STATE, `Hero blazon skill ${skillTid} has an invalid cost row`);
    }

    return store.transaction(model => {
      const current = readState(model);
      if (current.skills.has(skillTid)) fail(CODE_STATE, 'Hero blazon skill is already active');
      if (star === 0) {
        fail(CODE_STATE, 'R1-HEROBLAZON-SKILL-BASE: base skill activation consumer is not recovered');
      }
      if (star > 0 && !current.skills.has(skillTid - 1)) {
        fail(CODE_STATE, `Hero blazon skill ${skillTid} requires the previous star ${skillTid - 1}`);
      }
      const chartValue = current.chartValues.get(Number(row.blazon_campus)) ?? 0;
      const requiredChart = stateInteger(row.active_chart_value, `Hero blazon skill ${skillTid} chart value`);
      if (chartValue < requiredChart) {
        fail(CODE_STATE, `Hero blazon skill ${skillTid} requires chart value ${requiredChart}, chapter has ${chartValue}`);
      }

      const costs = Number(costCount) > 0 ? [[Number(costItem), Number(costCount)]] : [];
      const consumed = costs.length ? consumeResources(model, costs) : { changes: [] };
      const skills = [...current.state.skill_list].map(Number);
      skills.push(skillTid);
      skills.sort((left, right) => left - right);
      current.state.skill_list = skills;
      writeState(model, current.state);

      const value = {
        skill_tid: skillTid,
        res_client: { changes: consumed.changes, is_overflow: false }
      };
      const data = codec.pack('pb_hero_blazon_update_skill_back', value);
      log({
        event: 'hero_blazon_skill_up_committed',
        skillTid,
        source,
        star,
        chartValue,
        requiredChart,
        cost: costs[0] ?? null,
        changes: consumed.changes.length
      });
      return {
        schema: 'pb_hero_blazon_update_skill_back',
        value,
        data,
        valueForLog: { skillTid, source, star, chartValue, requiredChart }
      };
    });
  }

  function bondUp(sourceInput) {
    const sourceId = positiveInteger(sourceInput, 'hero blazon bond source id');
    const group = tables.rows.BondGroup.get(sourceId);
    if (!group) fail(CODE_STATE, `Hero blazon bond source ${sourceId} is not configured`);
    const needRows = tables.bondNeedsForGroup(sourceId);
    if (needRows.length === 0) fail(CODE_STATE, `Hero blazon bond source ${sourceId} has no material rows`);
    const costs = new Map();
    for (const needRow of needRows) costs.set(needRow.special_item, (costs.get(needRow.special_item) ?? 0) + 1);

    return store.transaction(model => {
      const current = readState(model);
      const owned = current.bonds.filter(tid => tables.bondGroupForTid(tid)?.tid === sourceId);
      if (owned.length > 1) fail(CODE_STATE, `Hero blazon bond source ${sourceId} is duplicated`);
      const currentTid = owned[0] ?? sourceId * 100;
      const nextStar = currentTid % 100 + 1;
      const nextTid = sourceId * 100 + nextStar;
      if (!tables.bondAttrForTid(nextTid)) fail(CODE_STATE, 'Hero blazon bond is already at max star');
      if (nextStar > tables.bondMaxStar(sourceId)) fail(CODE_STATE, 'Hero blazon bond is already at max star');

      const consumed = consumeResources(model, [...costs], CODE_STATE);
      const chapters = new Map();
      for (const chapter of current.state.bond_list) {
        const chapterId = stateInteger(chapter?.chapter_id, 'hero blazon bond chapter', { min: 1, max: 4 });
        chapters.set(chapterId, [...chapter.bond_list].map(Number));
      }
      const chapterId = Number(group.campus);
      const chapterBonds = chapters.get(chapterId) ?? [];
      const kept = chapterBonds.filter(tid => tables.bondGroupForTid(tid)?.tid !== sourceId);
      kept.push(nextTid);
      kept.sort((left, right) => left - right);
      chapters.set(chapterId, kept);
      current.state.bond_list = [...chapters]
        .sort(([left], [right]) => left - right)
        .map(([chapter_id, bond_list]) => ({ chapter_id, bond_list }));

      // The bond success callback calls UpdateAllTalentData(update_talent_list).
      // An empty list resets allocations, so this response must preserve the
      // authoritative full list while the bond itself changes.
      const updateTalentList = current.state.talent_list.map(row => ({
        tid: row.tid,
        attr_val: row.attr_val
      }));
      writeState(model, current.state);

      const value = {
        res_client: { changes: consumed.changes, is_overflow: false },
        update_talent_list: updateTalentList
      };
      const data = codec.pack('pb_hero_blazon_bond_up_rsp', value);
      log({
        event: 'hero_blazon_bond_up_committed',
        sourceId,
        chapterId,
        currentTid,
        nextTid,
        costs: [...costs],
        changes: consumed.changes.length
      });
      return {
        schema: 'pb_hero_blazon_bond_up_rsp',
        value,
        data,
        valueForLog: { sourceId, chapterId, currentTid, nextTid }
      };
    });
  }

  async function decode(type, data, { etf } = {}) {
    if (!SUPPORTED.includes(Number(type))) fail(CODE_INVALID, 'Unsupported hero blazon command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'Hero blazon ETF decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Hero blazon request is empty');
    let decoded;
    try { decoded = await etf(input); }
    catch { fail(CODE_INVALID, 'Hero blazon request is not valid ETF'); }
    const candidate = Array.isArray(decoded) ? decoded.length === 1 ? decoded[0] : undefined : decoded;
    return positiveInteger(candidate, Number(type) === COMMAND_BOND_UP
      ? 'hero blazon bond source id'
      : 'hero blazon skill tid');
  }

  function execute(type, input) {
    if (Number(type) === COMMAND_SKILL_UP) return skillUp(input);
    if (Number(type) === COMMAND_BOND_UP) return bondUp(input);
    fail(CODE_INVALID, 'Unsupported hero blazon command');
  }

  function ensureLoginState() {
    const model = store.read();
    const current = readState(model);
    return {
      skills: [...current.skills].sort((left, right) => left - right),
      bonds: current.bonds.slice(),
      talents: current.state.talent_list.map(row => ({ tid: String(row.tid), attr_val: Number(row.attr_val) })),
      chartValues: Object.fromEntries(current.chartValues)
    };
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    isEtfRequest: type => SUPPORTED.includes(Number(type)),
    requestSchema: () => null,
    ensureLoginState,
    decode,
    execute
  };
}

export const HERO_BLAZON_COMMANDS = SUPPORTED;
