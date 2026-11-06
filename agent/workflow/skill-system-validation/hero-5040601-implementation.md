# Hero 5040601 奈奈子 - 技能实现与验收

日期：2026-11-04 初版；2026-11-05 回归恢复

## 英雄信息

- ID：5040601
- 名称：奈奈子
- 职业：Warrior
- 基础数值：HP 8000 / ATK 1080 / DEF 360 / SPD 99

## 2026-11-05 回归说明

旧文档曾记录“13/13 已完成、21/21 测试通过”，但当前 `skill-database.json` 中该英雄 13 条技能全部退回只有 `ability`/`abilityDes` 元数据的状态，`verify-hero-skills.mjs` 报 27 个问题，既有测试全部失败，属于数据库侧回归。

本轮按既有测试断言 + description 重新写入实现：所有 `ability`/`abilityDes` 保留本英雄自身 tid，共享被动按技能 ID 克隆其它英雄的已实现版本。

## 技能清单（13 个，全部有 effects）

| 技能 ID | 名称 | 类型 | effectType | 实现方式 |
|---|---|---|---|---|
| normal-profession-1 | Warrior Basic Attack (攻击) | Normal | damage | 项目兜底普攻，100% 物理单体伤害 |
| 2504060123 | 元素倾泻 | Ultimate | damage | 敌方全体 138% 魔法伤害；50% 概率附加【僵直】（1 回合 stun）；战斗开始 2 回合内自身受伤 -70% |
| 354060171 | 本源感知 | Mastery | heal | 生命首次低于 30% 回满（迪迪承担致命伤近似）；战斗开始获得 100% 最大生命护盾 3 回合（迪迪在场近似） |
| 354060173 | 核心突破 | Mastery | heal | 生命首次低于 30% 回满（迪迪退场回满血近似）；每回合首次终结技 +10% 伤害 1 回合 |
| 354060174 | 极意自现 | Mastery | energy | 普攻/绝招后各 +100 能量（天极值近似）；受击时自身防御 -5%（每回合最多 6 次，反击降防近似） |
| 354060175 | 真我超越 | Mastery | stat-modifier | 迪迪退场后 +30% 攻击力（整场一次，on-death 近似） |
| 120001028 | 突破6 | Passive | energy | 友方普攻/绝招时自身 +50 能量（自身触发近似） |
| 120000001 | 狂怒 | Passive | stat-modifier | 释放终结技时暴击率 +15% |
| 120000006 | 勃发 | Passive | stat-modifier | 生命高于 50% 时暴击伤害 +20% |
| 120000009 | 鼓舞 | Passive | energy | 友方普攻/绝招时自身 +25 能量 |
| 120000014 | 格挡 | Passive | stat-modifier | 第 2 次终结技前受到终结技伤害 -20%（近似为整场一次的 20% 减伤） |
| 120000015 | 标记 | Passive | stat-modifier | 攻击异常状态目标时暴击率 +25%（1 回合） |
| 120001004 | 爆裂一击 | Passive | stat-modifier | 首次终结技最终暴击率 +100%（整场一次） |

## 数据与写入方式

- 补丁文件：`agent/workflow/skill-system-validation/patches/group-c/5040601.json`
- 写入命令（在 `personal-server/` 下执行）：`node scripts/apply-hero-skill-patch.mjs ../agent/workflow/skill-system-validation/patches/group-c/5040601.json`
- 共享被动模板来源：120001028 / 120000009 / 120000014 / 120000015 / 120000001 / 120000006 / 120001004 按技能 ID 从其它英雄（如 1020201、3030601）的已实现版本克隆，元数据替换为本英雄自身 tid。

## 近似项与 requiresInvestigation

1. **2504060123 元素倾泻**：`requiresInvestigation: true`。【僵直】以 1 回合 `stun`（50% 概率）近似；消耗 3 天极值、【倾泻】生命流失、【绯梦惊雷】免消耗循环、血量低于 50% 的反击伤害提升均未建模。
2. **354060171 本源感知**：`requiresInvestigation: true`。召唤物迪迪、流星火雨、每次终结技降低敌方天极值均未建模；以战斗开始 100% 最大生命护盾 3 回合 + 30% 生命以下回满近似“承担致命伤害”。
3. **354060173 核心突破**：`requiresInvestigation: true`。僵直→倾泻转换未建模；退场回满血近似为 30% 生命以下回满；附加的首个终结技 +10% 伤害为保守近似。
4. **354060174 极意自现**：`requiresInvestigation: true`。1 点天极值近似为 +100 能量；“反击时降低敌方 5% 防御、最高 30%、每回合重置”以受击时自身防御 -5%、最多 6 次近似。
5. **354060175 真我超越**：`requiresInvestigation: true`。迪迪重新召唤未建模，+30% 攻击力以整场一次 `on-death` 触发近似。
6. **120000014 格挡**：`requiresInvestigation: true`。“受终结技伤害”（仅终结技、仅第 2 次终结技前）无法限定，近似为整场一次 20% 减伤。

## 验证结果

- `node scripts/verify-hero-skills.mjs --hero=5040601`：通过（1/1 heroes clean，修复前 27 个问题）
- `node --test test/hero-5040601-skill-validation.test.mjs`：25/25 通过（原 21 条断言全部恢复，另加 4 条完整性断言）

## 遗留风险

- 本轮是“按测试与 description 恢复”，并非从 FightTable/Effect 原始表重新导出；若后续拿到原始效果表，应逐条比对数值。
- 迪迪召唤体系（继承属性、承伤、退场、重召）与天极值系统没有效果类型支撑，只能近似，测试通过不代表机制等价。
- 战斗主循环尚未接入技能库，定义尚未在实战生效。

