# SOC-CHAT 实施记录

日期：2026-11-08。分支 `task/SOC-CHAT-20261107`，worktree `.worktree/gameplay-20261106/soc-chat`。基线 main `866117e`（已 rebase）。提交：`636c11b` 配置恢复、`0b42a7a` 服务与网关、`04b55b3` 真实 TCP 测试。

**状态：服务端完成带证据缺口。** 11000、11002、11010、11012、11013 五条命令有真实 SQLite 状态变化、回包与 1400 推送；11001、11003、11006、11008、11014 因缺少公会权威、跨服聚合、禁言封禁状态或点赞奖励规则，返回明确的不可用错误码。未做 APK 与界面验收。

| 层级 | 结果 |
| --- | --- |
| 业务服务 | `chat-service.mjs` 覆盖 ChatCmd 10 个 type，均有明确成功或拒绝路径，无静默空响应 |
| 网关派发 | `gateway.mjs` 在 SOC-MSG 派发块之后新增一个数字 type 分支：`chat.supports(type)` → `chat.execute` → `send(seq, data)` → 逐个 `publish` 推送 |
| 临时 TCP | 通过，`test/chat-gateway.test.mjs`：真实握手与登录，10507 加入世界/私聊频道后走 11000、11002、11010、11012、11014、11001 |
| SQLite 重开 | 通过：历史、举报、被移除的私聊目标、设置重开后仍生效 |
| 异常回滚 | 通过：`pb_res_new_msg` 编码失败、`message_history` 上 `RAISE(ABORT)` 触发器均整体回滚 |
| APK/UI | 未做（本轮禁止操作模拟器/APK/实时服务） |

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `tools/extract-chat-table.mjs` | 从 `ChatTable.data.lua` 字节码恢复 Param 与 ReportConst 的生成器 |
| `personal-server/assets/tables/ChatTable.Param.json.gz` | 29 字段参数表，SHA256 `D0894C6DAE1050266933A06DBCA5BD3C934203A25AE669BBE1658A1204A404D8` |
| `personal-server/assets/tables/ChatTable.ReportConst.json.gz` | 4 字段举报限制表，SHA256 `013BC9315C9E9EBF8782DC0203D0427BB519FD4D3DFA46CBA33CFE6243D6F404` |
| `personal-server/config/chat-tables.mjs` | 读取、字段白名单与数值校验 |
| `personal-server/game/chat-service.mjs` | 聊天服务：幂等建表、10 条命令、1400 推送构造、登录设置回放 |
| `personal-server/game/gateway.mjs` | 新增 import、服务实例与一个派发块（15 行） |
| `personal-server/test/chat-service.test.mjs` | 14 项服务级测试 |
| `personal-server/test/chat-gateway.test.mjs` | 1 项真实临时 loopback TCP 测试 |

未修改 `storage/game-store.mjs`（`user_version` 不变，新表全部用 `CREATE TABLE IF NOT EXISTS` 幂等建立）、`battle-engine.mjs`、`game/effects/*`，也未改动其他 agent 的服务。

## 协议依据

### 请求编码

`ChatCmd.lua` 字节码（SHA256 `4795AD4C14B19B93C161D0A017110993D2FE9D1D1AB43E7460E35B7BC6EA04E6`，2201 字节）逐个 prototype 反解：

| type | name | 请求编码 | 本版客户端调用点 |
| --- | --- | --- | --- |
| 11000 | `req_send_chat_msg_to_world` | protobuf `pb_chat_msg_content` | 无 |
| 11001 | `req_send_chat_msg_to_guild` | protobuf `pb_chat_msg_content` | 无 |
| 11002 | `req_send_chat_msg_to_role` | protobuf `pb_req_send_msg_to_role` | 定义存在 |
| 11003 | `req_send_multi_server_msg` | protobuf `pb_chat_msg_content` | 无 |
| 11006 | `req_cancel_ban` | ETF，客户端调用无参数 | `ChatMgr` |
| 11008 | `req_banned_self` | protobuf `pb_req_ban_self` | `ChatMgr` |
| 11010 | `req_change_chat_setting` | ETF，`ChatCmd` 仅 `EncodeErl(a0)` | 本版无调用点 |
| 11012 | `req_remove_private_target` | ETF 单整数 `targetRoleId` | `ChatMgr` |
| 11013 | `req_chat_report` | ETF 3 元组 `{roleId, reason, text}` | `RoleAccuseForm` |
| 11014 | `req_chat_msg_like` | protobuf `pb_msg_like_req` | `ChatMsgNode` |

`ChatMgr.lua`（SHA256 `ED891D31732C4DAD0D8B202A8AF0BEB82A3422DBEED53763EA72AD98BAEE91C1`）确认本版实际普通发言走 SOC-MSG 的 10501：`SendChannelDraft` 构造 `pb_chat_msg_content` 后 `MsgMgr.ReqSendMsg`。ChatCmd 的 11000–11003 只在旧版本使用，因此新客户端的世界发言入口仍然是 10501（由 SOC-MSG 服务承担）；11000 按 ChatCmd 契约单独实现，避免旧版客户端收到空应答。

### 响应与推送

| type | 方向 | 编码 |
| --- | --- | --- |
| 1400 | 服务端推送 | `pb_res_new_msg`：`channel_id`、`msg{sender,time,idx,content,type}`、`sender_bin`、`extra_bin` |
| 11013 响应 | 应答 | `pb_role_chat_report`：`time_stamp`、`reported`（窗口内去重目标列表） |
| 11010 回放 | 登录数据 | `pb_res_chat_login`：`ban_state`、`cancel_ban_time`、`tips_setting` |

`pb_chat_msg_content` 字段：`text_content`、`link_params`、`share_param`、`msg_type`、`be_reply_content`；服务端在历史与推送中保存/回放同一份 protobuf 编码。

### 配置值（恢复后实际生效）

源：`ChatTable.data.lua` 字节码块（SHA256 `270B39901EEEEFEE90C87BA755CE131170FC1AB3681793374278E0419C692CEE`，24070 字节）。

| 表 | 关键值 |
| --- | --- |
| Param | `chat_word_count_limit=140`、`send_time_interval=10`、`count_limit_in_cd=3`、`world_chat_level_limit=15`、`max_private_session_count=10` |
| ReportConst | `day_times=30`、`report_msg_num=30`、`report_msg_valid_time=1800` |

服务端当前使用 `chat_word_count_limit` 与 ReportConst 三项；其余参数已按白名单校验读取，供频道数上限与等级门禁后续使用。`ChatTable.MsgType` 只有 tid=1 一行，`ChatTable.Setting` 为 0 行。

## 实现要点

- 频道复用 SOC-MSG 的 `message_channels`/`message_members`/`message_history`；世界频道为 `channelIdFor(world, serverId)`（如 `10100001`），私聊为 `10300000 + targetRoleId`（如 `10310047`）。新增 `chat_settings`、`chat_reports` 两表。
- 11000 要求先经 10507 加入世界频道（否则 code 8），校验文本非空、字数 ≤ 140、`msg_type` ∈ {0,1}，写历史后在同一事务内编码 1400 推送。
- 11002 校验 `target_role_id` 存在于 `roles`（否则 code 9）、不能私聊自己、必须已加入该私聊频道；`extra_bin` 为发送者 roleId 的 ETF 整数。
- 11012 只删除本角色对该私聊频道的 membership，幂等；目标不存在 code 9，删自己 code 1。
- 11013 严格 ETF 3 元组；1800 秒内重复举报同一目标 code 6，24 小时内超过 30 次 code 7；响应 `pb_role_chat_report`。
- 11010 接受 BitBlock 兼容形状（非负整数、非负整数数组、binary），把原始 ETF 字节存入 `chat_settings.settings_blob` 并在登录数据中回放；其他形状 code 5。
- fail closed：11001/11003/11006/11008/11014 先做能确认的参数校验，再返回 `unavailable`，不伪造业务结果。
- 错误码为本服契约：1 invalid、5 unavailable、6 duplicate、7 limit、8 notMember、9 targetMissing。客户端 `MsgErr` 数值契约未恢复，此表为本地扩展。

## 逐命令状态

| type | 状态 | 说明 |
| --- | --- | --- |
| 11000 世界发言 | 服务端完成 | 校验、持久化、1400 推送、异常回滚均有测试；本版客户端无调用点 |
| 11001 公会发言 | 不可达 + fail closed | 无公会权威状态，固定返回 5 |
| 11002 私聊发言 | 服务端完成 | 目标存在性、成员资格、`extra_bin`、1400 推送 |
| 11003 跨服发言 | 不可达 + fail closed | 跨服聚合规则未知，固定返回 5 |
| 11006 取消封禁 | 不可达 + fail closed | 封禁状态未维护；参数非空先 code 1，否则 code 5 |
| 11008 自助封禁 | 不可达 + fail closed | 自动封禁策略未知；先按 `pb_req_ban_self` 校验编码，再返回 5 |
| 11010 修改聊天设置 | 部分交付 | ETF 原样持久化并可回放；`tips_setting` 记录结构未反解，仅接受 BitBlock 兼容形状 |
| 11012 删除私聊对象 | 服务端完成 | 只删本角色 membership，客户端会话列表由本地数据驱动 |
| 11013 举报 | 服务端完成（规则为本服实现） | 严格 3 元组；窗口与上限取自 ReportConst；原服后续处理未观测 |
| 11014 消息点赞 | 不可达 + fail closed | 仅校验 `pb_msg_like_req`，奖励规则未知，返回 5 |

## 证据缺口

1. 11000–11003 在本版 bundle 无调用点，请求编码只来自 `ChatCmd` prototype；1400 推送按 `pb_res_new_msg` 静态 schema 构造，未与抓包比对。
2. 11001 需要公会成员与公会频道状态，本服尚无公会模块。
3. 11003 的跨服聚合目标、频道分配与合并规则未知。
4. 11006/11008 的封禁状态机、`proof_list` 内容、`cancel_ban_lv_inc` 的生效方式未知。
5. 11010 `tips_setting` 的具体记录结构未反解（`ChatTable.Setting` 为 0 行），当前接受 BitBlock 兼容形状并原样回放。
6. 11013 原服举报后是否跨玩家处理未观测；实现只做本地记录、去重与上限。
7. 11014 点赞奖励与每日上限未知。
8. 频控：`send_time_interval=10`、`count_limit_in_cd=3` 由客户端检查，原服服务端频控未观测，本实现未加服务端限速。
9. `sender_bin` 序列化未反解，推送中置为空 buffer。
10. 推送沿用既有 `publish`，广播给所有已登录连接，没有按角色定向；当前网关是单角色实例（只有 roleId 10046 能登录），所以私聊正文不会跨角色外显，但一旦支持多角色会话，11002 的 1400 推送会对其他连接可见。定向推送需要把订阅表改成 roleId 索引，属后续工作。
11. 离线消息计数 1401 `pb_res_inc_msg_count` 与登录消息概览 1402 `pb_res_msg_login` 属 SOC-MSG，本轮未接入；1400 的 wire type 也只在 ChatCmd/推送定义上确认，需 APK 实测验证客户端渲染。
12. `settingsPayload()` 只在服务层可调用，尚未挂到登录或模块响应（聊天登录命令 type 未确认）。
13. 未做 APK/UI 验收，`SubDownloadFinish=1` 等客户端前置条件未验证。

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\soc-chat\personal-server
node --test --test-concurrency=1 test/chat-service.test.mjs test/chat-gateway.test.mjs test/message-service.test.mjs test/message-gateway.test.mjs
```

重新生成表资产（源为客户端 `ChatTable.data.lua` 字节码）：

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\soc-chat
node tools\extract-chat-table.mjs <ChatTable.data.lua> personal-server\assets\tables\ChatTable.Param.json.gz personal-server\assets\tables\ChatTable.ReportConst.json.gz
```

## 验收结果

- 一次性运行 chat 服务、chat 真实 TCP、SOC-MSG 服务、SOC-MSG 真实 TCP：28 项，pass 28、fail 0、skipped 0（`chat-service` 14、`chat-gateway` 1、`message-service` 12、`message-gateway` 1）。
- 日志（主仓库 `analysis/test-runs/gameplay-20261106/`）：`soc-chat-service-20261108.log`、`soc-chat-gateway-20261108.log`、`soc-chat-final-20261108.log`。
- 未做 APK 实机验收，未启停实时服务，未操作模拟器/ADB，未读写 `runtime.local-only.data`。
