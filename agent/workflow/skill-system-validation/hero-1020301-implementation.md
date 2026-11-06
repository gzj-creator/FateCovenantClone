# Hero 1020301 (狂暴玛丽) 技能实现（审计补建文档）

本文件在 2026-11-05 技能库审计时补建：该英雄此前有测试文件但没有实现文档。内容按 config/skill-database.json 当前状态生成。

## 技能清单（14 条）

| id | 名称 | 类型 | 描述 | 实现 |
| --- | --- | --- | --- | --- |
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero. | damage physical x1 -> single |
| 312030171 | 重击 | Mastery | 进入战斗后，最终伤害加成提升5% | stat damage-bonus 0.05% -> self | triggers: on-round-start |
| 312030172 | 无畏 | Mastery | 进入战斗后，攻击力增幅提升5% | stat attack-percent 0.05% -> self | triggers: on-round-start |
| 312030173 | 直击要害 | Mastery | 进入战斗后，暴击率提升5%和暴击伤害加成提升10% | stat crit-rate 0.05% -> self; stat crit-damage 0.1% -> self | triggers: on-round-start / on-round-start |
| 312030174 | 恶性疗法 | Mastery | 普攻/绝招后，30%概率给目标额外附加1层【中毒】，持续2回合 | status poison -> single | triggers: on-attack / on-skill-use |
| 312030175 | 恶意蔓延 | Mastery | 释放终结技时，额外附加10%暴击率和15%暴击伤害 | stat crit-rate 0.1% -> self; stat crit-damage 0.15% -> self | triggers: on-ultimate-use / on-ultimate-use |
| 120001031 | 突破9 | Passive | 普攻/绝招额外回复200点能量 | energy gain 200 -> self | triggers: on-attack / on-skill-use |
| 120000001 | 狂怒 | Passive | 释放终结技时，暴击率提升15% | stat crit-rate 0.15% -> self | triggers: on-ultimate-use |
| 120000006 | 勃发 | Passive | 生命高于50%，暴击伤害提高20% | stat crit-damage 0.2% -> self | triggers: on-round-start(hp-above-50) |
| 120000009 | 鼓舞 | Passive | 友方普攻/绝招时能量回复25点 | energy gain 25 -> self | triggers: on-attack / on-skill-use |
| 120000014 | 格挡 | Passive | 释放第2次终结技前，受到终结技伤害降低20% | stat damage-reduction 0.2% -> self | triggers: on-round-start |
| 120000015 | 标记 | Passive | 攻击处于异常状态的目标时，暴击率提升25% | stat crit-rate 0.25% -> self | triggers: on-attack(target-has-debuff) |
| 120001006 | 专注一击 | Passive | 释放终结技后，使下1次普攻/绝招的伤害提升50% | stat damage-bonus 0.5% -> self | triggers: on-ultimate-use |
| 6910001011 | Skill 6910001011 | Ultimate | - | damage physical x2 -> single |

## 审计修订（2026-11-05）

- 数据未改动（结构校验与行为断言均通过）。

- 验证：node scripts/verify-hero-skills.mjs --hero=1020301 通过；node --test test/hero-1020301-skill-validation.test.mjs 通过。

## 近似与遗留

- 无 requiresInvestigation 标记。
- 数值来自技能描述，未与 FightTable.Effect / FightTable.Buff 对齐。
- 技能库尚未接入战斗主循环，影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
