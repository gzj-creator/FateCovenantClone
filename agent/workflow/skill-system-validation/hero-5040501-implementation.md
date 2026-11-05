# Hero 5040501 (烬) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 5040501, Name: 烬, Role: Knight
- Stats: HP 8000, ATK 1080, DEF 360, SPD 114

## Skills Validated (13 total)

### Mastery skills (5, 1 metadata-only)
1. 2504050123 烬灭一击 - Ultimate: 130% physical damage to all enemies, adds 灰烬, damage converted to shield for self; +60% damage result reduction (decreases 10% per ultimate hit taken, +10% per ally ultimate, max 60%, resets per round); round start gain shield 50% max HP; first round self +4 layers 龙甲 +60% reduction, allies +2 layers; every 50% max HP healed triggers free Tianji ultimate once per round. requiresInvestigation.
2. 354050172 潜能蕴养 - Mastery: first ultimate each round reduces a random enemy 1 Tianji (approx energy loss 100); at round start allies gain shield 100% max HP. requiresInvestigation.
3. 354050173 核心突破 - Mastery: after releasing 龙魂·裂石破天 keep full dragon-soul value; ultimate gains +100% final hit rate; during {0} each ultimate counterattack has 50% chance to trigger a free ultimate on {1} target, max 3 per battle. requiresInvestigation.
4. 354050174 极意自现 - Mastery: after self normal/skill gain 1 Tianji (approx energy +100); at round start allies recover 25% max HP. requiresInvestigation.
5. 354050175 真我超越 - Mastery: dragon-soul value no longer cleared at round end and stacks until battle end; ultimate ignores shields and executes enemies below 25% HP. Approximated as energy gain at round end. requiresInvestigation.
6. 354050171 本源感知 - Mastery (Metadata only): trigger 龙血复生 grants {0} for 1 round; super-life raised to 100% max HP. Approximated as full heal on round start. requiresInvestigation. (Not present in hero's skill list; catalog entry only.)

### Passive skills (7)
7. 120001027 突破5 - +150 energy when hit by normal/skill. Cloned from shared template.
8. 120000046 自保 - when self has debuff, damage reduction +10%. requiresInvestigation (condition not enforced).
9. 120000051 蛰伏 - when HP < 50%, damage reduction +15%. requiresInvestigation (approximated).
10. 120000054 鼓舞 - when ally uses normal/skill, gain 25 energy. Cloned from shared template.
11. 120000055 反杀 - when attacking target with higher HP%, crit rate +30%. requiresInvestigation (condition not enforced).
12. 120000059 祝福 - first 2 rounds, heal bonus +20%. Cloned from shared template.
13. 120001003 生命护盾 - first time HP < 70%, gain shield = 80% DEF for 2 rounds. Cloned from shared template.

### Normal (1)
14. normal-profession-4 Knight Basic Attack (防御) - project fallback (damage 1.0x single).

## Skills Fixed
- Previously all 13 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 13 skills using existing effect system (damage, heal, shield, stat-modifier, energy).
- Cloned implemented templates from other Knight heroes for shared passive skills (突破5, 自保, 蛰伏, 鼓舞, 反杀, 祝福, 生命护盾), adapted to 烬 skill IDs.
- 手动实现了 5 个 unique Mastery skills (烬灭一击, 潜能蕴养, 核心突破, 极意自现, 真我超越) with requiresInvestigation.
- ability/abilityDes tid fields corrected to match hero's own skill IDs where present.
- No new effect types, status types, or target types required; reused existing framework.

## requiresInvestigation Skills (6)
1. 烬灭一击 (2504050123) - Tianji system, shield conversion, damage result reduction per surviving ally, 龙甲 stacking, free Tianji trigger.
2. 潜能蕴养 (354050172) - Tianji reduction, round-start shield.
3. 核心突破 (354050173) - dragon-soul retention, counterattack free ultimate.
4. 极意自现 (354050174) - Tianji gain, round-start heal.
5. 真我超越 (354050175) - dragon-soul stacking, shield ignore, execute.
6. 本源感知 (354050171) - Metadata only; 龙血复生 trigger condition, super-life.

## Test Results
- personal-server/test/hero-5040501-skill-validation.test.mjs: 22/22 passing

## No new effect types/target types/trigger types needed.
EOF
echo done