import { readJsonAsset, tableAsset } from '../assets.mjs';

// DragonLandActTable is rebuilt from the client bundle with
// tools/extract-dragon-land-table.mjs (see
// agent/workflow/gameplay-completion/PAY-DRAGONLANDACT/implementation.md).
// asset: assets/tables/DragonLandActTable.data.lua.json.gz
const defaultPath = tableAsset('DragonLandActTable.data.lua.json');
let defaultCache;

// The shipped table always carries the same sub tables. A different count means
// the extractor picked up another client build, so fail loudly instead of
// serving a half-filled activity.
const EXPECTED_ROWS = Object.freeze({
  Piece: 46,
  GetWay: 6,
  Bubble: 9,
  Damage: 16,
  Const: 1,
  DragonLandAct: 3,
  BossAward: 240,
  Boss: 60
});

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing DragonLandAct table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (table.rows.length !== expected) {
    throw new Error(`DragonLandAct table ${name} has ${table.rows.length} rows, expected ${expected}`);
  }
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

function groupBy(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const value = Number(row[field]);
    if (!Number.isSafeInteger(value)) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  }
  return map;
}

export function readDragonLandTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const versionRows = rowsOf(dump, 'DragonLandAct');
  const awardRows = rowsOf(dump, 'BossAward');
  const bossRows = rowsOf(dump, 'Boss');
  const wayRows = rowsOf(dump, 'GetWay');
  const pieceRows = rowsOf(dump, 'Piece');
  const damageRows = rowsOf(dump, 'Damage');
  const bubbleRows = rowsOf(dump, 'Bubble');
  const constRows = rowsOf(dump, 'Const');

  const awardsByVersion = groupBy(awardRows, 'version');
  for (const [version, rows] of awardsByVersion) {
    rows.sort((left, right) => Number(left.tid) - Number(right.tid));
    awardsByVersion.set(version, rows);
  }
  const bossesByVersion = groupBy(bossRows, 'version');
  const bossTidByVersionLevel = new Map();
  for (const [version, rows] of bossesByVersion) {
    rows.sort((left, right) => Number(left.level) - Number(right.level) || Number(left.tid) - Number(right.tid));
    bossesByVersion.set(version, rows);
    const byLevel = new Map();
    for (const row of rows) byLevel.set(Number(row.level), Number(row.tid));
    bossTidByVersionLevel.set(version, byLevel);
  }

  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    versions: byTid(versionRows),
    versionRows,
    awards: byTid(awardRows),
    awardRows,
    awardsByVersion,
    bosses: byTid(bossRows),
    bossRows,
    bossesByVersion,
    bossTidByVersionLevel,
    ways: byTid(wayRows),
    wayRows,
    pieces: byTid(pieceRows),
    pieceRows,
    damages: byTid(damageRows),
    damageRows,
    bubbles: byTid(bubbleRows),
    bubbleRows,
    // Const is a single row (tid 1) with the daily task and attempt limits.
    const: constRows[0] ?? null
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function dragonLandConfigForVersion(tables, version) {
  return tables?.versions?.get(Number(version)) ?? null;
}

export function dragonLandAwardsForVersion(tables, version) {
  return tables?.awardsByVersion?.get(Number(version)) ?? [];
}

export function dragonLandBossesForVersion(tables, version) {
  return tables?.bossesByVersion?.get(Number(version)) ?? [];
}

export function dragonLandAwardsForLevel(tables, version, level) {
  return dragonLandAwardsForVersion(tables, version)
    .filter(row => Number(row.level) === Number(level));
}
