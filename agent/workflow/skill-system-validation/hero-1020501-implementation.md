# Hero 1020501（影盾骑士）技能实现与验证

日期：2026-11-05
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1020501.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1020501.json`（cwd `personal-server`）

## 英雄信息

- ID 1020501，影盾骑士，Knight
- 本轮前 14 个技能中 13 个 `implementation.effects` 为空，普攻缺 `effectType`/`damage`。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-4 Knight Basic Attack | Normal | 项目兜底：单体物理 1.0×，canCrit |
| 312050171 不屈 | Mastery | 战斗开始永久 damage-reduction 0.05 |
| 312050172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 312050173 泰然自若 | Mastery | 战斗开始永久 crit-resist 0.05 + crit-damage-reduction 0.10 |
| 312050174 盘石之固 | Mastery | 普攻/绝招后自身 damage-reduction 0.15（1 回合），近似“下一次受伤降低 15%” |
| 312050175 铁骨铮铮 | Mastery | 释放终结技时自身 shield percent-max-hp 0.05（on-ultimate-use） |
| 120001027 突破5 | Passive | 受击回复 150 能量 |
| 120000046 自保 | Passive | has-debuff 时 damage-reduction 0.10 |
| 120000051 蛰伏 | Passive | hp-below-50 一次，damage-reduction 0.15 |
| 120000054 鼓舞 | Passive | 友方攻击时自身回复 25 能量（目标 self） |
| 120000055 反杀 | Passive | target-hp-above-self 时 crit-rate 0.30（1 回合） |
| 120000059 祝福 | Passive | 前 2 回合 heal-bonus 0.20 |
| 120001003 生命护盾 | Passive | 首次 hp-below-70 获得 percent-defense 0.80 护盾，timed 2 回合（maxTriggers 1，effect.duration=2） |
| 6910001013 终极技能 | Ultimate | 原有元数据兜底：单体物理 2.0× |

共享被动按技能 id 与库内既有实现对齐，保留本英雄自己的 `ability`/`abilityDes` tid；同时为不屈/健壮/泰然自若补齐缺失的 `targetType`/`energyCost`，并修正鼓舞目标与蛰伏触发上限。

## 近似项与 requiresInvestigation

- `requiresInvestigation: true` — 312050174 盘石之固：目录为“下一次受到伤害降低 15%”，现有效果框架没有单次伤害消耗语义，保守近似为普攻/绝招后 1 回合内 15% 减伤（连续命中时不会按次数消耗）。
- 铁骨铮铮的护盾无明确持续回合，按“直到被消耗”处理（instant 施加，护盾值保留）。
- 普攻为项目兜底，非原版精确倍率。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1020501`：通过
- `node --test test/hero-1020501-skill-validation.test.mjs`：8/8 通过
- 测试覆盖：14 个技能 id、全技能可执行结构、普攻 damage、三个通用专精、盘石之固/铁骨铮铮、7 个共享被动（含生命护盾 2 回合与 hp-below-70）、14 条触发注册，以及 EffectExecutor 实跑 damage/shield/energy/stat-modifier/dispel。

## 遗留风险

- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。
- “下一次伤害”类效果与护盾消耗顺序的实现依赖后续引擎集成。

