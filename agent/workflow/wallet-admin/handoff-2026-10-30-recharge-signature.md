# 2026-10-30 充值/礼包购买交接

## 2026-10-30 01:18 更新：签名 401 已修复并部署

- `/pay/recharge/order` 的 401 根因已确认为 `channel` 的 null 签名/空串编码差异：客户端以字面量 `null` 签名，HTTP 表单发送空串。服务端已在验签前归一化 channel，并先按 `cp_order` 查找 quickOrderPay 已创建的订单，直接确认而不重复购买。
- 真实 40009 日志字段复算 MD5 与客户端 received 完全一致；部署后重放该已购请求返回 200 且订单未新增、余额未变化。
- 全量测试 161/161 通过；服务 PID 37280（2026-10-29T17:18:51Z），五端口仅 loopback。证据在 `analysis/experiments/private-server-20261025/p3/recharge-signature-fix-20261030-0118/`。
- 下一步：用户手动购买 40009 验收弹窗与单次扣款；之后处理 46003 限购和星钻代金券选项。

## 当前运行状态

- 服务 PID：`32088`，启动于 `2026-10-29T15:42:47.936Z`，实时状态以 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json` 为准。
- 五端口 `18880/18881/18882/18883/19090` 均仅监听 loopback。
- 隔离客户端 `com.jzyx.ps` 进程 PID `11932`，当前在商城/充值页面；原版 `com.jzyx.my` 未操作。
- ADB 固定：`E:\Mumu\MuMuPlayer\nx_main\adb.exe -s 127.0.0.1:16448`。

## 本次已完成

- 已修复 `res_recharge_success.extra_params` 的结构：
  - 文件：`personal-server/game/wallet-service.mjs`
  - 外层 ETF list，内层为 `[isExtraBuy, period, day]`；`isExtraBuy` 用 ETF atom `true/false`，`period` 暂为 `0`，`day` 使用 `dailyDay(purchasedAt)`。
  - 补买时 `dailyPlan.additional === true` 会发送 `isExtraBuy=true`。
  - 相关测试已更新：`personal-server/test/month-permit-voucher.test.mjs`、`personal-server/test/wallet-service.test.mjs`。
- 全量测试当前 `160/160` 通过（PowerShell 传文件列表给 `node --test`）。
- 已增加 `walletOrder` 签名失败诊断日志：
  - 文件：`personal-server/sdk-service.mjs`
  - 事件：`wallet_order_signature_rejected`
  - 仅用于定位客户端 `/pay/recharge/order` 签名算法；后续修复后可移除或降级。
- 已创建一致备份：
  - `analysis/experiments/private-server-20261025/p3/recharge-extraparams-nested-20261029-2301/game.before-restart.local-only.sqlite`
  - `integrity_check=ok`，`user_version=4`，备份时 10 笔订单，SHA256 `4b5bf3bf8878c00b0803840458f6eaf7554b5266ce7cf10ea485a9fa1c06a7d4`。
  - 备份工具：`analysis/tools/backup-sqlite.mjs`（`node:sqlite` backup API，不能在 WAL 运行态直接复制主 DB 文件）。

## 关键结论：当前真正的阻塞点

客户端购买礼包/充值后，实际链路是：

1. 客户端调用 SDK `POST /v1/order/orderpay`（QuickSDK `quickOrderPay`）。
2. 服务端 `wallet.buy()` 已成功提交订单、扣款、发奖、发布 1900 推送。
3. 客户端随后调用 `POST /pay/recharge/order`（服务端路由 `walletOrder`）。
4. `walletOrder` 返回 `401 / rcode=1001 Invalid local payment signature`。
5. 客户端显示“网络发生错误 请重新尝试”，不显示奖励/购买成功弹窗；但货币和资源其实已到账。

证据日志：

- `analysis/experiments/private-server-20261025/p3/recharge-extraparams-nested-20261029-2301/server.stdout.local-only.log`
- 搜索 `wallet_order_signature_rejected`。
- 同一日志可见 `wallet_purchase_committed`、`quick_order_pay_committed`，随后立即出现 `walletOrder` 401。

已抓到的真实客户端字段（节选，完整见日志）：

```text
appid=fc-local
userid=local-1
server=1
role_id=100001
product_id=40009 / 40010 / 40008 / 46002
amount=6 / 12 / 30 / 6
channel=""
game="6"
title=超值体力 / 超值冒险招募 / 超值精英招募 / 超值冒险者
recharge_source=android
third_product_id=0
extra_params={...}
package=com.jzyx.ps
```

已尝试用 `signSdkParameters()` 对全部可选字段的子集、`fc-local-development-key`、平台 `sign_to_platform`、QuickSDK `fclocal1` 以及两种后缀方式穷举，均未匹配客户端 `sign`；说明客户端 `/pay/recharge/order` 使用的是另一套签名 canonicalization 或另一把 key，不是当前 SDK 的普通表单签名。

## 已确认的表现

- 礼包 `40009` 两次购买：订单已写入 SQLite，钻石 `1340 → 1400`，但客户端仍弹“网络发生错误”。
- 礼包 `40010`、`40008`、`46002` 也有同样 `walletOrder` 签名失败记录。
- 60 星钻商品 `product_id=11`：订单提交成功，钻石 `1280 → 1340`，但同样没有正常购买反馈；当前代金券余额为 400 分（¥4），充值弹窗仍不显示代金券支付选项。
- 一键购买点击时服务端收到 `quickOrderPay productId=46003`，返回 `code=307 Product purchase limit reached`；这是当日限购已用完导致的第一层失败，需在限购重置后或干净测试数据上再验证一键购买是否还会继续购买后续商品。

## 建议下一 agent 的最短路径

1. 先定位客户端 `/pay/recharge/order` 的签名算法：
   - 优先用 `dexdump.exe`（`C:\Users\gzj\AppData\Local\Android\Sdk\build-tools\36.0.0\dexdump.exe`）或 jadx 分析 `analysis/reports/private-client-16448/candidate/classes*.dex`。
   - 搜字符串 `recharge_source`、`third_product_id`、`cp_order`、`/pay/recharge/order`、`sign`，找到构造表单的 Java/QuickSDK 类。
   - 也可在 `sdk-service.mjs` 临时记录原始 `request` body 的 URL 编码字节，确认 title/extra_params 在签名前的编码。
2. 修复 `walletOrder` 签名校验后，重测 `40009`/`40010`/`40008`/`46002`：
   - 目标：不再出现 `wallet_order_signature_rejected`，不再弹“网络发生错误”，出现奖励/购买成功弹窗，钻石与背包变化，订单和 1900/16003 正常。
3. 再测一键购买：
   - 如果 `46003` 仍被 `307` 挡住，需确认当日限购/测试数据，而不是直接改服务端忽略限购。
4. 最后处理星钻/代金券：
   - 分析 `DragonCrystalBuyForm` 与原生 `16004`；当前代金券余额 400 分但充值弹窗无代金券选项，属于独立问题，预计另需 1–2 小时。

## 约束

- 只操作隔离包 `com.jzyx.ps`，绝不操作原版 `com.jzyx.my`。
- 所有 ADB 命令必须带 `-s 127.0.0.1:16448`。
- 当前没有改 APK，无需更新 `apk/` 快照。
- 工作区有大量历史 staged/untracked 修改，严禁 `git reset`、`checkout` 或清理用户改动。
