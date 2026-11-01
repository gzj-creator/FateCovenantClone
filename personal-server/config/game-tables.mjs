import { readGeneratedTables } from './hero-tables.mjs';
import { wishTreeTables } from './wish-tree-tables.mjs';
const base = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/', import.meta.url);
let cached;
export function readGameTables() {
  if (cached) return cached;
  const tables = {
    // Item box rules: the client picks the use command from ItemTable.Type.obj_class.
    // OptionalSuitBox/OptionalSuitRes drive the suit boxes whose use path is
    // ItemCmd.use_selected_suit_box (155): the box row lists the selectable
    // suits, each suit row owns the fixed award_list that gets granted.
    ...readGeneratedTables(new URL('ItemTable.data.lua.json', base), [
      'Item', 'Type', 'Chip', 'Random_Box', 'Designated_Box', 'OptionalBox', 'BoxRepeat', 'Pay_Box',
      'OptionalSuitBox', 'OptionalSuitRes', 'OptionalSuitType'
    ]),
    // Draw library used by Random_Box.draw_lib: LibWeight picks a group, Group.lib_range picks the award.
    ...pick(readGeneratedTables(new URL('DrawTable.data.lua.json', base), ['LibWeight', 'Item', 'Group']), { LibWeight: 'DrawLibWeight', Item: 'DrawItem', Group: 'DrawGroup' }),
    ...Object.fromEntries(Object.entries(readGeneratedTables(new URL('RechargeTable.data.lua.json', base), [
      'Recharge', 'Param', 'BuyCycleLimit', 'ExtraReward', 'ExtraFixReward', 'ExtraRewardConst'
    ])).map(([k,v]) => [k === 'Param' ? 'RechargeParam' : k,v])),
    // Monthly cards use login module 20. The primary recharge id maps each
    // product to one pb_monthly_card_info row and its active period.
    MonthlyCard: readGeneratedTables(new URL('MonthlyCardTable.data.lua.json', base), ['MonthlyCard']).MonthlyCard,
    PermanentCard: readGeneratedTables(new URL('PermanentCardTable.data.lua.json', base), ['PermanentCard']).PermanentCard,
    ...pick(readGeneratedTables(new URL('DiamondFundTable.data.lua.json', base), ['Type']), {
      Type: 'DiamondFundType'
    }),
    ...readGeneratedTables(new URL('OpenServerSprintTable.data.lua.json', base), ['SprintRankTask', 'SprintType']),
    // Monthly pass products are RechargeTable type=130 rows; the matching Gear row
    // binds a product to the activity version that owns its pay_list entry.
    ...pick(readGeneratedTables(new URL('MonthPermitTable.data.lua.json', base), ['Gear', 'GearLv', 'Cycle', 'UpLv', 'BuyExp', 'TaskType', 'Task']), {
      Gear: 'MonthPermitGear', GearLv: 'MonthPermitGearLv', Cycle: 'MonthPermitCycle', UpLv: 'MonthPermitUpLv', BuyExp: 'MonthPermitBuyExp', TaskType: 'MonthPermitTaskType', Task: 'MonthPermitTask'
    }),
    // Standard permits link their RechargeTable product to module 38.
    ...pick(readGeneratedTables(new URL('PermitTable.data.lua.json', base), [
      'Base', 'Cycle', 'Level', 'Type', 'DynamicArgs'
    ]), {
      Base: 'PermitBase',
      Cycle: 'PermitCycle',
      Level: 'PermitLevel',
      Type: 'PermitType',
      DynamicArgs: 'PermitDynamicArgs'
    }),
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
    // CMS type 1 is the questionnaire channel. The row supplies the protobuf
    // schema used by the client; individual valid-time windows live in SQLite.
    Cms: readGeneratedTables(new URL('CmsTable.data.lua.json', base), ['Cms']).Cms,
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
    ...readGeneratedTables(new URL('../../analysis/work/relic-divine-activities/tables/ArtifactDrawActTable.data.json', import.meta.url), [
      'ArtifactDrawRate', 'ArtifactDrawRound', 'ArtifactDrawTask', 'ArtifactDrawVersion',
      'ArtifactDrawConst', 'ArtifactDrawGift', 'TrialsBuff', 'TrialsTask', 'TrialsChallenge',
      'TrialsRankAward', 'TrialsVersion'
    ]),
    ...pick(readGeneratedTables(new URL('../../analysis/work/relic-divine-activities/tables/DemigodActTable.data.json', import.meta.url), [
      'Shop', 'Show', 'DrawWish', 'Draw', 'DrawFantasy', 'DrawAward', 'Gift', 'DemigodAct',
      'DemigodTrialDamage', 'DemigodTrialBless', 'DemigodTrialStar', 'DemigodTrialLevel', 'DemigodTrial'
    ]), {
      Shop: 'DemigodShop', Show: 'DemigodShow', DrawWish: 'DemigodDrawWish', Draw: 'DemigodDraw',
      DrawFantasy: 'DemigodDrawFantasy', DrawAward: 'DemigodDrawAward', Gift: 'DemigodGift',
      DemigodAct: 'DemigodAct', DemigodTrialDamage: 'DemigodTrialDamage',
      DemigodTrialBless: 'DemigodTrialBless', DemigodTrialStar: 'DemigodTrialStar',
      DemigodTrialLevel: 'DemigodTrialLevel', DemigodTrial: 'DemigodTrial'
    }),
    ...pick(readGeneratedTables(new URL('../../analysis/recruitment-debug/bytecode/FantasyEquipTable.data.json', import.meta.url), [
      'FantasyEquip', 'DrawNormal', 'DrawNormalWish', 'DrawUnlock',
      'Const', 'QualityUp', 'StarUp', 'SpStarUp', 'Material', 'LevelUp',
      'BreakUp', 'StarAdd', 'MaxStar', 'Type', 'Skill', 'BlessAdd',
      'BlessAttr', 'FantasyFightDisplay', 'FantasyStarStoneTid', 'SpSlot'
    ]), {
      FantasyEquip: 'FantasyEquip', DrawNormal: 'FantasyDrawNormal',
      DrawNormalWish: 'FantasyDrawNormalWish', DrawUnlock: 'FantasyDrawUnlock',
      Const: 'FantasyEquipConst', QualityUp: 'FantasyQualityUp',
      StarUp: 'FantasyStarUp', SpStarUp: 'FantasySpStarUp',
      Material: 'FantasyMaterial', LevelUp: 'FantasyLevelUp',
      BreakUp: 'FantasyBreakUp', StarAdd: 'FantasyStarAdd',
      MaxStar: 'FantasyMaxStar', Type: 'FantasyType', Skill: 'FantasySkill',
      BlessAdd: 'FantasyBlessAdd', BlessAttr: 'FantasyBlessAttr',
      FantasyFightDisplay: 'FantasyFightDisplay',
      FantasyStarStoneTid: 'FantasyStarStoneTid', SpSlot: 'FantasySpSlot'
    }),
    ...readGeneratedTables(new URL('../../analysis/work/relic-divine-activities/MiniGameTable.data.json', import.meta.url), [
      'MarblesConst', 'Marbles'
    ]),
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
    // Week Hunt reuses the daily-discount products for its 14-day gift track.
    // The generated Period/Const tables define the active gift ids and cadence.
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/WeekHuntTable.data.bytecode.json', import.meta.url), ['Period', 'Const']), {
      Period: 'WeekHuntPeriod',
      Const: 'WeekHuntConst'
    }),
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
    ...pick(readGeneratedTables(new URL('RoleTable.data.lua.json', base), [
      'Level', 'LevelSetting', 'FigureHead', 'FigureFrame', 'FigureTitle', 'FigureChatBubble'
    ]), {
      Level: 'RoleLevel',
      LevelSetting: 'RoleLevelSetting',
      FigureHead: 'FigureHead',
      FigureFrame: 'FigureFrame',
      FigureTitle: 'FigureTitle',
      FigureChatBubble: 'FigureChatBubble'
    }),
    ...pick(readGeneratedTables(new URL('HeroTable.data.lua.json', base), ['Hero']), { Hero: 'Hero' }),
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/recharge-remaining-plan/7289607387164353000-FirstRechargeTable.data.json', import.meta.url), ['FirstRecharge', 'Award']), {
      FirstRecharge: 'FirstRecharge',
      Award: 'FirstRechargeAward'
    }),
    // WishTree (rebate) is a login-module table rather than an activity. Its
    // gift groups and award rows are small enough to keep as reviewed static
    // configuration; module 165 still stores every mutable field.
    ...wishTreeTables,
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/recharge-remaining-plan/14863431925290164000-RechargeBonusTable.data.json', import.meta.url), ['RechargeBonus', 'Group', 'Award']), {
      RechargeBonus: 'RechargeBonus',
      Group: 'RechargeBonusGroup',
      Award: 'RechargeBonusAward'
    }),
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/recharge-remaining-plan/7806056895365336000-RechargeRebateResetTable.data.json', import.meta.url), ['Act']), {
      Act: 'RechargeRebateResetAct'
    }),
    ...pick(readGeneratedTables(new URL('../../analysis/tmp/recharge-remaining-plan/LineFirstRechargeTable.data.json', import.meta.url), [
      'Group', 'Choose', 'LineFirstRecharge'
    ]), {
      Group: 'LineFirstRechargeGroup',
      Choose: 'LineFirstRechargeChoose',
      LineFirstRecharge: 'LineFirstRecharge'
    })
  };
  cached = { ...tables, ...buildFantasyChipIndexes(tables.Chip, tables.FantasyEquip, tables.Item) };
  return cached;
}
function pick(tables, names) { return Object.fromEntries(Object.entries(names).map(([from, to]) => [to, tables[from]])); }

export function buildFantasyChipIndexes(chipTable, equipTable, itemTable) {
  if (!(chipTable instanceof Map) || !(equipTable instanceof Map) || !(itemTable instanceof Map)) {
    throw new Error('Fantasy chip configuration is missing');
  }
  const byPointItem = new Map(), byTid = new Map();
  const positiveInt = (value, field) => {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
      throw new Error(`Invalid fantasy chip ${field}`);
    }
    return number;
  };
  for (const [key, row] of chipTable) {
    if (Number(row?.type) !== 223) continue;
    const tid = positiveInt(row.tid ?? key, 'tid');
    const pointItem = positiveInt(row.point_item, 'point_item');
    const needNum = positiveInt(row.need_num, 'need_num');
    const chipItem = itemTable.get(tid), targetItem = itemTable.get(pointItem), target = equipTable.get(pointItem);
    if (!chipItem || !targetItem || !target || Number(target.tid) !== pointItem || Number(targetItem.type) !== 223) {
      throw new Error(`Fantasy chip ${tid} has an invalid point_item ${pointItem}`);
    }
    if (byTid.has(tid) || byPointItem.has(pointItem)) {
      throw new Error(`Duplicate fantasy chip mapping for tid ${tid} or point_item ${pointItem}`);
    }
    const entry = Object.freeze({ tid, point_item: pointItem, need_num: needNum });
    byTid.set(tid, entry);
    byPointItem.set(pointItem, entry);
  }
  return { FantasyChipByPointItem: byPointItem, FantasyChipByTid: byTid };
}
