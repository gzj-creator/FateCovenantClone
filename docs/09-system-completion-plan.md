# 图鉴与后期系统补全执行计划

更新：2026-10-31。目标是在独立 worktree 中补齐图鉴剩余操作，以及团员名册、法阵、星魂卷轴、训练、船舱和时空神殿的服务端协议与持久化闭环。当前阶段只做代码、组件测试、临时 TCP/SQLite 集成和文档，不部署运行服务、不操作模拟器、不点击 APK，也不生成或替换 APK 快照。

## 基线与边界

- 集成基线为 `main`；本轮开始前 `npm test --prefix personal-server` 为 295/295 通过。
- 一个功能使用一个独立分支和 worktree，并由一个专属 agent 负责该功能。最多同时运行两个模块 agent；完成、审查并记录后，再启动下一批。
- 每个 worktree 从当时的集成 `main` 创建。分支命名使用 `feature/system-<slug>-20261031`，worktree 使用 `.worktree/system-<slug>-20261031`。
- 并行模块不得直接写运行数据库、运行事件、APK、设备、正式服务或 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/`。
- 所有业务成功必须基于现有客户端 schema、Lua Cmd、配置表、登录模块或已观察请求/回包；证据不足的分支明确拒绝，不得用空成功或推测奖励伪装完成。
- 每个模块先形成“界面入口 → Cmd type → 请求 schema → 响应/推送 schema → 登录模块 → 配置/资源 → 存档字段”的证据表，再实现。
- 每个模块至少覆盖成功、幂等/防重、非法输入、资源不足或条件不满足、事务回滚、SQLite 重开；有登录态变化时还必须反向解码真实登录 ETF。涉及网关路由时增加临时 TCP 测试，确认不会落为 `LOCAL_NOT_IMPLEMENTED`。
- 每个模块完成后必须更新自己的任务文档，并提交实现、测试、证据结论和未覆盖边界。根 agent 负责逐项审查、合并、全量测试和最终验收分级。

## 模块队列

| 顺序 | 功能 | 任务卡 | 已知入口或候选模块 | 本轮完成条件 |
| ---: | --- | --- | --- | --- |
| 1 | 图鉴 | [英雄图鉴](../agent/workflow/hero-handbook/remaining-scope.md) | `10009`；父登录 module 10 slot 3；已有点亮实现 | 补齐可见的升级、一键升级、拥有奖励领取及其他全部可确认操作，状态跨重开保留 |
| 2 | 团员名册 | [团员名册](../agent/workflow/member-roster/implementation.md) | 先从客户端 UI/Cmd/Lua 确认具体 manager 与 module | 全部可确认的读取、激活、升级或领取操作闭环；无法确认入口时提交证据化阻塞记录 |
| 3 | 法阵 | [法阵](../agent/workflow/battle-array/implementation.md) | 从 `Cmd`、`Array`/`Formation`/`MagicCircle` 类候选和配置交叉确认 | 选择、装配、激活/升级、效果状态及登录恢复全部按证据实现 |
| 4 | 星魂卷轴 | [星魂卷轴](../agent/workflow/soul-scroll/implementation.md) | 从卷轴、星魂、Soul/Handbook 类候选交叉确认 | 图谱/节点、激活、奖励和持久化闭环；不明奖励不伪造 |
| 5 | 训练 | [训练](../agent/workflow/training/implementation.md) | 优先核对 `SpecialTrain`、`Train`、训练配置与 Cmd | 训练等级、派遣/领取或升级等全部可确认操作与登录同步 |
| 6 | 船舱 | [船舱](../agent/workflow/cabin/implementation.md) | module 114 `CampsiteMgr`，`project/campsite` | 登录数据、房间/任务/交互、领取或升级的可证实子集完整闭环 |
| 7 | 时空神殿 | [时空神殿](../agent/workflow/time-temple/implementation.md) | module 159 `TimeTempleMgr`，`project/time_temple` | 神殿读取、抽取/激活/升级/领取的全部可确认操作及持久化 |

## Agent 交付格式

每项交付必须包含：

1. 证据：文件路径、来源类型、命令或模块号、schema、配置键和关键限制。
2. 实现：改动文件、业务规则、存档迁移、事务边界及显式拒绝条件。
3. 测试：专项命令、真实网关/TCP 覆盖、SQLite 重开、全量 `npm test` 结果。
4. 验收分级：组件、临时集成、APK 实测和用户视觉验收必须分开；没有更高层证据时只能声明较低层级。
5. 边界：仍不可实现的请求、缺失配置、未观察字段和需要设备取证的下一步。

## 整体验收

根 agent 逐模块执行以下检查：

1. 确认任务卡中的证据链与实际实现一致，拒绝用名称相似度代替协议证据。
2. 审阅事务、防重、登录重建、schema 迁移和显式错误路径。
3. 在功能 worktree 运行专项测试和全量测试，再依次合入 `main`，每次合并后重跑全量测试。
4. 多个模块同时修改登录 ETF 或共享 service 时，另行做联合登录回包测试，防止各自通过但组合后覆盖彼此。
5. 全部编码和测试完成后再决定是否部署及真实 APK 验收；部署和 APK 验收属于后续独立授权步骤。

