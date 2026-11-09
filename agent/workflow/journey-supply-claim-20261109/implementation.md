# 旅途补给领取“橘屋参数出错”修复（2026-11-09）

## 证据与根因

- 实时事件显示，用户点击旅途补给时客户端发送 `506 req_inner_box_award`，服务端连续返回 `code=1`、`Mission data changed; retry box claim`。同一时段没有 `88201/88202` 请求；客户端把 506 的通用失败提示映射成了“橘屋参数出错”。
- 实时库只读核对：模块 8 内持久化的体力槽为 `130 / produce_time=1794002494`，资源表中的体力及登录物化值为 `185 / produce_time=1794198833`。`store.state()` 会把资源表的最新体力投影到模块 8 的动态槽位 2。
- 旧 `prepareBoxClaim()` 占用了整个模块 8 作为期望快照；事务重新读取后，仅动态体力槽不同也会被判定为任务数据变化。任务游标、领取位图和相关资源实际没有变化。

## 实现

- `prepareBoxClaim()` 只保存被领取逻辑消费的 `pb_mission` 首槽原始字节快照。
- `applyBoxClaim()` 仍比较首槽字节：任务游标、通关计数或补给位图并发变化时继续拒绝并回滚；时间恢复导致的模块 8 体力槽变化不再影响领取。
- 新增两条回归用例：动态体力槽变化时领取成功；首槽任务数据变化时仍返回 `Mission data changed`。

## 验证

- 修复前回归用例稳定复现 `code=1, Mission data changed; retry box claim`。
- 补给、509 一键章节奖励和真实 TCP 网关相关测试：44 项全部通过。
- `node --check` 与 `git diff --check` 通过。
- 全量 `npm test`：2782 项，pass 2780、fail 0、skipped 2；日志 `analysis/test-runs/journey-supply-claim-20261109/full.log`。

## 边界

本轮在 worktree `fix/journey-supply-claim-20261109` 完成代码和测试。尚未重启实时服务、修改实时数据库或操作 APK；部署该分支并重新登录后，才可在现有客户端再次验证补给领取。
