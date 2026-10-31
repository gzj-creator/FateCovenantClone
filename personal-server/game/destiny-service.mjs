import { decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const DESTINY_MODULE = 100;
const STAGE_WIDTH = 100;
const SLOT_BYTES = 13;
const fail = (code, message) => { throw new GameError(code, message); };

function stageOf(id) {
  return Math.floor(Number(id) / STAGE_WIDTH);
}

function stageNodes(up, stage) {
  const start = Number(stage) * STAGE_WIDTH;
  return [...up.keys()]
    .filter(tid => Number(tid) > start && Number(tid) <= start + STAGE_WIDTH)
    .sort((left, right) => Number(left) - Number(right));
}

function completeStage(state, nodes) {
  return nodes.length > 0 && nodes.every(id => hasBit(state.slot_state, Number(id) % STAGE_WIDTH));
}

function advanceCompletedStage(state, tables, stageCount) {
  const nodes = stageNodes(tables.up, state.cur_stage);
  if (!completeStage(state, nodes) || state.cur_stage >= stageCount) return false;
  state.cur_stage += 1;
  state.slot_state.fill(0);
  return true;
}

function normalizeState(value, tables, stageCount) {
  const curStage = Number(value?.cur_stage ?? 1);
  if (!Number.isSafeInteger(curStage) || curStage < 1 || curStage > stageCount) fail(5, 'Invalid destiny stage state');
  const raw = value?.slot_state ?? [];
  const original = typeof raw === 'string' ? Buffer.from(raw, 'base64') : Buffer.from(raw);
  const slotState = Buffer.alloc(Math.max(SLOT_BYTES, original.length));
  original.copy(slotState);
  const state = { cur_stage: curStage, slot_state: slotState };
  // Repair a fully lit stage left by an older build. The client derives its
  // next node and stage from this exact state, so login must canonicalize it.
  advanceCompletedStage(state, tables, stageCount);
  return state;
}

function requestIds(decoded) {
  const value = decoded?.value ?? decoded;
  if (!Array.isArray(value) || value.length === 0 || value.length > STAGE_WIDTH) fail(1, 'Invalid destiny node request');
  const ids = value.map(Number);
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) fail(1, 'Invalid destiny node request');
  return ids;
}

function costTotals(tables, ids) {
  const totals = new Map();
  for (const id of ids) {
    const config = tables.up.get(id);
    if (!config || !Array.isArray(config.active_res_list)) fail(5, 'Destiny node configuration is missing');
    for (const pair of config.active_res_list) {
      if (!Array.isArray(pair) || pair.length !== 2) fail(5, 'Destiny node cost configuration is invalid');
      const tid = Number(pair[0]), count = Number(pair[1]);
      if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0) fail(5, 'Destiny node cost configuration is invalid');
      totals.set(String(tid), (totals.get(String(tid)) ?? 0n) + BigInt(count));
    }
  }
  return totals;
}

export function createDestinyService({ store, codec, tables }) {
  const stageCount = tables.stages.size;
  const constant = tables.constants.get(1);
  if (!stageCount || !constant) throw new Error('Destiny configuration is missing');

  function readState(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(DESTINY_MODULE);
    if (!module) fail(5, 'Destiny login module is missing');
    return {
      modules,
      state: normalizeState(codec.unpack('pb_destiny_data', rawBinary(module)), tables, stageCount)
    };
  }

  function writeState(model, modules, state) {
    modules.set(DESTINY_MODULE, serializedBinary(codec.pack('pb_destiny_data', state)));
    model.state.modules.value = [...modules];
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const previous = modules.get(DESTINY_MODULE);
      const value = previous ? codec.unpack('pb_destiny_data', rawBinary(previous)) : undefined;
      const state = normalizeState(value, tables, stageCount);
      writeState(model, modules, state);
      return { curStage: state.cur_stage, slotBytes: state.slot_state.length };
    });
  }

  function upgrade(ids) {
    return store.transaction(model => {
      const { modules, state } = readState(model);
      const stages = ids.map(stageOf);
      for (const id of ids) if (!tables.up.has(id)) fail(5, 'Destiny node configuration is missing');
      if (stages.some(stage => stage < 1 || stage > stageCount)) fail(5, 'Destiny node is outside the configured stages');
      if (stages.some(stage => stage > state.cur_stage)) fail(5, 'Destiny node is ahead of the current stage');

      const currentIds = ids.filter(id => stageOf(id) === state.cur_stage);
      const newIds = currentIds.filter(id => !hasBit(state.slot_state, id % STAGE_WIDTH));
      const totals = costTotals(tables, newIds);
      for (const [tid, count] of totals) {
        const resource = model.resources.get(tid);
        if (!resource || BigInt(resource.num ?? 0) < count) fail(301, 'Destiny material is insufficient');
      }

      const changes = [];
      for (const [tid, count] of totals) {
        const resource = model.resources.get(tid);
        resource.num = (BigInt(resource.num) - count).toString();
        changes.push({ tid, new_num: resource.num, diff_num: (-count).toString() });
      }
      for (const id of newIds) setBit(state.slot_state, id % STAGE_WIDTH);

      // Completing the current stage is the only transition. Replayed ids
      // from an earlier stage are acknowledged with the authoritative state,
      // so a stale client never collapses into a configuration error.
      advanceCompletedStage(state, tables, stageCount);
      writeState(model, modules, state);
      const destiny = { cur_stage: state.cur_stage, slot_state: state.slot_state };
      const response = { destiny, res_client: { changes, is_overflow: false } };
      return { schema: 'pb_destiny_up_back', value: response, data: codec.pack('pb_destiny_up_back', response) };
    });
  }

  return {
    ensureLoginState,
    supports: type => type === 82601,
    async execute(type, bytes) {
      if (type !== 82601) fail(1, 'Invalid destiny command');
      return upgrade(requestIds(await decodeEtf(bytes)));
    }
  };
}
