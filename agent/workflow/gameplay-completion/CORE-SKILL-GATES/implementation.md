# CORE-SKILL-GATES：英雄养成状态到战斗技能筛选

- 分支：`task/CORE-SKILL-GATES-20261106`
- worktree：`.worktree/gameplay-20261106/core-skill-gates`
- 基线：main `1a15105`
- 日期：2026-11-07
- 状态：服务端完成（通用被动槽位联动仍有证据缺口）；APK 验收未安排

## 1. 已证事实与实现口径

| 输入 | 证据 | 本次用途 |
| --- | --- | --- |
| `HeroTable.Ability.ability` | 英雄原始技能槽列表；`mission-fight-service` 和 1316 属性查询原本直接截取 8 项 | 保留为客户端回放使用的原始 ability id |
| `HeroTable.AbilityLevel` | 键为 `quality*100 + star`，`level` 为九个槽位等级；客户端 `HeroDevelopMgr` 字符串含 `CalAbilityLvCfgTid`、`HeroAbilityLogic`、`GetRaiseStarUnlockSkill`，并同时读取 `Ability.ability`、`AbilityLevel`、`HeroTable.quality` | 按持久化品质/星级取行，`level>0` 的槽位进入 `abilityIds` |
| `Ability.mastery_ability` | 与技能库中的数字 mastery id 精确一致，如 2010101 → 321010171 | 只启用这一条 mastery，不再把五个候选同时注册 |
| `hero.star/mastery_level/mastery_break` | HERO-MASTERY 已实现并持久化；`MasteryConst[1].unlock_star=10` | `star>=10` 且 `mastery_level>0` 才启用；等级写入战斗技能元数据 |
| `Ability.soul_ability` + `hero.rare` | `pb hero.rare` 明示“是否稀有”；soul id 与技能库 Ultimate 精确一致 | 稀有英雄用 soul ability 替换第 2 个原始 active 槽，并只保留一条 Ultimate 定义 |
| `UpStageTalent` | 键为 `heroTid*100+breakthrough stage`，行中含 `potential_skill` | 已读取并暴露达到突破阶段的候选 id；未用于硬筛选，见剩余项 |

缺失权威配置时返回业务错误 `GameError(5)`：英雄或 Ability 行缺失、`AbilityLevel` 行缺失均不会静默放行全部技能。

## 2. 代码改动

- 新增 `personal-server/game/hero-skill-loadout.mjs`：
  - `abilityLevelRow()`：从持久化 quality/star 解析技能等级行；
  - `breakthroughPassiveIds()`：读取 UpStageTalent 的可证里程碑候选；
  - `buildHeroSkillLoadout()`：生成 `abilityIds`、筛选后的 catalog skills、mastery 状态、soul replacement 和 warnings。
- `config/hero-tables.mjs`：正式读取 `AbilityLevel` 与 `UpStageTalent`。
- `battle-engine.mjs`：只增加“调用方提供 skills 时优先使用”的分支；无养成状态的既有 role-only 测试仍走原名接口，改动保持最小。
- `mission-fight-service.mjs`：攻击方按真实英雄行构造 loadout，原始 `ability_list`、active id 和模拟 catalog 使用同一筛选结果。
- `attribute-service.mjs`：1316 编队属性的 skill id 改为同一 loadout，不再固定 `slice(0,8)`。

未改动 `gateway.mjs`、`game-store.mjs`、`game/effects/*` 和 `skill-database.json`；207 体力、邮件、活动期限、module 8/90 与既有路由保持原样。

## 3. 行为边界

- 同一英雄不同品质/星级会得到不同的原始 `abilityIds`；测试覆盖 2010101 从 `3001` 到 `3006`、2020601 品质 40 的 active level=2。
- mastery 在星 9 或等级 0 时不进入 catalog skills，也不进入 raw ids；星 10 且等级 7 时只加入 `Ability.mastery_ability` 一条。
- rare + soul 时 active raw slot 改为 soul id，catalog 只有一条 Ultimate，普通 active 不会重复执行。
- battle-engine 对调用方传入的技能列表原样使用；测试通过移除“双重攻击”验证未提供技能不会注册对应 on-attack 触发器。

## 4. 验证

在 `personal-server/` 执行：

```powershell
node --test --test-concurrency=1 test/hero-skill-gates.test.mjs
node --test --test-concurrency=1 test/battle-engine.test.mjs test/skill-battle-integration.test.mjs test/skill-trigger-regression.test.mjs test/mission-fight-service.test.mjs test/attribute-service.test.mjs test/hero-mastery-service.test.mjs test/gameplay-gateway.test.mjs
npm test
```

结果：

- 新增专项 7/7；
- 战斗/skill/mission/attribute/mastery/gateway 聚焦回归 57/57；
- 全量 `npm test`：2226/2226 通过。

真实 TCP 覆盖来自既有 `gameplay-gateway` 和 `attribute-service` 用例，均使用临时端口和临时 SQLite；本任务没有启停实时服务、操作 ADB/模拟器或运行库，也没有生成 APK。

## 5. 剩余项

1. `AbilityLevel.level` 与 `Ability.ability` 按数组索引对应、`level>0` 表示槽位可用，来自表结构吻合和客户端符号组合，尚未取得可读反编译逐分支确认。
2. UpStageTalent 的突破里程碑 id 已可读取，但缺少“原始 Ability 槽 → 技能目录 Passive id”的完整运行时映射。当前保留 catalog Passive，避免把尚未证明的映射当作精确规则；因此通用 Passive 的突破筛选仍待补证。
3. `AbilityLevel` 只提供技能等级整数，未随包提供“每级倍率/成长值”行。战斗技能已携带 level 元数据，但倍率随等级变化仍需 FightTable 或 AbilityLevel 对应数值证据，不能人为线性放大。
4. 五个 mastery 候选的选择命令/存储尚未恢复；当前按 `Ability.mastery_ability` 作为唯一选中项，掌握突破是否切换技能 id 仍待证据。
5. 1316 `play_type` 分层、APK 中实际技能升级/替换表现与战斗回放仍未做客户端验收。
