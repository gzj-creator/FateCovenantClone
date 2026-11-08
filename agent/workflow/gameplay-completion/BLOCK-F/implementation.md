# F 块（#120–#150 招募、抽取、翻牌与转盘活动）实施记录

2026-11-08。分支 `task/BLOCK-F-20261108`，worktree `.worktree/gameplay-20261108/block-f`。

## 交付范围与实际状态

块 F 共 31 张任务卡 / 74 条缺失命令。本次交付分两层：

1. **共享基础（全块可用）**：把 24 张活动配置表从客户端 LuaJIT 资产可复现地抽取为服务端资产，新增通用活动表读取器，并让表解释器支持 `UGET` 指令。此前 F 块几乎所有命令都因为“没有配置表”阻塞，这一层解除了该阻塞。
2. **真实业务实现（3 条命令）**：DRAW-TURNTABLEACT 107901、DRAW-CAPSULETOY 102301、DRAW-THREEADMONITION 88965。三条都按真实表配置扣费、按权重或序号发奖、写 SQLite、支持重开与失败回滚。

其余 71 条命令仍走网关的 `LOCAL_NOT_IMPLEMENTED`，**不计入完成**；逐族原因见文末“未实现清单”。

## 新增与修改的代码

| 文件 | 作用 |
| --- | --- |
| `tools/extract-draw-activity-tables.mjs` | 从 `analysis/tmp/lua-bundles/64_lua_project.bundle` 抽取 24 张 F 块活动表，写成 `personal-server/assets/tables/<Name>.data.lua.json.gz` 原型 dump |
| `personal-server/assets/tables/*.data.lua.json.gz`（24 个新文件） | 新增运行资产：MagicDraw / Pyramid / ThreeAdmonition / HundredBonus / RaffleTicket / HeroBlazonDraw / LotteryAct / MysteryWish / Lottery / FlipCard / TicketDraw / FruitDrawAct / ElvesAct / CapsuleToy / ChildPuzzleAct / HoardWheelAct / ThousandDraw / PrayAct / CashbackDraw / TurntableAct / FlopCardAct / Chess / ChessRevert / WishTree |
| `personal-server/config/draw-activities-tables.mjs` | 读取活动表：`readActivityTables(name)` 返回全部子表，读不了的子表进入 `missing`，不拖垮整个族；`listActivityConstructors` / `activityRows` 辅助函数 |
| `personal-server/config/hero-tables.mjs` | 表解释器新增 `UGET`（upvalue）容错，与既有 `GGET` 兜底一致；既有表不含该指令，行为不变 |
| `personal-server/game/draw-activity-service.mjs` | 活动抽取服务：`draw_activity_state` / `draw_activity_logs` 两张幂等表，计数器、领取位、选择项按 (role,module,version) 落库；实现 107901、102301、88965 |
| `personal-server/game/gateway.mjs` | 新增 import、服务实例与派发块（位于 bonusDraw 之后、activityRead 之前），ETF 无参数或标量参数统一解析后交给服务 |
| `personal-server/test/draw-activity-service.test.mjs` | 4 项专项测试 |

## 已实现命令的规则依据

- **107901 `req_turntable_act_go`**：`TurntableActTable.Ver.use_item` 是单次价格（`[[6881900,1]]`），`Award` 行按 `version` 匹配，`weight` 加权抽奖，`min_num` 是累计抽数门槛，达到后进入大奖池。回包 `pb_turntable_act_go_back` 填 `res`、`draw_tid`、`act_data`（抽数与本次奖品 tid）。`act_data` 只填已恢复字段，其余留空属证据缺口。
- **102301 `req_capsule_toy_draw`**：`CapsuleToyTable.Const` 的 `draw_cost_item/draw_cost_num` 是价格，`draw_limit_num` 是本期上限；`Version.pool` 指定参与奖池，`PoolOutput` 行按 `num` 加权给出玩具 tid 与数量。回包 `pb_capsule_toy_draw_back` 填 `res`、`draw_list`、`draw_count`、`day_hit_count`。
- **88965 `req_three_admonition_add_draw_count`**：`ThreeAdmonitionTable.Const` 的 `cost_item/cost_item_num` 是购买一次抽取次数的价格，`max_draw_count` 是上限；回包 `pb_res_to_client`。

三条命令都在同一事务内完成扣费、发奖、计数与日志写入；编码失败或 SQLite 写入失败整笔回滚（复用 `store.transaction` 与 `consumeResources`/`grantResources`）。

## 验证

```powershell
cd personal-server
node --test test/draw-activity-service.test.mjs
node --test test/draw-activity-service.test.mjs test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs test/hundred-draw-gateway.test.mjs test/bonus-draw-gateway.test.mjs
```

- 专项 4/4：扣费与发奖、资源不足 fail closed 且不留状态、抽数上限、重开后计数延续。
- 回归：draw-activity + gameplay-gateway + m5-command-matrix + hundred-draw-gateway + bonus-draw-gateway 全通过（日志 `analysis/tmp/f-block/focused.log`）。
- 未做：APK 客户端验收、真实 TCP 端到端（三条命令的 ETF 请求形态尚未与抓包比对）、全量 `npm test`。

## 未实现清单（71 条，按族）

| 任务卡 | 命令 | 阻塞证据 |
| --- | --- | --- |
| DRAW-MAGICDRAW | 60002–60004 | `MagicDrawTable` 有 Hero/Award 行，但选人后的抽取计次来源与 `StarRes` 为空，星级奖励无配置 |
| DRAW-PINBALL | 88921 | 无独立 PinBall 表，弹珠成就挂在 FantasyEquipAct 上，需先恢复其任务/成就映射 |
| DRAW-FANTASYEQUIPACT | 88925–88926 | 管道小游戏状态与 `pb_pipe_connect_game` 回包字段未反解 |
| DRAW-PYRAMID | 88941–88942 | `Ceil/Fight/ShopSettle` 的翻层与战斗流程未接，抽取代币口径未定 |
| DRAW-THREEADMONITION | 88961, 88962, 88966 | 顺序抽取索引、宝箱完成位与入场态的角色数据结构未反解（仅 88965 已做） |
| DRAW-HUNDREDBONUS | 89401–89403 | `Robot.money` 随机与 `HundredBonus.need_amount_list` 的付费口径未定 |
| DRAW-WISHTREE | 91703 | 现由 `wish-tree-service` 承担，宝藏领取需在其状态机上补 `treasure_need_times` 结算 |
| DRAW-CHESS | 91901–91906 | `Param/FixedAward` 可用，但 `Task/Exchange/ChooseAward` 生产 0 行，回包 `pb_chess` 数据未反解 |
| DRAW-RAFFLETICKET | 92101 | 成就算法的抽数来源属于票券抽奖服务，尚未接线 |
| DRAW-HEROBLAZONDRAW | 92201 | `HeroBlazonDraw.draw_lib` 指向未抽取的抽奖库表 |
| DRAW-LOTTERYACT | 92301–92302 | `Lib/LotteryAct` 可用，但保底 luck 与奖品日志结构未反解 |
| DRAW-MYSTERYWISH | 93001 | `Item.type` 与 `Const.cost_item` 的兑换方向未确认 |
| DRAW-LOTTERY | 93101–93102 | `Item.draw_lib=3901` 对应奖池表未抽取，过期处理缺配置 |
| DRAW-FLIPCARD | 97201–97301 | `Version/Turn` 有行，棋盘与奖池表缺 |
| DRAW-TICKETDRAW | 97501–97502 | 名次奖依赖票券排名服务与结算时点 |
| DRAW-FRUITDRAWACT | 97901–97902 | `CellShow/NormalCell/BigCell/ContinueCell` 的连线与倍率规则未反解 |
| DRAW-DRAW | 98101 | `pb_role_random_draw_item` 心愿池属通用招募，需与 `recruit-service` 心愿记录合并 |
| DRAW-ELVESACT | 100901–100903 | `DrawAward` 有行，但主精灵选择与果实抽取的活动版本映射未定 |
| DRAW-CAPSULETOY | 102302–102304 | 兑换孔位与收集进度字段未反解（仅 102301 已做） |
| DRAW-CHESSREVERT | 102401–102403 | `ActTurn/ActActive/Gift` 有行，轮次与棋盘翻转状态未接 |
| DRAW-CHILDPUZZLEACT | 103301–103305 | `PuzzleVersion.draw_lib=5510` 的奖池表未抽取 |
| DRAW-HOARDWHEELACT | 103501–103503 | `Pool.draw_id` 指向通用抽奖库，任务行齐全但进度事件未接 |
| DRAW-THOUSANDDRAW | 104501–104502 | `Group.lib_range` 是 [权重,道具,数量] 三元组，需与层数进度合并后再实现 |
| DRAW-PRAYACT | 104901–104902 | `AwardRation/AwardIndex` 可用，祈祷分组与自选位未反解 |
| DRAW-CASHBACKDRAW | 105501–105504 | `Round.cost_num` 缺配套货币，全服进度无权威来源 |
| DRAW-TURNTABLEACT | — | 已实现 |
| DRAW-FLOPCARDACT | 109101–109103 | 牌型判定（`CardHandRank`）与连抽次数规则未反解 |
| DRAW-HUNDREDDRAWACT | — | 既已由 `hundred-draw-service` 交付 |

## 下一步建议

1. 先补 ETF 请求形态：对 107901/102301/88965 做一次真实 TCP 与抓包比对，确认参数键名后再推广到同族命令。
2. 反解每族回包的 `.db.proto` 数据消息（`pb_capsule_toy_all`、`pb_chess` 等），这是多数族卡在“业务已算、回包不会填”的主因。
3. 抽取缺失奖池表（`PuzzleVersion.draw_lib=5510`、`HeroBlazonDraw.draw_lib=3201`、`Lottery.Item.draw_lib=3901`），它们与 `DrawTable` 同族，可复用本次抽取器。

