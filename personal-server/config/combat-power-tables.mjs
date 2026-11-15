import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('CombatPowerTable.rows.json.gz');
const EXPECTED_BREAK_ROWS = 24;
let defaultCache;

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`Invalid CombatPower table ${label}`);
  }
  return number;
}

function awardsFor(value, tid) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`CombatPower CPBreak.${tid}.award is empty or malformed`);
  }
  return Object.freeze(value.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) {
      throw new Error(`CombatPower CPBreak.${tid}.award contains a malformed row`);
    }
    return Object.freeze([
      positiveInteger(entry[0], `CPBreak.${tid}.award tid`),
      positiveInteger(entry[1], `CPBreak.${tid}.award num`)
    ]);
  }));
}

export function readCombatPowerTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const raw = readGeneratedTables(file, ['CPBreak']);
  const source = raw.CPBreak;
  if (!(source instanceof Map) || source.size !== EXPECTED_BREAK_ROWS) {
    throw new Error(`CombatPower CPBreak has ${source?.size ?? 0} rows; expected ${EXPECTED_BREAK_ROWS}`);
  }

  const rows = new Map();
  let previousBreak = 0;
  for (let tid = 1; tid <= EXPECTED_BREAK_ROWS; tid += 1) {
    const row = source.get(tid);
    if (!row || Number(row.tid) !== tid) {
      throw new Error(`CombatPower CPBreak is missing contiguous tid ${tid}`);
    }
    const breakValue = positiveInteger(row.break_value, `CPBreak.${tid}.break_value`);
    if (breakValue <= previousBreak) {
      throw new Error(`CombatPower CPBreak.${tid}.break_value is not increasing`);
    }
    previousBreak = breakValue;
    const group = positiveInteger(row.group, `CPBreak.${tid}.group`);
    if (group !== Math.floor((tid - 1) / 4) + 1) {
      throw new Error(`CombatPower CPBreak.${tid}.group does not follow its recovered four-row grouping`);
    }
    if (typeof row.special !== 'boolean') {
      throw new Error(`CombatPower CPBreak.${tid}.special is malformed`);
    }
    rows.set(tid, Object.freeze({
      tid,
      breakValue,
      award: awardsFor(row.award, tid),
      group,
      special: row.special,
      sourceRow: row
    }));
  }

  const result = Object.freeze({
    source: file instanceof URL ? file.pathname.split('/').pop() : String(file),
    counts: Object.freeze({ CPBreak: EXPECTED_BREAK_ROWS }),
    rows,
    maxTid: EXPECTED_BREAK_ROWS,
    entryFor(tid) {
      const value = Number(tid);
      return Number.isSafeInteger(value) ? rows.get(value) ?? null : null;
    }
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}

export { EXPECTED_BREAK_ROWS };
