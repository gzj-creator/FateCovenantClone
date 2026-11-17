# B3 专精与突破天赋没有进入英雄属性

状态：已修复并通过组件、659/660 临时 TCP 与 SQLite 重开；未部署、未做 APK 真机验收。

## 现象与原始证据

全数值审计发现：659/660 专精养成已扣原表资源并保存 `mastery_level/mastery_break`，但统一属性组装完全不读取对应属性；638 突破只加 BreakAddAttr，漏掉 UpStageTalent 的属性。

原包 `analysis/scratchpad/time-temple-20261108/project/3515417647173561000-HeroAttrCollect.lua.bin` 原型 2：PC212–230 按 `heroTid*100+1 .. heroTid*100+breakLevel` 累加 UpStageTalent.attr；PC231–265 按 MasteryGroup.level_range 累加已达等级行；PC266–283 仅加当前 MasteryBreak 行。不能把专精突破各级再累计。

原表 MasteryLevel[5001/5002/5003] 分别加 HP3600、攻击1080、双防936（actor44 交换到24/25）；MasteryBreak[5001/5002] 为当前累计属性。`AttributeKit.RefreshAttrVal` 与 AttrType.exchange 用于解释聚合属性，不能把44当攻击或直接丢弃。

## 复发复盘

旧属性链只验证基础/星级/突破四维，养成专项只验证扣料与持久化，没有验证资源消耗最终产生属性。先增加带独立表期望的失败测试，再接入来源账本。装备禁止把全背包加给全队的既有约束继续保留；本修复不涉及未核实的装备归属。

## 修复、验证与边界

统一属性、1316、预设战力、主线和 PvP 共用来源；记录每行来源和单位。测试覆盖天赋累计、专精等级逐行累加、专精突破当前累计、44双防交换和缓存刷新。

修复后结果：`projection-development-after.log` 9/9 通过，`receipt-and-validation-after.log` 17/17 通过（含 659/660 真实临时 TCP 和 SQLite 重开），`focused-final.log` 82/82 通过。未部署/操作运行库/设备/APK。其他养成来源与次级战斗通道仍须按审计报告区分，不冒称全部原服规则已恢复。
