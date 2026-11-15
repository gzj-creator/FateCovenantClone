# 09 问题清单与验收用例

## 1. 状态与优先级

本表基线2026-11-15，沿用当前含R1文档、离线工具和实现改动的工作树。**已有局部服务端修复与离线客户端候选，均未部署或进行APK验收。** 优先级是本项目修复顺序，不改变原版难度或奖励。

### R1 已确定规则逐项验收台账

本台账只记录“已按R1完成的服务端/离线实现”。每项必须区分专项、存档、TCP、APK和发布验收；服务端完成不自动等于客户端或上线完成。未取得原证据的边界另见[原证据债务](rules/unresolved.md)。

| 规则项 | R1依据 | 实现与验证 | 状态 | 未完成边界 |
| --- | --- | --- | --- | --- |
| HERO-LEASERSTARUP 租借升星与重置 101201/101202 | [逐任务裁定](rules/final-rule-register.md#hero-leaserstarup)：`version+tid`只作用于当前租借副本；升星按原星表下一项精确扣费；重置按对象真实升级历史和`Reset`行索引处理；不得修改同tid永久对象 | 12表读取器校验Hero 65/Artifact 12/Pet 9/Elves 9共95个唯一`developTid`以及HeroStar/ArtifactStar/PetStar/ElvesStar/Reset全量行。101201按下一星原子扣费；101202按真实历史计算基础星/品质和逐行返还，消耗当日Reset段价，免费与付费次数、对象/阵容副本、资源和模块180在同一事务提交；响应编码失败和SQLite失败回滚。Leaser专项覆盖ETF/直接PB、四类对象、跨品质、次数/Daily边界、登录与重开；真实临时TCP通过 | **服务端、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | 原服务端函数未取得；`unlock_condition`执行语义及本服按全部已穿越星表行返还属现有证据推定。真实APK界面、原服登录外形、生产库和生产TCP未验收 |
| HERO-CAMPHALO 阵营光环升级 | [逐任务裁定](rules/final-rule-register.md#hero-camphalo)与同版`CampHaloMgr/CampHaloCmd/HeroBlazonHaloForm/HeroBlazonBondData`证据：支持阵营1/2/3/4/9，等级0→3逐级升级；普通阵营只查对应章节ChartVal，混沌9要求四章同时达标；门槛依次400/800/1500；`HeroCampHaloAttr`未含扣费字段，客户端升级流程也不扣资源 | 新增`CampHaloTable`5个阵营/20个等级行及`HeroBlazonBondTable`的BondAttr3200、BondGroup128、Chapter4严格校验；`103101`解码ETF单阵营参数，读模块152当前羁绊TID，以`floor(tid/100)`映射BondGroup/campus并累加真实`BondAttr.chart_value`；模块182保留`select_camp`和原始空PB，升级在同事务写回；专项9/9、失败关闭2/2、注册表5/5、派发运行时1/1及真实临时TCP通过 | **阵营光环升级服务端完成；效果投影/APK/生产TCP待验** | 真实APK外层ETF与界面流程未验；`CampHaloAttr.attr/sp_attr/skill`进入全局或出战阵容的最终效果投影、`active_num`实际启用语义及`select_camp`选择动作未接入。当前只完成权威等级、ChartVal门槛与状态持久化，不能宣称光环已实际改变战斗属性；生产库未读写 |
| HERO-COMBATPOWER 战力奖励与预设战力 802/803 | [逐任务裁定](rules/final-rule-register.md#hero-combatpower)与同版`CombatPowerMgr/CountStatisticsMgr/CombatPowerTable/HeroShowUILogicMgr/CombatPowerCmd`证据：802只让权威总战力达到`CPBreak.break_value`的档位领奖，客户端自报战力不能授奖；803由限频的客户端刷新请求触发当前预设重算，`pb_lineup_team.power`由服务端计算，命令无回包消费者 | 802导入原`CPBreak`24行，按权威历史最高原子发奖、置位并返回`pb_power_award_toc`/ETF BitBlock；803新增`pre-lineup-power-service.mjs`，用`assembleHeroAttributes`（含战术全局属性）逐fighter计算、写预设`power/max_power`并空ack。803专项7/7、802/803相关专项14/14、真实临时TCP、模块9登录投影及SQLite重开通过；编码失败回滚和重复门槛拒绝已覆盖 | **803与802服务端、登录同步及离线TCP完成；APK/生产TCP待验** | 802领取位图的真实登录宿主仍待APK核实；803真实APK外层ETF和界面刷新时机未验收。803只刷新请求的预设，不代改其他玩法阵容副本；预设战力不等于全部玩法战斗属性投影。生产库未读写 |
| HERO-FAVOURINTIMACY 赠礼、约会与故事 667/670/671 | [逐任务裁定](rules/final-rule-register.md#hero-favourintimacy)与同版`HeroTable/FavourIntimacy*`、`storychapter*`、PB和客户端Mgr证据：667按赠礼`add_intimacy`合并扣物并推进独立等级；670按等级发约会奖并执行用户周限/英雄日限；671只对英雄所属故事的终章页发奖，并校验页面、选择、亲密度、故事所有权和独立位图 | `hero-intimacy-service.mjs`写模块10 slot11，667/670/671在SQLite事务内完成资格、成本、奖励、次数/故事位和编码；重复请求、阶段/亲密度不足及损坏状态均在变更前拒绝。专项9/9、真实socket登录+路由、编码失败回滚及SQLite重开通过 | **三命令服务端、登录同步和离线TCP完成；APK/生产TCP未验收** | 原服务端成功函数未取得；等级/约会碎片由同一响应消费、`story_got_bin`位号语义是R1推定。亲密度进入战斗属性的最终投影、真实APK故事流程及生产TCP未验收 |
| HERO-HEROLEGEND 传奇书 89801—89804 | [逐任务裁定](rules/final-rule-register.md#hero-herolegend)与同版`HeroLegendTable/HeroLegendBookMgr/HeroLegendBookUtil/HeroLegendBookForm/HeroLegendCmd`、`pb_hero_legend_book`证据：模块154为标量登录slot；初始星5、上限10，祝福槽1/2/3开放星6/8/10，BookLevel15、BookStage4且每阶段5级；激活只要求拥有书对应英雄，升星只要求本体英雄星数不低，升级按`Hero.chip`和`BookLevel.need_piece`，阶段要求10星与阶段等级 | 新增`HeroLegendTable`资产读取器、模块154状态服务与网关接入；`89801`执行激活/升星，`89802`由槽位派生祝福英雄并校验拥有/开放星/重复，`89803`原子扣英雄碎片并返回`pb_hero_legend_book_active_back`，`89804`执行阶段推进；专项7/7含ETF、真实临时TCP、资源回滚、登录空态与SQLite重开 | **89801—89804服务端、登录同步及离线TCP完成；APK/生产TCP未验收** | 原服务端函数未取得，成功语义是客户端Mgr/Form/同版表恢复后的R1显式推定；传奇书技能/属性进入全部战斗和其他玩法副本的最终投影仍待逐入口核验；真实APK外层编码、界面流程和生产TCP未验收 |
| HERO-HEROBLAZON 技能升星与羁绊升星 88955/88957 | [逐任务裁定](rules/final-rule-register.md#hero-heroblazon)与同版`HeroBlazonTable/HeroBlazonCmd/HeroBlazonSkillMgr/HeroBlazonBondMgr`证据：技能tid=`源tid×10+星`，按`Skill.active_item`扣料并要求`active_chart_value`；图鉴值由本章节已拥有羁绊的`BondAttr.chart_value`求和。羁绊请求是目标`BondGroup`，下一星`BondAttr`及组内5个`BondItemNeed.special_item`各1个构成门槛，客户端将回包中的`talent_list`整体替换，因此必须返回完整天赋分配 | 新增17族`HeroBlazonTable`资产与严格读取器；`88955`原子扣料并写模块152 `skill_list`；`88957`原子扣除5种材料、按`BondGroup.campus`更新羁绊星并返回完整`talent_list`。联合专项与真实临时TCP共14/14，覆盖ETF、余额不足、满星、重复、登录持久化、编码回滚及SQLite重开 | **88955/88957服务端、登录同步及离线TCP完成；APK/生产TCP待验** | `88951/88953/88956`及基础技能`star==0`继续失败关闭。技能和属性进入战斗的最终投影尚未接入；真实APK界面与生产TCP未验收 |
| HERO-TACTICS 战术节点升级与章节重置 84501/84502 | [逐任务裁定](rules/final-rule-register.md#hero-tactics)与同版`TacticsTable/TacticsMgr/TacticsCmd/ResetTipForm`及PB证据：模块19为`pb_tactics_master`；`Attr=260`、`Chapter=4`、`Node=52`，每节点固定5级；章节接续点、父级和跨章累计等级构成前驱；道具`2401900`按目标等级精确扣1或2点；章节重置返还该章已消耗的精确点数 | 新增`TacticsTable`读取器与模块19状态层；`84501`事务内校验父级、跨章、5级上限和余额；`84502`只重置请求章节、按真实节点等级汇总精确返还并保留其他章节；二者同步`root_node/sub_list`、资源与PB，编码失败回滚。累计属性投影到`1316`、普通/精英任务战报、当前战力榜、锦标赛和武馆；专项覆盖两级重置、编码失败、重开、ETF及真实临时TCP | **两条服务端命令、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | 真实APK外层ETF、界面流程和生产TCP未验收；原服在其他玩法入口是否另乘系数或设上限仍待逐项核验。当前已定位入口共用同一属性投影 |
| ITEM-GROWTHTARGET 成长目标 69006/69007 | [逐任务裁定](rules/final-rule-register.md#item-growthtarget)、原`GrowthTargetTable`及同版PB：Task 666、Const 3、Version 3、Phase 111；版本1/2/3对应活动18001/18002/18003；每版37 phase、每phase 6 task；phase奖、task奖和完成列表彼此独立 | `growth-target-service.mjs`校验版本、阶段、任务、真实统计生产者和ETF请求，在同一事务发奖并写独立列表。69007仅对已证生产者开放；69006只认已完成任务列表，不要求先领任务奖。专项11/11、module 92登录、合并真实临时TCP、编码/SQLite回滚和重开通过 | **服务端、登录同步、SQLite重开和离线TCP完成；部分分支受限；APK/生产TCP未验收** | 81个`period=1`任务缺按业务日生产者；默认生产者下尚无完整可领phase，因此69006默认支付前err5。27个有已证周期生产者的`period=2`任务可领；`reissue_award_list`无消费者，不发放；重复310为工程兼容 |
| ITEM-MYSTERYSHOP 神秘商店购买 91503 | [逐任务裁定](rules/final-rule-register.md#item-mysteryshop)、原`MysteryShopTable` 7族（CellType 5、Cell 14、ItemLib 418、Const 1、ManualRefresh 5、DiscountLibType 5、DiscountLib 35）、同版`MysteryShopCmd/Mgr`及`pb_mystery_shop`：购买请求是ETF单个`cell_id`，响应`pb_res_to_client`；价格由持久化商品的`discount_price[discount_idx]×DiscountLib.discount/100`决定，成功后置`is_bought`并增加`buy_times` | 新增严格表读取器与`mystery-shop-service.mjs`；`91503`只对登录模块162中真实存在、未购买、无`pre_condition`且价格恰为整数的商品开放，在同一SQLite事务完成扣款、发奖、置位、计数、request幂等记录和响应编码。专项10/10及真实临时TCP登录/重开1/1通过；重复请求不二次扣款，编码和SQLite失败回滚 | **窄成功链的服务端、登录同步、SQLite重开和离线TCP完成；91501/91502及部分91503条件受限；APK/生产TCP未验收** | 3个Cell和116个ItemLib的`pre_condition`原规则、非整数折扣圆整、自动/手动刷新候选与时段成本、次数段位及`all_times_data`更新未闭合；这些边界均在支付前err5。整个91503配置域尚未宣称闭合 |
| ITEM-TASKAWARD 任务活动 69101/69102 | [逐任务裁定](rules/final-rule-register.md#item-taskaward)、原`TaskAwardTable`与同版PB：Version 1、Task 263、Progress 6、Tag 4；活动19001/func19映射module21统计，六档阈值600–3600；任务位和进度位独立 | `task-award-service.mjs`按真实module21统计复核、发原奖、写两位图并更新活动进度；module92登录、ETF、事务/编码/SQLite失败回滚、Daily窗口和重开已测。专项12/12及真实临时TCP通过 | **服务端、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | “领取任务后把growth_value累计到进度”是R1推定，原服务端提交函数未取得；重复310为工程兼容；六档逾期奖原值为0，不开放补领 |
| ITEM-CAREERLIFE 生涯剧情 85804 | [逐任务裁定](rules/final-rule-register.md#item-careerlife)、原`CareerLifeTable`与同版PB：StoryChapter 18、Story 99、BossConst 1、Boss 0；功能1129要求角色15级；章节位写入`story_bin`，18章`res/res_count`均为0 | `career-life-service.mjs`以真实mission游标与原`Section.index`核全部剧情前驱（含discard节点），事务置章位并写模块153；未知/未开放/重复/损坏状态均在写入前err5，编码失败回滚。专项9/9、真实临时TCP、登录投影和SQLite重开通过 | **服务端、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | 成功响应资源为空，只提交原剧情位；原服务端成功函数、真实APK页面流程、在线推送和生产TCP未验收 |
| ITEM-LINEARLEVEL 线性关卡宝箱 93501 | [逐任务裁定](rules/final-rule-register.md#item-linearlevel)、原`LinearLevelTable`与同版PB：区分战斗type/level与宝箱index；每个type配置`pass_fight`、index和原奖励；模块535存`linear_levels`及位图 | `linear-level-service.mjs`拒绝空/重复/越界index，在确切通过关卡与未领位后一次发奖并写入bitmap；ETF/PB、资源不足/重复/编码失败、登录同步、SQLite重开及真实临时TCP通过 | **服务端、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | 原服务端成功函数未取得；真实APK界面与在线推送、生产TCP未验收。不能把indexes当关卡tid或借用9010线性任务 |
| ITEM-OPENSERVERBOX 开服宝箱 69301/69302 | [逐任务裁定](rules/final-rule-register.md#item-openserverbox)、原`OpenServerBoxTable`与同版PB：四版本、每版30日箱、五进度行；激活日与领取游标分开；`recharge_flag`只由真实支付订单决定，后台余额不计费 | `open-server-box-service.mjs`校验活动/版本/SQL/Section 60205门槛、候选日与进度；69301发一日原奖并推进游标，69302发进度奖；真实630070订单决定付费奖分支。专项、登录投影、SQLite重开和真实临时TCP通过；编码/状态损坏回滚 | **服务端、登录同步、SQLite重开和离线TCP完成；APK/生产TCP未验收** | 原服务端成功函数与真实APK界面未取得；活动激活日/真实付费订单形态为现有R1及配置推定；生产TCP未验收 |
| R1-RANK-TIEBREAK 排行榜同分 | [R1排名裁定](12-final-rule-baseline.md#ranking)：原分值主序→该分首次服务端提交时间→数值role_id；降分后重返同分复用首次时间 | `rank-service.mjs` 新增 `rank_score_reached`/`rank_schema_meta`，按毫秒保存首次精确达到时间；重复同分不刷新，旧库优先可信备份、无记录统一迁移快照；`rank-service.test.mjs` 9/9通过 | **服务端实现完成；APK待验** | 原有原版同分消费者仍未取得，当前按R1推定；真实客户端同分展示、跨期冻结/发奖与APK场景待验收 |
| R1-TIME-ABSOLUTE 时间与活动窗口 | [R1时间基线](12-final-rule-baseline.md#3-时间与活动的最终口径)：刷新点05:00；相对开服活动按原`refer_day/server_day`及日内偏移；原`world_time`保留绝对日期，历史运营回放使用单独声明的统一时间轴 | `dayZero()`改为05:00业务日零点；`activityWindow()`默认绝对并只对显式`windowPolicy='rebase'`平移；正式配置为`absolute`、all-open回放为`rebase`；相对活动以`DayBegin/gameDay`及原尾秒计算；网关仅在回放模式重定位登录模板，排期审计工具按同一策略核验。时间/排期/审计/网关回归37/37、真实TCP all-open登录1/1通过 | **服务端与离线工具实现完成；APK/生产TCP待验** | 正式新服不得自动复活旧`world_time`活动；回放不能称当日原服日历。原消费者仍未取得，绝对日期按R1执行。461三项尚无显式实例时继续失败关闭，待专项实例落地；真实APK跨刷新点、旧活动关闭及回放标签尚未验收 |
| R1-TIME-HUNDREDDRAW 百抽父子活动窗口 | [R1时间基线](12-final-rule-baseline.md#3-时间与活动的最终口径)、[百抽裁定](rules/final-rule-register.md#draw-hundreddrawact)：正式排期保留绝对日期；旧原服custom实例只在显式rebase回放使用；现代百抽20001运行时，182商店、184礼包与其共用当前窗口 | `activity-calendar.mjs`仅在rebase承认旧legacy custom；`hundred-draw-service.mjs`优先使用日历`windowFor()`同步父活动和伴随行；百抽18/18、付费活动10/10、活动日历22/22、真实临时TCP网关7/7通过 | **服务端、排期与离线临时TCP完成；APK/生产TCP待验** | 真实APK跨刷新点、旧活动隐藏及生产TCP未验收；历史原服窗口不得当正式新服当前日历 |
| R1-DYNAMIC-461-175001 461显式实例 | [R1动态排期裁定](rules/dynamic-schedule-decisions.md)：175001继承父174001整体窗口并显式下发50段；另建真实单服组，首期业务日按v3 day79、v10 day29、v11 day90，刷新点05:00；显式S/E及`stage_time_list`，缺实例不猜、不隐式复发 | `activity-explicit-occurrences.mjs`固化R1四项实例；`activity-calendar/activity-runtime/activity-store/act-frame-service/gateway`按实例指纹、真实单服scope、业务日和显式阶段运行；模块92/183与SQLite均取同一实例；活动与排期专项67/67通过 | **服务端与离线排期实现完成；APK/生产TCP待验** | 原461服务器函数未取得；175001真实原服下发样本及返场/后台暂停/延长仍未取得。当前parent短ID使用`[1,0]`、父整体窗口收尾和“不循环/不补过去日奖”是本服R1推定；APK跨日、模块92/183实际展示及生产TCP待验收 |
| PAY-BUYSKINACT 购皮肤活动 | [PAY裁定](rules/final-rule-register.md#pay-buyskinact)：175001继承父174001整体窗口；五SKU按第1/3/17/31/45活动日解锁；免费日奖独立于付费且按05:00业务日一次；功能1514为PassedSection≥30203 | 新增13行原表资产与版本1校验、104001免费奖、五SKU付费/限购/原子回滚、模块65/92、flag106、SQLite重开和临时TCP；专项8/8，相关钱包/功能/事件/充值回归58通过、2项因缺客户端bundle跳过 | **服务端与离线实现完成；APK/生产TCP待验** | 16004仅以R1兼容外形`[1180001,[175001,1],0]`通过临时TCP；真实APK外层编码、原服175001下发及返场/暂停/延长未取得。1514的`sysSwitch=92098`权威业务来源未取得；共享断言955132601007只接入1514，其余43行继续关闭。当前功能业务映射`ready177/gap346`，不得据此打开这43行 |
| BATTLE-BATTLETRIMATCHHERO 三消英雄与升星 | [BATTLE裁定](rules/final-rule-register.md#battle-battletrimatchhero)：112001按原等级逐级累计成本升等；112002按原星级成本和前置升星；成本或必要上下文不完整时不扣料 | 网关接入112001/112002；多级升级先聚合成本再一次性扣料并返回真实资源变化；新增模块6 group 2 `4700:MatchHeroChip`处理器，碎片可合成英雄；登录模块563下发真实英雄状态；三消专项5/5通过，含精确差1材料原子拒绝、重开恢复和真实临时TCP | **服务端、登录同步与离线临时TCP完成；APK/生产TCP待验** | 真实APK两条命令的外层编码和界面流程未验；563原服实时登录形状未抓包；`ability`/技能解锁及客户端表现联动未完成；`is_break`额外门槛未取得；三消功能FunOpen业务状态、开放时机和错误码未验 |
| BATTLE-BATTLETRIMATCHEQUIP 三消装备与兑换 | [BATTLE裁定](rules/final-rule-register.md#battle-battletrimatchequip)：113001按原类别和一键规则升级；113002按原整槽或指定类型交换；113003按原逐轮上限升级；缺证据的额外成本不自行补算 | 网关接入113001–113003；实现单类/一键升级、整槽/指定类型交换和多轮升级并在满级拒绝；交换与升级写真实状态；登录模块564同步；专项覆盖不足回滚、满级和重开恢复，真实临时TCP通过 | **服务端、登录同步与离线临时TCP完成；APK/生产TCP待验** | 真实APK三条命令的外层编码和界面流程未验；564原服实时登录形状未抓包；交换是否另收成本、是否返还旧材料未取得证据，当前只交换真实等级；一键升级“每类只升一级”和材料不足停止语义尚无真实APK对照 |
| BATTLE-BATTLETRIMATCHLINEUP 三消出战阵容 | [BATTLE裁定](rules/final-rule-register.md#battle-battletrimatchlineup)：114001–114005保存预设、设置出战和读取阵容；阵容只接受原配置类型、唯一位置/英雄/队伍且英雄必须真实拥有 | 网关接入114001–114005；预设上限20；修复`trimatch_ident`首个UID被跳过，首套固定UID 1；`playing_lineup`按repeated恢复type 1/2/3；登录模块565同步；专项覆盖配置类型、重复/未拥有拒绝、上限、重开和真实临时TCP | **服务端、登录同步与离线临时TCP完成；APK/生产TCP待验** | 真实APK五条命令的外层编码和界面流程未验；565原服实时登录形状未抓包；`add_max_num`原服语义未抓包，当前按客户端实际读取的`max_preset`下发20；原版队伍数量、三消主界面/塔/PVP预设是否共享或互斥、阵营与位置特殊限制未取得 |
| R1-BATTLE-CAPTAIN-REPORT 普通战报虚拟队长 | [战斗报告规则](03-combat-and-attributes.md#7-请求战报与结算)、[30201原敌阵](appendices/early-missions.md)：圣器HUD读取的captain是虚拟fighter，不属于玩家英雄、不参战；30201为4名玩家英雄和4名Fight301/Team301 NPC | `mission-fight-service.mjs`报告加入唯一`role_type=3` captain，保持4名`role_type=1`和4名`role_type=2`；`gameplay-gateway.test.mjs`验证9行、动作流、201→207、体力/首通和重复207幂等，7/7通过 | **服务端报告与离线临时TCP完成；APK/生产TCP待验** | 真实APK圣器HUD、普通主线显示和生产TCP未验收；不能把虚拟captain行当作实际第五名玩家 |
| DRAW-WISHTREE Fun1223受限边界 | [许愿树裁定](rules/final-rule-register.md#draw-wishtree)：正常抽取服从原功能门禁；未取得原条件时不得为服务可运行而开放 | 默认91701返回309；仅在显式`force_open(1223)`测试覆盖下验证真实临时TCP抽取、返利、额度、重复拒绝和模块165重开持久化，`gameplay-gateway.test.mjs` 7/7通过 | **受限边界已核验；原功能未开放** | `Fun1223`原条件`955132601007`的业务含义、正式开放时机和真实APK入口未取得；运维强开不得记为原规则已完成 |
| R1-FAILCLOSED-25 未闭合命令业务拒绝 | [最终裁定入口](12-final-rule-baseline.md)、[逐任务裁定](rules/final-rule-register.md)：缺原配置、生产者、前驱、返还消费者或结果投影的变更必须拒绝，不能扣资源、置位或返回伪造成功 | `r1-fail-closed-command-service.mjs`逐type覆盖10项任务共25条命令；网关在通用fallback前返回err5并记录`r1_command_refused`；失败关闭专项和真实TCP代表路由通过 | **路由与失败关闭完成；具体玩法未完成** | 25条的原始功能、状态读取和成功结算仍未实现。每个type保留独立精确原因；已能证明的子动作可迁出，剩余变更继续在支付、置位、次数或对象变更前err5 |

### R1 尚缺原始证据的 25 条命令

这些命令目前只完成明确业务拒绝，没有扣资源、置位、清状态或返回伪造成功。它们不计入“已确定规则完成”；取得相应原生产者、配置、成本、前驱、返还消费者和结果投影后再逐组迁出失败关闭表。

| 任务组 | 失败关闭命令 | 尚未取得的边界 |
| --- | --- | --- |
| HERO-HEROBLAZON | `88951/88953/88956` | 章节成本、材料转换/槽位、天赋预算及技能重置范围/返还 |
| HERO-INTELLI | `701/702` | 情报槽、候选池、刷新、起止时钟及奖励转移；原`Intelli`仅有展示字段，`MethodScript`为空 |
| HERO-LINEUPSNAPSHOT | `87701/87702` | 快照创建者、冻结身份、可见性、日界及引用清理 |
| HERO-NEWHEROEXCLUSIVE | `88963/88964/88967` | 合法候选、选择上限、剧情前驱、阵容资格及原奖励行 |
| ITEM-HOOK | `78201/78202/78203/78204/78205` | 权威玩法阶段、type产率/上限、浮点余量、游标推进、随机产出及快收成本；当前只有原表/PB/客户端调用者 |
| ITEM-MYSTERYSHOP | `91501/91502` | 折扣池/权重、自动时钟、手动次数/段价、候选生成与状态替换；91503的资格/非整数价格子域另由专用服务支付前拒绝 |
| ITEM-PERIODTASK | `101301/101302/101303` | 原Task/Version/Score/Stage四族当前导出均为0行，任务、阶段、分数生产者与奖励无法建立 |
| ITEM-RESCOMPLETE | `288` | 补全类型、资格、资源清单、来源唯一键及`res_to_client`消费者 |
| ITEM-RESROLLBACK | `88401/88402` | rollback type到对象/成本映射、投资历史、返还公式、引用保护及预览后指纹复核 |
| ITEM-TASKGROUP | `84901/84902` | `GroupFunc`生产者、组内任务前驱/可见性、阶段资格及原组奖励 |

除上表外，现有规则仍保留证据边界：属性链、特殊技能、招募概率、活动多人结算、精英关卡敌方模板、失败页原战力显示和真实APK/生产TCP均不能仅凭现有服务端测试宣告原版完成。后续每闭合一组，必须同步更新本表和失败关闭数量。


| ID | 级别 | 用户问题/审计问题 | 已确认依据 | 待完成与验收 |
| --- | --- | --- | --- | --- |
| FID-001 | P0 | 首章最终首领不是蜜雪儿 | 已恢复NPC3030500、关联3030501、位置5、Fighter10505与基础NpcAttr20；独立回归通过 | NPC技能/属性能力、场景/特殊规则及真实APK首领战未验收 |
| FID-002 | P0 | 新手赠角没有发 | 已恢复16奖配置，Award1/2合法资格、真实英雄发放、位图/账本、防重/回滚/重登；离线修复工具已完成 | 受影响运行库未读取或修复；真实APK领取、名册和上阵待验收，其他奖励仍有缺口 |
| FID-003 | P0 | 新号卡2-1 | 新临时库正常领奖、上阵、首章至2-1获胜；单人败北与重登重试通过；无加级送强角削怪 | 玩家技能装配仍含兼容被动，不能当原战斗完整还原；完整APK连续流程待验收 |
| FID-004 | P0 | 败北界面敌方第一队战力0 | 同版原NpcAttr1–47.power=0，结果页取静态表；32/64位显示候选18/18、逐TextAsset一致 | 候选未安装；原服正数显示规则未取得，不宣称原算法恢复；真实失败页及后期正数路径待验 |
| FID-005 | P0 | 1级出现名人堂引导 | 已恢复1218门槛≥32级且开服日≥2、修7201完整ID、7000资格与空库首号登录，临时TCP通过 | 1级实际弹窗入口仍未定位；现场表单/Storage/更新资源、旧错误位和APK边界待验 |
| FID-006 | P1 | 按玩家属性估算固定敌人 | 普通主线已去掉均值×0.88/玩家最高等级，改用原模板；玩家升级/换队模板不变回归通过 | 精英等其他encounter仍有旧兼容路径，需逐模式替换 |
| FID-007 | P1 | 假缺表与借前关 | 新field map解析，Fight3566/Team10744/Fighter4518/AttrAbility1099行；普通主线移除借邻关 | 固定攻方运行语义、Fighter9110202缺行及多队报告仍未闭合 |
| FID-008 | P0 | 填奖励表仍可能领不到 | 已修先领奖后保存、合法前驱、8000归属/中间点is_over与替代Process持久化；失败原子回滚 | 后续奖触发未恢复项和100614400处理器缺口；APK完整引导/中断恢复待验 |
| FID-009 | P0 | 模板进度可能污染新号 | 初始档案保留大量未完整核对字段；曾观察后期Guide检查点 | 全模块/slot字段审计、默认生成、账户隔离，不凭猜测批量清库 |
| FID-010 | P1 | 技能/属性仍有自定逻辑 | 277条技能待调查、75条project-fallback；被动突破解锁未闭合、速度/防御兼容 | 逐英雄技能卡、原属性链、基础伤害/行动/效果独立对照 |
| FID-011 | P1 | 普通招募池与概率仍有兼容矩阵 | recruit-pool-rules明确标记local compatibility | 恢复原组/权重/门槛/保底/心愿，不公告自定矩阵为原概率 |
| FID-012 | P1 | 活动/公会等本地策略和明确拒绝 | 各实施记录、当前服务与命令附录 | 逐模块还原原版状态、数值、多人和结算，明确拒绝仍算未完成 |
| OPS-001 | P1 | unit数据目录与发布脚本默认不同 | 仓库unit=rollover，deploy-release.sh=live-20261112 | 实时查unit/override与实际数据，统一路径后部署，不覆盖唯一存档 |
| OPS-002 | P2 | 派发审计源hash过期 | 本轮初次--check失败，重建后仅源hash更新 | 本轮已更新审计；继续用--check校验，不作为玩法修复 |

## 2. 实际新手阻断证据

来源为本地保存的 [events.jsonl](../../analysis/experiments/local-new-user-debug-20261114-1425/server-data-01/events.jsonl)，下表为必要字段摘录；不将其中账户、token或完整payload复制入公开文档。时间为UTC，显示时加8小时。

| UTC时间 | 事件 | 说明 |
| --- | --- | --- |
| 08:50:02 | 10202开战，攻方2、守方2 | 与原守方4名NPC不符；不能仅凭此日志判固定攻方如何覆盖 |
| 08:50:11 | 通关并团长1→2 | 已有合法前段进度，不能重建新号抹掉 |
| 08:50:17.740 | guide_award_unconfigured，awardTid=1 | 赠角缺失有直接服务端拒绝证据 |
| 08:50:18 | 10204仍只有2名玩家英雄 | 不能据此声称“立绘送了就算到账” |
| 08:50:36.449 | 10205开战，守方2，结果胜利 | 原本应蜜雪儿单NPC，错误阵容能通过不表示还原 |
| 08:50:56 | 首章末战结算、团长3→4 | 团长升级不能弥补漏送角色 |
| 08:51:02.272 | 508，section10206完成剧情 | 正常转入第二章 |
| 08:51:09.843 | 20201，攻方2/守方2，1回合，result2 | 首次2-1败北 |
| 08:51:19.595 | 同节点同人数同回合败北 | 可重现的阻断 |
| 08:53:40.599 | 再次同节点败北 | 不应让用户继续空重试消耗体力 |

日志名`mission_fight_committed`表示结算事务提交，并不表示胜利或节点推进。失败记录中的previousMissionId仍10206，判断通关要读result与实际mission_id。

该目录当时状态PID7108活跃、WAL持续更新，是正在运行的故障库目录，不能称“离线快照”。本轮只复用既有events日志，没有打开数据库、生成补发预览、备份或执行迁移。

## 3. 修复依赖与交付顺序

1. 冻结原始证据和受影响存档副本，保留代码/配置/APK哈希；建立新号与现有号两组重现。
2. 恢复Guide奖励及原申请时序，核8000检查点与module16，先保证角色和资源真正到账。
3. 正确提取Fight/Team及所需其他分片，包括固定攻方；接NPC关联、属性、技能，去掉错误地图敌阵与平均玩家缩放。
4. 核首章至2-1完整流程和任务/经验/体力，查失败战力的客户端链，定位名人堂触发。
5. 生成历史档案差异与幂等修复，保存正常养成；在副本验证后执行受影响角色的具体修复。
6. 专项、临时TCP、重登、完整新手与失败界面APK验收，再按运营手册发布并做发布后同场景验证。
7. 全玩法按附录清单逐项替换本地策略与明确拒绝；不能以“新手能走了”宣称全游戏1:1完成。

这些步骤可以在同一代码变更里协调，但资产、服务、存档迁移与客户端版本分别记录，避免把补发与难度变化混为一个黑箱。

## 4. 新手验收矩阵

| 用例 | 准备与操作 | 独立预期 | 必留证据 |
| --- | --- | --- | --- |
| N01全新号 | 独立临时库/新账户，首次登录与重登 | 等级1经验0、原初始英雄/资源，无旧任务/活动/付费/后期引导；必要模块结构完整 | 创建前后表计数、登录解码、UI、模块差异 |
| N02初始档隔离 | 同库创建A/B两个不同账号 | uid/角色/资源/编队/引导/钱包/活动记录彼此隔离 | 两角色snapshot与索引 |
| N03首个赠角 | 按原流程进入Step106004，正常8001 | Award1 1020601×1到账，可查看和上阵；不是请求前预先拥有 | 8001/PB资源、英雄表、名册/上阵截图、claim/module16 |
| N04第二赠角 | 通关20201后到Step110004，正常请求；通关前也请求一次 | 通关前拒绝，之后Award2 2020601×1；与第一奖独立 | 同上，附前驱和Process108 |
| N05请求时序 | 真实GuideAwardStep调用顺序 | 不要求先保存本奖励步骤完成key；非法越级请求仍拒绝 | 请求序列与资格判断 |
| N06重复/回包丢失 | 同award连续重试，提交后断线 | 原成功状态可恢复；不能再发一份 | 领取账本唯一、资源/英雄数量、重登 |
| N07首章首领 | 正常打到10205 | NPC3030500，关联蜜雪儿，位置5；属性/技能/人数/战斗规则匹配原配置 | 原配置行、201报告、录像/截图、207 |
| N08剧情节点 | 胜首领后完成/跳过10206 | 正常508推进20201资格；不重复普通战斗、不重复奖 | 命令、mission_id、资源、重新登录 |
| N09完整2-1 | 不后台加级/送额外英雄/改怪，按原引导走到20201 | 获得原应得队伍与资源；敌阵为原4名NPC；正常操作可按原玩法继续，不能强制固定胜利 | 从创角连续录像、全请求、双方属性/技能、存档 |
| N10合法失败 | 选原规则允许的较弱阵容败北 | 不前进、不领胜利奖；体力与退出按原证据，敌方战力按原规则显示 | 真失败UI、FightID、各队power、结算与余额 |
| N11引导恢复 | 领奖前/后、上阵前、战斗前/后、207前/后中断 | 恢复正确检查点，未发可领、已发不重发，无永久遮罩/点击锁 | 每个断点的录屏/日志、guides/module16 |
| N12名人堂边界 | 等级31/32/33×开服日1/2/3；重登/在线升级；1级旧档 | 原条件≥32级且开服日≥2并满足模块开关；1级不触发后期引导，不破坏1054等7000确认 | 触发配置/脚本、功能位、Guide/实际表单序列 |
| N13已有坏档 | 复制实际受影响存档，先出修复预览再执行两遍 | 仅补合法缺失和相关同步，正常英雄养成/订单保留，第二遍无新增 | 备份hash、表级差异、幂等记录、APK重登 |

N09不能简化为“模拟器跑赢一次”。要核玩家确实得到原流程所有奖励，敌方不是被削弱的替代阵容，并能在重登后继续下一节点。也不能要求所有合法队伍必胜，原游戏允许失败。

## 5. 战斗与属性验收

| 用例 | 核对内容 |
| --- | --- |
| B01固定敌阵 | 改变玩家等级/成员后，同关敌人保持原模板，除有明确原版动态规则的模式 |
| B02分片完整 | Fight105/201/304/403/410和固定攻方引用可解析；未知分片报精确缺口 |
| B03属性与战力 | 显示属性→actor→fight映射、定点与取整；面板/1316/战报/敌方结果页对应 |
| B04技能门槛 | 同英雄低突破、高突破、星级/专精/魂切换，只有合法技能进入战斗 |
| B05防御通道 | 物防与法防不同的对照对象验证通道，不能平均后仍视为原版 |
| B06事件 | 伤害/治疗/盾/怒气/状态/死亡/复活/追击的模拟与回放每步一致 |
| B07多队与结果 | 队伍次序、场次、胜负/超时/平局原规则，实际战力不写0填空 |
| B08幂等与中断 | 重复207、202、重连、重启、编码/数据库失败不重复消耗或发奖 |

## 6. 经济、活动和多人验收

| 范围 | 代表场景与硬性预期 |
| --- | --- |
| 养成 | 单次/批量、门槛前后、材料不足、上限、重置；正确归属/成本/技能/属性与重登 |
| 任务 | 真实事件推动、重复事件不重复累计、首通与正在挑战区分、组奖与个人奖独立 |
| 招募 | 固定随机点逐段命中候选/权重，保底前一抽/触发抽/重置、多抽顺序、心愿与限定排除 |
| 商店 | 日/周/期/终身限购、刷新、自选、额外购买、一键子礼包、关闭期与重试 |
| 商品付费 | 钱包/券/混合付款、资格、商品价/奖励/限购、1900/16003、订单和特权一次性 |
| 代金券例外 | 发行/未领/领取/过期/使用、张数与分、混合付款和全账本对账 |
| 时间 | 04:59:59/05:00、23:59:59/00:00、周日/周一、18:00/午夜开服、跨年 |
| 活动 | start前/正好start/end前/正好end，全部原阶段、在线推送、重登、新期与累计迁移 |
| 结算 | 排名冻结、邮件与marker同事务、失败重跑、服务重启补跑、不重复奖或清错货币 |
| 多人 | 真实A/B账户、不同服/不同公会、重复与并发请求、职权、匹配取消和对象共享 |
| 排行 | 真实数据、空榜、个人榜外、同分、跨期、跨服scope、冻结榜与发奖 |

## 7. 原子性故障注入

对关键奖励/购买/养成/结算，在临时库模拟：资源处理器拒绝、PB编码抛错、SQLite触发器ABORT、提交后推送失败。前3种必须全笔回滚；最后一种保留已提交业务，通过重试/重登补同步，不能回滚后再次发奖。

使用现有有意义的测试并补原版预期；不要写仅镜像实现的“0.88算得对”来证明关卡正确。测试数据需要能独立追到原始表/脚本，避免同一个错误解析器同时产生实现与预期。

## 8. 发布退出标准

每个修复条目附：规则来源/哈希、代码差异、旧/新行为、专项与链路结果、存档差异、APK场景与版本、发布commit/备份与发布后验证。缺少真实客户端失败界面就不能关闭FID-004；仅恢复名人堂门槛但未定位并复验1级弹窗，不能关闭FID-005；没有全程APK新号验证就不能关闭FID-003。

有来源明确的局部完成可以交付并标其边界，未取证和未实现项继续留表。只有全部原版可达流程、数值与运营规则通过相应验收，才能宣称1:1；代金券系统单独按定制规则验收。
