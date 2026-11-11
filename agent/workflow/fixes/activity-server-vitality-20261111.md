# 通用任务活动 105702：登录与轮询“配置出错”修复记录

日期：2026-11-11
分支：`fix/task-activity-vitality-20261111`（worktree `.worktree/activity-vitality-20261111`）
基线：`main@f1fed77`

## 结论

登录后和活动页轮询时的“配置出错”来自 `TaskActivityCmd 105702 req_task_activity_data`：旧实现对所有请求无条件抛 `GameError(5, 'Task activity server vitality is not available')`。该命令不是预留接口，而是客户端 `TaskActivityActMgr.UpdateServerActiveValue` 读取全服活跃值的常规读取；协议 `pb_task_activity_data_rsp { int64 server_vitality = 1; }` 一直存在。

本次把 105702 改成返回真实聚合：活动任务自身的统计维度（模块 21，`CountStatistics` 槽 29，维度 2，即 31 天累计活跃值）在全服所有角色上的总和。没有任何角色贡献时返回真实的 0；同时补上日任务领取写入该统计的链路，并为同一活动家族中原先被当作配置错误拒绝的全服任务（`TaskTable.Type 100701`，`progress_fun 460`）接上同一数据源。

## 线上证据

- 日志 `/data/disk1/game/data/events.jsonl`：2026-11-11 08:54–08:59 UTC，共 12 条 `task_activity_command_rejected`，`type=105702`、`code=5`、`message="Task activity server vitality is not available"`。
- 08:54:48.597 同一连接 seq 12/13/15 连续三条；08:57:48、08:58:48、08:59:48 每分钟各三条。
- 同一时段 `task_activity_login_synchronized` 为 `[1003001,1003004,1003006]`，即三个在跑的通用任务活动，与每分钟三次请求相符；日志未记录请求体，不能把每次请求精确分配到单个活动。
- 服务 `fate-covenant-realm-2.service`，`RELEASE_COMMIT=f1fed77572aad3538ffb1b6173551f52af121b98`，与本分支基线一致。
- 只读检查运行库 `game.local-only.sqlite`：角色 100002/100003 的模块 21 槽 29 均为空，因此当前真实全服活跃值为 0；两角色均于 2026-11-10T16:00Z 开服，`every_task_claims` 无历史行。

## 权威来源判定

1. **请求参数**：`agent/workflow/interface-catalog/interfaces.json` 与 `static-schemas.json` 记录 105702 为 ETF 请求、`schema: null`、`staticInputShape.kind=input-register/register 0`，协议只定义了回包，没有活动 ID 字段。因此该值是全服维度，不按活动或角色分别统计；三个轮询者读到同一个数。
2. **活动任务分组**：`TaskActivityTable.Lib` 每期 23 条任务。前 14 条（tag 1）用 `TaskTable.Type 14301`（`progress_type=2`、`data=29`、`stat_expand=[2]`），目标 50–2000；后 9 条（tag 2）用 `TaskTable.Type 100701`（`progress_type=1`、`progress_fun=460`），目标 30000–300000。
3. **维度含义**：`TaskTable.Type 14301` 读取模块 21 的 `CountStatistics` 槽 29（周期 31 天）维度 2；`pb_daily_task.vitality` 就是客户端“活跃值”，日任务表 117 行合计 1765、每日活跃奖励阈值 200，十天活动窗口正好对应个人档 2000 的上限；全服档 30000–300000 是同一维度在全服的角色总和。线上统计槽 29 为空时真实值为 0。
4. **progress_fun 460**：全库只有 `TaskTable.Type 100701` 使用该函数，即 `TaskActivityActMgr` 的全服活跃值，和 105702 是同一数据源。

## 代码修改

| 文件 | 修改 |
| --- | --- |
| `personal-server/game/activity-vitality.mjs`（新增） | 由 `TaskActivityTable`/`TaskTable.Type` 推导活动活跃统计维度；跨角色聚合模块 21 统计；把新获得的日任务活跃值写入同一维度并维护 `count_list`/`mod_day` |
| `personal-server/game/task-activity-service.mjs` | 105702 返回 `pb_task_activity_data_rsp{server_vitality}` 真实聚合；105701 对 `progress_fun 460` 使用全服活跃值复核 |
| `personal-server/game/every-task-service.mjs` | 日任务领取按实际 `vitality` 增量写入模块 21 槽 29 维度 2，并返回 `pb_count_statics_send_list` 推送 |
| `personal-server/game/gateway.mjs` | 发送日任务统计推送时按当前角色定向，不广播给其他玩家 |
| `personal-server/test/task-activity-service.test.mjs` | 移除“105702 应返回 5”的旧断言；新增零状态、跨角色聚合、重连、维度隔离、活动结束仍可读、全服任务领取 |
| `personal-server/test/item-everytask-service.test.mjs` | 新增日任务领取写入统计与推送内容的断言 |
| `personal-server/test/item-task-gateway.test.mjs` | 真实 TCP 下 105702 解码为 50（该用例已把槽 29 维度 2 设为 50），并验证连续轮询 |

统计写入与领取在同一 `store.transaction` 内，编码或 SQLite 失败会一起回滚；活动提交仍按模块 21 复核、领取位落库并去重，没有放宽校验。

## 测试

```bash
cd personal-server
node --test --test-concurrency=1 test/task-activity-service.test.mjs test/item-everytask-service.test.mjs test/item-task-gateway.test.mjs
node --test --test-concurrency=1 test/task-activity-service.test.mjs test/item-everytask-service.test.mjs test/item-task-gateway.test.mjs test/item-commontask-service.test.mjs test/task-service.test.mjs test/recruit-service.test.mjs
node --test --test-concurrency=1 test/*.test.mjs
```

结果：

- 三文件定向 23/23 通过（含新增的共享值、损坏统计用例）。
- 六文件定向 77/77 通过。
- 全量 `test/*.test.mjs`：2852 项，pass 2850、fail 0、skipped 2。

## 待验收

1. 部署后重登 realm 2，确认 `events.jsonl` 不再出现 `task_activity_command_rejected` 的 105702 记录，客户端登录与活动页轮询不弹“配置出错”。
2. 活动页显示的全服活跃值等于运行库中所有角色模块 21 槽 29 维度 2 之和；当前应为 0。
3. 领取一个日任务后，模块 21 槽 29 维度 2 增加该任务的 `vitality`，客户端收到 2000/pb_count_statics_send_list 推送，个人档任务进度随之增长。
4. 全服档任务在全服合计达到目标后可领取，且每个角色每档只能领一次；未达标仍返回 5。
5. APK 实测（本轮未做）：登录无弹窗、活动切换、连续轮询、重连后数值一致。

## 剩余限制

- 105702 协议本身没有活动 ID，三个在跑活动共享同一个全服值；如果将来某个版本改用不同统计维度，`activityVitalityStatistic` 会以“versions use different vitality statistics”明确拒绝，而不是混算。
- 统计只累计部署后的日任务领取；线上 `every_task_claims` 当前为空，无需回填。若以后在旧库上线，需要按领取记录补一次历史活跃值。
- 全服聚合按请求扫描所有角色的模块 21 载荷（当前 2 个角色），角色很多时需要改成缓存或汇总表。
- 未重启或部署服务，未修改运行数据库，未操作客户端/ADB/APK；客户端显示与 APK 验收仍待主 agent 安排。
