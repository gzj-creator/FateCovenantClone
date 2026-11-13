# 2026-11-13 个人服务器自动发布记录

## 最新修复：登录恢复引导进度（19:34 CST）

活动登录行修复发布后，新角色可以进入大厅，但按钮点击仍没有业务命令到达服务器。线上日志显示客户端
每次重登都会上报 4 条引导完成记录（type `8000`，35 字节），随后只完成模块 92/183 等初始化；点击前
客户端主动关闭连接，服务端没有 `handler_error`、`login_rejected` 或 `frame_error`。数据库中这 4 条
记录已经保存在 `guides` 表：`102002 -> 102`、`296003 -> 296`、`321007 -> 321`、
`354001 -> 354`。但登录协议模块 16（`pb_guide.process_list`）仍为空。对照旧服已游玩角色，其模块
16 有 125 条完成记录，确认登录快照与持久化引导进度没有同步。

修复提交为 `ef73180f931c37d115efe9758e0099c0f500d447`（`fix: restore guide progress on login`）。
登录时将 `guides` 表投影进模块 16，并保留存档已有的历史引导行；活动开放状态没有改变，也不存在
批量强制开启活动的处理。

发布目录为 `/data/disk1/game/releases/release-20261113T113450Z`，服务 PID `1435334`。停服备份为
`/data/disk1/game/backups/pre-20261113T113450Z/data.tar.gz`，SHA256 文件校验通过。

验证结果：

- 引导专项 9/9 通过；全量 fast 测试 252 项，pass 250、fail 0、skipped 2；部署测试 1/1。
- 活动排期审计 rows 1993、errors 0、`Result: PASS`；已有未开放活动和暂停行保持原策略。
- 使用发布目录和线上数据库一致性副本重放登录：148 个模块，模块 16 为 43 字节，包含上述 4 条
  `is_over=true` 引导记录。
- `games.local-only.sqlite` 的 `integrity_check=ok`，`user_version=20`，accounts 1、roles 1。
- systemd `active (running)`、`NRestarts=0`；18880/18881/18882/19090 公网监听，18883 仅回环。

客户端重登后的大厅点击仍需实机确认；服务端重放不等于 APK 操作验收。

## 最新修复：新服登录解析失败

17:21 CST 紧急回滚到 `release-20261112T131204Z`（提交 `7de7c72`）后，确认旧包可以恢复约
15.5 KB 的登录响应。根因是活动运行时把角色功能锁解释成服务器级 `closed`，随后模块 92 和 183
删除了对应协议行；新角色功能尚未全部解锁时，登录包从约 15.5 KB 缩到 10.2 KB，客户端因此解析失败。

修复提交为 `15848fba8959eb0700eb1fa6e8996d1a0680af1c`。活动实例仍按服务器开放时间、活动表和
运营覆盖决定是否运行；角色功能锁只影响该角色能否操作。未开放活动继续保留在模块 92/183，并通过
`act_pause_list` 和模块 183 的 `is_pause=true` 表示暂停。真正尚未到窗口或已经结束的活动仍不会开放。

17:50 CST 发布到 `/data/disk1/game/releases/release-20261113T095018Z`，服务 PID `1374026`。
停服前数据备份为 `/data/disk1/game/backups/pre-20261113T095018Z/data.tar.gz`，SHA256
`9aa3a754101e36240f8b9b1278445b2dc896e30c5246321df643cc880831adb1`。

验证结果：

- 全量测试 252 项，pass 250、fail 0、skipped 2；部署测试 1/1；活动排期审计 errors 0、PASS。
- 用新发布代码和线上数据库一致性副本重放登录：15564 字节、148 个模块。
- 模块 92：31 条 `act_list`、5 个并行组、18 条 `act_custom_list`、42 个暂停 ID。
- 模块 183：player/server 各 56 行，ID 完全配对；其中 42 行暂停。模块 92 的 45 个活动 ID
  全部能在模块 183 找到；仅 `1033001/1039006/1039013` 三个按当前排期保持开放。
- 发布后日志没有 `handler_error`、`login_rejected` 或 `frame_error`；SQLite
  `integrity_check=ok`，accounts 1、roles 1、`user_version=20`。
- 18880/18881/18882/19090 公网监听，18883 仅回环监听。

客户端重登和点击验收仍待用户完成；本轮没有 ADB，不把服务端重放等同于 APK 已验收。

## 上一轮结果（17:43 CST）

- 代码提交：`d79b893c12e50a9b20ff00e958430219155423c7`（`origin/main`，已快进拉取）。
- 发布目录：`/data/disk1/game/releases/release-20261113T074315Z`。
- `current` 已原子切换到上述目录，systemd 单元为 `fate-covenant-realm-3.service`。
- 运行进程：PID `1273943`，`active (running)`，`NRestarts=0`。
- 活动模式 `schedule`，`activeServerId=3`，`launchProfileId=public-realm-3-20261112`，`serverDay=2`。

## 新增发布脚本

`personal-server/deploy/deploy-release.sh`（已随修复提交）执行以下步骤：

1. 检查工作区没有未提交的已跟踪改动，并要求 `HEAD == origin/main`。
2. 运行 `npm test`、自包含部署测试和活动排期审计；审计必须为 `PASS`。
3. 用 `rsync` 创建不可变发布目录，排除 `node_modules`、SQLite、WAL/SHM 和本地运行文件。
4. 在发布目录执行 `npm ci --omit=dev`，写入 `RELEASE_COMMIT` 和 `RELEASED_AT`。
5. 停服，备份整个 `data-realm-3-live-20261112` 数据目录，原子切换 `current`，启动服务。
6. 校验 PID、区服、发布档案、五个监听端口、SDK 健康接口和 SQLite `integrity_check`。
7. 健康检查失败时自动恢复旧 `current` 和数据目录并重启旧服务。

复现命令：

```bash
cd /data/disk1/projects/FateCovenantClone/FateCovenantClone-main
./personal-server/deploy/deploy-release.sh
```

跳过测试的快速发布使用 `./personal-server/deploy/deploy-release.sh --skip-tests`；常规发布不建议跳过。

## 验证证据

- `npm test`：251 项，pass 249，fail 0，skipped 2。
- `npm run test:deployment`：1/1 通过。
- 活动排期审计：1993 行，resolved 1989，errors 0，`Result: PASS`。
- 停服备份：`/data/disk1/game/backups/pre-20261113T074315Z/data.tar.gz`，SHA256 `5a55f4bdbdc735887890d2550fb41d51bd52e683ba8ac3f64b407f1aea7ceaa4`。
- 备份库与线上库：`accounts=1`、`roles=1`、`user_version=20`，备份 `integrity_check=ok`。
- 公网健康检查：`http://140.143.142.251:18880/fc-local-1088.html` 返回 `["http://140.143.142.251:18880"]`。
- 区服列表实测解码：ID `3`、名称“命运三服”、游戏地址 `140.143.142.251:19090`。
- 五个端口：18880/18881/18882/19090 为公网监听，18883 仅 `127.0.0.1`。

## 遗留问题

- 仓库内 `personal-server/deploy/fate-covenant-realm-3.service` 的 `FC_LOCAL_DATA` 仍写作
  `data-realm-3-rollover`，线上实际单元使用 `data-realm-3-live-20261112`；本次发布没有覆盖 systemd
  单元，避免误切数据目录。建议后续把仓库单元与线上实际路径对齐。
- 本次未操作模拟器、ADB 或 APK，未做客户端登录与大厅视觉验收。
