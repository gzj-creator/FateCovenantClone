# L1 空服首次登录在发送模块前断线

日期：2026-11-18（Asia/Singapore）

基线：`eb1e8ce8a8268e413bc54b1fb741859243ebe4f6`，线上 `release-20261118T143019Z`。

## 现象与证据

用户反馈“客户端连不上”。`/data/disk1/game/data-realm-3-fresh-20261118T143019Z/events.jsonl` 显示 22:52:24、22:52:34、22:53:21 的客户端尝试均通过握手，发送 `909103`、`seq=1` 后抛出 `features.maskLogin is not a function`，连接被关闭，未发出 `login_sent`。运行库只读检查已有一个账号和一个角色；不是端口或 SDK 凭据失败。

## 根因与复盘

- `createFeatureService()` 在 `sprintPreview` 开启且库无角色时返回永久的残缺对象，跳过 `maskLogin`、`openIds` 等方法；随后 `909103` 创角不能补全对象。此前空服建库与握手均通过，但发布测试只验证到 SDK token，没有用同一进程继续请求完整登录回包。
- 同一遮罩路径把已 `revive` 的 ETF 模块交给读取及返回序列化形状的 `maskLogin()`；若存在 `force_close`，这会在模块 3 的读/回写边界失败。

## 修复

- 功能服务统一返回完整接口，空库仅跳过已有角色的预览位预载。登录网关先遮罩序列化模块 3 副本，再转换完整 ETF 回包。
- 不变更功能 ID 或解锁条件，不更改区服、排期、客户端或账号数据格式。

## 防复发用例

在自包含发布目录用全空临时库、实际 SDK token 和临时 TCP 完成 `909103`；断言首个角色 ID 为 1、模块 3 可解码、重连不重复创角。分别验证管理端 `force_open` 和 `force_close` 后重连的位图，以及关闭只遮罩回包、不清持久位。

## 验证

旧版隔离发布回归在首个 `909103` 复现 `Game gateway closed before returning the login response`。

- 组件与临时 TCP：相关测试 42/42 通过。
- 自包含部署：空库首次登录、角色 1 重连及功能覆盖断言 1/1 通过；独立的远端 `main` 检出上再跑同一回归 1/1 通过。
- 回归日志：`/data/disk1/game/logs/login-hotfix-20261118T145855Z-HUvlIU/` 的 `before.log`、`after.log`、`targeted.log`，以及 `/data/disk1/game/logs/login-fix-main-20261118T153004Z-dj4axs/deployment-regression.log`。
- 生产部署：命运三服于 2026-11-18 23:37（UTC+8）切换至 `release-20261118T153737Z`（代码提交 `6c2e885`）。沿用本次新服数据库，部署后仍为 1 个账号、1 个角色；SQLite 完整性、活动排期审计、SDK 健康检查和五端口就绪均通过。切换前备份 `/data/disk1/game/backups/pre-20261118T153737Z/data.tar.gz` 已通过 SHA256 校验；未恢复任何废弃旧服数据。部署日志为 `login-fix-main-20261118T153004Z-dj4axs/realm-3-deployment.log`（位于 `/data/disk1/game/logs/`）。
- 未操作 APK；真实客户端大厅验收由用户重登确认。
