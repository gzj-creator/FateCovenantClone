# 详细规则、数值与活动排期

2026-11-15，最终执行基线R1-20261115。先读[唯一基线](../12-final-rule-baseline.md)、[全部297任务裁定](final-rule-register.md)与[四项动态排期](dynamic-schedule-decisions.md)。原证据债务不再作为执行选项；调查defaults未整体采纳，审核覆盖与最终政策优先。除代金券发放/领取/面值/抵扣保留定制，其余玩法与运营以同版原配置和消费者为准。

## 阅读顺序

1. [系统规则册](../system-rulebooks/README.md)：139个协议任务的创角、战斗、英雄装备、资源任务商店与社交公会。
2. [活动规则册](../activity-rulebooks/README.md)：158个家族的流程、资格、消耗发奖、概率/保底、限购、排名和结算。
3. [逐活动ID与版本](activities.md)：1993条原配置、当前实现投影及四项R1决定分别保存。
4. [原时间算法](../activity-rulebooks/time-and-stages.md)和[逐活动阶段](activity-phases.md)：两种框架分别计算，列输入与阻断；空stage不自动补进行期，R1专项的显式阶段另列推定身份。
5. [前90天排期](activity-calendar.md)：原相对候选、当前实现差异与R1首期分列，含阶段转换。正式世界日期保留原值，当前平移列不作发布规则。
6. [完整数值表](tables/README.md)：203份表文档、2043个子表登记、277924行原配置，完整JSON不截断。
7. [商品](products.md)、[奖池](draw-pools.md)、[297任务/1407命令对应](module-rule-index.md)与[查规则示例](worked-examples.md)。
8. [原证据债务与已定行为](unresolved.md)：4个根索引解析阻断（部分有独立分片），各项均绑定R1执行政策。
9. [统一规划](../11-project-roadmap.md)与[运营手册](../08-operations-runbook.md)：实施依赖、阶段验收与逐期操作。

## 数值如何使用

活动ID、版本、表行tid、功能ID、命令type和物品ID属于不同空间，不能因数字相同互换。沿规则册关联到本版本，再读JSON的families.<子表>.rows；不借邻期、同名活动或邻近品质补行。现金分、倍率分母、百分比和普通权重分别由对应消费者证明。

每份表页列源路径、SHA256、字段类型和恢复状态。reference只是外部符号，解析失败不能写成原表为空。原规则、R1推定、当前代码、组件验证和APK验收分别记录；文档覆盖不表示原服隐藏算法或全部玩法已恢复。

## 重建与校验

项目根目录PowerShell执行：

```powershell
node tools/build-gameplay-doc-evidence.mjs
node tools/build-detailed-rule-docs.mjs
node tools/build-detailed-rule-docs.mjs --check
node tools/verify-detailed-rule-docs.mjs
```

工具仅写文档，不打开数据库、启动服务或操作设备。[manifest](manifest.json)记录原表、原型说明、手写规则、两份调查、审核覆盖、功能条件差异及生成结果的SHA256。旧调查中的正文快照哈希作为历史记录保留，不冒充当前文件指纹。
