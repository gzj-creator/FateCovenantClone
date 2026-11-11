# ITEM-TASKACTIVITY 实施记录

> 2026-11-11 更新：`105702 req_task_activity_data` 已不再按 `5` 拒绝。全服活跃值改为模块 21 槽 29 维度 2 的真实跨角色聚合，日任务领取会写入该维度，100701 全服任务也改用同一数据源。根因、测试与待验收见
> [activity-server-vitality-20261111.md](../../fixes/activity-server-vitality-20261111.md)。下文“105702 未实现”段落保留为历史记录。

日期：2026-11-08
分支：`task/BLOCK-D-20261108`（worktree `.worktree/gameplay-20261108/block-d-20261108`）
基线：`main@bd650ba`

## 结论

已接通 `105701 req_task_activity_finish`：按 `ActFrameTable` 类型 `1003` 的真实活动窗口校验活动、按 `TaskActivityTable.Lib.version` 取任务、按模块 21 统计复核进度、领取位落 SQLite、资源按 `award` 发放，回包 `pb_task_activity_finish_rsp { act_info, res }`，并在登录时把 `pb_task_activity_role_info` ETF 包进模块 92 的活动条目。

`105702 req_task_activity_data` 未实现：回包只有 `server_vitality`（`TaskActivityActMgr.UpdateServerActiveValue` 的服务器活跃度），本服没有该值的权威生产方，按 `5` 明确拒绝，不用固定值充数。

状态：服务端部分完成（1/2）。

## 配置与协议依据

- `ActFrameTable.ActType` 行 `tid=1003`：“通用任务活动”，`lua_entity=TaskActivityActData`、`lua_module=TaskActivityActMgr`、`func_open=1551`。
- `ActFrameTable.Act` 中类型 `1003` 的活动：`1003001/1003004/1003006`（`time_type=1`，开服第 1 天 05:00 起 10 天）、`1003002/1003003/1003005`（`time_type=2`，世界时间起 10 天）。`version` 1–6。
- `personal-server/assets/protobuf/task_activity.net.proto.bin`：`pb_task_activity_finish_req { int64 activity_id; repeated int64 task_id_list }`、`pb_task_activity_finish_rsp { pb_task_activity_info act_info; pb_res_to_client res }`、`pb_task_activity_data_rsp { int64 server_vitality }`。
- `task_activity.db.proto.bin`：`pb_task_activity_role_info { act_list }`、`pb_task_activity_info { version, finish_task_list }`。
- `TaskActivityActMgr.lua`：`LoginParse` 后 `InitData`/`GetActData` 按活动 id 取条目；`GetTaskProgress` 调 `TaskMgr.GetCurTaskProgress(type, task_param)`；`ReqGetTaskReward` 收集 `taskTid` 后发 `req_task_activity_finish`；`UpdateServerActiveValue` 用 `req_task_activity_data` 的 `server_vitality`，来源是 `GetServerActiveValue`。
- `TaskActivityTable.data.lua`（LuaJIT）抽取为 `personal-server/assets/tables/TaskActivityTable.rows.json.gz`：`Lib` 138 行（`tid, version, enum, type, target_count, task_param, award, tag, sort`）、`Common` 6 行、`Tag` 12 行。
- `TaskTable.Type` 行 `14301`：`progress_type=2`、`data=29`、`stat_expand=[2]`。

## 实现

- `personal-server/config/item-task-tables.mjs`：校验 `Lib` 138 / `Common` 6 / `Tag` 12 行与字段，按 `version` 建立任务索引。
- `personal-server/game/etf-binary.mjs`：`0x83 0x6d <len>` ETF 包头，供活动登录数据使用（与 PAY-GROUPBUYACT 一致）。
- `personal-server/game/task-activity-service.mjs`：
  - 窗口：`activityWindow(ActFrame row, serverOpenedAt)`；只有 `start <= now < end` 的活动可提交。
  - 提交：活动存在（否则 `1`）、在跑（否则 `309`）、任务属于该版本（否则 `1`）、未领取过（否则 `310`）、统计进度 ≥ `target_count`（否则 `5`）；全部通过后一次性写入 `finished_json`、发放全部奖励并回包。
  - 登录同步：对每个在跑且有配置的任务活动写 `module_login_data = ETF(pb_task_activity_role_info{ act_list:[{version, finish_task_list}] })`，`cur_state_id=50`。
- `personal-server/game/gateway.mjs`：新增服务实例、登录期 `taskActivity.synchronizeLogin(activity, loginSeconds)`、`105701` 按 protobuf 请求派发、`105702` 走同分支返回 `5`。

## 验证

```powershell
cd personal-server
node --test test/task-activity-service.test.mjs test/item-task-gateway.test.mjs
```

- 配置：6 个版本共 138 条任务、`Tag` 12、`Common` 6；版本 1 的第 1 条奖励为 `101500+100`、`201500+10000`。
- 窗口：测试服（2026-10-24 开服）在 2026-10-26 时 `1003001/1003004/1003006` 在跑，`1003002` 不在跑。
- 提交：统计 50 时完成 `1003001` 的第 1 条任务，资源 `101500+100`、`201500+10000`，回包 `act_info.version=1`、`finish_task_list=[1]`；重复 `310`；重开 SQLite 后仍 `310`。
- 拒绝：统计 60 时第 2 条（目标 100）返回 `5`；未知任务 `1`；已结束活动 `309`；未知活动 `1`；重复 tid `1`。
- 登录：`synchronizeLogin` 写出的条目 `cur_state_id=50`，`module_login_data` 去掉 ETF 头后能解出 `pb_task_activity_role_info`，版本与完成列表与库内一致。
- 回滚：编码抛错时资源不变、`task_activity_state` 无行。
- 真实临时 TCP：`909103` 登录后模块 92 内含 `1003001` 条目，`105701` 成功、重复 `310`、`105702` 返回 `5`。

## 推断与剩余证据

- 任务进度只接 `TaskType.progress_type=2`（模块 21 统计）；本版本 `Lib` 全部行的 `type` 都是 `14301`，因此当前整个家族都可复核。若后续版本引入 `progress_fun` 类型，会明确返回 `5`。
- `task_param` 原样保留但未参与统计细分（`14301` 的 `stat_expand` 已是完整 id 集）。
- `105702` 的 `server_vitality` 语义（是否等于全服完成任务的活跃度总和）未取证；需要原服数据或客户端反汇编才能实现。
- `Common.task_param`（如 `[1,60,25,30]`）与 `Tag.desc` 属于展示配置，本块未使用。
- 活动窗口按 `ActFrameTable` 计算；`calendar.mode=all-open` 时本块仍以窗口为准，已结束的期次不可提交。
