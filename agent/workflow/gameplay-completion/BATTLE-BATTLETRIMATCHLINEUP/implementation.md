# BATTLE-BATTLETRIMATCHLINEUP 实施记录（三消战斗阵容管理）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-trimatch`。只写服务端代码；未启停实时服务、未读写运行数据库、
未操作模拟器/ADB/APK。验证限于 `node --check` 与 `git diff --check`。

## 任务范围

任务卡 `## BATTLE-BATTLETRIMATCHLINEUP`：模块 `BattleTriMatchLineupCmd`，5 条命令此前未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 114001 | `req_battle_tri_match_lineup_add` | `pb_battle_tri_match_lineup_add_req` → `..._add_rsp` | 已实现（预设上限 20，uid 由计数器发放） |
| 114002 | `req_battle_tri_match_lineup_edit` | `..._lineup_edit_req` → `..._lineup_edit_rsp` | 已实现 |
| 114003 | `req_battle_tri_match_lineup_set_name` | `{uid, name}` → `..._set_name_rsp` | 已实现（长度 1–6，来自 `LineupTable.Const`） |
| 114004 | `req_battle_tri_match_lineup_delete` | `{uid}` → `..._delete_rsp` | 已实现 |
| 114005 | `req_battle_tri_match_edit_playing_lineup` | `{lineup}` → `..._edit_playing_lineup_rsp` | 已实现（三消战斗实际出战阵容） |

## 证据

### 客户端命令模块

`analysis/scratchpad/time-temple-20261108/project/14916498168993774000-BattleTriMatchLineupCmd.lua.bin`
字符串常量：

- 114001/114002/114005：请求体是单个 `lineup` 字段（protobuf 嵌套 `pb_battle_tri_match_lineup`）。
- 114003：`{uid, name}`；114004：`{uid}`。
- 命令表登记五项，与任务卡一致。

### protobuf

`battle_tri_match_lineup.net.proto.bin`：`pb_battle_tri_match_lineup{uid, gen_time, repeated
team_list, name}`，`team_list` 元素为 `pb_battle_tri_match_lineup_team{team_id, repeated sites}`，
`sites` 是 `pb_battle_tri_match_lineup_site{site_index, hero_tid}`。回包均为
`{change_lineup}` 形式（删除回包为空）。

### 表数据

`BattleTriMatchLineupTable.data.lua.json.gz`：

- `Const`（1 行）：`max_preset=20`、`preset_min_length=1`、`preset_max_length=6`。
- `Type`（3 行）：出战阵容类型 1/2/3。
- `Suggest`（4 行）：每个推荐阵容 `suggest_hero` 为 4 名英雄，对应 `cell_count=4`。

## 实现

- `trimatch_lineup(role_id, uid, gen_time, name, team_list)` 存预设阵容，
  `trimatch_playing_lineup(role_id, lineup_type, team_list)` 存出战阵容，
  `trimatch_ident` 保存下一个 `uid`（`takeLineupUid` 事务内自增）。
- `validateTeams` 统一校验：位号在 `1..cell_count` 内、位号与英雄均不可重复、英雄必须已拥有；
  新增/编辑要求非空，出战阵容允许部分位为空但至少要有一个上阵英雄。
- 回包结构按上面 proto：新增/编辑/改名回填完整 `change_lineup`，删除回空包。

## 降级与缺口

- 出战阵容的 `type` 只做 1–99 范围校验，配置 `LineupTable.Type` 实际只有 1/2/3；未强制
  与配置对齐，留待客户端证据确认（例如 type 3 是否为特定玩法专用）。
- `Suggest`（推荐阵容）未在登录或任何回包里下发，客户端"推荐阵容"页签目前拿不到数据。
- 阵容没有服务器校验"三队同时出战"之类规则，也没有跨玩法共享/互斥约束。
- 未提供登录同步入口；预设阵容与出战阵容在登录回包中的位置无运行时证据。

## 验证

`node --check` 通过。未跑 `npm test`，未做真实 TCP / SQLite 重开验证。
