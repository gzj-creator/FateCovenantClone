# Hero 2040101 (赤霄) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 2040101, Name: 赤霄, Role: Assassin
- Stats: HP 6000, ATK 1000, DEF 300, SPD 103
- Hero Type: Demigod (天极角色) with flame (噬炎) mechanics

## Skills Validated (15 total)

### Ultimate (1)
1. 2204010123 罪业尽销 - consumes 3 Tianji (not modeled), 130% magical damage to all enemies; if target has 噬炎, adds true damage = 30% of damage taken during 噬炎 (cap 180% atk) and removes 噬炎; on kill permanently -3% atk/def per target (max 3) and +1% atk/def to all allies (max 5 battles); otherwise restores 150 energy to all allies. requiresInvestigation.

### Mastery skills (5)
2. 324010171 龙行 - first 2 ultimates per round guaranteed crit and +60% final damage (crit guarantee approximated as damage-bonus 0.60, maxTriggers 2); battle start final damage bonus +5%.
3. 324010172 神罚 - first ultimate each round reduces a random enemy Tianji by 1 (approximated energy loss 100); after ultimate applies 1 layer of 噬炎 (approximated as burn status, max 20 stacks) to all enemies; battle start attack +5%.
4. 324010173 罪伞 - all ultimates/Tianji guaranteed crit and +60% final damage with no usage limit (crit guarantee approximated as crit-rate +1.0 and damage-bonus 0.60 on ultimate use); battle start crit-rate +5% and crit-damage +10%.
5. 324010174 神降 - after normal/skill gain 1 Tianji (approx energy +100); all allies ultimate damage +40% (permanent); after normal/skill next ultimate damage +15% (approximated 2 rounds).
6. 324010175 业火 - each 10% crit-rate grants +10% crit-damage and +3% ignore-defense (cap +100% crit-damage/+30% ignore-defense) requires engine scaling (requiresInvestigation); on ultimate use +10% crit-rate and +15% crit-damage.

### Passive skills (8)
7. 120001028 突破6 - ally normal/skill grants self 50 energy.
8. 120000018 破盾 - +15% damage to defense-type adventurers (target condition not enforced; approximated as permanent damage-bonus). requiresInvestigation.
9. 120000019 锋刃 - normal/skill damage +30%.
10. 120000023 激怒 - normal/skill grants +100 energy.
11. 120000025 戒备 - when self has buff, crit-resistance +30% (buff-presence condition approximated).
12. 120000028 鹰眼 - when HP > 50%, hit-rate +15%.
13. 120001009 穿刺一击 - first ultimate ignores 30% of enemy defense.

### Normal (1)
14. normal-profession-2 Assassin Basic Attack (冲锋) - project fallback (damage 1.0x single).

### Ultimate fallback (1)
15. 6910001062 Skill 6910001062 - metadata fallback -> 2.0x physical damage single (requiresInvestigation).

## Skills Fixed
- Previously all 15 skills had no effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, targetType, energyCost, effects[], and triggers[] to all 15 skills using existing effect system (damage, stat-modifier, energy, status).
- 噬炎 (flame) mechanic approximated as 'burn' status (max 20 stacks) since no dedicated flame status type exists; marked requiresInvestigation. Exact flame tracking (damage accumulation during flame, removal on ultimate) requires engine integration.
- 龙行/罪伞 crit-guarantee approximated as damage-bonus/crit-rate stat modifiers; exact "guaranteed crit" needs engine support.
- 业火 crit-rate scaling (per 10% crit-rate -> crit-damage/ignore-defense) requires engine scaling; approximated as on-ultimate-use flat bonuses.
- Reused shared passive skills (120001028, 120000018, 120000019, 120000023, 120000025, 120000028, 120001009) from existing implemented heroes.
- No new effect types, status types, or target types required beyond reusing 'burn' status; reused existing framework.

## Remaining Issues
- 噬炎 (flame) status is not a dedicated type; approximated as burn. Exact implementation requires adding a flame status type and damage-accumulation tracking (requiresInvestigation).
- 罪业尽销 kill-branching (permanent stat changes, energy restore) and 噬炎-consumption true damage require engine integration (requiresInvestigation).
- 龙行/罪伞 guaranteed-crit cannot be expressed as stat modifier alone; requires engine crit-guarantee support.
- 业火 crit-rate scaling requires engine support.
- 破盾 target defense-type condition not enforced.
- 戒备 buff-presence condition approximated.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Battle Engine Integration
- No changes required to battle-engine.mjs; this hero uses existing effect framework and trigger registration via registerPassiveTriggers.

## Test Results
- personal-server/test/hero-2040101-skill-validation.test.mjs: 22/22 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 龙行 324010171、罪伞 324010173、业火 324010175 的 timed 持续时间 rounds 为 0（结构校验不通过），改为 rounds 1，表示当回合生效；"每回合前两次/无次数限制"的近似说明仍保留在 notes。

- 验证：node scripts/verify-hero-skills.mjs --hero=2040101 通过；node --test test/hero-2040101-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
