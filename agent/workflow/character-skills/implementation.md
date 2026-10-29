# 图鉴角色全技能战斗逻辑实现

日期：2026-10-29

工作区：`F:\projects\FateCovenantClone\.worktree\character-skills`

分支：`feature/character-skills`

基线：`6713e6d test(personal-server): cover recommend gift purchase counts`

状态：实现与本地验证完成，已合并到 `main`；部署仍等待用户批准。

## 目标和边界

本轮把图鉴可见角色的全部技能引用整理成数据，并让能够可靠映射的技能进入确定性战斗。原游戏没有恢复出完整的公式、Buff/Effect 参数展开和全部专有状态语义，因此实现明确区分“可执行”与“仅保留描述”，不把启发式近似写成原游戏事实。

图鉴角色仍未获得正式养成和上阵权限；本轮只开放查看和模拟，不扩写账号存档或招募。

## 数据产物

- 运行时数据：`unity/FateCovenantClone/Assets/Resources/CharacterSkillCatalog.json`
- 人工可读全表：`docs/character-skill-catalog.md`
- 数据生成器：`tools/build-character-skill-catalog.mjs`
- Markdown 导出器：`tools/export-character-skill-catalog.mjs`
- 无 UnityEngine 依赖的解析器：`unity/FateCovenantClone/Assets/Scripts/Battle/Domain/CharacterSkillCatalog.cs`

当前目录 SHA256：`3baaa6b869c62426402a48f9c9bddbd8ffc6a718162a61d16ba71e22d7b574e3`。

## 覆盖统计

- `HeroTable.Hero`：337 条原始角色；其中 `not_in_guide=false` 为 76 个图鉴角色。
- 图鉴技能引用：1,084 条。
- 图鉴唯一技能 ID：530 个。
- 有本地化描述的技能引用：1,016 条。
- 主动技能引用：170 条。
- 带触发器的技能引用：914 条。
- 缺少终结技的图鉴角色：`1020601`、`2020601`。
- 实现状态计数：
  - `DescriptionHeuristic`：918
  - `ProjectFallback`：76
  - `MetadataFallback`：68
  - `MetadataOnly`：22
- `Unresolved`：0。

人类可读全表包含全部 76 个角色、1,084 条技能引用、技能 ID、分类、实现状态和原始描述。

## 数据来源

生成器读取本地解码目录 `analysis/reports/private-client-16448/lua-bundles/candidate/decoded` 中的：

- `HeroTable.Hero`
- `HeroTable.Npc`
- `HeroTable.Npc_Ability`
- `HeroTable.Ability`
- `HeroTable.Profession`
- `HeroTable.BaseAttrNew`
- `HeroTable.Diff`
- `HeroTable.Rare`
- `HeroTable.UpStageTalent`
- `HeroMutantTable.HeroMutant`
- `FightTable.Ability`
- `FightTable.AbilityDes`
- `FightTable.Buff`
- `FightTable.Effect`
- `FightTable.TargetRule`
- `FightTable.StatusEffect`

角色技能引用来自普通技、职业被动、魂技、突破精通、异变额外技能、升阶技能/潜能、Diff 和 Rare。`FightTable.Buff`、`Effect`、`TargetRule` 和 `StatusEffect` 已纳入数据盘点，但当前执行 DSL 主要从 `Ability` 与本地化 `AbilityDes` 推导，尚未逐行展开这些表中的完整参数链。

## 战斗逻辑

`BattleSimulator` 已支持以下执行模型：

- 普攻、终结技、被动和多动作技能。
- 单体、全体、前排、后排、随机敌人、最高攻击敌人、最低生命队友和自身目标。
- 伤害、真实伤害、治疗、护盾、净化、驱散、回怒和减怒。
- 眩晕、沉默、攻防增减、增伤/减伤、受伤增加、暴击/暴伤/抗暴、命中/闪避、控制命中/抗性、反弹、最大生命提升、持续伤害和持续治疗。
- 战斗开始、回合开始、行动开始、行动结束、受伤、死亡、普攻后和终结技后触发器。
- 描述中的概率效果；失败会生成 `ChanceFailed` 事件。
- 控制命中/抗性和控制抗性的确定性随机结算。
- 战斗全程状态，以及带回合数状态的施加、刷新和过期。
- 反射伤害击倒行动者后停止该行动者剩余动作。

现有原型伤害公式保持为：

```text
max(1, round(ATK * 2.6) - floor(DEF * 0.5))
```

该公式是项目原型规则，不是原游戏已恢复公式。

## 图鉴界面

- `GameBootstrap` 从 `Resources/CharacterSkillCatalog` 加载运行时 JSON。
- `GameSession.Archive` 暴露 76 个图鉴角色，同时保留原 6 个战斗角色和存档兼容。
- 图鉴支持 6 人一页、All/Owned 筛选和技能 3 条一页。
- 每条技能显示名称、完整描述和实现状态；角色页显示 HP/ATK/DEF/SPD 和技能计数。
- 图鉴角色不会因数据存在而自动变成已拥有或可部署角色。

## 验证

已执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-battle-core-tests.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-game-core-tests.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-unity-runtime-compile.ps1 -ManagedPath 'F:\projects\Unity-Project\StarfallChronicle\Builds\StarfallChronicle_Data\Managed'
```

结果：

- 战斗核心：663 项断言通过；76 个图鉴角色逐一完成独立模拟。
- 默认战斗：6 回合，我方 2 人存活，总伤害 3,979；20 个种子全胜。
- 游戏层：9 个场景通过。
- Unity API 兼容编译：Battle、Game、Presentation 三程序集通过。
- 该编译只验证 Player API 兼容，不代表 Unity 6 Editor、场景、渲染、IL2CPP 或 Android 已验收。

## 剩余精度限制

- 原游戏精确伤害、速度、怒气、目标优先级和技能倍率尚未恢复。
- 全部普通攻击是项目兜底，因为现有 `HeroTable.Ability.ability` 没有绑定图鉴普通攻击。
- 68 个缺少本地化描述的终结技可执行通用伤害兜底，但不能称为原规则已还原。
- 22 条专有机制保留为 `MetadataOnly`，包括天极值、专有层数、追击复制、特殊生命/状态和部分 `{0}` 占位描述。
- 918 条描述启发式技能仍需成品角色或更多协议样本逐项校正。
- 本轮没有运行 Unity 6 Editor、Smoke 截图、IL2CPP 或 Android 构建。
- 本轮未启动服务、未操作游戏、未部署、未合并。

## 复现

解码表和中文语言文本不提交到源码。生成时显式传入语言文件：

```powershell
node .\tools\build-character-skill-catalog.mjs --language <text_zh_cn.bin>
node .\tools\export-character-skill-catalog.mjs
```

生成器也支持环境变量 `FATE_COVENANT_LANGUAGE_TEXT` 指向语言文本。若输入不存在，生成器会直接报错，不读取或覆盖主工作区数据。
