# ROLE-CDKEY 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #271。

## 状态

服务端完成。兑换码内容由本地运营配置提供，客户端请求编码已取证。未做 APK 实机验收。

## 客户端证据

- `CdkeyCmd.lua` 的命令名为 `req_claim_prize`，参数通过 `EncodeErl` 编码。
- `Cmd.lua` 同时登记 `req_claim_prize` 的 C2S 路径。

## 实现

- 命令：40000。
- `cdkey_redemptions` 与奖励领取状态在同一 SQLite 事务内提交，重复兑换返回 310。
- 空码、未知码和未配置奖励失败关闭；不回送固定空包。

## 验证

- `test/block-j-role-support.test.mjs`：13/13 通过。
- `test/block-j-role-gateway.test.mjs`：1/1 通过，使用临时 loopback TCP 与 SQLite 重开。
- 最终分支全量 `npm test`：2710 项，pass 2708、fail 0、skipped 2，日志为 `analysis/test-runs/gameplay-20261106/block-j-final-full-4.log`。

## 缺口

- 原服兑换码表未取得，`config/cdkey-awards.json` 默认为空；需要运营填入有效码后才能进行实际兑换验收。
- 本轮未启动或停止实时服务，未读写运行数据库，未操作模拟器、ADB 或 APK。
