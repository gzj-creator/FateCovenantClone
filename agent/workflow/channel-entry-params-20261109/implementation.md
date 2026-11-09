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
- 最终全量 `npm test`：2783 项，pass 2781、fail 0、skipped 2，耗时 448205.9171 ms；日志 `analysis/test-runs/channel-entry-params-20261109/full-final.log`，长度 423128，SHA256 `92A008D2F7449003E7895196EB69EC7325FE07B3C77C2F91885EAEDD42B4B218`。

## 部署

- 修复分支 `fix/channel-entry-params-20261109`，最终提交 `de86e66`；以 `--no-ff` 合入 main 的提交为 `f19313c`。
- 纠正版本部署后，真实客户端自动重连并完成 145 模块登录；`2026-11-09T05:41:22Z` 的 `102801` 返回 `channelId=1, opens=1`。随后 main 合入其他并行修复并重启，当前实例继续在 `2026-11-09T05:45:55Z` 返回 `channelId=1, opens=2`，没有新的 `guild_coop_rejected`。
- 当前五个端口 `18880/18881/18882/18883/19090` 均由实时实例监听在 `127.0.0.1`，stderr 为空。实时 PID 每次以 `personal-server/runtime.local-only.data/server.local-only.json` 为准。

## 边界

- 本轮未操作模拟器、ADB 或 APK。APK 无改动，不需要重建；只重启 server，现有客户端自动重连。
- 真实客户端的请求与回包协议已联调成功；界面截图未由本轮采集，最终视觉确认可在现有客户端中查看。
