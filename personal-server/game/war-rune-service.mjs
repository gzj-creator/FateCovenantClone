import {
  ensureStateTable, fail, integer, numeric, readState, resourceChange, writeState
} from './develop-support.mjs';
import { consumeResources } from './resources.mjs';

// WarRuneCmd 83001-83007. The login container slot for pb_war_rune is not
// recovered, so the authoritative state lives in develop_module_state and the
// commands answer with the pb_* schemas from war_rune.net.proto. Costs use the
// shipped ItemWarRuneChip family (ItemTable obj_class ItemWarRuneChip); the
// per-rank amounts are a local-server inference because WarRuneTable only ships
// in the LazyInit bytecode generation that the table interpreter cannot read yet.
export const WAR_RUNE_COMMANDS = Object.freeze({
  active: 83001,
  upStage: 83002,
  attrRandom: 83003,
  recast: 83004,
  edu: 83005,
  upLevel: 83006,
  upStar: 83007
});

const MODULE = 'war_rune';
const CHIP_TIDS = [151002, 152002, 153002, 154002];
const ATTR_KEYS = [2, 3, 4, 5, 6, 7];
const STAR_MAX = 10;
const LEVEL_MAX = 100;

const emptyState = () => ({ runes: [], grids: [] });

function findRune(state, tid) {
  const rune = state.runes.find(entry => numeric(entry.tid) === tid);
  if (!rune) fail(5, 'War rune is not activated');
  return rune;
}

function chipFor(rune) {
  const quality = integer(rune.quality || 1, 'war rune quality', { min: 1, max: CHIP_TIDS.length });
  return CHIP_TIDS[quality - 1];
}

function attrsOf(rune) {
  const develop = rune.attr ?? {};
  const attr = develop.key ? [{ attr_item: { key: Number(develop.key), value: Number(develop.value ?? 0) }, develop_id: numeric(rune.tid) }] : [];
  const flush = develop.flushKey ? [{ attr_item: { key: Number(develop.flushKey), value: Number(develop.flushValue ?? 0) }, develop_id: numeric(rune.tid) }] : [];
  return { attr, flush };
}

export function createWarRuneService({ store, codec, now = () => Date.now(), random = Math.random }) {
  function execute(type, input) {
    return store.transaction((model, db) => {
      ensureStateTable(db);
      const roleId = model.state.roleId;
      const state = readState(db, roleId, MODULE, emptyState());
      state.runes ??= [];
      state.grids ??= [];
      const save = () => writeState(db, roleId, MODULE, state, now());

      if (type === WAR_RUNE_COMMANDS.active) {
        const runeTid = integer(input, 'war rune tid', { min: 1 });
        if (state.runes.some(entry => numeric(entry.tid) === runeTid)) fail(1, 'War rune is already activated');
        const consumed = consumeResources(model, [[CHIP_TIDS[0], 1]]);
        const rune = { tid: runeTid, quality: 1, stage: 1, level: 1, star: 1, attr: {} };
        state.runes.push(rune);
        const grid = { type: state.grids.length + 1, rune_tid: runeTid };
        state.grids.push(grid);
        save();
        const value = { grid, res: resourceChange(consumed.changes) };
        return { schema: 'pb_war_rune_active_back', value, data: codec.pack('pb_war_rune_active_back', value),
          valueForLog: { runeTid, gridType: grid.type } };
      }

      if (type === WAR_RUNE_COMMANDS.upStage) {
        const rune = findRune(state, integer(input, 'war rune tid', { min: 1 }));
        const stage = integer(rune.stage ?? 1, 'stage', { min: 1 });
        if (stage >= 10) fail(305, 'War rune stage limit reached');
        const consumed = consumeResources(model, [[chipFor(rune), stage]]);
        rune.stage = stage + 1;
        save();
        const value = resourceChange(consumed.changes);
        return { schema: 'pb_res_to_client', value, data: codec.pack('pb_res_to_client', value), valueForLog: { runeTid: rune.tid, stage: rune.stage } };
      }

      if (type === WAR_RUNE_COMMANDS.attrRandom) {
        const rune = findRune(state, integer(input, 'war rune tid', { min: 1 }));
        const consumed = consumeResources(model, [[chipFor(rune), 1]]);
        const key = ATTR_KEYS[Math.floor(random() * ATTR_KEYS.length) % ATTR_KEYS.length];
        const value = integer(100 + Math.floor(random() * 401), 'attr roll', { min: 1 });
        rune.attr = { ...(rune.attr ?? {}), flushKey: key, flushValue: value };
        save();
        const body = { develop_list: [{ attr_item: { key, value }, develop_id: numeric(rune.tid) }], res: resourceChange(consumed.changes) };
        return { schema: 'pb_war_rune_random_attr_back', value: body, data: codec.pack('pb_war_rune_random_attr_back', body),
          valueForLog: { runeTid: rune.tid, key, value } };
      }

      if (type === WAR_RUNE_COMMANDS.recast) {
        const runeTid = integer(input?.rune_tid, 'war rune tid', { min: 1 });
        const rune = findRune(state, runeTid);
        const attr = rune.attr ?? {};
        if (!attr.flushKey) fail(5, 'War rune has no rolled attribute to keep');
        const fromId = integer(input?.from_id ?? 0, 'from attribute id', { min: 0 });
        const targetId = integer(input?.target_id ?? 0, 'target attribute id', { min: 0 });
        if (targetId && targetId !== numeric(rune.tid)) fail(1, 'Attribute does not belong to this war rune');
        const consumed = consumeResources(model, [[chipFor(rune), 1]]);
        rune.attr = { key: attr.flushKey, value: attr.flushValue, replacedFrom: fromId };
        save();
        const body = { ...attrsOf(rune), res: resourceChange(consumed.changes) };
        return { schema: 'pb_attr_develop_info', value: { attr_list: body.attr, flush_list: body.flush },
          data: codec.pack('pb_attr_develop_info', { attr_list: body.attr, flush_list: body.flush }),
          valueForLog: { runeTid: rune.tid, fromId, targetId } };
      }

      if (type === WAR_RUNE_COMMANDS.edu || type === WAR_RUNE_COMMANDS.upLevel) {
        const rune = findRune(state, integer(input, 'war rune tid', { min: 1 }));
        const level = integer(rune.level ?? 1, 'level', { min: 1 });
        if (level >= LEVEL_MAX) fail(305, 'War rune level limit reached');
        const consumed = consumeResources(model, [[chipFor(rune), type === WAR_RUNE_COMMANDS.edu ? 2 : 1]]);
        rune.level = level + 1;
        save();
        if (type === WAR_RUNE_COMMANDS.edu) {
          const body = { level_attr_list: [{ key: 2, value: rune.level * 10 }, { key: 3, value: rune.level * 5 }], res: resourceChange(consumed.changes) };
          return { schema: 'pb_war_rune_edu_back', value: body, data: codec.pack('pb_war_rune_edu_back', body), valueForLog: { runeTid: rune.tid, level: rune.level } };
        }
        const body = resourceChange(consumed.changes);
        return { schema: 'pb_res_to_client', value: body, data: codec.pack('pb_res_to_client', body), valueForLog: { runeTid: rune.tid, level: rune.level } };
      }

      if (type === WAR_RUNE_COMMANDS.upStar) {
        const rune = findRune(state, integer(input, 'war rune tid', { min: 1 }));
        const star = integer(rune.star ?? 1, 'star', { min: 1 });
        if (star >= STAR_MAX) fail(305, 'War rune star limit reached');
        const consumed = consumeResources(model, [[chipFor(rune), 3]]);
        rune.star = star + 1;
        save();
        const body = { war_rune: { tid: numeric(rune.tid), num: 1, quality: numeric(rune.quality), stage: numeric(rune.stage), level: numeric(rune.level), star: numeric(rune.star) },
          res: resourceChange(consumed.changes) };
        return { schema: 'pb_war_rune_up_star_back', value: body, data: codec.pack('pb_war_rune_up_star_back', body), valueForLog: { runeTid: rune.tid, star: rune.star } };
      }

      fail(1, 'Invalid war-rune command');
    });
  }

  return {
    supports: type => Object.values(WAR_RUNE_COMMANDS).includes(Number(type)),
    decode(type, data) {
      if (Number(type) === WAR_RUNE_COMMANDS.recast) {
        return data?.length ? codec.unpack('pb_war_rune_recast_req', data) : {};
      }
      return undefined; // ETF integer argument, decoded by the gateway
    },
    execute
  };
}
