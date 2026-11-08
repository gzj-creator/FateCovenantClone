# BATTLE-DUNGEON-ACTIVITIES 实施记录（副本与活动塔组）

日期：2026-11-08。分支 `task/BATTLE-DUNGEON-20261108`（基于 main `8ebd5a1`），
worktree `.worktree/gameplay-20261106/a1-dungeon-activities`。本轮只做服务端实现与专项验证，
未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK，
未连接原服；测试全部使用临时 SQLite 与临时 loopback TCP。

## 范围与分组合并顺序

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的六张卡，共 18 条数字命令，
按用户要求的优先级顺序实现并逐组提交：

| 组 | type | 状态 | 提交 |
| --- | --- | --- | --- |
| BATTLE-REDCLIFF | 55001–55004 | 实现 | `f963ca4` |
| BATTLE-TOWERDEFENSE | 97601–97605 | 实现 | `3094452` |
| BATTLE-SOULTRIAL / BATTLE-SCARLETTRIAL | 87104–87105 / 89101–89102 | 实现 | `370a7e3` |
| BATTLE-CAMPTOWER / BATTLE-DESTINYPVE | 93601–93603 / 104701–104702 | 实现（104701 fail closed） | 本组提交 |

## 证据与配置来源

- 协议：`personal-server/assets/protobuf` 下 `red_cliff`、`soul_trial`、`scarlet_trial`、
  `camp_tower`、`tower_defense`、`destiny_pve` 的 `.db.proto.bin`/`.net.proto.bin`。
- 请求编码：客户端 `RedCliffCmd.lua`、`SoulTrialCmd.lua`、`ScarletTrialCmd.lua`、
  `CampTowerCmd.lua`、`TowerDefenseCmd.lua`、`DestinyPveCmd.lua` 的 EncodeErl/EncodePB 常量。
  其中 PB 请求为 97601、93601、93602、104701、104702；其余为 ETF。
- 表数据：新增 `tools/extract-shipped-table.mjs`，复用已有的 LuaJIT 字节码解释器，从客户端
  `*.data.lua` 直接抽取六张生产表，产物提交为
  `personal-server/assets/tables/{RedCliff,TowerDefense,SoulTrial,ScarletTrial,CampTower,DestinyPve}Table.data.lua.json.gz`。
  抽取失败或字段非数组时加载即抛错，调用方 fail closed。

## 实现

共享层：

- `personal-server/config/dungeon-activity-tables.mjs`：六张表的只读访问器与 `rewardPairs` 校验。
- `personal-server/game/dungeon-activity-shared.mjs`：`dungeon_activity_state` /
  `dungeon_activity_claims` 两张幂等建表（按 `activity` 区分模块）、事务内读改写、
  claim 防重、`battleWon`（校验 `battle-end` 与 `result` 一致）以及统一错误码。

各命令：

- **RedCliff 55001**：按已通关关卡领取 `Level.res_list`，claim 键为关卡号；重复领取返回 3。
  **55002**：只能从服务端 `select_buff_list` 中选 `BuffTable` 行，选后写入装配位。
  **55003**：只有整轮 36 关全部通关才允许重置；重置周期无证据，进行中重置直接 fail closed。
  **55004**：每日刷新次数上限取 `Const.refresh_fight=3`，候选从 Buff 表抽取
  （`buff_lib` 在抽取结果中是不可展开的嵌套表引用，已登记缺口）。
  战斗进度由 `clearLevel({level, simulation})` 接缝推进，只接受真实 `simulateBattle` 胜利。
- **TowerDefense 97601**：校验 `Type` 行并持久化驻防列表；proto3 零值省略，index 缺省按 0 处理。
  **97602**：按 `Turns` 顺序推进一轮，奖励为 `Monster.award_item × award_num × monster_num`，
  写入待领轮次。**97603**：结算全部待领轮次，claim 按轮次防重。**97604**：按
  `Task.target_count` 与已结算轮次发放累计奖励，并写 `turns_award_bin` 位块。
  **97605**：只读预览待领轮次。
- **SoulTrial 87104**：按位置翻牌，每日免费次数取 `DrawCard.poker_day_free_times=4`；
  超出免费次数后付费消耗语义未恢复，返回 3 而不是猜测消耗。**87105**：一次性发放已翻未领
  卡牌，返回 `rev_day/rev_loc_list`，claim 按每日批次防重。
- **ScarletTrial 89101**：按 `Task.damage` 门槛领取 `award/award_count`，伤害来自
  `settleFight({simulation})` 对战斗事件里 `damage` harms 的求和。**89102**：只接受
  `Const.source_stone` 配置的源石，保存位置后不回包（`noReply`）。
- **CampTower 93601/93602**：分别领取 `FirstPass.all_award` / `first_pass_award`，
  要求 `recordPass` 用真实战斗模拟推进的首通等级达到 `FirstPass.level`，位块与 claim 双写防重。
  **93603**：按本服权威状态聚合首通列表（无伪造玩家）。
- **DestinyPve 104702**：按请求层号聚合本服真实通关状态，返回人数与首通玩家/时间/战力，
  `hero_list`/`lineup_list` 为空数组。**104701**：fights 回包 schema 与
  `FightTable.def_team` 敌阵均缺失，直接返回 5，不伪造战报、不推进层数。

网关：`personal-server/game/gateway.mjs` 只做增量——新增 8 行 import、6 行服务构造与 6 个
`supports()` 保护派发块，未调整既有登录同步、派发顺序或任何既有分支。

## 复现与日志

```powershell
cd personal-server
node --test test/red-cliff-service.test.mjs test/tower-defense-service.test.mjs test/trial-activities-service.test.mjs test/camp-tower-destiny-pve-service.test.mjs
node --test test/battle-peaktower-service.test.mjs test/general-dungeon-service.test.mjs test/general-dungeon-gateway.test.mjs
```

结果（主仓库 `analysis/test-runs/gameplay-20261106/`）：

- `BATTLE-DUNGEON-ACTIVITIES-specialized.log`：26 tests / 26 pass / 0 fail。
- `BATTLE-REDCLIFF-specialized.log`：7/7；`BATTLE-TOWERDEFENSE-specialized.log`：6/6；
  `BATTLE-SOULTRIAL-SCARLETTRIAL-specialized.log`：7/7；
  `BATTLE-CAMPTOWER-DESTINYPVE-specialized.log`：6/6。
- `BATTLE-DUNGEON-ACTIVITIES-neighbor-regression.log`：19 tests / 19 pass / 0 fail
  （BATTLE-PEAKTOWER、GENERALDUNGEON，证明网关增量未破坏相邻派发）。

专项覆盖：每组各有服务单测 + 真实临时 loopback TCP（909103 登录取 token 后逐 type 请求并
解码回包）+ SQLite 关闭重开 + SQLite 触发器失败整笔回滚 + PB/ETF 编码失败整笔回滚。
未运行全量 `npm test`（用户时限要求只跑新增命令专项）。

## Fail closed 与缺口

- **55003 RedCliff 重置周期**：无每日/每周周期证据，仅允许整轮完成后的重置，其余返回 5。
- **55004 RedCliff 刷新配额**：每日上限沿用 `Const.refresh_fight`，跨日本地按 UTC 日切换；
  `buff_lib` 未能从字节码解析出可展开数组，候选来自 Buff 表全集，属推断。
- **55001 RedCliff 宝箱**：只有 `clearLevel` 接缝推进的已通关关卡可领；通用战斗管线尚未派发到该接缝。
- **97602 塔防轮次**：`Turns.random_award` 全表为 0，本实现按怪物配置发击杀奖励；
  防御损耗/血量（`turns_hp`）与攻击计算没有可用的精灵攻击表，未实现真实承伤。
- **87104 灵魂历练付费翻牌**：`consume_item/consume_num` 语义未恢复，只服务每日免费次数。
- **89101/89102 猩红试炼**：活动版本/轮次（`version`、`turn_day`）窗口未接入，回包 version 固定 0；
  伤害取自模拟事件求和，客户端上报值一律不采信。
- **93601/93602 阵营塔**：`pb_camp_tower_info.open_time` 取本服初始化时间，`TypeOpenDays`
  的开启天数规则尚未校验；双子服首通榜按本服状态聚合。
- **104701 命运回廊**：回包 schema 定义缺失且 `FightTable.def_team` 不在 assets，明确返回 5。
- **104702**：`hero_list`/`lineup_list` 依赖阵容快照，未接入，返回空数组。
- 所有组均未做 APK 视觉/交互验收；客户端入口、错误码文案与动画表现待统一 APK 验收。

## 变更文件

```
personal-server/config/dungeon-activity-tables.mjs
personal-server/game/dungeon-activity-shared.mjs
personal-server/game/red-cliff-service.mjs
personal-server/game/tower-defense-service.mjs
personal-server/game/soul-trial-service.mjs
personal-server/game/scarlet-trial-service.mjs
personal-server/game/camp-tower-service.mjs
personal-server/game/destiny-pve-service.mjs
personal-server/game/gateway.mjs
personal-server/test/red-cliff-service.test.mjs
personal-server/test/tower-defense-service.test.mjs
personal-server/test/trial-activities-service.test.mjs
personal-server/test/camp-tower-destiny-pve-service.test.mjs
personal-server/assets/tables/{RedCliff,TowerDefense,SoulTrial,ScarletTrial,CampTower,DestinyPve}Table.data.lua.json.gz
tools/extract-shipped-table.mjs
```
