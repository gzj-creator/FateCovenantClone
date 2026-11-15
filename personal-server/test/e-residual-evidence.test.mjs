import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import {
  E_RESIDUAL_BLOCKERS,
  E_RESIDUAL_DECISIONS,
  E_RESIDUAL_SOURCES,
  readEResidualEvidence
} from '../config/e-residual-evidence.mjs';
import { GameError } from '../game/hero-progression.mjs';
import {
  R1_FAIL_CLOSED_COMMAND_REASONS,
  createR1FailClosedCommandService
} from '../game/r1-fail-closed-command-service.mjs';

const COMMANDS = [288, 88401, 88402, 84901, 84902];

function mutatedCopy(family, mutate) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fc-e-residual-')), 'asset.json.gz');
  const content = JSON.parse(zlib.gunzipSync(fs.readFileSync(
    new URL(`../assets/tables/${family}`, import.meta.url)
  )).toString('utf8'));
  mutate(content);
  fs.writeFileSync(file, zlib.gzipSync(Buffer.from(JSON.stringify(content), 'utf8')));
  return file;
}

test('E residual evidence freezes the recovered rows and keeps all five commands unready', () => {
  const evidence = readEResidualEvidence();
  assert.equal(evidence.rVersion, 'R1');
  assert.equal(evidence.gameplayReady, false);
  for (const type of COMMANDS) {
    assert.equal(typeof E_RESIDUAL_DECISIONS[type], 'string', 'decision id for ' + type);
    assert.ok(E_RESIDUAL_BLOCKERS[type].length >= 3, 'command ' + type + ' needs at least three independent blockers');
    for (const blocker of E_RESIDUAL_BLOCKERS[type]) assert.ok(blocker.length > 30, 'blocker text for ' + type);
  }
  assert.equal(E_RESIDUAL_SOURCES.resComplete.bundleSha256.length, 64);
  assert.equal(E_RESIDUAL_SOURCES.resRollback.bundleSha256.length, 64);
  assert.equal(E_RESIDUAL_SOURCES.taskGroup.bundleSha256.length, 64);
});

test('288 ResComplete keeps the recovered award row but has no server-verifiable eligibility', () => {
  const evidence = readEResidualEvidence();
  assert.equal(evidence.resComplete.command, 288);
  assert.equal(evidence.resComplete.requestSchema, 'req_res_complete_award');
  assert.deepEqual(
    evidence.resComplete.award.map(pair => [...pair]),
    [[101500, 200], [201500, 10000], [101800, 500]]
  );
  assert.equal(evidence.resComplete.autoDownloadOpenRows.length, 3);
  assert.deepEqual(evidence.resComplete.autoDownloadOpenRows.map(row => row.tid), [1, 2, 3]);
  // The three Open rows gate automatic downloads; they must never be read as award eligibility.
  for (const row of evidence.resComplete.autoDownloadOpenRows) {
    assert.equal(typeof row.download_chapter, 'number');
    assert.equal(typeof row.auto_download_day, 'number');
    assert.equal(typeof row.old_player_chapter, 'number');
  }
  assert.equal(evidence.resComplete.eligibilitySource, 'client-download-state');
  assert.equal(evidence.resComplete.serverVerifiableEligibility, false);
});

test('88401/88402 freeze the eight rollback_type rows without inventing a refund formula', () => {
  const evidence = readEResidualEvidence();
  assert.deepEqual([...evidence.resRollback.commands], [88401, 88402]);
  assert.deepEqual({ ...evidence.resRollback.constant }, { minStar: 6, toStar: 5 });
  const expected = [
    [1, 'HeroDataMgr.HeroResetUpData', 500],
    [2, 'EquipDataMgr.EquipResetUpData', 100],
    [3, 'ArtifactMgr.ArtifactResetUpData', 100],
    [4, 'RelicMgr.RelicResetUpData', 100],
    [5, 'PetEquipMgr.EquipResetUpData', 100],
    [6, 'ElvesBeadMgr.ResetUpData', 100],
    [7, 'ElvesMgr.ResetUpData', 100],
    [8, 'PetMgr.ResetUpData', 100]
  ];
  assert.equal(evidence.resRollback.types.size, 8);
  for (const [tid, reference, cost] of expected) {
    const row = evidence.resRollback.types.get(tid);
    assert.ok(row, 'rollback type ' + tid);
    assert.equal(row.refreshFunc, reference);
    assert.equal(row.costItem, 101500);
    assert.equal(row.costItemNum, cost);
  }
  assert.equal(evidence.resRollback.refundFormulaRecovered, false);
  assert.match(evidence.resRollback.previewSchema, /res_list/);
  assert.match(evidence.resRollback.executeSchema, /to_client/);
});

test('84901/84902 keep real group rows but cannot bind them to a function', () => {
  const evidence = readEResidualEvidence();
  assert.equal(evidence.taskGroup.groupFuncRows, 0);
  assert.equal(evidence.taskGroup.groups.size, 6);
  assert.equal(evidence.taskGroup.tasks.size, 20);
  assert.deepEqual([...evidence.taskGroup.groups.keys()].sort((a, b) => a - b), [1001, 1002, 1003, 1004, 1005, 1006]);
  for (const group of evidence.taskGroup.groups.values()) {
    assert.deepEqual(group.award.map(pair => [...pair]), [[201500, 1]]);
    assert.ok(group.tasks.length > 0);
  }
  assert.equal(evidence.taskGroup.groupAwardRowsRecovered, true);
  assert.equal(evidence.taskGroup.funcBindingRecovered, false);
  assert.deepEqual([...evidence.taskGroup.commonTaskShards].sort(), [
    'TaskTable.CommonTask.1201.data.lua',
    'TaskTable.CommonTask.1202.data.lua',
    'TaskTable.CommonTask.1602.data.lua',
    'TaskTable.CommonTask.9001.data.lua'
  ]);
  assert.match(evidence.taskGroup.loginSchema, /func_open/);
});

test('the five E commands still pay GameError(5) before any state change', () => {
  const service = createR1FailClosedCommandService();
  const reasons = [];
  for (const type of COMMANDS) {
    assert.equal(service.supports(type), true, 'type ' + type + ' must stay in the fail-closed table');
    assert.equal(typeof R1_FAIL_CLOSED_COMMAND_REASONS[type], 'string');
    assert.throws(() => service.execute(type), error => {
      assert.ok(error instanceof GameError);
      assert.equal(error.code, 5);
      assert.match(error.message, new RegExp('R1 command ' + type + ' is fail-closed'));
      reasons.push(error.message);
      return true;
    });
  }
  assert.equal(new Set(reasons).size, COMMANDS.length);
});

test('evidence drift reopens the decision instead of silently keeping a stale refusal', () => {
  const withGroupFunc = mutatedCopy('TaskGroupTable.data.json.gz', parsed => {
    parsed.GroupFunc.push({ tid: 1, funcs: [1] });
  });
  assert.throws(
    () => readEResidualEvidence({ taskGroup: withGroupFunc }),
    /family GroupFunc has 1 rows|GroupFunc is no longer empty/
  );

  const withCheaperRollback = mutatedCopy('ResRollbackTable.data.json.gz', parsed => {
    parsed.Type[0].cost_item_num = 1;
  });
  assert.throws(
    () => readEResidualEvidence({ resRollback: withCheaperRollback }),
    /cost_item_num changed/
  );

  const withDifferentAward = mutatedCopy('ResCompleteTable.data.json.gz', parsed => {
    parsed.Award[0].award_n = [200, 10000, 501];
  });
  assert.throws(
    () => readEResidualEvidence({ resComplete: withDifferentAward }),
    /ResComplete.Award rows changed/
  );
});
