# Hero 1040201 (爱蜜莉) Skill Validation & Implementation

Date: 2026-11-02
Branch: skill-system-validation

## Hero
- ID: 1040201, Name: 爱蜜莉, Role: Knight
- Stats: HP 6600, ATK 900, DEF 300, SPD 113
- Hero Type: Demigod (天极角色) with rose (玫瑰) mechanics

## Skills Validated (15 total)

### Ultimate (1)
1. 2104020123 迷情掌控 - 130% magical damage to all enemies; enemy rose layers heal self 3% max HP; 花欲盛放 state (-20% ultimate/deity damage taken, +20% crit resist, +20% crit damage reduction for 1 round); Tianji cost 3; 粉/白/红·余香 and rose-layer scaling require engine integration (requiresInvestigation). effectType=damage, requiresInvestigation=true.

### Mastery skills (5)
2. 314020171 猫诱 - battle start & each action apply rose (pink) + 粉·余香 to all enemies (approx on-round-start); all enemies final damage bonus/reduction -20%; on battle start self final damage reduction +5%. requiresInvestigation.
3. 314020172 舔舐 - first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); when hit by normal attack reduce all enemies heal/shield bonus by 2% (max 10); on battle start max HP +5%. requiresInvestigation.
4. 314020173 魅惑 - battle start & each action apply rose (white) + 白·余香 to all enemies (requires investigation); when enemy dispels buff extra true damage 60% defense (max 5/enemy/round) requires engine integration; on battle start crit resist +5% and crit damage reduction +10%. requiresInvestigation.
5. 314020174 偷心 - after normal/skill gain 1 Tianji (approx energy +100); when hit by normal attack all allies gain shield 6% max HP (max 5/round); after normal/skill self next damage taken -15%. requiresInvestigation.
6. 314020175 迷情 - battle start & each action apply rose (red) + 红·余香 to all enemies (requires investigation); ultimate/deity deals extra true damage = 80% defense * rose types (approx 240 base); first 3 rounds damage taken -8%; round 3 end heal self 5% max HP. requiresInvestigation.

### Passive skills (8)
7. 120001028 突破6 - ally normal/skill grants self 50 energy (approximated as self trigger; ally condition requires investigation). effectType=energy.
8. 120000051 蛰伏 - when HP below 50%, damage reduction +15%. condition hp-below-50.
9. 120000054 鼓舞 - when ally uses normal/skill, self gains 25 energy (approximated as self trigger; ally condition requires investigation). effectType=energy.
10. 120000055 反杀 - when attacking target with higher HP%, crit rate +30%. condition target-hp-above-self.
11. 120000059 祝福 - first 2 rounds, heal received +20%. maxTriggers=2.
12. 120001003 生命护盾 - first time HP below 70%, gain shield 80% defense for 2 rounds. condition hp-below-70, oncePerBattle.
13. 120001019 防护加持 - before first ultimate, final damage reduction +20%. oncePerBattle.

### Normal / Ultimate fallback (2)
14. normal-profession-4 Knight Basic Attack - project fallback (damage 1.0x single).
15. 6910001063 Skill 6910001063 - ultimate, metadata fallback -> damage 2.0x (single, requiresInvestigation).

## Rose Mechanic Implementation (Special Attention)
- 爱蜜莉 is a Demigod with rose (玫瑰) mechanics: 粉·余香 (pink), 白·余香 (white), 红·余香 (red).
- Rose application on battle start & each action is approximated via on-round-start triggers (requiresInvestigation because per-action application and stacking require engine integration).
- Ultimate heals self 3% max HP per rose layer (approximated as flat 3% heal; layer scaling requires investigation).
- Ultimate extra true damage = 80% defense * rose types (approximated as 240 base true damage; rose-type count scaling requires investigation).
- 花欲盛放 state modeled as 1-round timed stat modifiers (-20% ultimate/deity damage taken approximated as damage-reduction, +20% crit resist, +20% crit damage reduction).
- Tianji (天极值) cost/consumption, layer stacking and per-action rose application require battle-engine integration (not yet wired); all domain/rose-related skills marked requiresInvestigation=true.

## Skills Fixed
- Previously all implementations lacked effectType/effects/triggers (only ability/abilityDes metadata).
- Added effectType, effects[], and triggers[] to 14 resolved skills (5 mastery + 8 passive + ultimate; normal/basic and metadata fallback included).
- No new effect types, status types, or target types required; reused existing framework.
- New stat type usage: crit-damage-reduction (already used by other heroes), shield-bonus, heal-bonus (already in STAT_TYPES? heal-bonus/shield-bonus yes). All present in effect-types.mjs STAT_TYPES.

## Remaining Issues
- Rose (玫瑰) application per action, stacking layers, Tianji cost/consumption, and per-type 粉/白/红·余香 effects require battle-engine integration (not yet wired). All rose/domain-related skills marked requiresInvestigation.
- Exact multipliers from FightTable.Effect/Buff not yet joined; values derived from catalog text (conservative).
- Battle engine still uses prototype behavior profiles; skill effect application via applySkillEffects is not yet invoked in executeTurn (integration pending). Passive triggers are registered at battle start but processTriggers is not yet called in executeTurn loop (integration pending). Consistent with prior hero implementations.

## Test Results
- personal-server/test/hero-1040201-skill-validation.test.mjs: 21/21 passing
- Effect executor tests: pre-existing passing
- Target selector tests: pre-existing passing
- Battle engine tests: pre-existing passing
EOF

## 审计修订（2026-11-05）

本轮为技能库审计的修订，判定依据是技能 description 与 ability/abilityDes 元数据，测试断言与实现冲突时以描述为准。

- 蛰伏 120000051 的外层 effects[0].duration 由 instant 改为 permanent，与触发效果和同库其他英雄一致。
- 祝福测试断言由 maxTriggers 2 订正为 maxTriggers 1 + 2 回合持续。

- 验证：node scripts/verify-hero-skills.mjs --hero=1040201 通过；node --test test/hero-1040201-skill-validation.test.mjs 通过。
- 完整分类与影响评估见 agent/workflow/skill-system-validation/audit-20261105.md。
