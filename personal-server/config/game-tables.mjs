import { readGeneratedTables } from './hero-tables.mjs';
const base = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/', import.meta.url);
let cached;
export function readGameTables() {
  return cached ??= {
    // Item box rules: the client picks the use command from ItemTable.Type.obj_class.
    ...readGeneratedTables(new URL('ItemTable.data.lua.json', base), ['Item', 'Type', 'Random_Box', 'Designated_Box', 'OptionalBox', 'BoxRepeat', 'Pay_Box']),
    // Draw library used by Random_Box.draw_lib: LibWeight picks a group, Group.lib_range picks the award.
    ...pick(readGeneratedTables(new URL('DrawTable.data.lua.json', base), ['LibWeight', 'Item', 'Group']), { LibWeight: 'DrawLibWeight', Item: 'DrawItem', Group: 'DrawGroup' }),
    ...Object.fromEntries(Object.entries(readGeneratedTables(new URL('RechargeTable.data.lua.json', base), ['Recharge', 'Param', 'BuyCycleLimit'])).map(([k,v]) => [k === 'Param' ? 'RechargeParam' : k,v])),
    ...readGeneratedTables(new URL('OpenServerSprintTable.data.lua.json', base), ['SprintRankTask', 'SprintType']),
    // Monthly pass products are RechargeTable type=130 rows; the matching Gear row
    // binds a product to the activity version that owns its pay_list entry.
    ...pick(readGeneratedTables(new URL('MonthPermitTable.data.lua.json', base), ['Gear', 'Cycle']), { Gear: 'MonthPermitGear', Cycle: 'MonthPermitCycle' }),
    // Standard permits link their RechargeTable product to module 38.
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/PermitTable.data.bytecode.json', import.meta.url), ['Base']), { Base: 'PermitBase' }),
    ...pick(readGeneratedTables(new URL('ActFrameTable.data.lua.json', base), ['Act', 'ActType']), { Act: 'ActFrameAct', ActType: 'ActFrameType' }),
    // Cumulative-recharge awards are keyed by award tid; version links each row
    // to the ActFrame type that owns the claim state.
    AccRechargeAward: readGeneratedTables(new URL('AccRechargeActTable.data.lua.json', base), ['Award']).Award,
    // The hundred-yuan cumulative-recharge panel keeps its tier and award tables
    // separate from ActFrame-based activities.
    ...pick(readGeneratedTables(new URL('HundredAccTable.data.lua.json', base), ['Group', 'Reward']), {
      Group: 'HundredAccGroup',
      Reward: 'HundredAccReward'
    }),
    // Fishing activity versions bind an ActFrame row to one island/level/rules
    // generation. Keep these names separate from generic activity tables.
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/FishingActTable.data.lua.json', import.meta.url), [
      'Island', 'Version', 'Level', 'IslandFish', 'Const', 'HighScoreRank', 'ScoreRank',
      'Buy', 'Progress', 'Rod', 'Fish', 'IsWeather', 'IslandWeight', 'QteGame', 'Quality'
    ]), {
      Island: 'FishingIsland',
      Version: 'FishingVersion',
      Level: 'FishingLevel',
      IslandFish: 'FishingIslandFish',
      Const: 'FishingConst',
      HighScoreRank: 'FishingHighScoreRank',
      ScoreRank: 'FishingScoreRank',
      Buy: 'FishingBuy',
      Progress: 'FishingProgress',
      Rod: 'FishingRod',
      Fish: 'FishingFish',
      IsWeather: 'FishingWeather',
      IslandWeight: 'FishingIslandWeight',
      QteGame: 'FishingQteGame',
      Quality: 'FishingQuality'
    }),
    // Welfare activities expose their configuration through these generated tables.
    Activity: readGeneratedTables(new URL('ActivityTable.data.lua.json', base), ['Activity']).Activity,
    // The pet activity owns both its exclusive currency shop and recharge gift
    // family. Keep the generated names explicit so those two code paths cannot
    // mix them with the ordinary mall tables.
    ...readGeneratedTables(new URL('../../analysis/tmp/activity-decompiled/PetActivityTable.data.lua.json', import.meta.url), [
      'PopupShow', 'MainShow', 'PetDecoration', 'Pet', 'ChallengeBuff',
      'ChallengeTask', 'ChallengeRankAward', 'ChallengeVersion', 'Challenge',
      'CureWoundState', 'CureFavor', 'Cure', 'PetExclusiveShop', 'PetDraw',
      'GiftShop', 'PetActivity', 'Exchange'
    ]),
    // The hero-draw activity owns the hundred-schools genre selection, draw and
    // star tasks, four genre rankings, and its recharge gift family.
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/activity-decompiled/HeroDrawActTable.data.lua.json', import.meta.url), [
      'GenreRank', 'Task', 'TaskType', 'Const', 'RankReward', 'Gift'
    ]), {
      GenreRank: 'HeroDrawActGenreRank',
      Task: 'HeroDrawActTask',
      TaskType: 'HeroDrawActTaskType',
      Const: 'HeroDrawActConst',
      RankReward: 'HeroDrawActRankReward',
      Gift: 'HeroDrawActGift'
    }),
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/activity-decompiled/ShopTable.data.lua.json', import.meta.url), [
      'Item', 'Period', 'AutoRefresh', 'Main'
    ]), {
      Item: 'ShopItem',
      Period: 'ShopPeriod',
      AutoRefresh: 'ShopAutoRefresh',
      Main: 'ShopMain'
    }),
    ...readGeneratedTables(new URL('MultiLoginTable.data.lua.json', base), ['Const', 'MultiLogin']),
    ...readGeneratedTables(new URL('PrincessTable.data.lua.json', base), ['EnergyAward', 'Gift', 'LoginAward', 'HolidayAward']),
    // Daily-discount rotation maps its short row ids (1..6) to real RechargeTable ids.
    ...pick(readGeneratedTables(new URL('DailyDiscountTable.data.lua.json', base), ['Recharge', 'Select', 'DailyGiftAward']), { Recharge: 'DailyDiscountRecharge', Select: 'DailyDiscountSelect', DailyGiftAward: 'DailyDiscountAward' }),
    // Task progress uses these rows to map TaskType.data back to the compact
    // role-statistics payload stored in login module 21.
    ...pick(readGeneratedTables(new URL('CountStatisticsTable.data.lua.json', base), ['CountStatistics']), {
      CountStatistics: 'CountStatistics'
    }),
    ...pick(readGeneratedTables(new URL('TaskTable.data.lua.json', base), ['Type', 'LinearTask', 'CommonTaskGlobal']), {
      Type: 'TaskType',
      LinearTask: 'LinearTask',
      CommonTaskGlobal: 'CommonTaskGlobal'
    }),
    // RoleTable.Level is the authoritative role experience curve consumed by
    // RoleMgr.CalcLvAndExp and the post-battle RoleExpUpForm.
    ...pick(readGeneratedTables(new URL('RoleTable.data.lua.json', base), ['Level', 'LevelSetting']), {
      Level: 'RoleLevel',
      LevelSetting: 'RoleLevelSetting'
    })
  };
}
function pick(tables, names) { return Object.fromEntries(Object.entries(names).map(([from, to]) => [to, tables[from]])); }
