# 2026-11-15 R1 全量实施 Agent 提示词

状态：基于 `R1-20261115` 的交接稿。用户可把“通用提示词”与任一“批次提示词”一并交给实施 agent；全部批次完成后，再把“最终验收提示词”交给验收 agent。

当前工作树已有大量未提交的 R1 文档、离线工具和实现改动。新 agent 不得从旧 `main` 重建一份缺少这些文件的干净基线，也不得覆盖其他任务留下的改动。若没有用户明确指定的 worktree，先在原工作树执行 `git status --short --branch` 并保留现有改动。

## 1. 通用提示词

```text
你接手 FateCovenantClone 的 R1 全量实施工作。项目根目录为 F:\projects\FateCovenantClone（其他机器按实际路径调整）。

开始前必须按顺序完整读取：
1. AGENTS.md；
2. docs/gameplay-operations/12-final-rule-baseline.md；
3. docs/gameplay-operations/rules/final-rule-register.md；
4. 本次任务涉及的 docs/gameplay-operations/system-rulebooks/ 或 activity-rulebooks/ 具体章节；
5. docs/gameplay-operations/rules/unresolved.md；
6. docs/gameplay-operations/11-project-roadmap.md；
7. docs/gameplay-operations/09-defects-and-acceptance.md；
8. 当前任务已有 agent/workflow/ 实施记录和相关 analysis/ 证据。

有效规则只有 R1 及逐任务最终裁定。旧计划、当前源码、调查报告中的通用 defaults、旧 fixture、兼容常数都不能覆盖 R1；它们只能作为实现差异或历史证据。原证据、R1显式推定、工程兼容和具体受限动作必须分开标记。

先执行 git status --short --branch，核对并保留工作树已有改动。当前文件很可能未提交；不要假设 origin/main 或旧 worktree 包含 R1。需要独立 worktree 时，必须由用户明确指定或由父 agent 给出包含当前基线的路径；不要在未确认基线的情况下新建一个从旧 main 派生的 worktree。

工作目标：按 11-project-roadmap.md 的 WP01-WP20 与 final-rule-register.md 的 297 任务/1407 命令逐项实现可证分支，优先完成 09-defects-and-acceptance.md 中仍缺原始证据的 46 条命令。禁止把“已有路由”“有处理函数”“单项测试通过”当作玩法完成。

每条命令/分支实施前先建立证据记录：
- 原配置表、子表、具体行/字段和来源 SHA256；
- 同版 PB 请求/响应 schema；
- 客户端实际调用者和前置流程；
- 权威状态所有者、作用域、期号/实例键和登录同步 slot；
- 资格、成本、上限、奖励/返还、拒绝条件与重复请求语义；
- 结果如何投影到属性、技能、阵容、任务、排行、商城或客户端显示。

只有在原生产者、状态、成本、前驱、结果和必要返还消费者足以闭合某一具体动作时才实现成功路径。缺任一边界时，该动作必须在扣资源、置领取位、改次数、改对象或返回成功前以 GameError(5, 原因及 decisionId) 明确拒绝；查询、合法历史展示和已冻结权益按 R1 保留，不能被整族关闭或清空。没有原特定错误码证据时统一使用错误码 5。

实现要求：
- 校验、成本、奖励、统计、领取位、订单/票据和编码放在同一 SQLite 事务；编码、推送或资源处理器失败必须按原提交边界回滚或幂等补同步。
- 重复 request_id/领取键返回原结果或明确已完成，不重复扣款、抽奖、发奖或推进进度。
- 网关接线必须同时核对请求 ETF/直接 PB 外形、响应 schema、真实临时 TCP、登录初始化 slot、在线推送和重登。
- 未闭合 type 只从 r1-fail-closed-command-service.mjs 移出时，替换服务必须对已证动作成功、对未知/未闭合动作继续支付前拒绝；不能移除后落入泛化成功或通用 fallback。
- 新证据若与已冻结 R1 结果冲突，先提出 R2 版本、迁移和冻结实例兼容方案，禁止静默改已有规则或重算历史期。

本轮只改代码、配置、离线工具和临时测试库。默认不启停实时服务、不读写生产数据库、不操作模拟器/ADB/APK、不部署、不提交或替换 APK。若验收必须进行这些动作，先停止依赖步骤并向用户说明具体动作和原因。

每完成一条命令或一个完整动作链，立即更新：
- 对应 system/activity rulebook；
- docs/gameplay-operations/09-defects-and-acceptance.md；
- docs/gameplay-operations/rules/unresolved.md（仅当原证据债务确实关闭）；
- agent/workflow/rule-implementation-20261115/implementation.md 或新建的本轮记录；
- r1-fail-closed-command-service.mjs 的剩余 type 数量与原因；
- final-rule-register 相关决定（仅新证据升级规则时，按 R 版本升级程序）。

至少运行：
- 相关 node --test --test-concurrency=1 专项和真实临时 TCP；
- npm --prefix personal-server run check:command-dispatch；
- npm --prefix personal-server test；
- node tools/build-detailed-rule-docs.mjs --check；
- node tools/verify-detailed-rule-docs.mjs；
- git diff --check。

报告中必须分开写：原证据已闭合、R1推定、服务端完成、离线TCP完成、存档/重开完成、APK验收、生产部署。未实际执行的项目写“未验收”，不得用“应该可以”销项。
```

## 2. 46 条命令批次

四个批次的命令互不重叠。每批都应先附上通用提示词。若并行使用多个 agent，应分别使用用户明确提供的隔离 worktree；共享文件 `personal-server/game/gateway.mjs`、`r1-fail-closed-command-service.mjs`、命令审计配置和最终验收文档只能串行合并，并逐次重跑审计。

| 批次 | 任务组 | 命令数 |
| --- | --- | ---: |
| H1 | HERO-COMBATPOWER、HERO-FAVOURINTIMACY、HERO-HEROBLAZON | 9 |
| H2 | HERO-HEROLEGEND、HERO-INTELLI、HERO-LEASERSTARUP、HERO-LINEUPSNAPSHOT、HERO-NEWHEROEXCLUSIVE、HERO-TACTICS | 13 |
| I1 | ITEM-CAREERLIFE、ITEM-GROWTHTARGET、ITEM-PERIODTASK、ITEM-RESCOMPLETE、ITEM-TASKAWARD、ITEM-TASKGROUP | 11 |
| I2 | ITEM-HOOK、ITEM-LINEARLEVEL、ITEM-MYSTERYSHOP、ITEM-OPENSERVERBOX、ITEM-RESROLLBACK | 13 |

### 批次 H1：英雄战力、好感与纹章（9 条）

```text
执行 R1 的 HERO 批次 H1，只处理以下命令：
- HERO-COMBATPOWER：803；
- HERO-FAVOURINTIMACY：667、670、671；
- HERO-HEROBLAZON：88951、88953、88955、88956、88957。

重点读取并闭合：
- personal-server/game/r1-fail-closed-command-service.mjs 中上述 type 的当前原因；
- docs/gameplay-operations/system-rulebooks/heroes-equipment.md 的 combat-power-award、intimacy、hero-blazon 节；
- final-rule-register.md 对应决定；
- Hero/CombatPower/Favour/Intimacy/Blazon/Bond/Ability/Res/Item 等原表、同版 PB 与客户端 Mgr/Util/Cmd 消费者。

必须分开确定 803 的参数和出战前权威战力重算；667/670/671 的赠礼对象、Base 开放、阈值、两套周期、故事前驱和奖励；88951/88953/88955/88956/88957 的章节成本、材料转换/槽位、天赋预算、技能前驱与效果、重置返还以及羁绊目标/互斥。任何一项无法闭合时，只开放已证动作，并为缺失动作保留支付前失败关闭。不得用旧646好感规则、HeroBlazonDraw 概率表或固定返还推测新667/670/671、88951-88957。

完成后逐 type 移出通用失败关闭表并补专项、真实临时 TCP、登录同步/重开测试；更新 R1 验收表和 implementation 记录。若部分子动作仍缺证据，专项必须明确验证“已证动作成功、缺失动作 err5、资源与状态不变”。
```

### 批次 H2：英雄重置、快照与版本权益（13 条）

```text
执行 R1 的 HERO 批次 H2，只处理以下命令：
- HERO-HEROLEGEND：89801、89802、89803、89804；
- HERO-INTELLI：701、702；
- HERO-LEASERSTARUP：101202；
- HERO-LINEUPSNAPSHOT：87701、87702；
- HERO-NEWHEROEXCLUSIVE：88963、88964、88967；
- HERO-TACTICS：84502。

重点读取 heroes-equipment.md 的 hero-legend、intelli、leaser-star、lineup-snapshot、new-hero-exclusive、tactics 节，以及对应原表、同版客户端 Mgr/Cmd、PB、登录 slot 和现有服务。必须分别闭合：
- 89801-89804 的星/祝福/等级/阶段成本、上限、资格、效果投影；
- 701/702 的情报槽、候选池、刷新、起止时钟和奖励转移；
- 101202 的真实升级历史、Reset 行索引、原返还范围和权威初始星/品质；
- 87701/87702 的快照冻结身份、可见性、日界和引用清理；
- 88963/88964/88967 的版本候选、选择上限、剧情前驱、阵容资格和原奖励行；
- 84502 的真实重置范围、成本、返还公式和返还消费者。

快照必须读取已冻结历史，不能读取当前阵容冒充历史；负 roleId 只对已证机器人模板开放。重置类命令必须使用对象真实历史和原处理链，不得固定返钻、清空整族或修改同 tid 永久对象。未闭合的成功变更必须继续返回 err5；只读历史、合法旧权益和已冻结结果按 R1 展示。

完成后逐 type 移出通用失败关闭表并补专项、真实临时 TCP、SQLite 重开和登录投影；更新 R1 验收表、unresolved 文档与 implementation 记录。
```

### 批次 I1：任务、成长与周期奖励（11 条）

```text
执行 R1 的 ITEM 批次 I1，只处理以下命令：
- ITEM-CAREERLIFE：85804；
- ITEM-GROWTHTARGET：69006、69007；
- ITEM-PERIODTASK：101301、101302、101303；
- ITEM-RESCOMPLETE：288；
- ITEM-TASKAWARD：69101、69102；
- ITEM-TASKGROUP：84901、84902。

重点读取 economy-tasks-shops.md 的 career-life、growth-target、period-task、res-complete、task-award、task-group 节，以及原 Task/Progress/Award/Group/GroupFunc/Story/Res 表、同版 PB 和实际生产者。必须建立每族的 version、实例/期号、任务、阶段、分数、进度奖、任务奖、领取位和逾期资格映射。

任务进度只能由真实服务端事件产生；显示、领奖或打开页面不能自造进度。GrowthTarget、TaskAward、TaskGroup、PeriodTask 不得互相借版本、奖励或完成状态。ResComplete 必须解析原补全类型、来源资格、资源清单和唯一键，不能按余额差额赠送。未取得任务/阶段/奖励行或生产者的依赖档保持不可领且不置位；已经合法获得的固定未领权益按 R1 保留。

完成后逐 type 移出通用失败关闭表并补专项、真实临时 TCP、Daily/周期边界、重开和登录同步；更新 R1 验收表、unresolved 文档与 implementation 记录。
```

### 批次 I2：挂机、商店、宝箱与回退（13 条）

```text
执行 R1 的 ITEM 批次 I2，只处理以下命令：
- ITEM-HOOK：78201、78202、78203、78204、78205；
- ITEM-LINEARLEVEL：93501；
- ITEM-MYSTERYSHOP：91501、91502、91503；
- ITEM-OPENSERVERBOX：69301、69302；
- ITEM-RESROLLBACK：88401、88402。

重点读取 economy-tasks-shops.md 的 hook、linear-level、mystery-shop、open-server-box、res-rollback 节，以及原产出/商店/刷新/付费/宝箱/对象指纹/返还消费者、同版 PB 和客户端 Mgr/Cmd。必须分别闭合：
- 78201-78205 的 type 产率、上限、余量取整、领取游标、预览和快收成本；
- 93501 的 type→关卡/宝箱、indexes 范围和奖励位图；
- 91501-91503 的折扣池/权重、自动与手动刷新、次数/段价、price_index、资格和限购；
- 69301/69302 的激活日、日奖/补领、进度、version、真实付费 SKU 与 recharge_flag；
- 88401/88402 的 rollback_type→对象/成本映射、预览、执行前指纹复核和原返还消费者。

所有变更在验证资格、次数、成本和对象指纹后执行。神秘商店不得借普通 Shop、刷新页面或重登洗购买位；开服宝箱的后台加余额不得置真实付费标记；挂机快收缺成本时不得先扣或前移 last_reap_time；资源回退预览不得被当成执行凭证或直接发物。缺失分支保持支付前 err5，已成交历史与合法 pending 保留。

完成后逐 type 移出通用失败关闭表并补专项、真实临时 TCP、刷新/跨日、SQLite 重开和登录同步；更新 R1 验收表、unresolved 文档与 implementation 记录。
```

## 3. 最终验收提示词

```text
你是 FateCovenantClone R1 最终验收 agent。先读 AGENTS.md、12-final-rule-baseline.md、final-rule-register.md、09-defects-and-acceptance.md、11-project-roadmap.md 和全部批次实施记录，再独立核对，不信任实施 agent 的完成声明。

验收目标：
1. 静态枚举 r1-fail-closed-command-service.mjs、09-doc 46条表、final-rule-register 和工作树实际服务，确认每条 type 的唯一状态；任何文档/代码/路由数量不一致即为失败。
2. 对大范围全量实施优先列出原证据已闭合、R1推定、兼容实现和仍受限动作，不以命令路由率计算完成率。
3. 对所有成功变更运行合法、门槛前后、资源不足、重复、编码失败、SQLite失败、临时TCP和重开测试；随机行为使用固定随机点。
4. 对共享实体运行A/B账号、不同作用域、并发重复和离会/取消边界；对排行验证同分键与冻结；对活动验证跨日/期、父子窗口和pending。
5. 逐项核对请求 ETF/PB、响应 schema、登录同步、在线推送和客户端语义；不可仅比较内部对象。
6. 复跑 npm --prefix personal-server test、test:all 中用户允许的必要套件、check:command-dispatch、文档生成 check/verify、git diff --check。

默认不启停实时服务、不读写生产库、不操作模拟器/ADB/APK、不部署。涉及这些动作时停止依赖步骤并向用户说明。

输出一张验收表，至少包含：任务ID/type、R版本与决定、原证据、实现文件、专项、临时TCP、存档/重开、APK、生产、当前状态、剩余缺口。没有证据的项目写未验收；发现原证据与R1冲突时提出R2升级和冻结实例兼容方案。只有实际通过的层可以销项。
```

## 4. 使用顺序

1. 先让实施 agent 执行通用提示词和 H1，合并并验收。
2. 再执行 H2、I1、I2；若要并行，必须由用户为各 agent 明确 baseline 和隔离 worktree。
3. 每批完成后立即更新 46 条表；通用失败关闭集合应从当前 46 条按实际闭合数量下降。
4. 四批结束后运行最终验收提示词，再按 11-project-roadmap.md 的 WP/里程碑继续处理 46 条之外的原证据债务。
5. 真实 APK、生产 TCP、部署和发布属于独立验收，不能由本提示词的离线通过替代。
