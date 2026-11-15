# 详细玩法规则、运营文档与统一规划交付

日期：2026-11-14。用户将本轮范围明确切换为“把详细规则完成”，缺陷修复交其他agent继续。本记录仅对应切换后的文档阶段；此前普通主线、引导、名人堂和败北显示工作保留在[原实施记录](../gameplay-rules-20261114/implementation.md)，不能算作本阶段新增修复。

## 交付范围

唯一规则例外是代金券发行、领取、面值和抵扣保留定制。钱包仅为付款渠道，后台加余额不计游戏购买；商品原价、奖励、购买资格、限购、首充/累充与活动规则仍按原版。

本阶段只完善文档、配置附录、文档生成器和校验器；没有修改业务服务/测试，没有打开运行数据库、连接原服、启停实时服务、操作设备或改包部署。工作树中此前存在的业务修改和`.codex/config.toml`原样保留。未提交Git。

| 产物 | 本次完成内容 |
| --- | --- |
| [总入口](../../../docs/gameplay-operations/README.md) | 领域总则、详细规则册、项目规划、数值、排期及验收的统一导航 |
| [统一项目规划](../../../docs/gameplay-operations/11-project-roadmap.md) | 20个全领域工作包、M0—M6里程碑、依赖、退出条件与交付标准，衔接历史276张任务卡 |
| [系统规则册](../../../docs/gameplay-operations/system-rulebooks/README.md) | 139个协议任务、881条命令；创角/引导/战斗、英雄装备、资源任务商店、PVE/PVP/社交公会；每组到具体规则节 |
| [活动规则册](../../../docs/gameplay-operations/activity-rulebooks/README.md) | 158个家族、526条命令；含145张原待办卡及13个既有族，逐族流程、字段、精确原值示例、状态、消耗、奖励、重复与跨期及缺口 |
| [运营执行手册](../../../docs/gameplay-operations/08-operations-runbook.md) | day1/day2/day3、30/90天使用方式、逐期开服、排期、交易对账、事故处理、发布与备份回滚 |
| [逐活动配置](../../../docs/gameplay-operations/rules/activities.md) | 1109条旧Activity与884条ActFrame，合计1993条；192个来源/类型分组，原行与两种当前窗口投影分列 |
| [原时间与阶段规则](../../../docs/gameplay-operations/activity-rulebooks/time-and-stages.md) | 原客户端两套完整伪代码、时间/阶段枚举、时区/05:00日界、custom与stage_time_list优先级、5组算例和原型/pc/文件哈希 |
| [逐活动阶段](../../../docs/gameplay-operations/rules/activity-phases.md) | 全部1993条的原数组、输入、阶段时分边界、阻断与诊断；ActFrame示例与旧表fallback分开 |
| [前90天排期](../../../docs/gameplay-operations/rules/activity-calendar.md) | 每天新增配置、窗口覆盖数、旧表阶段事件与假设ActFrame实例的阶段事件；来源与适用限制逐项保留 |
| [全部商品](../../../docs/gameplay-operations/rules/products.md) | 6657条商品价格、付款类型/币种、奖励、次数与周期引用；历史商品不宣称当前在售 |
| [奖池参数](../../../docs/gameplay-operations/rules/draw-pools.md) | 589条LibWeight及Group/Item关联；算术权重和与有效概率分开，空候选/缺组明确记录 |
| [完整数值](../../../docs/gameplay-operations/rules/tables/README.md) | 184份本地资产、182份表文档、1906个子表登记、256072行已恢复配置；全部JSON不截行、不补缺值 |
| [全部协议任务映射](../../../docs/gameplay-operations/rules/module-rule-index.md) | 297个任务与1407条命令到规则册的对应，不继承旧任务卡的完成状态 |
| [完整查规则示例](../../../docs/gameplay-operations/rules/worked-examples.md) | 钓鱼1074003、资源商品111001、抽取库101、新手赠角/蜜雪儿/2-1逐层关联 |
| [未恢复规则](../../../docs/gameplay-operations/rules/unresolved.md) | 精确解析阻断和不能仅由配置决定的算法/状态，逐册继续列具体缺表、字段或消费者 |

原[引导流程附录](../../../docs/gameplay-operations/appendices/guide-processes-and-steps.md)已补生成，保留141个Process、718个Step、16个Award原配置，原附录索引与哈希同时刷新。已纠正还原标准中把普通主线仍描述成玩家均值×0.88/借关的过期文字；这些工作树修复的验收层级仍以旧实施记录为准。

## 来源与文档生成

配置来自项目`personal-server/assets/tables/*.json.gz`；生成器按实际结构支持原Lua原型dump、行级tables/rows以及FriendTable数字键映射。只解释配置构造，不执行外部reference、原Lua或MethodScript。根构造的`_List/_ValueIndex`辅助索引不算额外子表；解析失败不能冒称0行。

同名资产变体分别登记。MiniGameTable两变体的26个子表已独立对比一致；PermitTable两gzip文件SHA256相同。其余源路径、选定变体、源哈希与全部生成文件哈希写入[manifest](../../../docs/gameplay-operations/rules/manifest.json)。手写系统/活动册、规划、时间规则、计算器及原字节码证据也绑定哈希，修改后须重建。

三项根索引仍未恢复：ArtifactTable.LevelUp、HeroTable.NpcAttr、TaskTable.CommonTask。前两项另有ArtifactLevelUp（3005行）、HeroTableNpcAttr独立资产可查；根索引解析失败不代表完整功能没有数值，也不能忽略分片版本。

大子表的Markdown提供字段字典和结构样例，完整JSON保留所有行、数组顺序、0、false、null及缺字段差别。示例不能当作完整等级/版本数值表。来源和消费者尚未核明的数字不擅填单位、百分比分母或保底含义。

## 本次新增确证的时间细节

原FlushTime.GetDayZero先按05:00确定所属业务日，再取该业务日日期的00:00；04:59:59与05:00必须覆盖边界。TimeKit时区是运行时输入，本次计算明确采用UTC+8。它与当前服务自然午夜函数不同。

旧Activity独立维护日期游标与时间游标，state_end_day逐段累加，0天仍可有有效小时窗口；空state在原表构造路径补0/50/99。SERVER/WORLD整体窗口按已核原公式生成，神域/主服/跨服动态基点另需运行输入，不能由当前开服配置猜出。

ActFrame整体S/E只读服务器下发实例，没有静态fallback。原GetStageTime先用下发stage_time_list对应段，未下发时才按阶段ID及stage_duration_day/stage_end_time计算。前序end_time=0时不对齐起点，终点仍取原DayZero；duration不减1。811条空stage保持阶段未知；182603/182604缺阶段结束项不补0。阶段表把当前窗口函数输出用作假设server.start_time时明确标示例，不当作原服下发记录。

原旧表来源状态查询采用左闭右开，平台custom另一路在E点仍可RUNNING；整表构造校验与可提前返回的单段查询也分别说明，不能泛化一种边界到所有活动。

完整本地证据：[time-stage-evidence.json](../../../analysis/scratchpad/game-rules-20261114/time-stage-evidence.json)。时间册保存7份原Lua身份与具体原型/指令，示例只证明算术，没有新增原服或APK运行观察。

## 重建与验证

从项目根目录PowerShell执行：

```powershell
node tools/build-gameplay-doc-evidence.mjs
node tools/build-detailed-rule-docs.mjs
node tools/build-detailed-rule-docs.mjs --check
node tools/verify-detailed-rule-docs.mjs
git diff --check
```

[生成器](../../../tools/build-detailed-rule-docs.mjs)与[原时间离线计算器](../../../tools/documented-activity-time.mjs)只读表/配置和证据、写文档。[校验器](../../../tools/verify-detailed-rule-docs.mjs)检查来源/输出SHA256、全部行数与结构、独立原值、时间边界与服务器阶段覆盖优先级、逐任务/逐命令覆盖、商品/奖池完整性、90天数、本地链接/锚点及围栏。

最终重建生成378个文件；`--check`、文档校验器与`git diff --check`均通过。校验覆盖223份Markdown，来源/输出/原字节码身份、本地链接与锚点、原值与时间边界及全部任务/命令索引均通过；完整机器结果保存于[verification.json](../../../analysis/test-runs/detailed-rules-20261114/verification.json)。本阶段没有运行业务全量测试，未将历史测试数字复用为本次结果。

| 文档检查项 | 结果 |
| --- | --- |
| 系统任务与命令 | 139组、881条type全部在对应规则册，定位具体规则段 |
| 活动家族与命令 | 158族、526条type全部在对应规则册 |
| 合计 | 297组、1407条命令，无遗漏/重复命令type |
| 原表与行结构 | 182份表、1906个子表登记、256072行，3个根索引阻断显式保留 |
| 活动与阶段 | 1993条，旧Activity原表fallback与ActFrame假设实例计算分列，811空stage不补进行 |
| 商品/奖池/排期 | 6657条商品、589库、90天，全部原配置有对应记录 |
| 时间独立预期 | 04:59:59/05:00、原钓鱼50/90段、竞技场0天领奖/展示段、0天60秒窗口、stage_time_list优先和缺数组均通过 |

`git diff --check`的通过不代表业务变更已验收，工作树中的既有业务修改仍按各自记录处理。文档校验器另外检查未跟踪Markdown的围栏、锚点、替换字符与尾随空白。

## 交付与验收边界

本阶段交付的是完整可查的规则文档、原配置账册、规划和运营执行说明。文档覆盖数不是原版还原率。已取得的原配置、已核客户端算法、当前兼容行为、未取得的原服动态算法各自标记，不用“写完文档”自动把具体玩法或问题销项。

仍需取证的重点包括原伤害/技能与被动门槛、实际候选和保底分布、动态time_fun与权威实例、活动排行冻结/并列/邮件与货币跨期、缺失Guild系列数值，以及347条FunOpen断言和1级实际弹窗入口。逐族具体缺项可由规则册直接交实现agent，不自行填常见游戏数值。

后续实现按具体规则节、同版表行、独立预期与客户端场景领取；只对通过的范围写完成，保留文档、组件、TCP、存档、APK及发布后验收层级。生产状态/PID、用户库和当前安装包本阶段未重新核验。
