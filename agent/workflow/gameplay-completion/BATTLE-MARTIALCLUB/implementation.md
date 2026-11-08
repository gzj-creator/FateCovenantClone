# BATTLE-MARTIALCLUB 实施记录（武馆组队挑战）

日期：2026-11-08。分支 `task/A2-MARTIAL-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-martial`。本任务只做服务端实现与静态自检，未启停实时服务、
未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 任务范围

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的 `## BATTLE-MARTIALCLUB`：
模块 `MartialClubCmd`，24 条命令此前完全未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 84401 | `req_martial_club_first_award` | etf → `pb_res_to_client` | 已实现（按 `MartialClub.first_award` 逐 boss 领取，`pass_team_award` 位块落库） |
| 84404 | `req_martial_club_create_team` | pb `pb_martial_club_team_create_req` → `pb_martial_club_team` | 已实现（boss/战力档/加入限制校验，挑战次数校验，单角色单队） |
| 84405 | `req_martial_club_add_bot` | etf → `pb_martial_club_team` | 已实现（`max_npc_count`、队伍人数、`add_bot_cd` 冷却） |
| 84406 | `req_martial_club_set_help` | etf → `pb_martial_club_team` | 已实现（队长设置求助态，落库） |
| 84407 | `req_martial_club_join_team` | etf → `pb_martial_club_team` | 已实现（人数上限、战力门槛、重复加入与开战中拒绝） |
| 84408 | `req_martial_club_exit_team` | etf → `pb_martial_club_team` | 已实现（队员退出；队长退出即解散） |
| 84409 | `req_martial_club_team_info` | etf → `pb_martial_club_team_rsp` | 已实现（按 boss 列出队伍，条数受 `query_team_max` 限制） |
| 84410 | `req_martial_club_set_team_info` | pb `pb_martial_club_set_team_info_req` → `pb_martial_club_team` | 已实现（战力门槛与加入限制类型校验） |
| 84411 | `req_martial_club_set_ready` | etf → `pb_martial_club_team` | 已实现（成员准备态落库） |
| 84412 | `req_martial_club_invite` | etf → 无回包 schema | 已实现（邀请对象与 `invite_cd` 冷却落库；回包为 0 长度，见缺口） |
| 84413 | `req_martial_club_invite_all` | etf → 无回包 schema | 已实现（`invite_all_cd` 冷却、邀请全部标记落库；回包 0 长度） |
| 84414 | `req_martial_club_set_member_pos` | pb `pb_martial_club_set_member_pos_req` → `pb_martial_club_team` | 已实现（必须为现有成员的一个排列，机器人固定排尾） |
| 84415 | `req_martial_club_pass_count` | etf → 无回包 schema | 已实现（按 `pass_team_boss` 聚合通关人数并记录；回包 0 长度） |
| 84416 | `req_martial_club_team_kick` | etf → `pb_martial_club_team` | 已实现（队长踢人，开战中拒绝） |
| 84417 | `req_martial_club_team_fight` | etf → `pb_martial_club_team_fight_rsp` | 已实现（真实 `pvp-battle` 模拟，战报入 `pb_fight_report`，扣挑战次数） |
| 84418 | `req_martial_club_bot_list` | etf → 无回包 schema | 已实现（回读队伍机器人；气氛 NPC 池表未随客户端发布，见缺口） |
| 84419 | `req_martial_club_give_up` | etf → 无回包 schema | 已实现（清战斗结果、清结算标记） |
| 84420 | `req_martial_club_settlement` | etf → `pb_martial_club_team_settle_rsp` | 已实现（按 `MartialClub.Team.first_award` 首通发奖，`pass_team_boss` 与奖励历史落库） |
| 84421 | `req_martial_club_team_members` | pb `pb_martial_club_members_req` → `pb_martial_club_members_rsp` | 已实现（真实成员 role_id 列表） |
| 84422 | `req_martial_club_team_skip` | etf → 无回包 schema | 已实现（跳过标记落库，仍需结算生效） |
| 84423 | `req_martial_club_employ_list` | etf → `pb_martial_club_employ_rsp` | 已实现（已通关该 boss 的角色列表） |
| 84424 | `req_martial_club_employ_enter` | etf → 无回包 schema | 已实现（雇佣计数按日累加、同角色同日防重） |
| 84425 | `req_martial_club_match` | pb `pb_martial_club_match_req` → `pb_martial_club_match_rsp` | 已实现（已通关角色的真实战力列表） |
| 84426 | `req_martial_club_relic` | pb `pb_martial_club_relic_req` → `pb_martial_club_relic_rsp` | 已实现（自动分解品质白名单校验并回带角色数据） |

代码：`personal-server/game/martial-club-service.mjs`（新增）、`personal-server/game/gateway.mjs`
（纯增量接线：import、实例、84401/84404–84426 派发块、登录模块 123 同步）。

## 权威状态（SQLite，幂等建表）

| 表 | 用途 |
| --- | --- |
| `martial_club_role` | 角色进度：`pass_boss`、`pass_team_boss`、当日战斗次数、拥有次数、助战次数、`pass_team_award` 位块、奖励历史、自动分解品质、`fight_temp`、最近战力 |
| `martial_club_team` | 队伍：boss、战力门槛、加入限制、求助态、邀请记录、邀请全部、聊天频道、战斗结果、机器人/邀请全部冷却时间 |
| `martial_club_team_member` | 成员：`member_key`（人为 role_id，机器人为负键）、位置、准备、机器人标记、`bot_type`、待结算 |
| `martial_club_claims` | 领取位/冷却：`mc_invite`、`mc_employ` |
| `martial_club_employ` | 被雇佣计数：当日/累计/战斗/胜利次数 |

重复操作一律幂等或明确拒绝：重复建队 `GameError(5)`、重复加入 `GameError(3)`、重复领首通
`GameError(3)`、开战中改队伍 `GameError(5)`、同一 boss 首通重复结算不二次发奖。

## 协议与表证据

`personal-server/assets/protobuf/martial_club.db.proto.bin` 与 `martial_club.net.proto.bin` 是明文
`.proto` 文本，本次直接读取，据此确定：

- `pb_martial_club_team` 列：`leader_id/fight_tid/fight_power_limit/enter_limit_type/members/
  timestamp/invite_roles/invite_all/friend_add_count/fight_result/rank_seq/chat_channel_id`。
- `pb_martial_club_team_member`：`role_id/is_ready/is_help/is_bot/need_settle/is_cost_lack/bot_type`。
- `pb_martial_club_role`（登录）：`pass_boss/daily_refresh_sec/award_history/pass_team_boss/
  pass_team_award/normal_award_times/help_times/today_fight_times/fight_temp/own_fight_times/
  relic_resolve_quality_list`。
- `pb_martial_club_team_settle_rsp`：`daily_refresh_sec/award_history/pass_team_boss/help_times/
  res_change/today_fight_times/own_fight_times`。

客户端字节码常量（`MartialClubTeamMgr`、`MartialClubMgr`、`MartialClubCmd`）给出请求参数：

- `req_martial_club_create_team` 走 `EncodePB`，字段 `fight_tid/fight_power_limit/enter_limit_type`；
  `req_martial_club_set_team_info`、`set_member_pos`、`members`、`match`、`relic` 同样走 `EncodePB`，
  其余 18 条是 `EncodeErl`（ETF）。
- `MartialClubTeamMgr` 在 `ReqCreateTeam` 前断言 `MC_FIGHT_COUNT_NOT_ENOUGH`，`ReqAddRobot` 使用
  `add_bot_cd`，`ReqJoinTeam`/`ReqInviteSomeOne` 使用 `inviteTimeMap`，与实现里的冷却校验一致。
- 登录模块 **123** 在录制登录里恰好是两个块，且第一块解出 `pass_boss=80`、
  `daily_refresh_sec=1792901038`、`own_fight_times=13`，与 `MartialClubMgr.LoginParse` 解
  `pb_martial_club_role` + `pb_martial_club_employ_role` 的顺序一致，因此登录同步使用该模块号。

## 规则语义与推断边界

- 队伍是按 boss（`MartialClubTable.MartialClub.tid`）组织的：`Team` 表与 `MartialClub` 表 tid 相同但
  `fight_id` 不同（组队战斗 6800001，单人 4000001），所以 `fight_tid` 请求字段按 boss tid 解释，
  战斗配置与首通奖励取 `Team` 行。
- 战力门槛只接受 `Team.Power.power_limit` 中配置的值（1/2/3/4 档为 0/180000/240000/300000），
  加入限制只接受 `MartialClub.EnterLimitType` 里的 tid 或 0（不限）。
- 队伍人数上限由 `TeamConst.extra_award_member_num + 1 = 4` 推导，机器人上限取
  `max_npc_count = 3`；客户端表没有独立的队伍人数列，这一点在代码注释中标注。
- `is_help`（助战）在客户端是成员粒度字段，服务端按“已开启求助的队伍里的非队长成员”输出。
- 首通奖励：首通（`pass_team_boss < boss`）发 `Team.first_award`；重复通关只累加
  `award_history.success_times` 与 `normal_award_times`，不发奖（`show_fight_award`/`show_fight_rate`
  语义未取得证据，按 fail closed 处理）。
- 挑战次数：`own_fight_times` 首次按 `TeamConst.challenge_count_per_day` 初始化，每次组队开战 +1；
  购买次数命令（`BuyFight` 表对应命令）不在本卡范围。
- 战斗：攻击方用 `pvp-battle.rosterFor` 从权威养成装配，防守方来自部署注入的
  `enemyRoster({bossTid, fightTid, team})`；provider 缺席或返回空阵容时
  `GameError(5, 'Martial club boss roster is not supplied by the deployment')`，不写死胜负。
  战报用 `pb_fight_report`（`battle_list` 单场、`type=1`、`finish=true`）落库为十六进制。

## 未实现/降级项（fail closed 并记录）

1. `req_martial_club_invite`/`invite_all` 的“被邀请方推送”没有单连接内的投递目标，服务端只落库与冷却，
   客户端侧需要队友在线才有可见效果。
2. `pass_count`/`bot_list`/`give_up`/`team_skip`/`employ_enter`/`invite`/`invite_all` 的**回包 schema**
   在静态目录里是“—”，服务端提交真实状态后回 0 长度负载；这是 schema 缺口，不是空包销项。
3. 组队重复通关奖励（`show_fight_award` 与 `show_fight_rate`）语义未取得证据，重复通关不发奖。
4. `pass_boss`（单人武馆进度）由单人 boss 战命令维护，本卡未实现那两条命令，因此
   `req_martial_club_first_award` 在纯组队流程里通常没有可领项。
5. `bot_list` 的气氛 NPC 池没有对应客户端表，当前只回读队伍内机器人数量。
6. 战斗对手阵容必须由部署注入；仓库内没有该注入实现。

## 自检

`node --check` 覆盖 `personal-server/game/martial-club-service.mjs` 与 `personal-server/game/gateway.mjs`；
`git diff --check` 无输出。按要求未执行 `npm test`，未启动服务、未发 TCP 请求、未写运行数据库。

## 阶段 1：配置、提取工具与 PvP 战斗内核（检查点 b86a19b）

### 客户端表数据（本次新提取）

客户端只以 LuaJIT 字节码发布表数据，仓库此前没有武馆/锦标赛/巅峰竞技相关表。本次新增：

- `tools/extract-lua-table.mjs`：通用提取器。用 `tools/luajit-bytecode-parse.mjs` 解析
  `*.data.lua` 字节码，按 builder 原型前导字段映射（TDUP 常量）与 TDUP/TNEW/TSET*/TSETM/CALL
  语义还原行数组；紧跟 builder 之后、只含一个字符串常量的原型给出子表名。
- 产物（`personal-server/assets/tables/`）：`MartialClubTable`（MartialClub 80、Team 80、
  Chapter 20、HelpAward 10、BuyFight 4、AwardLib 5666、CountLib 15 等）、`MartialClubActTable`
  （10 行）、`TournamentTable`、`TopArenaTable`、`MatchPvpTable`（Level 12、Type 2、Match 24、
  BotLib 66、DayTask 8、Rank 10、DailyRank 7、StageSettle 7、State、StateType、Params）。

### 配置读取器

- `personal-server/config/lua-table-dump.mjs`：dump 通用读取助手（`rowsOf`/`byTid`/`awardPairs`/
  `splitAward`/`integerField`）。奖励列的空字面量（`{}` 或 `{"global":"TableEmpty"}`）统一视为无奖励。
- `personal-server/config/martial-club-tables.mjs`：`MartialClubTable` 的权威读取器（`Const`/
  `TeamConst`、按 boss 索引的 `Team` 战力档位、`MartialClub` boss 行、`Chapter`、`HelpAward`、
  `BuyFight`、`AwardLib`/`CountLib`、`TeamSkip`、`EnterLimitType`、`FightType`、`EmployThank`）。
- `personal-server/config/martial-club-act-tables.mjs`：`MartialClubActTable`（阶段 3）。
- `personal-server/config/top-arena-tables.mjs`、`personal-server/config/match-pvp-tables.mjs`：
  巅峰竞技与锦标赛/群雄逐鹿共享表读取器（阶段 4、5）。

### PvP 战斗内核

`personal-server/game/pvp-battle.mjs` 是位面锦标赛与巅峰竞技共用的玩家对玩家战斗接缝：

- `rosterFor({model, lineupType})`：用权威养成数据装配一侧阵容（`assembleLineup` +
  `attribute-service`），空阵容或超过 6 人直接 `GameError(5)` 拒绝。
- `simulatePvpBattle({codec, attacker, defender, seedText})`：`battle-engine.simulateBattle` 跑确定性
  战斗（FNV-1a 由 `seedText` 派生），返回 `simulation`、`won`、双方战力与
  `pb_fight_report_battle` 载荷（含队长位与 `mission-fight-service.actionList` 动作流）。
- `buildFightReport({...})`：包装成 `pb_fight_report`（`battle_list` 单场、`finish=true`、`req` 原样回带）。
- 对手阵容是部署注入项：客户端没有任何表给出这些模块的对手阵容（`FightTable.def_team` 全空），
  provider 缺席时服务 fail closed，不写死胜负。
