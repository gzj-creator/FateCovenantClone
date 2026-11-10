# 命运二服开服档案与企业级无状态部署

## 范围与分支

- 分支：`task/new-server-profile-20261110`
- 独立 worktree：`.worktree/new-server-profile-20261110`
- 未启停现有实时服务，未读写现有运行数据库，未操作模拟器、ADB 或 APK。
- 本次准备可部署发布物；尚未部署到 `140.143.142.251`，也未完成公网 APK 登录验收。

## 开服配置

- 活动模式从本地联调使用的 `all-open` 改为正式 `schedule`。
- 新服：ID `2`、名称“命运二服”、角色 `100002`、角色名“命运旅者”。
- 开服时间：`2026-11-10T05:00:00+08:00`（Unix `1794258000`）。
- 活动模板锚点：`2026-10-24T05:00:00+08:00`（Unix `1792789200`）。
- 发布档案：`public-realm-2-20261110`。
- 公网游戏地址保持：`140.143.142.251:19090`。

`local-server` 在公网模式校验活动配置中的 `serverOpenedAt` 与当前区服 `launchAt` 完全一致；
`FC_SERVER_OPENED_AT` 不能再覆盖公网开服时间。

## 活动时间重基准

新增 `game/launch-profile.mjs`。新库首次 seed 时计算：

```text
offset = serverOpenedAt - activityWindowAnchor
```

该增量应用于登录结构中的：

- 模块 92 的 `act_custom_list.start_time/end_time`。
- 模块 92 活动状态的 `history_time.enter_time`。
- 模块 183 玩家活动阶段的开始、结束和历史时间。
- 模块 183 服务端阶段以及 `stage_time_list` 窗口。

样本模板的活动绝对时间因此整体平移到新服；相对区服时间继续由新服 `serverOpenedAt` 计算。
当前样本模块 92 的 96 条绝对活动窗口全部参与平移。测试覆盖开服第 1、2、7、8 天及第 9 天关闭边界。

## 持久卷与配置漂移保护

- 首次建库把 `launchProfileId`、区服/角色身份、活动锚点和开服时间写入角色 metadata。
- 回开同一外部卷时要求这些字段完全匹配。
- 配置漂移在数据库迁移开始前 fail fast，返回明确错误，避免旧服被静默改写为新服。
- 数据库不会因配置变化自动重基准；另一个开服档案必须使用新的空外部卷。

## 无状态发布

- `personal-server/Dockerfile` 生成生产镜像；镜像不包含运行数据库。
- `compose.yaml` 使用命名卷 `fate-covenant-realm-2-20261110`，挂载到
  `/var/lib/fate-covenant/realm-2`。
- 容器根文件系统只读，业务进程以非 root `node` 用户运行，丢弃 capabilities，
  并设置 `no-new-privileges`。
- 公网只映射 `18880/18881/18882/19090`；管理端只映射宿主机 `127.0.0.1:18883`。
- 公网模式强制 `FC_LOCAL_DATA` 为源码树之外的绝对路径并拒绝缺失或源码内路径。

## Git 数据卫生

- 根 `.gitignore` 忽略 `*.sqlite` 与 `*.sqlite-*`，覆盖主库、WAL 和 SHM。
- 已从 Git 索引移除 `personal-server/fixtures/game.sqlite`。
- 已从 Git 索引移除 `personal-server/test/fixtures/wallet-admin.sqlite`，其唯一测试依赖改为使用
  `test/helpers/game-fixture.mjs` 动态创建临时库。
- 本地文件保留在工作树磁盘中，但没有进入本次 Git 改动。

## 验证

定向测试：

```text
node --test --test-concurrency=1 test/activity-calendar-config.test.mjs test/launch-profile.test.mjs test/server-config.test.mjs test/item-suit-box.test.mjs
```

结果：`14/14` 通过。随后扩展开服 wiring 与外部目录检查，另行执行的
`test/launch-profile.test.mjs` 与 `test/self-contained-deployment.test.mjs` 共 `6/6` 通过。

独立部署测试确认：

- 发布副本不包含 SQLite。
- 空外部目录能创建运行库并启动五个服务。
- 区服接口返回 ID 2 和命运二服。
- 启动状态包含正确开服档案与活动锚点。
- 公网模式缺少 `FC_LOCAL_DATA` 或路径位于源码树内时拒绝启动。

首次全量回归暴露一个旧测试“非开服档案仍应使用原 createdAt”假设；定向修复后最终全量回归
`2817` 项、pass `2815`、fail `0`、skipped `2`，耗时约 461 秒。

本机未安装 Docker，因此没有执行 `docker compose build`。容器构建需要在部署主机完成。

## 上线边界

1. 在部署主机构建并启动 Compose。
2. 核对 `server.local-only.json` 中 `activeServerId=2`、正确发布档案、
   `serverOpenedAt=1794258000` 和 `serverDay=1`。
3. 云安全组和主机防火墙仅开放四个公网 TCP 端口；`18883` 不对外开放。
4. 使用公网 APK 完成 SDK 登录、区服选择、网关握手、大厅和首个活动验收。
5. 上线前和每次升级前备份整个外部卷；不得用新配置挂载旧服卷。
