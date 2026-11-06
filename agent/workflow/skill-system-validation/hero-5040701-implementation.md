# 绮梦·蜜雪儿 (5040701) 技能实现与验收

日期：2026-11-04 初版；2026-11-05 补全 5 条缺失技能

## 英雄信息

- ID：5040701，名称：绮梦·蜜雪儿，职业：Assassin
- 基础数值：HP 8000 / ATK 1080 / DEF 360 / SPD 104

## 2026-11-05 修复：技能条目缺失

复检发现数据库里该英雄只有 9 条技能（1 条兜底普攻 + 1 条终结技 + 7 条共享被动），而既有测试与旧文档都要求 14 条：354070171–354070175 五个 Mastery 行整条缺失。本轮按 `insertAfter` 新增这 5 条并补齐其余 9 条的实现。

新增条目的 `ability` / `abilityDes` 置为 `null`（`resolvedAbility: false`）：仓库内没有 3540701xx 的 FightTable 行，无法伪造 tid 对应的 show_name/text/icon 元数据，这一点与现有 9 条“有真实元数据”的技能不同。名称、类型与描述来自本英雄终结技描述里拼接的机制文本与旧实现文档，标记为 `description-inferred`。

## 技能清单（14 个，全部有 effects）

| 技能 ID | 名称 | 类型 | effectType | 实现方式 |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack (冲锋) | Normal | damage | 项目兜底普攻，100% 物理单体伤害 |
| 2504070123 | 坠羽星落 | Ultimate | damage | 敌方全体 138% 魔法伤害 + 20% 最大生命值附加伤害 + 清空能量 |
| 354070171 | 本源感知 | Mastery | heal | 战斗开始回满（极寒幽隐近似）+ 2 回合 30% 闪避 |
| 354070172 | 潜能蕴养 | Mastery | energy | 每回合首次终结技使随机敌方能量 -1（天极值近似）+ 50% 状态抗性 |
| 354070173 | 核心突破 | Mastery | stat-modifier | 终结技偷取 5% 攻击（最多 4 层）+ 开场敌方全体 -10% 速度（行动优先级近似） |
| 354070174 | 极意自现 | Mastery | energy | 普攻/绝招后各 +100 能量（天极值近似） |
| 354070175 | 真我超越 | Mastery | stat-modifier | 每回合首次终结技使目标 -10% 速度（优先级近似）+ 50% 生命以下一次性 50% 闪避 |
| 120001028 | 突破6 | Passive | energy | 友方普攻/绝招时自身 +50 能量 |
| 120000001 | 狂怒 | Passive | stat-modifier | 释放终结技时暴击率 +15% |
| 120000006 | 勃发 | Passive | stat-modifier | 生命高于 50% 时暴击伤害 +20% |
| 120000009 | 鼓舞 | Passive | energy | 友方普攻/绝招时自身 +25 能量 |
| 120000014 | 格挡 | Passive | stat-modifier | 第 2 次终结技前受终结技伤害 -20%（近似为整场一次 20% 减伤） |
| 120000015 | 标记 | Passive | stat-modifier | 攻击异常状态目标时暴击率 +25% |
| 120001004 | 爆裂一击 | Passive | stat-modifier | 首次终结技最终暴击率 +100% |

## 数据与写入方式

- 补丁文件：`agent/workflow/skill-system-validation/patches/group-c/5040701.json`
- 写入命令（在 `personal-server/` 下执行）：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/group-c/5040701.json`
- 原有 9 条的 `ability` / `abilityDes` 保持不变；共享被动与 5040601 同源模板按 ID 克隆。

## 近似项与 requiresInvestigation

1. **2504070123 坠羽星落**：`requiresInvestigation: true`。额外 20% 最大生命值伤害的【绮梦】减益条件与 100% 攻击上限未建模，按无条件附加伤害实现；“清空天极值”近似为清空能量；【绮梦·禁锢】行动失败叠加、免消耗天极技链未建模。
2. **354070171 本源感知**：`requiresInvestigation: true`。极寒幽隐状态无法建模，改为开场回满 + 2 回合 30% 闪避；超凡生命机制未实现。
3. **354070172 潜能蕴养**：`requiresInvestigation: true`。1 点天极值以 1 点敌方能量损失近似；“50% 概率免疫非强效控制”近似为 +50% 状态抗性。
4. **354070173 核心突破**：`requiresInvestigation: true`。偷取 5% 最终攻击力近似为自身 +5% 攻击（最多 4 层）；行动优先级 -1 近似为 -10% 速度；极寒幽隐限定与逐目标偷取账本未建模。
5. **354070174 极意自现**：`requiresInvestigation: true`。1 点天极值近似 +100 能量；首回合控制完全免疫无对应状态类型，未建模。
6. **354070175 真我超越**：`requiresInvestigation: true`。优先级 -1 近似为 -10% 速度；“首次退出极寒幽隐 50% 再次进入”近似为生命低于 50% 时一次性 50% 闪避 1 回合。
7. **120000014 格挡**：`requiresInvestigation: true`（同上，终结技限定无法表达）。

## 验证结果

- `node scripts/verify-hero-skills.mjs --hero=5040701`：通过（1/1 heroes clean）
- `node --test test/hero-5040701-skill-validation.test.mjs`：26/26 通过（含 14 条 ID 顺序、5 条新增 Mastery 行存在性、坠羽星落数值）
- 新增 5 条技能使用 `apply-hero-skill-patch.mjs` 的 `insertAfter` 能力插入，插入顺序为 2504070123 → 354070171 → 354070172 → 354070173 → 354070174 → 354070175。

## 遗留风险

- 5 条新增技能没有客户端元数据（tid/show_name/icon/text），UI 侧拿到这些技能时可能无法显示名称图标；后续若补齐 FightTable 导出，应回填 `ability`/`abilityDes`。
- 天极值、极寒幽隐、行动优先级、状态免疫均无原生效果类型，近似值不能视为机制还原。
- 战斗主循环尚未接入技能库，定义尚未在实战生效。

