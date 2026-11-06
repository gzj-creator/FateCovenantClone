# Hero 1020101 (深海歌姬) 技能实现（审计补建文档）

本文件在 2026-11-05 技能库审计时补建：该英雄此前有测试文件但没有实现文档。内容按 config/skill-database.json 当前状态生成。

## 技能清单（14 条）

| id | 名称 | 类型 | 描述 | 实现 |
| --- | --- | --- | --- | --- |
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero. | damage physical x1 -> single |
| 312010171 | 不屈 | Mastery | 进入战斗后，最终伤害减免提升5% | stat damage-reduction 0.05% -> self | triggers: on-round-start |
| 312010172 | 健壮 | Mastery | 进入战斗后，最大生命值增幅提升5% | stat max-hp-percent 0.05% -> self | triggers: on-round-start |
| 312010173 | 超群技艺 | Mastery | 进入战斗后，异常状态命中和异常状态抗性提升10% | stat status-hit 0.1% -> self; stat status-resist 0.1% -> self | triggers: on-round-start |
| 312010174 | 回春妙手 | Mastery | 普攻/绝招后，为我方生命最低目标恢复30%攻击的生命 | heal percent-attack 0.3 -> lowest-hp-ally | triggers: on-attack / on-skill-use |
| 312010175 | 兰芷蕙心 | Mastery | 释放终结技时，额外恢复目标5%最大生命 | heal percent-max-hp 0.05 -> lowest-hp-ally | triggers: on-ultimate-use |
| 120001028 | 突破6 | Passive | 友方普攻/绝招自身回复50点能量 | energy gain 50 -> self | triggers: on-attack / on-skill-use |
| 120000032 | 反弹 | Passive | 受到敌方后排攻击时，反弹率提升10% | stat rebound-rate 0.1% -> self | triggers: on-being-hit |
| 120000034 | 铁甲 | Passive | 自身生命高于50%时，抗暴提升20% | stat anti-crit 0.2% -> self | triggers: on-round-start(hp-above-50) |
| 120000037 | 亢奋 | Passive | 敌方被击退时回复100点能量 | energy gain 100 -> self | triggers: on-kill |
| 120000042 | 暴怒 | Passive | 释放能量技能时，暴击伤害增加30% | stat crit-damage 0.3% -> self | triggers: on-skill-use |
| 120000044 | 奋激 | Passive | 首次释放终结技后，免伤提升20% | stat damage-reduction 0.2% -> self | triggers: on-ultimate-use |
| 120001003 | 生命护盾 | Passive | 首次生命低于70%时，获得自身防御力80%的护盾，持续2回合 | shield percent-defense 0.8 -> self | triggers: on-hp-threshold(hp-below-70) |
| 6910001009 | Skill 6910001009 | Ultimate | - | damage magical x2 -> single |

## 审计修订（2026-11-05）

- 14 条技能补 effectType、targetType、energyCost（原实现只有 effects 数组）。
- 6 条常驻增益（不屈、健壮、超群技艺、反弹、暴怒、奋激）duration 由 instant 改为 permanent，与同库其他英雄一致。
- 生命护盾 120001003 补 conditionKey hp-below-70。

- 验证：node scripts/verify-hero-skills.mjs --hero=1020101 通过；node --test test/hero-1020101-skill-validation.test.mjs 通过。

## 近似与遗留

- 无 requiresInvestigation 标记。
- 数值来自技能描述，未与 FightTable.Effect / FightTable.Buff 对齐。
- 技能库尚未接入战斗主循环，影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
