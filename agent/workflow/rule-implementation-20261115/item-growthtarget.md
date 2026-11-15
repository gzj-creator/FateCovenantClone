# ITEM-GROWTHTARGET 实施证据（69006 / 69007）

本记录只覆盖 `ITEM-GROWTHTARGET`，不借用 GrowthRoad、首周目标或 TaskAward 的版本、阶段、任务和领取位。

## 原证据已闭合

- 原 chunk `7835156705496659000-GrowthTargetTable.data.lua.bin` SHA256 为 `2fb12eae338afda51e5d03b2ba173f46d0637fd03558cea72c15777598731496`；规范化行摘要为 `a5b53f9167f665d1327a75acd9cb0dac86eb1458f8f1ec8e624ca1af9e9ed515`。
- 原表家族为 Task 666、Const 3、Version 3、Phase 111；每个版本 37 个 phase，每个 phase 恰好 6 个 task。`ActivityTable` func 18 的真实实例为 18001/18002/18003，分别映射 version 1/2/3。
- 同版 `GrowthTargetCmd` 证明 69006/69007 采用 `Codec.EncodeErl + Codec.EncodePB`，请求是 ETF 包装的 `pb_growth_target_phase_award_req{act_tid,phase_tid}` 或 `pb_growth_target_task_award_req{act_tid,task_tid_list}`；回包分别为 `pb_growth_target_phase_award_rsp` / `pb_growth_target_task_award_rsp`。
- `pb_growth_target_act` 的三个列表独立：`phase_award_list`、`task_award_list`、`finish_task_list`。客户端 `IsFinishStage` 读取 `finish_task_list`，不能要求先领取任务奖。
- 登录 payload 为 ETF 包装的 `pb_growth_target_role{data_version,act_data_list}`；`act_data_list` 是 repeated，69006/69007 回包中的 `act_data` 是单对象。
- 客户端原型证据位于 `analysis/scratchpad/command-closure-46-20261115/item-a/prototypes/10038892796414941000-GrowthTargetCmd.lua.json` 及对应 Manager/LuaJIT 证据。

## R1 推定

- 任务进度只从已支持的真实服务端生产者读取：module 21 CountStatistics，或已验证的 passed-section 进度函数。不得因显示、登录或领奖请求自造进度。
- `period=1` 的每日任务当前没有闭合的按业务日作用域生产者，统一在状态变化前 err5；不会借用当前总分替代当日进度。
- 原服务端重复领取错误码未按 type 单独取得，使用项目既有 310 表示已完成；缺生产者、任务未完成和配置/状态损坏使用 err5，并带 `decisionId=R1-ITEM-GROWTHTARGET`。

## 服务端完成

- `personal-server/assets/tables/GrowthTargetTable.data.json.gz` 与 `personal-server/config/growth-target-tables.mjs` 严格校验源 SHA、行摘要、四族行数、三版本、37 phase/version 和 6 task/phase。
- `personal-server/game/growth-target-service.mjs` 按 `role_id + act_id` 保存独立 phase/task/finish 列表与 `data_version`；领奖、状态写入、资源发放和 PB 编码位于同一 SQLite 事务。
- 69007 逐任务复核生产者并独立发放任务奖；69006 复核 phase 的六个 `finish_task_list` 成员，不检查 `task_award_list`。
- 持久化 JSON 严格校验数组元素必须为正安全整数；非数组、0、负数、字符串、小数或 null 直接 err5，不再被 `map/filter` 静默折叠为空集合后重复领奖。
- 登录同步保留已有 `history_time.enter_time`，从已证生产者推导并持久化 finish 行，同时保留活动 18001/18002/18003 的独立 slot。
- 网关已通过 `itemCommandServices` 接入 69006/69007，并从通用失败关闭表移出四 type 中的 GrowthTarget 两项。

## 验证结果

```powershell
node --test --test-concurrency=1 personal-server/test/growth-target-service.test.mjs
node --test --test-concurrency=1 personal-server/test/growth-target-task-award-gateway.test.mjs
```

- 服务专项：11/11 通过。覆盖原表、任务领取、独立 finish/award、缺生产者、每日任务、版本/窗口、ETF/PB 解码、登录推导、编码回滚、SQLite 回滚和损坏 id 列表。
- 离线真实临时 TCP：GrowthTarget 用例通过，进程正常退出。覆盖 ETF+PB 请求、未完成 err5、真实统计后 69007 成功、69006 缺生产者 err5、module 92 登录和 SQLite 重开后领取状态投影。
- 合并 TCP：`growth-target-task-award-gateway.test.mjs` 两用例按 `--test-concurrency=1` 复跑为 2/2，退出时间约 4–5 秒。
- APK：未验收。生产 TCP、生产库、部署：未执行。

## 仍受限的具体动作

- 原表 666 个任务中有 81 个 `period=1`，按日作用域生产者尚未闭合；它们保持支付前 err5。
- 默认生产者下没有任一 phase 的六个任务全部有已证生产者，因此网关真实默认路径的 69006 仍会 err5；服务专项通过注入已完成生产者验证 phase 事务/回包逻辑，该注入不是生产实现。
- 27 个有已证周期生产者的 `period=2` 任务可领取；其余周期任务只要缺生产者，只拒绝自身，不关闭整个活动。
- 原 `reissue_award_list` 没有已证客户端/服务端消费者，当前只保留证据，不发放。真实 APK 外形、在线推送和界面流程未验收。

