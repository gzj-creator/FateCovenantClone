# 执行状态

2026-11-06 建表。2026-11-07 第一轮并行实施与集成验收。

全部 276 个模块任务见 [任务索引](task-index.md)，默认状态均为“待领取”；72 个英雄技能任务见 [技能计划](13-special-skills.md)。下表登记已领取任务和七个共享任务。

| 任务 ID | 状态 | 负责人 / 分支 | 服务 / TCP / SQLite 证据 | APK 验收 | 下一依赖或证据缺口 |
| --- | --- | --- | --- | --- | --- |
| `PAY-ONLINEGIFT` | 服务端完成（PeriodMax 精确语义待补） | `task/PAY-ONLINEGIFT-20261106` | 专项 service 4/4 + 真实握手/TCP 37010 + SQLite 重开 + 编码/SQLite 回滚；`game-store.mjs` 未改 | 未安排 | `PeriodMax` 历史选择规则待客户端对照；其余等待隔离 APK 验收 |
| CORE-BATTLE | 待领取 | — | — | 未安排 | 可按 A/B/C 拆分，统一共享执行器负责人 |
| CORE-ATTR | 待领取 | — | — | 未安排 | 属性公式与所有养成来源 |
| CORE-SKILL-GATES | 待领取 | — | — | 未安排 | 实际养成状态到可用技能的映射 |
| CORE-EVENTS | 待领取 | — | — | 未安排 | 活动阶段、任务统计与结算 |
| CORE-DRAW-POOLS | 待领取 | — | — | 未安排 | 常驻幻武 2 组、神灵 56 组；幻武任务生产配置 |
| CORE-TIME-TEMPLE | 待领取 | — | — | 未安排 | 八个 C2S 编码器的数字命令映射 |
| CORE-CABIN | 待领取 | — | — | 未安排 | 房间/任务/交互/奖励/加速的可达性与协议 |
| HERO-LINEUP | 服务端完成 | `task/HERO-LINEUP-20261106` @ cd3b3ea | 5 专项测试 + 真实 TCP 214→215→216→209→210→217 + 重开 DB；集成分支 30/30 | 未安排 | 217 回包 schema 未恢复（当前 ETF 回显索引）；名称长度上限属推断；214 请求形态待实测 |
| HERO-MASTERY | 服务端完成（战斗接线归 CORE-ATTR/CORE-SKILL-GATES） | `task/HERO-MASTERY-20261106` @ 1afea74 | 5 专项测试 + 真实 TCP 660→659 + 故障回滚 + 重开 DB；合并后全量 2164/2164 | 未安排 | 659/660 请求仅确认含 tid；未突破时等级上限与技能解锁规则待实测；精通属性与技能尚未进入战斗 |
| ITEM-SHOP | 服务端完成 | `task/ITEM-SHOP-20261106` @ 3ac6f3c | 15 专项测试 + 真实 TCP 1202→1203→1202 + 重开 DB；集成分支 26/26 | 未安排 | 1202–1205/1207/1208 ETF 请求形态待录制；1205 wipe 语义未取证；结算 data 布局未知；无刷新价格表 |
| ITEM-ITEM | 服务端完成（153/157 证据阻塞） | `task/ITEM-ITEM-20261106` @ c3e2df7 | 9 专项测试 + 真实 TCP 156/158/154 成功、153/157 返回 code 5；集成分支 47/47 | 未安排 | 153 本版本不可达（BoxRepeat 0 行、无 type=85 物品、module 54 空）；157.lottery_list 无奖池表；保底登录槽位未定位；MatchHeroChip 无奖励 handler |
| ITEM-EVERYTASK | 服务端完成（部分进度/奖励证据阻塞） | `task/ITEM-EVERYTASK-20261106` @ 9139333 | 8 专项测试 + 真实 TCP 9000 + 重登 module 91 + 跨期重置 + 故障回滚；冲突相关 35/35；合并后全量 2172/2172 | 未安排 | 日/主/周任务仅覆盖统计 progress_type=2、主线 cursor=1201、命途 5901/155；活跃档 200/400/600/800 为缺表推断；dynamic_award、周末加成与任务事件源未实现 |
| ITEM-MISSION | 服务端完成（509 common_task、512 boss 证据阻塞） | `task/ITEM-MISSION-20261106` @ 42b358e | 10 专项测试 + TCP 504/505/511/509 + 重开 DB；集成分支 63/63 | 未安排 | module 8 meal 槽位未确认；EnergyConst period/rate/limit 语义待原服对照；509 common_task_tids 无进度来源；512 无 Boss 通关写入路径 |
| BATTLE-PEAKTOWER | 服务端完成（部分证据阻塞） | `task/BATTLE-PEAKTOWER-20261106` @ 83b784f | 12 专项测试 + 真实 TCP 1103/1112 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 1104 跨日重置配置未恢复；1109 限购/折扣语义；1112 回包 schema 未恢复；塔战斗仍依赖缺失的 FightTable 与通用派发 |
| BATTLE-RANK | 服务端完成（部分榜单事件/赛季结算阻塞） | `task/BATTLE-RANK-20261106` @ e1230b3 | 7 专项 + 真实 TCP、既有 rank 回归 41/41 + 重开 DB + 编码/SQLite 回滚；合并后全量 2171/2171 | 未安排 | 真实生产来源当前覆盖角色等级、主线、英雄星级、本地战力、尖塔；其余榜单缺所属模块事件；赛季冻结/邮件最终奖励与 2003/2004 部分数字绑定待证据 |
| BATTLE-GENERALDUNGEON | 服务端完成（事件规则部分证据阻塞） | `task/BATTLE-GENERALDUNGEON-20261106` @ a9e5718 | 7 专项测试 + 真实 TCP 78101–78107 + 重开 DB + 编码/claim 故障回滚；独立复核 37/37；合并后全量 2178/2178 | 未安排 | 宝箱与道具事件已闭合；战斗、抽取、Buff、对话、条件/跨层事件和额外数据仍待证据，当前逐类型明确拒绝 |
| ITEM-COMMONTASK | 服务端完成（奖励/爬塔进度证据阻塞） | `task/ITEM-COMMONTASK-20261106` @ 321655f | 7 专项测试 + 同组列表事务 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 四张组表 2774 行奖励列为空；progress_fun 12 无爬塔状态来源；module 90 线性槽位从 0 修正为 4，需 APK 联合验收 |
| ITEM-GUIDE | 服务端完成（奖励配置证据阻塞） | `task/ITEM-GUIDE-20261106` @ 042be27 | 9 专项测试 + 真实 TCP 8000→8001→8002 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | GuideTable 无 JSON 导出，生产 8001 对所有 awardTid 返回 code 5；8001 参数位置与 8002 不回帧均待 APK 实测 |

## 集成与验收记录（2026-11-07 第一轮）

- 集成分支：`gameplay/integration-20261107b`（基于含 207 体力、邮件推送和活动登录期限修复的 main `7b5af58`），已以 `--no-ff` 合入 main `7750864`。
- 已合并：HERO-LINEUP、ITEM-SHOP、ITEM-ITEM、ITEM-GUIDE、BATTLE-PEAKTOWER、BATTLE-RANK、BATTLE-GENERALDUNGEON、HERO-MASTERY、ITEM-MISSION、ITEM-COMMONTASK、ITEM-EVERYTASK。手工冲突重点处理了 `gateway.mjs` 双派发、ITEM-MISSION 对 module 8 体力槽的保留，以及 ITEM-COMMONTASK 的 module 90 通用组 0–3 / 线性组 4 槽位。
- 主线保持审计：`main` 是集成分支的严格祖先，`HEAD..main` 为空；`energy.mjs`、`mission-progress.mjs`、`resources.mjs`、`game-store.mjs`、`mail-service.mjs`、`activity-calendar.mjs`、`relic-divine-login.mjs` 与 main 原实现一致。207 结算/体力、新邮件推送、ActFrame/fishing 登录期限的定向回归 74/74 通过。
- ITEM-EVERYTASK 已 rebase 到含首批任务的 main；保留 `createItemBoxService({ ..., heroTables })`、207 体力、邮件推送、活动期限及 module 90 槽位语义，冲突相关 35/35 通过，再以 `--no-ff` 合入 main `77c5b5f`。BATTLE-RANK 已基于该主线完成并把原空榜替换为 SQLite 权威排序，以 `--no-ff` 合入 main `7713406`；独立复核 41/41，通过后 main 全量 2171/2171。BATTLE-GENERALDUNGEON rebase 时只与总控状态表冲突，保留总控版本，代码与 BATTLE-RANK 网关派发共存；独立复核 37/37，以 `--no-ff` 合入 main `e406136`，合并后全量 `node --test --test-concurrency=1 test/*.test.mjs`：tests 2178 / pass 2178 / fail 0。日志：`analysis/test-runs/gameplay-20261106/main-after-general-dungeon-full.log`。
- 当前没有启停实时服务、操作模拟器、读写 `runtime.local-only.data` 或生成 APK；上表“服务端完成”均只表示业务、临时 TCP、SQLite 与回归层通过，APK 验收仍单列。
