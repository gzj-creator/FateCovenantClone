# Hero 4010301 咩咩医生 — Skill Validation

- Hero: 咩咩医生 (4010301), Ranger, HP 630 / ATK 95 / DEF 60 / SPD 105
- Role (catalog): Ranger
- Skills: 14 (1 normal + 5 mastery + 7 passive + 1 ultimate)

## Validation summary

All 14 skills now have fully populated `implementation` objects (effectType, targetType, effects[], triggers[]).

### Skills implemented

| Skill ID | Name | Type | effects | triggers | RI |
|---|---|---|---|---|---|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | 1 | 0 | — |
| 341030171 | 不屈 | Mastery | 1 | 1 | — |
| 341030172 | 健壮 | Mastery | 1 | 1 | — |
| 341030173 | 超群技艺 | Mastery | 2 | 2 | — |
| 341030174 | 气定神闲 | Mastery | 1 | 2 | — |
| 341030175 | 向阳而生 | Mastery | 1 | 1 | true |
| 120001028 | 突破6 | Passive | 1 | 2 | — |
| 120000032 | 反弹 | Passive | 1 | 1 | — |
| 120000034 | 铁甲 | Passive | 1 | 1 | — |
| 120000037 | 亢奋 | Passive | 1 | 1 | — |
| 120000042 | 暴怒 | Passive | 1 | 1 | — |
| 120000044 | 奋激 | Passive | 1 | 1 | — |
| 120001005 | 战斗续航 | Passive | 1 | 1 | — |
| 6910001058 | Skill 6910001058 | Ultimate | 1 | 0 | true |

### requiresInvestigation

- 341030175 向阳而生: on ultimate use, heal highest-attack ally for 5% max HP. Target selection approximated as highest-HP ally (no highest-attack target type exists in TARGET_TYPES); exact target selection requires investigation.
- 6910001058: metadata fallback ultimate, generic 2.0x physical damage single target.

### New effect/target/trigger types needed

None. All implementations use existing types.

### Test results

21/21 passing (personal-server/test/hero-4010301-skill-validation.test.mjs).

## Method

Followed established pattern from 1010101/3030401/4010101. Implemented via `personal-server/scripts/update-4010301.mjs`, which updates `skill-database.json` in place. Shared passive skills (120001028, 120000032, 120000034, 120000037, 120000042, 120000044, 120001005) cloned from already-validated heroes via `findById`. Mastery skills built from catalog descriptions with conservative magnitude inference. Ultimate is metadata fallback.

Note: hero 4010301 catalog role is Ranger, but task described as Knight role; implementation follows catalog data (Ranger basic attack, Ranger stats). No role change made.
