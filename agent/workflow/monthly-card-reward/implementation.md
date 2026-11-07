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

## 2026-11-07 已领取按钮未置灰修复

### 根因与客户端契约

- 客户端 `MonthlyCardMgr:AwardIsGotByDayIndex` 使用 1 基的 `dayIndex` 检查 `got_reward`，第 1 天对应 BitBlock 索引 1，即首个字节 `0x40`；它不检查索引 0。
- 原服务端把第 N 天写入索引 N-1。当前运行日志中 `seq=49` 的 `17001` 首次领取成功，返回 `claims:[{cardId:2,day:1}]`；`seq=51`、`seq=73` 再点均返回 `310 Monthly card reward already claimed`。服务端知道已领取，但模块 20 中的卡 2 为 `got_reward=80 00, got_count=1`，客户端检查不到索引 1，所以按钮仍可点击。

### 修复

- `monthly-card-service.mjs` 将第 N 天改为写入 BitBlock 索引 N；`got_count` 改为统计索引 `1..reward_period`。
- 新增启动期 `repairLegacyClaimBits()`：旧数据若索引 0 被置位，就把索引 `0..reward_period-1` 整体前移一位到 `1..reward_period`，清除旧索引 0，并按新索引重算 `got_count`。修复后不再触发迁移，重复启动幂等。
- `gateway.mjs` 在创建游戏服务、接收登录和命令前，以事务执行迁移；有改动时记录 `monthly_card_claim_bits_repaired` 日志。
- 专项测试新增新编码断言、旧位迁移与幂等断言，以及 `createLocalGame` 重启时自动迁移的集成覆盖；真实 TCP `17001` 回包也断言第 1 天为 `0x40`。

### 验证与状态

- 当前运行库只读副本中的卡 2 由 `got_reward=80 00` 迁移为 `40 00 00 00`，`got_count` 保持 `1`；真实运行库未写入。
- `node --test test/monthly-card-reward.test.mjs`：5/5 通过。
- 全量 `npm test`：2317 项，pass 2315、fail 0、skipped 2。
- 分支 `fix/monthly-card-claim-state-20261107`，worktree `.worktree/monthly-card-claim-state-20261107`。
- 尚未部署、未重启实时服务、未修改运行数据库，也未操作模拟器、ADB 或 APK。部署并重启后启动迁移才会执行；用户重新登录后应确认已领取日期按钮置灰，且重复点击不再发奖。
