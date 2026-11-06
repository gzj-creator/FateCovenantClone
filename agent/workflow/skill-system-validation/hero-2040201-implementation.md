# Hero 2040201 幽艳瑞贝卡 技能补全（技能组 B）

日期：2026-11-05（覆盖此前 2026-11-03 版本）
技能数：15

## 校验结论

- `node scripts/verify-hero-skills.mjs --hero=2040201`：通过（1/1 heroes clean, 0 failing）
- `node --test test/hero-2040201-skill-validation.test.mjs`：22/22 通过
- 写入方式：补丁 `agent/workflow/skill-system-validation/patch-b-20261105/hero-2040201.json` 经 `apply-hero-skill-patch.mjs` 应用。

修复前仅 324020173 送别礼物 1/15 技能缺 effects；其余技能此前已实现且 statType 合法，本轮未改动其效果定义。

## 技能清单

| 技能 | 名称 | 类型 | effectType / targetType | 状态 |
|---|---|---|---|---|
| normal-profession-2 | Assassin Basic Attack | Normal | damage / single | 1.0x 物理 |
| 2204020123 | 捣蛋到底 | Ultimate | damage / all-enemies | 130% 全体法术 + 随机单体 60% 法术（糖果机制未接入，RI） |
| 324020171 | 糖果礼花 | Mastery | damage / all-enemies | 终结技按糖果造成 4% 最大生命法术 + 普攻回 400 能量（RI） |
| 324020172 | 活力全开 | Mastery | stat-modifier / self | 每回合首次终结技降敌 100 能量（天极近似）+ 10% 伤害加成（RI） |
| 324020173 | 送别礼物 | Mastery | damage / all-enemies | **本轮补全**：回合结束额外终结技（130% 全体法术近似）+ 先驱散敌方全体 1 个增益（护盾摧毁近似） |
| 324020174 | 闪亮登场 | Mastery | energy / self | 普攻/绝招 +100 能量（天极近似）+ 终结技后目标 -15% 减免 2 回合（RI） |
| 324020175 | 完美恶作剧 | Mastery | stat-modifier / self | 每回合首次终结技 +60% 暴击、+60% 无视防御（RI） |
| 120001026 | 突破4 | Passive | energy / self | 初始能量 +600 |
| 120000001 | 狂怒 | Passive | stat-modifier / self | 终结技时暴击 +15% |
| 120000006 | 勃发 | Passive | stat-modifier / self | 生命 >50% 暴伤 +20% |
| 120000009 | 鼓舞 | Passive | energy / self | 普攻/技能 +25 能量（友方触发近似，RI） |
| 120000014 | 格挡 | Passive | stat-modifier / self | 终结技受伤减免 20%（战前永久近似，RI） |
| 120000015 | 标记 | Passive | stat-modifier / self | 攻击减益目标暴击 +25% |
| 120001004 | 爆裂一击 | Passive | stat-modifier / self | 首次终结技暴击 +100% |
| 6910001100 | Skill 6910001100 | Ultimate | damage / single | 缺描述，2.0x 物理兜底（RI） |

## 送别礼物（324020173）实现细节

描述：“自身行动回合结束后额外释放1次终结技，且本次终结技释放前额外摧毁敌方全体20%护盾”。

- `effects`：主效果 `damage/magical/1.3x/all-enemies`（复用 2204020123 的 130% 全体法术作为“再次释放终结技”的近似），次效果 `dispel/removeType=buff/count=1/all-enemies`（销毁护盾的近似）。
- `triggers`：两条 `on-turn-end`；驱散 priority -1 先于伤害 priority 0。
- 引擎没有“摧毁 X% 护盾”效果，也没有“额外行动”调度，故 requiresInvestigation = true，notes 已写明近似。

## 遗留风险

- 糖果层数（给了糖也捣蛋）、天极值、额外行动、护盾百分比摧毁均未进入引擎；本英雄其余技能沿用此前近似，本轮未扩大范围。
- 战斗引擎未调用技能库效果（既有缺口）。

