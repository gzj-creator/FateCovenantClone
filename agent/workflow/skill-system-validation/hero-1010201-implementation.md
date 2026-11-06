# Hero 1010201 (鱼缸头) 技能实现（审计补建文档）

本文件在 2026-11-05 技能库审计时补建：该英雄此前有测试文件但没有实现文档。内容按 config/skill-database.json 当前状态生成。

## 技能清单（14 条）

| id | 名称 | 类型 | 描述 | 实现 |
| --- | --- | --- | --- | --- |
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero. | damage physical x1 -> single |
| 311020171 | 重击 | Mastery | 进入战斗后，最终伤害加成提升5% | stat damage-bonus 0.05% -> self | triggers: on-round-start |
| 311020172 | 无畏 | Mastery | 进入战斗后，攻击力增幅提升5% | stat attack-percent 0.05% -> self | triggers: on-round-start |
| 311020173 | 弱点洞悉 | Mastery | 进入战斗后，无视防御提升5%和命中率提升10% | stat ignore-defense 0.05% -> self; stat hit-rate 0.1% -> self | triggers: on-round-start / on-round-start |
| 311020174 | 会心一击 | Mastery | 普攻/绝招时，额外附加5%的无视防御和5%的最终伤害 | stat ignore-defense 0.05% -> self; stat damage-bonus 0.05% -> self | triggers: on-attack / on-attack / on-skill-use / on-skill-use |
| 311020175 | 索命钩链 | Mastery | 前3次释放终结技，额外附加15%的暴击率和20%暴击伤害 | stat crit-rate 0.15% -> self; stat crit-damage 0.2% -> self | triggers: on-ultimate-use / on-ultimate-use |
| 120001026 | 突破4 | Passive | 初始能量增加600点 | energy gain 600 -> self | triggers: on-round-start |
| 120000018 | 破盾 | Passive | 对防御型冒险者造成的伤害提升15% | stat damage-bonus 0.15% -> self | triggers: on-round-start |
| 120000019 | 锋刃 | Passive | 普攻/绝招伤害提升30% | stat damage-bonus 0.3% -> self | triggers: on-round-start |
| 120000023 | 激怒 | Passive | 普攻/绝招时能量额外回复100点 | energy gain 100 -> self | triggers: on-attack / on-skill-use |
| 120000025 | 戒备 | Passive | 自身有增益状态时，抗暴率提升30% | stat crit-resistance 0.3% -> self | triggers: on-round-start / on-buff-gain |
| 120000028 | 鹰眼 | Passive | 血量高于50%时，命中率提升15% | stat hit-rate 0.15% -> self | triggers: on-round-start(hp-above-50) |
| 120001004 | 爆裂一击 | Passive | 首次释放终结技，最终暴击率提升100% | stat crit-rate 1% -> self | triggers: on-ultimate-use |
| 6910001015 | Skill 6910001015 | Ultimate | - | damage physical x2 -> single |

## 审计修订（2026-11-05）

- 鹰眼 120000028 补 conditionKey hp-above-50（描述为"血量高于50%时命中率提升15%"，原实现无任何条件）。
- 新增鹰眼断言：原测试文件完全没有 120000028 覆盖。

- 验证：node scripts/verify-hero-skills.mjs --hero=1010201 通过；node --test test/hero-1010201-skill-validation.test.mjs 通过。

## 近似与遗留

- requiresInvestigation：6910001015 Skill 6910001015
- 数值来自技能描述，未与 FightTable.Effect / FightTable.Buff 对齐。
- 技能库尚未接入战斗主循环，影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
