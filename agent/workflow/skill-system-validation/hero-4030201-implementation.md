# 赫拉 (4030201) 技能验证与实现

## 英雄信息

- Hero ID: 4030201
- Hero Name: 赫拉
- Role: Ranger
- Stats: HP 1890, ATK 285, DEF 90, SPD 107
- 技能数量: 14

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Ranger Basic Attack (辅助) (`normal-profession-3`, Normal, project fallback)
2. 不屈 (`343020171`, Mastery) - 进入战斗后，最终伤害减免提升5%
3. 健壮 (`343020172`, Mastery) - 进入战斗后，最大生命值增幅提升5%
4. 超群技艺 (`343020173`, Mastery) - 进入战斗后，异常状态命中和异常状态抗性提升10%
5. 气定神闲 (`343020174`, Mastery) - 普攻/绝招后，30%概率额外恢复自身100能量
6. 灼目圣光 (`343020175`, Mastery) - 释放终结技时，额外降低目标5%的能量回复速度，持续2回合
7. 突破6 (`120001028`, Passive) - 友方普攻/绝招自身回复50点能量
8. 反弹 (`120000032`, Passive) - 受到敌方后排攻击时，反弹率提升10%
9. 铁甲 (`120000034`, Passive) - 自身生命高于50%时，抗暴提升20%
10. 亢奋 (`120000037`, Passive) - 敌方被击退时回复100点能量
11. 暴怒 (`120000042`, Passive) - 释放能量技能时，暴击伤害增加30%
12. 奋激 (`120000044`, Passive) - 首次释放终结技后，免伤提升20%
13. 生命偷取 (`120001002`, Passive) - 终结技造成伤害的10%转化为自身生命
14. Skill 6910001044 (`6910001044`, Ultimate, metadata fallback)

## 验证与修复

### 模板来源

赫拉 (4030201) 为 Ranger 角色。通用 Mastery 技能从 深海歌姬 (1020101) 克隆，通用 Passive 从 深海歌姬 (1020101) 克隆。ability/abilityDes tid 字段保留原英雄元数据。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 343020171 | 不屈 | Mastery | 已实现 | 最终伤害减免 +5% on battle start |
| 343020172 | 健壮 | Mastery | 已实现 (requiresInvestigation) | max HP +5% on battle start; stat type max-hp-percent not in STAT_TYPES |
| 343020173 | 超群技艺 | Mastery | 已实现 (requiresInvestigation) | status hit/resist +10%; stat types not in STAT_TYPES |
| 343020174 | 气定神闲 | Mastery | 已实现 | 30% chance gain 100 energy on attack/skill |
| 343020175 | 灼目圣光 | Mastery | 已实现 (requiresInvestigation) | reduce target energy recovery speed 5% for 2 rounds on ultimate use; approximated as energy-bonus -0.05 |
| 120001028 | 突破6 | Passive | 已实现 | self gains 50 energy on attack/skill |
| 120000032 | 反弹 | Passive | 已实现 (requiresInvestigation) | rebound rate +10% on being hit by back-row; back-row condition not enforced |
| 120000034 | 铁甲 | Passive | 已实现 | anti-crit +20% when HP > 50% |
| 120000037 | 亢奋 | Passive | 已实现 (requiresInvestigation) | +100 energy on kill (approximated) |
| 120000042 | 暴怒 | Passive | 已实现 | crit damage +30% on skill use |
| 120000044 | 奋激 | Passive | 已实现 | damage reduction +20% after first ultimate (once per battle) |
| 120001002 | 生命偷取 | Passive | 已实现 (requiresInvestigation) | lifesteal 10% ultimate damage; approximated as heal 20% attack |
| 6910001044 | Skill 6910001044 | Ultimate | 已实现 (requiresInvestigation) | generic 2.0x magical damage single (metadata fallback) |

## requiresInvestigation 技能

1. 健壮 (343020172) - max-hp-percent stat type not in STAT_TYPES
2. 超群技艺 (343020173) - status-hit/status-resist stat types not in STAT_TYPES
3. 灼目圣光 (343020175) - energy recovery speed approximated as energy-bonus (no dedicated statType)
4. 反弹 (120000032) - back-row condition not enforced
5. 亢奋 (120000037) - trigger approximated as on-kill (catalog: enemy knocked back)
6. 生命偷取 (120001002) - lifesteal approximated as heal 20% attack
7. 6910001044 - metadata fallback ultimate

## 测试结果

- 测试文件: `personal-server/test/hero-4030201-skill-validation.test.mjs`
- 测试数量: 23
- 测试通过: 23/23
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 新增 effect types/target types/trigger types

无。全部复用现有框架 (stat-modifier, heal, energy, damage)。

## 剩余问题

1. 健壮/超群技艺 使用的 statType (max-hp-percent, status-hit, status-resist) 与 STAT_TYPES 不完全一致，requiresInvestigation。
2. 灼目圣光 (343020175) 目标能量回复速度降低近似为 energy-bonus -0.05，requiresInvestigation。
3. 6910001044 metadata fallback ultimate，通用 2.0x 魔法伤害，requiresInvestigation。
EOF