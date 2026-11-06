# 夜璃 (5040101) 技能验证与实现

## 英雄信息

- Hero ID: 5040101
- Hero Name: 夜璃
- Role: Assassin
- Stats: HP 8000, ATK 1080, DEF 360, SPD 104
- 技能数量: 13

## 技能列表 (来自 docs/character-skill-catalog.md)

1. Assassin Basic Attack (冲锋) (`normal-profession-2`, Normal, project fallback)
2. 噬世之宴 (`2504010123`, Ultimate) - 消耗3点天极值，对敌方全体造成130%攻击力的法术伤害，若触发暴击，则额外降低目标10%的能量恢复率（最高可叠加至50%，持续2回合），并使我方全体角色下次终结技伤害无视35%防御；每回合自身首次释放天极技时，额外附带50%最终暴击率。战斗开始前激活【虚像蛇影】光环
3. 潜能蕴养 (`354010172`, Mastery) - 每回合首次释放终结技后降低敌方随机一人1点天极值；自身每次释放终结技后，提高我方全体10%的最终伤害加成，最高可提升至40%，回合结束时移除
4. 核心突破 (`354010173`, Mastery) - 自身退出【潜伏】状态时，永久获得60%的最终伤害减免，并将【潜伏】传递给自身外的我方攻击最高单位，1场战斗仅能传递1次；处于【潜伏】状态的角色额外提升20%最终命中率
5. 极意自现 (`354010174`, Mastery) - 每回合自身普攻/绝招行动后额外获得1点天极值；自身释放终结技前，额外摧毁敌方全体15%的护盾，每回合限触发4次
6. 真我超越 (`354010175`, Mastery) - 自身退出【潜伏】状态时，将免疫后续的能量削减效果和后续的2次控制效果，并为我方全体角色恢复1000点能量值和1点天极值
7. 突破4 (`120001026`, Passive) - 初始能量增加600点
8. 收割 (`120000017`, Passive) - 对生命低于50%的目标，伤害提升10%
9. 洞察 (`120000020`, Passive) - 攻击生命高于50%的目标时，增加20%暴击率
10. 激怒 (`120000023`, Passive) - 普攻/绝招时能量额外回复100点
11. 刺杀 (`120000026`, Passive) - 对敌方后排造成的伤害提升20%
12. 鹰眼 (`120000028`, Passive) - 血量高于50%时，命中率提升15%
13. 穿刺一击 (`120001009`, Passive) - 首次释放终结技无视敌方30%的防御

## 验证与修复

### 模板来源

夜璃 (5040101) 为 Assassin 角色，天极英雄（3点天极值），拥有【虚像蛇影】光环与【潜伏】状态。通用被动技能从 validated Assassin 英雄克隆（影之菖蒲 2020601、龙之澜 2030201）。Mastery 技能因涉及天极系统、【虚像蛇影】光环与【潜伏】状态，全部 requiresInvestigation。收割/洞察/刺杀无 enriched 模板，手动实现并标记 requiresInvestigation。

### 技能验证结果

| 技能 ID | 技能名 | 类型 | 验证状态 | 备注 |
|---------|--------|------|----------|------|
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | 已实现 | 1.0x 物理伤害单体 |
| 2504010123 | 噬世之宴 | Ultimate | 已实现 (requiresInvestigation) | 130% 魔法伤害全体，天极/虚像蛇影 requires investigation |
| 354010172 | 潜能蕴养 | Mastery | 已实现 (requiresInvestigation) | 随机敌人能量 -100 + 全队伤害 +10% (max 40%) |
| 354010173 | 核心突破 | Mastery | 已实现 (requiresInvestigation) | 伤害减免 +60% + 命中率 +20% (approximated) |
| 354010174 | 极意自现 | Mastery | 已实现 (requiresInvestigation) | 能量 +100 on attack/skill + 护盾摧毁 15% |
| 354010175 | 真我超越 | Mastery | 已实现 (requiresInvestigation) | 全队能量 +1000 一次性 |
| 120001026 | 突破4 | Passive | 已实现 | 初始能量 +600 |
| 120000017 | 收割 | Passive | 已实现 (requiresInvestigation) | 伤害 +10% (HP<50% condition not enforced) |
| 120000020 | 洞察 | Passive | 已实现 (requiresInvestigation) | 暴击率 +20% (HP>50% condition not enforced) |
| 120000023 | 激怒 | Passive | 已实现 | 普攻/绝招能量 +100 |
| 120000026 | 刺杀 | Passive | 已实现 (requiresInvestigation) | 伤害 +20% (back-row condition not enforced) |
| 120000028 | 鹰眼 | Passive | 已实现 | HP>50% 命中率 +15% |
| 120001009 | 穿刺一击 | Passive | 已实现 | 首次终结技无视30%防御 |

## requiresInvestigation 技能 (7个)

1. 噬世之宴 (2504010123) - 天极系统、虚像蛇影光环、暴击降低能量恢复率、无视防御 require investigation
2. 潜能蕴养 (354010172) - 天极值降低、潜伏状态、伤害加成叠层 require investigation
3. 核心突破 (354010173) - 潜伏状态退出触发、传递 require investigation
4. 极意自现 (354010174) - 天极值获取、护盾摧毁 require investigation
5. 真我超越 (354010175) - 潜伏状态退出触发、免疫 require investigation
6. 收割 (120000017) - 目标 HP < 50% 条件未强制执行
7. 洞察 (120000020) - 目标 HP > 50% 条件未强制执行
8. 刺杀 (120000026) - 目标后排条件未强制执行

## 测试结果

- 测试文件: `personal-server/test/hero-5040101-skill-validation.test.mjs`
- 测试数量: 20
- 测试通过: 20/20
- 覆盖: 技能加载、触发器注册、各技能参数验证、数值合理性

## 剩余问题

1. 夜璃为天极英雄，【虚像蛇影】光环与【潜伏】状态未实现，所有 Mastery 的天极值/潜伏依赖 require investigation
2. 天极值系统 (3点) 未在本英雄实现中建模
3. 收割/洞察/刺杀 的目标条件 (HP/back-row) 未强制执行，近似为永久属性
4. 无新 effect types/target types/trigger types 需要

## No new effect types/target types/trigger types needed.
EOF
echo done

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 极意自现 354010174 原用 shield 配负倍率 -0.15 表达"摧毁敌方15%护盾"，执行器会把护盾打成负数且结构校验不通过，改为 stat-modifier / shield-bonus / -0.15（1 回合），notes 记录这是近似。

- 验证：node scripts/verify-hero-skills.mjs --hero=5040101 通过；node --test test/hero-5040101-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
