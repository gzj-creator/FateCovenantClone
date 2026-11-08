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
      ['Task', 'Furniture', 'Const', 'Version', 'Happiness', 'RankUpAward', 'Module']),
    carnival: readGeneratedTables(table('CarnivalTable.data.lua.json'),
      ['MonopolyBuild', 'MonopolyBuildLevel', 'MonopolyTech', 'MonopolyEvent', 'Const', 'AwardLib', 'Level']),
    themeTreasure: readGeneratedTables(table('ThemeTreasureTable.data.lua.json'),
      ['Main', 'Hunt', 'Const', 'Map', 'Exchange', 'DayTask', 'ChallengeTask']),
    miniGame: readGeneratedTables(table('MiniGameTable.data.lua.json'),
      ['MiniGame', 'SlotMachine', 'HuntGameAward', 'HuntGameVersion']),
    treasureHunt: readGeneratedTables(table('TreasureHuntTable.data.lua.json'),
      ['MapConst', 'MapGridLevel', 'MapMaxFloor', 'AwardConst', 'Const', 'ShovelLevel']),
    grandTourer: readGeneratedTables(table('GrandTourerTable.data.lua.json'), ['Const']),
    dream: readGeneratedTables(table('DreamTable.data.lua.json'),
      ['Event', 'EventAward', 'Task', 'BoxAward', 'CollectAward', 'Const', 'WeekAward', 'MonthAward']),
    magicalJourney: readGeneratedTables(table('MagicalJourneyTable.data.lua.json'),
      ['Const', 'Sword', 'Country', 'CountrySub', 'CountrySubLevel', 'CountryStar', 'NormalCollect',
        'SeasonCollect', 'Mission', 'Boss', 'BossFightAward', 'BossDay']),
    radishFarm: readGeneratedTables(table('RadishFarmTable.data.lua.json'),
      ['Const', 'Gift', 'Activity', 'GrowState']),
    experienceAct: readGeneratedTables(table('ExperienceActTable.data.lua.json'), ['Level', 'Activity'])
  };
  return cached;
}
