# Hero 2020601 (影之菖蒲) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero

- ID: 2020601, Name: 影之菖蒲, Role: Assassin
- Stats: HP 600, ATK 100, DEF 60, SPD 101

## Skills Validated (14 total)

### Mastery skills (5)

1. 322060171 重击 - battle start final damage bonus +5%. effectType=stat-modifier, trigger on-round-start once per battle.
2. 322060172 无畏 - battle start attack +5%. effectType=stat-modifier, trigger on-round-start once per battle.
3. 322060173 弱点洞悉 - battle start ignore defense +5% and hit rate +10%. effectType=stat-modifier, 2 triggers on-round-start once per battle.
4. 322060174 会心一击 - on normal/skill, extra ignore defense 5% and final damage 5% for 1 round. effectType=stat-modifier, triggers on-attack and on-skill-use (4 triggers).
5. 322060175 割魂厄鬼 - first 3 ultimates, crit rate +15% and crit damage +20%. effectType=stat-modifier, 2 triggers on-ultimate-use with maxTriggers=3.

### Passive skills (7)

6. 120001026 突破4 - initial energy +600. effectType=energy, trigger on-round-start once per battle.
7. 120000019 锋刃 - normal/skill damage +30%. effectType=stat-modifier (damage-bonus 0.30), trigger on-round-start once per battle.
8. 120000023 激怒 - normal/skill energy +100. effectType=energy, triggers on-attack and on-skill-use.
9. 120000025 戒备 - when has buff, crit resistance +30%. effectType=stat-modifier (crit-resistance 0.30), triggers on-round-start once per battle and on-buff-gain.
10. 120000028 鹰眼 - HP above 50%, hit rate +15%. effectType=stat-modifier (hit-rate 0.15), trigger on-round-start once per battle with hp-above-50 condition.
11. 120001004 爆裂一击 - first ultimate, crit rate +100%. effectType=stat-modifier (crit-rate 1.0), trigger on-ultimate-use once per battle.
12. 120001011 振奋加持 - HP above 70%, attack +5%. effectType=stat-modifier (attack-percent 0.05), trigger on-round-start once per battle with hp-above-70 condition.

### Normal (1)

13. normal-profession-2 Assassin Basic Attack - project fallback (damage 1.0x single).

### Passive metadata-only (1)

14. 6202060112 无限瞬杀 - ultimate follow-up attack count changes from 2 to infinite. Metadata only; engine does not model follow-up attack count (requiresInvestigation). Added to skill database as a metadata-only entry (no effects/triggers).

## Skills Fixed

- Previously all 13 stored skills (normal + 5 mastery + 6 passive) had no effectType/effects/triggers (only ability/abilityDes metadata); the 14th skill (6202060112) was missing entirely from the database.
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 13 resolved skills using existing effect system (stat-modifier, energy, damage).
- Added missing 6202060112 metadata-only passive entry.
- Fixed 120001011 description (was concatenated with 6202060112 text in source; separated).
- Added hp-above-70 condition key support in skill-integration.mjs evaluateConditionKey.
- No new effect types, status types, or target types required; reused existing framework.

## Validation Notes

- 120001011 description in catalog: "生命高于70%时，提升5%攻击力" (attack +5% when HP above 70%). The stored DB description had been concatenated with the 无限瞬杀 description; corrected.
- 6202060112 (无限瞬杀) is "Metadata only" in catalog: engine does not model ultimate follow-up attack count, so marked requiresInvestigation with empty effects/triggers. Consistent with other metadata-only skills (e.g., 6102060102-style rare skills that are not yet executable).
- 戒备 (120000025) description: "自身有增益状态时，抗暴率提升30%". Approximated as crit-resistance +0.30 on round-start once plus on-buff-gain trigger (engine fires on any buff gain). requiresInvestigation not set (consistent with 鱼缸头 120000025 handling).
- 鹰眼 (120000028) description: "血量高于50%时，命中率提升15%". Approximated as permanent hit-rate +0.15 gated by hp-above-50 condition on round start (condition evaluated at trigger fire).

## Remaining Issues

- 6202060112 (无限瞬杀) requires engine support for ultimate follow-up attack count; not implemented. requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration

- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.
- Small change to skill-integration.mjs: added 'hp-above-70' case to evaluateConditionKey (needed for 振奋加持).

## Test Results

- personal-server/test/hero-2020601-skill-validation.test.mjs: 20/20 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF