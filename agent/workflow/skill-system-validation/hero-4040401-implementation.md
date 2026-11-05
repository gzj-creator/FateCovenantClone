# 千千结 (4040401) 技能验证与实现

## 英雄信息

- Hero ID: 4040401
- Hero Name: 千千结
- Role: Ranger
- Stats: HP 3000, ATK 550, DEF 137, SPD 108
- 技能数量: 15

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Ranger Basic Attack (辅助) (`normal-profession-3`, Normal, project fallback)
2. 绛丝乱舞 (`2404040123`, Ultimate) - 摧毁敌方全体50%当前护盾，并造成130%物理伤害；月光层数加成
3. 不屈 (`344040171`, Mastery) - 进入战斗后，最终伤害加成提升5%
4. 健壮 (`344040172`, Mastery) - 进入战斗后，攻击力增幅提升5%
5. 瞳寂渊语 (`344040173`, Mastery) - 进入战斗后，暴击率提升5%和暴击伤害加成提升10%
6. 溺亡盛礼 (`344040174`, Mastery) - 普攻/绝招后，自身下一次终结技伤害提升15%
7. 蚀宫陷阱 (`344040175`, Mastery) - 释放终结技时，额外附加10%暴击率和15%暴击伤害
8. 突破6 (`120001028`, Passive) - 友方普攻/绝招自身回复50点能量
9. 反弹 (`120000032`, Passive) - 受到敌方后排攻击时，反弹率提升10%
10. 铁甲 (`120000034`, Passive) - 自身生命高于50%时，抗暴提升20%
11. 亢奋 (`120000037`, Passive) - 敌方被击退时回复100点能量
12. 暴怒 (`120000042`, Passive) - 释放能量技能时，暴击伤害增加30%
13. 奋激 (`120000044`, Passive) - 首次释放终结技后，免伤提升20%
14. 生命护盾 (`120001003`, Passive) - 首次生命低于70%时，获得自身防御力80%的护盾，持续2回合
15. Skill 6910001065 (`6910001065`, Ultimate, metadata fallback)

## 验证与修复

### 模板来源

千千结 (4040401) 为 Ranger 角色。通用 Passive/Mastery 技能从 吟游诗人 (1010101) / 啵啵水母 (3020201) / 薇尔 (4030801) 等已验证 Ranger 英雄克隆，通用 Mastery/Ultimate 按 description-inferred 实现。2404040123 (绛丝乱舞) 从 汐夜 (4040301) 的 2404030123 克隆并适配 skill ID。ability/abilityDes tid 字段保留原英雄元数据。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 344040171 | 不屈 | Mastery | 已实现 | 最终伤害加成 +5% on battle start |
| 344040172 | 健壮 | Mastery | 已实现 | 攻击力增幅 +5% on battle start |
| 344040173 | 瞳寂渊语 | Mastery | 已实现 | 暴击率 +5% / 暴击伤害 +10% on battle start |
| 344040174 | 溺亡盛礼 | Mastery | 已实现 | 普攻/绝招后下一次终结技伤害 +15% (1 round) |
| 344040175 | 蚀宫陷阱 | Mastery | 已实现 | 终结技时暴击率 +10% / 暴击伤害 +15% (2 rounds) |
| 120001028 | 突破6 | Passive | 已实现 | +50 energy on attack/skill |
| 120000032 | 反弹 | Passive | 已实现 | rebound-rate +10% on being hit by back-row |
| 120000034 | 铁甲 | Passive | 已实现 | anti-crit +20% when HP > 50% |
| 120000037 | 亢奋 | Passive | 已实现 | +100 energy on kill |
| 120000042 | 暴怒 | Passive | 已实现 | crit-damage +30% on skill use |
| 120000044 | 奋激 | Passive | 已实现 | damage-reduction +20% on ultimate (once per battle) |
| 120001003 | 生命护盾 | Passive | 已实现 | shield 0.8 defense when HP < 70% (once per battle) |
| 2404040123 | 绛丝乱舞 | Ultimate | 已实现 (requiresInvestigation) | 130% physical damage to all enemies + destroy 50% current shields; moonlight-layer bonuses require investigation |
| 6910001065 | Skill 6910001065 | Ultimate | 已实现 (requiresInvestigation) | generic 2.0x physical damage single (metadata fallback) |

## requiresInvestigation 技能

1. 绛丝乱舞 (2404040123) - moonlight-layer bonuses (20/40/60/80/100) and first-100-layer bond choice (圣光之翼/天启之子) require investigation; shield destruction 50% approximated.
2. Skill 6910001065 - metadata fallback ultimate (no localized description).

## 测试结果

- 测试文件: `personal-server/test/hero-4040401-skill-validation.test.mjs`
- 测试数量: 22
- 测试通过: 22/22
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 新增 effect types/target types/trigger types

无。全部复用现有框架 (stat-modifier, heal, energy, damage, shield, rebound-rate, anti-crit)。

## 剩余问题

1. 绛丝乱舞 (2404040123) 月光 (moonlight) 层数系统未实现，相关 Tianji true damage 和 bond choice 标记 requiresInvestigation。
2. 6910001065 为 metadata fallback ultimate，无本地化描述。
EOF
echo done