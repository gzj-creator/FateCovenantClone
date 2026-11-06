# Hero 技能补全任务说明（2026-11-05）

本文件是给本轮子 agent 的共享约定，不代替各英雄的实现文档。

## 目标

把 `personal-server/config/skill-database.json` 中 `implementation.effects` 为空的英雄技能补齐为可执行定义，并为每个英雄补验证测试与实现文档。

“可执行定义”指沿用现有效果框架：`damage` / `heal` / `shield` / `stat-modifier` / `energy` / `status` / `dispel`，不改战斗引擎，不新增效果类型。

## 数据位置与写入方式

- 技能库：`personal-server/config/skill-database.json`（约 2.8 MB，禁止手工整文件编辑）。
- 写入必须走带锁补丁工具：
  `node scripts/apply-hero-skill-patch.mjs <patch.json>`（在 `personal-server/` 下执行）
- 补丁格式：
  ```json
  {
    "heroId": 1020101,
    "skills": [
      { "id": "normal-profession-3", "implementation": { ... } }
    ]
  }
  ```
  每个条目会整体替换该技能的 `implementation`；`name`/`description`/`category`/`status` 可选覆盖。
- 如果英雄条目本身缺失某个技能，可在补丁条目里提供 `name`、`type`、`description` 来新增；可用 `insertAfter: "<skillId>"` 控制插入位置，否则追加到末尾。
- 不要同时用脚本直接写 `skill-database.json`，否则会和其他组互相覆盖。

## 技能定义结构

参考已完成的同类英雄（推荐模板：`3030601` 莉莉丝、`3030701` 焰舞、`1040301` 伊丽丝）以及：

- 效果类型与枚举：`personal-server/game/effects/effect-types.mjs`
- 效果执行器：`personal-server/game/effects/effect-executor.mjs`
- 触发注册：`personal-server/game/effects/skill-integration.mjs`

每个技能至少应有：

```json
{
  "source": "FightTable.Ability + FightTable.AbilityDes",
  "resolvedAbility": true,
  "resolvedDescription": true,
  "ability": { "tid": 0, "type": 0, "dmg_type": 0, "effect_type": 0, "run_type": 0 },
  "abilityDes": { "tid": 0, "type_des": 0, "show_name": 0, "skill_icon": "", "text": 0, "detail_text": 0 },
  "catalogTypeMatch": true,
  "effectType": "stat-modifier",
  "targetType": "self",
  "energyCost": 0,
  "effects": [ { "target": {"targetType":"self"}, "effect": {...}, "duration": {"durationType":"permanent","rounds":0}, "chance": 1 } ],
  "triggers": [ { "triggerType": "on-round-start", "condition": null, "conditionKey": null, "cooldown": 0, "maxTriggers": 1, "oncePerBattle": true, "oncePerRound": false, "effect": {...}, "priority": 0 } ],
  "requiresInvestigation": false,
  "notes": ""
}
```

规则：

- 保留英雄自己原有的 `ability` / `abilityDes` 元数据，不要整段照抄模板英雄的 tid。克隆共享被动时，按技能 id 在其它英雄里找同 id 的已实现版本，再替换 `ability`/`abilityDes` 为当前英雄技能自身的值。
- 数值来自技能描述时按描述保守取值；无法确认的机制标 `requiresInvestigation: true` 并在 `notes` 写清近似方式。
- `Normal` 普攻必须有 `damage` 效果。
- 持续型增益/减益要有 `triggers` 或非 `instant` 的 `duration`，不能只有一条即时效果。
- `effectType` 与 `effects[0].effect.type` 保持一致；混合效果时 `effectType` 用主效果类型并在 `notes` 说明。
- 不要修改 `personal-server/game/battle-engine.mjs`；战斗引擎接入技能库是既有系统性缺口，本轮记录、不修。

## 验收命令（在 `personal-server/` 下）

```powershell
node scripts/verify-hero-skills.mjs --hero=<heroId>
node --test test/hero-<heroId>-skill-validation.test.mjs
```

两项都通过才算完成。测试至少覆盖：

- 技能数量与技能 id 完整加载；
- 每个特色技能的关键 `effect.type` / `targetType` / 数值；
- 被动触发数量与关键触发效果；
- 普攻含 damage；
- 用 `EffectExecutor` 跑一次 damage/heal/shield/stat-modifier/energy 的代表性调用，确认数值合理。

## 产出

- `personal-server/test/hero-<heroId>-skill-validation.test.mjs`
- `agent/workflow/skill-system-validation/hero-<heroId>-implementation.md`
  - 写清：技能清单、每个技能的实现方式、近似项、`requiresInvestigation` 原因、测试结果。
  - 不要写“全部精确还原”之类无法证明的结论。

## 约束

- 不启动/重启实时服务，不操作模拟器或 ADB，不改 `apk/`。
- 只改分配给你的英雄，避免与其它组冲突。
- 不提交 Git；完成后由主 agent 统一验收。
