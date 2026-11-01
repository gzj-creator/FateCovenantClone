# Hero 1020301 (狂暴玛丽) Skill Validation & Implementation

Date: 2026-11-01
Branch: investigate-5-3 (skill-system-validation integration)

## Hero
- ID: 1020301, Name: 狂暴玛丽, Role: Warrior
- Stats: HP 600, ATK 110, DEF 55, SPD 96

## Skills Validated (14 total)

### Mastery skills (5)
1. 312030171 重击 - 进入战斗后，最终伤害加成提升5% -> stat-modifier damage-bonus 0.05 (on-round-start, oncePerBattle)
2. 312030172 无畏 - 进入战斗后，攻击力增幅提升5% -> stat-modifier attack-percent 0.05 (on-round-start, oncePerBattle)
3. 312030173 直击要害 - 进入战斗后，暴击率提升5%和暴击伤害加成提升10% -> stat-modifier crit-rate 0.05 + crit-damage 0.10 (on-round-start, oncePerBattle)
4. 312030174 恶性疗法 - 普攻/绝招后，30%概率给目标额外附加1层【中毒】，持续2回合 -> status poison, tickInterval 1, tickEffect damage percent-max-hp 0.2 (on-attack/on-skill-use, chance 0.3)
5. 312030175 恶意蔓延 - 释放终结技时，额外附加10%暴击率和15%暴击伤害 -> stat-modifier crit-rate 0.10 + crit-damage 0.15 (on-ultimate-use, timed 2 rounds)

### Passive skills (8)
6. 120001031 突破9 - 普攻/绝招额外回复200点能量 -> energy gain 200 (on-attack/on-skill-use)
7. 120000001 狂怒 - 释放终结技时，暴击率提升15% -> stat-modifier crit-rate 0.15 (on-ultimate-use)
8. 120000006 勃发 - 生命高于50%，暴击伤害提高20% -> stat-modifier crit-damage 0.20 (on-round-start, condition: hp-above-50)
9. 120000009 鼓舞 - 友方普攻/绝招时能量回复25点 -> energy gain 25 (on-attack/on-skill-use, self-only approximation)
10. 120000014 格挡 - 释放第2次终结技前，受到终结技伤害降低20% -> stat-modifier damage-reduction 0.20 (on-round-start, oncePerBattle)
11. 120000015 标记 - 攻击处于异常状态的目标时，暴击率提升25% -> stat-modifier crit-rate 0.25 (on-attack, condition: target-has-debuff, timed 1 round)
12. 120001006 专注一击 - 释放终结技后，使下1次普攻/绝招的伤害提升50% -> stat-modifier damage-bonus 0.50 (on-ultimate-use, timed 2 rounds)

### Normal / Ultimate
13. normal-profession-1 Warrior Basic Attack - project fallback (damage 1.0x single)
14. 6910001011 Skill 6910001011 - ultimate, metadata fallback -> damage 2.0x (single)

## Skills Fixed
- Previously all implementations were null (skill-database.json had no effect definitions for 1020301).
- Added effectType, effects[], and triggers[] to all 14 skills.
- Poison (中毒) implemented as `status` effect type with statusType `poison`, tickInterval 1, tickEffect damage percent-max-hp magnitude 0.2, duration 2 rounds, 30% chance on normal/skill.
- Extended EffectExecutor.executeDamage to support percent-max-hp and percent-current-hp damage types (defense ignored for percent-HP damage).
- registerPassiveTriggers now prefers stored triggers over heuristic inference.

## Special: Poison (中毒) DoT
- 狂暴玛丽's 恶性疗法 (312030174) applies poison as a debuff status.
- Poison is a DoT: each tick deals 20% of target's max HP as damage (percent-max-hp), ignores defense, cannot crit.
- Tick interval: 1 round (ticks every round via processBuffTicks).
- Duration: 2 rounds. Dispellable. Stacks allowed (maxStacks 0 = no limit).
- Magnitude 0.2 derived from client catalog (actions: ApplyStatus DamageOverTime magnitude 0.2).

## Remaining Issues
- 鼓舞 description says "友方普攻/绝招时能量回复25点" - implemented as self-only energy gain on own attack; ally-triggered energy gain requires cross-unit wiring (requires further investigation).
- 格挡 condition (before 2nd ultimate) approximated as battle-start permanent reduction; precise ultimate-count gating requires further investigation.
- 标记 condition (target has debuff) approximated as always-true in trigger evaluation; precise per-target filtering not wired yet.
- 勃发 trigger approximated as on-round-start with hp-above-50 condition; precise turn-start gating requires investigation.
- 6910001011 ultimate has no localized description (MISSING_ABILITY_DESCRIPTION); using metadata-fallback damage 2.0x.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects not yet invoked in executeTurn (integration pending). Passive triggers registered at battle start but processTriggers not yet called in executeTurn loop (integration pending).

## Test Results
- personal-server/test/hero-1020301-skill-validation.test.mjs: 20/20 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- All 125 hero skill validation tests passing across all heroes
- Poison DoT tested: status application, tick damage (20% max HP), magnitude/duration ranges
EOF
echo done