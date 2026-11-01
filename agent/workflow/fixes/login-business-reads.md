# 登录期 CMS 与公会国家协助读取

状态：代码、数据库迁移、组件测试和临时 TCP 网关验证通过；待合入 `main` 后部署及客户端复验。

## 现象与证据

- 2026-11-01 客户端登录成功后打开错误提示。日志显示 `req_guild_nation_get_assist_list` 返回 `err=2, LOCAL_NOT_IMPLEMENTED:99229`，地点为 `analysis/experiments/private-server-20261025/p3/client-log-20261101-201745.log`。
- 同一登录流程还请求 CMS 问卷 `89501 req_cms_data_info`，旧网关同样落到 `LOCAL_NOT_IMPLEMENTED`。
- 两条请求都由正常客户端流程触发，固定空响应会掩盖状态查询和参数错误，不满足业务语义。

## 客户端规则

- `CmsMgr.TryReqInfo` 按 `CmsTable` 的 `fun_open`、`req_duration` 控制请求，并发送 CMS `tid`。当前配置只有 `tid=1 -> pb_cms_question_info`。客户端解码 `question_list` 后按 `end_time` 排序。
- `GuildNationMgr.LoginFinish` 和进入公会国家界面都会调用 `GuildNationAssistMgr.ReqNewAssistList()`。请求没有业务值，但线上实际发送 ETF atom `nil`（7 字节），返回 `pb_guild_nation_assist_list_back`；空 payload、空列表和 `nil` 都按无参数处理。

## 实现

- 游戏数据库升级到 schema v11，新增 `cms_questions` 和 `guild_nation_assists`，迁移标记为 `login-business-reads-v11`。
- CMS 服务只接受 `CmsTable` 已配置的 CMS 类型；查询启用、`start_time <= now < end_time` 且类型匹配的记录，按结束时间排序。没有有效记录时返回空 `question_list`。
- 公会国家协助服务从登录模块 24 读取当前公会，只返回该公会、尚未到 `finish_time` 且 `assist_num < max_num` 的记录，按完成时间和唯一 ID 排序。无待协助记录时返回空 `list`。
- 网关新增 `89501` 和 `99229` 的真实路由、参数校验、业务错误回包及成功/拒绝事件日志。

## 验证

- `node --test test/login-business-reads.test.mjs`：3/3 通过，覆盖有效非空 CMS、过期/未来/禁用/其他类型过滤、空结果、当前公会过滤、过期/满额/其他公会过滤、重开持久化及真实 TCP 网关（`99229` 使用实际 ETF `nil` 字节）。
- 相关模块均通过 `node --check`，`git diff --check` 通过。
- schema v11 测试同时验证旧 v10 备份可迁移，迁移标记存在。
- `gameplay-gateway.test.mjs` 在本分支和同一 `main` 基点的对照 worktree 都得到相同的 3 个既有数据夹具失败（鱼饵 50/25、线性任务 `err=310`、WishTree 外键）；本功能使用独立真实 TCP 测试验证，不依赖这些失败用例。

## 部署前置

- 部署前对运行库执行含 WAL 的一致备份并核对 `integrity_check=ok`。
- 重启后必须确认 `18880/18881/18882/18883/19090` 只监听 loopback，服务日志不再出现 `unsupported_command 89501/99229`。
- 客户端复验中不应再出现对应 `业务请求服务器异常` 或由这两条命令打开的新 `ShowMsgView`。
- 本次只修改服务端，无需更新 APK 快照。
