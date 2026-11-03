# Hero 3020501 (灵刃艾莉) Skill Validation & Implementation

Date: 2026-11-03
Branch: skill-system-validation

## Hero
- ID: 3020501, Name: 灵刃艾莉, Role: Assassin
- Stats: HP 600, ATK 100, DEF 60, SPD 101

## Skills Validated (14 total)

### Mastery skills (5)
1. 332050171 重击 - on battle start final damage bonus +5%. effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
2. 332050172 无畏 - on battle start attack +5%. effectType=stat-modifier (attack-percent), trigger on-round-start, once per battle.
3. 332050173 弱点洞悉 - on battle start ignore defense +5% and hit rate +10%. effectType=stat-modifier (ignore-defense, hit-rate), 2 triggers on-round-start, once per battle.
4. 332050174 会心一击 - on normal/skill, ignore defense +5% and final damage +5% for 1 round. effectType=stat-modifier (ignore-defense, damage-bonus), triggers on-attack and on-skill-use (4 triggers).
5. 332050175 涌灵刺刃 - first 3 ultimates, crit rate +15% and crit damage +20%. effectType=stat-modifier (crit-rate, crit-damage), triggers on-ultimate-use (maxTriggers 3).

### Passive skills (8)
6. 120001026 突破4 - initial energy +600 on battle start. effectType=energy (gain), trigger on-round-start, once per battle.
7. 120000018 破盾 - damage to defender-type adventurers +15% (approximated as permanent damage-bonus). effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
8. 120000019 锋刃 - normal/skill damage +30%. effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
9. 120000023 激怒 - on normal/skill, extra 100 energy. effectType=energy (gain), triggers on-attack and on-skill-use.
10. 120000025 戒备 - when has buff, crit resistance +30%. effectType=stat-modifier (crit-resistance), triggers on-round-start and on-buff-gain.
11. 120000028 鹰眼 - when HP > 50%, hit rate +15%. effectType=stat-modifier (hit-rate), trigger on-round-start with hp-above-50 condition, once per battle.
12. 120001006 专注一击 - after ultimate, next normal/skill damage +50% for 2 rounds. effectType=stat-modifier (damage-bonus), trigger on-ultimate-use.

### Normal (1)
13. normal-profession-2 Assassin Basic Attack (冲锋) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001039 Skill 6910001039 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 14 skills using existing effect system (stat-modifier, energy, damage).
- Cloned implemented template from 鱼缸头 (1010201) for mastery skills 332050171/332050172/332050173/332050174/332050175 and shared passive skills (120001026, 120000018, 120000019, 120000023, 120000025, 120000028, 120001006), adapted to 灵刃艾莉 skill IDs.
- ability/abilityDes tid fields corrected to match hero's own skill IDs.
- No new effect types, status types, or target types required; reused existing framework.
- Normalized triggers: added conditionKey/chance/priority/cooldown/maxTriggers/oncePerBattle/oncePerRound where missing; set 鹰眼 conditionKey to hp-above-50.

## Remaining Issues
- 破盾 (120000018) catalog says "对防御型冒险者造成的伤害提升15%" (defender-type condition), but implementation approximates as permanent damage-bonus (defender-type condition not enforced). requiresInvestigation.
- 戒备 (120000025) catalog says "自身有增益状态时，抗暴率提升30%" (conditional on having buff), but implementation triggers on-round-start and on-buff-gain without gating condition (condition not enforced). requiresInvestigation.
- 鹰眼 (120000028) catalog says "血量高于50%时，命中率提升15%" (conditional on HP > 50%); conditionKey set to hp-above-50 but engine gating may need verification. requiresInvestigation.
- Ultimate 6910001039 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-3020501-skill-validation.test.mjs: 20/20 passing
