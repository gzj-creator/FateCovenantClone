# 绮梦·蜜雪儿 (5040701) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 5040701, Name: 绮梦·蜜雪儿, Role: Assassin
- Stats: HP 8000, ATK 1080, DEF 360, SPD 104

## Skills (14 total)
1. normal-profession-2 Assassin Basic Attack (冲锋) - project fallback
2. 2504070123 坠羽星落 - Ultimate, 138% magical damage to all enemies, clears energy/Tianji; +20% max HP true damage to targets with 绮梦 debuffs. requiresInvestigation.
3. 354070171 本源感知 - Mastery (Metadata only): enters 极寒幽隐 state, super-life to 100% max HP. requiresInvestigation.
4. 354070172 潜能蕴养 - Mastery (Metadata only): first ultimate each round reduces random enemy 1 Tianji; 50% immunity to non-strong control. requiresInvestigation.
5. 354070173 核心突破 - Mastery (Metadata only): in 极寒幽隐 each ultimate steals 5% final ATK (max 4); pre-round lowers enemy action priority by 1. requiresInvestigation.
6. 354070174 极意自现 - Mastery (Metadata only): after each action gain 1 Tianji; first round 100% immunity to non-strong control. requiresInvestigation.
7. 354070175 真我超越 - Mastery (Metadata only): first ultimate each round lowers target action priority by 1; 50% chance re-enter 极寒幽隐 on first exit. requiresInvestigation.
8. 120001028 突破6 - on attack/skill, self gains 50 energy. Cloned from 5040601.
9. 120000001 狂怒 - on ultimate use, crit rate +15%. Cloned from 5040601.
10. 120000006 勃发 - when HP > 50%, crit damage +20%. Cloned from 5040601.
11. 120000009 鼓舞 - on attack/skill, self gains 25 energy. Cloned from 5040601.
12. 120000014 格挡 - before 2nd ultimate, ultimate damage taken -20%. requiresInvestigation.
13. 120000015 标记 - when attacking debuffed target, crit rate +25%. Cloned from 5040601.
14. 120001004 爆裂一击 - first ultimate grants +100% final crit rate. Cloned from 5040601.

## requiresInvestigation Skills (6)
1. 坠羽星落 (2504070123) - 绮梦禁锢/封锁, failed action stacking, free Tianji trigger.
2. 本源感知 (354070171) - 极寒幽隐 state, Tianji system.
3. 潜能蕴养 (354070172) - Tianji system, control immunity.
4. 核心突破 (354070173) - 极寒幽隐 state, ATK steal stacking.
5. 极意自现 (354070174) - Tianji system, control immunity.
6. 真我超越 (354070175) - 极寒幽隐 state, action priority.
7. 格挡 (120000014) - before 2nd ultimate damage reduction.

## Test Results
- personal-server/test/hero-5040701-skill-validation.test.mjs: 22/22 passing

## No new effect types/target types/trigger types needed.
EOF
F:/projects/FateCovenantClone/agent/workflow/skill-system-validation/hero-5040701-implementation.md