# 汐夜 (4040301) 技能验证与实现

## 英雄信息

- Hero ID: 4040301
- Hero Name: 汐夜
- Role: Warrior
- Stats: HP 3000, ATK 550, DEF 137, SPD 98
- 技能数量: 15

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Warrior Basic Attack (攻击) (`normal-profession-1`, Normal, project fallback)
2. 溟渊重生 (`2404030123`, Ultimate) - 摧毁敌方全体50%当前护盾，并造成130%物理伤害；月光层数加成
3. 圣辉沐愈 (`344030171`, Mastery) - 汐夜天极技对每个敌人额外附加真实伤害；每次普攻后永久提高最终伤害减免和受疗加成；进入战斗后最终伤害加成+5%
4. 光刃断罪 (`344030172`, Mastery) - 每回合首次释放终结技后降低敌方随机一人1点天极值；受到终结技攻击后立刻使用普攻反击；进入战斗后攻击力增幅+5%
5. 瞳寂渊语 (`344030173`, Mastery) - 汐夜终结技对每个敌人额外附加真实伤害；每次普攻后永久提高最终伤害加成和治疗加成；进入战斗后暴击率+5%和暴击伤害+10%
6. 溺亡盛礼 (`344030174`, Mastery) - 每回合普攻/绝招行动后额外获得1点天极值；受到终结技攻击后治疗我方全体10%目标生命上限；普攻/绝招后下一次终结技伤害+15%
7. 蚀宫陷阱 (`344030175`, Mastery) - 每回合首次释放天极技后返还100层月光；首次天极技后生命上限+20%并获得100%生命上限治疗；释放终结技时额外暴击率+10%和暴击伤害+15%
8. 突破9 (`120001031`, Passive) - 普攻/绝招额外回复200点能量
9. 狂怒 (`120000001`, Passive) - 释放终结技时暴击率+15%
10. 勃发 (`120000006`, Passive) - 生命高于50%暴击伤害+20%
11. 鼓舞 (`120000009`, Passive) - 友方普攻/绝招时能量回复25点
12. 格挡 (`120000014`, Passive) - 释放第2次终结技前受到终结技伤害-20%
13. 标记 (`120000015`, Passive) - 攻击处于异常状态目标暴击率+25%
14. 爆裂一击 (`120001004`, Passive) - 首次释放终结技最终暴击率+100%
15. Skill 6910001065 (`6910001065`, Ultimate, metadata fallback)

## 验证与修复

### 模板来源

汐夜 (4040301) 为 Warrior 角色。通用 Passive 技能从 阿涅斯 (3040201) / 焰舞 (3030701) 克隆，通用 Mastery/Ultimate 按 description-inferred 实现。ability/abilityDes tid 字段保留原英雄元数据。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 344030171 | 圣辉沐愈 | Mastery | 已实现 (requiresInvestigation) | Tianji true damage + per-attack permanent stat gains + final damage +5% on battle start |
| 344030172 | 光刃断罪 | Mastery | 已实现 (requiresInvestigation) | first ultimate reduces enemy Tianji + counter-attack on being hit by ultimate + attack +5% on battle start |
| 344030173 | 瞳寂渊语 | Mastery | 已实现 (requiresInvestigation) | Tianji true damage + per-attack permanent stat gains + crit rate/damage on battle start |
| 344030174 | 溺亡盛礼 | Mastery | 已实现 (requiresInvestigation) | +1 Tianji after normal/skill + heal allies on being hit by ultimate + next ultimate damage +15% |
| 344030175 | 蚀宫陷阱 | Mastery | 已实现 (requiresInvestigation) | first Tianji refund + max HP +20% and 100% max HP heal + crit rate/damage on ultimate use |
| 120001031 | 突破9 | Passive | 已实现 | +200 energy on normal/skill |
| 120000001 | 狂怒 | Passive | 已实现 | crit rate +15% on ultimate use |
| 120000006 | 勃发 | Passive | 已实现 | crit damage +20% when HP > 50% |
| 120000009 | 鼓舞 | Passive | 已实现 | +25 energy to allies on normal/skill |
| 120000014 | 格挡 | Passive | 已实现 (requiresInvestigation) | damage reduction -20% before 2nd ultimate |
| 120000015 | 标记 | Passive | 已实现 | crit rate +25% vs debuffed targets |
| 120001004 | 爆裂一击 | Passive | 已实现 | final crit rate +100% on first ultimate |
| 2404030123 | 溟渊重生 | Ultimate | 已实现 (requiresInvestigation) | 130% physical damage to all enemies + destroy 50% current shields; moonlight-layer bonuses require investigation |
| 6910001065 | Skill 6910001065 | Ultimate | 已实现 (requiresInvestigation) | generic 2.0x physical damage single (metadata fallback) |

## requiresInvestigation 技能

1. 圣辉沐愈 (344030171) - Tianji true damage (0.4% maxHP*moonlight) and per-attack permanent stat gains approximated; moonlight stacking not implemented
2. 光刃断罪 (344030172) - first ultimate reduces enemy Tianji + counter-attack on being hit by ultimate require investigation
3. 瞳寂渊语 (344030173) - Tianji true damage (0.3% maxHP*moonlight) and per-attack permanent stat gains approximated
4. 溺亡盛礼 (344030174) - +1 Tianji after normal/skill and heal allies on being hit by ultimate require investigation
5. 蚀宫陷阱 (344030175) - first Tianji refund 100 moonlight and first Tianji +20% max HP + 100% max HP heal require investigation; max-hp-percent stat not in STAT_TYPES
6. 格挡 (120000014) - damage reduction before 2nd ultimate approximated
7. 溟渊重生 (2404030123) - moonlight-layer bonuses and bond choice require investigation
8. Skill 6910001065 - metadata fallback ultimate

## 测试结果

- 测试文件: `personal-server/test/hero-4040301-skill-validation.test.mjs`
- 测试数量: 23
- 测试通过: 23/23
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 新增 effect types/target types/trigger types

无。全部复用现有框架 (stat-modifier, heal, energy, damage, shield)。

## 剩余问题

1. 月光 (moonlight) 层数系统未实现，相关 Tianji true damage 和 bond choice 标记 requiresInvestigation。
2. 蚀宫陷阱使用 max-hp-percent statType，与 STAT_TYPES 不完全一致，requiresInvestigation。
3. 溟渊重生 moonlight-layer bonuses 和 bond choice (圣光之翼/天启之子) 需进一步实现。
EOF