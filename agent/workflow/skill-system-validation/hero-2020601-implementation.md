# Hero 2020601（影之菖蒲）技能实现与验证

日期：2026-11-05（更新 2026-11-02 版本）
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-2020601.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-2020601.json`（cwd `personal-server`）

## 英雄信息

- ID 2020601，影之菖蒲，Assassin，HP 600 / ATK 95 / DEF 50
- 本轮前仅 6202060112 无限瞬杀缺少 `effectType`/`effects`/`triggers`（元数据占位）。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-2 Assassin Basic Attack | Normal | 项目兜底：单体物理 1.0× |
| 322060171 重击 | Mastery | 战斗开始永久 damage-bonus 0.05 |
| 322060172 无畏 | Mastery | 战斗开始永久 attack-percent 0.05 |
| 322060173 弱点洞悉 | Mastery | 战斗开始永久 ignore-defense 0.05 + hit-rate 0.10 |
| 322060174 会心一击 | Mastery | 普攻/绝招时 ignore-defense 0.05 + damage-bonus 0.05（1 回合，共 4 条触发） |
| 322060175 割魂厄鬼 | Mastery | 前 3 次终结技 crit-rate 0.15 + crit-damage 0.20（maxTriggers 3） |
| 120001026 突破4 | Passive | 回合开始一次性 +600 能量 |
| 120000019 锋刃 | Passive | 战斗开始 damage-bonus 0.30 |
| 120000023 激怒 | Passive | 普攻/绝招额外回复 100 能量 |
| 120000025 戒备 | Passive | on-round-start（oncePerBattle）与 on-buff-gain 提供 crit-resistance 0.30 |
| 120000028 鹰眼 | Passive | hp-above-50 时 hit-rate 0.15 |
| 120001004 爆裂一击 | Passive | 首次终结技 crit-rate 1.00（oncePerBattle） |
| 120001011 振奋加持 | Passive | hp-above-70 时 attack-percent 0.05 |
| 6202060112 无限瞬杀 | Passive | 终结技时追加一次 0.50× 攻击力的单体物理追击（on-ultimate-use） |

## 本轮改动

- 6202060112 无限瞬杀：由空定义改为单条 damage 效果 + on-ultimate-use 触发，保留原 description 与目录来源（`CharacterSkillCatalog`，无 FightTable ability）。
- 测试中原先断言“无限瞬杀为空”的用例已按目录描述校正为断言追击伤害效果与近似说明。

## 近似项与 requiresInvestigation

- `6202060112`（requiresInvestigation）：目录为“终结技追击次数从 2 次调整为无限”，引擎没有追击次数模型；保守近似为终结技时额外 1 次 0.5× 物理追击，不追踪次数上限，也不等同于无限次。
- 120000025 戒备：目录为“自身有增益状态时抗暴率 +30%”，以 on-round-start（oncePerBattle）与 on-buff-gain 两条触发近似，未在 `requiresInvestigation` 置位（与库内同名技能处理一致），此处如实记录为近似。
- 120001026 突破4：「初始能量增加 600」以回合开始一次性回能表达。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=2020601`：通过
- `node --test test/hero-2020601-skill-validation.test.mjs`：8/8 通过
- 测试覆盖：14 个技能 id、全技能可执行结构、普攻 damage、5 个专精（含会心一击 4 条触发与割魂厄鬼 maxTriggers 3）、7 个被动、无限瞬杀的追击近似、20 条触发注册，以及 EffectExecutor 实跑 damage/追击/energy/stat-modifier。

## 遗留风险

- 无限追击与“追击次数”机制缺失；当前仅 1 次 0.5× 追击。
- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。

