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

export function createEquipService({ store, codec, tables = readEquipTables() }) {
  return {
    supports: type => type === 1001 || type === 1002 || type === 1006,
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
