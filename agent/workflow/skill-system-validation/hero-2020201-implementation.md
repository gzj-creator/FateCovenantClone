# Hero 2020201 (武姬月) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 2020201, Name: 武姬月, Role: Warrior
- Stats: HP 600, ATK 110, DEF 55, SPD 96
- Hero Type: Warrior (standard tier)

## Skills Validated (14 total)

### Mastery skills (5)
1. 322020171 重击 - final damage bonus +5% on battle start. effectType=stat-modifier (damage-bonus).
2. 322020172 无畏 - attack +5% on battle start. effectType=stat-modifier (attack-percent).
3. 322020173 直击要害 - crit rate +5% and crit damage +10% on battle start. effectType=stat-modifier.
4. 322020174 伺机待发 - after normal/skill, next ultimate damage +15% for 1 round. effectType=stat-modifier (damage-bonus, timed 1 round), triggers on-attack/on-skill-use.
5. 322020175 白虎掏心 - on ultimate use, crit rate +10% and crit damage +15% for 2 rounds. effectType=stat-modifier (timed 2 rounds), triggers on-ultimate-use.

### Passive skills (7)
6. 120001031 突破9 - +200 energy on normal/skill. effectType=energy, triggers on-attack/on-skill-use.
7. 120000001 狂怒 - on ultimate use, crit rate +15% permanent. effectType=stat-modifier (crit-rate).
8. 120000006 勃发 - HP above 50%, crit damage +20%. condition hp-above-50.
9. 120000009 鼓舞 - gain 25 energy on ally normal/skill (approximated as self trigger; ally condition requires investigation). requiresInvestigation.
10. 120000014 格挡 - ultimate damage taken -20% before 2nd ultimate (approximated as one-time trigger; exact turn tracking requires investigation). requiresInvestigation.
11. 120000015 标记 - crit rate +25% for 1 round when attacking debuffed target. condition target-has-debuff.
12. 120001002 生命偷取 - ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation.

### Normal / Ultimate fallback (2)
13. normal-profession-1 Warrior Basic Attack - project fallback (damage 1.0x single).
14. 6910001023 Skill 6910001023 - ultimate, metadata fallback -> damage 2.0x (single, requiresInvestigation).

## Skills Fixed
- Previously all implementations lacked effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, effects[], and triggers[] to 13 resolved skills (5 mastery + 7 passive + ultimate; normal/basic included).
- No new effect types, status types, or target types required; reused existing framework.
- All stat types used (damage-bonus, attack-percent, crit-rate, crit-damage, damage-reduction) already present in effect-types.mjs STAT_TYPES.
- Energy types used (gain) already present.

## Remaining Issues
- 鼓舞 (120000009) ally condition approximated as self trigger; precise ally detection requires engine integration.
- 格挡 (120000014) "before 2nd ultimate" turn tracking approximated as one-time trigger; exact tracking requires engine integration.
- 生命偷取 (120001002) lifesteal exact damage tracking requires engine integration; approximated as heal 20% attack.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Test Results
- personal-server/test/hero-2020201-skill-validation.test.mjs: 19/19 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF