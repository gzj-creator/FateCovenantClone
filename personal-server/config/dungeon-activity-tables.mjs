import { readJsonAsset, tableAsset } from '../assets.mjs';

// Tables for block A1 (RedCliff / SoulTrial / ScarletTrial / CampTower /
// TowerDefense / DestinyPve). Every table is extracted from the shipped
// LuaJIT client bundle by tools/extract-shipped-table.mjs; a missing or
// malformed table makes readTableAsset throw so callers fail closed.
const cache = new Map();

export function readTableAsset(name) {
  if (cache.has(name)) return cache.get(name);
  const dump = readJsonAsset(tableAsset(name + '.data.lua.json'));
  if (!dump?.tables) throw new Error('Table asset is missing: ' + name);
  cache.set(name, dump);
  return dump;
}

export function rowsOf(dump, table) {
  const value = dump?.tables?.[table];
  if (!value || !Array.isArray(value.rows)) throw new Error('Missing ' + table + ' table');
  return value.rows;
}

export function byTid(rows, field = 'tid') {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row?.[field]);
    if (Number.isSafeInteger(tid)) map.set(tid, row);
  }
  return map;
}

// Resource lists are [tid, count] pairs. Anything else is a configuration
// error; the caller turns that into a fail-closed GameError.
export function rewardPairs(list, label) {
  if (!Array.isArray(list)) throw new Error(label + ' reward configuration is invalid');
  return list.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

function load(name, build) {
  const dump = readTableAsset(name);
  return { source: dump.source ?? null, fields: dump.tables, ...build(dump) };
}

export function readRedCliffTables() {
  return load('RedCliffTable', dump => ({
    buffers: byTid(rowsOf(dump, 'Buff')),
    levels: byTid(rowsOf(dump, 'Level')),
    starAwards: byTid(rowsOf(dump, 'StarAward')),
    const: rowsOf(dump, 'Const')[0] ?? null
  }));
}

export function readTowerDefenseTables() {
  return load('TowerDefenseTable', dump => ({
    types: byTid(rowsOf(dump, 'Type')),
    turns: byTid(rowsOf(dump, 'Turns')),
    monsters: byTid(rowsOf(dump, 'Monster')),
    tasks: byTid(rowsOf(dump, 'Task')),
    walls: byTid(rowsOf(dump, 'Wall')),
    weeks: byTid(rowsOf(dump, 'Week')),
    indexes: byTid(rowsOf(dump, 'Index'))
  }));
}

export function readSoulTrialTables() {
  return load('SoulTrialTable', dump => ({
    const: rowsOf(dump, 'Const')[0] ?? null,
    fights: byTid(rowsOf(dump, 'Fight')),
    drawCards: byTid(rowsOf(dump, 'DrawCard')),
    camps: byTid(rowsOf(dump, 'CampLoop')),
    dayAwards: byTid(rowsOf(dump, 'DayAward'))
  }));
}

export function readScarletTrialTables() {
  return load('ScarletTrialTable', dump => ({
    const: rowsOf(dump, 'Const')[0] ?? null,
    tasks: byTid(rowsOf(dump, 'Task')),
    turns: byTid(rowsOf(dump, 'Turn')),
    buffs: byTid(rowsOf(dump, 'Buff')),
    ranks: rowsOf(dump, 'Rank')
  }));
}

export function readCampTowerTables() {
  return load('CampTowerTable', dump => ({
    const: rowsOf(dump, 'Const')[0] ?? null,
    opens: byTid(rowsOf(dump, 'Open')),
    types: byTid(rowsOf(dump, 'Type')),
    firstPass: byTid(rowsOf(dump, 'FirstPass')),
    diffDays: byTid(rowsOf(dump, 'DiffDay'))
  }));
}

export function readDestinyPveTables() {
  return load('DestinyPveTable', dump => ({
    const: rowsOf(dump, 'Const')[0] ?? null,
    layers: byTid(rowsOf(dump, 'Layer')),
    acts: byTid(rowsOf(dump, 'Act')),
    treasureCfg: byTid(rowsOf(dump, 'TreasureCfg'))
  }));
}
