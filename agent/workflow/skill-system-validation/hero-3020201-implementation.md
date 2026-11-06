# Hero 3020201 啵啵水母 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：14

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=3020201`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-3020201-skill-validation.test.mjs`：22/22 通过
- 写入方式：补丁 `agent/workflow/skill-system-validation/patch-b-20261105/hero-3020201.json` 经 `apply-hero-skill-patch.mjs` 应用。

修复前 332020174 扶危定乱缺 effects，另有 `max-hp-percent`、`status-hit`、`status-resist`、`anti-crit`、`evasion` 等非枚举 statType，verify 报 11 条问题。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-3 | Ranger Basic Attack | Normal | damage / single | 1.0x 物理 |
| 332020171 | 不屈 | Mastery | stat-modifier / self | 战斗开始 5% 最终伤害减免 |
| 332020172 | 健壮 | Mastery | stat-modifier / self | 战斗开始 max-hp-percent +5%（本轮调整） |
| 332020173 | 超群技艺 | Mastery | stat-modifier / self | 战斗开始 status-hit +10%、status-resist +10%（本轮调整） |
| 332020174 | 扶危定乱 | Mastery | dispel / random-ally | **本轮补全**：普攻/绝招后驱散 1 个友方减益（`removeType: debuff`, count 1） |
| 332020175 | 护体波涛 | Mastery | shield / self | 生命首次 <40% 获得 15% 最大生命护盾 |
| 120001028 | 突破6 | Passive | energy / self | 普攻/技能 +50 能量（友方触发按自身近似） |
| 120000034 | 铁甲 | Passive | stat-modifier / self | 生命 >50% 时 anti-crit +20%（本轮调整） |
| 120000037 | 亢奋 | Passive | energy / self | 敌方被击退→on-kill +100 能量 |
| 120000042 | 暴怒 | Passive | stat-modifier / self | 释放技能暴伤 +30% |
| 120000044 | 奋激 | Passive | stat-modifier / self | 首次终结技后减免 +20% |
| 120001005 | 战斗续航 | Passive | heal / self | 生命 <30% 回 30% 攻击力 |
| 120001015 | 均衡卸力 | Passive | stat-modifier / self | 终结技后 evasion +20%（timed 1，本轮调整） |
| 6910001036 | Skill 6910001036 | Ultimate | damage / single | 缺描述，2.0x 物理兜底 |

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 332020174 扶危定乱 | true | “随机 1 个友方”目标由引擎随机选取，自身是否在候选内取决于战斗队列 |
| 6910001036 | true | 缺描述，通用 2.0x 物理 |

120001028 突破6 的 notes 仍标注友方事件按自身近似；如需与其它英雄统一，可后续改为 requiresInvestigation。

## 遗留风险

- 战斗引擎未调用技能库效果（既有缺口）。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。

