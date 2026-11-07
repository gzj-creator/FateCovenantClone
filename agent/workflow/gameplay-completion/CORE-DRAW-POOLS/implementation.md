# CORE-DRAW-POOLS 生产奖池复核与证据缺口

日期：2026-11-07。分支：`task/CORE-DRAW-POOLS-20261106`。提交前已 rebase 至 `main@d252af1`。

状态：**证据待补；已有圣器生产路径复核通过**。本次没有补造 resolver、奖池成员、权重或任务。常驻幻武与神灵的空组仍被生产路径拒绝，不将缺少奖励配置推断为客户端本版本无入口。

## 配置事实

可重现的完整映射与七份解压后资产的字节数/SHA256 保存在 [config-audit.json](config-audit.json)。报告仅含静态配置，不读取角色存档、运行数据库或密钥。

| 范围 | 生产加载结果 | 本次结论 |
| --- | --- | --- |
| 圣器 `ArtifactDrawVersion` | 14 版本、14 个 `draw_lib`、25 个唯一 `DrawGroup`；25 组均有 `lib_range` | 现有 `601` 服务路径可用，本次逐版本复核正常抽取、保底、消耗、回包及重开恢复 |
| 常驻幻武 `226` | `group_weight=169`，普通组 `[[300,60101],[9700,60102]]`，保底组 `[60101]`；两个 `lib_range=[]` | 缺成员、数量及组内权重，不能用已解锁装备或 `lucky_value` 代替 |
| 神灵 `DemigodDraw` | 38 版本、26 个 `draw_lib`、56 个唯一组；56 组存在但全部 `lib_range=[]` | 逐版本返回配置错误 `5`，不扣资源、不创建实体或计数 |
| 幻武任务 `88932` | `loadFantasyActTables().Task` 与 `FantasyEquipActTask` 均为 0 行 | 真 TCP 返回 `306`；仍需实际任务/版本或客户端无入口证据 |

常驻幻武的已知周边配置仍保留：`Guaranteed[103].guaranteed_num=40`；`FantasyDrawNormal.wish_ratio=[5000,10000]`；四个心愿槽在 100 抽解锁，23 个 `DrawUnlock` 候选。现有表只证明这些字段，不能补全两个奖励组，亦不能证明多心愿选择和心愿覆盖发生阶段。现有心愿/UID 组件测试使用注入奖励组，未被本次生产完成结论引用。

神灵组的版本归属、完整 56 组 ID 和每版本空组原因见报告 `demigod.unavailableVersions`；不能把 `DemigodDrawFantasy.draw_fantasy` 的展示候选或 `DemigodDrawAward` 的次数奖励当成组内随机权重。同一库跨版本的歧义仍由既有 `resolveVersion` 和活动时间门禁收敛，没有扩大路由集合。

## 变更

- 新增只读 `game/draw-pool-audit.mjs` 和命令 `scripts/audit-draw-pools.mjs`，输出精确版本、库、组、空配置及可核查资产摘要；无存档副作用。
- 新增生产配置专项 `test/draw-pool-production.test.mjs`。不传 `resolveGroup`，14 个圣器池都通过连续正常抽取走到确切保底并核对资源；38 个神灵版本和 `226` 验证失败前后完整角色状态不变；另验证响应编码与 SQLite 提交失败整体回滚。
- 扩展 `test/relic-divine-gateway.test.mjs`：真实 loopback 握手/登录后，不传 `relicDrawGroupResolver`，验证 `601` 圣器普通抽取、确切保底及 `7001` 推送，空池和无任务的错误码、失败无变更，以及 SQLite 重开后的计数与资源。
- `gateway.mjs`、`game-store.mjs` 和所有业务 draw resolver 均无修改；207 结算/体力、邮件、活动期限、module 8/90 与其它路由保留。没有启停实时服务、操作 ADB/APK 或运行库。

## 复现与验证

在项目 `personal-server/` 目录执行：

```powershell
npm ci
node scripts/audit-draw-pools.mjs --output ../agent/workflow/gameplay-completion/CORE-DRAW-POOLS/config-audit.json
node --test --test-concurrency=1 test/draw-pool-production.test.mjs test/fantasy-shared-draw-service.test.mjs test/fantasy-draw-service.test.mjs test/relic-divine-gateway.test.mjs test/artifact-draw-act-service.test.mjs test/fantasy-act-shared-service.test.mjs test/demigod-act-service.test.mjs test/fantasy-equip-act-service.test.mjs test/recruit-service.test.mjs
```

结果：**102 tests / 102 pass / 0 fail / 0 skipped**。其中新生产专项 4 项、真 TCP 专项新增 1 项，相关旧测试 97 项。rebase 最新 main 后配置/TCP 专项再次 7/7 通过。最初独立 worktree 未安装 `protobufjs`，`npm ci` 后已解决；首次 TCP 新断言将 PB 默认零值的缺省字段视为 `undefined`，已按协议默认零修正后通过。

最新 main 上的配置/TCP 复核日志：`analysis/test-runs/gameplay-20261106/core-draw-pools-production-20261107.log`（项目主目录，仅本地分析产物）。

验收层级：组件、临时 TCP、临时 SQLite、故障回滚和重开通过。TCP 使用项目现有 `all-open` 模式，并通过已有活动选择参数固定 `159001/102018/74001`，只固定版本与随机数，未注入奖励配置。临时目录在测试收尾删除；这不是当前实时服务的部署验收或 APK/UI 验收。

## 剩余交付

1. 取得常驻 `60101/60102` 与神灵 56 组的真实奖励数量及组内权重，绑定到相同资产版本后才能补生产 resolver。
2. 取得常驻多心愿选择与替换阶段、神灵心愿率与保底重置语义的证据。现有空组不可用于证明这些规则完整。
3. 取得幻武活动任务和版本配置，或可核查的当前客户端无入口证据；目前保持 `88932` 明确拒绝。
4. 有证据配置可执行后，再安排真实隔离 APK 的展示、资源、推送与重登验收。当前没有生成新 APK 快照。
