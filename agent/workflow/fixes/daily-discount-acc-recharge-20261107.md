# 每日礼包和代金券累充修复

2026-11-07；分支 `fix/daily-discount-acc-recharge-20261107`，独立 worktree `.worktree/daily-discount-acc-recharge-20261107`。

## 根因

直接读取 `apk/com.jzyx.ps.v9-working.apk` 的实际 LuaJIT 指令，未操作模拟器。

- 两个 6 元档：模块 108 已正确记录行 `2/5/6` 售罄，但付费卡片读取 `WeekHuntDataMgr.IsTodayGiftCanBuy`。实时模块 533 仍是 `version=1/start_day=20745`，当天 `20764` 已过期；免费卡片直接读模块 108，所以显示正常。行时间陈旧是附带的数据一致性问题，不能据此断言界面已修复。
- 12/30 元：当前 v9 的 `_OnRecharge` 错误读取 `DailyDiscountTable.RechargeValueIndex()._OnRecharge`，应有的索引是 `recharge_id`。错误发生在客户端发包之前，单改服务端校验无法解决。
- 累充：实时模块 19 已有 `63300` 分，与现金商品订单一致；客户端 `RechargeSuccessFire` 遇到 `use_item_tid=701500` 时把本日金额置零并跳过总额增长。此前 `get_token=false` 恢复了充值事件，却没有解除代金券排除分支。

## 修复

- 每日卡片和一键按钮改读 `DailyDiscountMgr.IsSelloutToday`，使用模块 108 的每日次数。修正配置索引，保留购买弹窗和自选奖励列表；确认支付后调用 `RechargeOrBuyGift(productId,[false,0,0])`，避免过期周猎版本。
- 正常支付成功按商品原价增加客户端总额、当日和最高单日金额，保留真实代金券道具号及扣减。`get_token=true` 的失败补偿分支仍不累计。
- 服务端同步行刷新时间；模块 19 的日记录按新到旧排列，保留历史金额、最高金额、累计天数。没有清空充值记录，也没有用不完整订单历史覆盖金额。
- 启动订单回填限定当前账户；累充缺少模块 19 时返回金额不足，修正未定义变量异常。
- 周猎历史任务、补购限制和独立奖励保留。

补丁入口：`tools/patch-wallet-payment-lua.mjs` 的 `patchDailyDiscountLua`、`patchCouponRechargeLua`。只接受已核对的 v9 TextAsset 哈希，保持指令/常量区域长度和调试数据。

| 原始 TextAsset | SHA256 |
| --- | --- |
| RechargeSuperGiftBannerNode.lua | `55be2127ed10cbc12666dbed091d938b6ac44e7ebd27fcd485d2ed94007280de` |
| RechargeMgr.lua | `82fb6360ca429bd16f05ca61d22ada780930143daae2b85819b5168d7d6a09f6` |

## 复现与验证

从 v9 提取 `assets/Android/script/lua/64_lua_project.bundle` 后，在仓库根执行：

```powershell
$env:FC_RECHARGE_CLIENT_BUNDLE='<v9-lua-project.bundle的绝对路径>'
node --test personal-server/test/recharge-client-patch.test.mjs
npm test --prefix personal-server
node tools/build-recharge-fix-bundle.mjs <v9-lua-project.bundle> <新的bundle输出目录>
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-recharge-fix-apk.ps1 -SourceApk apk/com.jzyx.ps.v9-working.apk -PatchedLuaBundle <输出目录>/64_lua_project.bundle -OutputDirectory <新的APK输出目录>
```

- 基于 `main` 至 `e90ef1e` 的代码，全量 **2239/2239 通过，0 跳过**。
- 两项字节码测试执行实际修改后的指令，验证两个 6 元售罄、12/30 元可购及正确进入支付函数、一键按钮三种状态、代金券增加总额/当日/最高金额、补偿不累计。测试把周猎读取设置为报错，证明普通每日页不再依赖过期周期。
- 服务测试覆盖幂等扣款/累计、历史金额和天数保留、排序、缺失充值模块时拒绝领奖。
- 全量测试后补充专项覆盖过期第 19 天：`period=0` 的每日一键/12/30 元可购买；六行售罄重开数据库后保留；过期周猎任务不被改写。
- 全量通过后细化客户端修复以保留原自选弹窗，最新两项字节码回归重新通过，包含自选奖励列表完整传递。
- bundle 全部 `10928` 个 TextAsset 核对通过，只替换两个目标；候选 APK 的 `11906` 个 ZIP 成员内容校验通过，仅替换 Lua bundle 并移除旧签名。

## 本地产物与验收边界

证据目录 `analysis/experiments/recharge-fix-20261107/`，不提交二进制：

| 产物 | 大小与 SHA256 |
| --- | --- |
| `bundle-v2/64_lua_project.bundle` | 102832516 字节；`82f7e06657a439658dc8b9f323b05f1e59fe188a84bccb9ea20ac216dce74908` |

候选 APK **未签名、未对齐、未安装、未进行运行/画面验收**。当前工作区未找到 v9 原签名材料，没有生成不同证书的替代安装包。客户端修改需要更新客户端才能生效，仅重启服务器不够。

原可用 `apk/com.jzyx.ps.v9-working.apk` 保留；未验收构建没有覆盖它或标为可用快照。本轮未启停实时服务、未操作模拟器、未改写实时 SQLite。设备验证仍须保留 `SubDownloadFinish=1`。

## 累充范围

读取共享 `RechargeMgr` 和模块 19 的累充活动都会采用修复后的金额，包括当前配置的 `ActFrameType=106`、首充和百元累充。免费/资源价商品仍不计入现金累充，活动仍受自己的日期和领奖条件限制。

返利、许愿树和周猎的独立计数没有被重置；不能把共享金额修复当作所有活动独立状态均已验收。
