import { GameError } from './hero-progression.mjs';

// Read-only activity endpoints that have schema evidence but no verified gameplay rules yet.
// The inspected client decodes these responses into plain lists, so an empty list is a valid,
// honest answer for a local account with no records. Mutating commands are refused explicitly
// instead of inventing fish, catch probabilities, help-up progress or award states.
const reads = new Map([
  // FishingActCmd.req_fishing_act_get_record: marquee/first-three records per fish.
  [110308, ['pb_fishing_act_get_record_rsp', { record_list: [] }]],
  // FishingActCmd.req_fishing_act_get_fish_top: per-fish high score list.
  [110303, ['pb_fishing_act_get_top_rsp', { high_score_list: [] }]],
  // HelpUpActCmd.req_help_up_get_times: current help-up attempt count.
  [116004, ['pb_help_up_get_times_rsp', { times: 0 }]],
  // HundredDrawActCmd.req_hundred_draw_act_marquee: opening the welfare
  // activity asks for marquee records. An empty record set is valid before
  // the local account has drawn.
  [117005, ['pb_hundred_draw_act_marquee_rsp', { data: {} }]]
]);

const refused = new Map([
  [110301, 'Fishing catch rules are not implemented'],
  [110302, 'Fishing catch rules are not implemented'],
  [110311, 'Fishing batch catch rules are not implemented'],
  [110304, 'Fishing codex awards are not implemented'],
  [110305, 'Fishing map unlock is not implemented'],
  [110306, 'Fishing rod change is not implemented'],
  [110307, 'Fishing level awards are not implemented'],
  [110309, 'Fishing rank awards are not implemented'],
  [110310, 'Fishing progress awards are not implemented'],
  [116001, 'Help-up task rewards are not implemented'],
  [116002, 'Help-up stage awards are not implemented'],
  [116003, 'Help-up requests are not implemented']
]);

export function createActivityReadService({ codec, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  return {
    supports: type => reads.has(type) || refused.has(type),
    execute(type) {
      if (refused.has(type)) throw new GameError(5, refused.get(type));
      const [schema, value] = reads.get(type);
      log({ event: 'activity_read_sent', type, schema });
      return { value, data: codec.pack(schema, value) };
    }
  };
}
