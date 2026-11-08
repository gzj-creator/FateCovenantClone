import { readJsonAsset, tableAsset } from '../assets.mjs';
import { awardPairs, byField, byTid, integerField, optionalRowsOf, rowsOf } from './lua-table-dump.mjs';

// TopArenaTable (巅峰竞技) — extracted by tools/extract-lua-table.mjs.
// Display-only tables (FinalShow, CardShow, Directions, Rule, Ring, Scatter
// visuals) are intentionally not mapped: the service only needs the schedule,
// the reward pools and the arena slot table.
const defaultPath = tableAsset('TopArenaTable.data.lua.json');
let defaultCache;

function rangeOf(row, label) {
  const range = Array.isArray(row.rank_range) ? row.rank_range.map(Number) : [];
  if (range.length !== 2 || !range.every(Number.isSafeInteger)) throw new Error(label + '.rank_range is invalid');
  return range;
}

export function readTopArenaTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);

  const rawConst = rowsOf(dump, 'Const')[0] ?? {};
  const rawRule = rowsOf(dump, 'RuleConst')[0] ?? {};
  const rawHelp = rowsOf(dump, 'HelpConst')[0] ?? {};
  const rawPublicity = rowsOf(dump, 'PublicityConst')[0] ?? {};

  const rankRewardRows = optionalRowsOf(dump, 'RankReward').map(row => ({
    tid: integerField(row, 'tid', 'TopArena.RankReward', { min: 1 }),
    type: integerField(row, 'type', 'TopArena.RankReward', { min: 1 }),
    range: rangeOf(row, 'TopArena.RankReward'),
    award: awardPairs(row.award, 'TopArena.RankReward')
  }));
  const rankRewardsByType = new Map();
  for (const row of rankRewardRows) {
    if (!rankRewardsByType.has(row.type)) rankRewardsByType.set(row.type, []);
    rankRewardsByType.get(row.type).push(row);
  }
  for (const list of rankRewardsByType.values()) list.sort((left, right) => left.range[0] - right.range[0]);

  const challengeStates = Array.isArray(rawConst.challenge_state)
    ? rawConst.challenge_state.map(pair => (Array.isArray(pair) ? pair.map(Number) : []))
    : [];

  const result = {
    source: dump.source ?? null,
    const: {
      helpExchangeRatio: integerField(rawConst, 'help_exchange_ratio', 'TopArena.Const', { min: 1 }),
      challengeStates,
      maxFightReport: integerField(rawConst, 'max_fight_report', 'TopArena.Const'),
      debuffTime: integerField(rawConst, 'debuff_time', 'TopArena.Const')
    },
    ruleConst: { enterTimes: integerField(rawRule, 'enter_times', 'TopArena.RuleConst') },
    helpConst: {
      progressTotal: integerField(rawHelp, 'progress_total', 'TopArena.HelpConst', { min: 1 }),
      helpTid: integerField(rawHelp, 'help_tid', 'TopArena.HelpConst', { min: 1 }),
      exchangeItem: awardPairs(rawHelp.exchange_item, 'TopArena.HelpConst'),
      exchangeCount: integerField(rawHelp, 'exchange_count', 'TopArena.HelpConst', { min: 1 }),
      helpMax: integerField(rawHelp, 'help_max', 'TopArena.HelpConst', { min: 1 }),
      helpCount: integerField(rawHelp, 'help_count', 'TopArena.HelpConst', { min: 1 }),
      award: awardPairs(rawHelp.award, 'TopArena.HelpConst')
    },
    publicityConst: {
      roleLikeCount: integerField(rawPublicity, 'role_like_cout', 'TopArena.PublicityConst'),
      teamLikeCount: integerField(rawPublicity, 'team_like_cout', 'TopArena.PublicityConst'),
      roleLikeAward: awardPairs(rawPublicity.role_like_award_list, 'TopArena.PublicityConst'),
      teamLikeAward: awardPairs(rawPublicity.team_like_award_list, 'TopArena.PublicityConst')
    },
    acts: byTid(optionalRowsOf(dump, 'Act').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.Act', { min: 1 }),
      groupType: integerField(row, 'group_type', 'TopArena.Act'),
      finalLineup: integerField(row, 'final_lineup', 'TopArena.Act'),
      finalFight: integerField(row, 'final_fight', 'TopArena.Act'),
      shopLib: integerField(row, 'shop_lib', 'TopArena.Act'),
      showSession: integerField(row, 'show_session', 'TopArena.Act')
    }))),
    times: byTid(optionalRowsOf(dump, 'Time').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.Time', { min: 1 }),
      startDay: integerField(row, 'start_day', 'TopArena.Time'),
      startTime: integerField(row, 'start_time', 'TopArena.Time')
    }))),
    stages: byTid(optionalRowsOf(dump, 'Stage').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.Stage', { min: 1 }),
      startState: integerField(row, 'start_state', 'TopArena.Stage', { min: 1 }),
      endState: integerField(row, 'end_state', 'TopArena.Stage', { min: 1 }),
      isOpenHelp: row.is_open_help === true,
      showName: integerField(row, 'show_name', 'TopArena.Stage')
    }))),
    areas: byTid(optionalRowsOf(dump, 'Area').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.Area', { min: 1 }),
      stage: integerField(row, 'stage', 'TopArena.Area', { min: 1 }),
      startState: integerField(row, 'start_state', 'TopArena.Area', { min: 1 }),
      fightTid: integerField(row, 'fight_tid', 'TopArena.Area'),
      levelIndex: integerField(row, 'lv_index', 'TopArena.Area')
    }))),
    helpAwards: byTid(optionalRowsOf(dump, 'HelpAward').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.HelpAward', { min: 1 }),
      helpCount: integerField(row, 'help_count', 'TopArena.HelpAward', { min: 1 }),
      award: awardPairs(row.award, 'TopArena.HelpAward')
    }))),
    helpStages: optionalRowsOf(dump, 'HelpStage').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.HelpStage', { min: 1 }),
      progressCount: integerField(row, 'progress_count', 'TopArena.HelpStage', { min: 1 })
    })).sort((left, right) => left.progressCount - right.progressCount),
    guessTypes: byTid(optionalRowsOf(dump, 'GuessType').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.GuessType', { min: 1 }),
      stage: integerField(row, 'stage', 'TopArena.GuessType', { min: 1 }),
      count: integerField(row, 'count', 'TopArena.GuessType', { min: 1 }),
      type: integerField(row, 'type', 'TopArena.GuessType', { min: 1 }),
      target: integerField(row, 'target', 'TopArena.GuessType')
    }))),
    guessAwards: byTid(optionalRowsOf(dump, 'GuessAward').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.GuessAward', { min: 1 }),
      award: awardPairs(row.award_list, 'TopArena.GuessAward')
    }))),
    rankRewards: rankRewardRows,
    rankRewardsByType,
    rankServerAwards: optionalRowsOf(dump, 'RankServerAward').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.RankServerAward', { min: 1 }),
      version: integerField(row, 'version', 'TopArena.RankServerAward', { min: 1 }),
      range: rangeOf(row, 'TopArena.RankServerAward'),
      award: awardPairs(row.award, 'TopArena.RankServerAward')
    })),
    rankServerMaxAwards: optionalRowsOf(dump, 'RankServerMaxAward').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.RankServerMaxAward', { min: 1 }),
      version: integerField(row, 'version', 'TopArena.RankServerMaxAward', { min: 1 }),
      range: rangeOf(row, 'TopArena.RankServerMaxAward'),
      award: awardPairs(row.award, 'TopArena.RankServerMaxAward')
    })),
    towerPreviewRewards: byTid(optionalRowsOf(dump, 'TowerPreviewRewards').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.TowerPreviewRewards', { min: 1 }),
      award: awardPairs(row.award_list, 'TopArena.TowerPreviewRewards')
    }))),
    stagePop: byTid(optionalRowsOf(dump, 'StagePop').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.StagePop', { min: 1 }),
      award: awardPairs(row.res_list, 'TopArena.StagePop')
    }))),
    noticeHot: optionalRowsOf(dump, 'NoticeHot').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.NoticeHot', { min: 1 }),
      range: rangeOf(row, 'TopArena.NoticeHot')
    })),
    crossRanks: optionalRowsOf(dump, 'CrossRank').map(row => ({
      tid: integerField(row, 'tid', 'TopArena.CrossRank', { min: 1 }),
      rankTid: integerField(row, 'rank_tid', 'TopArena.CrossRank', { min: 1 })
    }))
  };
  if (!result.stages.size) throw new Error('TopArena stage configuration is empty');
  if (file === defaultPath) defaultCache = result;
  return result;
}

// Slot table: one row per arena index inside an area.
export function readTopArenaSlots(file = defaultPath) {
  const dump = readJsonAsset(file);
  return optionalRowsOf(dump, 'Scatter').map(row => ({
    tid: integerField(row, 'tid', 'TopArena.Scatter', { min: 1 }),
    arena: integerField(row, 'arena', 'TopArena.Scatter', { min: 1 }),
    arenaCount: integerField(row, 'arena_count', 'TopArena.Scatter'),
    quality: integerField(row, 'quality', 'TopArena.Scatter'),
    attackCd: integerField(row, 'attack_cd', 'TopArena.Scatter'),
    protectTime: integerField(row, 'protect_time', 'TopArena.Scatter')
  }));
}

// Rank board whose reward applies to a final rank.
export function rankRewardFor(tables, type, rank) {
  const list = tables.rankRewardsByType.get(Number(type)) ?? [];
  for (const row of list) {
    if (Number(rank) >= row.range[0] && Number(rank) <= row.range[1]) return row;
  }
  return null;
}

export function rangeRowFor(rows, rank) {
  for (const row of rows) {
    if (Number(rank) >= row.range[0] && Number(rank) <= row.range[1]) return row;
  }
  return null;
}

export function isChallengeState(tables, stateId) {
  return tables.const.challengeStates.some(pair => Number(pair[0]) === Number(stateId) || Number(pair[1]) === Number(stateId));
}

export function topArenaRankTypeIds(tables, index) {
  return tables.rankRewardsByType.has(Number(index));
}
