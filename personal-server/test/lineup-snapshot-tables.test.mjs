import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LINEUP_SNAPSHOT_PRODUCER_BLOCKERS,
  readLineupSnapshotTables
} from '../config/lineup-snapshot-tables.mjs';

const tables = readLineupSnapshotTables();

test('LineupSnapshotTable keeps the two original families', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(tables.rows).map(([name, rows]) => [name, rows.size])),
    { Const: 1, RobotLineup: 2 }
  );
  assert.equal(tables.source.file, '7215874549648651000-LineupSnapshotTable.data.lua.bin');
  assert.equal(tables.source.sha256, '14F2F7B74B3031264140C4FC39A8984050C95E98E4DD01724B9171EB65D646A6');
});

test('LineupSnapshotTable keeps the raw refresh value and robot lineups', () => {
  assert.equal(tables.constRow().tid, 1);
  assert.equal(tables.constRow().lineup_hero_refresh, 7);
  assert.deepEqual(tables.robotLineup(1).hero, [2010101, 2010201, 1020601, 2020201, 2020601, 3030501]);
  assert.deepEqual(tables.robotLineup(2).hero, [1020201, 1020301, 1020401, 1020501, 1020601, 1010101]);
  assert.equal(tables.robotLineup(3), null);
});

test('LineupSnapshotTable is never treated as a snapshot producer', () => {
  assert.equal(tables.gameplayReady, false);
  assert.equal(tables.gameplayBlockers.length, 4);
  assert.equal(tables.gameplayBlockers, LINEUP_SNAPSHOT_PRODUCER_BLOCKERS);
  assert.match(tables.gameplayBlockers[0], /writer of pb_lineup_snapshot/);
  assert.match(tables.gameplayBlockers[1], /Reference counting/);
  assert.match(tables.gameplayBlockers[3], /Negative robot role ids/);
});
