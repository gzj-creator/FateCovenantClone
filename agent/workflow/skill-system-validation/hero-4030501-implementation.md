# Hero 4030501 (武神蕾娜) Skill Implementation

## Hero Info
- ID: 4030501
- Name: 武神蕾娜
- Role: Warrior
- Stats: HP 1800 / ATK 330 / DEF 82 / SPD 97

## Skills Implemented (15 total)

| Skill ID | Name | Type | Effects | Triggers | RI |
|----------|------|------|---------|----------|----|
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | 1 damage | 0 | no |
| 343050171 | 重击 | Mastery | damage-bonus 0.05 | on-round-start (once) | no |
| 343050172 | 无畏 | Mastery | attack-percent 0.05 | on-round-start (once) | no |
| 343050173 | 直击要害 | Mastery | crit-rate 0.05, crit-damage 0.10 | on-round-start (x2, once) | no |
| 343050174 | 惩奸除恶 | Mastery | damage-bonus +0.02 timed 1 round (maxStacks 5) | on-attack, on-skill-use | yes |
| 343050175 | 光境禁言 | Mastery | crit-rate 0.10, crit-damage 0.15 timed 2 rounds | on-ultimate-use (x2) | no |
| 120001031 | 突破9 | Passive | energy gain 200 | on-attack, on-skill-use | no |
| 120000006 | 勃发 | Passive | crit-damage 0.20 | on-round-start (hp-above-50) | no |
| 120000009 | 鼓舞 | Passive | energy gain 25 | on-attack, on-skill-use (ally) | no |
| 120000014 | 格挡 | Passive | damage-reduction 0.20 | on-round-start (once) | yes |
| 120000015 | 标记 | Passive | crit-rate 0.25 | on-attack (target-has-debuff) | no |
| 120001006 | 专注一击 | Passive | damage-bonus 0.5 | on-ultimate-use | no |
| 120001012 | 穿透加持 | Passive | ignore-defense 0.10 | on-round-start (hp-above-80, once) | no |
| 6403050105 | 蕾娜_稀有技能 | Ultimate | 1.6x true damage single | on-ultimate-use | yes |
| 6910001047 | Skill 6910001047 | Ultimate | 2.0x physical damage single | (none) | yes |

## Skills Marked requiresInvestigation
- 343050174 惩奸除恶: stacking damage-bonus behavior requires investigation
- 120000014 格挡: release 2nd ultimate damage reduction timing
- 6403050105 蕾娜_稀有技能: control-effect stacking + lost-HP true damage (approximated)
- 6910001047: missing description (metadata fallback)

## New Effect/Target/Trigger Types Needed
None. All implementations use existing types. Added 'hp-above-80' condition key to skill-integration.mjs evaluateConditionKey.

## Template Sources
- 克隆自 4030301 天启之子 (Warrior mastery/passive pattern) for shared passives and mastery skills
- 惩奸除恶 (343050174) hand-authored: stacking damage-bonus +0.02 timed 1 round max 5 stacks
- 光境禁言 (343050175) hand-authored: crit-rate +0.10 and crit-damage +0.15 timed 2 rounds on ultimate use
- 穿透加持 (120001012) hand-authored: ignore-defense +0.10 permanent when HP > 80%
- 蕾娜_稀有技能 (6403050105) approximated as 1.6x true damage single
- Ultimate 6910001047 metadata fallback: generic 2.0x physical damage single

## Test Results
23/23 passing (personal-server/test/hero-4030501-skill-validation.test.mjs)
