# 原证据债务与已定执行方案

版本：R1-20261115。本文记录原版证据的边界，不再将执行方式留给实现者选择。实施统一按[最终基线](../12-final-rule-baseline.md)、[全部任务裁定](final-rule-register.md)和[动态排期](dynamic-schedule-decisions.md)。每项原证据债务只能用同版原表/消费者或已保存实测证据关闭；文档推定和业务测试通过不能冒充原证据。

## 配置解释失败

以下根索引解析失败时，不借邻行、不当空奖；必要成本/产出缺行仅拒绝该变更，已有可证独立动作仍执行。

|资产|子表|具体阻断|
|---|---|---|
|[ArtifactTable](tables/ArtifactTable.md)|LevelUp|Empty/non-row output; field map not independently recovered|
|[HeroTable](tables/HeroTable.md)|NpcAttr|Empty/non-row output; field map not independently recovered|
|[TaskGroupTable](tables/TaskGroupTable.md)|CommonTask|Empty/non-row output; field map not independently recovered|
|[TaskTable](tables/TaskTable.md)|CommonTask|Empty/non-row output; field map not independently recovered|

上述是具体资产根索引的解析阻断，不表示整个相关功能没有任何数值。ArtifactTable.LevelUp另有[ArtifactLevelUp独立分片](tables/ArtifactLevelUp.md)，已恢复3005行；HeroTable.NpcAttr另有[HeroTableNpcAttr独立分片](tables/HeroTableNpcAttr.md)。同名根索引与分片的版本/来源仍须对应，不能混成任意互换的行。TaskTable.CommonTask根索引仍未恢复。

## 跨系统原证据债务及唯一执行决定

|范围|尚未取得的原版证据|本版固定行为|关闭原证据债务所需材料|
|---|---|---|---|
|战斗与技能|原基础伤害/防御分母、部分速度/怒气生成、被动门槛、固定攻方91102和NPC能力|仅[锁版兼容R1](../12-final-rule-baseline.md#battle)及明确白名单继续；缺必要敌阵/技能的对应特殊挑战不新结算|同版完整消费者与可对照原战报；不借玩家全部后期被动|
|招募与活动随机|空lib_range、隐藏覆盖、部分心愿/保底及版本切池|[R1-RNG](final-rule-register.md#r1-rng)：必要链缺失的具体消耗抽取拒绝，独立固定奖及合法pending保留|精确原候选和抽取/保底消费者；展示概率不足以关闭|
|运营排期|原461服务器实现及四项目标实例未取得|[四项唯一方案](dynamic-schedule-decisions.md)：175001父期继承；组day29/79/90首期；不自动复发；正式world_time保留绝对日期|同版原时间函数或可信原下发实例，新增证据须升级R版本；不再讨论是否默认平移|
|活动结算|部分家族原邮件、回收/兑换和同分消费者|[R1-ROLLOVER](final-rule-register.md#r1-rollover)旧币冻结/确定权益保留；[R1-RANK](final-rule-register.md#r1-rank)固定同分键；不编邮件|具体家族原配置与消费者；框架枚举不能证明原政策|
|公会与多人|未取得的Guild配置、部分匹配/榜奖/拍卖关系|[R1-SHARED](final-rule-register.md#r1-shared)：真实空榜/单服组，缺必要链仅拒绝该新变更，不造对手|同版原表及真实多人结果证据|
|初始与功能|原全量初始档案、303条功能配置仍有证据缺口、1级实际弹窗入口|[原条件文档](../appendices/feature-unlocks.md)已核220条；当前映射177/346另列。缺证条件按未满足；不全开/全清旧位，不提前赠角|对应初始模块、MethodScript及界面触发链；955132601007和1514不再算语义未知|
|实现一致性|当前all-open/平移/阶段过滤/删模块等与目标有差异|按[R1](../12-final-rule-baseline.md)修复，保留必要初始化结构；当前源码不是另一套发布规则|实现agent逐项组件/TCP/存档/APK验收；本轮不修改业务消除差异|
