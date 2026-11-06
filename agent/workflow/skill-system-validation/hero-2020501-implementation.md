# Hero 2020501（炎拳）技能实现与验证

日期：2026-11-05（更新 2026-11-02 版本）
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-2020501.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-2020501.json`（cwd `personal-server`）

## 英雄信息

- ID 2020501，炎拳，Ranger，HP 630 / ATK 95 / DEF 60
- 本轮前仅 322050175 锢魂之咒既缺 `effectType` 也缺 `effects`（触发为空）。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-3 Ranger Basic Attack | Normal | 项目兜底：单体物理 1.0× |
| 322050171 不屈 | Mastery | 战斗开始永久 damage-reduction 0.05 |
| 322050172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 322050173 超群技艺 | Mastery | 战斗开始永久 status-hit 0.10 + status-resist 0.10 |
| 322050174 无间囚笼 | Mastery | 普攻/绝招后 30% 概率施加 status `chain`（2 回合，1 层） |
| 322050175 锢魂之咒 | Mastery | 普攻/绝招后对目标施加 crit-rate -0.05 与 evasion -0.05（各 2 回合，conditionKey `target-has-debuff`） |
| 120001028 突破6 | Passive | 友方普攻/绝招时自身回复 50 能量 |
| 120000032 反弹 | Passive | 受击时 rebound-rate 0.10 |
| 120000034 铁甲 | Passive | hp-above-50 时 anti-crit 0.20 |
| 120000037 亢奋 | Passive | on-kill 回复 100 能量 |
| 120000042 暴怒 | Passive | 释放能量技能时 crit-damage 0.30 |
| 120000044 奋激 | Passive | 首次终结技后 damage-reduction 0.20（oncePerBattle） |
| 120001003 生命护盾 | Passive | 首次 hp-below-70 获得 percent-defense 0.80 护盾 2 回合 |
| 6910001026 终极技能 | Ultimate | 元数据兜底：单体物理 2.0× |

## 本轮改动

- 322050175 锢魂之咒：由“空 effects / 空 triggers”改为两条减益效果 + 两条触发（on-attack / on-skill-use），`effectType: stat-modifier`、`targetType: single`、`energyCost: 0`。
- 测试中原先断言“锢魂之咒为空”的用例已按目录描述校正为断言 -5% 暴击、-5% 闪避、2 回合与双触发，而非弱化断言。

## 近似项与 requiresInvestigation

- `322050174`（requiresInvestigation）：【锁链】只以 status `chain` 表达 1 层，尚未实现层数叠加与每层数值；30% 概率写在效果包装体 `chance`。
- `322050175`（requiresInvestigation）：目录为对【锁链】目标额外降暴击/闪避；引擎无法按“目标身上有 chain”过滤，近似为对已有减益（`target-has-debuff`）的目标施加，链层加成未叠加。
- `6910001026`：缺少本地化描述，沿用元数据兜底 2.0×。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=2020501`：通过
- `node --test test/hero-2020501-skill-validation.test.mjs`：8/8 通过
- 测试覆盖：14 个技能 id、全技能可执行结构、普攻 damage、专精与被动数值、锁链状态与锢魂之咒减益、16 条触发注册，以及 EffectExecutor 实跑 damage/energy/shield/status/负面 stat-modifier（验证负值进入 debuffs）。

## 遗留风险

- 锁链层数、链目标过滤与“原加成之上”的叠加规则未建模。
- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。

