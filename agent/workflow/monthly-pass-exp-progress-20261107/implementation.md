# 月度战令任务经验进度修复

## 范围

- worktree：`F:\projects\FateCovenantClone\.worktree\monthly-pass-exp-progress-20261107`
- 分支：`fix/monthly-pass-exp-progress-20261107`
- 基线：`main@e55a039`
- 仅修改个人服务器；APK 无二进制变更，不需要新 APK 快照。

## 复现证据

真实客户端在 `2026-11-07T14:15:51.944Z` 发送 `105804`，任务列表为 `[4003]`。服务端随后记录 `month_permit_task_reward_committed` 并返回 34 字节 payload，但实时 SQLite 呈现以下矛盾状态：

- `pb_month_permit_info.task_get` 已有任务 `4003`；
- `pb_month_permit_info.buy_exp_num=50`；
- 活动配置对应的经验资源 `10004200` 不存在，因此 UI 经验进度仍为 0。

## 根因

`claimTask()` 只把任务经验加到 `pb_month_permit_info.buy_exp_num`，没有调用 `grantResources()` 发放 `MonthPermitCycle.exp_item` 指定的经验资源。客户端的经验进度和 `claimReward()` 的等级判断读取经验资源；`buy_exp_num` 只表示购买等级取得的经验，不能代替任务经验。

## 修改

- `personal-server/game/month-permit-service.mjs`
  - `105804` 成功后以同一事务发放 `10004200` 经验，并在 `pb_month_permit_task_back.res.changes` 返回资源变化；
  - 等级判断改为读取真实经验资源；
  - 任务领取不再增加 `buy_exp_num`，并校验任务属于当前活动版本；
  - 新增一次性修复：按旧版 `task_get` 汇总应得任务经验，补发缺少的经验资源，同时从 `buy_exp_num` 扣除旧逻辑误加的任务经验；
  - 修复标记为 `migrations.name='month-permit-task-exp-v1'`，重复启动不会再次发放。
- `personal-server/game/gateway.mjs`
  - 本地游戏启动时、客户端登录前执行上述一次性修复，并记录 `month_permit_task_exp_repaired` 事件。

## 验证

定向测试：

```powershell
node --test test/month-permit-task.test.mjs test/month-permit-task-gateway.test.mjs test/month-permit-buy-level.test.mjs test/permit-receive.test.mjs
```

结果：16 项通过，覆盖正常任务经验、经验资源回包、SQLite 重开持久化、旧数据一次性补偿、补偿幂等和真实 TCP `105804`。

全量回归：

```powershell
npm test
```

结果：2314 项，pass 2312、fail 0、skipped 2。日志：`analysis/test-runs/monthly-pass-exp-progress-20261107/full-after-fix.log`。

## 部署验收

合并并重启实时服务后需要确认：

1. 启动日志出现 `month_permit_task_exp_repaired`，旧任务 `4003` 补发 50 经验；
2. SQLite 的 `10004200` 资源为 50，`buy_exp_num` 修正为 0；
3. 用户再次领取新任务时，`pb_month_permit_task_back.res.changes` 含 `10004200`，页面进度随之增加；
4. 尚未完成上述真实 APK 视觉与再次领取验收前，只能记为服务端和临时 TCP 通过。
