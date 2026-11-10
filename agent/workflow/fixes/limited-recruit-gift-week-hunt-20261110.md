# 限时招募礼包因已关闭 Week Hunt 上下文显示“仅显示物品不可操作”

状态：wallet-service 修复完成，目标回归和全量测试通过；未重启实时服务、未操作模拟器或 ADB、未做 APK 验收。重启与线上验收由用户部署时执行。

## 现象与证据

- 百派争鸣 `HeroDrawActGiftForm` 的“超值冒险招募”`40010` 可正常打开购买确认，但确认后返回错误；客户端显示语言 `200225=仅显示物品不可操作`。
- 真实客户端 `12:50:53` 发出 `16004`，解码参数为 `[40010, BINARY('[{"ipv4":"10.0.2.15",...},[false,1,20767]]'), 701500]`。
- 服务事件 `voucher_recharge_rejected` 返回 `code=309`、`message='Week Hunt period is not open'`，整笔订单回滚。
- 客户端 `ErrorTable` 将 `309` 映射到文本 `200225`，与用户看到的提示一致。
- module 533 中当前 `cur_versions=[1]`，period `1` 的 `start_day=20745`；Week Hunt 持续 14 天，而请求发生时服务端 day 为 `20767`，因此 period 已关闭。

## 根因

`40008` 和 `40010` 同时被 DailyDiscount、百派争鸣礼包及 Week Hunt 使用。`RechargeMgr` 从每日折扣上下文保留了 `[false,1,20767]`，百派争鸣礼包页续用这条旧 Week Hunt tuple 发出购买。

旧 `wallet-service` 在每日折扣主购买前调用 Week Hunt 任务记账，并把 `309` 当成整单失败。Week Hunt 在这里是附加任务账本；活动页已关闭时，它不应否决仍在开放的每日折扣/百派争鸣同 SKU 购买。

## 修复

- 新增可选的 Week Hunt 购买解析辅助：仅当请求携带正周期号、`309` 表示周期关闭，且当前存在开放的百派争鸣同 SKU 时，跳过 Week Hunt 记账。
- `assertPurchaseAvailable()` 与 `buy()` 两条路径使用同一规则，避免预览校验放行后又在事务内失败，或只修其中一条路径。
- 跳过时记录 `week_hunt_period_skipped`，包含商品、周期、服务端日期和原因；后续可从事件日志确认。
- `307` 限购、`1` 非法日期等错误仍原样拒绝；纯 Week Hunt 购买没有开放礼包页可归属时仍返回 `309`。
- 未修改 Week Hunt 周期数据，不把已关闭周期内的购买伪造进 `upgrade_list`。

## 同类路径审计

- 百派争鸣的 13 个礼包中，只有 `40008` 和 `40010` 是同时属于 DailyDiscount、百派争鸣及 Week Hunt 的 `type 46` 共用商品；本次真实报文已同时覆盖两者。
- `40009`、`46002`、`46003` 属于每日折扣，但不在 Week Hunt 的升级礼包或同档配置中，不会命中该错误。
- `2090003/2090004/2090005/2090007`、`880103/880104` 等使用各自的活动购买路径，不经过 Week Hunt 周期解析；现有逐礼包测试继续通过。
- WishTree 关闭周期返回 `310` 时，已有 `recordWishTreePurchase()` 只跳过返利记账；WishTreasure 购买记账不会拒绝主订单；RechargeBonus 在未开放/未选择时只跳过累计。未发现第二处同类整单回滚。

## 验证

- 新增真实 `16004` 回归会先确认旧代码稳定返回 `err=309`，修复后 `40010`、`40008` 均可购买。
- 回归断言覆盖：无协议错误、收到 `1900`、下发 `flag 40`（每日折扣）和 `flag 92`（百派争鸣）、发放对应钻石、写入活动购买记录、订单保留请求周期但不写入 Week Hunt 周期。
- 目标链路与相邻测试：59 项中 pass 57、fail 0、skip 2；两项 skip 仅因未配置 `FC_RECHARGE_CLIENT_BUNDLE`。
- 全量 `npm test --prefix personal-server`：2808 项，pass 2806，fail 0，skipped 2。日志：`analysis/test-runs/limited-recruit-gift-20261110/personal-server-full.log`。

## 部署与验收边界

- 部署后应在百派争鸣“招募礼包”页分别购买 `40010` 和 `40008`，确认 `1900` 成功、钻石到账、礼包立即显示已购/售罄，无需重登。
- 若 Week Hunt 仍开放，同样 SKU 的购买应继续写入 module 533；本次只对已关闭周期附加任务记账执行跳过。
