# BATTLE-SWAPARENA 实施记录（换位竞技场 4031-4040）

日期：2026-11-08。分支 `task/A2-ARENA-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-arena`。本轮只做服务端实现与静态检查，未启停实时服务、
未读写运行数据库、未操作模拟器/ADB/APK，也未跑 `npm test`。

## 任务范围

`SwapArenaCmd.lua` 声明的 10 条命令，此前完全没有路由。模块号 109（ModuleTable 名
`SwapArenaMgr`），登录块是单个 `pb_swap_arena_login`。

| type | 命令 | 请求编码 | 回包 | 状态 |
| ---: | --- | --- | --- | --- |
| 4031 | `req_swap_arena_get_match` | EncodeErl(nil) | `pb_swap_arena_match_toc` | 已实现 |
| 4032 | `req_swap_arena_refresh_match` | EncodeErl(nil) | `pb_swap_arena_match_toc` | 已实现（次数/冷却） |
| 4033 | `req_swap_arena_buy_fight_times` | EncodeErl(nil) | `pb_res_to_client` | 已实现（扣 `Cost` 价） |
| 4034 | `req_swap_arena_more_fight` | EncodeErl(nil) | `pb_res_to_client` | 已实现（补充次数，见缺口） |
| 4035 | `req_swap_arena_fight_report` | EncodeErl(nil) | `pb_swap_arena_fight_report_data` | 已实现（读库报表） |
| 4036 | `req_swap_arena_read_rank_change` | EncodeErl(nil) | `pb_swap_arena_rank_chang_toc` | 已实现（清红点） |
| 4037 | `req_swap_arena_set_read_report_time` | EncodeErl(nil) | ETF 整数回执 | 已实现 |
| 4038 | `req_swap_arena_rank_award` | `pb_swap_arena_rank_award_req` | `pb_res_to_client` | 已实现（跨阶段+名次段校验） |
| 4039 | `req_swap_arena_update_cross_stage` | EncodeErl(nil) | `pb_swap_arena_update_cross` | 已实现（回当前阶段） |
| 4040 | `req_swap_arena_init_double_team` | EncodeErl(nil) | `pb_player_lineup` | 已实现（LineupTable 66 建队） |

## 证据来源

- 客户端命令表：`SwapArenaCmd.lua.bin`（10 个 `req_swap_arena_*` 函数 + `EncodeErl`/`EncodePB`
  工厂；只有 `req_swap_arena_rank_award` 用 `Codec.EncodePB(pb_swap_arena_rank_award_req)`）。
- 客户端逻辑：`SwapArenaMgr.lua.bin`。`ReqMatchList` 的应答回调读 `resp.match_list`；
  `ReqRefresh` 回调本地 `SetRefreshCount(+1)`；买次数/补次数/领奖回调先 `AwardKit.Parse(res)`，
  买次数再加 `baseData.buy_fight_times`，补次数再加 `baseData.fight_times`；`ReqReportData`
  回调 `SetReportData(resp)`；`ReqCrossStage` 回调 `SetBaseData(resp.arena)` + `SetRobotList(resp.bot_list)`；
  `ReqInitOtherDoubleTeam` 回调取 `resp.player_lineup.lineup_list`（因此回 `pb_player_lineup`）。
- 表数据：`SwapArenaTable` 由新工具 `tools/extract-arena-tables.mjs` 从 LuaJIT 字节码提取，
  产物 `personal-server/assets/tables/SwapArenaTable.data.lua.json.gz`。
- 读取器：`personal-server/config/arena-tables.mjs`（`readSwapArenaTables`、`swapArenaMatchBucket`、
  `arenaAwardPairs`、`arenaRange`）。

## 用到的表字段

`Base`：`settle_sec=300`、`free_fight_times=8`、`bft_cost=101500`（扣费资源 tid）、
`refresh_match_times=5`、`refresh_cd=5`、`top_num=10`、`init_rank=5000`、`climb_range`、
`activity=12003`。`Cost` 99 行（第 n 次购买的价格 `bft_cost_num`）。`Match` 13 行按 `rank_rang`
分段。`RankAward` 60 行（`cross_stage` + `rank_range` + `award`）。`FirstRankAward` 104 行。
`Robot`/`RobotDetail`、`FightId` 供 `bot_list` 与后续战斗使用。

## 权威状态（SQLite，构造期幂等建表）

```sql
swap_arena_state(role_id PK, rank, history_rank, last_rank, fight_times, buy_fight_times,
                 extra_fight_times, refresh_match_times, reset_day, match_list TEXT,
                 init_match, refresh_time, show_rank_change_red, rank_award TEXT(hex),
                 cross_stage, win_times, defend_times, report_read_time, updated_at)
swap_arena_reports(role_id, fight_id, before_rank, after_rank, fight_time, attack_role_id,
                   def_role_id, self_fight_result, enemy_rank, PK(role_id,fight_id))
swap_arena_claims(role_id, claim_type, claim_key, created_at, PK(role_id,claim_type,claim_key))
```

每日重置按 `reset_day` 日期切换，重置挑战次数、购买次数、补次数、刷新次数与对手列表。

## 命令行为

- **4031**：没有对手列表或 `init_match=0` 时生成一次；回 `pb_swap_arena_match_toc.match_list`。
- **4032**：`refresh_match_times >= Base.refresh_match_times` 或距 `refresh_time` 未满
  `Base.refresh_cd` 秒时报 `code=3`，否则重建列表并把次数 +1。
- **4033**：第 n 次购买取 `Cost[n]` 的 `bft_cost_num`，用 `consumeResources` 扣 `Base.bft_cost`
  资源（不足 `301`），`Cost` 行用尽报 `3`。
- **4034**：只有剩余次数为 0 时才允许补，补 1 次。
- **4035**：返回 `swap_arena_reports` 最近 20 条与 `read_time`。
- **4036**：清 `show_rank_change_red`，回 `last_rank`/`cur_rank`/`match_list`。
- **4037**：记录当前秒为已读时间，回 ETF 整数（客户端 `SetReportReadTime` 只取一个时间值）。
- **4038**：逐 tid 校验 `cross_stage` 等于当前阶段、`rank` 落在 `rank_range` 内、位块与 claim 表都未领，
  再按 `award` 发奖并写位块与 claim；任一 tid 不合规整笔回滚。
- **4039**：以库中 `cross_stage`/`rank` 为准回 `arena`+`res`+`bot_list`。
- **4040**：取 LineupTable 66（`SWAP_ARENA_66`）；缺失时用 40（`SWAP_ARENA`）单人队或当前预设队
  复制出双队后返回 `pb_player_lineup{lineup_list:[pb_lineup]}`。

## 失败关闭分支

`1` 参数非法；`3` 次数/冷却/重领；`5` 配置缺失、跨阶段不符、未达名次段、队伍来源缺失；
`301` 资源不足。所有写操作在 `store.transaction` 内，抛错即整笔回滚。

## 未闭合缺口

- **4034 补次数数量**：`SwapArenaMgr` 本地把 `fight_times` 加 1，但服务端授予量没有表字段，
  按 1 次实现。
- **对手列表**：本部署只有一个角色，`pb_swap_arena_match.role_id=0` 的机器人语义被用来填充
  `rank-1 ... rank-top_num`；`RobotDetail` 的机器人属性只进了 `loginPayload.bot_list`，
  没有真正参与战斗。
- **结算**：`4031-4040` 里没有战斗命令，`settleFight()` 只是结算缝（赢则把 `rank` 推到对手名次并
  写报表），需要通用战斗管线调用它；`Base.settle_sec=300` 目前只作为配置读取，未驱动定时结算。
- **跨阶段滚动**：没有季节结算命令，`cross_stage` 只能由外部 settle 推进。
- **4037 回包 schema**：客户端回调只消费一个时间值，本轮用 ETF 整数回执；如果后续恢复出
  protobuf 回包，需要替换。
- 未做 APK 验收，也未接实时服务。
