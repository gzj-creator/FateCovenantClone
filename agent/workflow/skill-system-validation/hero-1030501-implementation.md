# Hero 1030501（灾祸双子）技能实现与验证

日期：2026-11-05
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1030501.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1030501.json`（cwd `personal-server`）

## 英雄信息

- ID 1030501，灾祸双子（海瑟），Knight
- 本轮前 15 个技能中 2 个 `implementation.effects` 为空：normal-profession-4 与稀有终结技 6103030103。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-4 Knight Basic Attack | Normal | 项目兜底：单体物理 1.0×（本轮补齐） |
| 313050171 不屈 | Mastery | 战斗开始永久 damage-reduction 0.05 |
| 313050172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 313050173 泰然自若 | Mastery | 战斗开始永久 crit-resist 0.05 + crit-damage-reduction 0.10 |
| 313050174 影佑誓言 | Mastery | 普攻/绝招后 30% 概率获得 shield percent-max-hp 0.05 |
| 313050175 重重诡影 | Mastery | has-shield 时 damage-reduction 0.08 |
| 120001027 突破5 | Passive | 受击回复 150 能量 |
| 120000046 自保 | Passive | has-debuff 时 damage-reduction 0.10 |
| 120000051 蛰伏 | Passive | hp-below-50 一次 damage-reduction 0.15 |
| 120000054 鼓舞 | Passive | 友方攻击时回复 25 能量 |
| 120000055 反杀 | Passive | target-hp-above-self 时 crit-rate 0.30 |
| 120000059 祝福 | Passive | 前 2 回合 heal-bonus 0.20（oncePerBattle，timed 2） |
| 120001003 生命护盾 | Passive | 首次 hp-below-70 获得 percent-defense 0.80 护盾 2 回合 |
| 6103030103 海瑟_稀有技能 | Ultimate | 受击（on-being-hit）为 all-allies 提供 shield percent-max-hp 0.10，timed 2 回合；`maxTriggersPerRound: 3`、`round3Double: true`，energyCost 100 |
| 6910001007 终极技能 | Ultimate | 元数据兜底：单体物理 2.0× |

## 近似项与 requiresInvestigation

- `6103030103`（requiresInvestigation）：
  - 已建模：受击时全队护盾 10% 自身最大生命、2 回合、每回合最多 3 次、第 3 回合起翻倍（以 `round3Double` 标记字段表达，当前执行器只施加基础护盾值）。
  - 未建模：目标为“生命百分比最低的 3 名友军”（`target-selector` 无“最低 3 名”类型，改用 all-allies）、我方同排 5% 能量降低抗性、敌方同排 5% 能量恢复降低（可叠至 15%）、前排护盾控制抗性 15%、后排护盾能量恢复与异常状态抗性 15%（缺同排目标类型与对应 statType）。
- 313050174 的 30% 概率写在效果包装体的 `chance` 上，保持与既有实现一致。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1030501`：通过
- `node --test test/hero-1030501-skill-validation.test.mjs`：9/9 通过
- 测试覆盖：15 个技能 id、全技能可执行结构、普攻 damage、5 个专精、稀有终结技的 10%/2 回合/每回合 3 次/翻倍标记、7 个共享被动（含祝福为 2 回合且整场一次的纠正）、14 条被动触发注册，以及 EffectExecutor 实跑 damage/护盾（3 种来源）/energy/stat-modifier。

## 遗留风险

- 同排增益与“最低生命 3 人”目标选择依赖后续目标选择器扩展。
- `round3Double` 与 `maxTriggersPerRound` 目前是定义层标记，执行器尚未读取。
- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。

