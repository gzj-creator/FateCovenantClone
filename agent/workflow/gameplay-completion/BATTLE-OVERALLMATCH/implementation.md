# BATTLE-OVERALLMATCH 实施记录（全服匹配 120001）

日期：2026-11-08。分支 `task/A2-ARENA-20261108`，worktree
`.worktree/gameplay-20261108/a2-arena`。只做服务端实现与静态检查：未启停实时服务、
未读写运行数据库、未操作模拟器/ADB/APK，未跑 `npm test`。

## 任务范围

| type | 命令 | 请求编码 | 回包 | 状态 |
| ---: | --- | --- | --- | --- |
| 120001 | `req_overall_match_start` | `pb_overall_match_start_req{match_type,opt}` | `pb_overall_match_start_rsp{match_type,opt}` | 已实现 |

## 证据来源

- `OverallMatchCmd.lua.bin`：唯一命令用 `Codec.EncodePB(pb_overall_match_start_req)`。
- `pb_overall_match_start_rsp` 只有 `match_type` 与 `opt` 两个字段（见
  `personal-server/assets/protobuf/overall_match.net.proto.bin`）。
- 表数据：`OverallMatchTable` 经 `tools/extract-arena-tables.mjs` 提取为
  `personal-server/assets/tables/OverallMatchTable.data.lua.json.gz`；读取器 `readOverallMatchTables`。

## 用到的表字段

`Type` 1 行（`tid=1`，即允许的 `match_type`）。`Rule[1]`：`max_rank_diff=4`、`history_match_count=10`、
`power_rate_min=90`、`power_rate_max=120`、`streak_start_count=3`、`streak_rate_step=10`、
`online_wait_time=8`、`fight=5`。

## 权威状态（SQLite）

```sql
overall_match_queue(role_id PK, match_type, opt, rank, power, matched_at, updated_at)
```

## 命令行为

校验 `match_type` 在 `Type` 表内、`opt` 为整数，读取该类型的 `Rule` 作为配对窗口（名次差上限、
战力比例上下限），写入排队行后回 `pb_overall_match_start_rsp{match_type,opt}`。

## 失败关闭分支

`1` 参数非法（缺 `match_type`、`opt` 越界）；`5` `match_type` 未配置或 `Rule` 缺失。

## 未闭合缺口

- **真实配对**：本部署只有一个角色，`Rule` 的名次差与战力比例窗口只能匹配到自身；
  `overall_match_queue.rank` 固定 1、`power` 记录 0（本服没有权威战力聚合），跨服配对表
  `pb_overall_match_data` 未落地。
- `history_match_count`/`streak_*`/`online_wait_time`/`fight` 只读取校验，未驱动定时配对与开战。
- 未做 APK 验收。
