# 月度战令超值/尊享限购礼包修复记录

## 范围

- 日期：2026-11-09
- 分支：`main`
- 活动：`1007101`（`限时礼包_超凡源点`，`ActFrame.type=184`，礼包版本 `204`）
- 商品：`1270301`（超值限购礼包）、`1270302`（尊享限购礼包）
- 本轮只修改个人服务器代码和测试；未操作模拟器、ADB 或 APK，未重启实时服务。

## 根因

两个商品在 `RechargeTable` 中均为 `type=128`、`pay_type=0`、价格 `64800`、限购 `3`，分别奖励 `100334300 x1` 和 `100344300 x1`。奖励在 `SourcePointTable.SourcePoint` 中，是 `SourcePointMgr` 管理的实例仓库物品，类型为 `247`、资源类型为 `4300:SourcePoint`，不是普通背包道具。

`wallet-service` 的商品支持检查只调用普通 `rewardHandlerFor()`，因此把两个已由 `PremiumActTable` 正确配置的礼包判定为“不支持商品”。客户端发送 `16004` 后，网关在 `assertPurchaseAvailable()` 提前返回 code 5：

```text
This product needs an additional gameplay handler
```

实时证据位于 `personal-server/runtime.local-only.data/server-20261109-134548.local-only.out.log`：

- `2026-11-09T05:48:24.688Z`，seq 33，`1270301` 被拒，code 5。
- `2026-11-09T05:49:14.094Z`，seq 34，`1270302` 被拒，code 5。
- 两个请求的 ETF 均携带商品 id、上下文二进制和优惠券物品 `701500`。

## 修复

- `personal-server/game/minigame-act-service.mjs`
  - 新增 `isSourcePointReward(tid)`，以源点表作为奖励识别依据。
  - 新增 `grantSourcePointRewards()`：校验奖励、按数量递增 UID、把实例写入 `minigame_act_state` 的 `source_point:1` 状态，并返回可立即解包的 `pb_source_point` `new_bin`。
- `personal-server/game/wallet-service.mjs`
  - 商品支持检查允许普通奖励处理器或源点处理器负责奖励。
  - `16004` 的 `buy()` 和 `16005` 的 `purchaseGift()` 统一通过 `grantPurchaseRewards()` 分流普通资源和源点实例。
- `personal-server/game/gateway.mjs`
  - 在构造钱包前创建 `minigameAct`，并通过 `minigameActivity` 注入钱包，确保真实网关复用同一源点仓库服务。

## 同类问题审计与追加修复

源点礼包修复后，继续按商品奖励类型审计了全部 PremiumActTable.Config：

- 共 852 条 Config 行、558 个唯一礼包商品。
- 每个商品均有 RechargeTable 行、非空且等长的 reward_tid/reward_count，并经过数量、sync_handle、pay_type、价格和支付道具结构校验。
- 所有奖励项均能落到普通资源 handler 或 SourcePoint 专用 handler；未识别奖励为 0。
- 审计固化为 premium-act.test.mjs 的 “every PremiumAct gift has complete rewards with a concrete grant handler” 测试，并固定当前 852/558 数量。

审计同时发现并修复两个仍未覆盖的奖励族：

1. 商品 1270867 奖励 10134600，资源类型为 4600:MatchHero。普通资源 handler 缺失会触发同一类 code 5 拒绝。
   - resources.mjs 新增 MatchHero handler，资源写入 module 6 的 group 0。
   - 发放时从 trimatch_hero 读取当前星级，并通过 pb_battle_tri_match_hero_data {tid, star} 返回 new_bin，避免购买后把已有星级显示或写成 0。
   - 同一 handler 还修复了此前明确拒绝的 MatchHeroChip 合成路径。
2. 商品 1270871、1270872、1270873 奖励 1014800，资源类型为 4800:ItemBase，用于三消爬塔体力。新增普通物品 handler，写入 module 6 的 group 0；资源购买和现金购买均已覆盖。

wallet-service 和 item-box-service 现在把事务内 db 传给 grantResources()。这样 MatchHero 的星级查询、资源变更和购买记录仍处于同一 SQLite 事务中，购买及宝箱、碎片合成都返回正确客户端数据。

追加定向验证：

node --test --test-concurrency=1 test/reward-handlers.test.mjs test/item-item-service.test.mjs test/premium-act.test.mjs
结果：19/19 通过

## 回归测试

- `personal-server/test/minigame-act-service.test.mjs` 新增源点奖励测试，覆盖奖励识别、UID 分配、SQLite 持久化、重开数据库和 `pb_source_point` 客户端二进制。
- `personal-server/test/premium-act.test.mjs` 新增真实 `16004` 网关测试：
  - 商品列表同时暴露 `1270301` 和 `1270302`。
  - 两档礼包均购买成功，分别返回 `100334300 uid=1`、`100344300 uid=2`。
  - `activity_purchases` 写入活动 `1007101`，flag 114 返回两档各一次限购。
  - 测试按真实捕获形态传入优惠券物品 `701500`，并在测试夹具中预置足额优惠券。

定向验证：

```text
node --test --test-concurrency=1 test/minigame-act-service.test.mjs test/premium-act.test.mjs
结果：40/40 通过

node --test --test-concurrency=1 test/wallet-service.test.mjs test/purchase-flow-regression.test.mjs
结果：32/32 通过
```

全量验证：

```text
cd personal-server
npm test
结果：2789 项，pass 2787，fail 0，skipped 2
日志：analysis/test-runs/premium-act-similar-audit-20261109-full.log
```

两个跳过项仍由 `FC_RECHARGE_CLIENT_BUNDLE` 未设置触发，与本修复无关。

## 后续验收边界

- 实时个人服务器没有重启，因此当前运行进程仍是旧代码；部署重启后才生效。
- 尚未进行真实客户端购买和视觉验收，不能将本轮标记为 APK 或可玩验收完成。
- 购买链路依赖客户端发送的 `701500` 优惠券物品；若账号没有优惠券且请求仍指定该物品，网关会按既有规则返回 code 302。该行为是独立于本次配置错误的支付余额前置条件。
