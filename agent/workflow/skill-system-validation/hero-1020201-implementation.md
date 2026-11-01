# Hero 1020201 (猎魔人) Skill Validation & Implementation

Date: 2026-11-01
Branch: investigate-5-3 (skill-system-validation integration)

## Hero
- ID: 1020201, Name: 猎魔人, Role: Warrior
- Stats: HP 600, ATK 110, DEF 55, SPD 96

## Skills Validated (14 total)

### Mastery skills (5)
1. 312020171 重击 - final damage bonus +5% on battle start -> stat-modifier damage-bonus 0.05 (on-round-start, oncePerBattle)
2. 312020172 无畏 - attack +5% on battle start -> stat-modifier attack-percent 0.05 (on-round-start, oncePerBattle)
3. 312020173 直击要害 - crit rate +5% and crit damage +10% on battle start -> stat-modifier crit-rate 0.05 + crit-damage 0.10
4. 312020174 伺机待发 - after normal/skill, next ultimate damage +15% -> stat-modifier damage-bonus 0.15 (on-attack, on-skill-use, timed 1 round)
5. 312020175 蚀骨之痛 (Metadata only) - on ultimate use, extra 3% max HP damage -> damage percent-max-hp 0.03 (on-ultimate-use)

### Passive skills (8)
6. 120001031 突破9 - normal/skill grants self 200 energy -> energy gain 200 (on-attack, on-skill-use)
7. 120000001 狂怒 - on ultimate use, crit rate +15% -> stat-modifier crit-rate 0.15 (on-ultimate-use)
8. 120000006 勃发 - when HP > 50%, crit damage +20% -> stat-modifier crit-damage 0.20 (on-round-start, condition: hp-above-50)
9. 120000009 鼓舞 - on ally normal/skill, self gains 25 energy -> energy gain 25 (on-attack, on-skill-use)
10. 120000014 格挡 - before 2nd ultimate, ultimate damage taken -20% -> stat-modifier damage-reduction 0.20 (on-round-start, oncePerBattle)
11. 120000015 标记 - when attacking debuffed target, crit rate +25% -> stat-modifier crit-rate 0.25 (on-attack, condition: target-has-debuff)
12. 120001004 爆裂一击 - first ultimate grants +100% final crit rate -> stat-modifier crit-rate 1.0 (on-ultimate-use, oncePerBattle)

### Normal / Ultimate
13. normal-profession-1 Warrior Basic Attack - project fallback (no effect def; handled by behavior engine)
14. 6910001010 Skill 6910001010 - ultimate, metadata fallback -> damage 2.0x (single)

## Skills Fixed
- Previously all implementations were null (skill-database.json had no effect definitions).
- Inserted missing skill 312020175 (蚀骨之痛) which was absent from skill-database.json (catalog lists it as Metadata only).
- Added effectType, effects[], and triggers[] to each of the 13 resolved skills.
- registerPassiveTriggers now prefers stored triggers over heuristic inference.
- Added conditionKey evaluation (hp-above-50, target-has-debuff).
- Added STAT_TYPES: crit-damage (already present), damage-bonus (already present).

## Remaining Issues
- 鼓舞 description says "友方普攻/绝招时能量回复25点" - implemented as self-only energy gain on own attack; ally-triggered energy gain requires cross-unit wiring (requires further investigation).
- 格挡 condition (before 2nd ultimate) approximated as battle-start permanent reduction; precise ultimate-count gating requires further investigation.
- 标记 condition (target has debuff) approximated as always-true in trigger evaluation; precise per-target filtering not wired yet.
- 312020175 蚀骨之痛 is Metadata only in catalog; implemented as percent-max-hp damage per description (requires further investigation).
- 6910001010 ultimate has no localized description (MISSING_ABILITY_DESCRIPTION); using metadata-fallback damage 2.0x.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers not yet called in executeTurn loop (integration pending).

## Test Results
- personal-server/test/hero-1020201-skill-validation.test.mjs: 14/14 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF
echo done