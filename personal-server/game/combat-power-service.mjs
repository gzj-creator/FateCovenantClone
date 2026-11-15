import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readCombatPowerTables } from '../config/combat-power-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const COMMAND_RECEIVE_AWARD = 802;
const SUPPORTED = Object.freeze([COMMAND_RECEIVE_AWARD]);

const STATISTICS_MODULE_ID = 21;
const COMBAT_POWER_STATISTIC_TID = 3;
const COMBAT_POWER_STATISTICS_SLOT = 0;

const CODE_INVALID = 1;
const CODE_STATE = 5;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function stateInteger(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) fail(CODE_STATE, `Invalid ${label}`);
  return number;
}

function encodeBitBlockSync(bits) {
  const value = Buffer.from(bits ?? []);
  const header = Buffer.alloc(6);
  header[0] = 131;
  header[1] = 109;
  header.writeUInt32BE(value.length, 2);
  return Buffer.concat([header, value]);
}

function statisticsSlot(gameTables) {
  const rows = [...(gameTables.CountStatistics?.values() ?? [])]
    .filter(row => !row.custom_login && Number(row.type) === 0);
  const index = rows.findIndex(row => Number(row.tid) === COMBAT_POWER_STATISTIC_TID);
  if (index < 0) throw new Error('CountStatistics is missing the combat-power maximum-progress row 3');
  return index + 1;
}

function decodeStoredBits(state) {
  const encoded = state.combatPower?.receivedBits ?? '';
  if (typeof encoded !== 'string') fail(CODE_STATE, 'Combat-power award bitmap is malformed');
  if (!encoded) return Buffer.alloc(0);
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    fail(CODE_STATE, 'Combat-power award bitmap is malformed');
  }
  const bits = Buffer.from(encoded, 'base64');
  if (bits.toString('base64') !== encoded) fail(CODE_STATE, 'Combat-power award bitmap is malformed');
  return bits;
}

function storedHistory(state) {
  return state.combatPower?.historyMax === undefined
    ? 0
    : stateInteger(state.combatPower.historyMax, 'combat-power stored history maximum');
}

function computedHistory(model) {
  if (model.state.rolePower === undefined) return 0;
  if (!model.state.rolePower || typeof model.state.rolePower !== 'object') {
    fail(CODE_STATE, 'Authoritative role power state is malformed');
  }
  return stateInteger(model.state.rolePower.power, 'authoritative role power');
}

function assertConfiguredBits(bits, tables) {
  if (hasBit(bits, 0)) fail(CODE_STATE, 'Combat-power award bitmap contains unknown tid 0');
  for (let tid = tables.maxTid + 1; tid < bytesBitCapacity(bits); tid += 1) {
    if (hasBit(bits, tid)) fail(CODE_STATE, `Combat-power award bitmap contains unknown tid ${tid}`);
  }
}

function bytesBitCapacity(bits) {
  return bits.length * 8;
}

export function createCombatPowerService({
  store, codec, gameTables, tables = readCombatPowerTables(), logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const maxStatisticSlot = statisticsSlot(gameTables);
  if (COMBAT_POWER_STATISTICS_SLOT !== 0) throw new Error('Combat-power history must use CountStatistics slot 0');

  function statisticsModule(modules) {
    const module = modules.get(STATISTICS_MODULE_ID);
    if (!module) fail(CODE_STATE, 'CountStatistics login module is missing');
    if (!Array.isArray(module.value)) fail(CODE_STATE, 'CountStatistics login module is malformed');
    while (module.value.length < maxStatisticSlot) {
      module.value.push(serializedBinary(Buffer.alloc(0)));
    }
    return module;
  }

  function readStatisticsMaximum(modules) {
    const module = statisticsModule(modules);
    const payload = module.value[COMBAT_POWER_STATISTICS_SLOT];
    const bytes = payload == null ? Buffer.alloc(0) : rawBinary(payload);
    let data = { max_list: [] };
    if (bytes.length) {
      try { data = codec.unpack('pb_count_statics_max', bytes); }
      catch { fail(CODE_STATE, 'Combat-power CountStatistics maximum data is malformed'); }
    }
    if (!data || typeof data !== 'object' || !Array.isArray(data.max_list)) {
      fail(CODE_STATE, 'Combat-power CountStatistics maximum list is malformed');
    }
    let history = 0;
    let found = false;
    for (const row of data.max_list) {
      const tid = stateInteger(row?.tid, 'CountStatistics maximum tid');
      if (tid !== COMBAT_POWER_STATISTIC_TID) continue;
      if (found) fail(CODE_STATE, 'Combat-power CountStatistics maximum is duplicated');
      found = true;
      history = stateInteger(row.progress, 'CountStatistics combat-power maximum');
    }
    return history;
  }

  function writeStatisticsMaximum(modules, history) {
    const module = statisticsModule(modules);
    const payload = module.value[COMBAT_POWER_STATISTICS_SLOT];
    const bytes = payload == null ? Buffer.alloc(0) : rawBinary(payload);
    let data = { max_list: [] };
    if (bytes.length) {
      try { data = codec.unpack('pb_count_statics_max', bytes); }
      catch { fail(CODE_STATE, 'Combat-power CountStatistics maximum data is malformed'); }
    }
    data.max_list ??= [];
    if (!Array.isArray(data.max_list)) fail(CODE_STATE, 'Combat-power CountStatistics maximum list is malformed');
    const matches = data.max_list.filter(row => Number(row?.tid) === COMBAT_POWER_STATISTIC_TID);
    if (matches.length > 1) fail(CODE_STATE, 'Combat-power CountStatistics maximum is duplicated');
    if (matches.length === 1) matches[0].progress = String(history);
    else data.max_list.push({ tid: String(COMBAT_POWER_STATISTIC_TID), progress: String(history) });
    module.value[COMBAT_POWER_STATISTICS_SLOT] = serializedBinary(codec.pack('pb_count_statics_max', data));
  }

  function historyMaximum(model, modules = new Map(model.state.modules.value)) {
    return Math.max(storedHistory(model.state), computedHistory(model), readStatisticsMaximum(modules));
  }

  function currentBits(model, modules = new Map(model.state.modules.value)) {
    const bits = decodeStoredBits(model.state);
    assertConfiguredBits(bits, tables);
    return bits;
  }

  function saveState(model, history, bits) {
    model.state.combatPower = {
      historyMax: String(history),
      receivedBits: bits.toString('base64')
    };
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const bits = currentBits(model, modules);
      const beforeStatistics = readStatisticsMaximum(modules);
      const history = historyMaximum(model, modules);
      writeStatisticsMaximum(modules, history);
      model.state.modules.value = [...modules];
      saveState(model, history, bits);
      log({
        event: 'combat_power_login_state_ready',
        historyMax: history,
        statisticsChanged: history !== beforeStatistics,
        claimedCount: countBits(bits, tables.maxTid)
      });
      return {
        historyMax: history,
        statisticsSlot: maxStatisticSlot,
        claimedTids: [...Array(tables.maxTid)].map((_, index) => index + 1).filter(tid => hasBit(bits, tid))
      };
    });
  }

  function receiveAward(tidInput) {
    const tid = positiveInteger(tidInput, 'combat-power award tid');
    const entry = tables.entryFor(tid);
    if (!entry) fail(CODE_STATE, 'Combat-power award tier is not configured');

    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const bits = currentBits(model, modules);
      if (hasBit(bits, tid)) fail(CODE_STATE, 'Combat-power award has already been claimed');
      const history = historyMaximum(model, modules);
      if (history < entry.breakValue) {
        fail(CODE_STATE, `Combat-power award ${tid} requires ${entry.breakValue}, history is ${history}`);
      }

      const granted = grantResources(model, entry.award, gameTables, { codec });
      const nextBits = setBit(bits, tid);
      writeStatisticsMaximum(modules, history);
      model.state.modules.value = [...modules];
      saveState(model, history, nextBits);
      const value = {
        res: { changes: granted.changes, is_overflow: false },
        gain_award_data: encodeBitBlockSync(nextBits)
      };
      const data = codec.pack('pb_power_award_toc', value);
      log({
        event: 'combat_power_award_committed',
        tid,
        breakValue: entry.breakValue,
        historyMax: history,
        claimedCount: countBits(nextBits, tables.maxTid),
        changes: granted.changes.length
      });
      return {
        schema: 'pb_power_award_toc',
        value,
        data,
        valueForLog: { tid, breakValue: entry.breakValue, historyMax: history, changes: granted.changes.length }
      };
    });
  }

  async function decode(type, data, { etf } = {}) {
    if (Number(type) !== COMMAND_RECEIVE_AWARD) fail(CODE_INVALID, 'Unsupported combat-power command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'Combat-power ETF decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Combat-power request is empty');
    let decoded;
    try { decoded = await etf(input); }
    catch { fail(CODE_INVALID, 'Combat-power request is not valid ETF'); }
    const candidate = Array.isArray(decoded)
      ? decoded.length === 1 ? decoded[0] : undefined
      : decoded;
    return positiveInteger(candidate, 'combat-power award tid');
  }

  function execute(type, tid) {
    if (Number(type) !== COMMAND_RECEIVE_AWARD) fail(CODE_INVALID, 'Unsupported combat-power command');
    return receiveAward(tid);
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    requestSchema: () => null,
    ensureLoginState,
    decode,
    execute
  };
}

function countBits(bits, maxTid) {
  let count = 0;
  for (let tid = 1; tid <= maxTid; tid += 1) if (hasBit(bits, tid)) count += 1;
  return count;
}

export const COMBAT_POWER_COMMANDS = SUPPORTED;
