import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('LinearLevelTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze(['Box', 'Fight', 'Type']);
const EXPECTED_COUNTS = Object.freeze({ Box: 80, Fight: 1600, Type: 4 });
const SOURCE_SHA256 = '33dadbc43e87fe18eed847a44e1ee9f4cd3533fb84572b80b0c63d45f7f22ecc';

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid LinearLevel ${label}: ${value}`);
  }
  return number;
}

function awards(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`LinearLevel ${label} is empty`);
  return Object.freeze(value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`LinearLevel ${label}[${index}] is malformed`);
    return Object.freeze([
      integer(pair[0], `${label}[${index}].tid`, { min: 1 }),
      integer(pair[1], `${label}[${index}].count`, { min: 1 })
    ]);
  }));
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map) || table.size !== expected) {
    throw new Error(`LinearLevel ${label} expected ${expected} rows, got ${table?.size ?? 0}`);
  }
  const rows = new Map();
  for (const [key, raw] of table) {
    const tid = integer(raw?.tid ?? key, `${label}.tid`, { min: 1 });
    if (rows.has(tid)) throw new Error(`LinearLevel ${label} duplicates tid ${tid}`);
    rows.set(tid, Object.freeze({ ...raw, tid }));
  }
  return rows;
}

export function readLinearLevelTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const raw = readGeneratedTables(file, FAMILIES);
  const rows = {};
  for (const family of FAMILIES) rows[family] = freezeRows(raw[family], family, EXPECTED_COUNTS[family]);

  const boxesByType = new Map();
  for (const type of rows.Type.values()) {
    if (type.tid < 1 || type.tid > 4) throw new Error(`LinearLevel Type ${type.tid} is outside 1..4`);
    integer(type.fun_open, `Type.${type.tid}.fun_open`);
    boxesByType.set(type.tid, new Map());
  }
  for (const rawBox of rows.Box.values()) {
    const type = integer(rawBox.type, `Box.${rawBox.tid}.type`, { min: 1, max: 4 });
    if (!boxesByType.has(type)) throw new Error(`LinearLevel Box ${rawBox.tid} references unknown type ${type}`);
    const index = rawBox.tid % 100000;
    if (!Number.isSafeInteger(index) || index <= 0) throw new Error(`LinearLevel Box ${rawBox.tid} has invalid client index`);
    const passFight = integer(rawBox.pass_fight, `Box.${rawBox.tid}.pass_fight`, { min: 1 });
    const box = Object.freeze({ ...rawBox, type, index, pass_fight: passFight, award: awards(rawBox.award, `Box.${rawBox.tid}.award`) });
    boxesByType.get(type).set(index, box);
  }
  for (const [type, boxes] of boxesByType) {
    if (boxes.size !== 20) throw new Error(`LinearLevel type ${type} expected 20 boxes, got ${boxes.size}`);
  }

  for (const fight of rows.Fight.values()) {
    const type = integer(fight.type, `Fight.${fight.tid}.type`, { min: 1, max: 4 });
    if (!rows.Type.has(type)) throw new Error(`LinearLevel Fight ${fight.tid} references unknown type ${type}`);
    integer(fight.fight_id, `Fight.${fight.tid}.fight_id`, { min: 1 });
  }

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '3582522091083901000-LinearLevelTable.data.lua.bin',
      sha256: SOURCE_SHA256
    }),
    counts: EXPECTED_COUNTS,
    rows,
    boxesByType,
    typeConfig(type) { return rows.Type.get(Number(type)) ?? null; },
    boxFor(type, index) { return boxesByType.get(Number(type))?.get(Number(index)) ?? null; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export {
  EXPECTED_COUNTS as LINEAR_LEVEL_EXPECTED_COUNTS,
  FAMILIES as LINEAR_LEVEL_FAMILIES,
  SOURCE_SHA256 as LINEAR_LEVEL_SOURCE_SHA256
};
