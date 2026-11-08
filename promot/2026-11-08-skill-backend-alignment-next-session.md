# FateCovenantClone 原服战斗数值与技能对齐调查提示词（2026-11-08）

你在 `F:\projects\FateCovenantClone` 继续工作。目标不是再扫一遍现有目录，而是用本地 APK、LuaJIT/表数据、协议证据和现有战斗实现，恢复原服的数值选择与技能执行语义，并把 76 个英雄的技能描述、技能表、服务端 effect/trigger 和实际战报逐项对齐。先完整阅读根目录 `AGENTS.md`，再读取 `agent/workflow/battle-number-fix-20261108/implementation.md`。不要连接或攻击原游戏服务器，不使用来历不明的数值猜测。

## 当前基线

- 当前 main 起点：`dfb19c9`（运行态验证文档）；业务实现提交 `29139b8`，合并提交 `d9d6842`。开始前以实际 `git log -1` 为准。
- 根目录只有用户自己的未提交 `.gitignore`，不要覆盖、清理或提交它。若需改代码，优先新建 worktree，不要污染用户当前工作树。
- 上一轮已修复：薇尔品质/星级属性选行、`star=0` 技能等级、敌方四维均值兼容、比例减伤、薇尔真实终结技 `2403080113`（治疗最低生命友方）；4-3 `40203` 已用 `40202` 敌阵本地回退，避免 `201` 配置错误。
- 这些修复消除了当前最明显的数量级错误，但没有证明是原服精确公式。当前减伤仍是 `damage * attack / (attack + 0.45 * defense)`；敌人仍是全队逐属性均值乘 `0.88`、`NpcAttrRatio` 等兼容倍率；战力仍是 `POWER_WEIGHTS`；4-3 仍是无 `Fight403/NpcAttr` 映射时的本地回退。优先调查这些真实来源。
- 实时服务当前状态只以 `personal-server/runtime.local-only.data/server.local-only.json` 为准，写入时 PID `34140`、端口 18880/18881/18882/18883/19090，仅监听 loopback。不要信任旧 PID。
- 最近全量为 2,755 tests / 2,753 pass / 0 fail / 2 skipped；日志 `analysis/test-runs/battle-number-fix-20261108-full.log`。本轮 `40203 -> 201 -> 207`、薇尔终结技、低攻高防等专项 47/47 通过；`verify-hero-skills.mjs` 为 76/76 clean。

## 现有证据与代码入口

- 全技能审计：`tools/audit-skill-descriptions.mjs`。
- 最新审计结果：`analysis/reports/skill-description-audit.json`（被 Git ignore，必须保留在磁盘）。
- 语言文本证据：`.worktree/character-skills/.tmp-language-sub/candidate/decoded/language-core.bundle/textassets/2430823284743666700-text_zh_cn.bin`。
- 技能目录：`personal-server/config/skill-database.json`。
- 战斗实现：`personal-server/game/battle-engine.mjs`、`personal-server/game/effects/effect-executor.mjs`、`personal-server/game/effects/skill-integration.mjs`、`personal-server/game/hero-skill-loadout.mjs`。
- 属性和任务：`personal-server/game/attribute-service.mjs`、`personal-server/config/attribute-tables.mjs`、`personal-server/game/mission-fight-service.mjs`、`personal-server/config/mission-tables.mjs`。
- NpcAttr 资产：`personal-server/assets/tables/HeroTableNpcAttr.data.lua.json.gz`；提取器 `tools/extract-hero-npcattr.mjs`。
- 角色技能静态证据目录：`.worktree/character-skills/` 及其 `agent/workflow/character-skills/`。先使用已有解码结果，避免重复大体积解包。
- 运行库副本：`analysis/experiments/private-server-20261025/p3/battle-number-fix-sqlite-20261108-230212/game.local-only.sqlite`，SHA256 `074FE709066D695799049A4309498BA65B50880C11962912C09271775C3F1C6C`，integrity `ok`。

## 全技能审计现状

已扫描 76 英雄、1,076 技能引用、522 个唯一技能 ID；916 条本地化描述，描述源冲突 0。已修正 23 条明确元数据记录，跨 19 个英雄；其中 6 条同步修正 effect。

仍明确存在 23 条字段级冲突，涉及 17 个技能 ID、16 个英雄。不要把它们称为已修复：

| 英雄 | 技能 ID / 名称 | 现有冲突 |
|---|---|---|
| 爱蜜莉 | `2104020123 迷情掌控` | 描述回能，effect 无 gain |
| 伊丽丝 | `2104030123 魂归彼岸` | 描述回能，effect 无 gain |
| 赤霄 | `2204010123 罪业尽销` | 描述回能，effect 无 gain |
| 冰镰使徒 | `6303020105 伊丽莎白_稀有技能` | 描述治疗和回能，effect 均无 |
| 蜜雪儿 | `6401030108 蜜雪儿_稀有技能` | 描述回能，effect 无 gain |
| 莉莉丝 | `6303060111 莉莉丝_稀有技能` | 描述治疗，effect 无 heal |
| 圣棺裁决 | `6403040106 夏弥尔_稀有技能` | 描述治疗和回能，effect 均无 |
| 武神蕾娜 | `6403050105 蕾娜_稀有技能` | 描述回能与 16% 已损生命真伤；当前只有 1.6×攻击真伤近似 |
| 命运三姝 | `344020173 三人成虎` | 描述额外真伤，effect 无 damage |
| 命运三姝 | `344020175 一锤定音` | 描述复活后治疗和回能，effect 均无 |
| 汐夜 | `2404030123 溟渊重生` | 描述条件回能，effect 无 gain |
| 千千结 | `2404040123 绛丝乱舞` | 描述条件回能，effect 无 gain；且 AbilityDes 文本复用可疑 |
| 夜璃 | `2504010123 噬世之宴` | 描述闪避治疗和回能，effect 均无 |
| 苏苏 | `2504020123 曼舞鞭终` | 领域回能、扣能均未实现 |
| 零 | `2504040123 湮灭力场` | 描述为自己生命上限 20% 魔法伤害；当前为 1.3×攻击，机制不符 |
| 烬 | `2504050123 烬灭一击` | 描述伤害转护盾，effect 无 shield |
| 奈奈子 | `354060171 本源感知` | 描述召唤物与生命流失，effect 无 damage |

另有 7 条 AbilityDes 文本复用/缺失歧义：银爵艾伦 `313020174–313020175` 共用 `text_id=0`；阿涅斯 `334020171–334020175` 全部复用 `604400061`。另有 5 条 `show_name` 映射可疑：罪欲夜影 `313070171–313070175`。这些不能从名字或描述直接猜修复，必须找到原表或运行时证据。

审计还记录 277 个 `requiresInvestigation` 和较多近似实现。它们不等于已验证正确；至少包含天极值、状态层数、阵营/站位/生命阈值、下一次触发消费、护盾破坏、伤害转治疗、死亡/复活、召唤物、领域和反击等缺口。

## 调查目标

### 1. 原服数值机制

- 恢复 `FightTable`、`HeroTable.NpcAttr`、`NpcAttrRatio` 和任务/关卡之间的权威选择关系，重点补齐 4-3 `Fight403`。确认敌人等级、品质、星级、技能等级、阵容档位及最终四维的生成链。
- 复核角色属性的 `BaseAttrNew`、普通星级累计行、`HighStarAddAttr`、突破、装备/圣器/增益及战力公式。确认已修复的 `quality`、`star=0` 路径在升级、升星、突破和登录同步后仍一致。
- 从客户端可执行代码、战斗回放、定值输入输出和已存战报恢复伤害、治疗、护盾、暴击、命中/闪避、防御和增减伤公式。每条公式至少给出一个可复现输入/输出及来源，不以“看起来合理”为证据。

### 2. 技能描述与后端逻辑

- 建立 522 个唯一技能的逐 ID 对照：原服描述 -> Ability/AbilityDes 行 -> trigger/effect -> 当前服务端执行 -> 战报事件 -> 测试。
- 为技能引擎补通用原语，避免逐英雄写特例：目标选择、每回合首次/次数上限、状态/减益层数、阵营/站位/HP/护盾条件、天极值与能量、已损/最大生命比例伤害、伤害转治疗或护盾、护盾破坏、驱散/扣除、死亡/复活、召唤物、领域和下一击消费。
- 先修正会让描述方向错误的项目：友方/敌方目标、伤害类型/倍率、治疗 vs 伤害、回能 vs 扣能、护盾有无。复杂机制未取证时保留显式近似或 fail closed，并在目录中标记，不能把大致效果写成精确完成。
- 扩展 `audit-skill-descriptions.mjs` 的识别范围，同时增加“已验证”而非仅“无关键词错误”的状态。不要为了清空报告而放宽规则或删除 effect。

## 工作顺序

1. 先读 AGENTS、本文、`agent/workflow/battle-number-fix-20261108/implementation.md`，检查 Git 和服务状态；不要改用户 `.gitignore`。
2. 复核当前 23 条错误和 7/5 条描述映射缺口，生成证据矩阵。每条写明来源文件/偏移/表行、置信度、缺失原语和拟修范围。
3. 优先调查 4-3/NpcAttr、全局属性与伤害公式，因为它们会同时影响所有技能战报。能恢复精确关系就替换兼容回退；不能恢复则保留回退来源日志。
4. 处理 23 条技能冲突，先做通用引擎能力，再改技能目录。每个技能补专项断言，断言必须覆盖描述中的方向、目标、数值和次数限制。
5. 对 277 个调查项按同一原语聚类；修完一类后批量复核，避免只修一个英雄。
6. 最后重跑 `verify-hero-skills.mjs`、全技能审计、战斗专项和全量测试。

## 测试与验收命令

```powershell
Set-Location F:\projects\FateCovenantClone
node tools/audit-skill-descriptions.mjs --language ".worktree\character-skills\.tmp-language-sub\candidate\decoded\language-core.bundle\textassets\2430823284743666700-text_zh_cn.bin"
Set-Location personal-server
node scripts/verify-hero-skills.mjs
node --test --test-concurrency=1 test/mission-fight-service.test.mjs test/attribute-service.test.mjs test/hero-skill-loadout.test.mjs test/skill-battle-integration.test.mjs test/battle-engine.test.mjs
npm test
```

全量约需 7 分钟。测试日志和调查 JSON 放 `analysis/`；不要把动态数据库、密钥、APK 或敏感抓包提交 Git。

## 服务与设备边界

- 用户正在使用本机私服。不要无故停止服务，不操作模拟器/ADB/APK。需要重启时先重读 `server.local-only.json`，做 SQLite 一致备份和 integrity check，取得当前用户授权后只停对应 PID；启动后核对新状态文件、五个 loopback 端口和 stderr。
- 需要真实战斗验证时优先使用临时 SQLite 和临时 loopback TCP，避免改写用户进度、体力、奖励或任务状态。只有用户明确要求时才作真实 201/207 提交。
- 不连接原游戏服务器。可使用的证据是项目内 APK/Lua/本地抓包/现有运行库与用户明确提供的原始数据。

## 交付要求

- 新建工作树并提交分支；不要直接覆盖用户的未提交文件。用户此前已要求完成修复后提交并合入 main，因此只有测试通过、工作树干净且复核无回归后才合并。
- 写 `agent/workflow/battle-number-alignment-<date>/implementation.md`：逐项列出“已精确恢复 / 有证据的实现 / 显式近似 / 仍 fail closed”，附源证据、测试、日志和剩余数量。
- 最终报告给出 main/worktree HEAD、23 条冲突逐项状态、277 个调查项的剩余数、精确公式及仍为兼容规则的边界。不要用“全部技能已修复”概括仍有证据缺口的项目。
