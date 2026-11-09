# 频道入口参数修复（2026-11-09）

## 证据

- 实时日志显示客户端发送 `102801 req_channel_entry`，payload 为 7 字节，旧服务返回 `code=1, Channel entry takes no parameters`。
- `ChannelEntryMgr` 的 `PullEntryData` 将首个参数传给 `ChannelEntryCmd.req_channel_entry`；后者通过 `Codec.EncodeErl` 编码该参数。当前客户端传入 ETF `[1]`。
- 本地频道配置包含 `channelId=1` 和 `channelId=2`。旧实现拒绝全部参数并固定返回第一项，既违反客户端参数契约，也无法按 ID 选择入口。

## 实现

- `channel-entry-service.mjs` 接受零个或一个 ETF 参数。零参数保留兼容行为并选择首项；一个参数必须是正安全整数，并选择对应 `channelId`。
- 未知频道返回业务码 5；非法 ID 或超过一个参数返回协议码 1。
- 原会话记录、开放状态、时间和回包 schema 保持不变。

## 验证

- 定向服务专项 6/6 通过，覆盖空参数兼容、频道 1、频道 2、未知频道、多个参数和真实临时 TCP 网关的 ETF `[1]` 请求。
- `node --check` 与 `git diff --check` 通过。
- 全量 `npm test`：2783 项，pass 2781、fail 0、skipped 2；日志 `analysis/test-runs/channel-entry-params-20261109/full.log`。

## 边界

- 本轮未操作模拟器、ADB 或 APK。APK 无改动，不需要重建。
- 服务端合并并重启后，客户端 `102801` 是否不再显示错误仍需在现有客户端下一次进入对应入口时确认。
