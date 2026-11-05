# Hero 5040401 (零) Skill Validation & Implementation

Date: 2026-11-04
Branch: skill-system-validation

## Hero
- ID: 5040401, Name: 零, Role: Ranger
- Stats: HP 8000, ATK 1080, DEF 360, SPD 109

## Skills Validated (14 total)

### Mastery skills (5)
1. 2504040123 湮灭力场 - Ultimate: reduces enemy shields 35%, deals 20% self max HP magical damage to all enemies (+40% if no shield), adds 损坏, silences highest-attack enemy; self damage reduction +10% per surviving ally; auto-casts ultimate on first Tianji damage taken each round (ignoring control). requiresInvestigation.
2. 354040171 本源感知 - on battle start gain super-life (HP to 100% max); on {0} trigger cleanse all allies control + 1000 energy each. Approximated as full heal + energy + dispel on round start. requiresInvestigation.
3. 354040172 潜能蕴养 - first ultimate each round reduces a random enemy 1 Tianji (approx energy loss 100); at round start all allies gain shield 35% max HP. requiresInvestigation.
4. 354040173 核心突破 - first 2 rounds, if no ally dead and >=2 adventurers, self immune to death; on ultimate use cleanse 3 debuffs from all allies. Approximated as protection status 2 rounds + dispel. requiresInvestigation.
5. 354040174 极意自现 - after self normal/skill gain 1 Tianji (approx energy +100); at round end heal all allies 25% max HP. requiresInvestigation.
6. 354040175 真我超越 - {0} resurrection ignores revival restrictions, grants 3 Tianji + immunity to next 3 ultimate/Tianji damage; ultimate additionally dispels 3 random buffs from all enemies. Approximated as energy gain + dispel. requiresInvestigation.

### Passive skills (7)
7. 120001028 突破6 - +50 energy when ally uses normal/skill. Cloned from shared template.
8. 120000031 镇定 - when self has buff, damage reduction +10%. requiresInvestigation (condition not enforced).
9. 120000036 急救 - when ally HP < 50%, healing to them +15%. Cloned from shared template. requiresInvestigation.
10. 120000039 激怒 - when hit by normal/skill, gain 75 energy. requiresInvestigation (approximated as on-being-hit).
11. 120000040 抵抗 - when HP < 70%, status resistance +20%. Approximated as damage-reduction. requiresInvestigation.
12. 120000045 坚毅 - first 2 rounds, sacred-artifact damage taken -35%. Cloned from shared template. requiresInvestigation.
13. 120001003 生命护盾 - first time HP < 70%, gain shield = 80% DEF for 2 rounds. Cloned from shared template.

### Normal (1)
14. normal-profession-3 Ranger Basic Attack (辅助) - project fallback (damage 1.0x single).

## Skills Fixed
- Previously all 13 skills had no effectType/effects/triggers (only ability/abilityDes metadata, except normal attack).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 13 skills using existing effect system (damage, heal, shield, stat-modifier, energy, status, dispel).
- Cloned implemented templates from other Ranger/Knight heroes for shared passive skills (突破6, 急救, 坚毅, 生命护盾), adapted to 零 skill IDs.
- 手动实现了 5 个 unique Mastery skills (本源感知, 潜能蕴养, 核心突破, 极意自现, 真我超越) and 3 unique passives (镇定, 激怒, 抵抗) with requiresInvestigation.
- ability/abilityDes tid fields corrected to match hero's own skill IDs where present.
- No new effect types, status types, or target types required; reused existing framework. Used dispel type already in effect-executor.

## requiresInvestigation Skills (10)
1. 湮灭力场 (2504040123) - Tianji system, shield reduction, damage reduction per surviving ally, auto-cast on Tianji damage.
2. 本源感知 (354040171) - {0} trigger condition, super-life, cleanse + energy.
3. 潜能蕴养 (354040172) - Tianji reduction, round-start shield.
4. 核心突破 (354040173) - death immunity condition, debuff cleanse.
5. 极意自现 (354040174) - Tianji gain, round-end heal.
6. 真我超越 (354040175) - resurrection, Tianji grants, immunity, dispel.
7. 镇定 (120000031) - buff condition not enforced.
8. 急救 (120000036) - ally HP condition not enforced.
9. 激怒 (120000039) - on-being-hit approximation.
10. 抵抗 (120000040) - status resistance approximated as damage-reduction.

## Test Results
- personal-server/test/hero-5040401-skill-validation.test.mjs: 22/22 passing

## No new effect types/target types/trigger types needed.
EOF
echo done