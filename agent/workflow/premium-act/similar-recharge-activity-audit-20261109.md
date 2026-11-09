# 充值活动售罄刷新同类审计

日期：2026-11-09

## 来源与合并

- 首次修复在 worktree `.worktree/matching-gift-soldout-20261109`、分支 `fix/matching-gift-soldout-20261109` 完成，提交 `b5c4174`。
- `main` 以合并提交 `0b0cc55` 合入该修复；随后主线又并行合入累计充值领取状态修复，最终审计基于最新 `main`。
- 本审计没有启动或停止实时服务，没有读写运行数据库，也没有操作模拟器、ADB 或 APK。

## 客户端证据

对 `analysis/scratchpad/time-temple-20261108/project/` 的 LuaJIT 字节码扫描得到 21 个包含 `extraParams` 的文件。`RechargeMgr` 的两个入口分别处理 `EVT_BUY_OR_REV` 和 `EVT_RECHARGE`，活动管理器从回包 `extra_params` 取数字活动 ID，再用 `extra_ret_list` 中对应 `RechargeTable.Handle.tid` 的 `pb_recharge_limit_info` 刷新限购。

已确认的客户端关联：

| 活动管理器 | 采购/回包约定 | 服务端结论 |
| --- | --- | --- |
| PremiumActMgr | type 128，flag 114 | 已实现；本轮补活动关闭过滤 |
| PetActGiftMgr | type 76，flag 65 | 已实现运行态过滤与刷新 |
| GroupBuyActGiftMgr | type 107，flag 93 | 已实现；本轮补关闭过滤与 16004 刷新 |
| HeroDraw | flag 92 protobuf | 已由专用活动服务更新，不走仅数字回传 |
| DailyDiscount / WeekHunt / WishTree | 周期三元组上下文 | 保持 `[additional, period, day]`，不改成数字 |
| RecommendGift | flag 49 protobuf | 使用自身 protobuf 更新 |
| RegularGift | flag 7 protobuf | 使用自身 protobuf 更新 |
| NotifyGift | type 36/37，group key | `extraParams` 是分组键，不能当作活动 ID |

以下客户端管理器同样读取 `extraParams`，但当前服务端没有对应的完整活动服务闭环，因此只记录证据缺口：`SummerActMgr`、`TowerActMgr`、`ArtifactDrawActMgr`、`HeroRareActMgr`、`GiftActMgr`、`HeroDownActMgr`、`AppearanceReleaseActGiftMgr`、`HoardWheelActMgr`、`TriggerGiftMgr`、`BuySkinActMgr`。`DailySelectionMgr` 只有字节串命中，语义尚未确认。不能仅凭客户端事件相近就宣称这些活动已实现。

## 本轮修复

- `PremiumActService` 新增 `isGiftRunning(productId)`。商品列表按至少一个所属活动正在开放判断；共享 SKU 的购买归属仍要求客户端提供明确活动 ID，避免跨期串账。
- `GroupBuyActService` 新增 `giftConfig`、`isGiftRunning`、`assertGiftAvailable` 和 `giftPurchaseCount`，活动关闭时不再下发或接受 type 107 礼包。
- `wallet-service.mjs` 接入当前 GroupBuy 活动。活动 ID 进入 `res_recharge_success.extra_params`，采购回执加入 flag 93，限购按同一活动版次的真实订单统计。
- `Gateway` 在钱包之前创建 GroupBuy 服务，使商品列表、16004/16005 支付、1900 推送和活动登录状态共用同一实例。
- 商品列表改为每次 `snapshot()` 按当前活动状态计算，修复钱包先于登录构造时缓存旧商品集合的问题。
- `GroupBuyActTable` 中 26 个 `is_group_gift=true` 礼包均为龙晶购买；同一 type 107 版本还包含 `pay_type=0` 的现金皮肤礼包。它们同样由 `GroupBuyActGiftMgr` 管理，因此 16004 和 1900 都必须带数字活动 ID 与 flag 93。

## 验证

- `node --test --test-concurrency=1 test/premium-act.test.mjs`：8/8。包含关闭活动商品不下发、共享 SKU 活动隔离。
- `node --test --test-concurrency=1 test/group-buy-act-service.test.mjs`：8/8。包含关闭活动隐藏/拒绝、16005、16004、1900、flag 93、活动 ID、限购和订单落库。
- Premium、GroupBuy、Pet、钱包和购买主链路联合定向回归通过。
- 全量 `npm test`：2795 项，pass 2793，fail 0，skipped 2，cancelled 0，todo 0；日志 `analysis/test-runs/premium-act-similar-audit-20261109-full.log`。
- 修改文件通过 `node --check` 和 `git diff --check`。

本记录只证明服务端组件与真实临时 TCP 路径；没有 APK 视觉验收，不能据此认定客户端界面、SDK 弹窗或真实支付已完成验收。
