# BATTLE-MARTIALCLUB 实施记录（武馆组队挑战）

日期：2026-11-08。分支 `task/A2-MARTIAL-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-martial`。本任务只做服务端实现与静态自检，未启停实时服务、
未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 任务范围

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的 `## BATTLE-MARTIALCLUB`：
模块 `MartialClubCmd`，24 条命令此前完全未路由（84401、84404–84426）。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |

（阶段 2 填写）

## 阶段 1：配置、提取工具与 PvP 战斗内核（检查点）

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

### 证据来源

- 协议明文：`personal-server/assets/protobuf/martial_club.{db,net}.proto.bin`、
  `martial_club_act.{db,net}.proto.bin`、`tournament.{db,net}.proto.bin`、
  `match_pvp.{db,net}.proto.bin`、`top_arena.{db,net}.proto.bin`。
- 客户端脚本字节码：`analysis/scratchpad/time-temple-20261108/project/` 的
  `MartialClubCmd/Mgr/TeamMgr`、`MartialClubActCmd/Mgr`、`TournamentCmd/Mgr`、
  `TopArenaCmd/Mgr/SemiMgr/TowerMgr`、`MatchPVPDataMgr`（用 `tools/dump-luajit-prototypes.mjs` 读常量）。

### 自检

`node --check` 覆盖新增的 `tools/extract-lua-table.mjs`、5 个 `config/*.mjs` 与
`game/pvp-battle.mjs`；`git diff --check` 无输出。按要求未执行 `npm test`，未启动服务或 TCP 探针。
