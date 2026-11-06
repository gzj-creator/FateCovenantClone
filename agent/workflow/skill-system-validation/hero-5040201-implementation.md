# 苏苏 (5040201) 技能验证与实现

## 英雄信息

- Hero ID: 5040201
- Hero Name: 苏苏
- Role: Ranger
- Stats: HP 6600, ATK 900, DEF 300, SPD 108
- 技能数量: 12

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Ranger Basic Attack (辅助) (`normal-profession-3`, Normal, project fallback)
2. 曼舞鞭终 (`2504020123`, Ultimate) - 消耗3点天极值，对敌方全体造成130%攻击力的法术伤害，并使我方全体获得1层【狐佑】，同时展开【狐魅领域】
3. 灵狐曳影 (`354020172`, Mastery) - 每回合首次释放终结技后降低敌方随机一人1点天极值；每回合开始时，苏苏获得60%生命上限的护盾
4. 浅雾缠枝 (`354020174`, Mastery) - 每回合自身普攻/绝招行动后额外获得1点天极值；每回合结束时，治疗生命最低友方已损失的全部血量
5. 魅霭封喉 (`354020175`, Mastery) - {0}效果额外增加：复制释放的普攻/绝招/终结技/天极技无视敌人100%的防御，且最终伤害额外提高100%；自身首次普攻/绝招行动后，恢复我方全体1000能量值
6. 突破6 (`120001028`, Passive) - 友方普攻/绝招自身回复50点能量
7. 陷阵 (`120000033`, Passive) - 对敌方前排造成的伤害提升10%
8. 齐心 (`120000035`, Passive) - 每有1名队友在场，伤害提升3%（最高15%）
9. 急救 (`120000036`, Passive) - 友方生命低于50%时，对其造成的治疗效果提升15%
10. 蓄势 (`120000041`, Passive) - 从第2回合开始，无视防御提高15%
11. 奋激 (`120000044`, Passive) - 首次释放终结技后，免伤提升20%
12. 生命护盾 (`120001003`, Passive) - 首次生命低于70%时，获得自身防御力80%的护盾，持续2回合

## 验证与修复

### 模板来源

苏苏 (5040201) 为 Ranger 角色。通用 Mastery 技能根据 catalog 文本手写；通用 Passive 技能从 伊丽丝 (1040301) 克隆（陷阵/齐心/急救/蓄势），奋激/突破6/生命护盾从已有实现复用。ability/abilityDes tid 字段保留原英雄元数据。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | 已实现 | 1.0x 物理伤害单体 (project fallback) |
| 2504020123 | 曼舞鞭终 | Ultimate | 已实现 (requiresInvestigation) | 130% 魔法伤害全体；狐佑/狐魅领域 approximated |
| 354020172 | 灵狐曳影 | Mastery | 已实现 (requiresInvestigation) | 护盾 60% 最大生命 (round start) + 敌方随机 -100 能量 (ultimate) |
| 354020174 | 浅雾缠枝 | Mastery | 已实现 (requiresInvestigation) | +100 能量 (attack/skill) + 全额缺失治疗最低HP友方 (round end) |
| 354020175 | 魅霭封喉 | Mastery | 已实现 (requiresInvestigation) | 全体 +1000 能量 (首次 attack/skill) |
| 120001028 | 突破6 | Passive | 已实现 | +50 能量 (attack/skill) |
| 120000033 | 陷阵 | Passive | 已实现 (requiresInvestigation) | damage-bonus +0.10 (front-row condition not enforced) |
| 120000035 | 齐心 | Passive | 已实现 (requiresInvestigation) | damage-bonus +0.15 (teammate count not enforced) |
| 120000036 | 急救 | Passive | 已实现 (requiresInvestigation) | heal-bonus +0.15 (ally HP condition not enforced) |
| 120000041 | 蓄势 | Passive | 已实现 (requiresInvestigation) | ignore-defense +0.15 (round gating not enforced) |
| 120000044 | 奋激 | Passive | 已实现 | damage-reduction +0.20 on ultimate (once per battle) |
| 120001003 | 生命护盾 | Passive | 已实现 | shield 80% DEF for 2 rounds when HP < 70% |

## requiresInvestigation 技能 (9个)

1. 曼舞鞭终 (2504020123) - 天极值消耗、狐佑/狐魅领域机制需引擎集成
2. 灵狐曳影 (354020172) - 天极值降低机制 approximated as energy loss
3. 浅雾缠枝 (354020174) - 天极值获得 approximated as energy gain；缺失生命全额治疗 approximated
4. 魅霭封喉 (354020175) - 复制释放/无视防御 approximated as energy gain
5. 陷阵 (120000033) - 前排条件未强制
6. 齐心 (120000035) - 队友数量未强制
7. 急救 (120000036) - 友方HP条件未强制
8. 蓄势 (120000041) - 回合门控未强制
9. 生命护盾 (120001003) - HP 阈值触发 approximated

## 测试结果

- 测试文件: `personal-server/test/hero-5040201-skill-validation.test.mjs`
- 测试数量: 20
- 测试通过: 20/20
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 新增 effect types/target types/trigger types

无。全部复用现有框架 (damage, shield, energy, heal, stat-modifier)。

## 剩余问题

1. 天极值 (Tianji) 机制未建模，approximated 为 energy gain/loss。
2. 狐佑/狐魅领域等复杂状态未完整建模，requiresInvestigation。
3. 陷阵/齐心/急救/蓄势 的条件未强制执行，requiresInvestigation。
4. Battle engine 尚未调用 applySkillEffects/processTriggers（与先前英雄实现一致）。
EOF

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 生命护盾 120001003 补 effectType shield 与 conditionKey hp-below-70（原实现任何血量变化都会触发）。

- 验证：node scripts/verify-hero-skills.mjs --hero=5040201 通过；node --test test/hero-5040201-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
