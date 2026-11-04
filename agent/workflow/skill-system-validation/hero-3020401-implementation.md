# Hero 3020401 (秘典魔女) Skill Validation & Implementation

Date: 2026-11-03
Branch: skill-system-validation

## Hero
- ID: 3020401, Name: 秘典魔女, Role: Knight
- Stats: HP 660, ATK 90, DEF 60, SPD 111

## Skills Validated (14 total)

### Mastery skills (5)
1. 332040171 不屈 - on battle start final damage reduction +5%. effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle.
2. 332040172 健壮 - on battle start max HP +5%. effectType=stat-modifier (max-hp-percent), trigger on-round-start, once per battle.
3. 332040173 泰然自若 - on battle start crit resistance +5% and crit damage reduction +10%. effectType=stat-modifier (crit-resist, crit-damage-reduction), 2 triggers on-round-start, once per battle.
4. 332040174 盘石之固 - on normal/skill, damage reduction +15% for 1 round. effectType=stat-modifier (damage-reduction), triggers on-attack and on-skill-use (2 triggers).
5. 332040175 预备法术 - first 3 rounds, damage reduction +8% for 1 round each round; at end of round 3, heal self 5% max HP. effectType=stat-modifier + heal, triggers on-round-start (maxTriggers 3) and on-round-end (round-3 condition, once per battle).

### Passive skills (8)
6. 120001027 突破5 - when hit, gain 150 energy. effectType=energy (gain), trigger on-being-hit.
7. 120000046 自保 - when has debuff, damage reduction +10%. effectType=stat-modifier (damage-reduction), trigger on-round-start with has-debuff condition.
8. 120000051 蛰伏 - when HP below 50%, damage reduction +15%. effectType=stat-modifier (damage-reduction), trigger on-hp-threshold with hp-below-50 condition, once per battle.
9. 120000054 鼓舞 - on attack, ally gains 25 energy (approximated as self). effectType=energy (gain), trigger on-attack.
10. 120000055 反杀 - on attack vs target with higher HP%, crit rate +30% for 1 round. effectType=stat-modifier (crit-rate), trigger on-attack with target-hp-above-self condition.
11. 120000059 祝福 - first 2 rounds, heal bonus +20% for 2 rounds. effectType=stat-modifier (heal-bonus), trigger on-round-start, maxTriggers 2.
12. 120001005 战斗续航 - at round start if HP < 30%, heal self for 30% ATK. effectType=heal (percent-attack), trigger on-round-start with hp-below-30 condition.

### Normal (1)
13. normal-profession-4 Knight Basic Attack (防御) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001038 Skill 6910001038 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 14 skills using existing effect system (stat-modifier, energy, heal, shield, damage).
- Cloned implemented template from 闪耀甜心 (3020301) for mastery skills 332040171/332040172/332040173/332040174 and shared passive skills (120001027, 120000046, 120000051, 120000054, 120000055, 120000059), and 预备法术 (332040175) cloned from 通灵女巫's 傀儡咒术 (312040175) and adapted: 3-round damage-reduction 8% + round-3 heal 5% max HP.
- 战斗续航 (120001005) cloned from 吟游诗人 (1010101) (heal 0.3 ATK, hp-below-30 condition).
- ability/abilityDes tid fields corrected to match hero's own skill IDs.
- No new effect types, status types, or target types required; reused existing framework.

## Remaining Issues
- 鼓舞 (120000054) catalog says "友方普攻/绝招时能量回复25点" (ally normal/skill), but implementation triggers on self attack only (approximation; ally condition requires engine integration). requiresInvestigation.
- Ultimate 6910001038 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-3020401-skill-validation.test.mjs: 22/22 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF
echo written