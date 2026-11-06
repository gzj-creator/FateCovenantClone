# Hero 4030401 圣棺裁决 - Skill Validation Implementation

## Hero Info
- ID: 4030401
- Name: 圣棺裁决
- Role: Ranger
- Stats: HP 1890, ATK 285, DEF 90, SPD 107

## Skills Validated/Implemented: 15

| Skill ID | Name | Type | effectType | Notes |
|---|---|---|---|---|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | damage | project fallback |
| 343040171 | 不屈 | Mastery | stat-modifier | damage-reduction 0.05 on-round-start (once per battle) |
| 343040172 | 健壮 | Mastery | stat-modifier | max-hp-percent 0.05 on-round-start (requiresInvestigation) |
| 343040173 | 超群技艺 | Mastery | stat-modifier | status-hit 0.1 + status-resist 0.1 on-round-start (requiresInvestigation) |
| 343040174 | 气定神闲 | Mastery | energy | 30% chance 100 energy on attack/skill |
| 343040175 | 虔心受洗 | Mastery | stat-modifier | crit-resist -0.20 on-round-start (requiresInvestigation) |
| 120001028 | 突破6 | Passive | energy | +50 energy on attack/skill |
| 120000032 | 反弹 | Passive | stat-modifier | rebound-rate 0.10 on-being-hit (requiresInvestigation) |
| 120000034 | 铁甲 | Passive | stat-modifier | anti-crit 0.20 on-round-start (hp-above-50) |
| 120000038 | 蓄锐 | Passive | energy | +100 energy on attack/skill |
| 120000044 | 奋激 | Passive | stat-modifier | damage-reduction 0.20 on-ultimate-use (once per battle) |
| 120000045 | 坚毅 | Passive | stat-modifier | damage-reduction 0.35 for 2 rounds (requiresInvestigation) |
| 120001005 | 战斗续航 | Passive | heal | 0.3 ATK when HP < 30% at round start |
| 6403040106 | 夏弥尔_稀有技能 | Ultimate | damage | complex hp-threshold/ultimate effect, generic 2.0x magical (requiresInvestigation) |
| 6910001046 | Skill 6910001046 | Ultimate | damage | metadata fallback 2.0x magical single (requiresInvestigation) |

## Template Sources
- Basic stats/mastery/passives cloned from 4030101 梦语 Ranger template
- 虔心受洗 (343040175) implemented as crit-resist approximation of 赎罪之棺 being-crit +20%
- 坚毅 (120000045) implemented as damage-reduction 0.35 for 2 rounds (first 2 rounds sacred-artifact damage)
- Ultimate cloned from metadata fallback pattern

## requiresInvestigation
- 343040172: max-hp-percent statType not in STAT_TYPES
- 343040173: status-hit / status-resist statTypes not in STAT_TYPES
- 343040175: 赎罪之棺 being-crit +20% approximated as crit-resist -0.20
- 120000032: back-row condition not enforced
- 120000045: sacred-artifact damage reduction approximated
- 6403040106: complex hp-threshold/ultimate effect, generic 2.0x magical damage
- 6910001046: metadata fallback ultimate

## New effect/target/trigger types needed
None.

## Test Results
23/23 passing (personal-server/test/hero-4030401-skill-validation.test.mjs)
EOF