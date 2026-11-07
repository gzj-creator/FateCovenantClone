# CORE-BATTLE-A 实施检查点

记录时间：2026-11-07。状态：**WIP，部分实现，未合入 main，未完成服务端验收**。

本轮按总控要求停止扩展范围并保存可恢复检查点；本记录不能作为整张 CORE-BATTLE-A 卡的销项依据。

## 分支与范围

- 分支：`task/CORE-BATTLE-A-20261107`。
- 独立 worktree：`.worktree/gameplay-20261106/core-battle-a`。
- 开始基线：`d252af1`；保存检查点时最新 main 为 `e90ef1e`，提交后 rebase 到该主线。
- 仅修改战斗执行器、效果定义/接入、专项测试及本记录；未修改 gateway、配置读取器、SQLite schema 或总控执行状态表。
- 未启停实时服务，未操作运行数据库、设备、模拟器、APK 或原游戏服务器。

## 已保存的实现

| 文件 | 实现 |
| --- | --- |
| `personal-server/game/battle-engine.mjs` | 建立单次动作上下文，统一 fallback 路径实际 HP 损失统计；动作结束消费限定普攻/终结技效果；首次终结技前触发；触发器伤害与直接动作伤害分开统计 |
| `personal-server/game/effects/effect-executor.mjs` | 实际 HP 损失/护盾吸收分别记录；按当次动作实际 HP 损失治疗或加盾；限定动作属性读取；可刷新的一次效果以 applicationId 防止在同一动作末尾误消费新效果 |
| `personal-server/game/effects/effect-types.mjs` | 治疗和护盾增加 `percent-damage-dealt` 来源类型 |
| `personal-server/game/effects/common-skill-rules.mjs` | 运行时归一化已知共享技能的伤害转换、限定动作和一次消费，不重写大份英雄 JSON |
| `personal-server/game/effects/skill-integration.mjs` | 生产加载的显式效果和被动触发器接入上述归一化 |
| `personal-server/test/battle-common-effects.test.mjs` | 10 项聚焦行为测试 |

目前已处理的公共条款：

1. `120001002`：终结技实际 HP 损失合计的 10% 转为自身生命，移除旧的 20% 攻击近似；不计护盾吸收、溢出伤害和独立被动额外伤害。
2. `2504050123`：仅补其“本次造成的伤害 100% 转化为自身护盾”条款；灰烬、龙甲、天极、复生及其他特殊规则仍未实现。
3. `120001006`：终结技后下次普攻伤害 +50%，不会在中间终结技中消费。
4. `120001007`：击杀后下次终结技伤害 +25%，保留到对应终结技并消费；同一动作中刷新后留下新的使用次数。
5. `120001004`：首次终结技暴击率 +100% 在该动作前应用，动作后消费，避免原来的事后永久加成。
6. 25 个明确列出的精通 ID：11 个下一次终结技 +15%，14 个下一次受击减伤 15%；去除按回合过期/重复叠加近似，并在 fallback 伤害路径消费受击次数。

## 配置依据与推断边界

来源为仓库现有 `personal-server/config/skill-database.json`，对应条目的 `implementation.source` 为 `FightTable.Ability + FightTable.AbilityDes`，包含原 tid、text 和 show_name 引用：

| 技能 | 已有描述证据 |
| --- | --- |
| `120001002` | 终结技造成伤害的 10% 转化为自身生命；text `601509076` |
| `120001004` | 首次释放终结技，最终暴击率提升 100%；text `601509078` |
| `120001006` | 释放终结技后，使下 1 次普攻/绝招伤害提升 50%；text `601509080` |
| `120001007` | 击杀后提升自身下 1 次终结技攻击 25% 伤害加成；text `601509081` |
| `312020174` 等 | 普攻/绝招后，自身下一次终结技伤害提升 15% |
| `332030174` 等 | 普攻/绝招后，自身下一次受到伤害降低 15% |
| `2504050123` | 本次造成的伤害 100% 转化为自身护盾；text `601501139` |

按实际 HP 损失计算、排除护盾吸收和溢出，是本次“实际伤害”接口的明确实现约定；尚无原服运行对照，不能称为原始底层公式已还原。普攻/绝招在当前内核中仍合并到 attack 路径，未新增独立绝招动作。大份 JSON 内历史 `notes/requiresInvestigation` 保留，运行时才改写相关效果。

## 实际验证

工作目录为上述 worktree 的 `personal-server/`。

本轮在最终修改状态重新执行：

```powershell
node --test test/battle-common-effects.test.mjs
```

结果：**tests 10 / pass 10 / fail 0 / skipped 0**，`duration_ms 164.4923`。保存日志：`analysis/test-runs/core-battle-a-20261107/common-effects-wip.log`，位于本独立 worktree，未提交 Git。

覆盖：护盾/溢出边界、真实目录吸血的模拟战果、全额吸收不治疗、独立触发伤害不进入吸血、真实终结技转盾、固定种子重复一致、限定动作消费、受击减伤不叠加、首终结技暴击及消费动作内刷新保护。

此前还执行过以下定向回归，**30/30 通过**，但该次运行早于最后加入的触发器伤害统计隔离，不能替代最终版本回归：

```powershell
node --test test/skill-effect-integration.test.mjs test/skill-trigger-regression.test.mjs test/hero-skill-gates.test.mjs test/battle-engine.test.mjs
```

没有运行本分支的 `npm test`、任务生产路径、临时 TCP、SQLite 重开或 APK 验收。main 的 2234/2234 测试结果不包含本分支代码。

## 未完成与恢复入口

1. 先 review 当前补丁并执行最终版本的战斗/技能/英雄验证/mission 聚焦回归；随后补生产任务路径和实际数字 type 的临时 TCP 证据。
2. `personal-server/game/mission-fight-service.mjs` 的 `actionList()`（约 54 行）目前仅处理伤害、护盾、死亡/复活、能量等，没有处理 heal 事件。吸血已改变模拟 HP，但客户端治疗回放尚未闭合；真实 `pb_fat_harm.type` 治疗提示号未取得，不得猜号。已知伤害使用 proto 106 / prompt 101，护盾使用 proto 109。schema 位于 `assets/protobuf/fight.db.proto.bin`，该扩展名需 `rg -a`。报告归 CORE-BATTLE-C 协调。
3. 复核限定动作属性在触发器阶段的作用范围：当前 phase 隔离只处理伤害转换累计，触发器仍能读到外层 actionType；附加伤害是否应获得“下次终结技”加成尚未单独验收。
4. 精通 `...174` 的受控模拟通过不表示生产可选择分支闭合；CORE-SKILL-GATES 当前多从配置 `mastery_ability`（常为 `...171`）选择，需要继续核对替换/解锁证据。
5. 队友行动/跨单位触发和剩余状态、最大生命、命中/闪避、状态命中/抵抗、反弹等结算未实施；现有常量不能记为规则完成。
6. 原始伤害/能量公式、project-fallback 技能、真实 BUFF tid 与 103 回放、CORE-BATTLE-B 专有机制仍为明确依赖，不在本检查点伪造补齐。
7. 无新增运行资产或部署依赖；若后续合并，总控需在保留 main 修复的基础上独立验收并执行全量回归，再更新执行状态表。

下一 session 从本分支提交继续；本分支没有需要保留的未提交用户改动。APK 仅在用户后续安排时单独验收，当前不得标为“待 APK 验收”。
