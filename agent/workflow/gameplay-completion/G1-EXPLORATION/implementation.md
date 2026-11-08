# G1 探索与家园前半（#151-#162）实施记录

2026-11-08。首轮分支 task/G1-EXPLORATION-20261108 完成 22/98 并合入 main（649a903）；续作分支 task/G1-REMAINING-20261108（worktree .worktree/gameplay-20261108/g1-remaining，起点 985720a）将真实处理器扩展到 93/98，剩余 5 条保持显式 err=5。

## 交付范围

98 条静态 C2S 命令全部注册到网关（12 个模块）。请求/响应 schema 直接来自 personal-server/assets/protobuf/*.proto.bin。只有能从客户端表、Lua 调用点和现有资源事务恢复的行为才返回真实状态；缺少规则的命令统一 GameError(5, 'Rule is not recovered: <card> <command>')，不返回固定空包或伪造成功。

新增/修改：

- personal-server/game/exploration-act-service.mjs：98 条命令注册表、SQLite 权威状态（exploration_act_state）、领取位（复用 reward_claims）、资源事务、登录同步。
- personal-server/config/exploration-act-tables.mjs：读取 12 张活动表，逐族声明需要的行族；缺表或行族缺失时直接失败。
- tools/extract-exploration-tables.mjs：从客户端 Lua bundle 按 LazyInit 的 <Name>_Count 常量发现并导出 12 张表（新增 WeekendBonusTable），产物写入 personal-server/assets/tables/。
- personal-server/game/gateway.mjs：G1 命令分发、module 92 登录同步与独立登录模块接线。
- personal-server/test/exploration-act-service.test.mjs、exploration-act-service-remaining.test.mjs：专项覆盖和真实 TCP 握手。

## 已实现（93/98 真实业务）

| 卡片 | 命令 | 规则 |
| --- | --- | --- |
| PLAY-HOMEPUZZLEACT | 11408-11420 共 9 条 | 求助/取消、每日上限（SocialConf）、赠送扣碎片与领取 gift_get_award、开包随机碎片、按稀有度分解（DecomposeAward）、任务奖（Task.award）、进度奖（ProgressAward.need_count）；状态按运行时活动 id 持久化。 |
| PLAY-HOMELANDACT | 11501-11505 共 4 条 | 选英雄、任务奖、装饰提交、清空房间；Version 表提供英雄、家具和幸福度，任务进度按 task_type 计算。 |
| PLAY-CARNIVAL | 43003-43024 共 15 条 | 骰子、事件、自动刷新、购买、最新数据、成就、建筑/升级/收获、科技、派遣、宝箱和额外建筑；路径、建筑等级、事件奖来自 CarnivalTable。 |
| PLAY-THEMETREASURE | 76501-76509/76512 共 10 条 | 寻宝步进、个人挑战、挑战轮次、任务/轮次/服务器任务奖、兑换、服务器步数与目标查询；任务奖按 ChallengeTask 的并行 award/count 行发放。76502/76505/76507/76508 响应改为客户端实际使用的 pb_res_to_client。 |
| PLAY-MINIGAME | 83701-83704 共 4 条 | MiniGameTable 校验、进入/处理回显 custom_bin、老虎机按 SlotMachine.weight 抽取并扣 retry_n；未取得结算规则的 settle 继续 fail closed。 |
| PLAY-TREASUREHUNT | 85601-85610 共 7 条 | 挖宝、买铲、合成/自动合成、删除、交换、刷新；本地确定性棋盘使用 MapMaxFloor/MapGridLevel/HighAward，收鱼记录和奖励走真实资源事务。 |
| PLAY-GRANDTOURER | 87801-87805 共 5 条 | 每日令牌按 Const.award_num_range 发放，任务奖、兑换、距离奖、加速均按 WeekendBonusTable/GrandTourerTable 发放。 |
| PLAY-DREAM | 88001-88004/88006/88008-88010 共 8 条 | 事件完成、每日奖、周/月奖、收集奖、单收集奖、NPC 阵容、事件刷新；每日奖按 DreamTableUtil.IsNewAward 选择 FixAward/FixAwardNew，并按服务器日限制一次；Event/EventAward/WeekAward/MonthAward/CollectAward/Group 行驱动。 |
| PLAY-MAGICALJOURNEY | 89901-89912/89914-89917 共 16 条 | 剑升级（含每日次数、每日经验上限与跨天重置）、主城/分城、剑记录、普通/赛季收集、星级/任务奖、关卡战斗、Boss、星技能、战力与 login_after；表来自 MagicalJourneyTable。 |
| PLAY-PETACTIVITY | 90501-90507 共 7 条 | 选宠、战斗奖励、好感奖励、治疗/完成治疗、每日活力、兑换；按 PetActivityTable 的 Challenge/Cure/CureFavor/Exchange 行驱动。 |
| PLAY-RADISHFARM | 90801-90806 共 6 条 | 播种、事件、成熟收获、拜访、每日助力上限、礼包自选；Activity.finish_sec/award/help_award/day_help_times 驱动。 |
| PLAY-EXPERIENCEACT | 93801-93802 共 2 条 | 出发计时、到期按 Level.need_time 领奖、一次性领取位。 |

## 登录同步

synchronizeLogin(activity, at) 在网关 minigameAct.synchronizeLogin 之后、modules.set(92, ...) 之前执行。运行时活动 id 先经 ActFrameTable/ActivityTable 的 version 映射到配置行族，状态仍按运行时 id 存储，避免不同期次共享进度。

module 92（module_login_data 为 wrapEtfBinary 包装的 protobuf）：

| 家族 | 识别 | payload |
| --- | --- | --- |
| HomePuzzle | ActFrame type 1080/1090 | pb_home_puzzle_act_data |
| Homeland | ActFrame type 1085/1086/1087 | pb_homeland_act_role_data |
| ThemeTreasure | ActivityTable.func=63 | pb_theme_treasure_hunt_login |
| RadishFarm | ActivityTable.func=84 | pb_radish_farm_role |
| ExperienceAct | ActivityTable.func=100 | pb_experience_act_data |

独立登录模块：136 TreasureHunt（pb_treasure_hunt_fun_open_ret）、145 WeekendBonus（ETF 列表：pb_weekend_bonus + Func 各 payload，当前 GrandTourer func_tid=2）、155 MagicalJourney（pb_magical_journey_login）、168 Carnival（pb_monopoly）、519 Dream（pb_dream_role）。PetActivity 继续由既有 petActivity.synchronizeLogin 处理，未重复写入。

## 仍为证据缺口（回包 err=5）

| 命令 | 缺口 |
| --- | --- |
| 76510 special_award | 服务端动态 specialAwards 没有表来源，不能构造特殊奖池。 |
| 76511 daily_award | ThemeTreasureTable.DayTask 为 0 行，日任务奖励和领取位无证据。 |
| 88005 finish_task | DreamTable.Task 为 0 行，任务定义和奖励为空。 |
| 88007 box_award | DreamTable.BoxAward 仅 1 行；随机盒/尝试位/消耗规则未恢复。 |
| 89913 node_rank_award | MissionNode/MissionNodeRank 可读，但缺少权威节点排名来源和请求领取语义，不能伪造名次奖励。 |

## 验证

- node --test test/exploration-act-service.test.mjs test/exploration-act-service-remaining.test.mjs：21/21 通过（注册表 98 条、93 条 implemented、运行时活动 id 映射、五类 module 92 登录、独立模块 136/145/155/168/519、梦境每日奖与跨日恢复、主题服务器任务奖、剑每日上限/跨天重置、萝卜农场/家园/小游戏/巡回者、临时 TCP 握手）。
- node --test test/gameplay-gateway.test.mjs：7/7 通过（无回归）。
- 全量 `npm test`：2703 项，pass 2701、fail 0、skipped 2，退出 0；日志 analysis/test-runs/gameplay-20261106/g1-remaining-full.log。
