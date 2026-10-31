# 限购礼包错误码修复

日期：2026-10-31

## 用户反馈

限购礼包买到上限后仍能继续点击，返回的却是错误的 QuickSDK 日志 ID；预期应明确提示“该商品今日购买次数已用完”。

## 现场证据

- 实时日志 `2026-10-31T10:48:34Z` 成功购买 `40010`，订单 `local-4cc939b7-c403-4f95-a45b-5f5a0c193fc9`，余额剩余 400 分。
- 三秒后再次对 `40010` 发起 QuickSDK `orderpay`，`quick_order_pay_rejected productId=40010 code=301`。
- 当时 module 108 的 `recharge_tid=3`（`40010`）已是 `buy_times=1`，商品 `can_buy_times=1`；余额 400 分低于商品价 12 元。
- `sdk-service.mjs` 将 `301` 映射为 `error.id=80000`（余额不足），`307` 才映射为 `80001`（限购弹窗）。

## 根因

`wallet-service.mjs` 的 `buy()` 与 `purchaseGift()` 都在事务内先比较钱包余额，再检查 `can_buy_times`/活动限购。最后一次购买把余额降到商品价格以下后，再次点击会先命中余额不足 `301`，限购 `307` 根本没有执行，所以 QuickSDK 收到错误的 `80000`。

## 修复

- `buy()` 将限购、活动限购和每日优惠状态检查移到余额检查之前；限购判断仍使用同一事务内的模块快照与订单统计。
- `purchaseGift()` 同样先检查限购，再检查余额价格。
- 购买成功后的 module 108 `buy_times`、`flag 40` 推送和 `pb_buy_gift_record`（flag 73）保持不变。
- 未修改 QuickSDK 的通用错误映射：真实余额不足仍返回 `301/80000`，真实限购返回 `307/80001`。

## 自动化验证

- 新增 `sold-out purchase limit wins over an empty wallet balance`：`40010` 买到上限后余额不足，再次 `buy()` 必须返回 307；普通礼包 `240003` 的 `purchaseGift()` 同样覆盖。
- 新增 `QuickSDK order payment reports an exhausted gift limit instead of insufficient balance`：真实 QuickSDK `orderpay` 首单成功后第二次返回 `{code:307,id:'80001',message:'该商品今日购买次数已用完'}`，且订单数不增加。
- `npm test --prefix personal-server`：**275/275 通过**。

## 部署与实时验收

- 修复提交 `8fdc7d5` 已快进合入 `main`。
- 停服前备份：`analysis/experiments/private-server-20261025/p3/purchase-limit-fix-20261031-190308/game.stopped.local-only.sqlite`，SHA256 `C8D566B3215BCEB3B504AFE25CB4335F302F1D1D119F6E617A26EEA55A68D490`，`integrity_check=ok`，`user_version=10`；同目录保留 WAL/SHM、状态和 SDK 会话副本。
- 新服务 PID `44268`，入口 `F:\projects\FateCovenantClone\personal-server\local-server.mjs`，工作目录项目根目录；`18880/18881/18882/18883/19090` 均仅监听 `127.0.0.1`，stderr 为空。
- 隔离客户端自动重连，`2026-10-31T11:04:14Z` 新服务 ready，`11:04:14Z` 登录发送 146 个模块，角色 100001。
- 独立本机 SDK 会话对已售罄 `40010` 发起一次真实 `orderpay`：HTTP 200，响应 `{"result":false,"error":{"code":307,"id":"80001","message":"该商品今日购买次数已用完"},"data":{}}`；实时日志 `quick_order_pay_rejected productId=40010 code=307`。
- 该次验收后订单仍为 25 条、`40010` 订单仍为 6 条，最新订单时间仍是 `10:48:34Z`，没有新增订单或扣款。

## 验收边界

服务端错误码、QuickSDK `error.id` 和真实 TCP/HTTP 路径已验收。客户端按钮是否在购买后立即灰掉或显示“已售罄”仍由客户端刷新逻辑决定；重登后 module 108 已返回 `buy_times=1`。本轮未修改 APK，因此没有新的 APK 快照。
