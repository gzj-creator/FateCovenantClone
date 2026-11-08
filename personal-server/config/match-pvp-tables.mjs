import { readJsonAsset, tableAsset } from '../assets.mjs';
import { awardPairs, byTid, integerField, optionalRowsOf, rowsOf } from './lua-table-dump.mjs';

// MatchPvpTable (群雄逐鹿 / 位面锦标赛 shared tables) — extracted by
// tools/extract-lua-table.mjs. Type row 1 is the tournament (位面锦标赛,
// TournamentCmd 88501-88511); Type row 2 is 时空冠位赛 (hunter arena), which the
// tournament service only reads for the shared constants.
const defaultPath = tableAsset('MatchPvpTable.data.lua.json');
let defaultCache;

function levelsByType(levels) {
  const map = new Map();
  for (const row of levels.values()) {
    if (!map.has(row.type)) map.set(row.type, []);
    map.get(row.type).push(row);
  }
  for (const list of map.values()) list.sort((left, right) => left.integral - right.integral);
  return map;
}

export function readMatchPvpTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);

  const levels = byTid(rowsOf(dump, 'Level').map(row => ({
    tid: integerField(row, 'tid', 'MatchPvp.Level', { min: 1 }),
    type: integerField(row, 'type', 'MatchPvp.Level', { min: 1 }),
    integral: integerField(row, 'integral', 'MatchPvp.Level'),
    icon: typeof row.icon === 'string' ? row.icon : '',
    award: awardPairs(row.award, 'MatchPvp.Level')
  })));

  const types = byTid(rowsOf(dump, 'Type').map(row => ({
    tid: integerField(row, 'tid', 'MatchPvp.Type', { min: 1 }),
    initScore: integerField(row, 'init_score', 'MatchPvp.Type'),
    minScore: integerField(row, 'min_score', 'MatchPvp.Type'),
    minWinGain: integerField(row, 'min_win_gain', 'MatchPvp.Type'),
    fightReportNum: integerField(row, 'fight_report_num', 'MatchPvp.Type'),
    lockFightReportMax: integerField(row, 'lock_fight_report_max', 'MatchPvp.Type'),
    palaceSeason: integerField(row, 'palace_season', 'MatchPvp.Type'),
    fightReportPeriod: integerField(row, 'fight_report_period', 'MatchPvp.Type'),
    newSeasonRankBack: integerField(row, 'new_season_rank_back', 'MatchPvp.Type'),
    openLevel: integerField(row, 'open_level', 'MatchPvp.Type'),
    startDay: integerField(row, 'start_day', 'MatchPvp.Type'),
    eloK: integerField(row, 'elo_k', 'MatchPvp.Type'),
    peakDuelShowCount: integerField(row, 'peak_duel_show_count', 'MatchPvp.Type'),
    cancelUrModeDay: integerField(row, 'cancel_ur_mode_day', 'MatchPvp.Type'),
    fightTid: integerField(row, 'fight_tid', 'MatchPvp.Type'),
    highRankDay: integerField(row, 'high_rank_day', 'MatchPvp.Type'),
    highRankFight: integerField(row, 'high_rank_fight', 'MatchPvp.Type'),
    shareRank: integerField(row, 'share_rank', 'MatchPvp.Type'),
    autoFight: integerField(row, 'auto_fight', 'MatchPvp.Type'),
    autoFightCount: integerField(row, 'auto_fight_count', 'MatchPvp.Type'),
    matchingTime: Array.isArray(row.matching_time) ? row.matching_time.map(Number) : []
  })));

  const matchRow = row => {
    const botList = Array.isArray(row.bot) ? row.bot.map(Number).filter(Number.isSafeInteger) : [];
    const promoteBots = Array.isArray(row.promote_bot) ? row.promote_bot.map(Number).filter(Number.isSafeInteger) : [];
    return {
      tid: integerField(row, 'tid', 'MatchPvp.Match', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.Match', { min: 1 }),
      power: integerField(row, 'power', 'MatchPvp.Match'),
      bots: botList,
      promoteBots
    };
  };

  const result = {
    source: dump.source ?? null,
    levels,
    levelsByType: levelsByType(levels),
    types,
    dayTasks: optionalRowsOf(dump, 'DayTask').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.DayTask', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.DayTask', { min: 1 }),
      taskType: integerField(row, 'task_type', 'MatchPvp.DayTask', { min: 1 }),
      taskKey: integerField(row, 'task_key', 'MatchPvp.DayTask'),
      taskCount: integerField(row, 'task_count', 'MatchPvp.DayTask', { min: 1 }),
      award: awardPairs(row.award, 'MatchPvp.DayTask')
    })),
    rankRewards: optionalRowsOf(dump, 'Rank').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.Rank', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.Rank', { min: 1 }),
      range: Array.isArray(row.rank_range) ? row.rank_range.map(Number) : [],
      award: awardPairs(row.award, 'MatchPvp.Rank')
    })),
    dailyRanks: optionalRowsOf(dump, 'DailyRank').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.DailyRank', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.DailyRank', { min: 1 }),
      level: integerField(row, 'level', 'MatchPvp.DailyRank'),
      award: awardPairs(row.award, 'MatchPvp.DailyRank')
    })),
    stageSettles: optionalRowsOf(dump, 'StageSettle').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.StageSettle', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.StageSettle', { min: 1 }),
      award: awardPairs(row.award, 'MatchPvp.StageSettle')
    })),
    matches: byTid(rowsOf(dump, 'Match').map(matchRow)),
    bots: byTid(optionalRowsOf(dump, 'BotLib').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.BotLib', { min: 1 }),
      score: integerField(row, 'score', 'MatchPvp.BotLib'),
      power: integerField(row, 'power', 'MatchPvp.BotLib'),
      fightTid: integerField(row, 'fight_tid', 'MatchPvp.BotLib'),
      highFightTid: integerField(row, 'hight_fight_tid', 'MatchPvp.BotLib'),
      level: integerField(row, 'lv', 'MatchPvp.BotLib'),
      winRate: integerField(row, 'win_rate', 'MatchPvp.BotLib'),
      style: integerField(row, 'style', 'MatchPvp.BotLib')
    }))),
    // State rows carry [relative day, seconds-of-day, ...] boundaries per type.
    states: optionalRowsOf(dump, 'State').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.State', { min: 1 }),
      type: integerField(row, 'type', 'MatchPvp.State', { min: 1 }),
      date: Array.isArray(row.date) ? row.date.map(Number) : []
    })),
    stateTypes: optionalRowsOf(dump, 'StateType').map(row => Number(row.tid)),
    params: optionalRowsOf(dump, 'Params').map(row => ({
      tid: integerField(row, 'tid', 'MatchPvp.Params', { min: 1 }),
      openLevel: Number(row.fun_open ?? 0),
      dataType: Number(row.data_type ?? 0),
      lineage: row.lineup_type ?? null,
      placeData: row.place_data ?? null,
      serverRank: Number(row.server_rank ?? 0),
      crossRank: Number(row.cross_rank ?? 0)
    }))
  };
  if (!result.types.size) throw new Error('MatchPvp type configuration is empty');
  if (file === defaultPath) defaultCache = result;
  return result;
}

// Stage (段位) for a score: the highest configured integral the score reaches.
export function stageForScore(tables, type, score) {
  const ladder = tables.levelsByType.get(Number(type)) ?? [];
  let current = null;
  for (const row of ladder) {
    if (Number(score) >= Number(row.integral)) current = row;
    else break;
  }
  return current;
}
