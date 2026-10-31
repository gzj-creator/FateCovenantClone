# 图鉴与后期系统补全执行计划

更新：2026-11-01。七个模块已在独立 worktree 中完成有客户端证据的部分、专项测试和模块文档，并合成 `feature/system-integration-20261031`。最终合并态全量测试 402/402。验收仍止于代码、组件、真实登录 ETF、临时 TCP/SQLite；本轮不部署运行服务、不操作模拟器、不点击 APK，也不生成或替换 APK 快照。

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

## 完成状态（2026-11-01）

| 功能 | 自动判定的映射 | 实现提交 | 结果 | 明确边界 |
| --- | --- | --- | --- | --- |
| 英雄图鉴 | module 10 slot 3；644/645/655 | `33dbd1a` | 点亮、升级、一键升级、拥有位图、登录同步 | 655 UI 入口未观察到；属性重算未实现 |
| 团员名册 | module 24；21005/21006/21010/21007；推送 2305 | `f4277a7`、`a5413c4` | 查询、任免、转让、踢人、退出、CAS 事务 | 公会 fixture 和部分规则待原服证据 |
| 法阵 | module 157；90401–90405 | `83706ec` | 登录、升级、突破、升星、激活、重置 | 不计算战斗效果；不推断重置退款 |
| 星魂卷轴 | module 156；90201–90204 | `13a2b40`、`4a8c5db` | 抽签、替换、升级、学习和持久化 | 静态协议，需 APK 核对资源/经验/UI |
| 训练 | module 10 slot 4；646/649/653 | `fc5301c` | 送礼、游玩、每日限制、等级奖励 | 部分业务规则和错误文案待动态证据 |
| 船舱 | module 114；83201/83202 | `6bfe607` | 格子解锁、上阵/替换/下阵、原子换位 | 房间升级、任务、交互、加速无协议证据 |
| 时空神殿 | module 159；S2C 7801 | `2a5817f` | 登录空态和抽取推送载荷 | 8 个 C2S 数字命令缺失，业务模块阻塞 |

联合登录回包、逐模块测试数以[整体验收](../agent/workflow/system-completion/acceptance.md)为准。七模块组合已经过临时 SQLite 重开，module 10 slot 3/slot 4 与其他登录模块互不覆盖。

## Agent 交付格式

每项交付必须包含：

1. 证据：文件路径、来源类型、命令或模块号、schema、配置键和关键限制。
2. 实现：改动文件、业务规则、存档迁移、事务边界及显式拒绝条件。
3. 测试：专项命令、真实网关/TCP 覆盖、SQLite 重开、全量 `npm test` 结果。
4. 验收分级：组件、临时集成、APK 实测和用户视觉验收必须分开；没有更高层证据时只能声明较低层级。
5. 边界：仍不可实现的请求、缺失配置、未观察字段和需要设备取证的下一步。

## 整体验收（已完成本轮范围）

根 agent 逐模块执行以下检查：

1. 确认任务卡中的证据链与实际实现一致，拒绝用名称相似度代替协议证据。
2. 审阅事务、防重、登录重建、schema 迁移和显式错误路径。
3. 在各功能 worktree 运行专项和全量测试，再合入集成分支；集成分支吸收最新 `main` 后运行全量测试。
4. 多个模块同时修改登录 ETF 或共享 service 时，另行做联合登录回包测试，防止各自通过但组合后覆盖彼此。
5. 本轮已完成编码、临时集成和文档；部署、真实 APK 和视觉验收属于后续独立步骤。

最终检查记录：[模块整体验收](../agent/workflow/system-completion/acceptance.md)。当前唯一协议硬阻塞是时空神殿 8 个 C2S 请求缺数字命令映射；其他模块未覆盖项已在各自实现文档逐项列出，不得当作已经可玩。

