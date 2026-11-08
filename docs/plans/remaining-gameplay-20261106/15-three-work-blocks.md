# 剩余任务卡：编号与工作块

2026-11-08 建表。276 张任务卡按“关联玩法放一起、单块任务量适中”切成 13 块，并在块顺序上连续编号 1–276。生成脚本 tools/plan-work-blocks.mjs；命令级子卡见 14-subtask-cards.md。

## 编号与分块规则

- 编号按本文件的工作块顺序连续编排（不是 task-index 行序）；任务卡 ID 才是唯一标识，卡号只作派发边界，不表示优先级。
- 同一玩法族放同一块（战斗按 PVE / PVP 拆开，社交按前半/后半拆开，探索按前半/后半拆开），块内不再跨领域。
- 每块 10–60 张卡、40–170 条缺失命令；单块的实施 agent 可自行再拆子卡。
- agent 只交付分支；全部合并由块 A1 的总控执行。13-special-skills 的 E1–E72 在 CORE-ATTR / CORE-SKILL-GATES 完成后进入抽取活动块 F。

## 工作块总览

| 块 | 卡号范围 | 内容 | 卡数 | 缺失命令 | 归属 |
| --- | --- | --- | ---: | ---: | --- |
| A1 | #1–#17 | 战斗 PVE、战报与共享 CORE 收尾 | 17 | 72 | 本 session（总控）+ 合并门禁 |
| A2 | #18–#33 | 战斗 PVP、竞技、锦标赛与三消 | 16 | 147 | 新 agent（子 agent 模式） |
| B | #34–#48 | 英雄养成、编队与关系 | 15 | 63 | 新 agent |
| C | #49–#64 | 装备、圣器、魔灵、精灵与后期养成 | 16 | 81 | 新 agent |
| D | #65–#86 | 物品、商店与日周任务 | 22 | 58 | 新 agent |
| E1 | #87–#106 | 社交前半：好友、邮件、消息与聊天 | 20 | 162 | 新 agent |
| E2 | #107–#119 | 社交后半：公会、跨服与协作 | 13 | 154 | 新 agent |
| F | #120–#150 | 招募、抽取、翻牌与转盘活动 | 31 | 74 | 新 agent |
| G1 | #151–#162 | 探索与家园前半 | 12 | 98 | 新 agent |
| G2 | #163–#179 | 探索与小游戏后半 | 17 | 96 | 新 agent |
| H | #180–#211 | 节日、签到、限时目标与协作活动 | 32 | 94 | 新 agent |
| I | #212–#264 | 礼包、通行证、基金、返利与拍卖 | 53 | 106 | 新 agent |
| J | #265–#276 | 团长、外观、剧情与辅助接口 | 12 | 47 | 新 agent |

合计 276 张卡 / 1252 条缺失命令。

## 并行槽位

- 平台同时最多 4 条 agent 线程（含总控）。总控 + 2 个实施 agent = 3 条，剩余 1 槽给子 agent 轮转；需要第 4 条时才允许短暂开子 agent，其余时间主线程推进。
- gateway.mjs 派发区同一时间只允许一条分支修改；冲突由总控合并队列处理。

## 块 A1：#1–#17（战斗 PVE、战报与共享 CORE 收尾）

- 归属：本 session（总控）+ 合并门禁；卡数 17，缺失命令 72。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 1 | BATTLE-FIGHT | 通用战斗与报告分享 | 1 | 服务端完成空回执（不发奖、不落库；APK 未验收） |
| 2 | BATTLE-REPORT | 通关记录与点赞 | 2 | 服务端完成（APK 未验收） |
| 3 | BATTLE-PEAKTOWER | 巅峰塔/爬塔 | 6 | 服务端完成（部分证据阻塞） |
| 4 | BATTLE-RANK | 真实排行榜 | 11 | 服务端完成（部分榜单事件/赛季结算阻塞） |
| 5 | BATTLE-REDCLIFF | RedCliff 副本 | 4 | 服务端完成（部分轮次规则待证） |
| 6 | BATTLE-GENERALDUNGEON | 通用地牢副本 | 7 | 服务端完成（事件规则部分证据阻塞） |
| 7 | BATTLE-ELITEMISSION | 精英任务的战斗闭环 | 0 | 服务端完成（敌方阵容映射与难度证据待补） |
| 8 | BATTLE-SOULTRIAL | 灵魂试炼抽奖 | 2 | 服务端完成（付费语义待证） |
| 9 | BATTLE-SCARLETTRIAL | 猩红试炼 | 2 | 服务端完成（活动窗口待证） |
| 10 | BATTLE-STARMISSION | 星级关卡、章节奖励与技能 | 4 | 部分交付（真实 34 版表已接；89601 与星级生产写入待补） |
| 11 | BATTLE-COMMONMAP | 通用地图节点与扫荡 | 3 | fail closed（真实表无地图实例/坐标） |
| 12 | BATTLE-FAMEHALL | 名人堂挑战与掉落选择 | 11 | 服务端完成（候选/阵容证据待补） |
| 13 | BATTLE-WORLDBOSS | 世界 BOSS | 5 | 服务端完成（BOSS 调度待证） |
| 14 | BATTLE-PITLORD | PitLord 挑战、排名与补发 | 4 | 服务端完成（RankTable 绑定待证） |
| 15 | BATTLE-CAMPTOWER | 阵营塔 | 3 | 服务端完成（开放日待证） |
| 16 | BATTLE-TOWERDEFENSE | 塔防驻守与轮次奖励 | 5 | 服务端完成（承伤结算待证） |
| 17 | BATTLE-DESTINYPVE | 命运 PVE 分层挑战 | 2 | 部分交付（104701 fail closed） |

## 块 A2：#18–#33（战斗 PVP、竞技、锦标赛与三消）

- 归属：新 agent（子 agent 模式）；卡数 16，缺失命令 147。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 18 | BATTLE-SWAPARENA | 换位/多队竞技场 | 10 | 待领取 |
| 19 | BATTLE-ARENACONTEST | 竞技大赛、竞猜与观战 | 15 | 待领取 |
| 20 | BATTLE-HUNTERARENA | 猎人竞技场 | 11 | 待领取 |
| 21 | BATTLE-MARTIALCLUB | 武馆组队挑战 | 24 | 待领取 |
| 22 | BATTLE-MARTIALCLUBACT | 武馆活动奖励 | 2 | 待领取 |
| 23 | BATTLE-TOURNAMENT | 巅峰对决/锦标赛 | 11 | 待领取 |
| 24 | BATTLE-TOPARENA | 巅峰竞技、半决赛/决赛与竞猜 | 18 | 待领取 |
| 25 | BATTLE-PLAYMATCH | 即时匹配与取消 | 2 | 待领取 |
| 26 | BATTLE-OVERALLPVP | 综合 PVP、淘汰赛与竞猜 | 30 | 待领取 |
| 27 | BATTLE-BATTLETRIMATCHHERO | 三消战斗英雄升级升星 | 2 | 待领取 |
| 28 | BATTLE-BATTLETRIMATCHEQUIP | 三消战斗装备养成与交换 | 3 | 待领取 |
| 29 | BATTLE-BATTLETRIMATCHLINEUP | 三消战斗阵容管理 | 5 | 待领取 |
| 30 | BATTLE-TRIPLEMATCHFIGHT | 三消战斗开战、重试与战报 | 6 | 待领取 |
| 31 | BATTLE-TRIMATCHTOWER | 三消爬塔、体力恢复与奖励 | 3 | 待领取 |
| 32 | BATTLE-OVERALLMATCH | 综合匹配 | 1 | 待领取 |
| 33 | BATTLE-TRIMATCHPVP | 三消 PVP、段位和战报 | 4 | 待领取 |

## 块 B：#34–#48（英雄养成、编队与关系）

- 归属：新 agent；卡数 15，缺失命令 63。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 34 | HERO-LINEUP | 预设阵容索引、增删、改名与保存 | 5 | 服务端完成 |
| 35 | HERO-HERO | 英雄进阶、试炼、重铸、碎片、访问与支援 | 23 | 服务端完成（18 条剩余命令已补齐；多项规则证据待补） |
| 36 | HERO-MASTERY | 精通升级与突破 | 2 | 服务端完成（技能已由 CORE-SKILL-GATES 接线；属性与完整规则待补） |
| 37 | HERO-FAVOURINTIMACY | 亲密度、约会与剧情 | 3 | 待领取 |
| 38 | HERO-INTELLI | Intelli 解锁与批量处理 | 2 | 待领取 |
| 39 | HERO-COMBATPOWER | 战力奖励与预设战力更新 | 2 | 待领取 |
| 40 | HERO-TACTICS | 战术升级与重置 | 2 | 待领取 |
| 41 | HERO-HEROLEASE | 英雄租借 | 5 | 待领取 |
| 42 | HERO-LINEUPSNAPSHOT | 阵容/英雄快照 | 2 | 待领取 |
| 43 | HERO-TEAMSUGGEST | 推荐阵容激活与选择 | 2 | 待领取 |
| 44 | HERO-HEROBLAZON | 英雄纹章、天赋、技能与羁绊 | 5 | 待领取 |
| 45 | HERO-NEWHEROEXCLUSIVE | 新英雄专属选择、剧情与阵容奖励 | 3 | 待领取 |
| 46 | HERO-HEROLEGEND | 英雄传奇书升星、祝福、升级与升阶 | 4 | 待领取 |
| 47 | HERO-LEASERSTARUP | 租借/Leaser 升星与重置 | 2 | 待领取 |
| 48 | HERO-CAMPHALO | 阵营光环升级 | 1 | 待领取 |

## 块 C：#49–#64（装备、圣器、魔灵、精灵与后期养成）

- 归属：新 agent；卡数 16，缺失命令 81。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 49 | EQUIP-EQUIP | 普通装备觉醒、材料交换与批量精炼 | 3 | 待领取 |
| 50 | EQUIP-ARTIFACT | 圣器合成、强化、品质、升级、突破等 | 11 | 服务端完成（4 条证据待补 fail closed，1 条部分交付） |
| 51 | EQUIP-WARRUNE | 战纹激活、升阶、洗属性、重铸与养成 | 7 | 待领取 |
| 52 | EQUIP-MUSEUM | 博物馆藏品激活与人气奖励 | 2 | 待领取 |
| 53 | EQUIP-FANTASYHANDBOOK | 幻武图鉴升星 | 1 | 待领取 |
| 54 | EQUIP-RELIC | Relic 装具穿戴、重铸、分解、重置、升阶等 | 11 | 服务端完成（保底/概率与登录 depot 槽位证据待补） |
| 55 | EQUIP-MAGICCIRCLE | 法阵尚缺的批量升级与属性接入 | 0 | 待领取 |
| 56 | EQUIP-PET | 魔灵合成、上阵、升级、升星、装备、符文与变异 | 17 | 待领取 |
| 57 | EQUIP-PETPLAY | 魔灵探索与周期奖励 | 2 | 待领取 |
| 58 | EQUIP-ENERGYBURST | 能量爆发奖励 | 1 | 待领取 |
| 59 | EQUIP-TREASURE | 秘宝升星、抽奖、套装、属性、自选与宝箱 | 6 | 待领取 |
| 60 | EQUIP-ELVES | 精灵升星、天赋、图鉴、助战、皮肤与变异 | 7 | 待领取 |
| 61 | EQUIP-ELVESBEAD | 精灵珠升级、升星、穿脱与分解 | 5 | 待领取 |
| 62 | EQUIP-LEADEREQUIP | 团长装备升级、升星、分解、增幅与重铸 | 6 | 待领取 |
| 63 | EQUIP-DIVINEEMBRYO | 神胚选择 | 1 | 待领取 |
| 64 | EQUIP-BADGE | 徽章激活 | 1 | 待领取 |

## 块 D：#65–#86（物品、商店与日周任务）

- 归属：新 agent；卡数 22，缺失命令 58。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 65 | ITEM-ITEM | 重复箱、手动兑换、碎片合成与抽奖箱分支 | 4 | 服务端完成（153/157 证据阻塞） |
| 66 | ITEM-RESCOMPLETE | 资源补全领奖 | 1 | 证据阻塞（下载完成状态无服务端来源） |
| 67 | ITEM-MISSION | 主线体力、补给、章节一键与 BOSS 奖励 | 6 | 服务端完成（509 common_task、512 boss 证据阻塞） |
| 68 | ITEM-SHOP | 普通商店、快速购买、刷新、结算与历史商品 | 6 | 服务端完成 |
| 69 | ITEM-GUIDE | 引导领奖与网络检查 | 2 | 服务端完成（奖励配置证据阻塞） |
| 70 | ITEM-EVERYTASK | 每日、每周、主线任务及一键领奖 | 7 | 服务端完成（部分进度/奖励证据阻塞） |
| 71 | ITEM-COMMONTASK | 通用任务与线性任务剩余进度函数 | 1 | 服务端完成（奖励/爬塔进度证据阻塞） |
| 72 | ITEM-RANKACHIEVE | 排名成就奖励 | 1 | 服务端完成（多数成就事件源证据阻塞） |
| 73 | ITEM-FIRSTWEEKGOAL | 首周目标与任务奖励 | 2 | 服务端完成（部分进度事件证据阻塞） |
| 74 | ITEM-GROWTHROAD | 成长之路 | 2 | 服务端完成（1111–1113 任务进度证据阻塞） |
| 75 | ITEM-GROWTHTARGET | 成长目标阶段与任务 | 2 | 证据阻塞（Task/Phase 表无法抽取） |
| 76 | ITEM-TASKAWARD | 任务活动进度与任务奖 | 2 | 证据阻塞（本版本无活动入口/登录容器） |
| 77 | ITEM-OPENSERVERBOX | 开服宝箱与进度 | 2 | 证据阻塞（表内无奖励配置） |
| 78 | ITEM-HOOK | 挂机收益、快速收取与产物 | 5 | 证据阻塞（阶段来自各玩法数据） |
| 79 | ITEM-FUNCTIONMANUAL | 功能手册奖励 | 1 | 服务端完成（手册 28 行中统计/主线章节源可领，其余 code 5） |
| 80 | ITEM-TASKGROUP | 任务组任务与阶段领奖 | 2 | 证据阻塞（GroupFunc 0 行，功能绑定缺失） |
| 81 | ITEM-CAREERLIFE | 生涯剧情奖励 | 1 | 证据阻塞（StoryChapter 无奖励列） |
| 82 | ITEM-RESROLLBACK | 资源回退预览与执行 | 2 | 证据阻塞（无养成投入账本） |
| 83 | ITEM-MYSTERYSHOP | 神秘商店自动刷新、手动刷新与购买 | 3 | 证据阻塞（商品池/价格档无法恢复） |
| 84 | ITEM-LINEARLEVEL | 线性等级宝箱 | 1 | 证据阻塞（无线性关卡进度来源） |
| 85 | ITEM-PERIODTASK | 周期任务、阶段与积分奖励 | 3 | 本版本不可达（Task/Version/Score/Stage 均 0 行） |
| 86 | ITEM-TASKACTIVITY | 任务活动提交与数据 | 2 | 服务端部分完成（1/2：105701 已实现，105702 缺服务器活跃度） |

D 块交付（2026-11-08）：82301 功能手册与 105701 通用任务活动有真实任务进度、领取位、发奖、登录同步与 SQLite 持久化；其余 25 条命令逐卡阻塞原因见 [BLOCK-D 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-D/implementation.md)。

## 块 E1：#87–#106（社交前半：好友、邮件、消息与聊天）

- 归属：新 agent；卡数 20，缺失命令 162。状态：2026-11-08 由 BLOCK-E1 服务端完成，见 [BLOCK-E1 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-E1/implementation.md)。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 87 | SOC-GUILDDATA | 公会数据查询 | 1 | 服务端完成（171 fail closed：GuildDataTable block 映射待补） |
| 88 | SOC-MSG | 频道加入、发言、历史、跨服消息与玩家信息 | 11 | 服务端完成（10508 登录槽与部分二进制载荷待补） |
| 89 | SOC-CHAT | 世界、公会、私聊、跨服聊天与设置 | 10 | 服务端完成（公会/跨服/封禁/点赞 fail closed） |
| 90 | SOC-FRIEND | 好友、申请、黑名单、友情赠送与领取 | 13 | 服务端完成（20012/20013 语义与友情点结算证据待补） |
| 91 | SOC-GUILD | 公会创建、申请、推荐、捐献、日志与奖励 | 24 | 服务端完成（21/24；21017/21020/21027 fail closed） |
| 92 | SOC-GUILDACTIVE | 公会活跃任务、积分与解散状态 | 6 | 服务端完成（85501/85503 fail closed；接口目录实际 5 条） |
| 93 | SOC-SUPPORT | 玩家助力与被助力记录 | 2 | 服务端完成（46002 回包形状待补） |
| 94 | SOC-REALTIMEMAP | 实时地图进出、移动、复活与传送 | 5 | 服务端完成 |
| 95 | SOC-COMMENT | 英雄评论、点赞与评分 | 5 | 服务端完成 |
| 96 | SOC-RELATIONSHIP | 关系标记与通知 | 3 | 服务端完成 |
| 97 | SOC-ADVENTURE | 冒险玩家列表 | 1 | 服务端完成（ETF 元素形状待补） |
| 98 | SOC-STRATEGY | 英雄攻略排行 | 1 | 服务端完成（ETF 元素形状待补） |
| 99 | SOC-GUILDREDENVELOPE | 公会红包 | 8 | 服务端完成（83101/83102/83104/83105 fail closed） |
| 100 | SOC-GUILDTRIAL | 公会试炼、求助、助战与奖励 | 11 | 服务端完成（83405/83406/83409 fail closed） |
| 101 | SOC-DANMAKU | 弹幕点赞 | 1 | 服务端完成 |
| 102 | SOC-GUILDEXPLORE | 公会探索、地图、BOSS、任务与图鉴 | 28 | 服务端完成（8 条读；20 条 fail closed） |
| 103 | SOC-GUILDEXPLORETRIAL | 公会探索试炼 | 2 | 服务端完成（89351 fail closed） |
| 104 | SOC-GUILDWAR | 公会战、集结、竞猜与排行奖励 | 14 | 服务端完成（9/14；5 条 fail closed） |
| 105 | SOC-GUILDDUEL | 公会对决、匹配与轮次奖励 | 7 | 服务端完成（4/7；3 条 fail closed） |
| 106 | SOC-GUILDRACING | 公会竞速、支援、BUFF 投票与积分 | 9 | 服务端完成（5/9；4 条 fail closed） |

## 块 E2：#107–#119（社交后半：公会、跨服与协作）

- 归属：新 agent；卡数 13，缺失命令 154。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 107 | SOC-GUILDBOSS | 公会 BOSS、伤害奖励与技能物品 | 12 | 服务端完成（证据缺口） |
| 108 | SOC-GUILDJOINT | 公会联合探索与资源争夺 | 25 | 服务端完成（证据缺口） |
| 109 | SOC-GUILDRUNESTONE | 公会符石穿脱与合成 | 3 | 服务端完成（证据缺口） |
| 110 | SOC-GUILDGVG | 公会 GVG 地图、矿点与据点争夺 | 18 | 服务端完成（证据缺口） |
| 111 | SOC-GUILDVOTE | 公会投票 | 2 | 服务端完成（证据缺口） |
| 112 | SOC-SLGMAP | SLG 地图视野与进出 | 3 | 服务端完成（证据缺口） |
| 113 | SOC-GUILDNATION | 公会国战、建造、兵种、科技、行军与据点 | 64 | 服务端完成（证据缺口） |
| 114 | SOC-GUILDBARGAIN | 公会砍价 | 4 | 服务端完成（证据缺口） |
| 115 | SOC-GUILDEXPEDITION | 公会远征、宣战、鼓舞、竞猜与地图排名 | 15 | 服务端完成（证据缺口） |
| 116 | SOC-CHANNELENTRY | 频道入口业务 | 1 | 服务端完成（证据缺口） |
| 117 | SOC-GUILDHUNT | 公会狩猎参与与支援 | 3 | 服务端完成（证据缺口） |
| 118 | SOC-GUILDCRUSADE | 公会讨伐排名 | 1 | 响应 schema 缺失，明确拒绝 |
| 119 | SOC-GUILDAUCTION | 公会拍卖、心愿与领取 | 3 | 服务端完成（证据缺口） |

E2 覆盖 154/154 个缺失命令：153 条进入实际业务服务，`105805` 因 `pb_guild_crusade_rank_rsp` 定义缺失以错误码 5 明确拒绝。现有 `99229` 继续由国战助力服务持有。专项服务、真实临时 TCP、SQLite 重开与 154 条路由唯一性测试通过，并已以 `--no-ff` 合入 main `85c39dd`；不包含跨成员/跨服补证或 APK 验收，详见[交付记录](../../../agent/workflow/gameplay-completion/E2-SOCIAL-COOP/implementation.md)。

## 块 F：#120–#150（招募、抽取、翻牌与转盘活动）

- 归属：新 agent；卡数 31，缺失命令 74。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 120 | DRAW-MAGICDRAW | 魔法招募选人、成就与升星奖励 | 3 | 服务端部分完成（60004 与抽数源证据阻塞） |
| 121 | DRAW-PINBALL | 弹珠活动成就 | 1 | 明确拒绝（缺权威局状态/进度） |
| 122 | DRAW-FANTASYEQUIPACT | 幻武活动管道小游戏、任务与试炼闭环 | 2 | 明确拒绝（缺棋盘/结算规则） |
| 123 | DRAW-PYRAMID | 金字塔抽取与任务 | 2 | 服务端部分完成（88942 进度源阻塞） |
| 124 | DRAW-THREEADMONITION | 三诫抽取、宝箱、次数与入场 | 4 | 服务端完成（回包字段待 APK 对照） |
| 125 | DRAW-HUNDREDBONUS | 百倍奖励随机、领取与日志 | 3 | 服务端部分完成（额度/日重置证据待补） |
| 126 | DRAW-WISHTREE | 许愿树宝藏及已有抽取链路 | 1 | 既有路径明确拒绝（奖池/结算证据阻塞） |
| 127 | DRAW-CHESS | 棋盘抽取、任务、自选、轮次与兑换 | 6 | 服务端部分完成（91901/91904/91906；三张空表拒绝） |
| 128 | DRAW-RAFFLETICKET | 奖券成就 | 1 | 服务端部分完成（依赖未接入的抽数生产源） |
| 129 | DRAW-HEROBLAZONDRAW | 英雄纹章抽取 | 1 | 明确拒绝（3201–3204 奖池为空） |
| 130 | DRAW-LOTTERYACT | 抽奖活动与奖品日志 | 2 | 服务端部分完成（BigLib/幸运值证据待补） |
| 131 | DRAW-MYSTERYWISH | 神秘心愿兑换 | 1 | 服务端部分完成（Item.type 语义待补） |
| 132 | DRAW-LOTTERY | 彩票抽取与过期处理 | 2 | 明确拒绝（3901 奖池与期次结算缺失） |
| 133 | DRAW-FLIPCARD | 翻牌与轮次 | 2 | 服务端部分完成（97301 因棋盘奖池缺失拒绝） |
| 134 | DRAW-TICKETDRAW | 票券抽奖领奖与历史 | 2 | 明确拒绝（缺全服排名结算） |
| 135 | DRAW-FRUITDRAWACT | 水果抽奖 | 2 | 服务端部分完成（97902 概率表缺失） |
| 136 | DRAW-DRAW | 通用抽取心愿选择 | 1 | 服务端部分完成（尚未接招募心愿状态） |
| 137 | DRAW-DEMIGODACT | 神灵降世真实奖池与试炼闭环 | 0 | 本块无缺失命令差量，保留既有状态 |
| 138 | DRAW-ELVESACT | 精灵活动主精灵、果实抽取与奖励 | 3 | 服务端部分完成（抽数生产与回包证据待补） |
| 139 | DRAW-ARTIFACTDRAWACT | 圣器天池试炼统计接入 | 0 | 本块无缺失命令差量，保留既有状态 |
| 140 | DRAW-BONUSDRAW | 奖励抽取、切换与选池 | 3 | 服务端完成（概率与折算语义证据待补） |
| 141 | DRAW-CAPSULETOY | 扭蛋、兑换、收集与进度 | 4 | 服务端完成（回包/进度来源证据待补） |
| 142 | DRAW-CHESSREVERT | 棋盘翻转轮次、自选礼物与换轮 | 3 | 服务端部分完成（102401 进度映射缺失拒绝） |
| 143 | DRAW-CHILDPUZZLEACT | 拼图抽取、自选、任务与换轮 | 5 | 服务端部分完成（103302 与任务事件源阻塞） |
| 144 | DRAW-HOARDWHEELACT | 囤积转盘奖池、任务与累计 | 3 | 服务端部分完成（任务/累计生产源未接） |
| 145 | DRAW-THOUSANDDRAW | 千抽与奖励领取 | 2 | 服务端完成（层/随机次数字段待 APK 对照） |
| 146 | DRAW-PRAYACT | 祈愿自选与抽取 | 2 | 服务端部分完成（多奖池/概率规则待补） |
| 147 | DRAW-CASHBACKDRAW | 返利抽奖、次数、全服奖励与进度 | 4 | 明确拒绝（缺权威充值/全服状态） |
| 148 | DRAW-TURNTABLEACT | 转盘活动 | 1 | 服务端完成（APK 未验收） |
| 149 | DRAW-FLOPCARDACT | 翻牌、单次与累计奖励 | 3 | 服务端完成（APK 未验收） |
| 150 | DRAW-HUNDREDDRAWACT | 百抽、进度奖、自选、升星奖与跑马灯 | 5 | 服务端完成（保底选择与非英雄星级奖证据待补） |

F 块续做（2026-11-08）：74 条原缺失命令现均有明确路径，其中本 worktree 的统一服务新增覆盖 65 条（44 条表驱动成功路径、21 条无条件 fail closed），其余 9 条由既有百抽、奖励抽取和许愿树服务承担。路径覆盖不等于玩法完成；交付提交 `aa3f35b` 已合入 main `0cefbbd`，收尾前含后续 A2/E2 合并的 main `d99dae4` 全量回归为 2706 项、fail 0、skip 2。全部证据缺口、运行规则与未验收边界见 [BLOCK-F 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-F/implementation.md)。

## 块 G1：#151–#162（探索与家园前半）

- 归属：新 agent；卡数 12，缺失命令 98。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 151 | PLAY-HOMEPUZZLEACT | 家园拼图、赠送求助、分解与进度 | 9 | 待领取 |
| 152 | PLAY-HOMELANDACT | 家园活动选人、任务、装修与清理 | 4 | 待领取 |
| 153 | PLAY-CARNIVAL | 嘉年华大富翁、骰子、事件、建筑与科技 | 15 | 待领取 |
| 154 | PLAY-THEMETREASURE | 主题寻宝、挑战、兑换与全服奖励 | 12 | 待领取 |
| 155 | PLAY-MINIGAME | 通用小游戏、结算与老虎机重试 | 4 | 待领取 |
| 156 | PLAY-TREASUREHUNT | 寻宝、铲子购买、合成、删除与刷新 | 7 | 待领取 |
| 157 | PLAY-GRANDTOURER | 旅行令牌、任务、兑换、里程与强化 | 5 | 待领取 |
| 158 | PLAY-DREAM | 梦境事件、日周奖、收集、宝箱与 NPC 阵容 | 10 | 待领取 |
| 159 | PLAY-MAGICALJOURNEY | 魔法旅程、国家养成、收藏、关卡与 BOSS | 17 | 待领取 |
| 160 | PLAY-PETACTIVITY | 超凡魔灵现世选择、挑战、好感、治疗与兑换 | 7 | 待领取 |
| 161 | PLAY-RADISHFARM | 萝卜农场、事件、拜访与助力 | 6 | 待领取 |
| 162 | PLAY-EXPERIENCEACT | 历练出发与领奖 | 2 | 待领取 |

## 块 G2：#163–#179（探索与小游戏后半）

- 归属：新 agent；卡数 17，缺失命令 96。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 163 | PLAY-PUZZLEACT | 拼图活动任务与进度 | 2 | 待领取 |
| 164 | PLAY-TILESWAP | 换块小游戏换轮 | 1 | 待领取 |
| 165 | PLAY-MUSHROOMMONSTER | 蘑菇怪开始、结束与领奖 | 3 | 待领取 |
| 166 | PLAY-GOPHERACT | 打地鼠 | 1 | 待领取 |
| 167 | PLAY-TOWERACT | 爬塔活动前进、切换与任务 | 3 | 待领取 |
| 168 | PLAY-SPIRITCOURTYARD | 灵庭种植、土地、合成、委托协作与宴会 | 16 | 待领取 |
| 169 | PLAY-TRIPLEMATCH | 三消换块、重开、道具与关卡奖励 | 5 | 待领取 |
| 170 | PLAY-MATCHINGGAMEACT | 配对小游戏抽签、卡牌与奖励 | 3 | 待领取 |
| 171 | PLAY-MONOPOLYACT | 大富翁事件、战斗、援助、公会任务与补给 | 11 | 待领取 |
| 172 | PLAY-DREAMTRIALACT | 梦境试炼抢夺与公会数据 | 2 | 待领取 |
| 173 | PLAY-DIAMONDVEINACT | 钻石矿脉地图、行动、战斗与公会排名 | 9 | 待领取 |
| 174 | PLAY-SOURCEPOINT | 源点变换、合成与任务 | 3 | 待领取 |
| 175 | PLAY-FISHINGACT | 钓鱼剩余鱼竿、图鉴、奖励、记录与排名 | 7 | 服务端完成（记录筛选与活动结束结算证据待补） |
| 176 | PLAY-ALBUM | 家具、套装激活与套装奖励 | 3 | 待领取 |
| 177 | PLAY-HOMELAND | 家园任务、拜访、点赞、升级、清洁与替换 | 8 | 待领取 |
| 178 | PLAY-BAKINGACT | 烘焙合成、订单、蛋糕、事件、道具与整理 | 15 | 待领取 |
| 179 | PLAY-HELPUPACT | 助力升阶/升超凡活动 | 4 | 服务端完成（全服聚合与部分周期语义证据待补） |

## 块 H：#180–#211（节日、签到、限时目标与协作活动）

- 归属：新 agent；卡数 32，缺失命令 94。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 180 | ACT-SIGNACT | 活动签到 | 1 | 待领取 |
| 181 | ACT-OPENSERVERSPRINT | 开服冲刺任务、全服进度与排名奖励 | 3 | 待领取 |
| 182 | ACT-LOGINREWARDACT | 登录奖励活动 | 1 | 待领取 |
| 183 | ACT-CHRISTMASACT | 圣诞装扮、奖励、心愿与商店 | 4 | 待领取 |
| 184 | ACT-STOCKUPACT | 囤货阶段与周期奖 | 2 | 待领取 |
| 185 | ACT-COMACTDRAWAWARD | 通用活动领奖 | 1 | 待领取 |
| 186 | ACT-SPRINGFESTIVALACT | 春节装扮与商店奖 | 3 | 待领取 |
| 187 | ACT-FESTIVALSIGNACT | 节日签到 | 1 | 待领取 |
| 188 | ACT-COLLECTEXCHANGEACT | 收集兑换 | 1 | 待领取 |
| 189 | ACT-FESTIVALMONSTERACT | 节日怪物操作 | 1 | 待领取 |
| 190 | ACT-VALENTINEDAYACT | 情人节领奖与聊天进度 | 2 | 待领取 |
| 191 | ACT-PREHEATACT | 预热活动与奖励 | 2 | 待领取 |
| 192 | ACT-COMMONSIGN | 通用签到领奖 | 1 | 待领取 |
| 193 | ACT-VOTEACT | 盲投、普通投票、竞猜与全服进度 | 7 | 待领取 |
| 194 | ACT-QUESTIONACT | 答题与累计奖励 | 3 | 待领取 |
| 195 | ACT-SUMMERACT | 夏日主活动、水枪/水炮养成、阶段任务与结算 | 15 | 待领取 |
| 196 | ACT-SUMMERPVE | 夏日 PVE 任务、次数、阶段与掉落 | 4 | 待领取 |
| 197 | ACT-SUMMERMISSION | 夏日关卡战斗结算与进度 | 2 | 待领取 |
| 198 | ACT-SUMMERPVP | 夏日 PVP、多队、竞猜、对手与挑战次数 | 13 | 待领取 |
| 199 | ACT-QIXIACT | 七夕折扣选择与日签 | 2 | 待领取 |
| 200 | ACT-ANNIVERSARYGAMEACT | 周年小游戏领奖 | 1 | 待领取 |
| 201 | ACT-FIVEDAYBOSSACT | 五日 BOSS 任务、限时通关与排名 | 3 | 待领取 |
| 202 | ACT-ONESREWARD | 单次专项奖励 | 1 | 待领取 |
| 203 | ACT-INVITEACT | 邀请绑定与任务 | 2 | 待领取 |
| 204 | ACT-INVITEOLDACT | 老玩家邀请与任务 | 2 | 待领取 |
| 205 | ACT-ROLEBACK | 回归绑定、继承卡、账号查询与每日资源 | 5 | 待领取 |
| 206 | ACT-CHOICESTORY | 分支剧情奖励 | 1 | 待领取 |
| 207 | ACT-FIRECRACKERACT | 爆竹使用、公会进度、任务与累充奖 | 5 | 待领取 |
| 208 | ACT-HEROSIGNACT | 英雄签到 | 1 | 待领取 |
| 209 | ACT-ENJOYBLESSINGACT | 祈福摇签 | 1 | 待领取 |
| 210 | ACT-QUESTIONNAIRE | 问卷提交 | 1 | 待领取 |
| 211 | ACT-ANNIVERSARYBANQUETACT | 周年宴会任务与进度 | 2 | 待领取 |

## 块 I：#212–#264（礼包、通行证、基金、返利与拍卖）

- 归属：新 agent；卡数 53，缺失命令 106。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 212 | PAY-RECHARGE | 龙晶等额外充值入口 | 1 | 待领取 |
| 213 | PAY-TRIGGERGIFT | 触发礼包激活与次数 | 2 | 待领取 |
| 214 | PAY-UPSTARGIFT | 升星礼包奖励与版本 | 2 | 待领取 |
| 215 | PAY-VIP | VIP 礼包、特权奖励与经验兑换 | 3 | 待领取 |
| 216 | PAY-PERMIT | 普通通行证买级、福利、结算、自选与选期 | 8 | 待领取 |
| 217 | PAY-ONLINEGIFT | 在线礼包 | 1 | 服务端完成（PeriodMax 精确语义待补） |
| 218 | PAY-FUNDACT | 活动基金领奖 | 1 | 待领取 |
| 219 | PAY-NOTIFYGIFT | 通知礼包激活 | 1 | 待领取 |
| 220 | PAY-REDENVELOPE | 普通红包领奖与详情 | 3 | 待领取 |
| 221 | PAY-VIPGIFT | VIP 专属礼包领奖 | 1 | 待领取 |
| 222 | PAY-FASHION | 时装激活、穿戴与升级 | 3 | 待领取 |
| 223 | PAY-VIPCITY | VIP 城市重建 | 1 | 待领取 |
| 224 | PAY-PRINCESS | 公主/Princess 奖励补领与跨期刷新 | 2 | 待领取 |
| 225 | PAY-PERMANENTCARD | 永久卡奖励领取 | 1 | 待领取 |
| 226 | PAY-RECOVERY | 资源追回免费奖励 | 1 | 待领取 |
| 227 | PAY-WEEKENDBONUS | 周末奖励与游玩次数 | 2 | 待领取 |
| 228 | PAY-LEVELSPRINT | 等级冲刺免费奖 | 1 | 待领取 |
| 229 | PAY-HOUSEASSISTANT | 看板助手背景、选择与试用 | 4 | 待领取 |
| 230 | PAY-HEATGIFT | 热度礼包支援与全服数据 | 2 | 待领取 |
| 231 | PAY-FLASHSALE | 限时特卖砍价与英雄 | 2 | 待领取 |
| 232 | PAY-ASSISTANT | 玩法助手功能设置与执行 | 3 | 待领取 |
| 233 | PAY-PREBOOK | 预约任务与分享奖励 | 2 | 待领取 |
| 234 | PAY-ROLESHARE | 玩家分享奖励 | 1 | 待领取 |
| 235 | PAY-CROSS | 跨服广告、功能免费与付费奖 | 3 | 待领取 |
| 236 | PAY-REDRAIN | 红包雨随机、领取与激活 | 3 | 待领取 |
| 237 | PAY-DIAMONDFUND | 钻石基金稳健/幸运奖励领取 | 2 | 待领取 |
| 238 | PAY-WEEKHUNT | 周猎任务、进度与升级礼包 | 3 | 待领取 |
| 239 | PAY-LINKGIFT | 联动礼包自选 | 1 | 待领取 |
| 240 | PAY-VIPLINK | VIP 联动展示 | 1 | 待领取 |
| 241 | PAY-GEMREBATEACT | 宝石返利投入 | 1 | 待领取 |
| 242 | PAY-APPEARANCERELEASEACT | 外观上新互动 | 1 | 待领取 |
| 243 | PAY-CAKEACTIVITY | 蛋糕活动每日、充值与托盘选择 | 3 | 待领取 |
| 244 | PAY-QUADRUPLECROSS | 四重跨期随机、免费与付费奖 | 3 | 待领取 |
| 245 | PAY-FINANCEMANAGEACT | 理财产品选择与返利 | 2 | 待领取 |
| 246 | PAY-SKINCRYSTAL | 皮肤水晶购买 | 1 | 待领取 |
| 247 | PAY-GROUPBUYACT | 团购全服统计与团购奖 | 2 | 服务端完成（全服口径与客户端回包对照待补） |
| 248 | PAY-REBATESHOPACT | 返利商店领奖 | 1 | 待领取 |
| 249 | PAY-DIVINEREALMACT | 神域活动礼包选择 | 1 | 待领取 |
| 250 | PAY-BONUSSHOP | 奖励商店购买 | 1 | 待领取 |
| 251 | PAY-AUCTION | 拍卖出价、心愿、分红与详情 | 5 | 待领取 |
| 252 | PAY-SKINRECHARGE | 皮肤充值角色选择 | 1 | 待领取 |
| 253 | PAY-BUYSKINACT | 购皮肤活动免费奖励 | 1 | 待领取 |
| 254 | PAY-ACTSHOP | 活动商店数据、购买与等级奖励 | 3 | 待领取 |
| 255 | PAY-PREMIUMACT | 增值活动免费奖励 | 1 | 待领取 |
| 256 | PAY-RECYCLEACT | 回收活动 | 1 | 待领取 |
| 257 | PAY-VICKREYAUCTIONACT | 维克里/密封拍卖 | 2 | 待领取 |
| 258 | PAY-GIFTBOXACT | 礼盒活动领取 | 1 | 待领取 |
| 259 | PAY-SUBSCRIPTIONACT | 订阅、领取与入场 | 3 | 待领取 |
| 260 | PAY-NEWPERMITACT | 新通行证领奖 | 1 | 待领取 |
| 261 | PAY-DRAGONLANDACT | 龙岛日奖、试炼奖与公会数据 | 3 | 服务端完成（战斗来源与日重置语义证据待补） |
| 262 | PAY-DIAMONDBANKACT | 钻石银行任务、奖励与购买 | 3 | 服务端完成（结算字段与多数任务进度证据待补） |
| 263 | PAY-FREEPRIVILEGEACT | 免费特权及月度激活 | 2 | 服务端完成（月卡激活 res 与体验期永久卡权益语义待补） |
| 264 | PAY-SLOTGAMEACT | 老虎机活动游玩与领取 | 2 | 服务端完成（倍率口径与日重置证据待补） |

## 块 J：#265–#276（团长、外观、剧情与辅助接口）

- 归属：新 agent；卡数 12，缺失命令 47。

| # | 任务卡 | 玩法 | 命令 | 看板 |
| ---: | --- | --- | ---: | --- |
| 265 | ROLE-UNKNOWN | GM 调试命令 | 1 | 待领取 |
| 266 | ROLE-ROLE | 团长改名、头像、称号、形象、等级奖、属性与战力 | 23 | 待领取 |
| 267 | ROLE-LOGIN | 网络检查与开发登录辅助 | 3 | 待领取 |
| 268 | ROLE-PLAYERDATA | 玩家数据查询 | 1 | 待领取 |
| 269 | ROLE-STORY | 剧情完成与触发 | 2 | 待领取 |
| 270 | ROLE-REDDOT | 红点持久化 | 1 | 待领取 |
| 271 | ROLE-CDKEY | 兑换码领奖 | 1 | 待领取 |
| 272 | ROLE-ACTIVITY | 真实活动状态推进 | 1 | 待领取 |
| 273 | ROLE-ACTFRAME | 活动列表数据及 GM 开期/跳阶段/清理辅助 | 5 | 待领取 |
| 274 | ROLE-SKIN | 皮肤穿戴、兑换、图鉴与强化 | 7 | 待领取 |
| 275 | ROLE-CLIENTLOG | 客户端诊断日志 | 1 | 待领取 |
| 276 | ROLE-CHANNELPUSH | 渠道推送开关 | 1 | 待领取 |

## 看板说明

- “服务端完成”表示实现已合入 main，只剩证据补强、回归与 APK 验收；块内 agent 只补缺口，不重写玩法。
- “待领取”表示仍有未路由或未实现命令，按 14 号文档的子卡粒度派发。


## 块 G2 执行结果（2026-11-08）

- 96 条命令全部有服务端承接：85 个 type 由 personal-server/game/minigame-act-service.mjs 实现并在网关派发，另 11 条沿用既有 FISHINGACT/HELPUPACT；塔、打地鼠、三消、对对碰、大富翁、梦境、钻石矿脉、烘焙写入模块 92 登录负载。
- 完成 6 卡、服务端完成含明确拒绝 8 卡、仅明确拒绝 1 卡（SOURCEPOINT）、回归 2 卡；明细见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md 与逐卡 implementation.md。
- 分支内全量 npm test 2560 项 pass 2558 / fail 0 / skipped 2；合入 main（24f90e9）后在干净 worktree 复核 2632 项 pass 2630 / fail 0 / skipped 2；补跨块表格式兼容（88219ca）后 main 最终全量 2674 项 pass 2672 / fail 0 / skipped 2。
- 未做 APK 实测：本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，无 APK 快照。
