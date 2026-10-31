# 每日优惠批量限购同步修复

## 问题

2026-10-31 真实客户端购买 `46003` 成功后，module 108 中 `recharge_tid=6` 已变为 `buy_times=1`，但 `recharge_tid=2` 和 `5` 仍为 `0`。商店因此继续显示入口，下一次点击却被服务端以 `307 Product purchase limit reached` 拒绝。

客户端配置 `DailyDiscountRecharge` 已明确给出依赖关系：

| 行 | 商品 | `batch_update` | `can_buy_times` |
| --- | --- | --- | --- |
| 6 | 46003 / ¥9 | `[2,5]` | 1 |
| 2 | 40009 / ¥6 | `[]` | 1 |
| 5 | 46002 / ¥6 | `[]` | 1 |

`46003` 的奖励等于 `40009` 与 `46002` 的组合。旧服务只递增用户直接请求的 `6`，没有应用 `batch_update`，启动回填也只重建直接商品行。

## 修复

- `wallet-service.mjs` 从 `DailyDiscountRecharge` 读取商品映射和 `batch_update`，在同一 SQLite 事务内同时校验并递增 `6、2、5`。任一普通限购额度已耗尽时，整个批量商品返回 307，不扣代金券/余额、不发奖、不写订单。
- 成功响应的 `pb_daily_discount_all` 和 flag 40 推送包含三行更新后的状态，同时写回 module 108。
- 启动回填按订单重新计算全部受影响行；现有 `46003` 订单会把 `6、2、5` 恢复为已购，重启后不会再次出现界面/后端分叉。
- 额外购买仅在客户端明确发送 `isExtraBuy=true` 时使用 `buy_additionally`。普通重放、组件购买或再次一键购买均返回 307；网关沿用既有策略，以无报错应答结束 16004，避免客户端弹出服务故障。
- `assertPurchaseAvailable` 在 16004 检查代金券余额前先做只读限购预检，保证已售罄商品稳定返回 307，而不是因代金券已被第一次购买消耗而变成 302。

## 验证

- 定向钱包测试确认 `46003` 首次购买后 `6、2、5` 全部为 1；第二次购买、直接购买 `40009`、直接购买 `46002` 均返回 307，订单、余额和推送数量不增加；重开数据库后状态不变。
- 反向用例确认先买 `40009` 后不能再买 `46003`。
- 真实 TCP 用例覆盖 `16004 -> 1900 + 回包`、三条依赖行同步、重复/组件请求不扣款，以及 `16003` 将原订单标记为 `acknowledged=1`。
- 全量 `npm test --prefix personal-server`：**192/192** 通过。

## 部署与运行状态

- 部署前一致备份：`analysis/experiments/private-server-20261025/p3/daily-discount-batch-20261031/game.before-batch-sync.local-only.sqlite`，大小 303104 字节，SHA256 `d87d77c9f3c7a2df3303196c9689747d0380d2a540255f336c95a8e302a1b623`，schema v7，`integrity_check=ok`。
- 部署后一致备份：同目录 `game.after-batch-sync.local-only.sqlite`，SHA256 `9dbd5a9ffb3cb803bbcb4a8f6babfe7bea561ff468e8c6170fa933e9c3ab4127`，schema v7，`integrity_check=ok`。
- 修复前 module 108 行为 `6=1, 2=0, 5=0`；启动回填后为 `6=1, 2=1, 5=1`。订单仍为 16 条，余额仍为 400 分。
- 服务已从 PID 7256 重启为 PID 8100，启动时间 `2026-10-31T02:22:27.577Z`。五端口 `18880/18881/18882/18883/19090` 均仅监听 `127.0.0.1`。
- 隔离客户端 `com.jzyx.ps` 自动重连，`2026-10-31T02:22:55Z` 完成 145 模块登录；大厅截图正常。商店页面未由 agent 点击，卡片隐藏/禁用状态由用户下次打开“超值精选”时做最终视觉确认。
- 证据目录：`analysis/experiments/private-server-20261025/p3/daily-discount-batch-20261031/`，含修复前后快照、两份一致备份、`acceptance.local-only.json`、重连日志和大厅截图。

## APK 快照

当前安装与验收构建为 `forward10-debug-preserved`，已复制为 `apk/com.jzyx.ps.v9-working.apk`：

| 项目 | 值 |
| --- | --- |
| 大小 | 4,185,758,901 字节 |
| SHA256 | `1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473` |
| 包名 | `com.jzyx.ps` |
| 版本 | `1.55.090365` / `362155` |
| 签名 | v1/v2/v3 通过 |
| 证书 SHA256 | `976534938a9295ed80f4b6ea5ae88e7c8e6b4242cec776ee0f38882a2c76644c` |

设备安装的 `base.apk` 哈希与源构建及 `apk/` 快照一致。安装后仍须保留 `SubDownloadFinish=1` 前置条件。
