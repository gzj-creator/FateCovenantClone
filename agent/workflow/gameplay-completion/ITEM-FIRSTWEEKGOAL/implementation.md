# ITEM-FIRSTWEEKGOAL 实施记录

日期：2026-11-07
分支：`task/ITEM-FIRSTWEEKGOAL-20261106`
基线：`main@ce73450`

## 结论

已接通数字命令 `67004 req_first_week_goal_progress_award` 与 `67005 req_first_week_goal_task_award` 的登录快照、ETF 请求、权威领取状态、资源发放、SQLite 防重和 PB 回包。临时 TCP 已通过实际握手与 `909103` 登录验证，登录模块 `59015` 和直接回包读取同一领取状态。

可证任务进度来源目前是现有 `TaskType.progress_type=2` 统计任务路径。首周目标其余 `progress_type=1/3` 的进度回调没有统一生产事件实现；这些任务领取返回业务错误 5 和具体 `progress is unavailable` 原因，不会按固定进度放行。该项仍需后续按 `TaskType.progress_fun` 补齐，因此本记录不把全部首周任务标成可领。

## 配置与协议依据

- `personal-server/assets/protobuf/first_week_goal.net.proto.bin`：`pb_first_week_goal_back { info, res }`。
- `personal-server/assets/protobuf/first_week_goal.db.proto.bin`：进度领取位、任务领取位、挑战结算字段。
- `FirstWeekGoalTable` 共 `Task=326`、`Const=5`、`FirstWeekGoal=35` 行，已收纳为 `personal-server/assets/tables/FirstWeekGoalTable.data.lua.json.gz` 并由配置读取器校验。
- `ActivityTable` 的 `func=46` 行绑定配置版本：`46001 -> v1`、`46002 -> v2`、`46003 -> v5`、`46004 -> v4`。周期键由活动 ID、服务器日窗口起止组成，跨周期不会复用领取位。
- `ModuleTable` 中活动模块 `92027` 登录容器指向 `59015`；登录与 TCP 测试均验证该槽位。
- 进度档奖励取 `FirstWeekGoal.award/award_n`；任务奖励取 `Task.award_list`；分数物品取对应版本 `Const.score`，进度门槛取 `need_score`，分数只由已领取服务端任务奖励累计。

## 实现

- 新增 `personal-server/config/first-week-goal-tables.mjs`：严格校验表行数、ID、奖励和任务引用，建立版本、进度档和任务索引。
- 新增 `personal-server/game/first-week-goal-service.mjs`：
  - 按服务器开服时间和 Activity 配置选择当前版本及周期。
  - `67004/67005` 支持单 ID、ID 列表和空请求领取全部当前可领项。
  - 非法、重复、未达成、已领取、周期过期和选择型奖励分别返回业务错误。
  - 领取位、资源变化、登录状态和 PB 回包在同一 `store.transaction` 内提交；编码或 SQLite 失败整体回滚。
  - `first_week_goal_claims` 使用角色、周期、类型、条目四元主键持久防重。
- `personal-server/game/gateway.mjs` 增加服务实例、`59015` 登录同步和精确数字类型派发，保留 `main` 已有各服务派发路径不变。

## 验证

执行：

```powershell
node --test personal-server/test/item-firstweekgoal-service.test.mjs personal-server/test/item-firstweekgoal-gateway.test.mjs personal-server/test/gameplay-gateway.test.mjs
```

结果：`14/14` 通过。覆盖：

- 统计任务按真实状态达成，配置资源和分数正确发放。
- `67004` 分数门槛、`67005` 单领/一键领取、重复领取和非法 ID。
- 多 ID 遇到已领取项时整批拒绝，资源和领取位均不变。
- 活动窗口外拒绝且登录快照为空。
- PB 编码异常和 SQLite `RAISE(ABORT)` 时资源与领取位回滚。
- SQLite 关闭重开后领取位仍有效。
- 临时 TCP 实际握手、`909103` 登录、登录模块 `59015`、数字 `67004/67005` 请求和 PB 回包。

未执行实时服务、模拟器、ADB、运行数据库改动或 APK/UI 验收；这些不属于本任务阶段。

## 剩余证据

首周目标任务涉及的 `progress_fun` 回调尚无统一服务端事件定义。当前只有现有统计模块能计算的类型可以领取，其他类型明确拒绝。需从 `TaskType`/Manager 证据继续补齐资源、英雄、战斗、养成等真实进度来源后，才能把整体状态从“证据待补”推进到“服务端完成”。
