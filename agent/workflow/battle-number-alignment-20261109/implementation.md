# 原服战斗数值与技能后端对齐（2026-11-09）

## 范围与约束

- 分支：`fix/battle-number-alignment-20261109`
- worktree：`.worktree/battle-alignment-20261109`
- 基线：`6995743 docs: add skill backend alignment handoff`
- 证据只取项目内 APK/LuaJIT、表数据、协议定义、既有战报和本地测试。
- 本轮未操作 ADB、模拟器、APK、实时服务或实时数据库；未触碰根工作树中用户未提交的 `.gitignore`。

## 提交与复核

- 实现提交：`1a4049aebda5e81ad1ca48b0a2722fa4e4054b62`（`fix: align battle numbers and skill backend rules`）。
- `main` 合并提交：`b32d2d37057c77f8e2f288877d5d17599f67b9ef`，使用 `--no-ff` 合入。
- 实现分支全量测试 2,780 项通过；合并后的 `main` 再次运行 9 个受影响核心测试文件，89/89 通过；`verify-hero-skills.mjs` 为 76/76 clean，运行态审计计数不变。

## 审计结果

审计命令：

```powershell
node ..\tools\audit-skill-descriptions.mjs `
  --language "F:\projects\FateCovenantClone\.worktree\character-skills\.tmp-language-sub\candidate\decoded\language-core.bundle\textassets\2430823284743666700-text_zh_cn.bin" `
  --output "analysis\reports\skill-description-audit-20261109-runtime-aware.json"
```

当前结果：

```text
heroes=76
skillReferences=1076
uniqueSkillIds=522
localizedDescriptions=916
storedDescriptions=93
descriptionSourceMismatches=0
ambiguousAbilityDescriptions=7
nameSourceMismatches=5
crossHeroUltimateDescriptionReuses=1
errors=11
evidenceGaps=289
alignment: evidence-backed=278, explicit-approximation=224, fail-closed=20, exact=0
skill rows with tests=522/522
skill rows with battle-report schemas=522/522
unprojected effect types=0
```

报告新增完整结构化数组 `ambiguousAbilityDescriptions`、`nameSourceMismatches`、
`crossHeroUltimateDescriptionReuses`。每个技能矩阵行同时记录 Ability/AbilityDes、
本地化描述、catalog/runtime effect、trigger、proprietary rule、战报 schema、匹配测试、
证据缺口和 alignment 状态。`clear-resource` 已映射到实际由 action-end anger sync 产生的
`pb_fat_attr_sync`；状态报告也分别列出内部生效状态与该状态是否存在已证明的
FightTable.Buff TID。

这里不能把 `evidence-backed` 写成“精确还原”。全局减伤公式和 4-3 敌阵仍是显式兼容；
技能矩阵也没有任何一行满足“描述、AbilityExtra/Buff 绑定、公式、战报和全路径测试全部精确闭合”
的标准，所以 `exact` 保持 0。

## 证据矩阵

| 机制 | 原服/项目内证据 | 当前实现 | 战报 | 测试 | 分类 |
|---|---|---|---|---|---|
| 角色品质、0 星持久化、普通星与 6–10 星累计属性 | APK LuaJIT `HeroAttrCollect`；HeroTable `BaseAttrNew`、`StarAddAttr`、`HighStarAddAttr`、`AbilityLevel` | 持久化 `star=0` 保持索引 0；5 星以下读当前累计行，6–10 星另读当前 HighStar 行；品质从持久化值进入行选择 | 不单独下发 | `attribute-service.test.mjs` | 精确恢复 |
| AttrCalculator.CalcValues | APK LuaJIT `AttrCalculator.CalcValues` 与 AttrType 固定点定义 | HP/攻击/双防分别折叠对应百分比并删除百分号中间值，使用 10000 固定点 | 战斗初始化消费结果 | 属性专项 | 精确恢复 |
| PowerCalculator.CalcAttrPower | APK LuaJIT `PowerCalculator.CalcAttrPower`，AttrType 1–100 | 按原权重、全部 bonus 项、最终 `ceil` 计算 | 1316/战斗使用同一战力 | 属性查询与真实 gateway framing | 精确恢复 |
| `Fight.def_team -> Team.team_lv -> HeroTable.NpcAttr` | FightTable `Fight`/`Team` 行结构；NpcAttr 独立 LuaJIT 分片 | `resolveFightTeam` 只接受 def_team、Team、team_lv 和 NpcAttr 的精确链；任一缺行 fail closed；按 `NpcAttrRatio`、上下文比例和 Ability 附加值生成四维 | 战斗属性入口 | `fight-team-resolver.test.mjs` | 有证据实现；缺链路时 fail closed |
| 4-3 `Fight 403` | `Fight.403.def_team` 为空，引用 Team 行也不存在；`MissionSection 40203` 敌阵为空 | 保留明确的 `40203 -> 40202` 本地方案作为关卡可玩回退，并在 fight start metadata 记录 `enemyFallback` | 敌阵仍来自 `9003300 x2` 回退 | mission 40203/201/207 | 显式近似 |
| 普通关卡敌人四维 | `NpcAttr` 已恢复，但 Mission 行没有敌人到 NpcAttr 档位的选择字段 | 保留全队分通道均值乘 `0.88`，再叠加 NpcAttrRatio/精英倍率；不复制单个高 HP 坦克 | 伤害/治疗/护盾均消费 | `NPC compatibility reference` | 显式近似 |
| 防御减伤 | 尚未从 LuaJIT 得到唯一原服公式 | `damage * attack / (attack + 0.45 * defense)`；真伤和按生命比例伤害绕过防御 | `pb_fat_harm` | 低攻高防专项 | 显式近似 |
| `2504040123` 零：施法者最大生命 20% 魔法伤害 | AbilityDes：零生命上限 20%，无护盾时 +40% | 改写对应 damage effect 为 `actor-max-hp`，使用 target-no-shield 条件 | `pb_fat_harm`、破盾 `pb_fat_shield` | backend alignment | 有证据实现 |
| 220401 赤霄：无击杀回能 | AbilityDes：若没有造成击杀，我方全体恢复 150 能量 | 以完整 action 的 kill set 判定，非击杀才给全员 150 | action-end `pb_fat_attr_sync` | backend alignment | 有证据实现 |
| 630302 冰镰使徒：减益层数奖励 | AbilityDes：目标至少 3 层治疗 15% 最大生命，至少 9 层回 200 能量，每回合 5 次 | DAMAGE_DEALT hook 读取目标真实 debuff layer 总数，共享每回合 5 次上限 | heal `pb_fat_harm` + energy `pb_fat_attr_sync` | backend alignment | 有证据实现 |
| 344020175 命运三姝：死亡复活 | AbilityDes：死亡立刻满生命、1000 能量，复活后伤害加成/减免 +20% | UNIT_DEATH 在 round-end 前复活并应用永久 stat | `pb_fat_fighter_relive`、heal、energy | backend alignment | 有证据实现 |
| 250402 狐魅领域 | AbilityDes：双方行动后 ±100 能量；【狐佑】仅实际行动者获得 15% 最大生命治疗 | 以 ACTION_END 领域状态处理；狐佑先清理所有过期项，只治疗 payload.actor | heal + anger sync | domain/狐佑专项 | 有证据实现；领域持续 2 回合是兼容近似 |
| 240403 汐夜：80 月光 | AbilityDes：80 层时天极技结束回 240 能量，同时移除全部月光 | ACTION_END 读取实时层数，达阈值回能后清空整层资源 | anger sync、layer event | 79/80 层边界专项 | 有证据实现 |
| FightTable.Buff 控制 TID | APK `FightTable.Buff`：stun=10001、ice=10002、silence=10003、poison=11003、burning_hot=11004；均 type=3/2、dispel=true、dead_rm=true | 仅把已证明状态投影到 `pb_fat_buff_change`；未知状态只保留内部状态，不伪造 tid | `pb_fat_buff_change` | buff-change 专项 | 精确映射 |
| 640103 蜜雪儿：冰冻/沉默 | AbilityDes：30% 冰冻；成功回 200 能量；失败施加 1 回合沉默 | BEFORE_ACTION 保存本次目标；ACTION_END 用战斗 seed 判定，EffectExecutor 创建状态，成功/失败互斥 | freeze=10002、silence=10003；能量 sync | success/failure、跳过行动专项 | 有证据实现 |
| 640305 武神蕾娜：控制反馈与已损生命真伤 | AbilityDes：队友造成控制时回 150，每回合 3 次；终结技额外造成 16% 已损生命真伤，攻击 240% 封顶 | 新 `STATUS_APPLIED` 通用 hook；条件真伤改用 `target-lost-hp`，不吃暴击，应用 attack cap | buff change、anger sync、`pb_fat_harm` | 三次上限、16%/240% 封顶专项 | 有证据实现；`{0}` 层数和每层 +4% 仍 fail closed |

## 通用引擎改动

- `PROPRIETARY_HOOKS.STATUS_APPLIED` 连接所有经 EffectExecutor 成功创建的状态，payload 包含 actor、target、statusType、actionId、sourceSkill 和原始执行结果。
- 控制集合至少覆盖 `freeze/stun/silence/frightened`，供跨单位反应规则复用。
- `damageBasis=target-lost-hp` 使用 `max(0, effectiveMaxHp(target) - target.hp) * magnitude`；真伤仍绕过防御，cap 在最终单次伤害上执行。
- proprietary 状态执行复用 EffectExecutor，并主动投影 `pb_fat_buff_change`，避免内部 buff 与战报分叉。
- 狐佑修正了旧的领域范围的错误：任何友方行动都会治疗全体狐佑持有者；现在只治疗本次实际行动者。
- 审计器把规则声明中的 `successEnergy` 纳入真实能量能力，并新增跨英雄 Ultimate 描述复用识别。

## 23 条冲突的收敛

原审计的 23 条字段级错误已收敛为 11 条，涉及 9 个 skill ID、8 个英雄。已实现并被审计识别的主要项包括：

- `2204010123` 无击杀回能；
- `6303020105` 3/9 层治疗和回能；
- `6401030108` 冰冻成功/沉默失败；
- `6403050105` 控制回能与 16% 已损生命真伤；
- `344020175` 死亡复活、满血和 1000 能量；
- `2404030123` 80 月光回 240 并清空；
- `2504020123` 领域双方能量变化；
- `2504040123` 施法者最大生命 20% 伤害；
- `2504050123` 护盾相关机制。

剩余 11 条全部 fail closed，没有为了清空报告追加 effect：

| 英雄 | Skill | 剩余冲突 | 缺少的证据 |
|---|---|---|---|
| 爱蜜莉 | `2104020123` | 玫瑰层数回能 | 【玫瑰】层数的 AbilityBuffDes/effect 绑定 |
| 爱蜜莉 | `314020175` | 80% 防御 × 玫瑰种类数真伤 | 玫瑰种类状态与计数来源 |
| 伊丽丝 | `2104030123` | 彼岸花复制能量/治疗 | 【彼岸花】绑定及复制抑制字段 |
| 莉莉丝 | `6303060111` | 攻击 `{0}` 目标回血 | `{0}` 的 AbilityBuffDes 名称与目标绑定 |
| 圣棺裁决 | `6403040106` | 赎罪之棺目标受伤时队友与自身回血/回能 | 【赎罪之棺】状态来源、目标选择和叠加规则 |
| 命运三姝 | `344020173` | 终结技额外 `{0}` 层数真伤 | `{0}` 状态及每层 2%/20% 封顶绑定 |
| 千千结 | `2404040123` | 描述中的 80 月光回能 | 跨英雄 Ultimate 描述所有权；不能把汐夜绑定复制给千千结 |
| 夜璃 | `2504010123` | 闪避后治疗和回能 | 命中/闪避执行链、连续未闪避计数和光环移除 |
| 奈奈子 | `354060171` | 每 5 次绯梦惊雷触发流星火雨 | 绯梦惊雷动作身份、共享伤害分摊与每回合限制绑定 |

## 描述映射缺口

- AbilityDes 复用/缺失 7 条：`313020174–313020175` 共用 text_id 0；`334020171–334020175` 共用 `604400061`。保留 catalog 描述，等待原表修复。
- `show_name` 不匹配 5 条：罪欲夜影 `313070171–313070175` 分别解析为 不屈、健壮、泰然自若、影佑誓言、重重诡影；描述与 catalog 一致，名称映射仍未证明。
- 跨英雄 Ultimate 描述复用 1 组：汐夜 `2404030123` 与千千结 `2404040123` 共用完全相同的描述，图标也指向 `Icon_Skill_xiye_l1.png`；只记录 `CROSS_HERO_DESCRIPTION_REUSE`，没有把汐夜机制写入千千结后端。
- AbilityExtraDes/AbilityBuffDes 表结构已定位，但当前冲突 ID 没有直接行，因此上述 `{0}` 状态、玫瑰种类、彼岸花和赎罪之棺绑定都不得猜测。

## 验证

- `battle-skill-backend-alignment + attribute-service + fight-team-resolver`：21/21。
- `mission-fight-service + attribute-service + hero-skill-loadout + skill-battle-integration + battle-engine`：49/49。
- `verify-hero-skills.mjs`：76/76 clean。
- 原无测试引用的 3 个技能已增加明确断言，审计现为 522/522 skill rows 有测试引用。
- 全量 `npm test`：2,780 项，pass 2,778 / fail 0 / skipped 2，duration 435,492.1503 ms。两个跳过项仍是依赖 v9 客户端资源条件的仓库既存测试；日志 `analysis/test-runs/battle-number-alignment-20261109/full.log`，422,572 字节，SHA256 `FA5211C9E5C2E3226D30D007CFF083F1162483B795B25366406AB639E65BCE99`。
- 最终运行态审计报告 `analysis/reports/skill-description-audit-20261109-runtime-aware.json` 为 1,436,746 字节，SHA256 `B0C4A4BC625E68E621D5CCE5B86F47A520DA45478D806D2372276C9C00B6FE40`；522 个唯一技能均有测试引用和战报 schema，明确保留 11 条错误、289 条证据缺口及 0 条 `exact`。报告包含 `generatedAt`，每轮重新生成时该哈希会变化。

## 分级结论

### 精确恢复

- AttrCalculator.CalcValues、PowerCalculator.CalcAttrPower、星/品质行选择，以及五个 FightTable.Buff 状态 TID。

### 有证据实现

- Fight/Team/NpcAttr 精确链解析器、通用状态施加 hook、640103、640305 已明确部分、已损生命伤害原语、以及表中列出的既有机制。

### 显式近似

- 防御减伤公式、4-3 敌阵 `40203 -> 40202`、普通关卡敌人全队均值乘 `0.88`、职业速度兼容值、狐魅领域缺失的持续时间补齐为 2 回合，以及审计中的 224 个技能行。

### 仍缺证据 / fail closed

- 剩余 11 条字段冲突、20 个 fail-closed 技能行、7 条 AbilityDes 复用、5 条 show_name 映射和 1 组跨英雄 Ultimate 描述复用。
- 这些项目保留在审计矩阵和上面的表内，不能标成已还原。
