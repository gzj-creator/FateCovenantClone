import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

export const TIME_TEMPLE_MODULE_ID = 159;
export const TIME_TEMPLE_DRAW_PUSH_TYPE = 7801;
export const TIME_TEMPLE_DATA_SCHEMA = 'pb_time_temple_data';
export const TIME_TEMPLE_DRAW_SCHEMA = 'pb_time_temple_draw';

const UINT32_MAX = 0xffffffff;

// Eight request encoders ship in TimeTempleCmd.lua (project bundle prototypes
// 0-7) but client build 1.55.090365 never registers them in Cmd.c2s_index, and
// Connection:Send resolves a request with `Cmd.c2s_index[cmd]`, aborting with
// "send msg type error" when the name is missing. No numeric C2S type therefore
// exists to route, so the gateway keeps answering LOCAL_NOT_IMPLEMENTED instead
// of claiming a number that belongs to another module (90501-90507 are pet
// activity, 91001 is energy burst, 7801 is the S2C draw push).
// Evidence and the full registry dump: agent/workflow/time-temple/cmd-registry-20261108.json
export const TIME_TEMPLE_UNREGISTERED_COMMANDS = Object.freeze([
  { name: 'req_time_temple_embryo_up', encoding: 'etf', requestSchema: null, responseSchema: 'pb_embryo_up_back' },
  { name: 'req_time_temple_bond_up', encoding: 'etf', requestSchema: null, responseSchema: null },
  { name: 'req_time_temple_runes_collect', encoding: 'etf', requestSchema: null, responseSchema: 'pb_runes_collect_back' },
  { name: 'req_time_temple_runes_up', encoding: 'etf', requestSchema: null, responseSchema: null },
  { name: 'req_time_temple_runes_skill_select', encoding: 'protobuf', requestSchema: 'pb_time_temple_select_runes_skills', responseSchema: 'pb_time_temple_select_runes_skills' },
  { name: 'req_time_temple_god_up', encoding: 'etf', requestSchema: null, responseSchema: null },
  { name: 'req_time_temple_season_shop', encoding: 'etf', requestSchema: null, responseSchema: null },
  { name: 'req_time_temple_draw_award', encoding: 'etf', requestSchema: null, responseSchema: 'pb_draw_phase_award_back' }
].map(command => Object.freeze({ ...command, numericType: null })));

export function unregisteredTimeTempleCommands() {
  return TIME_TEMPLE_UNREGISTERED_COMMANDS.map(command => ({ ...command }));
}

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
