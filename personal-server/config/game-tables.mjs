import { readGeneratedTables } from './hero-tables.mjs';
import { wishTreeTables } from './wish-tree-tables.mjs';
import { tableAsset } from '../assets.mjs';
const table = name => tableAsset(name);
let cached;
export function readGameTables() {
  if (cached) return cached;
  const tables = {
    // Item box rules: the client picks the use command from ItemTable.Type.obj_class.
    // OptionalSuitBox/OptionalSuitRes drive the suit boxes whose use path is
    // ItemCmd.use_selected_suit_box (155): the box row lists the selectable
    // suits, each suit row owns the fixed award_list that gets granted.
    ...readGeneratedTables(table('ItemTable.data.lua.json'), [
      'Item', 'Type', 'Chip', 'Random_Box', 'Designated_Box', 'OptionalBox', 'BoxRepeat', 'Pay_Box',
      'OptionalSuitBox', 'OptionalSuitRes', 'OptionalSuitType'
    ]),
    // Draw library used by Random_Box.draw_lib: LibWeight picks a group, Group.lib_range picks the award.
    ...pick(readGeneratedTables(table('DrawTable.data.lua.json'), ['LibWeight', 'Item', 'Group']), { LibWeight: 'DrawLibWeight', Item: 'DrawItem', Group: 'DrawGroup' }),
    ...Object.fromEntries(Object.entries(readGeneratedTables(table('RechargeTable.data.lua.json'), [
      'Recharge', 'Handle', 'Param', 'BuyCycleLimit', 'ExtraReward', 'ExtraFixReward', 'ExtraRewardConst'
    ])).map(([k,v]) => [k === 'Param' ? 'RechargeParam' : k === 'Handle' ? 'RechargeHandle' : k,v])),
    MonthlyCard: readGeneratedTables(table('MonthlyCardTable.data.lua.json'), ['MonthlyCard']).MonthlyCard,
    PermanentCard: readGeneratedTables(table('PermanentCardTable.data.lua.json'), ['PermanentCard']).PermanentCard,
    ...pick(readGeneratedTables(table('DiamondFundTable.data.lua.json'), ['Type']), {
      Type: 'DiamondFundType'
    }),
    ...readGeneratedTables(table('OpenServerSprintTable.data.lua.json'), ['SprintRankTask', 'SprintType']),
    // Monthly pass products are RechargeTable type=130 rows; the matching Gear row
    // binds a product to the activity version that owns its pay_list entry.
    ...pick(readGeneratedTables(table('MonthPermitTable.data.lua.json'), ['Gear', 'GearLv', 'Cycle', 'UpLv', 'BuyExp', 'TaskType', 'Task']), {
      Gear: 'MonthPermitGear', GearLv: 'MonthPermitGearLv', Cycle: 'MonthPermitCycle', UpLv: 'MonthPermitUpLv',
      BuyExp: 'MonthPermitBuyExp', TaskType: 'MonthPermitTaskType', Task: 'MonthPermitTask'
    }),
    // Standard permits link their RechargeTable product to module 38.
    ...pick(readGeneratedTables(table('PermitTable.data.lua.json'), [
      'Base', 'Cycle', 'Level', 'Type', 'DynamicArgs'
    ]), {
      Base: 'PermitBase', Cycle: 'PermitCycle', Level: 'PermitLevel', Type: 'PermitType', DynamicArgs: 'PermitDynamicArgs'
    }),
    ...pick(readGeneratedTables(table('ActFrameTable.data.lua.json'), ['Act', 'ActType']), { Act: 'ActFrameAct', ActType: 'ActFrameType' }),
    // Cumulative-recharge awards are keyed by award tid; version links each row
    // to the ActFrame type that owns the claim state.
    AccRechargeAward: readGeneratedTables(table('AccRechargeActTable.data.lua.json'), ['Award']).Award,
    // The hundred-yuan cumulative-recharge panel keeps its tier and award tables
    // separate from ActFrame-based activities.
    ...pick(readGeneratedTables(table('HundredAccTable.data.lua.json'), ['Group', 'Reward']), {
      Group: 'HundredAccGroup',
      Reward: 'HundredAccReward'
    }),
    // Fishing activity versions bind an ActFrame row to one island/level/rules
    // generation. Keep these names separate from generic activity tables.
    ...pick(readGeneratedTables(table('FishingActTable.data.lua.json'), [
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
    Activity: readGeneratedTables(table('ActivityTable.data.lua.json'), ['Activity']).Activity,
    // CMS type 1 is the questionnaire channel. The row supplies the protobuf
    // schema used by the client; individual valid-time windows live in SQLite.
    Cms: readGeneratedTables(table('CmsTable.data.lua.json'), ['Cms']).Cms,
    // The pet activity owns both its exclusive currency shop and recharge gift
    // family. Keep the generated names explicit so those two code paths cannot
    // mix them with the ordinary mall tables.
    ...readGeneratedTables(table('PetActivityTable.data.lua.json'), [
      'PopupShow', 'MainShow', 'PetDecoration', 'Pet', 'ChallengeBuff',
      'ChallengeTask', 'ChallengeRankAward', 'ChallengeVersion', 'Challenge',
      'CureWoundState', 'CureFavor', 'Cure', 'PetExclusiveShop', 'PetDraw',
      'GiftShop', 'PetActivity', 'Exchange'
    ]),
    // The hero-draw activity owns the hundred-schools genre selection, draw and
    // star tasks, four genre rankings, and its recharge gift family.
    ...pick(readGeneratedTables(table('HeroDrawActTable.data.lua.json'), [
      'GenreRank', 'Task', 'TaskType', 'Const', 'RankReward', 'Gift'
    ]), {
      GenreRank: 'HeroDrawActGenreRank',
      Task: 'HeroDrawActTask',
      TaskType: 'HeroDrawActTaskType',
      Const: 'HeroDrawActConst',
      RankReward: 'HeroDrawActRankReward',
      Gift: 'HeroDrawActGift'
    }),
    ...readGeneratedTables(table('ArtifactDrawActTable.data.json'), [
      'ArtifactDrawRate', 'ArtifactDrawRound', 'ArtifactDrawTask', 'ArtifactDrawVersion',
      'ArtifactDrawConst', 'ArtifactDrawGift', 'TrialsBuff', 'TrialsTask', 'TrialsChallenge',
      'TrialsRankAward', 'TrialsVersion'
    ]),
    ...pick(readGeneratedTables(table('DemigodActTable.data.json'), [
      'Shop', 'Show', 'DrawWish', 'Draw', 'DrawFantasy', 'DrawAward', 'Gift', 'DemigodAct',
      'DemigodTrialDamage', 'DemigodTrialBless', 'DemigodTrialStar', 'DemigodTrialLevel', 'DemigodTrial'
    ]), {
      Shop: 'DemigodShop', Show: 'DemigodShow', DrawWish: 'DemigodDrawWish', Draw: 'DemigodDraw',
      DrawFantasy: 'DemigodDrawFantasy', DrawAward: 'DemigodDrawAward', Gift: 'DemigodGift',
      DemigodAct: 'DemigodAct', DemigodTrialDamage: 'DemigodTrialDamage',
      DemigodTrialBless: 'DemigodTrialBless', DemigodTrialStar: 'DemigodTrialStar',
      DemigodTrialLevel: 'DemigodTrialLevel', DemigodTrial: 'DemigodTrial'
    }),
    ...pick(readGeneratedTables(table('FantasyEquipTable.data.json'), [
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
    ...readGeneratedTables(table('MiniGameTable.data.json'), [
      'MarblesConst', 'Marbles'
    ]),
    ...pick(readGeneratedTables(table('ShopTable.data.lua.json'), [
      'Item', 'Period', 'AutoRefresh', 'Main'
    ]), {
      Item: 'ShopItem',
      Period: 'ShopPeriod',
      AutoRefresh: 'ShopAutoRefresh',
      Main: 'ShopMain'
    }),
    ...readGeneratedTables(table('MultiLoginTable.data.lua.json'), ['Const', 'MultiLogin']),
    ...readGeneratedTables(table('PrincessTable.data.lua.json'), ['EnergyAward', 'Gift', 'LoginAward', 'HolidayAward']),
    // Daily-discount rotation maps its short row ids (1..6) to real RechargeTable ids.
    ...pick(readGeneratedTables(table('DailyDiscountTable.data.lua.json'), ['Recharge', 'Select', 'DailyGiftAward']), { Recharge: 'DailyDiscountRecharge', Select: 'DailyDiscountSelect', DailyGiftAward: 'DailyDiscountAward' }),
    // Week Hunt reuses the daily-discount products for its 14-day gift track.
    // The generated Period/Const tables define the active gift ids and cadence.
    ...pick(readGeneratedTables(table('WeekHuntTable.data.bytecode.json'), ['Period', 'Const']), {
      Period: 'WeekHuntPeriod',
      Const: 'WeekHuntConst'
    }),
    // Task progress uses these rows to map TaskType.data back to the compact
    // role-statistics payload stored in login module 21.
    ...pick(readGeneratedTables(table('CountStatisticsTable.data.lua.json'), ['CountStatistics']), {
      CountStatistics: 'CountStatistics'
    }),
    ...pick(readGeneratedTables(table('TaskTable.data.lua.json'), ['Type', 'LinearTask', 'CommonTaskGlobal']), {
      Type: 'TaskType',
      LinearTask: 'LinearTask',
      CommonTaskGlobal: 'CommonTaskGlobal'
    }),
    // Elite missions use generated row constructors for stage, box and chapter
    // progression. Load the authoritative table family instead of accepting
    // arbitrary client ids or recording empty claims.
    ...readGeneratedTables(table('EliteMissionTable.data.lua.json'), [
      'Base', 'Boss', 'EliteMission', 'Box', 'Chapter', 'Stage'
    ]),
    // RoleTable.Level is the authoritative role experience curve consumed by
    // RoleMgr.CalcLvAndExp and the post-battle RoleExpUpForm.
    ...pick(readGeneratedTables(table('RoleTable.data.lua.json'), [
      'Level', 'LevelSetting', 'FigureHead', 'FigureFrame', 'FigureTitle', 'FigureChatBubble'
    ]), {
      Level: 'RoleLevel',
      LevelSetting: 'RoleLevelSetting',
      FigureHead: 'FigureHead',
      FigureFrame: 'FigureFrame',
      FigureTitle: 'FigureTitle',
      FigureChatBubble: 'FigureChatBubble'
    }),
    ...pick(readGeneratedTables(table('HeroTable.data.lua.json'), ['Hero']), { Hero: 'Hero' }),
    ...pick(readGeneratedTables(table('7289607387164353000-FirstRechargeTable.data.json'), ['FirstRecharge', 'Award']), {
      FirstRecharge: 'FirstRecharge',
      Award: 'FirstRechargeAward'
    }),
    // WishTree (rebate) is a login-module table rather than an activity. Its
    // gift groups and award rows are small enough to keep as reviewed static
    // configuration; module 165 still stores every mutable field.
    ...wishTreeTables,
    ...pick(readGeneratedTables(table('14863431925290164000-RechargeBonusTable.data.json'), ['RechargeBonus', 'Group', 'Award']), {
      RechargeBonus: 'RechargeBonus',
      Group: 'RechargeBonusGroup',
      Award: 'RechargeBonusAward'
    }),
    ...pick(readGeneratedTables(table('7806056895365336000-RechargeRebateResetTable.data.json'), ['Act']), {
      Act: 'RechargeRebateResetAct'
    }),
    ...pick(readGeneratedTables(table('LineFirstRechargeTable.data.json'), [
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
