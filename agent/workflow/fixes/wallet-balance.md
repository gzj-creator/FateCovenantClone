# W1 余额充值联调

状态：组件测试与临时 TCP 集成均通过；**真实游戏内购买与用户视觉确认未完成**（需用户自行加款并购买）。

## 证据

- `personal-server/game/wallet-service.mjs`：余额整数分、加款、商品筛选、扣款、幂等订单、`res_recharge_login` 累计、1900 推送、16003 确认。
- `personal-server/sdk-service.mjs:144-160`：仅 `localTestOtp` 模式暴露 `/pay/recharge/order`，校验 `appid/userid/server/role_id/product_id/cp_order/amount/sign`，`amount*100` 必须等于配置价格，`cp_order` 作为幂等键。
- `personal-server/test/wallet-service.test.mjs`：覆盖余额、幂等、回滚、发奖编码失败、1900 推送失败不撤销订单、管理页鉴权、SDK 签名会话与金额不符（`0.06`）、未知商品、错误角色/用户/区服。
- 运行库只读核对（handoff 备份）：余额 0、订单 0、ledger 0、`activity_claims` 3，`integrity_check=ok`，`user_version=2`。

## 根因

本轮未发现新缺陷；此前“充值未验”的原因是用户尚未在管理页加款并触发游戏内购买，而不是代码路径错误。

## 实现边界

- 只支持 `RechargeTable` 中 `type∈{1,43,81}`、`pay_type=0`、`sync_handle=0`、奖励为基本货币（`Type.res_type=1500`）的商品；其余商品返回业务错误。
- 余额不足 301；周期限购商品 5；达到购买上限 307。
- 购买事务写 `resources`、`module19`、`recharge_orders`、`wallet_ledger`，编码或数据库失败整体回滚；1900 通知失败不回滚已提交订单。

## 复现

```powershell
npm test --prefix personal-server
node --test personal-server/test/wallet-service.test.mjs
```

## 待用户操作（不代做）

1. 浏览器打开 http://127.0.0.1:18883/ ，用 `runtime.local-only.data/admin-key.local-only.txt` 的内容加款。
2. 隔离客户端内触发普通 6 元商品（商品 11，60 钻石）或 30 元商品（商品 1，300 龙晶）。
3. 观察 `wallet_purchase_committed`、1900、16003 与 SQLite 余额/资源/订单一致，并重登确认持久化。
