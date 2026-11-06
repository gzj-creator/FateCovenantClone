# Hero 5040301 千千结 - 技能实现与验收

日期：2026-11-05

## 英雄信息

- ID：5040301
- 名称：千千结
- 职业：Assassin（冲锋）
- 基础数值：HP 8000 / ATK 1080 / DEF 360 / SPD 104

## 技能清单（13 个，全部有 effects）

| 技能 ID | 名称 | 类型 | effectType | 实现方式 |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | damage | 项目兜底普攻，100% 物理单体伤害（客户端无 HeroTable.Ability 行） |
| 2504030123 | 绛丝乱舞 | Ultimate | damage | 敌方全体 130% 物理、无视 50% 防御；附加 15% 最大生命值的无视防御伤害 |
| 354030172 | 潜能蕴养 | Mastery | stat-modifier | 终结技后 +20% 最终伤害加成（1 回合、可叠 3 层）；每回合首次终结技使随机敌方能量 -1（天极值近似） |
| 354030173 | 核心突破 | Mastery | stat-modifier | 每回合首次终结技 +100% 暴击率（1 回合） |
| 354030174 | 极意自现 | Mastery | energy | 普攻/绝招行动后 +100 能量（天极值近似）；终结技前摧毁目标护盾 20% 的占位效果，最多 4 次 |
| 354030175 | 真我超越 | Mastery | stat-modifier | 战斗开始一次性 +50% 伤害加成（其余天极技/乱针结护条款未建模） |
| 120001026 | 突破4 | Passive | energy | 战斗开始获得 600 初始能量（整场一次） |
| 120000017 | 收割 | Passive | stat-modifier | +10% 伤害加成（目标生命低于 50% 的条件未建模） |
| 120000020 | 洞察 | Passive | stat-modifier | +20% 暴击率（目标生命高于 50% 的条件未建模） |
| 120000023 | 激怒 | Passive | energy | 普攻/绝招额外 +100 能量 |
| 120000026 | 刺杀 | Passive | stat-modifier | +20% 伤害加成（敌方后排条件未建模） |
| 120000028 | 鹰眼 | Passive | stat-modifier | 生命高于 50% 时命中率 +15% |
| 120001009 | 穿刺一击 | Passive | stat-modifier | 首次终结技无视 30% 防御（整场一次） |

## 数据与写入方式

- 补丁文件：`agent/workflow/skill-system-validation/patches/group-c/5040301.json`
- 写入命令（在 `personal-server/` 下执行）：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/group-c/5040301.json`
- 原有 `ability` / `abilityDes` 元数据逐条保留；共享被动按技能 ID 从其它英雄的已实现版本克隆（120001026 来自 1010201、120000017/120000020/120000026 来自 5040101、120000023/120000028 来自 1010201、120001009 来自 1030401），元数据均为本英雄自身 tid。

## 近似项与 requiresInvestigation

1. **2504030123 绛丝乱舞**：`requiresInvestigation: true`。130% 物理与无视 50% 防御来自描述；额外伤害的【致盲】前置条件与“不超过自身攻击 100%”的上限无法在效果框架内表达，因此按 15% 最大生命值无条件生效。描述中混入的天极值、乱针结护、超凡生命条款未建模。
2. **354030172 潜能蕴养**：`requiresInvestigation: true`。1 点天极值以 1 点敌方能量损失近似；+20% 伤害加成最多 3 层、回合结束移除已按 `timed` 1 回合 + `maxStacks: 3` 表达；其余冲锋职业获得一半加成未建模。
3. **354030173 核心突破**：`requiresInvestigation: true`。必暴近似为 +100% 暴击率 1 回合；【裁断】斩杀与偷取攻击力、描述中的 `{0}` 占位符未能解析。
4. **354030174 极意自现**：`requiresInvestigation: true`。1 点天极值近似为 +100 能量；效果框架无法直接扣除护盾，因此“摧毁 20% 护盾”登记为对目标的一条正面 `shield` 占位效果（数值 0.2），属已知近似；每回合 4 次限制以整场 `maxTriggers: 4` 近似。
5. **354030175 真我超越**：`requiresInvestigation: true`。仅实现“伤害加成提升至 50%”的一次性触发；我方全体乱针结护、每回合追击天极技、天极技必暴未建模。
6. **120000017 / 120000020 / 120000026**：目标位置与目标血量条件在现有触发器中不可判定，按战斗开始的一次性常驻增益近似。

## 验证结果

- `node scripts/verify-hero-skills.mjs --hero=5040301`：通过（1/1 heroes clean）
- `node --test test/hero-5040301-skill-validation.test.mjs`：24/24 通过
- 测试覆盖：13 条技能 ID 顺序、每个技能 `effectType` 与首个效果一致、绛丝乱舞数值/目标、护盾与治疗执行值、普攻含 damage、能量/增益执行。

## 遗留风险

- 战斗主循环尚未读取技能库（`battle-engine.mjs` 接入为既有系统性缺口，本轮按要求未修改），上述定义目前是“可执行定义”，尚未在实战中生效。
- 天极值、护盾破坏、斩杀、召唤类机制均无对应效果类型，只能近似或占位，后续需要在效果框架层面扩展。

