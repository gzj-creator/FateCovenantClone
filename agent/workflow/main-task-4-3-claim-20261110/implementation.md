# 主线 4-3 任务奖励“未解锁”修复

## 范围

- worktree：`F:\projects\FateCovenantClone\.worktree\main-task-4-3-claim-20261110`
- 分支：`fix/main-task-4-3-claim-20261110`
- 基线：`main@7f22584`
- 只修改个人服务器代码和测试。本次没有 APK 二进制变更，不需要新增或更新 APK 快照。

## 复现与证据

主线 4-3 已真实通关，相关权威状态没有缺失：

- 模块 8 的 `pb_mission.mission_id` 为 `40204`，说明 4-3 已越过通关游标。
- `reward_claims` 已有 `linear_task/10001` 至 `linear_task/10004` 四条记录。
- 模块 90 第 4 槽保存正确的线性任务高水位 `receive_tid=10004`。
- 模块 90 第 0 槽仍残留旧版线性数据 `pb_linear_task_data{type:1, receive_tid:10002}`；第 0 槽本应属于 CommonTaskMgr 的 `1201` 组。

客户端点击 `9010/10003` 后，旧服务端只因 SQLite 已有 `10003` 领取记录就直接返回业务码 `310`。客户端把该错误显示为“未解锁”，因此页面状态与实际通关、领取状态不一致。

## 修改

- `personal-server/game/task-service.mjs`
  - 新增 `ensureLoginState()`：按 `reward_claims` 重建四个 CommonTaskMgr 登录槽，清掉误放在第 0 槽的旧线性数据；再按线性任务配置的 `sortOrder` 校验并校准第 4 槽高水位。
  - `9010` 对“已有领取记录”或“已低于登录高水位”的重复点击返回合法 `pb_linear_task_receive_back`，并携带当前最高已领取任务。
  - 幂等确认返回空 `res_change.changes`，不再次发奖，也不新增重复领取记录。
  - 旧登录高水位已有领取事实但 SQLite 缺少对应标记时，只补领取标记，不补发奖励。
- `personal-server/game/gateway.mjs`
  - 登录生成 payload 前调用 `tasks.ensureLoginState()`；发生修复时记录 `task_login_state_repaired` 事件。
- `personal-server/test/task-service.test.mjs`
  - 覆盖旧第 0 槽、正确第 4 槽、四条领取记录与点击 `10003` 的实时库同构场景。
  - 覆盖旧登录高水位和 SQLite 领取记录不一致时的幂等修复，以及 SQLite 重开后的稳定性。
- `personal-server/test/gameplay-gateway.test.mjs`
  - 将重复点击从期待 `310` 改为期待成功、空资源变化和领取记录/奖励余额不变。

## 验证

定向测试：

```powershell
node --test --test-concurrency=1 personal-server/test/task-service.test.mjs
node --test --test-concurrency=1 personal-server/test/item-commontask-service.test.mjs personal-server/test/gameplay-gateway.test.mjs
```

结果分别为 `20/20` 和 `14/14` 通过。额外检索确认其他业务仍保留需要的 `310` 断言；本次只改变主线 `9010` 的重复领取语义，没有放宽 CommonTaskMgr 的重复领取保护。

全量回归：

```powershell
npm test --prefix personal-server
```

结果：`2800` 项，pass `2798`、fail `0`、skipped `2`、cancelled `0`、todo `0`，退出码 `0`，耗时 `461209.8503ms`。

## 真实库副本验收

没有启停实时服务，也没有写入运行数据库。修复前的一致副本位于：

`analysis/experiments/private-server-20261025/p3/main-task-4-3-claim-fix-20261110/game-before-fix.local-only.sqlite`

- 大小：`1466368` 字节
- SHA256：`53FFC3B4B68CDD27A05C50669227D400F5066F6D12D132EA0192477C09FD0525`
- `PRAGMA integrity_check=ok`
- `PRAGMA user_version=18`

对副本执行修复和重放后的报告位于：

`analysis/experiments/private-server-20261025/p3/main-task-4-3-claim-fix-20261110/acceptance.local-only.json`

验收结果：

- 修复前第 0 槽为线性任务 `10002`，第 4 槽为 `10004`，领取记录为 `10001-10004`，资源 `157002=500`。
- 修复后第 0 槽恢复为空，第 4 槽保持 `10004`。
- 点击 `10003` 返回成功，任务为 `10004`，资源变化为空。
- 四条领取记录和资源 `157002=500` 均未变化。
- 关闭并重开副本后 `ensureLoginState().changed=false`，再次点击仍为幂等成功。

## 当前边界

修复代码只在新 worktree 分支完成和验证。实时服务仍加载修复前代码，运行数据库未被修复写入；要让当前客户端立即生效，需要另行备份运行数据库、部署该提交并重启服务，再由用户重新登录后做 APK 视觉验收。
