# 多区服与命运三服开服记录（2026-11-12）

## 结论

主线现已支持在同一台主机上运行多个区服进程。区服列表由 config/public-server.json
统一描述，所有区服进程都返回完整列表；客户端因此能在选择界面看到命运二服和命运三服。
2026-11-12 19:19 CST 两个区服在 140.143.142.251 上同时运行。

## 改动

| 文件 | 变化 |
| --- | --- |
| config/server-config.mjs | 新增 selectActiveServer，activeServerId 支持进程级覆盖；未覆盖时行为不变 |
| local-server.mjs | 公网模式广播全部区服；新增 FC_ACTIVE_SERVER_ID 与 FC_SDK_SESSION_SOURCE |
| sdk-service.mjs | 新增只读 sessionSourcePaths，按 mtime+size 增量刷新，不写入来源文件 |
| config/public-server.json | 新增区服 3 命运三服，roleId 100004，发布档案 public-realm-3-20261112 |
| config/activity-calendar-realm-3.json | 区服三活动日历，锚点与参考服不变，仅替换开服时间 |
| scripts/audit-activity-schedule.mjs | 支持 FC_ACTIVITY_CALENDAR_CONFIG，可审计任意区服日历 |

## 为什么需要会话共享

客户端公网只配置一个 SDK 地址（140.143.142.251:18880，属于区服二进程）。玩家在 SDK 登录
后拿到 channel_uid + token，随后连到所选区服的网关。区服三的网关必须能验证同一个 token，
因此区服三进程设置：

```text
FC_SDK_SESSION_SOURCE=/data/disk1/game/data/sdk-sessions.local-only.json
```

它只读取区服二的会话快照；区服二自己的登录、过期清理和写回逻辑没有变化。

## 部署结果

| 项目 | 命运二服 | 命运三服 |
| --- | --- | --- |
| systemd 单元 | fate-covenant-realm-2.service | fate-covenant-realm-3.service |
| 数据目录 | /data/disk1/game/data | /data/disk1/game/data-realm-3 |
| 端口 | 18880/18881/18882/19090，管理 18883 | 18890/18891/18892/19091，管理 18893 |
| 发布档案 | public-realm-2-20261110 | public-realm-3-20261112 |
| serverOpenedAt | 1794326400 | 1794477600 |
| 当前 serverDay | 2 | 1 |
| 数据库版本 | 20 | 20（首建） |

开服发布版本 release-20261112T111827Z，RELEASE_COMMIT=fe86043。随后在文档提交后部署
release-20261112T113500Z，RELEASE_COMMIT=fbefeb0，当前两个进程均运行此版本。
前一次切换的数据库备份为 /data/disk1/game/backups/pre-realm-3-20261112T111827Z/data.tar.gz
（SHA256 e6609df4f441a17c1ee2111a43c3bb542f07b58dc4e320db90557470fbaa1af9）；
fbefeb0 发布切换前备份为 /data/disk1/game/backups/pre-main-fbefeb0-20261112T113500Z/data.tar.gz
（SHA256 d12539137b00906546191c376966ef65abc27131c701222d88dbf67964f95251）。

## 验证

全量 npm run test:all：2901 项、pass 2899、fail 0、skipped 2。

新增集成用例 test/multi-realm-gateway.test.mjs：真实 TCP 握手加真实 SDK 会话，区服二与
区服三各自登录成功（roleId 100002 / 100004），区服三拒绝 server_id=2 与未知 token。

线上真实链路：18880 SDK 登录拿到 token；19090 以 server_id=2 登录返回 148 个模块、角色
100002；19091 以 server_id=3 登录返回 148 个模块、角色 100004；用 server_id=2 打区服三
被拒。区服列表在 18881 与 18891 均返回两个区服，login_server(3) 回包正确。

区服三日历审计：1993 行、resolved 1989、Errors 0、Result PASS。两个区服 SQLite
integrity_check=ok，区服三只有角色 100004（server_id=3）。

## 已知前置条件与后续

腾讯云安全组只需要额外放行 19091（区服三的游戏网关）：客户端仍用已放行的
18880/18881/18882 完成 SDK 登录、取区服列表和版本检查，选中命运三服后才连 19091。
18890/18891/18892/18893 是区服三自己的 SDK、列表、更新和管理端口，客户端不会访问。
本机 iptables 只拒绝特定来源的 22 端口，没有拦截上述端口；实测外部连 19091 目前超时。

区服三依赖区服二的 SDK 会话文件，因此区服二的数据目录必须可读；区服二停服不影响已有会话
的持续使用，但新登录需要区服二在线。

目前只是服务端可登录；APK 视觉验收（区服选择列表、进入区服三、首日开服活动）由用户完成。

## 2026-11-12 切换到单区服端口

用户要求关闭命运二服，并让命运三服占用二服原来的公网端口。当前配置只广播 ID 3
（命运三服），游戏地址改为 140.143.142.251:19090；客户端仍使用
18880/18881/18882 完成 SDK 登录、区服列表和更新检查。fate-covenant-realm-2.service
保留在机器上但停止并禁用，fate-covenant-realm-3.service 改用这套端口并不再依赖二服的
SDK 会话文件。三服最终上线在全新空目录 data-realm-3-live-20261112，避免把早期 9 级测试
占位角色当成新服存档。旧目录和切换前数据库均完整保留。

2026-11-12 21:12 CST，发布版本 release-20261112T131204Z（提交 7de7c72）上线。空服修正在
公网模式仅写入 empty-realm-v1 建库标记，首位账号登录时才生成角色 1、等级 1 的完整新手
存档；账号、钱包和活动启动任务都在有角色后才执行。发布档案校验区服、开服档案和开服时间，
空服首角色不比较配置模板 ID。上线时 roles=0、accounts=0，真实手机 SDK 首次登录后 roles=1、
accounts=1，角色 1 为 1 级、经验 0、148 个登录模块；重启后再次登录保持同一角色。

切换前旧三服数据备份：
/data/disk1/game/backups/pre-empty-realm-20261112T131204Z/data-realm-3-rollover.tar.gz，
SHA256 e76ed1f0ffea27931f070afcc9db8d76011540c6300d9f49f7d42b556b0f637f。
定向测试 15/15，部署测试 1/1，全量测试 1707 项（pass 1705、fail 0、skipped 2）。
