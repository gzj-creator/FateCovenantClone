import {
  ensureStateTable, fail, integer, numeric, readModuleData, readState, resourceChange,
  writeModuleData, writeState
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// PetCmd 90731-90748. The pet roster is the login container module 158
// (pb_pet_develop_data) that resources.mjs already grants into; pet cores
// (灵核) and the spirit-shrine help slots have no recovered protobuf container
// in this build, so their uids and slots live in develop_module_state.
export const PET_COMMANDS = Object.freeze({
  combine: 90731, raiseStar: 90732, lineup: 90733, upgrade: 90734,
  equipCombine: 90736, equipConvert: 90737, runeUpgrade: 90738, runeConvert: 90739,
  bookUpgrade: 90740, upQuality: 90741, equipUp: 90742, openAbility: 90743,
  lineupHelp: 90744, break: 90745, wearEquip: 90746, mutant: 90747, upPromoteLevel: 90748
});

const PET_MODULE = 158;
const PET_SCHEMA = 'pb_pet_develop_data';
const PET_MUTANT_ITEM = 631002;
const STAR_MAX = 15;
const LEVEL_MAX = 100;
const BREAK_MAX = 5;
const PROMOTE_MAX = 10;
const QUALITY_MAX = 5;
const RUNE_NODE_MAX = 30;
const CORE_STAR_MAX = 5;

const chipOf = petTid => petTid + 1; // ItemTable: Pet 100113 -> PetChip 100114

function findPet(data, tid) {
  const pet = (data.pets ?? []).find(entry => numeric(entry.tid) === tid);
  if (!pet) fail(5, 'Pet is not owned');
  return pet;
}

export function createPetService({ store, codec, now = () => Date.now() }) {
  function execute(type, input) {
    return store.transaction((model, db) => {
      ensureStateTable(db);
      const roleId = model.state.roleId;
      const modules = new Map(model.state.modules.value);
      const data = readModuleData(modules, PET_MODULE, 0, PET_SCHEMA, { pets: [], slots: [] }, codec);
      data.pets ??= [];
      data.slots ??= [];
      data.cur_rune_node = numeric(data.cur_rune_node);
      const cores = readState(db, roleId, 'pet_equips', { maxUid: 0, items: [] });
      cores.items ??= [];
      const savePets = () => { writeModuleData(modules, PET_MODULE, 0, PET_SCHEMA, data, codec); model.state.modules.value = [...modules]; };
      const saveCores = () => writeState(db, roleId, 'pet_equips', cores, now());
      const command = Number(type);

      if (command === PET_COMMANDS.combine) {
        const tid = integer(input, 'pet tid', { min: 1 });
        if (data.pets.some(entry => numeric(entry.tid) === tid)) fail(1, 'Pet is already combined');
        const consumed = consumeResources(model, [[chipOf(tid), 1]]);
        const pet = { tid, star: 0, level: 1, quality: 1, book_level: 0, break_level: 0, promote_lv: 0, equip_items: [], equips: [], is_mutant: false };
        data.pets.push(pet);
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid } };
      }

      if (command === PET_COMMANDS.raiseStar) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        const star = numeric(pet.star);
        if (star >= STAR_MAX) fail(305, 'Pet star limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), star + 2]]);
        pet.star = star + 1;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid, star: pet.star } };
      }

      if (command === PET_COMMANDS.lineup) {
        const slots = input?.slots ?? input?.list;
        if (!Array.isArray(slots)) fail(1, 'Pet lineup list is missing');
        writeState(db, roleId, 'pet_lineup', { slots: slots.map(entry => ({ index: integer(entry?.index, 'slot index', { min: 1 }), pet_tid: integer(entry?.pet_tid ?? entry?.tid ?? 0, 'pet tid', { min: 0 }) })) }, now());
        return { schema: null, value: {}, data: Buffer.alloc(0), valueForLog: { slots: slots.length } };
      }

      if (command === PET_COMMANDS.upgrade) {
        const tid = integer(input?.pet_tid, 'pet tid', { min: 1 });
        const count = integer(input?.level_count, 'level count', { min: 1, max: 100 });
        const pet = findPet(data, tid);
        if (numeric(pet.level) + count > LEVEL_MAX) fail(305, 'Pet level limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), count]]);
        pet.level = numeric(pet.level) + count;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid, level: pet.level } };
      }

      if (command === PET_COMMANDS.equipCombine || command === PET_COMMANDS.equipConvert) {
        const groups = input?.combine_equips ?? [];
        if (!Array.isArray(groups) || groups.length === 0) fail(1, 'Pet core combine list is empty');
        const spend = [];
        for (const group of groups) {
          for (const uid of group?.cost_equips ?? []) spend.push(integer(uid, 'core uid', { min: 1 }));
        }
        if (!spend.length) fail(1, 'Pet core combine list is empty');
        const created = [];
        for (const uid of spend) {
          const index = cores.items.findIndex(item => numeric(item.uid) === uid);
          if (index < 0) fail(5, 'Pet core does not exist');
          cores.items.splice(index, 1);
        }
        if (command === PET_COMMANDS.equipCombine) {
          cores.maxUid = numeric(cores.maxUid) + 1;
          cores.items.push({ uid: cores.maxUid, tid: 344002, star: 0 });
          created.push(cores.maxUid);
        }
        saveCores();
        const body = { new_equips: created, res_change: resourceChange([]) };
        return { schema: 'pb_rsp_pet_equip', value: body, data: codec.pack('pb_rsp_pet_equip', body), valueForLog: { spent: spend.length, created: created.length } };
      }

      if (command === PET_COMMANDS.runeUpgrade) {
        const node = numeric(data.cur_rune_node);
        if (node >= RUNE_NODE_MAX) fail(305, 'Pet rune node limit reached');
        const consumed = consumeResources(model, [[chipOf(100113), 5]]);
        data.cur_rune_node = node + 1;
        savePets();
        const body = resourceChange(consumed.changes);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { runeNode: data.cur_rune_node } };
      }

      if (command === PET_COMMANDS.runeConvert) {
        const materials = input?.materials ?? [];
        if (!Array.isArray(materials) || materials.length === 0) fail(1, 'Pet rune convert materials are empty');
        const costs = materials.map(entry => [integer(entry?.tid, 'material tid', { min: 1 }), integer(entry?.num, 'material count', { min: 1 })]);
        const consumed = consumeResources(model, costs);
        const body = resourceChange(consumed.changes);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { converted: costs.length } };
      }

      if (command === PET_COMMANDS.bookUpgrade) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (numeric(pet.book_level) >= 10) fail(305, 'Pet handbook level limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 2]]);
        pet.book_level = numeric(pet.book_level) + 1;
        savePets();
        const body = { pet };
        return { schema: 'pb_pet_book_rsp', value: body, data: codec.pack('pb_pet_book_rsp', body), valueForLog: { petTid: tid, bookLevel: pet.book_level } };
      }

      if (command === PET_COMMANDS.upQuality) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (numeric(pet.quality) >= QUALITY_MAX) fail(305, 'Pet quality limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 5]]);
        pet.quality = numeric(pet.quality) + 1;
        savePets();
        const body = { pet, res: resourceChange(consumed.changes) };
        return { schema: 'pb_pet_up_quality_back', value: body, data: codec.pack('pb_pet_up_quality_back', body), valueForLog: { petTid: tid, quality: pet.quality } };
      }

      if (command === PET_COMMANDS.equipUp) {
        const tid = integer(input?.pet_tid, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        const upUid = integer(input?.equip_up_uid, 'core uid', { min: 1 });
        const target = cores.items.find(item => numeric(item.uid) === upUid);
        if (!target) fail(5, 'Pet core does not exist');
        if (numeric(target.star) >= CORE_STAR_MAX) fail(305, 'Pet core star limit reached');
        for (const uid of input?.equip_uid_list ?? []) {
          const spend = integer(uid, 'core uid', { min: 1 });
          const index = cores.items.findIndex(item => numeric(item.uid) === spend);
          if (index < 0) fail(5, 'Pet core does not exist');
          cores.items.splice(index, 1);
        }
        target.star = numeric(target.star) + 1;
        saveCores();
        const body = { pet, res_change: resourceChange([]) };
        return { schema: 'pb_pet_equip_star_up_back', value: body, data: codec.pack('pb_pet_equip_star_up_back', body), valueForLog: { petTid: tid, coreUid: upUid, star: target.star } };
      }

      if (command === PET_COMMANDS.openAbility) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (numeric(pet.ability_tid) === tid) fail(1, 'Pet ability is already open');
        const consumed = consumeResources(model, [[chipOf(tid), 3]]);
        pet.ability_tid = tid;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid } };
      }

      if (command === PET_COMMANDS.lineupHelp) {
        const list = input?.list ?? [];
        writeState(db, roleId, 'pet_help_slots', { list: list.map(entry => ({ index: integer(entry?.index, 'help index', { min: 1 }), pet_tid: integer(entry?.pet_tid ?? 0, 'pet tid', { min: 0 }) })) }, now());
        return { schema: null, value: {}, data: Buffer.alloc(0), valueForLog: { slots: list.length } };
      }

      if (command === PET_COMMANDS.break) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (numeric(pet.break_level) >= BREAK_MAX) fail(305, 'Pet break limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 10]]);
        pet.break_level = numeric(pet.break_level) + 1;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid, breakLevel: pet.break_level } };
      }

      if (command === PET_COMMANDS.wearEquip) {
        const requests = input?.pet_req_wear_equips ?? [];
        if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Pet wear request is empty');
        const changed = [];
        for (const request of requests) {
          const pet = findPet(data, integer(request?.pet_tid, 'pet tid', { min: 1 }));
          pet.equip_items ??= [];
          for (const slot of request?.pet_req_equip ?? []) {
            const index = integer(slot?.index, 'core slot index', { min: 0 });
            const uid = integer(slot?.equip_uid ?? 0, 'core uid', { min: 0 });
            pet.equip_items = pet.equip_items.filter(row => numeric(row.index) !== index);
            if (uid > 0) {
              const core = cores.items.find(item => numeric(item.uid) === uid);
              if (!core) fail(5, 'Pet core does not exist');
              pet.equip_items.push({ index, item: { uid, tid: numeric(core.tid) } });
            }
          }
          changed.push(pet);
        }
        savePets();
        const body = { pets: changed, res_changes: resourceChange([]), is_open_equip_up_star: true };
        return { schema: 'pb_rsp_pet_wear_equip', value: body, data: codec.pack('pb_rsp_pet_wear_equip', body), valueForLog: { pets: changed.length } };
      }

      if (command === PET_COMMANDS.mutant) {
        const tid = integer(input, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (pet.is_mutant) fail(1, 'Pet is already mutated');
        const consumed = consumeResources(model, [[PET_MUTANT_ITEM, 1]]);
        pet.is_mutant = true;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid } };
      }

      if (command === PET_COMMANDS.upPromoteLevel) {
        const tid = integer(input?.pet_tid, 'pet tid', { min: 1 });
        const pet = findPet(data, tid);
        if (numeric(pet.promote_lv) >= PROMOTE_MAX) fail(305, 'Pet promote level limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 5]]);
        pet.promote_lv = numeric(pet.promote_lv) + 1;
        savePets();
        const body = { pet, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_rsp_pet_develop', value: body, data: codec.pack('pb_rsp_pet_develop', body), valueForLog: { petTid: tid, promote: pet.promote_lv } };
      }

      fail(1, 'Invalid pet command');
    });
  }

  const protobuf = new Map([
    [PET_COMMANDS.upgrade, 'pb_req_pet_up_lv'],
    [PET_COMMANDS.equipCombine, 'pb_req_combine_equip'],
    [PET_COMMANDS.equipConvert, 'pb_req_combine_equip'],
    [PET_COMMANDS.runeConvert, 'pb_req_pet_rune_convert'],
    [PET_COMMANDS.equipUp, 'pb_pet_equip_star_up'],
    [PET_COMMANDS.lineupHelp, 'pb_pet_help_slot_list'],
    [PET_COMMANDS.wearEquip, 'pb_req_pet_slot_wear_equip_insert'],
    [PET_COMMANDS.upPromoteLevel, 'pb_pet_up_promote_lv_req']
  ]);
  return {
    supports: type => Object.values(PET_COMMANDS).includes(Number(type)),
    decode(type, data) {
      const schema = protobuf.get(Number(type));
      if (!schema) return undefined;
      return data?.length ? codec.unpack(schema, data) : {};
    },
    execute
  };
}
