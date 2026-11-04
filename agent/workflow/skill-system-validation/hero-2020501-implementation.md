# Hero 2020501 (炎拳) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 2020501, Name: 炎拳, Role: Ranger
- Stats: HP 630, ATK 95, DEF 60, SPD 106

## Skills Validated (14 total)

### Mastery skills (5)
1. 322050171 不屈 - battle start final damage reduction +5%. effectType=stat-modifier (damage-reduction), trigger on-round-start once per battle.
2. 322050172 健壮 - battle start max HP +5%. effectType=stat-modifier (max-hp-percent), trigger on-round-start once per battle.
3. 322050173 超群技艺 - battle start status hit +10% and status resist +10%. effectType=stat-modifier (status-hit, status-resist), 2 triggers on-round-start once per battle. (Fixed concatenated description: removed extra 锁链 text.)
4. 322050174 无间囚笼 - after normal/skill, 30% chance to add 1 layer 锁链 (chain) to target for 2 rounds. Metadata only, requiresInvestigation (chain status not modeled). Added as new skill entry (was missing from DB). effectType=status, triggers on-attack and on-skill-use with chance 0.3.
5. 322050175 锢魂之咒 - enhances 锁链, additionally lowering target crit 5% and evade 5%. requiresInvestigation (chain status not modeled); empty effects/triggers.

### Passive skills (8)
6. 120001028 突破6 - on ally normal/skill, self gains 50 energy. effectType=energy, triggers on-attack and on-skill-use.
7. 120000032 反弹 - when hit by back-row enemy, rebound rate +10%. effectType=stat-modifier (rebound-rate), trigger on-being-hit.
8. 120000034 铁甲 - when HP > 50%, anti-crit +20%. effectType=stat-modifier (anti-crit), trigger on-round-start with hp-above-50 condition.
9. 120000037 亢奋 - when enemy knocked back/killed, self gains 100 energy. effectType=energy, trigger on-kill.
10. 120000042 暴怒 - on energy skill use, crit damage +30%. effectType=stat-modifier (crit-damage), trigger on-skill-use.
11. 120000044 奋激 - after first ultimate, damage reduction +20%. effectType=stat-modifier (damage-reduction), trigger on-ultimate-use once per battle.
12. 120001003 生命护盾 - first time HP < 70%, gain shield = 80% DEF for 2 rounds. effectType=shield, trigger on-hp-threshold once per battle with hp-below-70 condition.

### Normal (1)
13. normal-profession-3 Ranger Basic Attack (辅助) - project fallback (damage 1.0x single).

### Ultimate fallback (1)
14. 6910001026 Skill 6910001026 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 12 stored skills (normal + 4 mastery + 7 passive + ultimate) had no effectType/effects/triggers (only ability/abilityDes metadata); the 5th mastery (322050174 无间囚笼) was missing entirely from the database.
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 12 resolved skills using existing effect system (stat-modifier, energy, shield, damage).
- Added missing 322050174 metadata-only mastery entry (chain status).
- Fixed 322050173 description (was concatenated with 无间囚笼 锁链 text in source; separated).
- 锢魂之咒 (322050175) marked requiresInvestigation (chain status not modeled); empty effects/triggers.
- No new effect types, status types, or target types required; reused existing framework (chain is a new statusType string 'chain' but not added to STATUS_TYPES enum; marked requiresInvestigation).

## Remaining Issues
- 无间囚笼 (322050174) 锁链 status and its base effect (crit/evade reduction) not modeled in engine; requiresInvestigation.
- 锢魂之咒 (322050175) conditional on 锁链 status; requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-2020501-skill-validation.test.mjs: 20/20 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
