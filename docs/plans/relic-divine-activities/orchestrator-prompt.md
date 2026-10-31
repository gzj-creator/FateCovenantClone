# 新根 agent 提示词

下面整段可直接交给新的根 agent。它是执行提示词，不是当前 agent 的自我指令。

```text
你在独立 worktree 中负责完成《命运圣契》服务端的“圣器天池”和“神灵降世”活动全部接口及相关模块。你是总控 agent；用户明确要求把各计划模块交给子 agent 执行，你来拆分、审查、整合和最终验收。不要只停在计划或几个接口。

工作位置：
- worktree：F:\projects\FateCovenantClone\.worktree\relic-divine-activities
- 分支：feature/relic-divine-activities
- 基线 HEAD：45c0b21

开始前必须：
1. 阅读 F:\projects\FateCovenantClone\AGENTS.md 和 worktree 下所有适用的 AGENTS.md。
2. 阅读 docs/plans/relic-divine-activities/README.md 以及 01–07 全部计划。
3. 执行 git status --short、git diff、git diff --stat，记录并保留所有现有未提交改动。不得 reset、checkout、stash、清理、覆盖或回退；发现无关改动时保留并忽略。
4. 阅读相关 Proto、agent/workflow/interface-catalog/static-schemas.json、tcp-commands.md、server-pushes.md、现有 gateway/SQLite/编解码/事务实现和证据表。

当前未提交文件必须在任何子 agent 动工前登记为基线；至少包括：
- personal-server/config/game-tables.mjs
- personal-server/game/gateway.mjs
- personal-server/game/fantasy-draw-service.mjs
- personal-server/game/fantasy-equipment-inventory.mjs
- personal-server/game/fantasy-equipment-service.mjs
- personal-server/test/fantasy-draw-service.test.mjs

执行方式：
- 采用计划中的 M1 → M2/M3 → M4/M5 → M6 → M7 依赖顺序。
- 使用子 agent 执行各模块，但同一时刻最多 4 个活动 agent。
- 每个子 agent 只拿到一个计划文件或其明确子范围，并收到“文件所有权、依赖关系、不得推送/合并、不得操作原版包”的约束。
- 同一共享文件只能有一个写者；gateway.mjs、game-tables.mjs、模块容器和推送集成由 M6 agent 独占。其它模块先暴露稳定接口，不并行改网关。
- 子 agent 完成后，你亲自检查 git diff、实现是否为空壳、证据是否足够，并重跑其专项测试；不能只信子 agent 的口头完成报告。
- 发现规则证据不足时，先查 bytecode/Proto/表；不得用猜测填字段。把未确认项写入文档和模块交接，并继续做可独立验证的工作。

业务范围：
- M1：模块 518 共享幻武库存；所有创建、删除、升级、突破、升星、合成、穿戴、卸下、复制和奖励必须通过该层。
- M2：87601、87603–87611、87613–87618 全部业务；保留并修正已有 87617/87618，不从头重写。
- M3：标准 601 按 draw_lib 分流到圣器天池、神灵降世、常驻幻武池；服务端完成活动窗口、消耗、概率、保底/轮次、奖励、库存、累计/任务、回包和推送。
- M4：101801–101806 圣器活动接口、任务、试炼、翻牌、新一轮、奖励、合成。
- M5：98301–98308 与 88922/88924/88927–88932；共享日弹珠、大奖弹珠、心愿、投票、试炼、穿戴、祝福、复制和抽卡任务。
- M6：登录容器、网关、请求/响应和推送 7001/9160/10101；模块顺序兼容，特别保留模块 518 第 0 块 pb_fantasy_equip_res、第 1 块 pb_fantasy_formation_list、第 2 块 pb_fantasy_draw。
- M7：专项、npm test、真实 TCP，再单独做隔离 APK/UI 验收。

工程约束：
- 所有写状态均在 SQLite 事务内；资源、库存、任务、领奖、英雄/编队和模块状态同事务，异常全回滚。
- 不信任客户端奖励、概率、消耗、成本列表、次数、伤害或 over_value；请求只表达意图。
- 业务状态不能只放内存；每日刷新、终身上限、保底、轮次、心愿、任务和装备必须重启恢复。
- PB 字段顺序使用现有 codec 和 Schema，不手写不一致的 protobuf。
- ETF 按实际结构解析，不把重复字段或嵌套消息误降为单个整数。
- 每个命令覆盖正常、非法 ID/数量、伪造参数、资源不足、上限、活动关闭、重复/并发、事务异常、重启持久化和正确 PB 回包。
- 每完成大模块更新 agent/workflow/relic-divine-activities/implementation.md，并区分组件测试、真实 TCP、APK/UI。
- 最终必须运行 `cd F:\projects\FateCovenantClone\.worktree\relic-divine-activities\personal-server; npm test`，记录总数、通过数和失败数。

设备限制：
- 真实 APK 测试必须单独记录，不能由 TCP 测试替代。
- 只可使用隔离客户端 com.jzyx.ps，ADB 只用 E:\Mumu\MuMuPlayer\nx_main\adb.exe -s 127.0.0.1:16448。
- 不得操作原版 com.jzyx.my。用户正在游玩时，不擅自停应用、点击界面或改路由；需要界面操作时先取得用户配合或明确授权。
- 未通过真实验收不得同步 apk/ 快照，不得更新为可用构建，不得提交 APK。

最终交付：
- 所有列表内接口和关联模块完成，不留空壳。
- 共享库存和两个活动的重叠逻辑只有权威实现。
- 模块 518 其它二进制块不丢失，登录状态和推送可恢复。
- 专项测试和 npm test 通过，真实 TCP 与 APK/UI 结果分别记录。
- implementation.md 写明接口/Proto 证据、表来源、实现范围、测试结果、TCP/APK 结果、假设和遗留项。
- 只有全部接口、关联模块、全量测试和真实 APK/UI 验收均完成，才可称“圣器天池和神灵降世可玩验收完成”。

不要 push、merge，不要 reset/checkout/stash 任何已有改动，不要操作原游戏包，不要失败后谎报可玩完成。持续执行到任务真正完成；需要用户亲自点界面时，先把其余可验证工作全部做完，再给出具体、最小化的 APK/UI 验收步骤。
```
