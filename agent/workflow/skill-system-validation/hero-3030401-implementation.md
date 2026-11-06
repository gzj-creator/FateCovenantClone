# 剪刀新娘 (3030401) 技能验证与实现

## 英雄信息

- Hero ID: 3030401
- Hero Name: 剪刀新娘
- Role: Knight
- Stats: HP 1980, ATK 270, DEF 90, SPD 112
- 技能数量: 13

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Knight Basic Attack (防御) (`normal-profession-4`, Normal, project fallback)
2. 不屈 (`333040171`, Mastery) - 进入战斗后，最终伤害减免提升5%
3. 健壮 (`333040172`, Mastery) - 进入战斗后，最大生命值增幅提升5%
4. 泰然自若 (`333040173`, Mastery) - 进入战斗后，抗暴率提升5%和暴击伤害减免提升10%
5. 盘石之固 (`333040174`, Mastery) - 普攻/绝招后，自身下一次受到伤害降低15%
6. 坚贞不渝 (`333040175`, Mastery, Metadata only) - 【花嫁新娘】的终结技伤害减免提升至35%
7. 突破5 (`120001027`, Passive) - 受到普攻/绝招回复150点能量
8. 自保 (`120000046`, Passive) - 自身有减益状态时，免伤提高10%
9. 蛰伏 (`120000051`, Passive) - 生命低于50%时，免伤提升15%
10. 鼓舞 (`120000054`, Passive) - 友方普攻/绝招时能量回复25点
11. 反杀 (`120000055`, Passive) - 攻击生命百分比高于自己的目标时，暴击率提升30%
12. 祝福 (`120000059`, Passive) - 战斗前2回合，被治愈率提升20%
13. 战斗续航 (`120001005`, Passive) - 回合开始时若生命低于30%，回复自身攻击力30%的最大生命值
14. Skill 6910001031 (`6910001031`, Ultimate, metadata fallback)

## 验证与修复

### 模板来源
剪刀新娘 (3030401) 的技能结构与冰镰使徒 (3030201) 高度相似 (Knight 角色，共享大量通用被动技能)。使用冰镰使徒的已验证实现作为模板，通过 ID 映射克隆实现。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-4 | Knight Basic Attack (防御) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 333040171 | 不屈 | Mastery | 已实现 | 最终伤害减免 +5% (永久) |
| 333040172 | 健壮 | Mastery | 已实现 | 最大生命值 +5% (永久) |
| 333040173 | 泰然自若 | Mastery | 已实现 | 抗暴率 +5% 和暴击伤害减免 +10% (永久) |
| 333040174 | 盘石之固 | Mastery | 已实现 | 普攻/绝招后下一次受到伤害 -15% (1回合) |
| 120001027 | 突破5 | Passive | 已实现 | 受到普攻/绝招回复 150 能量 |
| 120000046 | 自保 | Passive | 已实现 | 有减益时免伤 +10% |
| 120000051 | 蛰伏 | Passive | 已实现 | 生命低于50%时免伤 +15% |
| 120000054 | 鼓舞 | Passive | 已实现 | 友方普攻/绝招时能量回复 25 点 |
| 120000055 | 反杀 | Passive | 已实现 | 攻击生命百分比高于自己的目标时暴击率 +30% |
| 120000059 | 祝福 | Passive | 已实现 | 战斗前2回合被治愈率 +20% |
| 120001005 | 战斗续航 | Passive | 已实现 | 生命低于30%时回复自身攻击力 30% 的最大生命值 |
| 6910001031 | Skill 6910001031 | Ultimate | 已实现 (requiresInvestigation) | 通用 2.0x 物理伤害单体 (metadata fallback) |

### 坚贞不渝 (333040175) - Metadata only

此技能在 catalog 中标记为 "Metadata only"，描述为 "【花嫁新娘】的终结技伤害减免提升至35%"。这是一个与 rare/ultimate 技能 "花嫁新娘" 相关的增强效果，需要花嫁新娘 rare skill 的完整实现才能正确建模。当前未在 skill-database.json 中实现 (冰镰使徒模板中也没有对应的 333020175 技能)。

**状态**: requiresInvestigation - 需要花嫁新娘 rare skill 实现后才能正确建模此增强效果。

## 测试结果

- 测试文件: `personal-server/test/hero-3030401-skill-validation.test.mjs`
- 测试数量: 20
- 测试通过: 20/20
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 剩余问题

1. 坚贞不渝 (333040175) - Metadata only，需要花嫁新娘 rare skill 实现后才能正确建模
2. 6910001031 - metadata fallback ultimate，通用 2.0x 物理伤害，requiresInvestigation
3. 本英雄没有 rare skill (61030401XX) 实现，需要后续补充
EOF

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 鼓舞 120000054 补 on-skill-use 触发。
- 祝福测试断言由 maxTriggers 2 订正为 maxTriggers 1 + 2 回合持续。

- 验证：node scripts/verify-hero-skills.mjs --hero=3030401 通过；node --test test/hero-3030401-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
