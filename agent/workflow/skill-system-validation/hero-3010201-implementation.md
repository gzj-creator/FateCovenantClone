# Hero 3010201 (糖果侦探) Skill Validation & Implementation

Date: 2026-11-03
Branch: skill-system-validation

## Hero
- ID: 3010201, Name: 糖果侦探, Role: Ranger
- Stats: HP 630, ATK 95, DEF 60, SPD 105

## Skills Validated (14 total)

### Mastery skills (5)
1. 331020171 不屈 - on battle start final damage reduction +5%. effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle.
2. 331020172 健壮 - on battle start max HP +5%. effectType=stat-modifier (max-hp-percent), trigger on-round-start, once per battle.
3. 331020173 超群技艺 - on battle start status hit and resist +10%. effectType=stat-modifier (status-hit, status-resist), 2 triggers on-round-start, once per battle.
4. 331020174 气定神闲 - after normal/skill, 30% chance to gain 100 energy. effectType=energy (gain), triggers on-attack and on-skill-use (chance 0.3).
5. 331020175 伟大创造 - on ultimate use, back-row allies +12% crit damage for 2 rounds. effectType=stat-modifier (crit-damage, targetType all-allies), trigger on-ultimate-use. requiresInvestigation (back-row ally targeting approximated as all-allies).

### Passive skills (8)
6. 120001028 突破6 - on ally normal/skill, self gains 50 energy. effectType=energy (gain), triggers on-attack and on-skill-use.
7. 120000032 反弹 - when hit by back-row enemy, rebound rate +10%. effectType=stat-modifier (rebound-rate), trigger on-being-hit (back-row condition not enforced). requiresInvestigation.
8. 120000034 铁甲 - when HP > 50%, anti-crit +20%. effectType=stat-modifier (anti-crit), trigger on-round-start (hp-above-50 condition not wired; requiresInvestigation).
9. 120000037 亢奋 - when enemy knocked back/killed, self gains 100 energy. effectType=energy (gain), trigger on-kill (approximated from "enemy retreat").
10. 120000042 暴怒 - on energy skill use, crit damage +30%. effectType=stat-modifier (crit-damage), trigger on-skill-use.
11. 120000044 奋激 - after first ultimate, damage reduction +20%. effectType=stat-modifier (damage-reduction), trigger on-ultimate-use, once per battle.
12. 120001006 专注一击 - after ultimate, next normal/skill damage +50%. effectType=stat-modifier (damage-bonus), trigger on-ultimate-use, timed 2 rounds.

### Normal (1)
13. normal-profession-3 Ranger Basic Attack (辅助) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001041 Skill 6910001041 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 14 skills using existing effect system (stat-modifier, energy, damage).
- Cloned implemented template from 吟游诗人 (1010101) for mastery skills 331020171/331020172/331020173/331020174/331020175 and adapted to 糖果侦探 skill IDs.
- Reused shared passive skills (120001028, 120000032, 120000034, 120000037, 120000042, 120000044, 120001006) from existing implemented heroes.
- ability/abilityDes tid fields corrected to match hero's own skill IDs.
- No new effect types, status types, or target types required; reused existing framework.
- 伟大创造 (331020175) marked requiresInvestigation: "back-row ally" targeting approximated as all-allies (no back-row-ally target type in current selector).

## Remaining Issues
- 伟大创造 (331020175) targets "back-row allies" but current selector only supports all-allies/front-row/back-row enemies; approximated as all-allies. Requires investigation / future target type.
- 铁甲 (120000034) should only apply when HP > 50%; conditionKey not wired (hp-above-50) in current implementation for this hero. Requires investigation.
- 反弹 (120000032) should only trigger when hit by back-row enemy; condition not enforced. Requires investigation.
- 亢奋 (120000037) "enemy knocked back" approximated as on-kill; exact knockback trigger not modeled. Requires investigation.
- Ultimate 6910001041 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-3010201-skill-validation.test.mjs: 20/20 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF