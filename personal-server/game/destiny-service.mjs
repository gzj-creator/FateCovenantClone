import { decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const DESTINY_MODULE = 100;
const STAGE_WIDTH = 100;
const SLOT_BYTES = 13;
const fail = (code, message) => { throw new GameError(code, message); };

function stageNodes(up, stage) {
  const start = Number(stage) * STAGE_WIDTH;
  return [...up.keys()]
    .filter(tid => Number(tid) > start && Number(tid) <= start + STAGE_WIDTH)
    .sort((left, right) => Number(left) - Number(right));
}

function normalizeState(value, stageCount) {
  const curStage = Number(value?.cur_stage ?? 1);
  if (!Number.isSafeInteger(curStage) || curStage < 1 || curStage > stageCount) fail(5, 'Invalid destiny stage state');
  const raw = value?.slot_state ?? [];
  const original = typeof raw === 'string' ? Buffer.from(raw, 'base64') : Buffer.from(raw);
  const slotState = Buffer.alloc(Math.max(SLOT_BYTES, original.length));
  original.copy(slotState);
  return { cur_stage: curStage, slot_state: slotState };
}

function requestIds(decoded) {
  const value = decoded?.value ?? decoded;
  if (!Array.isArray(value) || value.length === 0 || value.length > STAGE_WIDTH) fail(1, 'Invalid destiny node request');
  const ids = value.map(Number);
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) fail(1, 'Invalid destiny node request');
  return ids;
}

export function createDestinyService({ store, codec, tables }) {
  const stageCount = tables.stages.size;
  const constant = tables.constants.get(1);
  if (!stageCount || !constant) throw new Error('Destiny configuration is missing');

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const previous = modules.get(DESTINY_MODULE);
      let value;
      if (previous) {
        value = codec.unpack('pb_destiny_data', rawBinary(previous));
      }
      const state = normalizeState(value, stageCount);
      modules.set(DESTINY_MODULE, serializedBinary(codec.pack('pb_destiny_data', state)));
      model.state.modules.value = [...modules];
      return { curStage: state.cur_stage, slotBytes: state.slot_state.length };
    });
  }

  function upgrade(value) {
    const ids = value.ids;
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const module = modules.get(DESTINY_MODULE);
      if (!module) fail(5, 'Destiny login module is missing');
      const state = normalizeState(codec.unpack('pb_destiny_data', rawBinary(module)), stageCount);
      const allowed = new Set(stageNodes(tables.up, state.cur_stage).map(Number));
      if (ids.some(id => !allowed.has(id))) fail(5, 'Destiny node is not in the current stage');
      if (ids.some(id => hasBit(state.slot_state, id % STAGE_WIDTH))) fail(310, 'Destiny node is already active');

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
      for (const id of ids) setBit(state.slot_state, id % STAGE_WIDTH);

      const nodes = stageNodes(tables.up, state.cur_stage);
      if (nodes.every(id => hasBit(state.slot_state, Number(id) % STAGE_WIDTH)) && state.cur_stage < stageCount) {
        state.cur_stage += 1;
        state.slot_state.fill(0);
      }
      const destiny = { cur_stage: state.cur_stage, slot_state: state.slot_state };
      modules.set(DESTINY_MODULE, serializedBinary(codec.pack('pb_destiny_data', destiny)));
      model.state.modules.value = [...modules];
      const response = { destiny, res_client: { changes, is_overflow: false } };
      return { schema: 'pb_destiny_up_back', value: response, data: codec.pack('pb_destiny_up_back', response) };
    });
  }

  return {
    ensureLoginState,
    supports: type => type === 82601,
    async execute(type, bytes) {
      if (type !== 82601) fail(1, 'Invalid destiny command');
      return upgrade({ ids: requestIds(await decodeEtf(bytes)) });
    }
  };
}
