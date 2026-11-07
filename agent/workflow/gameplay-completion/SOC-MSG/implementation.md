# SOC-MSG 实施记录

日期：2026-11-07。分支：`task/SOC-MSG-20261107`。worktree：`.worktree/gameplay-20261106/soc-msg`。基线：main `e55a039`。

**状态：服务端完成（10501–10511 全部有明确处理路径），核心频道 10501/10502/10503/10506/10507/10508 有真实 SQLite 状态与回包，待 APK 验收；消息推送、内容长度/频率限制、跨服与 10511 语义为证据缺口。**

| 层级 | 结果 |
| --- | --- |
| 业务服务 | 10501–10511 全部有处理路径，无静默空应答 |
| 网关派发 | `gateway.mjs` 在 friend 派发块后按数字 type 派发，ETF/protobuf 分流 |
| 临时 TCP | 通过，见 `test/message-gateway.test.mjs` |
| SQLite 重开 | 通过，频道/成员/历史/日志重开后仍生效 |
| 异常回滚 | PB 编码失败时频道与成员写入整体回滚 |
| APK/UI | 未做（本轮禁止操作模拟器/APK/实时服务） |
| 登录槽/推送 | 登录 payload 已就绪；模块槽位与新消息推送 type 未恢复 |

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `tools/extract-msg-channel-table.mjs` | 从 LuaJIT 字节码恢复 `MsgTable.ChannelType` 的生成器 |
| `personal-server/assets/tables/MsgTable.ChannelType.json.gz` | 17 行频道类型配置，SHA256 `213568E3E8622AEC96C27574CA7EE42292310B490528D6406FE343E94FAB334D` |
| `personal-server/config/message-tables.mjs` | 频道类型读取、频道 ID 组合/解析 |
| `personal-server/game/message-service.mjs` | 独立消息服务（状态表、事务、11 条命令、登录 payload） |
| `personal-server/game/gateway.mjs` | 新增 import、服务实例、一个派发块；删除 10507 占位读与 10503 空应答 |
| `personal-server/test/message-service.test.mjs` | 12 项服务级测试 |
| `personal-server/test/message-gateway.test.mjs` | 1 项真实临时 TCP 测试（12 条命令） |

未修改 `storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*` 或其他 agent 的服务。

## 协议依据

### 请求编码

`MsgCmd.lua`（SHA256 `B47F8F9FDF91E4E94AD38915813D62A9D06680767818648C2AAA1A78AF71C9C9`，1773 字节）逐条确认：

| type | name | 请求编码 |
| --- | --- | --- |
| 10501 | `req_send_msg` | protobuf `pb_req_send_msg` |
| 10502 | `req_enter_channel` | ETF 单整数 |
| 10503 | `req_leave_channel` | ETF 单整数 |
| 10504 | `req_msg_role_info` | ETF 单整数 |
| 10505 | `req_msg_role_info_list` | ETF 数组 |
| 10506 | `req_msg_range` | ETF 数组 `{channelId,startIdx,endIdx}` |
| 10507 | `req_get_channel_id_and_enter` | ETF 数组 `{channelType,extraTable}` |
| 10508 | `res_msg_login`（服务端下发） | protobuf `pb_res_msg_login` |
| 10509 | `req_msg_cross_data` | ETF 空表 |
| 10510 | `req_log_send_msg` | protobuf `pb_req_send_msg` |
| 10511 | `req_tips_look_player` | ETF（变参，语义未恢复） |

### 响应编码

`msg.net.proto`（2628 字节，SHA256 `F2FE871DDB9C1B9C8405D17CA2B2B58A86A7F1DB985E202F502F8C7F3D0E3B96A`）与静态目录：

| type | 响应 |
| --- | --- |
| 10502 / 10506 / 10507 | `pb_msg_range_list_with_role_info` |
| 10504 | `pb_msg_role_info` |
| 10505 | `pb_msg_role_info_list` |
| 10508 | `pb_res_msg_login` |
| 10503 | 空回包（抓包实测） |
| 10501 / 10509 / 10510 / 10511 | 无专用响应 schema |

10503 有 8 组真实请求/响应：`analysis/captures/protocol-2026-10-25` 与 `-r2a` 中 `codec=empty`、`dataBytes=0`，`requestId` 一一对应（见 `agent/workflow/interface-catalog/interfaces.json`）。本实现据此返回 0 字节。

### 频道 ID

`MsgChannel.lua`（SHA256 `00F3716BDB9EF22CE3740C354A5EB8DB210D41676BC669BF8DE3BED9E684F996`）：

- `RESERVED_CHANNEL_TYPE = 100`（prototype 13，源码行 50）。
- `StaticFixedChannelId(type,id) = Uid.Compose(100 + type, id)`。
- `StaticGetChannelType(channelId) = Uid.ExtractInfix(channelId, 100)`。

`Uid.lua`（SHA256 `4ABCF2F5393901B6F423988D2AB1F616F6ABF4AA56D7F6240B06D839F7EE210F`）：

- `Compose(uid, serverId) = uid * 100000 + serverId`，要求 `uid < 100000`。
- `ExtractInfix(uid, n) = floor(uid / 100000) % n`。

因此频道 ID 为 `(100 + channelType) * 100000 + target`，类型由 `floor(id/100000) % 100` 反解。`MsgTable.data.lua` 的 `ChannelType_List` 常量为 `[1,2,3,4,5,7,8,10,12,13,14,15,16,17,18,19,20]`，与提取结果一致。

`StaticFixedChannelId` 在客户端 bundle 中只由 `MsgChannel.lua` 自身引用，客户端不自行拼频道 ID；实际 ID 由服务端在 10507 回包中下发。服务端对客户端回传的 ID 只校验 infix 类型，未对尾段施加未证实的语义。

### 频道语义

| type | 客户端类 | 本地实现 |
| --- | --- | --- |
| 1 world | `ChatChannel` | 开放，`target = serverId` |
| 5 system | `SystemMsgChannel` | 开放，`target = roleId` |
| 3 private | `PrivateChatChannel` | 开放，需提供对端 roleId (<100000) |
| 2 guild | `ChatGuildChannel` | 返回 code 5（本地无公会权威状态） |
| 4 / 15 / 16 cross | `ChatChannel` / `PrivateChatChannel` / `BattleChatChannel` | 返回 code 5 |
| 其他 | 无稳定本地权威数据 | 返回 code 5 |

`PrivateChatChannel.ParseExtraData` 用 `Codec.DecodeErl(extra_data)` 取值并在等于本角色 ID 时记为 `targetRoleId`，因此私聊回包的 `extraData` 用 ETF 整数编码本角色 ID。

## 实现要点

- 所有写操作在 `store.transaction` 内完成；PB 编码失败整体回滚（测试覆盖）。
- 表：`message_channels`、`message_members`、`message_history`、`message_logs`，均由服务幂等建立，未改 `game-store` 迁移。
- 历史消息 `idx` 每频道单调递增，`time` 为秒级；`content` 原样保存与回放（服务端不解释聊天内容）。
- 10501/10510 同一个 protobuf 请求；10510 只写 `message_logs`，不进入频道历史（`req_log_send_msg` 名称证据，响应契约未见，按无专用 schema 返回空）。
- 10508 `loginPayload()` 只回放本角色已加入的频道与最近消息；登录模块槽位未恢复，未接入登录容器。

## 逐命令状态

| type | 状态 | 说明 |
| --- | --- | --- |
| 10501 | 已实现 | 写历史，空回包 |
| 10502 | 已实现 | 加入成员，回 `pb_msg_range_list_with_role_info` |
| 10503 | 已实现 | 移除成员，空回包（抓包实测） |
| 10504 | 已实现 | 从 `roles` 读取 `pb_msg_role_info` |
| 10505 | 已实现 | 批量角色资料，去重保序 |
| 10506 | 已实现 | 按 `[startIdx,endIdx]` 升序取历史 |
| 10507 | 已实现 | 分配频道 ID 并加入 |
| 10508 | payload 就绪 | `pb_res_msg_login`，槽位待总控接入 |
| 10509 | 明确拒绝 | 跨服语义未恢复，code 5 |
| 10510 | 已实现（推断） | 写日志表，空回包 |
| 10511 | 明确拒绝 | 未找到调用方与语义，code 5 |

## 证据缺口

1. **新消息推送**：`pb_res_new_msg`、`pb_res_inc_msg_count` 在 proto 中存在，`Cmd` 中对应 s2c type 未恢复，未实现推送；当前发送者靠下一次 10502/10506 拉取看到消息。
2. **内容长度/频率限制**：`ChatMgr.MAX_MSG_COUNT = ChatTable.Param.max_msg_count`（ChatMgr prototype 92，pc 26–27），`ChatMgr.SEND_TIME_INTERVAL`、`ChatChannel.count_limit_in_cd` 同源 Param；`ChatTable.Param` 行未能从 LazyInit 字节码恢复，无运行时观测值，服务端只做空内容校验与单次回包上限 200 条（本地传输保护，不是客户端限制）。
3. **跨服**：`is_cross=true` 的 4/15/16 一律 code 5。
4. **10511**：`MsgMgr.json`/`ChatMgr.json` 中均无 `ReqTipsLookPlayer` 调用点，语义与回包未知。
5. **10510 响应**：协议目录只标注 ETF fallback；本实现按“无专用响应 schema ⇒ 空回包”推断。
6. **私聊双端**：频道 ID 尾段持有单侧角色 ID；服务端在同一频道内不区分双方朝向，多角色私聊需总控设计频道分配后再补。

## 复现命令

```powershell
# 重新生成频道类型资产
node tools/extract-msg-channel-table.mjs <MsgTable.data.lua.bin> personal-server/assets/tables/MsgTable.ChannelType.json.gz

# 服务与 TCP 测试
cd personal-server
node --test --test-concurrency=1 test/message-service.test.mjs test/message-gateway.test.mjs
```

## 验收结果

- `message-service.test.mjs`：12/12 通过（频道类型、ID 组合、10507、10501+10506、10502/10503、10504/10505、非法/跨服拒绝、10510、编码回滚、SQLite 重开、10508、私聊 extra）。
- `message-gateway.test.mjs`：1/1 通过，真实握手 + 12 条命令 + SQLite 落库断言。
- 未做 APK/UI、实时服务与模拟器验收；未读写 `runtime.local-only.data`。
