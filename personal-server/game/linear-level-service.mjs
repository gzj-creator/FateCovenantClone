import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readLinearLevelTables } from '../config/linear-level-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

export const LINEAR_LEVEL_COMMANDS = Object.freeze([93501]);
export const LINEAR_LEVEL_MODULE_ID = 535;

const COMMAND_BOX_AWARD = 93501;
const CODE_INVALID = 1;
const CODE_STATE = 5;
const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function scalarBytes(module, label) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail(CODE_STATE, `${label} login module is not a scalar binary payload`);
  }
  try { return rawBinary(module); }
  catch { fail(CODE_STATE, `${label} login module is malformed`); }
}

function normalizeState(raw, tables) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.linear_levels)) {
    fail(CODE_STATE, 'LinearLevel login data is invalid');
  }
  const types = new Set();
  const linearLevels = raw.linear_levels.map(row => {
    const type = Number(row?.type);
    if (!tables.typeConfig(type)) fail(CODE_STATE, `LinearLevel type ${type} is not configured`);
    if (types.has(type)) fail(CODE_STATE, `LinearLevel type ${type} is duplicated`);
    types.add(type);
    const level = Number(row?.level ?? 0);
    if (!Number.isSafeInteger(level) || level < 0) fail(CODE_STATE, `LinearLevel type ${type} level is invalid`);
    let bits;
    try { bits = Buffer.from(row?.box_award ?? '', 'base64'); }
    catch { fail(CODE_STATE, `LinearLevel type ${type} box bitmap is invalid`); }
    return { type, level, box_award: bits.toString('base64') };
  }).sort((left, right) => left.type - right.type);
  return { ...raw, linear_levels: linearLevels };
}

export function createLinearLevelService({ store, codec, tables = readLinearLevelTables(), gameTables, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  if (!gameTables?.Item?.size) throw new Error('LinearLevel reward resource tables are unavailable');

  function readState(model, { writeEmpty = false } = {}) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(LINEAR_LEVEL_MODULE_ID);
    const bytes = scalarBytes(module, 'LinearLevel');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_linear_level_role', bytes); }
      catch { fail(CODE_STATE, 'LinearLevel login data is invalid'); }
    } else {
      state = { linear_levels: [] };
    }
    state = normalizeState(state, tables);
    if (writeEmpty && !bytes.length) {
      modules.set(LINEAR_LEVEL_MODULE_ID, serializedBinary(codec.pack('pb_linear_level_role', state)));
      model.state.modules.value = [...modules];
    }
    return { modules, state, needsCanonicalWrite: writeEmpty && !bytes.length };
  }

  function writeState(model, modules, state) {
    modules.set(LINEAR_LEVEL_MODULE_ID, serializedBinary(codec.pack('pb_linear_level_role', state)));
    model.state.modules.value = [...modules];
  }

  function claim(input) {
    const type = positiveInteger(input?.type, 'linear level type');
    if (!tables.typeConfig(type)) fail(CODE_STATE, `R1-LINEARLEVEL-TYPE: type ${type} is not configured`);
    if (!Array.isArray(input?.indexes) || input.indexes.length === 0) {
      fail(CODE_INVALID, 'R1-LINEARLEVEL-INDEX: at least one box index is required');
    }
    const boxes = [];
    const seen = new Set();
    for (const rawIndex of input.indexes) {
      const index = positiveInteger(rawIndex, 'linear level box index');
      if (seen.has(index)) fail(CODE_INVALID, `R1-LINEARLEVEL-DUPLICATE: box ${index} is repeated`);
      seen.add(index);
      const box = tables.boxFor(type, index);
      if (!box) fail(CODE_STATE, `R1-LINEARLEVEL-INDEX: box ${index} is not configured for type ${type}`);
      boxes.push(box);
    }

    return store.transaction(model => {
      const { modules, state } = readState(model);
      let linear = state.linear_levels.find(row => Number(row.type) === type);
      const cumulativeLevel = Number(linear?.level ?? 0);
      const currentBits = Buffer.from(linear?.box_award ?? '', 'base64');
      for (const box of boxes) {
        if (cumulativeLevel < box.pass_fight) {
          fail(CODE_STATE, `R1-LINEARLEVEL-GATE: box ${box.index} requires fight ${box.pass_fight}, current ${cumulativeLevel}`);
        }
        if (hasBit(currentBits, box.index)) {
          fail(CODE_STATE, `R1-LINEARLEVEL-CLAIMED: box ${box.index} is already claimed`);
        }
      }

      const awards = boxes.flatMap(box => box.award.map(pair => [...pair]));
      const granted = grantResources(model, awards, gameTables, { codec });
      let nextBits = currentBits;
      for (const box of boxes) nextBits = setBit(nextBits, box.index);
      if (!linear) {
        linear = { type, level: 0 };
        state.linear_levels.push(linear);
        state.linear_levels.sort((left, right) => Number(left.type) - Number(right.type));
      }
      linear.box_award = nextBits.toString('base64');
      writeState(model, modules, state);

      const value = {
        res_change: { changes: granted.changes, is_overflow: false },
        linear_level: { type, level: Number(linear.level), box_award: linear.box_award }
      };
      const data = codec.pack('pb_linear_level_box_award_rsp', value);
      log({ event: 'linear_level_box_award_committed', type, indexes: boxes.map(box => box.index), awardCount: awards.length });
      return {
        schema: 'pb_linear_level_box_award_rsp',
        value,
        data,
        valueForLog: { type, indexes: boxes.map(box => box.index), changes: granted.changes.length }
      };
    });
  }

  async function decode(type, data, { unpack } = {}) {
    if (Number(type) !== COMMAND_BOX_AWARD) fail(CODE_INVALID, 'Unsupported LinearLevel command');
    if (typeof unpack !== 'function') fail(CODE_STATE, 'LinearLevel protobuf decoder is unavailable');
    try { return unpack('pb_linear_level_box_award_req', Buffer.from(data ?? Buffer.alloc(0))); }
    catch { fail(CODE_INVALID, 'LinearLevel request is not valid protobuf'); }
  }

  function execute(type, input) {
    if (Number(type) !== COMMAND_BOX_AWARD) fail(CODE_INVALID, 'Unsupported LinearLevel command');
    return claim(input);
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const { state, needsCanonicalWrite } = readState(model, { writeEmpty: true });
      return { changed: needsCanonicalWrite, types: state.linear_levels.length };
    });
  }

  return {
    supports: type => LINEAR_LEVEL_COMMANDS.includes(Number(type)),
    requestSchema: () => 'pb_linear_level_box_award_req',
    decode,
    execute,
    ensureLoginState
  };
}
