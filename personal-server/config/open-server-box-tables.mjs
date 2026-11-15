import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('OpenServerBoxTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze([
  'OpenServerBox',
  'OpenServerProgress',
  'Version',
  'Icon',
  'Const'
]);
const EXPECTED_COUNTS = Object.freeze({
  OpenServerBox: 120,
  OpenServerProgress: 20,
  Version: 4,
  Icon: 4,
  Const: 1
});
const SOURCE_SHA256 = '76b425229956d285a62726a9d2dc8888e205d2b142c54b614c0e75c57f0172e0';

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid OpenServerBox ${label}: ${value}`);
  }
  return number;
}

function awards(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`OpenServerBox ${label} is invalid`);
  }
  return Object.freeze(value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`OpenServerBox ${label}[${index}] is malformed`);
    return Object.freeze([
      integer(pair[0], `${label}[${index}].tid`, { min: 1 }),
      integer(pair[1], `${label}[${index}].count`, { min: 1 })
    ]);
  }));
}

function rowsFor(table, label, expected) {
  if (!(table instanceof Map) || table.size !== expected) {
    throw new Error(`OpenServerBox ${label} expected ${expected} rows, got ${table?.size ?? 0}`);
  }
  const rows = new Map();
  for (const [key, raw] of table) {
    const tid = integer(raw?.tid ?? key, `${label}.tid`, { min: 0 });
    if (rows.has(tid)) throw new Error(`OpenServerBox ${label} duplicates tid ${tid}`);
    rows.set(tid, Object.freeze({ ...raw, tid }));
  }
  return rows;
}

function generatedFamilies(file) {
  const dump = readJsonAsset(file);
  if (dump?.families) {
    if (dump.sha256 !== SOURCE_SHA256) {
      throw new Error('OpenServerBox source SHA256 does not match the recovered client table');
    }
    const tables = {};
    for (const name of FAMILIES) {
      const family = dump.families[name];
      if (!family || !Array.isArray(family.rows)) {
        throw new Error(`OpenServerBox generated family ${name} is missing`);
      }
      const rows = family.rows.map(row => {
        if (!Array.isArray(row)) return row;
        if (!Array.isArray(family.fields)) {
          throw new Error(`OpenServerBox generated family ${name} has array rows without fields`);
        }
        return Object.fromEntries(family.fields.map((field, index) => [field, row[index]]));
      });
      tables[name] = new Map(rows.map((row, index) => [Number(row?.tid ?? index + 1), row]));
    }
    return tables;
  }
  return readGeneratedTables(file, FAMILIES);
}

export function readOpenServerBoxTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const raw = generatedFamilies(file);
  const rows = {};
  for (const family of FAMILIES) rows[family] = rowsFor(raw[family], family, EXPECTED_COUNTS[family]);

  // The shipped day-index relationship is direct: version 0 has tids 1..30,
  // version 1 has 101..130 and so on. Validate it rather than deriving it from
  // row order, which would hide a malformed table.
  const boxesByVersion = new Map();
  for (const rawBox of rows.OpenServerBox.values()) {
    const version = integer(rawBox.version, `OpenServerBox.${rawBox.tid}.version`, { min: 0, max: 3 });
    const index = rawBox.tid - version * 100;
    if (index < 1 || index > 30) throw new Error(`OpenServerBox.${rawBox.tid} has an invalid day index`);
    const row = Object.freeze({
      ...rawBox,
      version,
      index,
      award: awards([[rawBox.award, rawBox.award_count]], `OpenServerBox.${rawBox.tid}.award`),
      recharge_award: rawBox.recharge_award
        ? awards([[rawBox.recharge_award, rawBox.recharge_award_count]], `OpenServerBox.${rawBox.tid}.recharge_award`)
        : Object.freeze([]),
      recharge_award_show: integer(rawBox.recharge_award_show, `OpenServerBox.${rawBox.tid}.recharge_award_show`),
      is_special: Boolean(rawBox.is_special)
    });
    if (!boxesByVersion.has(version)) boxesByVersion.set(version, new Map());
    if (boxesByVersion.get(version).has(index)) throw new Error(`OpenServerBox version ${version} duplicates day ${index}`);
    boxesByVersion.get(version).set(index, row);
  }
  for (const [version, boxes] of boxesByVersion) {
    if (boxes.size !== 30) throw new Error(`OpenServerBox version ${version} expected 30 days, got ${boxes.size}`);
    for (let index = 1; index <= 30; index += 1) if (!boxes.has(index)) throw new Error(`OpenServerBox version ${version} misses day ${index}`);
  }

  const progressByVersion = new Map();
  for (const rawProgress of rows.OpenServerProgress.values()) {
    const version = integer(rawProgress.version, `OpenServerProgress.${rawProgress.tid}.version`, { min: 0, max: 3 });
    const index = rawProgress.tid - version * 100 - 1;
    if (index < 0 || index > 4) throw new Error(`OpenServerProgress.${rawProgress.tid} has an invalid progress index`);
    const row = Object.freeze({
      ...rawProgress,
      version,
      index,
      need_progress: integer(rawProgress.need_progress, `OpenServerProgress.${rawProgress.tid}.need_progress`, { min: 1, max: 30 }),
      award: awards(rawProgress.award, `OpenServerProgress.${rawProgress.tid}.award`)
    });
    if (!progressByVersion.has(version)) progressByVersion.set(version, new Map());
    if (progressByVersion.get(version).has(index)) throw new Error(`OpenServerProgress version ${version} duplicates index ${index}`);
    progressByVersion.get(version).set(index, row);
  }
  const expectedThresholds = [7, 13, 19, 25, 30];
  for (const [version, progress] of progressByVersion) {
    if (progress.size !== 5) throw new Error(`OpenServerProgress version ${version} expected 5 rows`);
    for (let index = 0; index < expectedThresholds.length; index += 1) {
      const row = progress.get(index);
      if (!row || row.need_progress !== expectedThresholds[index]) throw new Error(`OpenServerProgress version ${version} has an invalid threshold at ${index}`);
    }
  }

  for (const version of rows.Version.values()) {
    integer(version.tid, `Version.${version.tid}.tid`, { min: 0, max: 3 });
    integer(version.join_day, `Version.${version.tid}.join_day`, { min: 1 });
    integer(version.get_cond, `Version.${version.tid}.get_cond`, { min: 0 });
    integer(version.recharge, `Version.${version.tid}.recharge`, { min: 0 });
    if (!boxesByVersion.has(version.tid) || !progressByVersion.has(version.tid)) throw new Error(`OpenServerBox version ${version.tid} has no rewards`);
  }
  for (let version = 0; version <= 3; version += 1) if (!rows.Version.has(version)) throw new Error(`OpenServerBox Version misses ${version}`);

  const constant = rows.Const.get(1);
  if (!constant) throw new Error('OpenServerBox Const.1 is missing');
  integer(constant.check_day, 'Const.1.check_day', { min: 1 });

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '11487745937931702000-OpenServerBoxTable.data.lua.bin',
      sha256: SOURCE_SHA256
    }),
    counts: EXPECTED_COUNTS,
    rows,
    boxesByVersion,
    progressByVersion,
    boxesFor(version) { return boxesByVersion.get(Number(version)) ?? new Map(); },
    progressFor(version) { return progressByVersion.get(Number(version)) ?? new Map(); },
    versionConfig(version) { return rows.Version.get(Number(version)) ?? null; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export {
  EXPECTED_COUNTS as OPEN_SERVER_BOX_EXPECTED_COUNTS,
  FAMILIES as OPEN_SERVER_BOX_FAMILIES,
  SOURCE_SHA256 as OPEN_SERVER_BOX_SOURCE_SHA256
};
