# Hero 2030201 龙之澜 技能补全（技能组 B）

日期：2026-11-05
技能数：15

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=2030201`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-2030201-skill-validation.test.mjs`：22/22 通过
- 写入方式：补丁 `agent/workflow/skill-system-validation/patch-b-20261105/hero-2030201.json` 经 `apply-hero-skill-patch.mjs` 应用。

修复前该英雄 1/15（6203020109 澜_稀有_总挂载）缺 effectType/effects，另有 `hit-rate`、`crit-resistance` 等非枚举 statType 导致 verify 报错。本轮补全稀有技能，并把相关 statType 收敛到枚举内。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack | Normal | damage / single | 1.0x 物理 |
| 323020171 | 重击 | Mastery | stat-modifier / self | 战斗开始 damage-bonus +5% |
| 323020172 | 无畏 | Mastery | stat-modifier / self | 战斗开始 attack-percent +5% |
| 323020173 | 弱点洞悉 | Mastery | stat-modifier / self | 战斗开始 ignore-defense +5%、hit-rate +10%（本轮调整） |
| 323020174 | 鼓舞人心 | Mastery | energy / lowest-hp-ally | 普攻/绝招后 30% 概率给生命最低友方 100 能量（能量最低不可查，近似生命最低） |
| 323020175 | 滔天巨浪 | Mastery | stat-modifier / single | 终结技后目标 damage-reduction -0.05（受伤 +5%），timed 2 |
| 120001026 | 突破4 | Passive | energy / self | 战斗开始 +600 初始能量 |
| 120000018 | 破盾 | Passive | stat-modifier / self | damage-bonus +15%（未区分防御型目标） |
| 120000019 | 锋刃 | Passive | stat-modifier / self | damage-bonus +30% |
| 120000023 | 激怒 | Passive | energy / self | 普攻/技能各回 100 能量 |
| 120000025 | 戒备 | Passive | stat-modifier / self | 有增益时 crit-resistance +30%（本轮调整，条件未判定） |
| 120000028 | 鹰眼 | Passive | stat-modifier / self | 生命 >50% 时 hit-rate +15%（本轮调整） |
| 120001009 | 穿刺一击 | Passive | stat-modifier / self | 首次终结技 ignore-defense +30% |
| 6203020109 | 澜_稀有_总挂载 | Ultimate | stat-modifier / all-allies | 战斗开始/敌方死亡时为我方全体施加 1 回合 5% 减免；终结技时给全体 crit-damage +5%（maxStacks 3） |
| 6910001017 | Skill 6910001017 | Ultimate | damage / single | 缺描述，2.0x 物理单击兜底 |

## 6203020109 稀有技能的实现取舍

原描述为“战斗开始时或每当敌方冒险者死亡时，为我方全体施加{0}，持续1回合，且若己方冒险者在{0}期间释放过终结技，则{0}结束时将使我方全体暴击伤害提升5%，古域阵营单位翻倍，至多叠加3层”。

- `{0}` 模板未解出，按 1 回合 5% 最终伤害减免近似；
- 施加时机用 `on-round-start`（oncePerBattle）与 `on-kill` 两个触发器；
- 暴击伤害部分用 `on-ultimate-use` 触发 crit-damage +0.05、`permanent`、`maxStacks: 3`；
- “{0}期间使用过终结技”的窗口判定、结束时机、古域阵营翻倍均未接入引擎，全部记入 notes，requiresInvestigation = true。

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 120000025 戒备 | true | “有增益状态”条件未由引擎判定，按回合开始与获得增益时施加 |
| 6203020109 稀有技能 | true | 未知 buff 模板、阵营翻倍、窗口判定均未解 |
| 6910001017 | true | 缺描述，通用 2.0x 物理 |

323020174 鼓舞人心、323020175 滔天巨浪 原实现已标近似（能量最低→生命最低；受伤增加→负减免），本轮保持不变。

## 遗留风险

- 战斗引擎未调用技能库效果（既有缺口）。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。
