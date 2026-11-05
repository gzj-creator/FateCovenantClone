# Hero 4020401 (铁拳莫林) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 4020401, Name: 铁拳莫林, Role: Ranger
- Stats: HP 630, ATK 95, DEF 60, SPD 106

## Skills Validated (14 total)

### Mastery skills (5)
1. 342040171 不屈 - on battle start final damage reduction +5%. effectType=stat-modifier (damage-reduction), trigger on-round-start, once per battle.
2. 342040172 健壮 - on battle start max HP +5%. effectType=stat-modifier (max-hp-percent), trigger on-round-start, once per battle.
3. 342040173 超群技艺 - on battle start status hit +10% and status resist +10%. effectType=stat-modifier (status-hit, status-resist), 2 triggers on-round-start, once per battle.
4. 342040174 气定神闲 - after normal/skill, 30% chance to gain 100 energy. effectType=energy (gain), triggers on-attack and on-skill-use, chance 0.3.
5. 342040175 荡破千军 - on battle start, reduce all enemies status-resist by 5% (energy-reduction resist portion requires investigation). effectType=stat-modifier (status-resist), trigger on-round-start, once per battle. requiresInvestigation.

### Passive skills (8)
6. 120001028 突破6 - +50 energy on ally normal/skill. effectType=energy (gain), triggers on-attack and on-skill-use.
7. 120000032 反弹 - rebound rate +10% when hit by back-row. effectType=stat-modifier (rebound-rate), trigger on-being-hit.
8. 120000034 铁甲 - anti-crit +20% when HP > 50%. effectType=stat-modifier (anti-crit), trigger on-round-start with hp-above-50 condition.
9. 120000037 亢奋 - +100 energy on kill. effectType=energy (gain), trigger on-kill.
10. 120000042 暴怒 - crit damage +30% on skill use. effectType=stat-modifier (crit-damage), trigger on-skill-use.
11. 120000044 奋激 - damage reduction +20% after first ultimate. effectType=stat-modifier (damage-reduction), trigger on-ultimate-use, once per battle.
12. 120001006 专注一击 - damage bonus +50% after ultimate for 2 rounds. effectType=stat-modifier (damage-bonus), trigger on-ultimate-use, timed 2 rounds.

### Normal (1)
13. normal-profession-3 Ranger Basic Attack (辅助) - project fallback (damage 1.0x single).

### Ultimate (1)
14. 6910001054 Skill 6910001054 - metadata fallback -> 2.0x physical damage single. requiresInvestigation.

## Skills Fixed
- Previously all 14 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Cloned implemented templates from 糖果侦探 (3010201) for shared mastery/passive skills, adapted to 铁拳莫林 skill IDs.
- 荡破千军 (342040175) described "reduce enemy status resist and energy-reduction resist by 5% on battle start"; implemented status-resist -0.05 vs all-enemies on round start (energy-reduction resist part has no dedicated stat type; requiresInvestigation).
- ability/abilityDes tid fields corrected to match hero's own skill IDs where present.
- No new effect types, status types, or target types required; reused existing framework.

## Remaining Issues
- 荡破千军 (342040175) catalog also mentions "energy-reduction resist" lowering; no dedicated stat type exists (energy-bonus is actor-side). Implemented status-resist portion only. requiresInvestigation.
- Ultimate 6910001054 is metadata fallback (missing description). requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-4020401-skill-validation.test.mjs: 21/21 passing
EOF
echo done