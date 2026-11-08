# ROLE-ACTFRAME 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #272–#273。

## 状态

服务端完成，53001/53002 按 proper ETF 同步，53006 按请求 ETF 返回已知活动并使用活动窗口；GM 命令默认关闭。未做 APK 验收。

## 客户端证据

- `ActivityCmd.lua` / `ActFrameCmd.lua`：53001、53002 使用 ETF；53006 是活动列表读取。
- `ActMgr.lua`：`ActMgr:RequestActListData(actIdList)` 把活动 ID 列表交给 `ActFrameCmd.req_act_get_act_list_data`，调用使用 proper ETF；`DreamSummerActMainForm.lua` 先收集缺失活动 ID 再发起该请求，`ActLogin.RevActFrameState` 消费回包中的 `act_stage_list`。
- LuaJIT 字节码确认 `ActMgr:SendActivityStateChange` 遍历 `serverActList` 并逐个插入活动 `id`；`ActLogin:CheckChangeStage` 收集未忽略实体的 `id`。两者都以 proper ETF 活动 ID 列表发送；捕获请求中的两个元素均按活动 ID 解释。

## 实现

- 53001/53002 只处理请求中明确列出的活动 ID；未知 ID、空列表、非整数、improper list 和 malformed ETF 均失败。
- 状态推进读取登录模块 92 和 `role_activity_stages`，不遍历并推进未请求的活动。
- 53006 复用同一 proper ETF 解析，只返回请求中且存在于登录模块 92 的活动；空列表、非整数、improper list 和未知 ID 返回业务错误。
- 53006 优先读取 `ActFrameTable`，缺失时回退真实 `Activity` 表，再通过活动日历生成开始/结束时间；没有可信 stage 行时使用当前存储阶段。
- 53003–53005 GM 命令要求显式 GM 开关，并写 `gm_audit_entries`。

## 验证

- 服务专项覆盖去重、只请求已知 ID、重复推进、proper/improper ETF、53002 和 53006；53006 额外覆盖空请求、非整数、未知 ID 与 `Activity` 表窗口回退。
- 临时 loopback TCP 发送 proper ETF 53001，响应 `pb_act_state_change_back` 只含请求 ID；53006 仅返回请求的两个活动，下一请求 seq 连续。

## 缺口

- 各活动族的完整阶段配置和状态推进规则尚未全部恢复；当前实现只保证请求元素按活动 ID 解释，不能视为所有活动族规则均已确认。
- ActFrameTable 的活动阶段行没有完整服务端来源，规则依赖窗口和本地存储。
- 未做 APK 实机验收。
