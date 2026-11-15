import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERIOD_TASK_DECISIONS,
  PERIOD_TASK_EXPECTED_COUNTS,
  PERIOD_TASK_MISSING_EVIDENCE,
  PERIOD_TASK_REFRESH_MODULES,
  PERIOD_TASK_SOURCE_SHA256,
  readPeriodTaskTables
} from '../config/period-task-tables.mjs';
import { createR1FailClosedCommandService } from '../game/r1-fail-closed-command-service.mjs';
import { createGameCodec } from '../protocol/game-codec.mjs';

const PERIOD_TASK_COMMANDS = [101301, 101302, 101303];

test('PeriodTaskTable keeps the shipped empty families and the three refresh modules', () => {
  const tables = readPeriodTaskTables();
  assert.equal(tables.sourceSha256, PERIOD_TASK_SOURCE_SHA256);
  assert.deepEqual(tables.counts, PERIOD_TASK_EXPECTED_COUNTS);
  for (const family of ['Task', 'Version', 'Score', 'Stage']) {
    assert.equal(tables.rows[family].length, 0, family + ' must stay empty until a same-version source row exists');
    assert.equal(tables.rowsPresent[family], false);
  }
  assert.equal(tables.rows.RefreshType.length, 3);
  assert.deepEqual([...tables.refreshType].sort((left, right) => left[0] - right[0]),
    Object.entries(PERIOD_TASK_REFRESH_MODULES).map(([tid, name]) => [Number(tid), name]));
  assert.equal(tables.gameplayReady, false);
  assert.equal(tables.missingEvidence.length, PERIOD_TASK_MISSING_EVIDENCE.length);
});

test('period task login payload schema is frozen even though no award rows exist', () => {
  const root = createGameCodec().root;
  const all = root.lookupType('pb_period_task_all');
  const info = root.lookupType('pb_period_task_info');
  const item = root.lookupType('pb_period_task_item');
  const back = root.lookupType('pb_period_task_back');
  assert.equal(all.fields.list.type, 'pb_period_task_info');
  assert.equal(all.fields.list.repeated, true);
  assert.deepEqual(Object.keys(info.fields).sort(), ['score_award_state', 'stage_award_state', 'task_list', 'version']);
  assert.deepEqual(Object.keys(item.fields).sort(), ['refresh_sec', 'task_id']);
  assert.deepEqual(Object.keys(back.fields).sort(), ['period_task', 'res']);
});

test('101301-101303 keep an explicit code 5 refusal with a per-type decision id', () => {
  const service = createR1FailClosedCommandService();
  for (const type of PERIOD_TASK_COMMANDS) {
    assert.equal(service.supports(type), true, type + ' must stay in the shared refusal table');
    assert.throws(() => service.execute(type, Buffer.alloc(0)), error => error.code === 5 && /ITEM-PERIODTASK/.test(error.message));
  }
  assert.equal(PERIOD_TASK_DECISIONS[101301], 'R1-ITEM-PERIODTASK-TASK');
  assert.equal(PERIOD_TASK_DECISIONS[101302], 'R1-ITEM-PERIODTASK-STAGE');
  assert.equal(PERIOD_TASK_DECISIONS[101303], 'R1-ITEM-PERIODTASK-SCORE');
});
