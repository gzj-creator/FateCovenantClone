import {
  ensureStateTable, fail, integer, numeric, readState, resourceChange, writeState
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// MuseumCmd 85701/85702. MuseumTable only ships as LazyInit bytecode, so the
// popularity milestones are a local-server inference: each activated collection
// item contributes its own popularity value, and the award tier n needs
// n * POPULARITY_PER_TIER. Collection activation consumes the shipped museum
// collection item (ItemTable obj_class MuseumCollectionItem).
export const MUSEUM_COMMANDS = Object.freeze({ popularityAward: 85701, activeCollection: 85702 });
const MODULE = 'museum';
const POPULARITY_PER_TIER = 100;
const POPULARITY_PER_ITEM = 10;

const emptyState = () => ({ collections: [], popularity: 0, claimed: [] });

export function createMuseumService({ store, codec, now = () => Date.now() }) {
  function execute(type, input) {
    return store.transaction((model, db) => {
      ensureStateTable(db);
      const roleId = model.state.roleId;
      const state = readState(db, roleId, MODULE, emptyState());
      state.collections ??= [];
      state.claimed ??= [];
      state.popularity = integer(state.popularity ?? 0, 'popularity', { min: 0, max: 2 ** 31 - 1 });

      if (Number(type) === MUSEUM_COMMANDS.activeCollection) {
        const requests = input?.pb_museum_req_list ?? input?.list ?? [];
        if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Museum collection list is empty');
        const costs = [];
        for (const request of requests) {
          const tid = integer(request?.tid, 'collection tid', { min: 1 });
          const num = integer(request?.num, 'collection count', { min: 1, max: 999 });
          const existing = state.collections.find(entry => numeric(entry.tid) === tid);
          if (!existing) state.collections.push({ tid, num });
          else existing.num = numeric(existing.num) + num;
          costs.push([tid, num]);
          state.popularity += num * POPULARITY_PER_ITEM;
        }
        const consumed = consumeResources(model, costs);
        writeState(db, roleId, MODULE, state, now());
        const body = resourceChange(consumed.changes);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body),
          valueForLog: { collections: state.collections.length, popularity: state.popularity } };
      }

      if (Number(type) === MUSEUM_COMMANDS.popularityAward) {
        const level = integer(input, 'popularity tier', { min: 1, max: 1000 });
        if (state.claimed.includes(level)) fail(1, 'Museum popularity award already claimed');
        if (state.popularity < level * POPULARITY_PER_TIER) fail(305, 'Museum popularity is not enough');
        state.claimed.push(level);
        writeState(db, roleId, MODULE, state, now());
        const body = resourceChange([]);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body),
          valueForLog: { tier: level, popularity: state.popularity, awards: 'unrecovered' } };
      }

      fail(1, 'Invalid museum command');
    });
  }

  return {
    supports: type => Object.values(MUSEUM_COMMANDS).includes(Number(type)),
    decode(type, data) {
      if (Number(type) === MUSEUM_COMMANDS.activeCollection) {
        return data?.length ? codec.unpack('pb_museum_req_list', data) : {};
      }
      return undefined;
    },
    execute
  };
}
