# BLOCK-E1 实施记录

日期：2026-11-08。分支：`task/BLOCK-E1-20261108`。worktree：`.worktree/gameplay-20261106/block-e1-20261108`。基线：main `8ebd5a1`。

**状态：服务端完成（#87、#91–#106 的 128 个 type 全部接入派发），其中 82 条有真实业务路径，46 条按证据缺口 fail closed；SOC-FRIEND / SOC-MSG / SOC-CHAT（#88–#90，34 条）已在此前批次合入，未重写。待 APK 验收与缺口证据补齐。**

| 层级 | 结果 |
| --- | --- |
| 业务服务 | 三个新服务：公会狭义命令 31 type、社交社区 18 type、公会活动 79 type |
| 网关派发 | `gateway.mjs` 仅新增 3 个 import、3 个服务实例与 3 个派发块（位于 chat 之后、909103 之前） |
| 临时 TCP | 通过，见 `test/guild-society-gateway.test.mjs` |
| SQLite 重开 | 通过，公会档案/申请/日志、支持/评论/地图、公会活动状态重开后仍生效 |
| 异常回滚 | PB 编码失败时公会改名、玩家助力整体回滚 |
| fail closed | 46 条命令返回业务错误码 5，不以空包伪装成功 |
| APK/UI | 未做（本轮禁止操作模拟器/APK/实时服务） |

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `personal-server/game/guild-society-service.mjs` | 公会数据查询、创建/申请/推荐/搜索、基础信息、解散/弹劾、招募、捐献、改名、日志、社交戳、入场、通知邮件、分配比例、工资/宝箱领取、活跃度与自动解散已读 |
| `personal-server/game/social-community-service.mjs` | 玩家助力、实时地图、英雄评论/点赞/评分、关系标记、冒险列表、攻略排行、弹幕点赞 |
| `personal-server/game/guild-activity-service.mjs` | 公会红包、公会试炼、公会探索/探索试炼、公会战、公会对决、公会竞速 |
| `personal-server/game/gateway.mjs` | 新增 import、三个服务实例、三个派发块，以及一个 `etfInput` 解码辅助 |
| `personal-server/test/guild-society-service.test.mjs` | 11 项服务级测试 |
| `personal-server/test/social-community-service.test.mjs` | 8 项服务级测试 |
| `personal-server/test/guild-activity-service.test.mjs` | 7 项服务级测试 |
| `personal-server/test/guild-society-gateway.test.mjs` | 1 项真实临时 TCP 测试（握手 + 登录 + 数字 type） |

未修改 `storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*`。三个服务各自 `store.inspect` 内创建私有表，不改全局 schema 版本。

## 协议与证据来源

- 请求/回包结构取自 `personal-server/assets/protobuf/`（文本 proto：`guild.net`、`guild.db`、`guild_active.*`、`guild_red_envelope.net`、`guild_trial.*`、`guild_explore.*`、`guild_war.net`、`guild_duel.*`、`guild_racing.*`、`support.*`、`realtime_map.*`、`hero_comment.*`、`relationship.*`、`danmaku.net`、`function_cache.net`、`res.net`、`flush_time.db`）。
- 逐 type 的编解码方式（protobuf / ETF）与 schema 名称取自 `agent/workflow/interface-catalog/interfaces.json`。
- 公会客户端逻辑取自 `personal-server/test/fixtures/GuildMgr.lua.bin` 的 ASCII 字符串导出（词法器 `tools/dump-luajit-prototypes.mjs` 对该文件失败，属已知缺口）：`CREATE_COST_ITEM`、`APPLY_MAX_COUNT`、`APPLY_CD_TIME`、`KICK_INDEX`、`RECRUIT_INDEX`、`rename_cost_item`、`normal_rename_times`、`pay_and_box`、`TID_GUILD_PAY_BOX_CONSTANT`、`pb_guild_log_data`、`GuildTable` 等级奖励。
- 其余客户端模块（`GuildActiveMgr`、`SupportMgr`、`HeroCommentMgr`、`RelationShipMgr`、`GuildRedEnvelopeActiveMgr`、`FunctionCacheGuildHandle`、`Guild*Table.data.lua`）位于 `analysis/scratchpad/time-temple-20261108/project/`，仅字符串可读；数值行（GuildTable / GuildActiveTable / GuildExploreTable / GuildWarTable 等）**未提取**。

## 权威状态与设计

### 公会（module 24）

`pb_res_guild_login` 是公会聚合的权威来源，与既有 `guild-roster-service.mjs` 共用 module 24。本服务读写其中的 `guildId`、`guild` 以及子状态字节字段：`contribute_info`(pb_guild_contribute)、`guild_active`(pb_role_guild_active)、`pay_and_box`(pb_guild_pay_box)、`sundry`(pb_guild_sundry_role)、`guild_rename`(pb_guild_rename_info)、`role_social`(pb_guild_social_role)、`auto_dissolve_role`(pb_guild_auto_dissolve_role)、`count_info`(pb_count_list_flush)。其它公会（目录）、入会申请、公會日志存 SQLite：

| 表 | 作用 | 关键约束 |
| --- | --- | --- |
| `guild_directory` | 所有公会的可搜索/推荐快照（本服 + 虚构对手） | PK(guild_id)，name UNIQUE |
| `guild_apply_inbox` | 入会申请收件箱（有向） | PK(guild_id, role_id) |
| `guild_logs` | pb_guild_log 事件流水 | guild_id + 自增 log_id |

原服存档里本服只有一个公会成员，故 `21001` 在空模块上真实创建，其余命令对 `guildId=0` 或非成员返回 code 5。`guild_directory` 里其他公会的行仅由测试/运营写入，服务从不伪造对手数据。

### 社交社区（无登录槽）

玩家助力、实时地图、英雄评论、关系标记都以 `roles` 表中真实 `role_id` 为目标，校验存在性；自身为目标、未知目标分别 code 1 / 5。表：`community_support`、`community_supported`、`community_comments`、`community_scores`、`community_comment_likes`、`community_relations`、`community_danmaku_likes`、`community_map_presence`。

### 公会活动

状态按 `(guild_id, role_id, scope, key)` 存于 `guild_activity_state`，事件流存 `guild_activity_events`。`guild_id` 解析顺序：`model.state.guildId` → module 24 `guildId` → `guild_directory` 首行 → 0，保证活动数据归到当前公会。

### 日界

`FlushTime.NowDay` 未取证，沿用仓库既有 `serverDayNumber(serverOpenedAt, at)`（与登录 `day_count`、first-week-goal 同源），属推断而非客户端事实。

## 命令覆盖表

列：type / 名称 / 结果 / 说明。`实现` = 有真实读写与回包；`空列表` = 回包结构未恢复但以真实空列表应答并登记缺口；`缺口` = fail closed（code 5）。

### 公会（#87、#91、#92）

| type | 名称 | 结果 | 说明 |
| ---: | --- | --- | --- |
| 171 | req_guild_data | 缺口 | GuildDataTable 的 block_id 映射未提取 |
| 21001 | req_create_guild | 实现 | 真实创建、写目录/日志、清空申请；重名/已在会 310 |
| 21002 | req_apply_join | 实现 | 写申请收件箱与 guild_applies；重复 310，未知会 5 |
| 21003 | req_handle_join_apply | 实现 | 会长/官员审批，同意则入 member_list 并刷新目录 |
| 21004 | req_guild_recommends | 实现 | 按 active 排序的目录快照（排除本会） |
| 21008 | req_change_guild_base_info | 实现 | 公告/徽章/审核/等级门槛/战力门槛 |
| 21012 | req_search_guild | 实现 | 按 id 或名称模糊查目录 |
| 21013 | req_dissolve_guild | 实现 | 会长解散，清目录/申请，module 24 回 0，累加 leave_count |
| 21014 | req_impeach | 实现 | 非会长发起弹劾，写 impeach_uid，重复 310 |
| 21015 | req_send_recruit | 实现 | 每日 3 次招募，累加 count_info 与 sundry |
| 21016 | req_contribute | 实现 | 每日 3 次，累加公会 active 与 contribute_info |
| 21017 | req_receive_guild_box | 缺口 | guild_box_receive 回包结构未恢复 |
| 21018 | req_guild_force_rename | 实现 | 仅在 `need_rename` 时执行 |
| 21019 | req_guild_log | 实现 | ETF 包装 `pb_guild_log_data`（6 字节头 + PB） |
| 21020 | req_guild_level_award | 缺口 | GuildTable 等级奖励行未提取 |
| 21021 | req_guild_rename | 实现 | 会长改名，写目录与 guild_rename 计数 |
| 21022 | req_guild_social_stamp | 实现 | 写 role_social.copy_stamp |
| 21023 | req_enter_guild_scene | 实现 | 校验成员并记录场景进入日志，空回包 |
| 21024 | req_send_notice_mail | 实现 | 会长/官员发公告邮件，写 last_notice_mail_time |
| 21025 | req_read_transfer | 实现 | 写 sundry.read_transfer_stamp |
| 21026 | req_guild_box_award | 实现 | 领取 pay_and_box.pb_role_box_award，经 grantResources 真发资源 |
| 21027 | req_guild_special_task_award | 缺口 | GuildActiveTable 特殊任务行未提取 |
| 21028 | req_set_distribution_ratio | 实现 | 会长设置 0–100 分配比例 |
| 21029 | req_guild_pay_record | 实现 | 回 `pb_req_guild_pay_record{add_record}` |
| 21030 | req_guild_pay_award | 实现 | 领取 role_pay_award，经 grantResources 真发资源 |
| 21031 | req_notice_change_read | 实现 | 写 sundry.read_notice_notice_stamp |
| 85501 | req_guild_active_award | 缺口 | GuildActiveTable 每日奖励行未提取 |
| 85502 | req_guild_active_point | 实现 | 回 `pb_guild_active_info`（今日活跃/明细/刷新戳） |
| 85503 | req_guild_active_finish_award | 缺口 | GuildActiveTable 完成奖励行未提取 |
| 85504 | req_guild_auto_dissolve_read | 实现 | 置 dissolve_read |
| 85505 | req_guild_pre_auto_dissolve_read | 实现 | 置 pre_dissolve_read |

### 社交社区（#93–#98、#101）

| type | 名称 | 结果 | 说明 |
| ---: | --- | --- | --- |
| 46001 | req_support_player | 实现 | 写入支持/被支持账本，每日 10 次；自支持 1，未知 5 |
| 46002 | req_get_supported | 空列表 | ETF 元素结构未恢复，返回空包并登记缺口 |
| 75001 | req_enter_map | 实现 | 写地图在场并回 `pb_realtime_enter_map_back` |
| 75002 | req_leave_map | 实现 | 删除在场记录 |
| 75003 | req_back_born | 实现 | 在场位置归零 |
| 75004 | req_move | 实现 | 更新 loc_index；不在场 5 |
| 75005 | req_teleport | 实现 | 同移动，不在场 5 |
| 76601 | req_hero_comment_info | 实现 | 回评分汇总 + 评论列表 |
| 76602 | req_add_like_count | 实现 | 记录点赞，每日 10 次，重复 5 |
| 76603 | req_hero_comment_insert | 实现 | 写真实评论，内容非空 ≤200 |
| 76604 | req_hero_comment_set_score | 实现 | 评分 1–5，每日 3 次修改 |
| 76605 | req_role_comment_score_info | 实现 | 回角色评论/评分记录 |
| 77501 | req_relation_mark | 实现 | 写关系标记；自标记 1 |
| 77502 | req_relation_un_mark | 实现 | 删除标记；不存在 5 |
| 77503 | req_relation_set_no_notify | 实现 | 修改免打扰位 |
| 77601 | req_adventure_role_list | 空列表 | ETF 元素结构未恢复，返回空列表并登记缺口 |
| 79201 | req_hero_strategy_ranks | 空列表 | 同上 |
| 84701 | req_like_danmaku | 实现 | 累加频道弹幕点赞计数 |

### 公会活动（#99–#106）

| type | 名称 | 结果 | 说明 |
| ---: | --- | --- | --- |
| 83101 | req_guild_red_envelope_fetch | 缺口 | GuildRedEnvelopeTable 数额未提取 |
| 83102 | req_guild_red_envelope_send | 缺口 | 同上 |
| 83103 | req_guild_red_envelope_get_data | 实现 | 真实空红包板投影 |
| 83104 | req_guild_red_envelope_create | 缺口 | 同上 |
| 83105 | req_guild_red_envelop_show_log | 缺口 | `pb_guild_red_envelope_fetch_log` 在已发布 protobuf 中不存在 |
| 83106 | req_guild_red_envelope_thanks | 实现 | 记录感谢事件 |
| 83107 | req_guild_red_envelop_rank | 实现 | 空排行榜（本地无红包数据） |
| 83108 | req_guild_red_envelope_fetch_join | 实现 | 累加入会红包领取次数 |
| 83401 | req_guild_trial_help_info | 实现 | 回求助列表（本地为空） |
| 83402 | req_guild_trial_help_log | 实现 | 回 `pb_guild_trial_help_log` 真实事件 |
| 83403 | req_guild_trial_help | 实现 | 记录助战（type/mon_tid） |
| 83404 | req_guild_trial_set_notice | 实现 | 写试炼公告（≤120） |
| 83405 | req_guild_trial_gain_pass_award | 缺口 | GuildTrialTable 通关奖励未提取 |
| 83406 | req_guild_trial_gain_box_award | 缺口 | GuildTrialTable 宝箱奖励未提取 |
| 83407 | req_guild_trial_gain_fight_log | 实现 | 记录战斗日志事件 |
| 83408 | req_guild_trial_rev_fail | 实现 | 累加复活失败次数 |
| 83409 | req_guild_trial_suppress | 缺口 | GuildTrialTable 怪物战斗配置未提取 |
| 83410 | req_guild_trial_read_help_log | 实现 | 记录已读，回空求助日志 |
| 83411 | req_guild_trial_thank_help | 实现 | 记录感谢 |
| 89301–89328、893289 | 公会探索族 | 部分 | 实现 89305/89306/89310/89315/89318/89323/89326/893289；其余 20 条缺口（GuildExploreTable 未提取） |
| 89351 | req_guild_explore_trial_award | 缺口 | GuildExploreTrialTable 奖励未提取 |
| 89352 | req_guild_explore_trial_member | 实现 | 回空成员列表 |
| 90001–90016 | 公会战族 | 部分 | 实现 90001/90005/90006/90009/90010/90012/90014/90015/90016；缺口 90002/90007/90008/90011/90013（GuildWarTable 未提取） |
| 90701–90707 | 公会对决族 | 部分 | 实现 90701/90705/90706/90707；缺口 90702/90703/90704（GuildDuelTable 未提取） |
| 91201–91209 | 公会竞速族 | 部分 | 实现 91201/91202/91204/91205/91207；缺口 91203/91206/91208/91209（GuildRacingTable 未提取） |

合计 128 type：实现（含空列表）82 条，fail closed 46 条。缺口命令的 `gap(type)` 返回具体原因，检查脚本可直接对账。

## 本地策略与推断（非客户端事实）

- 公会名 2–12 字、公告 ≤120、招募文本 ≤60、成员上限 50、官员上限 4、申请上限 10、推荐上限 20、每日招募 3、每日捐献 3、日志上限 50：均来自 GuildMgr 字符串名存在但数值行未提取，故为占位策略。
- 本地日志 id（create=1/join=2/…）为稳定本地编号，非 GuildTable.log_id。
- 助力每日 10 次、单类型数、评论长度 200、评论列表 200、点赞每日 10、评分 1–5、每日改评 3、关系自定义载荷 64 字节：SupportMgr/CommentErr/RelationshipTable 数值未提取，属占位。
- 日界用 `serverDayNumber`，见上。
- 错误码沿用仓库约定：1 = 非法参数/未知命令，5 = 业务不可用（不存在、权限、上限、证据缺口），310 = 重复操作。

## 验证结果

全量 `npm test`（`node --test --test-concurrency=1 test/*.test.mjs`）：2571 项，pass 2569，fail 0，skipped 2。日志 `analysis/test-runs/gameplay-20261106/block-e1-full.log`（analysis 不入 Git）。合并 main `70de346`（含 H/C/F/I、BATTLE 等块）后再次全量：2643 项，pass 2641，fail 0，skipped 2；日志 `analysis/test-runs/gameplay-20261106/block-e1-after-merge-full.log`，gateway 合并无冲突且类型无重叠。

| 测试 | 用例数 | 结果 |
| --- | ---: | --- |
| `guild-society-service.test.mjs` | 11 | 11 通过 |
| `social-community-service.test.mjs` | 8 | 8 通过 |
| `guild-activity-service.test.mjs` | 7 | 7 通过 |
| `guild-society-gateway.test.mjs`（真实握手 + 登录 + 数字 type） | 1 | 通过 |

覆盖要点：

- 公会：创建/重名/已在会、申请与审批入会、推荐与搜索投影、捐献与招募日限、改名/基础信息/社交戳/邮件/分配比例/工资记录、宝箱真发资源（401900 落 resources 表）且二次领取 code 5、解散清 module 24 与目录、缺口命令 code 5 且状态不变、SQLite 重开保留档案、PB 编码失败回滚改名。
- 社区：助力账本与日限、自支持/未知目标、地图进出/移动/复活/离开、评论增删查评分点赞、关系标记/取消/免打扰、冒险与攻略空列表、弹幕点赞、重开保留、编码失败回滚。
- 公会活动：module 24 公会 id 作用域、红包读/感谢/入会领取、试炼日志与公告与复活计数、探索许愿/营地统计/空板、公会战竞猜回读与集结/主持/取消/分享、对决与竞速读与出席/支援/投票、缺口族 code 5、重开保留状态、requestSchema/gap/supports 元数据。
- 临时 TCP：`createLocalGame({verifySession})` 临时 loopback 端口走 verify/挑战/答复/909103 登录，再用真实 `pb_c2s{type,seq,data}` 发送 21012/21016/21021/21019/85502/171/21001/46001/83108 并解 PB 回包，同时直查 module 24 与 SQLite。

## 复现命令

在工作树 `personal-server` 下：

```powershell
node --test --test-concurrency=1 test/guild-society-service.test.mjs
node --test --test-concurrency=1 test/social-community-service.test.mjs
node --test --test-concurrency=1 test/guild-activity-service.test.mjs
node --test --test-concurrency=1 test/guild-society-gateway.test.mjs
node --test --test-concurrency=1 test/*.test.mjs
```

## 证据缺口

1. GuildTable / GuildActiveTable / GuildExploreTable / GuildExploreTrialTable / GuildWarTable / GuildDuelTable / GuildRacingTable 的数值行未提取，导致 46 条领取/战斗/地图/商店类命令 fail closed。
2. 171 依赖 GuildDataTable 的 block_id → module 映射（`FunctionCacheGuildHandle` 仅字符串可读）。
3. 21017 `guild_box_receive` 回包结构未恢复。
4. 83105 `pb_guild_red_envelope_fetch_log` 未出现在已发布 protobuf；接口目录登记了该 schema 名但资产缺失。
5. 46002 / 77601 / 79201 的 ETF 元素结构未恢复，暂返回空列表。
6. GuildMgr 等 Lua 模块的词法原型未解包成功，仅靠 ASCII 字符串导出；数值策略需表格提取后才能替换占位值。
7. 公会/社区登录模块槽位：公会沿用既有 module 24；社区族无对应登录槽证据，未强行写入登录容器。
8. APK/UI 验收：需要真实公会与第二角色，本轮未操作设备。
