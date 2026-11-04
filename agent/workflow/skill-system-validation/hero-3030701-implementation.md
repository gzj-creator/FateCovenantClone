# Hero 3030701 (焰舞) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 3030701, Name: 焰舞, Role: Warrior
- Stats: HP 1800, ATK 330, DEF 82, SPD 97

## Skills Validated (14 total)

### Mastery skills (5)
1. 333070171 重击 - on battle start final damage bonus +5%. effectType=stat-modifier (damage-bonus), trigger on-round-start, once per battle.
2. 333070172 无畏 - on battle start attack +5%. effectType=stat-modifier (attack-percent), trigger on-round-start, once per battle.
3. 333070173 流火天降 - on battle start crit rate +5% and crit damage +10%. effectType=stat-modifier (crit-rate, crit-damage), 2 triggers on-round-start, once per battle.
4. 333070174 喷薄焰火 - after normal/skill, attack +3% for 1 round. effectType=stat-modifier (attack-percent), triggers on-attack and on-skill-use (2 triggers).
5. 333070175 毁灭业火 - on ultimate use, crit rate +10% and crit damage +15% for 2 rounds. effectType=stat-modifier (crit-rate, crit-damage), 2 triggers on-ultimate-use.

### Passive skills (7)
6. 120001031 突破9 - normal/skill grants self 200 energy. effectType=energy (gain), triggers on-attack and on-skill-use.
7. 120000001 狂怒 - on ultimate use, crit rate +15%. effectType=stat-modifier (crit-rate), trigger on-ultimate-use.
8. 120000006 勃发 - when HP > 50%, crit damage +20%. effectType=stat-modifier (crit-damage), trigger on-round-start with hp-above-50 condition.
9. 120000009 鼓舞 - on normal/skill, self gains 25 energy (ally approximation). effectType=energy (gain), triggers on-attack and on-skill-use.
10. 120000014 格挡 - before 2nd ultimate, ultimate damage taken -20% (approximated). effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle. requiresInvestigation.
11. 120000015 标记 - when attacking debuffed target, crit rate +25%. effectType=stat-modifier (crit-rate), trigger on-attack with target-has-debuff condition.
12. 120001008 奋力一击 - ultimate damage to highest-HP enemy +30% (target-HP condition not enforced). effectType=stat-modifier (damage-bonus), trigger on-ultimate-use. requiresInvestigation.

### Normal (1)
13. normal-profession-1 Warrior Basic Attack (攻击) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001034 Skill 6910001034 - metadata fallback -> 2.0x physical damage single. requiresInvestigation.

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all skills using existing effect system (stat-modifier, energy, damage).
- Cloned implemented templates from 厉火之咒 (3030301) (same Warrior mastery/passive pattern) for mastery skills 333070171/333070172/333070173/333070174/333070175 and shared passive skills (120001031, 120000001, 120000006, 120000009, 120000014, 120000015, 120001008), adapted to 焰舞 skill IDs.
- 喷薄焰火 (333070174) hand-authored: attack-percent +0.03 timed 1 round on attack/skill-use.
- ability/abilityDes tid fields preserved from original hero's metadata.
- No new effect types, status types, or target types required; reused existing framework.

## Remaining Issues
- 格挡 (120000014) catalog says "释放第2次终结技前，受到终结技伤害降低20%" but approximated as battle-start permanent reduction. requiresInvestigation.
- 奋力一击 (120001008) catalog says "终结技对敌方生命最高单位造成的最终伤害提升30%" but target-HP condition not enforced. requiresInvestigation.
- Ultimate 6910001034 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-3030701-skill-validation.test.mjs: 20/20 passing
