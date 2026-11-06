# Hero 1030601（梦魅）技能实现与验证

日期：2026-11-05
技能库：`personal-server/config/skill-database.json`
补丁：`agent/workflow/skill-system-validation/patches/20261105/hero-1030601.json`
写入方式：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/20261105/hero-1030601.json`（cwd `personal-server`）

## 英雄信息

- ID 1030601，梦魅，Knight
- 本轮前 14 个技能中仅 normal-profession-4 缺少 `effectType`/`effects`（其余专精与被动已有可执行定义）。

## 技能清单与实现方式

| 技能 | 类型 | 实现 |
| --- | --- | --- |
| normal-profession-4 Knight Basic Attack | Normal | 项目兜底：单体物理 1.0×（本轮补齐） |
| 313060171 不屈 | Mastery | 战斗开始永久 damage-reduction 0.05 |
| 313060172 健壮 | Mastery | 战斗开始永久 max-hp-percent 0.05 |
| 313060173 一晌贪欢 | Mastery | 战斗开始永久 crit-resist 0.05 + crit-damage-reduction 0.10 |
| 313060174 如梦初醒 | Mastery | 普攻/绝招后 damage-bonus 0.15（1 回合） |
| 313060175 坠入深渊 | Mastery | 终结技时 crit-rate 0.10 + crit-damage 0.15（timed 2） |
| 120001027 突破5 | Passive | 受击回复 150 能量 |
| 120000046 自保 | Passive | has-debuff 时 damage-reduction 0.10 |
| 120000051 蛰伏 | Passive | hp-below-50 一次 damage-reduction 0.15 |
| 120000054 鼓舞 | Passive | 友方攻击时回复 25 能量 |
| 120000055 反杀 | Passive | target-hp-above-self 时 crit-rate 0.30 |
| 120000059 祝福 | Passive | 前 2 回合 heal-bonus 0.20 |
| 120001003 生命护盾 | Passive | 首次 hp-below-70 获得 percent-defense 0.80 护盾 2 回合 |
| 6910001008 终极技能 | Ultimate | 元数据兜底：单体物理 2.0× |

## 近似项与 requiresInvestigation

- `requiresInvestigation: true` — 313060174 如梦初醒：现有触发框架无法限定“下一次终结技”，以普攻/绝招后 1 回合 damage-bonus 0.15 近似（不区分技能类型），补丁 `patches/20261105/hero-1030601-extra.json`。
- 其余专精/被动均可由现有效果与触发字段表达。
- 313060173 的“抗暴率”使用词表 `crit-resist`（与库内同 id 技能一致）；`crit-damage-reduction` 表示暴击伤害减免。
- 普攻为项目兜底，非原版精确倍率。

## 验证

- `node scripts/verify-hero-skills.mjs --hero=1030601`：通过
- `node --test test/hero-1030601-skill-validation.test.mjs`：8/8 通过（本轮新建测试，此前无该英雄测试文件）
- 测试覆盖：14 个技能 id、全技能可执行结构、普攻 damage、5 个专精数值、7 个共享被动条件、15 条触发注册，以及 EffectExecutor 实跑 damage/shield/energy/stat-modifier（含暴击伤害减免归入增益）。

## 遗留风险

- “下一次终结技”限定无法用现有触发条件表达，可能覆盖到普通技能伤害。
- 战斗引擎回合循环尚未调用技能效果与触发处理（既有系统性缺口，本轮不修）。

