# 进入游戏双错误弹窗修复（2026-11-11）

## 用户现象与日志证据

用户登录后先看到“仅显示物品不可操作”，随后看到“配置出错了”。
`fate-covenant-realm-2.service` 的日志分别记录了两组可复现原因：

- 登录初始化后客户端连续发送 `107703`，依次读取 `1036001`、`1036002`、`1036003` 和 `1036008`。前三项未开放的活动被 `requestActivity` 以 `code 309 / Dragon land activity is not running` 拒绝；随后 `1036008` 才正常返回。客户端把第一次 `309` 渲染成“仅显示物品不可操作”。
- 客户端随后发送 `10507` 进入消息频道，参数为频道类型 `12`。服务端以 `code 5 / Channel type 12 is not available on the local server` 拒绝，客户端渲染为“配置出错了”。

原始日志副本保存在 `/tmp/fc-realm2-log.jsonl`；关键事件为
`dragon_land_rejected`、`s2c_frame_sent errCode=309`、
`message_command_rejected` 和 `s2c_frame_sent errCode=5`。

## 根因

客户端进入大厅时会遍历缓存的活动行，包括尚未开放的活动。`107703` 是读取接口，关闭活动返回空状态属于正常业务语义；旧实现把运行状态检查放在解析活动之后并直接抛错，导致客户端把探测失败展示成全局操作错误。

`MsgTable.ChannelType` 的 type 12 是非跨服、非聊天频道。客户端在消息初始化时调用 `10507` 请求该频道；旧实现只识别世界、系统和私聊类型，因此拒绝了本服频道。

## 修复边界

- `personal-server/game/dragon-land-act-service.mjs` 将活动解析和运行状态判断拆开。`107703` 读取关闭活动时返回该版本首关的完整零态 `guild_info`，并记录 `dragon_land_guild_data_closed`。
- `107701` 和 `107702` 等领奖写操作仍通过 `requestActivity` 校验活动状态，关闭活动继续返回 `309`，不改变防刷与事务语义。
- `personal-server/game/message-service.mjs` 为 type 12 生成按 realm 分配的本地频道 id。server id 为 1 时是 `11200001`，server id 为 2 时是 `11200002`。
- 跨服频道、公会频道和其余尚未支持的频道类型继续明确拒绝。

## 回归覆盖

- `dragon-land-service.test.mjs`：无公会数据时，关闭活动的 `107703` 仍可返回完整零态；活跃活动缺少公会仍返回 `code 5`；领奖状态校验保持原行为。
- `message-service.test.mjs`：`10507 type 12` 返回本服频道 id、空消息列表，并持久化成员关系。
- `message-gateway.test.mjs`：通过真实临时握手和 ETF 请求验证 type 12 返回 `11200001`，且不再产生协议错误。

目标回归命令：

```bash
node --test --test-concurrency=1 \
  test/dragon-land-service.test.mjs \
  test/message-service.test.mjs \
  test/message-gateway.test.mjs
```

结果：23 项通过，0 失败。

修复重放到当前 `main` 后执行全量 `npm test`：总计 2825 项、pass 2823、fail 0、skipped 2。早先旧工作树曾因 `server.net.proto` 的 LF/CRLF 字节哈希不同而出现两个 server-list 失败；当前 main 上这两项也已通过。

## 验收状态

组件与临时 TCP 回归已完成，尚未重启线上服务、部署或操作客户端。部署后重新登录应不再出现上述两个弹窗；日志应出现三个 `dragon_land_guild_data_closed`，以及 `10507` 成功加入 type 12 本服频道的事件，不再出现对应 `errCode=309` 或 `errCode=5`。

## 2026-11-18 复发：已开放的龙息之地，无公会角色登录

状态：本机已修复并部署，隔离客户端进服复验通过。基线：本机 `main@eb1e8ce`，部署包含本轮工作树。

### 现象与证据

- 用户反馈进入游戏再次弹出“配置出错”。`analysis/experiments/launch-20261115/server-data-fixed/events.jsonl` 在 13:44:06.585（UTC+8）记下 `909103` 登录成功和 145 个模块。随后 13:44:08.202 的 `107703 / seq=4` 请求 PB 为 `08e19d3f`，解码得到活动 `1036001`；同一连接 13:44:08.215 实际发送 `errCode=5`，日志原因为 `Guild does not exist`。
- `dragon_land_login_synchronized` 表明活动 `1036001` 在场，关闭活动分支未命中。一致备份 `analysis/experiments/launch-20261115/server-data-fixed/backups/pre-entry-restart-20261118-183320/game.local-only.sqlite` 只读解码模块 24，确认 `guildId` 语义为 `0` 且没有公会对象，属于正常未入会状态。
- 客户端已有 `analysis/scratchpad/pay-dragonlandact-20261108/extracted/DragonLandActData.lua.json`：初始化 `InitData` 在 `IsRunning` 为真时自动发送 `107703`，没有先查是否加入公会；成功回调从 `guild_info` 刷新数据并触发事件。
- 13:44:02.986 客户端另记录了 IP 地址探测的 HTTP 404；它不是 13:44:08.215 的 TCP 错误。同次登录稍后的六条未知 POST 的路径哈希 `6d51c09bb2109f358999b8f30999ae5a37f9b284a4ac5266ff2115bac1479a9e` 与已采集的 `/v1/users/updateGameRoleInfo` 精确匹配，但无证据将其关联到该弹窗。

### 根因与复盘

11 月 11 日只补了“活动关闭”的空读取，未测试“活动开放 × 角色无公会”。相反，组件测试把 `guildId=0` 时拒绝 `107703` 锁成了预期。此次真实自动读取进入活动开放分支，`guildIdOf()` 返回 `null`，之后被错误翻译成配置错误 5；活动、首关和角色数据并没有缺失。

### 修复范围与防复发

- 先加回归：以本机开服时间和实际登录时间通过临时 TCP 登录，再发送观察到的 `107703` 请求，要求有效的 `guild_info`、无错误；组件覆盖已有其他公会进度时无公会读取仍无成员、无贡献、无写入。
- 正常无公会仅在 `107703` 返回该活动首关的零态；重复读取也不创建或假定公会。已有公会继续读取真实进度，`107702` 的无公会领奖拒绝、活动写入门禁及无效请求拒绝不变；活动开关与排期不变。

### 验证与边界

| 级别 | 结果 |
| --- | --- |
| 修复前回归 | 两条新测试分别复现组件异常 `Guild does not exist` 和 TCP `err=5`，见 `analysis/test-runs/entry-config-error-20261118-before.log` |
| 组件与临时 TCP | 龙息之地、消息频道、SDK 定向 53/53；`npm test` 快速套件 541 项，539 通过、2 跳过、0 失败；见 `analysis/test-runs/entry-config-error-20261118-after.log`、`analysis/test-runs/entry-config-error-20261118-fast.log` |
| 本机服务 | 18:59:15.430 从工作树启动；验收 PID `3672`，保留开服锚点 `1794690000` 和 `schedule/absolute`，五端口仅监听回环；SDK 本地 GET、启动清单、管理页均 200，SQLite `quick_check=ok`，stderr 空 |
| 隔离 APK | 复用原测试账号，19:10:02.750 登录成功、下发 145 个模块；19:10:04.351 再现同一 `107703 / seq=4`，19:10:04.364 命中 `dragon_land_guild_data_no_guild`，19:10:04.365 成功回包、无 `errCode`，连接继续收到心跳。客户端日志打开 `MainUIForm` 与 `MainHouseForm`，进服截图中未复现“配置出错” |

- 部署前一致备份：`analysis/experiments/launch-20261115/server-data-fixed/backups/pre-entry-fix-20261118-185512/game.local-only.backup.sqlite`，1,695,744 字节、SHA256 `594b4bc02f9fa96b6d123986f18d487e36cb15335c8b4b28d4f0661f3750764f`，`integrity_check=ok`，2 角色、1 账号；保留原运行库和会话文件。
- 模拟器恢复五条本地转发与四条 ADB reverse 后重开隔离包，未修改 APK、账号或资产；客户端日志摘要 `analysis/experiments/launch-20261115/client-hall-entry-20261118.local-only.log`，进服活动展示图 `analysis/experiments/launch-20261115/client-hall-entry-t9-20261118.local-only.png`。
- 零态是本项目复用既有协议形状的兼容行为，不冒称取得原服务器无公会时的回包。复验仍有独立的 [SDK 外部 IP 探测 404](sdk-ip-discovery-404-20261118.md) 和角色上报 404，但都未阻断本次进服；未改这些 HTTP 路由、活动结算或公网部署，也未把进服验证扩写成其他玩法验收。
