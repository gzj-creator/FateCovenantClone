# Hero 4020501 蔷薇游侠 Skill Implementation

## Summary
- Hero ID: 4020501
- Name: 蔷薇游侠
- Role: Assassin
- Skills: 14
- Requires investigation: 2 (生命偷取 120001002, ultimate 6910001055)

## Source templates
- Assassin basic/passive templates cloned from hero 4020301 光枪守卫 (same Assassin kit).
- 生命偷取 (120001002) cloned from hero 2020201 武姬月 (lifesteal approximation).

## Skill list
| Skill ID | Name | Type | effectType | targetType |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack | Normal | damage | single |
| 342050171 | 重击 | Mastery | stat-modifier | self |
| 342050172 | 无畏 | Mastery | stat-modifier | self |
| 342050173 | 弱点洞悉 | Mastery | stat-modifier | self |
| 342050174 | 会心一击 | Mastery | stat-modifier | self |
| 342050175 | 蔷薇绞杀 | Mastery | stat-modifier | self |
| 120001026 | 突破4 | Passive | energy | self |
| 120000018 | 破盾 | Passive | stat-modifier | self |
| 120000019 | 锋刃 | Passive | stat-modifier | self |
| 120000023 | 激怒 | Passive | energy | self |
| 120000025 | 戒备 | Passive | stat-modifier | self |
| 120000028 | 鹰眼 | Passive | stat-modifier | self |
| 120001002 | 生命偷取 | Passive | heal | self (requiresInvestigation) |
| 6910001055 | Skill 6910001055 | Ultimate | damage | single (requiresInvestigation) |

## Notes
- All tid fields remapped to hero 4020501 skill IDs.
- No new effect types/target types/trigger types needed.
- Test: personal-server/test/hero-4020501-skill-validation.test.mjs (20/20 passing).
EOF
echo done