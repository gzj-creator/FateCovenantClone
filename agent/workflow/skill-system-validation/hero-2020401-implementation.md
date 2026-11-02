# Hero 2020401 (哞哞号手) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 2020401, Name: 哞哞号手, Role: Assassin
- Stats: HP 600, ATK 100, DEF 60, SPD 101

## Skills Validated (14 total)

### Mastery skills (5)
1. 322040171 重击 - on battle start final damage bonus +5%. effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
2. 322040172 无畏 - on battle start attack +5%. effectType=stat-modifier (attack-percent), trigger on-round-start, once per battle.
3. 322040173 弱点洞悉 - on battle start ignore defense +5% and hit rate +10%. effectType=stat-modifier, 2 triggers on-round-start.
4. 322040174 迎头痛击 - after normal/skill, self status-hit +30% for 1 round. effectType=stat-modifier (status-hit), triggers on-attack and on-skill-use.
5. 322040175 无处遁形 - 焦热 additionally lowers enemy final evasion 10%. Evasion stat not supported; approximated as self hit-rate +10% (requiresInvestigation).

### Passive skills (8)
6. 120001026 突破4 - initial energy +600. effectType=energy, trigger on-round-start once per battle.
7. 120000018 破盾 - damage to defense-type adventurers +15%. Approximated as permanent damage-bonus +15% on battle start (target defense-type condition not enforced). effectType=stat-modifier, trigger on-round-start.
8. 120000019 锋刃 - normal/skill damage +30%. effectType=stat-modifier (damage-bonus), trigger on-round-start.
9. 120000023 激怒 - normal/skill grants +100 energy. effectType=energy, triggers on-attack and on-skill-use.
10. 120000025 戒备 - when self has buff, crit-resistance +30%. effectType=stat-modifier (crit-resistance), triggers on-round-start and on-buff-gain (buff condition approximated).
11. 120000028 鹰眼 - when HP > 50%, hit-rate +15%. effectType=stat-modifier (hit-rate), trigger on-round-start with hp-above-50 condition.
12. 120001008 奋力一击 - ultimate damage to highest-HP enemy +30%. effectType=stat-modifier (damage-bonus), trigger on-ultimate-use; target-HP condition not enforced (requiresInvestigation).

### Normal (1)
13. normal-profession-2 Assassin Basic Attack (冲锋) - project fallback (damage 1.0x single).

### Ultimate fallback (1)
14. 6910001025 Skill 6910001025 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all implementations lacked effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, effects[], and triggers[] to all 14 skills using existing effect system (stat-modifier, energy, damage).
- No new effect types, status types, or target types required; reused existing framework.
- 无处遁形 (322040175) marked requiresInvestigation because evasion stat is not supported in STAT_TYPES; approximated as hit-rate +10%.
- 奋力一击 (120001008) marked requiresInvestigation because highest-HP-enemy target condition not enforced.
- 6910001025 ultimate marked requiresInvestigation (metadata fallback).

## Remaining Issues
- 无处遁形 (322040175): 焦热 lowering enemy final evasion 10% requires an evasion stat type not present in effect-types.mjs; approximated. Exact implementation requires adding evasion stat support (requiresInvestigation).
- 奋力一击 (120001008): target HP condition (highest-HP enemy) not enforced; approximated as permanent damage-bonus on ultimate use. requiresInvestigation.
- 破盾 (120000018): target defense-type condition not enforced; approximated as permanent damage-bonus.
- 戒备 (120000025): buff-presence condition approximated via on-buff-gain trigger.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-2020401-skill-validation.test.mjs: 19/19 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
