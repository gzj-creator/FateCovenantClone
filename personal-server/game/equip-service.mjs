import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';

const ROLE_EQUIP_MODULE = 26;
const BAG_EQUIP_MODULE = 16;
const fail = (code, message) => { throw new GameError(code, message); };

function readModuleEquips(modules, moduleId, codec) {
  const module = modules.get(moduleId);
  if (!module) return [];
  try {
    const bytes = rawBinary(module);
    if (!bytes?.length) return [];
    const data = codec.unpack('pb_role_equip', bytes);
    return Array.isArray(data?.equips) ? data.equips : [];
  } catch {
    return [];
  }
}

function writeModuleEquips(modules, moduleId, codec, equips) {
  modules.set(moduleId, serializedBinary(codec.pack('pb_role_equip', { equips })));
}

function currentPreLineup(model) {
  const current = (model.lineups?.pre_lineups ?? []).find(pre => pre.index === (model.lineups?.cur_pre_index || 1));
  if (!current) return undefined;
  return { index: current.index, lineup: current.lineup, select_camp: 0 };
}

function safeNumber(value, field, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) fail(1, 'Invalid ' + field);
  return number;
}

function normalizeId(input) {
  if (Array.isArray(input)) input = input.length ? input[0] : undefined;
  if (input && typeof input === 'object') {
    input = input.equip_id ?? input.id ?? input.equipId ?? input.param ?? input.value ?? input[0];
  }
  const id = Number(input);
  if (!Number.isSafeInteger(id) || id < 1) fail(1, 'Invalid equip id');
  return id;
}

function normalizeRefineRequest(input) {
  if (Array.isArray(input)) input = input.length === 1 ? input[0] : input;
  const result = { equip_id: 0, target_level: 0 };
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    result.equip_id = Number(input.equip_id ?? input.id ?? input.equipId ?? 0);
    result.target_level = Number(input.target_level ?? input.targetLevel ?? input.target ?? 0);
  } else if (typeof input === 'number') {
    result.equip_id = Number(input);
  }
  if (!Number.isSafeInteger(result.equip_id) || result.equip_id < 1) fail(1, 'Invalid equip id');
  if (!Number.isSafeInteger(result.target_level) || result.target_level < 0) fail(1, 'Invalid target level');
  return result;
}

function cloneEquip(equip) {
  return structuredClone(equip);
}

export function createEquipService({ store, codec, tables = readEquipTables() }) {
  return {
    supports: type => type === 1001 || type === 1002 || type === 1003 || type === 1004 || type === 1005 || type === 1006,
    execute(type, input) {
      if (type === 1001) {
        const requests = input?.equips;
        if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Equip level-up list is empty');
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const roleEquips = readModuleEquips(modules, ROLE_EQUIP_MODULE, codec);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const byId = new Map();
          for (const equip of [...roleEquips, ...bagEquips]) byId.set(String(equip.id), equip);

          const updated = [];
          for (const request of requests) {
            const id = safeNumber(request?.id, 'equip id', { min: 1 });
            const addLevel = safeNumber(request?.add_level, 'add level', { min: 1 });
            const equip = byId.get(String(id));
            if (!equip) fail(5, 'Equip does not exist');
            equip.level = Number(equip.level ?? 0) + addLevel;
            equip.level_exp = Number(equip.level_exp ?? 0);
            updated.push(structuredClone(equip));
          }

          writeModuleEquips(modules, ROLE_EQUIP_MODULE, codec, roleEquips);
          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const value = {
            equips: updated,
            res_change: { changes: [], is_overflow: false }
          };
          return {
            schema: 'pb_equip_level_up_rsp',
            value,
            data: codec.pack('pb_equip_level_up_rsp', value)
          };
        });
      }

      if (type === 1002) {
        const requests = input?.equips;
        if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Equip forge list is empty');
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const created = [];
          for (const request of requests) {
            const index = safeNumber(request?.index, 'forge index', { min: 0 });
            const equipId = safeNumber(request?.equip_id, 'equip id', { min: 1 });
            const times = safeNumber(request?.times ?? 1, 'forge times', { min: 1 });
            const newId = (bagEquips.reduce((max, equip) => Math.max(max, Number(equip.id ?? 0)), 0) + created.length + 1);
            const equip = {
              id: newId,
              tid: equipId,
              level: 1,
              level_exp: 0,
              inscription: 0,
              refine: 0,
              refine_exp: 0,
              random_develop_cost: []
            };
            bagEquips.push(equip);
            created.push(structuredClone(equip));
          }

          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const curPre = currentPreLineup(model);
          const value = {
            res_change: { changes: [], is_overflow: false },
            equip: created,
            change_lineup: [],
            ...(curPre ? { cur_pre_lineup: curPre } : {})
          };
          return {
            schema: 'pb_equip_forge_rsp',
            value,
            data: codec.pack('pb_equip_forge_rsp', value)
          };
        });
      }

      if (type === 1003) {
        const id = normalizeId(input);
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const roleEquips = readModuleEquips(modules, ROLE_EQUIP_MODULE, codec);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const all = [...roleEquips, ...bagEquips];
          const equip = all.find(item => Number(item.id) === id);
          if (!equip) fail(5, 'Equip does not exist');

          const template = tables?.Equip?.get(Number(equip.tid));
          const limit = Number(template?.refine_limit_lv ?? 0);
          const current = Number(equip.refine ?? 0);
          if (limit > 0 && current >= limit) fail(305, 'Equip refine limit reached');
          equip.refine = current + 1;
          equip.refine_exp = 0;

          writeModuleEquips(modules, ROLE_EQUIP_MODULE, codec, roleEquips);
          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const value = {
            equip: cloneEquip(equip),
            multi: 1,
            res_change: { changes: [], is_overflow: false }
          };
          return {
            schema: 'pb_equip_refine_rsp',
            value,
            data: codec.pack('pb_equip_refine_rsp', value)
          };
        });
      }

      if (type === 1004) {
        const request = normalizeRefineRequest(input);
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const roleEquips = readModuleEquips(modules, ROLE_EQUIP_MODULE, codec);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const all = [...roleEquips, ...bagEquips];
          const equip = all.find(item => Number(item.id) === request.equip_id);
          if (!equip) fail(5, 'Equip does not exist');

          const template = tables?.Equip?.get(Number(equip.tid));
          const limit = Number(template?.refine_limit_lv ?? 0);
          const current = Number(equip.refine ?? 0);
          let target = request.target_level;
          if (limit > 0 && target > limit) target = limit;
          if (target < current) target = current;
          const gained = target - current;
          equip.refine = target;
          equip.refine_exp = 0;

          writeModuleEquips(modules, ROLE_EQUIP_MODULE, codec, roleEquips);
          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const value = {
            equip: cloneEquip(equip),
            res_change: { changes: [], is_overflow: false },
            multi: Array(Math.max(gained, 0)).fill(1),
            times: Math.max(gained, 0)
          };
          return {
            schema: 'pb_equip_refine_one_key_rsp',
            value,
            data: codec.pack('pb_equip_refine_one_key_rsp', value)
          };
        });
      }

      if (type === 1005) {
        const request = normalizeRefineRequest(input);
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const roleEquips = readModuleEquips(modules, ROLE_EQUIP_MODULE, codec);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const all = [...roleEquips, ...bagEquips];
          const equip = all.find(item => Number(item.id) === request.equip_id);
          if (!equip) fail(5, 'Equip does not exist');

          const template = tables?.Equip?.get(Number(equip.tid));
          const limit = Number(template?.inscription_limit_lv ?? 0);
          let target = request.target_level;
          if (limit > 0 && target > limit) target = limit;
          if (target < Number(equip.inscription ?? 0)) target = Number(equip.inscription ?? 0);
          equip.inscription = target;

          writeModuleEquips(modules, ROLE_EQUIP_MODULE, codec, roleEquips);
          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const value = {
            equip: cloneEquip(equip),
            res_change: { changes: [], is_overflow: false }
          };
          return {
            schema: 'pb_equip_inscription_rsp',
            value,
            data: codec.pack('pb_equip_inscription_rsp', value)
          };
        });
      }

      if (type === 1006) {
        const requests = input?.wears;
        if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Equip wear list is empty');
        return store.transaction(model => {
          const modules = new Map(model.state.modules.value);
          const roleEquips = readModuleEquips(modules, ROLE_EQUIP_MODULE, codec);
          const bagEquips = readModuleEquips(modules, BAG_EQUIP_MODULE, codec);
          const byId = new Map();
          for (const equip of [...roleEquips, ...bagEquips]) byId.set(String(equip.id), equip);

          const updated = [];
          for (const request of requests) {
            const index = safeNumber(request?.index, 'wear index', { min: 0 });
            const id = safeNumber(request?.id, 'equip id', { min: 0 });
            const tid = safeNumber(request?.tid, 'equip tid', { min: 0 });
            let equip = byId.get(String(id));
            if (!equip) {
              equip = {
                id,
                tid: tid || id,
                level: 1,
                level_exp: 0,
                inscription: 0,
                refine: 0,
                refine_exp: 0,
                random_develop_cost: []
              };
              roleEquips.push(equip);
              byId.set(String(id), equip);
            } else if (tid) {
              equip.tid = tid;
            }
            updated.push(structuredClone(equip));
          }

          writeModuleEquips(modules, ROLE_EQUIP_MODULE, codec, roleEquips);
          writeModuleEquips(modules, BAG_EQUIP_MODULE, codec, bagEquips);
          model.state.modules.value = [...modules];

          const curPre = currentPreLineup(model);
          const value = {
            res_change: { changes: [], is_overflow: false },
            equips: updated,
            change_lineup: [],
            ...(curPre ? { cur_pre_lineup: curPre } : {})
          };
          return {
            schema: 'pb_equip_wear_rsp',
            value,
            data: codec.pack('pb_equip_wear_rsp', value)
          };
        });
      }

      fail(1, 'Unsupported equip command');
    }
  };
}
