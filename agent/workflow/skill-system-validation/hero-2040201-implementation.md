# Hero 2040201 (幽艳瑞贝卡) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 2040201, Name: 幽艳瑞贝卡, Role: Assassin
- Stats: HP 6600, ATK 900, DEF 300, SPD 103
- Hero Type: Demigod (天极角色) with candy (给了糖也捣蛋) mechanics

## Skills Validated (15 total)

### Ultimate (1)
1. 2204020123 捣蛋到底 - 130% magical damage to all enemies; consume all candy (给了糖也捣蛋) layers, each dealing 60% magical damage to a random unit. Candy layer scaling and per-layer application require engine integration (requiresInvestigation). Tianji cost 3. effectType=damage, requiresInvestigation=true.

### Mastery skills (5)
2. 324020171 糖果礼花 - on ultimate, each candy deals extra 4% target max HP magical damage (cap 80% attack, not enforced); after self normal, +400 energy. requiresInvestigation. effectType=damage.
3. 324020172 活力全开 - first ultimate each round reduces a random enemy Tianji by 1 (approx -100 energy); after self ultimate +10% final damage (max +30%), removed end of round. requiresInvestigation. effectType=stat-modifier.
4. 324020173 送别礼物 - after self action round ends, extra ultimate once, and before that ultimate destroy 20% shield of all enemies. Extra action + shield destroy require engine integration (requiresInvestigation). effectType=damage, requiresInvestigation=true.
5. 324020174 闪亮登场 - every round normal/skill grants +1 Tianji (approx +100 energy); after self ultimate, target final damage reduction -15% (max -60%), 2 rounds. requiresInvestigation. effectType=energy.
6. 324020175 完美恶作剧 - first ultimate and first Tianji each round: +60% final crit and ignore 60% defense. requiresInvestigation. effectType=stat-modifier.

### Passive skills (8)
7. 120001026 突破4 - initial energy +600. effectType=energy.
8. 120000001 狂怒 - on ultimate, crit rate +15%. effectType=stat-modifier.
9. 120000006 勃发 - when HP > 50%, crit damage +20%. condition hp-above-50. effectType=stat-modifier.
10. 120000009 鼓舞 - on ally normal/skill, self +25 energy (approximated as self trigger; ally condition requires investigation). effectType=energy, requiresInvestigation=true.
11. 120000014 格挡 - before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction). requiresInvestigation. effectType=stat-modifier.
12. 120000015 标记 - attacking debuffed target, crit rate +25%. condition target-has-debuff. effectType=stat-modifier.
13. 120001004 爆裂一击 - first ultimate, crit rate +100%. oncePerBattle. effectType=stat-modifier.

### Normal / Ultimate fallback (2)
14. normal-profession-2 Assassin Basic Attack (冲锋) - project fallback (damage 1.0x single).
15. 6910001100 Skill 6910001100 - ultimate, metadata fallback -> damage 2.0x (single, requiresInvestigation).

## Candy Mechanic Implementation (Special Attention)
- 幽艳瑞贝卡 is a Demigod with candy (给了糖也捣蛋) mechanics.
- Candy layers: other allies gain 1 layer when they use an ultimate (max 5), each layer +8% crit damage and +8% final damage bonus; removed after ultimate use.
- Ultimate consumes all candy layers, each dealing 60% magical damage to a random unit (plus base 130% to all enemies).
- 糖果礼花 (324020171): on ultimate, each candy deals extra 4% target max HP magical damage (cap 80% attack).
- Candy layer gain, stacking (max 5), per-layer stat bonuses, and per-layer consumption damage require battle-engine integration (not yet wired); all candy-related skills marked requiresInvestigation=true.
- Tianji (天极值) cost/consumption, layer tracking and per-action application require engine integration.

## Skills Fixed
- Previously all 15 skills lacked effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 15 skills using existing effect system (damage, stat-modifier, energy).
- Reused shared passive skills (120001026, 120000001, 120000006, 120000009, 120000014, 120000015, 120001004) from existing implemented heroes.
- No new effect types, status types, or target types required.

## Remaining Issues
- Candy (给了糖也捣蛋) layer gain on ally ultimate, stacking (max 5), per-layer stat bonuses (+8% crit damage, +8% final damage), and consumption damage require battle-engine integration (not yet wired). All candy-related skills marked requiresInvestigation=true.
- 送别礼物 (324020173) extra ultimate action + shield destroy require engine integration.
- 活力全开/闪亮登场 Tianji (天极值) mapping approximated as energy; requires investigation.
- 完美恶作剧 first-use-per-round tracking requires investigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.
- Fixed skill-integration.mjs registerPassiveTriggers to handle empty trigger arrays (skills with triggers:[]) without skipping.

## Test Results
- personal-server/test/hero-2040201-skill-validation.test.mjs: 21/21 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF
echo written