import { readJsonAsset, tableAsset } from '../assets.mjs';
import {
  awardPairs, byField, byTid, integerField, isEmptyLiteral, optionalRowsOf, rowsOf, splitAward
} from './lua-table-dump.mjs';

// MartialClubTable is extracted from the client table bundle by
// tools/extract-lua-table.mjs (see agent/workflow/gameplay-completion/
// BATTLE-MARTIALCLUB/implementation.md). The client ships the table as LuaJIT
// bytecode only, so the dump is generated once and committed as
// assets/tables/MartialClubTable.data.lua.json.gz.
const defaultPath = tableAsset('MartialClubTable.data.lua.json');
let defaultCache;

function chapterRow(row) {
  return {
    tid: integerField(row, 'tid', 'MartialClub.Chapter', { min: 1 }),
    unlockLevel: integerField(row, 'unlock_level', 'MartialClub.Chapter'),
    unlockCrossType: integerField(row, 'unlock_cross_type', 'MartialClub.Chapter'),
    serverAward: awardPairs(row.server_award, 'MartialClub.Chapter')
  };
}

function teamRow(row, powerLimits) {
  const tid = integerField(row, 'tid', 'MartialClub.Team', { min: 1 });
  return {
    tid,
    fightId: integerField(row, 'fight_id', 'MartialClub.Team'),
    firstAward: awardPairs(row.first_award, 'MartialClub.Team'),
    showFightAward: awardPairs(row.show_fight_award, 'MartialClub.Team'),
    showFightRate: Array.isArray(row.show_fight_rate) ? row.show_fight_rate.map(Number) : [],
    suppressSkill: integerField(row, 'suppress_skill', 'MartialClub.Team'),
    recommendPower: integerField(row, 'recommend_power', 'MartialClub.Team'),
    recommendPowerRate: integerField(row, 'recommend_power_rate', 'MartialClub.Team'),
    assistantParam: integerField(row, 'assistant_param', 'MartialClub.Team', { optional: true }),
    isElite: row.is_elite === true,
    powerLimits: powerLimits.get(tid) ?? []
  };
}

export function readMartialClubTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);

  const rawConst = rowsOf(dump, 'Const')[0] ?? {};
  const rawTeamConst = rowsOf(dump, 'TeamConst')[0] ?? {};
  const extraAwardMemberNum = integerField(rawTeamConst, 'extra_award_member_num', 'MartialClub.TeamConst');
  const teamConst = {
    inviteCd: integerField(rawTeamConst, 'invite_cd', 'MartialClub.TeamConst'),
    inviteAllCd: integerField(rawTeamConst, 'invite_all_cd', 'MartialClub.TeamConst'),
    addBotCd: integerField(rawTeamConst, 'add_bot_cd', 'MartialClub.TeamConst'),
    extraAwardMemberNum,
    teamExtraAwardNum: integerField(rawTeamConst, 'team_extra_award_num', 'MartialClub.TeamConst'),
    queryTeamMax: integerField(rawTeamConst, 'query_team_max', 'MartialClub.TeamConst'),
    specialQuality: integerField(rawTeamConst, 'special_quality', 'MartialClub.TeamConst'),
    maxNpcCount: integerField(rawTeamConst, 'max_npc_count', 'MartialClub.TeamConst'),
    autoFightTime: integerField(rawTeamConst, 'auto_fight_time', 'MartialClub.TeamConst'),
    employTipMaxCount: integerField(rawTeamConst, 'employ_tip_max_count', 'MartialClub.TeamConst'),
    challengeCountPerDay: integerField(rawTeamConst, 'challenge_count_per_day', 'MartialClub.TeamConst', { min: 1 }),
    maxChallengeCount: integerField(rawTeamConst, 'max_challenge_count', 'MartialClub.TeamConst', { min: 1 }),
    // The client table has no explicit team size column. extra_award_member_num
    // is the number of members beyond the leader that carry the extra award, so
    // the recoverable team size is leader + that number (4 in the shipped data),
    // which also matches max_npc_count = 3 fill-ins.
    maxMembers: extraAwardMemberNum + 1
  };

  const powerLimits = new Map();
  for (const row of optionalRowsOf(dump, 'Power')) {
    const boss = integerField(row, 'martial_club', 'MartialClub.Power', { min: 1 });
    const entry = {
      tid: integerField(row, 'tid', 'MartialClub.Power', { min: 1 }),
      powerLimit: integerField(row, 'power_limit', 'MartialClub.Power')
    };
    if (!powerLimits.has(boss)) powerLimits.set(boss, []);
    powerLimits.get(boss).push(entry);
  }
  for (const list of powerLimits.values()) list.sort((left, right) => left.powerLimit - right.powerLimit);

  const result = {
    source: dump.source ?? null,
    global: {
      costItem: integerField(rawConst, 'cost_item', 'MartialClub.Const'),
      costNum: integerField(rawConst, 'cost_num', 'MartialClub.Const'),
      openAward: awardPairs(rawConst.open_award, 'MartialClub.Const'),
      bossNumPerChapter: integerField(rawConst, 'boss_num_per_chapter', 'MartialClub.Const', { min: 1 }),
      relicQuality: Array.isArray(rawConst.relic_quality) ? rawConst.relic_quality.map(Number).filter(Number.isSafeInteger) : [],
      assertResolve: Number(rawConst.assert_resolve ?? 0)
    },
    teamConst,
    teams: byTid(rowsOf(dump, 'Team').map(row => teamRow(row, powerLimits))),
    clubBosses: byTid(rowsOf(dump, 'MartialClub').map((row) => {
      const tid = integerField(row, 'tid', 'MartialClub.MartialClub', { min: 1 });
      return {
        tid,
        chapter: integerField(row, 'chapter', 'MartialClub.MartialClub', { min: 1 }),
        fightId: integerField(row, 'fight_id', 'MartialClub.MartialClub'),
        firstAward: awardPairs(row.first_award, 'MartialClub.MartialClub'),
        randomFightAward: Array.isArray(row.random_fight_award) && row.random_fight_award.length
          ? (row.random_fight_award[0] ?? []).map(entry => ({ awardLib: Number(entry?.[0] ?? 0), weight: Number(entry?.[1] ?? 0) }))
          : [],
        randomFightAwardN: Array.isArray(row.random_fight_award_n) && row.random_fight_award_n.length
          ? (row.random_fight_award_n[0] ?? []).map(entry => ({ countLib: Number(entry?.[0] ?? 0), weight: Number(entry?.[1] ?? 0) }))
          : [],
        assistantParam: integerField(row, 'assistant_param', 'MartialClub.MartialClub', { optional: true })
      };
    })),
    chapters: byTid(rowsOf(dump, 'Chapter').map(chapterRow)),
    helpAwards: optionalRowsOf(dump, 'HelpAward').map(row => ({
      tid: integerField(row, 'tid', 'MartialClub.HelpAward', { min: 1 }),
      award: awardPairs(row.award, 'MartialClub.HelpAward'),
      times: integerField(row, 'times', 'MartialClub.HelpAward', { min: 1 })
    })).sort((left, right) => left.times - right.times),
    buyFights: byField(optionalRowsOf(dump, 'BuyFight').map(row => ({
      tid: integerField(row, 'tid', 'MartialClub.BuyFight', { min: 1 }),
      cost: integerField(row, 'cost', 'MartialClub.BuyFight', { min: 1 }),
      costN: integerField(row, 'cost_n', 'MartialClub.BuyFight', { min: 1 })
    })), 'tid'),
    awardLib: byTid(optionalRowsOf(dump, 'AwardLib').map(row => ({
      tid: integerField(row, 'tid', 'MartialClub.AwardLib', { min: 1 }),
      award: splitAward(row, 'award', 'award_n', 'MartialClub.AwardLib'),
      weight: integerField(row, 'weight', 'MartialClub.AwardLib')
    }))),
    countLib: byTid(optionalRowsOf(dump, 'CountLib').map(row => ({
      tid: integerField(row, 'tid', 'MartialClub.CountLib', { min: 1 }),
      count: integerField(row, 'count', 'MartialClub.CountLib'),
      weight: integerField(row, 'weight', 'MartialClub.CountLib')
    }))),
    teamBuffSkills: optionalRowsOf(dump, 'TeamBuff').map(row => integerField(row, 'skill', 'MartialClub.TeamBuff')),
    teamSkip: (optionalRowsOf(dump, 'TeamSkip')[0] ?? null) && {
      unlock: Number(rowsOf(dump, 'TeamSkip')[0].unlock ?? 0),
      botSkipSec: Number(rowsOf(dump, 'TeamSkip')[0].bot_skip_sec ?? 0)
    },
    enterLimitTypes: new Set(optionalRowsOf(dump, 'EnterLimitType').map(row => Number(row.tid))),
    fightTypes: new Set(optionalRowsOf(dump, 'FightType').map(row => Number(row.tid))),
    employThanks: optionalRowsOf(dump, 'EmployThank').map(row => Number(row.tid))
  };
  if (!result.teams.size) throw new Error('MartialClub team configuration is empty');
  if (!result.teamConst.challengeCountPerDay) throw new Error('MartialClub challenge count is not configured');
  if (file === defaultPath) defaultCache = result;
  return result;
}

// A chapter is unlocked when the role level reaches unlock_level and the
// previous chapter's boss has been passed (client MartialClubMgr.IsChapterUnlock).
export function martialClubChapterOf(tables, bossTid) {
  const row = tables.clubBosses.get(Number(bossTid));
  return row ? tables.chapters.get(Number(row.chapter)) ?? null : null;
}

export function martialClubTeamUnlockLevel(tables, teamTid) {
  const boss = tables.clubBosses.get(Number(teamTid));
  if (!boss) return null;
  const chapter = tables.chapters.get(Number(boss.chapter));
  return chapter ? chapter.unlockLevel : null;
}

export function isEmptyAward(value) {
  return isEmptyLiteral(value);
}
