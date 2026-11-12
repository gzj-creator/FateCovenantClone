# 全项目待实现总览（2026-11-12）

盘点基线：源码 `main@6b00f41`（实际工作树 `.worktree/main-activity-ticket-20261111`）；线上服务 `release-20261111T085036Z`（`RELEASE_COMMIT=f1fed77`）；全量 `npm run test:all` 2898 项、pass 2896、fail 0、skipped 2（两项跳过因未设置 `FC_RECHARGE_CLIENT_BUNDLE`）。

本文件只做汇总与索引，事实来源仍是下列权威文档：`docs/plans/remaining-gameplay-20261106/execution-status.md`、各块 `agent/workflow/gameplay-completion/<BLOCK>/implementation.md`、`docs/08-activity-fix-checklist.md`、`agent/workflow/fixes/activity-asset-audit-20261112.md`、`agent/workflow/fixes/README.md`、`docs/plans/remaining-gameplay-20261106/13-special-skills.md`。

## 0. 五类"待实现"口径

后续按此五类登记，避免把"没有 APK 验收"误当成"没写代码"：

1. **未实现（明确拒绝）**：网关有路由，服务返回 `GameError(5, 缺口说明)`，附具体缺失证据。
2. **已实现待补证据**：有真实读写与状态迁移，但公式、表值、周期、并发或回包语义仍为本地策略/推断。
3. **横切能力缺口**：属性公式、技能门禁、战斗效果、活动生命周期等共享层未接完，影响多个卡。
4. **活动入口缺口**：有入口无业务，或入口尚未观测到（module 92 未采集活动）。
5. **仅待验收**：业务、临时 TCP、SQLite 已闭合，只缺部署后的 APK 请求与用户视觉确认。当前**几乎全部功能都属于这一类之后的层**：除少数活动外，没有任何一项完成 APK 视觉验收。

## 1. 命令级覆盖与分块交付

静态 C2S 共 1407 条（2026-11-06 基线：真实路由 155、占位 23、显式拒绝 9、未路由 1220）。拆成 276 张模块卡 / 1252 条缺失命令，再拆 381 张命令级子卡；13 个工作块已全部派发并合入 main。

| 块 | 卡号 | 卡数 | 缺失命令 | 明确拒绝 | 记录 |
| --- | --- | ---: | ---: | ---: | --- |
| A1 | #1–#17 | 17 | 72 | 4（89601、90601–90603、104701） | `BLOCK-A1/acceptance.md` |
| A2 | #18–#33 | 16 | 147 | 11（83313/83314、84005、101104/107/119/120/125–128） | `16-block-a2-dispatch.md` |
| B | #34–#48 | 15 | 63 | 见 §3 待核对 7 卡 | 本文件 §3 |
| C | #49–#64 | 16 | 81 | 0（ARTIFACT 4 条 fail closed、98406 回包 proto 缺） | `BLOCK-C` |
| D | #65–#86 | 22 | 58 | 24（10 卡，含 105702 已后续修复） | `BLOCK-D/implementation.md` |
| E1 | #87–#106 | 20 | 162（本块 128 type） | 46 | `BLOCK-E1/implementation.md` |
| E2 | #107–#119 | 13 | 154 | 1（105805） | `E2-SOCIAL-COOP` |
| F | #120–#150 | 31 | 74 | 21 无条件 + 6 运行时（另 71/74 计为"有路径未销项"） | `BLOCK-F/implementation.md` |
| G1 | #151–#162 | 12 | 98 | 5（76510/76511、88005/88007、89913） | `G1-EXPLORATION`、`G1-REMAINING` |
| G2 | #163–#179 | 17 | 96 | 5（105008/105009/105015、106005、107806） | `BLOCK-G2`、G2 残余记录 |
| H | #180–#211 | 32 | 94 | 41 | `ACT-REWARD-H/implementation.md` |
| I | #212–#264 | 53 | 106 | 86（现由 43 家族矩阵接管，见 §6） | `PAY-BLOCK-I`、`activity-asset-audit-20261112.md` |
| J | #265–#276 | 12 | 47 | 76005 空参拒绝（设计如此） | `ROLE-*/implementation.md` |

## 2. 明确拒绝的完整清单（真正的"未实现"）

### A1（战斗 PVE）
- `89601` star_mission_award：无调用点、参数证据不足。
- `90601–90603` CommonMap：真实表只有系统定义，无地图实例/坐标。
- `104701` destiny_pve_fight：顶层无调用点且 `FightTable.def_team` 敌阵为空。
- 运行时拒绝：WorldBoss 无唯一 BOSS 调度、FameHall 掉落候选缺失、SoulTrial 超免费次数、TowerDefense 承伤结算。

### A2（PVP/竞技/三消）
- `83313/83314` 竞技大赛（对阵/竞猜引擎缺失）、`84005` 猎人竞技场（`BotLib.fight_tid` 阵容表缺）。
- `101104/101107/101119/101120/101125–101128` 综合 PVP：需真实跨服淘汰赛对阵与决赛排名。

### D（物品/任务）
10 卡 24 条命令未交付，阻塞点均为"权威状态或奖励配置"，例如 ITEM-RESCOMPLETE（客户端下载完成态无法服务端校验）、ITEM-GROWTHTARGET（Task/Phase 行由 LuaJIT 动态构造，抽取为空）、ITEM-TASKAWARD、ITEM-OPENSERVERBOX（无奖励表）、ITEM-HOOK（阶段来源不在服务端）、ITEM-TASKGROUP（`GroupFunc` 0 行）。逐条见 `BLOCK-D/implementation.md`。

### E1（社交前半）
46 条 fail closed：GuildTable/GuildActiveTable/GuildExploreTable/GuildExploreTrialTable/GuildWarTable/GuildDuelTable/GuildRacingTable 数值行未提取，涉及公会领取、战斗、地图、商店类命令。

### E2（社交后半）
- `105805` guild crusade rank：只有 ETF 请求，`pb_guild_crusade_rank_rsp` 定义缺失。

### F（抽取/翻牌/转盘）
- 无条件拒绝 21 条：`88921` 弹珠、`88925/88926` 幻武管道棋盘、`92201` 纹章抽、`93101/93102` 彩票、`97301` 翻牌奖、`97501/97502` 票券抽、`97902` 水果大奖概率、`102401` 象棋翻转领奖、`103302` 子拼图连线、`105501–105504` 返现抽、`91703` 许愿树宝箱、`91902/91903/91905`、`60004`、`104` 类奖励等（逐条见 `BLOCK-F`）。
- 运行时拒绝（有生产源才可玩）：`60003`、`92101`、`100903`、`103304`、`103502/103503`。

### G1 / G2（探索与小游戏）
- `76510/76511` 主题秘藏特殊奖与日奖、`88005/88007` 梦境任务与随机盒、`89913` 万象历险节点排名。
- `105008/105009/105015` 精灵庭院（单角色公会社交数据）、`106005` 三消棋盘通关自报、`107806` 大富翁补给（由其他角色创建）。

### H（节日/签到/限时）
41 条：`79103`、`99401/99402`、`100101`、`102906`、`104601/104602`、`106203`、`106205`、`118001`、`105201/105202/105250/105251`、`105303/105305/105307`，以及夏日活动依赖 PVP 匹配、关卡结算、水枪养成与阶段进度的 30 条（`103701–103710`、`103712`、`103813–103815`、`103801–103804`、`103901/103902`、`104101–104103`、`104105–104111`、`104113`）。

## 3. 需要核对的卡（看板已过期）

`15-three-work-blocks.md` 的"看板"列仍大量写着"待领取"，与代码实际不符（例：C 块 16 卡、B 块多数卡已在 2026-11-01 系统集成轮与后续批次实现）。按服务代码核查，以下 7 张英雄卡在 `personal-server/game` 中找不到对应服务，属未实现或仅有部分配置：

| 卡 | 命令数 | 现状 |
| --- | ---: | --- |
| HERO-COMBATPOWER（#39） | 2 | 无服务 |
| HERO-TACTICS（#40） | 2 | 无服务 |
| HERO-LINEUPSNAPSHOT（#42） | 2 | 无服务 |
| HERO-NEWHEROEXCLUSIVE（#45） | 3 | 仅 `recruit-pool-rules.mjs` 有池分组常量 |
| HERO-HEROLEGEND（#46） | 4 | 无服务 |
| HERO-LEASERSTARUP（#47） | 2 | 无服务（`hero-rent-service` 只覆盖租借 6 条） |
| HERO-CAMPHALO（#48） | 1 | 无服务 |

已实现可查：HERO-LINEUP、HERO-HERO、HERO-MASTERY、HERO-FAVOURINTIMACY（646/649/653）、HERO-HEROLEASE（hero-rent）、HERO-TEAMSUGGEST（88801）、HERO-HEROBLAZON（hero-bond 4 条）、HERO-INTELLI（hero-develop 族）。

## 4. 已实现但缺证据/规则（按执行状态表）

服务端有真实路径，但公式、表值、周期或回包语义仍是本地策略，集中在：

- 战斗：BATTLE-RANK（榜单事件/赛季结算）、BATTLE-PEAKTOWER、BATTLE-GENERALDUNGEON、BATTLE-FAMEHALL（候选与阵容）、BATTLE-WORLDBOSS（BOSS 调度）、BATTLE-PITLORD（RankTable 绑定）、BATTLE-CAMPTOWER（开放日）、BATTLE-TOWERDEFENSE（承伤结算）、BATTLE-REDCLIFF（轮次规则）、BATTLE-SOULTRIAL（付费翻牌）、BATTLE-SCARLETTRIAL（活动窗口）、BATTLE-ELITEMISSION（敌方阵容需部署注入 `eliteEnemies`）。
- 养成/装备：CORE-ATTR（见 §5）、HERO-HERO、HERO-MASTERY、EQUIP-EQUIP（觉醒=突破精炼上限未证）、EQUIP-ARTIFACT、EQUIP-RELIC（保底/概率、登录 depot 槽位）、EQUIP-WARRUNE（表为 LazyInit 生成器）、EQUIP-MUSEUM（人气奖只落领取位）、EQUIP-PET（灵核容器）、EQUIP-ELVESBEAD（穿脱未写回精灵槽位）、EQUIP-LEADEREQUIP（98406 回包 proto 缺）。
- 物品/任务：ITEM-ITEM（153/157）、ITEM-EVERYTASK、ITEM-MISSION（509/512）、ITEM-COMMONTASK、ITEM-GUIDE、ITEM-RANKACHIEVE、ITEM-GROWTHROAD、ITEM-FIRSTWEEKGOAL、ITEM-FUNCTIONMANUAL（仅统计源/主线章节可领）。
- 社交/公会：SOC-FRIEND（20012/20013 语义、友情点结算、登录槽）、SOC-MSG（10508 槽位、1400–1403 载荷）、SOC-GUILDBOSS/JOINT/RUNESTONE/GVG/VOTE/SLGMAP/NATION/BARGAIN/EXPEDITION/HUNT/AUCTION（表值、周期、并发、跨服均为本地策略）。
- 活动：PAY-ONLINEGIFT（PeriodMax 历史选择）、PAY-GROUPBUYACT（全服口径）、PAY-DRAGONLANDACT（龙岛战斗未路由）、PAY-DIAMONDBANKACT（103–114 任务 fail closed）、PAY-FREEPRIVILEGEACT、PAY-SLOTGAMEACT（倍率口径）、PLAY-FISHINGACT（110304/110306/110307/110309/110310 未实现、结束名次结算、旧版本 2–4 第 4/5 岛英雄奖）、PLAY-HELPUPACT（全服聚合、周期）、DRAW-HUNDREDDRAWACT（保底选择、非英雄星级奖）、DRAW-BONUSDRAW（权重折算）。

## 5. 横切能力缺口（影响面最大）

1. **CORE-ATTR**：`mission-fight-service` 玩家 HP 仍为 `1000+level*100+quality*10`，敌人按己方等级缩放；战力按 HP 汇总；装备/团长装备/圣器/Relic/幻武/图鉴/训练/法阵/星魂/命运/阵营属性尚未统一汇入配置属性公式。缺逐级成长分母、战力权重、1316 attr_list play_type、1314 回包、NpcAttr、速度表证据。
2. **CORE-BATTLE-A 残余**：`protection/invulnerable/strengthened/frightened/chain/pursuit` 完整语义、最大生命、命中/闪避、状态命中/抵抗、反弹公式未闭合；BUFF tid 映射未取得（现只发 103/107，117–119 不发）。
3. **CORE-BATTLE-B 残余**：天极值初始值/上限、6 行无价格天极技、每层数值 `{0}` 占位、月光获取来源与阈值、狐魅/命运领域、天极技复制、灵犀协狩/怒势、kill-chain 追击次数。
4. **CORE-SKILL-GATES**：通用 Passive 突破筛选与每级倍率未完成；可达英雄 `4040101` 缺技能目录；AbilityLevel 索引与 mastery 完整选择/替换待证。
5. **战斗回放**：服务端目前只下发最小骨架（107 round ready、112 round over、104 battle over），真实战报动作流与技能/伤害事件未还原；`fixes/README.md` 记录 APK 实测时 `201` 曾因缺回放明确拒绝，需按当前部署复测（见 `fixes/mission-fight.md`）。
6. **CORE-EVENTS**：53001/53002 只推进请求内已知活动；各活动族完整阶段配置、状态枚举、任务函数/周期统计、结束结算未恢复。
7. **CORE-DRAW-POOLS**：226 的 60101/60102 与神灵 56 组 `lib_range` 为空；多心愿/替换阶段、神灵心愿与重置规则待证。
8. **登录数据**：模块 92/183 的活动载荷按活动族逐项重建，仍有家族无登录容器（如 PAY-NOTIFYGIFT、PAY-VIP）；A2 的 module 113 只解出 1/4 块；三消活动 `StateData` 未下发。

## 6. 活动入口缺口

- `activity-asset-audit-20261112.md`：43 个家族 / 83 条命令仍返回 code 5，逐族给出"可用静态资产 + 准确缺口"，例如 PAY-TRIGGERGIFT、PAY-VIP、PAY-PERMIT（35003/35004/35006–35011）、PAY-FUNDACT、PAY-NOTIFYGIFT、PAY-REDENVELOPE、PAY-VIPGIFT、PAY-FASHION、PAY-VIPCITY、PAY-RECOVERY、PAY-PRINCESS(84603)、PAY-WEEKENDBONUS、PAY-LEVELSPRINT、PAY-HEATGIFT、PAY-FLASHSALE、PAY-ASSISTANT、PAY-PREBOOK、PAY-ROLESHARE、PAY-CROSS、PAY-REDRAIN、PAY-DIAMONDFUND、PAY-WEEKHUNT、PAY-LINKGIFT、PAY-VIPLINK、PAY-GEMREBATEACT、PAY-APPEARANCERELEASEACT、PAY-CAKEACTIVITY、PAY-QUADRUPLECROSS、PAY-FINANCEMANAGEACT、PAY-SKINCRYSTAL、PAY-REBATESHOPACT、PAY-DIVINEREALMACT、PAY-BONUSSHOP、PAY-AUCTION、PAY-SKINRECHARGE、PAY-BUYSKINACT、PAY-ACTSHOP(104802/104803)、PAY-PREMIUMACT、PAY-RECYCLEACT、PAY-VICKREYAUCTIONACT、PAY-GIFTBOXACT、PAY-SUBSCRIPTIONACT、PAY-NEWPERMITACT。
- `docs/08-activity-fix-checklist.md` 未勾选入口：助力升超凡 92144、新超凡魔灵 92059、百媚之约 89001、百抽兑换商店 104801–104803、7日登录 53037、神域秘市 46004、蜜雪儿副本 68001、火热季签到 115010、神魔抽1 9001、周期招募 86003、英雄招募活动 117001、天极神灵_海拉 102033、精灵历练/投放 SP、国庆礼包商店 153008、成长目标 3 期、成长之路 17001、新英雄活动 77066、秘宝成长之路 19001、day1 招募冲榜 180015、冲榜评定组、星钻狂欢二期、国庆签到 2026、热门推荐礼包 48、圣器抽奖活动 9_SP1、精灵投放水果抽奖、海岛垂钓剩余 5 个子项，以及"动态列表"中新观测到的活动。
- 上述家族都没有线上真实请求样本（`events.jsonl` 1169 行中 83 个命令 type 均未出现），实现前必须先拿到用户实际触发的 `benefit_command_refused` 记录。

## 7. 英雄技能缺口

`13-special-skills.md`：76 英雄 / 1076 条技能引用中 **277 条仍标 requiresInvestigation，覆盖 72 个英雄**。其中 68 条为 `69100010xx` 缺描述（metadata fallback 成 2.0 倍单一目标），75 条 source 为 `project-fallback`。典型未建模语义：天极值（以能量近似）、召唤实体（以护盾/治疗近似）、超凡生命、领域、专有层数、协同/追击、复制与额外行动上限。

## 8. 系统补全七模块与已闭合项

- 图鉴：655 拥有奖励按钮未在 UI 发现；属性/战力重算未实现（正式 `HandbookConstant` 奖励 0/0）。
- 团员名册：创建、申请、日志、捐献、科技、活动、公会战未实现。
- 法阵：只持久化状态，不计算战斗属性；重置不返还推断费用。
- 星魂卷轴：无真实客户端成功流量，资源/经验/信物初始等级属静态结论。
- 训练：拥有英雄前置、突破上限整笔拒绝、正式 `PlaygroundAward` 为空。
- 船舱：房间升级、任务、交互、加速无协议证据。
- 时空神殿：本版本客户端未注册 8 个 `req_time_temple_*` 编码器，已闭合为"不可达"；赛季商店与 7801 触发时机仍未知。

## 9. 验收与交付缺口

- 全部块记录都写明：未做 APK/真实客户端验收，未启停实时服务、未写运行数据库、未操作模拟器。已知有真实部署（`release-20261111T085036Z`）与线上日志，但视觉验收仍由用户执行。
- `fixes/README.md` 中 W1–W6、G1–G5、H1/H2、E1/E2、U1–U3、P1、L1、F5 等条目多数停在"已合入 main、待部署"或"待 APK/视觉验收"。
- APK：当前可用快照 `apk/release/com.jzyx.ps.v11-public-140.143.142.251.apk`（SHA256 `3caa14ca…970d95`）；看板娘仍依赖 PlayerPrefs `SubDownloadFinish=1`。

## 10. worktree 盘点

`git worktree list` 共 10 个：主仓被用作 `skill-system-validation` 检出（工作树内容已缺失，仅剩 git 元数据），实际最新代码在 `.worktree/main-activity-ticket-20261111`（`main@6b00f41`）。其余 9 个分支（account-isolation、activity-relative-time、activity-ticket、activity-vitality、fix-entry、hundred-draw-spirit、new-account-starter、up-star-gift、upstar-config-recovery）均已合入 main：`git log main..<branch>` 为空、`git diff main...<branch> -- docs agent` 为空。未跟踪文件只有 `analysis/`（6 处）与两个脚本/文档：`.worktree/activity-ticket-20261111/tools/extract-prototype-dump-rows.mjs`、`.worktree/main-activity-ticket-20261111/agent/workflow/fixes/activity-ui-diagnosis-20261111.md`。历史块工作树 `.worktree/gameplay-20261108/*` 已清理。

本仓库另有一份导出副本 `FateCovenantClone-main/`（即当前 cwd 的上层），内容停在 2026-11-10，缺 `act-shop-20261112.md`、`activity-asset-audit-20261112.md`、`fixes/activity-*-20261111.md` 等 11-11/11-12 文档。`activity-ui-diagnosis` 已明确写明不要把该副本当线上源码基线。

## 11. 建议优先级

1. **P0**：战斗回放/动作流（`201`）——不实现则主线不可玩。
2. **P1**：CORE-ATTR 属性装配 + CORE-BATTLE-A/B 残余 + CORE-SKILL-GATES，直接决定战斗数值与高阶英雄能否按描述工作。
3. **P1**：按 `activity-asset-audit` 逐族补表（优先用户正在点的入口：百抽精灵 1102008、独立升星、ActShop 104802/104803、限时招募/WeekHunt）。
4. **P2**：B 块 7 张英雄卡（战力/战术/快照/新英雄专属/传奇书/租借升星/阵营光环）与 D 块 24 条物品命令。
5. **P3**：E1/E2/H 的公会与节日活动表值取证；技能 72 英雄逐个核销。
6. **持续**：部署后按用户实际入口收集 `benefit_command_refused` 与视觉验收，把"服务端完成"推进到"APK 验收通过"。

