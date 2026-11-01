# Hero 1020401 (通灵女巫) Skill Validation & Implementation

Date: 2026-11-01
Branch: investigate-5-3

## Hero
- ID: 1020401, Name: 通灵女巫, Role: Knight
- Stats: HP 660, ATK 90, DEF 60, SPD 111

## Skills Validated (14 total)

### Mastery skills (5)
1. 312040171 不屈 - 终极减伤 +5% on battle start -> stat-modifier damage-reduction 0.05 (on-round-start, oncePerBattle)
2. 312040172 健壮 - 最大HP +5% on battle start -> stat-modifier max-hp-percent 0.05 (on-round-start, oncePerBattle)
3. 312040173 泰然自若 - 抗暴+5%, 暴击伤害减免+10% -> stat-modifier crit-resist 0.05 + crit-damage-reduction 0.10 (on-round-start, oncePerBattle)
4. 312040174 迎头痛击 - 普攻/绝招后额外驱散目标1个增益 -> dispel count 1 buff (on-attack, on-skill-use) [NEW dispel mechanic]
5. 312040175 傀儡咒术 - 前3回合 -8% 受到伤害; 第3回合结束回复5%最大生命 -> stat-modifier damage-reduction 0.08 (maxTriggers 3) + heal percent-max-hp 0.05 (on-round-end, condition round-3, oncePerBattle)

### Passive skills (8)
6. 120001027 突破5 - 受到普攻/绝招回复150能量 -> energy gain 150 (on-being-hit)
7. 120000046 自保 - 自身有减益时免伤+10% -> stat-modifier damage-reduction 0.10 (on-round-start, condition has-debuff)
8. 120000051 蛰伏 - 生命<50% 时免伤+15% -> stat-modifier damage-reduction 0.15 (on-hp-threshold, condition hp-below-50, oncePerBattle)
9. 120000054 鼓舞 - 友方普攻/绝招时能量+25 -> energy gain 25 (on-attack, target all-allies)
10. 120000055 反杀 - 攻击生命%更高目标时暴击+30% -> stat-modifier crit-rate 0.30 (on-attack, condition target-hp-above-self, timed 1 round)
11. 120000059 祝福 - 前2回合被治愈+20% -> stat-modifier heal-bonus 0.20 (on-round-start, maxTriggers 2, timed 2 rounds)
12. 120001005 战斗续航 - 生命<30% 时回复 ATK 30% 最大生命 -> heal percent-attack 0.3 (on-round-start, condition hp-below-30)

### Normal / Ultimate
13. normal-profession-4 Knight Basic Attack - project fallback (damage 1.0x single)
14. 6910001012 Skill 6910001012 - ultimate, metadata fallback -> damage 2.0x (single)

## Skills Fixed
- Previously all implementations were null (skill-database.json had no effect definitions).
- Added effectType, effects[], and triggers[] to 13 resolved skills.
- registerPassiveTriggers prefers stored triggers over heuristic inference.
- Added dispel effect type to EffectExecutor (executeDispel) to support 迎头痛击 (312040174) debuff/dispel mechanics.
- Dispel removes up to count dispellable buffs (or debuffs) from target; non-dispellable statuses remain.

## Special: Debuff/Dispel Mechanics
- 通灵女巫's 迎头痛击 (312040174) is a dispel skill: "普攻/绝招后，额外驱散目标1个增益".
- Implemented as `dispel` effect type with removeType 'buff', count 1.
- Triggers on both on-attack and on-skill-use (normal + ultimate).
- New executeDispel method added to EffectExecutor; dispellable flag honored.

## Remaining Issues
- 反杀 condition (target HP% > self HP%) is approximated as always-true in trigger evaluation; precise per-target filtering not wired into trigger condition evaluation yet (requires further investigation).
- 6910001012 ultimate has no localized description (MISSING_ABILITY_DESCRIPTION); using metadata-fallback damage 2.0x.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers registered at battle start but processTriggers not yet called in executeTurn loop (integration pending).

## Test Results
- personal-server/test/hero-1020401-skill-validation.test.mjs: 17/17 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Dispel mechanic test included and passing
