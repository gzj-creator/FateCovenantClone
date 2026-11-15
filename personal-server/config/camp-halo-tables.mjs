import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultCampHaloPath = tableAsset('CampHaloTable.data.json.gz');
const defaultBondPath = tableAsset('HeroBlazonBondTable.data.json.gz');
let defaultCache;

const CAMP_ORDER = Object.freeze([1, 2, 3, 4, 9]);
const LEVEL_THRESHOLDS = Object.freeze([0, 400, 800, 1500]);
const BOND_GROUP_OFFSET = 100;
const UNLOCK_PREFIX = '546626500';

const EXPECTED_COUNTS = Object.freeze({
  HeroCampHalo: 5,
  HeroCampHaloAttr: 20,
  BondAttr: 3200,
  BondGroup: 128,
  Chapter: 4
});

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid CampHalo table ${label}`);
  }
  return number;
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map)) throw new Error(`CampHalo table ${label} is missing`);
  if (table.size !== expected) throw new Error(`CampHalo table ${label} has ${table.size} rows; expected ${expected}`);
  const rows = new Map([...table].map(([key, value]) => [
    integer(value?.tid ?? key, `${label}.tid`, { min: 1 }),
    Object.freeze({ ...value, tid: integer(value?.tid ?? key, `${label}.tid`, { min: 1 }) })
  ]));
  if (rows.size !== expected) throw new Error(`CampHalo table ${label} has duplicate tids`);
  return rows;
}

function unlockScript(camp, level) {
  return Number(`${UNLOCK_PREFIX}${camp * 100 + level}`);
}

export function readCampHaloTables(campFile = defaultCampHaloPath, bondFile = defaultBondPath) {
  if (campFile === defaultCampHaloPath && bondFile === defaultBondPath && defaultCache) return defaultCache;

  const campRaw = readGeneratedTables(campFile, ['HeroCampHalo', 'HeroCampHaloAttr']);
  const bondRaw = readGeneratedTables(bondFile, ['BondAttr', 'BondGroup', 'Chapter']);
  const heroCampHalo = freezeRows(campRaw.HeroCampHalo, 'HeroCampHalo', EXPECTED_COUNTS.HeroCampHalo);
  const heroCampHaloAttr = freezeRows(campRaw.HeroCampHaloAttr, 'HeroCampHaloAttr', EXPECTED_COUNTS.HeroCampHaloAttr);
  const bondAttr = freezeRows(bondRaw.BondAttr, 'BondAttr', EXPECTED_COUNTS.BondAttr);
  const bondGroup = freezeRows(bondRaw.BondGroup, 'BondGroup', EXPECTED_COUNTS.BondGroup);
  const chapter = freezeRows(bondRaw.Chapter, 'Chapter', EXPECTED_COUNTS.Chapter);

  const actualCamps = [...heroCampHalo.keys()].sort((left, right) => left - right);
  if (actualCamps.length !== CAMP_ORDER.length || actualCamps.some((camp, index) => camp !== CAMP_ORDER[index])) {
    throw new Error(`CampHalo camps ${actualCamps.join(',')} do not match ${CAMP_ORDER.join(',')}`);
  }

  const levelKeys = new Set();
  const levelsByCamp = new Map(CAMP_ORDER.map(camp => [camp, []]));
  for (const row of heroCampHaloAttr.values()) {
    const camp = integer(row.camp, `HeroCampHaloAttr.${row.tid}.camp`, { min: 1 });
    if (!CAMP_ORDER.includes(camp)) throw new Error(`CampHalo attr row ${row.tid} has an unsupported camp`);
    const tid = integer(row.tid, 'HeroCampHaloAttr.tid', { min: 1 });
    const level = tid - camp * 100;
    if (!Number.isInteger(level) || level < 0 || level >= LEVEL_THRESHOLDS.length || tid !== camp * 100 + level) {
      throw new Error(`CampHalo attr row ${tid} is not camp*100+level`);
    }
    if (levelKeys.has(tid)) throw new Error(`CampHalo attr key ${tid} is duplicated`);
    const unlockParam = integer(row.unlock_param, `HeroCampHaloAttr.${tid}.unlock_param`);
    if (unlockParam !== LEVEL_THRESHOLDS[level]) {
      throw new Error(`CampHalo attr row ${tid} has unexpected unlock_param ${unlockParam}`);
    }
    const expectedUnlock = level === 0 ? null : unlockScript(camp, level);
    const rowUnlock = row.unlock == null || row.unlock === '' ? null : integer(row.unlock, `HeroCampHaloAttr.${tid}.unlock`, { min: 1 });
    if (rowUnlock !== expectedUnlock) {
      throw new Error(`CampHalo attr row ${tid} has unexpected unlock script ${rowUnlock}`);
    }
    integer(row.active_num, `HeroCampHaloAttr.${tid}.active_num`);
    levelKeys.add(tid);
    levelsByCamp.get(camp)[level] = Object.freeze({
      tid,
      camp,
      level,
      threshold: unlockParam,
      unlockScript: rowUnlock,
      row
    });
  }
  if (levelKeys.size !== EXPECTED_COUNTS.HeroCampHaloAttr) throw new Error('CampHalo attr levels are incomplete');

  const campuses = new Set();
  for (const row of chapter.values()) {
    const tid = integer(row.tid, `Chapter.${row.tid}.tid`, { min: 1 });
    const campus = integer(row.campus, `Chapter.${tid}.campus`, { min: 1, max: 4 });
    if (tid !== campus || campuses.has(campus)) throw new Error(`Chapter ${tid} has an invalid campus mapping`);
    campuses.add(campus);
  }
  if (campuses.size !== 4) throw new Error('Chapter does not cover all four campuses');

  for (const row of bondGroup.values()) {
    integer(row.campus, `BondGroup.${row.tid}.campus`, { min: 1, max: 4 });
  }
  for (const row of bondAttr.values()) {
    const tid = integer(row.tid, 'BondAttr.tid', { min: BOND_GROUP_OFFSET + 1 });
    const groupTid = Math.floor(tid / BOND_GROUP_OFFSET);
    if (!bondGroup.has(groupTid)) throw new Error(`BondAttr ${tid} references missing group ${groupTid}`);
    integer(row.chart_value, `BondAttr.${tid}.chart_value`);
  }

  const campRows = new Map();
  for (const camp of CAMP_ORDER) {
    const levels = Object.freeze([...levelsByCamp.get(camp)]);
    if (levels.length !== LEVEL_THRESHOLDS.length || levels.some((row, level) => !row || row.level !== level)) {
      throw new Error(`CampHalo camp ${camp} does not contain levels 0..3`);
    }
    campRows.set(camp, Object.freeze({ camp, levels }));
  }

  const result = Object.freeze({
    source: {
      campHalo: campFile instanceof URL ? campFile.pathname.split('/').pop() : String(campFile),
      bonds: bondFile instanceof URL ? bondFile.pathname.split('/').pop() : String(bondFile)
    },
    counts: EXPECTED_COUNTS,
    campOrder: CAMP_ORDER,
    levelThresholds: LEVEL_THRESHOLDS,
    campRows,
    levelRows: heroCampHaloAttr,
    bondAttr,
    bondGroup,
    chapter,
    thresholdsForCamp(camp) {
      const config = campRows.get(Number(camp));
      return config ? config.levels.map(row => row.threshold) : null;
    },
    requiredCampuses(camp) {
      const value = Number(camp);
      if (!campRows.has(value)) return null;
      return value === 9 ? Object.freeze([1, 2, 3, 4]) : Object.freeze([value]);
    },
    entryFor(camp, level) {
      const value = Number(level);
      if (!Number.isInteger(value) || value < 0 || value >= LEVEL_THRESHOLDS.length) return null;
      return campRows.get(Number(camp))?.levels[value] ?? null;
    },
    groupForBondTid(tid) {
      const value = Number(tid);
      if (!Number.isSafeInteger(value) || value <= BOND_GROUP_OFFSET) return null;
      return bondGroup.get(Math.floor(value / BOND_GROUP_OFFSET)) ?? null;
    },
    bondForTid(tid) {
      return bondAttr.get(Number(tid)) ?? null;
    }
  });
  if (campFile === defaultCampHaloPath && bondFile === defaultBondPath) defaultCache = result;
  return result;
}

export { CAMP_ORDER, LEVEL_THRESHOLDS };
