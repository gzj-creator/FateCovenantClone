# ROLE-CHANNELPUSH 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #276。

## 状态

服务端完成，客户端无回包契约和登录模块 173 结构已确认。未做 APK 验收。

## 客户端证据

- `ChannelPushCmd.lua`：98201 使用 protobuf `pb_channel_push_open`。
- `ChannelPushMgr.lua` 通过 `Seq:New():Send(rep_set_channel_push_open)` 发送，没有回调。
- 登录模块 173 对应 `pb_channel_push_param`，其中 `open_list` 是每个推送消息的开关。

## 实现

- 98201 按 `message_id` upsert `role_channel_push`。
- 登录模块 173 从 SQLite 重建 `open_list`，保留原模块中的其他 protobuf 字段。
- 成功时 `data: null`，网关不发送空响应。

## 验证

- 服务专项覆盖写入、登录投影和 SQLite 重开。
- 临时 loopback TCP 发送 98201 后，下一条 53006 的 seq 连续；重开 SQLite 再登录后模块 173 返回 `[[7,true]]`。

## 缺口

- 未验证安卓渠道通知权限、通知展示或系统推送投递。
- 未做 APK 实机验收。
