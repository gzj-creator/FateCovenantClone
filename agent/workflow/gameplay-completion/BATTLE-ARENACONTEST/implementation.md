# BATTLE-ARENACONTEST 实施记录（擂台赛 83301-83315）

日期：2026-11-08。分支 `task/A2-ARENA-20261108`，worktree
`.worktree/gameplay-20261108/a2-arena`。只做服务端实现与静态检查：未启停实时服务、
未读写运行数据库、未操作模拟器/ADB/APK，未跑 `npm test`。

## 任务范围

`ArenaContestCmd.lua` 声明的 15 条命令，此前没有路由。模块号 113（ModuleTable 名
`ArenaContestMgr`）。登录块是三个二进制：`pb_arena_contest_act`、`pb_arena_contest_role`、
`pb_arena_contest_match`（`ArenaContestMgr.LoginParse` 依次 `DecodePB` 这三个 schema）。

| type | 命令 | 请求编码 | 回包 | 状态 |
| ---: | --- | --- | --- | --- |
| 83301 | `req_arena_contest_enter` | EncodeErl(nil) | ETF 整数回执 | 已实现（记录观战入场） |
| 83302 | `req_arena_contest_leave` | EncodeErl(nil) | ETF 整数回执 | 已实现 |
| 83303 | `req_arena_contest_sign_up` | EncodeErl(nil) | `pb_res_to_client` | 已实现（等级/开服天/报名窗口） |
| 83304 | `req_arena_contest_guess` | `pb_arena_contest_guess_req` | `pb_arena_contest_guess_rsp` | 已实现（间隔+记录上限） |
| 83305 | `req_arena_contest_rev_fight_award` | EncodeErl(nil) | `pb_arena_contest_fight_award_back` | 已实现（当前无战绩） |
| 83306 | `req_arena_contest_get_guess_info` | EncodeErl(nil) | `pb_arena_contest_guess_info` | 已实现 |
| 83307 | `req_arena_contest_get_role_fight_report` | EncodeErl(nil) | `pb_arena_contest_fight_report_role` | 已实现（空表） |
| 83308 | `req_arena_contest_get_final_info` | EncodeErl(nil) | `pb_arena_contest_final_match_info` | 已实现（空表） |
| 83309 | `req_arena_contest_get_final_power_info` | EncodeErl(nil) | `pb_arena_contest_role_power_ret` | 已实现（空表） |
| 83310 | `req_arena_contest_congratulate` | EncodeErl(nil) | `pb_arena_contest_congratulate_back` | 已实现（每期上限） |
| 83311 | `req_arena_contest_get_top_roles` | EncodeErl(nil) | `pb_arena_contest_top_info` | 已实现（空表） |
| 83312 | `req_arena_contest_watch_fight` | EncodeErl(nil) | ETF 整数回执 | 已实现（起观战计时） |
| 83313 | `req_arena_contest_rev_task_award` | EncodeErl(nil) | — | 失败关闭（ArenaDailyTask 为空） |
| 83314 | `req_arena_contest_rev_guess_award` | `pb_arena_contest_guess_award_req` | — | 失败关闭（无竞猜结果） |
| 83315 | `req_arena_contest_watch_award` | EncodeErl(nil) | `pb_res_to_client` | 已实现（观战满 60 秒） |

## 证据来源

- 命令表：`ArenaContestCmd.lua.bin`（15 个 `req_arena_contest_*`；`req_arena_contest_guess` 与
  `req_arena_contest_rev_guess_award` 用 `EncodePB`，其余 `EncodeErl`）。
- 客户端逻辑：`ArenaContestMgr.lua.bin`。`enter`/`leave` 回调只改本地 `entered`；`guess` 走
  `ArenaContestDataMgr` 记录；`get_role_fight_report` 回调 `SetReportInfo(resp)`；`congratulate`
  走 `AwardKit.Parse(res)`；`watch_fight` 用于观战计时。
- 表数据：`ArenaContestTable` 经 `tools/extract-arena-tables.mjs` 提取为
  `personal-server/assets/tables/ArenaContestTable.data.lua.json.gz`；读取器 `readArenaContestTables`、
  时段查询 `arenaContestStateAt`。

## 用到的表字段

`Const`：`fun_open=1064`、`server_day=3`、`player_lv=25`、`guess_interval=60`、`fight_calc_time=120`、
`rev_award_max_round=9`、`congratulate_num_max=3`、`congratulate_valid_time=3600`、
`guess_record_show_count=7`、`cross_open_day=13`。`State` 21 行时段（`start_time`/`end_time` 为当日秒数，
`state`/`arena_type`/`big_state`）。`Round` 2 行（`max_round=30`、`point_max_round=9`、
`group_start_round=10`、`four_start_round=19`、`final_start_round=22`）。`Timer` 70 行。
`RankAward` 39 行、`GuessAward` 3 行、`WatchAward{need_time=60,res_list=[[101900,100]]}`、
`CongratulateAward` 3 行（`[[201500,1000]]`）、`ShowAward` 1 行。`ArenaDailyTask` **0 行**。

## 权威状态（SQLite）

```sql
arena_contest_state(role_id PK, period, sign_up_time, sign_up_num, congratulate_period,
                    congratulate_states TEXT(hex), fight_award_states TEXT(hex),
                    task_rev_states TEXT(hex), daily_time, guess TEXT(json),
                    watch_enter_time, watch_award_time, updated_at)
arena_contest_claims(role_id, claim_type, claim_key, created_at, PK(role_id,claim_type,claim_key))
```

`period` 取开服天序号（每天一期），换期时清空报名、竞猜、祝贺与观战状态。

## 命令行为

- **时段判定**：把当前时间加 UTC+8 偏移折算成当日秒数，用 `arenaContestStateAt` 找 `State` 行；
  `big_state>=2` 视为进行中，`big_state==1` 视为报名窗口。
- **83303 报名**：角色等级 ≥ `Const.player_lv`、开服天 ≥ `Const.server_day`、处于报名窗口、本期未报名；
  记录 `sign_up_time` 并 `sign_up_num` 加一。
- **83304 竞猜**：写入 `guess{guess_role_id,guess_time,guess_correct:[],got_guess_award:false,period}`，
  距上次竞猜不足 `Const.guess_interval` 报 `3`，只保留最近 `guess_record_show_count` 条。
- **83310 祝贺**：本期祝贺次数（`congratulate_states` 位块计数）达到 `congratulate_num_max` 报 `3`，
  否则按次数取 `CongratulateAward[n]` 发奖并回 `pb_arena_contest_congratulate_back`。
- **83315 观战奖励**：`83301`/`83312` 起算 `watch_enter_time`，满 `WatchAward.need_time` 且本期未领时
  发放 `[[101900,100]]`。
- **83305**：不模拟比赛，`res` 返回空变更并回当前 `fight_award_states` 位块。

## 失败关闭分支

`1` 参数非法；`3` 竞猜过频/祝贺上限；`5` 报名条件不满足、配置缺失、观战未开始或时长不足；
`83313` 因为 `ArenaDailyTask` 为空固定 `5`；`83314` 因为没有竞猜结果固定 `5`。

## 未闭合缺口

- **对阵引擎缺失**：`State`/`Round`/`RoundState` 只描述赛程，没有产生对阵表的逻辑，所以
  `final_level_list`、`top_role_list`、`contestants`、`role_power_list` 一律返回空表，属真实“暂无数据”。
- **83313 任务奖**：`ArenaDailyTask` 在发布的表里是 0 行，任何 tid 都无法定价，固定失败关闭；
  需要补出该子表才能开放。
- **83314 竞猜奖**：猜对与否依赖比赛结果，本服不跑对阵，`guess_correct` 永远为空，故固定失败关闭。
- **83303 报名窗口方向**：把 `big_state==1`（`State` 行 1001/2001，0 点到 45000 秒）当作赛前报名窗口，
  是本实现按 `state=1` 与赛程顺序作的推断。
- **观战计数**：客户端还有 `watch_num`/`party` 之类统计，服务端只用单角色观战计时。
- 未做 APK 验收。
