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
| 343010172 | 健壮 | Mastery | stat-modifier | max-hp-percent 0.05 on-round-start (once per battle) (requiresInvestigation) |
| 343010173 | 超群技艺 | Mastery | stat-modifier | status-hit 0.1 + status-resist 0.1 on-round-start (requiresInvestigation) |
| 343010174 | 扶危定乱 | Mastery | dispel | dispel 1 debuff from random ally on-attack/on-skill-use |
| 343010175 | 预言梦境 | Mastery | stat-modifier | crit-damage-reduction 0.10 all-allies on-ultimate-use 2 rounds (requiresInvestigation) |
| 120001028 | 突破6 | Passive | energy | +50 energy on attack/skill |
| 120000032 | 反弹 | Passive | stat-modifier | rebound-rate 0.10 on-being-hit (requiresInvestigation) |
| 120000034 | 铁甲 | Passive | stat-modifier | anti-crit 0.20 conditional hp-above-50 |
| 120000037 | 亢奋 | Passive | energy | +100 energy on-kill (requiresInvestigation) |
| 120000042 | 暴怒 | Passive | stat-modifier | crit-damage 0.30 on-skill-use |
| 120000044 | 奋激 | Passive | stat-modifier | damage-reduction 0.20 on-ultimate-use (once per battle) |
| 120001003 | 生命护盾 | Passive | shield | percent-defense 0.8 hp-below-70 2 rounds (once per battle) |
| 6910001043 | Skill 6910001043 | Ultimate | damage | metadata fallback 2.0x magical single (requiresInvestigation) |

## Template Sources
- Basic stats/mastery/passives cloned from 赫拉 (4030201) Ranger template (which itself derives from 深海歌姬 1020101)
- 扶危定乱 (343010174) cloned from 啵啵水母 (3020201) dispel pattern
- 生命护盾 (120001003) cloned from 影盾骑士 (1020501) hp-below-70 shield pattern
- Ultimate cloned from 赫拉 metadata fallback pattern

## requiresInvestigation
- 343010172: max-hp-percent stat type not in STAT_TYPES
- 343010173: status-hit/status-resist stat types not in STAT_TYPES
- 343010175: crit-damage-reduction stat type not in STAT_TYPES; all-allies targeting approximated
- 120000032: back-row condition not enforced
- 120000037: trigger approximated as on-kill (catalog: enemy knocked back)
- 6910001043: metadata fallback ultimate, generic 2.0x magical damage

## New effect/target/trigger types needed
None.

## Test Results
23/23 passing (personal-server/test/hero-4030101-skill-validation.test.mjs)

## 2026-11-05 补全记录（回归修复）

- 复查发现 343010174 扶危定乱、120001003 生命护盾 只有 `triggers`、`effects` 为空数组，`verify-hero-skills.mjs` 因此报 “missing effects[]”，即技能数量为 2/14 可执行。
- 本轮通过 `patches/group-c/4030101.json` 补齐：
  - 343010174：`effects[]` 增加 `dispel`（`targetType: random-ally`、`count: 1`、`removeType: debuff`），与原 on-attack / on-skill-use 两条触发一致。
  - 120001003：`effects[]` 增加 `shield`（`percent-defense` 0.8、`timed` 2 回合、`targetType: self`），与原 on-hp-threshold 触发一致。
- 原有 `ability`/`abilityDes` 元数据保持不变。
- 文档中早前“max-hp-percent / status-hit / status-resist / crit-damage-reduction / rebound-rate / anti-crit 不在 STAT_TYPES”的说明已过期：2026-11-05 `game/effects/effect-types.mjs` 已由其它任务补入这些 statType，现状可正常校验。
- 测试新增 4 条断言：技能 ID 完整顺序、每个技能 `effectType` 与首个效果一致、扶危定乱的 dispel 条目、生命护盾的盾量/持续。
- 验证结果：`node scripts/verify-hero-skills.mjs --hero=4030101` 通过（1/1 heroes clean）；`node --test test/hero-4030101-skill-validation.test.mjs` 27/27 通过。

