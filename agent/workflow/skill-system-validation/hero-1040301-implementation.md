# Hero 1040301 (伊丽丝) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero

- ID: 1040301, Name: 伊丽丝, Role: Ranger
- Stats: HP 6600, ATK 900, DEF 300, SPD 108
- Hero Type: Demigod (天极角色) with soul (魂/魂殇/彼岸花) mechanics

## Skills Validated (15 total)

### Ultimate (2)

1. 2104030123 魂归彼岸 - 130% magical damage to all enemies; adds 1-5 layers 魂殇 (approx -2% attack/defense per layer, 2 rounds); battle-start 彼岸花 on enemies; death-based 魂 gain; Tianji cost 3. requiresInvestigation.
2. 6910001067 Skill 6910001067 - metadata fallback -> 2.0x physical damage single. requiresInvestigation.

### Mastery skills (5)

3. 314030171 幽焰噬魂 - battle start +2 soul layers; when gaining soul via death (incl. overflow) gain shield 20% max HP (approx on battle start). requiresInvestigation.
4. 314030172 灵灯眠魂 - first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); after self ultimate all allies shield bonus +5%, max 5 stacks, removed at round end; shield-bonus stacks not enforced. requiresInvestigation.
5. 314030173 引魂归灯 - when self gains soul via death (incl. overflow), other allies gain shield 10% max HP (approx on battle start); every 2 soul gains self gains 1 layer {0} (unknown, not wired). requiresInvestigation.
6. 314030174 梦萦魂绕 - after normal/skill gain 1 Tianji (approx energy +100); all allies damage taken -20% and ultimate damage +20% (permanent). Soul cap 8 and 永眠终曲 handled in 314030175. requiresInvestigation.
7. 314030175 安魂长眠 - soul cap raised to 8; when soul reaches 8, ultimate enhanced to 永眠终曲: 30% chance to inflict {0} (status unknown, approximated stun) on target, max 2/unit/round. requiresInvestigation.

### Passive skills (7)

8. 120001028 突破6 - ally normal/skill grants self 50 energy. effectType=energy.
9. 120000033 陷阵 - damage to front-row enemies +10% (front-row condition not enforced). requiresInvestigation.
10. 120000035 齐心 - damage +3% per teammate in battle (max 15%, approximated max +0.15). Teammate count not enforced. requiresInvestigation.
11. 120000036 急救 - when ally HP < 50%, healing to them +15% (ally HP condition not enforced). requiresInvestigation.
12. 120000041 蓄势 - from round 2, ignore defense +15% (round gating not enforced). requiresInvestigation.
13. 120000044 奋激 - after first ultimate, damage reduction +20% (once per battle).
14. 120001003 生命护盾 - when HP first drops below 70%, gain shield 80% defense for 2 rounds (once per battle).

### Normal (1)

15. normal-profession-3 Ranger Basic Attack - project fallback (damage 1.0x single).

## Skills Fixed

- Previously all implementations were null for this hero (no effectType/effects/triggers).
- Inserted missing Mastery skill 314030175 (安魂长眠) which was present in catalog but absent from skill-database.json.
- Added effectType, effects[], and triggers[] to all 15 skills using existing effect system (damage, heal, shield, stat-modifier, energy, status).
- No new effect types, status types, or target types required; reused existing ones.
- Soul (魂/魂殇/彼岸花) mechanics approximated with requiresInvestigation=true due to lack of engine support for soul stacking, Tianji (天极值) cost/consumption, and layer-based scaling; marked for further investigation.

## Remaining Issues

- Soul (魂) stacking, Tianji (天极值) cost/consumption, layer-based scaling (魂殇 1-5 layers), 彼岸花 energy/HP sync, and 永眠终曲 enhancement require battle-engine integration (not yet wired). All soul/domain-related skills marked requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Test Results

- personal-server/test/hero-1040301-skill-validation.test.mjs: 20/20 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing