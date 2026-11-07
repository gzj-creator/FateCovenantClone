# 执行状态

2026-11-06 建表。2026-11-07 第一轮并行实施与集成验收。

全部 276 个模块任务见 [任务索引](task-index.md)，默认状态均为“待领取”；72 个英雄技能任务见 [技能计划](13-special-skills.md)。下表登记已领取任务和七个共享任务。

交付与整卡销项分开计数：当前 16 个模块任务、2 个共享任务已有玩法实现交付合入 main，共 18 项，其中包括部分交付和证据待补项。另行提交的配置审计、测试或未知业务拒绝，不当作新增玩法完成。完整分母为 276 个模块 + 7 个共享 + 72 个英雄技能 = 355 项；18/355 约 5.1% 仅表示已有实现交付的任务占比，不表示工作量或完整玩法完成率。尚无任务进入仅待 APK 验收队列。

2026-11-07 换 session：已保存[总控续接提示词](../../../promot/2026-11-07-remaining-gameplay-handoff.md)。CORE-BATTLE-A 与 SOC-FRIEND 已各自在独立分支提交 checkpoint 并停止本轮扩展，未合 main；下一 session 先续接，不把 WIP 或证据提交算作完成。

| 任务 ID | 状态 | 负责人 / 分支 | 服务 / TCP / SQLite 证据 | APK 验收 | 下一依赖或证据缺口 |
| --- | --- | --- | --- | --- | --- |
| PAY-ONLINEGIFT | 服务端完成（PeriodMax 精确语义待补） | `task/PAY-ONLINEGIFT-20261106` @ 4078f6e | 4 专项 + 真实握手/TCP 37010 + SQLite 重开 + 编码/SQLite 回滚；`game-store.mjs` 未改；合并后全量 2190/2190 | 未安排 | `PeriodMax` 历史选择规则待客户端对照；当前按服务器 05:00 日号映射配置周期；APK 验收待安排 |
| CORE-BATTLE | 实施中（A 已存 WIP，待新 session 续接） | `task/CORE-BATTLE-A-20261107` @ ffd0ab7；未合 main | 基线 e90ef1e；worktree core-battle-a 干净；新增专项10/10；完整回归/生产TCP/SQLite未验收 | 未安排 | 先复核phase与actionType对附加伤害范围；实际伤害转治疗/护盾及消费仍待生产验证；heal报告缺证归C；不能合WIP销项 |
| CORE-ATTR | 服务端完成（属性查询/战力/普通副本战斗同源；装备等养成来源待扩展） | `task/CORE-ATTR-20261106` @ ec41751 | 4 专项 + 真实 TCP 1316 + SQLite 重开；mission/rank/lineup/equip 等联合回归 66/66；合并后全量 2219/2219 | 未安排 | 逐级成长分母、战力权重、1316 attr_list play_type、1314 回包、NpcAttr 外部数据、速度表均未取证；装备/团长装备/图鉴/好感/法阵/符文/圣器尚未汇入 |
| CORE-SKILL-GATES | 证据待补（已合入 AbilityLevel/mastery/soul 部分实现） | b87b99d；复核修复 e05533d/60b7ab7 | 专项累计 10/10；复核聚焦 37/37；总控技能/奖池/TCP 17/17；最终主线全量 2234/2234；mission 与 1316 共用 loadout；未改 gateway/game-store | 未安排 | 通用 Passive 突破筛选和每级倍率未完成；可达英雄 4040101 缺技能目录；AbilityLevel 索引与 mastery 完整选择/替换待证，不能认定整卡完成 |
| CORE-EVENTS | 证据待补/部分交付（53001/53002 未知推进拒绝） | `task/CORE-EVENTS-20261106` @ db2daa7；合入13231a4 | 真实临时 TCP 验证已证 ETF shape、坏编码/未知规则错误码及 module92/183 不变；相关回归 100/100；无迁移 | 未安排 | 三次 53001 空成功不能证明转换规则；53002 请求字段、53006 参数、状态枚举、任务函数/周期统计及结束结算仍待恢复；[交付记录](../../../agent/workflow/gameplay-completion/CORE-EVENTS/implementation.md) |
| CORE-DRAW-POOLS | 证据待补；已有圣器生产路径复核通过 | `task/CORE-DRAW-POOLS-20261106` @ be514bb；合入7599ef8 | 无奖励 resolver 注入：14 圣器版本正常/保底与 SQLite 重开；38 神灵版本和226无变更拒绝；真 TCP 601→7001、88932；相关回归102/102；最终主线全量2234/2234；静态配置报告与7资产SHA256见 implementation.md | 未安排 | 226的60101/60102及神灵56组lib_range为空；多心愿/替换阶段与神灵心愿/重置规则待证据；Fantasy Task 0行，不能推断当前版本无入口 |
| CORE-TIME-TEMPLE | 待领取 | — | — | 未安排 | 八个 C2S 编码器的数字命令映射 |
| CORE-CABIN | 待领取 | — | — | 未安排 | 房间/任务/交互/奖励/加速的可达性与协议 |
| SOC-FRIEND | 实施中（证据 checkpoint 已存，业务未实现） | `task/SOC-FRIEND-20261107` @ 75dcdc7；未合 main | 基线 e90ef1e；worktree soc-friend 干净；仅3个证据/实施记录与脚本文件；脚本复现通过，无业务服务/接入/测试 | 未安排 | 先核历史Lua与当前资产版本对应；数字登录槽、日界、赠礼奖励/好感仍未知；申请/双向关系/领取等独立服务与总控接入均待实现 |
| HERO-LINEUP | 服务端完成 | `task/HERO-LINEUP-20261106` @ cd3b3ea | 5 专项测试 + 真实 TCP 214→215→216→209→210→217 + 重开 DB；集成分支 30/30 | 未安排 | 217 回包 schema 未恢复（当前 ETF 回显索引）；名称长度上限属推断；214 请求形态待实测 |
| HERO-HERO | 服务端部分完成（本小批 614/647/663/664/665） | `task/HERO-HERO-20261106` @ ead0359 | 专项与 gateway 回归 16/16 + 真实 TCP 五命令 + 模块 10 槽位 5 + SQLite 重开 + 编码回滚；合并后全量 2206/2206 | 未安排 | 剩余 602/627–631/634/635/637/641/651/652/654/656/661/666/672/673；Visit 品质映射、锁价比例、custom_tid 与 HeroErr 线上码待证据；重铸属性归 CORE-ATTR/CORE-SKILL-GATES |
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
