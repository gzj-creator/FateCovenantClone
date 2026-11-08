# ROLE-LOGIN 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #267。

## 状态

服务端完成，开发登录默认关闭。客户端请求结构已恢复部分字段，开发登录响应字段仍未完全取证。未做 APK 实机验收。

## 客户端证据

- `LoginCmd.lua` 确认 `req_ensure_net_ok` 使用 `EncodeErl`。
- `login_dev_account` 和 `login_dev_roleid` 使用 protobuf；`login` 结构包含 `uid_base`、`random_seed`、`is_robot`，外层由 `login_dev` 包装。
- 静态脚本没有给出开发登录成功响应的完整 ETF 字段，因此当前实现不猜测额外回包。

## 实现

- 命令：109、909101、909102。
- 开发登录仅在 `FC_ALLOW_DEV_LOGIN=1` 或 `metadata.devLoginEnabled=true` 时开放。
- 109 是网络检查命令；开发登录先校验服务器与角色身份，再复用现有登录载荷。

## 验证

- `test/block-j-role-support.test.mjs`：13/13 通过。
- `test/block-j-role-gateway.test.mjs`：1/1 通过，覆盖真实 loopback 登录和模块回填。
- 最终分支全量 `npm test`：2710 项，pass 2708、fail 0、skipped 2，日志为 `analysis/test-runs/gameplay-20261106/block-j-final-full-4.log`。

## 缺口

- 909101/909102 的完整客户端响应契约未恢复；默认关闭，避免把本地兼容路径当成生产登录。
- 本轮未启动或停止实时服务，未读写运行数据库，未操作模拟器、ADB 或 APK。
