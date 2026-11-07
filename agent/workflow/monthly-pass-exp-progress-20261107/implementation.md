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

schema 16 分支合并后再次运行全量测试：2315 项，pass 2313、fail 0、skipped 2。日志：`analysis/test-runs/monthly-pass-exp-progress-20261107/full-after-schema16-merge.log`。

## 部署验收

首次重启失败，因为实时库已是 schema 16，而月度战令修复所在 `main` 的存储代码最高只支持 schema 15。已把允许 schema 16 并同步登录模块 10 与权威英雄/格子表的 `fix/recruit-first-hero-20261107` 合并到 `main`，保留数据库版本，合并提交为 `53062539c9d74605d9d0860652a1342f2adb7135`。合并后定向运行英雄进度、月战令服务和真实 TCP 月战令测试，29 项全部通过。

实时服务于 `2026-11-07T14:51:10Z` 重启成功，PID `2676`。18880/18881/18882/18883/19090 五个端口均监听，启动日志为 `personal-server/runtime.local-only.data/server-20261107-225109.local-only.out.log`，其中包含 `local_server_ready` 和 `month_permit_task_exp_repaired`。补偿事件记录活动 `1004012` 的任务经验为 50、`buy_exp_num` 从 50 修正为 0、经验资源从 0 增加到 50。

只读核对实时 SQLite 的结果：

- `PRAGMA integrity_check` 为 `ok`，`user_version=16`；
- 角色 `100001` 的资源 `10004200` 为 50；
- 迁移 `month-permit-task-exp-v1` 已记录，来源为 `repaired-activities=1;granted-exp=50`；
- 模块 `183` 的活动 `1004012` 仍保留 `task_get=[4003@1794060951]`，`buy_exp_num=0`。

重启前的一致备份为 `analysis/experiments/monthly-pass-exp-progress-20261107/game.before-restart.local-only.sqlite`。接下来的真实 APK 验收仍是再次领取一个新任务，确认 `pb_month_permit_task_back.res.changes` 含 `10004200` 且页面进度增加；在完成该视觉验收前，本次只记为服务端、数据库迁移和临时 TCP 通过。
