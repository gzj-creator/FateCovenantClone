import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('IntelliTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze([
  'Type', 'Refresh', 'Quality', 'Award', 'AwardType', 'Const', 'Intelli'
]);

const EXPECTED_COUNTS = Object.freeze({
  Type: 8,
  Refresh: 41,
  Quality: 4,
  Award: 164,
  AwardType: 4,
  Const: 1,
  Intelli: 24
});

// IntelliMgr reads these columns from IntelliTable.Intelli. The shipped data
// family contains only the four columns below, so these gameplay fields cannot
// be reconstructed from that file without inventing values.
export const INTELLI_PRESENT_COLUMNS = Object.freeze([
  'tid', 'quality', 'show_name', 'des_id'
]);
export const INTELLI_REQUIRED_GAMEPLAY_COLUMNS = Object.freeze([
  'award', 'award_n', 'hero_star', 'hero_quality', 'conditions'
]);

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid Intelli ${label}: ${value}`);
  }
  return number;
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map)) throw new Error(`Intelli ${label} is missing`);
  if (table.size !== expected) {
    throw new Error(`Intelli ${label} has ${table.size} rows; expected ${expected}`);
  }
  const rows = new Map();
  for (const [key, value] of table) {
    const tid = integer(value?.tid ?? key, `${label}.tid`, { min: 1 });
    if (rows.has(tid)) throw new Error(`Intelli ${label} has duplicate tid ${tid}`);
    rows.set(tid, Object.freeze({ ...value, tid }));
  }
  return rows;
}

function assertNoGameplayColumns(rows) {
  for (const row of rows.values()) {
    for (const column of INTELLI_REQUIRED_GAMEPLAY_COLUMNS) {
      if (Object.hasOwn(row, column)) {
        throw new Error(`Intelli.Intelli.${row.tid} unexpectedly gained unproven column ${column}`);
      }
    }
  }
}

export function readIntelliTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const raw = readGeneratedTables(file, FAMILIES);
  const rows = {};
  for (const name of FAMILIES) rows[name] = freezeRows(raw[name], name, EXPECTED_COUNTS[name]);

  for (let tid = 1; tid <= EXPECTED_COUNTS.Type; tid += 1) {
    const row = rows.Type.get(tid);
    if (!row) throw new Error(`Intelli.Type is missing tid ${tid}`);
    integer(row.unlock, `Type.${tid}.unlock`, { min: 1 });
    if (!Array.isArray(row.unlock_params) || row.unlock_params.length !== 1
      || integer(row.unlock_params[0], `Type.${tid}.unlock_params[0]`, { min: 1 }) !== 3) {
      throw new Error(`Intelli.Type.${tid}.unlock_params changed unexpectedly`);
    }
  }

  for (let tid = 1; tid <= EXPECTED_COUNTS.Refresh; tid += 1) {
    const row = rows.Refresh.get(tid);
    if (!row) throw new Error(`Intelli.Refresh is missing tid ${tid}`);
    if (integer(row.star_limit, `Refresh.${tid}.star_limit`) !== tid - 1) {
      throw new Error(`Intelli.Refresh.${tid}.star_limit changed unexpectedly`);
    }
    if (!rows.Quality.has(integer(row.quality, `Refresh.${tid}.quality`, { min: 1 }))) {
      throw new Error(`Intelli.Refresh.${tid} references an unknown Quality row`);
    }
  }

  for (const row of rows.Quality.values()) {
    if (integer(row.finish_time, `Quality.${row.tid}.finish_time`, { min: 1 }) !== 7200) {
      throw new Error(`Intelli.Quality.${row.tid}.finish_time changed unexpectedly`);
    }
    integer(row.quality_property, `Quality.${row.tid}.quality_property`, { min: 1 });
  }

  for (let family = 1; family <= 4; family += 1) {
    for (let index = 1; index <= 4; index += 1) {
      const tid = family * 100 + index;
      if (!rows.Award.has(tid)) throw new Error(`Intelli.Award is missing tid ${tid}`);
    }
  }
  for (const row of rows.Award.values()) {
    integer(row.fixed_award_n, `Award.${row.tid}.fixed_award_n`, { min: 1 });
    integer(row.extra_award_n, `Award.${row.tid}.extra_award_n`, { min: 1 });
  }
  for (const row of rows.AwardType.values()) {
    integer(row.award, `AwardType.${row.tid}.award`, { min: 1 });
    integer(row.weight, `AwardType.${row.tid}.weight`, { min: 1 });
  }

  assertNoGameplayColumns(rows.Intelli);

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '16322518041393162000-IntelliTable.data.lua.bin',
      sha256: 'FCDA2236764D048EF111223C2A7F057221E822F4C546850185BB66907E3E19A9'
    }),
    counts: EXPECTED_COUNTS,
    rows,
    gameplayColumnsMissing: INTELLI_REQUIRED_GAMEPLAY_COLUMNS,
    gameplayReady: false,
    gameplayBlockers: Object.freeze([
      'Intelli rows omit award, award_n, hero_star, hero_quality and conditions',
      'MethodScript.data.lua.bin registers only MethodTable.Method and MethodTable.DynamicArgs, so the Type.unlock scripts cannot be evaluated',
      'Campsite feature/place eligibility and hero selection authority are not recovered',
      'Refresh/day rollover and finish-to-claim transition are not recovered'
    ]),
    typeForTid(tid) { return rows.Type.get(Number(tid)) ?? null; },
    refreshForStarLimit(limit) {
      return [...rows.Refresh.values()].find(row => row.star_limit === Number(limit)) ?? null;
    },
    qualityForTid(tid) { return rows.Quality.get(Number(tid)) ?? null; },
    intelliForTid(tid) { return rows.Intelli.get(Number(tid)) ?? null; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export { EXPECTED_COUNTS, FAMILIES };
