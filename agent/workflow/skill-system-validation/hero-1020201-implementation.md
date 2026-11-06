# Hero 1020201 (猎魔人) 技能实现（审计补建文档）

本文件在 2026-11-05 技能库审计时补建：该英雄此前有测试文件但没有实现文档。内容按 config/skill-database.json 当前状态生成。

## 技能清单（14 条）

| id | 名称 | 类型 | 描述 | 实现 |
| --- | --- | --- | --- | --- |
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero. | damage physical x1 -> single |
| 312020171 | 重击 | Mastery | 进入战斗后，最终伤害加成提升5% | stat damage-bonus 0.05% -> self | triggers: on-round-start |
| 312020172 | 无畏 | Mastery | 进入战斗后，攻击力增幅提升5% | stat attack-percent 0.05% -> self | triggers: on-round-start |
| 312020173 | 直击要害 | Mastery | 进入战斗后，暴击率提升5%和暴击伤害加成提升10% | stat crit-rate 0.05% -> self; stat crit-damage 0.1% -> self | triggers: on-round-start / on-round-start |
| 312020174 | 伺机待发 | Mastery | 普攻/绝招后，自身下一次终结技伤害提升15% | stat damage-bonus 0.15% -> self | triggers: on-attack / on-skill-use |
| 312020175 | 蚀骨之痛 | Mastery | 释放终结技时，额外造成目标3%最大生命的伤害 | damage percent-max-hp x0.03 -> single | triggers: on-ultimate-use |
| 120001031 | 突破9 | Passive | 普攻/绝招额外回复200点能量 | energy gain 200 -> self | triggers: on-attack / on-skill-use |
| 120000001 | 狂怒 | Passive | 释放终结技时，暴击率提升15% | stat crit-rate 0.15% -> self | triggers: on-ultimate-use |
| 120000006 | 勃发 | Passive | 生命高于50%，暴击伤害提高20% | stat crit-damage 0.2% -> self | triggers: on-round-start(hp-above-50) |
| 120000009 | 鼓舞 | Passive | 友方普攻/绝招时能量回复25点 | energy gain 25 -> self | triggers: on-attack / on-skill-use |
| 120000014 | 格挡 | Passive | 释放第2次终结技前，受到终结技伤害降低20% | stat damage-reduction 0.2% -> self | triggers: on-round-start |
| 120000015 | 标记 | Passive | 攻击处于异常状态的目标时，暴击率提升25% | stat crit-rate 0.25% -> self | triggers: on-attack(target-has-debuff) |
| 120001004 | 爆裂一击 | Passive | 首次释放终结技，最终暴击率提升100% | stat crit-rate 1% -> self | triggers: on-ultimate-use |
| 6910001010 | Skill 6910001010 | Ultimate | - | damage physical x2 -> single |

## 审计修订（2026-11-05）

- 伺机待发 312020174 的 description 去掉被 dump 拼接进来的 312020175 蚀骨之痛文本，实现本身只覆盖自己的部分，无需改动。

- 验证：node scripts/verify-hero-skills.mjs --hero=1020201 通过；node --test test/hero-1020201-skill-validation.test.mjs 通过。

## 近似与遗留

- requiresInvestigation：6910001010 Skill 6910001010
- 数值来自技能描述，未与 FightTable.Effect / FightTable.Buff 对齐。
- 技能库尚未接入战斗主循环，影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
