import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('LineupSnapshotTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze(['Const', 'RobotLineup']);

const EXPECTED_COUNTS = Object.freeze({ Const: 1, RobotLineup: 2 });

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid LineupSnapshot ${label}: ${value}`);
  }
  return number;
}

// The client only ever reads these tables (LineupSnapshotMgr:ParseRobotId uses
// RobotTable/CustomRobotFigure and LineupSnapshotMgr:UpdateLineupSnapshot falls
// back to RobotLineup for a local preview). Nothing above the wire writes a
// pb_lineup_snapshot, so the tables alone never authorise a server snapshot.
export const LINEUP_SNAPSHOT_PRODUCER_BLOCKERS = Object.freeze([
  'The writer of pb_lineup_snapshot (role_id/day/power key, lineup, hero_list, hero_attr) is not recovered',
  'Reference counting (pb_lineup_snapshot.reference) and its cleanup contract are not recovered',
  'Day boundary and visibility scope for a reader of another role are not recovered',
  'Negative robot role ids are only allowed for proven robot templates, which are not bound here'
]);

export function readLineupSnapshotTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const raw = readGeneratedTables(file, FAMILIES);
  const rows = {};
  for (const name of FAMILIES) {
    const table = raw[name];
    if (!(table instanceof Map)) throw new Error(`LineupSnapshot ${name} is missing`);
    if (table.size !== EXPECTED_COUNTS[name]) {
      throw new Error(`LineupSnapshot ${name} has ${table.size} rows; expected ${EXPECTED_COUNTS[name]}`);
    }
    const frozen = new Map();
    for (const [key, value] of table) {
      const tid = integer(value?.tid ?? key, `${name}.tid`, { min: 1 });
      if (frozen.has(tid)) throw new Error(`LineupSnapshot ${name} has duplicate tid ${tid}`);
      frozen.set(tid, Object.freeze({ ...value, tid }));
    }
    rows[name] = frozen;
  }

  const config = rows.Const.get(1);
  if (!config) throw new Error('LineupSnapshot.Const is missing tid 1');
  // Units are not stated by the table: keep the raw value and never multiply it
  // into a refresh window before the original consumer is recovered.
  integer(config.lineup_hero_refresh, 'Const.1.lineup_hero_refresh', { min: 1 });

  for (const row of rows.RobotLineup.values()) {
    if (!Array.isArray(row.hero) || row.hero.length !== 6) {
      throw new Error(`LineupSnapshot.RobotLineup.${row.tid} must list six hero tids`);
    }
    for (const hero of row.hero) integer(hero, `RobotLineup.${row.tid}.hero`, { min: 1 });
  }

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '7215874549648651000-LineupSnapshotTable.data.lua.bin',
      sha256: '14F2F7B74B3031264140C4FC39A8984050C95E98E4DD01724B9171EB65D646A6'
    }),
    counts: EXPECTED_COUNTS,
    rows,
    gameplayReady: false,
    gameplayBlockers: LINEUP_SNAPSHOT_PRODUCER_BLOCKERS,
    constRow() { return config; },
    robotLineup(tid) { return rows.RobotLineup.get(Number(tid)) ?? null; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export { EXPECTED_COUNTS, FAMILIES };
