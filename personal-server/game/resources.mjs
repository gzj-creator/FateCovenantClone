import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { setBit } from './bit-block.mjs';
import {
  MISSION_ENERGY_MODULE_ID,
  MISSION_ENERGY_SLOT,
  MISSION_ENERGY_TID,
  isMissionEnergyResource,
  missionEnergyBin
} from './energy.mjs';
import { GameError } from './hero-progression.mjs';

const ITEM_GROUP_HANDLERS = new Map([
  // Module 6 containers are selected by the exact client resource type and
  // obj_class pair. A new resource family must add an explicit row here.
  ['2:ItemProp', 0], ['2:EquipMatProp', 0], ['2:HeroDiffItem', 0], ['2:ItemWarRuneChip', 0],
  ['2:ItemGuildRuneStone', 0], ['2:ArtifactChip', 0], ['2:ItemAutoProduce', 0], ['2:ItemBase', 0],
  ['2:PetEquip', 0], ['2:HeroBlazon', 0], ['2:MagicalJourneyDevelopCell', 0], ['2:EmojiItem', 0],
  ['2:FantasyEquipChip', 0], ['2:SpRelicItem', 0], ['2:FuCard', 0], ['2:ItemRoleSkin', 0],
  ['2:PetMutantItem', 0], ['2:ElvesMutantItem', 0], ['2:ItemChip', 0],
  ['4:HeroChip', 2],
  ['14:PetChip', 8],
  ['21:ElvesChip', 12],
  ['1000:ItemBase', 1], ['1000:ItemProp', 1],
  ['1200:ItemBox', 1], ['1200:ItemSuitBox', 1], ['1200:ItemTimeBox', 1],
  ['1900:ItemBase', 3],
  ['3300:ItemBase', 9],
  ['4200:ItemBase', 0],
  ['4100:ItemSpiritCourtyard', 19],
  // TreasureHuntTable HighAward rows use museum collection items. The museum
  // service consumes the same family, so rewards must land in an inventory
  // container instead of failing with an unknown-resource error.
  ['3000:MuseumCollectionItem', 0]
]);

let schemaCodec;
const codecFor = options => options?.codec ?? (schemaCodec ??= createGameCodec());

function totalsOf(awards) {
  const totals = new Map();
  for (const [id, amount] of awards) {
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(amount) || amount <= 0) throw new GameError(5, 'Invalid resource amount');
    totals.set(String(id), (totals.get(String(id)) ?? 0n) + BigInt(amount));
  }
  return totals;
}

function typeOf(item, tables) {
  return item ? tables.Type?.get(Number(item.type)) : null;
}

function handlerFor(itemId, tables) {
  const item = tables.Item?.get(itemId);
  if (String(itemId) === MISSION_ENERGY_TID) {
    return { key: 'mission-energy', kind: 'energy', moduleId: MISSION_ENERGY_MODULE_ID, index: MISSION_ENERGY_SLOT };
  }
  if (!item) {
    return tables.Hero?.has(itemId)
      ? { key: 'hero:raw', kind: 'hero' }
      : null;
  }
  const type = typeOf(item, tables);
  if (!type) return null;
  const resType = Number(type.res_type);
  const objClass = type.obj_class?.reference;
  if (!objClass) return null;
  const pair = `${resType}:${objClass}`;

  if (resType === 140000 && objClass === 'ItemBase') return { key: `${pair}:role-exp`, kind: 'roleExp' };
  if (resType === 1500) return { key: `${pair}:currency`, kind: 'currency' };
  if (resType === 1800 && objClass === 'ItemBase') return { key: `${pair}:artifact-currency`, kind: 'artifactCurrency' };

  const inventoryGroup = ITEM_GROUP_HANDLERS.get(pair);
  if (inventoryGroup !== undefined) return { key: `${pair}:item-container:${inventoryGroup}`, kind: 'item', group: inventoryGroup };

  if (resType === 8) {
    if (tables.FigureTitle?.has(itemId)) return { key: '8:figure-title', kind: 'figure', field: 'stable_title_info' };
    if (tables.FigureChatBubble?.has(itemId)) return { key: '8:figure-chat-bubble', kind: 'figure', field: 'stable_bubble_info' };
    if (tables.FigureHead?.has(itemId)) return { key: '8:figure-head', kind: 'figure', field: 'stable_head_info' };
    if (tables.FigureFrame?.has(itemId)) return { key: '8:figure-frame', kind: 'figure', field: 'stable_frame_info' };
    if (objClass === 'ItemFigure') {
      if (Number(type.tid) === 101) return { key: '8:figure-head', kind: 'figure', field: 'stable_head_info' };
      if (Number(type.tid) === 102) return { key: '8:figure-frame', kind: 'figure', field: 'stable_frame_info' };
    }
    return null;
  }

  if (resType === 9 && objClass === 'Relic') return { key: '9:Relic', kind: 'item', group: 0 };
  if (resType === 10 && objClass === 'Artifact') return { key: '10:Artifact', kind: 'artifact' };
  if (resType === 12 && objClass === 'Skin') return { key: '12:Skin', kind: 'skin' };
  if (resType === 13 && objClass === 'Pet') return { key: '13:Pet', kind: 'pet' };
  if (resType === 17 && objClass === 'Treasure') return { key: '17:Treasure', kind: 'treasure' };
  if (resType === 19 && objClass === 'FantasyEquip') return { key: '19:FantasyEquip', kind: 'fantasyEquip' };
  if (resType === 20 && objClass === 'Elves') return { key: '20:Elves', kind: 'elves' };
  if (resType === 22 && objClass === 'ElvesBead') return { key: '22:ElvesBead', kind: 'elvesBead' };
  if (resType === 3200 && objClass === 'HouseAssistantItem') return { key: '3200:HouseAssistantItem', kind: 'houseAssistant' };
  return null;
}

export function rewardHandlerFor(itemId, tables) {
  return handlerFor(Number(itemId), tables);
}

export function isGrantableResource(itemId, tables) {
  return Boolean(handlerFor(Number(itemId), tables));
}

export function partitionGrantableResources(awards, tables) {
  const totals = totalsOf(awards);
  const grantable = [], pending = [];
  for (const [rawId, total] of totals) {
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(1, 'Resource amount is too large');
    const tid = Number(rawId);
    const item = tables.Item?.get(tid);
    const handler = handlerFor(tid, tables);
    if (!item && !handler) throw new GameError(5, 'Unsupported reward resource');
    const count = Number(total);
    if (handler) grantable.push([tid, count]);
    else pending.push({
      tid,
      quantity: count,
      resType: item ? (Number(typeOf(item, tables)?.res_type) || null) : null,
      reason: 'reward_handler_not_implemented'
    });
  }
  return { grantable, pending };
}

export function releaseGrantablePendingRewards(model, db, tables, { sourcePrefix = null } = {}) {
  let query = "SELECT source_key,item_tid,quantity FROM pending_rewards WHERE role_id=? AND status='pending'";
  const parameters = [model.state.roleId];
  if (sourcePrefix) {
    query += ' AND source_key LIKE ?';
    parameters.push(sourcePrefix.endsWith('%') ? sourcePrefix : sourcePrefix + '%');
  }
  const pending = db.prepare(query + ' ORDER BY created_at,source_key,item_tid').all(...parameters);
  const releasable = pending.filter(reward => isGrantableResource(reward.item_tid, tables));
  if (!releasable.length) return { changes: [], released: [] };

  const res = grantResources(model, releasable.map(reward => [reward.item_tid, reward.quantity]), tables);
  const releasedAt = new Date().toISOString();
  const update = db.prepare(
    "UPDATE pending_rewards SET status='released',released_at=? WHERE role_id=? AND source_key=? AND item_tid=? AND status='pending'"
  );
  for (const reward of releasable) update.run(releasedAt, model.state.roleId, reward.source_key, reward.item_tid);
  return {
    changes: res.changes,
    released: releasable.map(reward => ({ sourceKey: reward.source_key, tid: reward.item_tid, quantity: reward.quantity }))
  };
}

function appendItemLocation(model, modules, group) {
  const module = modules.get(6);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Item inventory module is unavailable');
  while (module.value.length <= group) module.value.push({ value: [], improper: false });
  if (!Array.isArray(module.value[group]?.value)) module.value[group] = { value: [], improper: false };
  const entry = module.value[group].value.length;
  module.value[group].value.push(serializedBinary(Buffer.alloc(0)));
  return [6, group, entry];
}

function appendCurrencyLocation(model, modules, moduleId, group, codec) {
  const target = group === null ? modules.get(moduleId) : modules.get(moduleId)?.value?.[group];
  if (!target) throw new GameError(5, 'Currency module is unavailable');
  const data = rawBinary(target).length ? codec.unpack('pb_currency_data', rawBinary(target)) : { res_list: [] };
  data.res_list ??= [];
  const entry = data.res_list.length;
  data.res_list.push({ tid: 0, num: 0 });
  const packed = serializedBinary(codec.pack('pb_currency_data', data));
  if (group === null) modules.set(moduleId, packed);
  else modules.get(moduleId).value[group] = packed;
  return [moduleId, group, entry];
}

function readSerialized(modules, moduleId, index, schema, fallback, codec) {
  const module = modules.get(moduleId);
  const target = index === null ? module : module?.value?.[index];
  if (!target) throw new GameError(5, `Reward module ${moduleId} is unavailable`);
  const bytes = rawBinary(target);
  return bytes.length ? codec.unpack(schema, bytes) : structuredClone(fallback);
}

function writeSerialized(modules, moduleId, index, schema, value, codec) {
  const packed = serializedBinary(codec.pack(schema, value));
  if (index === null) modules.set(moduleId, packed);
  else {
    const module = modules.get(moduleId);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, `Reward module ${moduleId} is unavailable`);
    while (module.value.length <= index) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[index] = packed;
  }
}

function grantItem(model, modules, id, amount, handler) {
  let resource = model.resources.get(String(id));
  if (!resource) {
    resource = { tid: id, num: '0', location: appendItemLocation(model, modules, handler.group) };
    model.resources.set(String(id), resource);
  }
  const next = BigInt(resource.num) + BigInt(amount);
  if (next > 9223372036854775807n) throw new GameError(1, 'Resource limit reached');
  resource.num = next.toString();
  return resource.num;
}

function grantCurrency(model, modules, id, amount, moduleId, group, codec) {
  let resource = model.resources.get(String(id));
  if (!resource) {
    resource = { tid: id, num: '0', location: appendCurrencyLocation(model, modules, moduleId, group, codec) };
    model.resources.set(String(id), resource);
  }
  const next = BigInt(resource.num) + BigInt(amount);
  if (next > 9223372036854775807n) throw new GameError(1, 'Resource limit reached');
  resource.num = next.toString();
  return resource.num;
}

function grantMissionEnergy(model, modules, id, amount, codec, options = {}) {
  let resource = model.resources.get(String(id));
  const now = Math.floor(Number(typeof options.now === 'function' ? options.now() : (options.now ?? Date.now())) / 1000);
  if (!resource) {
    const data = readSerialized(modules, MISSION_ENERGY_MODULE_ID, MISSION_ENERGY_SLOT,
      'pb_role_energy_res', { res: [] }, codec);
    data.res ??= [];
    let entry = data.res.findIndex(value => String(value?.tid) === String(id));
    if (entry < 0) {
      entry = data.res.length;
      data.res.push({ tid: String(id), num: '0', produce_time: now });
    }
    writeSerialized(modules, MISSION_ENERGY_MODULE_ID, MISSION_ENERGY_SLOT, 'pb_role_energy_res', data, codec);
    resource = {
      tid: String(id),
      num: String(data.res[entry].num ?? 0),
      produce_time: Number(data.res[entry].produce_time ?? now),
      location: [MISSION_ENERGY_MODULE_ID, MISSION_ENERGY_SLOT, entry]
    };
    model.resources.set(String(id), resource);
  }
  const next = BigInt(resource.num) + BigInt(amount);
  if (next > 9223372036854775807n) throw new GameError(1, 'Resource limit reached');
  resource.num = next.toString();
  resource.produce_time ??= now;
  return resource.num;
}

function grantRoleExp(model, amount) {
  const next = BigInt(model.role.exp ?? 0) + BigInt(amount);
  if (next > 4294967295n) throw new GameError(1, 'Resource limit reached');
  model.role.exp = Number(next);
  return next.toString();
}

function grantRawHero(model, id, amount, tables) {
  model.heroInfo.hero_list ??= [];
  const existing = model.heroInfo.hero_list.find(hero => Number(hero.tid) === id);
  if (existing) {
    existing.count = Number(existing.count ?? 0) + amount;
    return String(existing.count);
  }
  const config = tables.Hero.get(id);
  model.heroInfo.hero_list.push({
    tid: String(id), count: amount, uid: String(id), level: 1,
    star: Number(config?.star ?? 0), source: 1, quality: Number(config?.quality ?? 0),
    relic: [], up_star_high_consume: [], source_point_list: [], pendant_select_list: []
  });
  return String(amount);
}

function grantFigure(model, id, amount, handler) {
  model.role.figure_have_info ??= {};
  const figure = model.role.figure_have_info;
  // RoleFigureMgr maps each stable figure family by tid range:
  // head 100xxx -> index 1..., frame 200xxx -> 1..., and title/bubble
  // 300xxx/400xxx share the 3000 offset. Using the title formula for every
  // family made common frame rewards such as 200508 resolve to a negative bit.
  const familyOffset = {
    stable_head_info: 1000,
    stable_frame_info: 2000,
    stable_title_info: 3000,
    stable_bubble_info: 3000
  }[handler.field];
  const bit = familyOffset === undefined ? -1 : Math.floor((id - 8) / 100) - familyOffset;
  if (bit < 0) throw new GameError(5, 'Figure reward index is invalid');
  const current = figure[handler.field] ? Buffer.from(figure[handler.field], 'base64') : Buffer.alloc(0);
  figure[handler.field] = setBit(current, bit).toString('base64');
  return String(amount);
}

function grantArtifact(modules, id, amount, codec) {
  const data = readSerialized(modules, 50, 0, 'pb_artifact_info', { artifact_list: [], skill_list: [] }, codec);
  data.artifact_list ??= [];
  let row = data.artifact_list.find(entry => Number(entry.tid) === id);
  if (!row) { row = { tid: String(id), num: 0 }; data.artifact_list.push(row); }
  row.num = Number(row.num ?? 0) + amount;
  writeSerialized(modules, 50, 0, 'pb_artifact_info', data, codec);
  return String(row.num);
}

function grantSkin(modules, id, amount, codec) {
  const data = readSerialized(modules, 65, 0, 'pb_skin_info', { skin_list: [] }, codec);
  data.skin_list ??= [];
  let row = data.skin_list.find(entry => Number(entry.id) === id);
  if (!row) { row = { id: String(id), num: 0 }; data.skin_list.push(row); }
  row.num = Number(row.num ?? 0) + amount;
  writeSerialized(modules, 65, 0, 'pb_skin_info', data, codec);
  return String(row.num);
}

function grantUniqueEntity(modules, moduleId, index, schema, listField, id, fallback, codec, create) {
  const data = readSerialized(modules, moduleId, index, schema, fallback, codec);
  data[listField] ??= [];
  if (!data[listField].some(entry => Number(entry.tid) === id)) data[listField].push(create(id));
  writeSerialized(modules, moduleId, index, schema, data, codec);
  return String(data[listField].filter(entry => Number(entry.tid) === id).length);
}

function grantTreasure(modules, id, amount, quality, codec) {
  const data = readSerialized(modules, 534, 0, 'pb_treasure_data', { treasure_list: [], suit_list: [] }, codec);
  data.treasure_list ??= [];
  let card = data.treasure_list.find(entry => Number(entry.tid) === id);
  if (!card) {
    card = { tid: String(id), quality, chip_num: amount };
    data.treasure_list.push(card);
  } else {
    card.chip_num = Number(card.chip_num ?? 0) + amount;
  }
  writeSerialized(modules, 534, 0, 'pb_treasure_data', data, codec);
  return { newNum: String(card.chip_num ?? 1), newBin: codec.pack('pb_treasure_card', card) };
}

function grantFantasyEquip(modules, id, amount, codec) {
  const data = readSerialized(modules, 518, 0, 'pb_fantasy_equip_res', { equips: [], raw_equips: [] }, codec);
  data.raw_equips ??= [];
  let row = data.raw_equips.find(entry => Number(entry.tid) === id);
  if (!row) { row = { tid: id, num: 0 }; data.raw_equips.push(row); }
  row.num = Number(row.num ?? 0) + amount;
  writeSerialized(modules, 518, 0, 'pb_fantasy_equip_res', data, codec);
  return String(row.num);
}

function grantElvesBead(modules, id, amount, codec) {
  const data = readSerialized(modules, 539, null, 'pb_elves_bead_data', { max_uid: 0, elves_beads: [] }, codec);
  data.elves_beads ??= [];
  data.max_uid = Number(data.max_uid ?? 0);
  for (let index = 0; index < amount; index++) {
    data.max_uid++;
    data.elves_beads.push({ tid: String(id), uid: String(data.max_uid), level: 1 });
  }
  writeSerialized(modules, 539, null, 'pb_elves_bead_data', data, codec);
  return String(data.elves_beads.filter(entry => Number(entry.tid) === id).length);
}

function grantHouseAssistant(modules, id, amount, codec) {
  const data = readSerialized(modules, 148, 0, 'pb_house_assistant_info', { res: [], use: [], trial: [], last_use: [] }, codec);
  data.res ??= [];
  let row = data.res.find(entry => Number(entry.tid) === id);
  if (!row) { row = { tid: String(id), num: '0' }; data.res.push(row); }
  row.num = (BigInt(row.num ?? 0) + BigInt(amount)).toString();
  writeSerialized(modules, 148, 0, 'pb_house_assistant_info', data, codec);
  return row.num;
}

export function grantResources(model, awards, tables, options = {}) {
  const totals = totalsOf(awards);
  const codec = codecFor(options);
  const plans = [];
  for (const [rawId, total] of totals) {
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(1, 'Resource amount is too large');
    const amount = Number(total);
    const id = Number(rawId);
    const item = tables.Item?.get(id);
    const handler = handlerFor(id, tables);
    if (!item && !handler) throw new GameError(5, 'Unsupported reward resource');
    if (!handler) throw new GameError(5, `Reward resource has no explicit handler: ${id}`);
    plans.push({ id, amount, item, handler });
  }

  const modules = new Map(model.state.modules.value);
  const changes = [];
  for (const { id, amount, item, handler } of plans) {
    let newNum, changeExtra = {};
    switch (handler.kind) {
      case 'roleExp': newNum = grantRoleExp(model, amount); break;
      case 'currency': newNum = grantCurrency(model, modules, id, amount, 5, null, codec); break;
      case 'energy':
        newNum = grantMissionEnergy(model, modules, id, amount, codec, options);
        changeExtra = { new_bin: missionEnergyBin(codec, model.resources.get(String(id))) };
        break;
      case 'artifactCurrency': newNum = grantCurrency(model, modules, id, amount, 10, 1, codec); break;
      case 'item':
        newNum = grantItem(model, modules, id, amount, handler);
        changeExtra = {
          new_bin: codec.pack('pb_res_obj', {
            tid: String(id),
            num: String(newNum)
          })
        };
        break;
      case 'hero': newNum = grantRawHero(model, id, amount, tables); break;
      case 'figure': newNum = grantFigure(model, id, amount, handler); break;
      case 'relic': newNum = grantRelic(modules, id, amount, codec); break;
      case 'artifact': newNum = grantArtifact(modules, id, amount, codec); break;
      case 'skin': newNum = grantSkin(modules, id, amount, codec); break;
      case 'pet':
        newNum = grantUniqueEntity(modules, 158, 0, 'pb_pet_develop_data', 'pets', id,
          { pets: [], slots: [] }, codec, tid => ({ tid: String(tid), level: 1 }));
        break;
      case 'treasure': {
        const result = grantTreasure(modules, id, amount, Number(item.quality ?? 0), codec);
        newNum = result.newNum;
        changeExtra = { new_bin: result.newBin };
        break;
      }
      case 'fantasyEquip': newNum = grantFantasyEquip(modules, id, amount, codec); break;
      case 'elves':
        newNum = grantUniqueEntity(modules, 538, null, 'pb_elves_develop', 'elves', id,
          { elves: [], help_slots: [] }, codec, tid => ({ tid: String(tid) }));
        break;
      case 'elvesBead': newNum = grantElvesBead(modules, id, amount, codec); break;
      case 'houseAssistant': newNum = grantHouseAssistant(modules, id, amount, codec); break;
      default: throw new GameError(5, `Reward handler is invalid: ${handler.key}`);
    }
    changes.push({ tid: String(id), new_num: String(newNum), diff_num: String(amount), ...changeExtra });
  }
  model.state.modules.value = [...modules];
  return { changes };
}

export function consumeResources(model, costs, insufficientCode = 301, options = {}) {
  const totals = new Map();
  for (const [id, amount] of costs) {
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(amount) || amount < 0) throw new GameError(5, 'Invalid resource cost');
    totals.set(String(id), (totals.get(String(id)) ?? 0n) + BigInt(amount));
  }
  for (const [id, amount] of totals) {
    if (BigInt(model.resources.get(id)?.num ?? 0) < amount) throw new GameError(insufficientCode, 'Insufficient resource');
  }
  const changes = [];
  const codec = codecFor(options);
  const now = Math.floor(Number(typeof options.now === 'function' ? options.now() : (options.now ?? Date.now())) / 1000);
  for (const [id, amount] of totals) {
    if (amount === 0n) continue;
    const item = model.resources.get(id);
    const before = BigInt(item.num);
    item.num = (BigInt(item.num) - amount).toString();
    const change = { tid: id, new_num: item.num, diff_num: (-amount).toString() };
    if (isMissionEnergyResource(item)) {
      const max = Number(options.energyMax?.(Number(id)) ?? NaN);
      const produceTime = Number(item.produce_time ?? 0);
      // A resource at its natural cap has no active refill timer. Start one
      // at the transaction time when it first drops below that cap.
      if (!Number.isSafeInteger(produceTime) || produceTime <= 0 || produceTime > now || (Number.isSafeInteger(max) && max > 0 && before >= max)) {
        item.produce_time = now;
      }
      change.new_bin = missionEnergyBin(codec, item);
    }
    changes.push(change);
  }
  return { changes };
}
