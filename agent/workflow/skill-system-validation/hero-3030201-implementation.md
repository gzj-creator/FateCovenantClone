# Hero 3030201 冰镰使徒 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：15

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=3030201`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-3030201-skill-validation.test.mjs`：23/23 通过
- 写入方式：补丁 `agent/workflow/skill-system-validation/patch-b-20261105/hero-3030201.json` 经 `apply-hero-skill-patch.mjs` 应用。

修复前 333020175 彻骨寒气缺 effects，健壮/泰然自若使用 `max-hp-percent`、`crit-resist`、`crit-damage-reduction` 等非枚举 statType，verify 报 7 条问题。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-4 | Knight Basic Attack | Normal | damage / single | 1.0x 物理 |
| 333020171 | 不屈 | Mastery | stat-modifier / self | 战斗开始最终伤害减免 +5% |
| 333020172 | 健壮 | Mastery | stat-modifier / self | 战斗开始 max-hp-percent +5%（本轮调整） |
| 333020173 | 泰然自若 | Mastery | stat-modifier / self | 战斗开始 crit-resist +5%、crit-damage-reduction +10%（本轮调整） |
| 333020174 | 盘石之固 | Mastery | stat-modifier / self | 普攻/绝招后 1 回合 15% 减免 |
| 333020175 | 彻骨寒气 | Mastery | stat-modifier / self | **本轮补全**：前 3 回合每回合 8% 减免（maxTriggers 3）；第 3 回合结束回 5% 最大生命 |
| 120001027 | 突破5 | Passive | energy / self | 受击回 150 能量 |
| 120000046 | 自保 | Passive | stat-modifier / self | 有减益时 +10% 减免 |
| 120000051 | 蛰伏 | Passive | stat-modifier / self | 生命 <50% 首次 +15% 减免 |
| 120000054 | 鼓舞 | Passive | energy / self | 普攻回 25 能量（友方触发近似） |
| 120000055 | 反杀 | Passive | stat-modifier / self | 目标生命更高时暴击 +30% |
| 120000059 | 祝福 | Passive | stat-modifier / self | 前 2 回合被治愈率 +20% |
| 120001005 | 战斗续航 | Passive | heal / self | 生命 <30% 回 30% 攻击力 |
| 6303020105 | 伊丽莎白_稀有技能 | Ultimate | damage / single | **本轮补充**：攻击时获得 damage-bonus +20%；基础伤害 1.0x 物理；按减益层数触发的分支未接入（RI） |
| 6910001029 | Skill 6910001029 | Ultimate | damage / single | 缺描述，2.0x 物理兜底（RI） |

## 6303020105 稀有技能

描述要求“任意攻击时附加 20% 伤害加成”，并依据目标减益层数（≥3 / ≥6 / ≥9）分别回血、提升暴击率与暴击伤害、回能量。

- 已实现：`effects` = [damage 1.0x 物理, damage-bonus +20%（permanent）]；`triggers` = on-attack → damage-bonus +20%。
- 未实现：减益层数条件、每回合 5 次上限、按已损生命提升暴击与暴伤（≤25%）、回 200 能量；引擎 conditionKey 只支持生命阈值与“有减益”，不支持层数。
- requiresInvestigation = true，notes 写明范围。

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 120000054 鼓舞 | true | 友方触发未接入，按自身普攻 |
| 6303020105 稀有技能 | true | 减益层数分支未实现 |
| 6910001029 | true | 缺描述，通用 2.0x 物理 |

## 元数据说明

333020171 / 333020172 / 333020173 / 333020174 的 `ability` 与 `abilityDes`（tid 333040171–333040174、text 604400061/62/28/99）沿用库中原值，实际属于 3030401 剪刀新娘的同名技能；333020175 沿用 332030175 的元数据。按任务约定“保留英雄自己原有的 ability/abilityDes”，本轮未改写 tid，仅在此记录为待核对的元数据问题。

## 遗留风险

- 战斗引擎未调用技能库效果（既有缺口）。
- 元数据 tid 的全局一致性需要主 agent 统一处理。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。

