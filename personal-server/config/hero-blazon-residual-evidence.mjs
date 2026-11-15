import { readHeroBlazonTables } from './hero-blazon-tables.mjs';

// Evidence-only module for the three HeroBlazon commands that stay fail-closed
// after the 2026-11-15 R1 pass (88951, 88953, 88956). It never drives gameplay.
// Its job is to keep the uncovered columns and the missing consumer chain
// machine-checkable, so a later pass cannot turn "table row exists" into
// "original cost/result chain recovered".
const REQUIRED_CHAPTER_NORMAL_CELL = Object.freeze([[1002, 650], [1002, 400]]);
const REQUIRED_TALENT_RESET_COSTS = Object.freeze([
  Object.freeze([]),
  Object.freeze([[101500, 200]]),
  Object.freeze([[101500, 400]]),
  Object.freeze([[101500, 600]]),
  Object.freeze([[101500, 1000]])
]);
const REQUIRED_TALENT_UP_COLUMNS = Object.freeze(['range_max', 'range_min', 'tid']);

export const HERO_BLAZON_RESIDUAL_COMMANDS = Object.freeze({
  88951: Object.freeze({
    status: 'fail-closed',
    decisionId: 'R1-HEROBLAZON-CHAPTER',
    reason: 'HERO-HEROBLAZON: normal-cell cost consumer and the activated-cell result bitmap are not recovered'
  }),
  88953: Object.freeze({
    status: 'fail-closed',
    decisionId: 'R1-HEROBLAZON-TALENT',
    reason: 'HERO-HEROBLAZON: the talent-point budget producer yields no points and TalentUp omits need_other_level'
  }),
  88956: Object.freeze({
    status: 'fail-closed',
    decisionId: 'R1-HEROBLAZON-SKILLRESET',
    reason: 'HERO-HEROBLAZON: no client producer and no skill-reset cost or refund family are recovered'
  })
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function readHeroBlazonResidualEvidence(file) {
  const tables = readHeroBlazonTables(file);
  const rows = tables.rows;

  // The shipped TalentUp family carries only the threshold range columns. The
  // client reads TalentUpByIndex(tid).need_other_level, which is absent here.
  for (const row of rows.TalentUp.values()) {
    assert(sameJson(Object.keys(row).sort(), [...REQUIRED_TALENT_UP_COLUMNS]),
      `HeroBlazon TalentUp ${row.tid} changed columns; need_other_level must stay explicitly unrecovered`);
    assert(!Object.hasOwn(row, 'need_other_level'),
      `HeroBlazon TalentUp ${row.tid} unexpectedly gained need_other_level`);
  }

  // Chapter.normal_cell is the only normal-cell cost candidate left, but no
  // recovered consumer indexes it (client GetAllAttrParams returns an empty table).
  for (const chapter of rows.Chapter.values()) {
    assert(sameJson(chapter.normal_cell, REQUIRED_CHAPTER_NORMAL_CELL),
      `HeroBlazon Chapter ${chapter.tid} normal_cell changed; re-review the unrecovered cost index`);
  }

  // TalentReset is the talent reset ladder. It is not a skill-reset cost table
  // and cannot be borrowed by 88956.
  assert(rows.TalentReset.size === 5, 'HeroBlazon TalentReset must keep its five ladder rows');
  for (const row of rows.TalentReset.values()) {
    assert(sameJson(row.cost, REQUIRED_TALENT_RESET_COSTS[row.tid - 1]),
      `HeroBlazon TalentReset ${row.tid} cost changed`);
  }
  assert(!Object.hasOwn(rows, 'SkillReset'), 'HeroBlazon must not gain an unproven SkillReset family');

  // EmbedCell holds the special-cell item rows. They prove the material column
  // exists, not which consumer charges it or where the activated cell lands.
  assert(rows.EmbedCell.size === 414, 'HeroBlazon EmbedCell must keep 414 rows');
  for (const row of rows.EmbedCell.values()) {
    assert(row.tid === Number(row.group) * 100 + Number(row.index),
      `HeroBlazon EmbedCell ${row.tid} does not follow group*100+index`);
    assert(Number(row.special_item) > 0, `HeroBlazon EmbedCell ${row.tid} has no special_item`);
  }

  const { param } = tables;
  assert(param.talent_open === 20, 'HeroBlazon Param.talent_open changed');
  assert(param.reset_times_limit === 5, 'HeroBlazon Param.reset_times_limit changed');
  assert(param.skill_count === 4, 'HeroBlazon Param.skill_count changed');
  assert(param.skill_max_star === 10, 'HeroBlazon Param.skill_max_star changed');
  assert(param.normal_quality_lim === 40, 'HeroBlazon Param.normal_quality_lim changed');

  return Object.freeze({
    source: tables.source,
    decisions: HERO_BLAZON_RESIDUAL_COMMANDS,
    commands: Object.freeze(Object.keys(HERO_BLAZON_RESIDUAL_COMMANDS).map(Number)),
    gameplayReady: false,
    talentUpColumns: REQUIRED_TALENT_UP_COLUMNS,
    talentPointBudgetRecovered: false,
    normalCellCostIndexRecovered: false,
    skillResetFamilyRecovered: false,
    tables
  });
}
