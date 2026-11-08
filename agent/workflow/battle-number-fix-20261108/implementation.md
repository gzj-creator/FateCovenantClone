# 4-3 与薇尔战斗数值修复记录

日期：2026-11-08。分支：`fix/4-3-vell-battle-20261108`。worktree：`.worktree/gameplay-20261108/fix-4-3-20261108`。基线：`main@734f019`。

## 结论

本轮定位了两个独立问题：

1. 4-3 的 `mission 40203` 在 `MissionTable.Section` 中没有敌方列表，`201 req_fight` 因此返回业务码 5，客户端显示“配置出错了”。现在按相邻 4-2 节点 `40202` 的 `9003300 x2` 做本地兼容回退，并保留回退来源供日志审计。
2. 角色属性把客户端中的累计星级行错误地按每档增量循环累加。薇尔（`4030801`）存储 `star=0` 时被归一到 1 星，随后同时叠加了 `StarAddAttr` 的 0、1 两档，生命从 `8,874` 被放大到 `191,797`。敌人又以我方最高生命角色为兼容基线，所以敌兵生命一并从应有的量级放大到 `168,781`。

修正后，实时 SQLite 的只读副本中薇尔为 `HP 8,874 / 攻击 3,321 / 双防 155 / 战力 42,704 / 速度 113`；4-3 敌兵生命为 `16,699`，战斗结果为 4 回合胜利。

## 4-3 配置错误

实时日志证据：

```text
2026-11-08T10:22:05.745Z type 201 seq 24 errCode 5
mission_id=40203 fight_tid=403
```

`MissionTable` 中 `40203` 是第四章中 Boss 节点，配置为 `monster_type=1`、`enemy=[]`、`fight=403`。`missionBattleConfig()` 原本只接受非空敌队，因此返回 `Mission enemy configuration missing`。

修改：

- `personal-server/config/mission-tables.mjs` 新增 `40203 -> 40202` 的 `LOCAL_ENEMY_FALLBACKS` 映射。
- `personal-server/test/mission-fight-service.test.mjs` 验证 `201` 成功、敌队为 `9003300 x2`、`207` 前任务游标不推进、`207` 后推进到 `40203`。

这不是原服 FightTable 数据恢复；FightTable 根映射中当前没有 `403` 行，回退会在 `mission_fight_started.enemyFallback` 中明确记录 `sourceMissionId=40202`。

## 薇尔与通用角色属性

客户端证据位于 `analysis/scratchpad/time-temple-20261108/project/` 的 `HeroAttrCollect` LuaJIT 字节码。其属性收集流程会：

- 为界面显示把最低星级归一到至少 1；
- 用 `math.min(5, star)` 选择普通星级属性行；
- 通过 `GetHeroStarAddAttrTid` 只读取当前 `StarAddAttr` 行的累计值；
- 6 星以上另取当前 `HighStarAddAttr` 行。

原服务端则从 0 星循环加到当前星，并继续累加全部低档高星行。`StarAddAttr` 和 `HighStarAddAttr` 的每一行都是当前档位的总值，并非相邻档位增量。

修改 `personal-server/game/attribute-service.mjs` 后：

- 保留 `storedStar` 选择属性行，返回给客户端的 `star` 仍为 `max(1, storedStar)`；
- 普通星级只应用 `StarAddAttr[camp * 10000 + quality * 100 + min(storedStar, 5)]`；
- 6 至 10 星只应用当前 `HighStarAddAttr[heroTid * 100 + storedStar]`；
- 0 星显示为 1 星，但属性读取索引 0，不再叠加索引 1。

薇尔专项期望：

```text
stored star=0 -> displayed star=1
HP=8874, ATK=3321, PDEF=155, MDEF=155, power=42704, speed=113
star sources: [star:0]
stored star=8 -> sources: [star:5, high-star:8]
```

## 敌人数值为何仍带兼容属性

本轮先修正了敌人的连锁放大：敌人兼容基线原本取修正前最大的角色生命并乘 `0.88`，所以薇尔等角色的错误数值会同步污染敌兵。

严格的原服敌方数值仍无法只靠当前客户端表精确恢复：

- `MissionTable` 只列出敌人角色 TID，例如 `40202 -> [9003300, 9003300]`，没有每个敌方单位的等级和手工属性；
- `FightTable.data` 的 400 段只提供实际随包存在的 `Fight.400`，当前根映射没有 `401` 至 `410`，因此没有 4-3 的 `def_team_lv` 等字段；
- `HeroTable.NpcAttr` 包含大量数值档位，但缺少 FightTable 对具体敌人到属性档位的选择关系，不能安全猜测某个档位；
- `NpcAttrRatio` 不覆盖 `9002100/9002600/9003300` 这些怪物角色。

因此 `mission-fight-service.mjs` 暂时仍使用明确标注的本地兼容规则：取我方最高生命单位作参考，以 `0.88` 生成敌方基线，再应用已有的 `NpcAttrRatio` 和精英倍率。它现在不会再继承错误的高星累计属性，但敌人数值仍不是原服精确值。

## 测试调整

修正后的初始角色更弱，部分生产链路测试原先固定假设“某个角色在短战斗中必定获得第二轮行动并放终结技/追击”。相关测试现在显式把 `2010101/2010201` 提升到 6 星，使一条真实 `201 -> 207` 战斗仍能覆盖生命偷取、双重攻击和协议动作流；没有删除这些功能断言。

针对动作流变化的两处普通任务测试也改为验证“实际出手角色”的动作编码，而不再假设四个上阵角色在短战中一定会轮转到。

## 验证

- 专项：6 个文件、46 项，pass 46 / fail 0。
- 实时库只读副本：`40203` 成功创建 403 战斗，薇尔 `8874/3321/155/42704`，敌兵 `16699 HP`，4 回合胜利。
- 全量 `npm test` 首次运行：2750 项，pass 2743 / fail 5；5 项均为修正后战斗轨迹不再产生测试原先硬编码的行动，已按上述方式改为在 6 星生产存档上继续验证。
- 调整后全量 `npm test` 最终运行：2750 项，pass 2748 / fail 0 / skipped 2，duration 450066.8133 ms。两个跳过项仍是仓库既有的 v9 客户端资源条件测试。

## 限制与未做项

- 未启停实时服务、未写实时运行数据库、未操作 APK/模拟器/ADB，因此本轮没有客户端画面或真机 APK 验收。
- 敌人 `0.88` 基线仍是兼容规则；后续只有取得 FightTable 的 4-3 行或服务器 NpcAttr 选择数据，才能替换成原服精确公式。
- 战力仍使用仓库既有的本地 `POWER_WEIGHTS`，不是已恢复的原服战力公式。
