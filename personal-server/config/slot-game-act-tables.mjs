import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// SlotGameActTable is rebuilt from the client bundle with
// tools/extract-slot-game-act-table.mjs (see
// agent/workflow/gameplay-completion/PAY-SLOTGAMEACT/implementation.md).
// asset: assets/tables/SlotGameActTable.data.lua.json.gz
const defaultPath = tableAsset('SlotGameActTable.data.lua.json.gz');

// The shipped table always carries the same five row families. A different
// count means the extractor picked up another client build, so the server fails
// loudly instead of rolling an activity with missing weights.
const EXPECTED_ROWS = Object.freeze({
  MultiplierLibDraw: 19,
  MultiplierLib: 3,
  AwardMapLib: 1,
  AwardLib: 3,
  Version: 1
});
const TABLES = Object.keys(EXPECTED_ROWS);
let defaultCache;

function rowsOf(tables, name) {
  const rows = tables?.[name];
  if (!(rows instanceof Map)) throw new Error('Missing SlotGameAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (rows.size !== expected) {
    throw new Error(`SlotGameAct table ${name} has ${rows.size} rows, expected ${expected}`);
  }
  return rows;
}

function integer(row, field, name) {
  const value = Number(row?.[field]);
  if (!Number.isSafeInteger(value)) throw new Error(`SlotGameAct ${name}.${field} is not an integer`);
  return value;
}

function groupByLib(rows, name) {
  const map = new Map();
  for (const row of rows.values()) {
    const lib = integer(row, 'lib', name);
    if (!map.has(lib)) map.set(lib, []);
    map.get(lib).push(row);
  }
  for (const group of map.values()) group.sort((left, right) => integer(left, 'tid', name) - integer(right, 'tid', name));
  return map;
}

function awardList(value) {
  if (!Array.isArray(value)) throw new Error('SlotGameAct AwardLib.award is missing');
  return value.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) throw new Error('SlotGameAct AwardLib.award entry is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error('SlotGameAct AwardLib.award entry is invalid');
    }
    return [tid, count];
  });
}

// SlotGameActUtil.GetMultiplierRange and GetItemTidListByVersion both read the
// generated *_ValueIndex().lib[<version field>] lists. Grouping the rows by the
// lib field here reproduces those indexes without hard-coded tid lists.
export function readSlotGameActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const parsed = readJsonAsset(file);
  const decoded = readGeneratedDump(parsed, TABLES);
  const versions = rowsOf(decoded, 'Version');
  const awardMapLib = rowsOf(decoded, 'AwardMapLib');
  const awardLib = rowsOf(decoded, 'AwardLib');
  const multiplierLib = rowsOf(decoded, 'MultiplierLib');
  const multiplierLibDraw = rowsOf(decoded, 'MultiplierLibDraw');

  for (const row of versions.values()) {
    integer(row, 'tid', 'Version');
    integer(row, 'award_map_lib', 'Version');
    integer(row, 'multiplier_lib', 'Version');
  }
  for (const row of awardMapLib.values()) {
    integer(row, 'tid', 'AwardMapLib');
    integer(row, 'item', 'AwardMapLib');
    integer(row, 'award_lib', 'AwardMapLib');
  }
  for (const row of awardLib.values()) {
    integer(row, 'tid', 'AwardLib');
    integer(row, 'weight', 'AwardLib');
    awardList(row.award);
  }
  for (const row of multiplierLib.values()) {
    integer(row, 'tid', 'MultiplierLib');
    integer(row, 'num', 'MultiplierLib');
    integer(row, 'draw_lib', 'MultiplierLib');
  }
  for (const row of multiplierLibDraw.values()) {
    integer(row, 'tid', 'MultiplierLibDraw');
    integer(row, 'weight', 'MultiplierLibDraw');
    integer(row, 'multiplier', 'MultiplierLibDraw');
  }

  const result = {
    source: parsed.chunk ?? null,
    fields: decoded,
    versions,
    awardMapLib,
    awardLib,
    multiplierLib,
    multiplierLibDraw,
    awardMapLibByLib: groupByLib(awardMapLib, 'AwardMapLib'),
    awardLibByLib: groupByLib(awardLib, 'AwardLib'),
    multiplierLibByLib: groupByLib(multiplierLib, 'MultiplierLib'),
    multiplierLibDrawByLib: groupByLib(multiplierLibDraw, 'MultiplierLibDraw')
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function slotGameAwardMapForVersion(tables, version) {
  return tables?.awardMapLibByLib?.get(Number(version?.award_map_lib)) ?? [];
}

export function slotGameAwardLibRows(tables, lib) {
  return tables?.awardLibByLib?.get(Number(lib)) ?? [];
}

// MultiplierLib.num is the draw-count threshold of a multiplier stage. Sort so
// callers can pick the last stage whose threshold the role has reached.
export function slotGameMultiplierStages(tables, version) {
  const rows = tables?.multiplierLibByLib?.get(Number(version?.multiplier_lib)) ?? [];
  return [...rows].sort((left, right) => Number(left.num) - Number(right.num));
}

export function slotGameMultiplierDrawRows(tables, drawLib) {
  const rows = tables?.multiplierLibDrawByLib?.get(Number(drawLib)) ?? [];
  return [...rows].sort((left, right) => Number(left.tid) - Number(right.tid));
}

export const SLOT_GAME_ACT_TABLE_NAMES = Object.freeze(TABLES);
