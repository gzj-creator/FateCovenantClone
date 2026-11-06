# Hero 3020401 秘典魔女 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：14

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=3020401`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-3020401-skill-validation.test.mjs`：22/22 通过
- 写入方式：补丁 `agent/workflow/skill-system-validation/patch-b-20261105/hero-3020401.json` 经 `apply-hero-skill-patch.mjs` 应用。

修复前 11/14 个技能 `effects` 为空（含 4 条 mastery 与 6 条被动）。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-4 | Knight Basic Attack | Normal | damage / single | 1.0x 物理兜底普攻 |
| 332040171 | 不屈 | Mastery | stat-modifier / self | 战斗开始最终伤害减免 +5% |
| 332040172 | 健壮 | Mastery | stat-modifier / self | 战斗开始 max-hp-percent +5%（permanent, oncePerBattle） |
| 332040173 | 泰然自若 | Mastery | stat-modifier / self | 战斗开始 crit-resist +5%、crit-damage-reduction +10% |
| 332040174 | 盘石之固 | Mastery | stat-modifier / self | 普攻/绝招后 1 回合 15% 减免 |
| 332040175 | 预备法术 | Mastery | stat-modifier / self | 前 3 回合每回合 8% 减免（maxTriggers 3）；第 3 回合结束回 5% 最大生命 |
| 120001027 | 突破5 | Passive | energy / self | 受击回 150 能量 |
| 120000046 | 自保 | Passive | stat-modifier / self | 有减益时 +10% 减免 |
| 120000051 | 蛰伏 | Passive | stat-modifier / self | 生命 <50% 首次 +15% 减免 |
| 120000054 | 鼓舞 | Passive | energy / self | 普攻回 25 能量（近似） |
| 120000055 | 反杀 | Passive | stat-modifier / self | 目标生命更高时暴击 +30% |
| 120000059 | 祝福 | Passive | stat-modifier / self | 前 2 回合被治愈率 +20% |
| 120001005 | 战斗续航 | Passive | heal / self | 回合开始生命 <30% 时回复 30% 攻击力（已实现，保留） |
| 6910001038 | Skill 6910001038 | Ultimate | damage / single | 缺描述，2.0x 物理单击，requiresInvestigation |

共享被动按 id 克隆，元数据保留秘典魔女自身 tid（33204017x、12000xxxx）。

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 332040174 盘石之固 | true | “下一次受伤”近似 1 回合减免 |
| 120000054 鼓舞 | true | 友方触发未接入，按自身普攻 |
| 6910001038 | true | 缺描述，通用 2.0x 物理 |

预备法术未标调查项：3 回合减免与第 3 回合结束回血都能用现有 trigger/duration 表达。

## 遗留风险

- 战斗引擎未调用技能库效果（既有缺口）。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。

