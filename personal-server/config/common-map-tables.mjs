import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readJsonAsset, tableAsset } from '../assets.mjs';

// CommonMapCmd config reader.
//
// The client ships CommonMapTable inside the Lua project bundle; the table has
// not been extracted into personal-server/assets/tables yet, so this reader
// reports availability instead of inventing rows. The service turns an
// unavailable table into an explicit GameError for every command, which is the
// fail-closed contract for BATTLE-COMMONMAP.
const defaultPath = tableAsset('CommonMapTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing common map table: ' + name);
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

function awardPairs(row, label) {
  const pairs = Array.isArray(row?.award) ? row.award : [];
  return pairs.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

// Node rows keep the evidenced pb_common_map_node fields (x, y, type, db_data,
// cfg_data) plus the local settlement inputs: fight (enemy Npc tids), award,
// need (prerequisite node index) and repeat (sweep allowed).
function nodesOf(row, label) {
  const nodes = Array.isArray(row?.nodes) ? row.nodes : [];
  return nodes.map((node, index) => {
    const x = Number(node.x ?? 0), y = Number(node.y ?? 0);
    if (!Number.isSafeInteger(x) || x < 0 || !Number.isSafeInteger(y) || y < 0) {
      throw new Error(label + ' node coordinate is invalid');
    }
    const enemies = Array.isArray(node.fight) ? node.fight.map(Number) : [];
    if (enemies.some(tid => !Number.isSafeInteger(tid) || tid <= 0) || enemies.length > 6) {
      throw new Error(label + ' node fight configuration is invalid');
    }
    return {
      index,
      x, y,
      type: Number(node.type ?? 0),
      isLine: Boolean(node.is_line),
      dbData: Number(node.db_data ?? 0),
      cfgData: Number(node.cfg_data ?? 0),
      enemies,
      award: awardPairs(node, label + ' node'),
      need: Number.isSafeInteger(Number(node.need)) ? Number(node.need) : -1,
      repeat: node.repeat === undefined ? true : Boolean(node.repeat),
      buffs: Array.isArray(node.buff) ? node.buff.map(Number).filter(Number.isSafeInteger) : []
    };
  });
}

export function readCommonMapTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const resolved = file instanceof URL ? fileURLToPath(file) : String(file);
  if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.gz')) {
    const empty = { source: null, available: false, maps: new Map(), nodes: new Map() };
    if (file === defaultPath) defaultCache = empty;
    return empty;
  }
  const dump = readJsonAsset(file);
  const mapRows = byTid(rowsOf(dump, 'CommonMap'));
  const maps = new Map();
  for (const [tid, row] of mapRows) {
    const nodes = nodesOf(row, 'Common map ' + tid);
    maps.set(tid, { tid, x: Number(row.x ?? 0), y: Number(row.y ?? 0), nodes });
  }
  const result = {
    source: dump.source ?? null,
    available: true,
    maps,
    nodes: byTid(rowsOf(dump, 'CommonMapNode'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function commonMapConfig(tables, mapTid) {
  if (!tables?.available) return null;
  return tables.maps.get(Number(mapTid)) ?? null;
}
