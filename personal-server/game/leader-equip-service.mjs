import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

const LEADER_EQUIP_MODULE_ID = 175;
const LEADER_EQUIP_WEAR_TYPE = 98401;
const fail = (code, message) => { throw new GameError(code, message); };

function positiveUid(value) {
  try {
    const uid = BigInt(value);
    if (uid <= 0n) fail(1, 'Invalid leader-equipment uid');
    return uid.toString();
  } catch (error) {
    if (error instanceof GameError) throw error;
    fail(1, 'Invalid leader-equipment uid');
  }
}

function slotType(value) {
  const type = Number(value);
  if (!Number.isSafeInteger(type) || type < 1) fail(1, 'Invalid leader-equipment slot type');
  return type;
}

function readLeaderEquipState(model, codec) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(LEADER_EQUIP_MODULE_ID);
  if (!module || !module.value?.data?.length) fail(5, 'Leader-equipment module is missing');
  const data = codec.unpack('pb_leader_equips_data', rawBinary(module));
  data.slots = Array.isArray(data.slots) ? data.slots : [];
  data.equip_list = Array.isArray(data.equip_list) ? data.equip_list : [];
  data.max_uid = String(data.max_uid ?? 0);
  data.draw_info ??= { lv: 1 };
  data.dismiss ??= '';
  return { modules, data };
}

function writeLeaderEquipState(model, codec, state) {
  state.modules.set(LEADER_EQUIP_MODULE_ID, serializedBinary(codec.pack('pb_leader_equips_data', state.data)));
  model.state.modules.value = [...state.modules];
}

function equipmentConfig(tables, equip) {
  const tid = Number(equip?.tid);
  if (!Number.isSafeInteger(tid) || tid <= 0) fail(5, 'Leader-equipment configuration is missing');
  const config = tables.LeaderEquip.get(tid);
  if (!config) fail(5, 'Leader-equipment configuration is missing');
  return config;
}

export function createLeaderEquipService({ store, codec, tables }) {
  return {
    supports: type => type === LEADER_EQUIP_WEAR_TYPE,
    execute(type, input) {
      if (type !== LEADER_EQUIP_WEAR_TYPE) fail(1, 'Invalid leader-equipment command');
      const requests = input?.wear_list;
      if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Leader-equipment wear list is empty');

      return store.transaction(model => {
        const state = readLeaderEquipState(model, codec);
        const bagByUid = new Map();
        for (const equip of state.data.equip_list) {
          const uid = positiveUid(equip.uid);
          if (bagByUid.has(uid)) fail(5, 'Duplicate leader-equipment uid in inventory');
          bagByUid.set(uid, equip);
        }

        const slotsByType = new Map();
        for (const slot of state.data.slots) {
          const entryType = slotType(slot.type);
          if (slotsByType.has(entryType)) fail(5, 'Duplicate leader-equipment slot');
          slotsByType.set(entryType, slot);
        }

        const normalized = [], seenUids = new Set(), seenTypes = new Set();
        for (const request of requests) {
          const uid = positiveUid(request?.uid);
          const targetType = slotType(request?.type);
          if (seenUids.has(uid)) fail(1, 'Duplicate leader-equipment uid');
          if (seenTypes.has(targetType)) fail(1, 'Duplicate leader-equipment slot type');
          seenUids.add(uid);
          seenTypes.add(targetType);

          const equippedSlot = state.data.slots.find(slot => slot.equip && String(slot.equip.uid) === uid);
          if (equippedSlot) {
            if (Number(equippedSlot.type) !== targetType) fail(1, 'Leader equipment is already worn in another slot');
            normalized.push({ uid, type: targetType, equip: null, slot: equippedSlot, idempotent: true });
            continue;
          }

          const equip = bagByUid.get(uid);
          if (!equip) fail(1, 'Leader equipment does not exist in the inventory');
          const config = equipmentConfig(tables, equip);
          if (Number(config.type) !== targetType) fail(1, 'Leader equipment does not fit this slot');
          normalized.push({ uid, type: targetType, equip, slot: slotsByType.get(targetType), idempotent: false });
        }

        const changedSlots = [], added = [], removed = [], removedUids = new Set();
        for (const entry of normalized) {
          if (entry.idempotent) {
            changedSlots.push(structuredClone(entry.slot));
            continue;
          }

          const slot = entry.slot ? structuredClone(entry.slot) : { type: entry.type, level: 1 };
          slot.type = entry.type;
          const level = Number(slot.level);
          slot.level = Number.isSafeInteger(level) && level >= 1 ? level : 1;
          if (slot.equip) added.push(structuredClone(slot.equip));
          const equip = structuredClone(entry.equip);
          slot.equip = equip;
          if (!entry.slot) state.data.slots.push(slot);
          else state.data.slots[state.data.slots.indexOf(entry.slot)] = slot;
          changedSlots.push(structuredClone(slot));
          removed.push(structuredClone(equip));
          removedUids.add(entry.uid);
        }

        if (removedUids.size) {
          state.data.equip_list = state.data.equip_list.filter(equip => !removedUids.has(String(equip.uid)));
        }
        if (added.length) state.data.equip_list.push(...added.map(equip => structuredClone(equip)));

        if (!normalized.every(entry => entry.idempotent)) writeLeaderEquipState(model, codec, state);
        const value = { slots: changedSlots, add_equip_list: added, sub_equip_list: removed };
        return {
          schema: 'pb_leader_equip_wear_back',
          value,
          data: codec.pack('pb_leader_equip_wear_back', value),
          valueForLog: {
            slotTypes: changedSlots.map(slot => Number(slot.type)),
            addUids: added.map(equip => String(equip.uid)),
            subUids: removed.map(equip => String(equip.uid))
          }
        };
      });
    }
  };
}
