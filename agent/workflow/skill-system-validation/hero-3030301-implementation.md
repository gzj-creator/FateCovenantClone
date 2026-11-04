# Hero 3030301 (厉火之咒) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 3030301, Name: 厉火之咒, Role: Warrior
- Stats: HP 1800, ATK 330, DEF 82, SPD 97

## Skills Validated (14 total)

### Mastery skills (5)
1. 333030171 重击 - on battle start final damage bonus +5%. effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
2. 333030172 无畏 - on battle start attack +5%. effectType=stat-modifier (attack-percent), trigger on-round-start, once per battle.
3. 333030173 直击要害 - on battle start crit rate +5% and crit damage +10%. effectType=stat-modifier (crit-rate, crit-damage), 2 triggers on-round-start, once per battle.
4. 333030174 炽星魔焰 - (Metadata only) after normal/skill, 30% chance to apply 1 burn stack for 2 rounds. effectType=status (burn), triggers on-attack and on-skill-use, chance 0.3. requiresInvestigation.
5. 333030175 燃魔咒刃 - on ultimate use, crit rate +10% and crit damage +15% for 2 rounds. effectType=stat-modifier (crit-rate, crit-damage), triggers on-ultimate-use.

### Passive skills (7)
6. 120001031 突破9 - extra 200 energy on normal/skill. effectType=energy (gain), triggers on-attack and on-skill-use.
7. 120000001 狂怒 - on ultimate use, crit rate +15%. effectType=stat-modifier (crit-rate), trigger on-ultimate-use.
8. 120000006 勃发 - when HP > 50%, crit damage +20%. effectType=stat-modifier (crit-damage), trigger on-round-start with hp-above-50 condition.
9. 120000009 鼓舞 - +25 energy when ally uses normal/skill. effectType=energy (gain), triggers on-attack and on-skill-use.
10. 120000014 格挡 - damage reduction 20% before 2nd ultimate (approximated). effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle. requiresInvestigation.
11. 120000015 标记 - crit rate +25% when attacking debuffed target. effectType=stat-modifier (crit-rate), trigger on-attack with target-has-debuff condition.
12. 120001002 生命偷取 - ultimate damage 10% lifesteal (approximated as heal). effectType=heal (percent-attack), trigger on-ultimate-use. requiresInvestigation.

### Normal (1)
13. normal-profession-1 Warrior Basic Attack (攻击) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001030 Skill 6910001030 - metadata fallback -> 2.0x physical damage single. requiresInvestigation.

## Skills Fixed
- Previously all 13 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 13 skills using existing effect system (stat-modifier, energy, damage, heal, status).
- Cloned implemented templates from other Warrior heroes (观星者 1030301, 猎魔人 1020201) for shared mastery/passive skills, adapted to 厉火之咒 skill IDs.
- 炽星魔焰 (333030174) was missing from skill-database.json entirely (Metadata only, no prior implementation); added as burn status with 0.3 chance and requiresInvestigation.
- ability/abilityDes tid fields corrected to match hero's own skill IDs where present.
- No new effect types, status types, or target types required; reused existing framework.
- Normalized triggers: added conditionKey/chance/priority/cooldown/maxTriggers/oncePerBattle/oncePerRound where missing.

## Remaining Issues
- 炽星魔焰 (333030174) catalog says "30% chance to apply 1 burn stack for 2 rounds" (Metadata only); implementation approximates burn as status with 0.3 chance but stack count and DoT damage not fully modeled. requiresInvestigation.
- 格挡 (120000014) catalog says "damage reduction 20% before 2nd ultimate" (conditional on ultimate count); implementation approximates as once-per-battle damage-reduction on round start. requiresInvestigation.
- 生命偷取 (120001002) catalog says "ultimate damage 10% lifesteal"; implementation approximates as heal 10% attack on ultimate use. requiresInvestigation.
- Ultimate 6910001030 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-3030301-skill-validation.test.mjs: 20/20 passing