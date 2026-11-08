import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { fail, integer, numeric, resourceChange } from './develop-support.mjs';

// LeaderEquipCmd 98402-98407. 98401 (wear) stays in leader-equip-service; these
// commands act on the same login module 175 payload (pb_leader_equips_data) so
// upgrades survive a relog. The intensify/recast reward tables are only shippable
// through LeaderEquipTable rows this build cannot index yet, so those two
// commands change state and return an empty resource delta.
export const LEADER_EQUIP_DEVELOP_COMMANDS = Object.freeze({
  upLevel: 98402, upStar: 98403, dissolve: 98404,
  intensify: 98405, recast: 98406, saveDismiss: 98407
});

const MODULE = 175;
const SCHEMA = 'pb_leader_equips_data';
const STAR_MAX = 10;

function readState(model, codec) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(MODULE);
  if (!module) fail(5, 'Leader-equipment module is missing');
  const data = codec.unpack(SCHEMA, rawBinary(module));
  data.slots = Array.isArray(data.slots) ? data.slots : [];
  data.equip_list = Array.isArray(data.equip_list) ? data.equip_list : [];
  data.max_uid = String(data.max_uid ?? 0);
  return { modules, data };
}

function writeState(model, codec, state) {
  state.modules.set(MODULE, serializedBinary(codec.pack(SCHEMA, state.data)));
  model.state.modules.value = [...state.modules];
}

export function createLeaderEquipDevelopService({ store, codec }) {
  function execute(type, input) {
    return store.transaction(model => {
      const state = readState(model, codec);
      const command = Number(type);
      const uid = () => integer(input, 'leader equipment uid', { min: 1 });
      const findBag = value => state.data.equip_list.find(equip => numeric(equip.uid) === value);
      const findSlot = value => state.data.slots.find(slot => slot.equip && numeric(slot.equip.uid) === value);

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.upLevel) {
        const slotType = integer(input, 'leader equipment slot type', { min: 1 });
        const slot = state.data.slots.find(entry => numeric(entry.type) === slotType);
        if (!slot) fail(5, 'Leader-equipment slot does not exist');
        slot.level = numeric(slot.level) + 1;
        writeState(model, codec, state);
        const body = { slot, res: resourceChange([]) };
        return { schema: 'pb_leader_equip_up_level_back', value: body, data: codec.pack('pb_leader_equip_up_level_back', body), valueForLog: { slotType, level: slot.level } };
      }

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.upStar) {
        const target = integer(input?.uid, 'leader equipment uid', { min: 1 });
        const equip = findBag(target) ?? findSlot(target)?.equip;
        if (!equip) fail(5, 'Leader equipment does not exist');
        if (numeric(equip.star) >= STAR_MAX) fail(305, 'Leader-equipment star limit reached');
        for (const value of input?.cost_uid_list ?? []) {
          const costUid = integer(value, 'cost equipment uid', { min: 1 });
          const index = state.data.equip_list.findIndex(entry => numeric(entry.uid) === costUid);
          if (index < 0) fail(5, 'Leader-equipment cost item is not in the bag');
          state.data.equip_list.splice(index, 1);
        }
        equip.star = numeric(equip.star) + 1;
        writeState(model, codec, state);
        const body = { equip, res: resourceChange([]) };
        return { schema: 'pb_leader_equip_back', value: body, data: codec.pack('pb_leader_equip_back', body), valueForLog: { uid: target, star: equip.star } };
      }

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.dissolve) {
        const target = uid();
        const index = state.data.equip_list.findIndex(entry => numeric(entry.uid) === target);
        if (index < 0) fail(5, 'Leader equipment is not in the bag');
        state.data.equip_list.splice(index, 1);
        for (const slot of state.data.slots) if (slot.equip && numeric(slot.equip.uid) === target) slot.equip = null;
        writeState(model, codec, state);
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { uid: target, awards: 'unrecovered' } };
      }

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.intensify) {
        const target = uid();
        const equip = findBag(target) ?? findSlot(target)?.equip;
        if (!equip) fail(5, 'Leader equipment does not exist');
        equip.intensify_info ??= {};
        equip.intensify_info.level = numeric(equip.intensify_info.level) + 1;
        writeState(model, codec, state);
        const body = { success: true, res: resourceChange([]), equip };
        return { schema: 'pb_leader_equip_intensify_back', value: body, data: codec.pack('pb_leader_equip_intensify_back', body), valueForLog: { uid: target, level: equip.intensify_info.level } };
      }

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.recast) {
        const target = uid();
        const equip = findBag(target) ?? findSlot(target)?.equip;
        if (!equip) fail(5, 'Leader equipment does not exist');
        equip.intensify_info ??= {};
        equip.intensify_info.recast = numeric(equip.intensify_info.recast) + 1;
        writeState(model, codec, state);
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { uid: target, recast: equip.intensify_info.recast, schema: 'pb_leader_equip_recast_back missing' } };
      }

      if (command === LEADER_EQUIP_DEVELOP_COMMANDS.saveDismiss) {
        const target = uid();
        if (!findBag(target) && !findSlot(target)) fail(5, 'Leader equipment does not exist');
        state.data.dismiss = String(target);
        writeState(model, codec, state);
        return { schema: null, value: {}, data: Buffer.alloc(0), valueForLog: { uid: target } };
      }

      fail(1, 'Invalid leader-equipment command');
    });
  }

  return {
    supports: type => Object.values(LEADER_EQUIP_DEVELOP_COMMANDS).includes(Number(type)),
    decode(type, data) {
      if (Number(type) === LEADER_EQUIP_DEVELOP_COMMANDS.upStar) {
        return data?.length ? codec.unpack('pb_leader_equip_up_star_req', data) : {};
      }
      return undefined;
    },
    execute
  };
}
