# BATTLE-HUNTERARENA 实施记录（时空冠位赛 84001-84011）

日期：2026-11-08。分支 `task/A2-ARENA-20261108`，worktree
`.worktree/gameplay-20261108/a2-arena`。只做服务端实现与静态检查：未启停实时服务、
未读写运行数据库、未操作模拟器/ADB/APK，未跑 `npm test`。

## 任务范围

`HunterArenaCmd.lua` 声明的 11 条命令，此前没有路由。模块号 121（ModuleTable 名
`HunterArenaReqMgr`），登录块是单个 `pb_hunter_arena_login`。

| type | 命令 | 请求编码 | 回包 | 状态 |
| ---: | --- | --- | --- | --- |
| 84001 | `req_hunter_arena_clear_change` | EncodeErl(nil) | ETF 整数回执 | 已实现 |
| 84002 | `req_hunter_arena_day_award` | EncodeErl(tid 列表) | `pb_res_to_client` | 已实现（按 DayTask 计数） |
| 84003 | `req_hunter_arena_season_award` | EncodeErl(tid 列表) | `pb_res_to_client` | 已实现（Rank 名次段） |
| 84004 | `req_hunter_arena_palace` | EncodeErl(nil) | `pb_hunter_role_palace` | 已实现（当前为空表） |
| 84005 | `req_hunter_arena_fight` | EncodeErl(nil) | — | 失败关闭（缺敌方阵容） |
| 84006 | `req_hunter_arena_set_ignore` | EncodeErl(bool) | ETF 整数回执 | 已实现 |
| 84007 | `req_hunter_arena_set_read_report_time` | EncodeErl(nil) | ETF 整数回执 | 已实现 |
| 84008 | `req_hunter_arena_history_rank` | EncodeErl(nil) | `pb_hunter_arena_history_rank_rsp` | 已实现 |
| 84009 | `req_hunter_arena_report_lock` | `pb_hunter_arena_set_report_lock` | `pb_res_to_client` | 已实现（锁定上限） |
| 84010 | `req_hunter_arena_set_award_tips` | EncodeErl(nil) | ETF 整数回执 | 已实现 |
| 84011 | `req_hunter_arena_enter_form` | EncodeErl(nil) | `pb_role_hunter_arena` | 已实现（best_rank/best_stage） |

## 证据来源

- 命令表与编码：`HunterArenaCmd.lua.bin`（11 个 `req_hunter_arena_*`；只有
  `req_hunter_arena_report_lock` 用 `EncodePB(pb_hunter_arena_set_report_lock)`，其余走 `EncodeErl`，
  其中日奖/季奖把 tid 列表作为参数发 ETF）。
- 客户端逻辑：`HunterArenaReqMgr.lua.bin`。日奖回调 `HunterArenaTable.DayTaskByIndex` 组 tid 列表，
  再用 `got_day_award` 位块置位；季奖回调按 `got_season_award` 置位；`req_hunter_arena_palace`
  回调 `SetPalaceData(resp)`；`enter_form` 回调 `SetRecentCache(resp.best_rank, resp.best_stage)`，
  因此回 `pb_role_hunter_arena`（该消息带 `best_rank`/`best_stage`）。
- 表数据：`HunterArenaTable` 经 `tools/extract-arena-tables.mjs` 提取为
  `personal-server/assets/tables/HunterArenaTable.data.lua.json.gz`；读取器 `readHunterArenaTables`。

## 用到的表字段

`Const`：`init_score=1100`、`min_score=1000`、`min_win_gain=5`、`fight_report_num=15`、
`lock_fight_report_max=5`、`palace_season=5`、`open_level=38`、`elo_k=100`、`double_fight_tid=1400100`、
`share_rank=50`。`DayTask` 4 行（`task_type` 7002 计战斗次数、7003 计胜场，`task_count` 5/10/2/5，
`award=[[801900,10]]` 或 `[[801900,20]]`）。`Rank` 10 行（名次段 → 赛季奖）。`Level` 16 档（按
`integral` 积分取档）。`State` 5 行（周内时段窗口）。`BotConst`/`BotMatch`/`BotLib` 为机器人匹配配置。

## 权威状态（SQLite）

```sql
hunter_arena_state(role_id PK, season, score, max_score, last_max_score, score_change,
                  recent_fight_result, fight_times, win_times, got_day_award TEXT(hex),
                  got_season_award TEXT(hex), season_award_tips TEXT(hex), last_flush_stamp,
                  read_report_time, ignore_match_show, last_join_season, last_season_win_times,
                  last_season_fight_times, new_stage_fight_times, cross_open_day,
                  last_cross_open_day, updated_at)
hunter_arena_reports(role_id, fight_uid, score_change, fight_stamp, enemy_id, is_atk, is_win,
                     locked, old_score, new_score, PK(role_id,fight_uid))
hunter_arena_claims(role_id, claim_type, claim_key, created_at, PK(role_id,claim_type,claim_key))
```

`loginPayload()` 组装 `pb_hunter_arena_login`：`hunter_arena`(pb_role_hunter_arena)、`score`、`rank`、
`season_state{cur_season,cur_season_close_stamp,next_season_open_stamp}`、`palace{palaces:[]}`、
`open_double_time=0`。

## 命令行为

- **84001**：清零 `score_change`/`recent_fight_result`，回 `[score, rank]` 的 ETF。
- **84002**：逐 tid 找 `DayTask` 行，按 `task_type` 比较 `fight_times`/`win_times` 与 `task_count`；
  未达标 `5`，已领（位块或 claim）`3`；发放 `award` 并写位块+claim。
- **84003**：逐 tid 找 `Rank` 行，用当前名次校验 `rank_range`；claim key 带赛季号，避免跨赛季误判重领；
  发放后置 `got_season_award` 位。
- **84004**：回 `pb_hunter_role_palace{palaces:[]}`（本服没有已结束的跨服赛季）。
- **84006**：持久化 `ignore_match_show`。
- **84007**：把当前秒写入 `read_report_time`，回 ETF 整数。
- **84008**：回 `pb_hunter_arena_history_rank_rsp{rank,score,season,hunter_arena}`。
- **84009**：按 `fight_uid` 找报表；锁定数超过 `Const.lock_fight_report_max` 时报 `3`；找不到报表 `5`。
- **84010**：把当前赛季位写进 `season_award_tips` 位块。
- **84011**：回完整 `pb_role_hunter_arena`（含 `best_rank`/`best_stage`，当前为空列表）。

## 失败关闭分支

`1` 参数非法；`3` 重复领取/锁定上限；`5` 配置缺失、任务未完成、报表不存在；`84005` 固定 `5`
（敌方阵容不可得）。

## 未闭合缺口

- **84005 战斗**：`BotLib` 只有 `score/power/fight_tid/lv`，其 `fight_tid`（如 1400000/1400100）指向的
  `FightTable` 阵容没有进入 `personal-server/assets/tables`，无法起真战斗，因此固定失败关闭；
  接入 `FightTable` + 通用战斗管线后即可打开。
- **赛季周期**：`State` 只描述周内时段，没有赛季长度表；`roleData` 的赛季号按 7 天一轮从开服时间
  推算（`SEASON_SECONDS`），属本实现约定。
- **名次**：单角色部署，`selfRank()` 固定为 1；`Rank` 名次段奖励因此落在第 1 档。
- **84003 领取时机**：客户端在赛季结束后领，服务端没有“赛季是否结束”的权威判定，目前只校验名次段
  与同赛季去重。
- **best_rank/best_stage、palace** 始终为空：需要跨服赛季结算数据。
- 未做 APK 验收。
