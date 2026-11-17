# 13 数值规则 R2 增补

版本：R2，2026-11-17。基础版本为 [R1](12-final-rule-baseline.md)。本次只升级英雄基础/养成属性、战斗数值投影与资源协议边界；R1 的时间、活动实例、商品、奖池、636/638 成本索引及具体受限动作继续有效。R1 原冻结清单与实例不改写。本页覆盖 R1 系统规则册中与下列证据冲突的旧属性公式。

## 1. 原消费者纠正的属性公式

原客户端 `HeroAttrCollect._HandleAttrValue` 与 `HeroDevelopMgr.GetHeroStarAddAttrTid` 确证：

| 项目 | R2 规则 | 证据 |
| --- | --- | --- |
| 低星索引 | `min(storedStar,5)*10000 + quality*100 + star_progress` | HeroDevelopMgr 原型34；HeroAttrCollect 原型2 PC40–57 |
| 低星四维 | 当前行 `*_sum_add` 为累计平值；不再加同一行的小段增量 | HeroAttrCollect PC82–133 |
| 基础成长 | `floor(base + grow*(level-1)/100)`，四维分别计算 | 同上，数字常量100 |
| 高星四维 | `HighStarAddAttr[heroTid*100+star]` 四维为10000精度百分比，进入各对应通道 | PC134–145 |
| 突破天赋 | 累加 `UpStageTalent[heroTid*100+1 .. heroTid*100+breakLevel].attr` | PC212–230 |
| 专精等级 | 按本英雄 MasteryGroup.level_range，累加1至当前等级的attr | PC231–265 |
| 专精突破 | 只加当前 MasteryBreak 行的attr，不累计各级突破行 | PC266–283 |
| 聚合属性 | 按原AttrType.exchange展开，如44→24/25；四维最终floor，属性战力最后ceil | AttributeKit.ExtendAttrRange与AttrCalculator/PowerCalculator |

原bin路径、原型定位和复发复盘见 [B1](../../agent/workflow/fixes/vell-basic-attack-attributes-20261116.md)、[B3](../../agent/workflow/fixes/hero-development-attribute-sources-20261117.md)。初始薇尔4030801、1级、star0/progress0、quality50、break0：HP1530、攻击245、双防105、属性战力408。旧8874/3321不是原版金值，已撤回。

## 2. 战斗投影与兼容边界

主线、精英、固定引导演示和PvP把原属性11/12按10000精度转为基础暴击概率/暴伤倍率，并传完整阵营。明确的0暴击不被职业默认值覆盖，100%不再被单位初始化错误截为75%；未提供基础值的旧兼容调用继续沿既有缺省。PvP战报复用组装时的完整战力。见 [B2](../../agent/workflow/fixes/combat-numeric-projection-20261117.md)。

这是已知属性的接线修正，没有取得原服完整命中、抗暴、物魔分离、最终增减伤算法。R1的速度、怒气、双防折合、防御减伤和技能备用通道仍按已冻结的兼容规则；其中涉及本次基础暴击输入的差异明确归R2。其余次级actor属性和装备等来源的未接入项见验收文档，不能用本次通过取代原版验收。

## 3. 数量边界与幂等

英雄count、圣器/皮肤/幻武原卡num按原int32上限2147483647；珍宝chip_num按uint32上限4294967295；家政资源和精灵珠UID按int64上限9223372036854775807。先检查累计值再编码；越界整笔回滚，不截断。int64编号全程BigInt/字符串。JSON防重回执递归恢复Buffer，extra和new_bin都必须与首次结果一致。属于工程契约修正，不是增加游戏奖励或改变原价格。

## 4. 验收与生效

[本轮验收文档](../acceptance/numeric-systems-20261117.md)是本次结果入口；[R2源码及原证据指纹](../../analysis/numeric-audit-20261117/r2-source-manifest.json)固定本次实现。原 [R1清单](../../analysis/scratchpad/activity-schedule-20261115/instances/decision-source-manifest.json)保留历史含义，不就地刷新其SHA。

本轮没有部署或改活库。已有战报、结算、订单和冻结活动实例不追算。后续发布必须明确切换实现版本并按验收文档完成客户端复核，不能把离线组件通过记作线上已生效。
