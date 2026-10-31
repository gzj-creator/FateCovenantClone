# M3：标准 `601` 三池抽卡服务

## 目标

扩展现有 `601` 招募入口，按 `pb_draw_hero.draw_lib` 分流到圣器天池、神灵降世和常驻幻武池。抽卡规则、消耗、概率、保底、轮次、奖励、库存和任务进度全部由服务端决定。

## 独占文件

建议新增：

- `personal-server/game/fantasy-shared-draw-service.mjs`
- `personal-server/game/artifact-draw-pool.mjs`
- `personal-server/game/demigod-draw-pool.mjs`
- `personal-server/game/resident-fantasy-draw-pool.mjs`
- `personal-server/test/fantasy-shared-draw-service.test.mjs`

可修改 `config/game-tables.mjs` 中本模块需要的表加载项和现有 `fantasy-draw-service.mjs`。依赖 M1、M2。不要修改 `gateway.mjs`；由 M6 接线。

## 分流证据

- 请求 schema：`pb_draw_hero { draw_lib, draw_type, point_draw_num, extra_param, specify_item_tid }`
- 圣器天池：`ArtifactDrawVersion.draw_lib`，当前证据包含 `181/183/...`
- 神灵降世：`DemigodDraw.draw_lib`，当前证据包含 `80/81/82/...`
- 常驻幻武池：`HeroTable.Draw.TID_DEMIGOD_DRAW_RESIDENT`
- 客户端只提交池类型/抽数/指定项；不得接受客户端奖励、概率、消耗、保底结果或抽中 tid。

## 配套表

圣器：

- `ArtifactDrawActTable`: `ArtifactDrawRate/Round/Task/Version/Const/Gift`
- `TrialsBuff/Task/Challenge/RankAward/Version`

神灵：

- `DemigodActTable`: `Shop/Show/DrawWish/Draw/DrawFantasy/DrawAward/Gift/DemigodAct`
- `DemigodTrialDamage/Bless/Star/Level/Trial`

常驻幻武：

- `FantasyEquipTable`: `DrawNormal/DrawNormalWish/DrawUnlock/Const/QualityUp/StarUp/SpStarUp/Material`
- `ItemTable.Chip`
- `HeroTable.Draw.TID_DEMIGOD_DRAW_RESIDENT`

其他证据：`MiniGameTable.data.json` 及活动任务表。

## 服务端流程

单次抽卡在同一个 SQLite 事务内完成：

1. 校验 `draw_lib` 已注册且唯一映射到一个池；校验活动窗口、活动版本、池开放时间、用户等级/前置。
2. 校验抽数 `1` 或该池允许的连抽数；拒绝负数和异常大数量。
3. 由服务端选择消耗：抽卡券优先/钻石兜底等规则必须有表或客户端证据；校验资源充足。
4. 读取并推进该用户该池的概率、普通保底、全保底、心愿命中、轮次和版本累计。
5. 使用确定性但不可由客户端控制的 RNG；测试可注入 RNG，生产不能使用客户端种子。
6. 从配置表抽取奖励，处理保底替换、轮次结算和重复奖励规则。
7. 同事务发放资源、任务进度、活动状态、模块 518 幻武库存和抽数累计。
8. 构造与 `601`/池相应的响应；任何异常使资源、库存、任务和活动状态全部回滚。
9. 事务提交后按 M6 的推送契约发送对应活动更新。

## 必须明确并测试的规则

- 三个池的 `draw_lib` 映射范围；未登记版本必须拒绝。
- 单抽/十连或其它允许值。
- 免费/券/钻石消耗优先级，以及并发扣费。
- 概率总权重、空权重、配置错误和边界值。
- 普通保底、全保底、心愿保底和轮次边界：`0`、`1`、阈值-1、阈值、阈值+1。
- 轮次奖励只发一次，跨轮次后进度正确回退/清零。
- 抽到幻武时创建实例；raw 与实例不能混淆。
- 活动任务累计抽数、任务阶段、心愿命中次数和奖励幂等。
- 活动关闭前已开始/重连/重复请求的行为。
- 服务重启后 RNG 以外的所有状态恢复一致；若需要持久化 RNG 状态也必须落库。

## 测试门槛

- 每个池至少一组正常单抽、连抽、正确回包和库存结果。
- 客户端伪造奖励/抽数/概率/消耗无效。
- 活动未开放、错误版本、未解锁、资源不足全部回滚。
- 概率边界、保底阈值、心愿和轮次边界。
- 并发请求不超扣、不重复发奖、不分配重复装备 UID。
- 编码/SQLite 异常回滚。
- 重启恢复抽数、保底、轮次、任务和库存。
- 模块 518 第 0/1/2 块与其它活动容器互不覆盖。

## 完成标准

- 三种池都可从 `601` 服务入口路由，不依赖 APK 传来的结果。
- 池服务向 M6 提供稳定的 `supports601(drawLib)`、`execute601(request)` 和推送事件描述。
- 当前无法由静态证据确认的字段必须标为假设，不能伪造配置语义。
