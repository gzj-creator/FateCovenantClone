import { readJsonAsset, tableAsset } from '../assets.mjs';

// OverallPvpTable is extracted from the shipped LuaJIT table bytecode by
// tools/extract-trimatch-tables.mjs.
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
    stages: stages.slice().sort((left, right) => Number(left.start_time) - Number(right.start_time)),
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
    titleAddition: byTid(rowsOf(dump, 'TitleAddition'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

// Total length of one cycle in seconds, derived from the stage timeline.
export function overallPvpCycleLength(tables) {
  let end = 0;
  for (const stage of tables.stages) {
    const start = Number(stage.start_time), duration = Number(stage.continued_time);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(duration) || duration <= 0) continue;
    end = Math.max(end, start + duration);
  }
  return end;
}

// Stage tid is the configured stage whose [start, start+duration) window
// contains the offset inside the cycle.
export function overallPvpStageAt(tables, offsetSeconds) {
  const offset = Number(offsetSeconds);
  for (const stage of tables.stages) {
    const start = Number(stage.start_time), duration = Number(stage.continued_time);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(duration) || duration <= 0) continue;
    if (offset >= start && offset < start + duration) return { stage: Number(stage.tid), start, duration, show_name: stage.show_name ?? 0 };
  }
  return null;
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
    const range = row.rank_range;
    if (!Array.isArray(range) || range.length !== 2) continue;
    const from = Number(range[0]), to = Number(range[1]);
    if (Number.isSafeInteger(from) && Number.isSafeInteger(to) && value >= from && value <= to) return row;
  }
  return null;
}
