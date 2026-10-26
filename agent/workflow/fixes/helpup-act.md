# G4 超凡冒险者活动打不开

状态：读取命令已实现；**入口映射与活动数据未确认，视觉验收未完成**。

## 证据

- `ModuleTable`：92144 = `活动_助力升超凡`（`e_dir=project/activity/help_up_act`，`parent=92`）。
- 接口目录：`HelpUpActCmd` 116001 任务奖励、116002 阶段奖励、116003 助力、116004 获取助力次数；请求/响应结构完整（`help_up_act.net.proto.bin`）。
- 客户端 `HelpUpActData` 是 `Activity.Class`：其 `_ParseDataImpl` 用 `Codec.DecodePB('pb_help_up_act_login_data', …)` 解析**活动自身的数据块**（`{act_data{act_id,daily/weekly task lists,stage list,last_update_time,last_rec_time},help_times}`），不是独立登录模块。
- 运行事件日志中**没有** 116001-116004 的任何真实请求；当前 module 92 `act_list` 的 13 条活动里也没有 92144。因此不能仅凭中文名把用户入口等同于助力升超凡。

## 根因判断

用户所称“超凡冒险者活动”最可能的候选是 92144 助力升超凡，但缺少真实请求证据；若入口失败发生在活动列表/数据解析阶段，则根因是 module 92 中没有该活动的数据块，而不是命令未实现。

## 实现（`personal-server/game/activity-read-service.mjs`）

- 116004 `req_help_up_get_times` → `pb_help_up_get_times_rsp{times: 0}`（本地无助力次数）。
- 116001/116002/116003 返回业务错误 5，明确“未实现”，不写领取位、不发奖励、不伪造助力次数。

## 未实现与下一步

- 未构造 92144 的活动开启状态与 `pb_help_up_act_data`（缺 `ActivityTable` 时间段/条件与真实数据块证据）。
- 未实现任务/阶段/助力奖励与全服助力次数。
- 下一步需要用户点击该入口并回传时间点，用 `events.jsonl` 的 `unsupported_command`/`payloadHead` 确定真实 type，再决定是补活动数据还是补命令。
