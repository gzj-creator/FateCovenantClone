# Hero 3020101 热力厨娘 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：14

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=3020101`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-3020101-skill-validation.test.mjs`：21/21 通过
- 写入方式：补丁文件 `agent/workflow/skill-system-validation/patch-b-20261105/hero-3020101.json` 经 `node scripts/apply-hero-skill-patch.mjs` 在 `personal-server/` 下应用；未手工编辑 `skill-database.json`，未修改 `battle-engine.mjs`。

本轮修复前该英雄 12/14 个技能的 `implementation.effects` 为空（只有 triggers），verify 报 15 条问题。现全部技能均有 `effectType`、`targetType`、`effects[]`，普攻含 damage。

## 技能清单与实现

| 技能 | 名称 | 类型 | effectType / targetType | 实现要点 |
|---|---|---|---|---|
| normal-profession-4 | Knight Basic Attack | Normal | damage / single | 项目兜底普攻，1.0x 物理，可暴击 |
| 332010171 | 不屈 | Mastery | stat-modifier / self | 战斗开始 on-round-start（oncePerBattle）最终伤害减免 +5%，permanent |
| 332010172 | 健壮 | Mastery | stat-modifier / self | 战斗开始 max-hp-percent +5%（permanent, oncePerBattle） |
| 332010173 | 泰然自若 | Mastery | stat-modifier / self | 战斗开始 crit-resist +5%、crit-damage-reduction +10%，2 条 on-round-start 触发器 |
| 332010174 | 盘石之固 | Mastery | stat-modifier / self | on-attack 与 on-skill-use 各给 15% 伤害减免，timed 1 回合 |
| 332010175 | 火力全开 | Mastery | shield / self | on-ultimate-use 获得 5% 最大生命护盾（percent-max-hp） |
| 120001027 | 突破5 | Passive | energy / self | on-being-hit 回复 150 能量 |
| 120000046 | 自保 | Passive | stat-modifier / self | on-round-start，conditionKey `has-debuff` 时最终伤害减免 +10% |
| 120000051 | 蛰伏 | Passive | stat-modifier / self | on-hp-threshold，`hp-below-50`，oncePerBattle，减免 +15% |
| 120000054 | 鼓舞 | Passive | energy / self | on-attack 回复 25 能量（友方触发近似为自身普攻） |
| 120000055 | 反杀 | Passive | stat-modifier / self | on-attack，`target-hp-above-self` 时暴击率 +30%（timed 1） |
| 120000059 | 祝福 | Passive | stat-modifier / self | on-round-start 一次施加 heal-bonus +20%，timed 2 回合，oncePerBattle，maxTriggers 1 |
| 120001003 | 生命护盾 | Passive | shield / self | on-hp-threshold，`hp-below-70`，护盾 = 80% 防御力，timed 2 回合，oncePerBattle |
| 6910001035 | Skill 6910001035 | Ultimate | damage / single | 元数据缺描述，保守实现 2.0x 物理单击，requiresInvestigation |

共享被动 120001027 / 120000046 / 120000051 / 120000054 / 120000055 / 120000059 / 120001003 按 id 对照其它英雄已实现版本克隆效果，`ability` / `abilityDes` 保留热力厨娘自身的 tid（33201017x、12000xxxx）。

## 近似项与 requiresInvestigation

| 技能 | requiresInvestigation | 原因与近似 |
|---|---|---|
| 332010174 盘石之固 | true | 引擎没有“下一次受伤单次消耗”的减免，近似为 1 回合 15% 减免 |
| 120000054 鼓舞 | true | 描述是友方普攻/绝招触发；触发器只能绑定自身普攻事件 |
| 6910001035 | true | 无技能描述，采用通用 2.0x 物理单击 |

共享被动触发条件中的 `target-hp-above-self`、`has-debuff` 等由 `skill-integration.mjs` 的 conditionKey 判定，其中“目标生命高于自身”目前实现为默认放行，属于既有引擎局限。

## 遗留风险

- 战斗引擎尚未在 executeTurn 中调用 `applySkillEffects` / `processTriggers`，技能库定义可加载、可单测执行，但实时战斗仍走既有行为档案（既有系统性缺口，按任务要求本轮不改）。
- 本组使用的 `max-hp-percent` / `crit-resist` / `crit-damage-reduction` 等 statType 依赖 `game/effects/effect-types.mjs` 的扩展枚举（由并行分支加入）；若该扩展被回退，verify 会重新报无效 statType。

