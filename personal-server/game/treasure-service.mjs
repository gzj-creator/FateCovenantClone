import {
  fail, integer, numeric, readModuleData, resourceChange, writeModuleData
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// TreasureCmd 93301-93306. The treasure roster is login module 534
// (pb_treasure_data) that resources.mjs already grants into; star-up costs use
// the shipped TreasureChip family (ItemTable: Treasure 130117 -> chip 10130117).
export const TREASURE_COMMANDS = Object.freeze({
  star: 93301, drawAward: 93302, suitUp: 93303, attrUpdate: 93304, customDraw: 93305, box: 93306
});

const TREASURE_MODULE = 534;
const TREASURE_SCHEMA = 'pb_treasure_data';
const STAR_MAX = 10;
const SUIT_STAR_MAX = 10;
const PHASES = 10;

const chipOf = tid => Number('10' + String(tid));

export function createTreasureService({ store, codec }) {
  function execute(type, input) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const data = readModuleData(modules, TREASURE_MODULE, 0, TREASURE_SCHEMA,
        { treasure_list: [], suit_list: [], treasure_box_list: [] }, codec);
      data.treasure_list ??= [];
      data.suit_list ??= [];
      data.treasure_box_list ??= [];
      data.custom_draw ??= {};
      data.draw_award_data ??= { season_id: 0, draw_num: 0, award_phase_num: 0 };
      const save = () => { writeModuleData(modules, TREASURE_MODULE, 0, TREASURE_SCHEMA, data, codec); model.state.modules.value = [...modules]; };
      const command = Number(type);

      if (command === TREASURE_COMMANDS.star) {
        const tid = integer(input, 'treasure tid', { min: 1 });
        const card = data.treasure_list.find(entry => numeric(entry.tid) === tid);
        if (!card) fail(5, 'Treasure is not activated');
        const star = numeric(card.star);
        if (star >= STAR_MAX) fail(305, 'Treasure star limit reached');
        const consumed = consumeResources(model, [[chipOf(tid), star + 1]]);
        card.star = star + 1;
        save();
        const box = data.treasure_box_list.find(entry => numeric(entry.tid) === tid) ?? { tid, last_delta_day: 0 };
        const body = { card, res: resourceChange(consumed.changes), box };
        return { schema: 'pb_treasure_star_ret', value: body, data: codec.pack('pb_treasure_star_ret', body), valueForLog: { tid, star: card.star } };
      }

      if (command === TREASURE_COMMANDS.drawAward) {
        const phase = integer(input, 'draw phase', { min: 1, max: PHASES });
        const draw = data.draw_award_data;
        const num = numeric(draw.draw_num);
        if (num < phase * 10) fail(305, 'Treasure draw count is not enough');
        const claimed = Buffer.from(draw.award_state ?? '', 'base64');
        const bit = phase - 1;
        const byte = Math.floor(bit / 8);
        const bytes = Buffer.alloc(Math.max(claimed.length, byte + 1));
        claimed.copy(bytes);
        const mask = 1 << (bit % 8);
        if (bytes[byte] & mask) fail(1, 'Treasure draw phase award already claimed');
        bytes[byte] |= mask;
        draw.award_state = bytes.toString('base64');
        draw.award_phase_num = Math.max(numeric(draw.award_phase_num), phase);
        save();
        const body = { draw, res_change: resourceChange([]) };
        return { schema: 'pb_treasure_draw_phase_award_back', value: body, data: codec.pack('pb_treasure_draw_phase_award_back', body), valueForLog: { phase } };
      }

      if (command === TREASURE_COMMANDS.suitUp) {
        const tid = integer(input, 'treasure suit tid', { min: 1 });
        let suit = data.suit_list.find(entry => numeric(entry.tid) === tid);
        if (!suit) { suit = { tid, star: 0 }; data.suit_list.push(suit); }
        if (numeric(suit.star) >= SUIT_STAR_MAX) fail(305, 'Treasure suit star limit reached');
        suit.star = numeric(suit.star) + 1;
        save();
        const body = { tid, star: numeric(suit.star) };
        return { schema: 'pb_treasure_suit', value: body, data: codec.pack('pb_treasure_suit', body), valueForLog: { tid, star: suit.star } };
      }

      if (command === TREASURE_COMMANDS.attrUpdate) {
        const tid = integer(input, 'treasure tid', { min: 1 });
        const card = data.treasure_list.find(entry => numeric(entry.tid) === tid);
        if (!card) fail(5, 'Treasure is not activated');
        const box = data.treasure_box_list.find(entry => numeric(entry.tid) === tid);
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { tid, box: Boolean(box) } };
      }

      if (command === TREASURE_COMMANDS.customDraw) {
        const index = integer(input?.treasure_index, 'treasure index', { min: 1 });
        const lib = integer(input?.draw_lib ?? 0, 'draw lib', { min: 0 });
        data.custom_draw = { draw_lib: lib, treasure_index: index };
        save();
        const body = data.custom_draw;
        return { schema: 'pb_treasure_custom_draw', value: body, data: codec.pack('pb_treasure_custom_draw', body), valueForLog: { index, lib } };
      }

      if (command === TREASURE_COMMANDS.box) {
        const tids = input?.treasure_tid_list ?? [];
        if (!Array.isArray(tids) || tids.length === 0) fail(1, 'Treasure box list is empty');
        const changed = [];
        for (const value of tids) {
          const tid = integer(value, 'treasure tid', { min: 1 });
          const card = data.treasure_list.find(entry => numeric(entry.tid) === tid);
          if (!card) fail(5, 'Treasure is not activated');
          let box = data.treasure_box_list.find(entry => numeric(entry.tid) === tid);
          if (!box) { box = { tid, last_delta_day: 0 }; data.treasure_box_list.push(box); }
          box.last_delta_day = 0;
          changed.push(box);
        }
        save();
        const body = { treasure_boxes_change: changed, res_change: resourceChange([]) };
        return { schema: 'pb_treasure_box_rsp', value: body, data: codec.pack('pb_treasure_box_rsp', body), valueForLog: { boxes: changed.length } };
      }

      fail(1, 'Invalid treasure command');
    });
  }

  return {
    supports: type => Object.values(TREASURE_COMMANDS).includes(Number(type)),
    decode(type, data) {
      const command = Number(type);
      if (command === TREASURE_COMMANDS.customDraw) return data?.length ? codec.unpack('pb_treasure_custom_draw', data) : {};
      if (command === TREASURE_COMMANDS.box) return data?.length ? codec.unpack('pb_treasure_box_req', data) : {};
      return undefined;
    },
    execute
  };
}
