# 团员名册实现

状态：组件测试与临时 loopback TCP 集成测试通过。尚未安装或启动 APK，未做模拟器联调和界面视觉验收。

分支：`feature/system-member-roster-20261031`。

## 结论

用户所称“团员名册”对应公会界面的 `GuildInfoForm`，数据管理器为 `GuildMgr`，登录模块为模块 24。当前实现覆盖登录初始化、成员列表读取、任免职位、转让会长、踢出成员和退出公会，使用 SQLite 的 `login_modules` 表持久化，不新增专用业务表。

这与角色名册、英雄图鉴或其他名称相近的界面无关。`ModuleTable.data.lua.json` 中模块 24 的数据名是 `航会`（游戏数据中的原词），同一数据区域紧邻常量 `GuildMgr`。

## 静态证据

| 证据 | 位置 | 证明内容 |
| --- | --- | --- |
| 登录模块表 | `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_general.bundle/bytecode/ModuleTable.data.lua.json` | 原型 5 中存在行 `[null, 24, "航会", "", 0, null, "project/guild", 7504, null, 15]`，相邻常量包含 `GuildMgr`。 |
| 名册界面 | `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/6925042128488278000-GuildInfoForm.lua.bin` | 原型 5 使用 `GetMyMemberInfo`、`member_list` 和 `RefreshMemberList`；原型 17 将 `GUILD_TRANSFER_PRESIDENT`、`GUILD_APPOINT_OFFICER`、`GUILD_REMOVAL_OFFICER`、`GUILD_TO_LEAVE` 分别接到 `ReqChangePresident`、`ReqAppointJob`、`ReqDeposeJob`、`ReqExpelMember`。 |
| 公会管理器 | `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/17742175181654671000-GuildMgr.lua.bin` | 原型 7 解析 `pb_res_guild_login`；原型 30 的踢人参数为 `[guildId, roleId]`；原型 46 的转让参数为 `[guildId, roleId, TID_PRESIDENT]`；原型 49 任命参数为 `[roleId, TID_OFFICER]`；原型 54 降职参数为 `[roleId, TID_MEMBER]`；原型 163 的退出参数是整数 `guildId`；原型 92 处理 `ResGuildMemberChange`。 |
| 接口目录 | `agent/workflow/interface-catalog/static-interfaces.json` | C2S `21005 req_guild_info`、`21006 req_expel_member`、`21010 req_change_member_job`、`21007 req_leave_guild` 均声明为 ETF，编码器模块为 `GuildCmd`；推送 `2305 rev_guild_member_change` 的处理器为 `GuildMgr.ResGuildMemberChange`。 |
| 协议结构 | `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/11784509489320930000-guild.net.proto.bin`、`4758822748866942000-guild.db.proto.bin` | `pb_res_guild_login` 包含 `guildId`、`last_leave_time`、`leave_count`、`guild`；`pb_guild.member_list` 是重复的 `pb_guild_member`；单个成员字段为 `role_id`、`job`、`join_time`；`pb_res_guild_member_change` 包含 `member_list`、`log_list`、`impeach_uid`、`can_transfer_time`；`pb_guild_leave` 包含 `count`、`reset_day`。 |

自动化测试会读取上述模块行、Lua 字节码中的方法名和上述接口/结构清单，防止后续把模块或命令改回错误目标。

## 登录与命令格式

登录 ETF 的模块列表中增加一项 `[24, <<pb_res_guild_login>>]`。当数据库里没有模块 24 或载荷为空时，登录流程先写入一份确定性本地公会数据，再组装登录包。

当前本地初始数据为：公会 ID `900001`，角色本人为会长，另有 1 名官员和 3 名成员，共 5 人。职位值按客户端常量使用会长 `1`、官员 `2`、成员 `6`。这部分是离线单机 fixture，不是从原服务器抓到的真实公会数据。

| 命令 | 请求 | 回复 | 推送 |
| --- | --- | --- | --- |
| `21005 req_guild_info` | 无载荷，或可选的公会 ID | `pb_guild` | 无 |
| `21006 req_expel_member` | ETF 二元组 `[guildId, roleId]` | 空回复 | `2305`，携带更新后的 `pb_res_guild_member_change.member_list` |
| `21010 req_change_member_job` | 二元组 `[roleId, job]` 用于任命或降职；三元组 `[guildId, roleId, TID_PRESIDENT]` 用于转让会长 | 空回复 | `2305`，携带更新后的成员列表 |
| `21007 req_leave_guild` | ETF 整数 `guildId` | ETF 列表 `[<<pb_guild_leave>>]` | `2305`，携带移除本人后的成员列表 |

`2305` 的 protobuf 为 `pb_res_guild_member_change`，本实现写入 `member_list`，并将 `log_list` 置为空列表。回复先于推送发出。

## 业务规则与持久化

- 仅允许会长转让会长；目标必须是现有成员，且不能是本人。
- 仅允许会长任命官员、降职官员；职位变更只能按客户端已暴露的成员、官员、会长三种值执行。
- 会长和官员可以踢出低职位成员；不能踢自己，也不能踢同级或更高职位。
- 会长必须先转让职位才能退出公会。退出后模块 24 的 `guildId` 写为 0，记录 `last_leave_time`，累加 `leave_count.count`，并删除 `guild` 对象。
- 每次读写都在 `store.transaction()` 内完成。命令成功时登录模块和资源/状态快照一并提交；protobuf 打包异常或 SQLite 写入异常会回滚整个事务。
- 所有变更仅写入逻辑库中的模块 24 载荷，不触碰客户端本地文件、运行中的服务数据库或 APK。

两处规则没有被原服报文证明，代码中按本地策略处理：转让会长时原会长回落到成员 `6`；官员人数上限为 4。游戏原服的这两种规则仍需真实抓包确认。错误码也使用通用业务错误 `5`，因为原服的具体公会错误码尚未取得证据。

## 实现位置

- `personal-server/game/guild-roster-service.mjs`：模块 24 初始化、命令解析、成员变更、退出和推送载荷。
- `personal-server/game/gateway.mjs`：登录模块注入及 `21005`、`21006`、`21010`、`21007` 路由。
- `personal-server/test/member-roster.test.mjs`：静态证据、临时 TCP 集成、SQLite 重启持久化和事务回滚测试。

## 验证

在 `personal-server` 目录执行：

```powershell
node --test --test-force-exit test/member-roster.test.mjs
```

结果：3 项通过、0 项失败。覆盖模块 24 登录载荷解码、真实 ETF 请求/回复、职位任免、踢人、转让、退出、重复/越权操作拒绝、SQLite 关闭重开后的状态，以及响应打包失败时的事务回滚。

在 worktree 根目录执行：

```powershell
npm test --prefix personal-server
```

结果：298 项通过、0 项失败。

## 边界

本次只实现已经定位的登录模块 24 和上述四个命令，没有实现创建公会、申请加入、搜索、日志、捐献、科技、活动、公会战等未验证子功能。没有在原版客户端、隔离 APK 或 MuMu 上安装、重启或操作界面，因此“服务端接受协议”和“玩家在名册中看到变更”仍是两个不同层级的结论；当前只有前者中的组件与临时 loopback TCP 证据。
