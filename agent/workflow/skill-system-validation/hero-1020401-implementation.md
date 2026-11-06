# Hero 1020401（通灵女巫）技能实现与验证

日期：2026-11-05
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1020401.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1020401.json`（cwd `personal-server`）

## 英雄信息

- ID 1020401，通灵女巫，Knight，HP 660 / ATK 90 / DEF 60 / SPD 111
- 本轮前 14 个技能中 13 个 `implementation.effects` 为空（仅元数据 + 部分 triggers），普攻缺 `effectType`/`damage`。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-4 Knight Basic Attack | Normal | 项目兜底：单体物理 1.0×，canCrit |
| 312040171 不屈 | Mastery | 战斗开始（on-round-start，oncePerBattle）永久 damage-reduction 0.05 |
| 312040172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 312040173 泰然自若 | Mastery | 战斗开始永久 crit-resist 0.05 + crit-damage-reduction 0.10（2 条触发） |
| 312040174 迎头痛击 | Mastery | 普攻/绝招后 dispel 1 个敌方增益（on-attack / on-skill-use） |
| 312040175 傀儡咒术 | Mastery | 前 3 回合 damage-reduction 0.08（maxTriggers 3，逐回合 1 回合时长）+ 第 3 回合结束 heal percent-max-hp 0.05 |
| 120001027 突破5 | Passive | 受击回复 150 能量（on-being-hit） |
| 120000046 自保 | Passive | has-debuff 时每回合开始 damage-reduction 0.10 |
| 120000051 蛰伏 | Passive | hp-below-50 一次，damage-reduction 0.15（maxTriggers 1） |
| 120000054 鼓舞 | Passive | 友方攻击时自身回复 25 能量，目标 self |
| 120000055 反杀 | Passive | target-hp-above-self 时 crit-rate 0.30（1 回合） |
| 120000059 祝福 | Passive | 战斗前 2 回合 heal-bonus 0.20（oncePerBattle，timed 2） |
| 120001005 战斗续航 | Passive | hp-below-30 时 heal percent-attack 0.30 |
| 6910001012 终极技能 | Ultimate | 原有元数据兜底：单体物理 2.0× |

共享被动（120001027 / 120000046 / 120000051 / 120000054 / 120000055 / 120000059 / 120001005）按技能 id 与库内既有实现对齐效果与触发，保留本英雄自己的 `ability`/`abilityDes` tid。本轮同时修正两处旧数据：鼓舞触发目标由 all-allies 改为 self（拥有者回能）、蛰伏补 `maxTriggers: 1`。

## 近似项

- 312040175：目录未给出减伤叠加方式，采用“每回合开始获得 1 回合 8% 减伤、最多 3 次”的表达；第 3 回合结束时回血用 `conditionKey: round-3` 近似，`requiresInvestigation: false`，因为机制可用现有字段表达。
- 普攻为项目兜底（客户端没有 HeroTable.Ability 值），非原版精确倍率。

## requiresInvestigation

本英雄无 `requiresInvestigation: true` 的技能。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1020401`：通过（1/1 heroes clean）
- `node --test test/hero-1020401-skill-validation.test.mjs`：9/9 通过
- 测试覆盖：14 个技能 id 完整加载、全技能可执行结构、普攻 damage、3 个专精与 2 个特色专精、7 个共享被动数值与条件、15 条触发注册，以及 EffectExecutor 实跑 damage/heal/energy/dispel 与 max-hp-percent 增益归类。

## 遗留风险

- 战斗引擎目前未在回合循环中调用 `applySkillEffects`/`processTriggers`（既有系统性缺口，本轮按约定记录不修），因此定义可执行但尚未在实战流程生效。
- 精确倍率仍需 FightTable.Effect/Buff 数据；当前数值按技能描述保守取值。

