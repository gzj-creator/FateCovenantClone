import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  CAMPSITE_CONST,
  CAMPSITE_MODULE_ID,
  campsiteGroup,
  campsiteGroupsForRoleLevel
} from '../config/cabin-tables.mjs';

const UNLOCK_CELL_TYPE = 83201;
const PLACE_HERO_TYPE = 83202;
const CAMPSITE_CELL_INVALID = 51901;
const CAMPSITE_CELL_UNLOCKED = 51902;
const CAMPSITE_CELL_LOCK = 51903;
const CAMPSITE_HERO_TYPE_INVALID = 51904;
const HERO_NOT_EXIST = 3001;
const RESOURCE_NOT_ENOUGH = 301;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, message, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > max) fail(1, message);
  return number;
}

function uidString(value, message, { allowZero = false } = {}) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) fail(1, message);
  try {
    const uid = BigInt(value);
    if (uid < 0n || (!allowZero && uid === 0n)) fail(1, message);
    return uid.toString();
  } catch (error) {
    if (error instanceof GameError) throw error;
    fail(1, message);
  }
}

function moduleBytes(module) {
  if (!module?.value?.data) return Buffer.alloc(0);
  return Buffer.from(rawBinary(module));
}

function bytesValue(value, message) {
  if (value === undefined || value === null || value === '') return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (value?.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data);
  fail(5, message);
}

function emptyGroup(groupId) {
  const config = campsiteGroup(groupId);
  if (!config) fail(5, 'Campsite group configuration is missing');
  const bits = Buffer.alloc(Math.ceil(config.gridNum / 8));
  for (let cell = 1; cell <= CAMPSITE_CONST.initCell && cell <= config.gridNum; cell++) setBit(bits, cell);
  return { groupId, config, bits, heroes: new Map() };
}

function normaliseGroup(raw) {
  const groupId = positiveInteger(raw?.group_id, 'Invalid campsite group');
  const config = campsiteGroup(groupId);
  if (!config) fail(5, 'Campsite group configuration is missing');
  const sourceBits = bytesValue(raw?.cell_states, 'Invalid campsite cell state');
  const bits = Buffer.alloc(Math.ceil(config.gridNum / 8));
  for (let cell = 1; cell <= config.gridNum; cell++) {
    if (cell <= CAMPSITE_CONST.initCell || hasBit(sourceBits, cell)) setBit(bits, cell);
  }

  const sourceHeroes = raw?.hero_list ?? [];
  if (!Array.isArray(sourceHeroes)) fail(5, 'Invalid campsite hero list');
  if (sourceHeroes.length > config.gridNum) fail(5, 'Campsite hero list exceeds its grid');
  const heroes = new Map(), seen = new Set();
  for (let index = 0; index < sourceHeroes.length; index++) {
    const uid = uidString(sourceHeroes[index], 'Invalid campsite hero uid', { allowZero: true });
    if (uid === '0') continue;
    if (seen.has(uid)) fail(5, 'Duplicate hero in campsite group');
    seen.add(uid);
    heroes.set(index + 1, uid);
  }
  return { groupId, config, bits, heroes };
}

function groupToPb(group) {
  // CampsiteGroup's constructor creates one zero slot per grid cell and
  // ResetByPb replaces that array with the encoded hero_list verbatim. Keep
  // the fixed-length zero-filled shape so cell indexes remain stable after a
  // login or an empty/partial response.
  const heroList = [];
  for (let cell = 1; cell <= group.config.gridNum; cell++) heroList.push(group.heroes.get(cell) ?? '0');
  return {
    group_id: group.groupId,
    cell_states: group.bits.toString('base64'),
    hero_list: heroList
  };
}

function cloneGroup(group) {
  return {
    groupId: group.groupId,
    config: group.config,
    bits: Buffer.from(group.bits),
    heroes: new Map(group.heroes)
  };
}

function roleLevel(model) {
  const level = Number(model.role?.level ?? 1);
  return Number.isSafeInteger(level) && level > 0 ? level : 1;
}

export function createCabinService({ store, codec, heroTables }) {
  function readGroups(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(CAMPSITE_MODULE_ID);
    const bytes = moduleBytes(module);
    let data = { groups_data: [] };
    if (bytes.length) {
      try {
        data = codec.unpack('pb_campsite_data', bytes);
      } catch {
        fail(5, 'Campsite login module is corrupt');
      }
    }
    const groups = new Map();
    for (const raw of data.groups_data ?? []) {
      const group = normaliseGroup(raw);
      if (groups.has(group.groupId)) fail(5, 'Duplicate campsite group in login state');
      groups.set(group.groupId, group);
    }
    const owners = new Map();
    for (const group of [...groups.values()].sort((left, right) => left.groupId - right.groupId)) {
      for (const [cell, uid] of group.heroes) {
        if (owners.has(uid)) fail(5, 'A hero is placed in more than one campsite cell');
        owners.set(uid, { groupId: group.groupId, cell });
      }
    }
    return { modules, groups };
  }

  function openGroup(model, groupId) {
    const config = campsiteGroup(groupId);
    if (!config) fail(CAMPSITE_CELL_INVALID, 'Campsite group does not exist');
    if (roleLevel(model) < config.unlockLevel) fail(1, 'Campsite group is not open');
    return config;
  }

  function saveGroups(model, modules, groups) {
    const groupsData = [...groups.values()]
      .sort((left, right) => left.groupId - right.groupId)
      .map(groupToPb);
    const value = { groups_data: groupsData };
    const data = codec.pack('pb_campsite_data', value);
    modules.set(CAMPSITE_MODULE_ID, serializedBinary(data));
    model.state.modules.value = [...modules];
    return data;
  }

  function ensureGroup(groups, model, groupId) {
    openGroup(model, groupId);
    let group = groups.get(groupId);
    if (!group) {
      group = emptyGroup(groupId);
      groups.set(groupId, group);
    }
    return group;
  }

  function heroForPlacement(model, uid) {
    const hero = model.heroInfo.hero_list.find(entry => String(entry.uid) === uid);
    if (!hero) fail(HERO_NOT_EXIST, 'Hero does not exist');
    const config = heroTables.Hero.get(Number(hero.tid));
    if (!config) fail(5, 'Hero configuration is missing');
    return { hero, config };
  }

  function validateHeroType(group, heroConfig) {
    if (group.config.camp !== 0 && Number(heroConfig.camp) !== group.config.camp) {
      fail(CAMPSITE_HERO_TYPE_INVALID, 'Hero camp does not match this campsite group');
    }
    if (group.config.profession !== 0 && Number(heroConfig.profession) !== group.config.profession) {
      fail(CAMPSITE_HERO_TYPE_INVALID, 'Hero profession does not match this campsite group');
    }
  }

  function findOwner(groups, uid) {
    for (const group of groups.values()) {
      for (const [cell, placedUid] of group.heroes) if (placedUid === uid) return { groupId: group.groupId, cell };
    }
    return null;
  }

  function spendResource(model, tid, count) {
    const resource = model.resources.get(String(tid));
    const current = BigInt(resource?.num ?? 0);
    if (!resource || current < BigInt(count)) fail(RESOURCE_NOT_ENOUGH, 'Insufficient campsite unlock material');
    resource.num = (current - BigInt(count)).toString();
    return { tid: String(tid), new_num: resource.num, diff_num: (-BigInt(count)).toString() };
  }

  function unlockCell(model, input) {
    const values = Array.isArray(input) ? input : Array.isArray(input?.value) ? input.value : null;
    if (!values || values.length !== 2) fail(1, 'Invalid campsite unlock request');
    const groupId = positiveInteger(values[0], 'Invalid campsite group');
    const cell = positiveInteger(values[1], 'Invalid campsite cell');
    const config = openGroup(model, groupId);
    if (cell <= CAMPSITE_CONST.initCell || cell > config.gridNum) fail(CAMPSITE_CELL_INVALID, 'Invalid campsite cell');

    const { modules, groups } = readGroups(model);
    const group = ensureGroup(groups, model, groupId);
    if (hasBit(group.bits, cell)) fail(CAMPSITE_CELL_UNLOCKED, 'Campsite cell is already unlocked');
    const change = spendResource(model, CAMPSITE_CONST.unlockId, CAMPSITE_CONST.unlockCount);
    setBit(group.bits, cell);
    saveGroups(model, modules, groups);
    const value = { changes: [change], is_overflow: false };
    return {
      schema: 'pb_res_to_client',
      value,
      data: codec.pack('pb_res_to_client', value),
      valueForLog: { groupId, cell, resourceTid: change.tid, resourceDiff: change.diff_num }
    };
  }

  function placeHero(model, input) {
    const requests = input?.place_groups;
    if (!Array.isArray(requests) || requests.length === 0) fail(1, 'Campsite place list is empty');
    if (requests.length > campsiteGroupsForRoleLevel(roleLevel(model)).length) fail(1, 'Campsite place list is too large');

    const { modules, groups } = readGroups(model);
    const operations = [], requestedGroups = new Set(), seenGroups = new Set(), seenCells = new Set(), seenHeroes = new Set();
    for (const request of requests) {
      const groupId = positiveInteger(request?.group_id, 'Invalid campsite group');
      if (seenGroups.has(groupId)) fail(1, 'Duplicate campsite group in place request');
      seenGroups.add(groupId);
      requestedGroups.add(groupId);
      const group = ensureGroup(groups, model, groupId);
      const cellList = request?.cell_index_list, heroList = request?.hero_uid_list;
      if (!Array.isArray(cellList) || !Array.isArray(heroList) || cellList.length !== heroList.length) {
        fail(1, 'Campsite cell and hero lists must be aligned');
      }
      if (cellList.length > group.config.gridNum) fail(1, 'Campsite place list exceeds the group grid');
      for (let index = 0; index < cellList.length; index++) {
        const cell = positiveInteger(cellList[index], 'Invalid campsite cell', group.config.gridNum);
        const uid = uidString(heroList[index], 'Invalid campsite hero uid', { allowZero: true });
        const cellKey = groupId + ':' + cell;
        if (seenCells.has(cellKey)) fail(1, 'Duplicate campsite cell in place request');
        seenCells.add(cellKey);
        if (!hasBit(group.bits, cell)) fail(CAMPSITE_CELL_LOCK, 'Campsite cell is locked');
        if (uid !== '0') {
          const hero = heroForPlacement(model, uid);
          validateHeroType(group, hero.config);
          if (seenHeroes.has(uid)) fail(1, 'Duplicate campsite hero in place request');
          seenHeroes.add(uid);
        }
        operations.push({ groupId, cell, uid });
      }
    }

    const simulated = new Map([...groups].map(([groupId, group]) => [groupId, cloneGroup(group)]));
    // A request may describe a move or swap only when the old cell is also
    // present in the same batch. This keeps unlisted occupied cells intact
    // while allowing atomic cell exchanges such as A<->B.
    for (const operation of operations) {
      if (operation.uid === '0') continue;
      const owner = findOwner(groups, operation.uid);
      if (owner && !seenCells.has(owner.groupId + ':' + owner.cell)) {
        fail(1, 'Hero is already placed outside the requested cells');
      }
    }
    for (const operation of operations) {
      const group = simulated.get(operation.groupId);
      if (operation.uid === '0') {
        group.heroes.delete(operation.cell);
        continue;
      }
      group.heroes.set(operation.cell, operation.uid);
    }

    for (const [groupId, group] of simulated) groups.set(groupId, group);
    saveGroups(model, modules, groups);
    const touched = [...requestedGroups]
      .sort((left, right) => left - right)
      .map(groupId => groupToPb(groups.get(groupId)));
    const value = { groups_data: touched };
    return {
      schema: 'pb_campsite_data',
      value,
      data: codec.pack('pb_campsite_data', value),
      valueForLog: {
        groups: touched.map(group => group.group_id),
        placements: operations.map(operation => ({ groupId: operation.groupId, cell: operation.cell, uid: operation.uid }))
      }
    };
  }

  return {
    supports: type => type === UNLOCK_CELL_TYPE || type === PLACE_HERO_TYPE,
    ensureLoginState() {
      log({ event: 'cabin_ensureLoginState_entry' });
      return store.transaction(model => {
        const { modules, groups } = readGroups(model);
        for (const config of campsiteGroupsForRoleLevel(roleLevel(model))) {
          if (!groups.has(config.groupId)) groups.set(config.groupId, emptyGroup(config.groupId));
        }
        saveGroups(model, modules, groups);
        return { groupIds: [...groups.keys()].sort((left, right) => left - right) };
      });
    },
    loginPayload() {
      const module = new Map(store.state().modules.value).get(CAMPSITE_MODULE_ID);
      return moduleBytes(module);
    },
    execute(type, input) {
      log({ event: 'cabin_execute_entry', type, input, inputHex: input?.toString('base64') });
      if (type !== UNLOCK_CELL_TYPE && type !== PLACE_HERO_TYPE) fail(1, 'Invalid campsite command');
      return store.transaction(model => type === UNLOCK_CELL_TYPE ? unlockCell(model, input) : placeHero(model, input));
    }
  };
}

export { CAMPSITE_MODULE_ID, UNLOCK_CELL_TYPE, PLACE_HERO_TYPE };
