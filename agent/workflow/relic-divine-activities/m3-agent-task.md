# M3 子 agent 任务

工作目录：`F:\projects\FateCovenantClone\.worktree\relic-divine-activities`

完整阅读：

- 项目 `AGENTS.md`
- `docs/plans/relic-divine-activities/03-draw-routing.md`
- `docs/plans/relic-divine-activities/orchestrator-prompt.md`
- `personal-server/game/fantasy-equipment-inventory.mjs`
- `personal-server/test/fantasy-equipment-inventory.test.mjs`
- `personal-server/game/fantasy-draw-service.mjs`
- `personal-server/game/gateway.mjs` 的 601 路由和登录容器

禁止 reset/checkout/stash/clean 或覆盖任何未提交改动。M1 已通过总控复跑 10/10；M2 正并行修改 `fantasy-equipment-service.mjs` 和 `fantasy-draw-service.mjs`，不得与其并发修改相同文件。

## 独占文件

只可新增/修改：

- `personal-server/game/fantasy-shared-draw-service.mjs`
- `personal-server/game/artifact-draw-pool.mjs`
- `personal-server/game/demigod-draw-pool.mjs`
- `personal-server/game/resident-fantasy-draw-pool.mjs`
- `personal-server/test/fantasy-shared-draw-service.test.mjs`

禁止修改：`gateway.mjs`、`config/game-tables.mjs`、`fantasy-draw-service.mjs`、`fantasy-equipment-service.mjs`、M1 inventory、登录/推送文件及 M4/M5 文件。缺少表加载或 M2 seam 时记录为集成需求，不越界。

## 目标

实现标准 601 三池分流：圣器天池、神灵降世、常驻幻武。服务端权威决定消耗、概率、保底、轮次、奖励、任务进度和库存；任何客户端提交的奖励、概率、消耗、抽中 tid、保底结果一律不信任。

提供稳定接口，供 M6 接线：

- `supports601(drawLib)`
- `execute601(request)`
- 事务提交后推送事件描述

三池映射依据：

- 圣器：`ArtifactDrawVersion.draw_lib`，当前 14 行，典型 181/183/184/185/186/187/188/189/192/193/194/196/198/199。
- 神灵：`DemigodDraw.draw_lib`，严格按当前活动版本的 `DemigodAct`/Draw 行收敛，不得把全部表行无版本区别地开放。
- 常驻幻武：`FantasyDrawNormal` 与常驻 draw 配置；已有 87617/87618 不得重写回退。

每个池必须验证：

- draw_lib 已注册且唯一映射，冲突/未知拒绝。
- 活动窗口、版本、开放时间、用户等级/前置；关闭状态拒绝。
- 单抽和允许的连抽数量；负数、0、异常大数量拒绝。
- 券/钻石等消耗优先级有表或客户端证据，资源不足完整回滚。
- 服务端权威概率权重、普通保底、全保底、心愿命中、轮次和版本累计。
- RNG 服务端决定、可注入测试，不接受客户端种子或结果。
- 抽中幻武时同事务通过 M1 `create`/`addRaw` 落模块 518；raw 与实例不可混淆。
- 任务累计、心愿命中、轮次奖励幂等；同事务写资源、任务、活动状态、库存和抽数累计。
- 失败/编码/SQLite 异常全部回滚。
- 重启后抽数、保底、轮次、心愿、任务和库存恢复；若 RNG 状态需要持久化也落库。

## 状态存储

不得只保存在内存。优先使用现有 SQLite 机制：模块 518 的第 2 块只存 `pb_fantasy_draw`，其他活动状态可放活动登录容器字节（将来由 M6 注册）或新增独立 SQLite 表/JSON 状态文件，但必须在 `store.transaction()` 内保存，且不能覆盖模块 518 第 0/1/2 块。若当前服务没有合适的持久化表，可新增迁移表；不得修改 `gateway.mjs`。

M6 会负责真实登录容器和命令路由。M3 只提供可测试的服务对象、schema 契约和事件。

## 测试与交接

测试文件必须覆盖三个池的正常单抽/连抽 PB、伪造参数、错误 draw_lib、关闭/错误版本、资源不足、概率与保底阈值边界、心愿、轮次只发一次、并发/重复、编码/SQLite 异常回滚、重启恢复，以及模块 518 三块不丢失。

完成后运行：

```powershell
cd personal-server
node --check game/fantasy-shared-draw-service.mjs
node --test test/fantasy-shared-draw-service.test.mjs
npm test
git diff --check
```

返回：改动文件、`supports601`/`execute601` 精确签名、每池 schema/错误码/状态字段、表与字节码证据、测试实数、未验证假设、M6 插线要求。不要 commit/push/merge，不操作设备。持续工作到完整实现。
