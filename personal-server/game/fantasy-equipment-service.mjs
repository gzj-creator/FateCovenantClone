import { encodeEtfInteger } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';
import {
  createFantasyEquipmentInventory,
  FANTASY_EQUIP_MODULE_ID,
  FANTASY_EQUIP_TYPE_NORMAL,
  FANTASY_EQUIP_TYPE_SP_GOD,
  FANTASY_EQUIP_TYPE_UNIQUE
} from './fantasy-equipment-inventory.mjs';

const FORMATION_BLOCK = 1;
const CUSTOM_LINEUP_ATTR = 4;
const INT32_MAX = 2147483647;
const NORMAL_OVERFLOW_TID = 1100119;
const SUPPORTED = new Set([
  87601, 87603, 87604, 87605, 87606, 87607, 87608, 87609,
  87610, 87611, 87613, 87614, 87615, 87616
]);
const fail = (code, message) => { throw new GameError(code, message); };

function safeInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, 'Invalid ' + field);
  return number;
}

function resourceResponse(...groups) {
  return { changes: groups.flatMap(group => group?.changes ?? []), is_overflow: false };
}

function addCost(map, tidValue, amountValue) {
  const amount = safeInteger(amountValue, 'cost quantity', { min: 0, max: INT32_MAX });
  if (!amount) return;
  const tid = safeInteger(tidValue, 'cost tid', { min: 1, max: INT32_MAX });
  map.set(tid, (map.get(tid) ?? 0) + amount);
}

function costMapFromRequest(rows) {
  if (!Array.isArray(rows)) fail(1, 'Invalid cost list');
  const result = new Map();
  for (const row of rows) {
    const tid = safeInteger(row?.tid, 'cost tid', { min: 1, max: INT32_MAX });
    const num = safeInteger(row?.num, 'cost quantity', { min: 0, max: INT32_MAX });
    if (result.has(tid)) fail(1, 'Duplicate cost type');
    if (num) result.set(tid, num);
  }
  return result;
}

function sameCosts(provided, expected) {
  if (provided.size !== expected.size) return false;
  for (const [tid, num] of expected) if (provided.get(tid) !== num) return false;
  return true;
}

export function createFantasyEquipmentService({
  store,
  codec,
  tables,
  extraReferences = () => []
}) {
  const inventory = createFantasyEquipmentInventory({ codec, tables });
  const required = [
    'FantasyEquip', 'FantasyEquipConst', 'FantasyBreakUp', 'FantasyLevelUp',
    'FantasyMaterial', 'FantasyStarUp', 'FantasySpStarUp', 'FantasyQualityUp',
    'FantasyType', 'FantasyMaxStar', 'FantasyStarStoneTid', 'Item'
  ];
  for (const name of required) {
    if (!(tables[name] instanceof Map)) throw new Error('Fantasy equipment configuration is missing: ' + name);
  }

  const config = tables.FantasyEquipConst.get(1);
  if (!config) throw new Error('Fantasy equipment constants are missing');
  const openQuality = safeInteger(config.open_quality ?? 30, 'open quality');
  const minBlessQuality = safeInteger(config.min_bless_quality ?? 50, 'minimum blessing quality');
  const blessCount = safeInteger(config.bless_count ?? 2, 'blessing count', { min: 1, max: 2 });
  const blessUnlocks = [...(config.bless_slot_unlock ?? [])]
    .map(value => safeInteger(value, 'blessing unlock star'))
    .sort((left, right) => left - right);
  if (blessUnlocks.length !== blessCount) fail(5, 'Fantasy blessing slot configuration is invalid');

  function definition(equipOrTid) {
    const tid = safeInteger(
      equipOrTid && typeof equipOrTid === 'object' ? equipOrTid.tid : equipOrTid,
      'equipment tid',
      { min: 1, max: INT32_MAX }
    );
    const value = tables.FantasyEquip.get(tid);
    if (!value || !tables.Item.has(tid)) fail(306, 'Fantasy equipment definition is missing');
    return value;
  }

  function typeOf(equipOrTid) {
    return safeInteger(definition(equipOrTid).type, 'equipment type', { min: 1, max: 3 });
  }

  function getHero(model, heroTidValue) {
    const heroTid = safeInteger(heroTidValue, 'hero tid', { min: 1 });
    const hero = model.heroInfo.hero_list.find(value => Number(value.tid) === heroTid);
    if (!hero) fail(1, 'Hero does not exist');
    return hero;
  }

  function heroByEquipUid(model, uid) {
    return model.heroInfo.hero_list.find(hero => Number(hero.fantasy_equip ?? 0) === Number(uid)) ?? null;
  }

  function blessOwner(current, uid) {
    return current.data.equips.find(equip => equip.uid !== Number(uid) && equip.bless.includes(Number(uid))) ?? null;
  }

  function customLineupReferences(model, uidValue) {
    const uid = Number(uidValue);
    const references = [];
    for (const lineup of model.playLineups ?? []) {
      const attr = (lineup.custom_attr ?? []).find(value => Number(value.type) === CUSTOM_LINEUP_ATTR);
      if (!attr?.value) continue;
      let data;
      try {
        data = codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64'));
      } catch {
        fail(5, 'Custom fantasy lineup data is invalid');
      }
      for (const row of data.fantasy_list ?? []) {
        if (Number(row.fantasy_uid) === uid || (row.bless_fantasy ?? []).some(value => Number(value) === uid)) {
          references.push({ kind: 'custom_lineup', lineup_type: Number(lineup.type), hero_tid: Number(row.hero_tid) });
        }
      }
    }
    return references;
  }

  function activityReferences(model, uid) {
    const values = extraReferences(model, uid);
    if (values == null) return [];
    if (!Array.isArray(values)) fail(5, 'Fantasy equipment extra-reference provider is invalid');
    return values;
  }

  function assertUnusedMaterial(model, current, equip, mainUid) {
    if (Number(equip.uid) === Number(mainUid)) fail(308, 'Main fantasy equipment cannot be its own material');
    if ((equip.bless ?? []).length) fail(308, 'A blessing host cannot be consumed as material');
    inventory.assertCanRemove(model, current, equip.uid, [
      ...customLineupReferences(model, equip.uid),
      ...activityReferences(model, equip.uid)
    ]);
  }

  function checkWearable(model, equip, hero) {
    const cfg = definition(equip);
    const type = safeInteger(cfg.type, 'equipment type', { min: 1, max: 3 });
    if (!tables.FantasyType.get(type)?.is_in_formation) fail(308, 'This fantasy equipment cannot enter formation');
    if (Number(equip.quality) < openQuality) fail(305, 'Fantasy equipment quality is locked');
    if (Number(cfg.hero) > 0 && Number(cfg.hero) !== Number(hero.tid)) {
      fail(308, 'Fantasy equipment does not match this hero');
    }
    const references = activityReferences(model, equip.uid);
    if (references.length) fail(308, 'Fantasy equipment is already held by an activity trial');
    return cfg;
  }

  function openFormation(current) {
    while (current.module.value.length <= FORMATION_BLOCK) current.module.value.push({ value: [], improper: false });
    let data;
    try {
      const serialized = current.module.value[FORMATION_BLOCK];
      const bytes = Buffer.from(serialized?.value?.data ?? serialized?.value ?? []);
      data = bytes.length ? codec.unpack('pb_fantasy_formation_list', bytes) : { formation_list: [] };
    } catch {
      fail(5, 'Fantasy formation list cannot be decoded');
    }
    data.formation_list ??= [];
    if (!Array.isArray(data.formation_list) || data.formation_list.length > 500) {
      fail(5, 'Fantasy formation list is invalid');
    }
    const uids = new Set(), slots = new Set();
    for (const row of data.formation_list) {
      row.uid = safeInteger(row.uid, 'formation uid', { min: 1, max: INT32_MAX });
      row.slot_index = safeInteger(row.slot_index, 'formation slot');
      if (uids.has(row.uid) || slots.has(row.slot_index)) fail(5, 'Fantasy formation list contains duplicates');
      if (!inventory.findUid(current, row.uid, { allowMissing: true })) {
        fail(5, 'Fantasy formation references a missing equipment');
      }
      uids.add(row.uid);
      slots.add(row.slot_index);
    }
    return data;
  }

  function saveFormation(current, formation) {
    const encoded = codec.pack('pb_fantasy_formation_list', formation);
    current.module.value[FORMATION_BLOCK] = { value: Buffer.from(encoded).toJSON(), bits: 8 };
  }

  function formationSlot(model, hero) {
    for (const lineup of [model.lineups, ...(model.playLineups ?? [])]) {
      for (const team of lineup?.team_list ?? []) {
        for (const fighter of team.fighter_list ?? []) {
          if (Number(fighter.hero_id) === Number(hero.uid) || Number(fighter.hero_id) === Number(hero.tid)) {
            return safeInteger(fighter.index ?? fighter.loc ?? 1, 'formation slot');
          }
        }
      }
    }
    return 1;
  }

  function removeFromCustomLineups(model, uid) {
    for (const lineup of model.playLineups ?? []) {
      const attr = (lineup.custom_attr ?? []).find(value => Number(value.type) === CUSTOM_LINEUP_ATTR);
      if (!attr?.value) continue;
      let data;
      try {
        data = codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64'));
      } catch {
        fail(5, 'Custom fantasy lineup data is invalid');
      }
      const next = (data.fantasy_list ?? []).filter(row =>
        Number(row.fantasy_uid) !== Number(uid) &&
        !(row.bless_fantasy ?? []).some(value => Number(value) === Number(uid))
      );
      if (next.length === (data.fantasy_list ?? []).length) continue;
      if (next.length) {
        attr.value = codec.pack('pb_lineup_custom_fantasy_info', { fantasy_list: next }).toString('base64');
      } else {
        lineup.custom_attr = lineup.custom_attr.filter(value => value !== attr);
      }
    }
  }

  function putFormation(current, model, hero, equip) {
    const formation = openFormation(current);
    formation.formation_list = formation.formation_list.filter(row => row.uid !== equip.uid);
    const slot = formationSlot(model, hero);
    const occupied = formation.formation_list.find(row => row.slot_index === slot);
    if (occupied) {
      occupied.slot_index = Math.max(-1, ...formation.formation_list.map(row => row.slot_index)) + 1;
    }
    formation.formation_list.push({ uid: equip.uid, slot_index: slot });
    saveFormation(current, formation);
  }

  function detach(current, model, hero) {
    const uid = Number(hero.fantasy_equip ?? 0);
    if (!uid) return null;
    hero.fantasy_equip = 0;
    hero.fantasy_tid = 0;
    const formation = openFormation(current);
    formation.formation_list = formation.formation_list.filter(row => Number(row.uid) !== uid);
    saveFormation(current, formation);
    removeFromCustomLineups(model, uid);
    return inventory.findUid(current, uid, { allowMissing: true });
  }

  function putOn(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const hero = getHero(model, input?.hero_tid);
      const equip = inventory.find(current, input?.equip);
      checkWearable(model, equip, hero);
      const oldUid = Number(hero.fantasy_equip ?? 0);
      if (oldUid === equip.uid) {
        putFormation(current, model, hero, equip);
        inventory.save(model, current);
        const value = { changed_hero: [], put_on_equip: equip };
        return { value, data: codec.pack('pb_fantasy_equip_put_on_rsp', value) };
      }

      const changed = [];
      const previousWearer = heroByEquipUid(model, equip.uid);
      if (previousWearer) {
        previousWearer.fantasy_equip = 0;
        previousWearer.fantasy_tid = 0;
        changed.push(previousWearer);
      }
      const takeOffEquip = detach(current, model, hero);
      hero.fantasy_equip = equip.uid;
      hero.fantasy_tid = equip.tid;
      changed.push(hero);
      putFormation(current, model, hero, equip);
      inventory.save(model, current);
      const value = { changed_hero: changed, put_on_equip: equip, change_lineup: [] };
      if (takeOffEquip) value.take_off_equip = takeOffEquip;
      return { value, data: codec.pack('pb_fantasy_equip_put_on_rsp', value) };
    });
  }

  function takeOff(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const hero = getHero(model, input?.hero_tid);
      const equip = detach(current, model, hero);
      inventory.save(model, current);
      const value = { hero, changed_equip: equip ? [equip] : [] };
      return { value, data: codec.pack('pb_fantasy_equip_take_off_rsp', value) };
    });
  }

  function breakKey(quality) {
    return new Map([[30, 13000], [40, 14000], [50, 15000], [60, 25000], [70, 36000], [80, 37000]])
      .get(Number(quality));
  }

  function breakUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input);
      const base = breakKey(equip.quality);
      if (base === undefined) fail(308, 'Fantasy equipment quality cannot be broken through');
      const row = tables.FantasyBreakUp.get(base + Number(equip.break_level));
      if (!row) fail(308, 'Fantasy equipment breakthrough is already at its limit');
      if (Number(equip.level) < Number(row.up_level_limit ?? 0)) {
        fail(308, 'Fantasy equipment level is too low for breakthrough');
      }
      const costType = safeInteger(row.cost_type ?? 0, 'breakthrough cost tid');
      const costNum = safeInteger(row.cost_num ?? 0, 'breakthrough cost quantity');
      const spent = costNum > 0 ? consumeResources(model, [[costType, costNum]], 301) : { changes: [] };
      equip.break_level += 1;
      inventory.save(model, current);
      const value = { res: resourceResponse(spent), new_equip: equip };
      return { value, data: codec.pack('pb_fantasy_equip_dev_rsp', value) };
    });
  }

  function levelRow(equip, level) {
    const type = typeOf(equip);
    return tables.FantasyLevelUp.get(type * 100000 + Number(equip.quality) * 1000 + Number(level));
  }

  function starRow(equip, star = equip.star) {
    const table = typeOf(equip) === FANTASY_EQUIP_TYPE_NORMAL
      ? tables.FantasyStarUp
      : tables.FantasySpStarUp;
    return table.get(Number(equip.quality) * 1000 + Number(star));
  }

  function maxLevel(equip) {
    const row = starRow(equip);
    if (!row) fail(5, 'Fantasy equipment level limit configuration is missing');
    return safeInteger(row.max_lv, 'maximum level', { min: 1 });
  }

  function parseExpCosts(items) {
    if (!Array.isArray(items) || !items.length || items.length > 100) {
      fail(1, 'No fantasy equipment experience materials were supplied');
    }
    const seen = new Set(), costs = [];
    let total = 0n;
    for (const item of items) {
      const tid = safeInteger(item?.tid, 'material tid', { min: 1, max: INT32_MAX });
      const num = safeInteger(item?.num, 'material quantity', { min: 1, max: INT32_MAX });
      if (seen.has(tid)) fail(1, 'Duplicate fantasy equipment experience material');
      if (!tables.FantasyMaterial.has(tid) || !tables.Item.has(tid)) {
        fail(1, 'Invalid fantasy equipment experience material');
      }
      seen.add(tid);
      total += BigInt(num);
      if (total > 1000000n) fail(1, 'Fantasy equipment experience input is too large');
      costs.push([tid, num]);
    }
    return costs;
  }

  function levelUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.id);
      const costs = parseExpCosts(input?.costs);
      const limit = maxLevel(equip);
      if (Number(equip.level) >= limit) fail(308, 'Fantasy equipment is already at its level limit');
      let addExp = 0n;
      for (const [tid, num] of costs) {
        addExp += BigInt(safeInteger(tables.FantasyMaterial.get(tid).exp, 'material experience')) * BigInt(num);
      }
      const spent = consumeResources(model, costs, 301);
      let remaining = BigInt(equip.level_exp ?? 0) + addExp;
      while (Number(equip.level) < limit) {
        const next = levelRow(equip, Number(equip.level) + 1);
        if (!next) fail(5, 'Fantasy equipment level configuration is missing');
        const need = BigInt(safeInteger(next.need_exp ?? 0, 'level experience requirement'));
        if (remaining < need) break;
        remaining -= need;
        equip.level += 1;
      }
      equip.level_exp = Number(remaining > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : remaining);
      inventory.save(model, current);
      const value = { res: resourceResponse(spent), new_equip: equip };
      return { value, data: codec.pack('pb_fantasy_equip_level_up_rsp', value) };
    });
  }

  function consumeNormalMaterials(model, current, request, requiredValue, mainUid) {
    const materialRows = request?.materials ?? [];
    const rawRows = request?.raw_materials ?? [];
    if (!Array.isArray(materialRows) || !Array.isArray(rawRows) || materialRows.length + rawRows.length > 500) {
      fail(1, 'Invalid fantasy equipment materials');
    }
    const chosen = [], raw = new Map(), seen = new Set();
    let submittedValue = 0;

    for (const item of materialRows) {
      const equip = inventory.find(current, item);
      if (typeOf(equip) !== FANTASY_EQUIP_TYPE_NORMAL) fail(308, 'Only ordinary fantasy equipment can be material');
      if (seen.has(equip.uid)) fail(1, 'Duplicate fantasy equipment material');
      assertUnusedMaterial(model, current, equip, mainUid);
      const value = safeInteger(inventory.equipmentMaterialValue(equip), 'equipment material value');
      if (!value) fail(5, 'Fantasy equipment material value is missing');
      seen.add(equip.uid);
      chosen.push(equip.uid);
      submittedValue += value;
    }

    for (const item of rawRows) {
      const tid = safeInteger(item?.tid, 'raw material tid', { min: 1, max: INT32_MAX });
      const num = safeInteger(item?.num, 'raw material quantity', { min: 1, max: INT32_MAX });
      if (raw.has(tid)) fail(1, 'Duplicate raw fantasy equipment material');
      if (typeOf(tid) !== FANTASY_EQUIP_TYPE_NORMAL) fail(308, 'Only ordinary fantasy equipment can be material');
      const available = inventory.rawQuantity(current, tid);
      if (available < num) fail(301, 'Insufficient raw fantasy equipment material');
      const unit = safeInteger(inventory.rawMaterialValue(tid), 'raw material value');
      if (!unit) fail(5, 'Raw fantasy equipment material value is missing');
      submittedValue += unit * num;
      if (!Number.isSafeInteger(submittedValue)) fail(307, 'Fantasy equipment material value overflow');
      raw.set(tid, num);
    }

    if (requiredValue === 0) {
      if (submittedValue !== 0) fail(1, 'A free star-up must not consume materials');
    } else if (submittedValue < requiredValue) {
      fail(301, 'Insufficient fantasy equipment material value');
    }

    for (const uid of chosen) inventory.remove(current, uid);
    for (const [tid, num] of raw) inventory.consumeRaw(current, tid, num);

    const over = submittedValue - requiredValue;
    if (over > 0) {
      if (over > INT32_MAX) fail(307, 'Fantasy equipment overflow value is too large');
      inventory.addRaw(current, NORMAL_OVERFLOW_TID, over);
    }
    return over;
  }

  function putFormationIfWorn(model, current, equip) {
    const owner = heroByEquipUid(model, equip.uid);
    if (!owner) return;
    owner.fantasy_tid = equip.tid;
    const formation = openFormation(current);
    if (!formation.formation_list.some(row => Number(row.uid) === equip.uid)) {
      formation.formation_list.push({ uid: equip.uid, slot_index: formationSlot(model, owner) });
      saveFormation(current, formation);
    }
  }

  function starUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.id);
      if (typeOf(equip) !== FANTASY_EQUIP_TYPE_NORMAL) {
        fail(1, 'Unique and SP fantasy equipment must use command 87608');
      }
      const row = starRow(equip);
      if (!row || row.is_max_star) fail(308, 'Fantasy equipment requires a quality upgrade before further star-up');
      const requirement = inventory.materialRequirement(equip);
      const over = consumeNormalMaterials(model, current, input, requirement.total_value, equip.uid);
      equip.star += 1;
      equip.star_node = 0;
      putFormationIfWorn(model, current, equip);
      inventory.save(model, current);
      const value = { res: { changes: [], is_overflow: false }, new_equip: equip, changed_hero: [], over_value: over };
      return { value, data: codec.pack('pb_fantasy_equip_composite_rsp', value) };
    });
  }

  function qualityUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.id);
      if (typeOf(equip) !== FANTASY_EQUIP_TYPE_NORMAL) {
        fail(308, 'Only ordinary fantasy equipment uses quality-up command 87609');
      }
      const row = starRow(equip);
      if (!row?.is_max_star) fail(308, 'Fantasy equipment is not at its maximum star');
      const quality = tables.FantasyQualityUp.get(Number(equip.tid));
      const nextTid = safeInteger(quality?.next_quality_item, 'next quality equipment tid', { min: 1, max: INT32_MAX });
      const nextItem = tables.Item.get(nextTid);
      if (!nextItem || !tables.FantasyEquip.has(nextTid)) fail(5, 'Next fantasy equipment definition is missing');
      const requirement = inventory.materialRequirement(equip);
      const over = consumeNormalMaterials(model, current, input, requirement.total_value, equip.uid);
      equip.tid = nextTid;
      equip.quality = safeInteger(nextItem.quality, 'next equipment quality', { min: 1 });
      equip.star = 0;
      equip.star_node = 0;
      putFormationIfWorn(model, current, equip);
      inventory.save(model, current);
      const value = { res: { changes: [], is_overflow: false }, new_equip: equip, changed_hero: [], over_value: over };
      return { value, data: codec.pack('pb_fantasy_equip_composite_rsp', value) };
    });
  }

  function spStepCost(equip, row, nodeCount = 1) {
    const costs = new Map();
    const equipType = typeOf(equip);
    const isSp = equipType === FANTASY_EQUIP_TYPE_SP_GOD;
    const chip = inventory.chipRequirement(equip.tid);
    if (!chip) fail(5, 'Fantasy equipment star-up chip is missing');
    const chipCount = Number(isSp ? row.ur_cost_num : row.cost_num) * nodeCount;
    addCost(costs, chip.tid, chipCount);
    if (isSp) {
      addCost(costs, row.sp_god_stone_tid, Number(row.sp_god_stone_num ?? 0) * nodeCount);
      return costs;
    }

    const stoneCount = Number(row.stone_num ?? 0) * nodeCount;
    const cfg = definition(equip);
    const camp = (cfg.hero > 0 ? tables.Hero?.get(Number(cfg.hero))?.camp : undefined) ?? cfg.profession;
    const campStones = [...(tables.FantasyStarStoneTid.get(Number(camp))?.item ?? [])]
      .map(tid => safeInteger(tid, 'camp star stone tid', { min: 1, max: INT32_MAX }));
    for (const tid of campStones) addCost(costs, tid, stoneCount);
    // FantasyEquipMgr:GetStarUpCost uses the camp stone set when available and
    // appends row.stone_tid only when that set does not already contain it.
    if (!campStones.includes(Number(row.stone_tid))) addCost(costs, row.stone_tid, stoneCount);
    return costs;
  }

  function advanceSp(equip, requestedTimes) {
    const times = requestedTimes === 0 ? 1 : requestedTimes;
    safeInteger(times, 'star-up times', { min: 1, max: 100 });
    const costs = new Map();
    let star = Number(equip.star), node = Number(equip.star_node ?? 0), advanced = 0;
    while (advanced < times) {
      const row = tables.FantasySpStarUp.get(Number(equip.quality) * 1000 + star);
      if (!row || (row.is_max_star && Number(row.node_num ?? 0) === 0)) {
        fail(308, 'Fantasy equipment is already at its maximum star');
      }
      const nodeMax = Math.max(1, safeInteger(row.node_num ?? 1, 'star node count', { min: 1 }));
      if (node >= nodeMax) fail(308, 'Fantasy equipment is already at its maximum star');
      const remaining = nodeMax - node;
      const step = Math.min(times - advanced, remaining);
      for (const [tid, num] of spStepCost(equip, row, step)) {
        costs.set(tid, (costs.get(tid) ?? 0) + num);
      }
      node += step;
      advanced += step;
      if (node >= nodeMax) {
        if (row.is_max_star && !tables.FantasySpStarUp.has(Number(equip.quality) * 1000 + star + 1)) {
          if (advanced < times) fail(308, 'Fantasy equipment is already at its maximum star');
          break;
        }
        star += 1;
        node = 0;
      }
    }
    return { times: advanced, star, node, costs: [...costs] };
  }

  function validateAwakeningCostList(rows, expected) {
    const provided = costMapFromRequest(rows ?? []);
    if (provided.size && !sameCosts(provided, new Map(expected))) {
      fail(1, 'Client awakening cost does not match the server rule');
    }
  }

  function spStarUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.id ?? input?.equip);
      if (typeOf(equip) === FANTASY_EQUIP_TYPE_NORMAL) {
        fail(1, 'Ordinary fantasy equipment must use ordinary star-up');
      }
      if (input?.args !== undefined && (!Array.isArray(input.args) || input.args.length)) {
        fail(1, 'Invalid star-up arguments');
      }
      const times = safeInteger(input?.times ?? 0, 'star-up times', { min: 0, max: 100 });
      const plan = advanceSp(equip, times);
      const spent = consumeResources(model, plan.costs, 301);
      equip.star = plan.star;
      equip.star_node = plan.node;
      inventory.save(model, current);
      const value = { res: resourceResponse(spent), new_equip: equip };
      return { value, data: codec.pack('pb_fantasy_equip_dev_rsp', value) };
    });
  }

  function spQualityUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.equip);
      if (typeOf(equip) !== FANTASY_EQUIP_TYPE_SP_GOD) fail(308, 'Only SP fantasy equipment can raise SP quality');
      if (Number(equip.quality) !== 60) fail(308, 'Fantasy equipment is not ready for SP quality-up');
      const currentRow = tables.FantasySpStarUp.get(60010);
      if (!currentRow?.is_max_star) fail(5, 'SP quality-up configuration is missing');
      if (Number(equip.star) !== 10 || Number(equip.star_node ?? 0) !== 0) {
        fail(308, 'Fantasy equipment star must reach the q60 limit before quality-up');
      }
      const targetRow = tables.FantasySpStarUp.get(70005);
      if (!targetRow) fail(5, 'Next SP quality star configuration is missing');
      const preview = { ...equip, quality: 70, star: 5, star_node: 0 };
      const expected = spStepCost(preview, targetRow, 1);
      validateAwakeningCostList(input?.cost_list, [...expected]);
      const spent = consumeResources(model, [...expected], 301);
      equip.quality = 70;
      equip.star = 5;
      equip.star_node = 0;
      putFormationIfWorn(model, current, equip);
      inventory.save(model, current);
      const value = { res: resourceResponse(spent), new_equip: equip };
      return { value, data: codec.pack('pb_fantasy_equip_dev_rsp', value) };
    });
  }

  function urStarUp(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const equip = inventory.find(current, input?.equip);
      if (typeOf(equip) !== FANTASY_EQUIP_TYPE_SP_GOD || Number(equip.quality) < 70) {
        fail(308, 'Only q70 SP fantasy equipment uses UR star-up');
      }
      const plan = advanceSp(equip, 1);
      validateAwakeningCostList(input?.cost_list, plan.costs);
      const spent = consumeResources(model, plan.costs, 301);
      equip.star = plan.star;
      equip.star_node = plan.node;
      inventory.save(model, current);
      const value = { res: resourceResponse(spent), new_equip: equip };
      return { value, data: codec.pack('pb_fantasy_equip_dev_rsp', value) };
    });
  }

  function createBlessCandidate(model, current, material) {
    if (!material?.composite_req) return inventory.find(current, material?.equip);
    if (material.equip?.uid || material.equip?.tid) fail(1, 'Composed blessing material must not contain an existing equipment id');
    const request = material.composite_req;
    const targetTid = safeInteger(config.bless_composition_fantasy_equip, 'blessing composition tid', { min: 1, max: INT32_MAX });
    const providedTid = safeInteger(request?.tid, 'blessing composition tid', { min: 1, max: INT32_MAX });
    if (providedTid !== targetTid) fail(1, 'Blessing composition target does not match the server rule');
    const targetItem = tables.Item.get(targetTid);
    const targetQuality = safeInteger(request?.target_quality, 'target quality');
    const targetStar = safeInteger(request?.target_star ?? 0, 'target star');
    if (!targetItem || targetQuality !== Number(targetItem.quality) || targetStar !== 0) {
      fail(1, 'Blessing composition quality or star is forged');
    }
    const requirement = inventory.materialRequirement({ tid: targetTid, quality: targetQuality, star: targetStar });
    const over = consumeNormalMaterials(model, current, request, requirement.total_value, 0);
    return { equip: inventory.create(current, targetTid), over };
  }

  function bless(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const main = inventory.find(current, input?.equip);
      if (Number(main.quality) < minBlessQuality) fail(308, 'Fantasy equipment quality cannot be blessed');
      const unlocked = blessUnlocks.filter(star => Number(star) <= Number(main.star)).length;
      if (unlocked < 1) fail(305, 'Fantasy equipment blessing slot is locked');
      const rows = input?.bless_material;
      if (!Array.isArray(rows) || rows.length > unlocked) fail(308, 'Fantasy equipment blessing count is invalid');
      const candidates = [], seen = new Set();
      let overValue = 0;
      for (const material of rows) {
        const created = createBlessCandidate(model, current, material);
        const candidate = created?.equip ?? created;
        if (created?.over) overValue += created.over;
        if (candidate.uid === main.uid || seen.has(candidate.uid)) fail(1, 'Duplicate fantasy equipment blessing');
        if (typeOf(candidate) !== FANTASY_EQUIP_TYPE_NORMAL) fail(308, 'Blessing material must be ordinary fantasy equipment');
        if (Number(candidate.quality) < minBlessQuality) fail(308, 'Fantasy equipment blessing material quality is too low');
        if ((candidate.bless ?? []).length) fail(308, 'A blessing host cannot be used as a blessing material');
        if (heroByEquipUid(model, candidate.uid)) fail(308, 'Worn fantasy equipment cannot be a blessing material');
        const formation = openFormation(current);
        if (formation.formation_list.some(row => Number(row.uid) === candidate.uid)) {
          fail(308, 'Formation fantasy equipment cannot be a blessing material');
        }
        if (customLineupReferences(model, candidate.uid).length || activityReferences(model, candidate.uid).length) {
          fail(308, 'Referenced fantasy equipment cannot be a blessing material');
        }
        const owner = blessOwner(current, candidate.uid);
        if (owner && owner.uid === main.uid && !main.bless.includes(candidate.uid)) {
          fail(308, 'Invalid fantasy equipment blessing owner');
        }
        if (owner && owner.uid !== main.uid) fail(308, 'Fantasy equipment is already used as a blessing');
        seen.add(candidate.uid);
        candidates.push(candidate);
      }
      main.bless = candidates.map(candidate => candidate.uid);
      inventory.save(model, current);
      const value = {
        equips: [main, ...candidates],
        res: { changes: [], is_overflow: false },
        changed_hero: [],
        over_value: overValue
      };
      return { value, data: codec.pack('pb_fantasy_equip_bless_rsp', value) };
    });
  }

  function synthesisRequests(input) {
    if (Array.isArray(input)) return input;
    if (input && typeof input === 'object') {
      if (Array.isArray(input.tids)) return input.tids;
      if (Array.isArray(input.items)) return input.items;
    }
    return [input];
  }

  function synthesis(input) {
    const requests = synthesisRequests(input);
    if (!requests.length || requests.length > 100) fail(1, 'Invalid fantasy equipment synthesis list');
    return store.transaction(model => {
      const current = inventory.read(model);
      const seen = new Set(), created = [], changes = [];
      for (const request of requests) {
        const tid = safeInteger(request && typeof request === 'object' ? request.tid : request, 'synthesis tid', {
          min: 1,
          max: INT32_MAX
        });
        if (seen.has(tid)) fail(1, 'Duplicate fantasy equipment synthesis tid');
        const chip = inventory.chipRequirement(tid);
        if (!chip) fail(306, 'Fantasy equipment synthesis chip is missing');
        const spent = consumeResources(model, [[chip.tid, chip.need_num]], 301);
        const equip = inventory.create(current, tid);
        created.push(equip);
        changes.push(...spent.changes);
        seen.add(tid);
      }
      inventory.save(model, current);
      const value = { changes, is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
  }

  function lineupByType(model, typeValue) {
    const type = safeInteger(typeValue, 'lineup type', { min: 1, max: INT32_MAX });
    const lineup = model.playLineups.find(value => Number(value.type) === type);
    if (!lineup) fail(1, 'Unknown fantasy lineup type');
    lineup.custom_attr ??= [];
    return lineup;
  }

  function validateCustomFantasy(model, current, request) {
    const hero = getHero(model, request?.hero_tid);
    const uid = safeInteger(request?.equip?.uid ?? 0, 'custom equip uid', { min: 0, max: INT32_MAX });
    const blessRows = request?.bless_equip ?? [];
    if (!Array.isArray(blessRows) || blessRows.length > blessCount) fail(1, 'Invalid custom lineup blessing list');
    if (!uid) {
      if (blessRows.length || Number(request?.equip?.tid ?? 0) !== 0) fail(1, 'Empty custom fantasy equipment has inconsistent ids');
      return { hero, entry: null, equipment: [] };
    }
    const equip = inventory.find(current, request.equip);
    checkWearable(model, equip, hero);
    const unlocked = blessUnlocks.filter(star => Number(star) <= Number(equip.star)).length;
    if (blessRows.length > unlocked) fail(305, 'Custom fantasy blessing slot is locked');
    if (blessRows.length && Number(equip.quality) < minBlessQuality) {
      fail(308, 'Custom fantasy equipment quality cannot use blessings');
    }
    const holder = heroByEquipUid(model, equip.uid);
    if (holder && Number(holder.tid) !== Number(hero.tid)) fail(308, 'Fantasy equipment is worn by another hero');
    const blessIds = [], seen = new Set([equip.uid]);
    for (const value of blessRows) {
      const candidate = inventory.find(current, value);
      if (seen.has(candidate.uid)) fail(1, 'Invalid custom lineup blessing');
      if (typeOf(candidate) !== FANTASY_EQUIP_TYPE_NORMAL || Number(candidate.quality) < minBlessQuality) {
        fail(308, 'Custom lineup blessing material is invalid');
      }
      if (heroByEquipUid(model, candidate.uid)) fail(308, 'Worn fantasy equipment cannot be a custom blessing');
      if ((candidate.bless ?? []).length) fail(308, 'A blessing host cannot be a custom blessing');
      const owner = blessOwner(current, candidate.uid);
      if (owner && Number(owner.uid) !== Number(equip.uid)) {
        fail(308, 'Custom blessing equipment is already owned by another equipment');
      }
      seen.add(candidate.uid);
      blessIds.push(candidate.uid);
    }
    return {
      hero,
      entry: { hero_tid: Number(hero.tid), fantasy_uid: equip.uid, bless_fantasy: blessIds },
      equipment: [equip, ...blessIds.map(uid => inventory.findUid(current, uid))]
    };
  }

  function applyCustom(lineup, result) {
    let attr = lineup.custom_attr.find(value => Number(value.type) === CUSTOM_LINEUP_ATTR);
    let data = { fantasy_list: [] };
    if (attr?.value) {
      try {
        data = codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64'));
      } catch {
        fail(5, 'Custom fantasy lineup data is invalid');
      }
    }
    data.fantasy_list ??= [];
    data.fantasy_list = data.fantasy_list.filter(value => Number(value.hero_tid) !== Number(result.hero.tid));
    if (result.entry) data.fantasy_list.push(result.entry);
    if (!attr) {
      attr = { type: CUSTOM_LINEUP_ATTR, value: '' };
      lineup.custom_attr.push(attr);
    }
    if (data.fantasy_list.length) {
      attr.value = codec.pack('pb_lineup_custom_fantasy_info', data).toString('base64');
    } else {
      lineup.custom_attr = lineup.custom_attr.filter(value => value !== attr);
    }
  }

  function customLineup(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const lineup = lineupByType(model, input?.lineup_type);
      const result = validateCustomFantasy(model, current, input);
      applyCustom(lineup, result);
      inventory.save(model, current);
      const value = { lineup, equip_res: current.data };
      return { value, data: codec.pack('pb_fantasy_equip_lineup_custom_rsp', value) };
    });
  }

  function oneKeyLineup(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const lineup = lineupByType(model, input?.lineup_type);
      if (!Array.isArray(input?.equip_reqs) || !input.equip_reqs.length || input.equip_reqs.length > 50) {
        fail(1, 'Fantasy one-key lineup is empty');
      }
      const heroIds = new Set(), equipmentIds = new Set(), results = [];
      for (const request of input.equip_reqs) {
        const result = validateCustomFantasy(model, current, request);
        if (heroIds.has(Number(result.hero.tid))) fail(1, 'Duplicate hero in fantasy one-key lineup');
        for (const equip of result.equipment) {
          if (equipmentIds.has(equip.uid)) fail(1, 'Fantasy equipment is repeated in one-key lineup');
          equipmentIds.add(equip.uid);
        }
        heroIds.add(Number(result.hero.tid));
        results.push(result);
      }
      for (const result of results) applyCustom(lineup, result);
      inventory.save(model, current);
      const value = { changed_hero: [], equip_res: current.data, lineup: [lineup] };
      return { value, data: codec.pack('pb_fantasy_equip_lineup_one_key_rsp', value) };
    });
  }

  function inFormation(input) {
    return store.transaction(model => {
      const current = inventory.read(model);
      const rows = input?.formation_list;
      if (!Array.isArray(rows) || rows.length > 500) fail(1, 'Invalid fantasy formation report');
      const uids = new Set(), slots = new Set(), formation = { formation_list: [] };
      for (const row of rows) {
        const uid = safeInteger(row?.uid, 'formation uid', { min: 1, max: INT32_MAX });
        const slot = safeInteger(row?.slot_index, 'formation slot');
        if (uids.has(uid) || slots.has(slot)) fail(1, 'Fantasy formation report contains duplicates');
        const equip = inventory.findUid(current, uid);
        const type = typeOf(equip);
        if (!tables.FantasyType.get(type)?.is_in_formation) {
          fail(308, 'Only unique or SP equipment can enter fantasy formation');
        }
        if (Number(equip.quality) < openQuality) fail(305, 'Fantasy formation equipment quality is locked');
        uids.add(uid);
        slots.add(slot);
        formation.formation_list.push({ uid, slot_index: slot });
      }
      saveFormation(current, formation);
      inventory.save(model, current);
      return { value: formation, data: encodeEtfInteger(1) };
    });
  }

  function ensureLoginState() {
    store.transaction(model => {
      const current = inventory.read(model);
      openFormation(current);
      inventory.save(model, current);
    });
  }

  function grantEquipment(model, tid, options = {}) {
    const current = inventory.read(model);
    const equip = inventory.create(current, tid, options);
    inventory.save(model, current);
    return equip;
  }

  function grantRawEquipment(model, tid, amount = 1) {
    const current = inventory.read(model);
    const row = inventory.addRaw(current, tid, amount);
    inventory.save(model, current);
    return row;
  }

  function execute(type, input) {
    switch (Number(type)) {
      case 87601: return putOn(input);
      case 87603: return takeOff(input);
      case 87604: return bless(input);
      case 87605: return breakUp(input);
      case 87606: return levelUp(input);
      case 87607: return starUp(input);
      case 87608: return spStarUp(input);
      case 87609: return qualityUp(input);
      case 87610: return synthesis(input);
      case 87611: return customLineup(input);
      case 87613: return oneKeyLineup(input);
      case 87614: return inFormation(input);
      case 87615: return spQualityUp(input);
      case 87616: return urStarUp(input);
      default: fail(1, 'Unsupported fantasy equipment command');
    }
  }

  return {
    moduleId: FANTASY_EQUIP_MODULE_ID,
    inventory,
    ensureLoginState,
    execute,
    grantEquipment,
    grantRawEquipment,
    supports: type => SUPPORTED.has(Number(type))
  };
}
