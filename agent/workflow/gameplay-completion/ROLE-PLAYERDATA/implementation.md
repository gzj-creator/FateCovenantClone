# ROLE-PLAYERDATA 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #268。

## 状态

服务端完成，真实客户端 Type/Block/Func 表已接入。未做 APK 验收。

## 客户端证据

- `PlayerDataCmd.lua`：161 使用 protobuf `pb_function_cache_req`。
- `PlayerDataTable.data.lua`：38 个 Type、72 个 Block、2 个 Func。
- Type 5 的 block 列表为 `[1,4,2,3,24]`；`PlayerDataTable.Block[24]` 的 `pb_struct_name` 为 `fashion_id`，`pb_struct_type` 为 `uint32`。
- `FunctionCachePlayerHandle.lua` 确认玩家信息缓存流；`FashionMgr.lua` 从登录模块 110 解码 `pb_fashion_data`，并以 `cur_id` 表示当前时装 ID。

## 实现

- 161 只接受 protobuf 请求；按 Type 的 block 白名单和 Block 的 lineup 约束过滤请求。
- 已接入 table-gated 的玩家、公会、编队、登录时间、圣器、皮肤、称号、属性、英雄图鉴、好感和当前时装块。
- Type 5 的 block 24 从登录模块 110 的 `pb_fashion_data.cur_id` 读取，返回 proper ETF `uint32`；模块缺失时安全返回 `0`。
- 未知 block、错误角色 ID 或表不允许的 block 返回空 `block_list`，即 cache miss，不伪造数据。

## 验证

- 服务专项覆盖 Type 1 的 block 1/3 与 Type 5 的 1/4/24，并验证未知 block 999 是 cache miss；模块 110 的 `cur_id=321` 时 block 24 解码为 `321`。
- 临时 loopback TCP 通过 161 请求 Type 5，实际返回 block 1/4/24，空模块时 block 24 解码为 `0`；关闭服务并使用同一 SQLite 重开后再次登录成功。

## 缺口

- Type 5 的 block 2/3 以及表中其他已编码块还缺逐个客户端场景验收；未做 APK 实机验证。
