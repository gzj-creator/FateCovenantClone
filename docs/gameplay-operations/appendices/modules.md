# 全模块对照目录

重建日期：2026-11-15。路由审计快照为2026-11-14，标题沿用2026-11-06静态目录释义，中文界面名称仍须客户端核对。每一行是协议任务分组，不等同于完整可玩系统；执行规则见[最终R1裁定](../rules/final-rule-register.md)。

状态：S=service_route，G=gateway_route，M=multi_owner，U=unrouted；M 表示存在多个声明且只有首个可达，不表示多条业务均已完成。业务证据与 APK 验收见逐模块实施记录。

|任务|玩法/功能|协议模块|命令数|S/G/M/U|当前服务所有者|原任务卡|
|---|---|---|---:|---|---|---|
|ROLE-UNKNOWN|GM 调试命令|Unknown|1|1/0/0/0|roleService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ROLE-ROLE|团长改名、头像、称号、形象、等级奖、属性与战力|RoleCmd|24|22/2/0/0|roleService, gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ROLE-LOGIN|网络检查与开发登录辅助|LoginCmd|4|1/3/0/0|roleService, gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ITEM-ITEM|重复箱、手动兑换、碎片合成与抽奖箱分支|ItemCmd|9|9/0/0/0|itemBox|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ROLE-PLAYERDATA|玩家数据查询|PlayerDataCmd|1|1/0/0/0|roleService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|SOC-GUILDDATA|公会数据查询|GuildDataCmd|1|1/0/0/0|guildSociety|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|BATTLE-FIGHT|通用战斗与报告分享|FightCmd|7|7/0/0/0|fight, battleRecords|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|HERO-LINEUP|预设阵容索引、增删、改名与保存|LineupCmd|8|8/0/0/0|lineups|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|BATTLE-REPORT|通关记录与点赞|ReportCmd|2|2/0/0/0|battleRecords|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ITEM-RESCOMPLETE|资源补全领奖|ResCompleteCmd|1|1/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ROLE-STORY|剧情完成与触发|StoryCmd|2|2/0/0/0|storyService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ITEM-MISSION|主线体力、补给、章节一键与 BOSS 奖励|MissionCmd|9|8/1/0/0|fight, missionExtra, gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|HERO-HERO|英雄进阶、试炼、重铸、碎片、访问与支援|HeroCmd|41|40/0/1/0|recruit, gateway, heroCommandServices[1], heroExtra, heroCommandServices[3], heroCommandServices[2], progression, heroCommandServices[0], handbook, heroFavor|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|HERO-MASTERY|精通升级与突破|MasteryCmd|2|2/0/0/0|heroMastery|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|HERO-FAVOURINTIMACY|亲密度、约会与剧情|FavourIntimacyCmd|3|3/0/0/0|heroCommandServices[10]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|HERO-INTELLI|Intelli 解锁与批量处理|IntelliCmd|2|2/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|HERO-COMBATPOWER|战力奖励与预设战力更新|CombatPowerCmd|2|2/0/0/0|heroCommandServices[7], heroCommandServices[8]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|EQUIP-EQUIP|普通装备觉醒、材料交换与批量精炼|EquipCmd|9|9/0/0/0|equip|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|BATTLE-PEAKTOWER|巅峰塔/爬塔|PeakTowerCmd|6|6/0/0/0|peakTower|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ITEM-SHOP|普通商店、快速购买、刷新、结算与历史商品|ShopCmd|8|6/0/2/0|shop|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|BATTLE-RANK|真实排行榜|RankCmd|12|12/0/0/0|ranks|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ITEM-MAIL|既有邮件读取、领取与删除|MailCmd|7|7/0/0/0|mail|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|BATTLE-SWAPARENA|换位/多队竞技场|SwapArenaCmd|10|10/0/0/0|swapArena|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ROLE-FUNOPEN|既有功能开放请求|FunOpenCmd|1|1/0/0/0|features|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ITEM-GUIDE|引导领奖与网络检查|GuideCmd|3|2/1/0/0|gateway, guide|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-EVERYTASK|每日、每周、主线任务及一键领奖|EveryTaskCmd|7|7/0/0/0|everyTasks|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-COMMONTASK|通用任务与线性任务剩余进度函数|CommonTaskCmd|2|2/0/0/0|tasks|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|SOC-MSG|频道加入、发言、历史、跨服消息与玩家信息|MsgCmd|11|11/0/0/0|message|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-CHAT|世界、公会、私聊、跨服聊天与设置|ChatCmd|10|10/0/0/0|chat|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PLAY-HOMEPUZZLEACT|家园拼图、赠送求助、分解与进度|HomePuzzleActCmd|9|9/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-HOMELANDACT|家园活动选人、任务、装修与清理|HomelandActCmd|4|4/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-RECHARGE|龙晶等额外充值入口|RechargeCmd|5|3/2/0/0|firstRecharge, gateway, welfare|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-MONTHLYCARD|既有月卡奖励领取|MonthlyCardCmd|1|0/1/0/0|gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-TRIGGERGIFT|触发礼包激活与次数|TriggerGiftCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-FRIEND|好友、申请、黑名单、友情赠送与领取|FriendCmd|13|13/0/0/0|friend|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-GUILD|公会创建、申请、推荐、捐献、日志与奖励|GuildCmd|28|28/0/0/0|guildSociety, guildRoster|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-GUILDACTIVE|公会活跃任务、积分与解散状态|GuildActiveCmd|6|6/0/0/0|guildSociety|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-UPSTARGIFT|升星礼包奖励与版本|UpStarGiftCmd|2|2/0/0/0|upStarGift|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-VIP|VIP 礼包、特权奖励与经验兑换|VipCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-PERMIT|普通通行证买级、福利、结算、自选与选期|PermitCmd|11|8/3/0/0|gateway, benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-SIGNACT|活动签到|SignActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-ONLINEGIFT|在线礼包|OnlineGiftCmd|1|1/0/0/0|onlineGift|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|EQUIP-ARTIFACT|圣器合成、强化、品质、升级、突破等|ArtifactCmd|11|11/0/0/0|artifact|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|ROLE-REDDOT|红点持久化|RedDotCmd|1|1/0/0/0|roleService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ROLE-CDKEY|兑换码领奖|CdkeyCmd|1|1/0/0/0|cdkeyService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|PLAY-CARNIVAL|嘉年华大富翁、骰子、事件、建筑与科技|CarnivalCmd|15|15/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|ITEM-RANKACHIEVE|排名成就奖励|RankAchieveCmd|1|1/0/0/0|rankAchieve|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|SOC-SUPPORT|玩家助力与被助力记录|SupportCmd|2|2/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-FUNDACT|活动基金领奖|FundActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ROLE-ACTIVITY|真实活动状态推进|ActivityCmd|1|1/0/0/0|actFrameService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ROLE-ACTFRAME|活动列表数据及 GM 开期/跳阶段/清理辅助|ActFrameCmd|5|5/0/0/0|actFrameService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|BATTLE-REDCLIFF|RedCliff 副本|RedCliffCmd|4|4/0/0/0|redCliff|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|DRAW-MAGICDRAW|魔法招募选人、成就与升星奖励|MagicDrawCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ITEM-FIRSTWEEKGOAL|首周目标与任务奖励|FirstWeekGoalCmd|2|2/0/0/0|firstWeekGoal|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-GROWTHROAD|成长之路|GrowthRoadCmd|2|2/0/0/0|growthRoad|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-GROWTHTARGET|成长目标阶段与任务|GrowthTargetCmd|2|2/0/0/0|itemCommandServices[2]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-TASKAWARD|任务活动进度与任务奖|TaskAwardCmd|2|2/0/0/0|itemCommandServices[3]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ITEM-OPENSERVERBOX|开服宝箱与进度|OpenServerBoxCmd|2|2/0/0/0|itemCommandServices[1]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|SOC-REALTIMEMAP|实时地图进出、移动、复活与传送|RealtimeMapCmd|5|5/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ROLE-SKIN|皮肤穿戴、兑换、图鉴与强化|SkinCmd|7|7/0/0/0|skinService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|PAY-NOTIFYGIFT|通知礼包激活|NotifyGiftCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-THEMETREASURE|主题寻宝、挑战、兑换与全服奖励|ThemeTreasureCmd|12|12/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|SOC-COMMENT|英雄评论、点赞与评分|CommentCmd|5|5/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-REDENVELOPE|普通红包领奖与详情|RedEnvelopeCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-VIPGIFT|VIP 专属礼包领奖|VipGiftCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-RELATIONSHIP|关系标记与通知|RelationshipCmd|3|3/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-ADVENTURE|冒险玩家列表|AdventureCmd|1|1/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ITEM-COUNTSTATISTICS|既有统计数据查询|CountStatisticsCmd|1|1/0/0/0|recruit|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|BATTLE-GENERALDUNGEON|通用地牢副本|GeneralDungeonCmd|7|7/0/0/0|generalDungeon|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ITEM-HOOK|挂机收益、快速收取与产物|HookCmd|5|5/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|ROLE-CLIENTLOG|客户端诊断日志|ClientLogCmd|1|1/0/0/0|roleService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|ACT-OPENSERVERSPRINT|开服冲刺任务、全服进度与排名奖励|OpenServerSprintCmd|4|4/0/0/0|actReward, sprint|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|SOC-STRATEGY|英雄攻略排行|StrategyCmd|1|1/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ACT-MULTILOGIN|既有多日登录奖励|MultiLoginCmd|1|1/0/0/0|welfare|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ITEM-FUNCTIONMANUAL|功能手册奖励|FunctionManualCmd|1|1/0/0/0|functionManual|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|EQUIP-DESTINY|命运阶级的既有点亮与升阶|DestinyCmd|1|1/0/0/0|destiny|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PAY-FASHION|时装激活、穿戴与升级|FashionCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-VIPCITY|VIP 城市重建|VipCityCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|EQUIP-WARRUNE|战纹激活、升阶、洗属性、重铸与养成|WarRuneCmd|7|7/0/0/0|endgameDevelopServices[1]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|SOC-GUILDREDENVELOPE|公会红包|GuildRedEnvelopeCmd|8|8/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PLAY-CAMPSITE|船舱的既有格子解锁与英雄上阵|CampsiteCmd|2|2/0/0/0|cabin|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|BATTLE-ARENACONTEST|竞技大赛、竞猜与观战|ArenaContestCmd|15|15/0/0/0|arenaContest|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|SOC-GUILDTRIAL|公会试炼、求助、助战与奖励|GuildTrialCmd|11|11/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PLAY-MINIGAME|通用小游戏、结算与老虎机重试|MiniGameCmd|4|4/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|BATTLE-HUNTERARENA|猎人竞技场|HunterArenaCmd|11|11/0/0/0|hunterArena|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-MARTIALCLUB|武馆组队挑战|MartialClubCmd|24|24/0/0/0|martialClub|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-MARTIALCLUBACT|武馆活动奖励|MartialClubActCmd|2|2/0/0/0|martialClubAct|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|HERO-TACTICS|战术升级与重置|TacticsCmd|2|2/0/0/0|heroCommandServices[11]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PAY-PRINCESS|公主/Princess 奖励补领与跨期刷新|PrincessCmd|3|3/0/0/0|welfare, benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-DANMAKU|弹幕点赞|DanmakuCmd|1|1/0/0/0|community|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ITEM-TASKGROUP|任务组任务与阶段领奖|TaskGroupCmd|2|2/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|PLAY-TREASUREHUNT|寻宝、铲子购买、合成、删除与刷新|TreasureHuntCmd|7|7/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|EQUIP-MUSEUM|博物馆藏品激活与人气奖励|MuseumCmd|2|2/0/0/0|endgameDevelopServices[2]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|ITEM-CAREERLIFE|生涯剧情奖励|CareerLifeCmd|1|1/0/0/0|itemCommandServices[4]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|PAY-RECOMMENDGIFT|既有推荐礼包限购同步|RecommendGiftCmd|1|0/1/0/0|gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|BATTLE-ELITEMISSION|精英任务的战斗闭环|EliteMissionCmd|3|3/0/0/0|eliteMission|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-SOULTRIAL|灵魂试炼抽奖|SoulTrialCmd|2|2/0/0/0|soulTrial|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|HERO-HEROLEASE|英雄租借|HeroLeaseCmd|5|5/0/0/0|heroCommandServices[4]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PAY-PERMANENTCARD|永久卡奖励领取|PermanentCardCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-RECOVERY|资源追回免费奖励|RecoveryCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-WEEKENDBONUS|周末奖励与游玩次数|WeekendBonusCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|EQUIP-FANTASYEQUIP|幻武的既有穿脱与养成|FantasyEquipCmd|16|15/0/1/0|fantasyEquipment, fantasyDraw, recruit|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|HERO-LINEUPSNAPSHOT|阵容/英雄快照|LineupSnapshotCmd|2|2/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PLAY-GRANDTOURER|旅行令牌、任务、兑换、里程与强化|GrandTourerCmd|5|5/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-DREAM|梦境事件、日周奖、收集、宝箱与 NPC 阵容|DreamCmd|10|10/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-LEVELSPRINT|等级冲刺免费奖|LevelSprintCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-HOUSEASSISTANT|看板助手背景、选择与试用|HouseAssistantCmd|4|4/0/0/0|houseAssistant|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-RECHARGEBONUS|既有充值福利选择与领取|RechargeBonusCmd|2|2/0/0/0|rechargeBonus|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ITEM-RESROLLBACK|资源回退预览与执行|ResRollbackCmd|2|2/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|BATTLE-TOURNAMENT|巅峰对决/锦标赛|TournamentCmd|11|11/0/0/0|tournament|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|PAY-HEATGIFT|热度礼包支援与全服数据|HeatGiftCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-FLASHSALE|限时特卖砍价与英雄|FlashSaleCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|HERO-TEAMSUGGEST|推荐阵容激活与选择|TeamSuggestCmd|3|3/0/0/0|teamSuggest|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PAY-ASSISTANT|玩法助手功能设置与执行|AssistantCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-PINBALL|弹珠活动成就|PinBallCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-FANTASYEQUIPACT|幻武活动管道小游戏、任务与试炼闭环|FantasyEquipActCmd|10|10/0/0/0|fantasyEquipAct, drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-PYRAMID|金字塔抽取与任务|PyramidCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|HERO-HEROBLAZON|英雄纹章、天赋、技能与羁绊|HeroBlazonCmd|5|5/0/0/0|r1FailClosed, heroCommandServices[9]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|DRAW-THREEADMONITION|三诫抽取、宝箱、次数与入场|ThreeAdmonitionCmd|4|4/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|HERO-NEWHEROEXCLUSIVE|新英雄专属选择、剧情与阵容奖励|NewHeroExclusiveCmd|3|3/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|EQUIP-FANTASYHANDBOOK|幻武图鉴升星|FantasyHandbookCmd|1|1/0/0/0|endgameDevelopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|BATTLE-SCARLETTRIAL|猩红试炼|ScarletTrialCmd|2|2/0/0/0|scarletTrial|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|SOC-GUILDEXPLORE|公会探索、地图、BOSS、任务与图鉴|GuildExploreCmd|28|28/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-GUILDEXPLORETRIAL|公会探索试炼|GuildExploreTrialCmd|2|2/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|DRAW-HUNDREDBONUS|百倍奖励随机、领取与日志|HundredBonusCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ROLE-CMS|既有 CMS 问卷目录读取|CmsCmd|1|1/0/0/0|cms|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|BATTLE-STARMISSION|星级关卡、章节奖励与技能|StarMissionCmd|4|4/0/0/0|starMission|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|EQUIP-RELIC|Relic 装具穿戴、重铸、分解、重置、升阶等|RelicCmd|11|11/0/0/0|relic|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|HERO-HEROLEGEND|英雄传奇书升星、祝福、升级与升阶|HeroLegendCmd|4|4/0/0/0|heroCommandServices[12]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PLAY-MAGICALJOURNEY|魔法旅程、国家养成、收藏、关卡与 BOSS|MagicalJourneyCmd|17|17/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|SOC-GUILDWAR|公会战、集结、竞猜与排行奖励|GuildWarCmd|14|14/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|EQUIP-NORSERUNE|星魂卷轴的既有抽签与养成|NorseRuneCmd|4|4/0/0/0|norseRune|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|ACT-LOGINREWARDACT|登录奖励活动|LoginRewardActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|EQUIP-MAGICCIRCLE|法阵尚缺的批量升级与属性接入|MagicCircleCmd|5|5/0/0/0|magicCircle|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PLAY-PETACTIVITY|超凡魔灵现世选择、挑战、好感、治疗与兑换|PetActivityCmd|7|7/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|BATTLE-COMMONMAP|通用地图节点与扫荡|CommonMapCmd|3|3/0/0/0|commonMap|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|SOC-GUILDDUEL|公会对决、匹配与轮次奖励|GuildDuelCmd|7|7/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|EQUIP-PET|魔灵合成、上阵、升级、升星、装备、符文与变异|PetCmd|17|17/0/0/0|endgameDevelopServices[3]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PLAY-RADISHFARM|萝卜农场、事件、拜访与助力|RadishFarmCmd|6|6/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|EQUIP-PETPLAY|魔灵探索与周期奖励|PetPlayCmd|2|2/0/0/0|endgameDevelopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|EQUIP-ENERGYBURST|能量爆发奖励|EnergyBurstCmd|1|1/0/0/0|endgameDevelopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|BATTLE-FAMEHALL|名人堂挑战与掉落选择|FameHallCmd|11|11/0/0/0|fameHall|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|SOC-GUILDRACING|公会竞速、支援、BUFF 投票与积分|GuildRacingCmd|9|9/0/0/0|guildActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-GUILDBOSS|公会 BOSS、伤害奖励与技能物品|GuildBossCmd|12|12/0/0/0|guildCoopServices[0]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|HERO-TEAMGENRE|流派阵容的既有选择与奖励|TeamGenreCmd|3|3/0/0/0|teamGenre|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|ITEM-MYSTERYSHOP|神秘商店自动刷新、手动刷新与购买|MysteryShopCmd|3|3/0/0/0|r1FailClosed, itemCommandServices[5]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|SOC-GUILDJOINT|公会联合探索与资源争夺|GuildJointCmd|25|25/0/0/0|guildCoopServices[1]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|DRAW-WISHTREE|许愿树宝藏及已有抽取链路|WishTreeCmd|4|4/0/0/0|wishTree|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|BATTLE-WORLDBOSS|世界 BOSS|WorldBossCmd|5|5/0/0/0|worldBoss|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|DRAW-CHESS|棋盘抽取、任务、自选、轮次与兑换|ChessCmd|6|6/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-HUNDREDACC|既有百元累充领取|HundredAccCmd|1|1/0/0/0|hundredAcc|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-RAFFLETICKET|奖券成就|RaffleTicketCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-HEROBLAZONDRAW|英雄纹章抽取|HeroBlazonDrawCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-LOTTERYACT|抽奖活动与奖品日志|LotteryActCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-PREBOOK|预约任务与分享奖励|PrebookCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-ROLESHARE|玩家分享奖励|RoleShareCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-CROSS|跨服广告、功能免费与付费奖|CrossCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-GUILDRUNESTONE|公会符石穿脱与合成|GuildRuneStoneCmd|3|3/0/0/0|guildCoopServices[2]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|BATTLE-PITLORD|PitLord 挑战、排名与补发|PitLordCmd|4|4/0/0/0|pitLord|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|PAY-REDRAIN|红包雨随机、领取与激活|RedRainCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-MYSTERYWISH|神秘心愿兑换|MysteryWishCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-LOTTERY|彩票抽取与过期处理|LotteryCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-DIAMONDFUND|钻石基金稳健/幸运奖励领取|DiamondFundCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|EQUIP-TREASURE|秘宝升星、抽奖、套装、属性、自选与宝箱|TreasureCmd|6|6/0/0/0|endgameDevelopServices[4]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PAY-WEEKHUNT|周猎任务、进度与升级礼包|WeekHuntCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ITEM-LINEARLEVEL|线性等级宝箱|LinearLevelCmd|1|1/0/0/0|itemCommandServices[0]|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|BATTLE-CAMPTOWER|阵营塔|CampTowerCmd|3|3/0/0/0|campTower|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|EQUIP-ELVES|精灵升星、天赋、图鉴、助战、皮肤与变异|ElvesCmd|7|7/0/0/0|endgameDevelopServices[5]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|EQUIP-ELVESBEAD|精灵珠升级、升星、穿脱与分解|ElvesBeadCmd|5|5/0/0/0|endgameDevelopServices[6]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PLAY-EXPERIENCEACT|历练出发与领奖|ExperienceActCmd|2|2/0/0/0|explorationAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|SOC-GUILDGVG|公会 GVG 地图、矿点与据点争夺|GuildGVGCmd|18|18/0/0/0|guildCoopServices[3]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-WISHTREASURE|既有特惠返利领取|WishTreasureCmd|1|1/0/0/0|wishTreasure|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-FLIPCARD|翻牌与轮次|FlipCardCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-LINKGIFT|联动礼包自选|LinkGiftCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-TICKETDRAW|票券抽奖领奖与历史|TicketDrawCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|BATTLE-TOWERDEFENSE|塔防驻守与轮次奖励|TowerDefenseCmd|5|5/0/0/0|towerDefense|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|DRAW-FRUITDRAWACT|水果抽奖|FruitDrawActCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-VIPLINK|VIP 联动展示|VipLinkCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-DRAW|通用抽取心愿选择|DrawCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ROLE-CHANNELPUSH|渠道推送开关|ChannelPushCmd|1|1/0/0/0|roleService|[历史规则卡](../../plans/remaining-gameplay-20261106/10-role-and-supporting.md)|
|DRAW-DEMIGODACT|神灵降世真实奖池与试炼闭环|DemigodActCmd|8|8/0/0/0|demigodAct|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|EQUIP-LEADEREQUIP|团长装备升级、升星、分解、增幅与重铸|LeaderEquipCmd|7|7/0/0/0|leaderEquip, endgameDevelopServices[0]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|BATTLE-TOPARENA|巅峰竞技、半决赛/决赛与竞猜|TopArenaCmd|18|18/0/0/0|topArena|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|ACT-CHRISTMASACT|圣诞装扮、奖励、心愿与商店|ChristmasActCmd|4|4/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-ACCRECHARGEACT|既有活动累充领取|AccRechargeActCmd|1|1/0/0/0|accRecharge|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-GEMREBATEACT|宝石返利投入|GemRebateActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-GUILDVOTE|公会投票|GuildVoteCmd|2|2/0/0/0|guildCoopServices[4]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-APPEARANCERELEASEACT|外观上新互动|AppearanceReleaseActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|BATTLE-PLAYMATCH|即时匹配与取消|PlayMatchCmd|2|2/0/0/0|playMatch|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|PAY-CAKEACTIVITY|蛋糕活动每日、充值与托盘选择|CakeActivityCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-SLGMAP|SLG 地图视野与进出|SlgMapCmd|3|3/0/0/0|guildCoopServices[5]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|SOC-GUILDNATION|公会国战、建造、兵种、科技、行军与据点|GuildNationCmd|65|65/0/0/0|guildCoopServices[6], guildNationAssist|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-DAILYDISCOUNT|既有每日折扣选择|DailyDiscountCmd|1|1/0/0/0|welfare|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-STOCKUPACT|囤货阶段与周期奖|StockUpActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-QUADRUPLECROSS|四重跨期随机、免费与付费奖|QuadrupleCrossCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-COMACTDRAWAWARD|通用活动领奖|ComActDrawAwardCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-SPRINGFESTIVALACT|春节装扮与商店奖|SpringFestivalActCmd|3|3/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-FESTIVALSIGNACT|节日签到|FestivalSignActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-FINANCEMANAGEACT|理财产品选择与返利|FinanceManageActCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-COLLECTEXCHANGEACT|收集兑换|CollectExchangeActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-FESTIVALMONSTERACT|节日怪物操作|FestivalMonsterActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-RECHARGEREBATERESET|既有每日充值返利领取|RechargeRebateResetCmd|1|1/0/0/0|rechargeRebateReset|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-HERODRAWACT|百校/英雄招募活动的既有任务与流派|HeroDrawActCmd|2|2/0/0/0|heroDrawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-SKINCRYSTAL|皮肤水晶购买|SkinCrystalCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-VALENTINEDAYACT|情人节领奖与聊天进度|ValentineDayActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-GROUPBUYACT|团购全服统计与团购奖|GroupBuyActCmd|2|1/0/1/0|groupBuyAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-REBATESHOPACT|返利商店领奖|RebateShopActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-ELVESACT|精灵活动主精灵、果实抽取与奖励|ElvesActCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ACT-PREHEATACT|预热活动与奖励|PreheatActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|BATTLE-OVERALLPVP|综合 PVP、淘汰赛与竞猜|OverallPvpCmd|30|30/0/0/0|overallPvp|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|HERO-LEASERSTARUP|租借/Leaser 升星与重置|LeaserStarUpCmd|2|2/0/0/0|heroCommandServices[5]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|ITEM-PERIODTASK|周期任务、阶段与积分奖励|PeriodTaskCmd|3|3/0/0/0|r1FailClosed|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|SOC-GUILDBARGAIN|公会砍价|GuildBargainCmd|4|4/0/0/0|guildCoopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ACT-COMMONSIGN|通用签到领奖|CommonSignCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|SOC-GUILDEXPEDITION|公会远征、宣战、鼓舞、竞猜与地图排名|GuildExpeditionCmd|15|15/0/0/0|guildCoopServices[8]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-DIVINEREALMACT|神域活动礼包选择|DivineRealmActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-ARTIFACTDRAWACT|圣器天池试炼统计接入|ArtifactDrawActCmd|6|6/0/0/0|artifactDrawAct|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-BONUSDRAW|奖励抽取、切换与选池|BonusDrawCmd|3|3/0/0/0|bonusDraw|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-BONUSSHOP|奖励商店购买|BonusShopCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-PUZZLEACT|拼图活动任务与进度|PuzzleActCmd|2|2/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-LINEFIRSTRECHARGE|既有线性首充选择与领取|LineFirstRechargeCmd|2|2/0/0/0|lineFirstRecharge|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|EQUIP-DIVINEEMBRYO|神胚选择|DivineEmbryoCmd|1|1/0/0/0|endgameDevelopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|DRAW-CAPSULETOY|扭蛋、兑换、收集与进度|CapsuleToyCmd|4|4/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|DRAW-CHESSREVERT|棋盘翻转轮次、自选礼物与换轮|ChessRevertCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PLAY-TILESWAP|换块小游戏换轮|TileSwapCmd|1|1/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-MUSHROOMMONSTER|蘑菇怪开始、结束与领奖|MushroomMonsterCmd|3|3/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-AUCTION|拍卖出价、心愿、分红与详情|AuctionCmd|5|5/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-CHANNELENTRY|频道入口业务|ChannelEntryCmd|1|0/0/1/0|gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|ACT-VOTEACT|盲投、普通投票、竞猜与全服进度|VoteActCmd|7|7/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-QUESTIONACT|答题与累计奖励|QuestionActCmd|3|3/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|HERO-CAMPHALO|阵营光环升级|CampHaloCmd|1|1/0/0/0|heroCommandServices[6]|[历史规则卡](../../plans/remaining-gameplay-20261106/02-heroes-lineups.md)|
|PLAY-GOPHERACT|打地鼠|GopherActCmd|1|1/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|DRAW-CHILDPUZZLEACT|拼图抽取、自选、任务与换轮|ChildPuzzleActCmd|5|5/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|SOC-GUILDHUNT|公会狩猎参与与支援|GuildHuntCmd|3|3/0/0/0|guildCoopServices[10]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|DRAW-HOARDWHEELACT|囤积转盘奖池、任务与累计|HoardWheelActCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PAY-SKINRECHARGE|皮肤充值角色选择|SkinRechargeCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-SUMMERACT|夏日主活动、水枪/水炮养成、阶段任务与结算|SummerActCmd|15|15/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-SUMMERPVE|夏日 PVE 任务、次数、阶段与掉落|SummerPveCmd|4|4/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-SUMMERMISSION|夏日关卡战斗结算与进度|SummerMissionCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-BUYSKINACT|购皮肤活动免费奖励|BuySkinActCmd|1|1/0/0/0|buySkinAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-SUMMERPVP|夏日 PVP、多队、竞猜、对手与挑战次数|SummerPvpCmd|13|13/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|EQUIP-BADGE|徽章激活|BadgeCmd|1|1/0/0/0|endgameDevelopServices[7]|[历史规则卡](../../plans/remaining-gameplay-20261106/03-equipment-development.md)|
|PLAY-TOWERACT|爬塔活动前进、切换与任务|TowerActCmd|3|3/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|ACT-QIXIACT|七夕折扣选择与日签|QiXiActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-ANNIVERSARYGAMEACT|周年小游戏领奖|AnniversaryGameActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|DRAW-THOUSANDDRAW|千抽与领奖|ThousandDrawCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ACT-FIVEDAYBOSSACT|五日 BOSS 任务、限时通关与排名|FiveDayBossActCmd|3|3/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|BATTLE-DESTINYPVE|命运 PVE 分层挑战|DestinyPveCmd|2|2/0/0/0|destinyPve|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|PAY-ACTSHOP|活动商店数据、购买与等级奖励|ActShopCmd|3|3/0/0/0|actShop, benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-PRAYACT|祈愿自选与抽取|PrayActCmd|2|2/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PLAY-SPIRITCOURTYARD|灵庭种植、土地、合成、委托协作与宴会|SpiritCourtyardCmd|16|16/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|ACT-ONESREWARD|单次专项奖励|OnesRewardCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-INVITEACT|邀请绑定与任务|InviteActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-INVITEOLDACT|老玩家邀请与任务|InviteOldActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ACT-ROLEBACK|回归绑定、继承卡、账号查询与每日资源|RoleBackCmd|5|5/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-PREMIUMACT|增值活动免费奖励|PremiumActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|DRAW-CASHBACKDRAW|返利抽奖、次数、全服奖励与进度|CashbackDrawCmd|4|4/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ACT-CHOICESTORY|分支剧情奖励|ChoiceStoryCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|ITEM-TASKACTIVITY|任务活动提交与数据|TaskActivityCmd|2|2/0/0/0|taskActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/04-items-tasks-shops.md)|
|PAY-MONTHPERMIT|既有月通行证任务、买级与领奖|MonthPermitCmd|4|0/4/0/0|gateway|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|SOC-GUILDCRUSADE|公会讨伐排名|GuildCrusadeCmd|1|1/0/0/0|guildCoopServices[11]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-RECYCLEACT|回收活动|RecycleActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-TRIPLEMATCH|三消换块、重开、道具与关卡奖励|TripleMatchCmd|5|5/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-VICKREYAUCTIONACT|维克里/密封拍卖|VickreyAuctionActCmd|2|2/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-FIRECRACKERACT|爆竹使用、公会进度、任务与累充奖|FirecrackerActCmd|5|5/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-GIFTBOXACT|礼盒活动领取|GiftBoxActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-SUBSCRIPTIONACT|订阅、领取与入场|SubscriptionActCmd|3|3/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PAY-NEWPERMITACT|新通行证领奖|NewPermitActCmd|1|1/0/0/0|benefitCommerce|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-MATCHINGGAMEACT|配对小游戏抽签、卡牌与奖励|MatchingGameActCmd|3|3/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|SOC-GUILDAUCTION|公会拍卖、心愿与领取|GuildAuctionCmd|3|3/0/0/0|guildCoopServices[12]|[历史规则卡](../../plans/remaining-gameplay-20261106/05-social-guild.md)|
|PAY-DRAGONLANDACT|龙岛日奖、试炼奖与公会数据|DragonLandActCmd|3|3/0/0/0|dragonLandAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-MONOPOLYACT|大富翁事件、战斗、援助、公会任务与补给|MonopolyActCmd|11|11/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|DRAW-TURNTABLEACT|转盘活动|TurntableActCmd|1|1/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PLAY-DREAMTRIALACT|梦境试炼抢夺与公会数据|DreamTrialActCmd|2|2/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-DIAMONDVEINACT|钻石矿脉地图、行动、战斗与公会排名|DiamondVeinActCmd|9|9/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|DRAW-FLOPCARDACT|翻牌、单次与累计奖励|FlopCardActCmd|3|3/0/0/0|drawActivity|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|PLAY-SOURCEPOINT|源点变换、合成与任务|SourcePointCmd|3|3/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PAY-DIAMONDBANKACT|钻石银行任务、奖励与购买|DiamondBankActCmd|3|3/0/0/0|diamondBankAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|PLAY-FISHINGACT|钓鱼剩余鱼竿、图鉴、奖励、记录与排名|FishingActCmd|11|11/0/0/0|activityRead|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-ALBUM|家具、套装激活与套装奖励|AlbumCmd|3|3/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|ACT-HEROSIGNACT|英雄签到|HeroSignActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-FREEPRIVILEGEACT|免费特权及月度激活|FreePrivilegeActCmd|2|2/0/0/0|freePrivilegeAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-ENJOYBLESSINGACT|祈福摇签|EnjoyBlessingActCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PAY-SLOTGAMEACT|老虎机活动游玩与领取|SlotGameActCmd|2|2/0/0/0|slotGameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)|
|ACT-QUESTIONNAIRE|问卷提交|QuestionnaireCmd|1|1/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|PLAY-HOMELAND|家园任务、拜访、点赞、升级、清洁与替换|HomelandCmd|8|8/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|PLAY-BAKINGACT|烘焙合成、订单、蛋糕、事件、道具与整理|BakingActCmd|15|15/0/0/0|minigameAct|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|BATTLE-BATTLETRIMATCHHERO|三消战斗英雄升级升星|BattleTriMatchHeroCmd|2|2/0/0/0|triMatch|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-BATTLETRIMATCHEQUIP|三消战斗装备养成与交换|BattleTriMatchEquipCmd|3|3/0/0/0|triMatch|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-BATTLETRIMATCHLINEUP|三消战斗阵容管理|BattleTriMatchLineupCmd|5|5/0/0/0|triMatch|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-TRIPLEMATCHFIGHT|三消战斗开战、重试与战报|TripleMatchFightCmd|6|6/0/0/0|triMatchFight|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|PLAY-HELPUPACT|助力升阶/升超凡活动|HelpUpActCmd|4|4/0/0/0|activityRead|[历史规则卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)|
|DRAW-HUNDREDDRAWACT|百抽、进度奖、自选、升星奖与跑马灯|HundredDrawActCmd|5|5/0/0/0|hundredDraw|[历史规则卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md)|
|ACT-ANNIVERSARYBANQUETACT|周年宴会任务与进度|AnniversaryBanquetActCmd|2|2/0/0/0|actReward|[历史规则卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)|
|BATTLE-TRIMATCHTOWER|三消爬塔、体力恢复与奖励|TriMatchTowerCmd|3|3/0/0/0|triMatchTower|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-OVERALLMATCH|综合匹配|OverallMatchCmd|1|1/0/0/0|overallMatch|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
|BATTLE-TRIMATCHPVP|三消 PVP、段位和战报|TriMatchPvpCmd|4|4/0/0/0|triMatchPvp|[历史规则卡](../../plans/remaining-gameplay-20261106/01-battle.md)|
