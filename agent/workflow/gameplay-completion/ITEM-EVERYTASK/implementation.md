# ITEM-EVERYTASK 实现记录（2026-11-07）

## 范围

- 分支：`task/ITEM-EVERYTASK-20261106`
- 基线：`a5300de`
- 分支 worktree：`.worktree/gameplay-20261106/item-everytask`
- 本任务实现 `EveryTaskCmd` 的 7 条 ETF 命令：`9000/9002/9003/9006/9007/9008/9009`。
- 未启动、停止或点击实时服务/客户端，未操作 ADB、模拟器或运行库。

## 静态证据

- APK 反编译的 `EveryTaskCmd` 常量把 7 个 type 分别映射为 `req_finish_daily_task`、`req_finish_main_task`、`req_get_daily_active_reward`、`req_finish_all_daily_task`、`req_finish_all_main_task`、`req_finish_weekly_task`、`req_finish_all_weekly_task`。
- `ModuleTable` 把登录模块 `91` 映射为 `EveryTaskMgr`；模块 `90` 是另一套 `CommonTaskMgr/LinearTask`，本任务没有把两者混用。
- 协议定义来自 `personal-server/assets/protobuf/task.net.proto.bin` 和 `task.db.proto.bin`：
  - 日常、主线、周常响应分别为 `daily_receive_back`、`main_receive_back`、`weekly_receive_back`。
  - 登录槽位按 seed 数据解释为 `[daily, main, weekly]`，对应下标 `[0, 1, 2]`。
  - daily/weekly 使用 `finish_tid_list` bitmap；daily 另有 `vitality`、`vitality_stage` 和 `refresh_time`；main 使用 `task_list`。
- `TaskTable.data.lua.json` 提供 `DailyTask`、`WeeklyTask`、`MainTask`、`DailyTaskVitality`、`DailyTaskOffsetGroup`。
- 已覆盖的权威进度来源：
  - `TaskType.progress_type=2` 的角色统计，由登录模块 `21` 和 `CountStatisticsTable` 定位；日任务 `1002`、周任务 `4702` 使用该路径。
  - `TaskType=1201` 的主线 cursor，读取登录模块 `8` 的 `mission_id`。
  - `TaskType=5901/progress_fun=155` 的命途阶段，读取登录模块 `107` 的 `cur_stage`。
- seed 的 daily/weekly `refresh_time` 表明边界为 `05:00 Asia/Shanghai`。服务把该边界表示为 UTC 21:00 的 epoch 日界，周常按本地周一重置。

## 服务行为

- 新增 `personal-server/game/every-task-service.mjs`。
- 新增幂等 SQLite 表：

```sql
every_task_claims(role_id, scope, period_key, task_id, claimed_at,
  PRIMARY KEY(role_id, scope, period_key, task_id))
```

- `scope` 为 `daily/main/weekly/daily_active`；日、周以周期起点字符串隔离，主线使用一次性的 `main` 周期。
- 单任务领取只接受当前开放且进度达标的任务；重复领取返回 `310`，未完成返回 `5`。
- 一键领取按表中的 `sortOrder` 处理当前开放任务，跳过已领取、未完成或尚无可信进度函数的任务；至少可领取的任务会正常结算。
- 日常活跃奖励按已领取日任务累加 `vitality`，检查阶段阈值和重复领取位，再发奖。
- 领取记录、资源和登录模块在同一 `store.transaction` 内写入；回包编码失败或 SQLite 插入失败会整体回滚。
- `ensureLoginState()` 在登录时从 SQLite 领取记录重建模块 `91`，保留原槽位中的其他字段，因此重登和进程重启后领取位、活跃值和主任务列表可恢复。
- gateway 在现有 linear-task `9010` 路由之后加入精确保护的 every-task 分派；单任务读取一个 ETF 标量，一键任务只接受空参数或 ETF 空列表。

## 配置与代码入口

- `personal-server/config/game-tables.mjs`：加载 `DailyTask`、`WeeklyTask`、`MainTask`、`DailyTaskVitality`、`DailyTaskOffsetGroup`。
- `personal-server/game/task-service.mjs`：导出既有 `currentTaskProgress`，共享统计、主线 cursor 和命途阶段读取逻辑；原 `9010` 调用保持回归。
- `personal-server/game/every-task-service.mjs`：7 条命令、周期、进度、领取、发奖和模块 91 重建。
- `personal-server/game/gateway.mjs`：服务初始化、登录同步和命令分派。
- `personal-server/test/item-everytask-service.test.mjs`：专项测试。

## 验证

- `node --check personal-server/game/every-task-service.mjs`
- `node --check personal-server/game/gateway.mjs`
- `node --check personal-server/test/item-everytask-service.test.mjs`
- `node --test test/item-everytask-service.test.mjs`：`8/8` 通过。覆盖未完成/重复领取、日/周/主线进度、一键部分领取、活跃阈值、跨期重置、非法参数、编码/SQLite 回滚、真实 framed TCP 与重登模块 91。
- `node --test test/task-service.test.mjs`：`19/19` 通过。
- `node --test test/gameplay-gateway.test.mjs`：`6/6` 通过。
- `npm test`：`2092` 项，`2089` 通过，`3` 失败。失败均为基线已有的 `login-business-reads.test.mjs` 需要 worktree 中不存在的 `analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite`；本次新增测试在整套运行中全部通过。

## 明确缺口

- 已实现的进度函数只覆盖统计 `progress_type=2`、主线 cursor `1201` 和命途阶段 `5901/155`。其他日/主线任务类型在单任务请求中会明确报错，在一键请求中会跳过，不能视为已实现。
- `DailyTaskVitality.value` 当前生成数据只有首档 `200`；服务按客户端 4 个位图阶段推断等距的 `200/400/600/800`。proto 注释提到 5 个阶段，现有生成表没有足够证据确定第五档，后续必须用真实客户端或更完整配置校正。
- `dynamic_award`、角色经验奖励、weekend bonus/accumulation、任务事件等日任务子分支尚未实现；当前只发放静态 `award`。
- 未确认客户端一键领取在没有可领取任务时期望成功空回包、业务错误还是特定状态包。
- 主线 `task_list` 当前按已领取任务重建；尚未取得活动任务、当前节点和完整客户端列表顺序的运行时证据。
- 尚未做真实 APK 点击、视觉回包检查或服务部署验收。上述组件/临时 TCP 结果不能标记为客户端可玩验收。
