# Hero 3020201 (啵啵水母) Skill Validation & Implementation

Date: 2026-11-03
Branch: skill-system-validation

## Hero
- ID: 3020201, Name: 啵啵水母, Role: Ranger
- Stats: HP 630, ATK 95, DEF 60, SPD 106

## Skills Validated (14 total)

### Mastery skills (5)
1. 332020171 不屈 - on battle start final damage reduction +5%. effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle.
2. 332020172 健壮 - on battle start max HP +5%. effectType=stat-modifier (max-hp-percent), trigger on-round-start, once per battle.
3. 332020173 超群技艺 - on battle start status hit and resist +10%. effectType=stat-modifier (status-hit, status-resist), 2 triggers on-round-start, once per battle.
4. 332020174 扶危定乱 - after normal/skill, dispel 1 debuff from a random ally. effectType=dispel (removeType=debuff), triggers on-attack and on-skill-use.
5. 332020175 护体波涛 - first time HP < 40%, gain shield = 15% max HP. effectType=shield (percent-max-hp), trigger on-hp-threshold with hp-below-40 condition, once per battle.

### Passive skills (8)
6. 120001028 突破6 - on ally normal/skill, self gains 50 energy. effectType=energy (gain), triggers on-attack and on-skill-use.
7. 120000034 铁甲 - when HP > 50%, anti-crit +20%. effectType=stat-modifier (anti-crit), trigger on-round-start.
8. 120000037 亢奋 - when enemy killed, self gains 100 energy. effectType=energy (gain), trigger on-kill.
9. 120000042 暴怒 - on skill use, crit damage +30%. effectType=stat-modifier (crit-damage), trigger on-skill-use.
10. 120000044 奋激 - after first ultimate, damage reduction +20%. effectType=stat-modifier (damage-reduction), trigger on-ultimate-use, once per battle.
11. 120001005 战斗续航 - at round start if HP < 30%, heal self for 30% ATK. effectType=heal (percent-attack), trigger on-round-start with hp-below-30 condition.
12. 120001015 均衡卸力 - after ultimate, evasion +20% for 1 round. effectType=stat-modifier (evasion), trigger on-ultimate-use. requiresInvestigation (evasion stat not in STAT_TYPES; approximated).

### Normal (1)
13. normal-profession-3 Ranger Basic Attack (辅助) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001036 Skill 6910001036 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 14 skills using existing effect system (stat-modifier, energy, shield, heal, dispel, damage).
- Cloned implemented templates from 吟游诗人 (1010101) for mastery skills 332020171/332020172/332020173 and shared passive skills (120001028, 120000034, 120000037, 120000042, 120000044, 120001005), adapted to 啵啵水母 skill IDs.
- 扶危定乱 (332020174) implemented as dispel (removeType=debuff) on random-ally, triggers on-attack and on-skill-use.
- 护体波涛 (332020175) implemented as on-hp-threshold shield 15% max HP at HP < 40%, once per battle.
- 均衡卸力 (120001015) implemented as stat-modifier evasion +20% for 1 round on ultimate (requiresInvestigation).
- normal-profession-3 cloned from 糖果侦探 (3010201) damage fallback.
- ability/abilityDes tid fields preserved from original hero's metadata.
- No new effect types, status types, or target types required; reused existing framework. Added 'hp-below-40' condition key to skill-integration.mjs.

## Remaining Issues
- 均衡卸力 (120001015) catalog says "终结技后，闪避增加20%，持续1回合"; evasion stat is not in STAT_TYPES, so 'evasion' is used as statType (requiresInvestigation). Engine does not currently process evasion; consistent with prior heroes.
- 扶危定乱 (332020174) catalog says "随机驱散1个友方的减益状态"; implemented as dispel on random-ally (targetType=random-ally). Engine target selection for random-ally is supported.
- Ultimate 6910001036 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.
- Added 'hp-below-40' condition key to evaluateConditionKey in skill-integration.mjs.

## Test Results
- personal-server/test/hero-3020201-skill-validation.test.mjs: 22/22 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF
echo done