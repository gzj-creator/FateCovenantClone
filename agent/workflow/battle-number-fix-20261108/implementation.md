# 4-3、薇尔战斗数值与全技能一致性修复记录

日期：2026-11-08。分支：`fix/attribute-star-quality-20261108`。worktree：`.worktree/gameplay-20261108/fix-attribute-star-quality-20261108`。基线：`main@0d8d9ec`。

## 结论

本轮定位并修复了六个相互放大或掩盖的问题：

1. 4-3 的 `mission 40203` 在 `MissionTable.Section` 中没有敌方列表，`201 req_fight` 因此返回业务码 5，客户端显示“配置出错了”。现在按相邻 4-2 节点 `40202` 的 `9003300 x2` 做本地兼容回退，并保留回退来源供日志审计。
2. 角色属性把客户端中的累计星级行错误地按每档增量循环累加。薇尔（`4030801`）存储 `star=0` 时被归一到 1 星，随后同时叠加了 `StarAddAttr` 的 0、1 两档，生命从 `8,874` 被放大到 `191,797`。敌人又以我方最高生命角色为兼容基线，所以敌兵生命一并从应有的量级放大到 `168,781`。
3. 薇尔 `AbilityLevel` 的星档读取仍把持久化 `star=0` 强转为 `star=1`，导致错误读取 `5001`，而持久化品质也没有进入属性行选择。
4. 薇尔终结技被错误的 metadata fallback `6910001050` 占位为单体魔法伤害；真实技能是 `2403080113`“公主驾到”，应治疗最低生命友方并回能。
5. 战斗与技能执行器仍使用 `attack * multiplier - defense * 0.45` 的减式防御，高防时先变负再被最终 `max(1)` 吞掉，表现为所有攻击伤害恒为 1。
6. NPC 兼容属性原先复制生命最高队员的单人四维，再套给每个敌人，使生命、攻击、防御和速度同时被同一个坦克模板污染。现在改为按全队每个通道分别取均值。

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

同一轮还修正了两处会影响技能等级和属性行的读取：

- `attribute-service.mjs` 的品质选择改为 `overrides.quality ?? hero.quality ?? config.quality`，持久化或导入的角色品质会实际参与 `BaseAttrNew`、`StarAddAttr` 等行选择。
- `hero-skill-loadout.mjs` 不再把持久化 `star=0` 强转为 1；薇尔 quality 50、star 0 现在读取 `AbilityLevel[5000]`，不再误读 `5001`。

薇尔专项期望：

```text
stored star=0 -> displayed star=1
HP=8874, ATK=3321, PDEF=155, MDEF=155, power=42704, speed=113
star sources: [star:0]
stored star=8 -> sources: [star:5, high-star:8]
```

## 敌人数值为何仍带兼容属性

本轮先修正了敌人的连锁放大：敌人兼容基线原先取生命最高队员的单人属性，乘 `0.88` 后复制给所有敌兵。现在 `lineupReferenceStats()` 分别计算全队 `max_hp`、`attack`、`defense`、`speed` 的均值，再应用 `0.88`、`NpcAttrRatio` 和精英倍率。坦克不会再单独决定所有敌人的攻击、速度和防御，单个异常队员的污染范围也从四个通道收紧为一个比例贡献。

严格的原服敌方数值仍无法只靠当前客户端表精确恢复：

- `MissionTable` 只列出敌人角色 TID，例如 `40202 -> [9003300, 9003300]`，没有每个敌方单位的等级和手工属性；
- `FightTable.data` 的 400 段只提供实际随包存在的 `Fight.400`，当前根映射没有 `401` 至 `410`，因此没有 4-3 的 `def_team_lv` 等字段；
- `HeroTable.NpcAttr` 包含大量数值档位，但缺少 FightTable 对具体敌人到属性档位的选择关系，不能安全猜测某个档位；
- `NpcAttrRatio` 不覆盖 `9002100/9002600/9003300` 这些怪物角色。

因此 `mission-fight-service.mjs` 暂时仍使用明确标注的本地兼容规则：全队分通道均值乘 `0.88`，再应用已有的 `NpcAttrRatio` 和精英倍率。它现在不会再继承错误的高星累计属性，也不会把最高生命坦克的四维复制给每个敌人，但敌人数值仍不是原服精确值。

为后续恢复映射，`tools/extract-hero-npcattr.mjs` 从 15 个 LuaJIT 分片提取了 `HeroTableNpcAttr.data.lua.json.gz`。资产包含 10,571 行，字段为 `tid/attr_list/skill_lv/power`，大小 296,349 字节，SHA256 `45C0D0C7AE0AEB2F29459443A7BFE0EBAF89F96C5F3CA3ED43585CB8645A4FC0`。目前仍缺 `Fight403.lineup=76` 到具体 NpcAttr 档位的选择关系，不能据角色 TID 猜档位。

## 伤害公式

`battle-engine.mjs` 的 fallback 普攻和 `effects/effect-executor.mjs` 的 catalog 技能现在共用一个防御减伤函数：

```text
damage * attack / (attack + 0.45 * defense)
```

`ignoreDefense` 只缩减防御项；真实伤害和按生命百分比计算的技能仍绕过防御。该公式是本地兼容规则，用于消除“攻击小于防御就恒为 1”的阈值断裂，尚未证明为原服精确公式。专项测试同时验证低攻攻击高防目标仍会得到大于 1 的有效伤害。

## 薇尔大招

技能库删除了错误占位 `6910001050`，恢复 `2403080113`“公主驾到”：

- 目标为我方最低生命成员；
- 治疗量为施法者攻击力 120%，单次不超过施法者最大生命 90%；
- 同一目标恢复 80 能量；
- 目标属于圣堂阵营（camp 4）时治疗和回能乘 1.5；
- 两个 effect 使用同一 `targetGroup`，避免分别选择后落到不同队员；
- 战报记录 `targetCampMultiplier` 和 `actorMaxHpCap`，便于回放核验。

生产模拟与真实 `201 -> 207` 报告测试均断言：薇尔终结技只治疗友方、不会对敌队造成伤害。

## 全技能描述审计

新增 `tools/audit-skill-descriptions.mjs`，以 `FightTable.AbilityDes.text` 的语言包文本为权威描述，逐英雄比对技能名称、描述和可执行 effect。完整结果保存在忽略目录 `analysis/reports/skill-description-audit.json`。

当前统计：

```text
heroes=76, skillReferences=1076, uniqueSkillIds=522
localizedDescriptions=916, storedDescriptions=93
descriptionSourceMismatches=0
requiresInvestigation=277
errors=23, evidenceGaps=287
```

已从明确的 AbilityDes 元数据修复 23 条记录，跨 19 个英雄；其中 6 条同时修正了 effect：

- `312030174` 改为普攻/绝招后下一次终结技伤害 +15%；
- `312030175`、`333030175`、`333070175` 改为终结技触发、额外造成目标最大生命 3% 的伤害；
- `331020175`、`343010175` 改为自身暴击率 +10%、暴击伤害 +15%。

当前还剩 23 条字段级机制冲突，涉及 17 个技能 ID、16 个英雄：

```text
DAMAGE_DESCRIPTION_WITHOUT_DAMAGE       2
DAMAGE_MULTIPLIER_MISMATCH               2
ENERGY_GAIN_DESCRIPTION_WITHOUT_GAIN    12
ENERGY_LOSS_DESCRIPTION_WITHOUT_LOSS     1
HEAL_DESCRIPTION_WITHOUT_HEAL            5
SHIELD_DESCRIPTION_WITHOUT_SHIELD        1
```

这些冲突集中在当前引擎缺少证据的层级条件、阵营条件、伤害转盾/治疗、已损失生命、死亡/复活和减益层数分支。按项目规则没有添加“看起来合理”的无条件 effect 去强行清零报告；它们保留在审计结果中作为明确缺口。

另有 7 条 AbilityDes 文本复用歧义和 5 条 `show_name` 映射缺口。后者全部属于英雄 `1030701`：其语言描述与技能目录一致，但五个 `show_name` 指向模板名称，因此保留现有名称等待后续提取修复。

## 测试调整

修正后的减伤和均衡敌阵会改变行动轨迹，部分生产链路测试原先硬编码“某角色必定获得第二轮行动并放终结技/追击”。相关测试现在使用能覆盖目标动作的双人生产队伍，并显式提升参与英雄的持久化星级；生命偷取、双重攻击、真实 `201 -> 207` 结算和协议动作流断言均保留。

精英失败测试原先固定使用单个 `5040201`，依赖旧的高生命坦克敌人数值放大。均衡敌阵后单敌不再稳定获胜，测试现使用 6 个 quality-70 `5040401` 作为真实强敌阵容，并由 `simulateBattle` 产生失败结果，没有注入结果。

针对动作流变化的两处普通任务测试也改为验证“实际出手角色”的动作编码，而不再假设四个上阵角色在短战中一定会轮转到。

## 验证

- 受影响 19 个英雄文件：419 项，pass 419 / fail 0。
- 属性、技能门槛、EffectExecutor、技能战斗、任务战斗 7 个核心文件：101 项，pass 101 / fail 0。
- `verify-hero-skills.mjs`：76/76 heroes clean。
- 受影响生产战斗链路 4 个文件：21 项，pass 21 / fail 0。
- 全量 `npm test`：2755 项，pass 2753 / fail 0 / skipped 2，duration 442677.7568 ms。两个跳过项仍是仓库既有的 v9 客户端资源条件测试。日志：`analysis/test-runs/battle-number-fix-20261108-full.log`。
- 全技能审计：76 英雄、1,076 技能引用、522 唯一技能 ID；描述源冲突 0，明确字段级冲突 23。

## 限制与未做项

- 敌人全队均值乘 `0.88` 仍是兼容规则；后续只有取得 FightTable 的 4-3 行或服务器 NpcAttr 选择数据，才能替换成原服精确公式。
- 本地比例减伤公式尚未证明为原服精确公式。
- 17 个技能 ID 的 23 条复杂机制冲突仍未实现，审计报告不会把它们标成已恢复。
- 战力仍使用仓库既有的本地 `POWER_WEIGHTS`，不是已恢复的原服战力公式。

## 运行态复核（2026-11-08 23:06）

- 重启前对实时库执行 SQLite 一致备份，备份文件为 `analysis/experiments/private-server-20261025/p3/battle-number-fix-sqlite-20261108-230212/game.local-only.sqlite`，1,433,600 字节，SHA256 `074FE709066D695799049A4309498BA65B50880C11962912C09271775C3F1C6C`，`PRAGMA integrity_check` 返回 `ok`。
- 旧服务 PID 42156 已停止；main 工作树从 `personal-server/local-server.mjs` 启动新服务 PID 34140，日志为 `server-20261108-230620.local-only.out.log` / `.err.log`。`local_server_ready` 已记录，18880/18881/18882/18883/19090 均由 PID 34140 监听 `127.0.0.1`，错误日志为 0 字节。
- 客户端已重新连接并完成登录，`19090` 上出现新的已建立连接。
- 在 main 上重跑任务、属性、技能装配、技能战斗和战斗引擎专项：47/47 通过；其中明确覆盖 `40203 -> 201`、`207` 结算、薇尔终结技只治疗最低生命友方、低攻对高防不再恒为 1。`verify-hero-skills.mjs` 再次得到 76/76 clean。
- 数据库副本中的薇尔 `4030801` 仍为 `level=1 / star=0 / quality=50`，且位于 1、76、77 号编队；这与属性行和 `AbilityLevel[5000]` 的修复路径一致。
- 全技能审计已在 main 上重跑，结果仍为 76 英雄、1,076 技能引用、522 唯一技能 ID、描述源冲突 0；剩余 23 条错误分布在 17 个技能 ID、16 个英雄：爱蜜莉、伊丽丝、赤霄、冰镰使徒、蜜雪儿、莉莉丝、圣棺裁决、武神蕾娜、命运三姝、汐夜、千千结、夜璃、苏苏、零、烬、奈奈子。它们需要层级/阵营/目标减益层数、已损失生命、伤害转盾或治疗、死亡复活、召唤物等当前未实现机制。
- 本轮没有为验证主动提交一次真实的 4-3 战斗，以免改写正在游玩的关卡进度和资源；201/207 行为由临时测试库和生产服务链路验证。
