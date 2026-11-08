import {
  ensureStateTable, fail, integer, numeric, readState, resourceChange, writeState
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// Single-command endgame modules whose table generation is still blocked:
// FantasyHandbookCmd 89001, PetPlayCmd 90901/90902, EnergyBurstCmd 91001,
// DivineEmbryoCmd 102201 and BadgeCmd 104201. Each command keeps its
// authoritative state in develop_module_state and answers with the shipped
// response schema. Award item lists that live only in the LazyInit table gen
// (EnergyBurstTable, PetPlayTable, FantasyHandbookTable, BadgeTable) are left
// empty instead of being invented; the claim bit is real and idempotent.
export const DEVELOP_EXTRA_COMMANDS = Object.freeze({
  fantasyHandbookStar: 89001,
  petPlayPeriodAward: 90901,
  petPlayOverExplore: 90902,
  energyBurstAward: 91001,
  divineEmbryoSelect: 102201,
  badgeActive: 104201
});

const HANDBOOK_CHIP = 434002;
const WEEK = 7 * 24 * 3600;
const PET_PLAY_EPOCH = 1_600_000_000; // Monday 05:00 anchor is inferred from init_time semantics

const states = {
  handbook: () => ({ stars: [] }),
  petPlay: () => ({ period: 0, mapIndex: 1, claimed: [] }),
  energyBurst: () => ({ claimed: [] }),
  divineEmbryo: () => ({ selectId: 0 }),
  badge: () => ({ badges: [] })
};

function periodOf(seconds) {
  return Math.floor((seconds - PET_PLAY_EPOCH) / WEEK);
}

export function createDevelopExtraService({ store, codec, now = () => Date.now() }) {
  const seconds = () => Math.floor(now() / 1000);

  function execute(type, input) {
    return store.transaction((model, db) => {
      ensureStateTable(db);
      const roleId = model.state.roleId;
      const load = (module, fallback) => readState(db, roleId, module, fallback());
      const save = (module, value) => writeState(db, roleId, module, value, now());
      const command = Number(type);

      if (command === DEVELOP_EXTRA_COMMANDS.fantasyHandbookStar) {
        const tid = integer(input?.tid ?? input?.id ?? input, 'fantasy equip tid', { min: 1 });
        const state = load('fantasy_handbook', states.handbook);
        state.stars ??= [];
        const entry = state.stars.find(row => numeric(row.tid) === tid) ?? { tid, star: 0 };
        if (entry.star >= 10) fail(305, 'Fantasy handbook star limit reached');
        const consumed = consumeResources(model, [[HANDBOOK_CHIP, 1]]);
        entry.star += 1;
        if (!state.stars.includes(entry)) state.stars.push(entry);
        save('fantasy_handbook', state);
        const body = { tid, star: entry.star };
        return { schema: 'pb_fantasy_handbook_equip', value: body, data: codec.pack('pb_fantasy_handbook_equip', body),
          valueForLog: { tid, star: entry.star, changes: consumed.changes.length } };
      }

      if (command === DEVELOP_EXTRA_COMMANDS.petPlayOverExplore) {
        const state = load('pet_play', states.petPlay);
        const period = periodOf(seconds());
        if (numeric(state.period) !== period) {
          state.period = period;
          state.mapIndex = 1;
        }
        if (state.mapIndex >= 7) fail(305, 'Pet play map limit reached');
        state.mapIndex += 1;
        save('pet_play', state);
        const body = { init_time: PET_PLAY_EPOCH, period: state.period, map_index: state.mapIndex, map: {}, is_rev: false };
        return { schema: 'pb_pet_play', value: body, data: codec.pack('pb_pet_play', body), valueForLog: { period: state.period, mapIndex: state.mapIndex } };
      }

      if (command === DEVELOP_EXTRA_COMMANDS.petPlayPeriodAward) {
        const state = load('pet_play', states.petPlay);
        state.claimed ??= [];
        const period = periodOf(seconds());
        if (state.claimed.includes(period)) fail(1, 'Pet play award already claimed this period');
        state.claimed.push(period);
        state.period = period;
        save('pet_play', state);
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body),
          valueForLog: { period, awards: 'unrecovered' } };
      }

      if (command === DEVELOP_EXTRA_COMMANDS.energyBurstAward) {
        const tier = integer(input, 'energy burst tier', { min: 1, max: 100 });
        const state = load('energy_burst', states.energyBurst);
        state.claimed ??= [];
        if (state.claimed.includes(tier)) fail(1, 'Energy burst award already claimed');
        state.claimed.push(tier);
        save('energy_burst', state);
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body),
          valueForLog: { tier, awards: 'unrecovered' } };
      }

      if (command === DEVELOP_EXTRA_COMMANDS.divineEmbryoSelect) {
        const selectId = integer(input, 'divine embryo selection', { min: 1 });
        const state = { selectId };
        save('divine_embryo', state);
        const body = { select_id: selectId, guaranteed_item: 0 };
        return { schema: 'pb_divine_embryo_data', value: body, data: codec.pack('pb_divine_embryo_data', body), valueForLog: { selectId } };
      }

      if (command === DEVELOP_EXTRA_COMMANDS.badgeActive) {
        const tids = input?.tid_list ?? input?.tid;
        const list = (Array.isArray(tids) ? tids : [tids]).map(value => integer(value, 'badge tid', { min: 1 }));
        if (!list.length) fail(1, 'Badge activation list is empty');
        const state = load('badge', states.badge);
        state.badges ??= [];
        const costs = [];
        for (const tid of list) {
          if (state.badges.some(row => numeric(row.tid) === tid)) fail(1, 'Badge is already activated');
          state.badges.push({ tid });
          costs.push([tid, 1]);
        }
        const consumed = consumeResources(model, costs);
        save('badge', state);
        const body = { badge_pages: [{ page_id: 1, badges: state.badges.map(row => ({ tid: row.tid })) }] };
        return { schema: 'pb_badge_role', value: body, data: codec.pack('pb_badge_role', body),
          valueForLog: { badges: state.badges.length, changes: consumed.changes.length } };
      }

      fail(1, 'Invalid endgame command');
    });
  }

  return {
    supports: type => Object.values(DEVELOP_EXTRA_COMMANDS).includes(Number(type)),
    decode(type, data) {
      const command = Number(type);
      if (command === DEVELOP_EXTRA_COMMANDS.fantasyHandbookStar) return data?.length ? codec.unpack('pb_fantasy_equip_id', data) : {};
      if (command === DEVELOP_EXTRA_COMMANDS.badgeActive) return data?.length ? codec.unpack('pb_badge_active_req', data) : {};
      return undefined;
    },
    execute
  };
}
