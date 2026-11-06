# Hero 1030101（露奈尔）技能实现与验证

日期：2026-11-05
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1030101.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1030101.json`（cwd `personal-server`）

## 英雄信息

- ID 1030101，露奈尔，Knight
- 本轮前 15 个技能中 14 个 `implementation.effects` 为空，普攻缺 `effectType`/`damage`。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-4 Knight Basic Attack | Normal | 项目兜底：单体物理 1.0×，canCrit |
| 313010171 不屈 | Mastery | 战斗开始永久 damage-reduction 0.05 |
| 313010172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 313010173 泰然自若 | Mastery | 战斗开始永久 crit-resist 0.05 + crit-damage-reduction 0.10 |
| 313010174 盘石之固 | Mastery | 普攻/绝招后自身 damage-reduction 0.15（1 回合），近似“下一次受伤降低 15%” |
| 313010175 赤红攻势 | Mastery | 前 3 回合 damage-reduction 0.08（maxTriggers 3）+ 第 3 回合结束 heal percent-max-hp 0.05 |
| 120001027 突破5 | Passive | 受击回复 150 能量 |
| 120000051 蛰伏 | Passive | hp-below-50 一次，damage-reduction 0.15 |
| 120000054 鼓舞 | Passive | 友方攻击时自身回复 25 能量（目标 self） |
| 120000055 反杀 | Passive | target-hp-above-self 时 crit-rate 0.30 |
| 120000059 祝福 | Passive | 前 2 回合 heal-bonus 0.20 |
| 120001003 生命护盾 | Passive | 首次 hp-below-70 获得 percent-defense 0.80 护盾 2 回合 |
| 120001019 防护加持 | Passive | on-ultimate-use（oncePerBattle）damage-reduction 0.20，timed 2 |
| 6103010109 露奈尔_稀有技能 | Ultimate | on-round-end 为 all-allies 提供 shield percent-max-hp 0.05（1 回合），energyCost 100 |
| 6910001003 终极技能 | Ultimate | 原有元数据兜底：单体物理 2.0× |

## 近似项与 requiresInvestigation

- `313010174`（requiresInvestigation）：单次受伤减免无法按次数消耗，近似为 1 回合减伤。
- `120001019`（requiresInvestigation）：目录为“释放首次终结技**前**”，现有触发只能在终结技使用时触发，因此近似为首次终结技时获得 2 回合 20% 减伤；前置窗口本身未表达。
- `6103010109`（requiresInvestigation）：极夜冒险者翻倍、`{0}` 状态层未建模；保留 `polarNightDouble` 标记字段供后续引擎读取，当前仅执行 5% 最大生命护盾。
- 稀有终结技的触发定义在 Ultimate 技能上，`registerPassiveTriggers` 只绑定 Passive/Mastery，因此该触发需由技能执行路径处理（当前引擎尚未接入）。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1030101`：通过
- `node --test test/hero-1030101-skill-validation.test.mjs`：10/10 通过
- 测试覆盖：15 个技能 id、全技能可执行结构、普攻 damage、专精与特色技能数值、稀有终结技的 all-allies/5%/1 回合/100 能量、15 条被动触发注册（终结技触发单独校验），以及 EffectExecutor 实跑 damage/heal/shield/energy/stat-modifier。

## 遗留风险

- 极夜翻倍与 `{0}` 状态机制缺失；没有对应状态类型可用，未伪造数值。
- 技能触发与战斗引擎回合循环尚未接线（既有系统性缺口，本轮不修）。

