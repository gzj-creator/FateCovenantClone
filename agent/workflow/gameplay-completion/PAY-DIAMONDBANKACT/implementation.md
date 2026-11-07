# PAY-DIAMONDBANKACT：钻石银行（每日任务、领取、开启）

分支 `task/PAY-DIAMONDBANKACT-20261108`，已 rebase 到最新 `main` @ `72c8d4d`（起始基线 `8d24290`；rebase 无冲突，只有网关 import/构造/登录/派发四处与主线增量共处）。提交：`8e48db3` 表提取与读取器、`22536ad` 服务与网关路由、`c5ebdd3` 按任务记录一次 pending、`fc9d662` 清理 `diff --check` 尾随空行。范围只包含 `DiamondBankActCmd` 的 110201、110202、110203。服务端实现、临时 TCP 与 SQLite 验证已完成；真实隔离客户端（APK）尚未验收。

## 逐 type 状态

| type | 协议 | 状态 | 实现要点 |
| ---: | --- | --- | --- |
| 110201 | PB `pb_diamond_bank_act_base_req` → `pb_diamond_bank_act_task_rsp` | 服务端完成，带证据缺口 | `act_id` + 重复 `value`（任务 tid 列表），要求已开启（`is_buy`）、逐任务按 `keep_type` 与自然日防重，进度读模块 21 统计块；资源、`task_get_json`、登录模块 92 同事务提交 |
| 110202 | ETF 单值 `act_id` → `pb_res_to_client` | 服务端完成，带证据缺口 | 要求已开启且未领取；按 `act_item` 实际持有量与 `max_limit` 上限、`rage/10000` 比例发放 `add_item`，扣除被计入的存款并置 `is_get` |
| 110203 | ETF 单值 `act_id` → `pb_res_to_client` | 服务端完成，带证据缺口 | 扣 `Ver.open_use_item`，置 `is_buy`，按 `open_add_num` 铸造 `Ver.act_item` 作为存款；重复请求回空 `changes` |

## 配置依据

配置来自客户端 LuaJIT 字节码重建的 `DiamondBankActTable`，由 `tools/extract-diamond-bank-table.mjs` 生成，读取器为 `personal-server/config/diamond-bank-act-tables.mjs`。

| 文件 | 大小 | SHA256 |
| --- | ---: | --- |
| `personal-server/assets/tables/DiamondBankActTable.data.lua.json.gz` | 725 | `826d81baace4c278c3df190caf439f07ceac3e4440aaf51f1ff01208288f2114` |
| `tools/extract-diamond-bank-table.mjs` | 8605 | `8a7673aa22b0fce497b8cae7e0a1b32a2a4f15349ebefd4488bdabe77d8c4d55` |
| `personal-server/config/diamond-bank-act-tables.mjs` | 4576 | `c462f075bae258472463f65e1f24d7153b26d0b94000f7b66b86e78f34bf7a1a` |
| 源字节码 `DiamondBankActTable.data.lua.bin` | 3723 | `BE7526749DA2AD198F5C80B094E05DEFE7B783DAB32007A9AA5F8827624770BE` |
| `personal-server/assets/protobuf/diamond_bank_act.net.proto.bin` | 638 | `88a1016625dccd2f0f5241d5d8b6ca604470d2472841d45fcd66a815c75122ed` |
| `personal-server/assets/protobuf/diamond_bank_act.db.proto.bin` | 1285 | `6150be3266b164b7104312823248aec677ae8d67e6d2e57dfdb443bd94a03f4a` |

服务与测试文件的 Git blob（LF）哈希：`personal-server/game/diamond-bank-act-service.mjs` 26610 字节 `aa10147ea87df4ecb5c953dd5778c450bb48926d14c61d5374af15aa1e571d3f`；`personal-server/test/diamond-bank-act-service.test.mjs` 15639 字节 `b3f4c5da5f3974095cf5bc07ef03fd9e5876cd82fbe5401c889bf779b8dc820b`；`personal-server/test/diamond-bank-gateway.test.mjs` 10076 字节 `83bf105c785ebb6d5ebd5aaae9bc8930994b48f2d28720d4da77497cc720d754`。

子表行数固定为 VerRecharge 5、LiveTask 14、Ver 1，行数不一致时读取器直接报错。

`VerRecharge`（version 1，`day_buy_times` 全为 1）：tid 1 → 商品 138001；tid 2 → 138002（`is_buy_additionally=true`）；tid 3 → 138003（true）；tid 4 → 138004（true）；tid 5 → 138005，且 `batch_update=[2,3,4]`，即客户端 `GetDiscountGift` 认定的折扣礼包行。`Ver.gift=1` 指回 tid 1。

`Ver` 单行：`open_use_item=[[101500,1000]]`、`open_add_num=1000`、`gift=1`、`act_item=820902`、`add_item=101500`、`rage=10000`、`max_limit=10000`、`recharge_rage=1000`、`show_duo_value=3000`，另有 `bank_kong_res`/`bank_shao_res`/`bank_duo_res`/`bank_man_res`/`bank_yilingqu_res` 五个界面图标。

`LiveTask`（全部 ver 1，award 均为 `[[820902,n]]`）：

| tid | type | keep_type | target | award | group |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 101 | 4701 | 0 | 50 | 50 | 1 |
| 102 | 4701 | 0 | 150 | 100 | 1 |
| 103 | 1 | 0 | 500 | 50 | 1 |
| 104 | 1 | 0 | 1000 | 100 | 1 |
| 105 | 2604 | 0 | 600 | 200 | 1 |
| 106 | 2604 | 0 | 3000 | 500 | 1 |
| 107 | 2603 | 1 | 1 | 1000 | 2 |
| 108 | 2603 | 1 | 3 | 1500 | 2 |
| 109 | 2603 | 1 | 5 | 2000 | 2 |
| 110 | 2603 | 1 | 7 | 3000 | 2 |
| 111 | 1802 | 1 | 1 | 100 | 2 |
| 112 | 1802 | 1 | 3 | 150 | 2 |
| 113 | 1802 | 1 | 5 | 200 | 2 |
| 114 | 1802 | 1 | 7 | 300 | 2 |

常量（`DiamondBankActTable.lua` 注册原型 KSHORT 解码）：`TASK_DAILY=0`、`TASK_PERIOD=1`、`TASK_GROUP_DAILY=1`、`TASK_GROUP_EXT=2`。

活动实例：`ActFrameType` 中 tid 1069 的 `lua_module.reference=DiamondBankActMgr`；`ActFrameAct` 1059001 为 type 1069、version 1、`duration_day` 7、`refer_day` 1、`refer_start_time` 18000（05:00）、`end_time` 18000。窗口计算沿用 `activityWindow`，与其它活动一致。

## 客户端语义证据

- `DiamondBankActMgr.GetNormalGiftList` 通过 `Ver.gift` 展开到 VerRecharge 行，礼包列表不是独立表。
- `DiamondBankActData.IsTaskTaked` 对 `keep_type=0`（每日）只看当前刷新日内的领取记录，其余 `keep_type` 整个活动期只认一次；服务端 `isTaked` 按 `dayZero` 对齐。
- `DiamondBankActUtil.ChkCanTakeTask` 用 `TaskMgr.GetCurTaskProgress` 与 `target_count` 比较；`TaskNode` 在领奖前还要求 `GetBuyStatus()`，因此 110201 先校验 `is_buy`。
- `DiamondBankActMainForm._RefreshShouyiTip` = 充值天数 × `recharge_rage/100`，纯客户端显示，不进入服务端结算。
- `rage`、`open_add_num`、`add_item` 在已提取的全部客户端 Lua 中都没有引用，属于服务端语义，是本模块最主要的证据缺口。

## 服务实现

`personal-server/game/diamond-bank-act-service.mjs`，由 `gateway.mjs` 构造并在登录阶段同步模块 92。

角色状态表 `diamond_bank_role_state(role_id, act_id, version, is_buy, is_get, task_get_json, created_at, updated_at)` 在服务内 `CREATE TABLE IF NOT EXISTS` 幂等创建，未改 `storage/game-store.mjs` 的迁移版本。`task_get_json` 保存 `[{tid, get_time}]`，与 `pb_diamond_bank_act_role_data.task_get` 一一对应。

登录同步：活动类型集合取自 `ActFrameType` 中 `lua_module=DiamondBankActMgr` 的行（当前只有 1069），实例取自 `ActFrameAct`；模块 92 条目写 `state_data{act_id, cur_state_id:50, history_time}`，`module_login_data` 为 ETF 包裹（`0x83 0x6d` + 大端 u32 长度）的 `pb_diamond_bank_act_role_data`，与 `ActivityMgr.DecodeErl` 的解包顺序一致。`daily_discount_list` 由 `recharge_orders` ⋈ `local_wallets` 按 `recharge_id` 聚合已支付次数（两表存在时才查询），`buy_times` 与礼包表单的 `can_buy_times` 判断同源。

110201：解析 `act_id` 与去重后的任务 tid 列表（重复或非正数回 1）→ 校验活动行与窗口（未知 1、停用 309）→ 校验任务属于该版本（缺配置 5）→ 事务内要求 `is_buy`（否则 311）→ 跳过已领任务，对未领任务按 `TaskTable.TaskType` 求进度：

- `progress_type=2` 且非 `custom_login` 的统计槽（任务 101/102 的 type 4701，data 29）从模块 21 统计块按 `stat_expand` 汇总，当前可正常领取。
- 任务 105/106（type 2604，`progress_fun` 464）、107–110（type 2603，463）、111–114（type 1802，13）是客户端回调型进度，服务端没有权威来源，回 5 拒绝。
- 任务 103/104（type 1，data 21）落在 `CountStatistics` 中 `custom_login=true` 的专用回包槽，无法从统计块重建，同样回 5。

可领取任务各自分区发奖，无 handler 的资源按任务 source_key 写 `pending_rewards` 一次（不是每任务合并后重复写），可发资源合并成一次 `grantResources`，随后追加领取记录、刷新模块 92 并编码回包，全部在同一事务内；编码失败整笔回滚。全部任务已领时回空 `changes` 的成功包（客户端点完即清行）。

110202：ETF 单值 `act_id`。要求 `is_buy`（311）、未 `is_get`（重复请求回空包）；存款取角色实际持有的 `act_item`，`payout = floor(min(deposit, max_limit) × rage / 10000)`，当前配置 `rage=10000` 即 1:1。扣除被计入的存款、发放 `add_item`、置 `is_get`，与登录刷新同事务。存款为 0 时回 311。

110203：ETF 单值 `act_id`。扣 `open_use_item`（`consumeResources`，reason 301），`is_buy=true`，并按 `open_add_num` 铸造 `act_item` 作为银行持有的存款；已开启的重复请求回空包。`open_add_num` 与 `add_item` 的语义未被客户端引用，属推断实现，已登记缺口。

网关改动共 4 处（`personal-server/game/gateway.mjs`，+32/−1）：dragon-land 之后的 import；`diamondBankAct` 服务构造；登录阶段 `diamondBankLogin` 同步并写入登录日志字段 `diamondBankActId`；在 `hundredAcc.supports(type)` 之前插入分发块（110201 走 PB、110202/110203 用 `singleIdArgument`，日志事件 `diamond_bank_command_committed` / `diamond_bank_rejected`，拒绝时带 `payloadHead` 截断），并把服务加进返回对象供测试直接调用。

## 复现命令

```powershell
cd personal-server
node --test --test-concurrency=1 test/diamond-bank-act-service.test.mjs
node --test --test-concurrency=1 test/diamond-bank-gateway.test.mjs
node --test --test-concurrency=1 test/diamond-bank-act-service.test.mjs test/diamond-bank-gateway.test.mjs test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs test/dragon-land-service.test.mjs test/dragon-land-gateway.test.mjs test/group-buy-act-service.test.mjs test/login-business-reads.test.mjs test/purchase-flow-regression.test.mjs
node --test --test-concurrency=1 test/*.test.mjs   # 全量
```

## 证据

- 专项服务（`test/diamond-bank-act-service.test.mjs`，14 项）：表提取行数与常量；登录同步把 `pb_diamond_bank_act_role_data` 写进模块 92；110203 按 `open_use_item` 扣费并置 `is_buy`、缺配置回 5；未开启时 110201 回 311；101 领取发放 `[[820902,50]]` 并记录领取位、重复领取为空包；未达标任务与未知任务分别 311/5；103–114 与 105/106 等无证据进度任务回 5；两个无 handler 奖励的任务只生成一条按任务区分的 pending 行并合并为一次 150 的发放；110202 按比例发放并把存款清零、重复为空包、未开启或无存款 311；PB 编码失败与 SQLite 写入失败各自整笔回滚；活动窗口外回 309。
- 临时 TCP（`test/diamond-bank-gateway.test.mjs`，2 项）：真实 `verify` 握手与 909103 登录后模块 92 出现该活动条目，110203/110201/110202 分别按 ETF 单值与 PB 请求走通，关闭并重开 SQLite 后状态保持；未配置活动 id 回 err 1。
- rebase 到 `main` @ `72c8d4d` 后的定向回归 61/61 通过（diamond-bank 服务与网关、gameplay-gateway、m5-command-matrix、dragon-land 服务与网关、group-buy、login-business-reads、purchase-flow-regression）。

- 全量（`node --test --test-concurrency=1 test/*.test.mjs`）：2494 项、pass 2490、fail 2、skipped 2，日志 `analysis/test-runs/gameplay-20261106/pay-diamondbank-full-rebased.log`。两项失败都在 `test/recommend-gift-count.test.mjs`（native 16004 批量礼包与代金券抵扣）；把 `personal-server/game/gateway.mjs` 换回 `main` @ `72c8d4d` 的原样文件后重跑该文件仍是 5 项里 2 失败，确认与本模块无关。
- 分支守卫：`main` 是分支祖先（merge-base `72c8d4d`）、`git diff --check main HEAD` 无输出、`git diff --diff-filter=D --name-only main HEAD` 为空；网关改动只 4 处，其余活动服务的构造、登录同步与派发块未被触碰。

## 未验收与缺口

- APK 未验收：未启停实时服务、未操作模拟器/ADB、未生成 APK。真实客户端打开钻石银行界面、点开启/领取、观察任务红点与存款显示仍未验证，不能据此认为可玩。
- `rage`、`open_add_num`、`add_item` 三个字段在已提取的客户端 Lua 中没有任何读取点，110202 的结算比例与 110203 的开户存款均按字段名与相邻活动口径推断；若取得原服行为证据需复核。
- 14 个任务里只有 101/102 的进度可以服务端重建，其余 12 个（103–114）因进度来源缺失一律回 5，属 fail-closed，客户端上会表现为任务不可领取。
- `daily_discount_list` 只写 `recharge_tid` 与 `buy_times`，`buy_additionally` 与 `refresh_time` 留 0：前者在本地没有“追加购买”的产生途径，后者的刷新时刻口径未取得证据。
- `max_limit` 只用作 110202 的发放上限（超出部分仍留在存款里），`show_duo_value`、`recharge_rage` 未进入服务端结算。
- 银行礼包购买（138001–138005）不在本次范围，商品是否已在商品表落地未核对；`batch_update` 折扣包只做了配置读取，没有对应的购买链路。
- 全量套件中 `test/recommend-gift-count.test.mjs` 的 2 项失败与本模块无关：换回 `main` @ `72c8d4d` 的 `gateway.mjs` 后重跑同样失败，属既有问题。
