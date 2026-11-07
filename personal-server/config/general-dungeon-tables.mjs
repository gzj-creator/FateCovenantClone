import { readJsonAsset, tableAsset } from '../assets.mjs';

// GeneralDungeonTable is extracted from the shipped LuaJIT bytecode by
// tools/extract-general-dungeon-table.mjs. The nested Level.scene,
// Event.next_event and EventBox.res_list arrays are preserved.
const defaultPath = tableAsset('GeneralDungeonTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing GeneralDungeon table: ' + name);
  return table.rows;
}

function byTid(rows) {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

function rowsByGroup(rows) {
  const groups = new Map();
  for (const row of rows) {
    const body = Number(row.event_body ?? row.tid);
    const levelTid = Math.floor(body / 1000);
    if (!Number.isSafeInteger(levelTid) || levelTid <= 0) continue;
    if (!groups.has(levelTid)) groups.set(levelTid, []);
    groups.get(levelTid).push(row);
  }
  return groups;
}

function pairs(value, label) {
  if (!Array.isArray(value)) return [];
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

export function readGeneralDungeonTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const levels = byTid(rowsOf(dump, 'Level'));
  const events = byTid(rowsOf(dump, 'Event'));
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    dungeonTypes: byTid(rowsOf(dump, 'DungeonType')),
    constants: rowsOf(dump, 'Const')[0] ?? null,
    levels,
    events,
    eventsByLevel: rowsByGroup([...events.values()]),
    boxes: byTid(rowsOf(dump, 'EventBox')),
    fights: byTid(rowsOf(dump, 'EventFight')),
    draws: byTid(rowsOf(dump, 'EventDraw')),
    props: byTid(rowsOf(dump, 'EventPropUse')),
    propDefinitions: byTid(rowsOf(dump, 'Prop')),
    cures: byTid(rowsOf(dump, 'EventCure')),
    propAdds: byTid(rowsOf(dump, 'EventPropAdd')),
    condition: byTid(rowsOf(dump, 'EventCondition')),
    records: byTid(rowsOf(dump, 'EventRecord')),
    modelAutos: byTid(rowsOf(dump, 'EventModelAuto')),
    followers: byTid(rowsOf(dump, 'EventFollower')),
    effects: byTid(rowsOf(dump, 'EventEffect')),
    animates: byTid(rowsOf(dump, 'EventAnimate')),
    locks: byTid(rowsOf(dump, 'EventLock')),
    fogHides: byTid(rowsOf(dump, 'EventFogHide')),
    closes: byTid(rowsOf(dump, 'EventClose')),
    talks: byTid(rowsOf(dump, 'EventTalk')),
    tips: byTid(rowsOf(dump, 'EventTips'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function generalDungeonEventKind(row) {
  const body = Number(row?.event_body);
  return Number.isSafeInteger(body) ? body % 1000 : 0;
}

export function generalDungeonEventsForLevel(tables, levelTid) {
  return [...(tables.eventsByLevel.get(Number(levelTid)) ?? [])]
    .sort((left, right) => Number(left.tid) - Number(right.tid));
}

export function generalDungeonBoxAwards(tables, bodyTid) {
  return pairs(tables.boxes.get(Number(bodyTid))?.res_list, 'General dungeon box');
}

export function generalDungeonLevelScenes(row) {
  const scenes = Array.isArray(row?.scene) ? row.scene : [];
  const positions = Array.isArray(row?.init_pos) ? row.init_pos : [];
  return scenes.map((name, index) => ({
    index: index + 1,
    name: String(name),
    pos: Number(positions[index] ?? positions[0] ?? 0)
  }));
}

export function generalDungeonNextEvents(row) {
  const value = row?.next_event;
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter(id => Number.isSafeInteger(id) && id > 0);
}
