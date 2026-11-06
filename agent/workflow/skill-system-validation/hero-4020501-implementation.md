# Hero 4020501 蔷薇游侠 Skill Implementation

## Summary
- Hero ID: 4020501
- Name: 蔷薇游侠
- Role: Assassin
- Skills: 14
- Requires investigation: 2 (生命偷取 120001002, ultimate 6910001055)

## Source templates
- Assassin basic/passive/mastery templates cloned from hero 2020601 影之菖蒲 (same Assassin kit).
- 破盾 (120000018) cloned from hero 1010201 鱼缸头 (shared passive).
- 生命偷取 (120001002) cloned from hero 1030301 观星者 (lifesteal approximation).
- Ultimate (6910001055) cloned from hero 1010101 吟游诗人 (metadata fallback generic damage).

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
- All tid fields remapped to hero 4020501 skill IDs (hero-specific) / shared IDs (passives).
- No new effect types/target types/trigger types needed.
- Test: personal-server/test/hero-4020501-skill-validation.test.mjs (20/20 passing).
EOF
echo done