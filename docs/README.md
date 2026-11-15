# 项目文档索引

更新：2026-11-15。当前范围是个人服务器`personal-server/`与隔离客户端APK`apk/`，Unity自制游戏路线已取消。

**当前总要求：除代金券系统保留定制外，其他玩法和运营规则按原游戏1:1还原。** 已有本地兼容规则、明确拒绝和接口路由都不能当作还原完成。

## 当前玩法与运营手册

从[最终规则基线R1](gameplay-operations/12-final-rule-baseline.md)进入，并按[297任务唯一裁定](gameplay-operations/rules/final-rule-register.md)实施；完整导航见[玩法与运营总目录](gameplay-operations/README.md)。手册共12章，覆盖玩法、运营、规划与本次统一裁定。原事实、复刻推定、当前实现和验收分开，旧冲突规则已撤回。

详细规则已另分为[系统规则册](gameplay-operations/system-rulebooks/README.md)与[活动规则册](gameplay-operations/activity-rulebooks/README.md)，配套[统一项目规划](gameplay-operations/11-project-roadmap.md)、[逐活动配置](gameplay-operations/rules/activities.md)、[开服前90天排期参数](gameplay-operations/rules/activity-calendar.md)、[全部商品价奖限购](gameplay-operations/rules/products.md)、[奖池与保底参数](gameplay-operations/rules/draw-pools.md)及[完整规则数值](gameplay-operations/rules/tables/README.md)。原表值、现有兼容行为、原版未恢复项分别记录，不把文档覆盖数写成玩法还原率。

| 直接入口 | 内容 |
| --- | --- |
| [四项动态排期已定](gameplay-operations/rules/dynamic-schedule-decisions.md) | 175001父期窗口；461三项day29/79/90首期、阶段、互斥与无隐式循环 |
| [原版还原标准](gameplay-operations/01-fidelity-and-evidence.md) | 版本、证据、1:1范围、代金券例外与完成口径 |
| [新手与旅途](gameplay-operations/02-onboarding-and-journey.md) | 赠角、蜜雪儿、2-1、剧情、体力、功能开放 |
| [运营执行手册](gameplay-operations/08-operations-runbook.md) | 开服/巡检、管理接口、活动、对账/补偿、发布、备份和回滚 |
| [问题与验收](gameplay-operations/09-defects-and-acceptance.md) | 用户反馈与其他偏差、修复依赖和可复现验收场景 |
| [全部模块](gameplay-operations/appendices/modules.md) / [全部命令](gameplay-operations/appendices/commands.md) | 297个协议分组、1407条C2S的当前路由与证据缺口 |
| [引导奖励](gameplay-operations/appendices/guide-awards.md) / [前四章关卡](gameplay-operations/appendices/early-missions.md) | 原客户端提取值与实际战斗数据关系 |
| [功能开放](gameplay-operations/appendices/feature-unlocks.md) | 523条条件配置与未恢复项 |
| [原时间与阶段算法](gameplay-operations/activity-rulebooks/time-and-stages.md) / [逐活动阶段](gameplay-operations/rules/activity-phases.md) | 两套原算法、下发覆盖、逐条起止与不能静态确定的阶段 |
| [证据快照](gameplay-operations/appendices/evidence-manifest.json) | 来源哈希、代码基线、统计口径 |

文档已记录的事实不代表已部署修复。首章BOSS、赠角、2-1、败北战力与1级名人堂仍按问题清单分别验收；不能以历史测试数字代替本轮真实客户端结果。

## 实施、发布与资产

| 入口 | 用途与时间边界 |
| --- | --- |
| [2026-11-15统一基线与冲突清理](../agent/workflow/rule-baseline-20261115/implementation.md) | 四项动态裁定、297任务决定、原证据/推定分列、历史撤回与独立边界校验 |
| [2026-11-14取证与文档记录](../agent/workflow/gameplay-rules-20261114/implementation.md) | 本轮关键纠错、生成命令、验证与遗留 |
| [详细规则文档交付](../agent/workflow/detailed-rules-20261114/implementation.md) | 297组/1407命令、158活动族、完整数值与90天日历的来源、生成和校验 |
| [个人服务器README](../personal-server/README.md) | 开发命令与历史联调记录，正文按日期阅读 |
| [全部剩余玩法任务计划](plans/remaining-gameplay-20261106/README.md) | 2026-11-06任务卡与接口，不当当前完成状态 |
| [任务实施记录](plans/remaining-gameplay-20261106/execution-status.md) | 各批交付和缺口，区分服务端与APK验收 |
| [活动修复清单](08-activity-fix-checklist.md) | 专项历史清单与证据 |
| [系统补全计划](09-system-completion-plan.md) | 图鉴/团员名册等专项历史计划 |
| [商城与任务修复计划](10-store-product-flow-remediation-plan.md) | 商品、自选、限购和任务专项 |
| [发布记录](../agent/workflow/public-deployment-20261110/20261114-hall-freeze-hotfix.md) | 2026-11-14大厅协议热修；历史PID/路径不能当实时状态 |
| [APK快照记录](../apk/README.md) | 本地包版本、哈希、备份、验收与前提；APK不入Git |

## 历史Unity资料

以下只作历史背景，不能作为当前开发/设备/部署指令。相关Unity目录已取消，不再要求安装编辑器或继续Unity构建。

- [背景与目标](01-background-and-goals.md)
- [旧实施方案](02-implementation-plan.md)
- [旧纵向切片](03-first-slice-spec.md)
- [旧系统路线](04-system-roadmap.md)
- [旧开发状态](05-development-status.md)
- [个人服务器早期交接](06-personal-server-handoff.md)

规则更新优先使用用户最新要求、同版原客户端配置与消费者脚本、已保存实测证据。原证据未知的事实不改写，执行动作引用R1唯一决定；新证据改变推定必须升级规则版本，不能另选本地数值。历史计划及Unity记录只作证据/过程背景，不是有效运营规则。
