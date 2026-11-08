import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

// Configuration for the G1 exploration / home work block. Every row family is
// recovered from the shipped client bundles by
// tools/extract-exploration-tables.mjs; a missing dump fails the read instead of
// letting the services invent a rule.
const table = name => tableAsset(name);
let cached;

export function readExplorationActTables() {
  if (cached) return cached;
  cached = {
    homePuzzle: readGeneratedTables(table('HomePuzzleActTable.data.lua.json'),
      ['Theme', 'Task', 'Pos', 'DecomposeAward', 'ProgressAward', 'Version', 'Piece', 'SocialConf']),
    homeland: readGeneratedTables(table('HomelandActTable.data.lua.json'),
      ['Task', 'Furniture', 'Const', 'Version', 'Happiness', 'RankUpAward', 'Module',
        'RoleAction', 'RoleActionType', 'RoleActionStyle']),
    carnival: readGeneratedTables(table('CarnivalTable.data.lua.json'),
      ['MonopolyBuild', 'MonopolyBuildLevel', 'MonopolyBuildPoint', 'MonopolyTech', 'MonopolyEvent',
        'MonopolyEventAward', 'MonopolyPath', 'MonopolyPathVersion', 'Const', 'AwardLib', 'Award',
        'Level', 'DailyAward', 'SlotMachine']),
    themeTreasure: readGeneratedTables(table('ThemeTreasureTable.data.lua.json'),
      ['Main', 'Hunt', 'Const', 'MapBox', 'CustomBox', 'ExchangeGroup', 'Exchange', 'DayTask',
        'ChallengeTask', 'ChallengeGroup', 'Rank', 'Gift', 'Sub']),
    miniGame: readGeneratedTables(table('MiniGameTable.data.lua.json'),
      ['MiniGame', 'SlotMachine', 'HuntGameAward', 'HuntGameVersion']),
    treasureHunt: readGeneratedTables(table('TreasureHuntTable.data.lua.json'),
      ['MapConst', 'MapGridLevel', 'MapMaxFloor', 'AwardConst', 'Const', 'ShovelLevel', 'HighAward']),
    grandTourer: readGeneratedTables(table('GrandTourerTable.data.lua.json'), ['Const']),
    dream: readGeneratedTables(table('DreamTable.data.lua.json'),
      ['Event', 'EventAward', 'EventAwardNew', 'Task', 'BoxAward', 'BoxAwardNew', 'Collect',
        'CollectAward', 'Const', 'WeekAward', 'WeekAwardNew', 'MonthAward', 'MonthAwardNew',
        'FixAward', 'FixAwardNew', 'AwardSplit', 'Group', 'GroupSeq']),
    magicalJourney: readGeneratedTables(table('MagicalJourneyTable.data.lua.json'),
      ['Const', 'Sword', 'SwordAttr', 'Country', 'CountrySub', 'CountrySubLevel', 'CountryStar',
        'NormalCollect', 'SeasonCollect', 'Mission', 'Boss', 'BossFightAward', 'BossDay', 'ChapterTask']),
    radishFarm: readGeneratedTables(table('RadishFarmTable.data.lua.json'),
      ['Const', 'Gift', 'Activity', 'GrowState']),
    experienceAct: readGeneratedTables(table('ExperienceActTable.data.lua.json'), ['Level', 'Activity']),
    petActivity: readGeneratedTables(table('PetActivityTable.data.lua.json'),
      ['Challenge', 'ChallengeTask', 'Cure', 'CureWound', 'CureFavor', 'PetDraw', 'Exchange']),
    weekendBonus: readGeneratedTables(table('WeekendBonusTable.data.lua.json'),
      ['Func', 'Shop', 'Const', 'WeekendBonus', 'ProgressAward'])
  };
  return cached;
}
