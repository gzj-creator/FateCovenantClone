# PAY-SLOTGAMEACT：老虎机活动游玩与领取

分支 `task/PAY-SLOTGAMEACT-20261108`，起始 HEAD `af6d9e6`（未 rebase、未合并 main）。提交：`193547e` 表提取与读取器（含 `SlotGameActTable` 资产）、`608e2f8` 服务、网关登录同步与派发、专项测试。范围只有 `SlotGameActCmd` 的 110801、110802。服务端实现、临时 loopback TCP 与临时 SQLite 验证已完成；真实隔离客户端（APK）尚未验收。

## 命令与协议

| type | 协议 | 客户端编码 | 服务端状态 |
| ---: | --- | --- | --- |
| 110801 | PB `pb_slot_game_act_go_req{act_tid,item_tid}` → `pb_slot_game_act_role_data` | `SlotGameActCmd.ReqSlotGo(actId,itemTid)` 用 `EncodePB` 打包 | 服务端完成，带证据缺口 |
| 110802 | PB `pb_slot_game_act_draw_req{act_tid,challenge_multiplier}` → `pb_slot_game_act_draw_rsp{act_data,res,multiplier}` | `SlotGameActCmd.ReqSlotGet(actId,challengeMultiplier)` | 服务端完成，带证据缺口 |

`pb_slot_game_act_role_data` 为 `{act_id,draw_num,award_lib_tid}`；`SlotGameActData._ParseDataImpl` 用 `DecodePB` 解它，`GetAwardLibId()` 直接返回 `_actInfo.award_lib_tid`，`GetRedKey()` 恒为 0。客户端只在 `award_lib_tid` 为 0 时才发 110801；`draw_num` 不进客户端逻辑，因此倍率档位选择只能落在服务端。

## 配置依据

配置来自客户端 LuaJIT 字节码重建的 `SlotGameActTable`，提取器 `tools/extract-slot-game-act-table.mjs`，读取器 `personal-server/config/slot-game-act-tables.mjs`。

| 文件 | 大小（字节） | Git blob（LF） | SHA256 前 16 |
| --- | ---: | --- | --- |
| `personal-server/assets/tables/SlotGameActTable.data.lua.json.gz` | 5056 | `ba2eb1b2d7e8efc7b372ad6c606b09355ee72a87` | `4D55659CFBF1B44F` |
| `tools/extract-slot-game-act-table.mjs` | 3857 | `6254d7571b7d9edea678bfe2ccb14b66df2b14ca` | `B255B3F3B6C5DC5B` |
| `personal-server/config/slot-game-act-tables.mjs` | 5273 | `7dfa2a37947cd7ad959726d7bf3bb9c98ab5f9e6` | `7FFF3F3107113401` |
| `personal-server/game/slot-game-act-service.mjs` | 16959 | `699e3b0f8a7ffe9a527ef1b38e44ae1e375dca3f` | `555A0E71D99FCF27` |
| `personal-server/test/slot-game-act-service.test.mjs` | 13393 | `02172e840942a6828008d463326710bc5f81dde3` | `7A174C19DEC04022` |
| `personal-server/test/slot-game-gateway.test.mjs` | 8828 | `047881271a80004a2b7ca2b2637d95388873ccbe` | `DE1C6E1C7240D1CD` |
| 源字节码 `SlotGameActTable.data.lua` | 4165 | 不入库（本地解包） | `EBD5ED8E70DC4AA9` |

源文件是本机客户端解包产物（`analysis/scratchpad/pay-slotgameact-20261108/lua/SlotGameActTable.data.lua.bin`，`/analysis/` 不入库）。用同一提取器重建的结果与入库资产逐字节一致：

```powershell
node tools/extract-slot-game-act-table.mjs analysis/scratchpad/pay-slotgameact-20261108/lua/SlotGameActTable.data.lua.bin analysis/scratchpad/pay-slotgameact-20261108/rebuild-check/SlotGameActTable.data.lua.json.gz
# 输出 {"bytes":5056,"prototypes":21,"rows":{"MultiplierLibDraw":19,"MultiplierLib":3,"AwardMapLib":1,"AwardLib":3,"Version":1}}
# 重建文件 SHA256 4d55659cfbf1b44f53dec1638fa45f902c3d50e49b96482431f3fb6ab34bf10e，与入库资产相同
```

五行族行数固定（MultiplierLibDraw 19、MultiplierLib 3、AwardMapLib 1、AwardLib 3、Version 1），提取器和读取器任何一侧行数不符都直接报错，不会用缺权重的表继续开活动。

`Version` 单行：`tid=1, award_map_lib=1, multiplier_lib=1, help_id=294`。

`AwardMapLib` 单行：`tid=101, lib=1, item=6921900, award_lib=1`。6921900 是 `Item` 表里的金币图标道具（`Icon_Item_JinBi.png`），即入场券。

`AwardLib`（lib 1）：tid 101 权重 100、`award=[[101500,300]]`（300 钻石）；tid 102、103 权重均为 0，即表里登记但不可抽中。

`MultiplierLib`（lib 1）：tid 101 `num=0 draw_lib=1`、tid 102 `num=1 draw_lib=2`、tid 103 `num=30 draw_lib=3`。

`MultiplierLibDraw`（19 行，lib/权重/倍率）：

| lib | 行 |
| ---: | --- |
| 1 | 101:20/120、102:20/150、103:20/200、104:30/250、105:30/300 |
| 2 | 201:5/50、202:10/80、203:15/100、204:40/150、205:20/200、206:5/250、207:5/300 |
| 3 | 301:2/50、302:3/80、303:5/100、304:35/150、305:35/200、306:15/250、307:5/300 |

活动实例：`ActFrameType` 1095（`lua_module=SlotGameActMgr`、`lua_entity=SlotGameActData`）与 1306（战区2）都指向同一套业务；`ActFrameAct` 里是 1095001–1095004，全部 `version=1`、`duration_day=4`、`end_time=86340`，其中 1095003 为 `time_type=1`、`refer_day=1`、`refer_start_time=18000`（05:00）的新服窗口。窗口沿用 `calendar.isActivityRunning`，与其它活动一致。

## 规则与证据状态

已由客户端字节码直接确认：

- `SlotGameActUtil.GetItemTidListByVersion` 按 `Version.award_map_lib` 取 `AwardMapLibValueIndex().lib[...]`，再聚合 `AwardMapLib.item` 得到入场道具列表；`SlotGameActMgr.OpenMainForm` 用它查 `ResMgr` 持有量。券被真正扣减的权威在服务端。
- `SlotGameActMgr` 在 `GetAwardLibId(actId)` 已非 0 时直接打开老虎机界面，只有为 0 才发 110801，因此重复 110801 只应视为确认、不得二次扣券。
- `SlotGameActMgr` 交给 `SlotGameForm.StaticOpen` 的 `onClickLeftBtn` / `onClickRightBtn` 分别包 `ReqSlotGet(false)` / `ReqSlotGet(true)`，即 110802 的 `challenge_multiplier` 是布尔位。
- 110802 回包的 `multiplier` 是该次抽取的实际倍率，客户端用它显示奖励（`GetAwardLibId` 里 `AwardKit.CreateAward(AwardLib.award)` 与 `SlotGameActUtil.GetMultiplierRange` 一起构造界面，`CONST_PERCENTAGE_100` 作为初始数值）。

属于推断、已登记缺口：

- `AwardLib.award` 的基础数量按 `count × multiplier / 100` 放大，依据是 `CONST_PERCENTAGE_100` 与界面上下调节倍率；没有取得原服回包做逐笔对照。
- `MultiplierLib.num` 当作"已抽次数阈值"选档（0→lib1、1→lib2、30→lib3）。`SlotGameActUtil.GetMultiplierRange` 只是遍历全部档位求最小/最大倍率（50–300）给 UI，不含选档逻辑，所以选档口径没有客户端旁证。
- 每次 110801 扣 1 个入场券。客户端不扣费，扣除数量没有可对照的客户端代码。

## 服务实现

`personal-server/game/slot-game-act-service.mjs`，由 `gateway.mjs` 构造、登录阶段同步模块 92、在 `hundredAcc` 之前分发 110801/110802。

`store.inspect` 内幂等建两张表，不改 `storage/game-store.mjs` 迁移版本：

- `slot_game_act_role_state(role_id, act_id, draw_num, award_lib_tid, created_at, updated_at)`，主键 `(role_id, act_id)`。
- `slot_game_act_draws(role_id, act_id, draw_index, stage_tid, draw_lib, multiplier_tid, multiplier, award_lib_tid, created_at)`，主键 `(role_id, act_id, draw_index)`，逐次留痕用于审计与重开核对。

110801：校验活动 id 属于 1095/1306 且有对应 `Version`（否则 1 或 5）→ 校验窗口（309）→ 校验 `item_tid` 属于该 `Version.award_map_lib` 的 `AwardMapLib.item`（5）→ 事务内若已存在 `award_lib_tid` 则仅确认、不扣券；否则 `consumeResources([[item_tid,1]], 301)`，按 `AwardLib.weight` 用注入的 `random()` 抽一行写入 `award_lib_tid`，刷新模块 92 条目，编码回包。

110802：`challenge_multiplier=true` 直接 5（规则未取证，见缺口）→ 校验活动与窗口 → 事务内要求 `award_lib_tid` 已赋值（311）、属于本 `Version` 的发奖库（5）→ 用当前 `draw_num` 选倍率档 → 按 `MultiplierLibDraw.weight` 抽倍率 → `grantResources` 发放 `floor(count × multiplier / 100)` → 写 `slot_game_act_draws`、`draw_num+1`、清 `award_lib_tid`、刷新模块 92，同一事务编码回包。资源、领取位、流水与模块 92 任一环节失败（含 PB 编码失败、SQLite 触发器失败）整笔回滚。

登录同步：按 `ActFrameAct` 里 1095/1306 且 `Version` 已配置、窗口开启的活动，逐条把 `state_data{act_id, cur_state_id:50, history_time}` 与 ETF 包裹（`0x83 0x6d` + 大端 u32 长度）的 `pb_slot_game_act_role_data` 写进模块 92 的 `module_login_data`，与 DragonLand/DiamondBank/HundredDraw 同一口径。

错误码：1 非法命令/未知活动/非法参数；5 配置缺失或未取证规则；301 入场券不足；309 活动未开启；311 未分配发奖库就抽奖。

## 网关改动

`personal-server/game/gateway.mjs`（+29/−1，五处）：槽位 import；`createLocalGame` 内 `slotGameAct` 构造（传入 `calendar`、`now:clock`、`random`）；登录阶段在 `diamondBankLogin` 之后调用 `synchronizeLogin` 并写 `slot_game_act_login_synced` 日志；活动登录汇总日志追加 `slotGameActIds`；在 `hundredAcc.supports(type)` 之前插入分发块（110801/110802 走 PB，拒绝时回 `err` 并记 `payloadHead`），并把服务挂到返回对象供测试直接调用。

既有顺序未动：`recruit` 仍在 `heroCommandServices` 之前，`hundredDraw`/`bonusDraw` 仍在通用 `activityRead` 之前；本分支原有的登录同步（onlineGift / rankAchieve / heroExtra / firstWeekGoal / growthRoad / helpUp / groupBuy / petActivity / heroDrawActivity / rechargeRebateReset / accRecharge / dragonLand / diamondBank / hundredDraw / artifact·demigod·fantasy / houseAssistant 等）一条未删。

## 复现命令

```powershell
# 1. 重建配置表（源字节码不在库内，需本地解包产物）
node tools/extract-slot-game-act-table.mjs <SlotGameActTable.data.lua> personal-server/assets/tables/SlotGameActTable.data.lua.json.gz

# 2. 专项
cd personal-server
node --test --test-concurrency=1 test/slot-game-act-service.test.mjs test/slot-game-gateway.test.mjs

# 3. 网关回归
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs test/login-business-reads.test.mjs test/purchase-flow-regression.test.mjs

# 4. 全量
node --test --test-concurrency=1 test/*.test.mjs
```

## 测试与证据

- 专项 14 项全通过：表行数与关键取值（含权重 0 的 102/103 不可选中）、登录同步写入模块 92 与 `slot_game_act_role_state`、110801 扣 1 券并抽库、券不足 301、重复 110801 不二次扣券、110802 发放 360 钻石并清库、未发库 311、档位 101→102→103 随 `draw_num` 0/1/30 切换、`challenge_multiplier` 5 拒绝且保留已发库、PB 编码失败整笔回滚、SQLite 触发器失败整笔回滚、SQLite 重开后状态与守卫保持、窗口关闭 309 与未知活动 1。
- 临时 TCP 2 项：真实 `verify` 握手 + 909103 登录后模块 92 出现该活动条目并被 `pb_slot_game_act_role_data` 解析；110801/110802 走真实帧成功，无发库 311、challenge 5 后仍可正常抽取；关闭并重开 SQLite 再登录，`draw_num` 与 `award_lib_tid` 保持；未知活动 id 回 1。
- 网关回归 28/28、全量 2541 项 pass 2539 fail 0 skipped 2。

日志（`analysis/` 不入库）：

- `analysis/test-runs/gameplay-20261106/pay-slotgame-focused.log`（专项 14 + 回归 28 = 42/42）
- `analysis/test-runs/gameplay-20261106/pay-slotgame-regression.log`（网关回归 28/28）
- `analysis/test-runs/gameplay-20261106/pay-slotgame-full.log`（全量）

## fail closed 清单

- `challenge_multiplier=true` 一律回 5：左右按钮的倍率/消耗差异没有取得规则，不猜加价或翻倍。
- 未知活动 id、非老虎机类型、非法 `item_tid`、空发奖库/倍率库、非法 `award` 行、`Version` 缺失、`AwardLib` 不属于该 `Version`、`multiplier` 非正整数、换算后奖励 ≤0 均拒绝，不落库不改资源。
- 活动窗口关闭回 309；未先 110801 就 110802 回 311；券不足回 301。
- 权重为 0 的发奖库保持不可选中，全零权重组视为配置损坏直接拒绝，不回退到其它库。

## 缺口

- APK 未验收：本轮未启停实时服务、未操作模拟器/ADB、未生成 APK、未连原服。客户端打开老虎机界面、点开始、观看转盘与倍率展示、领取后的背包/邮件变化都没有真实客户端证据。
- 没有原服抽奖样本：`count × multiplier/100` 与倍率档位阈值都是表驱动推断，若取得原服回包需逐笔复核。
- `challenge_multiplier` 语义未知，当前客户端右键抽奖会稳定失败。
- `draw_num` 是否按自然日或活动期重置无证据；当前按活动期累加，只用于档位选择与回包展示。
- `Version.help_id=294` 是帮助面板，服务端未使用；`show_name`/`jump_func` 等界面字段同样不参与结算。
- 模块 92 条目沿用 `cur_state_id=50`（运行中）与 `history_time` 口径，没有老虎机专属状态机的额外证据。
- 奖励道具 101500（钻石）在老虎机界面的展示位、以及 6921900 券的掉落来源不在本任务范围。

