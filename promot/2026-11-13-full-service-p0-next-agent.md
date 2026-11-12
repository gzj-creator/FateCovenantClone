# 2026-11-13 全功能 P0 跨机器续接提示词

把下面整段交给新机器上的 coding agent。

```text
你接手 FateCovenantClone 的全功能 P0 工作。先读取项目根目录 AGENTS.md，再完整读取：

- docs/plans/full-service-design-20261112.md
- docs/plans/ops-level-open-rules-20261112.md
- docs/plans/full-service-p0-progress-20261112.md
- docs/plans/full-service-p0-handoff-20261113.md

工作目录：F:\projects\FateCovenantClone（新机器按实际盘符调整）。
上一轮 worktree 是 .worktree/full-service-p0-20261112，分支 feat/full-service-p0-20261112，已按用户要求合入 main 并推送。先执行 git fetch && git pull，确认 main 包含交接文档中记录的提交。

任务：继续逐项完成 plans 下的全功能计划。新工作必须新建独立 worktree（建议 .worktree/full-service-p1-<日期>），不要直接在 main 上开发。每完成一项，立即更新 docs/plans/full-service-p0-progress-20261112.md 或新建后续进度文档，并用 [x]/[~]/[!] 区分完成、部分完成和证据缺口。

当前已完成：
- 统一时间基准、业务日 serverDayNumber、唯一角色经验入口。
- 功能开放规则引擎、fun_open_override 运营覆盖、审计和登录下发屏蔽。
- 活动生命周期引擎、activity_instance/override/settlement/audit、每分钟调度、结算前 SQLite 备份和失败重试。
- 管理端“活动与开放”页：预演、写入、二次确认、撤销。
- 1407 条命令目录、启动对账、写拒绝/读空态门禁，已有真实 TCP 测试。
- 测试分层：npm test 为快速套件，约 43 文件/15 秒；npm run test:slow 与 npm run test:all 分离。

继续顺序：
1. 取证 E9-1（客户端 FunOpen 表）和 E9-2（命令→功能 id 映射），生成 config/fun-open-rules.json、补 config/command-gate-rules.json，复核 command-catalog.json 的 access 初值。
2. 给活动家族实现统一 settle 接口，接 T8/T9/T10/T13：榜单、邮件补发、专属货币、跨期计数。
3. 把活动运行时结果接回模块 92/183，补 E9-4 推送类型后的在线同步。
4. 完成 P0-2-3：事件总线、role.levelUp 订阅、属性/战力缓存失效、事务后推送。
5. 完成剩余 P0 横切项：连接上限配置、推送目标强制为角色/公会/全服、命令注册表与实际 supports 覆盖对账。
6. 全量验证通过后再进入 P1 属性管线和战斗。

约束：
- 证据缺失时 fail closed；不要用空包、固定值、猜测奖励销项。
- 默认不启停线上服务、不读写线上数据库、不操作模拟器/ADB/APK；需要时先向用户说明并取得明确授权。
- 每轮先跑 npm test；改慢链路再跑对应 npm run test:slow 或 test:all。
- 提交前更新 CHANGELOG；完成一项就更新进度文档。
- 用户要求节省 token，报告简洁，说明已完成项、验证结果、剩余项。
```

