# BATTLE-TRIPLEMATCHFIGHT 实施记录（三消战斗管线）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`，worktree
`.worktree/gameplay-20261108/a2-trimatch`。本卡只做服务端实现，未启停实时服务、未读写运行数据库、
未操作模拟器/ADB/APK、未派子 agent；验证只用 `node --check` 与 `git diff --check`。

## 任务范围

模块 `TripleMatchFightCmd`，6 条命令此前完全没有路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 115001 | `req_triple_match_fight` | protobuf `pb_triple_match_fight_request` → `pb_triple_match_fight_response` | 已实现（真实阵容、真实棋盘、真实 battle-engine 模拟、战报落库） |
| 115002 | `triple_match_fight_swap` | protobuf `pb_triple_match_fight_swap_tile_req` → 空包 | 已实现校验、幂等与落库；棋盘消除规则无证据，fail closed 不解析不解算 |
| 115003 | `triple_match_fight_retry` | ETF(战斗 id) → `pb_triple_match_fight_response` | 已实现（同战斗重建棋盘与模拟，attempt+1） |
| 115004 | `triple_match_fight_ready` | protobuf `pb_triple_match_fight_ready_req` → `pb_triple_match_fight_ready_rsp` | 已实现（校验 round/phase，返回操作窗口毫秒） |
| 115005 | `triple_match_fight_giveup` | ETF(战斗 id) → ETF 空元组 | 已实现（状态 given_up、结果改判失败） |
| 115006 | `triple_match_fight_get_record` | ETF(战斗 id) → `pb_triple_match_fight_report` | 已实现（由落库战报逐条还原 `action_list` 与棋盘） |

6 条命令全部实现：6/6。

## 配置与协议证据

### protobuf（明文 .proto，直接读取）

`personal-server/assets/protobuf/triple_match_fight_net.proto.bin`、
`triple_match_fight_db.proto.bin`：

- `pb_triple_match_fight_response`：`id`、`tid`、`type`、`red_role_id`、`blue_role_id`、
  `map(pb_triple_match_fight_map{tile_list})`、`atk_power`、`def_power`、`action_list`、
  `round_id`、`phase_id`、`remaining_ms`、`is_pve`、`red_teams`、`blue_teams`。
  字段注释明确 `remaining_ms` “PVE 为 0”、`is_pve` “PVE 不启用操作倒计时”。
- `pb_triple_match_fight_swap_tile_req`：`id/x1/y1/x2/y2/is_auto/round_id/phase_id/client_op_id`，
  `client_op_id` 注明“客户端单调递增操作 id，用于幂等”。
- `pb_triple_match_fight_ready_req/rsp`：`fight_id/round_id/phase_id`、`remaining_ms/round_id/phase_id`。
- `action`：19 个可选子消息（`fightStart`…`boardSwap`）；`pb_triple_match_fight_report`
  的 `action_list` 是 `repeated bytes`，每条为一个 `action` 编码结果。

### 客户端 LuaJIT 字节码

来源目录 `analysis/scratchpad/time-temple-20261108/project/`，用 `tools/dump-luajit-prototypes.mjs` 读取：

- `TripleMatchFightCmd.lua.bin` 注册 6 条命令：115001/115002/115004 用 `Codec.EncodePB`，
  retry / giveup / get_record 用 `Codec.EncodeErl`（单参，即战斗 id）。
- `FightTripleMatchFightMgr.lua.bin`：`ReqStartFight` 取
  `TripleMatchFightTable.TripleMatchFight[fightTid].lineup` 与出战编队；`ReqSwap` 传
  `id,x1,y1,x2,y2,round_id,phase_id,client_op_id`；`ReqReady` 在 `IsNeedCountdown` 时发
  `fightId, roundId, operatePhaseId`；`RevSettlement` 从 `action_list`/`map` 重建战报；
  `CreateReplayData` 读 `fight_id/fight_tid/fight_type/red_role_id/blue_role_id/atk_power/def_power/final_result/settlement`。
- `TripleMatchFightTable.lua.bin` 的常量顺序给出动作 id：`TID_ACTION_FIGHT_START`(1)、
  `FIGHT_END`(2)、`ROUND_START`(3)、`ROUND_END`(4)、`SKILL_START`(5)、`SKILL_END`(6)、
  `SING_SKILL`(7)…`UPDATE_ATTR`(16)、`OPERATE_START`(17)、`OPERATE_END`(18)、`BOARD_SWAP`(19)，
  与资源表 `ActionType` 的 19 行 tid 一一对应（其中 tid 3 即 roundStart 标了 `is_push`）。
- 同一文件的 `PLAYER/NPC/MIRROR` 常量给出 `Type.role_type` 语义：0 玩家、1 NPC、2 镜像。

### 四张战斗子表（`TripleMatchFightTable`）

| 子表 | 行数 | 关键字段与样例 |
| --- | ---: | --- |
| `TripleMatchFight` | 645 | `{tid,type,board,lineup,def_team,fight_scene}`；`type` 分布 1:2、2:1、3:501、4:1、5:139、6:1；例 `300001→type3,board1,lineup2,def_team100` |
| `Team` | 642 | `{tid,npc[],loc[],attr[],show_power}`；例 `Team[100].attr=[5003,2503,3,2503]`、`show_power=2248` |
| `Board` | 1 | `{tid:1,x_tile:6,y_tile:6,tile_lib:1,grid_size:99,three_add_angle:30,four_add_angle:40,five_add_angle:50}` |
| `Tile` | 16 | lib=1，type 1–4 × sub_type 1–4；`sub_type=1`（tid 1–4）权重 25，其余权重 0 |
| `Type` | 6 | `max_round=15`、`round_operate_times=2`、`need_countdown`、`max_time`、`default_speed`、`role_type` |
| `Const` | 1 | `op_timeout=15`、`ready_guard_extra=20`、`board_rage=10000`、`min_dec_rage=2000`、`countdown_ani=10` |

`Team.attr` 的整数就是 `TripleMatchFightTable.NpcAttr` 的 tid（本轮新增的
`TripleMatchFightNpcAttr.data.lua.json.gz`，23054 行、tid 1..30552、`show_level` 1..500）。
用 `BattleTriMatchPowerConst` 的 生命×1 + 攻击×8 + 防御×50 对每支 `Team` 求和，可与
`Team.show_power` 对照：642 支队伍中 632 支落在 ±15% 内，中位比值 1.067；偏差大的是
`Team 1–4`（`show_power` 为 100–103 的占位值）与 `Team 100–105`（手调新手队伍）。
这条对照是本卡“敌方属性来自真实表”而不是按我方缩放的直接证据，运行期也会在偏差 >15% 时打
`trimatch_enemy_power_warning` 日志。

## 实现

新增 `personal-server/game/trimatch-fight-service.mjs`（`createTriMatchFightService`），
复用已有的 `trimatch-core.mjs`（属性/战力/编队）与 `battle-engine.mjs`（`simulateBattle`）。

### 权威状态（SQLite，事务内幂等建表）

```sql
trimatch_fight(role_id, fight_uid, fight_tid, fight_type, is_pve, lineup_type, board_tid,
               board_json, red_team_json, blue_team_json, atk_power, def_power,
               atk_role_id, def_role_id, result, attempt, round_id, phase_id, remaining_ms,
               status, created_at, updated_at, PK(role_id,fight_uid))
trimatch_fight_action(role_id, fight_uid, seq, action_type, payload BLOB, PK(role_id,fight_uid,seq))
trimatch_fight_op(role_id, fight_uid, client_op_id, round_id, phase_id, x1,y1,x2,y2, is_auto,
                  created_at, PK(role_id,fight_uid,client_op_id))
```

棋盘、双方阵容、战力快照、模拟结果、回合/阶段与 1..N 条战报动作全部落库；`status` 取
`running`/`given_up`。`trimatch_fight_op` 的主键就是客户端 `client_op_id`，重复请求直接回放。

### 各命令业务

- **115001 开战**：`fight_tid` 必须存在于 `TripleMatchFight`。出战阵容由
  `teamSitesOf/fightersOfRole` 从该行 `lineup` 对应的出战编队解析（槽位、英雄、等级、星级、装备）；
  敌方由 `def_team → Team → Npc → NpcAttr` 解析；棋盘按 `Board.x_tile/y_tile` 与
  `Tile` 权重（25/25/25/25）用 mulberry32 按 `(role, fight, attempt)` 确定性生成；
  双方战力按 `BattleTriMatchPowerConst` 计算；随后用 `Type.max_round=15` 作为
  `simulateBattle` 的 `maxRounds` 跑真实模拟，`result` 即模拟结果。`remaining_ms` 按
  `is_pve = !need_countdown`：PVE 为 0，PVP 为 `Const.op_timeout×1000=15000`。
  回包 `pb_triple_match_fight_response`（`action_list` 来自模拟事件流，见下）。
- **115002 换块**：校验战斗归属与 `status=running`、坐标在棋盘内且不是同一格、
  `client_op_id` 幂等、单场操作数上限 4096，落 `trimatch_fight_op` 后返回空包。
  **不做棋盘解算**：相邻判定、三连/四连/五连的消除顺序、消除伤害归属、`three/four/five_add_angle`
  的角度累积与 `board_rage` 扣减都没有证据，客户端 Lua 只是回放服务端 `del_list`。
  因此不修改棋盘、不推 11901 `rev_triple_match_fight_swap_record`，并记录
  `trimatch_swap_recorded_without_resolution`。
- **115003 重试**：按 ETF 单参（战斗 id）或最新一场重建同 `fight_tid` 的战斗：新棋盘、新种子、
  `attempt+1`，清空该场 `trimatch_fight_op` 并覆盖战报动作。
- **115004 准备**：`fight_id/round_id/phase_id` 必须与落库值一致，否则报状态错误；回
  `pb_triple_match_fight_ready_rsp{remaining_ms, round_id, phase_id}`。
- **115005 放弃**：`status=given_up`、`result` 改判为失败(2)，重复放弃幂等。
- **115006 战报**：把落库的 `trimatch_fight_action` 按 seq 还原成 `action_list`，配落库棋盘，
  回 `pb_triple_match_fight_report`（`create_time` 取建场时间，`expire_time` 为本地保留期 7 天）。

### 战报投影

`action_list` 由真实模拟事件流投影：`round-start→roundStart`、`action-start→skillStart`、
`damage→hurt`（`delHp` 取负、`realValue` 取实际扣血、`sourceUid` 为来源单位）、
`heal→recover`、`shield→updateAttr(Attr 26 护盾)`、`anger-sync(67 怒气)→updateAnger`、
`death→dead`、`round-end→roundEnd`、`action-end→skillEnd`（成对关闭 `skillStart`），
首尾是 `fightStart`（含双方 `action_team` 与战力）与 `fightEnd`。
`addBuff/removeBuff/updateBuff/revive/boardSwap` 的载荷形状未恢复，直接不投影而不是编造。

### 与爬塔的结算缝

构造参数 `hooks.onFightSettled(model, db, {fightUid, fightTid, fightType, result, powers, fighters})`
在开战并把结果落库后调用；网关把它接到 `createTriMatchTowerService(...).settle(...)`，
所以爬塔层数是“真实胜利”推进，客户端没有自报胜负的入口。

## 验证

按任务纪律只做静态检查：`node --check` 覆盖 `trimatch-fight-service.mjs` 与改动后的
`gateway.mjs`，`git diff --check` 无空白/冲突标记问题。本卡未运行 `npm test`、未起本地服务、
未连真实 TCP、未读写运行数据库、未做 APK 验收，因此**没有**任何“已实测”结论。

## 未闭合缺口

- **棋盘解算缺失（最大缺口）**：换块后的消除、掉落、补块、角度/怒气累积、棋盘技能
  （`Const.board_skill/board_skill_four/board_skill_five`）与伤害归属都没有证据；
  当前换块只记账不解算，战斗过程是开战时一次性算完的完整战报。客户端若依赖玩家操作推进，
  会停在首个操作阶段。
- **11901 / 11902 推送未发送**：`rev_triple_match_fight_swap_record` 与
  `rev_triple_match_fight_settlement`（`stm_data` 是模块私有载荷，形状未恢复）都没有实现，
  服务端目前只靠 115001 的 `action_list` 与 115006 的战报表达结果。
- **115002/115005 回包形状**：客户端用 `Cast`/`EncodeErl` 发送、静态目录里是 etf-fallback，
  当前分别返回空包与空 ETF 元组；真实客户端是否接受未验证。
- **115003 重试语义**：请求单参按“战斗 id”理解；若原服传的是别的标识（例如操作序号），
  当前会回落到该角色最新一场。
- **操作阶段未建模**：`operateStart/operateEnd` 与 `operate_list`（`round_operate_times=2`）
  不投影，`round_id/phase_id` 固定从 1 开始且不递增；115004 只回显落库值。
- **登录活动数据未同步**：模块 92 的活动状态仍未写入三消战斗/爬塔/PVP 的 `StateData`，
  客户端活动面板在拿到该数据前可能看不到入口；本轮只实现命令侧。
- **战报保留期**：`expire_time` 用本地 7 天策略，未取得原服配置。
- **战斗数值**：三消英雄没有专属技能表（`BattleTriMatchHeroTable` 只有属性/星级/职业），
  投影里的 `skillTid` 取模拟事件的 `abilityId`（多为 0），`skillLevel` 固定 1；
  三消的真实出手与棋盘强相关，这里的数值只是同源属性下的近似。

