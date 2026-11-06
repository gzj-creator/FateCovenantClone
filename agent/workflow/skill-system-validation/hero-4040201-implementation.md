# Hero 4040201 命运三姝 - Skill Validation Implementation

## Hero Info
- ID: 4040201
- Name: 命运三姝
- Role: Warrior
- Stats: HP 6600, ATK 900, DEF 300, SPD 98

## Skills Validated/Implemented: 15

| Skill ID | Name | Type | effectType | Notes |
|---|---|---|---|---|
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | damage | project fallback |
| 2404020123 | 命运无章 | Ultimate | damage | 130% physical to all enemies; Tianji/真实命运/命运领域 complex (requiresInvestigation) |
| 344020171 | 命运滚石 | Mastery | stat-modifier | damage-bonus 0.05 on-round-start (once per battle); true-damage conversion (requiresInvestigation) |
| 344020172 | 幸运利剪 | Mastery | stat-modifier | attack-percent 0.05 on-round-start (once per battle); Tianji/counter-cast (requiresInvestigation) |
| 344020173 | 三人成虎 | Mastery | stat-modifier | crit-rate 0.05 + crit-damage 0.10 on-round-start; scaling/counter-cast (requiresInvestigation) |
| 344020174 | 进化魔方 | Mastery | stat-modifier | damage-bonus 0.15 timed 1 round on-attack/on-skill-use; Tianji/stacking (requiresInvestigation) |
| 344020175 | 一锤定音 | Mastery | stat-modifier | crit-rate 0.10 + crit-damage 0.15 timed 2 rounds on-ultimate-use; revive (requiresInvestigation) |
| 120001031 | 突破9 | Passive | energy | +200 energy on attack/skill |
| 120000001 | 狂怒 | Passive | stat-modifier | crit-rate 0.15 on-ultimate-use |
| 120000006 | 勃发 | Passive | stat-modifier | crit-damage 0.20 conditional hp-above-50 |
| 120000009 | 鼓舞 | Passive | energy | +25 energy on attack/skill |
| 120000014 | 格挡 | Passive | stat-modifier | damage-reduction 0.20 conditional (requiresInvestigation) |
| 120000015 | 标记 | Passive | stat-modifier | crit-rate 0.25 conditional target-has-debuff |
| 120001004 | 爆裂一击 | Passive | stat-modifier | crit-rate 1.0 on-ultimate-use (once per battle) |
| 6910001049 | Skill 6910001049 | Ultimate | damage | metadata fallback 2.0x physical single (requiresInvestigation) |

## requiresInvestigation
- 2404020123: complex Tianji/真实命运 stacking/命运领域 (requires investigation)
- 344020171: true-damage conversion (requires investigation)
- 344020172: Tianji/counter-cast (requires investigation)
- 344020173: scaling/counter-cast (requires investigation)
- 344020174: Tianji/stacking (requires investigation)
- 344020175: revive (requires investigation)
- 120000014: complex trigger timing (requires investigation)
- 6910001049: metadata fallback ultimate (requires investigation)

## New effect/target/trigger types needed
None.

## Test Results
18/18 passing (personal-server/test/hero-4040201-skill-validation.test.mjs)
