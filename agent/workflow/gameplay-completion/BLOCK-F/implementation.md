# F 块（#120–#150 招募、抽取、翻牌与转盘活动）实施记录

2026-11-08。续做分支 `task/BLOCK-F2-20261108`，worktree `.worktree/gameplay-20261108/block-f2`，起点 main `1616438`，交付提交 `aa3f35b`，以 `--no-ff` 合入 main `0cefbbd`。本记录接续首批 107901、102301、88965 和既有百抽/奖励抽取/许愿树实现，记录 F 块 31 张任务卡、74 条原缺失命令的最终覆盖状态。

## 状态口径

“覆盖”只表示命令已有明确服务端路径，不表示整卡玩法或 APK 已验收。状态分三类：

- **真实处理**：从已落地的配置表读取价格、奖池、序号、上下限或进度阈值，并在同一 SQLite 事务内完成资源与状态变更。
- **有限路径**：命令有表驱动状态转移，但活动周期、全服聚合、登录同步或回包中的部分字段仍缺证据。
- **明确拒绝**：缺奖池、生产进度、权威全服状态或回包语义，返回 `err 5` 或对应业务错误；不以空包、固定奖励或客户端自报结果销项。

新增 `draw-activity-service` 覆盖 65 条命令：44 条具备表驱动成功路径，21 条为无条件明确拒绝。其余 9 条继续由既有服务承担：`hundred-draw-service` 5 条（117001–117005）、`bonus-draw-service` 3 条（101901/101902/101904）、`wish-tree-service` 1 条（91703，仍明确拒绝缺奖池/结算证据）。合计覆盖 F 块原缺失集合 74 条，其中“有路径”不等于“全部玩法完成”。

## 实现结构

| 文件 | 作用 |
| --- | --- |
| `personal-server/game/draw-activity-service.mjs` | 统一注册 65 条命令，提供 `draw_activity_state` / `draw_activity_logs`、事务、状态读取、通用 `DrawTable` 抽取、ETF/PB 解码和错误边界 |
| `personal-server/game/draw-activity-families.mjs` | 各族表规则、扣费/发奖、领取位、进度和明确拒绝 |
| `personal-server/game/gateway.mjs` | 只在命令声明为 ETF 时调用 ETF 解码；PB 命令直接传原始 bytes，避免把 protobuf 误送 ETF 解码器 |
| `personal-server/test/draw-activity-service.test.mjs` | 17 项服务测试，含重开、非法复用、祈福实例 ID/五奖池/登录恢复、编码失败和 SQLite ABORT 回滚 |
| `personal-server/test/draw-activity-gateway.test.mjs` | 临时端口真实握手/TCP，覆盖 104501→104502、109101→109102 现金链路和 105502 fail closed |

状态按 `(role_id, module, version)` 保存计数器、领取位和选择项；日志按模块/版本写入 SQLite。成功命令在 `store.transaction` 内完成扣费、发奖、计数、领取位、日志和 PB 编码；任一写入或编码异常都会回滚资源及活动状态。

## 逐族实现与证据边界

| 任务卡 | 命令 | 状态 | 当前规则与证据边界 |
| --- | --- | --- | --- |
| DRAW-MAGICDRAW | 60002–60004 | 有限路径 | 60002 保存已配置英雄，60003 按 `need_count` 和 `Award` 领奖；抽数生产源未接入，因此未达门槛返回 311。60004 因 `StarRes` 0 行明确拒绝 |
| DRAW-PINBALL | 88921 | 明确拒绝 | 缺弹珠权威局状态与任务/成就进度，不能只凭领奖请求发奖 |
| DRAW-FANTASYEQUIPACT | 88925–88926 | 明确拒绝 | 缺管道棋盘生成、连接结果和重置结算；不伪造 `pb_pipe_connect_game` 状态 |
| DRAW-PYRAMID | 88941–88942 | 有限路径 | 88941 按 `Version.sub_item`、当前 `Ceil.sub_num` 扣费，逐层无放回开启 `Award` 并推进层/轮；88942 的任务进度没有权威事件源，明确拒绝 |
| DRAW-THREEADMONITION | 88961, 88962, 88965, 88966 | 服务端链已覆盖 | 88965 购买抽取次数；88961 消耗次数和活动门票后从 `DrawAward` 抽奖；88962 校验 `finish_index_list` 后领取箱子；88966 建立入场态。部分回包二进制状态仍留空，需 APK 对照 |
| DRAW-HUNDREDBONUS | 89401–89403 | 有限路径 | 89401 保存随机三位数，89402 按 `HundredBonus.base_value/bonus` 发奖且按表去重，89403 读取真实角色日志。付费额度、日重置与 `Robot.money` 的完整选择规则未闭合 |
| DRAW-WISHTREE | 91703 | 既有明确拒绝 | 既有 `wish-tree-service` 已承接；宝藏池/结算证据仍不足，未以空奖覆盖 |
| DRAW-CHESS | 91901–91906 | 有限路径 | 91901 按 `Param.normal_cost_item` 扣费并顺序领取 `FixedAward`；`is_special` 仅决定展示，达到 `max_turn` 才结束；91904 开下一轮，91906 按已到轮次领取轮奖。91902/91903/91905 对应表全为 0 行，明确拒绝 |
| DRAW-RAFFLETICKET | 92101 | 有限路径 | 按 `Achievement.condition` 校验共享抽数并领取配置奖励；抽数生产源不在本块，状态缺失时拒绝 |
| DRAW-HEROBLAZONDRAW | 92201 | 明确拒绝 | `HeroBlazonDraw.lib` 指向 3201–3204，但对应 `DrawTable` 组为空 |
| DRAW-LOTTERYACT | 92301–92302 | 有限路径 | 92301 按 `free_num` 或 `draw_item` 扣费并从 `Lib` 加权抽奖，写资源与角色日志；92302 返回该角色持久化日志。BigLib、幸运值和跨角色展示仍未反解 |
| DRAW-MYSTERYWISH | 93001 | 有限路径 | 按 `Const.cost_item/cost_count` 扣除并由 `Item.item/count` 发放，领取位持久化；`Item.type` 的完整筛选/交换语义待证 |
| DRAW-LOTTERY | 93101–93102 | 明确拒绝 | `Lottery.Item.draw_lib=3901` 奖池为空；过期处理缺权威期次结算状态 |
| DRAW-FLIPCARD | 97201–97301 | 有限路径 | 97201 保存轮次；97301 因 Board/Award 行缺失明确拒绝 |
| DRAW-TICKETDRAW | 97501–97502 | 明确拒绝 | 排名结算与历史依赖尚未实现的跨角色票券结果，不能由请求自报名次 |
| DRAW-FRUITDRAWACT | 97901–97902 | 有限路径 | 97901 只接受配置内的 `BigCell` 选择；97902 所需概率 11409 不在 `DrawTable.LibWeight`，明确拒绝 |
| DRAW-DRAW | 98101 | 有限路径 | 持久化心愿 tid 与 draw lib；尚未接入 `recruit-service` 的通用心愿校验和重置规则 |
| DRAW-DEMIGODACT | 本卡 0 条缺失命令 | 不在本 diff 新增 | 该卡没有 F 缺失命令差量，不能借 F 路由改动宣称玩法完成 |
| DRAW-ELVESACT | 100901–100903 | 有限路径 | 主精灵和果实活动选择按 `ElvesAct` 配置保存；奖励受 `DrawAward.draw_num` 门槛控制。抽数源与 `DrawAwardShow` 回包仍缺证据 |
| DRAW-ARTIFACTDRAWACT | 本卡 0 条缺失命令 | 不在本 diff 新增 | 该卡没有 F 缺失命令差量；既有圣器生产路径不由本记录宣告整卡完成 |
| DRAW-BONUSDRAW | 101901/101902/101904 | 既有服务端完成，证据待补 | 既有真实池、扣费和 SQLite 链路保留；单奖权重、折算、ETF 键和登录槽仍见主执行状态 |
| DRAW-CAPSULETOY | 102301–102304 | 服务端链已覆盖 | 抽奖按 `PoolOutput` 权重、价格和上限；交换校验 group/num/limit；收集消耗与回收资源；进度按累计玩具数领取 `Collect`。部分集合位与回包字段仍需客户端对照 |
| DRAW-CHESSREVERT | 102401–102403 | 有限路径 | 102402 保存自选礼物，102403 可推进轮次；102401 因缺 `ActActive → ActTurn` 的权威进度映射改为明确拒绝，不能按请求 id 直接发奖 |
| DRAW-CHILDPUZZLEACT | 103301–103305 | 有限路径 | 103301 按 `draw_lib`/消耗抽取，103303 换轮，103304 按任务进度领奖，103305 保存选择；103302 的连线/列完成规则未能仅由表 dump 推出，明确拒绝。任务进度生产源仍缺 |
| DRAW-HOARDWHEELACT | 103501–103503 | 有限路径 | 103501 校验池和自选奖；103502/103503 已按任务/累计抽数状态校验并持久化，但当前没有生产调用方写入这些进度，故新号会明确返回未达门槛 |
| DRAW-THOUSANDDRAW | 104501–104502 | 服务端链已覆盖 | 按 type 选择 `one/two/three_draw_lib` 和当前塔层 `tower_layer`，在 `Group.lib_range` 加权抽奖；奖励先挂 pending，104502 同事务发放并清空。`max_round=25` 与随机次数字段的完整层控制待 APK 对照 |
| DRAW-PRAYACT | 104901–104902 | 有限路径 | 104901 要求 `AwardIndex` 的五个奖池全部自选并拒绝缺项/重复；104902 接受 ActFrame 实例 ID，状态按配置版本持久化，每次抽同时推进五个索引并按 `normal_val`、`critical_ration`、`critical_val`、`progress_val` 发奖。登录从 SQLite 重建模块 183 的选择、次数、进度和历史；`AwardRation.direct_group/target_cnt/direct_ration` 与 `is_direct` 仍待证据。详见 `DRAW-PRAYACT/implementation.md` |
| DRAW-CASHBACKDRAW | 105501–105504 | 明确拒绝 | 缺权威充值币种、全服充值和全服进度；四条命令均拒绝，不按客户端数字发奖 |
| DRAW-TURNTABLEACT | 107901 | 服务端链已覆盖 | 按 `Ver.use_item` 扣费，`Award.min_num` 解锁档位，`Award.weight` 加权发奖；轮数和未中大奖数持久化。回包部分活动字段留空，未做 APK 验收 |
| DRAW-FLOPCARDACT | 109101–109103 | 服务端链已覆盖 | 109101 按 `Ver.use_item` 扣费、`CardHandRank` 与 `AwardGroup` 选奖并暂存；109102 原子领取；109103 按 `AccAward.cond_val` 领取累计档。牌型展示与 jackpot 后的客户端轮次观感待对照 |
| DRAW-HUNDREDDRAWACT | 117001–117005 | 既有服务端完成，证据待补 | 五条命令继续由 `hundred-draw-service` 处理；保底权重、非英雄星级条件和 target-chip 等既有证据缺口不由本批掩盖 |

## 无条件明确拒绝的命令

以下 21 条由统一服务注册，但调用即返回明确错误，目的只是避免退回含混的 `LOCAL_NOT_IMPLEMENTED`，不等于完成：

`60004`, `88921`, `88925`, `88926`, `88942`, `91902`, `91903`, `91905`, `92201`, `93101`, `93102`, `97301`, `97501`, `97502`, `97902`, `102401`, `103302`, `105501`, `105502`, `105503`, `105504`。

另有有限路径因缺少生产来源而在运行时拒绝，例如 60003、92101、100903、103304、103502、103503。它们不得在后续统计中写成可独立游玩完成。

## 验证证据

```powershell
cd personal-server
node --check game/draw-activity-service.mjs
node --check game/draw-activity-families.mjs
node --test test/draw-activity-service.test.mjs
node --test test/draw-activity-gateway.test.mjs
npm test
```

- 服务专项 `17/17`：轮盘、扭蛋、三诫、胶囊兑换/收集、棋盘 15 格结束与新轮、抽奖活动日志、拼图抽取、千抽 pending/领取、祈福五奖池/实例 ID/登录恢复、翻牌 pending/领取、PB 编码失败回滚、SQLite ABORT 回滚。
- 临时端口真实握手/TCP：104501→104502、109101→109102、183013 的 104901→104902 成功，105502 以 `err 5` 拒绝；SQLite 中对应状态和重登模块 183 可读取。
- 分支全量：`npm test` 结果见下方与总执行状态；未使用实时服务、设备、ADB 或运行数据库。
- 合并后在 main 重跑 draw-activity、draw-activity-gateway、gameplay-gateway、m5-command-matrix 及既有百抽/奖励抽取/许愿树回归：`59/59`。含后续 A2/E2 合并的收尾前 main `d99dae4` 全量为 `2706` 项、pass `2704`、fail `0`、skip `2`，日志为 `analysis/test-runs/gameplay-20261106/block-f-final-full-r2.log`。

## 未做与后续证据

- 未做 APK 客户端验收，未启停实时服务，未操作模拟器/ADB，未读写 `runtime.local-only.data` 运行数据库。
- F 路由只解决了“有明确服务端路径”的问题。活动周期、登录数字槽、全服排名/充值和多数回包中的二进制/嵌套字段仍未反解。
- 后续优先补：Play/Charge 的生产事件、`ActActive` 与 `ActTurn` 映射、`AwardRation.direct_group/target_cnt/direct_ration` 与 `is_direct`、FlipCard 棋盘表、Lottery 3901、HeroBlazon 3201–3204、TicketDraw 全服结算和 Cashback 权威充值账本。
