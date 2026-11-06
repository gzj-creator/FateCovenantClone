# 女仆格蕾丝 (1020601) 技能验证与实现

## 英雄信息

- Hero ID: 1020601
- Hero Name: 女仆格蕾丝
- Role: Knight
- Stats: HP 660, ATK 90, DEF 60, SPD 111
- 技能数量: 14

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Knight Basic Attack (防御) (`normal-profession-4`, Normal, project fallback)
2. 不屈 (`312060171`, Mastery) - 进入战斗后，最终伤害减免提升5%
3. 健壮 (`312060172`, Mastery) - 进入战斗后，最大生命值增幅提升5%
4. 泰然自若 (`312060173`, Mastery) - 进入战斗后，抗暴率提升5%和暴击伤害减免提升10%
5. 盘石之固 (`312060174`, Mastery) - 普攻/绝招后，自身下一次受到伤害降低15%
6. 硬核补给 (`312060175`, Mastery) - 前3回合，受到最终伤害降低8%，第3回合结束时回复自身5%的最大生命值
7. 突破5 (`120001027`, Passive) - 受到普攻/绝招回复150点能量
8. 蛰伏 (`120000051`, Passive) - 生命低于50%时，免伤提升15%
9. 鼓舞 (`120000054`, Passive) - 友方普攻/绝招时能量回复25点
10. 反杀 (`120000055`, Passive) - 攻击生命百分比高于自己的目标时，暴击率提升30%
11. 祝福 (`120000059`, Passive) - 战斗前2回合，被治愈率提升20%
12. 生命护盾 (`120001003`, Passive) - 首次生命低于70%时，获得自身防御力80%的护盾，持续2回合
13. 强击抵抗 (`120001013`, Passive) - 首回合受到终结技伤害降低20%
14. 升格防御 (`6102060102`, Passive) - 格蕾丝开场时为我方前排队友施加5%最大生命值的护盾，持续2回合

## 模板来源

影盾骑士 (1020501) / 骑士利欧 (4010201) 已验证实现作为模板，通过 ID 映射克隆实现（Knight 角色，共享大量通用被动技能）。通用被动技能 (突破5/蛰伏/鼓舞/反杀/祝福/生命护盾/强击抵抗/升格防御) 直接复用已有实现。

## 技能验证与实现

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-4 | Knight Basic Attack (防御) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 312060171 | 不屈 | Mastery | 已实现 | 最终伤害减免 +5% (永久) |
| 312060172 | 健壮 | Mastery | 已实现 | 最大生命值 +5% (永久) |
| 312060173 | 泰然自若 | Mastery | 已实现 | 抗暴率 +5% 和暴击伤害减免 +10% (永久) |
| 312060174 | 盘石之固 | Mastery | 已实现 | 普攻/绝招后下一次受到伤害 -15% (1回合) |
| 312060175 | 硬核补给 | Mastery | 已实现 | 前3回合伤害减免 -8% (1回合)，第3回合结束回复5%最大生命 |
| 120001027 | 突破5 | Passive | 已实现 | 受到普攻/绝招回复 150 能量 |
| 120000051 | 蛰伏 | Passive | 已实现 | 生命低于50%时免伤 +15% |
| 120000054 | 鼓舞 | Passive | 已实现 | 友方普攻/绝招时能量回复 25 点 |
| 120000055 | 反杀 | Passive | 已实现 | 攻击生命百分比高于自己的目标时暴击率 +30% |
| 120000059 | 祝福 | Passive | 已实现 | 战斗前2回合被治愈率 +20% |
| 120001003 | 生命护盾 | Passive | 已实现 | 首次生命低于70%时获得自身防御力80%的护盾，持续2回合 |
| 120001013 | 强击抵抗 | Passive | 已实现 | 首回合受到终结技伤害 -20% (1回合) |
| 6102060102 | 升格防御 | Passive | 已实现 | 开场为我方前排队友施加 5% 最大生命值护盾，持续 2 回合 |

## 硬核补给 (312060175) 实现细节

catalog 描述："前3回合，受到最终伤害降低8%，第3回合结束时回复自身5%的最大生命值"。实现为两个触发器：
- on-round-start, maxTriggers=3: 伤害减免 -8% (timed, 1 round)
- on-round-end, conditionKey=round-3, oncePerBattle: 回复 5% 最大生命 (percent-max-hp)

## 升格防御 (6102060102) 实现细节

catalog 描述："格蕾丝开场时为我方前排队友施加5%最大生命值的护盾，持续2回合"。实现为：
- on-round-start, oncePerBattle: 目标 front-row-allies，护盾 percent-max-hp 0.05，持续 2 回合。

## 测试结果

- 测试文件: `personal-server/test/hero-1020601-skill-validation.test.mjs`
- 测试数量: 22
- 测试通过: 22/22

## Requires Investigation

无。所有技能均为描述推断可执行，强击抵抗 (120001013) 虽然 catalog 仅描述"首回合受到终结技伤害降低20%"，实现为 on-round-start oncePerBattle 伤害减免 -20% (1回合)，与强击抵抗语义一致，未标记 requiresInvestigation。

## 新增类型

无新增 effect types / target types / trigger types。
EOF
echo done

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 升格防御 6102060102 的 targetType front-row-allies 不在 TARGET_TYPES 词表内，TargetSelector 会静默按敌方最前排单体选人（护盾会加给敌人），改为 all-allies 并标 requiresInvestigation，notes 记录前排范围暂无法区分。
- 鼓舞 120000054 补 on-skill-use 触发（描述为"友方普攻/绝招时"，原实现只有 on-attack）。

- 验证：node scripts/verify-hero-skills.mjs --hero=1020601 通过；node --test test/hero-1020601-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
