# Hero 4030301 天启之子 Skill Implementation

## Hero Info
- ID: 4030301
- Name: 天启之子
- Role: Warrior
- Stats: HP 1800 / ATK 330 / DEF 82 / SPD 97

## Skills Implemented (14 total)

| Skill ID | Name | Type | Effects | Triggers | RI |
|----------|------|------|---------|----------|----|
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | 1 damage | 0 | no |
| 343030171 | 重击 | Mastery | damage-bonus 0.05 | on-round-start (once) | no |
| 343030172 | 无畏 | Mastery | attack-percent 0.05 | on-round-start (once) | no |
| 343030173 | 直击要害 | Mastery | crit-rate 0.05, crit-damage 0.10 | on-round-start (x2, once) | no |
| 343030174 | 伺机待发 | Mastery | damage-bonus 0.15 timed 1 round | on-attack, on-skill-use | no |
| 343030175 | 永世罪罚 | Mastery | damage-reduction 0.08 | on-round-start (once) | yes |
| 120001031 | 突破9 | Passive | energy gain 200 | on-attack, on-skill-use | no |
| 120000001 | 狂怒 | Passive | crit-rate 0.15 | on-ultimate-use | no |
| 120000006 | 勃发 | Passive | crit-damage 0.20 | on-round-start (hp-above-50) | no |
| 120000009 | 鼓舞 | Passive | energy gain 25 | on-attack, on-skill-use (ally) | no |
| 120000014 | 格挡 | Passive | damage-reduction 0.20 | on-ultimate-use (requiresInvestigation) | yes |
| 120000015 | 标记 | Passive | crit-rate 0.25 | on-attack (target-has-debuff) | no |
| 120001008 | 奋力一击 | Passive | damage-bonus 0.30 | on-ultimate-use (highest-hp enemy) | yes |
| 6910001045 | Skill 6910001045 | Ultimate | damage 2.0x physical | (none) | yes |

## Skills Marked requiresInvestigation
- 343030175 永世罪罚: 圣裁 buff extra -8% final damage reduction; exact trigger timing (shield synergy?) requires investigation
- 120000014 格挡: release 2nd ultimate damage reduction timing
- 120001008 奋力一击: highest-HP enemy targeting
- 6910001045: missing description (metadata fallback)

## New Effect/Target/Trigger Types Needed
None. All implementations use existing types.

## Test Results
22/22 passing (personal-server/test/hero-4030301-skill-validation.test.mjs)
