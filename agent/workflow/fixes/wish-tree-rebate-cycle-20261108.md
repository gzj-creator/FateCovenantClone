# 希望树返利周期关闭导致 16004 每日折扣购买失败

状态：wallet-service 修复完成，组件/回归/全量测试通过；未部署实时服务、未做 APK 验收（本轮仅临时 loopback/SQLite）。

## 现象

- 基线 main 6dcc805：每天 03:00（`DAY_OFFSET_SECONDS=10800`）切换后，16004 每日折扣购买在扣券之后抛 `GameError 310 'Wish-tree rebate cycle is closed'`，整笔购买回滚。
- `personal-server/test/recommend-gift-count.test.mjs` 两项失败：一项收到 `err:310`，另一项等不到 1900。基线 50 项中 48 通过、2 失败。

## 证据

- `personal-server/game/wish-tree-service.mjs` 的 `recordPurchase()` 在 `purchaseDay` 落在 `accrue_day` 起 14 天周期之外时抛 310，这是账本既有语义。
- 登录种子模块 165 的 `accrue_day` 停在上一次采集日，真实服务器日早已越过该周期，因此每次购买都命中 310。
- `wallet-service.mjs` 在购买事务里直接调用 `wishTree.recordPurchase()`，异常连带回滚券扣减、发奖与订单。
- 日志：`analysis/test-runs/gameplay-20261106/wish-tree-rebate-baseline.log`（修复前 48/50）、`wish-tree-rebate-fixed.log`（修复后 53/53）。

## 实现

- 新增 `recordWishTreePurchase(args)` 辅助：仅当 `error.code === 310` 时记录 `wish_tree_rebate_skipped`（product_id、day、code、reason）并返回 null，其他错误码继续抛出。
- `buy()` 与 `purchaseGift()` 两处希望树调用点改走该辅助。
- `wish-tree-service` 未改：周期外直接调用 `recordPurchase()` 仍然拒绝。

## 测试

- wallet-service 专项新增 3 项：310 时购买成功且订单、扣费、发奖、flag-40 事件齐全；非现金赠礼的第二调用点同样跳过；311 仍传播且事务回滚。
- 目标集（wallet-service、recommend-gift-count、wish-tree-service、mail-voucher、month-permit-voucher）：53/53。
- 购买链路回归（purchase-flow-regression、permit-purchase、recharge-client-patch、gameplay-gateway、admin-pending-request）：22 项，20 通过、0 失败、2 跳过（缺 `FC_RECHARGE_CLIENT_BUNDLE`）。
- 全量 `npm test --prefix personal-server`：2470 项，2468 通过、0 失败、2 跳过。

## 边界与缺口

- 跳过返利后当天不增加希望树回购日，`ensureLoginState` 只在周期内回填，与现有账本语义一致。
- 未修改希望树周期规则，也未伪造返利天数。
- 未部署到实时服务、未操作模拟器/ADB/APK；03:00 之后的真实每日折扣购买仍需部署后人工复验。
