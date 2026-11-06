# Hero 3020301 闪耀甜心 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：14

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=3020301`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-3020301-skill-validation.test.mjs`：22/22 通过
- 写入方式：补丁文件 `agent/workflow/skill-system-validation/patch-b-20261105/hero-3020301.json` 经 `node scripts/apply-hero-skill-patch.mjs` 应用；未手工编辑技能库，未改战斗引擎。

本轮修复前 12/14 个技能 `effects` 为空。现全部技能具备 `effectType` / `targetType` / `effects[]`，普攻含 damage。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-4 | Knight Basic Attack | Normal | damage / single | 项目兜底普攻，1.0x 物理 |
| 332030171 | 不屈 | Mastery | stat-modifier / self | 战斗开始最终伤害减免 +5%（permanent, oncePerBattle） |
| 332030172 | 健壮 | Mastery | stat-modifier / self | 战斗开始 max-hp-percent +5%（permanent, oncePerBattle） |
| 332030173 | 泰然自若 | Mastery | stat-modifier / self | 战斗开始 crit-resist +5%、crit-damage-reduction +10% |
| 332030174 | 盘石之固 | Mastery | stat-modifier / self | 普攻/绝招后 1 回合 15% 减免（on-attack + on-skill-use） |
| 332030175 | 偶像特权 | Mastery | stat-modifier / self | on-round-start 最多 3 次各给 8% 减免（timed 1）；on-round-end `round-3` 回复 5% 最大生命（heal percent-max-hp） |
| 120001027 | 突破5 | Passive | energy / self | 受击回复 150 能量 |
| 120000046 | 自保 | Passive | stat-modifier / self | 有减益时减免 +10%（`has-debuff`） |
| 120000051 | 蛰伏 | Passive | stat-modifier / self | 生命 <50% 首次减免 +15% |
| 120000054 | 鼓舞 | Passive | energy / self | 普攻回复 25 能量（友方触发近似） |
| 120000055 | 反杀 | Passive | stat-modifier / self | 目标生命百分比更高时暴击 +30%（timed 1） |
| 120000059 | 祝福 | Passive | stat-modifier / self | heal-bonus +20%，timed 2，oncePerBattle，maxTriggers 1 |
| 120001003 | 生命护盾 | Passive | shield / self | 生命 <70% 首次获得 80% 防御护盾，timed 2 |
| 6910001037 | Skill 6910001037 | Ultimate | damage / single | 元数据缺描述，2.0x 物理单击兜底，requiresInvestigation |

共享被动按 id 克隆其它英雄已实现效果，`ability` / `abilityDes` 保留闪耀甜心自身 tid。

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 332030174 盘石之固 | true | “下一次受伤”无单次消耗机制，近似 1 回合减免 |
| 120000054 鼓舞 | true | 友方事件未接入，按自身普攻触发 |
| 6910001037 | true | 缺描述，通用 2.0x 物理 |

偶像特权按描述可实现，未标 requiresInvestigation；第 3 回合结束回血依赖 `round-3` conditionKey（引擎在 state.round 缺失时放行）。

## 遗留风险

- 战斗引擎尚未把技能库 effects/triggers 接入 executeTurn（既有缺口，本轮不改）。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。

