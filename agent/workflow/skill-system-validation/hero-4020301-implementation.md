# Hero 4020301 光枪守卫 Skill Implementation

- Hero: 光枪守卫 (4020301), Role: Assassin
- Skills: 14 total
- Requires investigation: 6910001053 (ultimate)

## Skills

1. normal-profession-2 Assassin Basic Attack (冲锋) - damage single (project fallback)
2. 342030171 重击 - damage-bonus 0.05 on-round-start
3. 342030172 无畏 - attack-percent 0.05 on-round-start
4. 342030173 弱点洞悉 - ignore-defense 0.05 + hit-rate 0.10 on-round-start
5. 342030174 会心一击 - ignore-defense + damage-bonus on-attack/on-skill-use
6. 342030175 凌厉光刃 - crit-rate 0.15 + crit-damage 0.20 on-ultimate-use (max 3)
7. 120001026 突破4 - 600 energy on round start
8. 120000018 破盾 - damage-bonus 0.15 (vs defense-type)
9. 120000019 锋刃 - damage-bonus 0.30
10. 120000023 激怒 - 100 energy on attack/skill
11. 120000025 戒备 - crit-resistance 0.30 on round-start and on-buff-gain
12. 120000028 鹰眼 - hit-rate 0.15 when HP > 50%
13. 120001004 爆裂一击 - crit-rate 1.0 on-ultimate-use once per battle
14. 6910001053 ultimate - 2.0x physical damage single (requiresInvestigation)

## Notes

- Cloned implementation from validated Assassin heroes (爱心射手 4020201 for generic assassin passives/mastery, 鱼缸头 1010201 for 爆裂一击).
- Adapted skill IDs to match hero 4020301.
- No new effect types/target types/trigger types needed.
- Test: personal-server/test/hero-4020301-skill-validation.test.mjs (20/20 passing)
EOF
echo done