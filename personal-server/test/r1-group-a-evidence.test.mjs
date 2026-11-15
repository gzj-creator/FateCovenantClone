import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createR1FailClosedCommandService,
  r1FailClosedReason
} from '../game/r1-fail-closed-command-service.mjs';
import { HERO_BLAZON_COMMANDS } from '../game/hero-blazon-service.mjs';
import { readHeroBlazonResidualEvidence } from '../config/hero-blazon-residual-evidence.mjs';
import { readIntelliTables } from '../config/intelli-tables.mjs';

const GROUP_A_TYPES = Object.freeze([88951, 88953, 88956, 701, 702]);

test('group A keeps every unresolved type on the shared R1 business refusal', () => {
  const service = createR1FailClosedCommandService();
  for (const type of GROUP_A_TYPES) {
    assert.equal(service.supports(type), true, `type ${type} must stay in the fail-closed set`);
    assert.ok(r1FailClosedReason(type), `type ${type} must keep an explicit refusal reason`);
    assert.throws(
      () => service.execute(type, Buffer.from([0xff])),
      error => error.code === 5 && error.message.startsWith(`R1 command ${type} is fail-closed:`)
    );
  }
  assert.equal(new Set(GROUP_A_TYPES.map(type => r1FailClosedReason(type))).size, GROUP_A_TYPES.length);
});

test('the implemented HeroBlazon service still refuses the three uncovered commands', () => {
  assert.deepEqual([...HERO_BLAZON_COMMANDS].sort((left, right) => left - right), [88955, 88957]);
  for (const type of [88951, 88953, 88956]) {
    assert.equal(HERO_BLAZON_COMMANDS.includes(type), false, `hero blazon service must not claim ${type}`);
  }
});

test('HeroBlazon residual evidence keeps the missing talent and skill-reset chains explicit', () => {
  const evidence = readHeroBlazonResidualEvidence();
  assert.equal(evidence.gameplayReady, false);
  assert.deepEqual(evidence.commands, [88951, 88953, 88956]);
  assert.equal(evidence.talentPointBudgetRecovered, false);
  assert.equal(evidence.normalCellCostIndexRecovered, false);
  assert.equal(evidence.skillResetFamilyRecovered, false);
  for (const type of evidence.commands) {
    const decision = evidence.decisions[type];
    assert.equal(decision.status, 'fail-closed');
    assert.match(decision.decisionId, /^R1-HEROBLAZON-/);
    assert.match(decision.reason, /not recovered|yields no points|no skill-reset/);
  }
});

test('HeroBlazon TalentUp rows still omit the need_other_level gate the client reads', () => {
  const evidence = readHeroBlazonResidualEvidence();
  const talentUp = [...evidence.tables.rows.TalentUp.values()];
  assert.equal(talentUp.length, 27);
  assert.deepEqual(evidence.talentUpColumns, ['range_max', 'range_min', 'tid']);
  for (const row of talentUp) {
    assert.deepEqual(Object.keys(row).sort(), ['range_max', 'range_min', 'tid']);
    assert.equal(Object.hasOwn(row, 'need_other_level'), false);
  }
});

test('HeroBlazon keeps the chapter cost rows and the talent reset ladder unreused', () => {
  const evidence = readHeroBlazonResidualEvidence();
  const rows = evidence.tables.rows;
  for (const chapter of rows.Chapter.values()) {
    assert.deepEqual(chapter.normal_cell, [[1002, 650], [1002, 400]]);
  }
  assert.deepEqual(
    [...rows.TalentReset.values()].map(row => [row.tid, row.cost]),
    [[1, []], [2, [[101500, 200]]], [3, [[101500, 400]]], [4, [[101500, 600]]], [5, [[101500, 1000]]]]
  );
  assert.equal(Object.hasOwn(rows, 'SkillReset'), false);
  assert.equal(evidence.tables.param.talent_open, 20);
  assert.equal(evidence.tables.param.reset_times_limit, 5);
});

test('Intelli evidence still blocks both unlock and batch handling', () => {
  const tables = readIntelliTables();
  assert.equal(tables.gameplayReady, false);
  assert.equal(tables.gameplayBlockers.length, 4);
  assert.match(tables.gameplayBlockers[0], /omit award, award_n, hero_star, hero_quality and conditions/);
  assert.match(tables.gameplayBlockers[1], /Type\.unlock scripts cannot be evaluated/);
  for (let tid = 1; tid <= 8; tid += 1) {
    assert.equal(tables.typeForTid(tid).unlock, 389242300000 + tid);
  }
  for (const row of tables.rows.Intelli.values()) {
    assert.deepEqual(Object.keys(row).sort(), ['des_id', 'quality', 'show_name', 'tid']);
  }
});
