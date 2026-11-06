# Hero 1030301（观星者）技能实现与验证

日期：2026-11-05（更新 2026-11-01 版本）
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1030301.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1030301.json`（cwd `personal-server`）

## 英雄信息

- ID 1030301，观星者，Warrior，HP 1200 / ATK 220 / DEF 55
- 本轮前 13 个技能已具备 effects，仅 313030174 迎头痛击缺少 `effects`（触发已存在）。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-1 Warrior Basic Attack | Normal | 项目兜底：单体物理 1.0× |
| 313030171 重击 | Mastery | 战斗开始永久 damage-bonus 0.05 |
| 313030172 无畏 | Mastery | 战斗开始永久 attack-percent 0.05 |
| 313030173 直击要害 | Mastery | 战斗开始永久 crit-rate 0.05 + crit-damage 0.10 |
| 313030174 迎头痛击 | Mastery | 普攻/绝招后 dispel 1 个敌方增益（本轮补齐 effects；on-attack / on-skill-use） |
| 313030175 星爆陨灭 | Mastery | 终结技时 crit-rate 0.10 + crit-damage 0.15 |
| 120001031 突破9 | Passive | 普攻/绝招回复 200 能量 |
| 120000001 狂怒 | Passive | 终结技时 crit-rate 0.15 |
| 120000006 勃发 | Passive | hp-above-50 时 crit-damage 0.20 |
| 120000009 鼓舞 | Passive | 友方攻击时回复 25 能量 |
| 120000014 格挡 | Passive | oncePerBattle damage-reduction 0.20 |
| 120000015 标记 | Passive | target-has-debuff 时 crit-rate 0.25 |
| 120001002 生命偷取 | Passive | 终结技时 heal percent-attack 0.20 |
| 6910001005 终极技能 | Ultimate | 元数据兜底：单体物理 2.0× |

## 近似项与 requiresInvestigation

- 313030174：dispel 语义可由现有框架精确表达，`requiresInvestigation` 未置位。
- 120001002 生命偷取（`requiresInvestigation: true`）：目录为“终结技造成伤害的 10% 转化为生命”，触发系统无法读取实际伤害值，保留原有的 percent-attack 0.20 近似（前期实现已记录），需要后续伤害事件回传才能精确。
- 6910001005（`requiresInvestigation: true`）缺少本地化描述（MISSING_ABILITY_DESCRIPTION），沿用元数据兜底倍率。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1030301`：通过
- `node --test test/hero-1030301-skill-validation.test.mjs`：9/9 通过
- 测试覆盖：14 个技能 id、全技能可执行结构、普攻 damage、5 个专精（含迎头痛击 dispel 的 effects 与 triggers）、7 个被动数值与条件、17 条触发注册，以及 EffectExecutor 实跑 damage/heal/energy/dispel/stat-modifier。

## 遗留风险

- 生命偷取的实际伤害比例依赖引擎伤害事件；当前为保守近似。
- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。

