# Hero 5040601 (奈奈子) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 5040601, Name: 奈奈子, Role: Warrior
- Stats: HP 8000, ATK 1080, DEF 360, SPD 99

## Skills Validated (13 total)

### Mastery / Ultimate skills (5, all requiresInvestigation)
1. 2504060123 元素倾泻 - Ultimate: consumes 3 Tianji, 138% magical damage to all enemies; 50% chance add 僵直 to all targets; per 僵直 layer extra 5% max HP life loss (cap 40% ATK), or 15% max HP life loss (cap 120% ATK) if in 倾泻 state; every 3 绯梦惊雷 triggers a free Tianji ultimate (max 2/round); on battle start self damage result -70% for 2 rounds. requiresInvestigation.
2. 354060171 本源感知 - Mastery (Metadata only): summons 迪迪 to absorb fatal damage; 迪迪 at 100% max HP lost retreats; every 5 绯梦惊雷 triggers 流星火雨 (1500% ignore-shield life loss shared by enemy group, max 5/round for 3 rounds); super-life raised to 100% max HP. Approximated as full heal on battle start. requiresInvestigation.
3. 354060173 核心突破 - Mastery: 流星火雨 converts all 僵直 to 倾泻; when 迪迪 retreats, 奈奈子 returns to full HP ignoring heal reduction. Approximated as full heal on battle start. requiresInvestigation.
4. 354060174 极意自现 - Mastery: after normal/skill gain 1 Tianji (approx energy +100); counterattack lowers enemy defense 5% (max 30%/round, resets). requiresInvestigation.
5. 354060175 真我超越 - Mastery: 迪迪 retreats then re-summons once per battle; each retreat grants 奈奈子 +30% ATK. Approximated as permanent attack boost on first round end. requiresInvestigation.

### Passive skills (7)
6. 120001028 突破6 - on ally normal/skill, self gains 50 energy (self-only approximation). Cloned from shared template.
7. 120000001 狂怒 - on ultimate use, crit rate +15%. Cloned from shared template.
8. 120000006 勃发 - when HP > 50%, crit damage +20%. Cloned from shared template.
9. 120000009 鼓舞 - on ally normal/skill, self gains 25 energy (self-only approximation). Cloned from shared template.
10. 120000014 格挡 - before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction). requiresInvestigation.
11. 120000015 标记 - when attacking debuffed target, crit rate +25% (target-has-debuff condition). Cloned from shared template.
12. 120001004 爆裂一击 - first ultimate grants +100% final crit rate. Cloned from shared template.

### Normal (1)
13. normal-profession-1 Warrior Basic Attack (攻击) - project fallback (damage 1.0x single).

## Skills Fixed
- Previously all 13 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 13 skills using existing effect system (damage, heal, shield, stat-modifier, energy).
- Cloned implemented templates from other Warrior heroes for shared passive skills (突破6, 狂怒, 勃发, 鼓舞, 格挡, 标记, 爆裂一击), adapted to 奈奈子 skill IDs.
- Manually implemented 5 unique Mastery skills (元素倾泻, 本源感知, 核心突破, 极意自现, 真我超越) with requiresInvestigation.
- ability/abilityDes tid fields corrected to match hero's own skill IDs where present.
- No new effect types, status types, or target types required; reused existing framework.

## requiresInvestigation Skills (6)
1. 元素倾泻 (2504060123) - Tianji consumption, 僵直 stacking, 倾泻 state, 流星火雨 trigger, damage result reduction, 龙甲 stacking, free Tianji trigger.
2. 本源感知 (354060171) - Metadata only; 迪迪 summon/absorb/retreat, 流星火雨, super-life.
3. 核心突破 (354060173) - 僵直→倾泻 conversion, 迪迪 retreat full heal.
4. 极意自现 (354060174) - Tianji gain, counterattack defense reduction.
5. 真我超越 (354060175) - 迪迪 re-summon, +30% ATK on retreat.
6. 格挡 (120000014) - before 2nd ultimate damage reduction (approximated).

## Test Results
- personal-server/test/hero-5040601-skill-validation.test.mjs: 21/21 passing

## No new effect types/target types/trigger types needed.
EOF
echo done