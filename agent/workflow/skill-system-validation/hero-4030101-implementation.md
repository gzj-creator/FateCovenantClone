# Hero 4030101 梦语 - Skill Validation Implementation

## Hero Info
- ID: 4030101
- Name: 梦语
- Role: Ranger
- Stats: HP 1890, ATK 285, DEF 90, SPD 107

## Skills Validated/Implemented: 14

| Skill ID | Name | Type | effectType | Notes |
|---|---|---|---|---|
| normal-profession-3 | Ranger Basic Attack (辅助) | Normal | damage | project fallback |
| 343010171 | 不屈 | Mastery | stat-modifier | damage-reduction 0.05 on-round-start (once per battle) |
| 343010172 | 健壮 | Mastery | stat-modifier | max-hp-percent 0.05 on-round-start (once per battle) |
| 343010173 | 超群技艺 | Mastery | stat-modifier | status-hit 0.1 + status-resist 0.1 on-round-start |
| 343010174 | 扶危定乱 | Mastery | dispel | dispel 1 debuff from random ally on-attack/on-skill-use |
| 343010175 | 预言梦境 | Mastery | stat-modifier | crit-damage-reduction 0.10 all-allies on-ultimate-use 2 rounds (requiresInvestigation) |
| 120001028 | 突破6 | Passive | energy | +50 energy on attack/skill |
| 120000032 | 反弹 | Passive | stat-modifier | rebound-rate 0.10 on-being-hit |
| 120000034 | 铁甲 | Passive | stat-modifier | anti-crit 0.20 conditional hp-above-50 |
| 120000037 | 亢奋 | Passive | energy | +100 energy on-kill |
| 120000042 | 暴怒 | Passive | stat-modifier | crit-damage 0.30 on-skill-use |
| 120000044 | 奋激 | Passive | stat-modifier | damage-reduction 0.20 on-ultimate-use (once per battle) |
| 120001003 | 生命护盾 | Passive | shield | percent-defense 0.8 hp-below-70 2 rounds (once per battle) |
| 6910001043 | Skill 6910001043 | Ultimate | damage | metadata fallback 2.0x physical single (requiresInvestigation) |

## Template Sources
- Basic stats/mastery/passives cloned from 吟游诗人 (1010101) Ranger template
- 扶危定乱 (343010174) cloned from 啵啵水母 (3020201) dispel pattern
- 生命护盾 (120001003) cloned from 影盾骑士 (1020501) hp-below-70 shield pattern
- Ultimate cloned from 吟游诗人 metadata fallback pattern

## requiresInvestigation
- 6910001043: metadata fallback ultimate, generic 2.0x physical damage (requires investigation)
- 343010175: uses crit-damage-reduction statType which is not in STAT_TYPES enum; marked requiresInvestigation for statType support verification.

## New effect/target/trigger types needed
None.

## Test Results
23/23 passing (personal-server/test/hero-4030101-skill-validation.test.mjs)
EOF
echo done