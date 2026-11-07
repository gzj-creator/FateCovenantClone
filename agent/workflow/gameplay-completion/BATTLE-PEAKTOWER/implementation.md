# BATTLE-PEAKTOWER 实施记录（巅峰塔 / 爬塔）

日期：2026-11-07。分支 `task/BATTLE-PEAKTOWER-20261106`（基于 main a5300de），worktree
`.worktree/gameplay-20261106/battle-peaktower`。本任务只做服务端实现与组件/临时 TCP/SQLite 验证，
未启停实时服务、未操作模拟器，也未做 APK 视觉验收。

## 任务范围

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的 `## BATTLE-PEAKTOWER`：
模块 `PeakTowerCmd`，6 条命令此前完全未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 1103 | `peak_tower_sweeps` | protobuf `peak_tower_sweeps_req` → `peak_tower_sweep_back` | 已实现（真实层奖励、次数限制、按层每日防重） |
| 1104 | `peak_tower_every_award` | etf → `peak_tower_back` | 已实现（逐层通关奖励一次领取，`award_time` 落库） |
| 1109 | `peak_tower_buy_goods` | etf → `pb_res_to_client` | 已实现（Shop 表价格/货币扣除与发货、`buy_goods` 落库） |
| 1110 | `peak_tower_receive_achievement` | etf → `pb_res_to_client` | 已实现（按塔段完成条件领取 `Type.award`） |
| 1111 | `peak_tower_rev_tower_award` | etf → `pb_res_to_client` | 已实现（按塔段领取 `Type.award`，`tower_award` 位块落库） |
| 1112 | `peak_tower_avg_layer` | etf → 未恢复 | 已实现服务端聚合（回包 schema 仍是缺口） |

## 配置与协议证据

### protobuf（权威字段语义）

`personal-server/assets/protobuf/peak_tower.db.proto.bin`、`peak_tower.net.proto.bin` 是明文
`.proto` 文本，本次直接读取：

- `pb_peak_tower_data`：`layer`(1 当前层)、`award_time`(3)、`max_layer_time`(4)、
  `max_layer`(5 昨日最高层)、`layer_change_time`(6)、`buy_goods`(7 已购商品)、
  `count_limit`(8 `pb_count_flush{flush_time,count}`)、`fail_equip_score`(9)、`fail_time`(10)、
  `fail_power`(11)、`tower_award`(12 通关塔奖励领取记录，按位块理解)。
- `peak_tower_req.challenge_tid` 是作战层号，`peak_tower_sweeps_req.sweeps_layer` 是扫荡层号。
- `peak_tower_back` = `{pb_peak_tower_data, pb_res_to_client}`；`peak_tower_sweep_back` 只是把
  `peak_tower_back` 再包一层。
- 1112 的回包在静态目录里是 `etf-fallback`，客户端用通用 ETF 解码，具体字段仍未恢复。

### PeakTowerTable 表数据（本次新提取）

客户端表数据只以 LuaJIT 字节码形式存在，仓库里此前没有 `PeakTowerTable` 资源。本次新增：

- `tools/extract-peak-tower-table.mjs`：用 `tools/luajit-bytecode-parse.mjs` 解析
  `PeakTowerTable.data.lua`（来源：客户端 lua 项目包解包产物
  `PeakTowerTable.data.lua.bin`，本机路径
  `.worktree/recruit-20261101/.scratch/out/luaproject/PeakTowerTable.data.lua`），
  用小型字节码解释器按 `TDUP/TNEW/TSETB/TSETS/TSETM/CALL` 语义还原行数据，行槽位按各子表
  前导字段映射（如 `Shop` 的 `tid,tower,layer,goods,currency,price,original_price`）还原。
- 产物 `personal-server/assets/tables/PeakTowerTable.data.lua.json.gz`：Shop 14 行、
  LayerRange 3 行、Type 27 行、PeakTower 9000 行（每行含 `fight`、`pass_award`、
  `pass_award_n`、`fighting_power`、`tower_index`）、ShowAward 2 行、
  PeakSpecialAward 27 行、FightVictory 7、FighterChooseRule 165、DiffRank 324、
  DiffRankAttr 151、Stage 3、FighterCustomRule 1、Global 1 行（27 字段）。
- 复核样例：`Shop[1]={tid:1,tower:1,layer:30,goods:[[101500,1]],currency:101500,price:588,original_price:4000}`、
  `LayerRange=[{1,[0,800]},{2,[801,1600]},{3,[1601,99999]}]`、
  `PeakTower[1].pass_award=[157002,201500,101800]`、`pass_award_n=[600,2200,50]`、
  `Type[1].layer_range=[1,60]`、`Type[1].award=[[21100404,30],[24300404,60]]`。

### 用到的 Global 字段（`PeakTowerTable.Global`，单行）

- `fast_harvest_layer=140`：扫荡/快速收获的层数上限（本实现作为 1103 的扫荡深度上限）。
- `rapid_fighting=10`：每日快速作战次数（本实现作为 1103 每日扫荡次数上限）。
  该映射由字段名与数值推断，尚无运行时观测，见“缺口”。
- 其余字段（`skip_layer`、`dispatch_layer`、`auto_fight_*`、`hook_layer` 等）属自动推图/挂机
  逻辑，本轮未接入。

### 客户端逻辑证据（PeakTowerMgr / PeakTowerErr）

`PeakTowerMgr.lua` 常量显示：`layer/award_time/max_layer/buy_goods/count_limit/tower_award`
直接对应 `pb_peak_tower_data`；`PeakTowerTable.TypeList`+`GetPeakTowerAwardState` 决定每段塔的
领奖状态；`PeakTowerTable.Shop` 决定商品；`TID_FIGHT_TYPE_PEAK_TOWER` 说明作战走通用战斗管线。
`PeakTowerErr.lua` 的错误名：`PEAK_TOWER_DATA_ERROR`、`PEAK_TOWER_LAYER_LIMIT`、
`PEAK_TOWER_BUY_GOODS_ERROR`、`PEAK_TOWER_NOT_OPEN`、`PEAK_TOWER_SWEEP_ERROR`，
本实现用业务错误码区分同类情形（1 参数、3 次数/重复、5 状态/配置、301 资源不足）。

## 实现

新增文件：

- `personal-server/config/peak-tower-tables.mjs`：读取 `PeakTowerTable` 资产，提供
  `peakTowerLayer`、`peakTowerLayerAwards`、`peakTowerTypeForLayer`、`peakTowerTypeAwards`、
  `peakTowerMaxLayer` 等只读访问器；奖励数组长度不一致直接报配置错误。
- `personal-server/game/peak-tower-service.mjs`：6 条命令、状态表、事务与防重。
- `personal-server/test/battle-peaktower-service.test.mjs`：12 个测试（含真实 TCP 与故障回滚）。
- `tools/extract-peak-tower-table.mjs`、`tools/luajit-bytecode-parse.mjs`：表数据提取工具与解析器。

修改文件：`personal-server/game/gateway.mjs` 只增加三处——import 两行、构造
`createPeakTowerService` 一行、一个受 `peakTower.supports(type)` 保护的派发块（1103 用
`unpack('peak_tower_sweeps_req')`，其余用 ETF 解码）。未重排其它代码，未改
`storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*`、`config/skill-database.json`、
`fixtures/game.sqlite`。

### 权威状态（SQLite，构造期幂等建表）

```sql
peak_tower_state(role_id PK, layer, max_layer, max_layer_time, award_time,
                 buy_goods TEXT(json), sweep_day, sweep_used, tower_award TEXT(hex), updated_at)
peak_tower_claims(role_id, claim_type, claim_key, created_at, PK(role_id,claim_type,claim_key))
```

claim 类型：`peak_tower_layer`（逐层奖励）、`peak_tower_sweep`（当日按层扫荡）、
`peak_tower_achievement`（塔段成就）、`peak_tower_tower`（塔段通关奖励）、`peak_tower_goods`（商品）、
`peak_tower_challenge`（已通关层）。`tower_award` 同时按 `bit-block.mjs` 位块格式写回状态，
与 `pb_peak_tower_data.tower_award` 语义一致。

### 各命令业务

- **1103 扫荡**：`sweeps_layer` 视为要扫荡的层（必须已通关，否则 `not unlocked`）；层号超过
  `fast_harvest_layer` 报 `exceeds`；当日已扫荡次数达 `rapid_fighting` 报 `insufficient`；
  同一层当日重复扫荡报 `already settled`。奖励取该层 `PassTower.pass_award`/`pass_award_n`。
  回包 `peak_tower_sweep_back`，其中 `count_limit.count` 返回当日剩余次数。
- **1104 逐层奖励**：对 `1..layer` 中尚未领取的层，按配置发奖并写 claim，同时更新
  `award_time`；无新可领时返回 `already claimed`（不空包、不重复发奖）。
- **1109 购买**：校验商品存在、`layer` 门槛已达、未购买过；按 `currency/price` 扣费
  （不足 301），按 `goods` 发奖，记录 `buy_goods` 与 claim。
- **1110 成就**：按 `Type.layer_range` 上界判断是否达成，领取 `Type.award`，一次性 claim。
- **1111 通关塔奖励**：对 `max_layer` 已超过 `Type.layer_range` 上界的塔段领取 `Type.award`，
  写 `tower_award` 位块与 claim；指定未达成的塔段返回 `not reached`。
- **1112 平均层**：对 `peak_tower_state` 的 `max_layer` 做服务端聚合（人数、四舍五入平均），
  不用客户端上报值，也不返回固定值。

### 战斗结果来源

作战本身走通用战斗管线，通用管线结算时调用本服务的 `challenge({ layer, simulation })`：
只接受 `battle-engine.mjs` 的 `simulateBattle` 结果（校验 `events` 中 `battle-end` 与
`result` 一致），败北不改进度，胜利才把 `layer` 推进一层并写 `peak_tower_challenge` claim。
客户端无法通过这 6 条命令自报胜负。测试用真实 `simulateBattle` 跑出胜负两种结果验证。

## 验证

`cd personal-server; npm test` 结果为 2096 项、2093 通过、3 失败，3 个失败全部来自
`test/login-business-reads.test.mjs`（缺本地证据库 `handoff-game.local-only.sqlite`，任务说明要求
不修；与基线 2084/2081/3 一致）。新增用例 12/12 通过。

覆盖：正常扫荡、非法/未解锁/超深/超次/重复扫荡、逐层奖励一次性与重开库防重、真实胜负推进、
成就达成与重复领取、塔奖励与位块持久化、购买扣费与重复购买、资源不足、平均层聚合、
SQLite 触发器失败整体回滚、编码失败整体回滚（奖励与 claim 均未落库，随后可正常重试）。

临时 TCP：使用 `fixtures/login-modules.seed.json` 完成握手与登录，通过真实数字 type 发送
`pb_c2s`：1103 返回可解码的 `peak_tower_sweep_back`（`layer=5`、资源变更非空）、
重复 1103 返回 `err=3`、1112 返回 ETF `[5]`、非法 protobuf 负载返回 `err=2`。

## 未闭合缺口（按命令）

- **1103**：`sweeps_layer` 取“单层”还是“层数”只能从字段注释 `扫荡层数` 推断，本实现按单层且
  返回 `layers:[layer,layer]`；每日次数上限借用 `Global.rapid_fighting=10` 属推断；
  真实客户端扫荡入口未做 APK 验收。
- **1104**：`award_time` 只作为“最近一次领取时间”落库，跨天重置规则（客户端 `DAY_FLUSH`/
  `PEAK_TOWER_DAY_AWARD`）未取得具体配置，未实现每日重置后重新可领。
- **1109**：Shop 行的 `goods=[[101500,1]]` 与 `currency=101500` 同源，说明该商品以该货币结算
  并回收 1 单位；是否还有限购/折扣（`original_price`、`BuyCycleLimit`）未接入。
- **1110**：“成就”在客户端由任务表（`TID_TASK_PEAK_TOWER_CHALLENGE_TO`、`taskTidRange`）驱动，
  仓库暂无可用的该任务表切片；本实现以 `Type` 塔段达成 + `Type.award` 作为成就奖励来源，
  与任务系统联动的真实成就口径仍是缺口。
- **1111**：`tower_award` 只按塔段 tid 置位，未复现客户端 `CONST_MOST_REV_LIMIT_NUM`
  单次领取上限与“切塔后领取”的界面顺序。
- **1112**：回包 schema 未恢复（静态目录为 `etf-fallback`），当前返回单元素 ETF 整数元组
  `[average]`，无人数；真实客户端能否解码需 APK 验收。
- **通用**：作战层敌人来自 `FightTable`（`fight` tid → `def_team` → `Team` → 怪物），该表尚未
  纳入 `personal-server/assets/tables`，因此通用战斗管线无法在本地起塔战斗；`challenge`
  结算缝已就绪，接上 `FightTable` 数据与战斗管线派发后即可闭环。
