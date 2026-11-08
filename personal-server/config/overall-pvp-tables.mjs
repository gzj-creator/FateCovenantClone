import { readJsonAsset, tableAsset } from '../assets.mjs';

// OverallPvpTable rows come from the shipped client LuaJIT table bytecode. The
// dump in personal-server/assets/tables/OverallPvpTable.data.lua.json.gz is
// produced with the repository helper:
//   node tools/extract-shipped-table.mjs <scratchpad>/14079943816236153000-OverallPvpTable.data.lua.bin
//     personal-server/assets/tables/OverallPvpTable.data.lua.json.gz
// The asset was first extracted for the parallel tri-match card (a2-trimatch);
// the same shipped bytecode is the source of truth here.
const defaultPath = tableAsset('OverallPvpTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing overall PVP table: ' + name);
  return table.rows;
}

function byTid(rows) {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function rewardPairs(value, label) {
  if (!Array.isArray(value)) return [];
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

export function readOverallPvpTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const stages = rowsOf(dump, 'Stage');
  const result = {
    source: dump.source ?? null,
    fields: dump.tables ?? {},
    base: byTid(rowsOf(dump, 'Base')),
    stages: stages
      .map(row => ({ ...row, tid: Number(row.tid), start_time: Number(row.start_time), continued_time: Number(row.continued_time) }))
      .sort((left, right) => left.start_time - right.start_time),
    tasks: byTid(rowsOf(dump, 'Task')),
    eachTasks: byTid(rowsOf(dump, 'EachTask')),
    dailyExtraAward: rowsOf(dump, 'DailyExtraAwad'),
    extraAwardLib: byTid(rowsOf(dump, 'ExtraAwadLib')),
    signTasks: byTid(rowsOf(dump, 'SignTask')),
    guessStages: byTid(rowsOf(dump, 'GuessStage')),
    guessAward: byTid(rowsOf(dump, 'GuessAward')),
    guessTimes: byTid(rowsOf(dump, 'Guess')),
    previewRewards: byTid(rowsOf(dump, 'PreviewRewards')),
    showRewards: byTid(rowsOf(dump, 'ShowRewards')),
    lineups: byTid(rowsOf(dump, 'Lineup')),
    rankAwards: byTid(rowsOf(dump, 'RankAward')),
    elmsConst: byTid(rowsOf(dump, 'ElmsConst')),
    elmsInit: byTid(rowsOf(dump, 'ElmsInit')),
    elmsBuy: byTid(rowsOf(dump, 'ElmsBuy')),
    elmsRule: rowsOf(dump, 'ElmsRule'),
    elmsRankWinnerAward: byTid(rowsOf(dump, 'ElmsRankWinnerAward')),
    elmsRankLoserAward: byTid(rowsOf(dump, 'ElmsRankLoserAward')),
    prelimsConst: rowsOf(dump, 'PrelimsConst')[0] ?? null,
    prelimsBot: byTid(rowsOf(dump, 'PrelimsBot')),
    prelimsBotLib: byTid(rowsOf(dump, 'PrelimsBotLib')),
    prelimsBuyTimes: rowsOf(dump, 'PrelimsBuyTimes'),
    prelimsLevels: byTid(rowsOf(dump, 'PrelimsLevel')),
    prelimsMatch: rowsOf(dump, 'PrelimsMatch'),
    shops: byTid(rowsOf(dump, 'Shop')),
    artifactUnlock: byTid(rowsOf(dump, 'ArtifactUnlock')),
    titleAddition: byTid(rowsOf(dump, 'TitleAddition')),
    pastChampions: byTid(rowsOf(dump, 'PastChampion')),
    reportParse: byTid(rowsOf(dump, 'ReportParse'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

// Total length of one cycle in seconds, derived from the stage timeline.
export function overallPvpCycleLength(tables) {
  let end = 0;
  for (const stage of tables.stages) {
    if (!Number.isSafeInteger(stage.start_time) || !Number.isSafeInteger(stage.continued_time) || stage.continued_time <= 0) continue;
    end = Math.max(end, stage.start_time + stage.continued_time);
  }
  return end;
}

// Stage tid is the configured stage whose [start, start+duration) window
// contains the offset inside the cycle.
export function overallPvpStageAt(tables, offsetSeconds) {
  const offset = Number(offsetSeconds);
  for (const stage of tables.stages) {
    const start = stage.start_time, duration = stage.continued_time;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(duration) || duration <= 0) continue;
    if (offset >= start && offset < start + duration) return { stage: stage.tid, start, duration, show_name: stage.show_name ?? 0 };
  }
  return null;
}

export function overallPvpStageRow(tables, stageTid) {
  return tables.stages.find(stage => stage.tid === Number(stageTid)) ?? null;
}

// Big stage groups follow OverallPvpUtil.GetPvpStageStartAndEndTime: the prelims
// span [prelims, prelims settle], the elimination bracket spans [ko, ko settle]
// and the finals use the last configured stage. Stage show_name values confirm
// the mapping (675005 = PrelimsConst.show_name on stage 2, 675006 on stage 4).
export const OVERALL_PVP_STAGE_GROUPS = Object.freeze({
  preview: { first: 1, last: 1 },
  prelims: { first: 2, last: 3 },
  elms: { first: 4, last: 5 },
  finals: { first: 6, last: 6 }
});

export function overallPvpStageWindow(tables, group) {
  const spec = OVERALL_PVP_STAGE_GROUPS[group];
  if (!spec) return null;
  const first = overallPvpStageRow(tables, spec.first);
  const last = overallPvpStageRow(tables, spec.last);
  if (!first || !last) return null;
  return { start: first.start_time, end: last.start_time + last.continued_time };
}

export function overallPvpStageInGroup(tables, stageTid, group) {
  const spec = OVERALL_PVP_STAGE_GROUPS[group];
  if (!spec) return false;
  const stage = numberOrNull(stageTid);
  return stage !== null && stage >= spec.first && stage <= spec.last;
}

export function baseConfigForVersion(tables, version) {
  return tables.base.get(Number(version)) ?? null;
}

function cycleShape(tables, { row, cycleStart, cycleLength, at, cycles }) {
  const offset = at - cycleStart;
  return {
    version: Number(row.tid),
    row,
    cycleStart,
    cycleEnd: cycleStart + cycleLength,
    cycleLength,
    cycles,
    offset,
    openDay: Math.floor(Math.max(0, offset) / 86400) + 1,
    stage: overallPvpStageAt(tables, offset)
  };
}

// Private-server schedule policy: the shipped Base rows carry the absolute
// windows of past live seasons. When the clock is inside one of those windows
// that window is authoritative; otherwise the newest configured row repeats
// with its own length (end_time - start_time) so the stage machine keeps
// running on a single local server. Stage timeline, rewards and every rule come
// from the table unchanged; only the phase alignment is a deployment choice.
export function resolveOverallPvpCycle(tables, atSeconds, { version = 0 } = {}) {
  const at = Number(atSeconds);
  if (!Number.isSafeInteger(at)) throw new Error('Overall PVP clock is invalid');
  const pinned = Number(version) > 0 ? tables.base.get(Number(version)) : null;
  if (Number(version) > 0 && !pinned) throw new Error('Overall PVP version ' + version + ' is not configured');
  const candidates = pinned ? [pinned] : [...tables.base.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
  const usable = candidates.filter(row => {
    const start = Number(row.start_time), end = Number(row.end_time);
    return Number.isSafeInteger(start) && Number.isSafeInteger(end) && end > start;
  });
  if (!usable.length) throw new Error('Overall PVP Base table is empty');
  if (!pinned) {
    for (const row of usable) {
      const start = Number(row.start_time), end = Number(row.end_time);
      if (at >= start && at < end) return cycleShape(tables, { row, cycleStart: start, cycleLength: end - start, at, cycles: 0 });
    }
  }
  const row = usable[usable.length - 1];
  const start = Number(row.start_time), end = Number(row.end_time);
  const length = end - start;
  const cycles = Math.floor((at - start) / length);
  return cycleShape(tables, { row, cycleStart: start + cycles * length, cycleLength: length, at, cycles });
}

export function prelimsLevelForScore(tables, score) {
  const value = Number(score);
  let best = null;
  for (const row of tables.prelimsLevels.values()) {
    const integral = Number(row.integral);
    if (!Number.isSafeInteger(integral)) continue;
    if (integral <= value && (!best || integral > Number(best.integral))) best = row;
  }
  return best;
}

export function rankAwardForRank(rows, rank) {
  const value = Number(rank);
  for (const row of rows) {
    const range = Array.isArray(row.rank_rang) ? row.rank_rang : Array.isArray(row.rank_range) ? row.rank_range : null;
    if (!range || range.length !== 2) continue;
    const from = Number(range[0]), to = Number(range[1]);
    if (Number.isSafeInteger(from) && Number.isSafeInteger(to) && value >= from && value <= to) return row;
  }
  return null;
}

// ElmsInit.split_score orders the two brackets: a prelims score at or above the
// first entry enters the winner bracket, the second entry the loser bracket, and
// anything below is not qualified. The captured row is identical per version.
export function elmsQualification(tables, score) {
  const row = tables.elmsInit.get(1) ?? [...tables.elmsInit.values()][0] ?? null;
  if (!row || !Array.isArray(row.split_score) || row.split_score.length !== 2) return null;
  const winScore = Number(row.split_score[0]), failScore = Number(row.split_score[1]);
  if (!Number.isSafeInteger(winScore) || !Number.isSafeInteger(failScore)) return null;
  const value = Number(score) || 0;
  return {
    row,
    qualified: value >= Math.min(winScore, failScore),
    isWin: value >= winScore,
    winScore,
    failScore,
    srcRank: numberOrNull(row.src_rank),
    winRank: numberOrNull(row.win_rank),
    failRank: numberOrNull(row.fail_rank)
  };
}
