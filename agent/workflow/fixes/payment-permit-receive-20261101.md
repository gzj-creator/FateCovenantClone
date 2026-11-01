# 支付反馈、基金、永久卡与通行证领取修复（2026-11-01）

## 范围与证据

锁定 APK 不能修改，因此本轮只调整服务端协议和持久化，使服务端对齐客户端已有逻辑。真实客户端日志提供了最新缺口：

```text
command type=35005 bytes=6
unsupported_command type=35005
payloadHead=g2IAAAV5
```

`g2IAAAV5` 解码为 ETF `[1401]`，即标准通行证 `req_permit_receive_all`。客户端协议返回 `pb_permit_receive_back { levels, res, permit }`。月令通行证一键领取为 `105803 req_month_permit_receive_all`，返回 `pb_month_permit_receive_back { get_list, res, permit }`；单档领取为 `105801`。

## 根因

- 网关没有路由 `35005`、`35001`、`35002`、`105803`、`105801`，客户端收到 `unsupported_command`。
- `game-tables.mjs` 没有加载标准通行证等级/周期表和月令通行证 `GearLv` 奖励表，即使增加路由也无法根据配置计算可领取内容。
- 标准通行证 1401 的经验由 `PermitUtil.CalcOpenDay` 动态计算，不能读取普通经验资源：

```text
min(max(0, floor((nowSeconds + 10800) / 86400) - open_day + 1), cycle)
```

- 月令通行证等级由 `MonthPermitUpLv` 的经验门槛决定；可领取档位必须同时满足当前活动版本、当前等级、免费档或 `pay_list` 已购档，并且不在 `get_gear_lv_list` 中。
- 基金和永久卡原钱包没有专用 handler。基金需要模块 532 和 recharge flag 76；永久卡需要模块 62。两者还需从历史订单回填，避免旧订单已扣款但登录状态为空。
- 16005 过度要求所有商品提供每日优惠三元组 `[[is_extra_buy, period, day]]`。锁定 APK 对基金、永久卡、月卡和通行证会携带无关 UI 上下文，服务端在进入业务 handler 前即拒绝。
- 头像框奖励索引错误使用了称号的 `-3000` 偏移。头像、头像框、称号/气泡分别应使用 1000、2000、3000 的族偏移；例如 `200508` 应写入头像框位 5。

## 实现

- 新增 `diamond-fund-service.mjs`：商品 155001/155002、模块 532、15 天周期、限购事实、flag 76 和历史订单恢复。
- 新增 `permanent-card-service.mjs`：商品 490002/490003、模块 62、历史订单恢复和重复购买 307。
- 扩展标准通行证 `permit-service.mjs`：
  - 计算 1401 当前等级；
  - `35001` 仅领免费档；
  - `35002` 仅领已购档，未购买返回 25001；
  - `35005` 一键领取免费和已购档；
  - 重复/无奖励返回 25002/25003；
  - 把 `levels[].receive_free/receive_permit` 写回模块 38，并返回完整 `permit`。
- 扩展月令通行证 `month-permit-service.mjs`：
  - `105801` 单档校验并领取；
  - `105803` 无参数时从当前模块 183 自动选择活动，一次领取所有达到等级的免费/已购档；
  - 资源通过 `grantResources` 原子发放，`get_gear_lv_list` 持久化，重复领取不重复发奖。
- 网关接入上述五个命令，并记录 committed/rejected 事件，不再落入 `unsupported_command`。
- `wallet-service.mjs` 把基金、永久卡、标准通行证、活动月令通行证统一接入 16004/16005 和已购校验；成功回包保留各自的 flag 76/73/9/116。
- `welfare-service.mjs` 仅对真正需要购买上下文的 type 46 或周期限定商品解析额外参数；基金、永久卡、月卡和通行证允许锁定 APK 发送的无关上下文。
- `resources.mjs` 修正头像/头像框/称号/气泡的图鉴位索引。

## 自动化验证

支付与通行证专项：

```powershell
cd F:\projects\FateCovenantClone\.worktree\team-genre-award-20261101\personal-server
node --test test/purchase-flow-regression.test.mjs test/reward-handlers.test.mjs test/welfare-service.test.mjs test/permit-purchase.test.mjs test/permit-feedback.test.mjs test/month-permit-voucher.test.mjs test/month-permit-buy-level.test.mjs test/month-permit-task.test.mjs test/permit-receive.test.mjs
# 44/44 passed
```

新增 `permit-receive.test.mjs` 覆盖：

- 标准通行证免费档、已购档、一键领取、重复领取与重启持久化；
- 月令通行证单档、一键、等级门槛、未购付费档、重复领取与重启持久化；
- 真实 TCP `35005` 和 `105803` 请求、可解码响应、日志事件以及不出现对应 `unsupported_command`；
- 16005 对基金、永久卡、标准通行证、月令通行证携带无关 `extra_param` 时仍能进入专用 handler。

`git diff --check` 通过。全量 `npm test` 仍以退出码 1 结束，失败集中在已记录的共享运行快照漂移测试（钓鱼活动版本、任务/主线、普通宝箱、推荐礼包计数等）；本轮支付与通行证专项 44/44 通过。该旧快照问题不以删除或跳过断言处理。

## 验收边界

- 本轮没有修改 APK，也没有触发 APK 快照更新条件。
- 自动化只证明组件、协议编码和真实 loopback TCP 路由通过，不等同用户视觉验收。
- 部署后需由用户验证：基金/永久卡/月卡/标准通行证/月令通行证购买有即时反馈；标准与月令通行证的单档及一键领取到账；重复点击返回对应业务错误而不是断线或等待。
