# 伊娃 (3040101) 技能验证与实现

## 英雄信息

- Hero ID: 3040101
- Hero Name: 伊娃
- Role: Assassin
- Stats: HP 6600, ATK 900, DEF 300, SPD 103
- 技能数量: 15

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Assassin Basic Attack (冲锋) (`normal-profession-2`, Normal, project fallback)
2. 终末之章 (`2304010123`, Ultimate) - 消耗3点天极值，对敌方后排造成180%法术伤害，自身每拥有2层【怒势】额外造成自身最大生命值5%的伤害（最高不超过25%），并为目标施加1层【撕裂】。释放天极技后自己获得1层【共熠】
3. 源初 (`334010171`, Mastery) - 进入战斗后，为我方全体施加{0}，{0}会额外使拥有者暴击伤害提高40%；进入战斗后，最终伤害加成提升5%
4. 禁果 (`334010172`, Mastery) - 每回合首次释放终结技后降低敌方随机一人1点天极值；{0}护盾量提升100%；进入战斗后，攻击力增幅提升5%
5. 狮袭 (`334010173`, Mastery) - 敌方冒险者阵亡时，立刻释放一次不消耗层数的{0}的追击，每回合最多触发1次；若本回合没有敌方冒险者阵亡，回合结束时，立刻释放一次不消耗层数的{0}的追击；进入战斗后，暴击率提升5%和暴击伤害加成提升10%
6. 创世 (`334010174`, Mastery) - 每回合普攻/绝招行动后额外获得1点天极值。{0}的追击造成伤害前摧毁敌方全体目标8%护盾并均摊给我方全体。普攻/绝招后，自身下一次受到伤害降低15%
7. 终末 (`334010175`, Mastery) - {0}的追击强化：目标范围强化至敌方全体，附加40%最终伤害加成与40%最终暴击率；前3回合，受到最终伤害降低8%，第3回合结束时回复自身5%的最大生命值。
8. 突破4 (`120001026`, Passive) - 初始能量增加600点
9. 破盾 (`120000018`, Passive) - 对防御型冒险者造成的伤害提升15%
10. 锋刃 (`120000019`, Passive) - 普攻/绝招伤害提升30%
11. 激怒 (`120000023`, Passive) - 普攻/绝招时能量额外回复100点
12. 戒备 (`120000025`, Passive) - 自身有增益状态时，抗暴率提升30%
13. 鹰眼 (`120000028`, Passive) - 血量高于50%时，命中率提升15%
14. 激昂一击 (`120001007`, Passive) - 击杀后提升自身下1次终结技攻击25%的伤害加成
15. Skill 6910001060 (`6910001060`, Ultimate, metadata fallback)

## 验证与修复

### 模板来源

伊娃 (3040101) 为 Assassin 角色，天极英雄（3点天极值），拥有【灵犀协狩】稀有追击技能（{0} 占位符，未实现）。通用被动技能从龙之澜 (2030201) 克隆。Mastery 技能因涉及天极系统和【灵犀协狩】稀有技能，全部 requiresInvestigation。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 2304010123 | 终末之章 | Ultimate | 已实现 (requiresInvestigation) | 180% 魔法伤害后排，怒势/撕裂/共熠 require investigation |
| 334010171 | 源初 | Mastery | 已实现 (requiresInvestigation) | 全队暴击伤害+40% (crit-damage) + 自身最终伤害+5% |
| 334010172 | 禁果 | Mastery | 已实现 (requiresInvestigation) | 攻击+5%，首次终结技降低敌方随机一人1点天极值 (energy loss 100) |
| 334010173 | 狮袭 | Mastery | 已实现 (requiresInvestigation) | 暴击率+5% 暴击伤害+10% (crit-rate/crit-damage) |
| 334010174 | 创世 | Mastery | 已实现 (requiresInvestigation) | 能量+100 on attack/skill，受到伤害-15% 1回合，天极+1 |
| 334010175 | 终末 | Mastery | 已实现 (requiresInvestigation) | 受到伤害-8% 3回合，第3回合回复5%最大生命 (heal) |
| 120001026 | 突破4 | Passive | 已实现 | 初始能量 +600 |
| 120000018 | 破盾 | Passive | 已实现 | 对防御型伤害 +15% |
| 120000019 | 锋刃 | Passive | 已实现 | 普攻/绝招伤害 +30% |
| 120000023 | 激怒 | Passive | 已实现 | 普攻/绝招能量 +100 |
| 120000025 | 戒备 | Passive | 已实现 | 有增益时抗暴 +30% |
| 120000028 | 鹰眼 | Passive | 已实现 | HP>50% 命中率 +15% |
| 120001007 | 激昂一击 | Passive | 已实现 (requiresInvestigation) | 击杀后下1次终结技伤害 +25% |
| 6910001060 | Skill 6910001060 | Ultimate | 已实现 (requiresInvestigation) | 通用 2.0x 物理伤害单体 (metadata fallback) |

## requiresInvestigation 技能 (8个)

1. 终末之章 (2304010123) - 天极系统、怒势/撕裂/共熠 叠层追踪、灵犀协狩稀有技能未实现
2. 源初 (334010171) - {0} = 灵犀协狩 稀有技能未实现，暴击伤害+40% 为近似
3. 禁果 (334010172) - 天极值降低、{0} 护盾量+100% 未实现
4. 狮袭 (334010173) - {0} 追击触发条件 (敌方死亡/回合结束) 未实现
5. 创世 (334010174) - {0} 追击摧毁护盾并均摊未实现
6. 终末 (334010175) - {0} 追击强化 (敌方全体+40%伤害+40%暴击) 未实现
7. 激昂一击 (120001007) - 击杀后下1次终结技伤害加成 (target filtering 未强制)
8. 6910001060 - metadata fallback ultimate

## 测试结果

- 测试文件: `personal-server/test/hero-3040101-skill-validation.test.mjs`
- 测试数量: 21
- 测试通过: 21/21
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 剩余问题

1. 伊娃为天极英雄，【灵犀协狩】稀有技能 (61040101XX) 未实现，所有 Mastery 的 {0} 占位符均依赖此技能
2. 天极值系统 (3点) 未在本英雄实现中建模
3. 怒势/撕裂/共熠 叠层追踪需要引擎层支持
4. 6910001060 - metadata fallback ultimate，通用 2.0x 物理伤害，requiresInvestigation
EOF

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 鹰眼 120000028 补 conditionKey hp-above-50（原实现无条件，始终生效），测试原本就在断言这一点，修复后转绿。

- 验证：node scripts/verify-hero-skills.mjs --hero=3040101 通过；node --test test/hero-3040101-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
