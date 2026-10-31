import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

export const FANTASY_EQUIP_MODULE_ID = 518;
export const FANTASY_EQUIP_BLOCK = 0;
export const FANTASY_EQUIP_ITEM_TYPE = 223;
export const FANTASY_EQUIP_TYPE_NORMAL = 1;
export const FANTASY_EQUIP_TYPE_UNIQUE = 2;
export const FANTASY_EQUIP_TYPE_SP_GOD = 3;
export const DEFAULT_FANTASY_EQUIP_CAPACITY = 50000;

const INT32_MAX = 2147483647;
const fail = (code, message) => { throw new GameError(code, message); };
const isPromiseLike = value => Boolean(value && typeof value.then === 'function');

function integer(value, field, { min = 0, max = INT32_MAX } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    fail(5, `Invalid fantasy equipment ${field}`);
  }
  return number;
}

function uniqueIntegers(values, field, { min = 1, max = INT32_MAX } = {}) {
  if (!Array.isArray(values)) fail(5, `Invalid fantasy equipment ${field}`);
  const result = values.map(value => integer(value, field, { min, max }));
  if (new Set(result).size !== result.length) fail(5, `Duplicate fantasy equipment ${field}`);
  return result;
}

function chipIndexes(chipTable, equipTable, itemTable) {
  if (!(chipTable instanceof Map)) return { byPointItem: new Map(), byTid: new Map() };
  const byPointItem = new Map(), byTid = new Map();
  for (const [key, row] of chipTable) {
    if (Number(row?.type) !== FANTASY_EQUIP_ITEM_TYPE) continue;
    const tid = integer(row.tid ?? key, 'chip tid', { min: 1 });
    const pointItem = integer(row.point_item, 'chip point item', { min: 1 });
    const needNum = integer(row.need_num, 'chip required quantity', { min: 1 });
    const chipItem = itemTable.get(tid), targetItem = itemTable.get(pointItem), target = equipTable.get(pointItem);
    if (!chipItem || !targetItem || !target || Number(target.tid) !== pointItem || Number(targetItem.type) !== FANTASY_EQUIP_ITEM_TYPE) {
      fail(5, `Fantasy chip ${tid} has an invalid point_item ${pointItem}`);
    }
    if (byTid.has(tid) || byPointItem.has(pointItem)) {
      fail(5, `Duplicate fantasy chip mapping for tid ${tid} or point_item ${pointItem}`);
    }
    const entry = Object.freeze({ tid, point_item: pointItem, need_num: needNum });
    byTid.set(tid, entry);
    byPointItem.set(pointItem, entry);
  }
  return { byPointItem, byTid };
}

/**
 * Shared authority for the module-518 equipment block. Every mutator changes only
 * the caller-provided transaction model; callers must invoke this inside
 * createGameStore().transaction(model => ...).
 */
export function createFantasyEquipmentInventory({
  codec,
  tables,
  maxEquipCount = DEFAULT_FANTASY_EQUIP_CAPACITY,
  maxRawTypeCount = DEFAULT_FANTASY_EQUIP_CAPACITY
}) {
  const definitions = tables.FantasyEquip, items = tables.Item;
  if (!(definitions instanceof Map) || !(items instanceof Map)) {
    throw new Error('Fantasy equipment configuration is missing');
  }
  const equipCapacity = integer(maxEquipCount, 'capacity');
  const rawTypeCapacity = integer(maxRawTypeCount, 'raw capacity');
  const starUps = tables.FantasyStarUp, spStarUps = tables.FantasySpStarUp, materials = tables.FantasyMaterial;
  if (!(starUps instanceof Map) || !(spStarUps instanceof Map) || !(materials instanceof Map)) {
    throw new Error('Fantasy equipment value configuration is missing');
  }
  const configuredChips = tables.FantasyChipByPointItem instanceof Map && tables.FantasyChipByTid instanceof Map
    ? { byPointItem: tables.FantasyChipByPointItem, byTid: tables.FantasyChipByTid }
    : chipIndexes(tables.Chip, definitions, items);

  function empty() {
    return { equips: [], raw_equips: [], max_equip_id: 0 };
  }

  function definitionFor(tidValue) {
    const tid = integer(tidValue, 'tid', { min: 1 });
    const definition = definitions.get(tid), item = items.get(tid);
    if (!definition || !item) fail(306, 'Unknown fantasy equipment definition');
    if (Number(item.type) !== FANTASY_EQUIP_ITEM_TYPE) fail(5, 'Fantasy equipment item type is not 223');
    if (definition.tid !== undefined && Number(definition.tid) !== tid) fail(5, 'Fantasy equipment definition tid is inconsistent');
    if (item.tid !== undefined && Number(item.tid) !== tid) fail(5, 'Fantasy equipment item tid is inconsistent');
    const type = integer(definition.type, 'type', { min: 1, max: 3 });
    if (tables.FantasyType instanceof Map && !tables.FantasyType.has(type)) fail(5, 'Unknown fantasy equipment type');
    return { tid, definition, item, type };
  }

  function configQuality(info, value, field = 'quality') {
    const base = integer(info.item.quality, 'item quality');
    const quality = integer(value ?? base, field);
    if (info.type === FANTASY_EQUIP_TYPE_SP_GOD) {
      const maximum = Math.max(base, ...spStarUps.keys().map(key => Math.floor(Number(key) / 1000)));
      if (quality < base || quality > maximum) fail(308, 'Fantasy equipment quality is outside its configured progression');
    } else if (quality !== base) {
      fail(5, 'Fantasy equipment quality does not match its item definition');
    }
    return quality;
  }

  function assertStarConfig(info, quality, star) {
    const table = info.type === FANTASY_EQUIP_TYPE_NORMAL ? starUps : spStarUps;
    if (!table.has(quality * 1000 + star)) fail(308, 'Fantasy equipment star configuration is missing');
  }

  function validate(data) {
    if (!data || typeof data !== 'object') fail(5, 'Fantasy equipment inventory is invalid');
    if (!Array.isArray(data.equips) || !Array.isArray(data.raw_equips)) {
      fail(5, 'Fantasy equipment inventory arrays are invalid');
    }
    const uids = new Set();
    let highestUid = 0;
    for (const equip of data.equips) {
      if (!equip || typeof equip !== 'object') fail(5, 'Invalid fantasy equipment row');
      const tid = integer(equip.tid, 'tid', { min: 1 });
      const info = definitionFor(tid);
      const uid = integer(equip.uid, 'uid', { min: 1, max: INT32_MAX });
      const level = integer(equip.level ?? 1, 'level', { min: 1 });
      const star = integer(equip.star ?? 0, 'star');
      const starNode = integer(equip.star_node ?? 0, 'star node');
      const breakLevel = integer(equip.break_level ?? 0, 'break level');
      const quality = configQuality(info, equip.quality);
      const levelExp = integer(equip.level_exp ?? 0, 'level experience');
      if (uids.has(uid)) fail(5, 'Duplicate fantasy equipment uid');
      assertStarConfig(info, quality, star);
      equip.bless = uniqueIntegers(equip.bless ?? [], 'bless uid');
      if (equip.bless.includes(uid)) fail(5, 'Fantasy equipment cannot bless itself');
      Object.assign(equip, { uid, tid, level, star, star_node: starNode, break_level: breakLevel, quality, level_exp: levelExp });
      uids.add(uid);
      highestUid = Math.max(highestUid, uid);
    }

    const blessOwners = new Map();
    for (const equip of data.equips) {
      for (const blessUid of equip.bless) {
        if (!uids.has(blessUid)) fail(5, 'Fantasy equipment blessing references a missing equipment');
        const owner = blessOwners.get(blessUid);
        if (owner !== undefined && owner !== equip.uid) fail(5, 'Fantasy equipment is blessed by multiple equipment instances');
        blessOwners.set(blessUid, equip.uid);
      }
    }

    const rawTids = new Set(), rawRows = [];
    for (const raw of data.raw_equips) {
      if (!raw || typeof raw !== 'object') fail(5, 'Invalid raw fantasy equipment row');
      const tid = integer(raw.tid, 'raw tid', { min: 1 });
      definitionFor(tid);
      const num = integer(raw.num, 'raw quantity', { min: 0 });
      if (rawTids.has(tid)) fail(5, 'Duplicate raw fantasy equipment tid');
      rawTids.add(tid);
      if (num > 0) rawRows.push({ tid, num });
    }
    data.raw_equips = rawRows;
    const maxUid = integer(data.max_equip_id ?? 0, 'maximum uid');
    if (maxUid < highestUid) fail(5, 'Fantasy equipment uid watermark is behind an existing equipment');
    data.max_equip_id = maxUid;
    return data;
  }

  function read(model) {
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(FANTASY_EQUIP_MODULE_ID);
    const module = stored ? structuredClone(stored) : { value: [], improper: false };
    if (!Array.isArray(module.value)) fail(5, 'Fantasy equipment login module is invalid');
    while (module.value.length <= FANTASY_EQUIP_BLOCK) module.value.push(serializedBinary(Buffer.alloc(0)));
    let data;
    try {
      const bytes = rawBinary(module.value[FANTASY_EQUIP_BLOCK]);
      data = bytes.length ? codec.unpack('pb_fantasy_equip_res', bytes) : empty();
    } catch {
      fail(5, 'Fantasy equipment inventory cannot be decoded');
    }
    validate(data);
    modules.set(FANTASY_EQUIP_MODULE_ID, module);
    return { modules, module, data, changes: [] };
  }

  function save(model, current) {
    validate(current.data);
    const encoded = codec.pack('pb_fantasy_equip_res', current.data);
    current.module.value[FANTASY_EQUIP_BLOCK] = serializedBinary(encoded);
    current.modules.set(FANTASY_EQUIP_MODULE_ID, current.module);
    model.state.modules.value = [...current.modules];
    return current.data;
  }

  function note(current, change) {
    current.changes ??= [];
    current.changes.push(structuredClone(change));
  }

  function ensure(model) {
    const current = read(model);
    if (rawBinary(current.module.value[FANTASY_EQUIP_BLOCK]).length) return current.data;
    save(model, current);
    return current.data;
  }

  function find(current, input, { allowMissing = false } = {}) {
    if (!input || typeof input !== 'object') fail(1, 'Fantasy equipment id is missing');
    const uid = integer(input.uid, 'uid', { min: 1 });
    const tid = integer(input.tid, 'tid', { min: 1 });
    const equip = current.data.equips.find(value => value.uid === uid);
    if (!equip) {
      if (allowMissing) return null;
      fail(306, 'Fantasy equipment does not exist');
    }
    if (equip.tid !== tid) fail(306, 'Fantasy equipment tid does not match its uid');
    return equip;
  }

  function findUid(current, uidValue, { allowMissing = false } = {}) {
    const uid = integer(uidValue, 'uid', { min: 1 });
    const equip = current.data.equips.find(entry => entry.uid === uid);
    if (!equip && !allowMissing) fail(306, 'Fantasy equipment does not exist');
    return equip ?? null;
  }

  function insertEquip(current, fields, change) {
    if (current.data.equips.length >= equipCapacity) fail(307, 'Fantasy equipment capacity reached');
    const watermark = integer(current.data.max_equip_id ?? 0, 'maximum uid');
    if (watermark >= INT32_MAX) fail(307, 'Fantasy equipment uid limit reached');
    const uid = watermark + 1;
    const next = {
      ...current.data,
      equips: [...current.data.equips, { ...fields, uid }],
      max_equip_id: uid
    };
    const data = validate(next), equip = data.equips[data.equips.length - 1];
    current.data = data;
    note(current, { ...change, uid: equip.uid, tid: equip.tid, equip: structuredClone(equip) });
    return equip;
  }

  function create(current, tidValue, options = {}) {
    if (!options || typeof options !== 'object') fail(5, 'Invalid fantasy equipment create options');
    const tid = integer(tidValue, 'tid', { min: 1 });
    const info = definitionFor(tid);
    const configuredStar = integer(info.definition.star ?? 0, 'initial star');
    return insertEquip(current, {
      tid,
      level: options.level ?? 1,
      star: options.star ?? configuredStar,
      star_node: options.star_node ?? 0,
      break_level: options.break_level ?? 0,
      quality: Number(info.item.quality),
      bless: options.bless === undefined ? [] : (Array.isArray(options.bless) ? [...options.bless] : options.bless),
      level_exp: options.level_exp ?? 0
    }, { kind: 'create' });
  }

  function remove(current, uidValue) {
    const uid = integer(uidValue, 'uid', { min: 1 });
    const index = current.data.equips.findIndex(equip => equip.uid === uid);
    if (index < 0) fail(306, 'Fantasy equipment does not exist');
    const removed = current.data.equips[index];
    const next = { ...current.data, equips: current.data.equips.filter(equip => equip.uid !== uid) };
    const data = validate(next);
    current.data = data;
    note(current, { kind: 'remove', uid: removed.uid, tid: removed.tid, equip: structuredClone(removed) });
    return structuredClone(removed);
  }

  function clone(current, sourceValue, overrides = {}) {
    if (!overrides || typeof overrides !== 'object') fail(5, 'Invalid fantasy equipment clone options');
    const uid = sourceValue && typeof sourceValue === 'object' ? sourceValue.uid : sourceValue;
    const source = findUid(current, uid);
    const fields = {
      tid: source.tid,
      level: source.level,
      star: source.star,
      star_node: source.star_node,
      break_level: source.break_level,
      quality: source.quality,
      bless: [...source.bless],
      level_exp: source.level_exp,
      ...overrides
    };
    delete fields.uid;
    return insertEquip(current, fields, { kind: 'clone', source_uid: source.uid });
  }

  function addRaw(current, tidValue, amountValue = 1) {
    const tid = integer(tidValue, 'raw tid', { min: 1 });
    definitionFor(tid);
    const amount = integer(amountValue, 'raw quantity', { min: 1 });
    const before = current.data.raw_equips.find(row => row.tid === tid)?.num ?? 0;
    if (before + amount > INT32_MAX) fail(307, 'Raw fantasy equipment limit reached');
    const exists = before > 0;
    if (!exists && current.data.raw_equips.length >= rawTypeCapacity) fail(307, 'Raw fantasy equipment capacity reached');
    const raw = exists
      ? current.data.raw_equips.map(row => row.tid === tid ? { ...row, num: row.num + amount } : row)
      : [...current.data.raw_equips, { tid, num: amount }];
    current.data = validate({ ...current.data, raw_equips: raw });
    const after = before + amount;
    note(current, { kind: 'raw_add', tid, before_num: before, after_num: after, diff_num: amount });
    return { tid, num: after, before_num: before, diff_num: amount };
  }

  function consumeRaw(current, tidValue, amountValue) {
    const tid = integer(tidValue, 'raw tid', { min: 1 });
    definitionFor(tid);
    const amount = integer(amountValue, 'raw quantity', { min: 1 });
    const row = current.data.raw_equips.find(value => value.tid === tid);
    if (!row || row.num < amount) fail(301, 'Insufficient raw fantasy equipment');
    const before = row.num, after = before - amount;
    const raw = after === 0
      ? current.data.raw_equips.filter(value => value.tid !== tid)
      : current.data.raw_equips.map(value => value.tid === tid ? { ...value, num: after } : value);
    current.data = validate({ ...current.data, raw_equips: raw });
    note(current, { kind: 'raw_consume', tid, before_num: before, after_num: after, diff_num: -amount, removed: after === 0 });
    return { tid, num: after, before_num: before, diff_num: -amount, removed: after === 0 };
  }

  function rawQuantity(current, tidValue) {
    const tid = integer(tidValue, 'raw tid', { min: 1 });
    definitionFor(tid);
    return current.data.raw_equips.find(row => row.tid === tid)?.num ?? 0;
  }

  function snapshot(current) {
    return structuredClone(current.data);
  }

  /** Read, mutate, validate and save inside the caller's existing transaction. */
  function mutate(model, mutation) {
    if (typeof mutation !== 'function') fail(5, 'Fantasy equipment mutation must be a function');
    const current = read(model), before = snapshot(current);
    const result = mutation(current.data, current);
    if (isPromiseLike(result)) fail(5, 'Fantasy equipment mutations must be synchronous');
    save(model, current);
    return { result, before, after: snapshot(current), changes: structuredClone(current.changes) };
  }

  function itemValue(tidValue) {
    const { item } = definitionFor(tidValue);
    const value = Number(item.cost_price ?? item.value ?? 0);
    if (!Number.isFinite(value)) fail(5, 'Fantasy equipment item value is invalid');
    return value;
  }

  function materialExp(tidValue) {
    const tid = integer(tidValue, 'material tid', { min: 1 });
    const row = materials.get(tid);
    if (!row || !items.has(tid)) fail(306, 'Unknown fantasy equipment material');
    return integer(row.exp, 'material experience');
  }

  function equipValueInfo(value, starValue) {
    const object = value && typeof value === 'object' ? value : null;
    const info = definitionFor(object ? object.tid : value);
    const quality = configQuality(info, object?.quality);
    const star = integer(starValue ?? object?.star ?? 0, 'star');
    return { info, quality, star };
  }

  function starUpConfig(equipOrTid, starValue) {
    const { quality, star } = equipValueInfo(equipOrTid, starValue);
    const row = starUps.get(quality * 1000 + star);
    if (!row) fail(308, 'Fantasy equipment star configuration is missing');
    return row;
  }

  function spStarUpConfig(equipOrTid, starValue) {
    const { info, quality, star } = equipValueInfo(equipOrTid, starValue);
    if (info.type === FANTASY_EQUIP_TYPE_NORMAL) fail(308, 'Normal fantasy equipment cannot use the SP star table');
    const row = spStarUps.get(quality * 1000 + star);
    if (!row) fail(308, 'Fantasy equipment SP star configuration is missing');
    return row;
  }

  function starUpConfigFor(equipOrTid, starValue) {
    const { info } = equipValueInfo(equipOrTid, starValue);
    return info.type === FANTASY_EQUIP_TYPE_NORMAL
      ? starUpConfig(equipOrTid, starValue)
      : spStarUpConfig(equipOrTid, starValue);
  }

  /** Client FantasyEquip:GetValue: unique and SP equipment have value 0. */
  function equipmentMaterialValue(equipOrTid, starValue) {
    const { info } = equipValueInfo(equipOrTid, starValue);
    if (info.type !== FANTASY_EQUIP_TYPE_NORMAL) return 0;
    return integer(starUpConfig(equipOrTid, starValue).value, 'material value');
  }

  function rawMaterialValue(tidValue) {
    return equipmentMaterialValue({ tid: integer(tidValue, 'raw tid', { min: 1 }) }, 0);
  }

  function materialRequirement(equipOrTid) {
    const { info } = equipValueInfo(equipOrTid);
    if (info.type !== FANTASY_EQUIP_TYPE_NORMAL) fail(308, 'Only normal fantasy equipment has a normal star-up material requirement');
    const config = starUpConfig(equipOrTid);
    const tier = starUps.get(integer(config.need_mat, 'material tier', { min: 1 }));
    if (!tier) fail(308, 'Fantasy equipment star material tier is missing');
    const count = integer(config.need_cost ?? 0, 'material count');
    const unitValue = integer(tier.value, 'material unit value', { min: 1 });
    const totalValue = count * unitValue;
    if (!Number.isSafeInteger(totalValue)) fail(307, 'Fantasy equipment material value overflow');
    return { config, tier, count, unit_value: unitValue, total_value: totalValue };
  }

  function chipRequirement(tidValue) {
    const { tid } = definitionFor(tidValue);
    const row = configuredChips.byPointItem.get(tid);
    return row ? { ...row } : null;
  }

  function chipRequirementByTid(tidValue) {
    const tid = integer(tidValue, 'chip tid', { min: 1 });
    const row = configuredChips.byTid.get(tid);
    if (!row) fail(306, 'Unknown fantasy equipment chip');
    return { ...row };
  }

  function referenceDetails(model, current, uidValue) {
    const uid = integer(uidValue, 'uid', { min: 1 });
    const result = [];
    for (const equip of current.data.equips) {
      if (equip.bless.includes(uid)) result.push({ kind: 'bless', uid: equip.uid });
    }
    for (const hero of model?.heroInfo?.hero_list ?? []) {
      if (Number(hero.fantasy_equip ?? 0) === uid) result.push({ kind: 'hero', uid: Number(hero.uid), tid: Number(hero.tid) });
    }
    const module = new Map(model?.state?.modules?.value ?? []).get(FANTASY_EQUIP_MODULE_ID);
    if (module?.value?.length > 1) {
      const bytes = rawBinary(module.value[1]);
      if (bytes.length) {
        let formation;
        try { formation = codec.unpack('pb_fantasy_formation_list', bytes); } catch { fail(5, 'Fantasy formation list cannot be decoded'); }
        for (const slot of formation.formation_list ?? []) {
          if (Number(slot.uid) === uid) result.push({ kind: 'formation', uid, slot_index: Number(slot.slot_index) });
        }
      }
    }
    return result;
  }

  function assertCanRemove(model, current, uidValue, extraReferences = []) {
    const uid = integer(uidValue, 'uid', { min: 1 });
    const references = referenceDetails(model, current, uid);
    for (const reference of extraReferences) {
      const referenceUid = Number(reference?.uid ?? reference);
      if (referenceUid === uid) references.push(reference && typeof reference === 'object' ? { ...reference } : { kind: 'extra', uid });
    }
    if (references.length) fail(308, 'Fantasy equipment is still referenced');
    return true;
  }

  const materialValues = Object.freeze({
    itemValue,
    materialExp,
    equipmentMaterialValue,
    rawMaterialValue,
    materialRequirement,
    chipRequirement,
    chipRequirementByTid,
    starUpConfig,
    spStarUpConfig,
    starUpConfigFor
  });

  return {
    read, save, ensure, validate, empty, find, findUid, create, remove, clone, copy: clone,
    addRaw, consumeRaw, rawQuantity, snapshot, mutate, withSnapshot: mutate,
    assertCanRemove, referenceDetails,
    itemValue, materialExp, equipmentMaterialValue, materialValue: equipmentMaterialValue,
    rawMaterialValue, materialRequirement, chipRequirement, chipForEquip: chipRequirement,
    chipRequirementByTid, starUpConfig, spStarUpConfig, starUpConfigFor, materialValues,
    isUnique: equip => {
      const { type, definition } = definitionFor(equip?.tid);
      return type === FANTASY_EQUIP_TYPE_UNIQUE && integer(definition.hero, 'unique hero', { min: 1 }) > 0;
    },
    isSpGod: equip => definitionFor(equip?.tid).type === FANTASY_EQUIP_TYPE_SP_GOD
  };
}
