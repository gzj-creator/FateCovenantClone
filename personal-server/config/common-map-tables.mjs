import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readJsonAsset, tableAsset } from '../assets.mjs';

// CommonMapTable reader for the shipped client table.
//
// Source: analysis/tmp/a1-tables-unused/CommonMapTable.data.lua.json.gz, the
// LuaJIT dump tools/extract-shipped-table.mjs takes out of 64_lua_project.bundle.
//
// What the shipped table actually holds: the shared definition rows for the
// "common map" system (buff groups, buffs, areas, box groups, boxes, mini games,
// game awards, award pools, fishing game rules, fights, keys, random keys, hide
// stories and node *classes*). CommonMap itself has a single row whose only
// column is init_pb_struct = pb_pet_play_master.
//
// What it does not hold: map layouts. CommonMapMgr.ReqInitMap first decodes the
// request body with Codec.DecodePB(gTable.CommonMap[1]:init_pb_struct(), fun_bin)
// and then hands the result to lua_handle_init_map; the grid a player walks on
// comes from RequireConfig(mapCfgFullName) (pet_play_map_01.lua and friends),
// which is a separate Lua module and not part of this table. There is therefore
// no row that says "map 1 has node (x,y) of type T", which is exactly what
// pb_common_map_init_back needs to answer.
//
// The reader keeps the real definitions available for inspection and audit but
// never invents a layout: COMMON_MAP_LAYOUT_GAP is what the service reports for
// every 90601-90603 command until map instance data shows up in evidence.
export const COMMON_MAP_LAYOUT_GAP =
  'Common map layout is unavailable: CommonMapTable ships system definitions only and map instances come from client map config modules';

const defaultPath = tableAsset('CommonMapTable.data.lua.json');
let defaultCache;

// Every sub table the shipped dump defines. A missing one is a load error, so a
// partially extracted asset cannot silently look complete.
const DEFINITION_TABLES = Object.freeze([
  'BuffGroup', 'Buff', 'Area', 'BoxGroup', 'Box', 'Game', 'GameAward', 'AwardPool',
  'FishingGame', 'Fight', 'Node', 'CommonMap', 'KeyType', 'Key', 'RandomKeyConst',
  'RandomKey', 'HideStory', 'HideStoryOption'
]);

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing common map table: ' + name);
  return table.rows;
}

function positiveInt(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(label + ' is invalid');
  return number;
}

function nonNegativeInt(value, label, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(label + ' is invalid');
  return number;
}

function awardPairs(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(label + ' is invalid');
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' is invalid');
    return [positiveInt(pair[0], label), positiveInt(pair[1], label)];
  });
}

function intList(value, label) {
  if (value === undefined || value === null || !Array.isArray(value)) return [];
  return value.map(item => positiveInt(item, label));
}

// Box group ranges ship as [[weight, boxGroupTid], ...] pairs.
function intPairs(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(label + ' is invalid');
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' is invalid');
    return [nonNegativeInt(pair[0], label), positiveInt(pair[1], label)];
  });
}

function byTid(rows, label) {
  const map = new Map();
  for (const row of rows) {
    const tid = positiveInt(row.tid, label + ' id');
    if (map.has(tid)) throw new Error(label + ' id is duplicated: ' + tid);
    map.set(tid, row);
  }
  return map;
}

function nodeDefinitions(dump) {
  const nodes = new Map();
  for (const row of rowsOf(dump, 'Node')) {
    const tid = positiveInt(row.tid, 'Common map node id');
    // Node rows are node *classes*: the client picks a CMap*Node subclass plus
    // its editor params. Coordinates are per map instance and are not here.
    nodes.set(tid, {
      tid,
      editorClass: String(row.editor_class_name ?? ''),
      luaClass: typeof row.lua_node_class === 'object' && row.lua_node_class
        ? String(row.lua_node_class.global ?? '')
        : String(row.lua_node_class ?? ''),
      triggerPb: String(row.trigger_pb ?? ''),
      isExplore: Boolean(row.is_explore),
      isEvent: Boolean(row.is_event)
    });
  }
  return nodes;
}

function mapDefinitions(dump) {
  const maps = new Map();
  for (const row of rowsOf(dump, 'CommonMap')) {
    const tid = positiveInt(row.tid, 'Common map id');
    maps.set(tid, {
      tid,
      initPbStruct: String(row.init_pb_struct ?? ''),
      // Always null: the shipped table has no instance grid to attach.
      layout: null
    });
  }
  return maps;
}

export function readCommonMapTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const resolved = file instanceof URL ? fileURLToPath(file) : String(file);
  if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.gz')) {
    const empty = { source: null, available: false, definitions: new Map(), maps: new Map() };
    if (file === defaultPath) defaultCache = empty;
    return empty;
  }
  const dump = readJsonAsset(file);
  for (const name of DEFINITION_TABLES) rowsOf(dump, name);

  const definitions = new Map([
    ['BuffGroup', byTid(rowsOf(dump, 'BuffGroup'), 'Common map buff group')],
    ['Area', byTid(rowsOf(dump, 'Area'), 'Common map area')],
    ['BoxGroup', byTid(rowsOf(dump, 'BoxGroup'), 'Common map box group')],
    ['Box', byTid(rowsOf(dump, 'Box'), 'Common map box')],
    ['Game', byTid(rowsOf(dump, 'Game'), 'Common map game')],
    ['AwardPool', byTid(rowsOf(dump, 'AwardPool'), 'Common map award pool')],
    ['KeyType', byTid(rowsOf(dump, 'KeyType'), 'Common map key type')],
    ['RandomKeyConst', byTid(rowsOf(dump, 'RandomKeyConst'), 'Common map random key constant')],
    ['RandomKey', byTid(rowsOf(dump, 'RandomKey'), 'Common map random key')],
    ['HideStory', byTid(rowsOf(dump, 'HideStory'), 'Common map hide story')],
    ['Node', nodeDefinitions(dump)]
  ]);

  const buffs = new Map();
  for (const row of rowsOf(dump, 'Buff')) {
    const tid = positiveInt(row.tid, 'Common map buff id');
    buffs.set(tid, { tid, group: positiveInt(row.group, 'Common map buff group'), attrs: awardPairs(row.attrs, 'Common map buff attribute') });
  }
  definitions.set('Buff', buffs);

  const gameAwards = new Map();
  for (const row of rowsOf(dump, 'GameAward')) {
    const tid = positiveInt(row.tid, 'Common map game award id');
    gameAwards.set(tid, {
      tid,
      // value_tid is 0 for rows that only carry a direct award list.
      valueTid: nonNegativeInt(row.value_tid, 'Common map game award value'),
      award: awardPairs(row.award_list, 'Common map game award')
    });
  }
  definitions.set('GameAward', gameAwards);

  const fights = new Map();
  for (const row of rowsOf(dump, 'Fight')) {
    const tid = positiveInt(row.tid, 'Common map fight id');
    fights.set(tid, { tid, award: awardPairs(row.award_list, 'Common map fight award') });
  }
  definitions.set('Fight', fights);

  const fishing = new Map();
  for (const row of rowsOf(dump, 'FishingGame')) {
    const tid = positiveInt(row.tid, 'Common map fishing game id');
    fishing.set(tid, { tid, speed: Number(row.speed ?? 0), pointType: Number(row.point_type ?? 0) });
  }
  definitions.set('FishingGame', fishing);

  const keys = new Map();
  for (const row of rowsOf(dump, 'Key')) {
    const tid = positiveInt(row.tid, 'Common map key id');
    keys.set(tid, { tid, consume: awardPairs(row.consume_list, 'Common map key cost') });
  }
  definitions.set('Key', keys);

  const options = new Map();
  for (const row of rowsOf(dump, 'HideStoryOption')) {
    const tid = positiveInt(row.tid, 'Common map hide story option id');
    options.set(tid, { tid, award: awardPairs(row.award_list, 'Common map hide story option') });
  }
  definitions.set('HideStoryOption', options);

  // Fold the pooled award list onto each award pool so callers can read one row.
  for (const pool of definitions.get('AwardPool').values()) pool.award = awardPairs(pool.award_list, 'Common map award pool');
  for (const group of definitions.get('BoxGroup').values()) group.libRange = intPairs(group.lib_range ?? [], 'Common map box group range');
  for (const box of definitions.get('Box').values()) box.award = awardPairs(box.award_list, 'Common map box');
  for (const story of definitions.get('HideStory').values()) story.talk = intList(story.talk, 'Common map hide story talk');
  for (const key of definitions.get('RandomKeyConst').values()) key.itemKeys = intList(key.item_keys, 'Common map random key item');

  const result = {
    source: dump.source ?? null,
    available: true,
    definitions,
    maps: mapDefinitions(dump),
    layoutAvailable: false
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function commonMapConfig(tables, mapTid) {
  if (!tables?.available) return null;
  return tables.maps.get(Number(mapTid)) ?? null;
}
