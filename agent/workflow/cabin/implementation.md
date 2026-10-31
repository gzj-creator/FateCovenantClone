# 船舱实现任务卡

状态：待执行。分支：`feature/system-cabin-20261031`。

## 已知入口

- module 114 名称为“船舱”，manager 为 `CampsiteMgr`，客户端目录为 `project/campsite`。

## 必做调查

1. 从 `CampsiteMgr`、对应 Cmd/UI、protobuf、配置表和登录 module 114 提取全部请求及响应。
2. 列出房间/设施、任务、交互、领取、升级或加速等可见操作及其证据状态。
3. 确认时间、解锁、资源、奖励和持久化字段。

## 实现与验收

1. 实现证据充分的全部操作，未知规则明确拒绝。
2. 覆盖防重、时间边界、资源不足、事务回滚、SQLite 重开、登录 module 114 重建和临时 TCP。
3. worktree 全量测试通过。
4. 完成后更新本文件和独立实现文档。

