# Hero 4030601 灵珑 - Skill Validation Implementation

## Hero Info
- ID: 4030601
- Name: 灵珑
- Role: Assassin
- Stats: HP 1890, ATK 285, DEF 90, SPD 102

## Skills Validated/Implemented: 14

| Skill ID | Name | Type | effectType | Notes |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | damage | project fallback |
| 343060171 | 不屈 | Mastery | stat-modifier | damage-reduction 0.05 on-round-start (once per battle) |
| 343060172 | 健壮 | Mastery | stat-modifier | max-hp-percent 0.05 on-round-start (requiresInvestigation) |
| 343060173 | 闪光翼击 | Mastery | stat-modifier | status-hit 0.1 + status-resist 0.1 on-round-start (requiresInvestigation) |
| 343060174 | 涅槃流转 | Mastery | stat-modifier | damage-reduction 0.15 on-attack/on-skill-use for 1 round |
| 343060175 | 焚金羽翼 | Mastery | stat-modifier | damage-reduction 0.08 (max 3) + round-3 heal 5% max HP |
| 120001028 | 突破6 | Passive | energy | +50 energy on attack/skill |
| 120000032 | 反弹 | Passive | stat-modifier | rebound-rate 0.10 on-being-hit (requiresInvestigation) |
| 120000034 | 铁甲 | Passive | stat-modifier | anti-crit 0.20 on-round-start (hp-above-50) |
| 120000037 | 亢奋 | Passive | energy | +100 energy on kill (requiresInvestigation) |
| 120000042 | 暴怒 | Passive | stat-modifier | crit-damage 0.30 on-skill-use |
| 120000044 | 奋激 | Passive | stat-modifier | damage-reduction 0.20 on-ultimate-use (once per battle) |
| 120001009 | 穿刺一击 | Passive | stat-modifier | ignore-defense 0.30 on-ultimate-use (once per battle) |
| 6910001048 | Skill 6910001048 | Ultimate | damage | metadata fallback 2.0x magical single (requiresInvestigation) |

## Template Sources
- Assassin basic attack cloned from normal-profession-2 validated template
- Mastery/passive stat-modifiers cloned from 4030101 梦语 Ranger template (shared constants)
- 涅槃流转 (343060174) implemented as damage-reduction 0.15 on-attack/on-skill-use for 1 round (盘石之固 template)
- 焚金羽翼 (343060175) implemented following 傀儡咒术 template (first 3 rounds damage reduction 8% + round-3 5% max HP heal)
- Shared passives (12000*) cloned from validated heroes by id
- Ultimate cloned from metadata fallback pattern

## requiresInvestigation
- 343060172: max-hp-percent statType not in STAT_TYPES
- 343060173: status-hit / status-resist statTypes not in STAT_TYPES
- 120000032: back-row condition not enforced
- 120000037: knock-back trigger approximated as on-kill
- 6910001048: metadata fallback ultimate

## New effect/target/trigger types needed
None.

## Test Results
20/20 passing (personal-server/test/hero-4030601-skill-validation.test.mjs)
"