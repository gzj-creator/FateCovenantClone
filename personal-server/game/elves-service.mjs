import {
  fail, integer, numeric, readModuleData, resourceChange, writeModuleData
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// ElvesCmd 93701-93707. The elf roster is login module 538 (pb_elves_develop)
// that resources.mjs already grants into; star/book/break costs use the shipped
// ElvesChip family (ItemTable: Elves 100120 -> chip 100121).
export const ELVES_COMMANDS = Object.freeze({
  upStar: 93701, upTalent: 93702, upBook: 93703, lineupHelp: 93704,
  wearSkin: 93705, mutant: 93706, upBreakLevel: 93707
});

const ELVES_MODULE = 538;
const ELVES_SCHEMA = 'pb_elves_develop';
const ELVES_MUTANT_ITEM = 633002;
const STAR_MAX = 15;
const TALENT_MAX = 10;
const BOOK_MAX = 10;
const BREAK_MAX = 5;

const chipOf = tid => tid + 1;

export function createElvesService({ store, codec }) {
  function execute(type, input) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const data = readModuleData(modules, ELVES_MODULE, null, ELVES_SCHEMA, { elves: [], help_slots: [] }, codec);
      data.elves ??= [];
      data.help_slots ??= [];
      const save = () => { writeModuleData(modules, ELVES_MODULE, null, ELVES_SCHEMA, data, codec); model.state.modules.value = [...modules]; };
      const elfOf = tid => {
        const elf = data.elves.find(entry => numeric(entry.tid) === tid);
        if (!elf) fail(5, 'Elf is not owned');
        return elf;
      };
      const command = Number(type);

      if (command === ELVES_COMMANDS.upStar) {
        const tid = integer(input?.elves_tid, 'elf tid', { min: 1 });
        const elf = elfOf(tid);
        const star = numeric(elf.star);
        if (star >= STAR_MAX) fail(305, 'Elf star limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), star + 2]]);
        elf.star = star + 1;
        save();
        const body = { elves: elf, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_elves_develop_rsp', value: body, data: codec.pack('pb_elves_develop_rsp', body), valueForLog: { elfTid: tid, star: elf.star } };
      }

      if (command === ELVES_COMMANDS.upTalent) {
        const tid = integer(input?.elves_tid, 'elf tid', { min: 1 });
        const page = integer(input?.page ?? 1, 'talent page', { min: 1, max: 10 });
        const talentId = integer(input?.talent_id, 'talent id', { min: 1 });
        const count = integer(input?.up_level ?? 1, 'talent level count', { min: 1, max: TALENT_MAX });
        const elf = elfOf(tid);
        elf.talent_pages ??= [];
        let talentPage = elf.talent_pages.find(entry => numeric(entry.page) === page);
        if (!talentPage) { talentPage = { page, talents: [] }; elf.talent_pages.push(talentPage); }
        talentPage.talents ??= [];
        let talent = talentPage.talents.find(entry => numeric(entry.id) === talentId);
        if (!talent) { talent = { id: talentId, level: 0 }; talentPage.talents.push(talent); }
        if (numeric(talent.level) + count > TALENT_MAX) fail(305, 'Elf talent limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), count]]);
        talent.level = numeric(talent.level) + count;
        save();
        const body = { elves: elf, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_elves_develop_rsp', value: body, data: codec.pack('pb_elves_develop_rsp', body), valueForLog: { elfTid: tid, page, talentId, level: talent.level } };
      }

      if (command === ELVES_COMMANDS.upBook) {
        const tid = integer(input?.elves_tid, 'elf tid', { min: 1 });
        const elf = elfOf(tid);
        if (numeric(elf.book_level) >= BOOK_MAX) fail(305, 'Elf handbook level limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 2]]);
        elf.book_level = numeric(elf.book_level) + 1;
        save();
        const body = { elves: elf, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_elves_develop_rsp', value: body, data: codec.pack('pb_elves_develop_rsp', body), valueForLog: { elfTid: tid, bookLevel: elf.book_level } };
      }

      if (command === ELVES_COMMANDS.lineupHelp) {
        const slots = input?.help_slots ?? [];
        data.help_slots = slots.map(entry => ({ index: integer(entry?.index, 'help slot index', { min: 1 }), elves_tid: integer(entry?.elves_tid ?? 0, 'elf tid', { min: 0 }) }));
        for (const slot of data.help_slots) if (slot.elves_tid) elfOf(slot.elves_tid);
        save();
        return { schema: null, value: {}, data: Buffer.alloc(0), valueForLog: { helpSlots: data.help_slots.length } };
      }

      if (command === ELVES_COMMANDS.wearSkin) {
        const tid = integer(input?.elves_tid, 'elf tid', { min: 1 });
        const skinTid = integer(input?.skin_tid ?? 0, 'skin tid', { min: 0 });
        const elf = elfOf(tid);
        elf.skin_tid = skinTid;
        save();
        return { schema: null, value: {}, data: Buffer.alloc(0), valueForLog: { elfTid: tid, skinTid } };
      }

      if (command === ELVES_COMMANDS.mutant) {
        const tid = integer(input, 'elf tid', { min: 1 });
        const elf = elfOf(tid);
        if (elf.is_mutant) fail(1, 'Elf is already mutated');
        const consumed = consumeResources(model, [[ELVES_MUTANT_ITEM, 1]]);
        elf.is_mutant = true;
        save();
        const body = { elves: elf, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_elves_mutant_back', value: body, data: codec.pack('pb_elves_mutant_back', body), valueForLog: { elfTid: tid } };
      }

      if (command === ELVES_COMMANDS.upBreakLevel) {
        const tid = integer(input?.elves_tid, 'elf tid', { min: 1 });
        const elf = elfOf(tid);
        if (numeric(elf.break_lv) >= BREAK_MAX) fail(305, 'Elf break level limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), 10]]);
        elf.break_lv = numeric(elf.break_lv) + 1;
        save();
        const body = { elves: elf, res_change: resourceChange(consumed.changes) };
        return { schema: 'pb_elves_develop_rsp', value: body, data: codec.pack('pb_elves_develop_rsp', body), valueForLog: { elfTid: tid, breakLevel: elf.break_lv } };
      }

      fail(1, 'Invalid elf command');
    });
  }

  const protobuf = new Map([
    [ELVES_COMMANDS.upStar, 'pb_elves_up_star_req'],
    [ELVES_COMMANDS.upTalent, 'pb_elves_up_talent_req'],
    [ELVES_COMMANDS.upBook, 'pb_elves_up_book_req'],
    [ELVES_COMMANDS.lineupHelp, 'pb_elves_lineup_help_req'],
    [ELVES_COMMANDS.wearSkin, 'pb_elves_wear_skin_req'],
    [ELVES_COMMANDS.upBreakLevel, 'pb_elves_up_break_lv_req']
  ]);
  return {
    supports: type => Object.values(ELVES_COMMANDS).includes(Number(type)),
    decode(type, data) {
      const schema = protobuf.get(Number(type));
      if (!schema) return undefined;
      return data?.length ? codec.unpack(schema, data) : {};
    },
    execute
  };
}
