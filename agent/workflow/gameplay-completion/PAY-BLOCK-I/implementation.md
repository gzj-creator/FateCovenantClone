# 块 I：礼包、通行证、基金、返利与拍卖（#212–#264）

2026-11-08 实施。分支 `task/PAY-BLOCK-I-20261108`，worktree `.worktree/gameplay-20261106/pay-block-i`，起点 main `8ebd5a1`。

## 起点核对

派发文档记录本块 53 张卡、106 条缺失命令。实施前用真实网关（握手 909103 → 登录 → `pb_c2s`）逐条探测 114 条命令，结果是 **25 条已路由、89 条仍返回 `LOCAL_NOT_IMPLEMENTED`**：

- 已路由并保留（既有实现，本块不改）：16001/16003/16004/16005、35001/35002/35005、37010、88201–88204、100601/100602、107701–107703、110201–110203、110601/110602、110801/110802、84601。
- 89 条未路由命令的请求编码：ETF 请求占多数且多数没有 schema；protobuf 请求的 schema 与 `*_back` 回包结构都已从 `assets/protobuf/*.proto.bin` 反解。

## 交付分层

`personal-server/game/benefit-commerce-service.mjs` 现在接管全部 89 条命令的网关入口：

1. **真实结算（3 条）**
   - 16006 `req_loong_recharge`：请求/回包 schema 与 16005 完全相同（`pb_recharge_buy_or_rev_req` → `res_buy_or_Rev_gift`），因此并入 `welfare-service` 的 `purchaseGift`，走既有 wallet 下单、余额、订单与 1900/16003 链路，不另写第二套充值实现。
   - 87301 `req_permanent_card_award`：读登录模块 62 `pb_permanent_card.element_list`，按 `PermanentCardTable.PermanentCard.reward` 发每日奖励，写 `last_reward_day`（04:00 UTC+8 日索引）与 `data_version`，同日重复领取返回 310；回包 `pb_permanent_card_back`。
   - 84602 `req_princess_award_supplement`：按 `EnergyAward` 的午间/夜间两档补领未领取的公主每日体力，同时把模块 126 的 `energy.last_noon_day/last_night_day` 前移，使 84601 当天再领返回 310；补领记录写 `pb_princess.supplement`，回包 `pb_princess_supplement_back`。
2. **显式 fail closed（86 条）**：按任务卡分组返回 `err 5` 并附具体原因，例如 `PAY-VIP: VipTable 未导出：VIP 等级、礼包与经验兑换配置无证据`，同时写 `benefit_command_refused` 审计日志（含 type 与卡号）。这样客户端收到的是明确的“本服不提供该玩法”，而不是 `LOCAL_NOT_IMPLEMENTED` 的空包，也不会用固定奖励冒充实现。

拒绝清单是服务里的一张声明表（`REFUSAL_FAMILIES`），每张卡一行，便于后续补表后逐卡替换成真实实现。

## 未实现的根因

客户端包里只有协议定义，没有这些玩法的**配置表**：TriggerGift、UpStarGift、Vip、VipGift、Fashion、VipCity、FundAct、Recovery、WeekendBonus、LevelSprint、HeatGift、FlashSale、Assistant、Prebook、RoleShare、Cross、RedRain、WeekHunt（只有字节码）、LinkGift、VipLink、GemRebateAct、AppearanceReleaseAct、CakeActivity、QuadrupleCross、FinanceManageAct、SkinCrystal、RebateShopAct、DivineRealmAct、BonusShop、Auction、SkinRecharge、BuySkinAct、ActShop、PremiumAct、RecycleAct、VickreyAuctionAct、GiftBoxAct、SubscriptionAct、NewPermitAct 都没有对应 `.data.json/.data.lua` 资产导出到 `personal-server/assets/tables`。

在这些表缺失的情况下，“领奖”命令的奖励内容、档位、限购与概率全部无从取得，按块 I 的交付标准必须 fail closed，而不是返回空 changes。

另外三处是**契约本身缺失**，不是缺表：

- PAY-PERMIT 35003–35011 的请求全部是 ETF，且没有参数 schema；买级消耗、福利档、自选奖池、期数结算语义都没有证据。35001/35002/35005 继续可用。
- PAY-REDENVELOPE 77002 的回包 `pb_client_red_envelope` 在 `.proto` 里没有定义。
- PAY-PRINCESS 84603（跨期刷新补领）的能量来源与刷新周期未取证，84601/84602 已真实结算。

## 验证

- 专项 `personal-server/test/benefit-commerce-gateway.test.mjs`（4 项，真实握手 909103、真实 `pb_c2s` 往返）：
  1. 块 I 的 112 条命令逐条发送（16001/16003/16004 对空 ETF 本就返回 -1，属实施前既有行为，不在断言内），断言**没有一条**再返回 `err -1 / LOCAL_NOT_IMPLEMENTED`；
  2. 87301：首领先得到 `101500×200`、`last_reward_day` 写入、重复领取 310、带参请求 1、关闭并重开 SQLite 后 `last_reward_day` 仍在；
  3. 84602：午间/夜间两档同时补领、`supplement.princess_energy` 落一条、当日重复 310；
  4. 33001/102701/107301 抽样确认 fail closed 返回 5。
- 全量 `npm test`：2548 项，pass 2546、fail 0、skipped 2。

## 仍未闭合

- 86 条拒绝命令需要先补齐对应配置表（从客户端 LuaJIT 资产抽取，参考 `tools/extract-*.mjs`）才能开始实现；抽取后按 `REFUSAL_FAMILIES` 逐卡替换。
- 16006 只验证了路由与 schema 一致，尚未在真实客户端点一次龙晶充值（需要对应商品可售）。
- 87301 的 `day_limit`（15/30 天）没有生效时间起点，当前只做每日一次；永久卡购买时间未落在模块 62 的字段里，需要额外核对激活起点。
- 84602 的补领只覆盖当日，历史漏领天数是否允许补回没有证据。
- 全部命令未做 APK 验收；本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB。

