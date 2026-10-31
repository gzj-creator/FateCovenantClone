import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

export const TIME_TEMPLE_MODULE_ID = 159;
export const TIME_TEMPLE_DRAW_PUSH_TYPE = 7801;
export const TIME_TEMPLE_DATA_SCHEMA = 'pb_time_temple_data';
export const TIME_TEMPLE_DRAW_SCHEMA = 'pb_time_temple_draw';

const UINT32_MAX = 0xffffffff;

function fail(message) {
  throw new GameError(5, message);
}

function loginSlot(module) {
  if (!module || !Array.isArray(module.value) || !module.value.length) {
    fail('Time temple login module is missing its first slot');
  }
  try {
    return rawBinary(module.value[0]);
  } catch {
    fail('Time temple login module is malformed');
  }
}

function encodeModule(bytes) {
  // The observed module 159 ETF shape is a one-element list containing the
  // pb_time_temple_data binary. It is not a bare binary tuple.
  return { value: [serializedBinary(bytes)], improper: false };
}

function uint32(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > UINT32_MAX) {
    fail(`Invalid time temple draw field: ${field}`);
  }
  return number;
}

function drawState(value) {
  if (value === undefined) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  fail('Invalid time temple draw field: award_state');
}

function drawPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('Invalid time temple draw payload');
  }
  return {
    season_id: uint32(value.season_id, 'season_id'),
    draw_num: uint32(value.draw_num, 'draw_num'),
    award_phase_num: uint32(value.award_phase_num, 'award_phase_num'),
    award_state: drawState(value.award_state)
  };
}

export function createTimeTempleService({ store, codec, publish }) {
  function snapshot(module) {
    const bytes = loginSlot(module);
    let state;
    try {
      state = codec.unpack(TIME_TEMPLE_DATA_SCHEMA, bytes);
    } catch {
      fail('Invalid time temple login protobuf');
    }
    return {
      state,
      counts: {
        bonds: state.bond_data.length,
        runes: state.runes_data.length,
        gods: state.god_data.length,
        selectedRunes: state.select_runes.length
      }
    };
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      let module = modules.get(TIME_TEMPLE_MODULE_ID);
      let changed = false;

      if (!module) {
        // The captured early-game login contains module 159 as a one-slot ETF
        // list whose protobuf is zero bytes. Reproduce that evidenced default.
        module = encodeModule(codec.pack(TIME_TEMPLE_DATA_SCHEMA, {}));
        modules.set(TIME_TEMPLE_MODULE_ID, module);
        changed = true;
      } else if (!module || !Array.isArray(module.value)) {
        fail('Time temple login module is malformed');
      } else if (!module.value.length) {
        module.value.push(serializedBinary(codec.pack(TIME_TEMPLE_DATA_SCHEMA, {})));
        changed = true;
      }

      const result = snapshot(module);
      if (changed) model.state.modules.value = [...modules];
      return { moduleId: TIME_TEMPLE_MODULE_ID, ...result };
    });
  }

  function createDrawPush(value) {
    const normalized = drawPayload(value);
    const data = codec.pack(TIME_TEMPLE_DRAW_SCHEMA, normalized);
    return {
      type: TIME_TEMPLE_DRAW_PUSH_TYPE,
      schema: TIME_TEMPLE_DRAW_SCHEMA,
      value: codec.unpack(TIME_TEMPLE_DRAW_SCHEMA, data),
      data
    };
  }

  function publishDraw(value) {
    const push = createDrawPush(value);
    publish(push.type, push.data);
    return push;
  }

  return {
    moduleId: TIME_TEMPLE_MODULE_ID,
    pushType: TIME_TEMPLE_DRAW_PUSH_TYPE,
    ensureLoginState,
    snapshot: () => snapshot(new Map(store.state().modules.value).get(TIME_TEMPLE_MODULE_ID)),
    createDrawPush,
    publishDraw
  };
}
