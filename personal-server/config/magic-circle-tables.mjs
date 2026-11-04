import { readGeneratedDump } from './hero-tables.mjs';
import { readAssetBytes, tableAsset } from '../assets.mjs';
import { parseLuaJit } from '../protocol/lua-jit-dump.mjs';

const defaultPath = tableAsset('15935513698146724000-MagicCircleTable.data.lua.bin');
let defaultCache;

function requireMap(tables, name, expectedSize) {
  const table = tables[name];
  if (!(table instanceof Map) || table.size !== expectedSize) {
    throw new Error(`Magic-circle configuration ${name} has an unexpected shape`);
  }
  return table;
}

function validate(tables) {
  const constant = tables.Const.get(1);
  if (!constant) throw new Error('Magic-circle constant row is missing');
  for (const field of ['level_up_item', 'max_star', 'max_level', 'max_point_count', 'break_level_interval']) {
    if (!Number.isSafeInteger(Number(constant[field])) || Number(constant[field]) <= 0) {
      throw new Error(`Magic-circle constant ${field} is invalid`);
    }
  }
  const circleIds = [...tables.MagicCircle.keys()].map(Number).sort((left, right) => left - right);
  if (circleIds.some((id, index) => id !== index + 1)) throw new Error('Magic-circle ids are not contiguous from one');
  const maxLevel = Number(constant.max_level);
  const maxStar = Number(constant.max_star);
  const maxPointCount = Number(constant.max_point_count);
  let maxPointLevel = 0;
  for (const id of circleIds) {
    for (let level = 0; level <= maxLevel; level++) {
      const row = tables.Level.get(id * 1000 + level);
      if (!row || !Number.isSafeInteger(Number(row.point_level))) throw new Error(`Magic-circle level row ${id}:${level} is missing`);
      maxPointLevel = Math.max(maxPointLevel, Number(row.point_level));
    }
    for (let step = 1; step <= maxStar; step++) {
      if (!tables.BreakLevel.get(id * 1000 + step)) throw new Error(`Magic-circle breakthrough row ${id}:${step} is missing`);
      if (!tables.Star.get(id * 1000 + step)) throw new Error(`Magic-circle star row ${id}:${step} is missing`);
    }
  }
  for (let point = 1; point <= maxPointCount; point++) {
    for (let pointLevel = 1; pointLevel <= maxPointLevel; pointLevel++) {
      if (!tables.PointLevel.get(point * 1000 + pointLevel)) throw new Error(`Magic-circle point row ${point}:${pointLevel} is missing`);
    }
  }
  return { constant, circleIds, maxPointLevel };
}

export function readMagicCircleTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = parseLuaJit(readAssetBytes(file));
  const tables = readGeneratedDump(dump, ['Const', 'MagicCircle', 'Level', 'Star', 'BreakLevel', 'PointLevel']);
  requireMap(tables, 'Const', 1);
  requireMap(tables, 'MagicCircle', 5);
  requireMap(tables, 'Level', 405);
  requireMap(tables, 'Star', 40);
  requireMap(tables, 'BreakLevel', 40);
  requireMap(tables, 'PointLevel', 32);
  const { constant, circleIds, maxPointLevel } = validate(tables);
  const result = {
    constant,
    circles: tables.MagicCircle,
    circleIds,
    levels: tables.Level,
    stars: tables.Star,
    breaks: tables.BreakLevel,
    points: tables.PointLevel,
    maxPointLevel
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}
