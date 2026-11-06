# Hero 1030401 (黑鸦女爵) 技能实现（审计补建文档）

本文件在 2026-11-05 技能库审计时补建：该英雄此前有测试文件但没有实现文档。内容按 config/skill-database.json 当前状态生成。

## 技能清单（14 条）

| id | 名称 | 类型 | 描述 | 实现 |
| --- | --- | --- | --- | --- |
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero. | damage physical x1 -> single |
| 313040171 | 不屈 | Mastery | 进入战斗后，最终伤害减免提升5% | stat damage-reduction 0.05% -> self | triggers: on-round-start |
| 313040172 | 健壮 | Mastery | 进入战斗后，最大生命值增幅提升5% | stat max-hp-percent 0.05% -> self | triggers: on-round-start |
| 313040173 | 超群技艺 | Mastery | 进入战斗后，异常状态命中和异常状态抗性提升10% | stat status-hit 0.1% -> self; stat status-resist 0.1% -> self | triggers: on-round-start / on-round-start |
| 313040174 | 气定神闲 | Mastery | 普攻/绝招后，30%概率额外恢复自身100能量 | energy gain 100 -> self | triggers: on-attack / on-skill-use |
| 313040175 | 无声恫吓 | Mastery | 释放终结技时，50%概率额外降低目标50能量 | energy loss 50 -> single | triggers: on-ultimate-use |
| 120001028 | 突破6 | Passive | 友方普攻/绝招自身回复50点能量 | energy gain 50 -> self | triggers: on-attack / on-skill-use |
| 120000032 | 反弹 | Passive | 受到敌方后排攻击时，反弹率提升10% | stat rebound-rate 0.1% -> self | triggers: on-being-hit |
| 120000034 | 铁甲 | Passive | 自身生命高于50%时，抗暴提升20% | stat anti-crit 0.2% -> self | triggers: on-round-start(hp-above-50) |
| 120000037 | 亢奋 | Passive | 敌方被击退时回复100点能量 | energy gain 100 -> self | triggers: on-kill |
| 120000042 | 暴怒 | Passive | 释放能量技能时，暴击伤害增加30% | stat crit-damage 0.3% -> self | triggers: on-skill-use |
| 120000044 | 奋激 | Passive | 首次释放终结技后，免伤提升20% | stat damage-reduction 0.2% -> self | triggers: on-ultimate-use |
| 120001009 | 穿刺一击 | Passive | 首次释放终结技无视敌方30%的防御 | stat ignore-defense 0.3% -> self | triggers: on-ultimate-use |
| 6910001006 | Skill 6910001006 | Ultimate | - | damage physical x2 -> single |

## 审计修订（2026-11-05）

- 数据未改动（结构校验与行为断言均通过）。

- 验证：node scripts/verify-hero-skills.mjs --hero=1030401 通过；node --test test/hero-1030401-skill-validation.test.mjs 通过。

## 近似与遗留

- requiresInvestigation：6910001006 Skill 6910001006
- 数值来自技能描述，未与 FightTable.Effect / FightTable.Buff 对齐。
- 技能库尚未接入战斗主循环，影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
