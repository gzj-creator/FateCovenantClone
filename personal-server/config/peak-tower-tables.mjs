import { readJsonAsset, tableAsset } from '../assets.mjs';

// PeakTowerTable is extracted from the client table bundle by
// tools/extract-peak-tower-table.mjs (see
// agent/workflow/gameplay-completion/BATTLE-PEAKTOWER/implementation.md).
// asset: assets/tables/PeakTowerTable.data.lua.json.gz
const defaultPath = tableAsset('PeakTowerTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing PeakTower table: ' + name);
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

function awardPairs(ids, counts, label) {
  const list = Array.isArray(ids) ? ids : [];
  const amounts = Array.isArray(counts) ? counts : [];
  if (!list.length) return [];
  if (list.length !== amounts.length) throw new Error(label + ' reward configuration is invalid');
  return list.map((id, index) => {
    const tid = Number(id), count = Number(amounts[index]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

export function readPeakTowerTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const layers = byTid(rowsOf(dump, 'PeakTower'));
  const types = byTid(rowsOf(dump, 'Type'));
  const globals = rowsOf(dump, 'Global');
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    global: globals[0] ?? null,
    layers,
    types,
    shop: byTid(rowsOf(dump, 'Shop')),
    layerRanges: byTid(rowsOf(dump, 'LayerRange')),
    specialAwards: byTid(rowsOf(dump, 'PeakSpecialAward')),
    diffRank: byTid(rowsOf(dump, 'DiffRank')),
    diffRankAttr: byTid(rowsOf(dump, 'DiffRankAttr')),
    stages: byTid(rowsOf(dump, 'Stage')),
    showAwards: byTid(rowsOf(dump, 'ShowAward'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function peakTowerMaxLayer(tables) {
  let max = 0;
  for (const tid of tables.layers.keys()) if (tid > max) max = tid;
  return max;
}

export function peakTowerLayer(tables, layer) {
  return tables.layers.get(Number(layer)) ?? null;
}

// PeakTower.pass_award / pass_award_n hold the configured clear reward of the layer.
export function peakTowerLayerAwards(row) {
  return awardPairs(row?.pass_award, row?.pass_award_n, 'Peak tower layer');
}

export function peakTowerTypeForLayer(tables, layer) {
  const value = Number(layer);
  for (const row of tables.types.values()) {
    const range = Array.isArray(row.layer_range) ? row.layer_range : null;
    if (!range || range.length !== 2) continue;
    const [from, to] = range.map(Number);
    if (Number.isSafeInteger(from) && Number.isSafeInteger(to) && value >= from && value <= to) return row;
  }
  return null;
}

export function peakTowerTypeAwards(row) {
  const awards = Array.isArray(row?.award) ? row.award : [];
  return awards.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error('Peak tower type reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error('Peak tower type reward configuration is invalid');
    }
    return [tid, count];
  });
}

export function peakTowerSpecialAward(row) {
  const list = Array.isArray(row?.award) ? row.award : [];
  return list.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error('Peak tower achievement reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error('Peak tower achievement reward configuration is invalid');
    }
    return [tid, count];
  });
}
