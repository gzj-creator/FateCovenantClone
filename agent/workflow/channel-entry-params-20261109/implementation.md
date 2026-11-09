# 频道入口参数修复（2026-11-09）

## 证据

- 实时日志显示客户端发送 `102801 req_channel_entry`，payload 为 7 字节，旧服务返回 `code=1, Channel entry takes no parameters`。
- 部署后复现并记录原始 payload `836400036e696c`，解码为 ETF 原子 `nil`。`ChannelEntryMgr.PullEntryData` 用 `nil` 表示拉取默认频道；旧服务把该值误算成一个请求参数后拒绝。
- 本地频道配置包含 `channelId=1` 和 `channelId=2`。旧实现拒绝全部参数并固定返回第一项，既违反客户端参数契约，也无法按 ID 选择入口。

## 实现

- `channel-entry-service.mjs` 将客户端实际发送的 ETF 原子 `nil` 视为空参数并选择默认首项；零参数保留兼容行为，一个整数参数按对应 `channelId` 选择。
- 未知频道返回业务码 5；非法 ID 或超过一个参数返回协议码 1。
- 原会话记录、开放状态、时间和回包 schema 保持不变。

## 验证

- 定向服务专项 6/6 通过，覆盖真实客户端 ETF `nil` payload、空参数兼容、频道 1、频道 2、未知频道、多个参数和真实临时 TCP 网关请求。
- `node --check` 与 `git diff --check` 通过。
- 全量 `npm test`：2783 项，pass 2781、fail 0、skipped 2；日志 `analysis/test-runs/channel-entry-params-20261109/full.log`。

## 边界

- 本轮未操作模拟器、ADB 或 APK。APK 无改动，不需要重建。
- 服务端合并并重启后，客户端 `102801` 是否不再显示错误仍需在现有客户端下一次进入对应入口时确认。
