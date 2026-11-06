# 执行状态

2026-11-06 建表。2026-11-07 第一轮并行实施与集成验收。

全部 276 个模块任务见 [任务索引](task-index.md)，默认状态均为“待领取”；72 个英雄技能任务见 [技能计划](13-special-skills.md)。下表登记已领取任务和七个共享任务。

| 任务 ID | 状态 | 负责人 / 分支 | 服务 / TCP / SQLite 证据 | APK 验收 | 下一依赖或证据缺口 |
| --- | --- | --- | --- | --- | --- |
| CORE-BATTLE | 待领取 | — | — | 未安排 | 可按 A/B/C 拆分，统一共享执行器负责人 |
| CORE-ATTR | 待领取 | — | — | 未安排 | 属性公式与所有养成来源 |
| CORE-SKILL-GATES | 待领取 | — | — | 未安排 | 实际养成状态到可用技能的映射 |
| CORE-EVENTS | 待领取 | — | — | 未安排 | 活动阶段、任务统计与结算 |
| CORE-DRAW-POOLS | 待领取 | — | — | 未安排 | 常驻幻武 2 组、神灵 56 组；幻武任务生产配置 |
| CORE-TIME-TEMPLE | 待领取 | — | — | 未安排 | 八个 C2S 编码器的数字命令映射 |
| CORE-CABIN | 待领取 | — | — | 未安排 | 房间/任务/交互/奖励/加速的可达性与协议 |
| HERO-LINEUP | 服务端完成 | `task/HERO-LINEUP-20261106` @ cd3b3ea | 5 专项测试 + 真实 TCP 214→215→216→209→210→217 + 重开 DB；集成分支 30/30 | 未安排 | 217 回包 schema 未恢复（当前 ETF 回显索引）；名称长度上限属推断；214 请求形态待实测 |
| ITEM-SHOP | 服务端完成 | `task/ITEM-SHOP-20261106` @ 3ac6f3c | 15 专项测试 + 真实 TCP 1202→1203→1202 + 重开 DB；集成分支 26/26 | 未安排 | 1202–1205/1207/1208 ETF 请求形态待录制；1205 wipe 语义未取证；结算 data 布局未知；无刷新价格表 |
| ITEM-ITEM | 服务端完成（153/157 证据阻塞） | `task/ITEM-ITEM-20261106` @ c3e2df7 | 9 专项测试 + 真实 TCP 156/158/154 成功、153/157 返回 code 5；集成分支 47/47 | 未安排 | 153 本版本不可达（BoxRepeat 0 行、无 type=85 物品、module 54 空）；157.lottery_list 无奖池表；保底登录槽位未定位；MatchHeroChip 无奖励 handler |
| ITEM-EVERYTASK | 实施中 | `task/ITEM-EVERYTASK-20261106` | 待交付 | 未安排 | 9000/9002/9003/9006/9007/9008/9009 未路由 |
| ITEM-MISSION | 实施中 | `task/ITEM-MISSION-20261106` | 待交付 | 未安排 | 504/505/509/510/511/512 未路由；503 随机扫荡奖励仍拒绝 |
| BATTLE-PEAKTOWER | 待领取 | 已建 worktree `.worktree/gameplay-20261106/battle-peaktower`（分支 `task/BATTLE-PEAKTOWER-20261106`），并行槽位满未派发 | — | 未安排 | 1103/1104/1109/1110/1111/1112 完全未路由 |

## 集成与验收记录（2026-11-07 第一轮）

- 集成分支：`gameplay/integration-20261107`（基于 main `a5300de`），worktree `.worktree/gameplay-20261106/integration`。
- 已合并：HERO-LINEUP（cd3b3ea）、ITEM-SHOP（3ac6f3c）、ITEM-ITEM（c3e2df7）；三次合并均自动合并，仅 `gateway.mjs`（新增 import/服务实例/派发块）与 `test/gameplay-gateway.test.mjs` 需要 auto-merge，无手工冲突。
- 合并后按任务重跑专项：`test/item-item-service`、`test/item-box-service`、`test/item-suit-box`、`test/item-shop-service`、`test/gameplay-gateway` 合计 47/47；`test/item-shop-service` + `gameplay-gateway` + `hero-lineup-service` 合计 26/26；`hero-lineup-service` + `gameplay-gateway` + `hero-progression` 合计 30/30。
- 合并后全量 `node --test --test-concurrency=1 test/*.test.mjs`：tests 2104 / pass 2101 / fail 3；三个失败均为 `test/login-business-reads.test.mjs` 依赖缺失的本地证据库（`analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite`，gitignore 未分发），与 main 基线（2084/2081/3）同源，非本轮回归。日志：`analysis/test-runs/gameplay-20261106/integration-round1.log`。
- main 分支未直接改动：主工作区当前存在另一路未提交改动（mission-fight-service.mjs、game-store.mjs、mission-progress.mjs 等），本轮的集成只落在 `gameplay/integration-20261107`，待与主线改动合流时再统一验收。
