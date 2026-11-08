import {
  fail, integer, numeric, readModuleData, readState, resourceChange, writeModuleData, writeState, ensureStateTable
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// ElvesBeadCmd 93751-93755. Spirit beads live in login module 539
// (pb_elves_bead_data). Bead level/star costs use the shipped ElvesBead item
// family (ItemTable obj_class ElvesBead) whose smallest row is the level-1 bead.
export const ELVES_BEAD_COMMANDS = Object.freeze({
  upLevel: 93751, upStar: 93752, wear: 93753, unWear: 93754, resolve: 93755
});

const BEAD_MODULE = 539;
const BEAD_SCHEMA = 'pb_elves_bead_data';
const LEVEL_MAX = 100;
const STAR_MAX = 10;
const BEAD_TID = 1000122;

export function createElvesBeadService({ store, codec, now = () => Date.now() }) {
  function execute(type, input) {
    return store.transaction((model, db) => {
      ensureStateTable(db);
      const roleId = model.state.roleId;
      const modules = new Map(model.state.modules.value);
      const data = readModuleData(modules, BEAD_MODULE, null, BEAD_SCHEMA, { max_uid: 0, elves_beads: [] }, codec);
      data.elves_beads ??= [];
      data.max_uid = numeric(data.max_uid);
      const save = () => { writeModuleData(modules, BEAD_MODULE, null, BEAD_SCHEMA, data, codec); model.state.modules.value = [...modules]; };
      const beadOf = uid => {
        const bead = data.elves_beads.find(entry => numeric(entry.uid) === uid);
        if (!bead) fail(5, 'Spirit bead does not exist');
        return bead;
      };
      const command = Number(type);

      if (command === ELVES_BEAD_COMMANDS.upLevel) {
        const uid = integer(input?.bead_uid, 'bead uid', { min: 1 });
        const bead = beadOf(uid);
        const count = integer(input?.up_level ?? 1, 'level count', { min: 1, max: 100 });
        if (numeric(bead.level) + count > LEVEL_MAX) fail(305, 'Spirit bead level limit reached');
        const consumed = consumeResources(model, [[BEAD_TID, count]]);
        bead.level = numeric(bead.level) + count;
        save();
        const body = { bead: { tid: numeric(bead.tid), uid, level: numeric(bead.level), star: numeric(bead.star) }, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_bead_develop_rsp', value: body, data: codec.pack('pb_bead_develop_rsp', body), valueForLog: { uid, level: bead.level } };
      }

      if (command === ELVES_BEAD_COMMANDS.upStar) {
        const rune = Number(type);
        const target = beadOf(integer(input?.bead_uid, 'bead uid', { min: 1 }));
        if (numeric(target.star) >= STAR_MAX) fail(305, 'Spirit bead star limit reached');
        for (const value of input?.use_bead_uid_list ?? []) {
          const uid = integer(value, 'bead uid', { min: 1 });
          const index = data.elves_beads.findIndex(entry => numeric(entry.uid) === uid);
          if (index < 0) fail(5, 'Spirit bead does not exist');
          data.elves_beads.splice(index, 1);
        }
        target.star = numeric(target.star) + 1;
        save();
        const body = { tid: numeric(target.tid), uid: numeric(target.uid), level: numeric(target.level), star: numeric(target.star) };
        return { schema: 'pb_elves_bead_back', value: body, data: codec.pack('pb_elves_bead_back', body), valueForLog: { command: rune, uid: target.uid, star: target.star } };
      }

      if (command === ELVES_BEAD_COMMANDS.wear || command === ELVES_BEAD_COMMANDS.unWear) {
        const slots = readState(db, roleId, 'elves_bead_slots', { slots: [] });
        slots.slots ??= [];
        const requests = command === ELVES_BEAD_COMMANDS.wear
          ? (input?.beads_slots ?? []).flatMap(entry => (entry?.beads_slots ?? []).map(slot => ({ elves_id: numeric(entry?.elves_id), slot })))
          : [{ elves_id: numeric(input?.elves_id), slot: { index: numeric(input?.slot), elves_bead_uid: 0 } }];
        if (!requests.length) fail(1, 'Spirit bead slot request is empty');
        for (const request of requests) {
          const index = integer(request.slot?.index, 'slot index', { min: 1 });
          const uid = numeric(request.slot?.elves_bead_uid);
          if (uid > 0) beadOf(uid);
          slots.slots = slots.slots.filter(row => !(numeric(row.elves_id) === request.elves_id && numeric(row.index) === index));
          if (uid > 0) slots.slots.push({ elves_id: request.elves_id, index, uid });
        }
        writeState(db, roleId, 'elves_bead_slots', slots, now());
        const body = command === ELVES_BEAD_COMMANDS.wear
          ? { elves_list: [] }
          : { elves: {} };
        const schema = command === ELVES_BEAD_COMMANDS.wear ? 'pb_bead_equip_rsp' : 'pb_bead_un_equip_rsp';
        return { schema, value: body, data: codec.pack(schema, body), valueForLog: { slots: slots.slots.length } };
      }

      if (command === ELVES_BEAD_COMMANDS.resolve) {
        const uid = integer(input, 'bead uid', { min: 1 });
        const index = data.elves_beads.findIndex(entry => numeric(entry.uid) === uid);
        if (index < 0) fail(5, 'Spirit bead does not exist');
        data.elves_beads.splice(index, 1);
        save();
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { uid, resolved: 'unrecovered' } };
      }

      fail(1, 'Invalid spirit bead command');
    });
  }

  const protobuf = new Map([
    [ELVES_BEAD_COMMANDS.upLevel, 'pb_bead_level_up_req'],
    [ELVES_BEAD_COMMANDS.upStar, 'pb_bead_up_star_req'],
    [ELVES_BEAD_COMMANDS.wear, 'pb_bead_equip_req'],
    [ELVES_BEAD_COMMANDS.unWear, 'pb_bead_un_equip_req']
  ]);
  return {
    supports: type => Object.values(ELVES_BEAD_COMMANDS).includes(Number(type)),
    decode(type, data) {
      const schema = protobuf.get(Number(type));
      if (!schema) return undefined;
      return data?.length ? codec.unpack(schema, data) : {};
    },
    execute
  };
}
