# 副本、竞技、公会与社交详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

本册记录模式配置怎样关联、挑战/交互怎样改变状态，以及多人对象、结算和重登的边界。原表逐行值见[全部配置](../rules/README.md)，每条命令与登录模块见[命令目录](../appendices/commands.md)和[模块目录](../appendices/modules.md)。当前消费者的本地策略、未接入分支与原表数值分开列出，不能把“有接口”当成原玩法已经实现。

<a id="fight-instance"></a>
## 1. 所有模式先确定身份、期号和挑战实例

一次有效操作先确定`server_id/role_id/play_type/act_id/version/period`及关卡/房间/对手实例，再核功能、阶段、次数、编队和目标。普通主线201开战→207结算的规则见[主线与战斗册](onboarding-combat.md)；其他模式可复用战报编码，但不能继承普通主线的进度、胜负或奖励判断。

开战实例应绑定真实阵容、敌阵/对手、随机种子、成本、模式期号和结果。败北、超时、放弃、重试、扫荡与首通分别变更；客户端自报胜利、伤害、星数不能代替权威战斗结果。当前各模式是否已保存完整实例，需要逐服务验证，以下不因存在`recordPass/settleFight`函数就断言它已经接上真实入口。

源代码某些旧注释仍写“所有Fight.def_team都为null”。原Fight解析现已恢复Section→Fight→Team；该旧注释不再能证明模式没有原敌阵。应精确核对该玩法引用的Fight行、Team行和Fighter/NpcAttr，不能继续借邻关、按玩家战力缩放或注入测试敌人充当原版阵容。

## 2. 精英、塔和试炼

| 模式 | 配置关联 | 当前状态与操作 | 尚需闭合的具体规则 |
| --- | --- | --- | --- |
| <a id="elite-mission"></a>精英任务/BOSS | [EliteMissionTable](../rules/tables/EliteMissionTable.md)→Chapter、Fight、BOSS/宝箱奖 | [elite-mission-service](../../../personal-server/game/elite-mission-service.mjs)管理module140的`mission_id/boss_bin/box_award_bin/difficulty`；87001选择/进度、87002宝箱、87003章奖；[battle](../../../personal-server/game/elite-mission-battle.mjs)与201/202/207分流 | 当前87001可按相邻index写mission_id，须区分选择与已通关；真实精英敌阵仍需从本玩法Fight/Team接入，不能把部署参数`eliteEnemies`当原规则 |
| 巅峰塔PeakTower | [PeakTowerTable](../rules/tables/PeakTowerTable.md)的Layer/Type/Global/Shop | [服务](../../../personal-server/game/peak-tower-service.mjs)存当前层、最高层/时间、扫荡日/次数、已购商品及领奖位；1103扫荡、1104层奖、1109买物、1110成就、1111塔奖、1112全服平均层 | 开战队数/轮次、层敌阵、Global字段在原界面的精确意义；当前日键UTC日期，不是已确认原重置时间 |
| 阵营塔CampTower | [CampTowerTable](../rules/tables/CampTowerTable.md)的Open/Type/FirstPass/DiffDay | [服务](../../../personal-server/game/camp-tower-service.mjs)记`passes[firstTid]`与first/cross两套位；93601跨服奖、93602首通奖、93603首通记录 | Open/DiffDay的开放日与服龄、阵营编队、跨服首通归属必须由真实挑战链验证；当前`recordPass.power=0`不是原通关战力 |
| <a id="star-mission"></a>星级关卡StarMission | [StarMissionTable](../rules/tables/StarMissionTable.md)按活动版本→章节/星条件/箱奖/技能 | [服务](../../../personal-server/game/star-mission-service.mjs)按角色+version+chapter保存star_bits/award_bits，技能另存 | 实际战斗怎样判每颗星、活动期与版本映射、仍明确拒绝的award请求实参/奖励映射；胜利不自动等于三星 |
| <a id="red-cliff"></a>赤壁RedCliff | [RedCliffTable](../rules/tables/RedCliffTable.md)的Level/Buff/StarAward/Const | [服务](../../../personal-server/game/red-cliff-service.mjs)保存当前层、已选buff、待选候选、刷新次数、宝箱/重置记录 | 当前只在整轮通完后允许reset，注释明确原重置窗口未恢复；buff候选权重、保留HP/复活与跨轮继承需原消费者 |
| <a id="soul-trial"></a>灵魂试炼SoulTrial | [SoulTrialTable](../rules/tables/SoulTrialTable.md)的Fight/DrawCard/CampLoop/DayAward | [服务](../../../personal-server/game/soul-trial-service.mjs)87104翻牌、87105领奖，分已揭示与已领取 | 免费翻牌后付费成本当前明确拒绝；战斗、阵营轮换、牌位奖池、日奖不能由这两个领奖命令推定完成 |
| <a id="scarlet-trial"></a>猩红试炼ScarletTrial | [ScarletTrialTable](../rules/tables/ScarletTrialTable.md)的Task/Turn/Buff/Rank/Const | [服务](../../../personal-server/game/scarlet-trial-service.mjs)89101任务奖、89102源石选择；总伤害由simulation.events.harms求和 | harm种类、过量伤害、来源/目标、Turn和Buff进入真实战斗的链条；不能把任意harm.value全和当原服伤害口径 |
| <a id="destiny-pve"></a>命运PVE | [DestinyPveTable](../rules/tables/DestinyPveTable.md)的Layer/Act/TreasureCfg | [服务](../../../personal-server/game/destiny-pve-service.mjs)可读层信息、接受真实simulation的recordPass；fight入口当前明确拒绝 | 本玩法的Fight/Team和回复schema、解锁、重试、宝物与阶段奖；旧“def_team全空”理由需要按已恢复表重新审查 |
| <a id="tower-defense"></a>塔防 | [TowerDefenseTable](../rules/tables/TowerDefenseTable.md)的Type/Turns/Monster/Task/Wall/Week/Index | [服务](../../../personal-server/game/tower-defense-service.mjs)按该表族处理状态 | Turns轮次、墙血量/修复、怪物路线、周期开启与实际战斗的完整消费者，不能只以领Task奖表示塔防已完成 |

<a id="peak-tower"></a>
### 巅峰塔当前可复算的规则

原`Global.fast_harvest_layer=140/rapid_fighting=10`。当前1103要求目标已通关、目标层≤140、本日次数<10，按当天+目标层防重复，发该层Layer配置奖。它当前不是“输入140便一次扫前140层”；同层一天只能结算一次。该解释来自现有消费者，原字段语义仍要和客户端扫荡函数/回包核对。

1104遍历1至当前已通层，只发未领过的层奖，按`peak_tower_layer+layer`记唯一键；无待领奖返回限额失败。1109须`maxLayer≥Shop.layer`，扣`currency×price`，发`goods`并记已购tid。1110按Type.layer_range上界检查，1111按同范围检查塔奖并写tower_award位图；二者当前使用不同claim_type，即使可能读取相同Type奖，也不能据实现擅自认定原版允许领两份，需核原两个入口各自的奖励消费者。

<a id="camp-tower"></a>
### 阵营塔首通和全服奖不同

当前`recordPass`只有真实胜利simulation才写`passes[firstTid]`，层数不超过`FirstPass.level`，首通时间只首次保留。93602发`first_pass_award`，93601发`all_award`，分别写firstBits/crossBits和唯一账本。全服/跨服首次达成者、参与者资格与原排名并不能仅靠每个玩家自己的passes证明；这是当前跨服奖励路径必须继续核对的范围。

<a id="general-dungeon"></a>
## 3. 通用地图的事件和关卡不是一个tid

[GeneralDungeonTable](../rules/tables/GeneralDungeonTable.md)的Const有`dungeon_max=100/level_max=1000/scene_max=10/event_type_max=1000`。这些是编码/规模参数，不宜直接当玩家允许挑战次数。Level101的scene含`Dream_01`，`init_pos=[6002,0,0,0,0]`、`unlock_fog_range=2`，场景顺序与位置数组按相同index配对。

[表读取器](../../../personal-server/config/general-dungeon-tables.mjs)和[当前服务](../../../personal-server/game/general-dungeon-service.mjs)采用：

```text
事件kind = Event.event_body mod 1000
事件归属level_tid = floor(Event.event_body/1000)
箱子奖励 = EventBox[event_body].res_list
后继事件 = Event.next_event（按原数组顺序）
```

78102读副本，78103进入层，78104关闭层，78105激活事件，78106同步地图位置/迷雾，78101执行事件，78107用道具。状态键为角色+副本，内部按层/场景存位置、fog、事件active/result、buff与道具；领取键含角色+副本+层+类型+event，避免关闭重开层重领同箱。

当前仅kind2箱子和kind8加道具执行真实路径；战斗、buff、对话、抽取、任务、治疗、模型、迷雾、条件、记录、随从、效果、动画、锁和关闭等其他kind均明确拒绝。kind8先核`DungeonType.max_prop`容量；箱子领奖与事件完成同事务，成功后激活合法next_event，指向未进入层的后继保持休眠。

当前进入层主要检查配置存在，默认操作副本id1；位置/fog仍接受客户端同步。**进入资格、节点可达性、迷雾揭示范围和道具真实效果尚不能由这些状态字段推定已校验**。78107当前会移除持有道具并回空资源，原`EventPropUse/Prop`效果必须补接后才能称该道具可玩。读地图成功不等于全部探索事件完成。

## 4. 世界Boss、PitLord、武馆、名人堂与时空神殿

| 模式 | 原配置/当前入口 | 结算与证据边界 |
| --- | --- | --- |
| <a id="world-boss"></a>世界Boss | [WorldBossTable](../rules/tables/WorldBossTable.md)、[服务](../../../personal-server/game/world-boss-service.mjs) | 保存本期Boss、角色damage、全服总伤害、击杀记录、最高伤害与成就；`recordDamage`只应接真实战斗；当前Boss配置无法唯一解析则拒绝，不能随机选一个；击杀奖按`day:boss_tid`防重，进入地图不算击杀 |
| <a id="pit-lord"></a>PitLord | [PitLordTable](../rules/tables/PitLordTable.md)、[服务](../../../personal-server/game/pit-lord-service.mjs) | 真实damage入本期榜；按服龄选择RankGroup，冻结历史entries后按原名次档发奖；补发和普通领取共用同一奖身份，不能各发一次；免费奖另按day记录 |
| <a id="martial-club"></a>多人武馆 | [MartialClubTable](../rules/tables/MartialClubTable.md)、[服务](../../../personal-server/game/martial-club-service.mjs)，module123 | 创建/邀请/加入/退出/准备/位置/踢出/匹配/开战/放弃/结算/雇佣分别处理；队长与普通成员权限、真实成员、雇佣期限/机器人来源、敌阵与结算归属要闭合，测试provider不等于原玩家/原Boss |
| <a id="martial-club-act"></a>武馆活动 | [MartialClubActTable](../rules/tables/MartialClubActTable.md)、[服务](../../../personal-server/game/martial-club-act-service.mjs) | 活动任务进度来自已提交武馆结果；活动id/期号、单次与累计任务、奖位独立于房间状态 |
| <a id="fame-hall"></a>名人堂 | [FameHallTable](../rules/tables/FameHallTable.md)、[服务](../../../personal-server/game/fame-hall-service.mjs)，91101—91111 | Fun1218要求角色≥32级且开服日≥2，还受模块开关161；状态保存难度/阶段/最高阶段、待选掉落、英雄/圣器/徽章、重置/扫荡时间；不能因存在路由提前给1级开放 |
| 时空神殿 | [time-temple-service](../../../personal-server/game/time-temple-service.mjs)，module159 | 当前取证客户端1.55.090365的8个请求编码器未进入Cmd.c2s_index，发送路径不可达；7801是S2C抽取push，不是C2S命令；不能编造770x或借90501—90507等其他系统编号 |

Boss伤害必须明确“有效HP损失、过量、治疗、护盾、反伤、召唤物、同一场上限”的原口径；不能按战力×固定百分比代替真实战斗。Boss同时被多人击杀时，全服共享HP只能扣至0，首次击杀、参与资格和排名都绑定同一Boss实例；玩家本地各存一份HP会产生重复击杀。

名人堂当前待选掉落`options=[]`，部分选择明确拒绝，表中所引用英雄/Fighter空间与原掉落候选尚未全部闭合。91102选择、91106放弃、91107终止、91105重置、91108扫荡与91111补发必须分别核对pendingDrop和阶段奖；不能空候选时自动送任意英雄。当前1级弹窗真实来源仍未定位，功能门槛与弹窗/引导入口分开验收。

时空神殿缺的具体注册为`embryo_up/bond_up/runes_collect/runes_up/runes_skill_select/god_up/season_shop/draw_award`八项。登录数据/推送能编码不能证明可主动执行它们。结论适用该客户端取证版本，其他版本需重新检查注册表。

## 5. 竞技的名次、积分、轮次与真实对手

[pvp-battle](../../../personal-server/game/pvp-battle.mjs)可把双方持久化英雄与玩法编队组装成战报，不能代替匹配/积分规则。当前物防/魔防取平均的`defenseChannel`、部分技能选择和战力仍是兼容路径，不能用“战报来自simulateBattle”声称完整原竞技算法已恢复。

| 竞技 | 原表明确的门槛/常量 | 当前流程与精确缺口 |
| --- | --- | --- |
| <a id="swap-arena"></a>SwapArena | [SwapArenaTable](../rules/tables/SwapArenaTable.md)：免费8次，购买货币101500，刷新5次/CD5，初始名次5000，`settle_time=79200/settle_sec=300/offdays=14/cleanrank=600`；购次表第1/2次各30 | [服务](../../../personal-server/game/swap-arena-service.mjs)4031—4040，编队类型40/66；挑战列表、刷新、购次、战报/已读、首达名次奖、跨服阶段与双队分开；79200是22:00的秒值，时区与结算窗口消费者仍须核对 |
| <a id="hunter-arena"></a>HunterArena | [HunterArenaTable](../rules/tables/HunterArenaTable.md)：等级38、开服第4日；`init_score=1100/min_score=1000/min_win_gain=5/elo_k=100`；普通战报15、锁定5、`new_season_back=999`、`matching_time=[0,2]/auto_fight_count=10` | [服务](../../../personal-server/game/hunter-arena-service.mjs)84001—84011；DayTask7002数挑战、7003数胜利，日奖与赛季奖不同；K=100不足以推导完整Elo方程、配对区间/时间单位；当前7日赛季常量缺独立赛季表支持 |
| <a id="arena-contest"></a>ArenaContest | [ArenaContestTable](../rules/tables/ArenaContestTable.md)：Fun1064、团长25、服龄3，竞猜间隔60、战斗计算120，最多领奖轮9，跨服第13日，分组人数128/256 | [服务](../../../personal-server/game/arena-contest-service.mjs)83301—83315、module113的act/role/match三块；State/big_state决定报名/进行窗，默认UTC+8；晋级、对阵、竞猜结算与弃权不能由常量推断 |
| <a id="tournament"></a>Tournament | [tournament-service](../../../personal-server/game/tournament-service.mjs)，module150 | 报名/轮次/挑战/任务/排名/战报各自状态；真实角色与对手快照、赛程及冻结榜；历史采集的96名不等于当前服96个账户 |
| <a id="top-arena"></a>TopArena | [TopArenaTable](../rules/tables/TopArenaTable.md)、[服务](../../../personal-server/game/top-arena-service.mjs) | 资格→分组/半决赛/决赛→观战/竞猜→奖励；真实晋级来源、比赛快照、下注封盘与原奖励表 |
| <a id="overall-pvp"></a>OverallPVP | [OverallPvpTable](../rules/tables/OverallPvpTable.md)、[服务](../../../personal-server/game/overall-pvp-service.mjs) | 多阶段、多队/淘汰、队伍选择、战报与期奖；不能当一场普通单队胜负替代赛制 |
| <a id="matching"></a>实时/总体匹配 | [PlayMatchTable](../rules/tables/PlayMatchTable.md)、[OverallMatchTable](../rules/tables/OverallMatchTable.md)，[play服务](../../../personal-server/game/play-match-service.mjs)、[overall服务](../../../personal-server/game/overall-match-service.mjs) | 入队/取消/超时/接受/锁定同一对手/结算；OverallMatch120001当前只记录本角色queue并回match_type/opt，rank1/power0是占位，不代表真实配对已完成 |
| 三消竞技 | [TriMatchPvpTable](../rules/tables/TriMatchPvpTable.md)、[服务](../../../personal-server/game/trimatch-pvp-service.mjs) | 必须使用三消局与棋盘结果，不能复用普通自动战斗决定胜负；段位、次数、战报与赛季另核 |

对手必须存在并有可解析的合法阵容；空服应按协议返回真实空集合或原表/原函数允许的机器人。原版若有机器人，需其模板、生成等级/养成、命名、替换与积分资格证据，不能用历史fixture假扮在线玩家。`role_id`、server与snapshot版本在开战和结算时一致，查看A却打B不合格。

排名交换、加减分、最低积分、连胜、跨服组、同分排序与赛季回退分别查本模式消费者。不能把SwapArena名次互换算法当HunterArena积分算法，也不能从`new_season_back=999`直接宣称“所有人重置999分”。

竞猜先按真实比赛ID和轮次冻结/扣除下注，再封盘；比赛无效、平局、弃权、退款、胜方赔率和可领期限必须有原字段/函数证据。未恢复赔率不能自行固定双倍返还；请求改选目标不能覆盖已成交下注。

## 6. 三消战斗与普通战斗分开

原配置是[BattleTriMatchHeroTable](../rules/tables/BattleTriMatchHeroTable.md)、[EquipTable](../rules/tables/BattleTriMatchEquipTable.md)、[LineupTable](../rules/tables/BattleTriMatchLineupTable.md)、[TriMatchTowerTable](../rules/tables/TriMatchTowerTable.md)，分别对应三消英雄/装备/阵容/塔。当前入口见[trimatch-service](../../../personal-server/game/trimatch-service.mjs)、[fight-service](../../../personal-server/game/trimatch-fight-service.mjs)、[tower-service](../../../personal-server/game/trimatch-tower-service.mjs)。

局内必须追踪棋盘初始种子、合法移动/交换、消除与连锁、回合/行动点、技能道具、怪物/目标与分数。胜负由这一局的可验证状态产生，再映射星条件和奖；不能直接相信客户端“通过/得分”。失败、重试是否重置棋盘/扣次数、离线是否保留局、局内奖是否只有通关才发，均需对应原局内消费者，不能从普通201/207推导。

<a id="rank"></a>
## 7. 排行榜、历史、分享和赛季结算

[RankTable](../rules/tables/RankTable.md)与[rank-service](../../../personal-server/game/rank-service.mjs)按`rankId+scope+period+participant`分区。主线、等级、星数、战力、活动积分、单场最大伤害、累计伤害分别由其权威服务写入；数值是求和、最大或覆盖必须按该榜字段/函数核对。升降序、阈值、人数、榜外名次、同分时间/角色ID排序不能统一套一个默认。

当前代码有`server:1`兼容默认scope，调用方应传实际区服与跨服组；三服数据不能因默认值串榜。空榜、玩家不在榜、活动未开、周期已结束是不同结果。历史榜用冻结快照，不能在新赛季开始后读取实时榜重新排旧名次。

结算顺序为冻结本期参与者与分数→按原档位计算奖励→用稳定期号/角色键写结算与邮件→提交→通知。重启补跑复用同一结果，不能重新随机分组或发第二轮奖。没有名次不伪造第1名，未取到奖励行不发替代钻石。

<a id="report-record"></a>
主线通关记录211、点赞212和战报/分享引用真实已提交fight，保留作者、关卡/版本、用时或回合和队伍快照。重复点赞、自己点赞、跨服可见性和删除期限须核对应原消费者；分享ID不能每次重登生成另一场战斗。

<a id="guild"></a>
## 8. 公会基础状态和权限

module24的`pb_res_guild_login`保存公会聚合；[guild-society](../../../personal-server/game/guild-society-service.mjs)补充共享目录`guild_directory`、申请箱`guild_apply_inbox`与日志`guild_logs`，[guild-roster](../../../personal-server/game/guild-roster-service.mjs)处理成员。会长job1、副会长/官员2、成员6，不能以列表首位代替职务。

业务流为未入会→搜索/推荐→申请→审批/直接加入→成员/职务/捐献→退出/踢出/转让/解散。申请不等于入会；目录人数、成员身份、个人guildId和module24必须指向同一个共享对象。会长转让须原子撤销旧职务/赋予新职务；解散要处理申请、频道、正在进行的活动与待结算权益，不能只清个人guildId。

**GuildTable/GuildActiveTable数值行未恢复**。已有原客户端符号为`CREATE_COST_ITEM/APPLY_MAX_COUNT/APPLY_CD_TIME/KICK_INDEX/RECRUIT_INDEX/rename_cost_item/normal_rename_times/pay_and_box/TID_GUILD_PAY_BOX_CONSTANT`以及等级奖/活跃箱。当前本地值仅为兼容策略：

| 当前策略 | 数值 | 还缺的原配置/消费者 |
| --- | --- | --- |
| 名称/公告 | 名称2—12、公告120、招募60 | 名称校验、公告/招募输入上限及屏蔽词函数 |
| 人数/官员 | 成员50、官员4 | Guild等级容量与职务上限行 |
| 申请 | 同时10个目标 | APPLY_MAX_COUNT/APPLY_CD_TIME |
| 每日操作 | 招募3、踢人5、捐献3 | RECRUIT_INDEX/KICK_INDEX的计数与成本/次数行 |
| 推荐/日志 | 推荐20、日志50 | 原排序、页数/保留期与log_id |

这些数值不能进入“原公会规则”宣传。当前需缺表奖励的路径明确拒绝；21026箱奖、21030薪资等路径是否可发取决于现有合法配置与真实资源处理器，不因路由存在就代替原薪资算法。

当前`guild-roster.seedLogin`在未初始化fixture时创建900001公会，玩家为会长并生成`roleId+1…+4`的周边成员。这是离线fixture行为，**不是原版新号自动建会，也不是实际服人口**。真实空服创角投影与该fallback的触发条件需单独核验，不能把虚构成员作为公会活动参与者。

## 9. 公会活动的共享对象与确切缺口

[guild-coop-tables](../../../personal-server/config/guild-coop-tables.mjs)明确将Boss血量、按战力百分比伤害、周期、冷却、价格与奖励列为本地策略。协议/schema已恢复只证明字段格式；其数值不得当原版规则。具体缺原表为`GuildBossTable/GuildJointTable/GuildGVGTable/GuildNationTable/GuildBargainTable/GuildExpeditionTable/GuildHuntTable/GuildAuctionTable`等。

| 家族与服务 | 必须共享的状态/合法动作 | 精确待恢复的原字段/过程 |
| --- | --- | --- |
| 红包/试炼/探索/公会战/对决/竞速：[guild-activity](../../../personal-server/game/guild-activity-service.mjs) | 红包实例剩余、求助/助战、共享节点/HP、报名、队伍/轮次、BUFF投票与积分 | 红包总额/份数与分配、Trial敌阵、Explore地图/精力、War/Duel赛程/胜负、Racing路线计分和投票生效点；当前缺数值分支明确拒绝 |
| <a id="guild-boss"></a>Boss：[guild-boss](../../../personal-server/game/guild-boss-service.mjs) | 同会Boss阶段/HP、成员贡献、技能物品、伤害/技能/在线奖 | GuildBossTable的HP阶梯、技能倍率/CD、真实伤害/过量、damageAwards/onlineAwards/日免费物品；当前power百分比不是原战斗公式 |
| <a id="guild-joint"></a>联合探索：[guild-joint](../../../personal-server/game/guild-joint-service.mjs) | 门/怪/箱/矿、先锋/焦点、个人探索与全会进度、结算排名 | GuildJointTable周期、节点邻接、共享HP、矿时长/归属、宝箱数、原任务和rankAwards；单人副本取消/结算不能抢占多人对象 |
| <a id="guild-rune-stone"></a>符石：[guild-rune-stone](../../../personal-server/game/guild-rune-stone-service.mjs) | 真正ItemGuildRuneStone源/目标、槽位、穿脱与合成 | 当前3合1和6槽为local composeRatio/maxSlots，需原合成比例、等级与组合属性表 |
| <a id="guild-gvg"></a>GVG/SLG：[guild-gvg](../../../personal-server/game/guild-gvg-service.mjs)、[slg-map](../../../personal-server/game/guild-slg-map-service.mjs) | 矿/据点/守军/成员位置、占领时限、出战队、视野与撤离 | GuildGVGTable周期、地图邻接/可达、holdSeconds/计分、lode收益、teamCount与行动成本；不能只改占领标记 |
| <a id="guild-vote"></a>投票：[guild-vote](../../../personal-server/game/guild-vote-service.mjs) | 公会级投票实例、候选来源、成员一票、截止结果 | 原durationSeconds/candidateCount、发起/参与权限、平票、周期奖励 |
| <a id="guild-nation"></a>国战/协助：[guild-nation](../../../personal-server/game/guild-nation-service.mjs)、[assist](../../../personal-server/game/guild-nation-assist-service.mjs) | 城/核心、建筑/兵种/科技队列、行军/集结、保护/修复、协助与赛季 | GuildNationTable的计时/成本/队列槽、兵力和城HP、march时间、伤害/占领归属、贡献/阶段奖；当前固定耗钻和计时不是原证据 |
| <a id="guild-bargain"></a>砍价：[guild-bargain](../../../personal-server/game/guild-bargain-service.mjs) | 商品实例、发起者、帮助者与砍价记录、完成和购买 | GuildBargainTable原价/底价、每次减价分布、帮助/自砍次数、失效与限购 |
| <a id="guild-expedition"></a>远征：[guild-expedition](../../../personal-server/game/guild-expedition-service.mjs) | 宣战/报名、地图/目标、鼓舞、竞猜和期榜 | GuildExpeditionTable匹配、开放窗、参加/离会资格、积分/胜负、赔率与期奖 |
| <a id="guild-hunt"></a>狩猎/讨伐：[guild-hunt](../../../personal-server/game/guild-hunt-service.mjs)、[crusade](../../../personal-server/game/guild-crusade-service.mjs) | 参与房间、目标Boss、支援、伤害和个人/公会排名 | GuildHunt等表的Boss、次数/CD、有效伤害、参加时点、奖励档/补发与期号 |
| <a id="guild-auction"></a>拍卖：[guild-auction](../../../personal-server/game/guild-auction-service.mjs) | 同一场次/物品、当前最高价/出价人、扣款/退旧款、结束/成交/分红 | GuildAuctionTable货源、起价/加价、延时/到期、成交定价、手续费、离会与分红；当前实际扣钻不证明这些值为原版 |

共享状态应以`guild_id+period+实体id`唯一，个人次数/领奖另带role_id。两人抢最后一份红包、同秒打死Boss、同矿归属、同拍品出价都要竞争共享条件；每位玩家各记“已领一次”不能防全会超发。离会/换会后权益是否保留取原资格快照，不允许通过换会重置个人成本或重复期奖。

<a id="friend"></a>
## 10. 好友的双向关系和赠领

[FriendTable](../rules/tables/FriendTable.md)的Limit按角色等级选档：

| 等级范围 | 好友上限 | 每日领取次数上限 | daily_present_rewards原字段 |
| --- | --- | --- | --- |
| 1—49 | 60 | 30 | `401900×300` |
| 50—59 | 80 | 40 | `401900×400` |
| 60—69 | 90 | 50 | `401900×500` |
| 70—999 | 100 | 60 | `401900×600` |

Param为申请上限30、每日赠送上限20、黑名单100、搜索最多5、私聊10，`friendship_exchange_ratio=100/present_exchange_ratio=10`；`present_rewards/rev_rewards=[]`。这些空数组不能解释成“每次赠领固定发daily_present_rewards”：后者在哪个每日条件触发仍缺消费者。

[friend-service](../../../personal-server/game/friend-service.mjs)20001申请、20002删除、20003同意、20004拒绝、20005/6黑名单、20007赠、20008领、20009查询、20010推荐、20011一键赠领，20012推荐类型/20013举报的当前映射仍需原调用参数补证。

申请检查真实目标、不是自己、双方黑名单/关系与申请量。互相申请当前可直接完成双向关系；同意时双方容量都检查，两个`friend_links`和申请清理同事务。删除双向关系并清未领赠礼；当前黑名单独立存表，不能擅写成拉黑必然删除好友，需核原调用顺序。

赠礼唯一键为`day+giver+receiver`，必须是好友、本日未赠且总数未满；领取只处理真实存在的未领赠礼并核等级档次数，标`received_at`。当前`friendshipChangeData.res.changes=[]`，明确未恢复AwardKit/TID_FRIENDSHIP触发，所以赠领记录成功**不等于友情点已发**。一键赠领同事务按双方列表处理，任一非法项的失败语义据当前实现，原一键是否跳过非法项仍需实包。

`Param.recommend_count=5`无恢复消费者；原FriendMgr原型87另有硬编码最大10并截断回复，当前推荐用10。不能只见Param就把推荐人数写成一定5；推荐类型、等级差/战斗寿命、随机与刷新`recommend_reset_time=5`须按对应函数解读单位与排序。搜索和推荐只能返回实际角色，不能用fixture凑满人数。

<a id="chat"></a>
## 11. 聊天、频道、历史与举报

频道类型来自[MsgTable.ChannelType](../rules/tables/MsgTable.ChannelType.md)，参数来自[ChatTable.Param](../rules/tables/ChatTable.Param.md)和[ReportConst](../rules/tables/ChatTable.ReportConst.md)。下列是原字段值，不代表当前服务全部执行：

| 参数族 | 原字段值 | 解释边界 |
| --- | --- | --- |
| 资格与长度 | 世界等级15、`private_chat_lv_limit=35/private_chat_lv_dt_limit=5`、字符140、链接2、私聊会话10 | 私聊等级差及好友例外组合要核原函数，不单按35判所有私聊 |
| 节流/相似消息 | `send_time_interval=10/count_limit_in_cd=3`、相似阈值70、检查10/相似消息数10 | 时间窗口和相似算法不能只从数字猜；当前发送函数未使用这些节流字段 |
| 历史 | `max_msg_count=150/login_chat_msg_count=30/save_chat_msg_days=7/pull_history_count=150` | 本地显示缓存、登录量、服务留存和单次拉取不是同一上限 |
| 举报 | 每日30、`report_msg_num=30/report_msg_valid_time=1800` | 可举报时间窗、消息数量/有效证据要对应原函数 |

当前[chat-service](../../../personal-server/game/chat-service.mjs)保存channel/member/history/settings/report，消息以`channel_id+idx`定位真实sender/time/content。发送检查非空、Unicode字符数≤140、msg_type只接受0/1、当前频道成员及真实私聊目标；世界、公会、私聊分别投递到区服/公会/双方，不能只给发送人回成功就算送达。

当前sendToChannel没有执行上述角色等级、禁言/相似消息/发送节流字段，`sender_bin`仍为空；跨服push目标/extra字段部分未恢复。这些是具体实现缺口，不把原参数表的存在写成服务已限制。

11000—11003保留ChatCmd发送编码，但本次取证客户端1.55.090365未发现调用点；实际发现调用的是11006解禁、11008自禁、11010设置、11012移除私聊、11013举报、11014点赞等。当前1/5/6/7/8/9为本地CHAT_CODES，不是恢复的原MsgErr。

历史拉取/推送应核频道成员和区服范围、分页idx与保留窗口。退出公会/频道后不可继续收成员消息；重登只恢复有资格的频道与自己的设置/私聊会话。发送内容与真实手机号等用户数据不进入公开规则文档，验证应使用临时角色与无敏感文本。

## 12. 评论、助力、关系、弹幕与实时地图

[social-community](../../../personal-server/game/social-community-service.mjs)有46001/2助力、75001—5实时地图、76601—5评论评分、77501—3关系、77601冒险角色、79201攻略排名、84701弹幕点赞。当前原`SupportMgr/CommentErr/RelationshipTable`数值未提取，本地策略为每日助力10、评论200字、日点赞10、评分1—5/日修改3、关系自定义64；**均不是已确认原版限制**。

评论保存真实作者/英雄tid、内容/时间、评分和屏蔽状态；点赞键含角色/日/评论，不能只把列表返回的like_count加一。评分应由真实分数记录聚合，修改更新自己的旧分，不能不断向总分累加新值。是否允许多次发评论、日点赞能否跨日再点同评论、删除如何回滚聚合，准确缺口在原Comment消费者和错误码。

助力要检查双方对象、类型、日限、目标资格及实际奖励；关系标记/通知选项与好友关系分开存。实时地图要按实例核进入/离开、可达位置、传送资格、复活、断线清除和同图可见集合。当前能保存位置或回空payload不能证明地图寻路/移动限制、奖励与广播已恢复。攻略/冒险角色与弹幕列表来自实际记录，不填充虚构作者或点赞。

## 13. 失败、重复结算与重登的核对方式

| 场景 | 需要保持的事实 |
| --- | --- |
| 无门槛/错误期号/非成员/目标不存在 | 不扣成本、不改变次数、进度、共享HP、下注或领奖位 |
| 合法败北/放弃/超时 | 按本模式原成本与进度规则处理，不套胜利奖励，不伪造满星 |
| 同场重复结算 | 返回原结果或明确已结算；战斗统计、分数、消耗与资源只发生一次 |
| 并发操作共享实体 | 同红包/节点/Boss/拍品只产生一次有效归属与结算，双方看到同版本 |
| 跨日/跨赛季 | 按本系统时间函数转期；已开实例是否归旧期、未领奖是否补邮件按原规则 |
| 推送失败后重登 | 从已提交业务行、领奖/订单账本与冻结快照恢复，不重新模拟已结束比赛 |

PVE至少覆盖合法胜负、首通/重复、扫荡/领奖、跨期与重登；PVP需要两个真实独立角色及同场快照；公会需要会长/普通成员/外会三种身份。当前只有组件或临时TCP证据的模式仍保留其验收层级，本册不代表新增APK、线上多人或运营结算验收。

<a id="common-map"></a>
## 14. CommonMap的共享定义不等于地图布局

90601初始化、90602触发、90603扫荡由[common-map-service](../../../personal-server/game/common-map-service.mjs)明确以code5拒绝。[CommonMapTable](../rules/tables/CommonMapTable.md)确有Buff/Box/Game/Fight/Node/Key/HideStory等公共族；例如Box1有award_list、Key1301消耗`334002×3`，这些不能证明某张地图存在该箱/钥匙节点。

`CommonMap`只有一行，`init_pb_struct=pb_pet_play_master`。原`CommonMapMgr.ReqInitMap`先按该结构解码，再调用`lua_handle_init_map`；真正布局来自`RequireConfig(mapCfgFullName)`的另一地图配置模块。尚缺每张图的坐标/节点列表/邻接、实例初始化与当前节点状态。因此不能把Node模板按tid顺序排成网格、随机散箱或回空地图成功；恢复时需先定位实际mapCfgFullName及原触发/可达/扫荡函数，再把公共奖励池接到合法实例。

<a id="message-transport"></a>
## 15. Msg传输和渠道入口的真实回包契约

[message-service](../../../personal-server/game/message-service.mjs)的10501—10511处理频道、成员、历史与角色信息；它与ChatCmd的发送/设置接口有关联，但不能把两组命令当作同一protobuf。当前频道wire身份为`(100+type)×100000+target_id`；私聊、公会、服/跨服频道要先解type/target并核实际资格。当前兼容别名的接受范围仍需与原频道解析函数核对。

| 命令 | 原编码/回包证据 | 状态约束与当前差异 |
| --- | --- | --- |
| 10501/10510发送/日志发送 | protobuf `pb_req_send_msg(channel_id,content_bin,extra_param)` | sender取认证角色，不能信任内容中的作者；发送与记录是否各自推送按原函数区分 |
| 10502/10506/10507进频道/历史/求频道并进入 | ETF请求，回`pb_msg_range_list_with_role_info` | 频道成员资格、分页idx与实际历史一致，不能将其他频道历史拼入 |
| 10503离开 | 八对原请求/回复均成功空payload | 删除/撤销当前成员资格，不用protobuf空对象取代真正空回包 |
| 10504/10505角色资料 | 分别回`pb_msg_role_info`与list | 只取真实角色与允许的公开数据，不把全登录档附上 |
| 10508/10509/10511登录/跨服/查看 | 登录容器为`pb_res_msg_login`，其他依各请求的ETF契约 | type12目前按本服非聊天频道兼容；该本地映射不证明原跨服路由已恢复 |

`MAX_REPLY_MESSAGES=200`是当前服务的单次回复保护值。源注释仍说Chat Param未恢复，但本轮已恢复`max_msg_count=150/pull_history_count=150`，不得继续引用旧注释作为“原值未知”的证据；200与150分别是什么限制，需按原取历史消费者裁定。

<a id="channel-entry"></a>
102801由[channel-entry-service](../../../personal-server/game/channel-entry-service.mjs)接收最多一个渠道id；nil或无参数取默认。当前entries来自`coopTables.channel`本地策略，保存opens/lastOpen会话记录；原`is_open/start_time/end_time/link_url/server_id_list/server_open_min_day/server_open_max_day/str_channel_id`数值并未因此恢复。

原请求成功回包是**空payload**，渠道数据由S2C9804的`pb_channel_entry`路径提供。把该PB塞进102801的请求回复可能使大厅初始化阻塞。当前execute只回空成功，不应据此宣称9804实际投递/原渠道配置已完成；必须另核push生产者与字段来源。

<a id="guild-family-details"></a>
## 16. 公会复合命令族分别核状态和奖励

下列补充对应第9节合并列出的`guild-activity`家族；其他公会族继续使用第9节各自行。所有成员操作都要求本期所属公会/权限，不用本地数值填原缺表。

| 具体家族 | 正常动作及权威对象 | 精确原规则缺口 |
| --- | --- | --- |
| <a id="guild-active"></a>活跃21027/85501—85505 | 专项任务、活跃点、积分箱/完成奖与解散通知分开；清“已读”不能延缓公会解散 | GuildActive任务配置、积分生产者、箱档、auto_dissolve时间/资格和原notice位；当前本地次数不代替这些值 |
| <a id="guild-envelope"></a>红包83101—83108 | 创建、发出、参加、领取、记录、感谢与排行指向同一红包实例 | 原总额/份数、随机或固定拆分算法、剩余额竞争、资格/过期与退款；领取空奖不算已分钱 |
| <a id="guild-trial"></a>试炼83401—83411 | 求助、助战、感谢、失败恢复、压制、关卡/箱奖及战报分开 | Trial敌阵/血量/压制效果、助战次数和有效胜负、求助者/助战者的奖励归属、感谢是否给资源 |
| <a id="guild-explore"></a>探索89301—89328及893289 | 个人/共享箱、移动/传送、游戏、营地、建筑、Boss、图鉴分别绑定图/节点/实例 | Explore原地图邻接、精力、小游戏完成证明、共享Boss、建筑投入/升级、图鉴收集条件；保留实际893289编号，不按连续号重写 |
| <a id="guild-explore-trial"></a>探索试炼89351/89352 | 试炼资格/结果与普通探索图进度分开 | 原试炼章/难度、选取对象、入场成本、真实战斗与领奖位，不能用探索任务达标替代 |
| <a id="guild-war"></a>公会战90001—90016 | 报名/集结/攻击、队伍、竞猜、战报与排名奖绑定同场赛程 | War原对阵、锁阵时间、多队损伤继承、胜负/积分、竞猜封盘与结算；个人胜利不必然等于公会获胜 |
| <a id="guild-duel"></a>公会对决90701—90707 | 匹配、参与、轮次状态和奖励分离 | Duel匹配档、参加/离会资格、轮次时间、胜负/贡献与奖档；不能直接复用War规则 |
| <a id="guild-racing"></a>竞速91201—91209 | 出战/支援、BUFF投票、生效结果、积分与轮次奖 | Racing原路线/行动消耗、援助次数、投票阶段/平票、BUFF作用域、积分函数；单纯保存投票不说明BUFF进入战斗 |

<a id="community-families"></a>
评论等公共状态的具体命令族如下；数值仍受第12节“当前本地策略”限制。

| 家族 | 具体权威状态和操作边界 | 待核原消费者 |
| --- | --- | --- |
| <a id="support"></a>助力46001/46002 | 给出者、被助者、类型/日键和实际记录；查询不再发一次助力奖 | Support目标资格、次数、资源及领取触发点 |
| <a id="realtime-map"></a>实时图75001—75005 | 进入/退出、回出生点、移动、传送分别校验同实例与位置 | 原地图可达/速度、传送/复活成本、可见广播范围、断线离图 |
| <a id="comment"></a>评论76601—76605 | 同英雄真实作者、每条评论id、点赞者、个人评分和聚合 | CommentErr原字数/次数、重复发帖、日点赞与原评分修改门槛 |
| <a id="relationship"></a>关系77501—77503 | 标记/取消与no_notify分开；双向好友不是任意自定义关系 | RelationshipTable的类型、数量、双方确认/解除与通知触发 |
| <a id="adventure-list"></a>冒险77601 | 角色列表只含实际可见对象，空服不造玩家 | 原筛选、排序、页大小/推荐资格 |
| <a id="strategy-rank"></a>攻略79201 | 真实攻略作者/英雄/排行与可用快照 | 原收录/更新、榜字段、同分与可见范围 |
| <a id="danmaku"></a>弹幕84701 | 对真实弹幕id去重记录点赞者/时间，不只改客户端计数 | 原可点赞范围、同条/跨日限制与弹幕过期 |

<a id="trimatch-families"></a>
## 17. 三消命令族的对象边界

三消每张表的原值按第6节表页查，下列对象和命令不能并入普通英雄/装备模块。

| 家族 | 要维持的操作规则 | 尚需原消费者闭合的内容 |
| --- | --- | --- |
| <a id="trimatch-hero"></a>112001/112002英雄 | 三消英雄自己的等级/星与成本，拥有、上限、逐级合并成本后提交 | 本体与普通英雄关系、对应原级/星行、三消技能与属性入口 |
| <a id="trimatch-equip"></a>113001—113003装备 | 独立装备对象、升级/升阶、交换成本与目标 | 三消Equip品质/槽位兼容、实际成本行和交换返还，不能套普通1001 |
| <a id="trimatch-lineup"></a>114001—114005阵容 | 真实三消英雄、位置唯一、阵容保存/切换，独立于普通208/209 | 原队数、位置/阵营限制、不同玩法预设的引用范围 |
| <a id="trimatch-fight"></a>115001—115006战斗 | 一局种子、棋盘/移动轨迹、开战/重试/退出/战报同一局标识 | 原连锁/分数/目标/行动规则，重试是否改种子与成本，真实结算入口 |
| <a id="trimatch-tower"></a>119001—119003塔 | 本塔进度、体力恢复与奖励分别记录 | 原自然恢复锚点/上限、楼层资格/失败消耗与塔奖，不能套主线每360秒 |
| <a id="trimatch-pvp"></a>121001—121004竞技 | 双方真实快照、三消局、段位/次数/战报/赛季 | 原匹配/计分、同步或异步对局、断线判负、段位奖与转期规则 |


## 系统任务与命令定位

本表按[全模块规则索引](../rules/module-rule-index.json)分配；任务ID用于追踪，命令type逐项保留。每条链接定位本册的具体规则节或表行，既包括已证规则，也包括明确列出的实现差异和原证据缺口。列出命令不表示该分支已通过APK验收。

| 任务ID | 系统 | 命令type | 具体规则节 |
| --- | --- | --- | --- |
| <a id="soc-guilddata"></a>[`SOC-GUILDDATA`](../rules/final-rule-register.md#soc-guilddata) | 公会数据查询 | `171` | [公会数据查询](#guild) |
| <a id="battle-fight"></a>[`BATTLE-FIGHT`](../rules/final-rule-register.md#battle-fight) | 通用战斗与报告分享 | `201`、`202`、`203`、`204`、`205`、`207`、`213` | [通用战斗与报告分享](#fight-instance) |
| <a id="battle-report"></a>[`BATTLE-REPORT`](../rules/final-rule-register.md#battle-report) | 通关记录与点赞 | `211`、`212` | [通关记录与点赞](#report-record) |
| <a id="battle-peaktower"></a>[`BATTLE-PEAKTOWER`](../rules/final-rule-register.md#battle-peaktower) | 巅峰塔/爬塔 | `1103`、`1104`、`1109`、`1110`、`1111`、`1112` | [巅峰塔/爬塔](#peak-tower) |
| <a id="battle-rank"></a>[`BATTLE-RANK`](../rules/final-rule-register.md#battle-rank) | 真实排行榜 | `2000`、`2001`、`2002`、`2003`、`2004`、`2005`、`2006`、`2007`、`2008`、`2009`、`2010`、`2011` | [真实排行榜](#rank) |
| <a id="battle-swaparena"></a>[`BATTLE-SWAPARENA`](../rules/final-rule-register.md#battle-swaparena) | 换位/多队竞技场 | `4031`、`4032`、`4033`、`4034`、`4035`、`4036`、`4037`、`4038`、`4039`、`4040` | [换位/多队竞技场](#swap-arena) |
| <a id="soc-msg"></a>[`SOC-MSG`](../rules/final-rule-register.md#soc-msg) | 频道加入、发言、历史、跨服消息与玩家信息 | `10501`、`10502`、`10503`、`10504`、`10505`、`10506`、`10507`、`10508`、`10509`、`10510`、`10511` | [频道加入、发言、历史、跨服消息与玩家信息](#message-transport) |
| <a id="soc-chat"></a>[`SOC-CHAT`](../rules/final-rule-register.md#soc-chat) | 世界、公会、私聊、跨服聊天与设置 | `11000`、`11001`、`11002`、`11003`、`11006`、`11008`、`11010`、`11012`、`11013`、`11014` | [世界、公会、私聊、跨服聊天与设置](#chat) |
| <a id="soc-friend"></a>[`SOC-FRIEND`](../rules/final-rule-register.md#soc-friend) | 好友、申请、黑名单、友情赠送与领取 | `20001`、`20002`、`20003`、`20004`、`20005`、`20006`、`20007`、`20008`、`20009`、`20010`、`20011`、`20012`、`20013` | [好友、申请、黑名单、友情赠送与领取](#friend) |
| <a id="soc-guild"></a>[`SOC-GUILD`](../rules/final-rule-register.md#soc-guild) | 公会创建、申请、推荐、捐献、日志与奖励 | `21001`、`21002`、`21003`、`21004`、`21005`、`21006`、`21007`、`21008`、`21010`、`21012`、`21013`、`21014`、`21015`、`21016`、`21017`、`21018`、`21019`、`21020`、`21021`、`21022`、`21023`、`21024`、`21025`、`21026`、`21028`、`21029`、`21030`、`21031` | [公会创建、申请、推荐、捐献、日志与奖励](#guild) |
| <a id="soc-guildactive"></a>[`SOC-GUILDACTIVE`](../rules/final-rule-register.md#soc-guildactive) | 公会活跃任务、积分与解散状态 | `21027`、`85501`、`85502`、`85503`、`85504`、`85505` | [公会活跃任务、积分与解散状态](#guild-active) |
| <a id="soc-support"></a>[`SOC-SUPPORT`](../rules/final-rule-register.md#soc-support) | 玩家助力与被助力记录 | `46001`、`46002` | [玩家助力与被助力记录](#support) |
| <a id="battle-redcliff"></a>[`BATTLE-REDCLIFF`](../rules/final-rule-register.md#battle-redcliff) | RedCliff 副本 | `55001`、`55002`、`55003`、`55004` | [RedCliff 副本](#red-cliff) |
| <a id="soc-realtimemap"></a>[`SOC-REALTIMEMAP`](../rules/final-rule-register.md#soc-realtimemap) | 实时地图进出、移动、复活与传送 | `75001`、`75002`、`75003`、`75004`、`75005` | [实时地图进出、移动、复活与传送](#realtime-map) |
| <a id="soc-comment"></a>[`SOC-COMMENT`](../rules/final-rule-register.md#soc-comment) | 英雄评论、点赞与评分 | `76601`、`76602`、`76603`、`76604`、`76605` | [英雄评论、点赞与评分](#comment) |
| <a id="soc-relationship"></a>[`SOC-RELATIONSHIP`](../rules/final-rule-register.md#soc-relationship) | 关系标记与通知 | `77501`、`77502`、`77503` | [关系标记与通知](#relationship) |
| <a id="soc-adventure"></a>[`SOC-ADVENTURE`](../rules/final-rule-register.md#soc-adventure) | 冒险玩家列表 | `77601` | [冒险玩家列表](#adventure-list) |
| <a id="battle-generaldungeon"></a>[`BATTLE-GENERALDUNGEON`](../rules/final-rule-register.md#battle-generaldungeon) | 通用地牢副本 | `78101`、`78102`、`78103`、`78104`、`78105`、`78106`、`78107` | [通用地牢副本](#general-dungeon) |
| <a id="soc-strategy"></a>[`SOC-STRATEGY`](../rules/final-rule-register.md#soc-strategy) | 英雄攻略排行 | `79201` | [英雄攻略排行](#strategy-rank) |
| <a id="soc-guildredenvelope"></a>[`SOC-GUILDREDENVELOPE`](../rules/final-rule-register.md#soc-guildredenvelope) | 公会红包 | `83101`、`83102`、`83103`、`83104`、`83105`、`83106`、`83107`、`83108` | [公会红包](#guild-envelope) |
| <a id="battle-arenacontest"></a>[`BATTLE-ARENACONTEST`](../rules/final-rule-register.md#battle-arenacontest) | 竞技大赛、竞猜与观战 | `83301`、`83302`、`83303`、`83304`、`83305`、`83306`、`83307`、`83308`、`83309`、`83310`、`83311`、`83312`、`83313`、`83314`、`83315` | [竞技大赛、竞猜与观战](#arena-contest) |
| <a id="soc-guildtrial"></a>[`SOC-GUILDTRIAL`](../rules/final-rule-register.md#soc-guildtrial) | 公会试炼、求助、助战与奖励 | `83401`、`83402`、`83403`、`83404`、`83405`、`83406`、`83407`、`83408`、`83409`、`83410`、`83411` | [公会试炼、求助、助战与奖励](#guild-trial) |
| <a id="battle-hunterarena"></a>[`BATTLE-HUNTERARENA`](../rules/final-rule-register.md#battle-hunterarena) | 猎人竞技场 | `84001`、`84002`、`84003`、`84004`、`84005`、`84006`、`84007`、`84008`、`84009`、`84010`、`84011` | [猎人竞技场](#hunter-arena) |
| <a id="battle-martialclub"></a>[`BATTLE-MARTIALCLUB`](../rules/final-rule-register.md#battle-martialclub) | 武馆组队挑战 | `84401`、`84404`、`84405`、`84406`、`84407`、`84408`、`84409`、`84410`、`84411`、`84412`、`84413`、`84414`、`84415`、`84416`、`84417`、`84418`、`84419`、`84420`、`84421`、`84422`、`84423`、`84424`、`84425`、`84426` | [武馆组队挑战](#martial-club) |
| <a id="battle-martialclubact"></a>[`BATTLE-MARTIALCLUBACT`](../rules/final-rule-register.md#battle-martialclubact) | 武馆活动奖励 | `84431`、`84432` | [武馆活动奖励](#martial-club-act) |
| <a id="soc-danmaku"></a>[`SOC-DANMAKU`](../rules/final-rule-register.md#soc-danmaku) | 弹幕点赞 | `84701` | [弹幕点赞](#danmaku) |
| <a id="battle-elitemission"></a>[`BATTLE-ELITEMISSION`](../rules/final-rule-register.md#battle-elitemission) | 精英任务的战斗闭环 | `87001`、`87002`、`87003` | [精英任务的战斗闭环](#elite-mission) |
| <a id="battle-soultrial"></a>[`BATTLE-SOULTRIAL`](../rules/final-rule-register.md#battle-soultrial) | 灵魂试炼抽奖 | `87104`、`87105` | [灵魂试炼抽奖](#soul-trial) |
| <a id="battle-tournament"></a>[`BATTLE-TOURNAMENT`](../rules/final-rule-register.md#battle-tournament) | 巅峰对决/锦标赛 | `88501`、`88502`、`88503`、`88504`、`88505`、`88506`、`88507`、`88508`、`88509`、`88510`、`88511` | [巅峰对决/锦标赛](#tournament) |
| <a id="battle-scarlettrial"></a>[`BATTLE-SCARLETTRIAL`](../rules/final-rule-register.md#battle-scarlettrial) | 猩红试炼 | `89101`、`89102` | [猩红试炼](#scarlet-trial) |
| <a id="soc-guildexplore"></a>[`SOC-GUILDEXPLORE`](../rules/final-rule-register.md#soc-guildexplore) | 公会探索、地图、BOSS、任务与图鉴 | `89301`、`89302`、`89303`、`89304`、`89305`、`89306`、`89307`、`89308`、`89309`、`89310`、`89311`、`89312`、`89313`、`89314`、`89315`、`89316`、`89317`、`89318`、`89319`、`89320`、`89321`、`89322`、`89323`、`89324`、`89326`、`89327`、`89328`、`893289` | [公会探索、地图、BOSS、任务与图鉴](#guild-explore) |
| <a id="soc-guildexploretrial"></a>[`SOC-GUILDEXPLORETRIAL`](../rules/final-rule-register.md#soc-guildexploretrial) | 公会探索试炼 | `89351`、`89352` | [公会探索试炼](#guild-explore-trial) |
| <a id="battle-starmission"></a>[`BATTLE-STARMISSION`](../rules/final-rule-register.md#battle-starmission) | 星级关卡、章节奖励与技能 | `89601`、`89602`、`89603`、`89604` | [星级关卡、章节奖励与技能](#star-mission) |
| <a id="soc-guildwar"></a>[`SOC-GUILDWAR`](../rules/final-rule-register.md#soc-guildwar) | 公会战、集结、竞猜与排行奖励 | `90001`、`90002`、`90005`、`90006`、`90007`、`90008`、`90009`、`90010`、`90011`、`90012`、`90013`、`90014`、`90015`、`90016` | [公会战、集结、竞猜与排行奖励](#guild-war) |
| <a id="battle-commonmap"></a>[`BATTLE-COMMONMAP`](../rules/final-rule-register.md#battle-commonmap) | 通用地图节点与扫荡 | `90601`、`90602`、`90603` | [通用地图节点与扫荡](#common-map) |
| <a id="soc-guildduel"></a>[`SOC-GUILDDUEL`](../rules/final-rule-register.md#soc-guildduel) | 公会对决、匹配与轮次奖励 | `90701`、`90702`、`90703`、`90704`、`90705`、`90706`、`90707` | [公会对决、匹配与轮次奖励](#guild-duel) |
| <a id="battle-famehall"></a>[`BATTLE-FAMEHALL`](../rules/final-rule-register.md#battle-famehall) | 名人堂挑战与掉落选择 | `91101`、`91102`、`91103`、`91104`、`91105`、`91106`、`91107`、`91108`、`91109`、`91110`、`91111` | [名人堂挑战与掉落选择](#fame-hall) |
| <a id="soc-guildracing"></a>[`SOC-GUILDRACING`](../rules/final-rule-register.md#soc-guildracing) | 公会竞速、支援、BUFF 投票与积分 | `91201`、`91202`、`91203`、`91204`、`91205`、`91206`、`91207`、`91208`、`91209` | [公会竞速、支援、BUFF 投票与积分](#guild-racing) |
| <a id="soc-guildboss"></a>[`SOC-GUILDBOSS`](../rules/final-rule-register.md#soc-guildboss) | 公会 BOSS、伤害奖励与技能物品 | `91301`、`91302`、`91303`、`91304`、`91305`、`91306`、`91307`、`91308`、`91309`、`91310`、`91311`、`91312` | [公会 BOSS、伤害奖励与技能物品](#guild-boss) |
| <a id="soc-guildjoint"></a>[`SOC-GUILDJOINT`](../rules/final-rule-register.md#soc-guildjoint) | 公会联合探索与资源争夺 | `91601`、`91602`、`91603`、`91604`、`91605`、`91606`、`91607`、`91608`、`91609`、`91610`、`91611`、`91612`、`91613`、`91614`、`91615`、`91616`、`91617`、`91618`、`91619`、`91620`、`91621`、`91622`、`91623`、`91624`、`91625` | [公会联合探索与资源争夺](#guild-joint) |
| <a id="battle-worldboss"></a>[`BATTLE-WORLDBOSS`](../rules/final-rule-register.md#battle-worldboss) | 世界 BOSS | `91801`、`91802`、`91803`、`91804`、`91805` | [世界 BOSS](#world-boss) |
| <a id="soc-guildrunestone"></a>[`SOC-GUILDRUNESTONE`](../rules/final-rule-register.md#soc-guildrunestone) | 公会符石穿脱与合成 | `92701`、`92702`、`92703` | [公会符石穿脱与合成](#guild-rune-stone) |
| <a id="battle-pitlord"></a>[`BATTLE-PITLORD`](../rules/final-rule-register.md#battle-pitlord) | PitLord 挑战、排名与补发 | `92801`、`92802`、`92803`、`92804` | [PitLord 挑战、排名与补发](#pit-lord) |
| <a id="battle-camptower"></a>[`BATTLE-CAMPTOWER`](../rules/final-rule-register.md#battle-camptower) | 阵营塔 | `93601`、`93602`、`93603` | [阵营塔](#camp-tower) |
| <a id="soc-guildgvg"></a>[`SOC-GUILDGVG`](../rules/final-rule-register.md#soc-guildgvg) | 公会 GVG 地图、矿点与据点争夺 | `97001`、`97002`、`97003`、`97004`、`97005`、`97006`、`97007`、`97008`、`97009`、`97010`、`97011`、`97012`、`97013`、`97014`、`97015`、`97016`、`97017`、`97018` | [公会 GVG 地图、矿点与据点争夺](#guild-gvg) |
| <a id="battle-towerdefense"></a>[`BATTLE-TOWERDEFENSE`](../rules/final-rule-register.md#battle-towerdefense) | 塔防驻守与轮次奖励 | `97601`、`97602`、`97603`、`97604`、`97605` | [塔防驻守与轮次奖励](#tower-defense) |
| <a id="battle-toparena"></a>[`BATTLE-TOPARENA`](../rules/final-rule-register.md#battle-toparena) | 巅峰竞技、半决赛/决赛与竞猜 | `98500`、`98505`、`98526`、`98527`、`98532`、`98560`、`98561`、`98562`、`98563`、`98564`、`98565`、`98580`、`98581`、`98582`、`98583`、`98590`、`98601`、`98602` | [巅峰竞技、半决赛/决赛与竞猜](#top-arena) |
| <a id="soc-guildvote"></a>[`SOC-GUILDVOTE`](../rules/final-rule-register.md#soc-guildvote) | 公会投票 | `98702`、`99701` | [公会投票](#guild-vote) |
| <a id="battle-playmatch"></a>[`BATTLE-PLAYMATCH`](../rules/final-rule-register.md#battle-playmatch) | 即时匹配与取消 | `98900`、`98901` | [即时匹配与取消](#matching) |
| <a id="soc-slgmap"></a>[`SOC-SLGMAP`](../rules/final-rule-register.md#soc-slgmap) | SLG 地图视野与进出 | `99100`、`99101`、`99102` | [SLG 地图视野与进出](#guild-gvg) |
| <a id="soc-guildnation"></a>[`SOC-GUILDNATION`](../rules/final-rule-register.md#soc-guildnation) | 公会国战、建造、兵种、科技、行军与据点 | `99200`、`99201`、`99202`、`99203`、`99204`、`99205`、`99206`、`99207`、`99208`、`99209`、`99210`、`99211`、`99212`、`99213`、`99214`、`99215`、`99216`、`99217`、`99218`、`99219`、`99220`、`99221`、`99222`、`99223`、`99224`、`99225`、`99226`、`99227`、`99228`、`99229`、`99230`、`99231`、`99232`、`99233`、`99234`、`99235`、`99236`、`99237`、`99238`、`99239`、`99240`、`99241`、`99242`、`99243`、`99244`、`99245`、`99246`、`99247`、`99248`、`99249`、`99250`、`99251`、`99252`、`99253`、`99254`、`99255`、`99256`、`99257`、`99258`、`99259`、`99260`、`99261`、`99262`、`99263`、`99264` | [公会国战、建造、兵种、科技、行军与据点](#guild-nation) |
| <a id="battle-overallpvp"></a>[`BATTLE-OVERALLPVP`](../rules/final-rule-register.md#battle-overallpvp) | 综合 PVP、淘汰赛与竞猜 | `101101`、`101102`、`101103`、`101104`、`101105`、`101106`、`101107`、`101108`、`101109`、`101110`、`101111`、`101112`、`101113`、`101114`、`101115`、`101116`、`101117`、`101118`、`101119`、`101120`、`101121`、`101122`、`101123`、`101124`、`101125`、`101126`、`101127`、`101128`、`101129`、`101130` | [综合 PVP、淘汰赛与竞猜](#overall-pvp) |
| <a id="soc-guildbargain"></a>[`SOC-GUILDBARGAIN`](../rules/final-rule-register.md#soc-guildbargain) | 公会砍价 | `101401`、`101402`、`101403`、`101404` | [公会砍价](#guild-bargain) |
| <a id="soc-guildexpedition"></a>[`SOC-GUILDEXPEDITION`](../rules/final-rule-register.md#soc-guildexpedition) | 公会远征、宣战、鼓舞、竞猜与地图排名 | `101601`、`101602`、`101603`、`101604`、`101605`、`101606`、`101607`、`101608`、`101609`、`101610`、`101611`、`101612`、`101613`、`101614`、`101615` | [公会远征、宣战、鼓舞、竞猜与地图排名](#guild-expedition) |
| <a id="soc-channelentry"></a>[`SOC-CHANNELENTRY`](../rules/final-rule-register.md#soc-channelentry) | 频道入口业务 | `102801` | [频道入口业务](#channel-entry) |
| <a id="soc-guildhunt"></a>[`SOC-GUILDHUNT`](../rules/final-rule-register.md#soc-guildhunt) | 公会狩猎参与与支援 | `103401`、`103402`、`103403` | [公会狩猎参与与支援](#guild-hunt) |
| <a id="battle-destinypve"></a>[`BATTLE-DESTINYPVE`](../rules/final-rule-register.md#battle-destinypve) | 命运 PVE 分层挑战 | `104701`、`104702` | [命运 PVE 分层挑战](#destiny-pve) |
| <a id="soc-guildcrusade"></a>[`SOC-GUILDCRUSADE`](../rules/final-rule-register.md#soc-guildcrusade) | 公会讨伐排名 | `105805` | [公会讨伐排名](#guild-hunt) |
| <a id="soc-guildauction"></a>[`SOC-GUILDAUCTION`](../rules/final-rule-register.md#soc-guildauction) | 公会拍卖、心愿与领取 | `107601`、`107602`、`107603` | [公会拍卖、心愿与领取](#guild-auction) |
| <a id="battle-battletrimatchhero"></a>[`BATTLE-BATTLETRIMATCHHERO`](../rules/final-rule-register.md#battle-battletrimatchhero) | 三消战斗英雄升级升星 | `112001`、`112002` | [三消战斗英雄升级升星](#trimatch-hero) |
| <a id="battle-battletrimatchequip"></a>[`BATTLE-BATTLETRIMATCHEQUIP`](../rules/final-rule-register.md#battle-battletrimatchequip) | 三消战斗装备养成与交换 | `113001`、`113002`、`113003` | [三消战斗装备养成与交换](#trimatch-equip) |
| <a id="battle-battletrimatchlineup"></a>[`BATTLE-BATTLETRIMATCHLINEUP`](../rules/final-rule-register.md#battle-battletrimatchlineup) | 三消战斗阵容管理 | `114001`、`114002`、`114003`、`114004`、`114005` | [三消战斗阵容管理](#trimatch-lineup) |
| <a id="battle-triplematchfight"></a>[`BATTLE-TRIPLEMATCHFIGHT`](../rules/final-rule-register.md#battle-triplematchfight) | 三消战斗开战、重试与战报 | `115001`、`115002`、`115003`、`115004`、`115005`、`115006` | [三消战斗开战、重试与战报](#trimatch-fight) |
| <a id="battle-trimatchtower"></a>[`BATTLE-TRIMATCHTOWER`](../rules/final-rule-register.md#battle-trimatchtower) | 三消爬塔、体力恢复与奖励 | `119001`、`119002`、`119003` | [三消爬塔、体力恢复与奖励](#trimatch-tower) |
| <a id="battle-overallmatch"></a>[`BATTLE-OVERALLMATCH`](../rules/final-rule-register.md#battle-overallmatch) | 综合匹配 | `120001` | [综合匹配](#matching) |
| <a id="battle-trimatchpvp"></a>[`BATTLE-TRIMATCHPVP`](../rules/final-rule-register.md#battle-trimatchpvp) | 三消 PVP、段位和战报 | `121001`、`121002`、`121003`、`121004` | [三消 PVP、段位和战报](#trimatch-pvp) |
