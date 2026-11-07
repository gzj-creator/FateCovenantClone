# 执行状态

2026-11-06 建表。2026-11-07 第一轮并行实施与集成验收，同日第二轮续接 CORE-BATTLE-A、SOC-FRIEND 并新增 PLAY-FISHINGACT。

全部 276 个模块任务见 [任务索引](task-index.md)，默认状态均为“待领取”；72 个英雄技能任务见 [技能计划](13-special-skills.md)。下表登记已领取任务和七个共享任务。

交付与整卡销项分开计数：当前 23 个模块任务、3 个共享任务已有玩法实现交付合入 main，共 26 项，其中包括部分交付和证据待补项。另行提交的配置审计、测试或未知业务拒绝，不当作新增玩法完成。完整分母为 276 个模块 + 7 个共享 + 72 个英雄技能 = 355 项；26/355 约 7.3% 仅表示已有实现交付的任务占比，不表示工作量或完整玩法完成率。尚无任务达到“全部证据闭合、只差 APK 操作”的整卡状态。

2026-11-07 第二轮：CORE-BATTLE-A 与 SOC-FRIEND 两个 checkpoint 已续接完成并合入 main，另完成 PLAY-FISHINGACT；三者均通过合并后的定向回归与一次主线全量，业务层为“服务端完成”，各自的证据缺口与 APK 验收边界见下表。

| 任务 ID | 状态 | 负责人 / 分支 | 服务 / TCP / SQLite 证据 | APK 验收 | 下一依赖或证据缺口 |
| --- | --- | --- | --- | --- | --- |
| PAY-ONLINEGIFT | 服务端完成（PeriodMax 精确语义待补） | `task/PAY-ONLINEGIFT-20261106` @ 4078f6e | 4 专项 + 真实握手/TCP 37010 + SQLite 重开 + 编码/SQLite 回滚；`game-store.mjs` 未改；合并后全量 2190/2190 | 未安排 | `PeriodMax` 历史选择规则待客户端对照；当前按服务器 05:00 日号映射配置周期；APK 验收待安排 |
| CORE-BATTLE | 服务端完成（A 已合入；B/C 及部分证据待补） | `task/CORE-BATTLE-A-20261107`，A 合入 main | A：通用效果专项 15/15、真实临时 TCP 201/207 证明实际 HP 伤害转治疗（834 伤害→+83）与 SQLite 重开/回滚；合并后战斗/技能/副本定向 127/127。复核修正 phase 泄漏：`actionScopedType()` 使“下一/首次终结技”加成不作用于动作内触发伤害；转换效果（伤害转治疗/护盾）固定后置 | 未安排 | `mission-fight-service.actionList` 未投影 heal 事件，缺 `pb_fat_harm` 治疗 type/prompt 权威证据（归 CORE-BATTLE-C）；精通 `...174` 生产选择依赖 CORE-SKILL-GATES；跨单位触发/命中闪避/反弹与 B 类专有机制未做 |
| CORE-ATTR | 服务端完成（属性查询/战力/普通副本战斗同源；装备等养成来源待扩展） | `task/CORE-ATTR-20261106` @ ec41751 | 4 专项 + 真实 TCP 1316 + SQLite 重开；mission/rank/lineup/equip 等联合回归 66/66；合并后全量 2219/2219 | 未安排 | 逐级成长分母、战力权重、1316 attr_list play_type、1314 回包、NpcAttr 外部数据、速度表均未取证；装备/团长装备/图鉴/好感/法阵/符文/圣器尚未汇入 |
| CORE-SKILL-GATES | 证据待补（已合入 AbilityLevel/mastery/soul 部分实现） | b87b99d；复核修复 e05533d/60b7ab7 | 专项累计 10/10；复核聚焦 37/37；总控技能/奖池/TCP 17/17；最终主线全量 2234/2234；mission 与 1316 共用 loadout；未改 gateway/game-store | 未安排 | 通用 Passive 突破筛选和每级倍率未完成；可达英雄 4040101 缺技能目录；AbilityLevel 索引与 mastery 完整选择/替换待证，不能认定整卡完成 |
| CORE-EVENTS | 证据待补/部分交付（53001/53002 未知推进拒绝） | `task/CORE-EVENTS-20261106` @ db2daa7；合入13231a4 | 真实临时 TCP 验证已证 ETF shape、坏编码/未知规则错误码及 module92/183 不变；相关回归 100/100；无迁移 | 未安排 | 三次 53001 空成功不能证明转换规则；53002 请求字段、53006 参数、状态枚举、任务函数/周期统计及结束结算仍待恢复；[交付记录](../../../agent/workflow/gameplay-completion/CORE-EVENTS/implementation.md) |
| CORE-DRAW-POOLS | 证据待补；已有圣器生产路径复核通过 | `task/CORE-DRAW-POOLS-20261106` @ be514bb；合入7599ef8 | 无奖励 resolver 注入：14 圣器版本正常/保底与 SQLite 重开；38 神灵版本和226无变更拒绝；真 TCP 601→7001、88932；相关回归102/102；最终主线全量2234/2234；静态配置报告与7资产SHA256见 implementation.md | 未安排 | 226的60101/60102及神灵56组lib_range为空；多心愿/替换阶段与神灵心愿/重置规则待证据；Fantasy Task 0行，不能推断当前版本无入口 |
| CORE-TIME-TEMPLE | 待领取 | — | — | 未安排 | 八个 C2S 编码器的数字命令映射 |
| CORE-CABIN | 待领取 | — | — | 未安排 | 房间/任务/交互/奖励/加速的可达性与协议 |
| SOC-FRIEND | 服务端完成（20012/20013 语义与友情点结算证据待补） | `task/SOC-FRIEND-20261107`，合入 main | 20001–20013 全部网关派发；服务专项 15/15 + 真实临时 TCP 13 个 type + SQLite 重开 + PB 编码失败与 `friend_gifts` ABORT 触发器整体回滚；合并后好友/网关回归 35/35 | 未安排 | 数字登录槽未取证（`loginPayload` 已就绪，待总控选定槽位）；`FlushTime.NowDay` 日界为推断（用 serverDayNumber）；`daily_present_rewards` 发放触发点、favors 增量与友情币换算、20012 过滤语义、20013 举报参数与重复规则未知；2200/2202 推送载荷未取证 |
| SOC-MSG | 服务端完成（10508 登录槽与部分二进制载荷待补） | `task/SOC-MSG-20261107` @ a124472；合入 main b4880a9 | 10501–10511 全部有处理路径；新增 `message-service`、消息配置和 `MsgTable.ChannelType` 资产；恢复 1400–1403 推送类型；服务 + 真实临时 TCP 专项 13/13，合并后网关/登录/M5 回归通过 | 未安排 | 10508 payload 已就绪但登录模块数字槽位未取证；1400–1403 的 `sender_bin/extra_bin` 内容未反解；原服消息频控、历史分页与跨服聚合语义待补 |
| PLAY-FISHINGACT | 服务端完成（记录筛选与活动结束结算证据待补） | `task/PLAY-FISHINGACT-20261107`，合入 main | 110303/110304/110306/110307/110308/110309/110310 补齐，110301/110302/110305/110311 保留；新增 `fishing_act_catches` 真实收鱼记录驱动榜/记录；服务+TCP 14/14、网关 7/7（真实 seq 70–82）、合并后钓鱼/活动/网关 28/28；SQLite 重开与编码回滚通过 | 未安排 | 110308 筛选与上限未取证（当前按该活动全部渔获 id 倒序）；活动结束名次结算（HighScoreRank/ScoreRank）未实现；充值 FishBuy 139001/139002 直发鱼竿未接；天气/鱼竿加成与尺寸公式、错误文案映射未对齐 |
| BATTLE-ELITEMISSION | 服务端完成（敌方阵容映射与难度证据待补） | `task/BATTLE-ELITEMISSION-20261107`，合入 main | 87001/87002/87003 保留；201/202/207 分流精英关卡（report.type=6）与 BOSS（114），战报来自真实 `simulateBattle`；真实临时 TCP 87001→201→207 两关 + 越级拒绝 err 5，临时 SQLite 重开后 mission_id/领取位/boss_bin 保持，触发器和结算编码失败整体回滚；合并后定向 55/55 | 未安排 | 敌方阵容需部署注入 `eliteEnemies`（FightTable def_team 全库为空，EliteMission 无 enemy 字段，缺省明确拒绝）；201 预扣与 207 扣体力时点、`Boss.open_server_day`/`need_open_days`、精英难度与 award 可重复性未取证 |
| PLAY-HELPUPACT | 服务端完成（全服聚合与部分周期语义证据待补） | `task/PLAY-HELPUPACT-20261107`，合入 main | 116001 任务奖、116002 阶段奖、116003 发起助力、116004 真实累计次数；`HelpUpActTable` 资产落地，登录数据经模块 92 活动条目下发；专项 8/8（含真实 TCP）、合并后 help-up/活动/网关/m5 37/37；SQLite 重开与整笔回滚通过 | 未安排 | 每次 1 道具/1 次助力、信封抽奖、`cycle_type=1` 日环与周边界为推断；跨角色/跨服“全服”聚合无证据；活动窗口已过期需排期；APK 未验收 |
| PAY-GROUPBUYACT | 服务端完成（全服口径与客户端回包对照待补） | `task/PAY-GROUPBUYACT-20261107`，合入 main | 100601 按已支付订单聚合真实人数并叠加 `HeadCompensate` 补偿人数，100602 同事务校验→发奖→领取位→刷新 module 92；16005 回执追加 flag=93；专项 7/7、合并后 72/72（含真实 TCP 购买→统计→领奖）；SQLite 回滚/重开通过 | 未安排 | `last_refresh_sec` 语义未取原服样本；全服人数口径未与原服回包对照；20 人档在本配置不可达；无到期结算/退款撤销与 `pay_type=0` 现金团购分支 |
| HERO-LINEUP | 服务端完成 | `task/HERO-LINEUP-20261106` @ cd3b3ea | 5 专项测试 + 真实 TCP 214→215→216→209→210→217 + 重开 DB；集成分支 30/30 | 未安排 | 217 回包 schema 未恢复（当前 ETF 回显索引）；名称长度上限属推断；214 请求形态待实测 |
| HERO-HERO | 服务端完成（18 条剩余命令已补齐；多项规则证据待补） | `task/HERO-HERO-20261106` @ ead0359；`task/HERO-HERO-B-20261107` @ d92122b；合入 main eb1b1e1 | B 批 602/627–631/634/635/637/641/651/652/654/656/661/666/672/673 全部有服务路径；专项 100/100、分支全量 2368（pass 2366 / fail 0 / skipped 2），合并后英雄/招募/网关/M5 定向 131/131；真实临时 TCP、SQLite 重开与编码/SQLite 回滚 | 未安排 | 635 `DrawProgAward` 0 行返回 3001；651/652/673 客户端本版本不可达；641 品质/星级/碎片规则为强推断；637 Cell 4–6、654/672 登录/属性影响、629–634 跨角色租借和其他角色登录槽仍缺证据；全部条目未 APK 验收 |
| DRAW-HUNDREDDRAWACT | 服务端完成（保底选择与非英雄星级奖证据待补） | `task/DRAW-HUNDREDDRAWACT-20261107` @ fa2d79d，合入 main | 117001–117005 全部网关派发；从 LuaJIT 资产可复现生成 `HundredDrawActTable`；真实临时 TCP 覆盖五命令，专项 8/8、活动/福利/网关 24/24；消耗/授予/领取位/跑马灯落 SQLite，重开及编码/SQLite 回滚通过 | 未安排 | `GuaranteeWeight` 服务端选择语义未恢复，当前保底按排序后的首个本体奖；宠物/精灵/幻装星级条件与 type-104 技能奖励、部分 target-chip 映射缺证据并 fail closed；APK 未验收 |
| HERO-MASTERY | 服务端完成（技能已由 CORE-SKILL-GATES 接线；属性与完整规则待补） | `task/HERO-MASTERY-20261106` @ 1afea74 | 5 专项测试 + 真实 TCP 660→659 + 故障回滚 + 重开 DB；合并后全量 2164/2164；b6e1766 接入星级/等级门槛与唯一 mastery 技能 | 未安排 | 659/660 请求仅确认含 tid；未突破时等级上限与完整解锁规则待实测；精通属性、每级技能倍率和突破换技能仍未闭合 |
| ITEM-SHOP | 服务端完成 | `task/ITEM-SHOP-20261106` @ 3ac6f3c | 15 专项测试 + 真实 TCP 1202→1203→1202 + 重开 DB；集成分支 26/26 | 未安排 | 1202–1205/1207/1208 ETF 请求形态待录制；1205 wipe 语义未取证；结算 data 布局未知；无刷新价格表 |
| ITEM-ITEM | 服务端完成（153/157 证据阻塞） | `task/ITEM-ITEM-20261106` @ c3e2df7 | 9 专项测试 + 真实 TCP 156/158/154 成功、153/157 返回 code 5；集成分支 47/47 | 未安排 | 153 本版本不可达（BoxRepeat 0 行、无 type=85 物品、module 54 空）；157.lottery_list 无奖池表；保底登录槽位未定位；MatchHeroChip 无奖励 handler |
| ITEM-EVERYTASK | 服务端完成（部分进度/奖励证据阻塞） | `task/ITEM-EVERYTASK-20261106` @ 9139333 | 8 专项测试 + 真实 TCP 9000 + 重登 module 91 + 跨期重置 + 故障回滚；冲突相关 35/35；合并后全量 2172/2172 | 未安排 | 日/主/周任务仅覆盖统计 progress_type=2、主线 cursor=1201、命途 5901/155；活跃档 200/400/600/800 为缺表推断；dynamic_award、周末加成与任务事件源未实现 |
| ITEM-MISSION | 服务端完成（509 common_task、512 boss 证据阻塞） | `task/ITEM-MISSION-20261106` @ 42b358e | 10 专项测试 + TCP 504/505/511/509 + 重开 DB；集成分支 63/63 | 未安排 | module 8 meal 槽位未确认；EnergyConst period/rate/limit 语义待原服对照；509 common_task_tids 无进度来源；512 无 Boss 通关写入路径 |
| BATTLE-PEAKTOWER | 服务端完成（部分证据阻塞） | `task/BATTLE-PEAKTOWER-20261106` @ 83b784f | 12 专项测试 + 真实 TCP 1103/1112 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 1104 跨日重置配置未恢复；1109 限购/折扣语义；1112 回包 schema 未恢复；塔战斗仍依赖缺失的 FightTable 与通用派发 |
| BATTLE-RANK | 服务端完成（部分榜单事件/赛季结算阻塞） | `task/BATTLE-RANK-20261106` @ e1230b3 | 7 专项 + 真实 TCP、既有 rank 回归 41/41 + 重开 DB + 编码/SQLite 回滚；合并后全量 2171/2171 | 未安排 | 真实生产来源当前覆盖角色等级、主线、英雄星级、本地战力、尖塔；其余榜单缺所属模块事件；赛季冻结/邮件最终奖励与 2003/2004 部分数字绑定待证据 |
| BATTLE-GENERALDUNGEON | 服务端完成（事件规则部分证据阻塞） | `task/BATTLE-GENERALDUNGEON-20261106` @ a9e5718 | 7 专项测试 + 真实 TCP 78101–78107 + 重开 DB + 编码/claim 故障回滚；独立复核 37/37；合并后全量 2178/2178 | 未安排 | 宝箱与道具事件已闭合；战斗、抽取、Buff、对话、条件/跨层事件和额外数据仍待证据，当前逐类型明确拒绝 |
| ITEM-COMMONTASK | 服务端完成（奖励/爬塔进度证据阻塞） | `task/ITEM-COMMONTASK-20261106` @ 321655f | 7 专项测试 + 同组列表事务 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 四张组表 2774 行奖励列为空；progress_fun 12 无爬塔状态来源；module 90 线性槽位从 0 修正为 4，需 APK 联合验收 |
| ITEM-GUIDE | 服务端完成（奖励配置证据阻塞） | `task/ITEM-GUIDE-20261106` @ 042be27 | 9 专项测试 + 真实 TCP 8000→8001→8002 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | GuideTable 无 JSON 导出，生产 8001 对所有 awardTid 返回 code 5；8001 参数位置与 8002 不回帧均待 APK 实测 |
| ITEM-RANKACHIEVE | 服务端完成（多数成就事件源证据阻塞） | `task/ITEM-RANKACHIEVE-20261106` @ 9c1a880 | 7 专项测试 + 真实 TCP 43101→rsp/8601 + 模块 170 登录 + 重开 DB + 编码/SQLite 回滚；合并后全量 2190/2190 | 未安排 | 当前仅闭合巅峰塔 500/1000 层与可解析指定英雄拥有共 13 行；其余 71 行缺权威完成值来源并返回 code 5；`finish_award` 发放语义与跨服/公会完成信息待证据 |
| ITEM-GROWTHROAD | 服务端完成（1111–1113 任务进度证据阻塞） | `task/ITEM-GROWTHROAD-20261106` @ 8003e39 | 专项与 gateway 回归 16/16 + 真实 TCP 69001/69002 + 模块 53696 登录 + SQLite 重开 + 编码回滚；合并后全量 2215/2215 | 未安排 | `progress_fun=203/82`（1111–1113）无权威事件来源；ETF 单 tid 形状来自客户端反汇编、未取得实包；`award_new` 选择与过期 `rev_overdue/overdue_award` 语义待原服对照 |
| ITEM-FIRSTWEEKGOAL | 服务端完成（部分进度事件证据阻塞） | `task/ITEM-FIRSTWEEKGOAL-20261106` @ 6155312 | 6 项 service + 真实临时 TCP 67004/67005 + 登录模块 59015 + SQLite 重开 + 编码/SQLite 回滚；网关 14/14；合并后全量 2197/2197 | 未安排 | TaskType.progress_fun=1/3 尚无统一生产事件来源；当前统计源任务可领取，其余明确 code 5，不按固定进度放行 |

## 集成与验收记录（2026-11-07 第一轮）

- 集成分支：`gameplay/integration-20261107b`（基于含 207 体力、邮件推送和活动登录期限修复的 main `7b5af58`），已以 `--no-ff` 合入 main `7750864`。
- 已合并：HERO-LINEUP、ITEM-SHOP、ITEM-ITEM、ITEM-GUIDE、BATTLE-PEAKTOWER、BATTLE-RANK、BATTLE-GENERALDUNGEON、HERO-MASTERY、ITEM-MISSION、ITEM-COMMONTASK、ITEM-EVERYTASK、PAY-ONLINEGIFT、ITEM-RANKACHIEVE。手工冲突重点处理了 `gateway.mjs` 多派发共存、在线礼包登录会话与成就登录同步共存、ITEM-MISSION 对 module 8 体力槽的保留，以及 ITEM-COMMONTASK 的 module 90 通用组 0–3 / 线性组 4 槽位。
- 主线保持审计：`main` 是集成分支的严格祖先，`HEAD..main` 为空；`energy.mjs`、`mission-progress.mjs`、`resources.mjs`、`game-store.mjs`、`mail-service.mjs`、`activity-calendar.mjs`、`relic-divine-login.mjs` 与 main 原实现一致。207 结算/体力、新邮件推送、ActFrame/fishing 登录期限的定向回归 74/74 通过。
- ITEM-EVERYTASK 已 rebase 到含首批任务的 main；保留 `createItemBoxService({ ..., heroTables })`、207 体力、邮件推送、活动期限及 module 90 槽位语义，冲突相关 35/35 通过，再以 `--no-ff` 合入 main `77c5b5f`。BATTLE-RANK 已基于该主线完成并把原空榜替换为 SQLite 权威排序，以 `--no-ff` 合入 main `7713406`；独立复核 41/41，通过后 main 全量 2171/2171。BATTLE-GENERALDUNGEON rebase 时只与总控状态表冲突，保留总控版本，代码与 BATTLE-RANK 网关派发共存；独立复核 37/37，以 `--no-ff` 合入 main `e406136`，合并后全量 2178/2178。PAY-ONLINEGIFT 以 `--no-ff` 合入 main `5ea053c`；ITEM-RANKACHIEVE 再次 rebase 时手工保留 `onlineGift.beginSession()` 与 `rankAchieve.ensureLoginState()` 两条登录路径，独立复核 26/26，以 `--no-ff` 合入 main `13f99a7`。最终 main 全量 `node --test --test-concurrency=1 test/*.test.mjs`：tests 2190 / pass 2190 / fail 0。日志：`analysis/test-runs/gameplay-20261106/main-after-rankachieve-onlinegift-full.log`。
- 当前没有启停实时服务、操作模拟器、读写 `runtime.local-only.data` 或生成 APK；上表“服务端完成”均只表示业务、临时 TCP、SQLite 与回归层通过，APK 验收仍单列。
- ITEM-FIRSTWEEKGOAL 以 `--no-ff` 合入 main `bf5d95b`；独立专项 14/14，合并后 main 全量 2197/2197。网关保留 `onlineGift.beginSession()`、`rankAchieve.ensureLoginState()` 与首周目标模块 59015 三条登录路径，并保留既有数字 type 派发；207 结算/体力、邮件推送与活动期限定向回归 60/60 再次通过。全量日志：`analysis/test-runs/gameplay-20261106/main-after-firstweekgoal-full.log`。
- HERO-HERO、ITEM-GROWTHROAD、CORE-ATTR 依次以 --no-ff 合入 main d375bf6、8979fe5、427f9e5。每次合并前均确认 main 为分支祖先、git diff --check 通过，并逐项检查网关同时保留 onlineGift、rankAchieve、heroExtra、firstWeekGoal、growthRoad 与 1316 属性路由；git diff 未覆盖 207 结算/体力、邮件推送、活动期限或 module8/90 多槽。三次合并后的全量回归依次为 2206/2206、2215/2215、2219/2219。最终日志：analysis/test-runs/gameplay-20261106/main-after-core-attr-full.log。
- CORE-SKILL-GATES 提交 b87b99d 以 --no-ff 合入 main b6e1766。合并前工作区干净、main 为分支祖先、git diff --check 通过；gateway.mjs/game-store.mjs 未变，207 路径仅增加技能 loadout 输入。合并后 npm test 为 2226/2226，fail 0。运行摘要见 analysis/test-runs/gameplay-20261106/main-after-core-skill-gates-summary.md。通用 Passive 的突破筛选和等级倍率仍未实现，整卡状态为证据待补；全量通过不能替代这些业务验收。
- 总控独立技能复核补丁 e05533d/60b7ab7 分别以 --no-ff 合入 7e27826/d252af1：修复显式空技能列表重新加载全目录，以及普通1040201误选metadata占位技能；专项累计10/10。CORE-DRAW-POOLS 的 be514bb 以 --no-ff 合入7599ef8，只提交配置审计与生产路径复核；CORE-EVENTS 的 db2daa7 以 --no-ff 合入13231a4，只落实未知推进拒绝与证据，均不当作新玩法完成。
- 最终 main13231a4 在 personal-server 执行 npm test：tests2234 / pass2234 / fail0 / skipped0，退出0，duration_ms216911.0109。完整日志：analysis/test-runs/gameplay-20261106/main-after-core-skill-events-draw-full.log。技能/生产奖池/TCP单独联合复核17/17也通过；未引入新运行资产或部署依赖。
- 合并保持核对：96d4c18/4ee1f8b/7b5af58均为主线祖先；game-store、energy、mission-progress、mail-service、task-service、activity-calendar与1a15105无差异，gateway保留onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad登录和1316路由。冲突仅发生于总控状态表，逐行保留最新各任务状态后解决；测试期间未变更业务源码。
- 后续已派发 CORE-BATTLE-A 和 SOC-FRIEND，各自独立worktree；SOC-FRIEND另有只读证据辅助。尚无两项代码交付，不计入上述18项；实时服务、运行库和APK仍未操作。

## 集成与验收记录（2026-11-07 第二轮）

- 起点核对：会话开始时 main=1fb6824（仅文档）；会话期间主线被外部推进到 9593baa（合入 fix/daily-discount-acc-recharge-20261107，含 wallet-service/acc-recharge-service 业务改动）与 0c4f84e（v10 APK 文档）。本轮三个分支均以 9593baa 为基线，合并前分别 rebase 到当时最新 main，未覆盖外部业务改动；gateway 合并后逐项核对仍保留 onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad 登录、1316 属性、207 结算/体力、邮件推送与活动期限。
- CORE-BATTLE-A：`aa4a5d8` 系列以 `--no-ff` 合入 main，合并后战斗/技能/副本/网关定向 127/127；独立复核发现 phase 泄漏（终结技加成作用于动作内触发伤害）并已修正，转换效果固定后置；生产路径用真实临时 TCP 201/207、临时 SQLite 重开与 ABORT 触发器回滚验证，834 实际伤害对应 +83 治疗。日志：`analysis/test-runs/gameplay-20261106/main-after-core-battle-a-focused.log`。
- SOC-FRIEND：以 `--no-ff` 合入 main d1701a2；合并后 friend-service/friend-gateway/gameplay-gateway/m5-command-matrix/login-business-reads 35/35 通过，真实临时 TCP 覆盖 13 个 type、SQLite 重开与整体回滚。日志：`analysis/test-runs/gameplay-20261106/main-after-soc-friend-focused.log`。
- PLAY-FISHINGACT：rebase 后以 `--no-ff` 合入 main 3b2d8fa；合并后钓鱼/活动/网关 28/28 通过，真实 TCP seq 70–82、跨活动隔离、重复领奖 310、编码失败回滚。日志：`analysis/test-runs/gameplay-20261106/main-after-fishing-focused.log`。
- 主线全量：在 personal-server 执行 `npm test`，tests 2281 / pass 2279 / fail 0 / cancelled 0 / skipped 2 / todo 0，duration_ms 229348.9777，退出 0。完整日志：`analysis/test-runs/gameplay-20261106/main-after-battle-friend-fishing-full.log`。
- 本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK，也未连接原游戏服务器；三项均未进入 APK 验收，纯服务端改动未生成 APK。

## 集成与验收记录（2026-11-07 第二批）

- 会话期间主线再次被外部推进到 `28a1a53`（合入“普通招募池排除限定英雄”修正）。本批三项均 rebase 到该提交后合并，未覆盖该业务修复。
- PLAY-HELPUPACT 以 `--no-ff` 合入 main `1e6dfe9`；合并后 help-up/activity-read/activity-calendar/gameplay-gateway/m5-command-matrix 37/37 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-play-helpupact-focused.log`。
- BATTLE-ELITEMISSION 先补 `diff --check` 的尾随空行（`ec9ebd7`）再以 `--no-ff` 合入 main `9c554fa`；合并后精英闭环/既有 elite service/主线 201-207/通用效果生产路径/gateway/招募池 55/55 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-elitemission-focused.log`。
- PAY-GROUPBUYACT rebase 时在 `gateway.mjs` 登录活动区手工解决冲突，同时保留 `activityRead.synchronizeHelpUpLogin` 与 `groupBuyAct.synchronizeLogin`，再以 `--no-ff` 合入 main；合并后团购/welfare/购买流/wallet/gateway/精英闭环/help-up 72/72 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-groupbuy-focused.log`。
- 最终主线全量：在 personal-server 执行 `npm test`，tests 2311 / pass 2309 / fail 0 / cancelled 0 / skipped 2 / todo 0，duration_ms 232871.9675，退出 0。完整日志：`analysis/test-runs/gameplay-20261106/main-after-batch2-full.log`。
- gateway 合并后仍保留 onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad/helpUp/groupBuy 登录同步、1316 属性、207 结算/体力、邮件推送、活动期限、20001–20013 好友派发、钓鱼 ETF 参数、精英 201/207 分流与团购 100601/100602；本批未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，未生成 APK。

## 集成与验收记录（2026-11-08 第三批）

- SOC-MSG 以 `--no-ff` 合入 main `b4880a9`。10501–10511 均有处理路径，服务 + 真实临时 TCP 13/13；推送统一 ETF 编码修复随后合入 `cb67348`。10508 登录数字槽、消息频控、跨服聚合和部分二进制载荷仍缺证据。
- HERO-HERO-B 在独立工作树完成 18 条剩余命令，rebase 到 main `8dbceb2` 后以 `--no-ff` 合入 main `eb1b1e1`。分支全量 2368（pass 2366 / fail 0 / skipped 2），主线英雄/招募/网关/M5 定向 131/131。网关逐行保留既有登录同步和派发，招募服务仅移除 651/652/673 的旧空回包占位。
- DRAW-HUNDREDDRAWACT 在独立工作树实现 117001–117005，rebase 后以 `--no-ff` 合入 main `354e1ca`。专项 8/8，活动/福利/真实网关 24/24，logical table 资产生成可复现；SQLite 重开、PB 编码失败和 SQLite 写入失败均验证整笔回滚。保底权重选择和非英雄星级奖仍明确列为证据缺口。
- 三项都没有进入 APK 验收。本轮未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

2026-11-07 第二批后换 session：续接提示词已保存为[剩余玩法计划下一 session](../../../promot/2026-11-07-remaining-gameplay-next-session.md)。main=b5a44f0；
下一批工作树 `hero-hero2`（HERO-HERO-B）、`soc-msg`（SOC-MSG）、`draw-hundred`（DRAW-HUNDREDDRAWACT）已创建且无提交，可直接复用；
上一轮中止未产生额外业务改动，不等待旧 agent。
