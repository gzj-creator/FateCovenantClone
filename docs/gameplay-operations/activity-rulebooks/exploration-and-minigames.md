# 探索与小游戏详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

更新：2026-11-14。覆盖[原计划07](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md)的29张任务卡，另收录既有Campsite。主要处理器：[探索服务](../../../personal-server/game/exploration-act-service.mjs)、[小游戏服务](../../../personal-server/game/minigame-act-service.mjs)、[活动读写服务](../../../personal-server/game/activity-read-service.mjs)。实施证据：[G1](../../../agent/workflow/gameplay-completion/G1-EXPLORATION/implementation.md)、[G2及后续残余补完](../../../agent/workflow/gameplay-completion/BLOCK-G2/implementation.md)。

下面把原表字段与当前操作路径并列。局内随机、战斗结果、盘面生成和自报分数校验若只见本服源码，均为兼容实现，不代表已证明原服算法；命令名称只能证明操作存在。所有配置示例限指定行/版本。详细请求与回包见文末索引。

## PLAY-HOMEPUZZLEACT：家园拼图、赠送求助、分解与进度

**执行裁定：** [PLAY-HOMEPUZZLEACT 的唯一R1决定](../rules/final-rule-register.md#play-homepuzzleact)。本节数值与现代码描述须按该裁定使用。

现有流程为领取任务碎片/开碎片包→记录拥有与拼成的片→求助或赠送→收取真实好友赠片→分解多余片→按拼成进度领奖。任务、求助、发出赠送、收到未领赠送、开包、分解及进度领取是不同状态；取消求助不能退还已被别人领取的赠送。`Version` 决定本期拼片与包集合，不能任意传另一版片tid。

原表 `SocialConf[1]` 为 `gift_limit=2/request_limit=2/receive_expire_day=3/reset_time=05:00`；`DecomposeAward[1]` 的rarity30对应830402×20，`ProgressAward[101]` 需进度6，奖101500×500。当前服务落实际赠送/求助行及领取位，开包随机和分解匹配由本服实现；碎片包原概率、过期赠送去向、跨期社交记录清理仍需原消费者/多人样本。不能把好友列表占位转成虚构赠片。[HomePuzzleActTable](../rules/tables/HomePuzzleActTable.md)。

## PLAY-HOMELANDACT：家园活动选人、任务、装修与清理

**执行裁定：** [PLAY-HOMELANDACT 的唯一R1决定](../rules/final-rule-register.md#play-homelandact)。本节数值与现代码描述须按该裁定使用。

当前先按本期Version选择英雄，11503使用合法Furniture装修到房间位置，11505清理，11502再按真实选择/装修/清理状态检查任务。英雄选择与实际持有/上阵不同，选人请求不能直接加英雄；任务领取位必须与奖励一起保存。已装修物件和清理次数不能通过重登重复累计。

原 `Const[1]` 为 `cell_num=[24,8]/layer_count=2/can_move`；`Version[2]` 有 `rank_up_hero=[5040601]/change_happiness=10/rune_happiness=6000/rank_type=392`；`Task[201]` 为type1803、目标1，奖830902×30。当前type1803/2407/1805/6901等按本地选择、装修和清理计数解释；这属于处理器映射，原幸福度增长、排名结算与跨期家具去向未全部证明。[HomelandActTable](../rules/tables/HomelandActTable.md)。

## PLAY-CARNIVAL：嘉年华大富翁、骰子、事件、建筑与科技

**执行裁定：** [PLAY-CARNIVAL 的唯一R1决定](../rules/final-rule-register.md#play-carnival)。本节数值与现代码描述须按该裁定使用。

现有状态链为恢复/购买骰子→掷骰保存目标格→触发并完成该格事件→建造/升级建筑→派驻→领取实际产出→研究科技。事件进入和结束分离，不能每重发finish再次给同格奖励；派驻英雄、建筑等级、待领产出和科技各有状态。43016读取这些真实状态；43010自动补骰不能无限绕过上限。

原 `Const` 为 `act_duration=604800/init_dice_count=10/dice_max_count=60/dice_flush_time=86400/per_dice_count=10/buy_dice_max_num=5/open_science_week=2`。`MonopolyBuildLevel[1]` 的产出档为[6,12,18,25,32]，材料含391002。当前掷骰、格事件与奖池已有本地路径；原骰子分布、联动事件完整行为和周科技开启时点仍须逐分支核对，不能因有7天字段把所有活动排成每周一期。独立登录模块168。[CarnivalTable](../rules/tables/CarnivalTable.md)。

## PLAY-THEMETREASURE：主题寻宝、挑战、兑换与全服奖励

**执行裁定：** [PLAY-THEMETREASURE 的唯一R1决定](../rules/final-rule-register.md#play-themetreasure)。本节数值与现代码描述须按该裁定使用。

76501寻宝，76506选择目标；挑战进入、换轮、任务奖、轮奖、兑换和全服档是独立命令。当前寻宝消耗本版Hunt配置，兑换记录本行限购；挑战奖要求真实挑战/任务进度，不能用选目标当通关。76502/76505/76507/76508当前回包实际为 `pb_res_to_client`，不是凭名字另造局态回包。

原 `Hunt[1]` 消耗173002×1；`Exchange[1001]` 使用4401900、price300，产出18002×90，`limit_count=1`；`Main[1]` 引fight1000005、`sub_act=[1,2,4,3]`。76510特殊奖和76511日任务仍无完整配置/结算关系，DayTask为0行，因此明确拒绝。全服奖励必须来自实际聚合，当前本地统计不能证明原服多人结算；抽宝箱分布与旧期兑换回收仍待证。[ThemeTreasureTable](../rules/tables/ThemeTreasureTable.md)。

## PLAY-MINIGAME：通用小游戏、结算与老虎机重试

**执行裁定：** [PLAY-MINIGAME 的唯一R1决定](../rules/final-rule-register.md#play-minigame)。本节数值与现代码描述须按该裁定使用。

83702进入需保存game与未结束局，83704处理该局动作；83701结算应校验同局未结算及对应game的结算schema，再发一次奖励。83703是老虎机重试，不能当新入场反复增加免费奖。原 `MiniGame[4].settle_bin=pb_normal_game_settle`；`SlotMachine[1]` 为 `retry_n=3`、奖物品[201500,201500,101500,901900]、数量[1,1,30,10]、四项weight均100。

当前miniEnter只累加enters，miniHandle直接回显custom_bin，尚无完整权威局号/动作状态；miniSettle遇非none的settle_bin即拒绝，无结算规则的行只回空资源。老虎机重试有本地次数/奖路径。四个等权记录仅证明该SlotMachine行的权重，不证明所有小游戏25%概率；重试是否保留上次结果、扣费及额外奖要按各消费者恢复，不能让客户端上传任意奖。[MiniGameTable](../rules/tables/MiniGameTable.md)。

## PLAY-TREASUREHUNT：寻宝、铲子购买、合成、删除与刷新

**执行裁定：** [PLAY-TREASUREHUNT 的唯一R1决定](../rules/final-rule-register.md#play-treasurehunt)。本节数值与现代码描述须按该裁定使用。

当前购买或换取铲子后，85601按保存棋盘挖格，85606/7合成真实持有铲，85608删除，85610刷新；动作必须消耗/移动现有实例，批量合成不能重复引用材料。铲级、格子已挖位、币数和每日删除数分别落状态，不能靠客户端报新棋盘覆盖。

原 `Const[1]` 为 `daily_max_delete_time=5/delete_open_lv=4/compose_open_lv=4/pay_item=3101900/coin_max_num=30000/compose_weight_lv=[[10000,1]]`；`ShovelLevel[1].price=550`。**当前棋盘为本地确定性生成**，不是原棋盘随机算法证据；合成权重所属集合、刷新生成、保底与coin满额处理仍需原消费者。独立登录模块136。[TreasureHuntTable](../rules/tables/TreasureHuntTable.md)。

## PLAY-GRANDTOURER：旅行令牌、任务、兑换、里程与强化

**执行裁定：** [PLAY-GRANDTOURER 的唯一R1决定](../rules/final-rule-register.md#play-grandtourer)。本节数值与现代码描述须按该裁定使用。

87801领取日令牌，87802检查任务后发奖，87803按兑换档扣令牌，87804按实际里程领档，87805强化速度。当前各领取有独立位，领取里程奖不能推进里程，未行驶不能通过重复查询累计距离。日令牌和任务兑换连WeekendBonus配置，不能只找GrandTourer同名表。

原 `Const` 为 `award_num_range=[300,450]/award_item=101500/default_speed=20/speed_add=5/max_speed=100/distance_max=500/destination_distance=842`；这些范围不证明服务器按秒均匀随机发300–450。当前里程/强化与模块145同步有路径，时间累计、终点842与distance_max500的分工、跨日令牌和活动结束剩余代币仍需原消费者对照。[GrandTourerTable](../rules/tables/GrandTourerTable.md)、[WeekendBonusTable](../rules/tables/WeekendBonusTable.md)。

## PLAY-DREAM：梦境事件、日周奖、收集、宝箱与NPC阵容

**执行裁定：** [PLAY-DREAM 的唯一R1决定](../rules/final-rule-register.md#play-dream)。本节数值与现代码描述须按该裁定使用。

现有流程为生成/刷新事件→处理所选事件→记录完成→日奖→周奖→全完成奖；收集激活、收集单项分解/领奖、NPC阵容和宝箱是其他独立路径。当前记录事件和已领档，不应因刷新丢失已完成记录。`IsNewAward`决定使用FixAward还是FixAwardNew等组，不能新旧奖混发。

原 `Const` 为 `week=4/week_event_max=40/week_max_buff=3/event_refresh_cost_items=101500/day_event_refresh_cost=[[5,0],[10,30]]`；`FixAward[1]` 奖801200×1、771200×1、141002×4，`WeekAward[1]` 完成5次奖771200×1、140002×8。88005任务和88007随机宝箱仍拒绝（Task0行/箱算法未闭），当前部分事件数据内敌人/BUFF为空，不能称完整梦境战斗。周起点、跨日刷新阶梯与多周继承待证。独立模块519。[DreamTable](../rules/tables/DreamTable.md)。

## PLAY-MAGICALJOURNEY：魔法旅程、国家养成、收藏、关卡与BOSS

**执行裁定：** [PLAY-MAGICALJOURNEY 的唯一R1决定](../rules/final-rule-register.md#play-magicaljourney)。本节数值与现代码描述须按该裁定使用。

当前先取得剑/剑记录，再进行国家主城升级和分城激活/升级；常规/赛季收藏分别激活，关卡通关生产星数和章节任务，89908/9/12据此领奖。89910与89911的多次关卡/BOSS应逐次消费次数并结算，不能用领奖请求写任意星数；战力上报与战斗结果不同。

原 `Sword[1]` 为 `day_times=3/day_max=200000/exp=200/award=300002×1`；`Mission[1010001]` 引fight8800001、spirit_value10、attr[[6,2000]]，奖励含5101900×50。当前有养成与本地关卡记录，完整战斗生产与NPC阵容仍需核对；89913节点排名奖缺权威榜结算，拒绝。剑日上限、国家/收藏周期和关卡永久记录分开，独立模块155。[MagicalJourneyTable](../rules/tables/MagicalJourneyTable.md)。

## PLAY-PETACTIVITY：超凡魔灵现世选择、挑战、好感、治疗与兑换

**执行裁定：** [PLAY-PETACTIVITY 的唯一R1决定](../rules/final-rule-register.md#play-petactivity)。本节数值与现代码描述须按该裁定使用。

90501只选择本期合法pet，不能授予它；挑战奖励由已完成Challenge/Task产生。治疗90504消费Cure配置道具处理伤口，90505在该轮全部要求完成后发一次finish_award；好感档、每日活力和兑换各有领取记录。换选择不能刷新已经领奖/治疗位。

原 `Challenge[28]` 为version10/show_pet200213/fight7800004/duration172800；`Cure[10]` 为 `cure_item=378002/cure_maxNum=4/favor_num=50/finish_award=[[5201900,30],[501002,100]]`；`Exchange[1]` 有item1901200与pet[300113,300213]。当前按表治疗/领奖/兑换，挑战战斗来源和全版本目标映射、两日duration起点、跨期伤口/好感重置仍待对照。[PetActivityTable](../rules/tables/PetActivityTable.md)。

## PLAY-RADISHFARM：萝卜农场、事件、拜访与助力

**执行裁定：** [PLAY-RADISHFARM 的唯一R1决定](../rules/final-rule-register.md#play-radishfarm)。本节数值与现代码描述须按该裁定使用。

90801开始保存格与到期时间，90802只处理本局待发生事件，90803到期/条件满足才领格奖；拜访90804与帮助90805应指向真实农场，不能用自访/重复帮助无限领助力奖。90806选择礼物后发相应奖，选择本身不是新的种植轮。

原 `Activity[1]` 为 `finish_sec=3600/day_help_times=5/award=377002×5/help_award=377002×2/compensation=377002×20`；`Const` 有recycle_prop644002/recycle_scale5/recycle_award101500。当前本地时钟、帮助计数与格领取已落库；多人互助与事件权重仍需真实样本，recycle_scale5的除数和触发时点未证明，不能直接公告5:1清币。[RadishFarmTable](../rules/tables/RadishFarmTable.md)。

## PLAY-EXPERIENCEACT：历练出发与领奖

**执行裁定：** [PLAY-EXPERIENCEACT 的唯一R1决定](../rules/final-rule-register.md#play-experienceact)。本节数值与现代码描述须按该裁定使用。

93801为合法area安排符合人数要求的队伍，保存开始时间与选择；93802须达到该配置need_time且未领取才入award。当前一轮保存出发和完成状态，重复领取不能新造出发，批量中任何非法队伍应整体回滚。

原 `Level[1]` 为version1、`need_time=7200/need_num=[8,5,5,5]/award=6301900×500/ex_award=6301900×100`。need_num四个位置的职业/阵营解释、额外奖资格和原派遣英雄占用规则仍需原Lua，不能只凭四元数组宣布八人必得额外100。[ExperienceActTable](../rules/tables/ExperienceActTable.md)。

## PLAY-PUZZLEACT：拼图活动任务与进度

**执行裁定：** [PLAY-PUZZLEACT 的唯一R1决定](../rules/final-rule-register.md#play-puzzleact)。本节数值与现代码描述须按该裁定使用。

102001应检查Task真实进度后记录拼片完成，102002按真实已完成片数达到Progress再发档奖。**当前102001仅检查Task属于该version，未校验真实任务进度即标完成并发Version.award/award_cnt**；因此不能写成任务来源已接通。102002使用这个完成记录计算门槛，两个领取位分别防重。

原Task72行/Puzzle72行/Version8行/Progress32行；`Puzzle[101]` 为version1/cell1，`Progress[101]` 为progress2、奖8301900×200。读取器与原字段页均为Progress。当前虽持久化完成片及领取位，真实Task生产、每片发Version奖励的语义、原拼片随机与同版本再次开期仍需消费者证据。[PuzzleActTable](../rules/tables/PuzzleActTable.md)。

## PLAY-TILESWAP：换块小游戏换轮

**执行裁定：** [PLAY-TILESWAP 的唯一R1决定](../rules/final-rule-register.md#play-tileswap)。本节数值与现代码描述须按该裁定使用。

102501推进当前Version的合法Turn和BoardGroup，保存新轮及板面标识。换轮不能授予不存在的关卡奖励，也不能让客户端越过Turn配置任意写当前轮；应按已恢复的结束条件验当前盘，原胜负校验缺证就保留缺口。

原 `Version[1].board_shape=[3,5]`，BoardGroup22行/Board44行/Turn18行。当前完成配置选轮和重登恢复；102501并不证明换块动作、盘面可解性、评分或整盘结算已全部恢复。跨日/跨期应区分活动盘与常驻最高轮，现有版本键复用仍需核验。[TileSwapTable](../rules/tables/TileSwapTable.md)。

## PLAY-MUSHROOMMONSTER：蘑菇怪开始、结束与领奖

**执行裁定：** [PLAY-MUSHROOMMONSTER 的唯一R1决定](../rules/final-rule-register.md#play-mushroommonster)。本节数值与现代码描述须按该裁定使用。

102601建立未结束局与开始时刻，102602只能结束同局一次并保存得分，102603按已达成的ActAward领奖。开始、上报成绩、领取是三步；结束重放不得多记一次挑战，开始后断线应恢复原局而不是免费开新局。

原 `MushroomMonster[1]` 有 `normal_score=100/crit_score=200/fight_count=3/round_duration=25/rank_id=227`；`ActAward[1001]` 需need_times1与daily_act_val50，award_item678002/award_count300。当前局号/分数范围/领取位有路径，但客户端成绩的权威逐击验算、正常/暴击分布与排名期末奖励尚未恢复。当前rank=0/空榜是实现边界，不能写成原版无排名。[MushroomMonsterTable](../rules/tables/MushroomMonsterTable.md)。

## PLAY-GOPHERACT：打地鼠

**执行裁定：** [PLAY-GOPHERACT 的唯一R1决定](../rules/final-rule-register.md#play-gopheract)。本节数值与现代码描述须按该裁定使用。

103201提交同版本游戏数据，当前按合法分数范围和已存档判断可领ScoreAward，记录日成绩与已领档。应校验一局持续时长、命中序列、道具和得分关系；单有min/max不能证明上报分真实，不能据此直接恢复公榜。

原 `BeatGopherVersion[1]` 有 `game_time=30000/interval=600/score_min=0/score_max=99999/rank=233/default_list=[1,2,3,2,1]/skip_score=[4000,5500]`；`BeatGopherScoreAward[1]` 要score2700，award_list为709002×20。当前有分档发奖与状态，原地鼠刷新概率、计分反作弊及skip_score分布仍待证，不能把两端点当已证均匀随机区间。[BeatGopherActTable](../rules/tables/BeatGopherActTable.md)。

## PLAY-TOWERACT：爬塔活动前进、切换与任务

**执行裁定：** [PLAY-TOWERACT 的唯一R1决定](../rules/final-rule-register.md#play-toweract)。本节数值与现代码描述须按该裁定使用。

104301消费本期step_cost推进保存的楼层/步数，104302切换合法路线/塔，104303按共享任务进度领取。后续残余补完已经接入任务读取，不能继续引用首轮“任务一律拒绝”。当前步进权重选择与切换状态来自本服处理器，原服随机分布和回退规则未逐项对照。

原 `TowerAct[1]` 为 `step_cost=800002/max_step=150/step_ratio=[[800,1],[200,2]]/permit=4901/res_exchange=13`。step_ratio属于该表的两项权重；分母/额外加成以消费者为准。通行证经验、任务真实生产、res_exchange回收13的关联单位和结束时点仍需证据。[TowerActTable](../rules/tables/TowerActTable.md)。

## PLAY-SPIRITCOURTYARD：灵庭种植、土地、合成、委托协作与宴会

**执行裁定：** [PLAY-SPIRITCOURTYARD 的唯一R1决定](../rules/final-rule-register.md#play-spiritcourtyard)。本节数值与现代码描述须按该裁定使用。

当前可种植→到成熟取果→开新土地/移树→按委托提交真实果实→刷新/发布/取消协作→合成果实→领取亲密任务。土地格、树/果实、委托、发布状态、提交次数和已领奖分别存储；105005后续已补实际扣果实和发委托奖，不能仍记只拒绝。

原Const为 `publish_entrust_times=1/assist_times=2/guild_fruit_num=7/guild_donate_max_second=57600`；Land1需intimacy_level1且免费；FruitMerge1为level3/rage22/lib2/result30124100。**105008协助他人委托、105009公会任务、105015宴会奖仍拒绝**，因为缺真实公会协作账本；105007的个人发布成功不等于公会已完成。果实合成概率/成熟时间、亲密跨期及宴会全服结算仍需原消费者。[SpiritCourtyardTable](../rules/tables/SpiritCourtyardTable.md)。

## PLAY-TRIPLEMATCH：三消换块、重开、道具与关卡奖励

**执行裁定：** [PLAY-TRIPLEMATCH 的唯一R1决定](../rules/final-rule-register.md#play-triplematch)。本节数值与现代码描述须按该裁定使用。

106001换块、106002重开、106004用道具修改保存的局态，106003检查已有分数领奖；106005通关需要服务器验盘与完成条件。当前前四项已有局态/资源路径，**106005仍拒绝客户端自报通关**，不是可无条件领取关卡奖。

原 `Act[1]` 为 `duration_time=838800/shop_item=6851900/dayRank=275/totalRank=281`；`Cheat[1]` 有consume25、item818502×1、minimum_score18750、award818602×375。25和18750各自含义须按Cheat消费者，不能宣布“花25钻必得375”。盘面生成、连锁得分、作弊道具和双榜结算仍未全部还原。[TripleMatchTable](../rules/tables/TripleMatchTable.md)。

## PLAY-MATCHINGGAMEACT：配对小游戏抽签、卡牌与奖励

**执行裁定：** [PLAY-MATCHINGGAMEACT 的唯一R1决定](../rules/final-rule-register.md#play-matchinggameact)。本节数值与现代码描述须按该裁定使用。

107501按本期draw_item抽签/抽牌，107502只可使用已拥有的合法卡，107503领取保存的配对结算奖励。当前卡列表、消耗、待领奖励与score分开，不能同一pending既用卡时发又领取时再发；重登恢复同一结果。

原 `MatchingGameAct[1]` 为draw_item818802/shop_currency818902/gift_act184401/shop_act182009；`Award[1]` type0、奖818802×1及818902×1、score1。当前本地匹配与权重有路径，原匹配牌生成、倍率、特殊卡触发和阶段结束仍需原脚本/样本。礼包与商店需使用父活动实际窗口，不能从静态子行推断当前开放。[MatchingGameActTable](../rules/tables/MatchingGameActTable.md)。

## PLAY-MONOPOLYACT：大富翁事件、战斗、援助、公会任务与补给

**执行裁定：** [PLAY-MONOPOLYACT 的唯一R1决定](../rules/final-rule-register.md#play-monopolyact)。本节数值与现代码描述须按该裁定使用。

107801掷骰移动，107802结算当前战斗事件，107807援助/107810跳过战斗/107811完成商会各有状态；活跃、个人累计、公会任务、日奖分别领。当前任务type0用本地score，领取不增加score。**107806他人创建的补给仍拒绝**，不得本地造补给让他人领取。

原 `Ver[1]` 为base848002×1/high849002×1/free848002×20/day_item101500×50/max_score_mul5/max_help_num10/roleRank286/guildRank287/kick_score25000。当前把单角色score当公会总分属于部署兼容假设，不能称原公会统计；骰子概率、真实多人援助、战斗生产与双榜冻结结算仍待恢复。个人日免费数和公会期分不能一起清零。[MonopolyActTable](../rules/tables/MonopolyActTable.md)。

## PLAY-DREAMTRIALACT：梦境试炼抢夺与公会数据

**执行裁定：** [PLAY-DREAMTRIALACT 的唯一R1决定](../rules/final-rule-register.md#play-dreamtrialact)。本节数值与现代码描述须按该裁定使用。

108001查询可抢夺目标，108002返回实际公会数据；抢夺需要真实目标归属、挑战次数、冷却及战斗票据，查询不能自行造成抢夺收益。当前有本地角色/公会状态回包，但跨角色候选、扣除对方资产和战斗生产仍是缺口。

原Const为 `fight_restore_num=3/robbery_restore_num=3/fight_cooldown=7200/robbery_cooldown=7200/being_robbed_num=3/pvp_fight_tid=16010001`；Version1为open_time25200/end_time61200、player_rank283/guild_rank284/guild_damage_rank285、award901900×50及21002×5。7:00到17:00等时刻解释须先确认原时间基准；不能把秒数直接当全局本地时区排期。跨日恢复和被抢次数应分别重置，公会榜与抢夺账本不能用空列表视为完成。[DreamTrialActTable](../rules/tables/DreamTrialActTable.md)。

## PLAY-DIAMONDVEINACT：钻石矿脉地图、行动、战斗与公会排名

**执行裁定：** [PLAY-DIAMONDVEINACT 的唯一R1决定](../rules/final-rule-register.md#play-diamondveinact)。本节数值与现代码描述须按该裁定使用。

当前先取地图→进入合法地图→购买攻击令/行动力→处理真实战斗记录→领取矿脉奖励，并保存公会关注图。109005购买行动后续已补，不再是首轮拒绝项；109007–9只能展示实际公会贡献与战斗记录，不能造全服矿区归属。

原Const为 `energy_max=100/attack_order_initial=30/attack_order_cost=1/attack_order_buy_num=5/attack_order_buy_cost=101500/attack_order_buy_cost_num=100/energy_buy_basic_cost=100/energy_buy_min_cost=25/robbery_cooldown=30`。当前本地地图/资源路径不等于原全服争夺，行动力购买阶梯、采矿产出、PVP归属、跨服榜与关闭结算仍缺完整证据。重复进图不能重置初始30攻击令。[DiamondVeinActTable](../rules/tables/DiamondVeinActTable.md)。

## PLAY-SOURCEPOINT：源点变换、合成与任务

**执行裁定：** [PLAY-SOURCEPOINT 的唯一R1决定](../rules/final-rule-register.md#play-sourcepoint)。本节数值与现代码描述须按该裁定使用。

110101把真实源点实例转到属于本角色的英雄，旧槽先清空；110102按Elevate消耗不同type材料并创建结果，材料实例不得重复引用；110103校验Trial真实英雄/养成进度后一次领奖。后续残余补完已实现这三条，旧“只有拒绝”记录不代表现状。

原 `Elevate[100334300].cost_list` 含多份type2的100314300×1，以及[1,2,1]；**cost type有不同语义，不能全部当Item库存扣除**。`Trial[101]` 关联hero1040101/type1199/target_count10，奖100264300×1。当前真实归属、材料不重用和任务位有路径；全部cost类型、转移覆盖/退回、原英雄被动门槛及客户端实例编码仍需完整对照。[SourcePointTable](../rules/tables/SourcePointTable.md)。

## PLAY-FISHINGACT：钓鱼剩余鱼竿、图鉴、奖励、记录与排名

**执行裁定：** [PLAY-FISHINGACT 的唯一R1决定](../rules/final-rule-register.md#play-fishingact)。本节数值与现代码描述须按该裁定使用。

110301抛竿建立结果，110302/110311收鱼后写真实 `fishing_act_catches`；110305解锁地图，110306只能换已激活竿。图鉴奖用Fish.first_award，等级奖用score对应Level.unlock_reward，进度奖用实际已捕获图鉴种数，110309上榜奖用特殊鱼总尺寸high_size。领取位按表tid、0基MSB-first保存，不能改用列表序号。

原活动1074003→Version3，island_version2/level_library2/illustrated_guide_version_library1/fishing_rod_library1，rank_need_score80000，up_rank_award为101500×2000、392002×80、391002×2000。110303按每鱼真实尺寸前三，110308读本活动真实渔获，不能以抛竿次数造鱼重。原鱼种/尺寸概率、天气/竿加成、充值竿直授、好渔获筛选和期末HighScoreRank/ScoreRank奖励仍未完整恢复；110309不是期末排名结算。[专项](../../../agent/workflow/gameplay-completion/PLAY-FISHINGACT/implementation.md)、[FishingActTable](../rules/tables/FishingActTable.md)。

## PLAY-ALBUM：家具、套装激活与套装奖励

**执行裁定：** [PLAY-ALBUM 的唯一R1决定](../rules/final-rule-register.md#play-album)。本节数值与现代码描述须按该裁定使用。

110401在真实获得Furniture后激活单件图鉴，110402检查FurnitureSuitAlbum要求激活整套，110403才发套装奖。持有、单件激活、整套激活、套装已领是四个状态，浏览家具不能直接发奖；重复激活和领奖不能新增库存或套装进度。

原Homeland表含FurnitureAlbum121行、FurnitureSuitAlbum10行，配置条目与真实家具拥有关系按tid匹配。当前独立保存图鉴状态，跨家园放置/仓库家具仍应识别同一所有权；旧期家具保留、收回家具后的图鉴和套装效果是否撤销待原消费者，不默认随活动清除。[HomelandTable](../rules/tables/HomelandTable.md)。

## PLAY-HOMELAND：家园任务、拜访、点赞、升级、清洁与替换

**执行裁定：** [PLAY-HOMELAND 的唯一R1决定](../rules/final-rule-register.md#play-homeland)。本节数值与现代码描述须按该裁定使用。

常驻家园与前述HomelandAct是不同模块：110904任务，110905/6真实熟人/拜访记录，110907拜访，110908点赞，110911升级，110912清洁，110913替换。当前任务后续已接共享Task；拜访、点赞日次数、家园等级、房间摆放及清洁记录分别保存，不以同名活动版本重置常驻家园。

原Const含like_award833502×10及201500×1000、day_support_time5；Task1为type1307/目标1/奖101500×50；Furniture121行/Suit10行/Level40行/Room30行。当前本地拜访/点赞与资源链有状态，原多人访问权限、点赞奖励归属、清洁生成及替换家具的返还/占用仍需逐消费者核验。[HomelandTable](../rules/tables/HomelandTable.md)。

## PLAY-BAKINGACT：烘焙合成、订单、蛋糕、事件、道具与整理

**执行裁定：** [PLAY-BAKINGACT 的唯一R1决定](../rules/final-rule-register.md#play-bakingact)。本节数值与现代码描述须按该裁定使用。

当前有交换格→单次/批量合成→制作蛋糕→提交/放弃订单→处理事件/酵母/道具→领取等级档→一键整理/批量模式的持久化路径。订单提交必须消耗真实板面蛋糕且只完成一次，批量合成不能重复使用格，限时订单刷新与普通订单分开。111010读保存局态；不能以客户端提交的完整板面覆盖存档。

原Global有lock_lv5/make_num10/close_level100/level_max8/score_rate1；Lv101为version1/level1/up_need_exp0/cake_weight[[100,1]]/order_weight[[10000,999]]；Order10001为group101/weight1000/cake_list[[3,4,1,150]]/add_score80/expire_time0。**cake_list四元组的各分量尚不可凭形状解释成原合成配方**。残余补完已加订单/合成，旧拒绝状态过时；原随机订单、连锁、事件刷新、道具完整语义与离线收益仍待原样本。[BakingActTable](../rules/tables/BakingActTable.md)。

## PLAY-HELPUPACT：助力升阶/升超凡活动

**执行裁定：** [PLAY-HELPUPACT 的唯一R1决定](../rules/final-rule-register.md#play-helpupact)。本节数值与现代码描述须按该裁定使用。

116001按Task真实统计领取手卷，116003消费手卷进行助力并抽信封，116004读取累计，116002累计达到Stage.stage_num才领阶段。原Lua证明daily_task_tid_list/weekly_task_tid_list/stage_tid_list均是已领取列表，整体help_times是全服累计，不能当个人剩余次数。日/周比较分别用TimeKit.IsSameDay/IsSameWeek。

原Version1有cost_item834102/cost_item_max10/help_times1；Task101–104各奖手卷5；Stage101/102/103门槛500万/1000万/1500万，第一档奖5111200×5与3401200×1；Award101–116均weight100。**每次扣1手卷、每次抽1条、cycle_type1作日任务、周界及单角色行代全服累计均为当前推断/兼容**，不能称原服已确证。FakeChannel/FakeShow是客户端跑马灯，不生成实际贡献；recycle_mail_tid9501400还需回收消费者。[专项](../../../agent/workflow/gameplay-completion/PLAY-HELPUPACT/implementation.md)、[HelpUpActTable](../rules/tables/HelpUpActTable.md)。

## PLAY-CAMPSITE：既有营地格与英雄放置

**执行裁定：** [PLAY-CAMPSITE 的唯一R1决定](../rules/final-rule-register.md#play-campsite)。本节数值与现代码描述须按该裁定使用。

83201解锁格，83202把本角色英雄放到合法格，当前由[cabin-service](../../../personal-server/game/cabin-service.mjs)接管。英雄归属、格是否解锁、同英雄是否占多个格和替换旧位置必须在同一事务处理；解锁不能修改养成等级，换位置不能重发拥有奖励。该族在原inventory中已有路由，因此没有新的待办卡，但仍属于本册命令覆盖。

格条件、消耗与加成应从该服务实际加载的配置逐一追溯，不能拿HomelandAct.cell_num或常驻家园Room代用。当前组件路径不证明原营地开放等级/加成全部恢复，具体原字段与客户端交互仍以营地实施证据补齐。

## 状态、时间与结算边界

G1状态在探索专表及独立模块136/145/155/168/519，其他多进模块92；G2使用 `minigame_act_state/claims/records`，key有按版本和按活动实例两类。当前G2的日序优先按开服经过24小时计算，不等于统一05:00；签到式服务还有从活动start算日的实现。每族需分别对照原消费者，不能用一次统一改日界宣称全修。

有效局必须具备未结束/已结算标记，消耗、奖励、成绩和领取位同事务保存；重登不能清掉pending或新造一盘。排行榜、抢夺、公会协作和全服矿区应有真实多角色来源及期末冻结/发奖记录；仅返回零值/空列表不构成这些玩法完成。所有历史验证以所链实施记录为准，本册没有新的设备或APK验收。

<!-- command-index:start -->

## 完整命令与任务卡索引

来源：[原静态命令目录](../../plans/remaining-gameplay-20261106/inventory.json)。仅取命令号、名称、模块、编码和schema，不继承其旧路由状态。`—`表示目录未绑定schema，不代表请求无参数或该功能未实现。实际分发与编码差异以正文当前处理器说明为准；原定义见[protobuf资产](../../../personal-server/assets/protobuf/)和[接口目录](../../../agent/workflow/interface-catalog/tcp-commands.md)。

### PLAY-HOMEPUZZLEACT

[规则段](#play-homepuzzleact家园拼图赠送求助分解与进度) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-homepuzzleact家园拼图赠送求助分解与进度)。客户端模块：`HomePuzzleActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 11408 | `req_home_puzzle_task_reward` | protobuf / `pb_home_puzzle_task_reward_req` | protobuf / `pb_home_puzzle_task_reward_rsp` |
| 11409 | `req_home_puzzle_gift` | protobuf / `pb_home_puzzle_gift_req` | protobuf / `pb_home_puzzle_gift_rsp` |
| 11410 | `req_home_puzzle_request` | protobuf / `pb_home_puzzle_request_req` | protobuf / `pb_home_puzzle_request_rsp` |
| 11413 | `req_home_puzzle_decompose` | protobuf / `pb_home_puzzle_decompose_req` | protobuf / `pb_home_puzzle_decompose_rsp` |
| 11416 | `req_home_puzzle_rec_process_award` | protobuf / `pb_home_puzzle_rec_process_award_req` | protobuf / `pb_home_puzzle_rec_process_award_rsp` |
| 11417 | `req_home_puzzle_get_friend_request_data` | protobuf / `pb_home_puzzle_get_friend_request_data_req` | protobuf / `pb_home_puzzle_get_friend_request_data_rsp` |
| 11418 | `req_home_puzzle_rec_friend_gift_piece` | protobuf / `pb_home_puzzle_rec_gift_piece_req` | protobuf / `pb_home_puzzle_rec_gift_piece_rsp` |
| 11419 | `req_home_puzzle_open_pack` | protobuf / `pb_home_puzzle_open_pack_req` | protobuf / `pb_home_puzzle_open_pack_rsp` |
| 11420 | `req_home_puzzle_cancel_request` | protobuf / `pb_home_puzzle_cancel_request_req` | protobuf / `pb_home_puzzle_cancel_request_rsp` |

### PLAY-HOMELANDACT

[规则段](#play-homelandact家园活动选人任务装修与清理) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-homelandact家园活动选人任务装修与清理)。客户端模块：`HomelandActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 11501 | `req_homeland_act_select_hero` | protobuf / `pb_homeland_act_select_hero_req` | protobuf / `pb_homeland_act_select_hero_rsp` |
| 11502 | `req_homeland_act_task_award` | protobuf / `pb_homeland_act_task_award_req` | protobuf / `pb_homeland_act_task_award_rsp` |
| 11503 | `req_homeland_act_decorate` | protobuf / `pb_homeland_act_decorate_req` | protobuf / `pb_homeland_act_decorate_rsp` |
| 11505 | `req_homeland_act_clear_room` | protobuf / `pb_homeland_act_clear_room_req` | protobuf / `pb_homeland_act_clear_room_rsp` |

### PLAY-CARNIVAL

[规则段](#play-carnival嘉年华大富翁骰子事件建筑与科技) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-carnival嘉年华大富翁骰子事件建筑与科技)。客户端模块：`CarnivalCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 43003 | `req_carnival_use_item` | etf / — | protobuf / `pb_mono_use_item_back` |
| 43006 | `req_carnival_throw_dice` | etf / — | protobuf / `pb_mono_throw_dice_back` |
| 43008 | `req_carnival_touch_event` | etf / — | etf-fallback / — |
| 43009 | `req_carnival_finish_event` | etf / — | protobuf / `pb_mono_finish_ev_back` |
| 43010 | `req_carnival_auto_flush_dice` | etf / — | protobuf / `pb_mono_auto_flush_dice_back` |
| 43014 | `req_carnival_buy_dice` | etf / — | protobuf / `pb_mono_buy_dice_back` |
| 43016 | `req_carnival_latest_data` | etf / — | protobuf / `pb_mono_req_data_back` |
| 43017 | `req_get_achieve_award` | etf / — | protobuf / `pb_mono_rev_achieve_back` |
| 43018 | `req_monopoly_build` | etf / — | protobuf / `pb_mono_one_build` |
| 43019 | `req_monopoly_build_up_level` | etf / — | etf-fallback / — |
| 43020 | `req_mono_get_build_award` | etf / — | protobuf / `pb_res_to_client` |
| 43021 | `req_mono_develop_tech` | etf / — | protobuf / `pb_mono_tech` |
| 43022 | `req_carnival_build_dispatch` | protobuf / `pb_mono_dispatch_req` | protobuf / `pb_mono_build_data` |
| 43023 | `req_carnival_box_award` | etf / — | protobuf / `pb_mono_req_data_back` |
| 43024 | `req_handle_build_extra` | protobuf / `pb_mono_build_handle_req` | protobuf / `pb_mono_build_handle_back` |

### PLAY-THEMETREASURE

[规则段](#play-themetreasure主题寻宝挑战兑换与全服奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-themetreasure主题寻宝挑战兑换与全服奖励)。客户端模块：`ThemeTreasureCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 76501 | `theme_treasure_hunt_req` | protobuf / `pb_theme_treasure_hunt_req` | protobuf / `pb_theme_treasure_hunt_rsp` |
| 76502 | `theme_treasure_challenge_req` | protobuf / `pb_theme_treasure_challenge_req` | protobuf / `pb_res_to_client` |
| 76503 | `theme_treasure_server_challenge_req` | etf / — | etf-fallback / — |
| 76504 | `theme_treasure_exchange_req` | protobuf / `pb_theme_treasure_exchange_req` | protobuf / `pb_theme_treasure_exchange_rsp` |
| 76505 | `theme_treasure_challenge_turn_req` | protobuf / `pb_theme_treasure_challenge_turn_req` | protobuf / `pb_res_to_client` |
| 76506 | `theme_treasure_target_req` | etf / — | etf-fallback / — |
| 76507 | `theme_treasure_task_award_req` | etf / — | protobuf / `pb_res_to_client` |
| 76508 | `theme_treasure_turn_award_req` | etf / — | protobuf / `pb_res_to_client` |
| 76509 | `theme_treasure_server_award_req` | etf / — | protobuf / `pb_res_to_client` |
| 76510 | `theme_treasure_special_award_req` | etf / — | protobuf / `pb_res_to_client` |
| 76511 | `theme_treasure_daily_award_req` | etf / — | protobuf / `pb_res_to_client` |
| 76512 | `req_theme_treasure_server` | etf / — | protobuf / `pb_theme_treasure_server_rsp` |

### PLAY-MINIGAME

[规则段](#play-minigame通用小游戏结算与老虎机重试) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-minigame通用小游戏结算与老虎机重试)。客户端模块：`MiniGameCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 83701 | `req_mini_game_settle` | protobuf / `pb_mini_game_settle_req` | protobuf / `pb_mini_game_settle_rsp` |
| 83702 | `req_mini_game_enter` | protobuf / `pb_mini_game_enter_req` | protobuf / `pb_mini_game_enter_rsp` |
| 83703 | `req_slot_machine_retry` | etf / — | protobuf / `pb_mini_game_slot_machine` |
| 83704 | `req_mini_game_handle` | protobuf / `pb_mini_game_handle_req` | protobuf / `pb_mini_game_handle_rsp` |

### PLAY-TREASUREHUNT

[规则段](#play-treasurehunt寻宝铲子购买合成删除与刷新) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-treasurehunt寻宝铲子购买合成删除与刷新)。客户端模块：`TreasureHuntCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 85601 | `req_treasure_hunt` | etf / — | protobuf / `pb_treasure_hunt_ret_all` |
| 85605 | `req_treasure_hunt_buy_shovel` | etf / — | protobuf / `pb_res_to_client` |
| 85606 | `req_treasure_hunt_compose` | protobuf / `pb_treasure_hunt_compose_req` | etf-fallback / — |
| 85607 | `req_treasure_hunt_auto_compose` | etf / — | protobuf / `pb_treasure_hunt_compose_ret` |
| 85608 | `req_treasure_hunt_delete_shovel` | etf / — | protobuf / `pb_treasure_hunt_delete_ret` |
| 85609 | `req_treasure_hunt_exchange_shovel` | protobuf / `pb_treasure_hunt_exchange_req` | etf-fallback / — |
| 85610 | `req_treasure_hunt_refresh` | etf / — | protobuf / `pb_treasure_hunt_refresh_ret` |

### PLAY-GRANDTOURER

[规则段](#play-grandtourer旅行令牌任务兑换里程与强化) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-grandtourer旅行令牌任务兑换里程与强化)。客户端模块：`GrandTourerCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 87801 | `req_grand_tourer_get_token` | etf / — | protobuf / `pb_res_to_client` |
| 87802 | `req_grand_tourer_task_award` | etf / — | protobuf / `pb_grand_tourer_task_back` |
| 87803 | `req_grand_tourer_exchange_token` | etf / — | protobuf / `pb_res_to_client` |
| 87804 | `req_grand_tourer_distance_award` | etf / — | protobuf / `pb_res_to_client` |
| 87805 | `req_grand_tourer_enhance` | etf / — | protobuf / `pb_res_to_client` |

### PLAY-DREAM

[规则段](#play-dream梦境事件日周奖收集宝箱与npc阵容) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-dream梦境事件日周奖收集宝箱与-npc-阵容)。客户端模块：`DreamCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88001 | `req_dream_finish_event` | protobuf / `pb_dream_finish_event_req` | protobuf / `pb_dream_fight_event_rsp` |
| 88002 | `req_dream_day_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88003 | `req_dream_week_finish_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88004 | `req_dream_all_finish_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88005 | `req_dream_finish_task` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88006 | `req_dream_collect_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88007 | `req_dream_box_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88008 | `req_dream_npc_lineup` | etf / — | protobuf / `pb_dream_npc_lineup_rsp` |
| 88009 | `req_dream_single_collect_award` | etf / — | protobuf / `pb_dream_award_rsp` |
| 88010 | `req_dream_refresh_event` | etf / — | protobuf / `pb_dream_refresh_event_rsp` |

### PLAY-MAGICALJOURNEY

[规则段](#play-magicaljourney魔法旅程国家养成收藏关卡与boss) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-magicaljourney魔法旅程国家养成收藏关卡与-boss)。客户端模块：`MagicalJourneyCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 89901 | `req_magical_journey_sword` | protobuf / `pb_magical_journey_sword_req` | protobuf / `pb_magical_journey_sword_rsp` |
| 89902 | `req_magical_journey_country_main_up` | etf / — | protobuf / `pb_magical_journey_main_up_rsp` |
| 89903 | `req_magical_journey_country_sub_active` | protobuf / `pb_magical_journey_country_sub_active_req` | protobuf / `pb_magical_journey_country_sub_active_rsp` |
| 89904 | `req_magical_journey_country_sub_up` | etf / — | protobuf / `pb_magical_journey_sub_up_rsp` |
| 89905 | `req_magical_journey_sword_record` | etf / — | protobuf / `pb_magical_journey_sword_record_info` |
| 89906 | `req_magical_journey_activate_normal_collect` | protobuf / `pb_magical_journey_collect_activate_req` | protobuf / `pb_magical_journey_collect_activate_normal_rsp` |
| 89907 | `req_magical_journey_activate_season_collect` | protobuf / `pb_magical_journey_collect_activate_req` | protobuf / `pb_res_to_client` |
| 89908 | `req_magical_journey_mission_star_award` | etf / — | protobuf / `pb_res_to_client` |
| 89909 | `req_magical_journey_mission_task_award` | etf / — | protobuf / `pb_magical_journey_task_rev_back` |
| 89910 | `req_magical_journey_mission_multi_fight` | protobuf / `pb_magical_journey_mission_fight_req` | protobuf / `pb_magical_journey_mission_multi_fight_back` |
| 89911 | `req_magical_journey_boss_multi_fight` | protobuf / `pb_magical_journey_boss_fight_req` | protobuf / `pb_magical_journey_boss_fight_back` |
| 89912 | `req_magical_journey_chapter_progress_award` | etf / — | protobuf / `pb_magical_journey_progress_rev_back` |
| 89913 | `req_magical_journey_node_rank_award` | etf / — | protobuf / `pb_res_to_client` |
| 89914 | `req_magical_journey_mission_pass_info` | etf / — | protobuf / `pb_magical_journey_mission_pass` |
| 89915 | `req_magical_journey_star_skill_active` | etf / — | protobuf / `pb_magical_journey_star_activate_rsp` |
| 89916 | `req_magical_journey_power` | etf / — | etf-fallback / — |
| 89917 | `req_magical_journey_login_after` | etf / — | protobuf / `pb_magical_journey_login_after_back` |

### PLAY-PETACTIVITY

[规则段](#play-petactivity超凡魔灵现世选择挑战好感治疗与兑换) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-petactivity超凡魔灵现世选择挑战好感治疗与兑换)。客户端模块：`PetActivityCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 90501 | `req_pet_act_select_pet` | protobuf / `pb_req_pet_act_select_pet` | etf-fallback / — |
| 90502 | `req_pet_act_claim_fight_rewards` | protobuf / `pb_req_pet_act_daily_reward` | protobuf / `pb_res_to_client` |
| 90503 | `req_pet_act_claim_likability_rewards` | protobuf / `pb_req_pet_act_claim_likability_rewards` | protobuf / `pb_res_to_client` |
| 90504 | `req_pet_act_cure` | protobuf / `pb_req_pet_act_cure` | protobuf / `pb_res_pet_act_cure` |
| 90505 | `req_pet_act_finish_cure` | protobuf / `pb_req_pet_act_cure` | protobuf / `pb_res_pet_act_cure` |
| 90506 | `req_pet_rev_daily_vitality_rewards` | etf / — | protobuf / `pb_rev_pet_vitality_award_ret` |
| 90507 | `req_pet_act_exchange` | etf / — | protobuf / `pb_pet_exchange_ret` |

### PLAY-RADISHFARM

[规则段](#play-radishfarm萝卜农场事件拜访与助力) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-radishfarm萝卜农场事件拜访与助力)。客户端模块：`RadishFarmCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 90801 | `req_radish_farm_start` | protobuf / `pb_radish_farm_normal_req` | protobuf / `pb_radish_farm_normal_rsp` |
| 90802 | `req_radish_farm_event` | protobuf / `pb_radish_farm_normal_req` | protobuf / `pb_radish_farm_normal_rsp` |
| 90803 | `req_radish_farm_cell_award` | protobuf / `pb_radish_farm_normal_req` | protobuf / `pb_radish_farm_reward_rsp` |
| 90804 | `req_radish_farm_visit` | etf / — | protobuf / `pb_radish_farm_visit_rsp` |
| 90805 | `req_radish_farm_help` | protobuf / `pb_radish_farm_help_req` | protobuf / `pb_radish_farm_help_rsp` |
| 90806 | `req_radish_farm_select_gift` | protobuf / `pb_radish_farm_gift_select_req` | protobuf / `pb_radish_farm_gift` |

### PLAY-EXPERIENCEACT

[规则段](#play-experienceact历练出发与领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-experienceact历练出发与领奖)。客户端模块：`ExperienceActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 93801 | `req_experience_go` | protobuf / `pb_experience_go_req` | protobuf / `pb_experience_go_rsp` |
| 93802 | `req_experience_award` | protobuf / `pb_experience_award_req` | protobuf / `pb_experience_award_rsp` |

### PLAY-PUZZLEACT

[规则段](#play-puzzleact拼图活动任务与进度) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-puzzleact拼图活动任务与进度)。客户端模块：`PuzzleActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102001 | `req_puzzle_act_finish_task` | protobuf / `pb_puzzle_act_req` | protobuf / `pb_puzzle_act_back` |
| 102002 | `req_puzzle_act_progress_award` | protobuf / `pb_puzzle_act_req` | protobuf / `pb_res_to_client` |

### PLAY-TILESWAP

[规则段](#play-tileswap换块小游戏换轮) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-tileswap换块小游戏换轮)。客户端模块：`TileSwapCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102501 | `req_tile_swap_next_turn` | etf / — | protobuf / `pb_tile_swap` |

### PLAY-MUSHROOMMONSTER

[规则段](#play-mushroommonster蘑菇怪开始结束与领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-mushroommonster蘑菇怪开始结束与领奖)。客户端模块：`MushroomMonsterCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102601 | `req_mushroom_start` | etf / — | protobuf / `pb_mushroom_monster` |
| 102602 | `req_mushroom_end` | etf / — | protobuf / `pb_mushroom_monster_end_rev` |
| 102603 | `req_mushroom_award` | etf / — | protobuf / `pb_mushroom_monster_award_rev` |

### PLAY-GOPHERACT

[规则段](#play-gopheract打地鼠) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-gopheract打地鼠)。客户端模块：`GopherActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103201 | `req_beat_gopher` | unknown / — | protobuf / `pb_beat_gopher_back` |

### PLAY-TOWERACT

[规则段](#play-toweract爬塔活动前进切换与任务) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-toweract爬塔活动前进切换与任务)。客户端模块：`TowerActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104301 | `req_tower_act_step` | protobuf / `pb_tower_act_step_req` | protobuf / `pb_tower_act_slot_rsp` |
| 104302 | `req_tower_act_switch` | protobuf / `pb_tower_act_switch_req` | protobuf / `pb_tower_act_role` |
| 104303 | `req_tower_act_task` | protobuf / `pb_tower_act_task_req` | protobuf / `pb_tower_act_task_rsp` |

### PLAY-SPIRITCOURTYARD

[规则段](#play-spiritcourtyard灵庭种植土地合成委托协作与宴会) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-spiritcourtyard灵庭种植土地合成委托协作与宴会)。客户端模块：`SpiritCourtyardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105001 | `req_spirit_courtyard_tree_plant` | protobuf / `pb_req_spirit_courtyard_tree_plant` | protobuf / `pb_rsp_spirit_courtyard_tree_plant` |
| 105002 | `req_spirit_courtyard_tree_get` | etf / — | protobuf / `pb_rsp_spirit_courtyard_tree_get` |
| 105003 | `req_spirit_courtyard_add_land` | etf / — | protobuf / `pb_rsp_spirit_courtyard_tree_get` |
| 105004 | `req_spirit_courtyard_tree_remove` | etf / — | protobuf / `pb_rsp_spirit_courtyard_tree_plant` |
| 105005 | `req_spirit_courtyard_get_task_reward` | protobuf / `pb_req_spirit_courtyard_submit_entrust` | protobuf / `pb_res_spirit_courtyard_submit_entrust` |
| 105006 | `req_spirit_courtyard_update_task` | etf / — | protobuf / `pb_res_spirit_courtyard_update_task` |
| 105007 | `req_spirit_courtyard_publish_collaboration` | protobuf / `pb_req_spirit_courtyard_publish_collaboration` | protobuf / `pb_res_spirit_courtyard_publish_collaboration` |
| 105008 | `req_spirit_courtyard_assist_entrust` | protobuf / `pb_req_spirit_courtyard_assist_entrust` | protobuf / `pb_res_spirit_courtyard_assist_entrust` |
| 105009 | `req_spirit_courtyard_finish_guild_task` | protobuf / `pb_req_spirit_courtyard_finish_banquet` | protobuf / `pb_rsp_spirit_courtyard_finish_banquet` |
| 105010 | `req_spirit_courtyard_tree_fruit_merge` | protobuf / `pb_req_spirit_courtyard_fruit_merge` | protobuf / `pb_res_to_client` |
| 105011 | `req_spirit_courtyard_tree_change` | protobuf / `pb_req_spirit_courtyard_tree_plant` | protobuf / `pb_rsp_spirit_courtyard_tree_get` |
| 105012 | `req_spirit_courtyard_refresh_role_info` | protobuf / `pb_req_spirit_courtyard_refresh_role_info` | protobuf / `pb_res_spirit_courtyard_refresh_role_info` |
| 105013 | `req_spirit_courtyard_cancel_publish_collaboration` | protobuf / `pb_req_spirit_courtyard_cancel_collaboration` | protobuf / `pb_res_spirit_courtyard_cancel_collaboration` |
| 105014 | `req_spirit_courtyard_intimacy_task_reward` | etf / — | protobuf / `pb_spirit_courtyard_in_task_res` |
| 105015 | `req_spirit_courtyard_banquet_award` | etf / — | protobuf / `pb_rsp_spirit_courtyard_banquet_award` |
| 105016 | `req_spirit_courtyard_use_item` | protobuf / `pb_req_spirit_courtyard_use_item` | protobuf / `pb_rsp_spirit_courtyard_tree_get` |

### PLAY-TRIPLEMATCH

[规则段](#play-triplematch三消换块重开道具与关卡奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-triplematch三消换块重开道具与关卡奖励)。客户端模块：`TripleMatchCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 106001 | `req_triple_match_swap_tile` | protobuf / `pb_triple_match_swap_tile_req` | protobuf / `pb_triple_match_swap_tile_rsp` |
| 106002 | `req_triple_match_restart` | protobuf / `pb_triple_match_restart_req` | protobuf / `pb_triple_match_swap_tile_rsp` |
| 106003 | `req_triple_match_score_award` | protobuf / `pb_triple_match_score_award_req` | protobuf / `pb_triple_match_score_award_rsp` |
| 106004 | `req_triple_match_use_item` | protobuf / `pb_triple_match_use_item_req` | protobuf / `pb_triple_match_use_item_rsp` |
| 106005 | `req_triple_match_pass_stage_award` | protobuf / `pb_triple_match_rec_pass_stage_award_req` | protobuf / `pb_triple_match_rec_pass_stage_award_rsp` |

### PLAY-MATCHINGGAMEACT

[规则段](#play-matchinggameact配对小游戏抽签卡牌与奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-matchinggameact配对小游戏抽签卡牌与奖励)。客户端模块：`MatchingGameActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107501 | `req_matching_game_act_luck` | protobuf / `pb_matching_game_act_luck_req` | protobuf / `pb_role_matching_game_act_info` |
| 107502 | `req_matching_game_act_use_card` | etf / — | protobuf / `pb_matching_game_act_use_card_rsp` |
| 107503 | `req_matching_game_award` | protobuf / `pb_matching_game_act_score_award_req` | protobuf / `pb_matching_game_act_score_award_rsp` |

### PLAY-MONOPOLYACT

[规则段](#play-monopolyact大富翁事件战斗援助公会任务与补给) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-monopolyact大富翁事件战斗援助公会任务与补给)。客户端模块：`MonopolyActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107801 | `req_monopoly_act_go` | protobuf / `pb_monopoly_act_go_req` | protobuf / `pb_monopoly_act_go_back` |
| 107802 | `req_monopoly_act_finish_fight_event` | protobuf / `pb_monopoly_act_base_req` | protobuf / `pb_monopoly_act_finish_order_back` |
| 107803 | `req_monopoly_act_get_live_award` | protobuf / `pb_monopoly_act_get_reward_req` | protobuf / `pb_res_to_client` |
| 107804 | `req_monopoly_act_get_guild_task_award` | protobuf / `pb_monopoly_act_get_reward_req` | protobuf / `pb_res_to_client` |
| 107805 | `req_monopoly_act_get_total_task_award` | protobuf / `pb_monopoly_act_get_reward_req` | protobuf / `pb_res_to_client` |
| 107806 | `req_monopoly_act_get_supply` | protobuf / `pb_monopoly_act_get_reward_req` | protobuf / `pb_res_to_client` |
| 107807 | `req_monopoly_act_fight_help` | protobuf / `pb_monopoly_act_base_req` | protobuf / `pb_monopoly_act_send_order_back` |
| 107808 | `req_monopoly_act_get_guild_info` | etf / — | protobuf / `pb_monopoly_act_get_guild_back` |
| 107809 | `req_monopoly_act_day_award` | etf / — | protobuf / `pb_res_to_client` |
| 107810 | `req_monopoly_act_jump_fight` | protobuf / `pb_monopoly_act_fight_req` | protobuf / `pb_monopoly_act_base_back` |
| 107811 | `req_monopoly_act_finish_firm` | protobuf / `pb_monopoly_act_finish_firm_req` | protobuf / `pb_monopoly_act_finish_order_back` |

### PLAY-DREAMTRIALACT

[规则段](#play-dreamtrialact梦境试炼抢夺与公会数据) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-dreamtrialact梦境试炼抢夺与公会数据)。客户端模块：`DreamTrialActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 108001 | `req_dream_trial_query_rob` | protobuf / `pb_dream_trial_query_rob_req` | protobuf / `pb_dream_trial_query_rob_rsp` |
| 108002 | `req_dream_trial_guild_info` | protobuf / `pb_dream_trial_guild_info_req` | protobuf / `pb_dream_trial_guild_info_rsp` |

### PLAY-DIAMONDVEINACT

[规则段](#play-diamondveinact钻石矿脉地图行动战斗与公会排名) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-diamondveinact钻石矿脉地图行动战斗与公会排名)。客户端模块：`DiamondVeinActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 109001 | `req_diamond_vein_act_get_map` | protobuf / `pb_diamond_vein_act_base_req` | protobuf / `pb_diamond_vein_act_map_data` |
| 109002 | `req_diamond_vein_act_enter_map` | protobuf / `pb_diamond_vein_act_base_req` | protobuf / `pb_diamond_vein_act_enter_rsp` |
| 109003 | `req_diamond_vein_act_award` | protobuf / `pb_diamond_vein_act_base_req` | protobuf / `pb_diamond_vein_act_get_award_rsp` |
| 109004 | `req_diamond_vein_act_buy_attack` | protobuf / `pb_diamond_vein_act_base_req` | protobuf / `pb_diamond_vein_act_role_res_rsp` |
| 109005 | `req_diamond_vein_act_buy_action` | protobuf / `pb_diamond_vein_act_base_req` | protobuf / `pb_diamond_vein_act_role_res_rsp` |
| 109006 | `req_diamond_vein_act_guild_focus` | protobuf / `pb_diamond_vein_act_guild_focus_req` | protobuf / `pb_diamond_vein_act_guild_rsp` |
| 109007 | `req_diamond_vein_act_guild_rank_info` | etf / — | protobuf / `pb_diamond_vein_act_guild_rank_player_info` |
| 109008 | `req_diamond_vein_act_get_fight_record` | etf / — | protobuf / `pb_diamond_vein_act_fight_reports_rsp` |
| 109009 | `req_diamond_vein_act_get_guild_info` | etf / — | protobuf / `pb_diamond_vein_act_guild_data` |

### PLAY-SOURCEPOINT

[规则段](#play-sourcepoint源点变换合成与任务) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-sourcepoint源点变换合成与任务)。客户端模块：`SourcePointCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110101 | `req_source_point_change` | protobuf / `pb_source_point_change_req` | protobuf / `pb_source_point_change_rsp` |
| 110102 | `req_source_point_combine` | protobuf / `pb_source_point_combine_req` | protobuf / `pb_source_point_combine_rsp` |
| 110103 | `req_source_point_task_award` | protobuf / `pb_source_point_task_req` | protobuf / `pb_source_point_task_rsp` |

### PLAY-FISHINGACT

[规则段](#play-fishingact钓鱼剩余鱼竿图鉴奖励记录与排名) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-fishingact钓鱼剩余鱼竿图鉴奖励记录与排名)。客户端模块：`FishingActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110301 | `req_fishing_act_go_fish` | protobuf / `pb_fishing_act_rod_req` | protobuf / `pb_fishing_act_role_data` |
| 110302 | `req_fishing_act_get_fish` | protobuf / `pb_fishing_act_get_req` | protobuf / `pb_fishing_act_get_rsp` |
| 110303 | `req_fishing_act_get_fish_top` | etf / — | protobuf / `pb_fishing_act_get_top_rsp` |
| 110304 | `req_fishing_act_book_award` | protobuf / `pb_fishing_act_common_list_req` | protobuf / `pb_fishing_act_data_res` |
| 110305 | `req_fishing_act_unlock_map` | protobuf / `pb_fishing_act_common_req` | protobuf / `pb_fishing_act_data_res` |
| 110306 | `req_fishing_act_change_rod` | protobuf / `pb_fishing_act_common_req` | etf-fallback / — |
| 110307 | `req_fishing_act_level_award` | protobuf / `pb_fishing_act_common_req` | protobuf / `pb_fishing_act_data_res` |
| 110308 | `req_fishing_act_get_record` | etf / — | protobuf / `pb_fishing_act_get_record_rsp` |
| 110309 | `req_fishing_act_up_rank_award` | etf / — | protobuf / `pb_fishing_act_data_res` |
| 110310 | `req_fishing_act_progress_award` | protobuf / `pb_fishing_act_common_list_req` | protobuf / `pb_fishing_act_data_res` |
| 110311 | `req_fishing_act_batch_get_fish` | protobuf / `pb_fishing_act_batch_get_req` | protobuf / `pb_fishing_act_batch_get_rsp` |

### PLAY-ALBUM

[规则段](#play-album家具套装激活与套装奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-album家具套装激活与套装奖励)。客户端模块：`AlbumCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110401 | `req_furniture_active` | etf / — | protobuf / `pb_homeland_album_role` |
| 110402 | `req_furniture_suit_active` | etf / — | protobuf / `pb_homeland_album_role` |
| 110403 | `req_furniture_suit_award` | etf / — | protobuf / `pb_res_to_client` |

### PLAY-HOMELAND

[规则段](#play-homeland家园任务拜访点赞升级清洁与替换) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-homeland家园任务拜访点赞升级清洁与替换)。客户端模块：`HomelandCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110904 | `req_homeland_task_award` | etf / — | protobuf / `pb_homeland_task_finish_rsp` |
| 110905 | `req_homeland_familiar_list` | etf / — | protobuf / `pb_homeland_familiar_info_rsp` |
| 110906 | `req_homeland_visit_list` | etf / — | protobuf / `pb_homeland_visit_record_list_rsp` |
| 110907 | `req_homeland_visit` | etf / — | protobuf / `pb_homeland_visit_record_rsp` |
| 110908 | `req_homeland_like` | etf / — | protobuf / `pb_homeland_like_rsp` |
| 110911 | `req_homeland_level_up` | etf / — | protobuf / `pb_homeland_level_up_rsp` |
| 110912 | `req_homeland_clean_room` | etf / — | etf-fallback / — |
| 110913 | `req_homeland_replace` | protobuf / `pb_homeland_replace_req` | protobuf / `pb_homeland_depot` |

### PLAY-BAKINGACT

[规则段](#play-bakingact烘焙合成订单蛋糕事件道具与整理) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-bakingact烘焙合成订单蛋糕事件道具与整理)。客户端模块：`BakingActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 111001 | `req_baking_rec_lv_award` | protobuf / `pb_baking_rec_lv_award_req` | protobuf / `pb_baking_rec_lv_award_rsp` |
| 111002 | `req_baking_swap` | protobuf / `pb_baking_swap_req` | protobuf / `pb_baking_swap_rsp` |
| 111003 | `req_baking_synthesize` | protobuf / `pb_baking_synthesize_req` | protobuf / `pb_baking_synthesize_rsp` |
| 111004 | `req_baking_batch_synthesize` | protobuf / `pb_baking_batch_synthesize_req` | protobuf / `pb_baking_batch_synthesize_rsp` |
| 111005 | `req_baking_make_cake` | protobuf / `pb_baking_make_cake_req` | protobuf / `pb_baking_make_cake_rsp` |
| 111006 | `req_baking_give_up_order` | protobuf / `pb_baking_give_up_order_req` | protobuf / `pb_baking_give_up_order_rsp` |
| 111007 | `req_baking_use_item` | protobuf / `pb_baking_use_item_req` | protobuf / `pb_baking_use_item_rsp` |
| 111008 | `req_baking_use_cheat_item` | protobuf / `pb_baking_use_cheat_item_req` | protobuf / `pb_baking_use_cheat_item_rsp` |
| 111009 | `req_baking_yeast_click` | protobuf / `pb_baking_yeast_click_req` | protobuf / `pb_baking_yeast_click_rsp` |
| 111010 | `req_get_act_data` | protobuf / `pb_baking_get_new_act_data_req` | protobuf / `pb_baking_get_new_act_data_rsp` |
| 111011 | `req_baking_handle_event` | protobuf / `pb_baking_handle_event_req` | protobuf / `pb_baking_handle_event_rsp` |
| 111012 | `req_baking_submit_order` | protobuf / `pb_baking_submit_order_req` | protobuf / `pb_baking_submit_order_rsp` |
| 111013 | `req_baking_refresh_time_limit_order` | protobuf / `pb_baking_refresh_time_limit_order_req` | protobuf / `pb_baking_refresh_time_limit_order_rsp` |
| 111014 | `req_baking_one_key_sort` | protobuf / `pb_baking_one_key_sort_req` | protobuf / `pb_baking_one_key_sort_rsp` |
| 111015 | `req_baking_select_batch_synthesize_model` | protobuf / `pb_baking_select_batch_synthesize_model_req` | protobuf / `pb_baking_select_batch_synthesize_model_rsp` |

### PLAY-HELPUPACT

[规则段](#play-helpupact助力升阶升超凡活动) · [原任务卡](../../plans/remaining-gameplay-20261106/07-exploration-minigames.md#play-helpupact助力升阶升超凡活动)。客户端模块：`HelpUpActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 116001 | `req_help_up_task_reward` | protobuf / `pb_help_up_task_reward_req` | protobuf / `pb_help_up_task_reward_rsp` |
| 116002 | `req_help_up_stage_award` | protobuf / `pb_help_up_stage_award_req` | protobuf / `pb_help_up_stage_award_rsp` |
| 116003 | `req_help_up_help` | protobuf / `pb_help_up_help_req` | protobuf / `pb_help_up_help_rsp` |
| 116004 | `req_help_up_get_times` | protobuf / `pb_help_up_get_times_req` | protobuf / `pb_help_up_get_times_rsp` |

### PLAY-CAMPSITE

[规则段](#play-campsite既有营地格与英雄放置) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`CampsiteCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 83201 | `req_unlock_cell` | etf / — | protobuf / `pb_res_to_client` |
| 83202 | `re_place_hero` | protobuf / `pb_campsite_place` | protobuf / `pb_campsite_data` |

