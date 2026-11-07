# PAY-GROUPBUYACT 实施记录：团购全服统计与团购奖

日期：2026-11-07
分支：`task/PAY-GROUPBUYACT-20261107`（worktree `.worktree/gameplay-20261106/pay-groupbuyact`）
任务卡：`docs/plans/remaining-gameplay-20261106/09-commerce-benefits.md` 的 PAY-GROUPBUYACT 小节

## 范围与结论

本轮把团购全服数据的固定空回包和未路由的团购奖改成真实业务，付款链路只补一条客户端需要的同步回执：

| type | 命令 | 本轮行为 |
| ---: | --- | --- |
| 100601 | `req_group_buy_act_server_data` | 返回当前团购活动 `pb_group_buy_act_server`，`record_list` 的 `buy_cnt` 由同一 SQLite 的 `recharge_orders` 聚合得出 |
| 100602 | `req_group_buy_act_group_award` | 校验活动/版本、玩家自购、真实人数 + 配置补偿人数与领取位后发 `GroupAward.item_tid/item_num`，置位并回 `pb_res_to_client` |
| 16005 | 团购礼包购买 | 购买结果追加 `RechargeTable.Handle.tid=93` 的 `pb_recharge_limit_info`，让团购界面即时刷新购买记录 |

状态分级：**服务端完成**；组件测试、真实临时 TCP（数字 type + 真实 ETF/PB）、真实钱包购买、SQLite 重开与异常回滚均通过。**本轮不做 APK/UI 视觉验收**（任务边界不启停实时服务、不操作模拟器），也没有读写运行库。

## 配置与协议依据

协议（`personal-server/assets/protobuf/`，均已在 codec 中注册）：

- `group_buy_act.net.proto.bin`：`pb_group_buy_act_group_award_req{act_id, award_tid}`，注释即“拼团购活动拼团奖励表 tid”。
- `group_buy_act.db.proto.bin`：`pb_group_buy_act_role{act_id, record:pb_recharge_limit_info, award_record:repeated pb_group_buy_role_gift_award{recharge_tid, award_state:bytes}}`；`pb_group_buy_act_server{act_id, record_list:repeated pb_group_buy_act_server_gift_record{gift_tid, buy_cnt, last_refresh_sec}}`。
- `recharge_limit.db.proto.bin`：`pb_recharge_limit_info{refresh_time, buy_num_list[{recharge_id, buy_num, refresh_time, used_extra_times}]}`。
- 100601 请求是 ETF 空参（`GroupBuyActCmd` 用 `EncodeErl`），响应 `pb_group_buy_act_server`；100602 请求是裸 protobuf（`EncodePB`），响应 `pb_res_to_client`。

活动表（`ActivityTable`，不是 `ActFrameTable`）：

| 事实 | 证据 |
| --- | --- |
| 团购活动为 `func=135`，共 14 期（135001–135014，version 1–14） | `ActivityTable` 行过滤 `func==135`；`ActFrameAct` 中 type 135 行数为 0 |
| 只有 version 1–9 带团购奖，version 10–14 是“只开皮肤”版本 | `GroupBuyActTable.Gift.is_group_gift`：26 个 group gift 分布在 v1–v9，v10–v14 为 0 |
| 每期含 2–5 个团购礼包，礼包 tid 按版本分段（v1 1070001… / v9 1070802…1070806） | `Gift.version` 与 `Gift.tid` |

团购表（`GroupBuyActTable`，本轮新增资产）：

| 子表 | 行数 | 关键字段与用途 |
| --- | ---: | --- |
| `Gift` | 218 | `tid`（= `RechargeTable.Recharge.tid`）、`version`、`is_group_gift`、`skin` |
| `GroupAward` | 104 | `tid`、`gift`、`head_cnt`(5/10/15/20)、`item_tid=401500`、`item_num=600` |
| `Version` | 14 | 版本开关与红点配置；本期只做存在性校验 |
| `HeadCompensate` | 364 | `gift`、`compensate_time`（相对活动开始的秒数）、`compensate_cnt`；每个团购礼包 14 行、合计 15 人 |

商品与付款链路：

- `RechargeTable` 中 `type=107` 共 218 行，`pay_type=1`、`cost_item=401500`（龙晶）、`price=6000`、`can_buy_times=1`、`buy_cycle_limit=5`、`sync_handle=0`；26 个团购礼包全部为龙晶购买，现金皮肤礼包不是团购礼包。
- `RechargeHandle` 中 `tid=93 → recharge_type=107`，与 `RechargeTable.TID_GROUP_BUY_ACT_RECHARGE = 93` 一致，故购买回执用 `flag=93`。
- 奖励 `401500` 在 `ItemTable.type=12 → Type.res_type=1500/ItemBase`，`rewardHandlerFor` 解析为 `currency`（模块 5），可直接发放。

## 客户端证据（LuaJIT prototype dump）

证据产物（本地，不提交）：`analysis/scratchpad/pay-groupbuyact/extracted/`，来源 bundle `analysis/experiments/recharge-fix-20261107/bundle/64_lua_project.bundle`。

- `GroupBuyActMgr` `EnterState`：`state_id == ActivityTable.TID_ACT_STATE_RUNNING` 时对 `module_login_data` 执行 `Codec.DecodePB('pb_group_buy_act_role', …)` 再 `_AddActData`；因此本服务把单期 `pb_group_buy_act_role` 放进 module 92 的 `module_login_data`（与 `acc-recharge-service` 相同，ETF 包裹）。
- `GroupBuyActCmd`：`req_group_buy_act_server_data()` 无参数（ETF）；`req_group_buy_act_group_award(act_id, award_tid)` 用 `pb_group_buy_act_group_award_req`（PB）。
- `GroupBuyActData.StaticGetGroupAwardIdx(award) = award.tid % 100`，领奖位是 `Core.BitBlock`（MSB-first），与 `game/bit-block.mjs` 一致。
- `GroupBuyActData.IsMatchAwardGetCondition(award)` = `GetCompensateGiftBuyCnt(award.gift) >= award.head_cnt` **且** `GroupBuyActGiftMgr.IsHasBuy(gift)`（来自 `pb_recharge_limit_info.buy_num_list`）。
- `GroupBuyActData.GetCompensateGiftBuyCnt(gift)` = 服务端 `record.buy_cnt` + 满足 `actStart + compensate_time <= now` 的 `HeadCompensate.compensate_cnt` 之和；`actStart` 取 `ActivityTimeUtil.GetActStateTime` 的运行态开始时间。
- `GroupBuyActGiftMgr` 的充值事件处理：`extra_ret_list` 中 `RechargeTable.TID_GROUP_BUY_ACT_RECHARGE` 对应的 `pb_recharge_limit_info` 会 `RefreshBuyLimit` + `AddBuyRecord`，因此购买回执必须带 `flag=93`。

## 权威状态与数据来源

- **购买进度**：`recharge_orders`（同一 SQLite）。`buy_cnt` 按 `gift_tid` 统计持有已支付订单的账号数（`local_wallets` 中一个账号对应一个角色），`pb_recharge_limit_info.buy_num_list` 统计本角色对本期礼包的购买数量。没有内存计数、没有固定满员、没有手写常量。
- **领取位**：复用既有 `activity_claims(role_id, act_id, task_id, period)`，`task_id=award_tid`，`period='v<version>'`。`award_state` 严格由领取行投影生成（`setBit(award_tid % 100)`），因此重开库、重复请求和回滚都不会出现位与领取行不一致。
- 未新增表、未改 `game-store` 迁移，运行库 schema 不变。

## 实现说明

新增：

- `personal-server/assets/tables/GroupBuyActTable.data.lua.json.gz`：由客户端 bundle 提取的四个子表（Gift 218 / GroupAward 104 / Version 14 / HeadCompensate 364 行）。
- `tools/extract-group-buy-table.mjs`：复用 `tools/extract-peak-tower-table.mjs` 的 LuaJIT 直译解释器，按 builder prototype 2/6/10/13 提取 HeadCompensate/GroupAward/Version/Gift，可直接复现资产。
- `personal-server/config/group-buy-act-tables.mjs`：读资产并校验四个子表行数，建立 `giftsByVersion`、`awardsByGift`、`compensationByGift` 索引。
- `personal-server/game/group-buy-act-service.mjs`：活动选择、登录同步、100601、100602、16005 回执、待发奖励释放。

修改（最小 diff）：`personal-server/game/gateway.mjs`

- 构造 `groupBuyAct`（传入 game tables、团购表、calendar、clock）。
- `loginPayload()` 在 `accRecharge.synchronizeLogin` 之后调用 `groupBuyAct.synchronizeLogin(activity, loginSeconds)`，并把 `actId/giftIds` 写入既有的 `activity_login_calendar_applied` 日志。
- 在 `accRecharge` 分支后新增 `groupBuyAct.supports(type)` 派发（100601/100602），错误码沿用 `GameError`。
- `welfare.supports(type)` 的 16005 结果过一层 `augmentPurchaseResponse`，只在购买的是本期团购礼包时追加 `flag=93`。

活动选择规则（本地运行时为 `all-open`）：在带团购奖的版本中，选择“配置窗口已开始的最新一期”（本部署为 135007 / version 7）；`schedule` 模式下改为按 `calendar.isActivityRunning` 选择运行中的最新一期，无运行活动则 100601/100602 返回 309。已存在的其它活动登录条目保持不动（包括 seed 里 skin-only 的 135014），只替换本期自身的条目。

领奖顺序（同一 `store.transaction`）：校验活动/版本 → 领取位去重 → 玩家自购校验（311）→ 人数校验（311）→ `partitionGrantableResources` + `grantResources` → 写 `pending_rewards`（仅无 handler 的资源） → 写 `activity_claims` → 刷新 module 92 登录块。任一异常整笔回滚；重复请求返回空 `changes` 的成功包（与 `acc-recharge-service` 一致，客户端据此清掉可点击行）。

复现资产（工作目录为仓库根目录）：

```
node tools/extract-group-buy-table.mjs analysis/scratchpad/pay-groupbuyact/extracted/GroupBuyActTable.data.lua.bin personal-server/assets/tables/GroupBuyActTable.data.lua.json.gz
```

## 验证

命令与日志（工作目录 `personal-server/`）：

| 分项 | 命令 | 结果 | 日志 |
| --- | --- | --- | --- |
| 专项 | `node --test test/group-buy-act-service.test.mjs` | 7 tests / 7 pass / 0 fail | `analysis/test-runs/gameplay-20261107/pay-groupbuyact-special.log` |
| 回归 | `node --test test/wallet-service.test.mjs test/welfare-service.test.mjs test/purchase-flow-regression.test.mjs test/activity-calendar.test.mjs test/gameplay-gateway.test.mjs test/acc-recharge-service.test.mjs test/pet-activity.test.mjs test/line-first-recharge-gateway.test.mjs` | 71 tests / 71 pass / 0 fail | `analysis/test-runs/gameplay-20261107/pay-groupbuyact-regressions.log` |

专项覆盖：

1. 100601 初始 `buy_cnt=0`；真实 `wallet.purchaseGift` 后变 1，且只有该礼包变化。
2. 登录块写入 `state_data.cur_state_id=50`、`enter_time=窗口开始`、ETF 包裹的 `pb_group_buy_act_role`，其 `record.buy_num_list` 与订单一致。
3. 领奖发放 `401500 × 600`；第二次请求空 changes；`activity_claims` 仅 1 行；重开 SQLite 后领取位仍为 1、资源不重复发放。
4. 未购买（只有他人订单）→ 311，且不写领取行。
5. 时间为活动开始后 10 分钟时补偿尚未到期 → 311；到 2026-11-07 时 1 名真实买家 + 15 配置补偿可领 15 人头档，20 人头档仍 311；补 4 个真实买家订单后 20 人头档才解锁（`buy_cnt=5`）。
6. 跨版本 award（v1 的 `10101` 打 135007）→ 1；非当前活动 → 309；schedule 模式无运行活动 → 309。
7. 配置成不可发放的资源 id → 5，`activity_claims`/`pending_rewards` 均 0、龙晶不变、订单仍在（整笔回滚）。
8. 真实临时 TCP：909103 登录 → 100601 → 16005 买 1070601（龙晶 6000）→ 回执含 `flag=93` 且 `pb_recharge_limit_info` 为 1 件 → 100601 `buy_cnt=1` → 100602 发 `401500×600` 并落 `activity_claims`。

## 剩余缺口与未取得证据

1. **APK 未验收**：本任务边界不操作模拟器/APK，团购界面显示、红点、购买后即时刷新、奖励弹窗都只有静态证据与协议测试，不能记为可玩验收。
2. **活动选择的本地约定**：本部署 `all-open` 下选“窗口已开始的最新团购期”（135007）。客户端 `ActivityTimeUtil.GetActStateTime` 对表配置活动的窗口计算没有实测；若 APK 中把 135007 判为已结束，需要考虑运营 `act_custom_list` 或调整配置，这属于客户端验收待补。
3. **`last_refresh_sec` 语义**：客户端把“补偿触发时间 > `last_refresh_sec`”的补偿计入显示人数。本服务固定回活动窗口开始时间，等价于“活动内全部补偿 + 全部真实订单”；原服是否会周期性滚动刷新该字段、刷新后 `buy_cnt` 是否已含补偿，未取得协议样本。
4. **全服人数口径**：本地库一个角色一个钱包账号，`buy_cnt` 按“持有已支付订单的账号数”统计，等价于人数；原服是否按购买次数（同一玩家可多次）累计，没有抓到 `pb_group_buy_act_server` 的真实回包对照。
5. **100601 无活动参数**：客户端请求是空 ETF，服务端只能按自己选定的当前期回答；若客户端为另一期（例如 seed 中的 135014）发起刷新，回包 `act_id` 与请求期不一致，客户端是否按 `act_id` 丢弃未验证。
6. **20 人头档在本配置不可达**：`HeadCompensate` 每个礼包合计 15 人，单角色库最多再贡献 1 个真实买家，因此 20 人头档在本部署默认不可领取；这是配置事实，不是服务端固定。真实多角色/跨服聚合未实现。
7. **活动结束与退款**：没有到期结算、停服补算、订单退款撤销等分支；本轮只做了运行中窗口的统计与领取。
8. **现金购买路径**：26 个团购礼包全部 `pay_type=1`（龙晶），`pay_type=0` 的现金礼包不属于团购；若将来出现现金团购礼包，需要补 SDK/16004 路径的 `flag=93` 同步。
