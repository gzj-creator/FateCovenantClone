# ROLE-ACTIVITY 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #272。

## 状态

服务端完成，53001 按 proper ETF 推进登录模块 92 中的已知活动状态。未做 APK 验收。

## 客户端证据

- `ActivityCmd.lua` 显示 53001 使用 ETF。
- `ActMgr.lua` / `DreamSummerActMainForm.lua` 的证据同时确认：活动管理器和具体活动界面都以 proper ETF 活动 ID 列表请求活动数据，`ActLogin.RevActFrameState` 消费 `act_stage_list`。服务端不能返回调用方未请求的活动。
- LuaJIT 字节码确认 `ActMgr:SendActivityStateChange` 遍历 `serverActList`，把每个活动的 `id` 写入 proper ETF 列表；捕获请求是活动 ID 列表，服务端只应处理请求中明确列出的活动，不能借列表长度或全局顺序推进其他活动。

## 实现

- 53001 对所有请求 ID 去重，并逐一确认 ID 存在于当前活动登录状态。
- 只对请求中的活动比较日历目标状态与 SQLite 已存阶段；未请求活动保持不变。
- 53006 与 53001 使用相同的请求解析和已知 ID 校验，只生成请求集合内的 `act_stage_list`；未知、空、非整数和 improper ETF 均 fail closed。
- 成功返回 `pb_act_state_change_back`，失败返回业务错误码，不发送固定空包。

## 验证

- 服务专项覆盖重复 ID、未知 ID、空列表、负数、improper list、重复推进和可解码回包。
- 临时 loopback TCP 发送 proper ETF 53001 和 53006，回包只含请求活动 ID，且下一请求 seq 正常。

## 缺口

- 53001 请求元素的“活动 ID”语义已由字节码确认；各活动族完整阶段配置和状态推进规则仍需按活动类型恢复。
- 未做 APK 实机验收；未启停实时服务、未读写运行数据库。
