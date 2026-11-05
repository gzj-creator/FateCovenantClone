# Hero 4010101 星之子 Skill Implementation

- Hero: 星之子 (4010101), Role: Warrior
- Skills: 13 total
- Requires investigation: 120000014 (格挡), 120001002 (生命偷取), 6910001056 (ultimate)

## Skills

1. normal-profession-1 Warrior Basic Attack - damage single
2. 341010171 重击 - damage-bonus 0.05 on-round-start
3. 341010172 无畏 - attack-percent 0.05 on-round-start
4. 341010173 直击要害 - crit-rate 0.05 + crit-damage 0.10 on-round-start
5. 341010175 众星清算 - crit-rate 0.10 + crit-damage 0.15 on-ultimate-use (2 rounds)
6. 120001031 突破9 - 200 energy on attack/skill
7. 120000001 狂怒 - crit-rate 0.15 on-ultimate-use
8. 120000006 勃发 - crit-damage 0.20 when HP > 50%
9. 120000009 鼓舞 - 25 energy on attack/skill
10. 120000014 格挡 - damage-reduction 0.20 (requiresInvestigation)
11. 120000015 标记 - crit-rate 0.25 when target has debuff
12. 120001002 生命偷取 - heal 20% attack on ultimate use (requiresInvestigation)
13. 6910001056 ultimate - 2.0x physical damage single (requiresInvestigation)

## Notes
- No new effect types/target types/trigger types needed.
- Test: personal-server/test/hero-4010101-skill-validation.test.mjs (20/20 passing)
EOF
echo done