# 月卡领取协议修复（2026-11-01）

## 真实客户端证据

- 用户在 `RechargeEntranceForm` 连续点击“领取”。
- 客户端发送 `17001 req_get_monthly_card_reward`，请求解码为 `card_id=1, day=[1]`。
- 旧服务端返回 `err=2, LOCAL_NOT_IMPLEMENTED:17001`，客户端记录“业务请求服务器异常”。

## 实现

- `monthly-card-service.mjs` 新增 `claim`：校验卡片、活动期、请求日期和重复位，更新 `got_reward` BitBlock、`got_count` 与模块 20，并通过 `grantResources` 发放配置奖励。
- `gateway.mjs` 路由 `17001`，返回 `res_get_monthly_card_reward { card, res }`，记录 `monthly_card_reward_committed` / `monthly_card_reward_rejected`。
- 月卡有效窗口改为 `start_day <= now < start_day + reward_period`，修正原先多算一天的问题。

## 验证与部署

- `node --test test/monthly-card-reward.test.mjs`：3/3。
- 支付、月卡、基金、永久卡及标准/月度通行证专项：合计 47/47。
- 测试覆盖资源发放、重复/未来/过期/非法日期、SQLite 重开持久化和真实 TCP `17001` 回包。
- 复制运行库到临时文件后，对真实卡 1、第 1 天执行领取验证成功；奖励变化为 `122702 +1`、`8501900 +2`、`101500 +300`，没有改动运行库。
- 提交 `28870c3` 已进入 `main`；修复前数据库备份在 `analysis/experiments/private-server-20261025/p3/monthly-card-reward-20261101-2340/`。
- `scripts\run.bat` 重启成功，PID `29084`，五端口仅监听 loopback，管理页 HTTP 200，stderr 为空，SQLite `integrity_check=ok`，客户端自动重连并完成 146 模块登录。
- 标准通行证 `1401` 当前模块状态为 `is_pay=true`；实际 16004 订单已成功并收到 16003 确认。

## 待用户视觉验收

- 月卡页面点击“领取”应立即显示奖励，并刷新为已领取/售罄状态。
- 标准通行证和月令通行证需要重新点买或打开页面，确认购买入口立即切换且不会重复扣款。
