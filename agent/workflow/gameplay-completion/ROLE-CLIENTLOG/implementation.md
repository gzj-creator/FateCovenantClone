# ROLE-CLIENTLOG 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #275。

## 状态

服务端完成，客户端使用 ETF 发送诊断日志且没有可恢复的业务回包。未做 APK 实机验收。

## 客户端证据

- `ClientLogCmd.lua` 的命令名为 `req_save_to_server_info_log`，参数通过 `EncodeErl` 编码。
- 客户端调用没有携带回调的响应消费者，因此服务端按 fire-and-forget 处理并落库。

## 实现

- 命令：78901。
- 诊断内容写入 `client_diagnostic_logs`，同日计数、描述和原始载荷同事务保存。
- 成功时返回 `data: null`，网关不注入空 ETF 或空 protobuf 帧。

## 验证

- `test/block-j-role-support.test.mjs`：13/13 通过。
- `test/block-j-role-gateway.test.mjs`：1/1 通过，验证无回包命令不会污染后续请求的 seq。
- 合并最新 main 后全量 `npm test`：2734 项，pass 2732、fail 0、skipped 2，日志为 `analysis/test-runs/gameplay-20261106/block-j-after-main-full.log`。

## 缺口

- 服务端响应 schema 尚未从客户端恢复，当前只保证 fire-and-forget 落库和无空包行为。
- 本轮未启动或停止实时服务，未读写运行数据库，未操作模拟器、ADB 或 APK。
